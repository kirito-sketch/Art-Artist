import { ProfileHeroMedia } from './ProfileHeroMedia';
import { eligibleFeaturedProjects } from '../../domain/featuredWork';
import { profileCoverPosition, resolveProfileCover } from '../../domain/profileCover';
import { mediaRatio, mediaType, mediaPosition } from '../../domain/mediaLayout';
import { ShowreelMedia } from './Showreel';
import { Sheet } from '../../ui/Sheet';
import { Play } from 'lucide-react';
import { useFeatures } from '../../ui/features';
import { FeaturedWorkSection } from './WorkPortfolio';
import { Ban, Bookmark, Camera, ChevronDown, ChevronLeft, ChevronRight, List, Lock, MoreHorizontal, Settings, Share } from 'lucide-react';
import { mediaName } from '../../ui/a11y';
import { creditState, world, project as wproject, publicName } from '../../state/world';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import * as seed from '../../data/seed';
import type { Credit, Media, Person } from '../../data/types';
import { useStore } from '../../state/store';
import { availableLabel, org, person } from '../../state/selectors';
import { publicCreditsFor } from '../../domain/discovery';
import { Avatar, Button, FollowButton, EmptyState, HowItWorks, IconButton, Photo, PressCard, Pressable, SectionHeader, Verified } from '../../ui/primitives';
import { PostCard } from '../home/PostCard';
import { RoleRow } from '../discover/RoleRow';
import { displayTitle, scriptLang } from '../../ui/compose';
import { hasLearned, markLearned } from '../../ui/learned';
import { CreditSeal } from '../../ui/CreditSeal';
import { bentoLayout } from '../../ui/bento';
import { useHeroParallax } from '../../ui/useHeroParallax';
import { EventsSection } from '../event/eventUnits';
import { eventsOfHost, speakingAt } from '../../state/events';
import { ProfileReviewsSection } from '../reviews/ReviewsScreen';
import { ProfileDetails, ReelCard, WaysToBeFound, WorkLinks } from './profileUnits';
import { profileOf } from '../../state/profile';
import { craftProfile } from '../../data/profileSchema';

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

