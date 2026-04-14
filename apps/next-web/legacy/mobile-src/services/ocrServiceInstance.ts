import NetInfo from '@react-native-community/netinfo';
import { recognizeText } from '@infinitered/react-native-mlkit-text-recognition';

import { OpenAIOcrClient } from './OpenAIOcrClient';
import { OCRScanError, OCRService, type OCRScanInput } from './OCRService';

const extractBestAmount = (text: string) => {
  const withoutCurrency = text.replace(/\b(?:usd|eur|gbp|aud|cad|jpy)\b|[$€£¥]/gi, ' ');
  const normalized = withoutCurrency.replace(/(\d),(?=\d{3}\b)/g, '$1');
  const totalMatch =
    normalized.match(/(?:total|amount due|balance due|grand total)[^\d]*([\d]+(?:\.\d{2})?)/i) ??
    normalized.match(/(?:\b(?:aud|usd|eur|gbp)\b|[$€£])\s*([\d]+(?:\.\d{2})?)/i);
  const value = totalMatch?.[1] ?? normalized.match(/([\d]+(?:\.\d{2})?)/g)?.at(-1) ?? null;
  if (!value) {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
};

const extractBestDate = (text: string) => {
  const isoMatch = text.match(/\b(20\d{2})[-/.](0?[1-9]|1[0-2])[-/.](0?[1-9]|[12]\d|3[01])\b/);
  if (isoMatch) {
    const [, year, month, day] = isoMatch;
    return `${year}-${String(Number(month)).padStart(2, '0')}-${String(Number(day)).padStart(2, '0')}`;
  }

  const slashMatch = text.match(/\b([0-3]?\d)[-/.]([0-3]?\d)[-/.](20\d{2})\b/);
  if (!slashMatch) {
    return null;
  }
  const first = Number(slashMatch[1]);
  const second = Number(slashMatch[2]);
  const year = slashMatch[3];

  // Heuristic for slash dates: day-first only when first value cannot be a month.
  const month = first > 12 ? second : first;
  const day = first > 12 ? first : second > 12 ? first : second;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
};

const detectCategory = (text: string) => {
  const content = text.toLowerCase();
  if (/\bfuel\b|\bpetrol\b|\buber\b|\btrain\b|\btransport\b/.test(content)) return 'Transport';
  if (/\brestaurant\b|\bcafe\b|\bgrocery\b|\bsupermarket\b|\bfood\b/.test(content)) return 'Food';
  if (/\belectric\b|\bwater\b|\butility\b|\binternet\b|\bbill\b/.test(content)) return 'Utilities';
  if (/\bpharmacy\b|\bclinic\b|\bhospital\b|\bhealth\b/.test(content)) return 'Health';
  return 'Other';
};

const firstMeaningfulLine = (text: string) =>
  text
    .split('\n')
    .map((line) => line.trim())
    .find((line) => line.length >= 3 && !/^\d+[.,]?\d*$/.test(line)) ?? '';

const runOfflineMlKitRecognition = async (input: OCRScanInput) => {
  if (input.mimeType === 'application/pdf') {
    throw new OCRScanError('Offline OCR cannot read PDF yet. Use image receipt capture/import.');
  }

  try {
    const result = await recognizeText(input.imageUri);
    const text = result.text?.trim();
    if (!text) {
      return '';
    }

    const merchant = firstMeaningfulLine(text);
    const amount = extractBestAmount(text);
    const date = extractBestDate(text);
    if (!amount || !date) {
      throw new OCRScanError(
        `Offline OCR failed to extract ${!amount && !date ? 'amount and date' : !amount ? 'amount' : 'date'} from text: ${text.slice(0, 200)}`
      );
    }

    const confidence = Math.max(0.6, Math.min(0.95, 0.6 + Math.min(result.blocks.length, 5) * 0.06));

    return JSON.stringify({
      merchant,
      amount,
      date,
      category: detectCategory(text),
      description: merchant ? `Offline OCR: ${merchant}` : 'Offline OCR import',
      confidence: Number(confidence.toFixed(2)),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (/native module|expo go|unimplemented|not available/i.test(message)) {
      throw new OCRScanError('Offline OCR requires development build (not Expo Go). Build app with EAS and retry.');
    }
    throw new OCRScanError(`Offline OCR failed: ${message}`);
  }
};

const hasInternet = async () => {
  const state = await NetInfo.fetch();
  return Boolean(state.isConnected && state.isInternetReachable !== false);
};

const openAIApiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY ?? '';
export const isOpenAIOcrEnabled = openAIApiKey.trim().length > 0;
const openAIClient = isOpenAIOcrEnabled ? new OpenAIOcrClient({ apiKey: openAIApiKey }) : null;

export const ocrService = new OCRService({
  isOnline: async () => {
    // OpenAI OCR path only active when internet is available and key exists.
    return isOpenAIOcrEnabled && (await hasInternet());
  },
  scanWithOpenAI: async (input) => {
    if (!openAIClient) {
      throw new OCRScanError('Missing EXPO_PUBLIC_OPENAI_API_KEY');
    }
    return openAIClient.scanReceipt(input);
  },
  scanWithTesseract: runOfflineMlKitRecognition,
});
