import { motion } from 'framer-motion';
import { Bell, Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as seed from '../../data/seed';
import { homeInput } from '../../domain/home/candidates';
import { getComposition, type KV } from '../../domain/home/session';
import type { Candidate, Composition } from '../../domain/home/types';
import { stageOf, type Signals } from '../../domain/relevance';
import { research } from '../../research-data/client';
import { findOpportunity, firstName, org, party, person } from '../../state/selectors';
import { useStore } from '../../state/store';
import { work } from '../../state/world';
import { OfflineBanner, PublishBar } from '../../ui/chrome';
import { PortraitCard } from '../../ui/compose';
import { Logo } from '../../ui/Logo';
import { shared, spring } from '../../ui/motion';
import { Avatar, Button, FollowButton, IconButton, Photo, PressCard, SectionHeader, Verified } from '../../ui/primitives';
import { ProjectMedia } from '../../ui/ProjectMedia';
import type { Work } from '../../data/works';
import { RoleRow } from '../discover/RoleRow';
import { PostCard } from './PostCard';
import { FirstStep } from './FirstHome';
// Studio's quiet-week Home: the same world six days on, with nothing new since (src/dev/deepLink.tsx).
import { QUIET_WEEK } from '../../dev/deepLink';

/*
 * Home (docs/HOME.md): a fixed frame and a composed middle.
 *   header (mark, search, bell) -> lead story -> personal news (only when something happened to you)
 *   -> middle -> "You're up to date." with ways into Discover
 * The middle comes from the pure composer (src/domain/home). It is composed once per app session and stays
 * the same while you move around; a fresh launch recomposes it. No big heading, no intent switch, no task
 * queue, no Events. The default Home since October 2026; ?home=current shows the earlier one (/test, QA).
 */

const LOADED_AT = Date.now();
const DAY = 24 * 60 * 60 * 1000;
const sessionKey = `s-${LOADED_AT.toString(36)}`;
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

type GoDiscover = (scope?: string, craft?: string, opts?: { search?: boolean; who?: 'people' | 'houses' }) => void;

export function HomeNext({ goDiscover }: { goDiscover: GoDiscover }) {
  const store = useStore();
  const { viewer, notifications, openSheet, intent, following, userPosts, userCollabs, roleStatus, pendingCredits, scenario, reloadKey } = store;
  const me = person(viewer.id);
  const unreadCount = notifications.filter((n) => n.unread).length;
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
          }),
        { now: QUIET_WEEK ? Date.now() + 6 * DAY : Date.now(), sessionKey: `${sessionKey}-${viewer.id}${QUIET_WEEK ? '-quiet' : ''}`, kv },
      ),
    // A new person or persona is a new session; pending credits can bring urgent personal news.
    [viewer.id, reloadKey, pendingCredits.length], // eslint-disable-line react-hooks/exhaustive-deps
  );
  // One story per project: what's already on the page (a house's "Making" line doesn't repeat it).
  const onPage = new Set([comp.lead, ...comp.middle].map((x) => String(x?.data?.project ?? '')).filter(Boolean));

  return (
    <div className="screen canvas v-home hn" data-scroll="home" key={`${viewer.id}-${reloadKey}`}>
      <header className="home-header home-header--inline hn-header">
        {/* Mark, search, bell. Search opens Discover with the field focused (search lives in Discover). */}
        <h1 className="sr-only">Home</h1>
        <span className="home-logo">
          <Logo />
        </span>
        <span className="flex" />
        <IconButton label="Search" className="icon-btn--float" onClick={() => (research.track('home_search_opened'), goDiscover(undefined, undefined, { search: true }))}>
          <Search size={20} aria-hidden />
        </IconButton>
        <IconButton label={unreadCount ? `Notifications, ${unreadCount} new` : 'Notifications'} className="icon-btn--float" onClick={() => openSheet({ name: 'notifications' })}>
          <Bell size={19} aria-hidden />
          {unreadCount > 0 && <span className="dot" aria-hidden />}
        </IconButton>
      </header>

      <div className="home-sheet home-sheet--flat hn-sheet">
        <OfflineBanner />
        <PublishBar />
        {comp.lead && <Lead c={comp.lead} />}
        {comp.personal && <PersonalNews news={comp.personal} />}
        {/* Just signed up: welcome them by name, with the one thing that makes the profile useful (in place of a toast). */}
        {isNew && !comp.personal && (
          <section className="hn-unit hn-first" aria-label="Your next step">
            <FirstStep welcome={firstName(me)} />
          </section>
        )}
        {comp.middle.map((c, i) => (
          <Unit key={c.id} c={c} position={i} lead={comp.lead} onPage={onPage} goDiscover={goDiscover} />
        ))}
        <TheEnd goDiscover={goDiscover} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------------------------- frame
const restatesTag = (c: Candidate) => {
  const text = String(c.data?.text ?? '').toLowerCase();
  const tag = String(c.data?.tag ?? '').toLowerCase();
  return !text || (!!tag && text.includes(tag));
};
const stageLine = (w: Work) => (w.stage === 'Released' ? w.year : w.stage);

/** One concise context line: the news when there is news, otherwise who is making it and where it stands. */
function contextLine(c: Candidate, w: Work) {
  if (c.type === 'projectUpdates' && !restatesTag(c)) return String(c.data?.text ?? '');
  const house = w.orgIds[0] ? org(w.orgIds[0]) : undefined;
  return `${house?.name ?? w.format.split(' · ')[0]} · ${stageLine(w)}`;
}

function Why({ c, light }: { c: Candidate; light?: boolean }) {
  if (!c.reason) return null;
  const faces = ((c.data?.faces as string[] | undefined) ?? []).slice(0, 3);
  return (
    <p className={light ? 'hn-lead-why' : 'hn-why'}>
      {faces.length > 0 && (
        <span className={`hn-faces ${light ? '' : 'hn-faces--lg'}`} aria-hidden>
          {faces.map((f) => party(f) && <Avatar key={f} party={party(f)!} size={20} />)}
        </span>
      )}
      {c.reason}
    </p>
  );
}

/**
 * The lead: the first story, the first world you enter. Media carries it, edge to edge; the words are only the
 * title, one line of context and, when it answers "why me?", one reason. No badge, no button.
 */
function Lead({ c }: { c: Candidate }) {
  const { push } = useStore();
  const w = work(String(c.data?.projectId ?? ''));
  if (!w) return null;
  const context = contextLine(c, w);
  return (
    <section className="hn-lead-wrap" aria-label="Lead story">
      <PressCard className="hn-lead" onPress={() => (track('lead', 0, c.reason), push({ name: 'work', id: w.id, from: 'card' }))} scale={0.99} aria-label={`${w.title}. ${context}${c.reason ? `. ${c.reason}` : ''}`}>
        <motion.div layoutId={shared.work(w.id)} className="hn-lead-media" transition={spring.push}>
          <ProjectMedia w={w} className="hn-lead-photo" />
        </motion.div>
        <div className="hn-lead-text">
          <h2 className="hn-lead-title">{w.title}</h2>
          <p className="hn-lead-meta">{context}</p>
          <Why c={c} light />
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
/*
 * Each object has its own visual language: a project is the most cinematic, a person is portrait-led, work is
 * media-led, a house is its identity plus what it's making, and a role is compact and structured, on purpose
 * the least dominant thing on the page.
 */
function Unit({ c, position, lead, onPage, goDiscover }: { c: Candidate; position: number; lead: Candidate | null; onPage: Set<string>; goDiscover: GoDiscover }) {
  const { push, following, toggleFollow, userCollabs } = useStore();
  const opened = () => track(c.type, position + 1, c.reason);
  switch (c.type) {
    case 'project': {
      const w = work(String(c.data?.projectId ?? ''));
      if (!w) return null;
      const context = contextLine(c, w);
      return (
        <section className="hn-unit hn-project" aria-label={w.title}>
          <PressCard className="hn-project-card" onPress={() => (opened(), push({ name: 'work', id: w.id, from: 'card' }))} scale={0.985} aria-label={`${w.title}. ${context}${c.reason ? `. ${c.reason}` : ''}`}>
            <motion.div layoutId={shared.work(w.id)} className="hn-project-media" transition={spring.push}>
              <ProjectMedia w={w} />
            </motion.div>
            <span className="hn-project-text">
              <b>{w.title}</b>
              <span>{context}</span>
            </span>
          </PressCard>
          <Why c={c} />
        </section>
      );
    }
    case 'people': {
      const people = (c.data?.people as { id: string; reason?: string }[]).map((p) => ({ p: person(p.id), reason: p.reason })).filter((x) => x.p);
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
        <section className="hn-unit hn-role" aria-label="A role that fits you" onClickCapture={opened}>
          <p className="hn-eyebrow">A role that fits you</p>
          <div className="list list--flush">
            {/* The label already says why it's here; the row keeps its decision facts (City · Pay). */}
            <RoleRow o={o} />
          </div>
        </section>
      );
    }
    case 'house': {
      const o = org(String(c.data?.houseId ?? ''));
      if (!o) return null;
      const m = c.data?.makingId ? work(String(c.data.makingId)) : undefined;
      const making = m && !onPage.has(m.title.toLowerCase()) ? m : undefined;
      return (
        <section className="hn-unit" aria-label={o.name}>
          <div className="hn-house">
            <div className="hn-house-id">
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
            {/* What they're making is the house's identity: its picture, its title, where it stands. */}
            {making && (
              <PressCard className="hn-house-making" onPress={() => (opened(), push({ name: 'work', id: making.id }))} scale={0.985} aria-label={`Making ${making.title}, ${stageLine(making)}`}>
                <span className="hn-house-thumb">
                  <ProjectMedia w={making} still />
                </span>
                <span className="hn-row-text">
                  <span>Making</span>
                  <b>{making.title}</b>
                  <span>{making.format.split(' · ')[0]} · {stageLine(making)}</span>
                </span>
              </PressCard>
            )}
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
    // Events are not Home content (docs/HOME.md). The composer never places one; this is a second guard.
    default:
      return null;
  }
}

/** "In production": the update the composer chose, plus up to two more of this session's updates. */
function ProjectUpdates({ c, lead, onOpen }: { c: Candidate; lead: Candidate | null; onOpen: () => void }) {
  const { push } = useStore();
  const leadProject = lead?.data?.projectId;
  const rows = [c, ...((c.data?.more as Candidate[] | undefined) ?? [])].filter((x) => x.data?.projectId !== leadProject).slice(0, 3);
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
/** The page has an end: one short line, then straight into Discover. No filler, no explanation. */
function TheEnd({ goDiscover }: { goDiscover: GoDiscover }) {
  const ref = useRef<HTMLElement>(null);
  const [seen, setSeen] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el || seen) return;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          setSeen(true);
          research.track('home_end_reached');
          io.disconnect();
        }
      },
      { threshold: 0.6 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  const exits: [string, string, 'houses' | undefined][] = [
    ['people', 'People', undefined],
    ['projects', 'Projects', undefined],
    ['roles', 'Roles', undefined],
    ['people', 'Houses', 'houses'],
  ];
  return (
    <section className="hn-end" ref={ref} aria-labelledby="hn-end-title">
      <h2 id="hn-end-title" className="hn-end-title">
        You're up to date.
      </h2>
      <div className="hn-find" role="group" aria-label="Find more in Discover">
        {exits.map(([scope, label, who]) => (
          <button key={label} className="chip" onClick={() => (research.track('home_end_exit', { metadata: { to: label.toLowerCase() } }), goDiscover(scope, undefined, who ? { who } : { who: 'people' }))}>
            {label}
          </button>
        ))}
      </div>
    </section>
  );
}
