import { useCallback, useEffect, useReducer, useRef } from 'react';

/*
 * Step navigation for entry and onboarding (docs/ux-refinement/PLAN.md, Auth and onboarding repair).
 *
 * - One reducer holds the current step and the steps behind it, so a Back can never act on a stale copy (the old
 *   screen stays mounted during its exit animation, and rapid taps used to read an outdated history).
 * - Transient steps (a code screen, a "no account" notice) are replaced, never stacked: Back from the step after
 *   them returns to the screen before them, never into a verification that already happened.
 * - Browser and system Back match the in-app Back: every stacked step is one history entry, so the in-app Back
 *   calls history.back() and the popstate handler does the work. A browser Forward is undone, never replayed.
 * - Leaving entry removes the entries it added, so Back afterwards doesn't walk into a finished sign-up.
 */
export interface NavState<S extends string> {
  step: S;
  history: S[];
}
type Action<S extends string> = { type: 'go'; to: S } | { type: 'back'; times?: number } | { type: 'set'; state: NavState<S> };

export function navReducer<S extends string>(transient: ReadonlySet<S>) {
  return (state: NavState<S>, a: Action<S>): NavState<S> => {
    if (a.type === 'set') return a.state;
    if (a.type === 'go') {
      if (a.to === state.step) return state;
      return { step: a.to, history: transient.has(state.step) ? state.history : [...state.history, state.step] };
    }
    const n = Math.min(a.times ?? 1, state.history.length);
    if (!n) return state;
    return { step: state.history[state.history.length - n], history: state.history.slice(0, -n) };
  };
}

const MARK = 'aaEntry';

export function useEntryNav<S extends string>(initial: NavState<S>, transient: ReadonlySet<S>) {
  const reducer = useRef(navReducer(transient)).current;
  const [state, dispatch] = useReducer(reducer, initial);
  const latest = useRef(state);
  latest.current = state;
  // How many history entries this flow has pushed above its base entry.
  const pushed = useRef(0);

  useEffect(() => {
    try {
      history.replaceState({ ...(history.state ?? {}), [MARK]: 0 }, '');
      // A resumed flow (after a refresh) gets its entries back, so Back still walks through its steps.
      for (let i = 1; i <= initial.history.length; i++) history.pushState({ [MARK]: i }, '');
      pushed.current = initial.history.length;
    } catch {
      /* no history API: in-app Back still works */
    }
    const onPop = (e: PopStateEvent) => {
      const depth = typeof e.state?.[MARK] === 'number' ? (e.state[MARK] as number) : 0;
      if (depth < pushed.current) {
        dispatch({ type: 'back', times: pushed.current - depth });
        pushed.current = depth;
      } else if (depth > pushed.current) {
        history.go(pushed.current - depth); // undo a browser Forward
      }
    };
    window.addEventListener('popstate', onPop);
    return () => {
      window.removeEventListener('popstate', onPop);
      if (pushed.current > 0) {
        const n = pushed.current;
        pushed.current = 0;
        history.go(-n);
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const go = useCallback(
    (to: S) => {
      const from = latest.current.step;
      if (to === from) return;
      dispatch({ type: 'go', to });
      try {
        if (transient.has(from)) history.replaceState({ [MARK]: pushed.current }, '');
        else history.pushState({ [MARK]: ++pushed.current }, '');
      } catch {
        /* ignore */
      }
    },
    [transient],
  );

  const back = useCallback(() => {
    if (!latest.current.history.length) return;
    if (pushed.current > 0) history.back();
    else dispatch({ type: 'back' });
  }, []);

  /** Replace the whole position (resuming an interrupted sign-up). */
  const reset = useCallback((next: NavState<S>) => {
    dispatch({ type: 'set', state: next });
    try {
      const extra = next.history.length - pushed.current;
      for (let i = 0; i < extra; i++) history.pushState({ [MARK]: ++pushed.current }, '');
    } catch {
      /* ignore */
    }
  }, []);

  return { step: state.step, history: state.history, go, back, reset, canGoBack: state.history.length > 0 };
}
