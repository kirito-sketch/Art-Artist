import { useCallback, useEffect, useState } from 'react';
import { useStore } from '../state/store';

/**
 * Page loads for screens that fetch on open (project, production). Instant normally; slow with the
 * "Slow network" test state; fails once with "Actions fail" so the retry path can be seen.
 */
export function useLoad(key: string) {
  const { scenario, attempt } = useStore();
  const simulate = scenario.loading || scenario.actionsFail;
  const [state, setState] = useState<'loading' | 'error' | 'ready'>(simulate ? 'loading' : 'ready');
  const run = useCallback(() => {
    setState('loading');
    attempt(key, () => setState('ready'), () => setState('error'), scenario.loading ? 1200 : 400);
  }, [attempt, key, scenario.loading]);
  useEffect(() => {
    if (simulate) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);
  return { state, retry: run };
}
