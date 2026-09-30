import { AnimatePresence, motion } from 'framer-motion';
import { PostGrid } from './PostGrid';
import { BadgeCheck, Camera, Clapperboard, Film, IndianRupee, MapPin, Mic, Newspaper, Palette, Scissors, Search, Shirt, SlidersHorizontal, Sparkles, Theater, Users, Video, X } from 'lucide-react';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import * as seed from '../../data/seed';
import { discoverableProjects, discoverableRoles, searchableHouses, searchablePeople } from '../../domain/discovery';
import type { Opportunity, Person } from '../../data/types';
import { useStore } from '../../state/store';
import { discoverPosts, org, person } from '../../state/selectors';
import { OfflineBanner } from '../../ui/chrome';
import { Avatar, Button, Chip, FollowButton, EmptyState, PressCard, Pressable, Photo, SectionHeader, Skeleton, Tabs, Verified } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';
import { RoleRow } from './RoleRow';

export type Scope = 'roles' | 'people' | 'projects' | 'posts';

const CRAFT_ICONS: Record<string, ReactNode> = {
  cinematographer: <Camera size={22} />,
  actor: <Theater size={22} />,
  editor: <Scissors size={22} />,
  director: <Clapperboard size={22} />,
  sound: <Mic size={22} />,
  'production-design': <Palette size={22} />,
  costume: <Shirt size={22} />,
  colourist: <Video size={22} />,
};

const KINDS: { id: 'all' | Opportunity['kind']; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'crew', label: 'Crew jobs' },
  { id: 'casting', label: 'Casting' },
  { id: 'collab', label: 'Collaborations' },
];

/* Only adult, public profiles are searchable. Guardian-managed profiles never enter this index. */


