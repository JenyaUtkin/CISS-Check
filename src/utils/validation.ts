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
