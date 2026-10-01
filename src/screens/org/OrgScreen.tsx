import { ChevronDown, ChevronLeft, Lock, MoreHorizontal, Settings, Share } from 'lucide-react';
import { useEffect, useState } from 'react';
import * as seed from '../../data/seed';
import { isLive, type Work } from '../../data/works';
import { world, worksForOrg } from '../../state/world';
import { useStore } from '../../state/store';
import { org, person } from '../../state/selectors';
import { Avatar, Button, FollowButton, EmptyState, IconButton, Photo, PressCard, Pressable, SectionHeader, Verified } from '../../ui/primitives';
import { RoleRow } from '../discover/RoleRow';
import { useLoad } from '../../ui/useLoad';
import { PageError, PageSkeleton } from '../../ui/PageStates';

/**
 * The organisation's public identity. One page: visitors see it from a byline, a credit or search;
 * members acting for the house see the same page on their Profile tab, with edit actions instead of
 * Follow. What a creative wants to know first: who they are, what they're making now, and whether
 * people like me have worked with them.
 *
 * Two orders are prototyped (see docs/PRODUCTION_HOUSE_EXPLORATION.md):
 *   work    Work first. Reputation before recruitment.
 *   hiring  Open roles first. The page as a front door for hiring.
 */
export function OrgScreen({ id, isTab }: { id: string; isTab?: boolean }) {
  const { pop, push, openSheet, acting, following, toggleFollow, startConversation, houseProfile, setHero, showToast, blocked, roleStatus, memberships, setActing } = useStore();
  const o = org(id);
  const own = acting === id;
  const [scrollY, setScrollY] = useState(0);
  const heroKey = isTab ? 'org-tab' : `org-${id}`;
  useEffect(() => {
    setHero(heroKey, scrollY < 300);
    return () => setHero(heroKey, false);
  }, [heroKey, scrollY, setHero]);
  const load = useLoad(`org-${id}`);
  if (load.state === 'loading' && !isTab) return <PageSkeleton />;
  if (load.state === 'error' && !isTab) return <PageError what="page" retry={load.retry} />;

  if (!o) return <EmptyState title="Page unavailable" />;
  const ws = worksForOrg(id);
  const live = ws.filter(isLive);
  const made = ws.filter((w) => !isLive(w));
  const roles = [...world.roles.filter((r) => r.orgId === id && r.visibility === 'open' && !roleStatus[r.id]), ...seed.opportunities.filter((x) => x.orgId === id && !roleStatus[x.id])];
  // People who accepted a credit on this house's work. Earned, never curated by the house.
  const counts = new Map<string, number>();
  ws.forEach((w) => w.credits.forEach((c) => counts.set(c.personId, (counts.get(c.personId) ?? 0) + 1)));
  const people = [...counts.entries()].sort((a, b) => b[1] - a[1]).map(([pid, n]) => ({ p: person(pid), n }));
  const hero = (live[0] ?? made[0])?.stills[0];
  const isFollowing = following.includes(id);

  const nowMaking = live.length > 0 && (
    <section key="now" className="section section--flush">
      <SectionHeader title="Now making" />
      <div className="org-now">
        {live.map((w) => (
          <NowCard key={w.id} w={w} roles={roles.filter((r) => r.project === w.title).map((r) => r.role)} />
        ))}
      </div>
    </section>
  );
  const hiring = roles.length > 0 && (
    <section key="hiring" className="section section--flush">
      <SectionHeader title={`Hiring · ${roles.length}`} />
      <div className="list list--flush">
        {roles.map((r) => (
          <RoleRow key={r.id} o={r} />
        ))}
      </div>
    </section>
  );
  const filmography = made.length > 0 && (
    <section key="made" className="section section--flush">
      <SectionHeader title="Made by us" />
      <div className="rail">
        {made.map((w) => (
          <Pressable key={w.id} className="rail-item" scale={0.97} onClick={() => push({ name: 'work', id: w.id })}>
            <Photo media={w.media} className="rail-poster" showPlay={false} />
            <p className="item-title">{w.title}</p>
            <p className="meta">
              {w.year}
              {w.orgIds[0] !== id ? ` · with ${org(w.orgIds[0]).name}` : ''}
            </p>
          </Pressable>
        ))}
      </div>
    </section>
  );
  const workedWith = people.length > 0 && (
    <section key="people" className="section section--flush">
      <SectionHeader title="Worked with" />
      <div className="org-people">
        {people.slice(0, 8).map(({ p, n }) => (
          <Pressable key={p.id} className="org-person" onClick={() => push({ name: 'profile', id: p.id })} scale={0.95}>
            <Avatar party={p} size={56} />
            <span className="org-person-name">{p.name.split(' ')[0]}</span>
            <span className="meta">{n > 1 ? `${n} films` : p.role}</span>
          </Pressable>
        ))}
      </div>
      <p className="meta work-foot">
        <Verified size={12} /> {people.length} people accepted credits on our work
      </p>
    </section>
  );
  const sections = houseProfile === 'hiring' ? [hiring, nowMaking, filmography, workedWith] : [nowMaking, filmography, workedWith, hiring];

  return (
    <div className="screen screen--hero" data-scroll={isTab ? 'profile' : undefined} onScroll={(e) => setScrollY(e.currentTarget.scrollTop)}>
      <div className="whero whero--org">
        <div className="ohero-parallax" style={{ transform: `translateY(${Math.max(0, scrollY) * 0.4}px)` }}>
          {hero ? <Photo media={hero} className="whero-photo" showPlay={false} /> : <div className="whero-photo whero-empty" />}
        </div>
        <div className="phero-bar">
          {isTab ? (
            <span />
          ) : (
            <IconButton label="Back" className="icon-btn--float" onClick={pop}>
              <ChevronLeft size={24} />
            </IconButton>
          )}
          <span className="flex" />
          <IconButton label="Share" className="icon-btn--float" onClick={() => openSheet({ name: 'share', label: o.name })}>
            <Share size={18} />
          </IconButton>
          {own ? (
            <IconButton label="House settings" className="icon-btn--float" onClick={() => push({ name: 'settings' })}>
              <Settings size={19} />
            </IconButton>
          ) : (
            <IconButton label="More" className="icon-btn--float" onClick={() => openSheet({ name: 'more', id })}>
              <MoreHorizontal size={20} />
            </IconButton>
          )}
        </div>
      </div>

      <div className="psheet">
        <header className="org-id">
          <Avatar party={o} size={64} />
          {own ? (
            <button className="org-name org-name--switch" onClick={() => openSheet({ name: 'identity' })} aria-label="Switch identity">
              {o.name} {o.verified && <Verified size={18} />} <ChevronDown size={18} />
            </button>
          ) : (
            <h1 className="org-name">
              {o.name} {o.verified && <Verified size={18} label="Verified production house" />}
            </h1>
          )}
          <p className="meta">Production house · {o.city}</p>
          {!o.verified && <p className="meta">Verification pending · only people who act for {o.name} can see this page</p>}
          <p className="body">{o.about}</p>
          <p className="pid-stats">
            <span>
              <b>{ws.length}</b> projects on Art and Artist
            </span>
            <span>
              <b>{people.length}</b> credited people
            </span>
          </p>
        </header>

        {blocked.includes(id) ? (
          <EmptyState icon={<Lock />} title={`You blocked ${o.name}`} body="Unblock from More to see their work and roles again." />
        ) : (
          <>
            <div className="profile-actions">
              {own ? (
                <>
                  <Button block variant="secondary" onClick={() => showToast({ text: 'House details are set up with Art and Artist during onboarding' })}>
                    Edit page
                  </Button>
                  <Button block variant="outline" onClick={() => openSheet({ name: 'pickProject' })}>
                    Open a role
                  </Button>
                </>
              ) : memberships.includes(id) ? (
                // A member visiting as themselves: the page is theirs to manage, but only as the house.
                <Button block variant="secondary" onClick={() => setActing(id, true, true)}>
                  Switch to {o.name}
                </Button>
              ) : (
                <>
                  {/*
                    V30: an individual sees one action on a production house: Follow (primary). Individuals
                    don't message houses directly; they reach a house through its roles (Show interest), and
                    the house decides whom to message. Another house (acting for one) can still message.
                  */}
                  <FollowButton block size="m" primary on={isFollowing} onToggle={() => toggleFollow(id)} name={o.name} />
                  {acting !== 'self' && (
                    <Button
                      block
                      variant="secondary"
                      onClick={() => {
                        const cid = startConversation(id, { kind: 'project', label: 'Direct', detail: 'Direct message', refId: 'direct' });
                        cid && push({ name: 'conversation', id: cid });
                      }}
                    >
                      Message
                    </Button>
                  )}
                </>
              )}
            </div>
            {own && <p className="meta org-own-note">This is how people on Art and Artist see {o.name}.</p>}
            {sections}
            {!ws.length && !roles.length && <EmptyState title="Nothing public yet" body={own ? 'Projects appear here once you share them on Art and Artist.' : `${o.name} hasn't shared any projects yet.`} />}
          </>
        )}
      </div>
    </div>
  );
}

function NowCard({ w, roles }: { w: Work; roles: string[] }) {
  const { push } = useStore();
  return (
    <PressCard className="now-card" onPress={() => push({ name: 'work', id: w.id })} scale={0.985}>
      <Photo media={w.stills[0] ?? w.media} className="now-card-photo" showPlay={false} />
      <div className="now-card-text">
        <p className="now-card-kicker">
          {w.stage} · {w.format.split(' · ')[0]}
        </p>
        <p className="now-card-title">{w.title}</p>
        {roles.length > 0 && <p className="now-card-hiring">Hiring {roles.join(', ')}</p>}
      </div>
    </PressCard>
  );
}
