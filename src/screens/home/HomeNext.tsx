import { AnimatePresence, motion } from 'framer-motion';
import { Bell, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import * as seed from '../../data/seed';
import { homeInput } from '../../domain/home/candidates';
import { getComposition, type KV } from '../../domain/home/session';
import type { Candidate, Composition } from '../../domain/home/types';
import { stageOf, type Signals } from '../../domain/relevance';
import { research } from '../../research-data/client';
import { findOpportunity, org, party, person } from '../../state/selectors';
import { useStore } from '../../state/store';
import { work } from '../../state/world';
import { OfflineBanner, PublishBar } from '../../ui/chrome';
import { PortraitCard } from '../../ui/compose';
import { goldenHourLine } from '../../ui/goldenHour';
import { Logo } from '../../ui/Logo';
import { Avatar, Button, FollowButton, IconButton, Photo, PressCard, Pressable, SectionHeader, Verified } from '../../ui/primitives';
import { RoleRow } from '../discover/RoleRow';
import { PostCard } from './PostCard';
import { eventCandidates, EventRow } from '../event/eventUnits';

/*
 * The new Home (docs/HOME.md): a fixed frame and a composed middle.
 *   header (search, bell) -> lead story -> personal news (only when something happened to you) -> middle -> end
 * The middle comes from the pure composer (src/domain/home). It is composed once per app session and stays
 * the same while you move around; a refresh ("Take 2") or a fresh launch recomposes it. No big heading, no
 * intent switch, no task queue. Behind ?home=next until the /test comparison is read.
 */

const LOADED_AT = Date.now();
let sessionKey = `s-${LOADED_AT.toString(36)}`;
const kv: KV = {
  get: (k) => {
    try {
      return localStorage.getItem(k);
    } catch {
      return null;
    }
  },
  set: (k, v) => {
    try {
      localStorage.setItem(k, v);
    } catch {
      /* storage blocked: Home still composes, it just can't remember what was shown */
    }
  },
};

const track = (unit: string, position: number, reason?: string) => research.track('home_unit_opened', { metadata: { unit, position, reason: !!reason } });

export function HomeNext({ goDiscover }: { goDiscover: (scope?: string, craft?: string, opts?: { focusSearch?: boolean }) => void }) {
  const store = useStore();
  const { viewer, notifications, openSheet, intent, following, userPosts, userCollabs, roleStatus, pendingCredits, scenario, reloadKey } = store;
  const me = person(viewer.id);
  const unreadCount = notifications.filter((n) => n.unread).length;
  const [take, setTake] = useState(1);
  const [slate, setSlate] = useState(false);
  const signals: Signals = {
    following,
    savedRoleCrafts: store.saved.filter((x) => x.kind === 'role').flatMap((x) => findOpportunity(x.id, userCollabs)?.forCrafts ?? []),
    interested: Object.keys(store.interestsSent).length,
  };
  const isNew = store.isNewPerson || !!scenario.newUser;
  void stageOf;

  // Composed once per session; the inputs below only matter when a new session composes.
  const comp: Composition = useMemo(
    () =>
      getComposition(
        () =>
          homeInput({
            me,
            intent,
            following,
            signals,
            userPosts,
            userCollabs,
            hiddenRoles: roleStatus as Record<string, unknown>,
            pendingCredits,
            loadedAt: LOADED_AT,
            isNew,
            extra: eventCandidates(me, LOADED_AT),
          }),
        { now: Date.now(), sessionKey: `${sessionKey}-${viewer.id}`, kv },
      ),
    // A new person or persona is a new session; pending credits can bring urgent personal news.
    [viewer.id, take, reloadKey, pendingCredits.length], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const refresh = () => {
    sessionKey = `s-${Date.now().toString(36)}`;
    research.track('home_refreshed');
    setSlate(true);
    window.setTimeout(() => {
      setTake((t) => t + 1);
      setSlate(false);
    }, 650);
  };

  return (
    <div className="screen canvas v-home hn" data-scroll="home" key={`${viewer.id}-${reloadKey}`}>
      <header className="home-header home-header--inline hn-header">
        <h1 className="sr-only">Home</h1>
        <span className="home-logo">
          <Logo />
        </span>
        <Pressable className="hn-search" onClick={() => (research.track('home_search_opened'), goDiscover('people', undefined, { focusSearch: true }))} scale={0.98} aria-label="Search people, projects and roles">
          <Search size={16} aria-hidden />
          <span>People, projects, roles</span>
        </Pressable>
        <IconButton label={unreadCount ? `Notifications, ${unreadCount} new` : 'Notifications'} className="icon-btn--float" onClick={() => openSheet({ name: 'notifications' })}>
          <Bell size={19} aria-hidden />
          {unreadCount > 0 && <span className="dot" aria-hidden />}
        </IconButton>
      </header>

      <div className="home-sheet home-sheet--flat hn-sheet">
        <OfflineBanner />
        <PublishBar />
        <AnimatePresence>
          {slate && (
            <motion.p className="hn-slate" role="status" initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
              <span className="hn-slate-board" aria-hidden />
              Take {take + 1}
            </motion.p>
          )}
        </AnimatePresence>

        {comp.lead && <Lead c={comp.lead} />}
        {comp.personal && <PersonalNews news={comp.personal} />}
        {comp.middle.map((c, i) => (
          <Unit key={c.id} c={c} position={i} lead={comp.lead} goDiscover={goDiscover} />
        ))}
        <TheEnd city={me.city} goDiscover={goDiscover} onRefresh={refresh} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------- frame
function Lead({ c }: { c: Candidate }) {
  const { push } = useStore();
  if (c.type === 'event') return <EventRow c={c} position={-1} lead />;
  const w = work(String(c.data?.projectId ?? ''));
  if (!w) return null;
  const house = w.orgIds[0] ? org(w.orgIds[0]) : undefined;
  const faces = ((c.data?.faces as string[] | undefined) ?? []).slice(0, 3);
  return (
    <section className="hn-lead-wrap" aria-label="Lead story">
      <PressCard className="hn-lead" onPress={() => (track('lead', 0, c.reason), push({ name: 'work', id: w.id }))} scale={0.985} aria-label={`${w.title}. ${String(c.data?.text ?? '')}${c.reason ? `. ${c.reason}` : ''}`}>
        <Photo media={w.stills[0] ?? w.media} className="hn-lead-photo" />
        <div className="hn-lead-text">
          <span className="hn-tag">{String(c.data?.tag ?? w.stage)}</span>
          <h2 className="hn-lead-title">{w.title}</h2>
          <p className="hn-lead-meta">
            {house ? (
              <>
                {house.name} <Verified size={12} />
              </>
            ) : (
              w.format
            )}
            {' · '}
            {String(c.data?.text ?? '')}
          </p>
          {c.reason && (
            <p className="hn-lead-why">
              {faces.length > 0 && (
                <span className="hn-faces" aria-hidden>
                  {faces.map((f) => party(f) && <Avatar key={f} party={party(f)!} size={20} />)}
                </span>
              )}
              {c.reason}
            </p>
          )}
        </div>
      </PressCard>
    </section>
  );
}

function PersonalNews({ news }: { news: Composition['personal'] & object }) {
  const { push } = useStore();
  const actor = party(news.actorId);
  const go = () => {
    track('personal', 0);
    if (news.route) push(news.route as never);
  };
  return (
    <section className="hn-unit" aria-label="About you">
      <div className="hn-news">
        {actor && <Avatar party={actor} size={36} />}
        <p className="hn-news-text">{news.text}</p>
        {news.actionLabel && (
          <Button size="s" onClick={go}>
            {news.actionLabel}
          </Button>
        )}
      </div>
    </section>
  );
}

// --------------------------------------------------------------------------------------------- middle
function Unit({ c, position, lead, goDiscover }: { c: Candidate; position: number; lead: Candidate | null; goDiscover: (scope?: string) => void }) {
  const { push, following, toggleFollow, userCollabs } = useStore();
  const opened = () => track(c.type, position + 1, c.reason);
  switch (c.type) {
    case 'people': {
      const people = (c.data?.people as { id: string; reason: string }[]).map((p) => ({ p: person(p.id), reason: p.reason })).filter((x) => x.p);
      return (
        <section className="hn-unit v-section" aria-label="People worth knowing" onClickCapture={opened}>
          <SectionHeader title="People worth knowing" action="See more" onAction={() => goDiscover('people')} />
          <div className="portrait-rail hn-people">
            {people.map(({ p, reason }) => (
              <PortraitCard key={p.id} person={p} context={reason} onPress={() => push({ name: 'profile', id: p.id })} action={<FollowButton primary on={following.includes(p.id)} onToggle={() => toggleFollow(p.id)} name={p.name} block />} />
            ))}
          </div>
        </section>
      );
    }
    case 'post': {
      const post = [...seed.posts].find((p) => p.id === c.data?.postId);
      if (!post) return null;
      return (
        <section className="hn-unit hn-post" aria-label={`Post by ${party(post.authorId)?.name ?? 'someone'}`} onClickCapture={opened}>
          <PostCard post={post} />
        </section>
      );
    }
    case 'projectUpdates':
      return <ProjectUpdates c={c} lead={lead} onOpen={opened} />;
    case 'opportunity': {
      const o = findOpportunity(String(c.data?.roleId ?? ''), userCollabs);
      if (!o) return null;
      return (
        <section className="hn-unit v-section" aria-label="A role that fits you" onClickCapture={opened}>
          <SectionHeader title="A role that fits you" />
          <div className="list list--flush">
            <RoleRow o={o} note={c.reason} />
          </div>
        </section>
      );
    }
    case 'house': {
      const o = org(String(c.data?.houseId ?? ''));
      if (!o) return null;
      return (
        <section className="hn-unit" aria-label={o.name}>
          <div className="hn-row hn-house">
            <PressCard className="hn-row-main" onPress={() => (opened(), push({ name: 'org', id: o.id }))} scale={0.985} aria-label={`${o.name}${c.reason ? `. ${c.reason}` : ''}`}>
              <Avatar party={o} size={44} />
              <span className="hn-row-text">
                <b>
                  {o.name} <Verified size={12} />
                </b>
                <span>{c.reason ?? o.city}</span>
              </span>
            </PressCard>
            <FollowButton on={following.includes(o.id)} onToggle={() => toggleFollow(o.id)} name={o.name} />
          </div>
        </section>
      );
    }
    case 'creditRelation': {
      const w = work(String(c.data?.projectId ?? ''));
      const people = (c.data?.people as string[]).map((id) => party(id)).filter(Boolean);
      return (
        <section className="hn-unit" aria-label="Verified together">
          <PressCard className="hn-row hn-credit" onPress={() => (opened(), w && push({ name: 'work', id: w.id }))} scale={0.985} aria-label={String(c.data?.text ?? '')}>
            <span className="hn-faces hn-faces--lg" aria-hidden>
              {people.map((p) => p && <Avatar key={p.id} party={p} size={32} />)}
            </span>
            <span className="hn-row-text">
              <b>{String(c.data?.text ?? '')}</b>
              <span>
                <Verified size={12} /> Credits issued by the production
              </span>
            </span>
          </PressCard>
        </section>
      );
    }
    case 'event':
      return <EventRow c={c} position={position + 1} />;
    default:
      return null;
  }
}

/** "In production": the update the composer chose, plus up to two more of this session's updates. */
function ProjectUpdates({ c, lead, onOpen }: { c: Candidate; lead: Candidate | null; onOpen: () => void }) {
  const { push } = useStore();
  const leadProject = lead?.data?.projectId;
  const rows = [c, ...(c.data?.more as Candidate[] | undefined ?? [])].filter((x) => x.data?.projectId !== leadProject).slice(0, 3);
  const items = rows.map((r) => ({ r, w: work(String(r.data?.projectId ?? '')) })).filter((x) => x.w);
  if (!items.length) return null;
  return (
    <section className="hn-unit v-section" aria-label="In production">
      <SectionHeader title="In production" />
      <div className="hn-rows">
        {items.map(({ r, w }) => (
          <PressCard key={r.id} className="hn-update" onPress={() => (onOpen(), push({ name: 'work', id: w!.id }))} scale={0.985} aria-label={`${w!.title}: ${String(r.data?.text ?? '')}${r.reason ? `. ${r.reason}` : ''}`}>
            <span className="hn-update-art">
              <Photo media={w!.media} />
            </span>
            <span className="hn-row-text">
              <b>{w!.title}</b>
              <span>{String(r.data?.text ?? '')}</span>
              {r.reason && <em>{r.reason}</em>}
            </span>
          </PressCard>
        ))}
      </div>
    </section>
  );
}

// ------------------------------------------------------------------------------------------------ end
/** "That's a wrap": the page has an end. The clapper claps once when it comes into view; golden hour today. */
function TheEnd({ city, goDiscover, onRefresh }: { city: string; goDiscover: (scope?: string) => void; onRefresh: () => void }) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);
  const light = goldenHourLine(city);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(([e]) => {
      if (e.isIntersecting) {
        setSeen(true);
        research.track('home_end_reached');
        io.disconnect();
      }
    }, { threshold: 0.6 });
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  const find: [string, string][] = [
    ['people', 'People'],
    ['projects', 'Projects'],
    ['roles', 'Roles'],
  ];
  return (
    <section className="hn-end" ref={ref} aria-labelledby="hn-end-title">
      <Clapper clap={seen} />
      <h2 id="hn-end-title" className="hn-end-title">
        That's a wrap
      </h2>
      <p className="hn-end-sub">You're up to date. New things arrive as projects move and people share work.</p>
      {light && <p className="hn-golden">{light}</p>}
      <div className="hn-find" role="group" aria-label="Find more">
        {find.map(([s, l]) => (
          <button key={s} className="chip" onClick={() => goDiscover(s)}>
            {l}
          </button>
        ))}
      </div>
      <button className="link hn-refresh" onClick={onRefresh}>
        Refresh Home
      </button>
    </section>
  );
}

function Clapper({ clap }: { clap: boolean }): ReactNode {
  return (
    <svg className={`hn-clapper ${clap ? 'is-clapping' : ''}`} viewBox="0 0 64 52" width="52" height="42" aria-hidden>
      <g className="hn-clapper-arm">
        <rect x="6" y="6" width="52" height="11" rx="2" fill="var(--text)" />
        <path d="M14 6 l8 11 M28 6 l8 11 M42 6 l8 11" stroke="var(--surface, #fff)" strokeWidth="4" />
      </g>
      <rect x="6" y="19" width="52" height="28" rx="3" fill="var(--text)" />
      <path d="M12 27 h22 M12 34 h14 M12 41 h18" stroke="var(--surface, #fff)" strokeWidth="2" strokeLinecap="round" opacity="0.7" />
    </svg>
  );
}
