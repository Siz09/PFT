import { OCRScanError, type OCRScanInput, OCR_SYSTEM_PROMPT, OCR_USER_PROMPT } from "@smartspend/domain";

import { getServerEnv } from "@/lib/env";

type OpenAIChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";

export const scanReceiptWithOpenAI = async (input: OCRScanInput, fileBase64: string) => {
  const env = getServerEnv();
  if (!env.OPENAI_API_KEY) {
    throw new OCRScanError("Missing OPENAI_API_KEY");
  }

  const imageUrl = `data:${input.mimeType};base64,${fileBase64}`;
  const payload = {
    model: "gpt-4o-mini",
    temperature: 0,
    messages: [
      { role: "system", content: OCR_SYSTEM_PROMPT },
      {
        role: "user",
        content: [
          { type: "text", text: OCR_USER_PROMPT },
          { type: "image_url", image_url: { url: imageUrl } },
        ],
      },
    ],
  };

  const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new OCRScanError(`OpenAI OCR request failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as OpenAIChatCompletionResponse;
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new OCRScanError("OpenAI returned empty OCR payload");
  }
  return content;
};
