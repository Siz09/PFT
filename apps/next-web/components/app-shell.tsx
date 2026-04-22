"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

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
type AppSettings = {
  currency: string;
  profileName: string | null;
};
type BudgetStatus = {
  categoryId: string;
  budgetCents: number;
  spentCents: number;
  remainingCents: number;
  ratio: number;
};
type SummaryRow = {
  id: string;
  period_type: "weekly" | "monthly";
  period_start: string;
  period_end: string;
  summary_json: {
    overview: string;
    top_categories: Array<{ category: string; amountCents: number }>;
    anomalies: string[];
    tips: string[];
    savings_rate: number;
  };
  created_at: string;
};
type SummaryDashboardPayload = {
  summaries: SummaryRow[];
  budgetStatus: BudgetStatus[];
  report: {
    month: string;
    incomeCents: number;
    expenseCents: number;
  };
};
type RecurringRule = {
  id: string;
  type: TransactionType;
  amountCents: number;
  categoryId: string;
  merchant: string | null;
  description: string | null;
  frequency: "daily" | "weekly" | "monthly";
  nextDue: string;
  active: boolean;
};

type OCRFields = {
  merchant: string;
  amountCents: number;
  date: string;
  categoryId: string;
  description: string;
  confidence: number;
};
type TransactionDraft = {
  id: string | null;
  type: TransactionType;
  amount: string;
  date: string;
  categoryId: string;
  merchant: string;
  description: string;
};
type TransactionFilters = {
  search: string;
  type: "all" | TransactionType;
  categoryIds: string[];
  fromDate: string;
  toDate: string;
  minAmount: string;
  maxAmount: string;
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

const createCurrencyFormatter = (currencyCode: string) => {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: currencyCode });
  } catch {
    return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
  }
};

