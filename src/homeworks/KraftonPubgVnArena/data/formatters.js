// Created once and reused: Intl formatters are expensive to build.
const VND_FORMATTER = new Intl.NumberFormat('vi-VN', {
  style: 'currency',
  currency: 'VND',
  maximumFractionDigits: 0,
});

/** 1250000 -> "1.250.000 ₫" */
export function formatVnd(amount) {
  if (!Number.isFinite(amount)) {
    throw new TypeError('formatVnd expects a finite number.');
  }

  return VND_FORMATTER.format(amount);
}

const pad = (value) => String(value).padStart(2, '0');

/** 90500 -> "01:31", 3_725_000 -> "1:02:05" (rounded UP to whole seconds). */
export function formatCountdown(ms) {
  const totalSeconds = Math.ceil(Math.max(0, ms) / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return hours > 0
    ? `${hours}:${pad(minutes)}:${pad(seconds)}`
    : `${pad(minutes)}:${pad(seconds)}`;
}
