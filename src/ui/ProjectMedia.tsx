import { useEffect, useRef, useState } from 'react';
import type { Media } from '../data/types';
import type { Work } from '../data/works';
import { useLowPower } from './ambient/ambient';
import { scriptLang } from './compose';
import { Photo } from './primitives';

/*
 * A project's media, the same on Home and on the project page so the two read as one object
 * (docs/HOME.md, "Media fallbacks"). In order of preference:
 *   1. moving media: a muted clip that plays only while it is on screen, and never with Reduce Motion,
 *      Save-Data or low power (the poster frame shows instead);
 *   2. its pictures;
 *   3. its one picture;
 *   4. no media: a typographic title card. Intentional, never a grey box, a broken image or a made-up frame.
 */

/**
 * Clips per project. There is no real footage in the prototype yet. The one entry is a stand-in made from
 * Kaaval's own stills to exercise the video path; it is used only when a Studio link asks for it
 * (`?media=standin`) and the Studio notice says so.
 */
const TEASERS: Record<string, { src: string; standIn?: boolean }> = {
  kaaval: { src: '/video/standin-kaaval', standIn: true },
};
const params = typeof location !== 'undefined' ? new URLSearchParams(location.search) : new URLSearchParams();
export const STAND_IN_MEDIA = params.get('media') === 'standin';

export const hasMedia = (w: Work) => w.media.id !== 'ph';
export const teaserOf = (w: Work) => {
  const t = TEASERS[w.id];
  return t && (!t.standIn || STAND_IN_MEDIA) ? t : undefined;
};
/** The picture that stands for the project: the same one on a Home card and as the page's hero. */
export const heroOf = (w: Work): Media | undefined => (hasMedia(w) ? w.stills[0] ?? w.media : undefined);

/**
 * Every distinct picture of a project, the hero first. Missing files fall back to a shared cover, so two
 * stills can end up as the same picture: it resolves what each one actually shows and keeps one of each.
 * null until resolved.
 */
export function useProjectPictures(w: Work | undefined): Media[] | null {
  const all = w && hasMedia(w) ? [heroOf(w)!, w.media, ...w.stills] : [];
  const list = all.filter((m, i) => all.findIndex((x) => x.id === m.id) === i);
  const key = list.map((m) => m.id).join('|');
  const [resolved, setResolved] = useState<{ key: string; urls: (string | null)[] } | null>(null);
  useEffect(() => {
    let live = true;
    const probe = (url: string) => new Promise<boolean>((ok) => {
      const i = new Image();
      i.onload = () => ok(true);
      i.onerror = () => ok(false);
      i.src = url;
    });
    Promise.all(list.map(async (m) => ((await probe(m.src)) ? m.src : m.fallback && (await probe(m.fallback)) ? m.fallback : null))).then((urls) => live && setResolved({ key, urls }));
    return () => {
      live = false;
    };
  }, [key]); // eslint-disable-line react-hooks/exhaustive-deps
  if (!w) return [];
  if (!resolved || resolved.key !== key) return null;
  const seen = new Set<string>();
  return list.flatMap((m, i) => {
    const url = resolved.urls[i];
    if (!url || seen.has(url)) return [];
    seen.add(url);
    return [{ ...m, src: url, fallback: undefined }];
  });
}

function motionAllowed() {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
  return !(navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData;
}

/** Plays after the clip has been on screen for a moment, pauses as soon as it leaves. No poster: the picture underneath is the poster. */
function Teaser({ src }: { src: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    let t = 0;
    let inView = false;
    // A screen pushed on top makes the layer underneath inert: its clip pauses until it is uncovered.
    const layer = v.closest('.tab-layer, .route-layer');
    const update = () => {
      window.clearTimeout(t);
      if (inView && !v.closest('[inert]')) t = window.setTimeout(() => void v.play().catch(() => undefined), 500);
      else v.pause();
    };
    const io = new IntersectionObserver(
      ([e]) => {
        inView = e.isIntersecting;
        update();
      },
      { threshold: 0.6 },
    );
    io.observe(v);
    const mo = new MutationObserver(update);
    if (layer) mo.observe(layer, { attributes: true, attributeFilter: ['inert'] });
    return () => {
      window.clearTimeout(t);
      io.disconnect();
      mo.disconnect();
    };
  }, []);
  // WebM (VP9) first, MP4 (H.264) for Safari. If neither plays, the picture underneath simply stays.
  return (
    <video ref={ref} className="pm-video" muted loop playsInline preload="metadata" aria-hidden onError={(e) => (e.currentTarget.style.display = 'none')}>
      <source src={`${src}.webm`} type="video/webm" />
      <source src={`${src}.mp4`} type="video/mp4" />
    </video>
  );
}

export function ProjectMedia({ w, className = '', still, kicker }: { w: Work; className?: string; /** Never the clip (small thumbnails). */ still?: boolean; /** The no-media card's top line. */ kicker?: string }) {
  const low = useLowPower();
  const hero = heroOf(w);
  const teaser = teaserOf(w);
  if (teaser && !still && !low && motionAllowed()) {
    return (
      <div className={`pm ${className}`}>
        <Photo media={hero} showPlay={false} />
        <Teaser src={teaser.src} />
      </div>
    );
  }
  if (hero) return <Photo media={hero} className={`pm ${className}`} showPlay={false} />;
  return <TitleCard w={w} className={className} kicker={kicker} />;
}

/** No media yet: the title set as a card, in the same type and colour as the house's own title cards. */
export function TitleCard({ w, className = '', kicker }: { w: Work; className?: string; kicker?: string }) {
  return (
    <div className={`pm title-card pm-title-card ${className}`} role="img" aria-label={`${w.title}, no pictures shared yet`}>
      <span className="title-card-rule" />
      <span className="pm-title-kicker">{kicker ?? w.format.split(' · ')[0]}</span>
      <span className="title-card-title" lang={scriptLang(w.title)}>
        {w.title}
      </span>
    </div>
  );
}
