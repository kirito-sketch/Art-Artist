import { motion, type PanInfo } from 'framer-motion';
import { Maximize, Minimize, Pause, Play, RotateCcw, RotateCw, Volume2, VolumeX, X } from 'lucide-react';
import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import type { Post } from '../../data/types';
import { useStore } from '../../state/store';
import { party } from '../../state/selectors';
import { clock, playheadKey, returnPlayhead, videoSources } from '../../state/playhead';
import { mediaName } from '../../ui/a11y';
import { IconButton } from '../../ui/primitives';
import { PostActions } from './PostActions';

/*
 * Expanded post video (Option A, docs/NAV_AND_POST_NOTCH.md). The precise controls live here, not in the feed: a
 * full-width scrubber with elapsed and remaining time, Play/Pause, back and forward 10 seconds, Mute and Fullscreen.
 * The post actions sit on their own row below, in the same order as on the card (Like, Share, Save) and on the same
 * state. No notch: there is no card here. Opens at the frame the feed was on and hands the frame back on close.
 */
export function PostVideoViewer({ post, index, time, play }: { post: Post; index: number; time: number; play: boolean }) {
  const { pop } = useStore();
  const media = post.media[index];
  const author = party(post.authorId);
  const root = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLVideoElement>(null);
  const [playing, setPlaying] = useState(false);
  const [muted, setMuted] = useState(false);
  const [at, setAt] = useState(time);
  const [of, setOf] = useState(0);
  const [full, setFull] = useState(false);
  const canFull = typeof document !== 'undefined' && !!document.fullscreenEnabled;
  const label = mediaName(media, index, post.media.length, 'Video', `in ${author?.name ?? 'this'} post`);

  useEffect(() => {
    const onFull = () => setFull(document.fullscreenElement === root.current);
    document.addEventListener('fullscreenchange', onFull);
    return () => document.removeEventListener('fullscreenchange', onFull);
  }, []);

  const close = () => {
    returnPlayhead(playheadKey(post.id, index), ref.current?.currentTime ?? at);
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    pop();
  };
  const toggle = () => {
    const v = ref.current;
    if (!v) return;
    if (v.paused) void v.play().catch(() => setPlaying(false));
    else v.pause();
  };
  const seek = (t: number) => {
    const v = ref.current;
    if (!v) return;
    v.currentTime = Math.max(0, Math.min(v.duration || 0, t));
    setAt(v.currentTime);
  };
  const fullscreen = () => {
    if (document.fullscreenElement) void document.exitFullscreen().catch(() => undefined);
    else void root.current?.requestFullscreen?.().catch(() => undefined);
  };
  const onKeyDown = (e: KeyboardEvent) => {
    if ((e.target as HTMLElement).tagName === 'INPUT') return;
    if (e.key === ' ' || e.key === 'k') { e.preventDefault(); toggle(); }
    else if (e.key === 'ArrowLeft' || e.key === 'j') seek(at - 10);
    else if (e.key === 'ArrowRight' || e.key === 'l') seek(at + 10);
    else if (e.key === 'm') setMuted((m) => !m);
    else if (e.key === 'Escape' && !document.fullscreenElement) close();
  };
  const onDragEnd = (_: unknown, info: PanInfo) => { if (info.offset.y > 120) close(); };

  return (
    <div className="pvv" ref={root} onKeyDown={onKeyDown}>
      <h1 className="sr-only">{label}</h1>
      <div className="pvv-bar">
        <IconButton label="Close" className="icon-btn--on-dark" onClick={close}>
          <X size={22} />
        </IconButton>
        <IconButton label="Mute" aria-pressed={muted} className="icon-btn--on-dark" onClick={() => setMuted((m) => !m)}>
          {muted ? <VolumeX size={20} /> : <Volume2 size={20} />}
        </IconButton>
      </div>
      <motion.div className="pvv-stage" drag="y" dragConstraints={{ top: 0, bottom: 0 }} dragElastic={0.4} dragSnapToOrigin onDragEnd={onDragEnd}>
        <video
          ref={ref}
            poster={media.poster}
          muted={muted}
          playsInline
          preload="auto"
          aria-label={label}
          onClick={toggle}
          onLoadedMetadata={(e) => {
            const v = e.currentTarget;
            setOf(v.duration);
            v.currentTime = Math.min(time, v.duration || time);
            if (play) void v.play().catch(() => setPlaying(false));
          }}
          onPlay={() => setPlaying(true)}
          onPause={() => setPlaying(false)}
          onEnded={() => setPlaying(false)}
          onTimeUpdate={(e) => setAt(e.currentTarget.currentTime)}
        >
          {videoSources(media.src).map((source) => <source key={source.src} src={source.src} type={source.type} />)}
        </video>
      </motion.div>
      <div className="pvv-controls">
        <input
          className="pvv-scrub"
          type="range"
          min={0}
          max={of || 0}
          step={0.05}
          value={Math.min(at, of || at)}
          onChange={(e) => seek(+e.target.value)}
          aria-label="Seek"
          aria-valuetext={`${clock(at)} of ${clock(of)}`}
          style={{ '--p': `${of ? (at / of) * 100 : 0}%` } as import('react').CSSProperties}
        />
        <div className="pvv-times" aria-hidden>
          <span>{clock(at)}</span>
          <span>-{clock(Math.max(0, of - at))}</span>
        </div>
        <div className="pvv-transport">
          <IconButton label="Back 10 seconds" className="icon-btn--on-dark" onClick={() => seek(at - 10)}>
            <RotateCcw size={22} />
          </IconButton>
          <IconButton label={playing ? 'Pause' : 'Play'} className="icon-btn--on-dark pvv-play" onClick={toggle}>
            {playing ? <Pause size={26} fill="currentColor" strokeWidth={0} /> : <Play size={26} fill="currentColor" strokeWidth={0} />}
          </IconButton>
          <IconButton label="Forward 10 seconds" className="icon-btn--on-dark" onClick={() => seek(at + 10)}>
            <RotateCw size={22} />
          </IconButton>
          {canFull && (
            <IconButton label={full ? 'Exit full screen' : 'Full screen'} className="icon-btn--on-dark pvv-full" onClick={fullscreen}>
              {full ? <Minimize size={20} /> : <Maximize size={20} />}
            </IconButton>
          )}
        </div>
      </div>
      <div className="pvv-post">
        <span className="pvv-author">{author?.name}</span>
        <PostActions post={post} variant="viewer" />
      </div>
    </div>
  );
}
