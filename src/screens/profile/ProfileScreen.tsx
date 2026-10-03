import { Ban, Bookmark, Camera, ChevronDown, ChevronLeft, ChevronRight, List, Lock, MoreHorizontal, Play, Settings, Share } from 'lucide-react';
import { mediaName } from '../../ui/a11y';
import { creditState, world, project as wproject, publicName } from '../../state/world';
import { useEffect, useLayoutEffect, useRef, useState, type ReactNode, type RefObject } from 'react';
import * as seed from '../../data/seed';
import type { Credit, Media, Person } from '../../data/types';
import { useStore } from '../../state/store';
import { availableLabel, org, person } from '../../state/selectors';
import { publicCreditsFor } from '../../domain/discovery';
import { Avatar, Button, FollowButton, EmptyState, HowItWorks, IconButton, Photo, PressCard, Pressable, SectionHeader, Verified } from '../../ui/primitives';
import { PostCard } from '../home/PostCard';
import { RoleRow } from '../discover/RoleRow';
import { displayTitle, scriptLang } from '../../ui/compose';
import { CreditSeal } from '../../ui/CreditSeal';
import { bentoLayout } from '../../ui/bento';
import { useHeroParallax } from '../../ui/useHeroParallax';
import { EventsSection } from '../event/eventUnits';
import { eventsOfHost, speakingAt } from '../../state/events';

/**
 * Two kinds of evidence, never mixed: verified credits (issued by a production and accepted by the
 * person, on a project the production has shared) and independent projects (shown by the person).
 */
function derive(p: Person) {
  const events = Object.values(seed.networkEvents).flat().filter((e) => e.actorIds.includes(p.id));
  const credits: Credit[] = publicCreditsFor(p.id)
    .map((c) => {
      const w = wproject(c.projectId)!;
      return { id: c.id, title: publicName(w), year: w.year ?? '2026', role: c.line, department: c.dept, orgId: w.houseId!, format: w.format, status: 'Released' as const, media: w.artwork ?? seed.cameraRoll[0] };
    })
    .sort((x, y) => y.year.localeCompare(x.year));
  const projects = world.projects
    .filter((w) => w.ownerId === p.id && w.shared)
    .map((w) => ({ id: w.id, title: publicName(w), year: w.year ?? '2026', format: w.formatLabel ?? w.format, note: w.logline ?? '', media: w.artwork ?? seed.cameraRoll[0] }));
  const work: Media[] = seed.portfolio[p.id] ?? events.flatMap((e) => (e.kind !== 'credit' ? e.media ?? [] : []));
  return { credits, work, projects, about: seed.about[p.id] };
}

/** Where one association stands, in the person's words. Being added is never called a credit. */
export function associationStage(credit?: string) {
  if (credit === 'proposed') return 'Credit waiting for you';
  if (credit === 'correction') return 'Correction sent';
  if (credit === 'accepted') return 'Credit accepted · public when the project is shared';
  return 'Added · not a credit';
}

const CRAFT_LABEL: Record<string, string> = { cinematographer: 'Cinematography', camera: 'Camera', editor: 'Editing', director: 'Direction', actor: 'Acting', colourist: 'Colour', 'production-design': 'Production design', sound: 'Sound', production: 'Production' };

function Fact({ icon, children }: { icon: ReactNode; children: ReactNode }) {
  return (
    <li className="fact">
      <span className="fact-icon">{icon}</span>
      <span>{children}</span>
    </li>
  );
}

/**
 * The profile name stays the strongest type and takes at most two lines: after displayTitle's step,
 * it shrinks in 2 px steps down to 24 px until it fits, rather than being cut.
 */
function useNameFit(name: string) {
  const ref = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.removeProperty('font-size');
    let size = parseFloat(getComputedStyle(el).fontSize);
    const lines = () => el.getBoundingClientRect().height / (parseFloat(getComputedStyle(el).lineHeight) || size * 1.02);
    while (lines() > 2.2 && size > 24) {
      size -= 2;
      el.style.setProperty('font-size', `${size}px`, 'important');
    }
  }, [name]);
  return ref;
}

