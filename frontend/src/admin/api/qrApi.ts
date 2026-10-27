import { adminClient } from './adminClient';
import type {
  QrAudioStats,
  QrLoginSessionPage,
  QrLoginStats,
  QrStatsRangeInfo,
} from '../types/qr';

export type QrRangeKey = 'today' | '7d' | '30d';

export interface QrRangeParams {
  from: string;
  to: string;
  bucket: 'day' | 'hour';
}

export interface QrPeriod {
  current: QrRangeParams;
  previous: QrRangeParams;
}

function pad(value: number): string {
  return String(value).padStart(2, '0');
}

export function toDateInput(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

function shiftDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setDate(next.getDate() + days);
  return next;
}

export function buildPeriod(range: QrRangeKey, today = new Date()): QrPeriod {
  const days = range === 'today' ? 1 : range === '30d' ? 30 : 7;
  const end = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  const start = shiftDays(end, -(days - 1));
  const previousEnd = shiftDays(start, -1);
  const previousStart = shiftDays(previousEnd, -(days - 1));

  return {
    current: {
      from: toDateInput(start),
      to: toDateInput(end),
      bucket: range === 'today' ? 'hour' : 'day',
    },
    previous: {
      from: toDateInput(previousStart),
      to: toDateInput(previousEnd),
      bucket: range === 'today' ? 'hour' : 'day',
    },
  };
}

export function periodFromRangeInfo(
  range: QrStatsRangeInfo | null | undefined,
  fallback: QrRangeParams
): QrRangeParams {
  if (!range?.from || !range?.to) return fallback;
  return {
    from: range.from,
    to: range.to,
    bucket: range.bucket === 'hour' ? 'hour' : 'day',
  };
}

export async function fetchLoginStats(params: QrRangeParams): Promise<QrLoginStats> {
  const response = await adminClient.get<QrLoginStats>('/api/auth/admin/qr/stats', { params });
  return response.data;
}

export async function fetchAudioStats(params: QrRangeParams): Promise<QrAudioStats> {
  const response = await adminClient.get<QrAudioStats>('/api/analytics/admin/qr/stats', { params });
  return response.data;
}

export async function fetchLoginSessions(
  params: QrRangeParams,
  options: { page?: number; size?: number; status?: string } = {}
): Promise<QrLoginSessionPage> {
  const response = await adminClient.get<QrLoginSessionPage>('/api/auth/admin/qr/sessions', {
    params: {
      from: params.from,
      to: params.to,
      page: options.page ?? 0,
      size: options.size ?? 20,
      ...(options.status ? { status: options.status } : {}),
    },
  });
  return response.data;
}

export async function fetchLoginStatsWithPrevious(period: QrPeriod): Promise<{
  current: QrLoginStats;
  previous: QrLoginStats | null;
}> {
  const [current, previous] = await Promise.all([
    fetchLoginStats(period.current),
    fetchLoginStats(period.previous).catch(() => null),
  ]);
  return { current, previous };
}

export async function fetchAudioStatsWithPrevious(period: QrPeriod): Promise<{
  current: QrAudioStats;
  previous: QrAudioStats | null;
}> {
  const [current, previous] = await Promise.all([
    fetchAudioStats(period.current),
    fetchAudioStats(period.previous).catch(() => null),
  ]);
  return { current, previous };
}
