const BIRTH_DATE_REGEX = /^\d{2}\.\d{2}\.\d{4}$/;

export function isValidBirthDate(input: string): boolean {
  if (!BIRTH_DATE_REGEX.test(input)) {
    return false;
  }

  const [dayRaw, monthRaw, yearRaw] = input.split(".");
  const day = Number(dayRaw);
  const month = Number(monthRaw);
  const year = Number(yearRaw);

  if (year < 1900 || year > new Date().getFullYear()) {
    return false;
  }

  const parsed = new Date(year, month - 1, day);
  const isSameDate =
    parsed.getFullYear() === year &&
    parsed.getMonth() === month - 1 &&
    parsed.getDate() === day;

  return isSameDate;
}

export function isValidPatientName(input: string): boolean {
  const parts = input
    .trim()
    .split(/\s+/)
    .filter(Boolean);

  // Required: at least surname + name. Patronymic is optional.
  if (parts.length < 2) {
    return false;
  }

  return parts.every((part) => part.length >= 2);
}

export function normalizePhone(input: string): string {
  const trimmed = input.trim();
  const hasPlus = trimmed.startsWith("+");
  const digitsOnly = trimmed.replace(/\D/g, "");
  return hasPlus ? `+${digitsOnly}` : digitsOnly;
}

export function isValidPhone(input: string): boolean {
  const normalized = normalizePhone(input);
  const digitsCount = normalized.replace(/\D/g, "").length;
  return digitsCount >= 10 && digitsCount <= 15;
}
