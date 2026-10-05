import { AnimatePresence, motion } from 'framer-motion';
import { PostGrid } from './PostGrid';
import { BadgeCheck, CalendarDays, Check, ChevronDown, ChevronRight, Clapperboard, Film, IndianRupee, MapPin, Newspaper, Plane, Search, SlidersHorizontal, Sparkles, Users, X } from 'lucide-react';
import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { research } from '../../research-data/client';
import { CRAFTS } from '../../data/crafts';
import { isLive } from '../../data/works';
import { discoverableProjects, discoverableRoles, publicCreditsFor, searchableHouses, searchablePeople } from '../../domain/discovery';
import type { Opportunity, Person, Post } from '../../data/types';
import { useStore } from '../../state/store';
import { discoverPosts, org, party, person } from '../../state/selectors';
import { OfflineBanner } from '../../ui/chrome';
import { Avatar, Button, Chip, FollowButton, EmptyState, PressCard, Pressable, Photo, SectionHeader, Skeleton, Tabs, Verified } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';
import { RoleRow } from './RoleRow';
import { EventTicket } from '../event/eventUnits';
import { EVENT_TYPES, typeLabel } from '../../domain/events';
import type { EventType } from '../../data/types';
import { visibleEvents } from '../../state/events';
import { useFeatures } from '../../ui/features';

export type Scope = 'roles' | 'people' | 'projects' | 'posts' | 'events';

/** Events by when: this week means the next seven days, never a calendar promise. */
const WHENS = [
  { id: 'any', label: 'Any time' },
  { id: 'week', label: 'Next 7 days' },
  { id: 'month', label: 'Next 30 days' },
] as const;
type When = (typeof WHENS)[number]['id'];

const KINDS: { id: 'all' | Opportunity['kind']; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'crew', label: 'Crew jobs' },
  { id: 'casting', label: 'Casting' },
  { id: 'collab', label: 'Collaborations' },
];

/* Crafts by department, so the craft picker reads as six short groups instead of fifteen chips in a row. */
const DEPARTMENTS: { label: string; crafts: string[] }[] = [
  { label: 'Direction and writing', crafts: ['director', 'writing'] },
  { label: 'Acting', crafts: ['actor'] },
  { label: 'Camera and lighting', crafts: ['cinematographer', 'camera', 'lighting'] },
  { label: 'Post and sound', crafts: ['editor', 'colourist', 'vfx', 'sound', 'music'] },
  { label: 'Art, costume and make-up', crafts: ['production-design', 'costume', 'makeup'] },
  { label: 'Production', crafts: ['production'] },
];
const craftLabel = (id: string | null) => (id ? CRAFTS.find((c) => c.id === id)?.label ?? id : null);

/**
 * Discover's one filter row (docs/DISCOVER_FILTERS.md): a dropdown for the main facet, at most one
 * one-tap toggle, and Filters for the rest. Every tab uses the same anatomy.
 */
function FilterBar({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="fbar" role="group" aria-label={label}>
      {children}
    </div>
  );
}

/** A dropdown button: shows the current value (or the "any" label) and opens a picker. */
function Facet({ value, any, onOpen, label }: { value: string | null; any: string; onOpen: () => void; label: string }) {
  return (
    <button className={`chip fbar-facet ${value ? 'is-on' : ''}`} onClick={onOpen} aria-haspopup="dialog" aria-label={`${label}: ${value ?? any}`}>
      {value ?? any}
      <ChevronDown size={15} strokeWidth={2.4} aria-hidden />
    </button>
  );
}

/** Everything else, at the end of the row: an icon button with the number of filters on. */
function FiltersButton({ count, onOpen }: { count: number; onOpen: () => void }) {
  return (
    <button className={`chip fbar-filters ${count ? 'is-on' : ''}`} onClick={onOpen} aria-haspopup="dialog" aria-label={count ? `Filters, ${count} on` : 'Filters'}>
      <SlidersHorizontal size={17} aria-hidden />
      {count > 0 && <span className="fbar-badge">{count}</span>}
    </button>
  );
}

