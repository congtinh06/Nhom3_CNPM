import { useState, useEffect, useRef, useCallback } from 'react';
import { NewsListDomain, NewsDetail, NewsItem } from '../types/domain';
import { adaptNewsListResponse, adaptNewsDetail } from './adapters';
import { thirteenNewsArticles, fourNewsArticles, sampleAnnouncement } from '../content/newsFixtures';

export { getArticles, getArticleBySlug } from '../services/articleService';
import { getArticles, getArticleBySlug } from '../services/articleService';

export interface FetchNewsListParams {
  category?: string;
  limit?: number;
  offset?: number;
  lang?: string;
  signal?: AbortSignal;
}

/**
 * Low-level API caller for news list.
 * Powered by the shared data layer (getArticles).
 */
export async function fetchNewsList(params: FetchNewsListParams = {}): Promise<NewsListDomain> {
  // Check if test environment requested 4-item test fixture
  const useSmallFixture =
    (typeof window !== 'undefined' && (window as unknown as { __TEST_USE_4_ARTICLES?: boolean }).__TEST_USE_4_ARTICLES) ||
    (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('fixture') === '4');

  if (useSmallFixture) {
    let filtered = [...fourNewsArticles];
    if (params.category && params.category !== 'all') {
      filtered = filtered.filter((a) => a.category === params.category);
    }
    if (params.limit && params.limit > 0) {
      filtered = filtered.slice(0, params.limit);
    }
    return adaptNewsListResponse({
      items: filtered,
      announcement: sampleAnnouncement,
    });
  }

  // Use the shared data layer getArticles function
  const res = await getArticles({
    category: params.category && params.category !== 'all' ? params.category : undefined,
    limit: params.limit,
    offset: params.offset,
    signal: params.signal,
  });

  return {
    items: res.items,
    announcement: res.announcement || sampleAnnouncement,
  };
}

/**
 * Low-level API caller for single news detail.
 */
export async function fetchNewsDetail(slug: string, signal?: AbortSignal): Promise<NewsDetail | null> {
  if (!slug) return null;
  const detail = await getArticleBySlug(slug, signal);
  if (detail) return detail;

  // Fallback to fixture if slug matches
  const found = thirteenNewsArticles.find((a) => a.slug === slug);
  if (found) return adaptNewsDetail(found);

  return null;
}

export interface UseNewsListQueryOptions {
  category?: string;
  limit?: number;
  lang?: string;
  refetchInterval?: number; // default 60_000
  staleTime?: number; // default 30_000
  enabled?: boolean;
}

export interface NewsListQueryResult {
  data: NewsListDomain | null;
  displayedData: NewsListDomain | null;
  hasNewArticles: boolean;
  newCount: number;
  applyNewArticles: () => void;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
}

/**
 * Helper to detect if fresh incoming items contain articles newer than currently displayed
 */
export function hasNewerArticles(incoming: NewsItem[], current: NewsItem[]): boolean {
  if (!incoming.length) return false;
  if (!current.length) return false;

  const currentIds = new Set(current.map((item) => item.id));
  const hasUnseen = incoming.some((item) => !currentIds.has(item.id));
  if (hasUnseen) return true;

  // Compare newest publish dates
  const incomingMax = Math.max(...incoming.map((i) => new Date(i.publishedAt).getTime()));
  const currentMax = Math.max(...current.map((i) => new Date(i.publishedAt).getTime()));
  return incomingMax > currentMax;
}

/**
 * News List Query Hook with TanStack Query semantics:
 * - refetchInterval 60_000, staleTime 30_000
 * - refetchOnWindowFocus true, refetchOnReconnect true
 * - pauses polling while tab is hidden
 * - DOES NOT reflow on newer articles, offers 'hasNewArticles' pill and applyNewArticles callback
 */
