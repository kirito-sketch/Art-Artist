import { motion } from 'framer-motion';
import { Bell, CheckCircle2, Clapperboard, RotateCcw } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import * as seed from '../../data/seed';
import type { Opportunity } from '../../data/types';
import { useStore } from '../../state/store';
import { blockedBy, discoverableProjects, discoverableRoles, publicCreditsFor, searchableHouses } from '../../domain/discovery';
import { project as wproject, worksForOrg } from '../../state/world';
import { isLive } from '../../data/works';
import { CRAFT_OBJECTS } from '../../ui/craft';
import { FrameLabel, HouseFeature, ObjectTile, PortraitCard, PosterTile } from '../../ui/compose';
import { forYou, kindLabel, networkFor, org, person, postsFor } from '../../state/selectors';
import { OfflineBanner, PublishBar } from '../../ui/chrome';
import { shared, spring, stagger } from '../../ui/motion';
import { Avatar, Button, FollowButton, IconButton, Photo, PressCard, Row, SectionHeader, Skeleton, Verified } from '../../ui/primitives';
import { Logo } from '../../ui/Logo';
import { NetworkRow } from './NetworkActivity';
import { Byline, FeaturedCard, SaveButton, useSentLabel } from './OpportunityCard';
import { PostCard } from './PostCard';
import { FirstPeople, FirstRoles, FirstStep, Resolve, useWorldForming, WorldIntro } from './FirstHome';

const NETWORK_LIMIT = 4;
const POSTS_LIMIT = 2;
const HERO_HEIGHT = 600;

/**
 * Home: the roles matched to you fill the first screen as full-bleed slides; everything else sits on a
 * sheet below. The header floats over the photo and turns solid once you scroll past it.
 */
