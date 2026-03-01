export type ParsedSmsType = 'income' | 'expense';

export interface ParsedSmsTransaction {
  type: ParsedSmsType;
  amount: number;
  notes: string;
  categoryHint: 'food' | 'transport' | 'bills' | 'shopping' | 'health' | 'salary' | 'other';
}

const AMOUNT_PATTERNS = [
  /(?:rs\.?|inr|₹)\s*([0-9,]+(?:\.\d{1,2})?)/i,
  /(?:debited|credited|spent|received)\s*(?:with|for|by)?\s*([0-9,]+(?:\.\d{1,2})?)/i,
];

function parseAmount(text: string): number | null {
  for (const pattern of AMOUNT_PATTERNS) {
    const match = text.match(pattern);
    if (!match?.[1]) continue;
    const amount = Number(match[1].replace(/,/g, ''));
    if (Number.isFinite(amount) && amount > 0) return amount;
  }
  return null;
}

function detectType(text: string): ParsedSmsType | null {
  const lower = text.toLowerCase();
  if (/(credited|received|salary|refund|cashback)/i.test(lower)) return 'income';
  if (/(debited|spent|purchase|withdrawn|dr\.|paid|upi\/dr)/i.test(lower)) return 'expense';
  return null;
}

function detectCategoryHint(text: string): ParsedSmsTransaction['categoryHint'] {
  const lower = text.toLowerCase();
  if (/(salary|payroll)/.test(lower)) return 'salary';
  if (/(zomato|swiggy|restaurant|cafe|food)/.test(lower)) return 'food';
  if (/(uber|ola|metro|fuel|petrol|diesel|transport|bus|train)/.test(lower)) return 'transport';
  if (/(electricity|water bill|gas bill|broadband|recharge|utility|bill)/.test(lower)) return 'bills';
  if (/(amazon|flipkart|myntra|shopping|mall)/.test(lower)) return 'shopping';
  if (/(pharmacy|hospital|medical|health)/.test(lower)) return 'health';
  return 'other';
}

export function parseSmsLine(line: string): ParsedSmsTransaction | null {
  const trimmed = line.trim();
  if (!trimmed) return null;

  const amount = parseAmount(trimmed);
  const type = detectType(trimmed);
  if (!amount || !type) return null;

  return {
    type,
    amount,
    notes: trimmed.slice(0, 120),
    categoryHint: detectCategoryHint(trimmed),
  };
}

export function parseBulkSms(raw: string): ParsedSmsTransaction[] {
  return raw
    .split(/\n+/)
    .map(parseSmsLine)
    .filter((item): item is ParsedSmsTransaction => !!item);
}
