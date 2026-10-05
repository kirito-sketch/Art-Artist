import { motion } from 'framer-motion';
import { scriptLang } from '../../ui/compose';
import { mediaName } from '../../ui/a11y';
import { ChevronLeft, MoreHorizontal, Share } from 'lucide-react';
import { shared, spring } from '../../ui/motion';
import { useEffect, useState } from 'react';
import * as seed from '../../data/seed';
import { world, project as wproject, work } from '../../state/world';
import { useStore } from '../../state/store';
import { org, person } from '../../state/selectors';
import { Avatar, Button, EmptyState, IconButton, Photo, PressCard, Pressable, SectionHeader, Verified } from '../../ui/primitives';
import { PortraitCard } from '../../ui/compose';
import { discoverPosts } from '../../state/selectors';
import { heroOf, ProjectMedia, useProjectPictures } from '../../ui/ProjectMedia';
import { RoleRow } from '../discover/RoleRow';
import { SaveButton } from '../home/OpportunityCard';
import { useLoad } from '../../ui/useLoad';
import { PageError, PageSkeleton } from '../../ui/PageStates';
import { EventsSection } from '../event/eventUnits';
import { eventsOfProject } from '../../state/events';

/**
 * Public project page. What anyone on Art and Artist sees, in this order (docs/HOME.md, "Project detail"):
 *   media -> identity -> about -> people making it -> work from the project -> production house -> open roles
 * It never leads with hiring: roles come last, and only when there are any. Opened from a Home card or a
 * poster, the same picture grows into the hero, so the project stays one object. The house's private
 * workspace is a different screen and a different context.
 */
export function WorkScreen({ id, fromCard }: { id: string; fromCard?: boolean }) {
  const { pop, push, openSheet, viewer, acting, setHero, roleStatus, blocked, events, following, userPosts } = useStore();
  const wp = wproject(id);
  const w = work(id);
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    setHero('work', scrollY < 300);
    return () => setHero('work', false);
  }, [scrollY, setHero]);
  const load = useLoad(`work-${id}`);
  const pictures = useProjectPictures(w);
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
  const mine = acting === 'self' ? w.credits.find((c) => c.personId === viewer.id) : undefined;
  // Only the lead production opens the workspace. Co-producers see the public page like everyone else (authority is an open question).
  const isLead = acting !== 'self' && wp?.houseId === acting;
  const released = w.stage === 'Released';

  const hero = heroOf(w);
  // Work from the project: its pictures beyond the hero, and posts about it from people Discover could show.
  const stills = (pictures ?? []).slice(1);
  const posts = discoverPosts(viewer, following, userPosts).filter((p) => p.project === w.title && p.media.length && !blocked.includes(p.authorId));
  const kicker = [w.format, released ? w.year : w.stage].join(' · ');

  return (
    <div className="screen screen--hero" onScroll={(e) => setScrollY(e.currentTarget.scrollTop)}>
      {/* 1. Media */}
      <div className={`whero whero--work ${hero ? '' : 'whero--title'}`}>
        <div className="ohero-parallax" style={{ transform: `translateY(${Math.max(0, scrollY) * 0.4}px)` }}>
          {/* Opened from a card: the card's picture becomes this hero, so the project stays one object. */}
          <motion.div layoutId={fromCard && hero ? shared.work(w.id) : undefined} className="whero-photo" transition={spring.push}>
            <ProjectMedia w={w} className="whero-photo" kicker={kicker} />
          </motion.div>
        </div>
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
      </div>

      <div className="psheet work-sheet">
        {/* 2. Identity. With no media the title card above already is the identity, so it isn't said twice. */}
        <header className={hero ? 'work-identity' : 'sr-only'}>
          <h1 className="work-title" lang={scriptLang(w.title)}>
            {w.title}
          </h1>
          <p className="work-kicker">{kicker}</p>
        </header>
        {mine && (
          <div className="work-mine">
            <p className="item-title">
              <Verified size={13} /> You're credited as {mine.role}
            </p>
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

        {/* 3. About */}
        {w.logline && <p className="body work-logline">{w.logline}</p>}

        {/* 4. People making it: only accepted, production-issued credits (an "added to project" link is private). */}
        {w.ownerId ? (
          <section className="section section--flush">
            <SectionHeader title="Made by" />
            <div className="portrait-rail work-people">
              <PortraitCard person={person(w.ownerId)} context="Independent project" onPress={() => push({ name: 'profile', id: w.ownerId! })} />
            </div>
            <p className="meta work-foot">Credits for independent projects are not verified yet.</p>
          </section>
        ) : (
          w.credits.length > 0 && (
            <section className="section section--flush">
              <SectionHeader title="People making it" />
              <div className="portrait-rail work-people">
                {w.credits.map((c) => {
                  const p = person(c.personId);
                  // Their role on this project, only when it isn't already their headline role.
                  return <PortraitCard key={c.personId + c.role} person={p} context={c.role !== p.role ? c.role : undefined} onPress={() => push({ name: 'profile', id: p.id })} />;
                })}
              </div>
              <p className="meta work-foot">
                <Verified size={12} /> Credits issued by the production, accepted by each person.
              </p>
            </section>
          )
        )}

        {/* 5. Work from the project */}
        {(posts.length > 0 || stills.length > 0) && (
          <section className="section section--flush">
            <SectionHeader title="Work from the project" />
            <div className="work-mosaic">
              {posts.map((p, i) => (
                <Pressable key={p.id} className="work-tile" onClick={() => push({ name: 'posts', ids: posts.map((x) => x.id), index: i })} scale={0.97} aria-label={`Post by ${person(p.authorId).name}`}>
                  <Photo media={p.media[0]} />
                  <span className="work-tile-by">
                    <Avatar party={person(p.authorId)} size={20} />
                  </span>
                </Pressable>
              ))}
              {stills.map((m, i) => (
                <Pressable key={m.id} className="work-tile" onClick={() => push({ name: 'media', items: stills, index: i, what: 'Still', from: `from ${w.title}` })} scale={0.97} aria-label={mediaName(m, i, stills.length, 'Still', `from ${w.title}`)}>
                  <Photo media={m} showPlay={false} />
                </Pressable>
              ))}
            </div>
          </section>
        )}

        {/* 6. Production house */}
        {w.orgIds.length > 0 && (
          <section className="section section--flush">
            <SectionHeader title={w.orgIds.length > 1 ? 'Production houses' : 'Production house'} />
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
                      <p className="meta">{w.orgIds.length > 1 ? (i === 0 ? 'Lead production' : 'Co-production') : o.city}</p>
                    </div>
                  </PressCard>
                );
              })}
            </div>
          </section>
        )}

        {/* 7. Open roles, last, and only when there are any */}
        {roles.length > 0 && (
          <section className="section section--flush">
            <SectionHeader title="Open roles" />
            <div className="list list--flush">
              {roles.map((o) => (
                <RoleRow key={o.id} o={o} />
              ))}
            </div>
          </section>
        )}

        {/* Screenings (Events, behind their own switch): not part of the agreed order, so after it. */}
        <EventsSection title="Screenings" list={eventsOfProject(events, id, Date.now(), viewer.id, acting)} action={isLead ? 'Add a screening' : undefined} onAction={() => push({ name: 'composeEvent', projectId: id })} />
      </div>
    </div>
  );
}
