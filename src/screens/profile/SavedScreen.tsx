import { Bookmark, ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import * as seed from '../../data/seed';
import type { IndustryEvent, Opportunity, Person, Post } from '../../data/types';
import type { Work } from '../../data/works';
import { blockedBy, publicProjects, publicCreditsFor } from '../../domain/discovery';
import { useStore, type SavedItem } from '../../state/store';
import { findOpportunity, org, person } from '../../state/selectors';
import { world } from '../../state/world';
import { FrameLabel, PosterTile } from '../../ui/compose';
import { shared } from '../../ui/motion';
import { Avatar, Chip, EmptyState, IconButton, PressCard, SectionHeader, Verified } from '../../ui/primitives';
import { PostGrid } from '../discover/PostGrid';
import { RoleRow } from '../discover/RoleRow';
import { EventTicket } from '../event/eventUnits';
import { hostFacts } from '../../state/events';
import { listable } from '../../domain/events';

/*
 * Saved (docs/SAVE_MODEL.md, V30): one private list of the People, Opportunities, Projects and Posts
 * the person kept to come back to. Saving a person is a private shortlist: they are never told. Never public, never a profile section, one tap from their own Profile. Privacy and
 * blocking always win over a save: anything the person can no longer see is withheld here too,
 * and only counted ("no longer available"), never shown.
 */

type Filter = 'all' | 'person' | 'role' | 'project' | 'post' | 'event';

interface Resolved {
  people: Person[];
  posts: Post[];
  roles: { o: Opportunity; note?: string }[];
  projects: Work[];
  events: IndustryEvent[];
  hidden: number;
  latest: Record<'person' | 'post' | 'role' | 'project' | 'event', number>;
}

function resolve(saved: SavedItem[], viewerId: string, userPosts: Post[], userCollabs: Opportunity[], roleStatus: Record<string, { state: string }>, events: IndustryEvent[]): Resolved {
  const blocked = blockedBy(viewerId);
  const visibleProjects = publicProjects();
  const out: Resolved = { people: [], posts: [], roles: [], projects: [], events: [], hidden: 0, latest: { person: 0, post: 0, role: 0, project: 0, event: 0 } };
  const now = Date.now();
  for (const s of saved) {
    if (s.kind === 'person') {
      const p = seed.people.find((x) => x.id === s.id);
      // A private, removed or blocked profile is withheld, only counted.
      if (!p || p.visibility !== 'public' || blocked.includes(p.id)) out.hidden++;
      else out.people.push(p);
    } else if (s.kind === 'post') {
      const p = userPosts.find((x) => x.id === s.id) ?? seed.posts.find((x) => x.id === s.id);
      // A deleted post, or one by someone blocked either way, is gone from Saved.
      if (!p || blocked.includes(p.authorId)) out.hidden++;
      else out.posts.push(p);
    } else if (s.kind === 'role') {
      const o = findOpportunity(s.id, userCollabs);
      const wr = world.roles.find((r) => r.id === s.id);
      if (!o || blocked.includes(o.orgId ?? o.authorId ?? '') || (wr && wr.visibility !== 'open')) out.hidden++;
      else {
        // A closed or filled role stays, marked, so the person knows what happened to it.
        const st = roleStatus[s.id]?.state;
        out.roles.push({ o, note: st === 'filled' ? 'Role filled' : st === 'closed' ? 'Role closed' : undefined });
      }
    } else if (s.kind === 'event') {
      const e = events.find((x) => x.id === s.id);
      // A cancelled event stays, marked, so the person knows. A past one simply drops off.
      if (!e || (e.end ?? e.start) < now) continue;
      if (e.status === 'cancelled' || listable(e, hostFacts(e.hostId), now)) out.events.push(e);
      else out.hidden++;
    } else {
      const w = visibleProjects.find((x) => x.id === s.id);
      // A project its owner made private again is not shown.
      if (!w || blocked.includes(w.orgIds[0] ?? w.ownerId ?? '')) out.hidden++;
      else out.projects.push(w);
    }
    if (!out.latest[s.kind]) out.latest[s.kind] = s.at;
  }
  return out;
}

export function SavedScreen() {
  const { pop, push, saved, viewer, userPosts, userCollabs, roleStatus, events } = useStore();
  const [filter, setFilter] = useState<Filter>('all');
  const r = resolve(saved, viewer.id, userPosts, userCollabs, roleStatus as Record<string, { state: string }>, events);
  const counts = { person: r.people.length, post: r.posts.length, role: r.roles.length, project: r.projects.length, event: r.events.length };
  const total = counts.person + counts.post + counts.role + counts.project + counts.event;
  const openPost = (list: Post[], i: number) => push({ name: 'posts', ids: list.map((p) => p.id), index: i });

  const people = (limit?: number) => (
    <div className="list list--flush">
      {r.people.slice(0, limit).map((p) => {
        const n = publicCreditsFor(p.id).length;
        return (
          <PressCard key={p.id} className="prow" onPress={() => push({ name: 'profile', id: p.id })} scale={0.985}>
            <Avatar party={p} size={48} available={!!p.availableFrom} />
            <div className="prow-text">
              <p className="item-title">{p.name}</p>
              <p className="meta">
                {p.role} · {p.city}
                {n ? ` · ${n} verified ${n === 1 ? 'credit' : 'credits'}` : ''}
              </p>
            </div>
          </PressCard>
        );
      })}
    </div>
  );
  const roles = (limit?: number) => (
    <div className="list list--flush">
      {r.roles.slice(0, limit).map(({ o, note }) => (
        <RoleRow key={o.id} o={o} note={note} />
      ))}
    </div>
  );
  const projects = (limit?: number) => (
    <div className="saved-posters">
      {r.projects.slice(0, limit).map((w) => (
        <PosterTile
          key={w.id}
          media={w.media.id === 'ph' ? undefined : w.stills[0] ?? w.media}
          title={w.title}
          meta={w.orgIds[0] ? <>{org(w.orgIds[0]).name} <Verified size={12} /></> : w.ownerId ? person(w.ownerId).name : undefined}
          label={<FrameLabel>{w.stage === 'Released' ? w.year : w.stage}</FrameLabel>}
          sharedId={filter === 'project' && w.media.id !== 'ph' ? shared.work(w.id) : undefined}
          onPress={() => push({ name: 'work', id: w.id, from: filter === 'project' ? 'card' : undefined })}
        />
      ))}
    </div>
  );
  const eventList = (limit?: number) => (
    <div className="ev-list">
      {[...r.events].sort((a, b) => a.start - b.start).slice(0, limit).map((e) => (
        <EventTicket key={e.id} e={e} />
      ))}
    </div>
  );
  const posts = (limit?: number) => <PostGrid posts={r.posts.slice(0, limit)} onOpen={(i) => openPost(r.posts, i)} />;

  // "All": each kind as its own family, the most recently saved kind first.
  const order = (['person', 'role', 'project', 'event', 'post'] as const).filter((k) => counts[k]).sort((a, b) => r.latest[b] - r.latest[a]);
  const titles = { person: 'People', role: 'Opportunities', project: 'Projects', event: 'Events', post: 'Posts' };

  return (
    <div className="screen canvas saved-screen">
      <header className="topbar topbar--nav stream-bar">
        <IconButton label="Back" onClick={pop}>
          <ChevronLeft size={26} />
        </IconButton>
        <span className="stream-bar-title">Saved</span>
        <span className="stream-bar-spacer" />
      </header>
      <p className="saved-private">
        <Bookmark size={13} /> Private to you. People, opportunities, projects and posts you save. No one is told.
      </p>

      <div className="chips chips--scroll chips--pad saved-filters" role="group" aria-label="Show saved">
        {(
          [
            ['all', 'All', total],
            ['person', 'People', counts.person],
            ['role', 'Opportunities', counts.role],
            ['project', 'Projects', counts.project],
            ...(counts.event ? ([['event', 'Events', counts.event]] as const) : []),
            ['post', 'Posts', counts.post],
          ] as const
        ).map(([id, label, n]) => (
          <Chip key={id} active={filter === id} onClick={() => setFilter(id)}>
            {label}
            {n ? ` · ${n}` : ''}
          </Chip>
        ))}
      </div>

      {filter === 'all' ? (
        total ? (
          order.map((k) => (
            <section key={k} className="saved-section">
              <SectionHeader title={titles[k]} action={counts[k] > 4 ? 'See all' : undefined} onAction={() => setFilter(k)} />
              {k === 'person' ? people(4) : k === 'role' ? roles(4) : k === 'project' ? projects(4) : k === 'event' ? eventList(4) : posts(6)}
            </section>
          ))
        ) : (
          <EmptyState title="Nothing saved yet" body="Use the bookmark on a person, opportunity, project or post to keep it here. Only you can see this list." />
        )
      ) : counts[filter] ? (
        <section className="saved-section">{filter === 'person' ? people() : filter === 'role' ? roles() : filter === 'project' ? projects() : filter === 'event' ? eventList() : posts()}</section>
      ) : (
        <EmptyState title={`No saved ${titles[filter].toLowerCase()}`} body="Use the bookmark to keep one here." />
      )}

      {r.hidden > 0 && (
        <p className="saved-hidden">
          {r.hidden} saved {r.hidden === 1 ? 'item is' : 'items are'} no longer available to you.
        </p>
      )}
    </div>
  );
}
