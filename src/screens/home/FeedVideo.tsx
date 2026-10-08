import { Maximize2, Play, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Media, Post } from '../../data/types';
import { useStore } from '../../state/store';
import { clock, onPlayhead, playheadKey, videoSources } from '../../state/playhead';

/*
 * Option A feed video (?actions=notch, docs/NAV_AND_POST_NOTCH.md). In the feed people watch: the frame is one
 * Play/Pause button, Expand sits top-left, Mute top-right, and a thin progress line runs along the bottom and stops
 * before the action notch. The line only reports; seeking lives in the expanded viewer, which opens at the current
 * frame. Playback stays user-started (no autoplay, as before) and pauses when the card leaves the screen.
 */
export function FeedVideo({ post, index, media, label, fit, position, onMetadata }: { post: Post; index: number; media: Media; label: string; fit: 'cover' | 'contain'; position: string; onMetadata: (video: HTMLVideoElement) => void }) {
  const { push } = useStore();
  const ref = useRef<HTMLVideoElement>(null);
  const bar = useRef<HTMLSpanElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [failed, setFailed] = useState(false);
  const [time, setTime] = useState({ at: 0, of: 0 });
  const key = playheadKey(post.id, index);

  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) video.pause(); }, { threshold: 0.1 });
    observer.observe(video);
    const off = onPlayhead(key, (t) => { video.currentTime = t; paint(); });
    return () => { observer.disconnect(); off(); video.pause(); };
  }, [key]);

  // The line is painted every frame while playing (timeupdate alone steps visibly on short clips).
  const paint = () => {
    const video = ref.current;
    if (video && bar.current) bar.current.style.transform = `scaleX(${video.duration ? video.currentTime / video.duration : 0})`;
  };
  useEffect(() => {
    if (!playing) return;
    let raf = 0;
    const loop = () => { paint(); raf = requestAnimationFrame(loop); };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  const toggle = () => {
    const video = ref.current;
    if (!video || failed) return;
    if (video.paused) void video.play().catch(() => setPlaying(false));
    else video.pause();
  };
  const expand = () => {
    const video = ref.current;
    const at = video?.currentTime ?? 0;
    const resume = !!video && !video.paused;
    video?.pause();
    push({ name: 'postVideo', post, index, time: at, play: resume || at === 0 });
  };

  return (
    <div className={`fv ${playing ? 'is-playing' : 'is-paused'} ${failed ? 'is-failed' : ''}`}>
      <video
        ref={ref}
        poster={media.poster}
        muted={muted}
        playsInline
        preload="metadata"
        aria-label={label}
        style={{ objectFit: fit, objectPosition: position }}
        onLoadedMetadata={(e) => { onMetadata(e.currentTarget); setTime({ at: e.currentTarget.currentTime, of: e.currentTarget.duration }); }}
        onPlay={() => setPlaying(true)}
        onPause={() => { setPlaying(false); paint(); }}
        onEnded={() => setPlaying(false)}
        onTimeUpdate={(e) => setTime({ at: e.currentTarget.currentTime, of: e.currentTarget.duration })}
      >
        {videoSources(media.src).map((source, i, all) => (
          <source key={source.src} src={source.src} type={source.type} onError={i === all.length - 1 ? () => setFailed(true) : undefined} />
        ))}
      </video>
      {failed ? (
        <p className="fv-failed" role="status">Video unavailable</p>
      ) : (
        <>
          <button className="fv-toggle" onClick={toggle} aria-label={`${playing ? 'Pause' : 'Play'} video`}>
            {!playing && (
              <span className="fv-play" aria-hidden>
                <Play size={24} fill="currentColor" strokeWidth={0} />
              </span>
            )}
          </button>
          <button className="fv-btn fv-expand" onClick={expand} aria-label="Expand video">
            <Maximize2 size={17} strokeWidth={2} />
          </button>
          <button className="fv-btn fv-mute" onClick={() => setMuted((m) => !m)} aria-pressed={muted} aria-label="Mute">
            {muted ? <VolumeX size={17} strokeWidth={2} /> : <Volume2 size={17} strokeWidth={2} />}
          </button>
          <div className="fv-progress" role="progressbar" aria-label="Playback progress" aria-valuemin={0} aria-valuemax={Math.round(time.of || 0)} aria-valuenow={Math.round(time.at)} aria-valuetext={`${clock(time.at)} of ${clock(time.of)}`}>
            <span ref={bar} />
          </div>
        </>
      )}
    </div>
  );
}
