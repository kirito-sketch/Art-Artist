import { motion } from 'framer-motion';
import { BadgeCheck, Bell, Bookmark, CheckCircle2, ChevronDown, ChevronRight, RotateCcw, Users } from 'lucide-react';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { craftDef } from '../../data/crafts';
import type { Opportunity, Person } from '../../data/types';
import { useStore } from '../../state/store';
import { HOME_ORDER, intentDef, opportunitiesFor, peopleFor, projectsFor, type HomeSection } from '../../domain/relevance';
import { FrameLabel, PortraitCard, PosterTile } from '../../ui/compose';
import { forYou, kindLabel, networkFor, org, person } from '../../state/selectors';
import { OfflineBanner, PublishBar } from '../../ui/chrome';
import { shared, spring, stagger } from '../../ui/motion';
import { Button, FollowButton, IconButton, Photo, PressCard, Pressable, SectionHeader, Skeleton, Verified } from '../../ui/primitives';
import { Logo } from '../../ui/Logo';
import { NetworkRow } from './NetworkActivity';
import { Byline, FeaturedCard, SaveButton, useSentLabel } from './OpportunityCard';
import { FirstStep, Resolve, useWorldForming, WorldIntro } from './FirstHome';

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
      <span className="home-logo">
        <Logo />
      </span>
      <span className="flex" />
      <IconButton label="Saved" className="icon-btn--float" onClick={() => push({ name: 'saved' })}>
        <Bookmark size={19} />
      </IconButton>
      <IconButton label="Notifications" className="icon-btn--float" onClick={() => openSheet({ name: 'notifications' })}>
        <Bell size={19} />
        {unread && <span className="dot" />}
      </IconButton>
    </header>
  );

  /*
   * V30 (docs/V30.md): Home answers "what matters to me right now?", not "what is inside Art and
   * Artist?". Four sections, the same for everyone; the person's intent decides their order and the
   * ranking inside them, and every block says why it is there. Posts, craft tiles and houses moved to
   * Discover, where browsing is deliberate.
   */
  const sections: Record<HomeSection, ReactNode> = {
    forYou: <ForYou key="forYou" goDiscover={goDiscover} />,
    people: <PeopleFor key="people" goDiscover={goDiscover} />,
    activity: <Activity key="activity" />,
    projects: <ActiveProjects key="projects" goDiscover={goDiscover} />,
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

          {first && cards && <WorldIntro forming={forming} />}
          <IntentBar me={me} />
          {first && <FirstStep />}

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
            HOME_ORDER[intent].map((id, i) =>
              first ? (
                <Resolve key={id} forming={forming} i={i}>
                  {sections[id]}
                </Resolve>
              ) : (
                sections[id]
              ),
            )
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
 * Why Home looks the way it does, in one line, and the one control that changes it. Intent is a
 * state, not an identity: the same person moves between finding work, hiring and not looking.
 */
function IntentBar({ me }: { me: Person }) {
  const { intent, openSheet } = useStore();
  const craft = craftDef(me.craft)?.person ?? me.role;
  return (
    <Pressable className="intent-bar" onClick={() => openSheet({ name: 'intent' })} scale={0.99} aria-label={`Showing what matters for: ${intentDef(intent).label}. Change`}>
      <span className="intent-bar-text">
        <span className="intent-bar-kicker">
          {craft}
          {me.city ? ` in ${me.city}` : ''}
        </span>
        <span className="intent-bar-value">
          <span className="intent-bar-prefix">Showing: </span>
          {intentDef(intent).label}
        </span>
      </span>
      <span className="intent-bar-change">
        Change <ChevronDown size={15} />
      </span>
    </Pressable>
  );
}

/** For you: roles, casting and collaboration requests that fit this person. Not every craft "applies for roles", so the title stays general. */
function ForYou({ goDiscover }: { goDiscover: (scope?: string) => void }) {
  const { viewer, scenario, push, userCollabs, roleStatus, intent, setScenario } = useStore();
  const me = person(viewer.id);
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
  const ranked = scenario.newUser ? forYou(viewer, scenario).map((o) => ({ item: o, why: 'Your craft' })) : opportunitiesFor(me, intent, userCollabs, roleStatus as Record<string, unknown>).slice(0, 6);
  const near = ranked.some((r) => r.why.includes(me.city));
  return (
    <section className="v-section cards-roles" data-world="roles">
      <SectionHeader title={intent === 'collaborate' ? 'Collaborations and roles for you' : 'Opportunities for you'} action="See all" onAction={() => goDiscover('roles')} />
      <p className="world-why">{ranked.length ? `Matched on your craft${near ? ' and city' : ''}. Roles, casting and collaborations; everything else is in Discover.` : 'Nothing matches your craft right now. New roles and collaborations appear as people post them.'}</p>
      {ranked.length > 0 && (
        <div className="carousel carousel--roles">
          {ranked.map(({ item: o }, i) => (
            <motion.div key={o.id} className="carousel-item" {...stagger(i, 0.05)}>
              <FeaturedCard o={o} onOpen={() => push({ name: 'opportunity', id: o.id, from: 'card' })} />
            </motion.div>
          ))}
        </div>
      )}
      {!ranked.length && (
        <Button variant="secondary" size="s" onClick={() => goDiscover('roles')}>
          Browse all opportunities
        </Button>
      )}
    </section>
  );
}

/** People you may want to work with, ranked for what you are doing now, each with the reason they are here. */
function PeopleFor({ goDiscover }: { goDiscover: (scope?: string) => void }) {
  const { viewer, following, toggleFollow, push, intent } = useStore();
  const me = person(viewer.id);
  const list = peopleFor(me, intent, following).slice(0, 8);
  if (!list.length) return null;
  const team = intent === 'hire' || intent === 'collaborate';
  return (
    <section className="v-section" data-world="people">
      <SectionHeader title={team ? 'People you could work with' : 'People worth knowing'} action="See all" onAction={() => goDiscover('people')} />
      <p className="world-why">{team ? 'Other crafts, available and nearby first. Save people to keep a shortlist.' : intent === 'work' ? 'People in your craft, and the directors and producers who hire.' : 'People in your craft and city.'}</p>
      <div className="portrait-rail">
        {list.map(({ item: p, why }) => (
          <PortraitCard
            key={p.id}
            person={p}
            context={
              p.availableFrom && !team ? (
                <>
                  <span className="status-dot is-on" /> Available from {p.availableFrom}
                </>
              ) : (
                why
              )
            }
            onPress={() => push({ name: 'profile', id: p.id })}
            action={team ? <PersonSave id={p.id} name={p.name} /> : <FollowButton on={following.includes(p.id)} onToggle={() => toggleFollow(p.id)} name={p.name} block />}
          />
        ))}
      </div>
    </section>
  );
}

/** Save a person: a private shortlist for hiring and collaborating. They are not told. */
export function PersonSave({ id, name, block = true }: { id: string; name: string; block?: boolean }) {
  const { isSaved, toggleSave } = useStore();
  const on = isSaved('person', id);
  return (
    <Button
      size="s"
      block={block}
      variant={on ? 'secondary' : 'outline'}
      icon={<Bookmark size={14} fill={on ? 'currentColor' : 'none'} />}
      aria-pressed={on}
      aria-label={on ? `Remove ${name} from Saved` : `Save ${name}`}
      onClick={(e) => {
        e.stopPropagation();
        toggleSave(id, 'person');
      }}
    >
      {on ? 'Saved' : 'Save'}
    </Button>
  );
}

/**
 * Activity that matters: things that need your attention or change what you might do. Credits to
 * confirm and interest in your posts come first; then professional updates from your network
 * (credits, projects, availability, collaboration requests). Portfolio and reel uploads are not here:
 * this is not a feed.
 */
function Activity() {
  const { viewer, scenario, pendingCredits, interestsReceived, openSheet, push, intent } = useStore();
  const events = networkFor(viewer, scenario).filter((e) => e.kind !== 'portfolio' && e.kind !== 'reel');
  const toConfirm = pendingCredits.filter((c) => !c.correction);
  const waiting = interestsReceived.filter((i) => !i.withdrawn && !i.review);
  const actions: { id: string; text: ReactNode; meta: string; go: () => void }[] = [];
  if (toConfirm.length)
    actions.push({
      id: 'credits',
      text: toConfirm.length === 1 ? (
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
  const limit = intent === 'hire' || intent === 'explore' ? 4 : 3;
  if (!actions.length && !events.length) return null;
  return (
    <section className="v-section" data-world="activity">
      <SectionHeader title="Activity that matters" action={events.length > limit ? 'See all' : undefined} onAction={() => push({ name: 'network' })} />
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
        {events.slice(0, Math.max(0, limit - actions.length)).map((e, i) => (
          <NetworkRow key={e.id} e={e} index={i} />
        ))}
      </div>
    </section>
  );
}

/**
 * Active projects: films and series being made now, by verified productions. Projects you can still
 * be part of, hiring first and nearby next. (V29's "Projects to watch" read as something to stream.)
 */
function ActiveProjects({ goDiscover }: { goDiscover: (scope?: string) => void }) {
  const { viewer, push, roleStatus } = useStore();
  const me = person(viewer.id);
  const list = projectsFor(me, roleStatus as Record<string, unknown>).slice(0, 6);
  if (!list.length) return null;
  return (
    <section className="v-section" data-world="projects">
      <SectionHeader title="Active projects" action="See all" onAction={() => goDiscover('projects')} />
      <p className="world-why">Being made now by verified productions. Hiring first.</p>
      <div className="poster-rail">
        {list.map(({ w, hiring }, i) => (
          <PosterTile
            key={w.id}
            lead={i === 0}
            media={w.media.id === 'ph' ? undefined : w.stills[0] ?? w.media}
            title={w.title}
            meta={
              <>
                {org(w.orgIds[0]).name} <Verified size={12} />
                {hiring ? ` · Hiring ${hiring}` : ''}
              </>
            }
            label={<FrameLabel>{w.stage}</FrameLabel>}
            sharedId={w.media.id === 'ph' ? undefined : shared.work(w.id)}
            onPress={() => push({ name: 'work', id: w.id, from: 'card' })}
          />
        ))}
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
            <SaveButton id={o.id} floating />
          </span>
        </div>
      </motion.div>
    </div>
  );
}

