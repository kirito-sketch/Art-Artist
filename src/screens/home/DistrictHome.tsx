import { Bell, ChevronRight, MapPin, Play, Plus, Check } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as seed from '../../data/seed';
import { CRAFTS } from '../../data/crafts';
import type { Craft, Person } from '../../data/types';
import { isLive, type Work } from '../../data/works';
import { REVIEWS, averageScore, reviewsFor } from '../../data/reviews';
import { blockedBy, discoverableProjects } from '../../domain/discovery';
import { creditedOn } from '../../domain/home/graph';
import { discoverPosts, findOpportunity, org, party, person } from '../../state/selectors';
import { useStore } from '../../state/store';
import { visibleEvents } from '../../state/events';
import { work, world } from '../../state/world';
import { useLowPower } from '../../ui/ambient/ambient';
import { OfflineBanner, PublishBar } from '../../ui/chrome';
import { useFeatures } from '../../ui/features';
import { Avatar, IconButton, PersonPhoto, Photo, PressCard, Pressable } from '../../ui/primitives';
import { SaveButton } from './OpportunityCard';

/*
 * The District direction for Home (?home=district): where you are, what the app offers (tiles), then shelves,
 * each with its own shape so the page has a rhythm: a moving spotlight, a mosaic of new work, a featured
 * event with a list, one big quote, small pills, one banner, a grid, and an end. Shelves come from rules over
 * real data and hide when there is too little to show. Everything else in the app is unchanged.
 */

type Go = { discover: () => void };

/** Crafts that work side by side: a cinematographer's crew is camera and lighting too. */
const DEPT: Partial<Record<Craft, { crafts: Craft[]; label: string }>> = {
  cinematographer: { crafts: ['cinematographer', 'camera', 'lighting'], label: 'Camera crew' },
  camera: { crafts: ['cinematographer', 'camera', 'lighting'], label: 'Camera crew' },
  lighting: { crafts: ['cinematographer', 'camera', 'lighting'], label: 'Camera crew' },
  editor: { crafts: ['editor', 'colourist'], label: 'Editors and colourists' },
  colourist: { crafts: ['editor', 'colourist'], label: 'Editors and colourists' },
  director: { crafts: ['director', 'writing'], label: 'Directors and writers' },
  writing: { crafts: ['director', 'writing'], label: 'Directors and writers' },
  actor: { crafts: ['actor'], label: 'Actors' },
};
const deptOf = (c: Craft) => DEPT[c] ?? { crafts: [c], label: CRAFTS.find((x) => x.id === c)?.label ?? 'People' };
const first = (name: string) => name.split(' ')[0];
const CLIPS = new Set(['neela', 'kaaval', 'backwaters', 'monsoon', 'faultlines', 'neeliraat']);

