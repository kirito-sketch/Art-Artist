import { motion } from 'framer-motion';
import { BadgeCheck, Bell, CheckCircle2, ChevronDown, ChevronRight, RotateCcw, Users } from 'lucide-react';
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { craftDef } from '../../data/crafts';
import type { Opportunity, Person } from '../../data/types';
import { useStore } from '../../state/store';
import { homeOrder, housesFor, industryActivity, intentDef, opportunitiesFor, peopleFor, projectsFor, stageOf, workFor, type HomeSection, type Signals, type Stage } from '../../domain/relevance';
import { FrameLabel, PortraitCard, PosterTile } from '../../ui/compose';
import { findOpportunity, forYou, kindLabel, networkFor, org, person } from '../../state/selectors';
import { worksForOrg } from '../../state/world';
import { isLive } from '../../data/works';
import { OfflineBanner, PublishBar } from '../../ui/chrome';
import { shared, spring, stagger } from '../../ui/motion';
import { Button, FollowButton, IconButton, Photo, PressCard, SectionHeader, Skeleton, Verified } from '../../ui/primitives';
import { Logo } from '../../ui/Logo';
import { NetworkRow } from './NetworkActivity';
import { Byline, FeaturedCard, SaveButton, useSentLabel } from './OpportunityCard';
import { FirstStep, Resolve, useWorldForming } from './FirstHome';

const HERO_HEIGHT = 600;

