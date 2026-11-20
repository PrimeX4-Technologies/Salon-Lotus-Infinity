import type { Address, PricePresentation, ServiceDuration } from "../api/types";

export const formatMoney = (minor: number, currency = "LKR", locale = "en-LK"): string =>
  new Intl.NumberFormat(locale, { style: "currency", currency }).format(minor / 100);

export const formatPrice = (price: PricePresentation, locale = "en-LK"): string => {
  if (price.label) return price.label;
  if (price.mode === "quote_required") return "Price on consultation";
  if (price.mode === "fixed") return formatMoney(price.amountMinor ?? 0, price.currency, locale);
  if (price.mode === "starting_from") return `From ${formatMoney(price.fromAmountMinor ?? 0, price.currency, locale)}`;
  return `${formatMoney(price.fromAmountMinor ?? 0, price.currency, locale)} – ${formatMoney(price.toAmountMinor ?? 0, price.currency, locale)}`;
};

export const durationMinutes = (duration: ServiceDuration): number =>
  duration.applicationMinutes + duration.processingMinutes + duration.finishingMinutes + duration.bufferMinutes;

export const formatDuration = (duration: ServiceDuration): string => {
  const total = durationMinutes(duration);
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  return [hours ? `${hours} hr` : "", minutes ? `${minutes} min` : ""].filter(Boolean).join(" ") || "Flexible";
};

export const formatDateTime = (value: string, timeZone = "Asia/Colombo"): string =>
  new Intl.DateTimeFormat("en-LK", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone,
  }).format(new Date(value));

export const formatTime = (value: string, timeZone = "Asia/Colombo"): string =>
  new Intl.DateTimeFormat("en-LK", { hour: "numeric", minute: "2-digit", timeZone }).format(new Date(value));

export const formatAddress = (address?: Address): string =>
  address ? [address.line1, address.line2, address.city, address.state, address.postalCode].filter(Boolean).join(", ") : "";

export const localDateInput = (date = new Date()): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const futureDate = (days: number): string => {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return localDateInput(date);
};
