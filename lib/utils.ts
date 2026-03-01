const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

export function formatCurrency(amount: number): string {
  const abs = Math.abs(amount);
  if (abs >= 10000000) return `${(amount / 10000000).toFixed(2)}Cr`;
  if (abs >= 100000) return `${(amount / 100000).toFixed(2)}L`;
  return amount.toLocaleString('en-IN', { maximumFractionDigits: 2 });
}

export function formatDate(dateStr: string, timeStr?: string): string {
  const d = parseISODate(dateStr);
  if (!d) return dateStr;
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  let dateLabel: string;
  if (d.toDateString() === today.toDateString()) {
    dateLabel = 'Today';
  } else if (d.toDateString() === yesterday.toDateString()) {
    dateLabel = 'Yesterday';
  } else {
    dateLabel = `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
  }

  if (timeStr) {
    return `${dateLabel}, ${timeStr}`;
  }
  return dateLabel;
}

export function getMonthName(month: number): string {
  return FULL_MONTHS[month];
}

export function getShortMonthName(month: number): string {
  return MONTHS[month];
}

export function isSameMonth(dateStr: string, year: number, month: number): boolean {
  const d = parseISODate(dateStr);
  if (!d) return false;
  return d.getFullYear() === year && d.getMonth() === month;
}

export function parseISODate(dateStr: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(dateStr);
  if (!match) return null;
  const [, y, m, d] = match;
  const year = Number(y);
  const month = Number(m);
  const day = Number(d);

  if (
    !Number.isInteger(year) ||
    !Number.isInteger(month) ||
    !Number.isInteger(day) ||
    month < 1 ||
    month > 12 ||
    day < 1 ||
    day > 31
  ) {
    return null;
  }

  const parsed = new Date(year, month - 1, day);
  if (
    parsed.getFullYear() !== year ||
    parsed.getMonth() !== month - 1 ||
    parsed.getDate() !== day
  ) {
    return null;
  }

  return parsed;
}
