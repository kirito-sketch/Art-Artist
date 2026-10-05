import { motion } from 'framer-motion';
import { BadgeCheck, Bell, CheckCircle2, ChevronDown, ChevronRight, MessageCircle, Users } from 'lucide-react';
import { Fragment, useEffect, useRef, useState, type ReactNode } from 'react';
import { craftDef } from '../../data/crafts';
import type { Person } from '../../data/types';
import { useStore } from '../../state/store';
import { homeOrder, housesFor, industryActivity, intentDef, opportunitiesFor, peopleFor, projectsFor, stageOf, workFor, type HomeSection, type Signals, type Stage } from '../../domain/relevance';
import { FrameLabel, PortraitCard, PosterTile } from '../../ui/compose';
import { findOpportunity, org, party, person } from '../../state/selectors';
import { worksForOrg } from '../../state/world';
import { isLive } from '../../data/works';
import { OfflineBanner, PublishBar } from '../../ui/chrome';
import { shared, stagger } from '../../ui/motion';
import { Button, FollowButton, IconButton, PressCard, SectionHeader, Skeleton, Verified } from '../../ui/primitives';
import { Logo } from '../../ui/Logo';
import { LivingBackground } from '../../ui/ambient/LivingBackground';
import { useAmbientVariant } from '../../ui/ambient/ambient';
import { NetworkRow } from './NetworkActivity';
import { FeaturedCard } from './OpportunityCard';
import { FirstStep, Resolve, useWorldForming } from './FirstHome';
import { RoleRow } from '../discover/RoleRow';
import { EventRow } from '../event/eventUnits';
import { eventHomeCandidates } from '../../state/events';
import { useFeatures } from '../../ui/features';


