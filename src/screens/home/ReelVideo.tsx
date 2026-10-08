import { Maximize2, Play, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState, type PointerEvent as RPointerEvent, type KeyboardEvent } from 'react';
import type { Media, Post } from '../../data/types';
import { useStore } from '../../state/store';
import { autoplayAllowed, claimPlayback, setFeedMuted, useFeedMuted } from '../../state/feedVideo';
import { clock, onPlayhead, playheadKey, videoSources } from '../../state/playhead';

/*
 * Feed video, Instagram-style (docs/ux-refinement/PLAN.md D2). Touch-first and nearly chrome-free:
 *   - plays muted on its own once 60% is on screen (never with Reduced Motion or Save Data), pauses when it leaves;
 *     one video plays at a time; the feed shares one sound setting
 *   - a single tap pauses and resumes; a double tap Likes (the post card owns both gestures, src/ui/useTapGestures.ts);
 *     this component only listens for the card's "reel-toggle"
 *   - a hairline progress bar along the bottom edge; touching it scrubs (it thickens and shows the time while held)
 *   - two small glass circles in the bottom corners: sound (right) and full screen (left), the same size, both real
 *     buttons so the card's tap gestures never fire on them; nothing else on the picture. A play mark shows only while paused
 */
export function ReelVideo({ post, index, media, label, fit, position, onMetadata }: { post: Post; index: number; media: Media; label: string; fit: 'cover' | 'contain'; position: string; onMetadata: (video: HTMLVideoElement) => void }) {
  const { push } = useStore();
  const root = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLVideoElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const muted = useFeedMuted();
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [scrub, setScrub] = useState<number | null>(null);
  const [time, setTime] = useState({ at: 0, of: 0 });
  const held = useRef(false); // paused by the viewer's own tap: don't resume on scroll until they tap again or leave
  const key = playheadKey(post.id, index);

  const paint = () => {
    const v = ref.current;
    if (v && bar.current) bar.current.style.transform = `scaleX(${v.duration ? v.currentTime / v.duration : 0})`;
  };
  const play = () => {
    const v = ref.current;
    if (!v || failed) return;
    claimPlayback(v);
    void v.play().catch(() => {
      // Sound blocked: fall back to muted, as the browser allows.
      if (!v.muted) {
        setFeedMuted(true);
        v.muted = true;
        void v.play().catch(() => setPlaying(false));
      }
    });
  };

  // On screen (60%): play, unless the viewer paused it; off screen: pause and forget that pause.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.intersectionRatio >= 0.6) {
          if (!held.current && autoplayAllowed() && !v.closest('[inert]')) play();
        } else {
          v.pause();
          held.current = false;
        }
      },
      { threshold: [0, 0.6, 1] },
    );
    io.observe(v);
    const off = onPlayhead(key, (t) => {
      v.currentTime = t;
      paint();
    });
    return () => {
      io.disconnect();
      off();
      v.pause();
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps

  // The card's single tap.
  useEffect(() => {
    const el = root.current;
    if (!el) return;
    const toggle = () => {
      const v = ref.current;
      if (!v || failed) return;
      if (v.paused) {
        held.current = false;
        play();
      } else {
        held.current = true;
        v.pause();
      }
    };
    el.addEventListener('reel-toggle', toggle);
    return () => el.removeEventListener('reel-toggle', toggle);
  }, [failed]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const loop = () => {
      paint();
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  // Scrubbing: the bottom strip, touch-held. The bar thickens and the time shows while you hold it.
  const seekTo = (clientX: number, el: HTMLElement) => {
    const v = ref.current;
    if (!v || !v.duration) return;
    const r = el.getBoundingClientRect();
    const f = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    v.currentTime = f * v.duration;
    setScrub(f);
    paint();
  };
  const onDown = (e: RPointerEvent<HTMLDivElement>) => {
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    seekTo(e.clientX, e.currentTarget);
  };
  const onMove = (e: RPointerEvent<HTMLDivElement>) => scrub !== null && seekTo(e.clientX, e.currentTarget);
  const onUp = () => setScrub(null);
  const onKey = (e: KeyboardEvent) => {
    const v = ref.current;
    if (!v || !v.duration || (e.key !== 'ArrowLeft' && e.key !== 'ArrowRight')) return;
    e.preventDefault();
    v.currentTime = Math.max(0, Math.min(v.duration, v.currentTime + (e.key === 'ArrowRight' ? 1 : -1) * Math.max(1, v.duration / 20)));
    paint();
  };

  const openViewer = () => {
    const v = ref.current;
    const at = v?.currentTime ?? 0;
    const resume = !!v && !v.paused;
    v?.pause();
    push({ name: 'postVideo', post, index, time: at, play: resume || at === 0 });
  };

  return (
    <div ref={root} className={`rv ${playing ? 'is-playing' : 'is-paused'} ${failed ? 'is-failed' : ''} ${scrub !== null ? 'is-scrubbing' : ''}`} data-reel>
      <video
        ref={ref}
        poster={media.poster}
        muted={muted}
        playsInline
        loop
        preload="metadata"
        aria-label={label}
        style={{ objectFit: fit, objectPosition: position }}
        onLoadedMetadata={(e) => {
          onMetadata(e.currentTarget);
          setTime({ at: e.currentTarget.currentTime, of: e.currentTarget.duration });
        }}
        onPlay={() => setPlaying(true)}
        onPause={() => {
          setPlaying(false);
          paint();
        }}
        onTimeUpdate={(e) => setTime({ at: e.currentTarget.currentTime, of: e.currentTarget.duration })}
      >
        {videoSources(media.src).map((s, i, all) => (
          <source key={s.src} src={s.src} type={s.type} onError={i === all.length - 1 ? () => setFailed(true) : undefined} />
        ))}
      </video>
      {failed ? (
        <p className="rv-failed" role="status">Video unavailable</p>
      ) : (
        <>
          {!playing && (
            <span className="rv-paused" aria-hidden>
              <Play size={22} fill="currentColor" strokeWidth={0} />
            </span>
          )}
          <button type="button" className="rv-sound" onClick={() => setFeedMuted(!muted)} aria-pressed={!muted} aria-label="Sound">
            {muted ? <VolumeX size={15} strokeWidth={2.2} /> : <Volume2 size={15} strokeWidth={2.2} />}
          </button>
          <button type="button" className="rv-open" onClick={openViewer} aria-label="Open full screen">
            <Maximize2 size={14} strokeWidth={2.4} />
          </button>
          <div
            className="rv-scrub"
            role="slider"
            tabIndex={0}
            aria-label="Seek"
            aria-valuemin={0}
            aria-valuemax={Math.round(time.of || 0)}
            aria-valuenow={Math.round(time.at)}
            aria-valuetext={`${clock(time.at)} of ${clock(time.of)}`}
            onPointerDown={onDown}
            onPointerMove={onMove}
            onPointerUp={onUp}
            onPointerCancel={onUp}
            onClick={(e) => e.stopPropagation()}
            onKeyDown={onKey}
          >
            <span className="rv-track">
              <span ref={bar} className="rv-fill" />
            </span>
            {scrub !== null && <span className="rv-time">{`${clock(time.at)} / ${clock(time.of)}`}</span>}
          </div>
        </>
      )}
    </div>
  );
}
