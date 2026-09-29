import { motion } from 'framer-motion';
import { Bell, CheckCircle2 } from 'lucide-react';
import { useEffect, useRef } from 'react';
import * as seed from '../../data/seed';
import { useStore } from '../../state/store';
import { forYou, networkFor, person, postsFor } from '../../state/selectors';
import { OfflineBanner, PublishBar } from '../../ui/chrome';
import { stagger } from '../../ui/motion';
import { Avatar, Button, IconButton, PressCard, SectionHeader, Skeleton } from '../../ui/primitives';
import { NetworkRow } from './NetworkActivity';
import { FeaturedCard } from './OpportunityCard';
import { Logo } from '../../ui/Logo';
import { PostCard } from './PostCard';

const NETWORK_LIMIT = 4;
const POSTS_LIMIT = 2;

/**
 * Home is a short briefing: opportunities first, then what your people did, then a little of what they said.
 * It ends.
 */
export function HomeScreen({ goDiscover }: { goDiscover: (scope?: string) => void }) {
  const store = useStore();
  const { viewer, scenario, availability, openSheet, notifications, reloadKey, push } = store;
  const scrollRef = useRef<HTMLDivElement>(null);
  const loading = scenario.loading;
  const opps = forYou(viewer, scenario);
  const events = networkFor(viewer, scenario);
  const posts = postsFor(viewer, scenario, store.following, store.userPosts);
  const unread = notifications.some((n) => n.unread);

  const publishingId = store.publishing?.id;
  useEffect(() => {
    if (publishingId) scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
  }, [publishingId]);

  return (
    <div className="screen" ref={scrollRef} data-scroll="home" key={`${viewer.id}-${reloadKey}`}>
      <header className="topbar">
        <Logo />
        <IconButton label="Notifications" onClick={() => openSheet({ name: 'notifications' })}>
          <Bell size={22} />
          {unread && <span className="dot" />}
        </IconButton>
      </header>

      <OfflineBanner />
      <PublishBar />

      <section className="section section--first">
        <div className="section-head section-head--stacked">
          <div>
            <h2>Open roles</h2>
            <button className="availability" onClick={() => openSheet({ name: 'availability' })}>
              {scenario.newUser ? (
                <span className="link link--accent">Add your availability for better matches</span>
              ) : (
                <>
                  <span className={`status-dot ${availability.open ? 'is-on' : ''}`} />
                  {availability.open ? `For you, ${availability.from === 'Now' ? 'available now' : `free from ${availability.from}`}` : 'You are not taking work'}
                  <span className="link">Edit</span>
                </>
              )}
            </button>
          </div>
          {!loading && !scenario.forYouError && opps.length > 1 && (
            <button className="link" onClick={() => goDiscover('roles')}>
              See all
            </button>
          )}
        </div>

        {loading ? (
          <div className="carousel carousel--roles">
            {[0, 1].map((i) => (
              <div key={i} className="carousel-item">
                <Skeleton h={400} r={28} />
              </div>
            ))}
          </div>
        ) : scenario.forYouError ? (
          <div className="inline-error inline-error--flush">
            <p>Couldn't load your matches.</p>
            <Button variant="secondary" size="s" onClick={() => store.setScenario({ forYouError: false })}>
              Retry
            </Button>
          </div>
        ) : opps.length ? (
          <div className="carousel carousel--roles">
            {opps.map((o, i) => (
              <motion.div key={o.id} className="carousel-item" {...stagger(i, 0.05)}>
                <FeaturedCard o={o} onOpen={() => push({ name: 'opportunity', id: o.id })} />
              </motion.div>
            ))}
          </div>
        ) : (
          <p className="meta">No new roles for your craft this week.</p>
        )}
      </section>

      {loading ? null : events.length ? (
        <section className="section">
          <SectionHeader title="From your network" action={events.length > NETWORK_LIMIT ? 'See all' : undefined} onAction={() => push({ name: 'network' })} />
          <div className="list">
            {events.slice(0, NETWORK_LIMIT).map((e, i) => (
              <NetworkRow key={e.id} e={e} index={i} />
            ))}
          </div>
        </section>
      ) : (
        <SuggestedPeople />
      )}

      {!loading && posts.length > 0 && (
        <section className="section">
          <SectionHeader title="Latest posts" action={posts.length > POSTS_LIMIT ? 'See all' : undefined} onAction={() => goDiscover('posts')} />
          <div className="list">
            {posts.slice(0, POSTS_LIMIT).map((p) => (
              <PostCard key={p.id} post={p} />
            ))}
          </div>
        </section>
      )}

      {!loading && (
        <p className="end">
          <CheckCircle2 size={16} /> You're all caught up
        </p>
      )}
    </div>
  );
}

/** A new account has no network yet, so the section offers people in the same craft and city instead. */
function SuggestedPeople() {
  const { viewer, following, toggleFollow, push } = useStore();
  const ids = seed.suggestedFor[viewer.id] ?? [];
  if (!ids.length) return null;
  return (
    <section className="section">
      <SectionHeader title="People to follow" />
      <div className="list">
        {ids.slice(0, 4).map((id) => {
          const p = person(id);
          const on = following.includes(id);
          return (
            <PressCard key={id} className="prow" onPress={() => push({ name: 'profile', id })} scale={0.985}>
              <Avatar party={p} size={44} available={!!p.availableFrom} />
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
                  toggleFollow(id);
                }}
              >
                {on ? 'Following' : 'Follow'}
              </Button>
            </PressCard>
          );
        })}
      </div>
    </section>
  );
}
