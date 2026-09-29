import { motion, useMotionValueEvent, useScroll } from 'framer-motion';
import { AlertCircle, ArrowRight, Bell, ChevronRight, Clapperboard, RotateCcw, SlidersHorizontal, UserPlus } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import * as seed from '../../data/seed';
import { useStore } from '../../state/store';
import { availableLabel, forYou, networkFor, person, postsFor } from '../../state/selectors';
import { OfflineBanner, PublishBar } from '../../ui/chrome';
import { spring, stagger } from '../../ui/motion';
import { Avatar, Button, IconButton, PressCard, Pressable, SectionHeader, Skeleton } from '../../ui/primitives';
import { Still } from '../../ui/Still';
import { NetworkRow } from './NetworkActivity';
import { OpportunityCard } from './OpportunityCard';
import { PostCard } from './PostCard';

const NETWORK_LIMIT = 5;
const POSTS_LIMIT = 3;

export function HomeScreen({ goDiscover }: { goDiscover: (scope?: string) => void }) {
  const store = useStore();
  const { viewer, scenario, availability, openSheet, notifications, reloadKey } = store;
  const me = person(viewer.id);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll({ container: scrollRef });
  const [compact, setCompact] = useState(false);
  useMotionValueEvent(scrollY, 'change', (v) => setCompact(v > 150));

  const unread = notifications.some((n) => n.unread);

  // Bring the publish bar into view when something starts uploading.
  const publishingId = store.publishing?.id;
  useEffect(() => {
    if (publishingId) scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [publishingId]);
  const loading = scenario.loading;
  const opps = forYou(viewer, scenario);
  const events = networkFor(viewer, scenario);
  const posts = postsFor(viewer, scenario, store.following, store.userPosts);
  const allOpen = seed.opportunities.length;
  const heroMedia = seed.portfolio[viewer.id][0];

  return (
    <div className="screen-scroll" ref={scrollRef} data-scroll="home" key={`${viewer.id}-${reloadKey}`}>
      {/* Collapsed header appears once the hero has scrolled away. */}
      <motion.div className="home-compact" initial={false} animate={{ opacity: compact ? 1 : 0, y: compact ? 0 : -10 }} transition={spring.snappy} style={{ pointerEvents: compact ? 'auto' : 'none' }}>
        <span className="wordmark wordmark--s">Ana</span>
        <span className="flex-spacer" />
        <IconButton label="Notifications" className="icon-btn--glass" onClick={() => openSheet({ name: 'notifications' })}>
          <Bell size={18} />
          {unread && <span className="icon-dot" />}
        </IconButton>
      </motion.div>

      <header className="home-hero">
        <Still media={heroMedia} className="home-hero-media" showPlay={false} />
        <div className="home-hero-scrim" />
        <div className="home-hero-top">
          <span className="wordmark">Ana</span>
          <IconButton label="Notifications" className="icon-btn--glass" onClick={() => openSheet({ name: 'notifications' })}>
            <Bell size={19} />
            {unread && <span className="icon-dot" />}
          </IconButton>
        </div>
        <div className="home-hero-body">
          <motion.p className="home-greeting" {...stagger(0)}>
            Good morning,
          </motion.p>
          <motion.h1 className="home-name" {...stagger(1)}>
            {viewer.firstName}
          </motion.h1>
          <motion.div {...stagger(2)}>
            {scenario.newUser ? (
              <Pressable className="status-pill status-pill--setup" onClick={() => openSheet({ name: 'availability' })}>
                <SlidersHorizontal size={14} />
                <span>Set availability to sharpen your matches</span>
                <ChevronRight size={15} />
              </Pressable>
            ) : (
              <Pressable className={`status-pill ${availability.open ? 'status-pill--open' : ''}`} onClick={() => openSheet({ name: 'availability' })} aria-label="Edit availability">
                <span className="status-dot" />
                <span>
                  {availability.open ? <b>{availableLabel(availability.from)}</b> : <b>Not taking work</b>}
                  <span className="status-pill-sub"> · {availability.scope}</span>
                </span>
                <ChevronRight size={15} />
              </Pressable>
            )}
          </motion.div>
        </div>
      </header>

      <OfflineBanner />
      <div className="home-publish">
        <PublishBar />
      </div>

      {/* 1 · For You */}
      <section className="home-section home-section--foryou" aria-label="For You">
        <SectionHeader
          title="For You"
          meta={loading ? undefined : scenario.newUser ? `Based on ${me.role.toLowerCase()} · ${me.city}` : `${opps.length} matches this week`}
          action={scenario.forYouError || loading ? undefined : 'See all'}
          onAction={() => goDiscover('opportunities')}
        />
        {loading ? (
          <div className="carousel">
            <Skeleton className="opp-skeleton" r={26} />
            <Skeleton className="opp-skeleton" r={26} />
          </div>
        ) : scenario.forYouError ? (
          <div className="inline-error">
            <AlertCircle size={18} />
            <div>
              <p className="inline-error-title">We couldn't load your matches</p>
              <p className="inline-error-body">Your saved roles are still in Profile.</p>
            </div>
            <Button variant="secondary" size="s" icon={<RotateCcw size={14} />} onClick={() => store.setScenario({ forYouError: false })}>
              Retry
            </Button>
          </div>
        ) : (
          <ForYouCarousel opps={opps} total={allOpen} newUser={scenario.newUser} goDiscover={goDiscover} />
        )}
      </section>

      {/* 2 · From Your Network */}
      <section className="home-section" aria-label="From your network">
        {loading ? (
          <>
            <SectionHeader title="From Your Network" />
            <div className="net-list">
              {[0, 1, 2].map((i) => (
                <div key={i} className="net-row net-row--skeleton">
                  <Skeleton w={42} h={42} r={21} />
                  <div style={{ flex: 1, display: 'grid', gap: 8 }}>
                    <Skeleton w="80%" />
                    <Skeleton w="50%" h={11} />
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : events.length ? (
          <>
            <SectionHeader title="From Your Network" meta={events.some((e) => e.isNew) ? <span className="new-dot">New</span> : undefined} action={events.length > NETWORK_LIMIT ? 'All activity' : undefined} onAction={() => store.push({ name: 'network' })} />
            <div className="net-list">
              {events.slice(0, NETWORK_LIMIT).map((e, i) => (
                <NetworkRow key={e.id} e={e} index={i} />
              ))}
            </div>
          </>
        ) : (
          <BuildNetwork />
        )}
      </section>

      {/* 3 · Latest Posts: secondary, capped, hidden when empty. */}
      {!loading && posts.length > 0 && (
        <section className="home-section home-section--posts" aria-label="Latest posts">
          <SectionHeader title="Latest Posts" meta="From people you follow" />
          <div className="post-list">
            {posts.slice(0, POSTS_LIMIT).map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
          {posts.length > POSTS_LIMIT && (
            <Pressable className="more-link" onClick={() => goDiscover('following')}>
              More from people you follow
              <ArrowRight size={15} />
            </Pressable>
          )}
        </section>
      )}

      {!loading && (
        <footer className="caught-up">
          <span className="caught-up-icon">
            <Clapperboard size={18} />
          </span>
          <p className="caught-up-title">That's a wrap for now</p>
          <p className="caught-up-body">New matches arrive as productions post them. Explore everything else in Discover.</p>
        </footer>
      )}
    </div>
  );
}

function ForYouCarousel({ opps, total, newUser, goDiscover }: { opps: ReturnType<typeof forYou>; total: number; newUser: boolean; goDiscover: (s?: string) => void }) {
  const { push, openSheet } = useStore();
  const ref = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState(0);
  const slots = opps.length + 1;

  const onScroll = () => {
    const el = ref.current;
    if (!el) return;
    const card = el.firstElementChild as HTMLElement | null;
    const w = card ? card.offsetWidth + 12 : 1;
    setActive(Math.min(slots - 1, Math.round(el.scrollLeft / w)));
  };

  if (!opps.length) {
    return (
      <div className="foryou-empty">
        <p className="foryou-empty-title">No new matches for your role and city this week.</p>
        <p className="foryou-empty-body">Widening your travel radius or adding a second role usually helps.</p>
        <div className="row-gap">
          <Button variant="secondary" size="s" onClick={() => openSheet({ name: 'availability' })}>
            Edit preferences
          </Button>
          <Button variant="ghost" size="s" onClick={() => goDiscover('opportunities')}>
            Browse all
          </Button>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="carousel" ref={ref} onScroll={onScroll}>
        {opps.map((o, i) => (
          <motion.div key={o.id} className="carousel-item" {...stagger(i, 0.06)}>
            <OpportunityCard o={o} index={i} onOpen={() => push({ name: 'opportunity', id: o.id })} />
          </motion.div>
        ))}
        <div className="carousel-item carousel-item--end">
          {newUser ? (
            <PressCard className="end-card end-card--setup" onPress={() => openSheet({ name: 'availability' })}>
              <span className="end-card-ring">
                <svg viewBox="0 0 36 36" width="44" height="44">
                  <circle cx="18" cy="18" r="15" fill="none" stroke="var(--line-strong)" strokeWidth="3" />
                  <circle cx="18" cy="18" r="15" fill="none" stroke="var(--accent)" strokeWidth="3" strokeDasharray="94" strokeDashoffset="56" strokeLinecap="round" transform="rotate(-90 18 18)" />
                </svg>
                <b>40%</b>
              </span>
              <p className="end-card-title">Sharpen your matches</p>
              <p className="end-card-body">Add availability, languages and one credit or project. We only have your role and city so far.</p>
              <span className="end-card-cta">
                Complete profile <ArrowRight size={14} />
              </span>
            </PressCard>
          ) : (
            <PressCard className="end-card" onPress={() => goDiscover('opportunities')}>
              <span className="end-card-count">{total}</span>
              <p className="end-card-title">open roles and collaborations across Ana</p>
              <span className="end-card-cta">
                See all in Discover <ArrowRight size={14} />
              </span>
            </PressCard>
          )}
        </div>
      </div>
      <div className="carousel-progress" aria-hidden>
        {Array.from({ length: slots }).map((_, i) => (
          <motion.span key={i} className="carousel-dash" animate={{ width: i === active ? 22 : 6, opacity: i === active ? 1 : 0.35 }} transition={spring.snappy} />
        ))}
      </div>
    </>
  );
}

/** Empty network transforms into generated suggestions instead of disappearing on day one. */
function BuildNetwork() {
  const { viewer, following, toggleFollow, push } = useStore();
  const ids = seed.suggestedFor[viewer.id] ?? [];
  if (!ids.length) return null;
  const me = person(viewer.id);
  return (
    <>
      <SectionHeader title="Build your network" meta={`People in and around your craft in ${me.city}`} />
      <div className="suggest-rail">
        {ids.map((id, i) => {
          const p = person(id);
          const on = following.includes(id);
          return (
            <motion.div key={id} {...stagger(i)}>
              <PressCard className="suggest-card" onPress={() => push({ name: 'profile', id })}>
                <Avatar party={p} size={56} ring={p.availableFrom ? 'available' : undefined} />
                <p className="suggest-name">{p.name}</p>
                <p className="suggest-role">{p.role}</p>
                <Button
                  size="s"
                  variant={on ? 'secondary' : 'light'}
                  icon={on ? undefined : <UserPlus size={14} />}
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleFollow(id);
                  }}
                >
                  {on ? 'Following' : 'Follow'}
                </Button>
              </PressCard>
            </motion.div>
          );
        })}
      </div>
      <p className="hint">Activity from people you follow (credits, projects, availability) will show here.</p>
    </>
  );
}
