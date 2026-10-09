import { AudioLines, Bookmark, CalendarDays, ChevronDown, ChevronLeft, ChevronRight, Play, Share, Star, Volume2, VolumeX } from 'lucide-react';
import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import type { Work } from '../../data/works';
import type { Media } from '../../data/types';
import { posterFor } from '../../data/posters';
import { orderVersions } from '../../domain/trailers';
import { releaseAt, releaseLabel, reviewsOpen, sortReviews, stats } from '../../domain/reviews';
import { autoplayAllowed, claimPlayback, setFeedMuted, useFeedMuted } from '../../state/feedVideo';
import { videoSources } from '../../state/playhead';
import { eventsOfProject } from '../../state/events';
import { discoverPosts, org, person, postWork } from '../../state/selectors';
import { useStore } from '../../state/store';
import { project as wproject, reviewsOf, world, type Trailer } from '../../state/world';
import { TRAILER_SAMPLE } from '../../ui/preview';
import { Avatar, IconButton, Photo, Pressable, Verified } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';
import { scriptLang } from '../../ui/compose';
import { mediaName } from '../../ui/a11y';
import { whenLabel } from '../../domain/events';
import { RoleRow } from '../discover/RoleRow';
import * as seed from '../../data/seed';
import { PostCard } from '../home/PostCard';

/*
 * The public project page, District's movie-page structure in Ana's design (docs/ux-refinement/PLAN.md, Stage 4):
 *
 *   1. The trailer fills most of the screen and stays put; the details slide up over it as a sheet. On it: back,
 *      the language of the version playing (a picker when there are several), share; sound and "Watch full trailer".
 *      No trailer: the poster (or the still) holds the same place.
 *   2. The sheet: title, a meta line (format | language +N more | stage or year), when it releases and who made it.
 *      Then one line of momentum with one action (the rating and Rate once released, otherwise Save), the logline,
 *      cards for what you can act on (your credit, open roles), Buzz (review quotes and screenings), Cast and crew,
 *      Posters and stills, open roles, posts.
 *   3. One primary action fixed at the bottom. Once the sheet covers the trailer, a compact header names the film.
 *
 * The page is always dark: a cinema, whatever the app theme.
 */
const CLIPS = ['kaaval', 'faultlines', 'monsoon', 'neeliraat', 'neela', 'backwaters'];
/** Studio review only (?trailer-sample): two labelled stand-in clips, never the film's trailer. */
function sampleTrailers(id: string, languages: string[]): Trailer[] {
  const own = CLIPS.includes(id) ? id : 'kaaval';
  const other = CLIPS.find((c) => c !== own)!;
  return [
    { id: `sample-${id}-1`, kind: 'trailer', language: languages[0] ?? 'Hindi', url: `video/${own}.mp4`, status: 'published', sample: true },
    { id: `sample-${id}-2`, kind: 'teaser', language: languages.find((l) => l !== languages[0]) ?? 'English', url: `video/${other}.mp4`, status: 'published', sample: true },
  ];
}

/** "Out in 8 days", the line of momentum before release (the date itself is already under the title). */
function countdown(at: number, now = Date.now()) {
  const days = Math.ceil((at - now) / 864e5);
  return days <= 0 ? 'Out now' : days === 1 ? 'Out tomorrow' : days < 60 ? `Out in ${days} days` : 'Coming soon';
}