export function HomeScreen({ goDiscover }: { goDiscover: (scope?: string, craft?: string) => void }) {
  const store = useStore();
  const { viewer, scenario, openSheet, notifications, reloadKey, intent } = store;
  const scrollRef = useRef<HTMLDivElement>(null);
  const loading = scenario.loading;
  const me = person(viewer.id);
  const unreadCount = notifications.filter((n) => n.unread).length;
  const unread = unreadCount > 0;
  // First session: a person just out of onboarding (or the "New user" test state). No network yet.
  const first = !loading && (store.isNewPerson || scenario.newUser);
  const forming = useWorldForming(first);
  // Living background experiment (Settings › Appearance › Background): Home only, off by default.
  const ambient = useAmbientVariant();
  const ambientOn = ambient !== 'off';

  const publishingId = store.publishing?.id;
  useEffect(() => {
    if (publishingId) scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [publishingId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Cards layout: the header is part of the page, on the same paper, and scrolls away with it.
  const header = (className: string) => (
    <header className={`home-header ${className}`}>
      <h1 className="sr-only">Home</h1>
      <span className="home-logo">
        <Logo />
      </span>
      <span className="flex" />
      <IconButton label={unread ? `Notifications, ${unreadCount} new` : 'Notifications'} className="icon-btn--float" onClick={() => openSheet({ name: 'notifications' })}>
        <Bell size={19} aria-hidden />
        {unread && <span className="dot" aria-hidden />}
      </IconButton>
    </header>
  );

  /*
   * V30 (docs/V30.md). One Home system, composed by intent and by how much we know yet (stage):
   *  - first session: prove the network is worth using. Real people, opportunities, projects and
   *    creative work above the fold, widened step by step so nothing reads as empty;
   *  - early usage: follows, saves and interest start to sharpen the ranking;
   *  - established: "what matters to me right now?" leads, with personal activity higher.
   * Same modules at every stage; order, titles and ranking change. Every block says why it is there.
   */
  const signals: Signals = {
    following: store.following,
    savedRoleCrafts: store.saved.filter((x) => x.kind === 'role').flatMap((x) => findOpportunity(x.id, store.userCollabs)?.forCrafts ?? []),
    interested: Object.keys(store.interestsSent).length,
  };
  const stage = stageOf(store.isNewPerson || scenario.newUser, signals);
  const order = homeOrder(intent, stage);
  // Content first, control second: the first module carries the compact intent filter.
  const ctx = (id: HomeSection): HomeCtx => ({ me, stage, signals, goDiscover, lead: id === order[0] });
  const sections: Record<HomeSection, ReactNode> = {
    forYou: <ForYou key="forYou" {...ctx('forYou')} />,
    people: <PeopleFor key="people" {...ctx('people')} />,
    activity: <Activity key="activity" {...ctx('activity')} />,
    projects: <ActiveProjects key="projects" {...ctx('projects')} />,
    work: <CommunityWork key="work" {...ctx('work')} />,
  };

  return (
    <>
      {ambientOn && <LivingBackground variant={ambient as Exclude<typeof ambient, 'off'>} scrollRef={scrollRef} />}
      <div className={`screen screen--hero canvas v-home${ambientOn ? ' has-ambient' : ''}`} ref={scrollRef} data-scroll="home" key={`${viewer.id}-${reloadKey}`}>
        {header('home-header--inline')}

        <div className="home-sheet home-sheet--flat">
          <OfflineBanner />
          <PublishBar />


          {loading ? (
            <section className="v-section" aria-busy="true">
              <div className="carousel carousel--roles">
                {[0, 1].map((i) => (
                  <div key={i} className="carousel-item">
                    <Skeleton h={420} r={28} />
                  </div>
                ))}
              </div>
            </section>
          ) : (
            order.map((id, i) => (
              <Fragment key={id}>
                {first ? (
                  <Resolve forming={forming} i={i}>
                    {sections[id]}
                  </Resolve>
                ) : (
                  sections[id]
                )}
                {/* One reason to come back, after real content, never above it. */}
                {stage !== 'established' && i === 2 && <FirstStep />}
                {/* One event at most, after the core professional modules (docs/EVENTS.md). */}
                {i === Math.min(3, order.length - 2) && <ComingUp me={me} />}
              </Fragment>
            ))
          )}

          {!loading && (
            <p className="end">
              <CheckCircle2 size={16} /> You're all caught up
            </p>
          )}
        </div>
      </div>
    </>
  );
}

/** Today's Home: the single most relevant upcoming event, if any is relevant enough (never a low one). */
function ComingUp({ me }: { me: Person }) {
  const { events, following } = useStore();
  const on = useFeatures().events;
  if (!on) return null;
  const rank = { high: 2, medium: 1, low: 0 } as const;
  const best = eventHomeCandidates(events, me, following, Date.now())
    .filter((c) => c.significance !== 'low')
    .sort((a, b) => rank[b.significance] - rank[a.significance] || b.relationship - a.relationship || b.place - a.place)[0];
  return best ? <EventRow c={best} position={4} /> : null;
}

/**
 * The intent filter: a compact pill inside the first section, never a settings card. It refines what
 * Home prioritises; craft and city are used silently and never announced.
 */
function IntentChip() {
  const { intent, openSheet } = useStore();
  return (
    <button className="intent-chip" onClick={() => openSheet({ name: 'intent' })} aria-label={`Showing what matters for: ${intentDef(intent).label}. Change`} aria-haspopup="dialog">
      {intentDef(intent).short}
      <ChevronDown size={14} strokeWidth={2.4} />
    </button>
  );
}

/**
 * Under a section title: the intent filter and one quiet line on why, on the first section only (one
 * helper line per Home, docs/UX_HEURISTIC_AUDIT.md F4). Later sections go straight from title to content.
 */
function Context({ lead, why, children }: { lead?: boolean; why?: string; children?: ReactNode }) {
  if (!lead && !children) return null;
  return (
    <div className="home-context">
      {lead && <IntentChip />}
      {children}
      {/* No explanation line under the title: stakeholders read it as app copy (October 2026). */}
      {void why}
    </div>
  );
}

type HomeCtx = { me: Person; stage: Stage; signals: Signals; goDiscover: (scope?: string, craft?: string) => void; lead: boolean };

/**
 * For you: roles, casting and collaboration requests. Not every craft "applies for roles", so the
 * title stays general (actors see casting named). Exact matches first, then close crafts, then work
 * open nearby, so a thin craft still sees real opportunity. When hiring, only close matches show.
 * Weight follows intent, not just order: the large cards are for someone looking for work (or a
 * collaboration); every other intent gets the compact row used in Discover and on house pages, so a
 * Home for hiring or networking never looks like a job board (docs/UX_HEURISTIC_AUDIT.md F3).
 */
function ForYou({ me, stage, signals, goDiscover, lead }: HomeCtx) {
  const { scenario, push, userCollabs, roleStatus, intent, setScenario } = useStore();
  if (scenario.forYouError)
    return (
      <section className="v-section cards-roles" data-world="roles">
        <SectionHeader title="Opportunities for you" />
        <div className="inline-error inline-error--flush">
          <p>Couldn't load your opportunities.</p>
          <Button variant="secondary" size="s" onClick={() => setScenario({ forYouError: false })}>
            Retry
          </Button>
        </div>
      </section>
    );
  const all = opportunitiesFor(me, intent, userCollabs, roleStatus as Record<string, unknown>, signals, stage === 'established' ? 4 : 6);
  // Someone assembling a team sees opportunities only where they are meaningful.
  const ranked = (intent === 'hire' ? all.filter((r) => r.tier <= 2) : all).slice(0, 8);
  if (!ranked.length) return null;
  const exact = ranked.filter((r) => r.tier === 1).length;
  const title = intent === 'collaborate' ? 'Collaborations and roles for you' : me.craft === 'actor' ? 'Casting and roles for you' : intent === 'hire' ? 'Opportunities in your craft' : 'Opportunities for you';
  const why = exact === ranked.length ? 'Based on your craft, location and availability.' : exact ? 'Your craft first, then work close to it.' : 'Close to your craft, and open near you.';
  if (intent !== 'work' && intent !== 'collaborate')
    return (
      <section className="v-section" data-world="roles">
        <SectionHeader title={title} action="See all" onAction={() => goDiscover('roles')} />
        <Context lead={lead} why={why} />
        <div className="list list--flush">
          {ranked.slice(0, 3).map(({ item: o }) => (
            <RoleRow key={o.id} o={o} />
          ))}
        </div>
      </section>
    );
  return (
    <section className="v-section cards-roles" data-world="roles">
      <SectionHeader title={title} action="See all" onAction={() => goDiscover('roles')} />
      <Context lead={lead} why={why} />
      <div className={`carousel carousel--roles ${stage !== 'established' ? 'carousel--first' : ''}`}>
        {ranked.map(({ item: o, tier }, i) => (
          <motion.div key={o.id} className="carousel-item" {...stagger(i, 0.05)}>
            <FeaturedCard o={o} onOpen={() => push({ name: 'opportunity', id: o.id, from: 'card' })} />
            {tier > 1 && <span className="tier-note">{tier === 2 ? 'Close to your craft' : 'Open near you'}</span>}
          </motion.div>
        ))}
      </div>
    </section>
  );
}

/**
 * People, ranked for what you are doing now, each with the reason they are here. "Available now" is a
 * filter on this tray (not a separate section): when building a team, availability is a way of
 * narrowing the same people, not a different question.
 */
function PeopleFor({ me, signals, goDiscover, lead }: HomeCtx) {
  const { following, toggleFollow, push, intent } = useStore();
  const [availableOnly, setAvailableOnly] = useState(false);
  const team = intent === 'hire' || intent === 'collaborate';
  const ranked = peopleFor(me, intent, following, signals);
  const canFilter = team && ranked.some((r) => !!r.item.availableFrom);
  const list = (availableOnly && canFilter ? ranked.filter((r) => !!r.item.availableFrom) : ranked).slice(0, 10);
  if (!list.length) return null;
  const title = intent === 'hire' ? 'People for your next project' : intent === 'collaborate' ? 'People to collaborate with' : intent === 'work' ? (me.craft === 'actor' ? 'Directors and producers' : 'People in your world') : 'People worth knowing';
  return (
    <section className="v-section" data-world="people">
      <SectionHeader title={title} action="See all" onAction={() => goDiscover('people')} />
      <Context lead={lead}>
        {canFilter && (
          <button className={`filter-pill ${availableOnly ? 'is-on' : ''}`} aria-pressed={availableOnly} onClick={() => setAvailableOnly((v) => !v)}>
            <span className="status-dot is-on" /> Available now
          </button>
        )}
      </Context>
      <div className="portrait-rail">
        {list.map(({ item: p, why: reason }) => (
          <PortraitCard
            key={p.id}
            person={p}
            context={
              p.availableFrom && !team ? (
                <>
                  <span className="status-dot is-on" /> Available from {p.availableFrom}
                </>
              ) : (
                reason
              )
            }
            onPress={() => push({ name: 'profile', id: p.id })}
            action={<FollowButton primary on={following.includes(p.id)} onToggle={() => toggleFollow(p.id)} name={p.name} block />}
          />
        ))}
      </div>
    </section>
  );
}

/**
 * Activity: what needs you. Credits to confirm, interest to review, replies waiting; at most three
 * one-line rows, the row and chevron say what to do. Passive network news (credits, new projects,
 * availability) lives in Notifications, not here (docs/UX_HEURISTIC_AUDIT.md F2, F13). A person who is
 * new and owes nothing yet sees public activity instead, so Home still shows a living community.
 */
function Activity({ me, stage, lead }: HomeCtx) {
  const { viewer, pendingCredits, interestsReceived, conversations, blocked, openSheet, push, setTab } = useStore();
  const toConfirm = pendingCredits.filter((c) => !c.correction);
  // Someone you blocked can't be answered, so they never wait on you here (their history stays in Inbox).
  const waiting = interestsReceived.filter((i) => !i.withdrawn && !i.review && !blocked.includes(i.personId));
  const replies = conversations.filter((c) => c.unread && !blocked.includes(c.withId));
  const actions: { id: 'credits' | 'interest' | 'replies'; text: ReactNode; go: () => void }[] = [];
  if (toConfirm.length)
    actions.push({
      id: 'credits',
      text:
        toConfirm.length === 1 ? (
          <>
            <b>{org(toConfirm[0].orgId).name}</b> credited you on <b>{toConfirm[0].title}</b>
          </>
        ) : (
          <>
            <b>{toConfirm.length} credits</b> to confirm
          </>
        ),
      go: () => push({ name: 'profile', id: viewer.id }),
    });
  if (waiting.length)
    actions.push({
      id: 'interest',
      text: (
        <>
          <b>
            {waiting.length} {waiting.length === 1 ? 'person' : 'people'}
          </b>{' '}
          interested in what you posted
        </>
      ),
      go: () => openSheet({ name: 'reviewInterest' }),
    });
  if (replies.length)
    actions.push({
      id: 'replies',
      text:
        replies.length === 1 ? (
          <>
            <b>{party(replies[0].withId)?.name ?? 'Someone'}</b> sent you a message
          </>
        ) : (
          <>
            <b>{replies.length} conversations</b> waiting for a reply
          </>
        ),
      go: () => (replies.length === 1 ? push({ name: 'conversation', id: replies[0].id }) : setTab('inbox')),
    });
  const limit = 3;
  // Someone new who owes nothing yet: public activity, so Home is never empty while their network forms.
  const industry = !actions.length && stage !== 'established' ? industryActivity(me).slice(0, limit) : [];
  if (!actions.length && !industry.length) return null;
  return (
    <section className="v-section" data-world="activity">
      <SectionHeader title={industry.length ? 'Happening on Art and Artist' : 'Waiting on you'} action={actions.length > limit ? 'See all' : undefined} onAction={() => openSheet({ name: 'notifications' })} />
      <Context lead={lead} />
      <div className="list list--flush">
        {actions.slice(0, limit).map((a) => (
          <PressCard key={a.id} className="nrow nrow--action nrow--compact" onPress={a.go} scale={0.985}>
            <span className="nrow-icon" aria-hidden>
              {a.id === 'credits' ? <BadgeCheck size={20} /> : a.id === 'interest' ? <Users size={20} /> : <MessageCircle size={20} />}
            </span>
            <div className="nrow-text">
              <p className="nrow-line">{a.text}</p>
            </div>
            <ChevronRight size={18} className="row-chevron" />
          </PressCard>
        ))}
        {industry.map((e, i) => (
          <NetworkRow key={e.id} e={e} index={i} />
        ))}
      </div>
    </section>
  );
}

/**
 * Projects: films and series being made now by verified productions, hiring first, widened to recent
 * releases so the tray always shows real work happening. (V29's "Projects to watch" read as something
 * to stream.) Production houses ride along for people assembling a team and for first sessions.
 */
function ActiveProjects({ me, stage, goDiscover, lead }: HomeCtx) {
  const { push, roleStatus, intent } = useStore();
  const list = projectsFor(me, roleStatus as Record<string, unknown>, stage === 'established' ? 3 : 5).slice(0, 8);
  const houses = intent === 'hire' || stage !== 'established' ? housesFor(me).slice(0, 6) : [];
  if (!list.length) return null;
  const title = intent === 'work' || intent === 'collaborate' ? 'Projects you could join' : intent === 'hire' ? 'Projects and production houses' : 'Active projects';
  const released = list.some((x) => !x.live);
  // One card design for every item: same size, image ratio, hierarchy and tap behaviour. No featured
  // first item. Houses are shown by what they are making, so they share the project card.
  const cards = [
    ...list.map(({ w, hiring, live }) => ({
      key: w.id,
      media: w.media.id === 'ph' ? undefined : w.stills[0] ?? w.media,
      label: live ? w.stage : `Released ${w.year}`,
      title: w.title,
      meta: (
        <>
          {org(w.orgIds[0]).name} <Verified size={12} />
        </>
      ),
      sub: hiring ? `Hiring ${hiring}` : w.format,
      sharedId: w.media.id === 'ph' ? undefined : shared.work(w.id),
      go: () => push({ name: 'work', id: w.id, from: 'card' }),
    })),
    ...houses.map(({ o, hiring, live }) => {
      const ws = worksForOrg(o.id);
      const lead = ws.find(isLive) ?? ws[0];
      return {
        key: o.id,
        media: lead && lead.media.id !== 'ph' ? lead.stills[0] ?? lead.media : undefined,
        label: 'Production house',
        title: o.name,
        meta: (
          <>
            {o.city} <Verified size={12} />
          </>
        ),
        sub: hiring ? `Hiring ${hiring}` : live && lead ? `Making ${lead.title}` : o.about,
        sharedId: undefined as string | undefined,
        go: () => push({ name: 'org', id: o.id }),
      };
    }),
  ];
  return (
    <section className="v-section" data-world="projects">
      <SectionHeader title={title} action="See all" onAction={() => goDiscover('projects')} />
      <Context lead={lead} why={`Being made now, hiring first${released ? ', then recent releases' : ''}.`} />
      <div className="poster-rail project-rail">
        {cards.map((c) => (
          <PosterTile key={c.key} media={c.media} title={c.title} meta={c.meta} sub={c.sub} label={<FrameLabel>{c.label}</FrameLabel>} sharedId={c.sharedId} onPress={c.go} />
        ))}
      </div>
    </section>
  );
}

/**
 * Posts, contained: recent posts from people in your craft, then the wider community. It shows the
 * network is alive and creatively interesting without becoming the Home feed: one tray, last or near
 * last, at most eight posts, opening into the post viewer. Named "Posts" as in Discover and on profiles
 * ("work" is never the generic word), with See all into Discover › Posts in the same craft (F1).
 */
function CommunityWork({ me, lead, goDiscover }: HomeCtx) {
  const { following, userPosts, push } = useStore();
  const list = workFor(me, following, userPosts);
  if (!list.length) return null;
  const craft = list.some((x) => x.tier === 1);
  return (
    <section className="v-section" data-world="work">
      <SectionHeader title={craft ? `Posts in ${(craftDef(me.craft)?.label ?? 'your craft').toLowerCase()}` : 'Posts from the community'} action="See all" onAction={() => goDiscover('posts', craft ? me.craft : undefined)} />
      <Context lead={lead} why={craft ? 'From people in your craft, then the community.' : 'Shared by people on Art and Artist.'} />
      <div className="poster-rail work-rail">
        {list.map(({ item: post }, i) => {
          const a = person(post.authorId);
          return (
            <PosterTile
              key={post.id}
              media={post.media[0]}
              title={a.name}
              meta={a.role}
              onPress={() => push({ name: 'posts', ids: list.map((x) => x.item.id), index: i })}
            />
          );
        })}
      </div>
    </section>
  );
}

