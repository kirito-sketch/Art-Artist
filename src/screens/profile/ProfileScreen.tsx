import { selectedWorkBento } from '../../domain/selectedWork';
import { PostGrid } from '../discover/PostGrid';
import { DIRECTION } from '../../ui/designDirection';
import { HeroIntro } from './HeroDirections';
import { LegacyProfileCredits } from './LegacyProfileCredits';
import { ProfileCreditsSection } from './ProfileCredits';
import { workPreferencesOf } from '../../state/workPreferences';
import { profilePortrait } from '../../domain/profilePortrait';
import { ProfileHeroMedia } from './ProfileHeroMedia';
import { eligibleFeaturedProjects } from '../../domain/featuredWork';
import { resolveProfileCover } from '../../domain/profileCover';
import { ShowreelMedia } from './Showreel';
import { Sheet } from '../../ui/Sheet';
import { Play } from 'lucide-react';
import { useFeatures } from '../../ui/features';
import { FeaturedWorkSection } from './WorkPortfolio';
import { Ban, Bookmark, Camera, Check, ChevronDown, ChevronLeft, List, Lock, MoreHorizontal, PenLine, Settings, Share } from 'lucide-react';
import { mediaName } from '../../ui/a11y';
import { creditState, world, project as wproject, publicName } from '../../state/world';
import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type RefObject } from 'react';
import * as seed from '../../data/seed';
import type { Credit, Media, Person } from '../../data/types';
import { useStore } from '../../state/store';
import { availableLabel, org, person } from '../../state/selectors';
import { publicCreditsFor } from '../../domain/discovery';
import { Avatar, Button, FollowButton, EmptyState, IconButton, Photo, PressCard, Pressable, SectionHeader, Verified } from '../../ui/primitives';
import { PostCard } from '../home/PostCard';
import { RoleRow } from '../discover/RoleRow';
import { displayTitle, scriptLang } from '../../ui/compose';
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


