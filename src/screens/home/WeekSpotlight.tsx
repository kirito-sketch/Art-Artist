import { useCallback, useEffect, useLayoutEffect, useRef, useState, type KeyboardEvent } from 'react';
import { useReducedMotion } from 'framer-motion';
import { useStore } from '../../state/store';
import { Photo } from '../../ui/primitives';
import { useLowPower } from '../../ui/ambient/ambient';
import { SaveButton } from './OpportunityCard';
import type { WeekCard } from './districtFeed';

/*
 * Spotlight, Direction A (default Home, docs/HOME_SPOTLIGHT.md): compact 16:9 cards in a native scroll-snap rail that
 * advances on its own, one card at a time, and loops without a visible jump.
 *
 * Why native scrolling (not the earlier transform carousel): the browser does the swipe, the momentum, the snap and the
 * click suppression after a drag, so manual swiping always wins and nothing has to be measured on every frame. The only
 * trick is the loop: the first card is repeated once after the last; when the rail settles on that copy it is moved,
 * instantly, to the identical real first card.
 *
 * The timer is the progress bar's CSS animation. Its end advances the rail; pausing it pauses the timer exactly, and it
 * runs on the compositor. It runs only while the rail is on screen, the page is visible, Home is uncovered, nothing in
 * the rail has focus, and nobody is touching it; never with Reduced Motion or on a low-power device. A touch or swipe
 * stops it for good: the cards advance on their own until someone touches the rail, then they move only when swiped
 * or tapped (WCAG 2.2.2 without a Pause button, as District does it).
 */
export const WEEK_INTERVAL = 5200;