export function ProfileScreen({ id, isTab }: { id: string; isTab?: boolean }) {
  const { isSaved, toggleSave } = useStore();
  const { viewer, scenario, pop, push, availability, following, toggleFollow, openSheet, startConversation, userPosts, userPortfolio, setHero, memberships, blocked, unblock, pendingCredits, acceptCredit, creditBusy, justAccepted, saved, acting, setActing, cannotReach, events } = useStore();
  const p = person(id);
  const own = id === viewer.id;
  const heroKey = isTab ? `profile-${id}-tab` : `profile-${id}`;
  // Scroll depth is written straight to the hero's layers (src/ui/useHeroParallax.ts): no re-render per scroll event.
  const [overHero, setOverHero] = useState(true);
  const heroScroll = useHeroParallax(setOverHero);
  const nameRef = useNameFit(p?.name ?? '');

  // While the photo sits under the status bar, the bar turns light.
  useEffect(() => {
    setHero(heroKey, overHero && p?.visibility !== 'private');
    return () => setHero(heroKey, false);
  }, [heroKey, overHero, setHero, p?.visibility]);
  // Credit accepted: bring the newly stamped credit into view in its rail (horizontal only).
  useEffect(() => {
    if (!justAccepted) return;
    const t = window.setTimeout(() => {
      const item = document.querySelector<HTMLElement>('.rail-item--sealing');
      const rail = item?.parentElement;
      if (item && rail) rail.scrollTo({ left: item.offsetLeft - (rail.clientWidth - item.clientWidth) / 2, behavior: 'smooth' });
    }, 60);
    return () => window.clearTimeout(t);
  }, [justAccepted]);

  if (!p) return <EmptyState title="Profile unavailable" />;
  // Someone who blocked the identity in use sees exactly what a private profile looks like. They are never told.
  if (!own && (p.visibility !== 'public' || (cannotReach(id) && !blocked.includes(id)))) {
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

  if (!own && blocked.includes(id)) {
    return (
      <div className="screen">
        <header className="topbar topbar--nav">
          <IconButton label="Back" onClick={pop}>
            <ChevronLeft size={26} />
          </IconButton>
        </header>
        <EmptyState icon={<Ban />} title={`You blocked ${p.name}`} body="You won't see each other on Art and Artist. They haven't been told." />
        <Button variant="secondary" onClick={() => unblock(id)} className="center-btn">
          Unblock
        </Button>
      </div>
    );
  }

  const d = derive(p);
  const credits = d.credits;
  const work = own ? [...userPortfolio, ...d.work] : d.work;
  const reel = work.find((m) => m.kind === 'video');
  const stills = work.filter((m) => m !== reel);
  const bento = bentoLayout(stills.length);
  const posts = [...userPosts.filter((x) => x.authorId === id), ...seed.posts.filter((x) => x.authorId === id)];
  const collabs = seed.opportunities.filter((o) => o.authorId === id);
  const from = own ? (availability.open ? availability.from : null) : p.availableFrom ?? null;
  const isFollowing = following.includes(id);
  const backdrop = reel ?? work[0] ?? d.credits[0]?.media;
  // The hero is the person's work; the person themself is the portrait in the identity block below
  // (Person, Craft, Work, Credibility). With no work yet a neutral Art and Artist illustration stands in (the
  // photo would only repeat the portrait), never a broken image.
  const heroSrc = backdrop?.src ?? 'images/brand/entry/camera.jpg';
  const hero: Media = { id: `hero-${id}`, kind: 'image', src: heroSrc, fallback: backdrop?.fallback ?? heroSrc };

  return (
    <div ref={heroScroll} className="screen screen--hero canvas v-profile" data-scroll={isTab ? 'profile' : undefined}>
      <div className="phero" data-hero>
        <div className="ohero-parallax" data-hero-photo>
          <Photo media={hero} className="phero-photo" alt={p.name} />
        </div>
        <div className="phero-dim" data-hero-dim aria-hidden />
        <div className="phero-bar">
          {/* Your own profile: no Back unless it was opened as a page; never Save, Follow or Message. */}
          {!isTab && (
            <IconButton label="Back" className="icon-btn--float" onClick={pop}>
              <ChevronLeft size={24} />
            </IconButton>
          )}
          <span className="flex" />
          {/* V30: people can be saved, privately, like anything else worth coming back to (a shortlist). */}
          {!own && (
            <IconButton label={`Save ${p.name}`} aria-pressed={isSaved('person', id)} className={`icon-btn--float ${isSaved('person', id) ? 'is-saved' : ''}`} onClick={() => toggleSave(id, 'person')}>
              <Bookmark size={18} fill={isSaved('person', id) ? 'currentColor' : 'none'} />
            </IconButton>
          )}
          <IconButton label={own ? 'Share your profile' : `Share ${p.name}`} className="icon-btn--float" onClick={() => openSheet({ name: 'share', label: p.name })}>
            <Share size={18} />
          </IconButton>
          <IconButton label={own ? 'Settings' : `More options for ${p.name}`} className="icon-btn--float" onClick={() => (own ? push({ name: 'settings' }) : openSheet({ name: 'more', id }))}>
            {own ? <Settings size={19} /> : <MoreHorizontal size={20} />}
          </IconButton>
        </div>
      </div>

      <div className="psheet">
        {/* Identity first: Person, Craft, Location, Credibility, then Availability, then Actions, then Work. */}
        <header className="pid">
          <span className="pid-avatar">
            <Avatar party={p} size={96} />
          </span>
          <p className="pid-craft" lang={scriptLang(CRAFT_LABEL[p.craft] ?? p.role)}>
            {CRAFT_LABEL[p.craft] ?? p.role}
          </p>
          {own && isTab && memberships.length > 0 ? (
            <button ref={nameRef as RefObject<HTMLButtonElement>} className="large-title org-name--switch display-title display-title--name" {...displayTitle(p.name)} onClick={() => openSheet({ name: 'identity' })} aria-label="Switch identity">
              {p.name}
              {p.identityVerified && <Verified size={22} label="Identity verified" />}
              <ChevronDown size={20} />
            </button>
          ) : (
            <h1 ref={nameRef as RefObject<HTMLHeadingElement>} className="large-title display-title display-title--name" {...displayTitle(p.name)}>
              {p.name}
              {p.identityVerified && <Verified size={22} label="Identity verified" />}
            </h1>
          )}
          <p className="pid-role" lang={scriptLang(p.role)}>
            {p.role}
          </p>
          <p className="pid-place">
            {p.city}
            {p.languages?.length ? ` · ${p.languages.join(', ')}` : ''}
          </p>
          <p className="pid-stats">
            <Verified size={13} label="Verified credits" />
            <span>
              {credits.length} verified {credits.length === 1 ? 'credit' : 'credits'}
              {p.years ? ` · ${p.years} years active` : ''}
            </span>
          </p>
        </header>

        {/* Availability: one quiet row under credibility. Your own is editable; someone else's shows only when open. */}
        {own ? (
          <Pressable className="pid-availability" onClick={() => openSheet({ name: 'availability' })} aria-label="Availability">
            <span className={`status-dot ${availability.open && !scenario.newUser ? 'is-on' : ''}`} />
            {scenario.newUser ? (
              <span className="link link--underline">Add when you're available</span>
            ) : (
              <span className="pid-availability-text">
                <span>{availability.open ? availableLabel(availability.from) : 'Not taking work'}</span>
                {availability.open && availability.scope && <span className="meta">{availability.scope}</span>}
              </span>
            )}
            <ChevronRight size={18} className="pid-availability-chevron" />
          </Pressable>
        ) : (
          from && (
            <div className="pid-availability">
              <span className="status-dot is-on" />
              <span className="pid-availability-text">
                <span>{availableLabel(from)}</span>
                <span className="meta">
                  {p.city}
                  {p.openToTravel ? ' · will travel' : ''}
                </span>
              </span>
            </div>
          )
        )}

        <div className="profile-actions">
          {own ? (
            <Button block variant="secondary" onClick={() => push({ name: 'editProfile' })}>
              Edit profile
            </Button>
          ) : (
            <>
              {/* V30: Follow is the primary action (build a network gradually); Message is secondary. Whether someone can be messaged is a separate rule. */}
              <FollowButton block size="m" primary on={isFollowing} onToggle={() => toggleFollow(id)} name={p.name} />
              <Button
                block
                variant="secondary"
                onClick={() => {
                  const cid = startConversation(id, { kind: 'project', label: 'Direct', detail: 'Direct message', refId: 'direct' });
                  cid && push({ name: 'conversation', id: cid });
                }}
              >
                {acting !== 'self' ? `Message as ${org(acting).name}` : 'Message'}
              </Button>
            </>
          )}
        </div>

        {/* Private to you, one quiet line: what you saved and what you sent. */}
        {own && (
          <div className="pid-private">
            <button className="pid-private-link" onClick={() => push({ name: 'saved' })}>
              <Bookmark size={16} />
              Saved{saved.length ? <span className="meta"> {saved.length}</span> : null}
            </button>
            <button className="pid-private-link" onClick={() => openSheet({ name: 'activity' })}>
              <List size={16} />
              Your activity
            </button>
          </div>
        )}

        {own && pendingCredits.length > 0 && (
          <section className="section section--flush">
            <SectionHeader title="Waiting for your confirmation" />
            {pendingCredits.map((c) => (
              <div key={c.id} className="pending-credit">
                <Photo media={c.media} className="pending-credit-poster" showPlay={false} />
                <div className="pending-credit-text">
                  <p className="meta pending-credit-from">
                    {org(c.orgId).name} <Verified size={12} /> {c.revision ? 'proposes a revised credit' : 'credited you'}
                  </p>
                  <button className="item-title pending-credit-title" onClick={() => push({ name: 'association', id: c.associationId })}>
                    {c.title}
                  </button>
                  <p className="meta meta--dark pending-credit-role">{c.role}</p>
                </div>
                {/* Actions span the card's foot: Accept leads, the question stays quieter. */}
                <div className="pending-credit-foot">
                  {acting !== 'self' ? (
                    <button className="link link--small" onClick={() => setActing('self', true, true)}>
                      Switch to you to respond
                    </button>
                  ) : c.correction ? (
                    <p className="meta">You asked: {c.note ?? 'a correction'}. {org(c.orgId).name} will send a corrected credit.</p>
                  ) : (
                    <div className="pending-credit-actions">
                      <Button size="s" loading={creditBusy === c.id} onClick={() => acceptCredit(c.id)} aria-label={`Accept credit on ${c.title}`}>
                        Accept
                      </Button>
                      <Button size="s" variant="plain" onClick={() => (c.revision ? push({ name: 'association', id: c.associationId }) : openSheet({ name: 'reportCredit', title: c.title, creditId: c.id }))}>
                        {c.revision ? 'Compare' : 'Something wrong?'}
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            ))}
            <p className="meta pending-credit-note">Only credits you accept appear on your profile.</p>
          </section>
        )}

        <section className="section section--flush">
          <SectionHeader title="Verified credits" />
          {/* V30: the trust layer, stated plainly. Credits come only from productions; people confirm them, never claim them.
              One line on every profile; the full explanation opens on request (docs/UX_HEURISTIC_AUDIT.md F4). */}
          <div className="meta evidence-note">
            <span>
              <Verified size={12} /> Issued by productions, confirmed by {own ? 'you' : p.name.split(' ')[0]}.
            </span>
            <HowItWorks label="How credits work">
              Only a production can issue a credit. {own ? 'You accept' : `${p.name.split(' ')[0]} accepts`} or {own ? 'correct' : 'corrects'} it before it appears here, so no one can add their own credits.
            </HowItWorks>
          </div>
          {credits.length ? (
            <div className="rail credit-rail">
              {credits.map((c) => (
                <Pressable key={c.id} className={`rail-item ${justAccepted === c.id ? 'rail-item--sealing' : ''}`} scale={0.97} onClick={() => { const wid = world.credits.find((x) => x.id === c.id)?.projectId; if (wid) push({ name: 'work', id: wid }); }} aria-label={`${c.title}, ${c.role}, ${org(c.orgId).name}`}>
                  <span className="rail-poster-wrap">
                    <Photo media={c.media} className="rail-poster" showPlay={false} />
                    {justAccepted === c.id && <CreditSeal />}
                  </span>
                  <p className="item-title">{c.title}</p>
                  <p className="meta">{c.role}</p>
                  <p className="meta rail-issuer">
                    <span className="rail-issuer-name">{org(c.orgId).name}</span> <Verified size={12} />
                  </p>
                </Pressable>
              ))}
            </div>
          ) : (
            <p className="meta">{own ? 'No verified credits yet. When a production credits you, you confirm it here.' : 'No verified credits yet.'}</p>
          )}
        </section>

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

        {stills.length > 0 && (
          <section className="section section--flush">
            <SectionHeader title="Portfolio" />
            <div className="bento">
              {stills.map((m, i) => (
                <Pressable key={m.id + i} className="bento-tile" data-span={bento[i].span} data-ratio={bento[i].ratio} onClick={() => push({ name: 'media', items: stills, index: i, what: 'Portfolio image', from: `by ${p.name}` })} scale={0.97} aria-label={mediaName(m, i, stills.length, 'Portfolio image', `by ${p.name}`)}>
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

        {/* Events: what they're hosting (their own under-review ones only to them) and where they're speaking. */}
        <EventsSection title="Hosting" list={eventsOfHost(events, p.id, Date.now(), viewer.id, own ? 'self' : '')} />
        <EventsSection title="Speaking at" list={speakingAt(events, p.id, Date.now())} />

        {d.projects.length > 0 && (
          <section className="section section--flush">
            <SectionHeader title="Independent projects" />
            <p className="meta evidence-note">Shared by {own ? 'you' : p.name.split(' ')[0]}. Roles on independent work aren't verified yet.</p>
            <div className="list list--flush">
              {d.projects.map((pr) => (
                <PressCard key={pr.id} className="rrow" onPress={() => push({ name: 'work', id: pr.id })} scale={0.985}>
                  <Photo media={pr.media} className="rrow-thumb" showPlay={false} />
                  <div className="rrow-text">
                    <p className="item-title">{pr.title}</p>
                    <p className="meta">
                      {pr.format} · {pr.year}
                    </p>
                    {pr.note && <p className="meta">{pr.note}</p>}
                  </div>
                </PressCard>
              ))}
            </div>
          </section>
        )}

        {own && (() => {
          // Private associations others made, plus the person's own unshared independent projects.
          const mine = world.associations.filter((a) => {
            if (a.personId !== viewer.id || a.status === 'removed' || wproject(a.projectId)?.ownerId === viewer.id) return false;
            // Once a credit is accepted on a shared project it lives under Credits, the public record.
            return !(creditState(a.id).current && wproject(a.projectId)?.shared);
          });
          const drafts = world.projects.filter((w) => w.ownerId === viewer.id && !w.shared);
          if (!mine.length && !drafts.length) return null;
          return (
            <section className="section section--flush">
              <SectionHeader title="Projects you're on" />
              <p className="meta ph-note">
                <Lock size={11} /> Only you and each production see these. They aren't credits.
              </p>
              <div className="list list--flush">
                {drafts.map((w) => (
                  <PressCard key={w.id} className="prow" onPress={() => push({ name: 'hproject', id: w.id })} scale={0.99}>
                    <span className="record-mark">
                      <Lock size={14} />
                    </span>
                    <div className="prow-text">
                      <p className="item-title">{w.workingTitle}</p>
                      <p className="meta">Your independent project · not shared</p>
                    </div>
                  </PressCard>
                ))}
                {mine.map((a) => {
                  const w = wproject(a.projectId)!;
                  const cs = creditState(a.id);
                  return (
                    <PressCard key={a.id} className="prow" onPress={() => push({ name: 'association', id: a.id })} scale={0.99}>
                      <span className="record-mark">
                        <Lock size={14} />
                      </span>
                      <div className="prow-text">
                        <p className="item-title">{w.workingTitle}</p>
                        <p className="meta">
                          {a.workingRole} · {w.houseId ? org(w.houseId).name : 'Independent'}
                        </p>
                        <p className="meta">{a.status === 'flagged' ? "You said this isn't right. Waiting on the house." : associationStage(cs.pending?.status ?? cs.current?.status)}</p>
                      </div>
                    </PressCard>
                  );
                })}
              </div>
            </section>
          );
        })()}

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
