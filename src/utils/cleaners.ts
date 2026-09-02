export function toTitleCase(input?: string | null): string {
  if (!input) return '';
  const trimmed = input.trim();
  if (!trimmed) return '';

  return trimmed
    .toLowerCase()
    .replace(/(?:^|[\s\-\'\’])\w/g, (match) => match.toUpperCase())
    .replace(/\b(Llc|Ltd|Uk|Gb|Nhs|Gos|Rx|Sv|Svd|Svn|Pd|Blink|Od|Os|Ou)\b/gi, (match) => match.toUpperCase());
}

export function normalizeDate(dateInput?: string | null): string {
  if (!dateInput) return '';
  const str = dateInput.trim();
  if (!str) return '';

  const ukMatch = str.match(/^(\d{1,2})[\/\-\.](\d{1,2})[\/\-\.](\d{4})$/);
  if (ukMatch) {
    const day = ukMatch[1].padStart(2, '0');
    const month = ukMatch[2].padStart(2, '0');
    const year = ukMatch[3];
    return `${day}/${month}/${year}`;
  }

  const isoMatch = str.match(/^(\d{4})[\/\-\.](\d{1,2})[\/\-\.](\d{1,2})$/);
  if (isoMatch) {
    const year = isoMatch[1];
    const month = isoMatch[2].padStart(2, '0');
    const day = isoMatch[3].padStart(2, '0');
    return `${day}/${month}/${year}`;
  }

  const parsed = new Date(str);
  if (!isNaN(parsed.getTime())) {
    const day = String(parsed.getDate()).padStart(2, '0');
    const month = String(parsed.getMonth() + 1).padStart(2, '0');
    const year = String(parsed.getFullYear());
    return `${day}/${month}/${year}`;
  }

  return str;
}

export function calculateNextExamDate(lastExamDateStr: string, addYears: number = 1): string {
  if (!lastExamDateStr) return '';
  const parts = lastExamDateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      d.setFullYear(d.getFullYear() + addYears);
      const resDay = String(d.getDate()).padStart(2, '0');
      const resMonth = String(d.getMonth() + 1).padStart(2, '0');
      const resYear = String(d.getFullYear());
      return `${resDay}/${resMonth}/${resYear}`;
    }
  }
  return lastExamDateStr;
}

export function addDaysToDate(dateStr: string, days: number): string {
  if (!dateStr) return '';
  const parts = dateStr.split('/');
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    const year = parseInt(parts[2], 10);

    const d = new Date(year, month, day);
    if (!isNaN(d.getTime())) {
      d.setDate(d.getDate() + days);
      const resDay = String(d.getDate()).padStart(2, '0');
      const resMonth = String(d.getMonth() + 1).padStart(2, '0');
      const resYear = String(d.getFullYear());
      return `${resDay}/${resMonth}/${resYear}`;
    }
  }
  return dateStr;
}

export function parseBoolean(value?: string | boolean | number | null): boolean {
  if (value === true || value === 1) return true;
  if (value === false || value === 0 || value === null || value === undefined) return false;

  const str = String(value).trim().toLowerCase();
  if (['yes', 'y', 'true', '1', 't', 'positive', 'seen', 'examined'].includes(str)) {
    return true;
  }
  return false;
}

export function parseFunding(fundingInput?: string | null): 'NHS' | 'Private' {
  if (!fundingInput) return 'NHS';
  const lower = fundingInput.trim().toLowerCase();
  if (lower.includes('priv') || lower.includes('self') || lower.includes('fee')) {
    return 'Private';
  }
  return 'NHS';
}

export const PLACEHOLDER_DOB = '01/01/1906';

export function isPlaceholderDob(dob?: string | null): boolean {
  if (!dob) return true;
  const clean = dob.trim();
  return clean === '01/01/1906' || clean === '1906-01-01' || clean === '01011906';
}

export function formatDobDisplay(dob?: string | null): string {
  if (!dob || isPlaceholderDob(dob)) return '';
  return dob;
}