/** One choice from a short list, as radios in a sheet; optional groups. Choosing closes the sheet. */
function Picker<T extends string>({ open, onClose, title, value, options, groups, onPick }: { open: boolean; onClose: () => void; title: string; value: T; options?: { id: T; label: string }[]; groups?: { label: string; options: { id: T; label: string }[] }[]; onPick: (v: T) => void }) {
  const opt = (o: { id: T; label: string }) => (
    <button
      key={o.id}
      role="radio"
      aria-checked={value === o.id}
      className={`picker-row ${value === o.id ? 'is-on' : ''}`}
      onClick={() => {
        onPick(o.id);
        onClose();
      }}
    >
      <span>{o.label}</span>
      {value === o.id && <Check size={18} strokeWidth={2.4} aria-hidden />}
    </button>
  );
  return (
    <Sheet open={open} onClose={onClose} title={title}>
      <div className="picker" role="radiogroup" aria-label={title}>
        {options?.map(opt)}
        {groups?.map((g) => (
          <div key={g.label} className="picker-group">
            <p className="picker-label">{g.label}</p>
            {g.options.map(opt)}
          </div>
        ))}
      </div>
    </Sheet>
  );
}

/* Only adult, public profiles are searchable. Guardian-managed profiles never enter this index. */


/** A person as a search result: what they do, where, whether they are available, and their verified credits. */
function PersonRow({ p }: { p: Person }) {
  const { push, following, toggleFollow } = useStore();
  const on = following.includes(p.id);
  const credits = publicCreditsFor(p.id).length;
  return (
    <PressCard className="prow" onPress={() => push({ name: 'profile', id: p.id })} scale={0.985}>
      <Avatar party={p} size={48} available={!!p.availableFrom} />
      <div className="prow-text">
        <p className="item-title">{p.name}</p>
        <p className="meta">
          {p.role} · {p.city}
        </p>
        {(p.availableFrom || credits > 0) && (
          <p className="meta prow-facts">
            {p.availableFrom && <span className="prow-available">Available from {p.availableFrom}</span>}
            {credits > 0 && (
              <span>
                <BadgeCheck size={12} /> {credits} verified {credits === 1 ? 'credit' : 'credits'}
              </span>
            )}
          </p>
        )}
      </div>
      <FollowButton on={on} onToggle={() => toggleFollow(p.id)} name={p.name} />
    </PressCard>
  );
}

interface Filters {
  paid: boolean;
  verified: boolean;
  travel: boolean;
  near: boolean;
}

/** People filters (V30): the questions a person search actually asks. */
interface PeopleFilters {
  available: boolean;
  near: boolean;
  credited: boolean;
  travel: boolean;
  experience: 'any' | 'starting' | 'mid' | 'senior';
  language: string | null;
}
const NO_PEOPLE_FILTERS: PeopleFilters = { available: false, near: false, credited: false, travel: false, experience: 'any', language: null };
const EXPERIENCE: { id: PeopleFilters['experience']; label: string; test: (y?: number) => boolean }[] = [
  { id: 'any', label: 'Any', test: () => true },
  { id: 'starting', label: 'Under 3 years', test: (y) => (y ?? 0) < 3 },
  { id: 'mid', label: '3 to 10 years', test: (y) => (y ?? 0) >= 3 && (y ?? 0) <= 10 },
  { id: 'senior', label: '10+ years', test: (y) => (y ?? 0) > 10 },
];
const LANGUAGES = ['Telugu', 'Hindi', 'Tamil', 'Malayalam', 'Kannada', 'Marathi', 'Bengali', 'English'];
type ProjectStage = 'all' | 'live' | 'released' | 'hiring';
const STAGES: { id: ProjectStage; label: string }[] = [
  { id: 'all', label: 'All stages' },
  { id: 'live', label: 'Being made now' },
  { id: 'hiring', label: 'Hiring' },
  { id: 'released', label: 'Released' },
];