export function WorkCinema({ w }: { w: Work }) {
  const { pop, push, openSheet, viewer, acting, roleStatus, blocked, events, following, userPosts, isSaved, toggleSave, mayReview, setHero } = useStore();
  const id = w.id;
  const wp = wproject(id);
  const languages = wp?.languages ?? [];
  const published = orderVersions(TRAILER_SAMPLE && wp ? sampleTrailers(id, languages) : (w.trailers ?? []), languages);
  // Until a trailer exists, the film's own footage (when the prototype has it) moves in the hero, called a clip.
  const versions: Trailer[] = published.length ? published : CLIPS.includes(id) ? [{ id: `clip-${id}`, kind: 'clip', language: '', url: `video/${id}.mp4`, status: 'published' }] : [];
  const [index, setIndex] = useState(0);
  const [picker, setPicker] = useState(false);
  const [scrollY, setScrollY] = useState(0);
  const [more, setMore] = useState(false);
  const scroller = useRef<HTMLDivElement>(null);
  const heroH = scroller.current?.querySelector<HTMLElement>('.wp-hero')?.offsetHeight ?? 640;
  const covered = scrollY > heroH * 0.55;
  const compact = scrollY > heroH - 120;
  useEffect(() => {
    setHero('work', !compact);
    return () => setHero('work', false);
  }, [compact, setHero]);

  const poster = posterFor(id);
  const still = w.media.id === 'ph' ? undefined : w.media.presentations?.['project-hero'] ? w.media : w.stills[0] ?? w.media;
  const backdrop = poster ?? still;
  const t = versions[Math.min(index, versions.length - 1)];
  const released = w.stage === 'Released';
  const open = reviewsOpen(w, Date.now());
  const all = reviewsOf(id);
  const s = stats(all);
  const mine = all.find((r) => r.personId === viewer.id);
  const canRate = open && mayReview(id);
  const saved = isSaved('project', id);
  const roles = [...seed.opportunities.filter((o) => o.project === w.title), ...world.roles.filter((r) => r.projectId === id && r.visibility === 'open')]
    .filter((o) => !roleStatus[o.id])
    .filter((o) => !blocked.includes(o.orgId ?? o.authorId ?? ''));
  const credit = acting === 'self' ? w.credits.find((c) => c.personId === viewer.id) : undefined;
  const isLead = acting !== 'self' && wp?.houseId === acting;
  const screenings = eventsOfProject(events, id, Date.now(), viewer.id, acting);
  const quotes = sortReviews(all.filter((r) => r.text && !r.spoiler), 'rating').slice(0, 4);
  const posts = discoverPosts(viewer, following, userPosts).filter((post) => postWork(post)?.id === id);
  const people = w.credits.map((c) => ({ c, p: person(c.personId) })).filter((x) => x.p);
  const houses = w.orgIds.map((o) => org(o));
  const fmt = wp ? (wp.formatLabel ?? (wp.format === 'Feature' ? 'Feature film' : wp.format)) : w.format;
  const meta = [fmt.split(' · ')[0], languages.length ? `${languages[0]}${languages.length > 1 ? ` +${languages.length - 1} more` : ''}` : undefined, released ? w.year : w.stage].filter(Boolean).join(' | ');
  const when = released ? (w.releaseDate ? `Released ${releaseLabel(w.releaseDate).replace(/^\w+, /, '')}` : `Released ${w.year}`) : w.releaseDate ? `Releasing ${releaseLabel(w.releaseDate)}` : undefined;
  const scrollToRoles = () => scroller.current?.querySelector('#wp-roles')?.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });

  // A fixed action only when this viewer has a real next step here. Saving is a quiet utility, so it lives with
  // Share in the top bar; it never fills the primary slot just to have one.
  const cta: { label: string; run: () => void } | null = isLead
    ? { label: 'Open in your workspace', run: () => push({ name: 'hproject', id }) }
    : roles.length && !credit && acting === 'self'
      ? { label: `See open roles · ${roles.length}`, run: scrollToRoles }
      : canRate && !mine
        ? { label: 'Rate and review', run: () => openSheet({ name: 'review', projectId: id }) }
        : null;
  const saveBtn = (
    <IconButton label={saved ? `Saved. Remove ${w.title} from Saved` : `Save ${w.title}`} className={`wp-btn${saved ? ' is-on' : ''}`} aria-pressed={saved} onClick={() => toggleSave(id, 'project')}>
      <Bookmark size={18} fill={saved ? 'currentColor' : 'none'} />
    </IconButton>
  );

  const share = () => openSheet({ name: 'share', label: w.title });
  const depth = Math.min(1, Math.max(0, scrollY) / heroH);

  return (
    <div ref={scroller} className="screen wp" onScroll={(e) => setScrollY(e.currentTarget.scrollTop)}>
      <div className="wp-compact-slot">
        <header className="wp-compact" aria-hidden={!compact} {...(!compact ? ({ inert: '' } as Record<string, string>) : {})}>
          {backdrop && <span className="wp-compact-bg" aria-hidden><Photo media={backdrop} surface="project-card" showPlay={false} alt="" /></span>}
          <IconButton label="Back" className="wp-btn" onClick={pop}><ChevronLeft size={22} /></IconButton>
          <span className="wp-compact-title" lang={scriptLang(w.title)}>{w.title}</span>
          <span className="wp-actions">{saveBtn}<IconButton label={`Share ${w.title}`} className="wp-btn" onClick={share}><Share size={18} /></IconButton></span>
        </header>
      </div>

      <div className="wp-hero" data-hero style={{ '--hero-t': depth } as CSSProperties}>
        {t ? <TrailerHero t={t} fallback={backdrop} title={w.title} active={!covered} /> : backdrop ? <Photo media={backdrop} surface={poster ? 'credit-card' : 'project-hero'} className="wp-hero-still" showPlay={false} alt={`${w.title}${poster ? ' poster' : ''}`} /> : <span className="wp-hero-empty" />}
        <span className="wp-hero-shade" aria-hidden />
        <div className="wp-top">
          <IconButton label="Back" className="wp-btn" onClick={pop}><ChevronLeft size={22} /></IconButton>
          {t && t.kind !== 'clip' ? (versions.length > 1 ? (
            <button className="wp-lang" onClick={() => setPicker(true)} aria-label={`${t.language} ${t.kind}. Choose another version`}>
              <AudioLines size={15} aria-hidden /> {t.language} <ChevronDown size={15} aria-hidden />
            </button>
          ) : (
            <span className="wp-lang wp-lang--static"><AudioLines size={15} aria-hidden /> {t.language}</span>
          )) : <span aria-hidden />}
          <span className="wp-actions">{saveBtn}<IconButton label={`Share ${w.title}`} className="wp-btn" onClick={share}><Share size={18} /></IconButton></span>
        </div>
      </div>

      <div className="wp-sheet">
        <span className="wp-handle" aria-hidden />
        <h1 className="wp-title" lang={scriptLang(w.title)}>{w.title}</h1>
        <p className="wp-meta">{meta}</p>
        {when && <p className="wp-when">{when}</p>}
        {houses.length > 0 ? (
          <p className="wp-by">
            By{' '}
            {houses.map((h, i) => (
              <span key={h.id}>
                {i > 0 && ' and '}
                <button className="wp-by-link" onClick={() => push({ name: 'org', id: h.id })}>{h.name}</button>
                {h.verified && <Verified size={13} label="Verified production house" />}
              </span>
            ))}
          </p>
        ) : w.ownerId ? (
          <p className="wp-by">By <button className="wp-by-link" onClick={() => push({ name: 'profile', id: w.ownerId! })}>{person(w.ownerId).name}</button> · independent</p>
        ) : null}

        <div className="wp-hype">
          {open ? (
            <>
              <p className="wp-hype-text">
                {s.enough ? <><Star size={14} fill="currentColor" aria-hidden /> {s.avg.toFixed(1)} · {s.count} ratings</> : s.count ? `${s.count} ${s.count === 1 ? 'rating' : 'ratings'} so far` : 'Be the first to rate it'}
              </p>
              {mine ? (
                <button className="wp-pill" onClick={() => openSheet({ name: 'review', projectId: id })}><Star size={14} fill="currentColor" aria-hidden /> You rated {mine.stars}</button>
              ) : canRate ? (
                <button className="wp-pill" onClick={() => openSheet({ name: 'review', projectId: id })}><Star size={14} aria-hidden /> Rate</button>
              ) : null}
            </>
          ) : (
            <>
              <p className="wp-hype-text">{w.releaseDate && !released ? countdown(releaseAt(w.releaseDate)) : released ? 'Reviews open on release day' : `In ${w.stage.toLowerCase()}`}</p>
            </>
          )}
        </div>

        {w.logline && (
          <p className={`wp-logline${more ? '' : ' is-clamped'}`}>
            {w.logline}
            {w.logline.length > 140 && !more && (
              <button className="wp-more" onClick={() => setMore(true)}>View more</button>
            )}
          </p>
        )}

        {(credit || roles.length > 0) && (
          <div className="wp-cards">
            {credit && (
              <div className="wp-card">
                <Verified size={18} label="" />
                <span className="wp-card-text"><b>You're credited as {credit.role}</b><span>Issued by the production, accepted by you</span><button className="wp-card-link" onClick={() => openSheet({ name: 'reportCredit', title: w.title, creditId: world.credits.find((c) => c.projectId === id && c.personId === viewer.id && c.status === 'accepted')?.id })}>Something wrong?</button></span>
              </div>
            )}
            {roles.length > 0 && (
              <Pressable className="wp-card wp-card--press" onClick={scrollToRoles} scale={0.98}>
                <span className="wp-card-badge" aria-hidden>{roles.length}</span>
                <span className="wp-card-text"><b>Hiring now</b><span>{roles.length} open {roles.length === 1 ? 'role' : 'roles'} on this project</span></span>
                <ChevronRight size={18} aria-hidden />
              </Pressable>
            )}
          </div>
        )}

        {(quotes.length > 0 || screenings.length > 0) && (
          <Section title="Buzz around this film" action={all.length ? { label: 'All reviews', run: () => push({ name: 'filmReviews', id }) } : undefined}>
            <div className="wp-rail wp-buzz">
              {screenings.map((e) => (
                <Pressable key={e.id} className="wp-buzz-card" onClick={() => push({ name: 'event', id: e.id })} scale={0.98}>
                  <CalendarDays size={26} className="wp-buzz-icon" aria-hidden />
                  <b>{e.title}</b>
                  <span>{whenLabel(e.start)} · {e.venue}</span>
                </Pressable>
              ))}
              {quotes.map((r) => {
                const p = person(r.personId);
                return (
                  <Pressable key={r.id} className="wp-buzz-card" onClick={() => push({ name: 'filmReviews', id })} scale={0.98}>
                    <span className="wp-buzz-stars" aria-label={`${r.stars} out of 5 stars`}>{'★'.repeat(Math.round(r.stars))}</span>
                    <b>“{r.text}”</b>
                    <span>{r.personId === viewer.id ? 'You' : p.name} · {p.role}</span>
                  </Pressable>
                );
              })}
            </div>
          </Section>
        )}

        {people.length > 0 && (
          <Section title="Cast and crew" note={<><Verified size={12} label="" /> Every credit issued by the production and accepted by the person</>}>
            <div className="wp-rail wp-cast" role="list">
              {people.map(({ c, p }) => (
                <Pressable key={c.personId + c.role} role="listitem" className="wp-person" onClick={() => push({ name: 'profile', id: p.id })} scale={0.97} aria-label={`${p.name}, ${c.role}`}>
                  <Avatar party={p} size={52} />
                  <span className="wp-person-text"><b>{p.name}</b><span>{c.role}</span></span>
                </Pressable>
              ))}
            </div>
          </Section>
        )}

        <MediaGrid title={w.title} poster={poster} stills={w.stills.filter((m) => m.id !== 'ph')} push={push} />

        {roles.length > 0 && (
          <section id="wp-roles" className="wp-section">
            <h2 className="wp-h2">Open roles</h2>
            <div className="list list--flush">{roles.map((o) => <RoleRow key={o.id} o={o} />)}</div>
          </section>
        )}

        {posts.length > 0 && (
          <section className="wp-section">
            <h2 className="wp-h2">Posts</h2>
            {posts.map((post) => <PostCard key={post.id} post={post} />)}
          </section>
        )}

        <button className="wp-report" onClick={() => openSheet({ name: 'report', subject: w.title })}>Report this project</button>

        {cta && (
          <div className="wp-cta-bar">
            <button className="wp-cta" onClick={cta.run}>{cta.label}</button>
          </div>
        )}
      </div>

      <Sheet open={picker} onClose={() => setPicker(false)} title="Choose a version">
        <div className="wp-versions" role="radiogroup" aria-label="Trailer versions">
          {versions.map((v, i) => (
            <button key={v.id} role="radio" aria-checked={i === index} className={`wp-version${i === index ? ' is-on' : ''}`} onClick={() => { setIndex(i); setPicker(false); }}>
              <b>{v.language}</b>
              <span>{v.kind === 'teaser' ? 'Teaser' : 'Trailer'}{v.duration ? ` · ${v.duration}` : ''}{v.sample ? ' · sample clip, not this film' : v.temporary ? ' · this session only' : ''}</span>
            </button>
          ))}
        </div>
      </Sheet>
    </div>
  );
}