/** The bio, held to four lines with a More link when it runs longer (the full text stays in the document). */
function AboutText({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const [long, setLong] = useState(false);
  const ref = useRef<HTMLParagraphElement>(null);
  useLayoutEffect(() => {
    const el = ref.current;
    if (el && !open) setLong(el.scrollHeight > el.clientHeight + 2);
  }, [text, open]);
  return <>
    <p ref={ref} className={`body profile-about${open ? '' : ' profile-about--clamped'}`}>{text}</p>
    {long && <button className="link profile-about-more" aria-expanded={open} onClick={() => setOpen((o) => !o)}>{open ? 'Less' : 'More'}</button>}
  </>;
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
  const { viewer, pop, push, following, toggleFollow, openSheet, startConversation, userPosts, setHero, memberships, blocked, unblock, pendingCredits, acceptCredit, creditBusy, saved, acting, setActing, cannotReach, events, stack, profileVersion, userCollabs, showToast } = useStore();
  const p = person(id);
  const own = id === viewer.id;
  const heroKey = isTab ? `profile-${id}-tab` : `profile-${id}`;
  // Scroll depth is written straight to the hero's layers (src/ui/useHeroParallax.ts): no re-render per scroll event.
  const [overHero, setOverHero] = useState(true);
  const heroScroll = useHeroParallax(setOverHero);
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const attachScroll = useCallback((el: HTMLDivElement | null) => { scrollRef.current = el; heroScroll(el); }, [heroScroll]);
  const [reelOpen, setReelOpen] = useState(false);
  const profileActive = isTab ? active && !stack.length : stack[stack.length - 1]?.name === 'profile' && (stack[stack.length - 1] as { id: string }).id === id;
  useEffect(() => { if (!profileActive) setReelOpen(false); }, [profileActive]);
  const nameRef = useNameFit(p?.name ?? '');
  const showsCredits = active && !!p && (own || (p.visibility === 'public' && !cannotReach(id) && !blocked.includes(id)));
  const [subjectSafeBottom, setSubjectSafeBottom] = useState<number | undefined>();
  // Readability follows the actual identity block, including shorter phones and wrapped languages.
  useLayoutEffect(() => {
    const hero = scrollRef.current?.querySelector<HTMLElement>('.phero');
    const intro = hero?.querySelector<HTMLElement>('.profile-intro');
    if (!district || !hero || !intro) return;
    const update = () => {
      hero.style.setProperty('--identity-start', `${intro.offsetTop}px`);
      const play = intro.querySelector<HTMLElement>('.profile-play');
      const contentTop = play ? Math.min(intro.offsetTop, play.getBoundingClientRect().top - hero.getBoundingClientRect().top) : intro.offsetTop;
      setSubjectSafeBottom(contentTop - 12);
    };
    const observer = new ResizeObserver(update);
    observer.observe(hero); observer.observe(intro); update();
    return () => observer.disconnect();
  }, [id, district, showsCredits, profileVersion]);
  // While the photo sits under the status bar, the bar turns light.
  useEffect(() => {
    setHero(heroKey, overHero && p?.visibility !== 'private');
    return () => setHero(heroKey, false);
  }, [heroKey, overHero, setHero, p?.visibility]);
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
  const collabs = [...userCollabs, ...seed.opportunities].filter((o, i, all) => o.authorId === id && all.findIndex(x => x.id === o.id) === i);
  const preferences = workPreferencesOf(id);
  const isFollowing = following.includes(id);
  const backdrop = reel?.cover ?? work[0] ?? d.credits[0]?.media;
  const heroSrc = backdrop?.src ?? 'images/brand/entry/camera.jpg';
  const hero: Media = { id: `hero-${id}`, kind: 'image', src: heroSrc, fallback: backdrop?.fallback ?? heroSrc };

  const coverChoice = profileOf(id).profileCover;
  const portrait = profilePortrait(p);
  const selectedCover = resolveProfileCover(coverChoice, work, eligibleFeaturedProjects(id), reel, portrait);
  const identityRegion = coverChoice?.identityRegion === 'centre-lower' ? 'centre-lower' : 'lower';
  const scrollToWork = () => {
    const el = scrollRef.current;
    const sheet = el?.querySelector<HTMLElement>('.psheet');
    if (el && sheet) el.scrollTo({ top: sheet.offsetTop - 64, behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  };

  const shareProfile = async () => {
    if (id.startsWith('you-')) { showToast({ text: 'This prototype profile is only available in this session.' }); return; }
    const url = new URL(location.pathname, location.origin); url.searchParams.set('profile', id);
    if (navigator.share) {
      try { await navigator.share({ title: p.name, url: url.href }); return; }
      catch (error) { if (error instanceof DOMException && error.name === 'AbortError') return; }
    }
    openSheet({ name: 'share', label: p.name, url: url.href });
  };

  return (
    <div ref={attachScroll} className={`screen screen--hero canvas v-profile${district ? ' v-profile--immersive' : ''}${district && DIRECTION !== 'current' ? ` v-profile--dir dir-${DIRECTION}` : ''}${!isTab ? ' v-profile--pushed' : ''}`} data-scroll={isTab ? 'profile' : undefined}>
      {district && <div className="profile-compact-slot"><header className="profile-compact" aria-hidden={overHero} {...(overHero ? { inert: '' } as Record<string, string> : {})}>
        {!isTab && <IconButton label="Back" onClick={pop}><ChevronLeft size={24} /></IconButton>}
        <span>{p.name}</span>{DIRECTION === 'b' && !own && <button className={`cta cta--s ${isFollowing ? 'cta--quiet cta--on' : 'cta--solid'}`} aria-pressed={isFollowing} onClick={() => toggleFollow(id)}>{isFollowing ? 'Following' : 'Follow'}</button>}<IconButton label={own ? 'Settings' : `More options for ${p.name}`} onClick={() => own ? push({ name: 'settings' }) : openSheet({ name: 'more', id })}>{own ? <Settings size={19} /> : <MoreHorizontal size={20} />}</IconButton>
      </header></div>}
      <div className={`phero phero--identity-${identityRegion}`} data-hero>
        <div className="ohero-parallax" data-hero-photo>
          {district ? selectedCover.media ? <ProfileHeroMedia key={selectedCover.media.src} media={selectedCover.media} focal={coverChoice?.focal ?? selectedCover.media.focal} className="phero-photo" safeBottom={subjectSafeBottom} subjectHeight={coverChoice?.subjectHeight} alt={`Featured image of ${p.name}`} /> : <div className="profile-art-fallback" aria-hidden><span>ANA / CREATIVE INDUSTRY</span><i /><b>Made of stories.<br />Defined by work.</b></div> : <Photo media={hero} className="phero-photo" alt={p.name} />}
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
          <IconButton label={own ? 'Share your profile' : `Share ${p.name}`} className="icon-btn--float" onClick={shareProfile}>
            <Share size={18} />
          </IconButton>
          <IconButton label={own ? 'Settings' : `More options for ${p.name}`} className="icon-btn--float" onClick={() => (own ? push({ name: 'settings' }) : openSheet({ name: 'more', id }))}>
            {own ? <Settings size={19} /> : <MoreHorizontal size={20} />}
          </IconButton>
        </div>
        {district && DIRECTION !== 'current' && <div className="profile-intro profile-intro--dir">
          <HeroIntro
            dir={DIRECTION}
            facts={{
              name: p.name,
              verified: p.identityVerified,
              role: p.role,
              place: [p.city, ...(p.languages?.length ? [p.languages.slice(0, 2).join(', ')] : [])].join(' · '),
              facts: [`${credits.length} verified ${credits.length === 1 ? 'credit' : 'credits'}`, ...(p.years ? [`${p.years} years`] : [])],
              status: preferences.configured && preferences.open ? availableLabel(preferences.from) : undefined,
              lede: d.about?.split(/(?<=\.)\s/)[0],
              nameRef: nameRef as RefObject<HTMLHeadingElement>,
              nameSwitch: own && isTab && memberships.length > 0 ? { label: `${p.name}, switch identity`, onPress: () => openSheet({ name: 'identity' }) } : undefined,
            }}
            primary={own ? (
              <button className="cta cta--glass" onClick={() => push({ name: 'editProfile' })}>Edit profile</button>
            ) : (
              <button className={`cta ${isFollowing ? 'cta--glass cta--on' : 'cta--solid'}`} aria-pressed={isFollowing} onClick={() => toggleFollow(id)}>
                {isFollowing ? <><Check size={16} aria-hidden /> Following</> : 'Follow'}
              </button>
            )}
            secondary={own ? undefined : (
              <button className="cta cta--glass" onClick={() => { const cid = startConversation(id, { kind: 'project', label: 'Direct', detail: 'Direct message', refId: 'direct' }); cid && push({ name: 'conversation', id: cid }); }}>
                {acting !== 'self' ? `Message as ${org(acting).name}` : 'Message'}
              </button>
            )}
            onPlay={selectedCover.showreel ? () => setReelOpen(true) : undefined}
          />
        </div>}
        {district && DIRECTION === 'current' && <div className="profile-intro">
          <header className="pid">
          <h1 ref={nameRef as RefObject<HTMLHeadingElement>} className="large-title display-title display-title--name" {...displayTitle(p.name)}>
            {own && isTab && memberships.length > 0 ? <button className="profile-name-switch" onClick={() => openSheet({ name: 'identity' })} aria-label={`${p.name}, switch identity`}>
              {p.name}{p.identityVerified && <Verified size={22} label="Identity verified" />}<ChevronDown size={20} />
            </button> : <>{p.name}{p.identityVerified && <Verified size={22} label="Identity verified" />}</>}
          </h1>
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
          {/* Availability is what someone hiring checks first, so it sits with the identity, not at the bottom. */}
          {/* Your own availability is edited right here, in the availability sheet (Stage 6, C2). */}
          {own && isTab ? (
            <button className={`pid-available pid-available--edit${preferences.configured && preferences.open ? '' : ' is-off'}`} onClick={() => openSheet({ name: 'availability' })} aria-label={`Availability: ${preferences.configured ? (preferences.open ? availableLabel(preferences.from) : 'not taking work') : 'not set'}. Edit`}>
              {preferences.configured ? (preferences.open ? availableLabel(preferences.from) : 'Not taking work') : 'Set availability'}
              <PenLine size={13} aria-hidden />
            </button>
          ) : (
            preferences.configured && preferences.open && <p className="pid-available">{availableLabel(preferences.from)}</p>
          )}
        </header>
          {selectedCover.showreel && <button className="profile-play" onClick={() => setReelOpen(true)}><Play size={16} fill="currentColor" /> Play showreel</button>}
          <div className={`profile-actions${own ? ' profile-actions--self' : ''}`}>
          {own ? (
            <Button block variant="primary" onClick={() => push({ name: 'editProfile' })}>
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
        {district && DIRECTION === 'current' && <button className="profile-scroll-cue" onClick={scrollToWork}>Explore work <ChevronDown size={17} /></button>}
      </div>

      <div className="psheet">
        {district && own && pendingCredits.length > 0 && (
          <section className="section section--flush profile-pending" aria-label="Credits waiting for you">
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
                      <Button size="s" variant="signature" loading={creditBusy === c.id} onClick={() => acceptCredit(c.id)} aria-label={`Accept credit on ${c.title}`}>
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

        {/* Three acts, separated by a band: the work, who they are professionally, and what they do on Ana. */}
        {district && !reel && !stills.length && !credits.length && !d.projects.length && !posts.length && !d.about && (
          <div className="profile-empty">
            <p className="item-title">{own ? 'Your work goes here' : `${p.name.split(' ')[0]} hasn't added work yet`}</p>
            <p className="meta">{own ? 'Add a showreel or a few images. Verified credits appear once a production issues them and you accept.' : 'Verified credits appear here once a production issues them.'}</p>
            {own && <Button size="s" variant="secondary" onClick={() => push({ name: 'editProfile', section: 'portfolio' })}>Add work</Button>}
          </div>
        )}
        <div className="pgroup pgroup--work">
        <ReelCard person={p} active={profileActive} />


        {stills.length > 0 && (
          <section className="section section--flush profile-work-section">
            <SectionHeader title={district ? 'Selected work' : craftProfile(p.craft).work.images ?? 'Portfolio'} action={district && stills.length > 1 ? 'See all' : undefined} onAction={() => push({ name: 'media', items: stills, index: 0, what: 'Portfolio image', from: `by ${p.name}` })} />
            {district ? (() => {
              // A compact preview: at most five pieces in two rows, fixed patterns, no holes (src/domain/selectedWork.ts).
              const b = selectedWorkBento(stills);
              return <div className="work-bento" data-count={b.tiles.length} style={{ gridTemplateColumns: `repeat(${b.cols}, minmax(0, 1fr))`, '--cell-ratio': b.cellRatio, '--cols': b.cols } as CSSProperties}>
                {b.tiles.map((t, k) => {
                  const m = stills[t.index];
                  const last = k === b.tiles.length - 1 && b.more > 0;
                  return <Pressable key={m.id + t.index} className="work-bento-tile" style={{ gridColumn: `${t.col} / span ${t.colSpan}`, gridRow: `${t.row} / span ${t.rowSpan}` }} onClick={() => push({ name: 'media', items: stills, index: t.index, what: 'Portfolio image', from: `by ${p.name}` })} scale={0.97} aria-label={last ? `${mediaName(m, t.index, stills.length, 'Portfolio image', `by ${p.name}`)}. ${b.more} more` : mediaName(m, t.index, stills.length, 'Portfolio image', `by ${p.name}`)}>
                    <Photo media={m} surface="portfolio-thumbnail" showPlay={m.kind === 'video'} />
                    {last && <span className="work-bento-more" aria-hidden>+{b.more}</span>}
                  </Pressable>;
                })}
              </div>;
            })() : <div className="bento">
              {stills.map((m, i) => (
                <Pressable key={m.id + i} className="bento-tile" data-span={bento[i].span} data-ratio={bento[i].ratio} onClick={() => push({ name: 'media', items: stills, index: i, what: 'Portfolio image', from: `by ${p.name}` })} scale={0.97} aria-label={mediaName(m, i, stills.length, 'Portfolio image', `by ${p.name}`)}>
                  <Photo media={m} surface="portfolio-thumbnail" />
                </Pressable>
              ))}
            </div>}
          </section>
        )}

        {/* Legacy keeps links here. In the New version, production-confirmed credits come before self-declared work and links. */}
        {!district && <WorkLinks person={p} />}
        {district && <ProfileCreditsSection id={id} />}


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

        {!district && <LegacyProfileCredits credits={credits} person={p} own={own} />}


        {!district && posts.length > 0 && (
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

        <div className="pgroup pgroup--about">



        {(d.about || p.gear) && (
          <section className="section section--flush" data-profile-about>
            <SectionHeader title="About" />
            {d.about && (district ? <AboutText text={d.about} /> : <p className="body">{d.about}</p>)}
            {p.gear && (
              <ul className="facts facts--tight facts--after">
                <Fact icon={<Camera size={20} />}>{p.gear}</Fact>
              </ul>
            )}
          </section>
        )}

        <ProfileDetails person={p} />

        {/* One place for outside work and links, after who they are. */}
        {district && <FeaturedWorkSection personId={p.id} links={profileOf(id).links} />}

        {preferences.configured && (!district || !preferences.open || preferences.scope || preferences.travel) && <section className="section section--flush profile-preferences"><div className="section-head"><h2>Work preferences</h2>{own && <button className="section-all" aria-label="Edit work preferences" onClick={() => openSheet({ name: 'availability' })}>Edit</button>}</div>
          <dl className="pf-details">
            {/* Open to work is already under the name on the immersive profile. */}
            {(!district || !preferences.open) && <div className="pf-pair"><dt>Professional availability</dt><dd>{preferences.open ? availableLabel(preferences.from) : 'Not taking work'}</dd></div>}
            {preferences.scope && <div className="pf-pair"><dt>Where</dt><dd>{preferences.scope.replace(/\s*·\s*will travel/i, '')}</dd></div>}
            {preferences.travel && <div className="pf-pair"><dt>Travel</dt><dd>Open to travel</dd></div>}
          </dl>
        </section>}

        </div>

        <div className="pgroup pgroup--activity">
        {district && posts.length > 0 && (
          <section className="section section--flush profile-posts">
            <SectionHeader title={`Posts · ${posts.length}`} action={posts.length > 6 ? 'See all' : undefined} onAction={() => push({ name: 'posts', ids: posts.map((x) => x.id), index: 0 })} />
            <PostGrid posts={posts.slice(0, 6)} onOpen={(i) => push({ name: 'posts', ids: posts.map((x) => x.id), index: i })} />
          </section>
        )}
        <ProfileReviewsSection id={p.id} />

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

        {/* Events: what they're hosting (their own under-review ones only to them) and where they're speaking. */}
        <EventsSection title="Hosting" list={eventsOfHost(events, p.id, Date.now())} />
        <EventsSection title="Speaking at" list={speakingAt(events, p.id, Date.now())} />

        {collabs.length > 0 && (
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
        {own && <details className="profile-management"><summary><span>Manage your profile</span><small>Only you · private tools{pendingCredits.length ? ` · ${pendingCredits.length} pending ${pendingCredits.length === 1 ? 'credit' : 'credits'}` : ''}</small></summary><div className="profile-management-body">
          <Button size="s" variant="secondary" onClick={() => push({ name: 'editProfile' })}>Edit profile</Button>
          {!credits.length && <p className="meta">Verified credits come from productions. You can accept or dispute a credit issued to you; you cannot create your own.</p>}
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

          <EventsSection title="Events you manage" list={eventsOfHost(events, p.id, Date.now(), viewer.id, 'self').filter(e => !eventsOfHost(events, p.id, Date.now()).some(publicEvent => publicEvent.id === e.id))} />
        </div></details>}



      </div>
      {district && DIRECTION === 'current' && !own && (
        <div className="profile-bar" data-visible={!overHero} aria-hidden={overHero} {...(overHero ? { inert: '' } as Record<string, string> : {})}>
          <FollowButton block size="m" primary on={isFollowing} onToggle={() => toggleFollow(id)} name={p.name} />
          <Button block variant="secondary" onClick={() => { const cid = startConversation(id, { kind: 'project', label: 'Direct', detail: 'Direct message', refId: 'direct' }); cid && push({ name: 'conversation', id: cid }); }}>
            {acting !== 'self' ? `Message as ${org(acting).name}` : 'Message'}
          </Button>
        </div>
      )}
      {district && <Sheet open={reelOpen} onClose={() => setReelOpen(false)} title="Showreel">{reelOpen && reel && <ShowreelMedia reel={reel} active={profileActive} startPlaying />}</Sheet>}
    </div>
  );
}