export function useNewsListQuery(options: UseNewsListQueryOptions = {}): NewsListQueryResult {
  const {
    category,
    limit,
    lang,
    refetchInterval = 60_000,
    staleTime = 30_000,
    enabled = true,
  } = options;

  const [data, setData] = useState<NewsListDomain | null>(null);
  const [displayedData, setDisplayedData] = useState<NewsListDomain | null>(null);
  const [pendingData, setPendingData] = useState<NewsListDomain | null>(null);
  const [hasNewArticles, setHasNewArticles] = useState(false);
  const [newCount, setNewCount] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const lastFetchTimeRef = useRef<number>(0);
  const displayedDataRef = useRef<NewsListDomain | null>(null);
  displayedDataRef.current = displayedData;

  const categoryRef = useRef(category);

  const executeFetch = useCallback(
    async (isBackground = false) => {
      if (!enabled) return;
      if (isBackground) {
        setIsFetching(true);
      } else {
        setIsLoading(true);
      }
      setIsError(false);
      setError(null);

      try {
        const fresh = await fetchNewsList({ category, limit, lang });
        lastFetchTimeRef.current = Date.now();
        setData(fresh);

        const currentDisp = displayedDataRef.current;
        const isFilterChange = categoryRef.current !== category;
        categoryRef.current = category;

        // If it's the initial load or the user actively changed category, apply directly
        if (!currentDisp || isFilterChange || !isBackground) {
          setDisplayedData(fresh);
          setPendingData(null);
          setHasNewArticles(false);
          setNewCount(0);
        } else {
          // In background refetch: Check if newer articles were added
          if (hasNewerArticles(fresh.items, currentDisp.items)) {
            const currentIds = new Set(currentDisp.items.map((i) => i.id));
            const freshNewCount = fresh.items.filter((i) => !currentIds.has(i.id)).length;
            setPendingData(fresh);
            setHasNewArticles(true);
            setNewCount(Math.max(1, freshNewCount));
            // DO NOT reflow page: leave displayedData unchanged!
          } else {
            // No new articles, silently update non-breaking fields (like announcement)
            setDisplayedData((prev) => (prev ? { ...prev, announcement: fresh.announcement } : fresh));
          }
        }
      } catch (err: unknown) {
        setIsError(true);
        setError(err instanceof Error ? err : new Error('Không thể tải tin tức'));
      } finally {
        setIsLoading(false);
        setIsFetching(false);
      }
    },
    [category, limit, lang, enabled]
  );

  const applyNewArticles = useCallback(() => {
    if (pendingData) {
      setDisplayedData(pendingData);
      setPendingData(null);
      setHasNewArticles(false);
      setNewCount(0);
    }
  }, [pendingData]);

  // Initial fetch and fetch upon param changes
  useEffect(() => {
    executeFetch(false);
  }, [executeFetch]);

  // Polling interval with visibility & focus handling
  useEffect(() => {
    if (!enabled || refetchInterval <= 0) return;

    let timer: ReturnType<typeof setInterval> | null = null;

    const startTimer = () => {
      if (timer) clearInterval(timer);
      timer = setInterval(() => {
        // Pause while tab is hidden
        if (typeof document !== 'undefined' && document.visibilityState === 'hidden') {
          return;
        }
        // Stale check
        const elapsed = Date.now() - lastFetchTimeRef.current;
        if (elapsed >= staleTime) {
          executeFetch(true);
        }
      }, refetchInterval);
    };

    startTimer();

    // Window focus refetch
    const handleFocus = () => {
      const elapsed = Date.now() - lastFetchTimeRef.current;
      if (elapsed >= staleTime) {
        executeFetch(true);
      }
    };

    // Reconnect refetch
    const handleOnline = () => {
      executeFetch(true);
    };

    // Visibility change
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        const elapsed = Date.now() - lastFetchTimeRef.current;
        if (elapsed >= staleTime) {
          executeFetch(true);
        }
      }
    };

    window.addEventListener('focus', handleFocus);
    window.addEventListener('online', handleOnline);
    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      if (timer) clearInterval(timer);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('online', handleOnline);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [enabled, refetchInterval, staleTime, executeFetch]);

  return {
    data,
    displayedData,
    hasNewArticles,
    newCount,
    applyNewArticles,
    isLoading,
    isFetching,
    isError,
    error,
    refetch: () => executeFetch(false),
  };
}

/**
 * Hook for single news detail
 */
export function useNewsDetailQuery(slug: string) {
  const [data, setData] = useState<NewsDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchDetail = useCallback(async () => {
    if (!slug) {
      setData(null);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);
    setError(null);

    try {
      const detail = await fetchNewsDetail(slug);
      setData(detail);
    } catch (err: unknown) {
      setIsError(true);
      setError(err instanceof Error ? err : new Error('Không thể tải bài viết'));
    } finally {
      setIsLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchDetail();
  }, [fetchDetail]);

  return {
    data,
    isLoading,
    isError,
    error,
    refetch: fetchDetail,
  };
}
