/**
 * Safely parse any date string or Date object from backend APIs.
 * Handles standard ISO strings, SQL timestamps ('YYYY-MM-DD HH:mm:ss'), and Unix timestamps.
 */
export function parseApiDate(dateInput: string | number | Date | null | undefined): Date | null {
  if (!dateInput) return null;

  if (dateInput instanceof Date) {
    return isNaN(dateInput.getTime()) ? null : dateInput;
  }

  if (typeof dateInput === 'number') {
    const d = new Date(dateInput);
    return isNaN(d.getTime()) ? null : d;
  }

  let str = String(dateInput).trim();
  if (!str) return null;

  // Replace SQL space format 'YYYY-MM-DD HH:mm:ss' to ISO 'YYYY-MM-DDTHH:mm:ss'
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(str)) {
    str = str.replace(' ', 'T');
  }

  const d = new Date(str);
  return isNaN(d.getTime()) ? null : d;
}

/**
 * Formats a date into a human-friendly format in the user's local timezone.
 * e.g. "Aug 17, 2026, 8:30 AM"
 */
export function formatOrderDate(
  dateInput: string | number | Date | null | undefined,
  includeRelative = false,
): string {
  const d = parseApiDate(dateInput);
  if (!d) return '';

  const datePart = new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).format(d);

  const timePart = new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(d);

  const formatted = `${datePart}, ${timePart}`;

  if (!includeRelative) {
    return formatted;
  }

  const diffMs = Date.now() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHours = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHours / 24);

  let relative = '';
  if (diffSec < 60 && diffSec >= -10) {
    relative = 'Just now';
  } else if (diffMin < 60 && diffMin >= 0) {
    relative = `${Math.max(1, diffMin)}m ago`;
  } else if (diffHours < 24 && diffHours >= 0) {
    relative = `${diffHours}h ago`;
  } else if (diffDays < 7 && diffDays >= 0) {
    relative = `${diffDays}d ago`;
  }

  return relative ? `${formatted} (${relative})` : formatted;
}