function motionOk() {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
  return !(navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData;
}

export function DistrictHome({ go }: { go: Go }) {
  const store = useStore();
  const { viewer, push, notifications, openSheet, events, following, userPosts, saved, userCollabs, roleStatus, acting, reloadKey } = store;
  const features = useFeatures();
  const me = person(viewer.id);
  const unread = notifications.filter((n) => n.unread).length;
  const dept = deptOf(me.craft);
  const craftLabel = CRAFTS.find((c) => c.id === me.craft)?.label ?? '';

  const projects = useMemo(() => discoverableProjects(blockedBy(me.id)).filter((w) => w.media.id !== 'ph' && !w.ownerId), [me.id]);
  const rolesOf = (w: Work) =>
    [...seed.opportunities.filter((o) => o.project === w.title), ...world.roles.filter((r) => r.projectId === w.id && r.visibility === 'open')].filter((o) => !roleStatus[o.id]);
  const houseCity = (w: Work) => (w.orgIds[0] ? org(w.orgIds[0]).city : '');

  // Spotlight: projects being made near you first, then elsewhere, then recent releases.
  const spotlight = useMemo(
    () =>
      [...projects]
        .sort((a, b) => Number(isLive(b)) - Number(isLive(a)) || Number(houseCity(b) === me.city) - Number(houseCity(a) === me.city) || Number(b.year) - Number(a.year))
        .slice(0, 5),
    [projects, me.city], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const posts = useMemo(() => {
    const all = discoverPosts(viewer, following, userPosts).filter((p) => p.media.length && p.authorId !== me.id);
    const mine = all.filter((p) => dept.crafts.includes((party(p.authorId) as Person | undefined)?.craft as Craft));
    return (mine.length >= 3 ? mine : all).slice(0, 3);
  }, [viewer, following, userPosts, me.id, dept.crafts]);

  const now = Date.now();
  const upcoming = features.events
    ? visibleEvents(events, now, viewer.id, acting)
        .filter((e) => e.start >= now)
        .sort((a, b) => Number(b.city === me.city) - Number(a.city === me.city) || a.start - b.start)
        .slice(0, 3)
    : [];

  const quote = REVIEWS[0];

  const continueItems = saved
    .slice()
    .reverse()
    .map((s) => {
      if (s.kind === 'role') {
        const o = findOpportunity(s.id, userCollabs);
        return o && { key: `r-${o.id}`, img: o.media, label: `${o.role} · ${o.project}`, round: false, open: () => push({ name: 'opportunity', id: o.id }) };
      }
      if (s.kind === 'project') {
        const w = work(s.id);
        return w && { key: `p-${w.id}`, img: w.media, label: w.title, round: false, open: () => push({ name: 'work', id: w.id }) };
      }
      if (s.kind === 'person') {
        const p = party(s.id);
        return p && { key: `u-${s.id}`, party: p, label: p.name, round: true, open: () => push({ name: 'profile', id: s.id }) };
      }
      return null;
    })
    .filter(Boolean)
    .slice(0, 6) as { key: string; img?: import('../../data/types').Media; party?: ReturnType<typeof party>; label: string; round: boolean; open: () => void }[];

  // Picked for you: shelves built from rules (craft, city, language), shown only when there is enough in them.
  const free = seed.people.filter((p) => p.id !== me.id && dept.crafts.includes(p.craft) && p.city === me.city && p.availableFrom);
  const forming = projects.filter((w) => isLive(w) && rolesOf(w).length > 0);
  const lang = (me.languages ?? []).find((l) => projects.some((w) => isLive(w) && w.format.includes(l)));
  const inLang = lang ? projects.filter((w) => isLive(w) && w.format.includes(lang)) : [];
  const collections = [
    { key: 'free', kicker: 'Free this month', title: `${dept.label} free this month`, meta: `${free.length} people · ${me.city}`, n: free.length, faces: free.map((p) => p.id), open: () => push({ name: 'browse', scope: 'people' }) },
    { key: 'forming', kicker: 'Open roles', title: 'Crews forming', meta: `${forming.length} projects`, n: forming.length, faces: forming.flatMap((w) => creditedOn(w.id)).slice(0, 4), open: () => push({ name: 'browse', scope: 'roles' }) },
    { key: 'lang', kicker: 'In production', title: `${lang ?? ''} projects in the making`, meta: `${inLang.length} projects`, n: inLang.length, faces: inLang.flatMap((w) => creditedOn(w.id)).slice(0, 4), open: () => push({ name: 'browse', scope: 'projects' }) },
  ]
    .filter((c) => c.n >= 2)
    .sort((a, b) => b.n - a.n);

  const near = seed.people.filter((p) => p.id !== me.id && dept.crafts.includes(p.craft) && p.city === me.city && p.visibility !== 'private' && p.visibility !== 'removed').slice(0, 4);

  const tiles: { key: string; label: string; icon: string; open: () => void; wide?: boolean }[] = [
    ...(features.events ? [{ key: 'events', label: 'Events', icon: 'events', open: () => push({ name: 'browse', scope: 'events' }) }] : []),
    { key: 'projects', label: 'Projects', icon: 'projects', open: () => push({ name: 'browse', scope: 'projects' }) },
    { key: 'people', label: 'People', icon: 'people', open: () => push({ name: 'browse', scope: 'people' }) },
    { key: 'roles', label: 'Opportunities', icon: 'crews', open: () => push({ name: 'browse', scope: 'roles' }), wide: true },
    { key: 'reviews', label: 'Reviews', icon: 'reviews', open: () => push({ name: 'reviews' }), wide: true },
  ];

  return (
    <div className="screen canvas v-home dh" data-scroll="home" key={`${viewer.id}-${reloadKey}`}>
      <div className="dh-wash">
        {/* A slow-moving wash of colour behind the header and tiles, like District's. Decorative. */}
        <span className="dh-glow" aria-hidden>
          <i />
          <i />
          <i />
        </span>
        <header className="dh-head">
          <h1 className="sr-only">Home</h1>
          <MapPin size={20} className="dh-pin" aria-hidden />
          <div className="dh-loc">
            <b>{me.city}</b>
            {craftLabel && <span>{[craftLabel, (me.languages ?? []).slice(0, 2).join(', ')].filter(Boolean).join(' · ')}</span>}
          </div>
          <span className="flex" />
          <IconButton label={unread ? `Notifications, ${unread} new` : 'Notifications'} onClick={() => openSheet({ name: 'notifications' })}>
            <Bell size={21} aria-hidden />
            {unread > 0 && <span className="dot" aria-hidden />}
          </IconButton>
        </header>
        <OfflineBanner />
        <PublishBar />
        <nav className="dh-tiles" aria-label="Explore">
          {tiles.map((t) => (
            <PressCard key={t.key} className={`dh-tile ${t.wide ? 'dh-tile--wide' : ''}`} onPress={t.open} scale={0.96} aria-label={t.label}>
              <img src={`/images/tiles/${t.icon}.webp`} alt="" className="dh-tile-icon" draggable={false} />
              <b>{t.label}</b>
            </PressCard>
          ))}
        </nav>
      </div>

      {spotlight.length > 0 && (
        <section className="dh-sec" aria-label="In the spotlight">
          <h2 className="dh-h">In the spotlight</h2>
          <Spotlight items={spotlight} rolesOf={rolesOf} meId={me.id} />
        </section>
      )}

      {posts.length === 3 && (
        <section className="dh-sec dh-pad" aria-label={`New work in ${craftLabel.toLowerCase()}`}>
          <h2 className="dh-h">New work in {craftLabel.toLowerCase() || 'your craft'}</h2>
          <div className="dh-mosaic">
            {posts.map((p, i) => {
              const a = party(p.authorId);
              return (
                <Pressable key={p.id} className={`dh-mos ${i === 0 ? 'dh-mos--big' : ''}`} onClick={() => push({ name: 'posts', ids: posts.map((x) => x.id), index: i })} scale={0.98} aria-label={`Post by ${a?.name ?? 'someone'}`}>
                  <Photo media={p.media[0]} showPlay={false} className={i === 0 && motionOk() ? 'dh-drift' : ''} />
                  {p.media[0].kind === 'video' && (
                    <span className="dh-play" aria-hidden>
                      <Play size={11} fill="currentColor" strokeWidth={0} />
                    </span>
                  )}
                  {a && (
                    <span className="dh-by">
                      <Avatar party={a} size={20} />
                      {i === 0 ? a.name : first(a.name)}
                    </span>
                  )}
                </Pressable>
              );
            })}
          </div>
          <button className="dh-more" onClick={go.discover}>
            See more in Discover <ChevronRight size={15} aria-hidden />
          </button>
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="dh-sec dh-pad" aria-label="Events near you">
          <h2 className="dh-h">Events near you</h2>
          {(() => {
            const e = upcoming[0];
            const w = e.projectId ? work(e.projectId) : undefined;
            return (
              <div className="dh-evfeat">
                <PressCard className="dh-evfeat-card" onPress={() => push({ name: 'event', id: e.id })} scale={0.985} aria-label={`${e.title}, ${new Date(e.start).toDateString()}`}>
                  {w ? <Photo media={w.media} showPlay={false} className="dh-evfeat-img" /> : <span className="dh-evfeat-img dh-evfeat-plain" />}
                  <DateBlock ms={e.start} big />
                  <span className="dh-evfeat-t">
                    <b>{e.title}</b>
                    <span>
                      {e.venue} · {timeOf(e.start)} · {e.price.kind === 'free' ? 'Free' : e.price.amount}
                    </span>
                  </span>
                </PressCard>
                <span className="dh-evfeat-save">
                  <SaveButton id={e.id} kind="event" floating name={e.title} />
                </span>
              </div>
            );
          })()}
          {upcoming.length > 1 && (
            <div className="dh-evlist">
              {upcoming.slice(1).map((e) => (
                <div key={e.id} className="dh-evrow">
                  <PressCard className="dh-evrow-main" onPress={() => push({ name: 'event', id: e.id })} scale={0.985} aria-label={e.title}>
                    <DateBlock ms={e.start} />
                    <span className="dh-evrow-t">
                      <b>{e.title}</b>
                      <span>
                        {e.venue === 'Online' ? 'Online' : `${e.venue}, ${e.city}`} · {timeOf(e.start)} · {e.price.kind === 'free' ? 'Free' : e.price.amount}
                      </span>
                    </span>
                  </PressCard>
                  <SaveButton id={e.id} kind="event" name={e.title} />
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {quote && (
        <section className="dh-sec dh-pad" aria-label="What the industry is saying">
          <Quote id={quote.projectId} personId={quote.personId} text={quote.quote} onOpen={() => push({ name: 'reviews' })} />
        </section>
      )}

      {continueItems.length > 0 && (
        <section className="dh-sec" aria-label="Continue where you left off">
          <h2 className="dh-h dh-pad">Continue where you left off</h2>
          <div className="dh-rail dh-pills">
            {continueItems.map((c) => (
              <PressCard key={c.key} className="dh-pill" onPress={c.open} scale={0.97} aria-label={c.label}>
                {c.party ? <Avatar party={c.party} size={30} /> : <Photo media={c.img} showPlay={false} className="dh-pill-img" />}
                <span>{c.label}</span>
              </PressCard>
            ))}
          </div>
        </section>
      )}

      {collections.length > 0 && (
        <section className="dh-sec dh-pad" aria-label="Picked for you">
          <h2 className="dh-h">Picked for you</h2>
          <PressCard className="dh-banner" onPress={collections[0].open} scale={0.985} aria-label={`${collections[0].title}, ${collections[0].meta}`}>
            <span className="dh-banner-t">
              <span>{collections[0].kicker}</span>
              <strong>{collections[0].title}</strong>
              <em>{collections[0].meta}</em>
            </span>
            <span className="dh-banner-faces" aria-hidden>
              {collections[0].faces.slice(0, 4).map((id) => party(id) && <Avatar key={id} party={party(id)!} size={46} />)}
            </span>
          </PressCard>
          {collections.length > 1 && (
            <div className="dh-links">
              {collections.slice(1).map((c) => (
                <button key={c.key} className="dh-link" onClick={c.open}>
                  <span>{c.title}</span>
                  <i>
                    {c.n} <ChevronRight size={14} aria-hidden />
                  </i>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {near.length >= 2 && (
        <section className="dh-sec dh-pad" aria-label={`${dept.label} near you`}>
          <h2 className="dh-h">{dept.label} near you</h2>
          <div className="dh-grid">
            {near.map((p) => (
              <NearCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}

      <section className="dh-end" aria-labelledby="dh-end-title">
        <h2 id="dh-end-title">You're up to date.</h2>
        <div className="dh-end-chips">
          {tiles.slice(0, 4).map((t) => (
            <button key={t.key} className="chip" onClick={t.open}>
              {t.label}
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}

const timeOf = (ms: number) => new Date(ms).toLocaleTimeString('en-IN', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Kolkata' }).replace(/\s?(am|pm)/i, (x) => ` ${x.trim().toLowerCase()}`);

function DateBlock({ ms, big }: { ms: number; big?: boolean }) {
  const d = new Date(ms);
  return (
    <span className={`dh-date ${big ? 'dh-date--big' : ''}`} aria-hidden>
      <b>{d.toLocaleDateString('en-IN', { day: 'numeric', timeZone: 'Asia/Kolkata' })}</b>
      {d.toLocaleDateString('en-IN', { month: 'short', timeZone: 'Asia/Kolkata' }).toUpperCase()}
    </span>
  );
}

/** Centred carousel: moves on its own, the centre card plays its clip; touching it stops the movement. */
function Spotlight({ items, rolesOf, meId }: { items: Work[]; rolesOf: (w: Work) => { role: string }[]; meId: string }) {
  const { push } = useStore();
  const [i, setI] = useState(0);
  const held = useRef(false);
  const low = useLowPower();
  const animate = motionOk() && !low;
  const wrap = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(360);
  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setW(el.clientWidth));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  useEffect(() => {
    if (!animate || items.length < 2) return;
    const t = window.setInterval(() => !held.current && document.visibilityState === 'visible' && setI((x) => (x + 1) % items.length), 3800);
    return () => window.clearInterval(t);
  }, [animate, items.length]);
  const CARD = Math.min(248, w - 96);
  const GAP = 12;
  return (
    <div className="dh-car" ref={wrap} onPointerDown={() => (held.current = true)}>
      <div className="dh-track" style={{ transform: `translateX(${(w - CARD) / 2 - i * (CARD + GAP)}px)` }}>
        {items.map((p, k) => {
          const faces = creditedOn(p.id).filter((x) => x !== meId);
          const roles = [...new Set(rolesOf(p).map((r) => r.role))];
          const house = p.orgIds[0] ? org(p.orgIds[0]) : undefined;
          const badge = isLive(p) ? (roles.length ? 'Crew forming' : p.stage === 'Shooting' ? 'Shooting now' : p.stage) : `Released ${p.year}`;
          const active = k === i;
          return (
            <div key={p.id} className={`dh-card ${active ? 'is-active' : ''}`} style={{ width: CARD }} aria-hidden={!active}>
              <PressCard className="dh-card-main" onPress={() => (active ? push({ name: 'work', id: p.id }) : setI(k))} scale={0.985} aria-label={`${p.title}, ${house?.name ?? ''}`} tabIndex={active ? 0 : -1}>
                <span className="dh-card-media">
                  <Photo media={p.stills[0] ?? p.media} showPlay={false} />
                  {animate && active && CLIPS.has(p.id) && <Clip id={p.id} />}
                  <span className="dh-badge">{badge}</span>
                </span>
                <span className="dh-card-body">
                  <b>{p.title}</b>
                  <span>
                    {house?.name ?? p.format.split(' · ')[0]} · {p.format.split(' · ')[1] ?? p.format}
                  </span>
                  {faces.length > 0 && (
                    <span className="dh-who">
                      <span className="dh-faces" aria-hidden>
                        {faces.slice(0, 3).map((f) => party(f) && <Avatar key={f} party={party(f)!} size={20} />)}
                      </span>
                      {faces
                        .slice(0, 2)
                        .map((f) => first(person(f).name))
                        .join(', ')}
                      {faces.length > 2 ? ` +${faces.length - 2}` : ''}
                    </span>
                  )}
                  {isLive(p) && roles.length > 0 && (
                    <span className="dh-look">
                      Looking for <b>{roles.slice(0, 2).join(', ')}{roles.length > 2 ? ` +${roles.length - 2}` : ''}</b>
                    </span>
                  )}
                </span>
              </PressCard>
              <span className="dh-card-save">
                <SaveButton id={p.id} kind="project" floating name={p.title} />
              </span>
            </div>
          );
        })}
      </div>
      <div className="dh-dots" role="tablist" aria-label="Spotlight">
        {items.map((p, k) => (
          <button key={p.id} role="tab" aria-selected={k === i} aria-label={p.title} className={k === i ? 'on' : ''} onClick={() => ((held.current = true), setI(k))} />
        ))}
      </div>
    </div>
  );
}

function Clip({ id }: { id: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const v = ref.current;
    if (!v) return;
    // A covered tab (a screen pushed on top) is inert: the clip pauses until it is uncovered.
    const layer = v.closest('.tab-layer');
    const sync = () => (v.closest('[inert]') ? v.pause() : void v.play().catch(() => undefined));
    sync();
    const mo = new MutationObserver(sync);
    if (layer) mo.observe(layer, { attributes: true, attributeFilter: ['inert'] });
    return () => mo.disconnect();
  }, []);
  return (
    <video ref={ref} className="dh-clip" muted loop playsInline preload="metadata" aria-hidden onError={(e) => (e.currentTarget.style.display = 'none')}>
      <source src={`/video/${id}.webm`} type="video/webm" />
      <source src={`/video/${id}.mp4`} type="video/mp4" />
    </video>
  );
}

function Quote({ id, personId, text, onOpen }: { id: string; personId: string; text: string; onOpen: () => void }) {
  const w = work(id);
  const p = party(personId);
  const score = averageScore(id);
  const n = reviewsFor(id).length;
  return (
    <PressCard className="dh-quote" onPress={onOpen} scale={0.985} aria-label={`${p?.name}: ${text}`}>
      <span className="dh-qmark" aria-hidden>
        “
      </span>
      <p className="dh-qtext">{text}</p>
      <span className="dh-qby">
        {p && <Avatar party={p} size={36} />}
        <span className="dh-qwho">
          <b>{p?.name}</b>
          <span>
            {p?.kind === 'person' ? (p as Person).role : ''} · on {w?.title}
          </span>
        </span>
        {w && (
          <span className="dh-qfilm">
            <Photo media={w.media} showPlay={false} />
            <span>
              ★ {score} <small>({n})</small>
            </span>
          </span>
        )}
      </span>
      <span className="dh-qmore">
        What the industry is saying <ChevronRight size={15} aria-hidden />
      </span>
    </PressCard>
  );
}

function NearCard({ p }: { p: Person }) {
  const { push, following, toggleFollow } = useStore();
  const on = following.includes(p.id);
  return (
    <div className="dh-near">
      <PressCard className="dh-near-main" onPress={() => push({ name: 'profile', id: p.id })} scale={0.98} aria-label={`${p.name}, ${p.role}`}>
        <span className="dh-near-img">
          <PersonPhoto party={p} />
        </span>
        <span className="dh-near-t">
          <b>{p.name}</b>
          <span>
            {p.role}
            {p.years ? ` · ${p.years} yrs` : ''}
          </span>
          {p.availableFrom ? <span className="dh-free">Free from {p.availableFrom}</span> : <span>{p.city}</span>}
        </span>
      </PressCard>
      <button className={`dh-follow ${on ? 'is-on' : ''}`} aria-label={on ? `Following ${p.name}` : `Follow ${p.name}`} aria-pressed={on} onClick={() => toggleFollow(p.id)}>
        {on ? <Check size={16} aria-hidden /> : <Plus size={18} aria-hidden />}
      </button>
    </div>
  );
}
