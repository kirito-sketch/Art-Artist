import { AnimatePresence, motion } from 'framer-motion';
import { ArrowUpLeft, Clock, Search, SearchX, UserCheck, UserPlus, X } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import * as seed from '../../data/seed';
import type { Opportunity, Person } from '../../data/types';
import { useStore } from '../../state/store';
import { org, person } from '../../state/selectors';
import { stagger } from '../../ui/motion';
import { Avatar, Chip, EmptyState, PressCard, Pressable, SectionHeader, TypeBadge, Verified } from '../../ui/primitives';
import { Still } from '../../ui/Still';
import { OfflineBanner } from '../../ui/chrome';
import { PostCard } from '../home/PostCard';

export type Scope = 'all' | 'opportunities' | 'people' | 'projects' | 'collaborations' | 'following';

const SCOPES: { id: Scope; label: string }[] = [
  { id: 'all', label: 'All' },
  { id: 'opportunities', label: 'Opportunities' },
  { id: 'people', label: 'People' },
  { id: 'projects', label: 'Projects' },
  { id: 'collaborations', label: 'Collaborations' },
  { id: 'following', label: 'Following' },
];

const RECENT = ['Gaffer Hyderabad', 'Colourist', 'Konark Pictures'];

/* Only adult, public profiles are discoverable. Guardian-managed minor profiles never enter this index. */
const discoverablePeople = (viewerId: string) => seed.people.filter((p) => p.id !== viewerId && p.visibility === 'public');

const allProjects = () => {
  const seen = new Set<string>();
  return Object.values(seed.credits)
    .flat()
    .filter((c) => (seen.has(c.title) ? false : (seen.add(c.title), true)));
};

export function OppRow({ o, index = 0 }: { o: Opportunity; index?: number }) {
  const { push, responses, interestsSent } = useStore();
  const byline = o.orgId ? org(o.orgId).name : person(o.authorId!).name;
  const sent = responses[o.id] || interestsSent[o.id] !== undefined;
  return (
    <motion.div {...stagger(index, 0.03)}>
      <PressCard className="opp-row" onPress={() => push({ name: 'opportunity', id: o.id })} scale={0.985}>
        <Still media={o.media} className={`opp-row-media ${o.kind === 'collab' ? 'opp-row-media--collab' : ''}`} showPlay={false} />
        <div className="opp-row-text">
          <TypeBadge kind={o.kind} />
          <p className="opp-row-title">{o.role}</p>
          <p className="opp-row-by">
            {o.kind === 'collab' ? `${o.collabIntent === 'available' ? 'Available' : 'Posted by'} ${byline}` : byline}
            {o.orgId && <Verified size={12} />}
          </p>
          <p className="opp-row-facts">
            {o.project} · {o.city} · {o.paid ? o.compensation : 'Unpaid'}
          </p>
        </div>
        {sent && <span className="opp-row-sent">Sent</span>}
      </PressCard>
    </motion.div>
  );
}

function PersonRow({ p, index = 0 }: { p: Person; index?: number }) {
  const { push, following, toggleFollow } = useStore();
  const on = following.includes(p.id);
  return (
    <motion.div {...stagger(index, 0.03)}>
      <PressCard className="person-row" onPress={() => push({ name: 'profile', id: p.id })} scale={0.985}>
        <Avatar party={p} size={46} ring={p.availableFrom ? 'available' : undefined} />
        <div className="person-row-text">
          <p className="person-row-name">{p.name}</p>
          <p className="person-row-role">
            {p.role} · {p.city}
            {p.years ? ` · ${p.years} yrs` : ''}
          </p>
          {p.availableFrom && <Chip tone="available">Available from {p.availableFrom}</Chip>}
        </div>
        <Pressable
          className={`follow-btn ${on ? 'is-on' : ''}`}
          scale={0.9}
          onClick={(e) => {
            e.stopPropagation();
            toggleFollow(p.id);
          }}
          aria-label={on ? `Unfollow ${p.name}` : `Follow ${p.name}`}
        >
          {on ? <UserCheck size={16} /> : <UserPlus size={16} />}
        </Pressable>
      </PressCard>
    </motion.div>
  );
}

