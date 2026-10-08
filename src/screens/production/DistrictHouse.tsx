import { Bell, ChevronDown, ChevronLeft, ChevronRight, Globe2, Lock, Plus } from 'lucide-react';
import { useRef } from 'react';
import type { DiscoverChip } from '../../domain/contentTypes';
import { houseDecisions, peopleForHouseRoles, type HouseDecision, type HouseRole } from '../../domain/house';
import { publicCreditsFor, searchablePeople } from '../../domain/discovery';
import { org } from '../../state/selectors';
import { useStore } from '../../state/store';
import { publicName, world, type HouseProject } from '../../state/world';
import { eventsOfHost } from '../../state/events';
import { Avatar, Button, EmptyState, FollowButton, IconButton, PersonPhoto, Photo, PressCard, SectionHeader } from '../../ui/primitives';
import { scriptLang, TitleCard } from '../../ui/compose';
import { useAtmosphere } from '../../ui/ambient/ambient';
import { LivingBackground } from '../../ui/ambient/LivingBackground';
import { useFeatures } from '../../ui/features';
import { EventTicket } from '../event/eventUnits';
import { ScoreLine } from '../reviews/reviewUnits';

export type HouseListKind = 'projects' | 'roles' | 'events' | 'releases' | 'attention';
export type HousePeopleFocus = { roleId: string | null; n: number };

function useHouseRecords() {
  const { acting, interestsReceived, roleStatus, blocked } = useStore();
  const projects = world.projects.filter((p) => p.houseId === acting);
  const ids = new Set(projects.map((p) => p.id));
  const roles = world.roles.filter((r) => ids.has(r.projectId) && !roleStatus[r.id] && (r.closesInDays == null || r.closesInDays >= 0));
  const interests = interestsReceived.filter((i) => !blocked.includes(i.personId));
  const decisions = houseDecisions({ projects, roles, interests, associations: world.associations, credits: world.credits, amendments: world.amendments });
  return { projects, roles, interests, decisions };
}

export function HouseProjectCard({ p, publicPage = false }: { p: HouseProject; publicPage?: boolean }) {
  const { push, roleStatus } = useStore();
  const title = publicPage ? publicName(p) : p.workingTitle;
  const open = world.roles.filter((r) => r.projectId === p.id && r.visibility === 'open' && !roleStatus[r.id] && (r.closesInDays == null || r.closesInDays >= 0)).length;
  const waiting = world.credits.filter((c) => c.projectId === p.id && c.status === 'proposed').length;
  return (
    <PressCard className="dhouse-project" aria-label={`Open ${title}`} onPress={() => push({ name: publicPage ? 'work' : 'hproject', id: p.id })}>
      <span className="dhouse-project-media">
        {p.artwork ? <Photo media={p.artwork} showPlay={false} /> : <TitleCard title={title} />}
        <span className="dh-badge">{p.stage}</span>
      </span>
      <span className="dhouse-project-body">
        <span className="item-title" lang={scriptLang(title)}>
          {title}
        </span>
        <span className="meta">
          {p.format} · {p.languages.join(', ')}
        </span>
        <span className="dhouse-project-fact">
          <span>
            {p.stage === 'Released' ? (
              <ScoreLine id={p.id} />
            ) : open ? (
              `${open} open ${open === 1 ? 'role' : 'roles'}`
            ) : waiting ? (
              `${waiting} ${waiting === 1 ? 'credit' : 'credits'} waiting for acceptance`
            ) : (
              'View project'
            )}
          </span>
          {!publicPage && <span className="dhouse-visibility">
            {p.shared ? <Globe2 size={14} /> : <Lock size={14} />} {p.shared ? 'Public' : 'Private'}
          </span>}
        </span>
      </span>
    </PressCard>
  );
}

function DecisionRows({ decisions }: { decisions: HouseDecision[] }) {
  const { push, openSheet } = useStore();
  return (
    <div className="dhouse-decisions">
      {decisions.map((d) => {
        const p = world.projects.find((x) => x.id === d.projectId)!;
        return (
          <PressCard
            key={d.id}
            className="dhouse-decision"
            aria-label={`${d.title}, ${p.workingTitle}`}
            onPress={() =>
              d.kind === 'interest'
                ? openSheet({ name: 'reviewInterest', opportunityId: d.roleId })
                : d.roleId
                  ? push({ name: 'opportunity', id: d.roleId })
                  : push({ name: 'hproject', id: d.projectId, focusAssociation: d.associationId })
            }
          >
            <span className="dhouse-decision-text">
              <span className="item-title">{d.title}</span>
              <span className="meta"><span className="dhouse-fact">{d.fact}</span> · {p.workingTitle}</span>
            </span>
            <ChevronRight size={18} aria-hidden />
          </PressCard>
        );
      })}
    </div>
  );
}

