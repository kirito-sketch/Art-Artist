import { Bell, MapPin, Play, Plus, Check } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as seed from '../../data/seed';
import { CRAFTS } from '../../data/crafts';
import { familyOf, nearCrafts } from '../../data/taxonomy';
import type { IndustryEvent, Media, Opportunity, Person } from '../../data/types';
import { type Work } from '../../data/works';
import { outThisWeek } from '../reviews/ReviewsScreen';
import { featuredFor, ScoreLine } from '../reviews/reviewUnits';
import { blockedBy, discoverableProjects, discoverableRoles, searchablePeople } from '../../domain/discovery';
import { workedWith } from '../../domain/home/graph';
import type { DiscoverChip } from '../../domain/contentTypes';
import { discoverPosts, networkFor, org, party, person } from '../../state/selectors';
import { useStore } from '../../state/store';
import { visibleEvents } from '../../state/events';
import { reviewsOf, work, world } from '../../state/world';
import { typeLabel, whenLabel } from '../../domain/events';
import { eventsTitle, rankHomeEvents } from '../../domain/eventRank';
import { markOpened, markShown, readSeen } from '../../state/eventSeen';
import { useAtmosphere, useLowPower } from '../../ui/ambient/ambient';
import { LivingBackground } from '../../ui/ambient/LivingBackground';
import { OfflineBanner, PublishBar } from '../../ui/chrome';
import { useFeatures } from '../../ui/features';
import { Avatar, IconButton, PersonPhoto, Photo, PressCard, Pressable, SectionHeader } from '../../ui/primitives';
import { SaveButton } from './OpportunityCard';
import { eventArt } from '../../state/eventArt';
import { FirstStep } from './FirstHome';
import { spotCard, spotlightFor, thisWeekFor, weekCard, type SpotCard, type WeekCard } from './districtFeed';
import { WeekSpotlight } from './WeekSpotlight';
import { NetworkCollections } from './NetworkActivity';
import { PersonCard } from '../../ui/PersonCard';
import { HOME_PREVIEW, WEEK_TEST } from '../../ui/preview';
import { useSpotlightCarousel } from '../../ui/useSpotlightCarousel';
import { Sheet } from '../../ui/Sheet';

/*
 * The District version of Home (docs/DISTRICT.md, docs/DISTRICT_FIXES.md): where you are, what the app offers
 * (tiles, each opening Discover on its chip), then shelves that each do a different job: the Spotlight (the few
 * time-sensitive things this week, of mixed kinds), the shelf for why you're here, new work from people you know
 * first, events, the week's films, people near you, and an end. Nothing appears twice: anything in the Spotlight
 * is left out of the shelves below it.
 */

type Go = { discover: (chip?: DiscoverChip) => void };

const first = (name: string) => name.split(' ')[0];
const CLIPS = new Set(['neela', 'kaaval', 'backwaters', 'monsoon', 'faultlines', 'neeliraat']);

function motionOk() {
  if (typeof window === 'undefined') return false;
  if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return false;
  return !(navigator as unknown as { connection?: { saveData?: boolean } }).connection?.saveData;
}