export function HomeScreen({ goDiscover }: { goDiscover: (scope?: string) => void }) {
  const store = useStore();
  const { viewer, scenario, openSheet, notifications, reloadKey, push, setHero, homeLayout, intent } = store;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const loading = scenario.loading;
  const me = person(viewer.id);
  const opps = forYou(viewer, scenario);
  const unread = notifications.some((n) => n.unread);
  const cards = homeLayout === 'cards';
  // First session: a person just out of onboarding (or the "New user" test state). No network yet.
  const first = !loading && (store.isNewPerson || scenario.newUser);
  const forming = useWorldForming(first && cards);
  const hasHero = !cards && !loading && !scenario.forYouError && opps.length > 0;
  const solid = !hasHero || scrollY > 40;

  useEffect(() => {
    setHero('home', !solid);
    return () => setHero('home', false);
  }, [solid, setHero]);

  const publishingId = store.publishing?.id;
  useEffect(() => {
    if (publishingId) scrollRef.current?.scrollTo({ top: hasHero ? HERO_HEIGHT - 40 : 0, behavior: 'smooth' });
  }, [publishingId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cards layout: the header is part of the page, on the same paper, and scrolls away with it.
  const header = (className: string) => (
    <header className={`home-header ${className}`}>
      <h1 className="sr-only">Home</h1>
      <span className="home-logo">
        <Logo />
      </span>
      <span className="flex" />
      <IconButton label="Notifications" className="icon-btn--float" aria-describedby={unread ? 'home-unread' : undefined} onClick={() => openSheet({ name: 'notifications' })}>
        <Bell size={19} aria-hidden />
        {unread && (
          <>
            <span className="dot" aria-hidden />
            <span className="sr-only" id="home-unread">
              New notifications
            </span>
          </>
        )}
      </IconButton>
    </header>
  );

  /*
   * V30 (docs/V30.md). One Home system, composed by intent and by how much we know yet (stage):
   *  - first session: prove the network is worth using. Real people, opportunities, projects and
   *    creative work above the fold, widened step by step so nothing reads as empty;
   *  - early usage: follows, saves and interest start to sharpen the ranking;
   *  - established: "what matters to me right now?" leads, with personal activity higher.
   * Same modules at every stage; order, titles and ranking change. Every block says why it is there.
   */
  const signals: Signals = {
    following: store.following,
    savedRoleCrafts: store.saved.filter((x) => x.kind === 'role').flatMap((x) => findOpportunity(x.id, store.userCollabs)?.forCrafts ?? []),
    interested: Object.keys(store.interestsSent).length,
  };
  const stage = stageOf(store.isNewPerson || scenario.newUser, signals);
  const order = homeOrder(intent, stage);
  // Content first, control second: the first module carries the compact intent filter.
  const ctx = (id: HomeSection): HomeCtx => ({ me, stage, signals, goDiscover, lead: id === order[0] });
  const sections: Record<HomeSection, ReactNode> = {
    forYou: <ForYou key="forYou" {...ctx('forYou')} />,
    people: <PeopleFor key="people" {...ctx('people')} />,
    activity: <Activity key="activity" {...ctx('activity')} />,
    projects: <ActiveProjects key="projects" {...ctx('projects')} />,
    work: <CommunityWork key="work" {...ctx('work')} />,
  };

  return (
    <>
      <div className={`screen screen--hero ${cards ? 'canvas v-home' : ''}`} ref={scrollRef} data-scroll="home" key={`${viewer.id}-${reloadKey}-${homeLayout}`} onScroll={(e) => setScrollY(e.currentTarget.scrollTop)}>
        {cards ? (
          header('home-header--inline')
        ) : loading ? (
          <div className="hero hero--empty">
            <Skeleton w="100%" h="100%" r={0} />
          </div>
        ) : scenario.forYouError ? (
          <div className="hero hero--empty">
            <p className="item-title">Couldn't load your recommendations</p>
            <Button variant="secondary" size="s" icon={<RotateCcw size={14} />} onClick={() => store.setScenario({ forYouError: false })}>
              Retry
            </Button>
          </div>
        ) : opps.length ? (
          <HeroRail opps={opps} scrollY={scrollY} onOpen={(id) => push({ name: 'opportunity', id })} />
        ) : (
          <div className="hero hero--empty">
            <p className="item-title">Nothing matches your craft this week</p>
            <Button variant="secondary" size="s" onClick={() => goDiscover('roles')}>
              Browse all opportunities
            </Button>
          </div>
        )}

        <div className={`home-sheet ${hasHero ? '' : 'home-sheet--flat'}`}>
          <OfflineBanner />
          <PublishBar />


          {loading ? (
            <section className="v-section" aria-busy="true">
              <div className="carousel carousel--roles">
                {[0, 1].map((i) => (
                  <div key={i} className="carousel-item">
                    <Skeleton h={420} r={28} />
                  </div>
                ))}
              </div>
            </section>
          ) : (
            order.map((id, i) => (
              <Fragment key={id}>
                {first ? (
                  <Resolve forming={forming} i={i}>
                    {sections[id]}
                  </Resolve>
                ) : (
                  sections[id]
                )}
                {/* One reason to come back, after real content, never above it. */}
                {stage !== 'established' && i === 2 && <FirstStep />}
              </Fragment>
            ))
          )}

          {!loading && (
            <p className="end">
              <CheckCircle2 size={16} /> You're all caught up
            </p>
          )}
        </div>
      </div>

      {/* Archived hero layout: controls float over the photo, a solid bar once it has scrolled away. */}
      {!cards && header(solid ? 'is-solid' : '')}
    </>
  );
}

/**
 * The intent filter: a compact pill inside the first section, never a settings card. It refines what
 * Home prioritises; craft and city are used silently and never announced.
 */
function IntentChip() {
  const { intent, openSheet } = useStore();
  return (
    <button className="intent-chip" onClick={() => openSheet({ name: 'intent' })} aria-label={`Showing what matters for: ${intentDef(intent).label}. Change`} aria-haspopup="dialog">
      {intentDef(intent).short}
      <ChevronDown size={14} strokeWidth={2.4} />
    </button>
  );
}

/** Under a section title: the filter (first section only) and one quiet line on why. */
function Context({ lead, why, children }: { lead?: boolean; why?: string; children?: ReactNode }) {
  return (
    <div className="home-context">
      {lead && <IntentChip />}
      {children}
      {why && <span className="world-why">{why}</span>}
    </div>
  );
}

type HomeCtx = { me: Person; stage: Stage; signals: Signals; goDiscover: (scope?: string) => void; lead: boolean };

/**
 * For you: roles, casting and collaboration requests. Not every craft "applies for roles", so the
 * title stays general (actors see casting named). Exact matches first, then close crafts, then work
 * open nearby, so a thin craft still sees real opportunity. When hiring, only close matches show.
 */
function ForYou({ me, stage, signals, goDiscover, lead }: HomeCtx) {
  const { scenario, push, userCollabs, roleStatus, intent, setScenario } = useStore();
  if (scenario.forYouError)
    return (
      <section className="v-section cards-roles" data-world="roles">
        <SectionHeader title="Opportunities for you" />
        <div className="inline-error inline-error--flush">
          <p>Couldn't load your opportunities.</p>
          <Button variant="secondary" size="s" onClick={() => setScenario({ forYouError: false })}>
            Retry
          </Button>
        </div>
      </section>
    );
  const all = opportunitiesFor(me, intent, userCollabs, roleStatus as Record<string, unknown>, signals, stage === 'established' ? 4 : 6);
  // Someone assembling a team sees opportunities only where they are meaningful.
  const ranked = (intent === 'hire' ? all.filter((r) => r.tier <= 2) : all).slice(0, 8);
  if (!ranked.length) return null;
  const exact = ranked.filter((r) => r.tier === 1).length;
  const title = intent === 'collaborate' ? 'Collaborations and roles for you' : me.craft === 'actor' ? 'Casting and roles for you' : intent === 'hire' ? 'Opportunities in your craft' : 'Opportunities for you';
  const why = exact === ranked.length ? 'Based on your craft, location and availability.' : exact ? 'Your craft first, then work close to it.' : 'Close to your craft, and open near you.';
  return (
    <section className="v-section cards-roles" data-world="roles">
      <SectionHeader title={title} action="See all" onAction={() => goDiscover('roles')} />
      <Context lead={lead} why={why} />
      <div className={`carousel carousel--roles ${stage !== 'established' ? 'carousel--first' : ''}`}>
        {ranked.map(({ item: o, tier }, i) => (
          <motion.div key={o.id} className="carousel-item" {...stagger(i, 0.05)}>
            <FeaturedCard o={o} onOpen={() => push({ name: 'opportunity', id: o.id, from: 'card' })} />
            {tier > 1 && <span className="tier-note">{tier === 2 ? 'Close to your craft' : 'Open near you'}</span>}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/**
 * People, ranked for what you are doing now, each with the reason they are here. "Available now" is a
 * filter on this tray (not a separate section): when building a team, availability is a way of
 * narrowing the same people, not a different question.
 */
function PeopleFor({ me, signals, goDiscover, lead }: HomeCtx) {
  const { following, toggleFollow, push, intent } = useStore();
  const [availableOnly, setAvailableOnly] = useState(false);
  const team = intent === 'hire' || intent === 'collaborate';
  const ranked = peopleFor(me, intent, following, signals);
  const canFilter = team && ranked.some((r) => !!r.item.availableFrom);
  const list = (availableOnly && canFilter ? ranked.filter((r) => !!r.item.availableFrom) : ranked).slice(0, 10);
  if (!list.length) return null;
  const title = intent === 'hire' ? 'People for your next project' : intent === 'collaborate' ? 'People to collaborate with' : intent === 'work' ? (me.craft === 'actor' ? 'Directors and producers' : 'People in your world') : 'People worth knowing';
  const why = team ? 'Other crafts, available and nearby first.' : intent === 'work' ? 'Your craft, and the people who hire.' : 'Your craft and city, then credible professionals.';
  return (
    <section className="v-section" data-world="people">
      <SectionHeader title={title} action="See all" onAction={() => goDiscover('people')} />
      <Context lead={lead} why={why}>
        {canFilter && (
          <button className={`filter-pill ${availableOnly ? 'is-on' : ''}`} aria-pressed={availableOnly} onClick={() => setAvailableOnly((v) => !v)}>
            <span className="status-dot is-on" /> Available now
          </button>
        )}
      </Context>
      <div className="portrait-rail">
        {list.map(({ item: p, why: reason }) => (
          <PortraitCard
            key={p.id}
            person={p}
            context={
              p.availableFrom && !team ? (
                <>
                  <span className="status-dot is-on" /> Available from {p.availableFrom}
                </>
              ) : (
                reason
              )
            }
            onPress={() => push({ name: 'profile', id: p.id })}
            action={<FollowButton primary on={following.includes(p.id)} onToggle={() => toggleFollow(p.id)} name={p.name} block />}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * Activity. Things you owe come first (credits to confirm, interest in what you posted), then
 * professional updates from your network. When there is little or no network yet (a first-time
 * person), public industry activity fills the module so it shows a living community. Never a feed:
 * no portfolio or reel uploads, at most five rows.
 */
function Activity({ me, stage, lead }: HomeCtx) {
  const { viewer, scenario, pendingCredits, interestsReceived, openSheet, push } = useStore();
  const mine = networkFor(viewer, scenario).filter((e) => e.kind !== 'portfolio' && e.kind !== 'reel');
  const toConfirm = pendingCredits.filter((c) => !c.correction);
  const waiting = interestsReceived.filter((i) => !i.withdrawn && !i.review);
  const actions: { id: string; text: ReactNode; meta: string; go: () => void }[] = [];
  if (toConfirm.length)
    actions.push({
      id: 'credits',
      text:
        toConfirm.length === 1 ? (
          <>
            <b>{org(toConfirm[0].orgId).name}</b> credited you on <b>{toConfirm[0].title}</b>
          </>
        ) : (
          <>
            <b>{toConfirm.length} credits</b> are waiting for you to confirm
          </>
        ),
      meta: 'Confirm or flag it on your profile',
      go: () => push({ name: 'profile', id: viewer.id }),
    });
  if (waiting.length)
    actions.push({
      id: 'interest',
      text: (
        <>
          <b>
            {waiting.length} {waiting.length === 1 ? 'person' : 'people'}
          </b>{' '}
          showed interest in what you posted
        </>
      ),
      meta: 'Review them and choose who to message',
      go: () => openSheet({ name: 'reviewInterest' }),
    });
  const limit = 5;
  const personal = [...mine];
  const fill = stage !== 'established' || actions.length + personal.length < 3 ? industryActivity(me, personal.map((e) => e.id)) : [];
  const events = [...personal, ...fill].slice(0, Math.max(0, limit - actions.length));
  if (!actions.length && !events.length) return null;
  const industry = !actions.length && !personal.length;
  return (
    <section className="v-section" data-world="activity">
      <SectionHeader title={industry ? 'Happening on Art and Artist' : 'Activity that matters'} action={personal.length > limit ? 'See all' : undefined} onAction={() => push({ name: 'network' })} />
      {(industry || lead) && <Context lead={lead} why={industry ? 'Credits issued, projects starting, people becoming available.' : undefined} />}
      <div className="list list--flush">
        {actions.map((a) => (
          <PressCard key={a.id} className="nrow nrow--action" onPress={a.go} scale={0.985}>
            <span className="nrow-icon" aria-hidden>
              {a.id === 'credits' ? <BadgeCheck size={20} /> : <Users size={20} />}
            </span>
            <div className="nrow-text">
              <p className="nrow-line">{a.text}</p>
              <p className="meta">{a.meta}</p>
            </div>
            <ChevronRight size={18} className="row-chevron" />
          </PressCard>
        ))}
        {events.map((e, i) => (
          <NetworkRow key={e.id} e={e} index={i} />
        ))}
      </div>
    </section>
  );
}

/**
 * Projects: films and series being made now by verified productions, hiring first, widened to recent
 * releases so the tray always shows real work happening. (V29's "Projects to watch" read as something
 * to stream.) Production houses ride along for people assembling a team and for first sessions.
 */
function ActiveProjects({ me, stage, goDiscover, lead }: HomeCtx) {
  const { push, roleStatus, intent } = useStore();
  const list = projectsFor(me, roleStatus as Record<string, unknown>, stage === 'established' ? 3 : 5).slice(0, 8);
  const houses = intent === 'hire' || stage !== 'established' ? housesFor(me).slice(0, 6) : [];
  if (!list.length) return null;
  const title = intent === 'work' || intent === 'collaborate' ? 'Projects you could join' : intent === 'hire' ? 'Projects and production houses' : 'Active projects';
  const released = list.some((x) => !x.live);
  // One card design for every item: same size, image ratio, hierarchy and tap behaviour. No featured
  // first item. Houses are shown by what they are making, so they share the project card.
  const cards = [
    ...list.map(({ w, hiring, live }) => ({
      key: w.id,
      media: w.media.id === 'ph' ? undefined : w.stills[0] ?? w.media,
      label: live ? w.stage : `Released ${w.year}`,
      title: w.title,
      meta: (
        <>
          {org(w.orgIds[0]).name} <Verified size={12} />
        </>
      ),
      sub: hiring ? `Hiring ${hiring}` : w.format,
      sharedId: w.media.id === 'ph' ? undefined : shared.work(w.id),
      go: () => push({ name: 'work', id: w.id, from: 'card' }),
    })),
    ...houses.map(({ o, hiring, live }) => {
      const ws = worksForOrg(o.id);
      const lead = ws.find(isLive) ?? ws[0];
      return {
        key: o.id,
        media: lead && lead.media.id !== 'ph' ? lead.stills[0] ?? lead.media : undefined,
        label: 'Production house',
        title: o.name,
        meta: (
          <>
            {o.city} <Verified size={12} />
          </>
        ),
        sub: hiring ? `Hiring ${hiring}` : live && lead ? `Making ${lead.title}` : o.about,
        sharedId: undefined as string | undefined,
        go: () => push({ name: 'org', id: o.id }),
      };
    }),
  ];
  return (
    <section className="v-section" data-world="projects">
      <SectionHeader title={title} action="See all" onAction={() => goDiscover('projects')} />
      <Context lead={lead} why={`Being made now, hiring first${released ? ', then recent releases' : ''}.`} />
      <div className="poster-rail project-rail">
        {cards.map((c) => (
          <PosterTile key={c.key} media={c.media} title={c.title} meta={c.meta} sub={c.sub} label={<FrameLabel>{c.label}</FrameLabel>} sharedId={c.sharedId} onPress={c.go} />
        ))}
      </div>
    </section>
  );
}

/**
 * Creative work, contained: recent work from people in your craft, then the wider community. It shows
 * the network is alive and creatively interesting without becoming the Home feed: one tray, last or
 * near last, at most eight pieces, opening into the post viewer.
 */
function CommunityWork({ me, lead }: HomeCtx) {
  const { following, userPosts, push } = useStore();
  const list = workFor(me, following, userPosts);
  if (!list.length) return null;
  const craft = list.some((x) => x.tier === 1);
  return (
    <section className="v-section" data-world="work">
      <SectionHeader title={craft ? `Recent work in ${(craftDef(me.craft)?.label ?? 'your craft').toLowerCase()}` : 'Work from the community'} />
      <Context lead={lead} why={craft ? 'From people in your craft, then the community.' : 'Shared by people on Art and Artist.'} />
      <div className="poster-rail work-rail">
        {list.map(({ item: post }, i) => {
          const a = person(post.authorId);
          return (
            <PosterTile
              key={post.id}
              media={post.media[0]}
              title={a.name}
              meta={a.role}
              onPress={() => push({ name: 'posts', ids: list.map((x) => x.item.id), index: i })}
            />
          );
        })}
      </div>
    </section>
  );
}

/** Full-bleed, swipeable roles. One slide per role, same treatment for every role. */
function HeroRail({ opps, scrollY, onOpen }: { opps: Opportunity[]; scrollY: number; onOpen: (id: string) => void }) {
  const railRef = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  return (
    <div className="hero">
      <div
        className="hero-rail"
        ref={railRef}
        onScroll={(e) => setActive(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        style={{ transform: `translateY(${Math.max(0, scrollY) * 0.35}px)` }}
      >
        {opps.map((o) => (
          <HeroSlide key={o.id} o={o} onOpen={() => onOpen(o.id)} />
        ))}
      </div>
      {opps.length > 1 && (
        <div className="hero-dots" aria-hidden>
          {opps.map((o, i) => (
            <motion.span key={o.id} className="hero-dot" animate={{ width: i === active ? 18 : 6, opacity: i === active ? 1 : 0.5 }} transition={spring.snappy} />
          ))}
        </div>
      )}
    </div>
  );
}

function HeroSlide({ o, onOpen }: { o: Opportunity; onOpen: () => void }) {
  const sent = useSentLabel(o);
  const closing = o.closesInDays !== undefined && o.closesInDays <= 5 ? ` · Closes in ${o.closesInDays} days` : '';
  return (
    <div className="hero-slide">
      <Photo media={o.media} className="hero-photo" />
      <div className="hero-scrim" />
      <motion.div className="hero-content" {...stagger(0)}>
        <span className="hero-pill">{sent ?? `${kindLabel[o.kind]}${closing}`}</span>
        <h2 className="hero-title">{o.role}</h2>
        <p className="hero-line">
          <Byline o={o} />
          <span>· {o.projectType.split(' · ')[0]}</span>
        </p>
        <p className="hero-line hero-line--quiet">{o.highlight ?? `${o.city} · ${o.dates}`}</p>
        <div className="hero-actions">
          <Button variant="light" onClick={onOpen}>
            View role
          </Button>
          <span className="hero-save">
            <SaveButton id={o.id} floating name={`${o.role} role`} />
          </span>
        </div>
      </motion.div>
    </div>
  );
}

