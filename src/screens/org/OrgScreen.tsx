import { cardRatio, displayedSource } from '../../domain/mediaPresentation';
import { mediaRatio } from '../../domain/mediaLayout';
import { ChevronDown, ChevronLeft, Lock, MoreHorizontal, Settings, Share } from 'lucide-react';
import { scriptLang } from '../../ui/compose';
import { useEffect, useState } from 'react';
import * as seed from '../../data/seed';
import { isLive, type Work } from '../../data/works';
import { world, worksForOrg } from '../../state/world';
import { useStore } from '../../state/store';
import { org, person } from '../../state/selectors';
import { PosterCard } from '../../ui/PosterCard';
import { Avatar, Button, FollowButton, EmptyState, IconButton, Photo, PressCard, Pressable, SectionHeader, Verified } from '../../ui/primitives';
import { RoleRow } from '../discover/RoleRow';
import { useLoad } from '../../ui/useLoad';
import { EventsSection } from '../event/eventUnits';
import { eventsOfHost } from '../../state/events';
import { PageError, PageSkeleton } from '../../ui/PageStates';
import { useFeatures } from '../../ui/features';
import { ScoreLine } from '../reviews/reviewUnits';
import { DIRECTION } from '../../ui/designDirection';
import { HeroIntro } from '../profile/HeroDirections';

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
  const { pop, push, openSheet, acting, following, toggleFollow, startConversation, setHero, showToast, blocked, roleStatus, memberships, setActing, events, viewer } = useStore();
  const o = org(id);
  const district = useFeatures().home === 'district';
  // Review directions only (docs/PROFILE_GLASS_DIRECTIONS.md): the house hero, identity and actions as one composition.
  const dirOn = district && DIRECTION !== 'current';
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
          <NowCard key={w.id} w={w} district={district} ratio={cardRatio(live.map((x) => x.stills[0] ?? x.media))} roles={roles.filter((r) => r.project === w.title).map((r) => r.role)} />
        ))}
      </div>
    </section>
  );
  const hiring = roles.length > 0 && (
    <section key="hiring" id={`hiring-${id}`} className="section section--flush">
      <SectionHeader title={`Hiring · ${roles.length}`} />
      <div className="list list--flush">
        {roles.map((r) => (
          <RoleRow key={r.id} o={r} />
        ))}
      </div>
    </section>
  );
  // One card shape for the filmography: what is shown today is landscape stills, so the cards are landscape.
  const madeRatio = cardRatio(made.map((w) => w.media));
  const filmography = made.length > 0 && (
    <section key="made" className="section section--flush">
      <SectionHeader title="Made by us" />
      {district ? <div className="poster-rail">
        {made.map((w) => <PosterCard key={w.id} projectId={w.id} title={w.title} year={w.year} production={org(w.orgIds[0]).name} line={w.orgIds[0] !== id ? `${w.format} · with ${org(w.orgIds[0]).name}` : w.format} houseLine={false} onPress={() => push({ name: 'work', id: w.id })} label={`${w.title}, ${w.year}, ${w.format}`} />)}
      </div> : <div className="rail">
        {made.map((w) => (
          <Pressable key={w.id} className="rail-item" scale={0.97} onClick={() => push({ name: 'work', id: w.id })}>
            <Photo surface="project-card" media={w.media} className="rail-poster" frameRatio={district ? madeRatio : undefined} showPlay={false} />
            <p className="item-title">{w.title}</p>
            <p className="meta">
              {district ? <ScoreLine id={w.id} /> : w.year}
              {w.orgIds[0] !== id ? ` · with ${org(w.orgIds[0]).name}` : ''}
            </p>
          </Pressable>
        ))}
      </div>}
    </section>
  );
  const workedWith = people.length > 0 && (
    <section key="people" className="section section--flush">
      <SectionHeader title="Worked with" />
      <div className="org-people">
        {people.slice(0, 8).map(({ p, n }) => (
          <Pressable key={p.id} className="org-person" onClick={() => push({ name: 'profile', id: p.id })} scale={0.95}>
            <Avatar party={p} size={64} />
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
  const upcoming = <EventsSection key="events" title="Upcoming events" list={eventsOfHost(events, id, Date.now(), viewer.id, acting)} />;
  // Work first: what the house makes leads; open roles follow its record.
  const sections = district ? [nowMaking, filmography, hiring, workedWith, upcoming] : [nowMaking, upcoming, filmography, workedWith, hiring];

  return (
    <div className={`screen screen--hero${district ? ' dhouse-page dhouse-profile' : ''}`} data-scroll={isTab ? 'profile' : undefined} onScroll={(e) => setScrollY(e.currentTarget.scrollTop)}>
      {dirOn && <div className={`dirhouse dirhouse--${DIRECTION}`}>
        {/* The still plays at its own wide shape, like a screen; never blown up to fill a tall phone. */}
        <div className="dirhouse-media" style={{ aspectRatio: hero ? Math.max(1.5, Math.min(2.39, mediaRatio(displayedSource(hero)))) : 16 / 9 }}>{hero ? <Photo surface="project-hero" media={hero} frameRatio={Math.max(1.5, Math.min(2.39, mediaRatio(displayedSource(hero))))} showPlay={false} /> : <div className="whero-empty" />}</div>
        <span className="dirhouse-shade" aria-hidden />
        {DIRECTION === 'b' && live[0] && <span className="glass-chip dirhouse-slate">Now making · {live[0].title}</span>}
        <div className="profile-intro profile-intro--dir">
          <HeroIntro
            dir={DIRECTION as 'a' | 'b' | 'c'}
            facts={{
              name: o.name,
              verified: o.verified,
              role: 'Production house',
              place: [o.city, o.about.replace(/\.$/, '')].filter(Boolean).join(' · '),
              facts: [`${ws.length} ${ws.length === 1 ? 'project' : 'projects'}`, `${people.length} credited people`],
              status: roles.length ? `${roles.length} open ${roles.length === 1 ? 'role' : 'roles'}` : undefined,
              ledeKicker: live[0] ? 'Now making' : made[0] ? 'Latest release' : undefined,
              lede: live[0] ? `${live[0].title} · ${live[0].format}` : made[0] ? `${made[0].title} · ${made[0].year}` : undefined,
              nameSwitch: own ? { label: 'Switch identity', onPress: () => openSheet({ name: 'identity' }) } : undefined,
            }}
            primary={own ? (
              <button className="cta cta--solid" onClick={() => openSheet({ name: 'pickProject' })}>Open a role</button>
            ) : memberships.includes(id) ? (
              <button className="cta cta--solid" onClick={() => setActing(id, true, true)}>Switch to {o.name}</button>
            ) : (
              <button className={`cta ${isFollowing ? 'cta--glass cta--on' : 'cta--solid'}`} aria-pressed={isFollowing} onClick={() => toggleFollow(id)}>{isFollowing ? 'Following' : 'Follow'}</button>
            )}
            secondary={roles.length > 0 && !own ? <button className="cta cta--glass" onClick={() => document.getElementById(`hiring-${id}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' })}>Open roles</button> : undefined}
          />
        </div>
      </div>}
      <div className={`whero whero--org${dirOn ? ' whero--controls-only' : ''}`}>
        <div className="ohero-parallax" style={{ transform: `translateY(${Math.max(0, scrollY) * 0.4}px)` }}>
          {hero ? <Photo surface="project-hero" media={hero} className="whero-photo" showPlay={false} /> : <div className="whero-photo whero-empty" />}
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
          <IconButton label={`Share ${o.name}`} className="icon-btn--float" onClick={() => openSheet({ name: 'share', label: o.name })}>
            <Share size={18} />
          </IconButton>
          {own ? (
            <IconButton label="House settings" className="icon-btn--float" onClick={() => push({ name: 'settings' })}>
              <Settings size={19} />
            </IconButton>
          ) : (
            <IconButton label={`More options for ${o.name}`} className="icon-btn--float" onClick={() => openSheet({ name: 'more', id })}>
              <MoreHorizontal size={20} />
            </IconButton>
          )}
        </div>
      </div>

      <div className="psheet">
        <header className="org-id" hidden={dirOn}>
          <Avatar party={o} size={64} />
          {own ? (
            <button className="org-name org-name--switch" onClick={() => openSheet({ name: 'identity' })} aria-label="Switch identity">
              {o.name} {o.verified && <Verified size={18} />} <ChevronDown size={18} />
            </button>
          ) : (
            <h1 className="org-name" lang={scriptLang(o.name)}>
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
            <div className="profile-actions" hidden={dirOn}>
              {own ? (
                <>
                  <Button block variant="secondary" onClick={() => showToast({ text: 'House details are set up with Art and Artist during onboarding' })}>
                    Edit page
                  </Button>
                  <Button block variant="primary" onClick={() => openSheet({ name: 'pickProject' })}>
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
            {own && !district && <p className="meta org-own-note">This is how people on Art and Artist see {o.name}.</p>}
            {sections}
            {!ws.length && !roles.length && <EmptyState title="Nothing public yet" body={own ? 'Projects appear here once you share them on Art and Artist.' : `${o.name} hasn't shared any projects yet.`} />}
          </>
        )}
      </div>
    </div>
  );
}

function NowCard({ w, roles, district, ratio }: { w: Work; roles: string[]; district?: boolean; ratio?: number }) {
  const { push } = useStore();
  if (district) return <PressCard className="dhouse-project" onPress={() => push({ name: 'work', id: w.id })} aria-label={w.title}>
    <span className="dhouse-project-media" style={{ aspectRatio: ratio }}><Photo surface="project-card" media={w.stills[0] ?? w.media} frameRatio={ratio} showPlay={false} /><span className="dh-badge">{w.stage}</span></span>
    <span className="dhouse-project-body"><span className="item-title" lang={scriptLang(w.title)}>{w.title}</span><span className="meta">{w.format}</span><span className="dhouse-project-fact">{roles.length ? `${roles.length} open ${roles.length === 1 ? 'role' : 'roles'}` : 'View project'}</span></span>
  </PressCard>;
  return (
    <PressCard className="now-card" onPress={() => push({ name: 'work', id: w.id })} scale={0.985}>
      <Photo surface="project-card" media={w.stills[0] ?? w.media} className="now-card-photo" showPlay={false} />
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
