"use client";

import { useEffect, useMemo, useState } from "react";

type TransactionType = "income" | "expense";
type Category = { id: string; name: string; color: string };
type TransactionRecord = {
  id: string;
  amountCents: number;
  type: TransactionType;
  categoryId: string;
  categoryName?: string | null;
  merchant: string | null;
  description: string | null;
  date: string;
  ocrConfidence: number | null;
};

type OCRFields = {
  merchant: string;
  amountCents: number;
  date: string;
  categoryId: string;
  description: string;
  confidence: number;
};

type AppTab = "home" | "transactions" | "scan" | "budget" | "stats" | "settings";

const tabs: Array<{ id: AppTab; label: string }> = [
  { id: "home", label: "Home" },
  { id: "transactions", label: "Transactions" },
  { id: "scan", label: "Scan" },
  { id: "budget", label: "Budget" },
  { id: "stats", label: "Stats" },
  { id: "settings", label: "Settings" },
];

const toDateInputValue = () => new Date().toISOString().slice(0, 10);

const currency = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });

const createManualReviewSeed = (defaultCategoryId: string): OCRFields => ({
  merchant: "",
  amountCents: 0,
  date: toDateInputValue(),
  categoryId: defaultCategoryId,
  description: "",
  confidence: 0,
});

const toUserFacingOcrError = (message: string) => {
  if (/No text detected/i.test(message)) {
    return "No text detected. Try a clearer image with better lighting.";
  }
  if (/Unsupported file type/i.test(message)) {
    return "Unsupported file format. Use JPEG, PNG, or WEBP receipt image.";
  }
  if (/Missing OPENAI_API_KEY/i.test(message)) {
    return "OpenAI key missing on server. OCR unavailable until server env is configured.";
  }
  if (/OpenAI OCR request failed \(401\)/i.test(message)) {
    return "OpenAI rejected credentials (401). Verify API key and retry.";
  }
  if (/OpenAI OCR request failed \(429\)/i.test(message)) {
    return "OpenAI rate-limit or billing issue (429). Check usage and retry.";
  }
  if (/Offline OCR provider is not configured/i.test(message)) {
    return "Offline OCR provider unavailable in current web runtime. Fill receipt manually.";
  }
  if (/Failed to fetch|NetworkError|network/i.test(message)) {
    return "Network error during OCR request. Check connection and retry.";
  }
  return message;
};

const compressReceiptImage = async (file: File): Promise<File> => {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  let bitmap: ImageBitmap | null = null;
  try {
    bitmap = await createImageBitmap(file);
    const maxSide = Math.max(bitmap.width, bitmap.height);
    const scale = maxSide > 1024 ? 1024 / maxSide : 1;
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;

    const context = canvas.getContext("2d");
    if (!context) {
      throw new Error("Unable to compress image in browser");
    }

    context.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob>((resolve, reject) => {
      canvas.toBlob(
        (encoded) => {
          if (!encoded) {
            reject(new Error("Image encoding failed"));
            return;
          }
          resolve(encoded);
        },
        "image/jpeg",
        0.85
      );
    });

    const baseName = file.name.replace(/\.[a-zA-Z0-9]+$/, "");
    return new File([blob], `${baseName || "receipt"}-compressed.jpg`, { type: "image/jpeg" });
  } catch {
    return file;
  } finally {
    bitmap?.close();
  }
};

