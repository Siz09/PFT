export type OCRProvider = "openai" | "mlkit";

export type OCRScanInput = {
  imageUri: string;
  mimeType: string;
  source: "camera" | "gallery" | "pdf";
};

export type OCRExtractedFields = {
  merchant: string;
  amountCents: number;
  date: string;
  categoryId: string;
  description: string;
  confidence: number;
};

export type OCRScanResult = {
  provider: OCRProvider;
  fields: OCRExtractedFields;
  lowConfidence: boolean;
};

export class OCRScanError extends Error {}
export class OCRParsingError extends Error {}

type OCRPorts = {
  isOnline: () => Promise<boolean>;
  scanWithOpenAI: (input: OCRScanInput) => Promise<string>;
  scanWithOfflineOcr: (input: OCRScanInput) => Promise<string>;
};

type RawOcrPayload = {
  merchant?: unknown;
  amount?: unknown;
  date?: unknown;
  category?: unknown;
  description?: unknown;
  confidence?: unknown;
};

const CONFIDENCE_THRESHOLD = 0.75;
const DEFAULT_CATEGORY = "Other";

const CATEGORY_MAP: Record<string, string> = {
  food: "Food",
  groceries: "Food",
  grocery: "Food",
  restaurant: "Food",
  transport: "Transport",
  travel: "Transport",
  fuel: "Transport",
  health: "Health",
  medical: "Health",
  pharmacy: "Health",
  utilities: "Utilities",
  bills: "Utilities",
  entertainment: "Entertainment",
  shopping: "Shopping",
};

const normalizeWhitespace = (value: string) => value.replace(/\s+/g, " ").trim();

const isIsoDate = (value: string) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return false;
  }
  const [yearText, monthText, dayText] = value.split("-");
  const year = Number(yearText);
  const month = Number(monthText);
  const day = Number(dayText);
  const parsed = new Date(year, month - 1, day);
  return parsed.getFullYear() === year && parsed.getMonth() + 1 === month && parsed.getDate() === day;
};

const parseJsonObject = (rawText: string): RawOcrPayload => {
  const text = rawText.trim();
  if (!text) {
    throw new OCRScanError("No text detected in receipt image");
  }

  let jsonCandidate = text;
  if (!text.startsWith("{") || !text.endsWith("}")) {
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1 || end === -1 || start >= end) {
      throw new OCRParsingError("OCR response is not valid JSON");
    }
    jsonCandidate = text.slice(start, end + 1);
  }

  try {
    return JSON.parse(jsonCandidate) as RawOcrPayload;
  } catch {
    throw new OCRParsingError("OCR response is not valid JSON");
  }
};

const clampConfidence = (value: number) => {
  const rounded = Math.round((value + Number.EPSILON) * 100) / 100;
  return Math.max(0, Math.min(1, rounded));
};

export const calculateConfidenceScore = (fields: OCRExtractedFields): number => {
  const modelConfidence = clampConfidence(fields.confidence);
  const completenessBits = [
    fields.merchant.length > 0,
    fields.amountCents > 0,
    isIsoDate(fields.date),
    fields.categoryId.length > 0,
    fields.description.length > 0,
  ];
  const completeness = completenessBits.filter(Boolean).length / completenessBits.length;

  if (completeness === 1) {
    return modelConfidence;
  }

  return clampConfidence(modelConfidence * 0.3 + completeness * 0.7);
};

const normalizeCategory = (value: string) => {
  const key = value.trim().toLowerCase();
  return CATEGORY_MAP[key] ?? (value.trim() || DEFAULT_CATEGORY);
};

export const parseOcrJson = (rawText: string): OCRExtractedFields => {
  const parsed = parseJsonObject(rawText);

  const merchant = typeof parsed.merchant === "string" ? normalizeWhitespace(parsed.merchant) : "";
  const description = typeof parsed.description === "string" ? normalizeWhitespace(parsed.description) : "";
  const categoryRaw = typeof parsed.category === "string" ? parsed.category : "";
  const categoryId = normalizeCategory(categoryRaw);
  const amount = typeof parsed.amount === "number" ? parsed.amount : Number(parsed.amount);
  const amountCents = Number.isFinite(amount) ? Math.round(amount * 100) : Number.NaN;
  const date = typeof parsed.date === "string" ? parsed.date.trim() : "";
  const confidenceRaw = typeof parsed.confidence === "number" ? parsed.confidence : Number(parsed.confidence);
  const confidence = Number.isFinite(confidenceRaw) ? clampConfidence(confidenceRaw) : 0;

  if (!isIsoDate(date)) {
    throw new OCRParsingError("OCR returned invalid date");
  }
  if (!Number.isInteger(amountCents) || amountCents <= 0) {
    throw new OCRParsingError("OCR returned invalid amount");
  }

  const fields: OCRExtractedFields = {
    merchant,
    amountCents,
    date,
    categoryId,
    description,
    confidence,
  };

  return {
    ...fields,
    confidence: calculateConfidenceScore(fields),
  };
};

export class OCRService {
  constructor(private readonly ports: OCRPorts) {}

  async scan(input: OCRScanInput): Promise<OCRScanResult> {
    const online = await this.ports.isOnline();

    if (online) {
      const rawOpenAIResponse = await this.ports.scanWithOpenAI(input);
      const fields = parseOcrJson(rawOpenAIResponse);
      return {
        provider: "openai",
        fields,
        lowConfidence: fields.confidence < CONFIDENCE_THRESHOLD,
      };
    }

    const rawOfflineResponse = await this.ports.scanWithOfflineOcr(input);
    const fields = parseOcrJson(rawOfflineResponse);

    return {
      provider: "mlkit",
      fields,
      lowConfidence: fields.confidence < CONFIDENCE_THRESHOLD,
    };
  }
}
