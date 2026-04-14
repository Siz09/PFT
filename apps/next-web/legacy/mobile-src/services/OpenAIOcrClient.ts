import * as FileSystem from 'expo-file-system/legacy';

import type { OCRScanInput } from './OCRService';
import { OCRScanError } from './OCRService';
import { OCR_SYSTEM_PROMPT, OCR_USER_PROMPT } from './ocrPrompt';

type OpenAIClientOptions = {
  apiKey: string;
  model?: string;
  timeoutMs?: number;
  maxRetries?: number;
};

type OpenAIChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const OPENAI_CHAT_COMPLETIONS_URL = 'https://api.openai.com/v1/chat/completions';

const MIME_TYPE_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

const inferMimeType = (uri: string, fallback: string) => {
  if (fallback) {
    return fallback;
  }
  const ext = uri.split('.').pop()?.toLowerCase();
  return ext ? MIME_TYPE_BY_EXTENSION[ext] ?? 'image/jpeg' : 'image/jpeg';
};

const toBase64 = async (uri: string) => {
  if (!FileSystem.readAsStringAsync || !FileSystem.EncodingType) {
    throw new OCRScanError('File system base64 conversion unavailable on this platform');
  }
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
};

export class OpenAIOcrClient {
  private readonly model: string;
  private readonly timeoutMs: number;
  private readonly maxRetries: number;

  constructor(private readonly options: OpenAIClientOptions) {
    this.model = options.model ?? 'gpt-4.1-mini';
    this.timeoutMs = options.timeoutMs ?? 10_000;
    this.maxRetries = options.maxRetries ?? 2;
  }

  async scanReceipt(input: OCRScanInput): Promise<string> {
    const mediaType = inferMimeType(input.imageUri, input.mimeType);
    if (mediaType === 'application/pdf' || input.source === 'pdf') {
      throw new OCRScanError('PDF OCR is not supported in the current OpenAI client path');
    }

    const imageBase64 = await toBase64(input.imageUri);
    const imageUrl = `data:${mediaType};base64,${imageBase64}`;

    const payload = {
      model: this.model,
      temperature: 0,
      messages: [
        { role: 'system', content: OCR_SYSTEM_PROMPT },
        {
          role: 'user',
          content: [
            { type: 'text', text: OCR_USER_PROMPT },
            { type: 'image_url', image_url: { url: imageUrl } },
          ],
        },
      ],
    };

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= this.maxRetries; attempt += 1) {
      try {
        const response = await this.post(payload);
        const content = response.choices?.[0]?.message?.content?.trim();
        if (!content) {
          throw new OCRScanError('OpenAI returned empty OCR payload');
        }
        return content;
      } catch (error) {
        lastError = error instanceof Error ? error : new Error('Unknown OpenAI OCR error');
        if (attempt === this.maxRetries) {
          break;
        }
      }
    }

    throw new OCRScanError(`OpenAI OCR failed after retries: ${lastError?.message ?? 'Unknown error'}`);
  }

  private async post(payload: object): Promise<OpenAIChatCompletionResponse> {
    const controller = new AbortController();
    const timeoutHandle = setTimeout(() => controller.abort(), this.timeoutMs);

    try {
      const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
        method: 'POST',
        headers: {
          'content-type': 'application/json',
          authorization: `Bearer ${this.options.apiKey}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const body = await response.text();
        throw new OCRScanError(`OpenAI OCR request failed (${response.status}): ${body}`);
      }

      return (await response.json()) as OpenAIChatCompletionResponse;
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw new OCRScanError(`OpenAI OCR timed out after ${this.timeoutMs}ms`);
      }
      throw error;
    } finally {
      clearTimeout(timeoutHandle);
    }
  }
}