export function AppShell() {
  const [activeTab, setActiveTab] = useState<AppTab>("home");
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);

  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [reviewValues, setReviewValues] = useState<OCRFields | null>(null);
  const [capturedFileName, setCapturedFileName] = useState<string | null>(null);
  const [isSavingTransaction, setIsSavingTransaction] = useState(false);

  const categoryMap = useMemo(() => new Map(categories.map((item) => [item.id, item])), [categories]);
  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);

  const loadBootstrap = async () => {
    try {
      setBootstrapError(null);
      setIsBootstrapping(true);

      const [categoryResponse, transactionResponse] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/transactions?limit=50"),
      ]);

      const categoryPayload = (await categoryResponse.json()) as { categories?: Category[]; error?: string };
      const transactionPayload = (await transactionResponse.json()) as {
        transactions?: TransactionRecord[];
        error?: string;
      };

      if (!categoryResponse.ok) {
        throw new Error(categoryPayload.error ?? "Failed to load categories");
      }
      if (!transactionResponse.ok) {
        throw new Error(transactionPayload.error ?? "Failed to load transactions");
      }

      setCategories(categoryPayload.categories ?? []);
      setTransactions(transactionPayload.transactions ?? []);
    } catch (error) {
      setBootstrapError(error instanceof Error ? error.message : "Bootstrap failed");
    } finally {
      setIsBootstrapping(false);
    }
  };

  useEffect(() => {
    void loadBootstrap();
  }, []);

  const runOcr = async (file: File) => {
    setIsOcrLoading(true);
    setOcrError(null);
    setCapturedFileName(file.name);

    try {
      const compressedFile = await compressReceiptImage(file);
      const formData = new FormData();
      formData.append("file", compressedFile);

      const response = await fetch("/api/ocr", {
        method: "POST",
        body: formData,
      });
      const payload = (await response.json()) as {
        result?: { fields: OCRFields; lowConfidence: boolean };
        error?: string;
      };
      if (!response.ok || !payload.result) {
        throw new Error(payload.error ?? "OCR failed");
      }

      setReviewValues(payload.result.fields);
      if (payload.result.lowConfidence) {
        setOcrError("Low confidence OCR. Review all fields before saving.");
      }
    } catch (error) {
      const fallbackCategoryId = categories[0]?.id ?? "other";
      setReviewValues(createManualReviewSeed(fallbackCategoryId));
      const message = error instanceof Error ? error.message : "OCR request failed";
      setOcrError(toUserFacingOcrError(message));
    } finally {
      setIsOcrLoading(false);
    }
  };

  const saveReviewedTransaction = async () => {
    if (!reviewValues) {
      return;
    }

    setIsSavingTransaction(true);
    try {
      const response = await fetch("/api/transactions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          amountCents: reviewValues.amountCents,
          type: "expense",
          categoryId: reviewValues.categoryId || "other",
          merchant: reviewValues.merchant || null,
          description: reviewValues.description || null,
          date: reviewValues.date || toDateInputValue(),
          ocrConfidence: reviewValues.confidence,
          receiptPath: capturedFileName,
        }),
      });

      const payload = (await response.json()) as { transaction?: TransactionRecord; error?: string };
      if (!response.ok || !payload.transaction) {
        throw new Error(payload.error ?? "Failed to save transaction");
      }

      setTransactions((previous) => [payload.transaction!, ...previous]);
      setReviewValues(null);
      setCapturedFileName(null);
      setOcrError(null);
      setActiveTab("transactions");
    } catch (error) {
      setOcrError(error instanceof Error ? error.message : "Save failed");
    } finally {
      setIsSavingTransaction(false);
    }
  };

  const renderTabContent = () => {
    if (isBootstrapping) {
      return <p className="text-sm text-neutral-600">Loading workspace data...</p>;
    }
    if (bootstrapError) {
      return (
        <div className="space-y-3">
          <p className="text-sm text-red-600">{bootstrapError}</p>
          <button
            type="button"
            onClick={() => void loadBootstrap()}
            className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
          >
            Retry bootstrap
          </button>
        </div>
      );
    }

    if (activeTab === "home") {
      return (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">Recent transactions and scan pipeline status.</p>
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-neutral-500">No transactions yet. Scan a receipt in the Scan tab.</p>
          ) : (
            recentTransactions.map((item) => (
              <div key={item.id} className="rounded-xl border border-neutral-200 p-3">
                <p className="text-sm font-semibold text-neutral-900">{item.merchant || "Unknown merchant"}</p>
                <p className="text-xs text-neutral-500">{item.date}</p>
                <p className="mt-1 text-sm text-neutral-700">{currency.format(item.amountCents / 100)}</p>
              </div>
            ))
          )}
        </div>
      );
    }

    if (activeTab === "transactions") {
      return (
        <div className="space-y-3">
          {transactions.length === 0 ? (
            <p className="text-sm text-neutral-500">No saved transactions yet.</p>
          ) : (
            transactions.map((item) => (
              <div key={item.id} className="rounded-xl border border-neutral-200 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-neutral-900">{item.merchant || "Unknown merchant"}</p>
                  <p className="text-sm font-semibold text-neutral-900">{currency.format(item.amountCents / 100)}</p>
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  {item.date} · {item.categoryName ?? categoryMap.get(item.categoryId)?.name ?? item.categoryId}
                </p>
              </div>
            ))
          )}
        </div>
      );
    }

    if (activeTab === "scan") {
      return (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">Capture/upload receipt image and review extracted fields.</p>
          <label className="flex cursor-pointer items-center justify-center rounded-xl border border-dashed border-neutral-300 px-4 py-6 text-sm font-medium text-neutral-700 hover:bg-neutral-100">
            <input
              type="file"
              accept="image/png,image/jpeg,image/webp"
              capture="environment"
              className="hidden"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file) {
                  void runOcr(file);
                }
                event.currentTarget.value = "";
              }}
            />
            {isOcrLoading ? "Running OCR..." : "Choose receipt image"}
          </label>

          {ocrError ? <p className="text-xs text-red-600">{ocrError}</p> : null}

          {reviewValues ? (
            <div className="space-y-3 rounded-xl border border-neutral-200 p-4">
              <p className="text-sm font-semibold text-neutral-900">OCR review</p>
              <p className="text-xs text-neutral-500">
                Confidence: {(reviewValues.confidence * 100).toFixed(0)}%{capturedFileName ? ` · ${capturedFileName}` : ""}
              </p>
              <input
                value={reviewValues.merchant}
                onChange={(event) => setReviewValues((prev) => (prev ? { ...prev, merchant: event.target.value } : prev))}
                placeholder="Merchant"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
              <input
                value={String((reviewValues.amountCents / 100).toFixed(2))}
                onChange={(event) => {
                  const parsed = Number(event.target.value);
                  setReviewValues((prev) => {
                    if (!prev || !Number.isFinite(parsed)) {
                      return prev;
                    }
                    return { ...prev, amountCents: Math.round(parsed * 100) };
                  });
                }}
                placeholder="Amount"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
              <input
                value={reviewValues.date}
                onChange={(event) => setReviewValues((prev) => (prev ? { ...prev, date: event.target.value } : prev))}
                placeholder="YYYY-MM-DD"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
              <select
                value={reviewValues.categoryId}
                onChange={(event) => setReviewValues((prev) => (prev ? { ...prev, categoryId: event.target.value } : prev))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <textarea
                value={reviewValues.description}
                onChange={(event) => setReviewValues((prev) => (prev ? { ...prev, description: event.target.value } : prev))}
                placeholder="Description"
                className="min-h-20 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => void saveReviewedTransaction()}
                disabled={isSavingTransaction}
                className="w-full rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSavingTransaction ? "Saving..." : "Save transaction"}
              </button>
            </div>
          ) : null}
        </div>
      );
    }

    return <p className="text-sm text-neutral-600">Screen scaffold ready. Domain and APIs are in place for next feature slice.</p>;
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-28 pt-8 md:px-8 md:pt-10">
        <header className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-neutral-500">SmartSpend Web</p>
          <h1 className="mt-1 text-3xl font-semibold text-neutral-900">Web-First Migration</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Next.js + Supabase scaffold active. This shell mirrors core navigation while Phase 2 OCR features are wired.
          </p>
        </header>

        <section className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-neutral-900">{tabs.find((tab) => tab.id === activeTab)?.label}</h2>
          <div className="mt-3">{renderTabContent()}</div>
        </section>
      </main>

      <nav className="fixed inset-x-0 bottom-0 border-t border-neutral-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-2 px-2 py-2 md:px-8">
          {tabs.map((tab) => {
            const active = tab.id === activeTab;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={`flex-1 rounded-xl px-3 py-2 text-xs font-semibold transition ${
                  active ? "bg-black text-white" : "text-neutral-600 hover:bg-neutral-100"
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
