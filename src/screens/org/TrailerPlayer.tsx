import { Maximize2, Play, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Media } from '../../data/types';
import type { Trailer } from '../../state/world';
import { autoplayAllowed, claimPlayback, setFeedMuted, useFeedMuted } from '../../state/feedVideo';
import { videoSources } from '../../state/playhead';
import { Photo } from '../../ui/primitives';

/*
 * The trailer at the top of a project page (docs/ux-refinement/PLAN.md, Stage 4), District-style: it fills the
 * width at 16:9 and plays muted on its own once most of it is on screen, never with Reduced Motion or Save Data, and
 * pauses when it scrolls away or the page hides. It shares the feed's one-video-at-a-time rule and its sound setting.
 *
 * Controls stay minimal and touch-first, like the feed: a sound circle and a full-screen circle in the corners, a
 * hairline of progress, a tap to pause or resume. Language chips appear only when there is more than one version, and
 * switching keeps your place. When autoplay is blocked or the file fails, the poster frame stays with a play mark.
 * A temporary (this session only) or sample clip is labelled as such on the frame.
 */
export function TrailerPlayer({ versions, fallback, title }: { versions: Trailer[]; fallback?: Media; title: string }) {
  const [index, setIndex] = useState(0);
  const t = versions[Math.min(index, versions.length - 1)];
  const root = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLVideoElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const resumeAt = useRef(0);
  const held = useRef(false);
  const muted = useFeedMuted();
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);

  const play = () => {
    const v = ref.current;
    if (!v || failed) return;
    claimPlayback(v);
    void v.play().catch(() => setPlaying(false));
  };

  // On screen (60%): play muted unless the viewer paused it; off screen or hidden page: pause.
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.intersectionRatio >= 0.6) {
        if (!held.current && autoplayAllowed() && !document.hidden) play();
      } else v.pause();
    }, { threshold: [0, 0.6, 1] });
    io.observe(v);
    const vis = () => document.hidden && v.pause();
    document.addEventListener('visibilitychange', vis);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', vis);
      v.pause();
    };
  }, [t?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const loop = () => {
      const v = ref.current;
      if (v && bar.current) bar.current.style.transform = `scaleX(${v.duration ? v.currentTime / v.duration : 0})`;
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  if (!t) return null;

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
  // Switching language keeps your place (clamped to the new version's length once it loads).
  const choose = (i: number) => {
    if (i === index) return;
    resumeAt.current = ref.current?.currentTime ?? 0;
    setFailed(false);
    setIndex(i);
  };
  const fullscreen = () => {
    const el = root.current as (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null;
    const v = ref.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (el?.requestFullscreen) void el.requestFullscreen().catch(() => v?.webkitEnterFullscreen?.());
    else if (el?.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else v?.webkitEnterFullscreen?.();
  };
  const label = `${t.kind === 'teaser' ? 'Teaser' : 'Trailer'} · ${t.language}`;
  const poster = t.poster?.src ?? fallback?.src;

  return (
    <div className="trailer">
      <div ref={root} className={`trailer-frame ${playing ? 'is-playing' : 'is-paused'}${failed ? ' is-failed' : ''}`}>
        <video
          key={t.id}
          ref={ref}
          poster={poster}
          muted={muted}
          playsInline
          loop
          preload="metadata"
          aria-label={`${title}, ${label}`}
          onClick={toggle}
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            if (resumeAt.current) v.currentTime = Math.min(resumeAt.current, Math.max(0, v.duration - 0.25));
            resumeAt.current = 0;
            if (!held.current && autoplayAllowed()) play();
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
        >
          {(t.temporary ? [{ src: t.url, type: undefined as string | undefined }] : videoSources(t.url)).map((s, i, all) => (
            <source key={s.src} src={s.src} type={s.type} onError={i === all.length - 1 ? () => setFailed(true) : undefined} />
          ))}
        </video>
        {!playing && !failed && (
          <button className="trailer-play" onClick={toggle} aria-label={`Play ${label}`}>
            <Play size={22} fill="currentColor" strokeWidth={0} />
          </button>
        )}
        {failed && (
          <div className="trailer-failed" role="status">
            {fallback && <Photo media={fallback} surface="project-hero" showPlay={false} alt="" />}
            <span>Trailer unavailable</span>
          </div>
        )}
        <span className="trailer-label">
          {label}
          {t.sample ? ' · sample clip, not this film' : t.temporary ? ' · this session only' : ''}
        </span>
        <button className="trailer-ctl trailer-ctl--sound" onClick={() => setFeedMuted(!muted)} aria-pressed={!muted} aria-label="Sound">
          {muted ? <VolumeX size={15} strokeWidth={2.2} /> : <Volume2 size={15} strokeWidth={2.2} />}
        </button>
        <button className="trailer-ctl trailer-ctl--full" onClick={fullscreen} aria-label="Full screen">
          <Maximize2 size={14} strokeWidth={2.4} />
        </button>
        <span className="trailer-track" aria-hidden>
          <span ref={bar} className="trailer-fill" />
        </span>
      </div>
      {versions.length > 1 && (
        <div className="trailer-langs" role="group" aria-label="Trailer versions">
          {versions.map((v, i) => (
            <button key={v.id} className={`chip${i === index ? ' is-on' : ''}`} aria-pressed={i === index} onClick={() => choose(i)}>
              {v.language}
              {versions.some((x) => x !== v && x.language === v.language) ? ` · ${v.kind}` : ''}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