function OwnedRoleRows({ roles }: { roles: HouseRole[] }) {
  const { push, interestsReceived, blocked } = useStore();
  return (
    <div className="dh-ilist">
      {roles.map((r) => {
        const p = world.projects.find((x) => x.id === r.projectId)!;
        const count = interestsReceived.filter((i) => i.opportunityId === r.id && !i.withdrawn && !blocked.includes(i.personId)).length;
        const close =
          r.closesInDays == null ? '' : r.closesInDays === 0 ? 'Closes today' : r.closesInDays === 1 ? 'Closes tomorrow' : `Closes in ${r.closesInDays} days`;
        return (
          <PressCard
            className="dh-irow-main dhouse-role"
            key={r.id}
            onPress={() => push({ name: 'opportunity', id: r.id })}
            aria-label={`Manage ${r.role}, ${p.workingTitle}`}
          >
            <span className="dh-irow-img">{p.artwork ? <Photo media={p.artwork} showPlay={false} /> : <TitleCard title={p.workingTitle} />}</span>
            <span className="dh-irow-t">
              <span className="item-title">{r.role}</span>
              <span className="meta">{p.workingTitle}</span>
              <span className="dh-irow-fact">{[count ? `${count} interested` : 'No interest yet', close].filter(Boolean).join(' · ')}</span>
            </span>
            <ChevronRight size={17} aria-hidden />
          </PressCard>
        );
      })}
    </div>
  );
}

export function DistrictHouseHome({ discover }: { discover: (chip?: DiscoverChip, roleId?: string | null) => void }) {
  const { acting, viewer, openSheet, notifications, push, events, following, toggleFollow, blocked } = useStore();
  const features = useFeatures();
  const h = useHouseRecords();
  const house = org(acting);
  const scrollRef = useRef<HTMLDivElement>(null);
  const atmosphere = useAtmosphere();
  const unread = notifications.filter((n) => n.forId === acting && n.unread).length;
  const slate = [...h.projects, ...world.projects.filter((p) => p.shared && p.coHouseIds?.includes(acting))];
  const live = slate.filter((p) => p.stage !== 'Released');
  const released = slate.filter((p) => p.shared && p.stage === 'Released');
  const open = h.roles.filter((r) => r.visibility === 'open');
  const people = searchablePeople(viewer.id, blocked);
  const counts = Object.fromEntries(people.map((p) => [p.id, publicCreditsFor(p.id).length]));
  const matches = peopleForHouseRoles(people, h.roles, house.city, counts).slice(0, 6);
  const hosted = features.events ? eventsOfHost(events, acting, Date.now(), viewer.id, acting).filter((e) => e.status === 'scheduled') : [];
  const list = (kind: HouseListKind) => push({ name: 'houseList', kind });
  return (
    <>
      {atmosphere && <LivingBackground scrollRef={scrollRef} />}
      <div ref={scrollRef} className={`screen canvas dh dhouse${atmosphere ? ' has-ambient' : ''}`} data-scroll="home">
        <div className="dh-wash">
          <header className="dh-head dhouse-head">
            <h1 className="sr-only">{house.name} home</h1>
            <button className="dhouse-identity" onClick={() => openSheet({ name: 'identity' })} aria-label={`Acting for ${house.name}. Switch identity`}>
              <Avatar party={house} size={36} />
              <span>
                <b>
                  {house.name} <ChevronDown size={14} />
                </b>
                <span className="meta">Acting for the house</span>
              </span>
            </button>
            <IconButton label={unread ? `Notifications, ${unread} new` : 'Notifications'} onClick={() => openSheet({ name: 'notifications' })}>
              <Bell size={21} />
              {unread > 0 && <span className="dot" aria-hidden />}
            </IconButton>
          </header>
          <div className="dhouse-start dh-pad">
            <p className="meta">{house.city}</p>
            <Button size="s" onClick={() => openSheet({ name: 'newProject' })}>
              <Plus size={16} /> New project
            </Button>
          </div>
        </div>
        {!house.verified && (
          <div className="dhouse-pending dh-pad">
            <Lock size={18} />
            <span>
              <b>Verification pending</b>
              <span className="meta">You can prepare private projects. Public roles, sharing and credits unlock after verification.</span>
            </span>
          </div>
        )}
        {h.decisions.length > 0 && (
          <section className="dh-sec dh-pad">
            <SectionHeader title="Needs you" action={h.decisions.length > 3 ? 'See all' : undefined} onAction={() => list('attention')} />
            <DecisionRows decisions={h.decisions.slice(0, 3)} />
          </section>
        )}
        {live.length > 0 && (
          <section className="dh-sec">
            <SectionHeader
              title="Your projects"
              className="dh-pad"
              action={slate.length > live.length || live.length > 3 ? 'See all' : undefined}
              onAction={() => list('projects')}
            />
            <div className="dhouse-projects">
              {live.slice(0, 3).map((p) => (
                <HouseProjectCard key={p.id} p={p} publicPage={p.houseId !== acting} />
              ))}
            </div>
          </section>
        )}
        {!slate.length && (
          <section className="dh-sec dh-pad dhouse-empty">
            <h2>Start your next project</h2>
            <Button block onClick={() => openSheet({ name: 'newProject' })}>
              New project
            </Button>
            <Button block variant="secondary" onClick={() => push({ name: 'org', id: acting })}>
              Your house page
            </Button>
          </section>
        )}
        {slate.length > 0 && !live.length && (
          <section className="dh-sec dh-pad dhouse-empty">
            <h2>What are you making next?</h2>
            <Button onClick={() => openSheet({ name: 'newProject' })}>New project</Button>
          </section>
        )}
        {open.length > 0 && (
          <section className="dh-sec dh-pad">
            <SectionHeader title="Open roles" action={open.length > 3 ? 'See all' : undefined} onAction={() => list('roles')} />
            <OwnedRoleRows roles={open.slice(0, 3)} />
          </section>
        )}
        {matches.length > 0 && (
          <section className="dh-sec">
            <SectionHeader
              title={h.roles.length ? 'People for your roles' : 'People worth knowing'}
              className="dh-pad"
              action="See all"
              onAction={() => discover('people', h.roles.length ? 'our-roles' : null)}
            />
            <div className="dhouse-people">
              {matches.map(({ person: p, role }) => (
                <div className="dhouse-person" key={p.id}>
                  <PressCard className="dhouse-person-main" onPress={() => push({ name: 'profile', id: p.id })} aria-label={`${p.name}, ${p.role}`}>
                    <span className="dhouse-person-image">
                      <PersonPhoto party={p} />
                    </span>
                    <span className="dhouse-person-text">
                      <span className="item-title">{p.name}</span>
                      <span className="meta">
                        {p.role} · {p.city}
                      </span>
                    </span>
                  </PressCard>
                  {role ? (
                    <button className="dhouse-fit" onClick={() => discover('people', role.id)}>
                      For {role.role}
                    </button>
                  ) : (
                    <span className="dhouse-fit meta">{counts[p.id] ? `${counts[p.id]} verified credits` : p.city}</span>
                  )}
                  <FollowButton primary block on={following.includes(p.id)} onToggle={() => toggleFollow(p.id)} name={p.name} />
                </div>
              ))}
            </div>
          </section>
        )}
        {hosted.length > 0 && (
          <section className="dh-sec dh-pad">
            <SectionHeader title="Your events" action={hosted.length > 2 ? 'See all' : undefined} onAction={() => list('events')} />
            <div className="ev-list">
              {hosted.slice(0, 2).map((e) => (
                <EventTicket key={e.id} e={e} />
              ))}
            </div>
          </section>
        )}
        {released.length > 0 && (
          <section className="dh-sec">
            <SectionHeader
              title="Your released films"
              className="dh-pad"
              action={released.length > 3 ? 'See all' : undefined}
              onAction={() => list('releases')}
            />
            <div className="dhouse-projects">
              {released.slice(0, 3).map((p) => (
                <HouseProjectCard key={p.id} p={p} publicPage />
              ))}
            </div>
          </section>
        )}
        <div className="dh-end">
          <p>You're up to date.</p>
          <Button variant="plain" onClick={() => discover('people')}>
            Find people <ChevronRight size={16} />
          </Button>
        </div>
      </div>
    </>
  );
}

