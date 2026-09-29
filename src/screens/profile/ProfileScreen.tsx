import { BadgeCheck, Camera, ChevronLeft, Flag, Languages, List, Lock, MapPin, Settings, Share } from 'lucide-react';
import type { ReactNode } from 'react';
import * as seed from '../../data/seed';
import type { Credit, Media, Person } from '../../data/types';
import { useStore } from '../../state/store';
import { availableLabel, org, person } from '../../state/selectors';
import { Avatar, Button, EmptyState, IconButton, Photo, Pressable, SectionHeader, Verified } from '../../ui/primitives';
import { PostCard } from '../home/PostCard';
import { RoleRow } from '../discover/RoleRow';

/** Other people's credits and work come from real activity on Ana, never invented for the profile. */
function derive(p: Person) {
  const events = Object.values(seed.networkEvents).flat().filter((e) => e.actorIds.includes(p.id));
  const credits: Credit[] =
    seed.credits[p.id] ??
    events
      .filter((e) => e.kind === 'credit')
      .map((e) => ({ id: e.id, title: e.title!, year: '2025', role: e.detail!, department: '', orgId: e.orgId!, format: 'Feature film', status: 'Released' as const, media: e.media?.[0] ?? seed.portfolio.kiran[1] }));
  const work: Media[] = seed.portfolio[p.id] ?? events.flatMap((e) => (e.kind !== 'credit' ? e.media ?? [] : []));
  return { credits, work, projects: seed.projects[p.id] ?? [], about: seed.about[p.id] };
}

function Fact({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="fact">
      <span className="fact-icon">{icon}</span>
      <span>{children}</span>
    </li>
  );
}

