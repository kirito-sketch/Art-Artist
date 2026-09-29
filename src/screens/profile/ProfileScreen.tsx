import { Camera, ChevronLeft, List, Lock, MoreHorizontal, Play, Settings, Share } from 'lucide-react';
import { useEffect, useState, type ReactNode } from 'react';
import * as seed from '../../data/seed';
import type { Credit, Media, Person } from '../../data/types';
import { useStore } from '../../state/store';
import { availableLabel, org, person } from '../../state/selectors';
import { Button, EmptyState, IconButton, Photo, Pressable, SectionHeader, Verified } from '../../ui/primitives';
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
  const { viewer, pop, push, availability, following, toggleFollow, openSheet, startConversation, userPosts, userPortfolio, showToast, setHero } = useStore();
  const p = person(id);
  const own = id === viewer.id;
  const heroKey = isTab ? `profile-${id}-tab` : `profile-${id}`;
  const [overHero, setOverHero] = useState(true);

  // While the photo sits under the status bar, the bar turns light.
  useEffect(() => {
    setHero(heroKey, overHero && p?.visibility !== 'private');
    return () => setHero(heroKey, false);
  }, [heroKey, overHero, setHero, p?.visibility]);

  if (!p) return <EmptyState title="Profile unavailable" />;
  if (!own && p.visibility !== 'public') {
    return (
      <div className="screen">
        <header className="topbar topbar--nav">
          <IconButton label="Back" onClick={pop}>
            <ChevronLeft size={26} />
          </IconButton>
        </header>
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
  const backdrop = reel ?? work[0] ?? d.credits[0]?.media;
  // Portrait first; until a headshot exists, the person's own work stands in.
  const hero: Media = { id: `hero-${id}`, kind: 'image', src: p.photo ?? '', fallback: backdrop?.fallback ?? backdrop?.src };

  return (
    <div className="screen screen--hero" data-scroll={isTab ? 'profile' : undefined} onScroll={(e) => setOverHero(e.currentTarget.scrollTop < 360)}>
      <div className="phero">
        <Photo media={hero} className="phero-photo" alt={p.name} />
        <div className="phero-bar">
          {isTab ? (
            <IconButton label="Your activity" className="icon-btn--float" onClick={() => openSheet({ name: 'activity' })}>
              <List size={20} />
            </IconButton>
          ) : (
            <IconButton label="Back" className="icon-btn--float" onClick={pop}>
              <ChevronLeft size={24} />
            </IconButton>
          )}
          <span className="flex" />
          <IconButton label="Share profile" className="icon-btn--float" onClick={() => showToast({ text: 'Profile link copied' })}>
            <Share size={18} />
          </IconButton>
          <IconButton label={own ? 'Settings' : 'More'} className="icon-btn--float" onClick={() => showToast({ text: own ? 'Settings' : 'Report or block' })}>
            {own ? <Settings size={19} /> : <MoreHorizontal size={20} />}
          </IconButton>
        </div>
      </div>

      <div className="psheet">
        <header className="pid">
          <h1 className="large-title">
            {p.name}
            {p.identityVerified && <Verified size={22} label="Identity verified" />}
          </h1>
          <p className="pid-role">{p.role}</p>
          <p className="meta">
            {p.city}
            {p.languages ? ` · ${p.languages.join(', ')}` : ''}
          </p>
          <p className="pid-stats">
            <span>
              <b>{d.credits.length}</b> credits
            </span>
            {p.years && (
              <span>
                <b>{p.years}</b> years active
              </span>
            )}
          </p>
          {from && (
            <button className="pid-available" onClick={() => own && openSheet({ name: 'availability' })} disabled={!own}>
              <span className="status-dot is-on" />
              {availableLabel(from)}
            </button>
          )}
        </header>

        <div className="profile-actions">
          {own ? (
            <Button block variant="secondary" onClick={() => showToast({ text: 'Edit profile' })}>
              Edit profile
            </Button>
          ) : (
            <>
              <Button block variant={isFollowing ? 'secondary' : 'primary'} onClick={() => toggleFollow(id)}>
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
              <Button
                block
                variant="outline"
                onClick={() => {
                  const cid = startConversation(id, { kind: 'project', label: 'Direct', detail: 'Direct message', refId: `profile-${id}` });
                  push({ name: 'conversation', id: cid });
                }}
              >
                Message
              </Button>
            </>
          )}
        </div>

        {reel && (
          <section className="section section--flush">
            <SectionHeader title="Showreel" />
            <Pressable className="reel" onClick={() => push({ name: 'media', items: [reel], index: 0 })} scale={0.985}>
              <Photo media={reel} showPlay={false} />
              <span className="reel-play" aria-hidden>
                <Play size={20} fill="currentColor" strokeWidth={0} />
              </span>
              <span className="reel-caption">
                <span className="item-title">{reel.caption ?? 'Showreel'}</span>
                <span className="reel-sub">
                  {p.role} · {reel.duration}
                </span>
              </span>
            </Pressable>
          </section>
        )}

        <section className="section section--flush">
          <SectionHeader title="Credits" />
          {d.credits.length ? (
            <div className="rail">
              {d.credits.map((c) => (
                <Pressable key={c.id} className="rail-item" scale={0.97} onClick={() => own && openSheet({ name: 'reportCredit', title: c.title })} aria-label={own ? `${c.title}, report a problem` : c.title}>
                  <Photo media={c.media} className="rail-poster" showPlay={false} />
                  <p className="item-title">{c.title}</p>
                  <p className="meta">{c.role}</p>
                  <p className="meta rail-issuer">
                    {org(c.orgId).name} <Verified size={12} />
                  </p>
                </Pressable>
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

        {(d.about || p.gear) && (
          <section className="section section--flush">
            <SectionHeader title="About" />
            {d.about && <p className="body">{d.about}</p>}
            {p.gear && (
              <ul className="facts facts--tight facts--after">
                <Fact icon={<Camera size={20} />}>{p.gear}</Fact>
              </ul>
            )}
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