export function DistrictHome({ go }: { go: Go }) {
  const store = useStore();
  const { viewer, push, notifications, openSheet, events, following, userPosts, saved, userCollabs, roleStatus, acting, reloadKey, intent, tab, sheet, stack, scenario, mayReview } = store;
  const features = useFeatures();
  const me = person(viewer.id);
  const unread = notifications.filter((n) => n.unread).length;
  const family = familyOf(me.craft);
  const craftLabel = CRAFTS.find((c) => c.id === me.craft)?.label ?? '';
  const myCrafts = [me.craft, ...(me.crafts ?? [])];
  const blocked = blockedBy(me.id);
  const now = Date.now();

  const projects = useMemo(() => discoverableProjects(blocked).filter((w) => w.media.id !== 'ph' && !w.ownerId), [me.id]); // eslint-disable-line react-hooks/exhaustive-deps
  const roles = discoverableRoles(me.id, userCollabs).filter((o) => !roleStatus[o.id] && !world.roleStatus[o.id]);
  const rolesOf = (w: Work) => roles.filter((o) => ('projectId' in o && (o as { projectId?: string }).projectId === w.id) || o.project === w.title);
  const allPosts = discoverPosts(viewer, following, userPosts).filter((p) => p.media.length && p.authorId !== me.id);
  const pool = features.events ? visibleEvents(events, now, viewer.id, acting) : [];
  const thisWeekReleases = outThisWeek(now);

  // The Spotlight: chosen once for the session; a save, follow or block chooses again.
  const network = [...workedWith(me.id)];
  const spotlit = spotlightFor(
    { now, me, roles, projects, rolesOf, posts: allPosts, events: pool.filter(e => e.id !== seed.HOME_REQUEST_EVENT_ID), releases: thisWeekReleases },
    { city: me.city, crafts: myCrafts, languages: me.languages ?? [], network, following, blocked },
    [saved.map((x) => x.id).join(), following.join(), blocked.join()].join('|'),
  );
  // Spotlight becomes "This week", notable things only (docs/HOME_SPOTLIGHT.md).
  const week: WeekCard[] = HOME_PREVIEW
    ? thisWeekFor(
        { now, me, roles, projects, rolesOf, posts: allPosts, events: pool.filter((e) => e.id !== seed.HOME_REQUEST_EVENT_ID), releases: thisWeekReleases },
        { city: me.city, crafts: myCrafts, languages: me.languages ?? [], network, following, blocked },
        [saved.map((x) => x.id).join(), following.join(), blocked.join()].join('|'),
      )
        .map((it) => weekCard(it, { roles, events: pool, me, network, following, quote: (id) => { const f = featuredFor(id); return f?.text ? { text: f.text, by: person(f.personId).name } : undefined; } }))
        .filter((c): c is WeekCard => !!c)
        .map((c) => (c.media || c.type !== 'event' ? c : { ...c, media: eventArt(pool.find((e) => `event:${e.id}` === c.key)!) }))
        .map((c) => (WEEK_TEST === 'noimg' ? { ...c, media: undefined } : c))
        .slice(0, WEEK_TEST === '1' ? 1 : WEEK_TEST === '2' ? 2 : undefined)
    : [];
  const shown = new Set((HOME_PREVIEW ? week : spotlit).map((x) => x.key));
  const quote = (id: string) => {
    const f = featuredFor(id);
    return f?.text ? { text: f.text, by: person(f.personId).name } : undefined;
  };
  const cards = spotlit
    .map((it) => spotCard(it, { roles, posts: allPosts, events: pool, meId: me.id, city: me.city, quote }))
    .filter((c): c is SpotCard => !!c)
    .map((c) => (c.media || c.key.split(':')[0] !== 'event' ? c : { ...c, media: eventArt(pool.find((e) => `event:${e.id}` === c.key)!) }));

  // New work: people you follow or worked with first, then your department, then everyone.
  const posts = useMemo(() => {
    const known = new Set([...network, ...following]);
    const tier = (authorId: string) => (known.has(authorId) ? 0 : family.crafts.includes((party(authorId) as Person | undefined)?.craft as never) ? 1 : 2);
    return allPosts
      .filter((p) => !shown.has(`post:${p.id}`))
      .map((p, i) => ({ p, i }))
      .sort((a, b) => tier(a.p.authorId) - tier(b.p.authorId) || a.i - b.i)
      .map((x) => x.p)
      .slice(0, 3);
  }, [allPosts.length, following.join(), spotlit]); // eslint-disable-line react-hooks/exhaustive-deps

  // Home's three events: chosen for this person (docs/REVIEW_EVENTS_PROFILE.md §2), fixed for the session, minus the Spotlight's.
  const interestedIds = saved.filter((x) => x.kind === 'event').map((x) => x.id);
  const eventPool = pool.filter((e) => !shown.has(`event:${e.id}`));
  const rankedEvents = features.events ? homeEvents(eventPool, me, following, interestedIds, blocked, now) : [];
  // Keep one concrete request-to-attend example in the Home event shelf of this prototype.
  const requestExample = eventPool.find(e => e.id === seed.HOME_REQUEST_EVENT_ID && e.status === 'scheduled' && !blocked.includes(e.hostId));
  const upcoming = requestExample ? [requestExample, ...rankedEvents.filter(e => e.id !== requestExample.id && e.hostId !== requestExample.hostId)].slice(0, 3) : rankedEvents;
  const friday = thisWeekReleases.filter((w) => !shown.has(`release:${w.id}`));

  const continueItems = saved
    .filter((s) => !HOME_PREVIEW || now - s.at < 7 * 864e5)
    .slice()
    .reverse()
    .map((s) => {
      if (s.kind === 'role') {
        const o = roles.find((x) => x.id === s.id) ?? seed.opportunities.find((x) => x.id === s.id);
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
    .slice(0, 6) as { key: string; img?: Media; party?: ReturnType<typeof party>; label: string; round: boolean; open: () => void }[];

  // People near you: your department first, then the departments you work beside; available people first in each.
  const near = useMemo(() => {
    const close = nearCrafts(me.craft);
    const tier = (p: Person) => (family.crafts.includes(p.craft) || myCrafts.includes(p.craft) ? 0 : close.includes(p.craft) ? 1 : 2);
    return searchablePeople(me.id, blocked)
      .filter((p) => p.city === me.city && tier(p) < 2)
      .sort((a, b) => tier(a) - tier(b) || Number(!!b.availableFrom) - Number(!!a.availableFrom));
  }, [me.id, me.city, me.craft]); // eslint-disable-line react-hooks/exhaustive-deps

  const [spot, setSpot] = useState(0);
  const [spotlightAll, setSpotlightAll] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const atmosphere = useAtmosphere();

  const tiles: { key: string; label: string; icon: string; open: () => void; wide?: boolean }[] = [
    ...(features.events ? [{ key: 'events', label: 'Events', icon: 'events', open: () => go.discover('events') }] : []),
    { key: 'projects', label: 'Projects', icon: 'projects', open: () => go.discover('projects') },
    { key: 'people', label: 'People', icon: 'people', open: () => go.discover('people') },
    { key: 'roles', label: 'Opportunities', icon: 'crews', open: () => go.discover('roles'), wide: true },
    { key: 'reviews', label: 'Reviews', icon: 'reviews', open: () => go.discover('reviews'), wide: true },
  ];

  // ---------------------------------------------------------------- The Home (docs/HOME_SPOTLIGHT.md); ?home-previous keeps the earlier one below
  // Same data and rules as below; only the order and three blocks change: compact shortcuts, This week (Spotlight
  // Direction A), From your network, Film talk and a compact People near you.
  if (HOME_PREVIEW) {
    const chips = [tiles.find((t) => t.key === 'roles'), tiles.find((t) => t.key === 'people'), tiles.find((t) => t.key === 'projects'), tiles.find((t) => t.key === 'events'), tiles.find((t) => t.key === 'reviews')].filter(Boolean) as typeof tiles;
    const net = networkFor(viewer, scenario).slice(0, 10);
    const reviewable = [...thisWeekReleases].find((w) => mayReview(w.id) && !reviewsOf(w.id).some((r) => r.personId === viewer.id));
    const peopleRail = near.length >= 2 && (
      <section className="dh-sec" aria-label="People near you">
        <SectionHeader title="People near you" action={near.length > 6 ? 'See all' : undefined} onAction={() => go.discover('people')} className="dh-pad" />
        <div className="pcards" role="group" aria-label="People near you">
          {near.slice(0, 8).map((p) => <PersonCard key={p.id} p={p} />)}
        </div>
      </section>
    );
    return (
      <>
      {atmosphere && <LivingBackground scrollRef={scrollRef} />}
      <div className={`screen canvas v-home dh dh--next${atmosphere ? ' has-ambient' : ''}`} ref={scrollRef} data-scroll="home" key={`${viewer.id}-${reloadKey}`}>
        <div className="dh-wash">
          <header className="dh-head">
            <h1 className="sr-only">Home</h1>
            <MapPin size={20} className="dh-pin" aria-hidden />
            <div className="dh-loc"><b>{me.city}</b></div>
            <span className="flex" />
            <IconButton label={unread ? `Notifications, ${unread} new` : 'Notifications'} onClick={() => openSheet({ name: 'notifications' })}>
              <Bell size={21} aria-hidden />
              {unread > 0 && <span className="dot" aria-hidden />}
            </IconButton>
          </header>
          <OfflineBanner />
          <PublishBar />
          <nav className="dh-dtiles" aria-label="Explore">
            {chips.map((t, i) => (
              <PressCard key={t.key} className={`dh-dtile dh-dtile--${t.key} ${i < 3 ? 'dh-dtile--big' : 'dh-dtile--wide'}`} onPress={t.open} scale={0.96} aria-label={t.label}>
                <img src={`/images/tiles/${t.icon}.webp`} alt="" draggable={false} />
                <b>{t.label}</b>
              </PressCard>
            ))}
          </nav>
          {continueItems.length > 0 && (
            <div className="dh-rail dh-pills dh-continue" role="group" aria-label="Continue where you left off">
              {continueItems.map((c) => (
                <PressCard key={c.key} className="dh-pill" onPress={c.open} scale={0.97} aria-label={`Continue: ${c.label}`}>
                  {c.party ? <Avatar party={c.party} size={26} /> : <Photo surface="spotlight" media={c.img} showPlay={false} className="dh-pill-img" />}
                  <span>{c.label}</span>
                </PressCard>
              ))}
            </div>
          )}
        </div>

        {week.length > 0 && (
          <section className="dh-sec dh-week" aria-label="This week">
            <SectionHeader title="This week" className="dh-pad" />
            <WeekSpotlight cards={week} active={tab === 'home' && !sheet && stack.length === 0} />
          </section>
        )}

        <IntentShelf intent={intent} me={me} roles={roles.filter((o) => !shown.has(`role:${o.id}`) && o.authorId !== me.id)} blocked={blocked} go={go} toKnow={near.filter((p) => !following.includes(p.id))} />

        <div className="dh-pad">
          <FirstStep />
        </div>

        {net.length > 0 ? (
          <section className="dh-sec" aria-label="From your network">
            <SectionHeader title="From your network" className="dh-pad" action="See all" onAction={() => push({ name: 'network' })} />
            <NetworkCollections events={net} onOpenAll={() => push({ name: 'network' })} />
          </section>
        ) : peopleRail}

        {upcoming.length > 0 && (
          <section className="dh-sec" aria-label={eventsTitle(upcoming, me.city)}>
            <SectionHeader title={eventsTitle(upcoming, me.city)} className="dh-pad" action="See all" onAction={() => go.discover('events')} />
            <EventsA list={upcoming} city={me.city} />
          </section>
        )}

        {(friday.length > 0 || reviewable) && (
          <section className="dh-sec" aria-label="Film talk">
            <SectionHeader title="Film talk" className="dh-pad" action="See all" onAction={() => go.discover('reviews')} />
            {friday.length > 0 && (
              <div className={friday.length > 1 ? 'dh-rail dh-quotes' : 'dh-pad'}>
                {friday.map((w) => <Quote key={w.id} w={w} onOpen={() => push({ name: 'work', id: w.id })} />)}
              </div>
            )}
            {reviewable && (
              <div className="dh-pad">
                <PressCard className="dh-rate" onPress={() => openSheet({ name: 'review', projectId: reviewable.id })} scale={0.985} aria-label={`Seen ${reviewable.title}? Rate and review`}>
                  <Photo surface="search-thumbnail" media={reviewable.media} showPlay={false} />
                  <span><b>Seen {reviewable.title}?</b><span>Rate and review</span></span>
                </PressCard>
              </div>
            )}
          </section>
        )}

        {posts.length === 3 && (
          <section className="dh-sec dh-pad" aria-label="New work">
            <SectionHeader title="New work" action="See all" onAction={() => go.discover('posts')} />
            <div className="dh-mosaic">
              {posts.map((p, i) => {
                const a = party(p.authorId);
                return (
                  <Pressable key={p.id} className={`dh-mos ${i === 0 ? 'dh-mos--big' : ''}`} onClick={() => push({ name: 'posts', ids: posts.map((x) => x.id), index: i })} scale={0.98} aria-label={`Post by ${a?.name ?? 'someone'}`}>
                    <Photo surface="discover-bento" media={p.media[0]} showPlay={false} />
                    {a && <span className="dh-by"><Avatar party={a} size={20} />{i === 0 ? a.name : first(a.name)}</span>}
                  </Pressable>
                );
              })}
            </div>
          </section>
        )}

        {net.length > 0 && peopleRail}

        <section className="dh-end" aria-labelledby="dh-end-title">
          <h2 id="dh-end-title">You're up to date.</h2>
        </section>
      </div>
      </>
    );
  }

  return (
    <>
    {atmosphere && <LivingBackground scrollRef={scrollRef} />}
    <div className={`screen canvas v-home dh${atmosphere ? ' has-ambient' : ''}`} ref={scrollRef} data-scroll="home" key={`${viewer.id}-${reloadKey}`}>
      <div className="dh-wash">
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

      {cards.length > 0 && (
        <section className="dh-sec" aria-label="In the spotlight">
          <SectionHeader title="In the spotlight" action="See all" onAction={() => setSpotlightAll(true)} className="dh-pad" />
          <Spotlight items={cards} i={Math.min(spot, cards.length - 1)} setI={setSpot} />
          <Sheet open={spotlightAll} onClose={() => setSpotlightAll(false)} title="In the spotlight">
            <div className="dh-spot-list">
              {cards.map((card) => <button key={card.key} onClick={() => { setSpotlightAll(false); push(card.open); }}>
                <Photo surface="spotlight" media={card.media} showPlay={false} />
                <span><small>{card.kicker}</small><b>{card.title}</b><small>{card.meta}</small></span>
              </button>)}
            </div>
          </Sheet>
        </section>
      )}

      <div className="dh-pad">
        <FirstStep />
      </div>

      <IntentShelf intent={intent} me={me} roles={roles.filter((o) => !shown.has(`role:${o.id}`) && o.authorId !== me.id)} blocked={blocked} go={go} />

      {posts.length === 3 && (
        <section className="dh-sec dh-pad" aria-label="New work">
          <SectionHeader title="New work" action="See all" onAction={() => go.discover('posts')} />
          <div className="dh-mosaic">
            {posts.map((p, i) => {
              const a = party(p.authorId);
              return (
                <Pressable key={p.id} className={`dh-mos ${i === 0 ? 'dh-mos--big' : ''}`} onClick={() => push({ name: 'posts', ids: posts.map((x) => x.id), index: i })} scale={0.98} aria-label={`Post by ${a?.name ?? 'someone'}`}>
                  <Photo surface="discover-bento" media={p.media[0]} showPlay={false} className={i === 0 && motionOk() ? 'dh-drift' : ''} />
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
        </section>
      )}

      {upcoming.length > 0 && (
        <section className="dh-sec" aria-label={eventsTitle(upcoming, me.city)}>
          <SectionHeader title={eventsTitle(upcoming, me.city)} className="dh-pad" action="See all" onAction={() => go.discover('events')} />
          <EventsA list={upcoming} city={me.city} />
        </section>
      )}

      {friday.length > 0 && (
        <section className="dh-sec" aria-label="Out this Friday">
          <SectionHeader title="Out this Friday" className="dh-pad" action="See all" onAction={() => go.discover('reviews')} />
          <div className={friday.length > 1 ? 'dh-rail dh-quotes' : 'dh-pad'}>
            {friday.map((w) => (
              <Quote key={w.id} w={w} onOpen={() => push({ name: 'work', id: w.id })} />
            ))}
          </div>
        </section>
      )}

      {near.length >= 2 && (
        <section className="dh-sec dh-pad" aria-label="People near you">
          <SectionHeader title="People near you" action={near.length > 4 ? 'See all' : undefined} onAction={() => go.discover('people')} />
          <div className="dh-grid">
            {near.slice(0, 4).map((p) => (
              <NearCard key={p.id} p={p} />
            ))}
          </div>
        </section>
      )}

      {continueItems.length > 0 && (
        <section className="dh-sec" aria-label="Continue where you left off">
          <SectionHeader title="Continue where you left off" className="dh-pad" />
          <div className="dh-rail dh-pills">
            {continueItems.map((c) => (
              <PressCard key={c.key} className="dh-pill" onPress={c.open} scale={0.97} aria-label={c.label}>
                {c.party ? <Avatar party={c.party} size={30} /> : <Photo surface="spotlight" media={c.img} showPlay={false} className="dh-pill-img" />}
                <span>{c.label}</span>
              </PressCard>
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
    </>
  );
}

const closes = (n?: number) => (n === undefined ? '' : n <= 0 ? 'Closes today' : n === 1 ? 'Closes tomorrow' : `Closes in ${n} days`);

/**
 * The shelf that follows why you're here: Find work → Opportunities for you; Find people → People for your project;
 * Collaborate → Collaborations and roles. Grow my network and Just exploring have none: New work comes next anyway.
 */
function IntentShelf({ intent, me, roles, blocked, go, toKnow }: { intent: string; me: Person; roles: Opportunity[]; blocked: string[]; go: Go; toKnow?: Person[] }) {
  const { push } = useStore();
  const mine = [me.craft, ...(me.crafts ?? [])];
  const related = mine.flatMap((c) => familyOf(c).crafts);
  const fit = (o: Opportunity) => (o.forCrafts.some((c) => mine.includes(c)) ? 0 : o.forCrafts.some((c) => related.includes(c)) ? 1 : 2);
  const byFit = (a: Opportunity, b: Opportunity) => fit(a) - fit(b) || Number(!a.city.includes(me.city)) - Number(!b.city.includes(me.city)) || (a.closesInDays ?? 99) - (b.closesInDays ?? 99);

  if (intent === 'work' || intent === 'collaborate') {
    const list = (intent === 'collaborate' ? [...roles].sort((a, b) => Number(b.kind === 'collab') - Number(a.kind === 'collab') || byFit(a, b)) : roles.filter((o) => fit(o) < 2 && o.kind !== 'collab').sort(byFit)).slice(0, 3);
    if (!list.length) return null;
    const title = intent === 'collaborate' ? 'Collaborations and roles' : 'Opportunities for you';
    return (
      <section className="dh-sec dh-pad" aria-label={title}>
        <SectionHeader title={title} action="See all" onAction={() => go.discover('roles')} />
        <div className="dh-ilist">
          {list.map((o) => (
            <div key={o.id} className="dh-irow">
              <PressCard className="dh-irow-main" onPress={() => push({ name: 'opportunity', id: o.id })} scale={0.985} aria-label={`${o.role}, ${o.project}`}>
                <span className="dh-irow-img">
                  <Photo surface="spotlight" media={o.media} showPlay={false} />
                </span>
                <span className="dh-irow-t">
                  <b>{o.role}</b>
                  <span>
                    {o.project} · {o.orgId ? org(o.orgId).name : o.authorId ? person(o.authorId).name : ''}
                  </span>
                  <span className="dh-irow-fact">{[closes(o.closesInDays), o.kind === 'collab' ? 'Collaboration' : o.paid ? 'Paid' : 'Unpaid', o.city.split(/,| & /)[0]].filter(Boolean).join(' · ')}</span>
                </span>
              </PressCard>
              <SaveButton id={o.id} kind="role" name={`${o.role}, ${o.project}`} />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (intent === 'hire' || (toKnow && toKnow.length > 0)) {
    // When you're here to network or explore, For you shows people to know instead of nothing.
    const knowing = intent !== 'hire';
    const list = knowing ? toKnow!.slice(0, 3) : searchablePeople(me.id, blocked)
      .filter((p) => p.availableFrom)
      .sort((a, b) => Number(b.city === me.city) - Number(a.city === me.city) || (b.years ?? 0) - (a.years ?? 0))
      .slice(0, 3);
    if (!list.length) return null;
    return (
      <section className="dh-sec dh-pad" aria-label={knowing ? 'People to know' : 'People for your project'}>
        <SectionHeader title={knowing ? 'People to know' : 'People for your project'} action="See all" onAction={() => go.discover('people')} />
        <div className="dh-ilist">
          {list.map((p) => (
            <div key={p.id} className="dh-irow">
              <PressCard className="dh-irow-main" onPress={() => push({ name: 'profile', id: p.id })} scale={0.985} aria-label={`${p.name}, ${p.role}`}>
                <span className="dh-irow-img dh-irow-img--round">
                  <PersonPhoto party={p} />
                </span>
                <span className="dh-irow-t">
                  <b>{p.name}</b>
                  <span>
                    {p.role} · {p.city}
                  </span>
                  <span className="dh-irow-fact">{!p.availableFrom ? `${p.years ?? 0} yrs · ${p.craft === me.craft ? 'Your department' : 'Works beside your department'}` : p.availableFrom === 'Now' ? 'Open to work' : `Open to work from ${p.availableFrom}`}</span>
                </span>
              </PressCard>
            </div>
          ))}
        </div>
      </section>
    );
  }
  return null;
}

// One choice per person per day; a change that matters (Interested, a block) recalculates. Never while on screen.
const chosen = new Map<string, IndustryEvent[]>();
function homeEvents(pool: IndustryEvent[], me: Person, following: string[], interested: string[], blocked: string[], now: number) {
  const key = [me.id, me.city, me.craft, new Date(now).toDateString(), interested.join(), blocked.join(), pool.map((e) => e.id).join()].join('|');
  const hit = chosen.get(key);
  if (hit) return hit;
  const list = rankHomeEvents(pool, {
    now,
    city: me.city,
    craft: me.craft,
    crafts: me.crafts,
    openToTravel: me.openToTravel,
    creditedFilms: world.credits.filter((c) => c.personId === me.id && c.status === 'accepted').map((c) => c.projectId),
    network: [...workedWith(me.id), ...following],
    followedHouses: following.filter((id) => party(id)?.kind === 'org'),
    interested,
    blocked,
    seen: readSeen(me.id),
  });
  chosen.set(key, list);
  if (list[0]) markShown(me.id, list[0].id);
  return list;
}

/** Image-led, manual event shelf. Attendance details live on Event Detail. */
function EventsA({ list }: { list: IndustryEvent[]; city: string }) {
  const { viewer, push } = useStore();
  return <div className="dh-events-rail" aria-label="Upcoming events">
    {list.map(e => {
      const art = eventArt(e);
      return <div className="dh-event-card" key={e.id}>
        <PressCard className="dh-event-main" onPress={() => { markOpened(viewer.id, e.id); push({ name: 'event', id: e.id }); }} aria-label={`${e.title}. ${whenLabel(e.start)}. ${e.venue === 'Online' ? 'Online' : e.city}. Free.`}>
          <span className="dh-event-image">{art ? <Photo surface="event-card" media={art} showPlay={false} /> : <span className="dh-event-art" aria-hidden><span>Ana</span><i /><b>Meet. Make.<br />Be inspired.</b></span>}</span>
          <span className="dh-event-copy">
            <span className="dh-event-category">{typeLabel(e.type).split(' or ')[0]}</span>
            <b>{e.title}</b>
            <span className="dh-event-when">{whenLabel(e.start)}</span>
            <span className="dh-event-place">{e.venue === 'Online' ? 'Online' : e.city}<span>Free</span></span>
          </span>
        </PressCard>
        <span className="dh-event-save"><SaveButton id={e.id} kind="event" floating name={e.title} /></span>
      </div>;
    })}
  </div>;
}

/** One editorial shell, with continuously scaled side previews and a compact dot group. */
function Spotlight({ items, i, setI }: { items: SpotCard[]; i: number; setI: (f: number | ((x: number) => number)) => void }) {
  const { push } = useStore();
  const low = useLowPower();
  const { track, physical, canAnimate: animate, select } = useSpotlightCarousel(items.map((c) => c.key).join('|'), items.length, i, low, setI);
  const repeated = items.length > 1 ? [...items, ...items, ...items] : items;
  return <div className="dh-car" role="region" aria-roledescription="carousel" aria-label="In the spotlight">
    <div className="dh-track" ref={track} tabIndex={0} aria-label="Spotlight cards. Use left and right arrow keys to browse.">
      {repeated.map((c, k) => {
        const active = k === physical;
        return <div key={`${k}:${c.key}`} role="group" aria-roledescription="slide" aria-label={`${k % items.length + 1} of ${items.length}`} aria-hidden={!active} {...(!active ? { inert: '' } : {})} className={`dh-card dh-card--${c.key.split(':')[0]} ${active ? 'is-active' : ''}`}>
          <div className="dh-card-visual">
            <PressCard className="dh-card-main" onPress={() => active ? push(c.open) : select(k % items.length)} scale={1} aria-label={`${c.kicker}. ${c.title}. ${c.meta}. ${c.fact ?? ''}`}>
              <span className="dh-card-media">
                {c.media ? <Photo surface="spotlight" media={c.media} showPlay={false} /> : <span className="dh-event-art" aria-hidden><span>Ana</span><i /></span>}
                {animate && active && c.clip && CLIPS.has(c.clip) && <Clip id={c.clip} />}
                <span className="dh-card-shade" aria-hidden />
                <span className="dh-spot-type">{c.kicker}</span>
                <span className="dh-card-caption"><b>{c.title}</b><span>{c.meta}</span></span>
              </span>
              <span className="dh-card-fact">{c.fact || '\u00a0'}</span>
            </PressCard>
            <span className="dh-card-save"><SaveButton id={c.save.id} kind={c.save.kind} floating name={c.title} /></span>
          </div>
        </div>;
      })}
    </div>
    <div className="dh-dots" role="group" aria-label="Spotlight pagination">
      {items.map((c, k) => <button key={c.key} aria-pressed={k === i} aria-label={`Show ${c.title}`} className={k === i ? 'on' : ''} onClick={(event) => { select(k); if (event.detail > 0) event.currentTarget.blur(); }} />)}
    </div>
  </div>;
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

function Quote({ w, onOpen }: { w: Work; onOpen: () => void }) {
  const f = featuredFor(w.id);
  const p = f && party(f.personId);
  return (
    <PressCard className="dh-quote" onPress={onOpen} scale={0.985} aria-label={w.title}>
      <span className="dh-qfilm dh-qfilm--top">
        <Photo surface="spotlight" media={w.media} showPlay={false} />
        <span className="dh-qfilm-t">
          <b>{w.title}</b>
          <ScoreLine id={w.id} />
        </span>
      </span>
      {f && p && (
        <>
          <p className="dh-qtext">“{f.text}”</p>
          <span className="dh-qby">
            <Avatar party={p} size={32} />
            <span className="dh-qwho">
              <b>{p.name}</b>
              <span>{p.kind === 'person' ? (p as Person).role : ''}</span>
            </span>
          </span>
        </>
      )}
    </PressCard>
  );
}

function NearCard({ p, compact = false }: { p: Person; compact?: boolean }) {
  const { push, following, toggleFollow } = useStore();
  const on = following.includes(p.id);
  return (
    <div className={`dh-near ${compact ? 'dh-near--compact' : ''}`}>
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
          {p.availableFrom ? <span>Open to work{p.availableFrom !== 'Now' ? ` from ${p.availableFrom}` : ''}</span> : <span>{p.city}</span>}
        </span>
      </PressCard>
      <button className={`dh-follow ${on ? 'is-on' : ''}`} aria-label={on ? `Following ${p.name}` : `Follow ${p.name}`} aria-pressed={on} onClick={() => toggleFollow(p.id)}>
        {on ? <Check size={16} aria-hidden /> : <Plus size={18} aria-hidden />}
      </button>
    </div>
  );
}