export function ProfileScreen({ id, isTab }: { id: string; isTab?: boolean }) {
  const { viewer, pop, push, availability, following, toggleFollow, openSheet, startConversation, userPosts, userPortfolio, showToast } = useStore();
  const p = person(id);
  const own = id === viewer.id;

  const topbar = (
    <header className="topbar topbar--nav">
      {!isTab && (
        <IconButton label="Back" onClick={pop}>
          <ChevronLeft size={26} />
        </IconButton>
      )}
      <span className="flex" />
      {own && (
        <IconButton label="Your activity" onClick={() => openSheet({ name: 'activity' })}>
          <List size={22} />
        </IconButton>
      )}
      <IconButton label="Share profile" onClick={() => showToast({ text: 'Profile link copied' })}>
        <Share size={20} />
      </IconButton>
      {own && (
        <IconButton label="Settings" onClick={() => showToast({ text: 'Settings' })}>
          <Settings size={21} />
        </IconButton>
      )}
    </header>
  );

  if (!p) return <EmptyState title="Profile unavailable" />;
  if (!own && p.visibility !== 'public') {
    return (
      <div className="screen">
        {topbar}
        <EmptyState icon={<Lock />} title={p.visibility === 'removed' ? 'This profile has been removed' : 'This profile is private'} />
      </div>
    );
  }

  const d = derive(p);
  const work = own ? [...userPortfolio, ...d.work] : d.work;
  const reel = work.find((m) => m.kind === 'video');
  const stills = work.filter((m) => m !== reel);
  const posts = [...userPosts.filter((x) => x.authorId === id), ...seed.posts.filter((x) => x.authorId === id)];
  const collabs = seed.opportunities.filter((o) => o.authorId === id);
  const from = own ? (availability.open ? availability.from : null) : p.availableFrom ?? null;
  const isFollowing = following.includes(id);

  return (
    <div className="screen" data-scroll={isTab ? 'profile' : undefined}>
      {topbar}

      <div className="profile">
        <section className="host-card">
          <div className="host-id">
            <span className="host-photo">
              <Avatar party={p} size={104} />
              {p.identityVerified && (
                <span className="host-badge" aria-label="Identity verified">
                  <BadgeCheck size={18} strokeWidth={2.4} />
                </span>
              )}
            </span>
            <p className="host-name">{p.name}</p>
            <p className="meta">{p.role}</p>
          </div>
          <div className="host-stats">
            <div>
              <b>{d.credits.length}</b>
              <span>Credits</span>
            </div>
            <div>
              <b>{p.years ?? '–'}</b>
              <span>Years</span>
            </div>
            <div>
              <b>{d.projects.length + work.length}</b>
              <span>Works</span>
            </div>
          </div>
        </section>

        <div className="profile-actions">
          {own ? (
            <Button block variant="secondary" onClick={() => showToast({ text: 'Edit profile' })}>
              Edit profile
            </Button>
          ) : (
            <>
              <Button
                block
                onClick={() => {
                  const cid = startConversation(id, { kind: 'project', label: 'Direct', detail: 'Direct message', refId: `profile-${id}` });
                  push({ name: 'conversation', id: cid });
                }}
              >
                Message
              </Button>
              <Button block variant="secondary" onClick={() => toggleFollow(id)}>
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
            </>
          )}
        </div>

        <ul className="facts">
          {from && (
            <li className="fact">
              <span className="fact-icon">
                <span className="status-dot is-on" />
              </span>
              <span>{availableLabel(from)}</span>
              {own && (
                <button className="link" onClick={() => openSheet({ name: 'availability' })}>
                  Edit
                </button>
              )}
            </li>
          )}
          <Fact icon={<MapPin size={20} />}>Based in {p.city}</Fact>
          {p.languages && <Fact icon={<Languages size={20} />}>{p.languages.join(', ')}</Fact>}
          {p.gear && <Fact icon={<Camera size={20} />}>{p.gear}</Fact>}
        </ul>

        {d.about && <p className="body profile-about">{d.about}</p>}

        {reel && (
          <section className="section section--flush">
            <SectionHeader title="Showreel" />
            <Pressable className="reel" onClick={() => push({ name: 'media', items: [reel], index: 0 })} scale={0.985}>
              <Photo media={reel} />
            </Pressable>
          </section>
        )}

        <section className="section section--flush">
          <SectionHeader title="Credits" />
          {d.credits.length ? (
            <div className="list list--flush">
              {d.credits.map((c) => (
                <div key={c.id} className="credit">
                  <Photo media={c.media} className="credit-poster" showPlay={false} />
                  <div className="credit-text">
                    <p className="item-title">{c.title}</p>
                    <p className="meta meta--dark">{c.role}</p>
                    <p className="meta">
                      {org(c.orgId).name} <Verified size={12} /> · {c.year}
                    </p>
                  </div>
                  {own && (
                    <IconButton label={`Report ${c.title}`} className="icon-btn--quiet" onClick={() => openSheet({ name: 'reportCredit', title: c.title })}>
                      <Flag size={16} />
                    </IconButton>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="meta">No credits yet</p>
          )}
        </section>

        {stills.length > 0 && (
          <section className="section section--flush">
            <SectionHeader title="Work" />
            <div className="grid-3">
              {stills.map((m, i) => (
                <Pressable key={m.id + i} className="grid-item" onClick={() => push({ name: 'media', items: stills, index: i })} scale={0.97}>
                  <Photo media={m} />
                </Pressable>
              ))}
            </div>
          </section>
        )}

        {d.projects.length > 0 && (
          <section className="section section--flush">
            <SectionHeader title="Projects" />
            <div className="list list--flush">
              {d.projects.map((pr) => (
                <div key={pr.id} className="rrow">
                  <Photo media={pr.media} className="rrow-thumb" showPlay={false} />
                  <div className="rrow-text">
                    <p className="item-title">{pr.title}</p>
                    <p className="meta meta--dark">{pr.role}</p>
                    <p className="meta">
                      {pr.format} · {pr.year}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {collabs.length > 0 && !own && (
          <section className="section section--flush">
            <SectionHeader title="Collaborations" />
            <div className="list list--flush">
              {collabs.map((o) => (
                <RoleRow key={o.id} o={o} />
              ))}
            </div>
          </section>
        )}

        {posts.length > 0 && (
          <section className="section section--flush">
            <SectionHeader title="Posts" />
            <div className="list list--flush">
              {posts.map((x) => (
                <PostCard key={x.id} post={x} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
