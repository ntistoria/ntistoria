import { useState, useEffect, useCallback, useRef } from 'react';

interface UseSupabaseQueryOptions<T> {
  /** If false, the query will not run (useful for conditional fetching) */
  enabled?: boolean;
  /** Milliseconds to wait before re-fetching stale data (default: 5 minutes) */
  staleTimeMs?: number;
  /** Callback when the query succeeds */
  onSuccess?: (data: T) => void;
  /** Callback when the query fails */
  onError?: (error: Error) => void;
}

interface UseSupabaseQueryResult<T> {
  data: T | null;
  loading: boolean;
  error: Error | null;
  /** Manually trigger a fresh fetch ignoring the stale cache */
  refetch: () => void;
  /** Set data directly (for optimistic updates) */
  setData: (data: T | ((prev: T | null) => T | null)) => void;
}

/**
 * I11 — Lightweight data-fetching hook with:
 * - Loading / error states
 * - Stale-time caching (avoids re-fetching data that's still fresh)
 * - isMounted guard to prevent state updates after unmount
 * - Manual refetch
 * - setData for optimistic updates (I3)
 *
 * Usage:
 *   const { data: quizzes, loading, error, refetch } = useSupabaseQuery(
 *     () => fetchPublishedQuizzes(),
 *     []
 *   );
 */
export function useSupabaseQuery<T>(
  fetcher: () => Promise<T>,
  deps: React.DependencyList,
  options: UseSupabaseQueryOptions<T> = {}
): UseSupabaseQueryResult<T> {
  const { enabled = true, staleTimeMs = 5 * 60 * 1000, onSuccess, onError } = options;

  const [data, setDataState] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  // Refs for callbacks — avoids re-running the effect when callbacks change identity
  const onSuccessRef = useRef(onSuccess);
  const onErrorRef = useRef(onError);
  const fetcherRef = useRef(fetcher);
  useEffect(() => { onSuccessRef.current = onSuccess; }, [onSuccess]);
  useEffect(() => { onErrorRef.current = onError; }, [onError]);
  useEffect(() => { fetcherRef.current = fetcher; }, [fetcher]);

  // Track last successful fetch time for stale-time check
  const lastFetchedAtRef = useRef<number>(0);
  const refetchTrigger = useRef(0);

  const run = useCallback(async (force = false) => {
    if (!enabled) return;

    // Skip if data is still fresh (unless forced)
    const now = Date.now();
    if (!force && data !== null && now - lastFetchedAtRef.current < staleTimeMs) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    try {
      const result = await fetcherRef.current();
      if (isMounted) {
        setDataState(result);
        setError(null);
        lastFetchedAtRef.current = Date.now();
        onSuccessRef.current?.(result);
      }
    } catch (err) {
      if (isMounted) {
        const e = err instanceof Error ? err : new Error(String(err));
        setError(e);
        onErrorRef.current?.(e);
        console.error('[useSupabaseQuery] fetch failed:', e);
      }
    } finally {
      if (isMounted) setLoading(false);
    }

    return () => { isMounted = false; };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, staleTimeMs, ...deps]);

  // Re-run when deps change or refetchTrigger increments
  useEffect(() => {
    run(refetchTrigger.current > 0);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, refetchTrigger.current]);

  const refetch = useCallback(() => {
    refetchTrigger.current += 1;
    run(true);
  }, [run]);

  const setData = useCallback((updater: T | ((prev: T | null) => T | null)) => {
    if (typeof updater === 'function') {
      setDataState(prev => (updater as (prev: T | null) => T | null)(prev));
    } else {
      setDataState(updater);
    }
  }, []);

  return { data, loading, error, refetch, setData };
}
