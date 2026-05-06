import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import dayjs from 'dayjs';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(date, format = 'DD-MM-YYYY') {
  if (!date) return '—';
  const d = dayjs(date);
  if (!d.isValid()) return '—';
  return d.format(format);
}
