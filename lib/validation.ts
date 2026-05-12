export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
export const HEX_COLOR_REGEX = /^#[0-9a-fA-F]{6}$/;
export const PHONE_REGEX = /^\+?[0-9\s().-]{8,20}$/;

export function cleanString(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

export function cleanOptionalString(value: unknown) {
  const cleaned = cleanString(value);
  return cleaned || null;
}

export function isValidEmail(value: string) {
  return EMAIL_REGEX.test(value);
}

export function isValidPhone(value: string) {
  return PHONE_REGEX.test(value);
}

export function isValidHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

export function isValidDateOnly(value: string) {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T12:00:00`);
  return !Number.isNaN(date.getTime()) && value === date.toISOString().slice(0, 10);
}

export function normalizePrice(value: unknown) {
  const price = Number(value ?? 0);
  if (!Number.isFinite(price)) return null;
  return Math.round(price);
}

export function cleanStringList(value: unknown) {
  return Array.isArray(value)
    ? value.map((item) => cleanString(item)).filter(Boolean).slice(0, 30)
    : [];
}
