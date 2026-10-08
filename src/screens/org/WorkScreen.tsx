import { motion } from 'framer-motion';
import { scriptLang } from '../../ui/compose';
import { mediaName } from '../../ui/a11y';
import { ChevronLeft, MoreHorizontal, Share } from 'lucide-react';
import { shared, spring } from '../../ui/motion';
import { useEffect, useState } from 'react';
import * as seed from '../../data/seed';
import { world, project as wproject, work } from '../../state/world';
import { useStore } from '../../state/store';
import { discoverPosts, postWork, org, person } from '../../state/selectors';
import { Avatar, Button, EmptyState, IconButton, Photo, PressCard, Pressable, SectionHeader, Verified } from '../../ui/primitives';
import { RoleRow } from '../discover/RoleRow';
import { PostCard } from '../home/PostCard';
import { SaveButton } from '../home/OpportunityCard';
import { useLoad } from '../../ui/useLoad';
import { PageError, PageSkeleton } from '../../ui/PageStates';
import { EventsSection } from '../event/eventUnits';
import { eventsOfProject } from '../../state/events';
import { FilmReviewsSection } from '../reviews/reviewUnits';
import { useFeatures } from '../../ui/features';
import { TrailerPlayer } from './TrailerPlayer';
import { orderVersions } from '../../domain/trailers';
import { TRAILER_SAMPLE } from '../../ui/preview';
import { posterFor } from '../../data/posters';
import type { Trailer } from '../../state/world';

const CLIPS = ['kaaval', 'faultlines', 'monsoon', 'neeliraat', 'neela', 'backwaters'];
/** Studio review only (?trailer-sample): two labelled stand-in clips, so the player and language chips can be reviewed. */
function sampleTrailers(id: string, languages: string[]): Trailer[] {
  const own = CLIPS.includes(id) ? id : 'kaaval';
  const other = CLIPS.find((c) => c !== own)!;
  return [
    { id: `sample-${id}-1`, kind: 'trailer', language: languages[0] ?? 'Hindi', url: `video/${own}.mp4`, status: 'published', sample: true },
    { id: `sample-${id}-2`, kind: 'teaser', language: languages.find((l) => l !== languages[0]) ?? 'English', url: `video/${other}.mp4`, status: 'published', sample: true },
  ];
}

/**
 * Public project page. What anyone on Art and Artist sees: what it is, who made it, who is credited, whether it
 * is hiring. The house's private workspace is a different screen and a different context.
 */
