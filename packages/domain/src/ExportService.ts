import type { TransactionRecord } from "./finance";

const toCsvCell = (value: string | number | null) => {
  const text = value === null ? "" : String(value);
  if (/[",\n]/.test(text)) {
    return `"${text.replace(/"/g, '""')}"`;
  }
  return text;
};

export class ExportService {
  toCsv(transactions: TransactionRecord[]) {
    const header = ["id", "date", "type", "categoryId", "categoryName", "merchant", "description", "amountCents", "ocrConfidence"];
    const rows = transactions.map((tx) => [
      tx.id,
      tx.date,
      tx.type,
      tx.categoryId,
      tx.categoryName ?? "",
      tx.merchant ?? "",
      tx.description ?? "",
      tx.amountCents,
      tx.ocrConfidence ?? "",
    ]);
    return [header, ...rows].map((row) => row.map((cell) => toCsvCell(cell as string | number | null)).join(",")).join("\n");
  }

  toJson(transactions: TransactionRecord[]) {
    return JSON.stringify(transactions, null, 2);
  }
}
