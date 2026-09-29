import { AnimatePresence, motion } from 'framer-motion';
import { BadgeCheck, Camera, Clapperboard, Film, IndianRupee, MapPin, Mic, Newspaper, Palette, Scissors, Search, Shirt, SlidersHorizontal, Sparkles, Theater, Users, Video, X } from 'lucide-react';
import { useMemo, useState, type ReactNode } from 'react';
import * as seed from '../../data/seed';
import type { Opportunity, Person } from '../../data/types';
import { useStore } from '../../state/store';
import { org, person } from '../../state/selectors';
import { OfflineBanner } from '../../ui/chrome';
import { Avatar, Button, Chip, EmptyState, PressCard, Photo, Tabs, Verified } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';
import { PostCard } from '../home/PostCard';
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
const searchablePeople = (viewerId: string) => seed.people.filter((p) => p.id !== viewerId && p.visibility === 'public');

const allProjects = () => {
  const seen = new Set<string>();
  return Object.values(seed.credits)
    .flat()
    .filter((c) => (seen.has(c.title) ? false : (seen.add(c.title), true)));
};

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
      <Button
        size="s"
        variant={on ? 'secondary' : 'outline'}
        onClick={(e) => {
          e.stopPropagation();
          toggleFollow(p.id);
        }}
      >
        {on ? 'Following' : 'Follow'}
      </Button>
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
  const { viewer, following, userPosts, userCollabs } = useStore();
  const [query, setQuery] = useState('');
  const [kind, setKind] = useState<'all' | Opportunity['kind']>('all');
  const [craft, setCraft] = useState<string | null>(null);
  const [filters, setFilters] = useState<Filters>({ paid: false, verified: false, travel: false, near: false });
  const [draft, setDraft] = useState<Filters>(filters);
  const [filterOpen, setFilterOpen] = useState(false);

  const q = query.trim().toLowerCase();
  const roles = useMemo(() => [...userCollabs, ...seed.opportunities.filter((o) => o.authorId !== viewer.id)], [userCollabs, viewer.id]);

  const applyRoleFilters = (list: Opportunity[], f: Filters, k: typeof kind) =>
    list
      .filter((o) => (k === 'all' ? true : o.kind === k))
      .filter((o) => (f.paid ? o.paid : true))
      .filter((o) => (f.verified ? !!o.orgId : true))
      .filter((o) => (f.travel ? /travel/i.test(`${o.distance ?? ''} ${o.about}`) : true))
      .filter((o) => (f.near ? o.city.includes(person(viewer.id).city) : true))
      .filter((o) => (q ? [o.role, o.project, o.city, o.orgId ? org(o.orgId).name : person(o.authorId!).name].join(' ').toLowerCase().includes(q) : true));

  const shownRoles = applyRoleFilters(roles, filters, kind);
  const people = searchablePeople(viewer.id)
    .filter((p) => (craft ? p.craft === craft || (craft === 'cinematographer' && p.craft === 'camera') : true))
    .filter((p) => (q ? [p.name, p.role, p.city].join(' ').toLowerCase().includes(q) : true));
  const projects = allProjects().filter((c) => (q ? `${c.title} ${org(c.orgId).name}`.toLowerCase().includes(q) : true));
  const posts = [...userPosts, ...seed.posts.filter((p) => following.includes(p.authorId))].filter((p) => (q ? p.text.toLowerCase().includes(q) : true));
  const activeFilters = Object.values(filters).filter(Boolean).length;

  return (
    <div className="screen" data-scroll="discover">
      <div className="title-block title-block--top">
        <h1 className="large-title">Discover</h1>
      </div>

      <div className="search-wrap">
        <label className="search">
          <Search size={18} />
          <input id="discover-search" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Roles, people, projects" enterKeyHint="search" aria-label="Search" />
          <AnimatePresence>
            {query && (
              <motion.button className="search-clear" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} onClick={() => setQuery('')} aria-label="Clear search">
                <X size={14} strokeWidth={2.6} />
              </motion.button>
            )}
          </AnimatePresence>
        </label>
        <Tabs
          id="discover"
          value={scope}
          onChange={setScope}
          options={[
            { value: 'roles', label: 'Roles', icon: <Clapperboard size={22} /> },
            { value: 'people', label: 'People', icon: <Users size={22} /> },
            { value: 'projects', label: 'Projects', icon: <Film size={22} /> },
            { value: 'posts', label: 'Posts', icon: <Newspaper size={22} /> },
          ]}
        />
      </div>
      <OfflineBanner />

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
              {projects.map((c) => (
                <div key={c.id} className="poster-item">
                  <Photo media={c.media} className="poster" />
                  <p className="item-title">{c.title}</p>
                  <p className="meta">
                    {org(c.orgId).name} <Verified size={12} />
                  </p>
                </div>
              ))}
              {!projects.length && <EmptyState title="No projects found" />}
            </div>
          )}

          {scope === 'posts' && (posts.length ? <div className="list">{posts.map((p) => <PostCard key={p.id} post={p} />)}</div> : <EmptyState title="No posts yet" />)}
        </motion.div>
      </AnimatePresence>

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
