import { SupportedLanguage } from '../../types';
import { accountLocale } from './accountI18n';

export function formatAccountDate(
  value: string | number | Date | null | undefined,
  lang: SupportedLanguage = 'vi'
): string {
  if (!value) return '—';
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '—';

  const locale = accountLocale(lang);
  const formatter = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  });

  const parts = formatter.formatToParts(date);
  const day = parts.find((p) => p.type === 'day')?.value ?? String(date.getDate()).padStart(2, '0');
  const month = parts.find((p) => p.type === 'month')?.value ?? String(date.getMonth() + 1).padStart(2, '0');
  const year = parts.find((p) => p.type === 'year')?.value ?? String(date.getFullYear());

  return `${day}/${month}/${year}`;
}