function PersonRow({ p }: { p: Person }) {
  const { push, following, toggleFollow } = useStore();
  const on = following.includes(p.id);
  return (
    <PressCard className="prow" onPress={() => push({ name: 'profile', id: p.id })} scale={0.985}>
      <Avatar party={p} size={48} available={!!p.availableFrom} />
      <div className="prow-text">
        <p className="item-title">{p.name}</p>
        <p className="meta">
          {p.role} · {p.city}
        </p>
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

export function DiscoverScreen({ scope, setScope }: { scope: Scope; setScope: (s: Scope) => void }) {
  const { viewer, following, userPosts, userCollabs, blocked, push, roleStatus, scenario, attempt, worldVersion } = useStore();
  const [searchState, setSearchState] = useState<'ready' | 'loading' | 'error'>('ready');
  const [query, setQuery] = useState('');
  /** Typing shows results across everything; "See all" narrows to one kind and brings the tabs back. */
  const [narrowed, setNarrowed] = useState(false);
  const [kind, setKind] = useState<'all' | Opportunity['kind']>('all');
  const [craft, setCraft] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({ paid: false, verified: false, travel: false, near: false });
  const [draft, setDraft] = useState<Filters>(filters);
  const [filterOpen, setFilterOpen] = useState(false);

  const q = query.trim().toLowerCase();
  const roles = useMemo(() => discoverableRoles(viewer.id, userCollabs), [userCollabs, viewer.id, worldVersion]);

  const applyRoleFilters = (list: Opportunity[], f: Filters, k: typeof kind) =>
    list
      .filter((o) => !roleStatus[o.id])
      .filter((o) => (k === 'all' ? true : o.kind === k))
      .filter((o) => (f.paid ? o.paid : true))
      .filter((o) => (f.verified ? !!o.orgId : true))
      .filter((o) => (f.travel ? /travel/i.test(`${o.distance ?? ''} ${o.about}`) : true))
      .filter((o) => (f.near ? o.city.includes(person(viewer.id).city) : true))
      .filter((o) => (q ? [o.role, o.project, o.city, o.orgId ? org(o.orgId).name : person(o.authorId!).name].join(' ').toLowerCase().includes(q) : true));

  const shownRoles = applyRoleFilters(roles, filters, kind);
  const people = searchablePeople(viewer.id, blocked)
    .filter((p) => (craft ? p.craft === craft || (craft === 'cinematographer' && p.craft === 'camera') : true))
    .filter((p) => (q ? [p.name, p.role, p.city].join(' ').toLowerCase().includes(q) : true));
  const projects = discoverableProjects(blocked).filter((w) => (q ? `${w.title} ${w.format} ${w.orgIds.map((o) => org(o).name).join(' ')} ${w.ownerId ? person(w.ownerId).name : ''}`.toLowerCase().includes(q) : true));
  const houses = q ? searchableHouses(blocked).filter((o) => `${o.name} ${o.city} ${o.about}`.toLowerCase().includes(q)) : [];
  const grouped = !!q && !narrowed;
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
  const posts = discoverPosts(viewer, following, userPosts).filter((p) => (q ? `${p.text} ${p.project ?? ''}`.toLowerCase().includes(q) : true));
  const activeFilters = Object.values(filters).filter(Boolean).length;

  return (
    <div className="screen canvas v-discover" data-scroll="discover">
      <div className="title-block title-block--top">
        <h1 className="large-title">Discover</h1>
      </div>

      <div className="search-wrap">
        <label className="search">
          <Search size={18} />
          <input id="discover-search" value={query} onChange={(e) => { setQuery(e.target.value); if (!e.target.value) setNarrowed(false); }} placeholder="People, productions, projects, roles" enterKeyHint="search" aria-label="Search" />
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
            { value: 'roles', label: 'Roles', icon: <Clapperboard size={22} /> },
            { value: 'people', label: 'People', icon: <Users size={22} /> },
            { value: 'projects', label: 'Projects', icon: <Film size={22} /> },
            { value: 'posts', label: 'Posts', icon: <Newspaper size={22} /> },
          ]}
        />}
      </div>
      <OfflineBanner />

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
              <SectionHeader title="Roles" action={shownRoles.length > 3 ? 'See all' : undefined} onAction={() => seeAll('roles')} />
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
              <div className="chips chips--scroll chips--pad">
                <Chip
                  active={activeFilters > 0}
                  icon={<SlidersHorizontal size={15} />}
                  onClick={() => {
                    setDraft(filters);
                    setFilterOpen(true);
                  }}
                >
                  {activeFilters ? `Filters · ${activeFilters}` : 'Filters'}
                </Chip>
                {KINDS.map((k) => (
                  <Chip key={k.id} active={kind === k.id} onClick={() => setKind(k.id)}>
                    {k.label}
                  </Chip>
                ))}
              </div>
              <div className="list">
                {shownRoles.map((o) => (
                  <RoleRow key={o.id} o={o} />
                ))}
              </div>
              {!shownRoles.length && <EmptyState title="No roles match" body={q ? `Nothing for "${query}".` : 'Try removing a filter.'} />}
            </>
          )}

          {scope === 'people' && (
            <>
              {!q && (
                <div className="crafts">
                  {seed.crafts.map((c) => (
                    <motion.button key={c.id} whileTap={{ scale: 0.95 }} className={`craft ${craft === c.id ? 'is-on' : ''}`} onClick={() => setCraft(craft === c.id ? null : c.id)} aria-pressed={craft === c.id}>
                      {CRAFT_ICONS[c.id]}
                      <span>{c.label}</span>
                    </motion.button>
                  ))}
                </div>
              )}
              <div className="list">
                {people.map((p) => (
                  <PersonRow key={p.id} p={p} />
                ))}
              </div>
              {!people.length && <EmptyState title="No one found" />}
            </>
          )}

          {scope === 'projects' && (
            <div className="posters">
              {projects.map((w) => (
                <Pressable key={w.id} className="poster-item" onClick={() => push({ name: 'work', id: w.id })} scale={0.97}>
                  <Photo media={w.media} className="poster" />
                  <p className="item-title">{w.title}</p>
                  <p className="meta">
                    {w.ownerId ? person(w.ownerId).name : <>{org(w.orgIds[0]).name} <Verified size={12} /></>}
                  </p>
                </Pressable>
              ))}
              {!projects.length && <EmptyState title="No projects found" />}
            </div>
          )}

          {scope === 'posts' && (posts.length ? <PostGrid posts={posts} onOpen={(i) => push({ name: 'posts', ids: posts.map((p) => p.id), index: i })} /> : <EmptyState title="No posts yet" />)}
        </motion.div>
      </AnimatePresence>
      )}

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
              Show {applyRoleFilters(roles, draft, kind).length} roles
            </Button>
          </div>
        </div>
      </Sheet>
    </div>
  );
}
