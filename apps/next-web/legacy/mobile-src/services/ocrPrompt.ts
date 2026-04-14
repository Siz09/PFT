export const OCR_SYSTEM_PROMPT =
  'You are a receipt parser. Extract financial data from the image and respond ONLY with valid JSON. No markdown, no preamble.';

export const OCR_USER_PROMPT =
  'Extract: { "merchant": string, "amount": number, "date": "YYYY-MM-DD", "category": string, "description": string, "confidence": 0.0-1.0 }';