export function WorkScreen({ id, fromCard }: { id: string; fromCard?: boolean }) {
  const { pop, push, openSheet, viewer, acting, setHero, roleStatus, blocked, events, following, userPosts } = useStore();
  const wp = wproject(id);
  const district = useFeatures().home === 'district' && !!wp?.houseId;
  const w = work(id);
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    setHero('work', scrollY < 300);
    return () => setHero('work', false);
  }, [scrollY, setHero]);
  const load = useLoad(`work-${id}`);
  if (load.state === 'loading') return <PageSkeleton />;
  if (load.state === 'error') return <PageError what="project" retry={load.retry} />;

  if (!w) {
    return (
      <div className="screen">
        <header className="topbar topbar--nav">
          <IconButton label="Back" onClick={pop}>
            <ChevronLeft size={26} />
          </IconButton>
        </header>
        <EmptyState title="This project isn't public" body="The production hasn't shared it on Art and Artist yet." />
      </div>
    );
  }

  const roles = [...seed.opportunities.filter((o) => o.project === w.title), ...world.roles.filter((r) => r.projectId === id && r.visibility === 'open')]
    .filter((o) => !roleStatus[o.id])
    // The record stays readable; hiring from someone you blocked is not offered.
    .filter((o) => !blocked.includes(o.orgId ?? o.authorId ?? ''));
  const projectPosts = discoverPosts(viewer, following, userPosts).filter(post => postWork(post)?.id === id);
  const depts = [...new Set(w.credits.map((c) => c.dept))];
  const mine = acting === 'self' ? w.credits.find((c) => c.personId === viewer.id) : undefined;
  // Only the lead production opens the workspace. Co-producers see the public page like everyone else (authority is an open question).
  const isLead = acting !== 'self' && wp?.houseId === acting;
  const released = w.stage === 'Released';
  // Trailer first when there is one (published versions only; drafts never reach this page).
  const versions = orderVersions(TRAILER_SAMPLE && wp ? sampleTrailers(id, wp.languages) : (w.trailers ?? []), wp?.languages);
  const trailerFirst = district && versions.length > 0;
  const poster = posterFor(id);
  const still = w.media.presentations?.['project-hero'] ? w.media : w.stills[0] ?? w.media;
  const bar = (
    <div className="phero-bar">
      <IconButton label="Back" className="icon-btn--float" onClick={pop}>
        <ChevronLeft size={24} />
      </IconButton>
      <span className="flex" />
      <IconButton label={`Share ${w.title}`} className="icon-btn--float" onClick={() => openSheet({ name: 'share', label: w.title })}>
        <Share size={18} />
      </IconButton>
      <span className="save-float">
        <SaveButton id={w.id} kind="project" floating name={w.title} />
      </span>
      <IconButton label={`More options for ${w.title}`} className="icon-btn--float" onClick={() => openSheet({ name: 'report', subject: w.title })}>
        <MoreHorizontal size={20} />
      </IconButton>
    </div>
  );
  const people = w.credits.map((c) => ({ c, p: person(c.personId) })).filter((x) => x.p);

  return (
    <div className={`screen screen--hero${district ? ' dhouse-page dhouse-public-project' : ''}`} onScroll={(e) => setScrollY(e.currentTarget.scrollTop)}>
      {trailerFirst ? (
        <div className="work-cinema">
          {bar}
          <TrailerPlayer versions={versions} fallback={still.id === 'ph' ? undefined : still} title={w.title} />
        </div>
      ) : (
        <div className="whero">
          <div className="ohero-parallax" style={{ transform: `translateY(${Math.max(0, scrollY) * 0.4}px)` }}>
            {w.media.id === 'ph' ? (
              <div className="whero-photo whero-empty" />
            ) : (
              // Opened from a poster: the poster's still becomes this hero, so the project stays one object.
              <motion.div layoutId={fromCard ? shared.work(w.id) : undefined} className="whero-photo" transition={spring.push}>
                <Photo surface="project-hero" media={w.media.presentations?.['project-hero'] ? w.media : w.stills[0] ?? w.media} className="whero-photo" showPlay={false} />
              </motion.div>
            )}
          </div>
          <div className="whero-text">
            <p className="whero-kicker">
              {w.format} · {released ? w.year : w.stage}
            </p>
            <h1 className="whero-title" lang={scriptLang(w.title)}>{w.title}</h1>
          </div>
          {bar}
        </div>
      )}

      <div className="psheet">
        {trailerFirst && (
          <header className="work-titlecard">
            <p className="whero-kicker">
              {w.format} · {released ? w.year : w.stage}
            </p>
            <h1 className="work-title" lang={scriptLang(w.title)}>{w.title}</h1>
          </header>
        )}
        <p className="body work-logline">{w.logline}</p>

        {w.ownerId && (
          <div className="list list--flush work-orgs">
            <PressCard className="prow" onPress={() => push({ name: 'profile', id: w.ownerId! })} scale={0.985}>
              <Avatar party={person(w.ownerId)} size={40} />
              <div className="prow-text">
                <p className="item-title">{person(w.ownerId).name}</p>
                <p className="meta">Independent project</p>
              </div>
            </PressCard>
          </div>
        )}
        <div className="list list--flush work-orgs">
          {w.orgIds.map((oid, i) => {
            const o = org(oid);
            return (
              <PressCard key={oid} className="prow" onPress={() => push({ name: 'org', id: oid })} scale={0.985}>
                <Avatar party={o} size={40} />
                <div className="prow-text">
                  <p className="item-title">
                    {o.name} {o.verified && <Verified size={13} />}
                  </p>
                  <p className="meta">{w.orgIds.length > 1 ? (i === 0 ? 'Lead production' : 'Co-production') : 'Production'}</p>
                </div>
              </PressCard>
            );
          })}
        </div>

        {mine && (
          <div className="work-mine">
            <p className="item-title">You're credited as {mine.role}</p>
            <button className="link link--small" onClick={() => openSheet({ name: 'reportCredit', title: w.title, creditId: world.credits.find((c) => c.projectId === id && c.personId === viewer.id && c.status === 'accepted')?.id })}>
              Something wrong?
            </button>
          </div>
        )}
        {isLead && (
          <Button block variant="secondary" onClick={() => push({ name: 'hproject', id: w.id })}>
            Open in your workspace
          </Button>
        )}

        {district && people.length > 0 && (
          <section className="section section--flush work-cast">
            <SectionHeader title={`Cast and crew · ${people.length}`} />
            <div className="work-cast-rail" role="list">
              {people.map(({ c, p }) => (
                <Pressable key={c.personId + c.role} role="listitem" className="work-cast-person" onClick={() => push({ name: 'profile', id: p.id })} scale={0.96} aria-label={`${p.name}, ${c.role}`}>
                  <Avatar party={p} size={68} />
                  <span className="work-cast-name">{p.name}</span>
                  <span className="work-cast-role">{c.role}</span>
                </Pressable>
              ))}
            </div>
            <p className="meta work-foot">
              <Verified size={12} /> Every credit here was issued by the production and accepted by the person.
            </p>
          </section>
        )}
        {district && (poster || w.stills.length > 1) && (
          <section className="section section--flush work-media">
            <SectionHeader title="Poster and stills" />
            <div className="work-media-rail">
              {poster && (
                <Pressable className="work-media-poster" onClick={() => push({ name: 'media', items: [poster], index: 0, what: 'Poster', from: `for ${w.title}` })} scale={0.97} aria-label={`${w.title} poster`}>
                  <Photo surface="credit-card" media={poster} frameRatio={2 / 3} showPlay={false} />
                </Pressable>
              )}
              {w.stills.map((m, i) => (
                <Pressable key={m.id} className="work-media-still" onClick={() => push({ name: 'media', items: w.stills, index: i, what: 'Still', from: `from ${w.title}` })} scale={0.97} aria-label={mediaName(m, i, w.stills.length, 'Still', `from ${w.title}`)}>
                  <Photo surface="project-card" media={m} showPlay={false} />
                </Pressable>
              ))}
            </div>
          </section>
        )}
        {!district && <FilmReviewsSection w={w} />}

        {roles.length > 0 && (
          <section className="section section--flush">
            <SectionHeader title="Hiring" />
            <div className="list list--flush">
              {roles.map((o) => (
                <RoleRow key={o.id} o={o} />
              ))}
            </div>
          </section>
        )}

        <EventsSection title="Screenings" list={eventsOfProject(events, id, Date.now(), viewer.id, acting)} action={isLead ? 'Add a screening' : undefined} onAction={() => push({ name: 'composeEvent', projectId: id })} />

        {district ? null : w.ownerId ? (
          <p className="meta work-foot">Credits for independent projects are not verified yet.</p>
        ) : (
        <section className="section section--flush">
          <SectionHeader title="Credits" />
          {!w.credits.length && <p className="meta">{released ? 'No credits issued on Art and Artist yet.' : 'Credits appear once the production issues them and each person accepts.'}</p>}
          {depts.map((d) => (
            <div key={d} className="ph-dept">
              <p className="meta">{d}</p>
              <div className="list list--flush">
                {w.credits
                  .filter((c) => c.dept === d)
                  .map((c) => {
                    const p = person(c.personId);
                    return (
                      <PressCard key={c.personId + c.role} className="prow" onPress={() => push({ name: 'profile', id: p.id })} scale={0.99}>
                        <Avatar party={p} size={40} />
                        <div className="prow-text">
                          <p className="item-title">{p.name}</p>
                          <p className="meta">{c.role}</p>
                        </div>
                      </PressCard>
                    );
                  })}
              </div>
            </div>
          ))}
          <p className="meta work-foot">
            <Verified size={12} /> Every credit here was issued by the production and accepted by the person.
          </p>
        </section>
        )}

        {!district && w.stills.length > 1 && (
          <section className="section section--flush">
            <SectionHeader title="Stills" />
            <div className="grid-3">
              {w.stills.map((m, i) => (
                <Pressable key={m.id} className="grid-item" onClick={() => push({ name: 'media', items: w.stills, index: i, what: 'Still', from: `from ${w.title}` })} scale={0.97} aria-label={mediaName(m, i, w.stills.length, 'Still', `from ${w.title}`)}>
                  <Photo surface="project-card" media={m} showPlay={false} />
                </Pressable>
              ))}
            </div>
          </section>
        )}
        {district && <FilmReviewsSection w={w} />}
        {projectPosts.length > 0 && <section className="section section--flush">
          <SectionHeader title="Posts" />
          {projectPosts.map(post => <PostCard key={post.id} post={post} />)}
        </section>}
      </div>
    </div>
  );
}
