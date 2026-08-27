export function getCareHomeInitials(careHomeName: string): string {
  if (!careHomeName) return 'CH';

  const words = careHomeName
    .replace(/[^\w\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);

  const significantWords = words.filter(
    (w) => !['the', 'and', '&', 'of', 'for', 'in', 'at'].includes(w.toLowerCase())
  );

  const targetWords = significantWords.length > 0 ? significantWords : words;

  let filtered = targetWords;
  if (targetWords.length > 2) {
    const withoutGeneric = targetWords.filter(
      (w) => !['care', 'home', 'house', 'lodge', 'court', 'manor', 'view'].includes(w.toLowerCase())
    );
    if (withoutGeneric.length >= 2) {
      filtered = withoutGeneric;
    }
  }

  const initials = filtered.map((w) => w[0].toUpperCase()).join('');
  return initials.slice(0, 4) || 'CH';
}

export function getPatientInitials(firstName: string, surname: string): string {
  const f = (firstName.trim()[0] || 'P').toUpperCase();
  const s = (surname.trim()[0] || 'X').toUpperCase();
  return `${f}${s}`;
}

export function getCompactDob(dob: string): string {
  const digitsOnly = dob.replace(/\D/g, '');
  if (digitsOnly.length >= 4) {
    return digitsOnly.slice(0, 4);
  }
  return digitsOnly || '0101';
}

export function generateReportRef(
  careHome: string,
  firstName: string,
  surname: string,
  dob: string,
  rowIndex: number = 1
): string {
  const chInitials = getCareHomeInitials(careHome);
  const pInitials = getPatientInitials(firstName, surname);
  const compactDob = getCompactDob(dob);
  const suffix = `OPT${rowIndex}`;

  return `${chInitials}-${pInitials}${compactDob}-${suffix}`;
}

export function generateInvoiceNo(
  careHome: string,
  firstName: string,
  surname: string,
  dob: string,
  rowIndex: number = 1
): string {
  const chInitials = getCareHomeInitials(careHome);
  const pInitials = getPatientInitials(firstName, surname);
  const compactDob = getCompactDob(dob);
  const suffix = `INV${rowIndex}`;

  return `${chInitials}-${pInitials}${compactDob}-${suffix}`;
}