export function DiscoverScreen({ scope, setScope }: { scope: Scope; setScope: (s: Scope) => void }) {
  const { viewer, following, userPosts, userCollabs, scenario } = useStore();
  const [query, setQuery] = useState('');
  const [focused, setFocused] = useState(false);
  const [craft, setCraft] = useState<string | null>(null);
  const [kind, setKind] = useState<'all' | Opportunity['kind']>('all');
  const [paidOnly, setPaidOnly] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const q = query.trim().toLowerCase();
  const opportunities = useMemo(
    () => [...userCollabs, ...seed.opportunities].filter((o) => o.authorId !== viewer.id || userCollabs.includes(o)),
    [userCollabs, viewer.id],
  );
  const people = discoverablePeople(viewer.id);
  const projects = allProjects();
  const posts = [...userPosts, ...seed.posts.filter((p) => following.includes(p.authorId))];

  const matchOpp = (o: Opportunity) => {
    const byline = o.orgId ? org(o.orgId).name : person(o.authorId!).name;
    return [o.role, o.project, o.city, o.projectType, byline].join(' ').toLowerCase().includes(q);
  };
  const matchPerson = (p: Person) => [p.name, p.role, p.city, p.craft].join(' ').toLowerCase().includes(q);

  const filteredOpps = opportunities
    .filter((o) => (kind === 'all' ? true : o.kind === kind))
    .filter((o) => (paidOnly ? o.paid : true))
    .filter((o) => (scope === 'collaborations' ? o.kind === 'collab' : true))
    .filter((o) => (q ? matchOpp(o) : true));
  const filteredPeople = people.filter((p) => (craft ? p.craft === craft || (craft === 'cinematographer' && p.craft === 'camera') : true)).filter((p) => (q ? matchPerson(p) : true));
  const filteredProjects = projects.filter((c) => (q ? [c.title, c.format, org(c.orgId).name].join(' ').toLowerCase().includes(q) : true));

  const searching = q.length > 0;
  const noResults = searching && !filteredOpps.length && !filteredPeople.length && !filteredProjects.length;

  const craftLabel = craft ? seed.crafts.find((c) => c.id === craft)?.label : null;

  return (
    <div className="screen-scroll" data-scroll="discover">
      <div className="discover-head">
        <h1 className="screen-title">Discover</h1>
        <p className="screen-sub">Roles, people and work across Ana</p>
      </div>

      <div className="search-sticky">
        <div className={`search ${focused ? 'is-focused' : ''}`}>
          <Search size={18} />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => window.setTimeout(() => setFocused(false), 120)}
            placeholder="Search roles, people, projects"
            aria-label="Search"
            enterKeyHint="search"
          />
          <AnimatePresence>
            {query && (
              <motion.button className="search-clear" initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} onClick={() => setQuery('')} aria-label="Clear search">
                <X size={14} strokeWidth={2.6} />
              </motion.button>
            )}
          </AnimatePresence>
        </div>
        <div className="scope-row">
          {SCOPES.map((s) => (
            <button key={s.id} className={`scope ${scope === s.id ? 'is-on' : ''}`} onClick={() => setScope(s.id)}>
              {scope === s.id && <motion.span layoutId="scope-pill" className="scope-pill" transition={{ type: 'spring', stiffness: 500, damping: 38 }} />}
              <span>{s.label}</span>
            </button>
          ))}
        </div>
      </div>
      <OfflineBanner />

      <AnimatePresence mode="wait">
        <motion.div key={`${scope}-${searching}-${focused && !query}`} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} transition={{ duration: 0.18 }} className="discover-body">
          {focused && !query ? (
            <div className="recent">
              <p className="recent-label">Recent</p>
              {RECENT.map((r) => (
                <button key={r} className="recent-item" onMouseDown={() => setQuery(r.split(' ')[0])}>
                  <Clock size={15} />
                  <span>{r}</span>
                  <ArrowUpLeft size={15} className="muted" />
                </button>
              ))}
            </div>
          ) : noResults ? (
            <EmptyState icon={<SearchX />} title={`Nothing for "${query}"`} body="Try a craft (gaffer, colourist), a city, or a production house name." />
          ) : scope === 'following' ? (
            posts.length ? (
              <div className="post-list">{posts.map((p) => <PostCard key={p.id} post={p} />)}</div>
            ) : (
              <EmptyState title="No posts yet" body="Posts from people you follow will show here." />
            )
          ) : (
            <>
              {(scope === 'all' || scope === 'opportunities' || scope === 'collaborations') && (
                <section className="discover-section">
                  {scope === 'all' && <SectionHeader title={searching ? 'Opportunities' : 'Open roles'} meta={searching ? `${filteredOpps.length} results` : `${filteredOpps.length} open now`} action={!searching && filteredOpps.length > 4 ? 'See all' : undefined} onAction={() => setScope('opportunities')} />}
                  {scope !== 'all' && (
                    <div className="filter-row">
                      {scope === 'opportunities' &&
                        (['all', 'crew', 'casting', 'collab'] as const).map((k) => (
                          <button key={k} className={`pick pick--s ${kind === k ? 'is-on' : ''}`} onClick={() => setKind(k)}>
                            {{ all: 'All types', crew: 'Crew jobs', casting: 'Casting calls', collab: 'Collaborations' }[k]}
                          </button>
                        ))}
                      <button className={`pick pick--s ${paidOnly ? 'is-on' : ''}`} onClick={() => setPaidOnly((p) => !p)}>
                        Paid only
                      </button>
                    </div>
                  )}
                  <div className="row-list">
                    {(scope === 'all' && !searching ? filteredOpps.slice(0, 4) : filteredOpps).map((o, i) => (
                      <OppRow key={o.id} o={o} index={i} />
                    ))}
                    {!filteredOpps.length && <EmptyState title="No roles match these filters" body="Try removing a filter." />}
                  </div>
                </section>
              )}

              {(scope === 'all' || scope === 'people') && (
                <section className="discover-section">
                  {!searching && scope === 'all' ? (
                    <>
                      <SectionHeader title="Browse by craft" />
                      <div className="craft-grid">
                        {seed.crafts.map((c, i) => (
                          <motion.div key={c.id} {...stagger(i, 0.03)}>
                            <PressCard
                              className="craft-tile"
                              onPress={() => {
                                setCraft(c.id);
                                setScope('people');
                              }}
                            >
                              <Still media={c.media} showPlay={false} />
                              <span className="craft-tile-label">{c.label}</span>
                              <span className="craft-tile-count">{c.count.toLocaleString('en-IN')}</span>
                            </PressCard>
                          </motion.div>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      {scope === 'all' && <SectionHeader title="People" meta={`${filteredPeople.length} ${filteredPeople.length === 1 ? 'result' : 'results'}`} />}
                      {scope === 'people' && (
                        <div className="filter-row">
                          <button className={`pick pick--s ${!craft ? 'is-on' : ''}`} onClick={() => setCraft(null)}>
                            Everyone
                          </button>
                          {seed.crafts.slice(0, 6).map((c) => (
                            <button key={c.id} className={`pick pick--s ${craft === c.id ? 'is-on' : ''}`} onClick={() => setCraft(c.id)}>
                              {c.label}
                            </button>
                          ))}
                        </div>
                      )}
                      {craftLabel && scope === 'people' && <p className="hint hint--tight">Showing {craftLabel.toLowerCase()} professionals. Only public adult profiles appear in search.</p>}
                      <div className="row-list">
                        {filteredPeople.slice(0, scope === 'all' ? 4 : undefined).map((p, i) => (
                          <PersonRow key={p.id} p={p} index={i} />
                        ))}
                        {!filteredPeople.length && <EmptyState title="No one here yet" body="Try another craft." />}
                      </div>
                    </>
                  )}
                </section>
              )}

              {(scope === 'all' || scope === 'projects') && filteredProjects.length > 0 && (
                <section className="discover-section">
                  <SectionHeader title={searching ? 'Projects' : 'Recently credited projects'} meta={scope === 'all' ? undefined : `${filteredProjects.length}`} />
                  <div className={scope === 'projects' ? 'poster-grid' : 'poster-rail'}>
                    {filteredProjects.map((c, i) => (
                      <motion.div key={c.id} {...stagger(i, 0.03)} className="poster-tile">
                        <div className="poster">
                          <Still media={c.media} showPlay={false} />
                          <span className="poster-title">{c.title}</span>
                        </div>
                        <p className="poster-meta">
                          {c.format} · {c.year}
                        </p>
                        <p className="poster-org">
                          {org(c.orgId).name} <Verified size={11} />
                        </p>
                      </motion.div>
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
          {scenario.offline && <p className="hint">Search needs a connection. Results above are from your last session.</p>}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