export function DiscoverScreen({ scope, setScope, postFocus, focusSearch = 0 }: { scope: Scope; setScope: (s: Scope) => void; postFocus?: { craft: string | null; n: number }; focusSearch?: number }) {
  // Opened from Home's search pill: put the cursor in the search field.
  useEffect(() => {
    if (!focusSearch) return;
    const f = requestAnimationFrame(() => document.getElementById('discover-search')?.focus());
    return () => cancelAnimationFrame(f);
  }, [focusSearch]);
  const { viewer, following, userPosts, userCollabs, blocked, push, roleStatus, scenario, attempt, worldVersion, events, acting } = useStore();
  const features = useFeatures();
  // Events are behind a switch: without it, a stored 'events' scope falls back to People.
  useEffect(() => {
    if (scope === 'events' && !features.events) setScope('people');
  }, [scope, features.events]); // eslint-disable-line react-hooks/exhaustive-deps
  const [evCity, setEvCity] = useState<string>('any');
  const [evWhen, setEvWhen] = useState<When>('any');
  const [evType, setEvType] = useState<'any' | EventType>('any');
  const [searchState, setSearchState] = useState<'ready' | 'loading' | 'error'>('ready');
  const [query, setQuery] = useState('');
  /** Typing shows results across everything; "See all" narrows to one kind and brings the tabs back. */
  const [narrowed, setNarrowed] = useState(false);
  const [kind, setKind] = useState<'all' | Opportunity['kind']>('all');
  const [craft, setCraft] = useState<string | null>(null);
  // Posts by craft: Home's "Posts in <craft>" opens here already narrowed to that craft.
  const [postCraft, setPostCraft] = useState<string | null>(postFocus?.craft ?? null);
  useEffect(() => {
    if (postFocus?.n) setPostCraft(postFocus.craft);
  }, [postFocus?.n]); // eslint-disable-line react-hooks/exhaustive-deps
  const [filters, setFilters] = useState<Filters>({ paid: false, verified: false, travel: false, near: false });
  const [mineOnly, setMineOnly] = useState(false);
  const [who, setWho] = useState<'people' | 'houses'>('people');
  const [pf, setPf] = useState<PeopleFilters>(NO_PEOPLE_FILTERS);
  const [pfDraft, setPfDraft] = useState<PeopleFilters>(NO_PEOPLE_FILTERS);
  const [pfOpen, setPfOpen] = useState(false);
  const [stage, setStage] = useState<ProjectStage>('all');
  const [picker, setPicker] = useState<'craft' | 'postCraft' | 'kind' | 'stage' | 'evCity' | 'evWhen' | 'evType' | null>(null);
  // Research observation only (no-op outside a research session): which section and craft were chosen.
  const seen = useRef({ scope, craft });
  useEffect(() => {
    if (seen.current.scope !== scope) research.track('discover_tab_selected', { metadata: { tab: scope } });
    if (seen.current.craft !== craft && craft) research.track('discover_filter_selected', { metadata: { filter: craft } });
    seen.current = { scope, craft };
  }, [scope, craft]);
  const [draft, setDraft] = useState<Filters>(filters);
  const [filterOpen, setFilterOpen] = useState(false);

  const q = query.trim().toLowerCase();
  const roles = useMemo(() => discoverableRoles(viewer.id, userCollabs), [userCollabs, viewer.id, worldVersion]);

  const me = person(viewer.id);
  const myCrafts = [me.craft, ...(me.crafts ?? [])];
  const applyRoleFilters = (list: Opportunity[], f: Filters, k: typeof kind) =>
    list
      .filter((o) => !roleStatus[o.id])
      .filter((o) => (mineOnly ? o.forCrafts.some((c) => myCrafts.includes(c)) : true))
      .filter((o) => (k === 'all' ? true : o.kind === k))
      .filter((o) => (f.paid ? o.paid : true))
      .filter((o) => (f.verified ? !!o.orgId : true))
      .filter((o) => (f.travel ? /travel/i.test(`${o.distance ?? ''} ${o.about}`) : true))
      .filter((o) => (f.near ? o.city.includes(person(viewer.id).city) : true))
      .filter((o) => (q ? [o.role, o.project, o.city, o.orgId ? org(o.orgId).name : person(o.authorId!).name].join(' ').toLowerCase().includes(q) : true));

  const shownRoles = applyRoleFilters(roles, filters, kind);
  const applyPeopleFilters = (list: Person[], f: PeopleFilters) =>
    list
      .filter((p) => (f.available ? !!p.availableFrom : true))
      .filter((p) => (f.near ? p.city === me.city : true))
      .filter((p) => (f.credited ? publicCreditsFor(p.id).length > 0 : true))
      .filter((p) => (f.travel ? !!p.openToTravel : true))
      .filter((p) => EXPERIENCE.find((e) => e.id === f.experience)!.test(p.years))
      .filter((p) => (f.language ? (p.languages ?? []).includes(f.language) : true));
  const craftPeople = searchablePeople(viewer.id, blocked)
    .filter((p) => (craft ? p.craft === craft || (p.crafts ?? []).includes(craft as Person['craft']) : true))
    .filter((p) => (q ? [p.name, p.role, p.city].join(' ').toLowerCase().includes(q) : true));
  const people = applyPeopleFilters(craftPeople, pf);
  const activePeopleFilters = Object.entries(pf).filter(([k, v]) => k !== 'available' && (k === 'experience' ? v !== 'any' : !!v)).length;
  const allProjects = discoverableProjects(blocked).filter((w) => (q ? `${w.title} ${w.format} ${w.orgIds.map((o) => org(o).name).join(' ')} ${w.ownerId ? person(w.ownerId).name : ''}`.toLowerCase().includes(q) : true));
  const hiringFor = (title: string) => roles.filter((r) => !roleStatus[r.id] && r.project.toLowerCase().startsWith(title.toLowerCase())).length;
  const projects = allProjects.filter((w) => (stage === 'live' ? isLive(w) : stage === 'released' ? !isLive(w) : stage === 'hiring' ? hiringFor(w.title) > 0 : true));
  const allHouses = searchableHouses(blocked).filter((o) => (q ? `${o.name} ${o.city} ${o.about}`.toLowerCase().includes(q) : true));
  const houses = q ? allHouses : [];
  const shownHouses = allHouses.filter((o) => (pf.near ? o.city === me.city : true));
  const grouped = !!q && !narrowed;
  const [announce, setAnnounce] = useState('');
  useEffect(() => {
    if (!q) return setAnnounce('');
    if (searchState === 'loading') return setAnnounce('Searching');
    if (searchState === 'error') return setAnnounce("Search didn't load. Try again.");
    const t = window.setTimeout(() => {
      const n = document.querySelectorAll('.phone .tab-layer:not([inert]) .search-results .press-card, .phone .tab-layer:not([inert]) .search-results .rrow').length;
      setAnnounce(n ? `${n} ${n === 1 ? 'result' : 'results'} for ${query.trim()}` : `No results for ${query.trim()}`);
    }, 700);
    return () => window.clearTimeout(t);
  }, [q, searchState, narrowed]); // eslint-disable-line react-hooks/exhaustive-deps
  const runSearch = () => {
    if (!q || !(scenario.loading || scenario.actionsFail)) return setSearchState('ready');
    setSearchState('loading');
    attempt('search', () => setSearchState('ready'), () => setSearchState('error'), scenario.loading ? 900 : 300);
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(runSearch, [q]);
  const seeAll = (sc: Scope) => {
    setScope(sc);
    setNarrowed(true);
  };
  // The grid is a wall of work: posts with a picture or a clip. Searching within Posts still finds text-only ones.
  const allPosts = discoverPosts(viewer, following, userPosts).filter((p) => (q ? `${p.text} ${p.project ?? ''}`.toLowerCase().includes(q) : p.media.length > 0));
  const postCraftOf = (p: Post) => (party(p.authorId)?.kind === 'person' ? (party(p.authorId) as Person).craft : undefined);
  const postCrafts = CRAFTS.filter((c) => c.id === postCraft || allPosts.some((p) => postCraftOf(p) === c.id));
  const posts = postCraft ? allPosts.filter((p) => postCraftOf(p) === postCraft) : allPosts;
  const activeFilters = Object.values(filters).filter(Boolean).length;
  const now = Date.now();
  const allEvents = features.events ? visibleEvents(events, now, viewer.id, acting).filter((e) => (q ? `${e.title} ${e.venue} ${e.city} ${typeLabel(e.type)} ${party(e.hostId)?.name ?? ''}`.toLowerCase().includes(q) : true)) : [];
  const eventCities = [...new Set(allEvents.map((e) => e.city))].sort();
  const shownEvents = allEvents
    .filter((e) => (evCity === 'any' ? true : e.city === evCity))
    .filter((e) => (evWhen === 'week' ? e.start - now <= 7 * 864e5 : evWhen === 'month' ? e.start - now <= 30 * 864e5 : true))
    .filter((e) => (evType === 'any' ? true : e.type === evType));

  return (
    <motion.div className="screen canvas v-discover" data-scroll="discover" layoutScroll>
      <div className="title-block title-block--top">
        <h1 className="large-title">Discover</h1>
      </div>

      <div className="search-wrap">
        <label className="search">
          <Search size={18} />
          <input id="discover-search" value={query} onChange={(e) => { setQuery(e.target.value); if (!e.target.value) setNarrowed(false); }} placeholder={scope === 'people' ? 'Search people and production houses' : scope === 'roles' ? 'Search roles, casting and collaborations' : scope === 'projects' ? 'Search projects and productions' : scope === 'events' ? 'Search events' : 'Search people, projects and roles'} enterKeyHint="search" aria-label="Search" />
          <AnimatePresence>
            {query && (
              <motion.button className="search-clear" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} onClick={() => { setQuery(''); setNarrowed(false); }} aria-label="Clear search">
                <X size={14} strokeWidth={2.6} />
              </motion.button>
            )}
          </AnimatePresence>
        </label>
        {!grouped && <Tabs
          id="discover"
          value={scope}
          onChange={setScope}
          options={[
            { value: 'posts', label: 'Posts', icon: <Newspaper size={22} /> },
            { value: 'people', label: 'People', icon: <Users size={22} /> },
            { value: 'roles', label: 'Opportunities', icon: <Clapperboard size={22} /> },
            { value: 'projects', label: 'Projects', icon: <Film size={22} /> },
            ...(features.events ? [{ value: 'events' as const, label: 'Events', icon: <CalendarDays size={22} /> }] : []),
          ]}
        />}
      </div>
      <OfflineBanner />
      {/* Search results change as you type: say so once it settles, without moving focus (WCAG 4.1.3). */}
      <p className="sr-only" role="status">
        {announce}
      </p>

      {grouped && searchState === 'loading' ? (
        <div className="search-results" aria-busy="true">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="skel-row">
              <Skeleton w={48} h={48} r={12} />
              <span className="skel-lines">
                <Skeleton w="55%" />
                <Skeleton w="35%" h={11} />
              </span>
            </div>
          ))}
        </div>
      ) : grouped && searchState === 'error' ? (
        <div className="search-results">
          <EmptyState title="Search didn't load" body="Your search is kept. Try again." />
          <Button variant="secondary" className="center-btn" onClick={runSearch}>
            Try again
          </Button>
        </div>
      ) : grouped ? (
        <div className="search-results">
          {houses.length > 0 && (
            <section className="section">
              <SectionHeader title="Productions" />
              <div className="list list--flush">
                {houses.map((o) => (
                  <PressCard key={o.id} className="prow" onPress={() => push({ name: 'org', id: o.id })} scale={0.985}>
                    <Avatar party={o} size={48} />
                    <div className="prow-text">
                      <p className="item-title">
                        {o.name} {o.verified && <Verified size={13} />}
                      </p>
                      <p className="meta">Production house · {o.city}</p>
                    </div>
                  </PressCard>
                ))}
              </div>
            </section>
          )}
          {people.length > 0 && (
            <section className="section">
              <SectionHeader title="People" action={people.length > 3 ? 'See all' : undefined} onAction={() => seeAll('people')} />
              <div className="list list--flush">
                {people.slice(0, 3).map((p) => (
                  <PersonRow key={p.id} p={p} />
                ))}
              </div>
            </section>
          )}
          {projects.length > 0 && (
            <section className="section">
              <SectionHeader title="Projects" action={projects.length > 3 ? 'See all' : undefined} onAction={() => seeAll('projects')} />
              <div className="list list--flush">
                {projects.slice(0, 3).map((w) => (
                  <PressCard key={w.id} className="rrow" onPress={() => push({ name: 'work', id: w.id })} scale={0.985}>
                    <Photo media={w.media} className="rrow-thumb" showPlay={false} />
                    <div className="rrow-text">
                      <p className="item-title">{w.title}</p>
                      <p className="meta">{w.format}</p>
                      <p className="meta">{w.ownerId ? `${person(w.ownerId).name} · independent` : org(w.orgIds[0]).name}</p>
                    </div>
                  </PressCard>
                ))}
              </div>
            </section>
          )}
          {shownRoles.length > 0 && (
            <section className="section">
              <SectionHeader title="Opportunities" action={shownRoles.length > 3 ? 'See all' : undefined} onAction={() => seeAll('roles')} />
              <div className="list list--flush">
                {shownRoles.slice(0, 3).map((o) => (
                  <RoleRow key={o.id} o={o} />
                ))}
              </div>
            </section>
          )}
          {!houses.length && !people.length && !projects.length && !shownRoles.length && (
            <EmptyState title={`Nothing for "${query}"`} body="Try a name, a craft like colourist, a city or a film title." />
          )}
        </div>
      ) : (
      <AnimatePresence mode="wait">
        <motion.div key={scope} initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.16 }}>
          {scope === 'roles' && (
            <>
              <FilterBar label="Opportunity filters">
                <Facet label="Type" any="All types" value={kind === 'all' ? null : KINDS.find((k) => k.id === kind)!.label} onOpen={() => setPicker('kind')} />
                <Chip active={mineOnly} onClick={() => setMineOnly((v) => !v)}>
                  My crafts
                </Chip>
                <span className="fbar-gap" aria-hidden />
                <FiltersButton count={activeFilters} onOpen={() => {
                    setDraft(filters);
                    setFilterOpen(true);
                  }} />
              </FilterBar>
              <div className="list">
                {shownRoles.map((o) => (
                  <RoleRow key={o.id} o={o} />
                ))}
              </div>
              {!shownRoles.length && <EmptyState title="No opportunities match" body={q ? `Nothing for "${query}".` : 'Try removing a filter.'} />}
            </>
          )}

          {scope === 'people' && (
            <>
              {who === 'people' && (
                <FilterBar label="People filters">
                  <Facet label="Craft" any="Any craft" value={craftLabel(craft)} onOpen={() => setPicker('craft')} />
                  <Chip active={pf.available} onClick={() => setPf((f) => ({ ...f, available: !f.available }))}>
                    Available now
                  </Chip>
                  <span className="fbar-gap" aria-hidden />
                  <FiltersButton count={activePeopleFilters} onOpen={() => {
                      setPfDraft(pf);
                      setPfOpen(true);
                    }} />
                </FilterBar>
              )}
              {/* Production houses are another kind of result, not a filter: a quiet switch on the count line. */}
              <div className="fbar-count">
                <p className="meta list-count">
                  {who === 'people' ? `${people.length} ${people.length === 1 ? 'person' : 'people'}` : `${shownHouses.length} production ${shownHouses.length === 1 ? 'house' : 'houses'}`}
                </p>
                <button className="link link--small fbar-switch" onClick={() => setWho((w) => (w === 'houses' ? 'people' : 'houses'))}>
                  {who === 'people' ? 'Production houses' : 'People'}
                  <ChevronRight size={15} aria-hidden />
                </button>
              </div>
              {who === 'people' ? (
                <>
                  <div className="list">
                    {people.map((p) => (
                      <PersonRow key={p.id} p={p} />
                    ))}
                  </div>
                  {!people.length && <EmptyState title="No one matches" body={activePeopleFilters || craft || pf.available ? 'Try removing a filter.' : undefined} />}
                </>
              ) : (
                <div className="list">
                  {shownHouses.map((o) => (
                    <PressCard key={o.id} className="prow" onPress={() => push({ name: 'org', id: o.id })} scale={0.985}>
                      <Avatar party={o} size={48} />
                      <div className="prow-text">
                        <p className="item-title">
                          {o.name} {o.verified && <Verified size={13} />}
                        </p>
                        <p className="meta">Production house · {o.city}</p>
                      </div>
                    </PressCard>
                  ))}
                </div>
              )}
            </>
          )}

          {scope === 'projects' && (
            <>
              <FilterBar label="Project filters">
                <Facet label="Stage" any="All stages" value={stage === 'all' ? null : STAGES.find((x) => x.id === stage)!.label} onOpen={() => setPicker('stage')} />
              </FilterBar>
              <div className="posters">
                {projects.map((w) => {
                  const hiring = hiringFor(w.title);
                  return (
                    <Pressable key={w.id} className="poster-item" onClick={() => push({ name: 'work', id: w.id })} scale={0.97}>
                      <Photo media={w.media} className="poster" />
                      <p className="item-title">{w.title}</p>
                      <p className="meta">
                        {w.ownerId ? person(w.ownerId).name : <>{org(w.orgIds[0]).name} <Verified size={12} /></>}
                      </p>
                      <p className="meta">{w.stage}</p>
                      {/* Its own line, so "Hiring 2" never splits or leaves a dot hanging on a narrow card. */}
                      {hiring > 0 && <p className="meta poster-hiring">Hiring {hiring}</p>}
                    </Pressable>
                  );
                })}
                {!projects.length && <EmptyState title="No projects match" />}
              </div>
            </>
          )}

          {scope === 'posts' && (
            <>
              <FilterBar label="Post filters">
                <Facet label="Craft" any="Any craft" value={craftLabel(postCraft)} onOpen={() => setPicker('postCraft')} />
              </FilterBar>
              {posts.length ? <PostGrid posts={posts} onOpen={(i) => push({ name: 'posts', ids: posts.map((p) => p.id), index: i })} /> : <EmptyState title={postCraft ? `No posts in ${(CRAFTS.find((c) => c.id === postCraft)?.label ?? 'this craft').toLowerCase()} yet` : 'No posts yet'} />}
            </>
          )}
          {scope === 'events' && (
            <>
              <FilterBar label="Event filters">
                <Facet label="City" any="Any city" value={evCity === 'any' ? null : evCity} onOpen={() => setPicker('evCity')} />
                <Facet label="When" any="Any time" value={evWhen === 'any' ? null : WHENS.find((w) => w.id === evWhen)!.label} onOpen={() => setPicker('evWhen')} />
                <Facet label="Type" any="All types" value={evType === 'any' ? null : typeLabel(evType)} onOpen={() => setPicker('evType')} />
              </FilterBar>
              <div className="ev-list ev-list--discover">
                {shownEvents.map((e) => (
                  <EventTicket key={e.id} e={e} />
                ))}
              </div>
              {!shownEvents.length && <EmptyState title="No events match" body="Try another city or date." />}
              <p className="meta ev-trust">Events show their price up front. Art and Artist never charges to apply or audition.</p>
            </>
          )}
        </motion.div>
      </AnimatePresence>
      )}

      <Picker open={picker === 'craft'} onClose={() => setPicker(null)} title="Craft" value={craft ?? 'any'} options={[{ id: 'any', label: 'Any craft' }]} groups={DEPARTMENTS.map((d) => ({ label: d.label, options: d.crafts.map((c) => ({ id: c, label: craftLabel(c)! })) }))} onPick={(v) => setCraft(v === 'any' ? null : v)} />
      <Picker open={picker === 'postCraft'} onClose={() => setPicker(null)} title="Craft" value={postCraft ?? 'any'} options={[{ id: 'any', label: 'Any craft' }]} groups={DEPARTMENTS.map((d) => ({ label: d.label, options: d.crafts.filter((c) => postCrafts.some((x) => x.id === c)).map((c) => ({ id: c, label: craftLabel(c)! })) })).filter((g) => g.options.length)} onPick={(v) => setPostCraft(v === 'any' ? null : v)} />
      <Picker open={picker === 'kind'} onClose={() => setPicker(null)} title="Type" value={kind} options={KINDS.map((k) => ({ id: k.id, label: k.id === 'all' ? 'All types' : k.label }))} onPick={setKind} />
      <Picker open={picker === 'evCity'} onClose={() => setPicker(null)} title="City" value={evCity} options={[{ id: 'any', label: 'Any city' }, ...eventCities.map((c) => ({ id: c, label: c }))]} onPick={setEvCity} />
      <Picker open={picker === 'evWhen'} onClose={() => setPicker(null)} title="When" value={evWhen} options={WHENS.map((w) => ({ id: w.id, label: w.label }))} onPick={setEvWhen} />
      <Picker open={picker === 'evType'} onClose={() => setPicker(null)} title="Type" value={evType} options={[{ id: 'any' as const, label: 'All types' }, ...EVENT_TYPES.map((t) => ({ id: t.id, label: t.label }))]} onPick={setEvType} />
      <Picker open={picker === 'stage'} onClose={() => setPicker(null)} title="Stage" value={stage} options={STAGES} onPick={setStage} />

      <Sheet open={pfOpen} onClose={() => setPfOpen(false)} title="Filter people">
        <div className="stack">
          <div className="filter-tiles">
            {(
              [
                ['near', `In ${me.city || 'my city'}`, <MapPin key="i" size={24} />],
                ['credited', 'Verified credits', <BadgeCheck key="i" size={24} />],
                ['travel', 'Open to travel', <Plane key="i" size={24} />],
              ] as [keyof PeopleFilters, string, ReactNode][]
            ).map(([key, label, icon]) => (
              <motion.button key={key} whileTap={{ scale: 0.95 }} className={`filter-tile ${pfDraft[key] ? 'is-on' : ''}`} onClick={() => setPfDraft((d) => ({ ...d, [key]: !d[key] }))} aria-pressed={!!pfDraft[key]}>
                {icon}
                <span>{label}</span>
              </motion.button>
            ))}
          </div>
          <p className="field-label">Experience</p>
          <div className="chips">
            {EXPERIENCE.map((e) => (
              <Chip key={e.id} active={pfDraft.experience === e.id} onClick={() => setPfDraft((d) => ({ ...d, experience: e.id }))}>
                {e.label}
              </Chip>
            ))}
          </div>
          <p className="field-label">Works in</p>
          <div className="chips">
            {LANGUAGES.map((l) => (
              <Chip key={l} active={pfDraft.language === l} onClick={() => setPfDraft((d) => ({ ...d, language: d.language === l ? null : l }))}>
                {l}
              </Chip>
            ))}
          </div>
          <div className="sheet-actions">
            <button className="link link--underline" onClick={() => setPfDraft(NO_PEOPLE_FILTERS)}>
              Clear all
            </button>
            <Button
              size="l"
              onClick={() => {
                setPf(pfDraft);
                setPfOpen(false);
              }}
            >
              Show {applyPeopleFilters(craftPeople, pfDraft).length} people
            </Button>
          </div>
        </div>
      </Sheet>

      <Sheet open={filterOpen} onClose={() => setFilterOpen(false)} title="Filters">
        <div className="stack">
          <div className="filter-tiles">
            {(
              [
                ['paid', 'Paid', <IndianRupee key="i" size={24} />],
                ['verified', 'Verified productions', <BadgeCheck key="i" size={24} />],
                ['travel', 'Travel covered', <Sparkles key="i" size={24} />],
                ['near', 'Near me', <MapPin key="i" size={24} />],
              ] as [keyof Filters, string, ReactNode][]
            ).map(([key, label, icon]) => (
              <motion.button key={key} whileTap={{ scale: 0.95 }} className={`filter-tile ${draft[key] ? 'is-on' : ''}`} onClick={() => setDraft((d) => ({ ...d, [key]: !d[key] }))} aria-pressed={draft[key]}>
                {icon}
                <span>{label}</span>
              </motion.button>
            ))}
          </div>
          <div className="sheet-actions">
            <button className="link link--underline" onClick={() => setDraft({ paid: false, verified: false, travel: false, near: false })}>
              Clear all
            </button>
            <Button
              size="l"
              onClick={() => {
                setFilters(draft);
                setFilterOpen(false);
              }}
            >
              Show {applyRoleFilters(roles, draft, kind).length} opportunities
            </Button>
          </div>
        </div>
      </Sheet>
    </motion.div>
  );
}
