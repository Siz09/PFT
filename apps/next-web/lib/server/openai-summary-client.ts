import type { SummaryModelResponse, SummaryPayload } from "@smartspend/domain";

import { getServerEnv } from "@/lib/env";

type OpenAIChatCompletionResponse = {
  choices?: Array<{
    message?: {
      content?: string;
    };
  }>;
};

const OPENAI_CHAT_COMPLETIONS_URL = "https://api.openai.com/v1/chat/completions";

const SUMMARY_SYSTEM_PROMPT =
  "You are a personal finance analyst. Return valid JSON only with keys: overview (string), top_categories (array of {category, amountCents}), anomalies (array of strings), tips (array of strings), savings_rate (number 0..1).";

const buildSummaryUserPrompt = (payload: SummaryPayload) =>
  `Generate ${payload.period} summary for range ${payload.startDate}..${payload.endDate}. Input JSON:\n${JSON.stringify(payload)}`;

export const generateOpenAISummary = async (payload: SummaryPayload): Promise<SummaryModelResponse> => {
  const env = getServerEnv();
  if (!env.OPENAI_API_KEY) {
    throw new Error("Missing OPENAI_API_KEY");
  }

  const response = await fetch(OPENAI_CHAT_COMPLETIONS_URL, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${env.OPENAI_API_KEY}`,
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      temperature: 0.2,
      messages: [
        { role: "system", content: SUMMARY_SYSTEM_PROMPT },
        { role: "user", content: buildSummaryUserPrompt(payload) },
      ],
    }),
  });

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`OpenAI summary request failed (${response.status}): ${body}`);
  }

  const data = (await response.json()) as OpenAIChatCompletionResponse;
  const content = data.choices?.[0]?.message?.content?.trim();
  if (!content) {
    throw new Error("OpenAI returned empty summary payload");
  }

  const parsed = JSON.parse(content) as SummaryModelResponse;
  if (typeof parsed.overview !== "string" || !Array.isArray(parsed.tips) || !Array.isArray(parsed.anomalies)) {
    throw new Error("OpenAI summary payload missing required fields");
  }
  return {
    overview: parsed.overview,
    top_categories: Array.isArray(parsed.top_categories) ? parsed.top_categories : [],
    anomalies: parsed.anomalies,
    tips: parsed.tips,
    savings_rate: typeof parsed.savings_rate === "number" ? parsed.savings_rate : 0,
  };
};