export function WeekSpotlight({ cards, active }: { cards: WeekCard[]; active: boolean }) {
  const { push } = useStore();
  const n = cards.length;
  const loop = n > 1;
  const track = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [cycle, setCycle] = useState(0); // restarts the progress animation
  const [onScreen, setOnScreen] = useState(false);
  const [pageVisible, setPageVisible] = useState(() => typeof document === 'undefined' || !document.hidden);
  const [touching, setTouching] = useState(false);
  const [focused, setFocused] = useState(false);
  const [stopped, setStopped] = useState(false);
  const reduce = useReducedMotion();
  const low = useLowPower();
  const auto = loop && !reduce && !low && !stopped;
  const running = auto && active && onScreen && pageVisible && !touching && !focused;
  const idle = useRef<number>();
  const downAt = useRef(0);

  const slides = () => [...(track.current?.querySelectorAll<HTMLElement>(':scope > .wk-card') ?? [])];
  const leftOf = (i: number) => {
    const s = slides();
    return s[i] && s[0] ? s[i].offsetLeft - s[0].offsetLeft : 0;
  };

  // Which card is in place: the nearest snap point. The copy at the end counts as the first card.
  const settle = useCallback(() => {
    const el = track.current;
    if (!el) return;
    const s = slides();
    let best = 0;
    s.forEach((_, i) => {
      if (Math.abs(leftOf(i) - el.scrollLeft) < Math.abs(leftOf(best) - el.scrollLeft)) best = i;
    });
    if (loop && best === n) {
      el.scrollTo({ left: 0, behavior: 'instant' as ScrollBehavior });
      best = 0;
    }
    setIndex((prev) => (prev === best % n ? prev : best % n));
  }, [n, loop]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const el = track.current;
    if (!el) return;
    let t = 0;
    const onScroll = () => {
      window.clearTimeout(t);
      t = window.setTimeout(settle, 140);
    };
    const end = () => {
      window.clearTimeout(t);
      settle();
    };
    el.addEventListener('scroll', onScroll, { passive: true });
    el.addEventListener('scrollend', end);
    return () => {
      el.removeEventListener('scroll', onScroll);
      el.removeEventListener('scrollend', end);
      window.clearTimeout(t);
    };
  }, [settle]);

  // On screen: at least 60% of the rail visible.
  useEffect(() => {
    const el = track.current;
    if (!el) return;
    const io = new IntersectionObserver(([e]) => setOnScreen(e.intersectionRatio >= 0.6), { threshold: [0, 0.6, 1] });
    io.observe(el);
    return () => io.disconnect();
  }, []);
  useEffect(() => {
    const on = () => setPageVisible(!document.hidden);
    document.addEventListener('visibilitychange', on);
    return () => document.removeEventListener('visibilitychange', on);
  }, []);
  useEffect(() => () => window.clearTimeout(idle.current), []);
  // A different set of cards starts again from the first.
  useLayoutEffect(() => {
    track.current?.scrollTo({ left: 0, behavior: 'instant' as ScrollBehavior });
    setIndex(0);
    setCycle((c) => c + 1);
  }, [cards.map((c) => c.key).join('|')]); // eslint-disable-line react-hooks/exhaustive-deps

  const go = (i: number, smooth = true) => {
    track.current?.scrollTo({ left: leftOf(i), behavior: smooth && !reduce ? 'smooth' : ('instant' as ScrollBehavior) });
  };
  // The next card is current at once, so the progress moves to its segment with the slide, not after it lands.
  const advance = () => {
    go(index + 1);
    setIndex((index + 1) % n);
    setCycle((c) => c + 1);
  };
  // Someone touched the rail: hold the timer, then start a fresh count once they've let it be for a while.
  const hold = () => {
    window.clearTimeout(idle.current);
    setTouching(true);
    setStopped(true);
  };
  const release = () => {
    window.clearTimeout(idle.current);
    setTouching(false);
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key !== 'ArrowRight' && e.key !== 'ArrowLeft') return;
    e.preventDefault();
    go(e.key === 'ArrowRight' ? Math.min(index + 1, loop ? n : n - 1) : Math.max(index - 1, 0));
  };

  const rendered = loop ? [...cards, cards[0]] : cards;
  return (
    <div
      className={`wk ${running ? 'is-running' : ''}`}
      role="region"
      aria-roledescription="carousel"
      aria-label="This week"
      onFocus={() => setFocused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setFocused(false);
      }}
    >
      <div
        className="wk-track"
        ref={track}
        tabIndex={0}
        aria-label="This week. Use the left and right arrow keys to move between cards."
        aria-live={running ? 'off' : 'polite'}
        onKeyDown={onKeyDown}
        onPointerDown={(e) => {
          downAt.current = track.current?.scrollLeft ?? 0;
          if (e.pointerType !== 'mouse') hold();
        }}
        onPointerUp={(e) => e.pointerType !== 'mouse' && release()}
        onPointerCancel={release}
        onWheel={() => {
          hold();
          release();
        }}
        // A drag that moved the rail is a swipe, never a tap on the card underneath.
        onClickCapture={(e) => {
          if (Math.abs((track.current?.scrollLeft ?? 0) - downAt.current) > 8) {
            e.preventDefault();
            e.stopPropagation();
          }
        }}
      >
        {rendered.map((c, k) => {
          const copy = k === n;
          return (
            <article key={copy ? `${c.key}:copy` : c.key} className={`wk-card wk-card--${c.type}`} role="group" aria-roledescription="slide" aria-label={copy ? undefined : `${k + 1} of ${n}`} aria-hidden={copy || undefined} {...(copy ? { inert: '' } : {})}>
              <button type="button" className="wk-open" onClick={() => push(c.open)} tabIndex={copy ? -1 : 0} aria-label={`${c.chip}. ${c.title}. ${c.reason}. ${c.meta}`}>
                <span className="wk-media">
                  {c.media ? <Photo surface="event-hero" media={c.media} showPlay={false} /> : <span className="dh-event-art wk-art" aria-hidden><span>Ana</span><i /></span>}
                  <span className="wk-chip">{c.chip}</span>
                </span>
                <span className="wk-body">
                  <span className="wk-reason">{c.reason}</span>
                  <b className="wk-title">{c.title}</b>
                  <span className="wk-meta">{c.meta}</span>
                </span>
              </button>
              {c.save && !copy && (
                <span className="wk-save">
                  <SaveButton id={c.save.id} kind={c.save.kind} floating name={c.title} />
                </span>
              )}
            </article>
          );
        })}
      </div>
      {loop && (
        <div className="wk-foot">
          <div className="wk-steps" role="group" aria-label="This week cards">
            {cards.map((c, k) => (
              <button
                key={c.key}
                type="button"
                className={`wk-step ${k === index ? 'is-on' : ''} ${k < index ? 'is-done' : ''}`}
                aria-label={`Show ${c.title}`}
                aria-current={k === index ? 'true' : undefined}
                onClick={() => {
                  go(k);
                  setIndex(k);
                  setStopped(true);
                  setCycle((x) => x + 1);
                }}
              >
                <span className="wk-step-bar">{k === index && auto && <i key={cycle} className="wk-fill" style={{ animationDuration: `${WEEK_INTERVAL}ms` }} onAnimationEnd={advance} />}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