function Section({ title, action, note, children }: { title: string; action?: { label: string; run: () => void }; note?: ReactNode; children: ReactNode }) {
  return (
    <section className="wp-section">
      <div className="wp-section-head">
        <h2 className="wp-h2">{title}</h2>
        {action && <button className="wp-section-all" onClick={action.run}>{action.label}</button>}
      </div>
      {children}
      {note && <p className="wp-note">{note}</p>}
    </section>
  );
}

/** Posters and stills, District's bento: a large poster with two stills beside it, then rows of three. */
function MediaGrid({ title, poster, stills, push }: { title: string; poster?: Media; stills: Media[]; push: ReturnType<typeof useStore>['push'] }) {
  const items = [...(poster ? [poster] : []), ...stills];
  if (items.length < 2) return null;
  const open = (i: number) => push({ name: 'media', items, index: i, what: poster && i === 0 ? 'Poster' : 'Still', from: `from ${title}` });
  const tile = (m: Media, i: number, cls: string) => (
    <Pressable key={m.id + i} className={`wp-tile ${cls}`} onClick={() => open(i)} scale={0.97} aria-label={poster && i === 0 ? `${title} poster` : mediaName(m, i, items.length, 'Still', `from ${title}`)}>
      <Photo media={m} surface={poster && i === 0 ? 'credit-card' : 'project-card'} showPlay={false} />
    </Pressable>
  );
  const lead = items.slice(0, 3);
  const rest = items.slice(3);
  return (
    <section className="wp-section">
      <h2 className="wp-h2">Posters and stills</h2>
      <div className={`wp-bento wp-bento--${lead.length}`}>{lead.map((m, i) => tile(m, i, i === 0 ? 'wp-tile--lead' : ''))}</div>
      {rest.length > 0 && <div className="wp-bento-row">{rest.map((m, i) => tile(m, i + 3, ''))}</div>}
    </section>
  );
}

