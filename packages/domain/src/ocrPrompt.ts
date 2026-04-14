export const OCR_SYSTEM_PROMPT =
  "You are a receipt parser. Extract financial data from the image and respond ONLY with valid JSON. No markdown, no preamble.";

export const OCR_USER_PROMPT =
  'Extract: { "merchant": "Store", "amount": 12.34, "date": "YYYY-MM-DD", "category": "Food", "description": "Groceries", "confidence": 0.95 } (confidence must be a number between 0.0 and 1.0).';
