import { OCRScanError, OCRService, type OCRScanInput } from "@smartspend/domain";
import { NextResponse } from "next/server";

import { getServerEnv } from "@/lib/env";
import { scanReceiptWithOpenAI } from "@/lib/server/openai-ocr-client";

const SUPPORTED_IMAGE_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "application/pdf"]);
const MAX_FILE_SIZE_BYTES = 8 * 1024 * 1024;

const scanWithOfflineOcr = async () => {
  throw new OCRScanError("Offline OCR provider is not configured on server");
};

const getSourceFromFileType = (mimeType: string): OCRScanInput["source"] => {
  if (mimeType === "application/pdf") {
    return "pdf";
  }
  return "gallery";
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ error: "Missing file upload payload" }, { status: 400 });
    }
    if (!SUPPORTED_IMAGE_TYPES.has(file.type)) {
      return NextResponse.json({ error: "Unsupported file type. Upload JPEG, PNG, WEBP, or PDF file." }, { status: 400 });
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return NextResponse.json({ error: "File too large. Max supported size is 8MB." }, { status: 400 });
    }

    const input: OCRScanInput = {
      imageUri: file.name,
      mimeType: file.type,
      source: getSourceFromFileType(file.type),
    };

    const fileBytes = await file.arrayBuffer();
    const fileBase64 = Buffer.from(fileBytes).toString("base64");
    const serverEnv = getServerEnv();

    const ocrService = new OCRService({
      isOnline: async () => Boolean(serverEnv.OPENAI_API_KEY),
      scanWithOpenAI: async (scanInput) => scanReceiptWithOpenAI(scanInput, fileBase64),
      scanWithOfflineOcr,
    });

    const result = await ocrService.scan(input);
    return NextResponse.json({ result });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown OCR error";
    const status = /missing|unsupported|invalid|No text detected/i.test(message) ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}