/** Owned records stay in management; Discover remains the public network. */
export function HouseListScreen({ kind }: { kind: HouseListKind }) {
  const { pop, acting, viewer, events, openSheet } = useStore();
  const h = useHouseRecords();
  const title = { projects: 'Your projects', roles: 'Open roles', events: 'Your events', releases: 'Your released films', attention: 'Needs you' }[kind];
  const slate = [...h.projects, ...world.projects.filter((p) => p.shared && p.coHouseIds?.includes(acting))];
  const projects = kind === 'releases' ? slate.filter((p) => p.shared && p.stage === 'Released') : slate;
  return (
    <div className="screen dhouse-page">
      <header className="topbar topbar--nav">
        <IconButton label="Back" onClick={pop}>
          <ChevronLeft size={26} />
        </IconButton>
      </header>
      <div className="title-block">
        <p className="kicker">{org(acting).name}</p>
        <h1 className="large-title">{title}</h1>
      </div>
      <div className="dh-pad">
        {kind === 'attention' && <DecisionRows decisions={h.decisions} />}
        {kind === 'attention' && !h.decisions.length && <EmptyState title="You're up to date" />}
        {kind === 'roles' && <OwnedRoleRows roles={h.roles.filter((r) => r.visibility === 'open')} />}
        {kind === 'roles' && !h.roles.some((r) => r.visibility === 'open') && <EmptyState title="No open roles" />}
        {(kind === 'projects' || kind === 'releases') && (
          <div className="dhouse-project-grid">
            {projects.map((p) => (
              <HouseProjectCard key={p.id} p={p} publicPage={kind === 'releases' || p.houseId !== acting} />
            ))}
          </div>
        )}
        {kind === 'projects' && (
          <Button block variant="secondary" onClick={() => openSheet({ name: 'newProject' })}>
            New project
          </Button>
        )}
        {kind === 'events' && eventsOfHost(events, acting, Date.now(), viewer.id, acting).map((e) => <EventTicket key={e.id} e={e} />)}
      </div>
    </div>
  );
}