export function HomeScreen({ goDiscover }: { goDiscover: (scope?: string) => void }) {
  const store = useStore();
  const { viewer, scenario, openSheet, notifications, reloadKey, push, setHero, homeLayout } = store;
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollY, setScrollY] = useState(0);
  const loading = scenario.loading;
  const opps = forYou(viewer, scenario);
  const events = networkFor(viewer, scenario);
  const posts = postsFor(viewer, scenario, store.following, store.userPosts);
  const unread = notifications.some((n) => n.unread);
  const cards = homeLayout === 'cards';
  // First session: a person just out of onboarding (or the "New user" test state). No network yet.
  const first = cards && !loading && (store.isNewPerson || scenario.newUser);
  const forming = useWorldForming(first);
  const hasHero = !cards && !loading && !scenario.forYouError && opps.length > 0;
  const solid = !hasHero || scrollY > 40;

  useEffect(() => {
    setHero('home', !solid);
    return () => setHero('home', false);
  }, [solid, setHero]);

  const publishingId = store.publishing?.id;
  useEffect(() => {
    if (publishingId) scrollRef.current?.scrollTo({ top: HERO_HEIGHT - 40, behavior: 'smooth' });
  }, [publishingId]);

  // Cards layout: the header is part of the page, on the same paper, and scrolls away with it.
  const header = (className: string) => (
    <header className={`home-header ${className}`}>
      <span className="home-logo">
        <Logo />
      </span>
      <span className="flex" />
      <IconButton label="Notifications" className="icon-btn--float" onClick={() => openSheet({ name: 'notifications' })}>
        <Bell size={19} />
        {unread && <span className="dot" />}
      </IconButton>
    </header>
  );

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
            <p className="item-title">Couldn't load your roles</p>
            <Button variant="secondary" size="s" icon={<RotateCcw size={14} />} onClick={() => store.setScenario({ forYouError: false })}>
              Retry
            </Button>
          </div>
        ) : opps.length ? (
          <HeroRail opps={opps} scrollY={scrollY} onOpen={(id) => push({ name: 'opportunity', id })} />
        ) : (
          <div className="hero hero--empty">
            <p className="item-title">No roles match your dates this week</p>
            <Button variant="secondary" size="s" onClick={() => store.setTab('profile')}>
              Update your availability
            </Button>
          </div>
        )}

        <div className={`home-sheet ${hasHero ? '' : 'home-sheet--flat'}`}>
          <OfflineBanner />
          <PublishBar />

          {first ? (
            <>
              <WorldIntro goDiscover={goDiscover} forming={forming} />
              <Resolve forming={forming} i={0}>
                <FirstRoles goDiscover={goDiscover} />
              </Resolve>
              <Resolve forming={forming} i={1}>
                <FirstPeople />
              </Resolve>
              <Resolve forming={forming} i={2}>
                <FirstStep />
                <ProjectsToWatch title="Projects worth exploring" world="projects" />
                <HousesOnAna world="houses" />
              </Resolve>
            </>
          ) : (
            <>
          {cards && (
            <section className="cards-roles">
              <SectionHeader title="Roles for you" action={opps.length ? 'See all' : undefined} onAction={() => goDiscover('roles')} />
              {loading ? (
                <div className="carousel carousel--roles">
                  {[0, 1].map((i) => (
                    <div key={i} className="carousel-item">
                      <Skeleton h={420} r={28} />
                    </div>
                  ))}
                </div>
              ) : scenario.forYouError ? (
                <div className="inline-error inline-error--flush">
                  <p>Couldn't load your roles.</p>
                  <Button variant="secondary" size="s" onClick={() => store.setScenario({ forYouError: false })}>
                    Retry
                  </Button>
                </div>
              ) : opps.length ? (
                <div className="carousel carousel--roles">
                  {opps.map((o, i) => (
                    <motion.div key={o.id} className="carousel-item" {...stagger(i, 0.05)}>
                      <FeaturedCard o={o} onOpen={() => push({ name: 'opportunity', id: o.id, from: 'card' })} />
                    </motion.div>
                  ))}
                </div>
              ) : (
                <p className="meta">{store.isNewPerson ? 'Few roles match you yet. More appear as productions post.' : 'No roles match your dates this week.'}</p>
              )}
            </section>
          )}

          {hasHero && (
            <div className="group">
              <Row icon={<Clapperboard size={20} />} label="All open roles" value={String(discoverableRoles(viewer.id).length)} onPress={() => goDiscover('roles')} />
            </div>
          )}

          {!cards && store.isNewPerson && !loading && <FirstRun />}

          {cards && !loading && <PeopleWorthKnowing />}

          {loading ? null : events.length ? (
            <section className={cards ? 'v-section' : 'section section--flush'}>
              <SectionHeader title="From your network" action={events.length > NETWORK_LIMIT ? 'See all' : undefined} onAction={() => push({ name: 'network' })} />
              <div className="list list--flush">
                {events.slice(0, NETWORK_LIMIT).map((e, i) => (
                  <NetworkRow key={e.id} e={e} index={i} />
                ))}
              </div>
            </section>
          ) : cards ? null : (
            <SuggestedPeople />
          )}

          {cards && !loading && (
            <>
              <ExploreCraft goDiscover={goDiscover} />
              <ProjectsToWatch />
              <HousesOnAna />
            </>
          )}

          {!loading && posts.length > 0 && (
            <section className={cards ? 'v-section' : 'section section--flush'}>
              <SectionHeader title="Latest posts" action={posts.length > POSTS_LIMIT ? 'See all' : undefined} onAction={() => goDiscover('posts')} />
              <div className="list list--flush">
                {posts.slice(0, POSTS_LIMIT).map((p) => (
                  <PostCard key={p.id} post={p} />
                ))}
              </div>
            </section>
          )}

            </>
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

/** A new account has no network yet, so the section offers people in the same craft and city instead. */
function SuggestedPeople() {
  const { viewer, following, toggleFollow, push } = useStore();
  const blocked = blockedBy(viewer.id);
  const ids = (seed.suggestedFor[viewer.id] ?? []).filter((id) => !blocked.includes(id));
  if (!ids.length) return null;
  return (
    <section className="section section--flush">
      <SectionHeader title="People to follow" />
      <div className="list list--flush">
        {ids.slice(0, 4).map((id) => {
          const p = person(id);
          const on = following.includes(id);
          return (
            <PressCard key={id} className="prow" onPress={() => push({ name: 'profile', id })} scale={0.985}>
              <Avatar party={p} size={44} available={!!p.availableFrom} />
              <div className="prow-text">
                <p className="item-title">{p.name}</p>
                <p className="meta">
                  {p.role} · {p.city}
                </p>
              </div>
              <FollowButton on={on} onToggle={() => toggleFollow(id)} name={p.name} />
            </PressCard>
          );
        })}
      </div>
    </section>
  );
}

/** A new person's first Home: real matches only, and one thing worth doing next. No fake activity. */
function FirstRun() {
  const { viewer, push, userPortfolio } = useStore();
  const me = person(viewer.id);
  const [dismissed, setDismissed] = useState(false);
  const houses = searchableHouses(blockedBy(viewer.id)).sort((a, b) => Number(b.city === me.city) - Number(a.city === me.city)).slice(0, 3);
  const hasWork = (seed.portfolio[viewer.id]?.length ?? 0) + userPortfolio.length > 0;
  const next = !hasWork ? { t: 'Add your work', b: 'Stills or a reel help productions understand what you do.' } : { t: 'Add a short bio', b: 'Two lines on the work you do and the work you want.' };
  return (
    <>
      {!dismissed && (
        <div className="setup-card">
          <div>
            <p className="item-title">{next.t}</p>
            <p className="meta">{next.b}</p>
          </div>
          <div className="setup-card-actions">
            <Button size="s" onClick={() => push({ name: 'editProfile' })}>
              Add
            </Button>
            <button className="link link--muted" onClick={() => setDismissed(true)}>
              Later
            </button>
          </div>
        </div>
      )}
      <section className="section section--flush">
        <SectionHeader title={houses.some((h) => h.city === me.city) ? `Productions in ${me.city}` : 'Productions on Art and Artist'} />
        <div className="list list--flush">
          {houses.map((o) => (
            <PressCard key={o.id} className="prow" onPress={() => push({ name: 'org', id: o.id })} scale={0.985}>
              <Avatar party={o} size={44} />
              <div className="prow-text">
                <p className="item-title">
                  {o.name} <Verified size={12} />
                </p>
                <p className="meta">{o.about}</p>
              </div>
            </PressCard>
          ))}
        </div>
      </section>
    </>
  );
}

/* ---------------------------------------------------------- Large Cards composition */

/** Portrait Cards: people worth knowing, each led by their own photo, with one line of real context. */
function PeopleWorthKnowing() {
  const { viewer, following, toggleFollow, push } = useStore();
  const blocked = blockedBy(viewer.id);
  const ids = (seed.suggestedFor[viewer.id] ?? []).filter((id) => !blocked.includes(id));
  if (!ids.length) return null;
  return (
    <section className="v-section">
      <SectionHeader title="People worth knowing" />
      <div className="portrait-rail">
        {ids.map((id) => {
          const p = person(id);
          const credit = publicCreditsFor(id)[0];
          const w = credit ? wproject(credit.projectId) : undefined;
          const on = following.includes(id);
          return (
            <PortraitCard
              key={id}
              person={p}
              context={
                p.availableFrom ? (
                  <>
                    <span className="status-dot is-on" /> Available from {p.availableFrom}
                  </>
                ) : w ? (
                  `Credited on ${w.publicTitle ?? w.workingTitle}`
                ) : (
                  p.city
                )
              }
              onPress={() => push({ name: 'profile', id })}
              action={
                <FollowButton on={on} onToggle={() => toggleFollow(id)} name={p.name} block />
              }
            />
          );
        })}
      </div>
    </section>
  );
}

/** Object Tiles: the brand moment. The crafts, represented by their tools. */
function ExploreCraft({ goDiscover }: { goDiscover: (scope?: string) => void }) {
  const { viewer } = useStore();
  const roles = discoverableRoles(viewer.id);
  return (
    <section className="band band--sand">
      <SectionHeader title="Explore your craft" />
      <p className="band-sub">Roles, people and work, by the tools of the trade.</p>
      <div className="object-grid">
        {CRAFT_OBJECTS.map((c) => {
          const n = roles.filter((r) => r.forCrafts.some((f) => c.crafts.includes(f))).length;
          return <ObjectTile key={c.kind} kind={c.kind} label={c.label} asset={c.asset} meta={n ? `${n} open ${n === 1 ? 'role' : 'roles'}` : 'People and work'} onPress={() => goDiscover('roles')} />;
        })}
      </div>
    </section>
  );
}

/** Poster / Stills rail: the work leads. The first project is set larger to break the rhythm. */
function ProjectsToWatch({ title = 'Projects to watch', world }: { title?: string; world?: string }) {
  const { viewer, push } = useStore();
  const works = discoverableProjects(blockedBy(viewer.id)).filter((w) => w.ownerId !== viewer.id && w.orgIds.length);
  const ordered = [...works.filter(isLive), ...works.filter((w) => !isLive(w))].slice(0, 6);
  if (!ordered.length) return null;
  return (
    <section className="v-section" data-world={world}>
      <SectionHeader title={title} />
      <div className="poster-rail">
        {ordered.map((w, i) => (
          <PosterTile
            key={w.id}
            lead={i === 0}
            media={w.media.id === 'ph' ? undefined : w.stills[0] ?? w.media}
            title={w.title}
            meta={
              <>
                {org(w.orgIds[0]).name} <Verified size={12} />
              </>
            }
            label={<FrameLabel>{isLive(w) ? w.stage : w.year}</FrameLabel>}
            sharedId={w.media.id === 'ph' ? undefined : shared.work(w.id)}
            onPress={() => push({ name: 'work', id: w.id, from: 'card' })}
          />
        ))}
      </div>
    </section>
  );
}

/** Wide editorial cards: a production house is shown by what it is making. */
function HousesOnAna({ world }: { world?: string }) {
  const { viewer, push } = useStore();
  const city = person(viewer.id).city;
  const houses = searchableHouses(blockedBy(viewer.id))
    .map((o) => ({ o, ws: worksForOrg(o.id) }))
    .filter((x) => x.ws.length)
    // Houses in your city first, then those making something now.
    .sort((a, b) => Number(b.o.city === city) - Number(a.o.city === city) || Number(b.ws.some(isLive)) - Number(a.ws.some(isLive)))
    .slice(0, 2);
  if (!houses.length) return null;
  return (
    <section className="v-section" data-world={world}>
      <SectionHeader title={world && houses.every((h) => h.o.city === city) ? `Production houses in ${city}` : 'Production houses'} />
      {houses.map(({ o, ws }) => {
        const live = ws.find(isLive);
        const lead = live ?? ws[0];
        const hiring = discoverableRoles(viewer.id).filter((r) => r.orgId === o.id).length;
        return (
          <HouseFeature
            key={o.id}
            house={o}
           
            line={live ? `Now making ${live.title}${hiring ? ` · Hiring ${hiring}` : ''}` : `${lead.title}, ${lead.year}`}
            label={<FrameLabel>{live ? live.stage : lead.year}</FrameLabel>}
            onPress={() => push({ name: 'org', id: o.id })}
          />
        );
      })}
    </section>
  );
}
