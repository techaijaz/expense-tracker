import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import dayjs from 'dayjs';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(isoString, format = 'DD-MM-YYYY') {
  if (!isoString) return '—';
  return dayjs(isoString).format(format);
}