export function ProfileScreen({ id, isTab, active = true }: { id: string; isTab?: boolean; active?: boolean }) {
  const { isSaved, toggleSave } = useStore();
  const district = useFeatures().home === 'district';
  const { viewer, scenario, pop, push, availability, following, toggleFollow, openSheet, startConversation, userPosts, setHero, memberships, blocked, unblock, pendingCredits, acceptCredit, creditBusy, justAccepted, saved, acting, setActing, cannotReach, events, stack } = useStore();
  const p = person(id);
  const own = id === viewer.id;
  const heroKey = isTab ? `profile-${id}-tab` : `profile-${id}`;
  // Scroll depth is written straight to the hero's layers (src/ui/useHeroParallax.ts): no re-render per scroll event.
  const [overHero, setOverHero] = useState(true);
  const heroScroll = useHeroParallax(setOverHero);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const attachScroll = useCallback((el: HTMLDivElement | null) => { scrollRef.current = el; heroScroll(el); }, [heroScroll]);
  const [reelOpen, setReelOpen] = useState(false);
  const profileActive = isTab ? active && !stack.length : stack[stack.length - 1]?.name === 'profile';
  useEffect(() => { if (!profileActive) setReelOpen(false); }, [profileActive]);
  const nameRef = useNameFit(p?.name ?? '');
  // Explain once: read when this page opens (so the line stays for this visit), then remember it once it was shown.
  // The Profile tab stays mounted behind the others, so it counts only while it is the tab in view.
  const [creditsKnown] = useState(() => hasLearned(viewer.id, 'credits'));
  const showsCredits = active && !!p && (own || (p.visibility === 'public' && !cannotReach(id) && !blocked.includes(id)));
  useEffect(() => {
    if (showsCredits) markLearned(viewer.id, 'credits');
  }, [showsCredits, viewer.id]);

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
  const work = d.work;
  const reel = profileOf(id).reel;
  const stills = work;
  const bento = bentoLayout(stills.length);
  const posts = [...userPosts.filter((x) => x.authorId === id), ...seed.posts.filter((x) => x.authorId === id)];
  const collabs = seed.opportunities.filter((o) => o.authorId === id);
  const from = own ? (availability.open ? availability.from : null) : p.availableFrom ?? null;
  const isFollowing = following.includes(id);
  const backdrop = reel?.cover ?? work[0] ?? d.credits[0]?.media;
  // The hero is the person's work; the person themself is the portrait in the identity block below
  // (Person, Craft, Work, Credibility). With no work yet a neutral Art and Artist illustration stands in (the
  // photo would only repeat the portrait), never a broken image.
  const heroSrc = backdrop?.src ?? 'images/brand/entry/camera.jpg';
  const hero: Media = { id: `hero-${id}`, kind: 'image', src: heroSrc, fallback: backdrop?.fallback ?? heroSrc };

  const coverChoice = profileOf(id).profileCover;
  const portrait: Media | undefined = p.photo ? { id: `portrait-${id}`, kind: 'image', src: p.photo, contentType: 'portrait', width: 480, height: 600 } : undefined;
  const selectedCover = resolveProfileCover(coverChoice, work, eligibleFeaturedProjects(id), reel, portrait);
  const safeFraming = coverChoice?.framing !== 'immersive';
  const identityRegion = coverChoice?.identityRegion ?? 'lower';
  const scrollToWork = () => {
    const el = scrollRef.current;
    const sheet = el?.querySelector<HTMLElement>('.psheet');
    if (el && sheet) el.scrollTo({ top: sheet.offsetTop - 64, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };

  return (
    <div ref={attachScroll} className={`screen screen--hero canvas v-profile${district ? ' v-profile--immersive' : ''}`} data-scroll={isTab ? 'profile' : undefined}>
      {district && <div className="profile-compact-slot"><header className="profile-compact" aria-hidden={overHero} {...(overHero ? { inert: '' } as Record<string, string> : {})}>
        {!isTab && <IconButton label="Back" onClick={pop}><ChevronLeft size={24} /></IconButton>}
        <span>{p.name}</span><IconButton label={own ? 'Settings' : `More options for ${p.name}`} onClick={() => own ? push({ name: 'settings' }) : openSheet({ name: 'more', id })}>{own ? <Settings size={19} /> : <MoreHorizontal size={20} />}</IconButton>
      </header></div>}
      <div className={`phero${district && safeFraming ? ' phero--safe' : ''} phero--identity-${identityRegion}`} data-hero style={district ? { '--profile-position': profileCoverPosition(coverChoice, selectedCover.media), '--profile-fit': selectedCover.media && mediaType(selectedCover.media) === 'portrait' && mediaRatio(selectedCover.media) >= .7 ? 'cover' : 'contain' } as CSSProperties : undefined}>
        <div className="ohero-parallax" data-hero-photo>
          {district ? selectedCover.media ? <ProfileHeroMedia key={selectedCover.media.src} media={selectedCover.media} focal={coverChoice?.focal ?? selectedCover.media.focal} safe={safeFraming} className="phero-photo" alt={`Featured image of ${p.name}`} /> : <div className="profile-art-fallback" aria-hidden><span>ANA / CREATIVE INDUSTRY</span><i /><b>Made of stories.<br />Defined by work.</b></div> : <Photo media={hero} className="phero-photo" alt={p.name} />}
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
          {!own && !district && (
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
        {district && <div className="profile-intro">
          <header className="pid">
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
          {selectedCover.showreel && <button className="profile-play" onClick={() => setReelOpen(true)}><Play size={16} fill="currentColor" /> Play showreel</button>}
          <div className={`profile-actions${own ? ' profile-actions--self' : ''}`}>
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
        </div>}
        {district && <button className="profile-scroll-cue" onClick={scrollToWork}>Explore work <ChevronDown size={17} /></button>}
      </div>

      <div className="psheet">
        {/* Identity first: Person, Role, Location, Credibility, then Availability, then Actions, then Work.
            The role is said once, under the name (no craft eyebrow above it saying the same thing). */}
        {!district && <>        <header className="pid">
          <span className="pid-avatar">
            <Avatar party={p} size={96} />
          </span>
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
        </header></>}

        <ReelCard person={p} active={isTab ? active && !stack.length : stack[stack.length - 1]?.name === 'profile'} />


        {stills.length > 0 && (
          <section className="section section--flush">
            <SectionHeader title={district ? 'Selected work' : craftProfile(p.craft).work.images ?? 'Portfolio'} action={district && stills.length > 4 ? 'See all' : undefined} onAction={() => push({ name: 'media', items: stills, index: 0, what: 'Portfolio image', from: `by ${p.name}` })} />
            <div className={district ? `profile-work-grid profile-work-grid--${Math.min(stills.length, 2)}` : 'bento'}>
              {(district ? stills.slice(0, 4) : stills).map((m, i) => (
                <Pressable key={m.id + i} className={district ? 'profile-work-tile' : 'bento-tile'} style={district ? { aspectRatio: Math.max(.65, Math.min(2.4, mediaRatio(m))), '--media-fit': mediaType(m) === 'artwork' ? 'contain' : 'cover', '--media-position': mediaPosition(m) } as CSSProperties : undefined} data-span={bento[i].span} data-ratio={bento[i].ratio} onClick={() => push({ name: 'media', items: stills, index: i, what: 'Portfolio image', from: `by ${p.name}` })} scale={0.97} aria-label={mediaName(m, i, stills.length, 'Portfolio image', `by ${p.name}`)}>
                  <Photo media={m} />
                </Pressable>
              ))}
            </div>
          </section>
        )}

        <>{district && <FeaturedWorkSection personId={p.id} />}<WorkLinks person={p} /></>


        <section className="section section--flush">
          <SectionHeader title="Verified credits" />
          {/* V30: the trust layer, stated plainly. Credits come only from productions; people confirm them, never claim them.
              Explain once (docs/TEXT_LOAD.md): the line shows on the first profile a person opens; after that only
              "How credits work" stays, with the full explanation on request. */}
          <div className="meta evidence-note">
            {!creditsKnown && (
              <span>
                <Verified size={12} /> Issued by productions, confirmed by {own ? 'you' : p.name.split(' ')[0]}.
              </span>
            )}
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
                  {district && <p className="profile-credit-status"><Verified size={12} /> Production-confirmed credit</p>}
                </Pressable>
              ))}
            </div>
          ) : (
            <p className="meta">{own ? 'No verified credits yet. When a production credits you, you confirm it here.' : 'No verified credits yet.'}</p>
          )}
        </section>


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

        <ProfileReviewsSection id={p.id} />


        {(d.about || p.gear) && (
          <section className="section section--flush" data-profile-about>
            <SectionHeader title="About" />
            {d.about && <p className="body">{d.about}</p>}
            {p.gear && (
              <ul className="facts facts--tight facts--after">
                <Fact icon={<Camera size={20} />}>{p.gear}</Fact>
              </ul>
            )}
          </section>
        )}

        <ProfileDetails person={p} />

        {/* Availability: one quiet row under credibility. Your own is editable; someone else's shows only when open. */}
        {own ? (
          <Pressable className="pid-availability" onClick={() => openSheet({ name: 'availability' })} aria-label="Work preferences">
            {scenario.newUser ? (
              <span className="link link--underline">Add work preferences</span>
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

        {!district && <>        <div className="profile-actions">
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
        </div></>}

        {own && <WaysToBeFound person={p} />}

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


      </div>
      {district && <Sheet open={reelOpen} onClose={() => setReelOpen(false)} title="Showreel">{reelOpen && reel && <ShowreelMedia reel={reel} active={profileActive} startPlaying />}</Sheet>}
    </div>
  );
}