/** The hero trailer: fills the frame, plays muted while uncovered, tap to pause; sound and Watch full trailer. */
function TrailerHero({ t, fallback, title, active }: { t: Trailer; fallback?: Media; title: string; active: boolean }) {
  const ref = useRef<HTMLVideoElement>(null);
  const box = useRef<HTMLDivElement>(null);
  const held = useRef(false);
  const muted = useFeedMuted();
  const [playing, setPlaying] = useState(false);
  const [failed, setFailed] = useState(false);
  const [full, setFull] = useState(false);
  const play = () => {
    const v = ref.current;
    if (!v || failed) return;
    claimPlayback(v);
    void v.play().catch(() => setPlaying(false));
  };
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    if (active && !held.current && autoplayAllowed() && !document.hidden) play();
    if (!active) v.pause();
  }, [active, t.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const vis = () => document.hidden && ref.current?.pause();
    const fs = () => setFull(document.fullscreenElement === box.current);
    document.addEventListener('visibilitychange', vis);
    document.addEventListener('fullscreenchange', fs);
    return () => {
      document.removeEventListener('visibilitychange', vis);
      document.removeEventListener('fullscreenchange', fs);
      ref.current?.pause();
    };
  }, []);
  const toggle = () => {
    const v = ref.current;
    if (!v || failed) return;
    if (v.paused) { held.current = false; play(); } else { held.current = true; v.pause(); }
  };
  const watchFull = () => {
    const el = box.current as (HTMLDivElement & { webkitRequestFullscreen?: () => void }) | null;
    const v = ref.current as (HTMLVideoElement & { webkitEnterFullscreen?: () => void }) | null;
    if (!v) return;
    setFeedMuted(false);
    v.currentTime = 0;
    held.current = false;
    play();
    if (el?.requestFullscreen) void el.requestFullscreen().catch(() => v.webkitEnterFullscreen?.());
    else if (el?.webkitRequestFullscreen) el.webkitRequestFullscreen();
    else v.webkitEnterFullscreen?.();
  };
  const kind = t.kind;
  return (
    <div ref={box} className={`wp-trailer${playing ? ' is-playing' : ''}${failed ? ' is-failed' : ''}`}>
      <video
        key={t.id}
        ref={ref}
        poster={t.poster?.src ?? fallback?.src}
        muted={muted}
        playsInline
        loop
        controls={full}
        preload="metadata"
        aria-label={[title, kind, t.language].filter(Boolean).join(', ')}
        onClick={full ? undefined : toggle}
        onLoadedMetadata={() => active && !held.current && autoplayAllowed() && play()}
        onPlay={() => setPlaying(true)}
        onPause={() => setPlaying(false)}
      >
        {(t.temporary ? [{ src: t.url, type: undefined as string | undefined }] : videoSources(t.url)).map((s, i, all) => (
          <source key={s.src} src={s.src} type={s.type} onError={i === all.length - 1 ? () => setFailed(true) : undefined} />
        ))}
      </video>
      {failed && fallback && <Photo media={fallback} surface="project-hero" className="wp-hero-still" showPlay={false} alt="" />}
      {!playing && !failed && <span className="wp-paused" aria-hidden><Play size={22} fill="currentColor" strokeWidth={0} /></span>}
      {(t.sample || t.temporary) && <span className="wp-tag">{t.sample ? 'Sample clip, not this film' : 'This session only'}</span>}
      {!failed && (
        <>
          <button className="wp-sound" onClick={() => setFeedMuted(!muted)} aria-pressed={!muted} aria-label="Sound">
            {muted ? <VolumeX size={17} strokeWidth={2.2} /> : <Volume2 size={17} strokeWidth={2.2} />}
          </button>
          <button className="wp-watch" onClick={watchFull}>
            <Play size={15} fill="currentColor" strokeWidth={0} aria-hidden /> {kind === 'clip' ? 'Watch clip' : `Watch full ${kind}`}
          </button>
        </>
      )}
    </div>
  );
}
