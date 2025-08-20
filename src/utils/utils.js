import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
import dayjs from 'dayjs';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

export function formatDate(isoString) {
  return dayjs(isoString).format('DD-MM-YYYY');
}
