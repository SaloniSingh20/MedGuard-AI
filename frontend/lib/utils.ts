import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date): string {
  return new Date(date).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export function formatPercent(val: number, decimals = 1): string {
  return `${Number(val).toFixed(decimals)}%`;
}

export function getStatusColor(status: string): string {
  const s = status.toLowerCase();
  if (s === 'authentic') return 'text-green-700';
  if (s === 'counterfeit') return 'text-red-700';
  return 'text-amber-700';
}

export function getStatusBg(status: string): string {
  const s = status.toLowerCase();
  if (s === 'authentic') return 'bg-green-50 text-green-800 border-green-200';
  if (s === 'counterfeit') return 'bg-red-50 text-red-800 border-red-200';
  return 'bg-amber-50 text-amber-800 border-amber-200';
}

export function getSeverityBg(severity: string): string {
  const s = severity.toLowerCase();
  if (s === 'critical') return 'bg-red-50 text-red-800 border-red-200';
  if (s === 'high') return 'bg-orange-50 text-orange-800 border-orange-200';
  return 'bg-yellow-50 text-yellow-800 border-yellow-200';
}

export function truncate(str: string, n: number): string {
  return str.length > n ? str.slice(0, n) + '…' : str;
}