const createManualReviewSeed = (defaultCategoryId: string): OCRFields => ({
  merchant: "",
  amountCents: 0,
  date: toDateInputValue(),
  categoryId: defaultCategoryId,
  description: "",
  confidence: 0,
});
const createTransactionDraft = (defaultCategoryId: string): TransactionDraft => ({
  id: null,
  type: "expense",
  amount: "",
  date: toDateInputValue(),
  categoryId: defaultCategoryId,
  merchant: "",
  description: "",
});
const createInitialFilters = (): TransactionFilters => ({
  search: "",
  type: "all",
  categoryIds: [],
  fromDate: "",
  toDate: "",
  minAmount: "",
  maxAmount: "",
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
  const [settings, setSettings] = useState<AppSettings>({ currency: "USD", profileName: null });
  const [transactions, setTransactions] = useState<TransactionRecord[]>([]);
  const [isBootstrapping, setIsBootstrapping] = useState(true);
  const [bootstrapError, setBootstrapError] = useState<string | null>(null);
  const [transactionError, setTransactionError] = useState<string | null>(null);

  const [isOcrLoading, setIsOcrLoading] = useState(false);
  const [ocrError, setOcrError] = useState<string | null>(null);
  const [reviewValues, setReviewValues] = useState<OCRFields | null>(null);
  const [capturedFileName, setCapturedFileName] = useState<string | null>(null);
  const [isSavingTransaction, setIsSavingTransaction] = useState(false);
  const [transactionDraft, setTransactionDraft] = useState<TransactionDraft | null>(null);
  const [isSavingManual, setIsSavingManual] = useState(false);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [filtersDraft, setFiltersDraft] = useState<TransactionFilters>(createInitialFilters());
  const [filtersApplied, setFiltersApplied] = useState<TransactionFilters>(createInitialFilters());
  const [month, setMonth] = useState(toDateInputValue().slice(0, 7));
  const [summaryData, setSummaryData] = useState<SummaryDashboardPayload | null>(null);
  const [summaryError, setSummaryError] = useState<string | null>(null);
  const [isSummaryLoading, setIsSummaryLoading] = useState(false);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [budgetDraft, setBudgetDraft] = useState<{ categoryId: string; amount: string }>({ categoryId: "", amount: "" });
  const [isSavingBudget, setIsSavingBudget] = useState(false);
  const [selectedTransactionIds, setSelectedTransactionIds] = useState<string[]>([]);
  const [bulkPatch, setBulkPatch] = useState<{ categoryId: string; type: "" | TransactionType; date: string }>({
    categoryId: "",
    type: "",
    date: "",
  });
  const [isApplyingBulkEdit, setIsApplyingBulkEdit] = useState(false);
  const [recurringRules, setRecurringRules] = useState<RecurringRule[]>([]);
  const [isLoadingRecurring, setIsLoadingRecurring] = useState(false);
  const [isSavingRecurring, setIsSavingRecurring] = useState(false);
  const [recurringDraft, setRecurringDraft] = useState<{
    type: TransactionType;
    amount: string;
    categoryId: string;
    merchant: string;
    description: string;
    frequency: "daily" | "weekly" | "monthly";
    nextDue: string;
  }>({
    type: "expense",
    amount: "",
    categoryId: "",
    merchant: "",
    description: "",
    frequency: "monthly",
    nextDue: toDateInputValue(),
  });
  const [isRunningRecurringNow, setIsRunningRecurringNow] = useState(false);

  const categoryMap = useMemo(() => new Map(categories.map((item) => [item.id, item])), [categories]);
  const recentTransactions = useMemo(() => transactions.slice(0, 5), [transactions]);
  const numberFormatter = useMemo(() => createCurrencyFormatter(settings.currency), [settings.currency]);
  const summary = useMemo(() => {
    const totals = transactions.reduce(
      (acc, item) => {
        if (item.type === "income") {
          acc.incomeCents += item.amountCents;
        } else {
          acc.expenseCents += item.amountCents;
        }
        return acc;
      },
      { incomeCents: 0, expenseCents: 0 }
    );
    return {
      incomeCents: totals.incomeCents,
      expenseCents: totals.expenseCents,
      balanceCents: totals.incomeCents - totals.expenseCents,
    };
  }, [transactions]);
  const categoryExpenseChartData = useMemo(
    () =>
      [...transactions]
        .filter((item) => item.type === "expense")
        .reduce(
          (acc, item) => {
            const label = item.categoryName ?? categoryMap.get(item.categoryId)?.name ?? item.categoryId;
            acc.set(label, (acc.get(label) ?? 0) + item.amountCents);
            return acc;
          },
          new Map<string, number>()
        ),
    [categoryMap, transactions]
  );

  const toTransactionsQuery = (filters: TransactionFilters) => {
    const searchParams = new URLSearchParams();
    searchParams.set("limit", "200");
    if (filters.search.trim()) searchParams.set("search", filters.search.trim());
    if (filters.type !== "all") searchParams.set("type", filters.type);
    if (filters.categoryIds.length > 0) searchParams.set("categoryIds", filters.categoryIds.join(","));
    if (filters.fromDate) searchParams.set("fromDate", filters.fromDate);
    if (filters.toDate) searchParams.set("toDate", filters.toDate);
    if (filters.minAmount) {
      const parsed = Number(filters.minAmount);
      if (Number.isFinite(parsed) && parsed > 0) {
        searchParams.set("minAmountCents", String(Math.round(parsed * 100)));
      }
    }
    if (filters.maxAmount) {
      const parsed = Number(filters.maxAmount);
      if (Number.isFinite(parsed) && parsed > 0) {
        searchParams.set("maxAmountCents", String(Math.round(parsed * 100)));
      }
    }
    return searchParams.toString();
  };

  const loadTransactions = useCallback(async (filters: TransactionFilters) => {
    const response = await fetch(`/api/transactions?${toTransactionsQuery(filters)}`);
    const payload = (await response.json()) as { transactions?: TransactionRecord[]; error?: string };
    if (!response.ok) {
      throw new Error(payload.error ?? "Failed to load transactions");
    }
    setTransactions(payload.transactions ?? []);
  }, []);

  const loadBootstrap = useCallback(async () => {
    try {
      setBootstrapError(null);
      setIsBootstrapping(true);

      const [categoryResponse, settingsResponse] = await Promise.all([
        fetch("/api/categories"),
        fetch("/api/settings"),
      ]);

      const categoryPayload = (await categoryResponse.json()) as { categories?: Category[]; error?: string };
      const settingsPayload = (await settingsResponse.json()) as {
        settings?: AppSettings;
        error?: string;
      };

      if (!categoryResponse.ok) {
        throw new Error(categoryPayload.error ?? "Failed to load categories");
      }
      if (!settingsResponse.ok) {
        throw new Error(settingsPayload.error ?? "Failed to load settings");
      }

      setCategories(categoryPayload.categories ?? []);
      setSettings(settingsPayload.settings ?? { currency: "USD", profileName: null });
      await loadTransactions(filtersApplied);
    } catch (error) {
      setBootstrapError(error instanceof Error ? error.message : "Bootstrap failed");
    } finally {
      setIsBootstrapping(false);
    }
  }, [filtersApplied, loadTransactions]);

  useEffect(() => void loadBootstrap(), [loadBootstrap]);

  useEffect(() => {
    if (isBootstrapping) {
      return;
    }
    void (async () => {
      try {
        setTransactionError(null);
        await loadTransactions(filtersApplied);
      } catch (error) {
        setTransactionError(error instanceof Error ? error.message : "Failed to load transactions");
      }
    })();
  }, [filtersApplied, isBootstrapping, loadTransactions]);

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

      await loadTransactions(filtersApplied);
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

  const openManualDraft = () => {
    const defaultCategoryId = categories[0]?.id ?? "other";
    setTransactionDraft(createTransactionDraft(defaultCategoryId));
  };

  const beginEditTransaction = (item: TransactionRecord) => {
    setTransactionDraft({
      id: item.id,
      type: item.type,
      amount: (item.amountCents / 100).toFixed(2),
      date: item.date,
      categoryId: item.categoryId,
      merchant: item.merchant ?? "",
      description: item.description ?? "",
    });
    setActiveTab("transactions");
  };

  const saveManualTransaction = async () => {
    if (!transactionDraft) {
      return;
    }
    const parsedAmount = Number(transactionDraft.amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setTransactionError("Amount must be greater than 0.");
      return;
    }
    if (!transactionDraft.categoryId) {
      setTransactionError("Category is required.");
      return;
    }
    if (!transactionDraft.date) {
      setTransactionError("Date is required.");
      return;
    }

    setIsSavingManual(true);
    setTransactionError(null);
    try {
      const payload = {
        amountCents: Math.round(parsedAmount * 100),
        type: transactionDraft.type,
        categoryId: transactionDraft.categoryId,
        merchant: transactionDraft.merchant || null,
        description: transactionDraft.description || null,
        date: transactionDraft.date,
      };
      const isEdit = Boolean(transactionDraft.id);
      const response = await fetch(isEdit ? `/api/transactions/${transactionDraft.id}` : "/api/transactions", {
        method: isEdit ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });
      const body = (await response.json()) as { transaction?: TransactionRecord; error?: string };
      if (!response.ok || !body.transaction) {
        throw new Error(body.error ?? "Failed to save transaction");
      }
      setTransactionDraft(null);
      await loadTransactions(filtersApplied);
      setSelectedTransactionIds([]);
    } catch (error) {
      setTransactionError(error instanceof Error ? error.message : "Failed to save transaction");
    } finally {
      setIsSavingManual(false);
    }
  };

  const deleteTransaction = async (id: string) => {
    setTransactionError(null);
    try {
      const response = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
      const payload = (await response.json()) as { ok?: boolean; error?: string };
      if (!response.ok || !payload.ok) {
        throw new Error(payload.error ?? "Failed to delete transaction");
      }
      await loadTransactions(filtersApplied);
      setSelectedTransactionIds((prev) => prev.filter((itemId) => itemId !== id));
    } catch (error) {
      setTransactionError(error instanceof Error ? error.message : "Failed to delete transaction");
    }
  };

  const deleteSelectedTransactions = async () => {
    if (selectedTransactionIds.length === 0) {
      return;
    }
    setTransactionError(null);
    try {
      const response = await fetch("/api/transactions/bulk", {
        method: "DELETE",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ ids: selectedTransactionIds }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Bulk delete failed");
      }
      setSelectedTransactionIds([]);
      await loadTransactions(filtersApplied);
    } catch (error) {
      setTransactionError(error instanceof Error ? error.message : "Bulk delete failed");
    }
  };

  const applyBulkEdit = async () => {
    if (selectedTransactionIds.length === 0) {
      return;
    }
    if (!bulkPatch.categoryId && !bulkPatch.type && !bulkPatch.date) {
      setTransactionError("Pick at least one field for bulk edit.");
      return;
    }
    setIsApplyingBulkEdit(true);
    setTransactionError(null);
    try {
      const response = await fetch("/api/transactions/bulk", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          ids: selectedTransactionIds,
          categoryId: bulkPatch.categoryId || undefined,
          type: bulkPatch.type || undefined,
          date: bulkPatch.date || undefined,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Bulk edit failed");
      }
      setSelectedTransactionIds([]);
      setBulkPatch({ categoryId: "", type: "", date: "" });
      await loadTransactions(filtersApplied);
    } catch (error) {
      setTransactionError(error instanceof Error ? error.message : "Bulk edit failed");
    } finally {
      setIsApplyingBulkEdit(false);
    }
  };

  const loadRecurringRules = useCallback(async () => {
    setIsLoadingRecurring(true);
    setTransactionError(null);
    try {
      const response = await fetch("/api/recurring");
      const payload = (await response.json()) as { recurringRules?: RecurringRule[]; error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load recurring rules");
      }
      setRecurringRules(payload.recurringRules ?? []);
    } catch (error) {
      setTransactionError(error instanceof Error ? error.message : "Failed to load recurring rules");
    } finally {
      setIsLoadingRecurring(false);
    }
  }, []);

  const saveRecurringRule = async () => {
    const parsedAmount = Number(recurringDraft.amount);
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setTransactionError("Recurring amount must be greater than 0.");
      return;
    }
    if (!recurringDraft.categoryId) {
      setTransactionError("Recurring category required.");
      return;
    }
    setIsSavingRecurring(true);
    setTransactionError(null);
    try {
      const response = await fetch("/api/recurring", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          type: recurringDraft.type,
          amountCents: Math.round(parsedAmount * 100),
          categoryId: recurringDraft.categoryId,
          merchant: recurringDraft.merchant || null,
          description: recurringDraft.description || null,
          frequency: recurringDraft.frequency,
          nextDue: recurringDraft.nextDue,
          active: true,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to save recurring rule");
      }
      setRecurringDraft({
        type: "expense",
        amount: "",
        categoryId: "",
        merchant: "",
        description: "",
        frequency: "monthly",
        nextDue: toDateInputValue(),
      });
      await loadRecurringRules();
    } catch (error) {
      setTransactionError(error instanceof Error ? error.message : "Failed to save recurring rule");
    } finally {
      setIsSavingRecurring(false);
    }
  };

  const runRecurringNow = async () => {
    setIsRunningRecurringNow(true);
    setTransactionError(null);
    try {
      const response = await fetch("/api/recurring/run", { method: "POST" });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed running recurring job");
      }
      await Promise.all([loadRecurringRules(), loadTransactions(filtersApplied)]);
    } catch (error) {
      setTransactionError(error instanceof Error ? error.message : "Failed running recurring job");
    } finally {
      setIsRunningRecurringNow(false);
    }
  };

  const saveSettings = async () => {
    setIsSavingSettings(true);
    setBootstrapError(null);
    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(settings),
      });
      const payload = (await response.json()) as { settings?: AppSettings; error?: string };
      if (!response.ok || !payload.settings) {
        throw new Error(payload.error ?? "Failed to save settings");
      }
      setSettings(payload.settings);
    } catch (error) {
      setBootstrapError(error instanceof Error ? error.message : "Failed to save settings");
    } finally {
      setIsSavingSettings(false);
    }
  };

  const loadSummaryData = useCallback(async () => {
    setIsSummaryLoading(true);
    setSummaryError(null);
    try {
      const response = await fetch(`/api/summaries?month=${month}`);
      const payload = (await response.json()) as SummaryDashboardPayload & { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to load summary dashboard");
      }
      setSummaryData(payload);
    } catch (error) {
      setSummaryError(error instanceof Error ? error.message : "Failed to load summary dashboard");
    } finally {
      setIsSummaryLoading(false);
    }
  }, [month]);

  useEffect(() => {
    if (isBootstrapping) {
      return;
    }
    if (activeTab === "budget" || activeTab === "stats") {
      void loadSummaryData();
    }
    if (activeTab === "transactions") {
      void loadRecurringRules();
    }
  }, [activeTab, isBootstrapping, loadRecurringRules, loadSummaryData]);

  const saveBudget = async () => {
    if (!budgetDraft.categoryId) {
      setSummaryError("Select category for budget.");
      return;
    }
    const amountValue = Number(budgetDraft.amount);
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      setSummaryError("Budget amount must be greater than 0.");
      return;
    }
    setIsSavingBudget(true);
    setSummaryError(null);
    try {
      const response = await fetch("/api/budgets", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          categoryId: budgetDraft.categoryId,
          month,
          amountCents: Math.round(amountValue * 100),
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to save budget");
      }
      setBudgetDraft({ categoryId: "", amount: "" });
      await loadSummaryData();
    } catch (error) {
      setSummaryError(error instanceof Error ? error.message : "Failed to save budget");
    } finally {
      setIsSavingBudget(false);
    }
  };

  const generateSummary = async (period: "weekly" | "monthly") => {
    setIsGeneratingSummary(true);
    setSummaryError(null);
    try {
      const response = await fetch("/api/summaries", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          period,
          referenceDate: `${month}-01`,
        }),
      });
      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Failed to generate summary");
      }
      await loadSummaryData();
    } catch (error) {
      setSummaryError(error instanceof Error ? error.message : "Failed to generate summary");
    } finally {
      setIsGeneratingSummary(false);
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
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-neutral-200 p-3">
              <p className="text-xs text-neutral-500">Income</p>
              <p className="text-lg font-semibold text-green-700">{numberFormatter.format(summary.incomeCents / 100)}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 p-3">
              <p className="text-xs text-neutral-500">Expense</p>
              <p className="text-lg font-semibold text-red-700">{numberFormatter.format(summary.expenseCents / 100)}</p>
            </div>
            <div className="rounded-xl border border-neutral-200 p-3">
              <p className="text-xs text-neutral-500">Net</p>
              <p className="text-lg font-semibold text-neutral-900">{numberFormatter.format(summary.balanceCents / 100)}</p>
            </div>
          </div>
          {recentTransactions.length === 0 ? (
            <p className="text-sm text-neutral-500">No transactions yet. Add one in Transactions or scan receipt in Scan tab.</p>
          ) : (
            recentTransactions.map((item) => (
              <div key={item.id} className="rounded-xl border border-neutral-200 p-3">
                <p className="text-sm font-semibold text-neutral-900">{item.merchant || "Unknown merchant"}</p>
                <p className="text-xs text-neutral-500">{item.date}</p>
                <p className="mt-1 text-sm text-neutral-700">{numberFormatter.format(item.amountCents / 100)}</p>
              </div>
            ))
          )}
        </div>
      );
    }

    if (activeTab === "transactions") {
      return (
        <div className="space-y-4">
          <div className="rounded-xl border border-neutral-200 p-3">
            <p className="mb-2 text-sm font-semibold text-neutral-900">Filters</p>
            <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              <input
                value={filtersDraft.search}
                onChange={(event) => setFiltersDraft((prev) => ({ ...prev, search: event.target.value }))}
                placeholder="Search merchant/description"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
              <select
                value={filtersDraft.type}
                onChange={(event) => setFiltersDraft((prev) => ({ ...prev, type: event.target.value as TransactionFilters["type"] }))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="all">All types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <select
                value={filtersDraft.categoryIds}
                onChange={(event) =>
                  setFiltersDraft((prev) => ({
                    ...prev,
                    categoryIds: Array.from(event.target.selectedOptions).map((option) => option.value),
                  }))
                }
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                multiple
              >
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <input
                type="date"
                value={filtersDraft.fromDate}
                onChange={(event) => setFiltersDraft((prev) => ({ ...prev, fromDate: event.target.value }))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
              <input
                type="date"
                value={filtersDraft.toDate}
                onChange={(event) => setFiltersDraft((prev) => ({ ...prev, toDate: event.target.value }))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
              <input
                value={filtersDraft.minAmount}
                onChange={(event) => setFiltersDraft((prev) => ({ ...prev, minAmount: event.target.value }))}
                placeholder="Min amount"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
              <input
                value={filtersDraft.maxAmount}
                onChange={(event) => setFiltersDraft((prev) => ({ ...prev, maxAmount: event.target.value }))}
                placeholder="Max amount"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setFiltersApplied(filtersDraft)}
                  className="rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white"
                >
                  Apply
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const reset = createInitialFilters();
                    setFiltersDraft(reset);
                    setFiltersApplied(reset);
                  }}
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
                >
                  Reset
                </button>
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-neutral-900">Manual transaction</p>
              {!transactionDraft ? (
                <button
                  type="button"
                  onClick={openManualDraft}
                  className="rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white"
                >
                  Add transaction
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setTransactionDraft(null)}
                  className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
                >
                  Cancel
                </button>
              )}
            </div>
            {transactionDraft ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <select
                  value={transactionDraft.type}
                  onChange={(event) => setTransactionDraft((prev) => (prev ? { ...prev, type: event.target.value as TransactionType } : prev))}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
                <input
                  value={transactionDraft.amount}
                  onChange={(event) => setTransactionDraft((prev) => (prev ? { ...prev, amount: event.target.value } : prev))}
                  placeholder="Amount"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                />
                <input
                  type="date"
                  value={transactionDraft.date}
                  onChange={(event) => setTransactionDraft((prev) => (prev ? { ...prev, date: event.target.value } : prev))}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                />
                <select
                  value={transactionDraft.categoryId}
                  onChange={(event) => setTransactionDraft((prev) => (prev ? { ...prev, categoryId: event.target.value } : prev))}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
                >
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                <input
                  value={transactionDraft.merchant}
                  onChange={(event) => setTransactionDraft((prev) => (prev ? { ...prev, merchant: event.target.value } : prev))}
                  placeholder="Merchant"
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm sm:col-span-2"
                />
                <textarea
                  value={transactionDraft.description}
                  onChange={(event) => setTransactionDraft((prev) => (prev ? { ...prev, description: event.target.value } : prev))}
                  placeholder="Description"
                  className="min-h-20 w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm sm:col-span-2"
                />
                <button
                  type="button"
                  onClick={() => void saveManualTransaction()}
                  disabled={isSavingManual}
                  className="rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white disabled:opacity-60 sm:col-span-2"
                >
                  {isSavingManual ? "Saving..." : transactionDraft.id ? "Update transaction" : "Save transaction"}
                </button>
              </div>
            ) : null}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => {
                if (selectedTransactionIds.length === transactions.length) {
                  setSelectedTransactionIds([]);
                } else {
                  setSelectedTransactionIds(transactions.map((item) => item.id));
                }
              }}
              className="rounded-lg border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
            >
              {selectedTransactionIds.length === transactions.length ? "Unselect all" : "Select all"}
            </button>
            <button
              type="button"
              onClick={() => void deleteSelectedTransactions()}
              disabled={selectedTransactionIds.length === 0}
              className="rounded-lg border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50 disabled:opacity-50"
            >
              Delete selected ({selectedTransactionIds.length})
            </button>
          </div>

          <div className="rounded-xl border border-neutral-200 p-3">
            <p className="mb-2 text-sm font-semibold text-neutral-900">Bulk edit selected</p>
            <div className="grid gap-2 sm:grid-cols-4">
              <select
                aria-label="Bulk edit category"
                value={bulkPatch.categoryId}
                onChange={(event) => setBulkPatch((prev) => ({ ...prev, categoryId: event.target.value }))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="">No category change</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="Bulk edit transaction type"
                value={bulkPatch.type}
                onChange={(event) => setBulkPatch((prev) => ({ ...prev, type: event.target.value as "" | TransactionType }))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="">No type change</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
              <input
                aria-label="Bulk edit date"
                type="date"
                value={bulkPatch.date}
                onChange={(event) => setBulkPatch((prev) => ({ ...prev, date: event.target.value }))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => void applyBulkEdit()}
                disabled={selectedTransactionIds.length === 0 || isApplyingBulkEdit}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
              >
                {isApplyingBulkEdit ? "Applying..." : "Apply bulk edit"}
              </button>
            </div>
          </div>

          {transactionError ? <p className="text-xs text-red-600">{transactionError}</p> : null}

          {transactions.length === 0 ? (
            <p className="text-sm text-neutral-500">No saved transactions yet.</p>
          ) : (
            transactions.map((item) => (
              <div key={item.id} className="rounded-xl border border-neutral-200 p-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedTransactionIds.includes(item.id)}
                      onChange={(event) => {
                        setSelectedTransactionIds((prev) => {
                          if (event.target.checked) {
                            return [...prev, item.id];
                          }
                          return prev.filter((value) => value !== item.id);
                        });
                      }}
                      className="h-4 w-4"
                    />
                    <p className="text-sm font-semibold text-neutral-900">{item.merchant || "Unknown merchant"}</p>
                  </div>
                  <p className="text-sm font-semibold text-neutral-900">{numberFormatter.format(item.amountCents / 100)}</p>
                </div>
                <p className="mt-1 text-xs text-neutral-500">
                  {item.date} · {item.type} · {item.categoryName ?? categoryMap.get(item.categoryId)?.name ?? item.categoryId}
                </p>
                <div className="mt-2 flex gap-2">
                  <button
                    type="button"
                    onClick={() => beginEditTransaction(item)}
                    className="rounded-lg border border-neutral-300 px-3 py-1 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => void deleteTransaction(item.id)}
                    className="rounded-lg border border-red-300 px-3 py-1 text-xs font-semibold text-red-700 hover:bg-red-50"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))
          )}

          <div className="rounded-xl border border-neutral-200 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-sm font-semibold text-neutral-900">Recurring rules</p>
              <button
                type="button"
                onClick={() => void runRecurringNow()}
                disabled={isRunningRecurringNow}
                className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 disabled:opacity-50"
              >
                {isRunningRecurringNow ? "Running..." : "Run due recurring now"}
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-3">
              <select
                aria-label="Recurring transaction type"
                value={recurringDraft.type}
                onChange={(event) => setRecurringDraft((prev) => ({ ...prev, type: event.target.value as TransactionType }))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="expense">Expense</option>
                <option value="income">Income</option>
              </select>
              <input
                aria-label="Recurring amount"
                value={recurringDraft.amount}
                onChange={(event) => setRecurringDraft((prev) => ({ ...prev, amount: event.target.value }))}
                placeholder="Amount"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
              <select
                aria-label="Recurring category"
                value={recurringDraft.categoryId}
                onChange={(event) => setRecurringDraft((prev) => ({ ...prev, categoryId: event.target.value }))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="">Select category</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <select
                aria-label="Recurring frequency"
                value={recurringDraft.frequency}
                onChange={(event) =>
                  setRecurringDraft((prev) => ({ ...prev, frequency: event.target.value as "daily" | "weekly" | "monthly" }))
                }
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </select>
              <input
                aria-label="Recurring next due date"
                type="date"
                value={recurringDraft.nextDue}
                onChange={(event) => setRecurringDraft((prev) => ({ ...prev, nextDue: event.target.value }))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => void saveRecurringRule()}
                disabled={isSavingRecurring}
                className="rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
              >
                {isSavingRecurring ? "Saving..." : "Add recurring rule"}
              </button>
            </div>
            {isLoadingRecurring ? <p className="mt-2 text-xs text-neutral-500">Loading recurring rules...</p> : null}
            {!isLoadingRecurring && recurringRules.length === 0 ? (
              <p className="mt-2 text-xs text-neutral-500">No recurring rules yet.</p>
            ) : null}
            <ul className="mt-2 space-y-1 text-xs text-neutral-600">
              {recurringRules.map((rule) => (
                <li key={rule.id}>
                  {rule.frequency} | {rule.type} | {numberFormatter.format(rule.amountCents / 100)} | next {rule.nextDue}
                </li>
              ))}
            </ul>
          </div>
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

    if (activeTab === "settings") {
      return (
        <div className="space-y-4">
          <p className="text-sm text-neutral-600">Settings saved in Supabase `app_settings`.</p>
          <input
            value={settings.profileName ?? ""}
            onChange={(event) => setSettings((prev) => ({ ...prev, profileName: event.target.value || null }))}
            placeholder="Profile name"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
          />
          <input
            value={settings.currency}
            onChange={(event) => setSettings((prev) => ({ ...prev, currency: event.target.value.toUpperCase() }))}
            placeholder="Currency (USD)"
            className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            maxLength={3}
          />
          <button
            type="button"
            onClick={() => void saveSettings()}
            disabled={isSavingSettings}
            className="rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {isSavingSettings ? "Saving..." : "Save settings"}
          </button>
        </div>
      );
    }

    if (activeTab === "budget") {
      return (
        <div className="space-y-4">
          <div className="grid gap-2 sm:grid-cols-[200px_1fr]">
            <label className="text-xs font-semibold uppercase tracking-wide text-neutral-500">Month</label>
            <input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
          </div>
          <div className="rounded-xl border border-neutral-200 p-3">
            <p className="mb-2 text-sm font-semibold text-neutral-900">Add / update category budget</p>
            <div className="grid gap-2 sm:grid-cols-3">
              <select
                value={budgetDraft.categoryId}
                onChange={(event) => setBudgetDraft((prev) => ({ ...prev, categoryId: event.target.value }))}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              >
                <option value="">Select category</option>
                {categories
                  .filter((category) => category.id !== "income")
                  .map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
              </select>
              <input
                value={budgetDraft.amount}
                onChange={(event) => setBudgetDraft((prev) => ({ ...prev, amount: event.target.value }))}
                placeholder="Budget amount"
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={() => void saveBudget()}
                disabled={isSavingBudget}
                className="rounded-lg bg-black px-3 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {isSavingBudget ? "Saving..." : "Save budget"}
              </button>
            </div>
          </div>

          {summaryError ? <p className="text-xs text-red-600">{summaryError}</p> : null}
          {isSummaryLoading ? <p className="text-sm text-neutral-500">Loading budget status...</p> : null}
          {!isSummaryLoading && (summaryData?.budgetStatus.length ?? 0) === 0 ? (
            <p className="text-sm text-neutral-500">No budgets set for selected month.</p>
          ) : null}
          {summaryData?.budgetStatus.map((status) => {
            const categoryName = categoryMap.get(status.categoryId)?.name ?? status.categoryId;
            return (
              <div key={status.categoryId} className="rounded-xl border border-neutral-200 p-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold text-neutral-900">{categoryName}</p>
                  <p className="text-sm text-neutral-700">
                    {numberFormatter.format(status.spentCents / 100)} / {numberFormatter.format(status.budgetCents / 100)}
                  </p>
                </div>
                <div className="mt-2 h-2 w-full rounded-full bg-neutral-200">
                  <div
                    className={`h-2 rounded-full ${status.ratio < 0.6 ? "bg-green-500" : status.ratio < 0.9 ? "bg-amber-500" : "bg-red-500"}`}
                    style={{ width: `${Math.min(Math.round(status.ratio * 100), 100)}%` }}
                  />
                </div>
                <p className="mt-2 text-xs text-neutral-500">Remaining: {numberFormatter.format(status.remainingCents / 100)}</p>
              </div>
            );
          })}
        </div>
      );
    }

    if (activeTab === "stats") {
      return (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="month"
              value={month}
              onChange={(event) => setMonth(event.target.value)}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-sm"
            />
            <button
              type="button"
              onClick={() => void generateSummary("weekly")}
              disabled={isGeneratingSummary}
              className="rounded-lg bg-black px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"
            >
              {isGeneratingSummary ? "Generating..." : "Generate weekly summary"}
            </button>
            <button
              type="button"
              onClick={() => void generateSummary("monthly")}
              disabled={isGeneratingSummary}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100 disabled:opacity-60"
            >
              Generate monthly summary
            </button>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-neutral-200 p-3">
              <p className="text-xs text-neutral-500">Income ({summaryData?.report.month ?? month})</p>
              <p className="text-lg font-semibold text-green-700">
                {numberFormatter.format(((summaryData?.report.incomeCents ?? 0) as number) / 100)}
              </p>
            </div>
            <div className="rounded-xl border border-neutral-200 p-3">
              <p className="text-xs text-neutral-500">Expense ({summaryData?.report.month ?? month})</p>
              <p className="text-lg font-semibold text-red-700">
                {numberFormatter.format(((summaryData?.report.expenseCents ?? 0) as number) / 100)}
              </p>
            </div>
          </div>

          <div className="rounded-xl border border-neutral-200 p-3">
            <p className="mb-2 text-sm font-semibold text-neutral-900">Spending by category</p>
            {[...categoryExpenseChartData.entries()].length === 0 ? (
              <p className="text-xs text-neutral-500">No expense data for chart.</p>
            ) : (
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={[...categoryExpenseChartData.entries()].map(([name, value]) => ({
                      name,
                      amount: Math.round((value / 100) * 100) / 100,
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="amount" fill="#4f81bd" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <a
              href={`/api/export?format=csv&fromDate=${month}-01&toDate=${month}-31&limit=1000`}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
            >
              Export CSV
            </a>
            <a
              href={`/api/export?format=json&fromDate=${month}-01&toDate=${month}-31&limit=1000`}
              className="rounded-lg border border-neutral-300 px-3 py-2 text-xs font-semibold text-neutral-700 hover:bg-neutral-100"
            >
              Export JSON
            </a>
          </div>

          {summaryError ? <p className="text-xs text-red-600">{summaryError}</p> : null}
          {isSummaryLoading ? <p className="text-sm text-neutral-500">Loading summaries...</p> : null}
          {!isSummaryLoading && (summaryData?.summaries.length ?? 0) === 0 ? (
            <p className="text-sm text-neutral-500">No summaries yet. Generate one for this month.</p>
          ) : null}
          {summaryData?.summaries.map((summaryRow) => (
            <div key={summaryRow.id} className="rounded-xl border border-neutral-200 p-3">
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold text-neutral-900">
                  {summaryRow.period_type.toUpperCase()} {summaryRow.period_start} to {summaryRow.period_end}
                </p>
                <p className="text-xs text-neutral-500">{new Date(summaryRow.created_at).toLocaleString()}</p>
              </div>
              <p className="mt-2 text-sm text-neutral-700">{summaryRow.summary_json.overview}</p>
              <ul className="mt-2 space-y-1 text-xs text-neutral-600">
                {summaryRow.summary_json.tips.map((tip, index) => (
                  <li key={`${summaryRow.id}-tip-${index}`}>{index + 1}. {tip}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      );
    }

    return <p className="text-sm text-neutral-600">Screen scaffold ready. Feature slice in progress.</p>;
  };

  return (
    <div className="min-h-screen bg-neutral-50">
      <main className="mx-auto flex w-full max-w-5xl flex-col gap-6 px-4 pb-28 pt-8 md:px-8 md:pt-10">
        <header className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-sm">
          <p className="text-sm font-medium text-neutral-500">SmartSpend Web</p>
          <h1 className="mt-1 text-3xl font-semibold text-neutral-900">Web-First Migration</h1>
          <p className="mt-2 text-sm text-neutral-600">
            Next.js + Supabase shell active. Manual transaction CRUD, scan flow, dashboard summary, and settings are integrated.
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
