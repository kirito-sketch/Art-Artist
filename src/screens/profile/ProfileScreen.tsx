import { AnimatePresence, motion } from 'framer-motion';
import { BadgeCheck, Bookmark, ChevronLeft, FileText, Flag, Handshake, Languages, Lock, MessageCircle, MoreHorizontal, PenLine, Settings, Share, ShieldCheck, UserCheck, UserPlus } from 'lucide-react';
import { useState } from 'react';
import * as seed from '../../data/seed';
import type { Credit, Media, Opportunity, Person } from '../../data/types';
import { useStore } from '../../state/store';
import { availableLabel, findOpportunity, org, person } from '../../state/selectors';
import { stagger } from '../../ui/motion';
import { Avatar, Button, Chip, EmptyState, IconButton, Pressable, Segmented, Verified } from '../../ui/primitives';
import { Still } from '../../ui/Still';
import { OppRow } from '../discover/DiscoverScreen';
import { PostCard } from '../home/PostCard';

type Tab = 'overview' | 'credits' | 'work' | 'posts';

/** Other people's credits and work are derived from real activity, never invented for the profile. */
function derive(p: Person) {
  const events = Object.values(seed.networkEvents).flat().filter((e) => e.actorIds.includes(p.id));
  const credits: Credit[] =
    seed.credits[p.id] ??
    events
      .filter((e) => e.kind === 'credit')
      .map((e) => ({ id: e.id, title: e.title!, year: '2025', role: e.detail!, department: '', orgId: e.orgId!, format: 'Feature film', status: 'Released' as const, media: e.media?.[0] ?? seed.portfolio.kiran[1] }));
  const portfolio: Media[] = seed.portfolio[p.id] ?? events.flatMap((e) => (e.kind !== 'credit' ? e.media ?? [] : []));
  return { credits, portfolio, projects: seed.projects[p.id] ?? [], about: seed.about[p.id] };
}

export function ProfileScreen({ id, isTab }: { id: string; isTab?: boolean }) {
  const store = useStore();
  const { viewer, pop, push, availability, following, toggleFollow, openSheet, startConversation, userPosts, userCollabs, userPortfolio, showToast } = store;
  const p = person(id);
  const own = id === viewer.id;
  const [tab, setTab] = useState<Tab>('overview');

  if (!p) return <EmptyState title="Profile unavailable" />;

  if (!own && p.visibility !== 'public') {
    return (
      <div className="screen-scroll">
        <div className="detail-topbar detail-topbar--plain">
          <IconButton label="Back" className="icon-btn--glass" onClick={pop}>
            <ChevronLeft size={22} />
          </IconButton>
        </div>
        <div className="private-profile">
          <Avatar party={p} size={84} />
          <h1 className="profile-name">{p.name}</h1>
          <p className="profile-role">{p.role}</p>
          <EmptyState
            icon={<Lock />}
            title={p.visibility === 'removed' ? 'This profile is no longer on Ana' : 'This profile is private'}
            body={p.visibility === 'removed' ? 'Earlier conversations stay in your Inbox as read-only.' : `${p.name.split(' ')[0]} shares their profile only with productions they respond to.`}
          />
        </div>
      </div>
    );
  }

  const d = derive(p);
  const portfolio = own ? [...userPortfolio, ...d.portfolio] : d.portfolio;
  const reel = portfolio.find((m) => m.kind === 'video');
  const collabs: Opportunity[] = [
    ...(own ? userCollabs : []),
    ...seed.opportunities.filter((o) => o.authorId === id),
  ];
  const posts = [...userPosts.filter((x) => x.authorId === id), ...seed.posts.filter((x) => x.authorId === id)];
  const openToWork = own ? availability.open : !!p.availableFrom;
  const isFollowing = following.includes(id);

  return (
    <div className="screen-scroll" data-scroll={isTab ? 'profile' : undefined}>
      <div className="profile-cover">
        <Still media={reel ?? portfolio[0] ?? seed.cameraRoll[6]} showPlay={false} className="profile-cover-media" />
        <div className="profile-cover-scrim" />
      </div>
      <div className="detail-topbar">
        {!isTab && (
          <IconButton label="Back" className="icon-btn--glass" onClick={pop}>
            <ChevronLeft size={22} />
          </IconButton>
        )}
        <span className="flex-spacer" />
        <IconButton label="Share profile" className="icon-btn--glass" onClick={() => showToast({ text: 'Profile link copied' })}>
          <Share size={17} />
        </IconButton>
        <IconButton label={own ? 'Settings' : 'More'} className="icon-btn--glass" onClick={() => showToast({ text: own ? 'Settings: privacy, visibility, account' : 'Options: share, report, block' })}>
          {own ? <Settings size={17} /> : <MoreHorizontal size={18} />}
        </IconButton>
      </div>

      <section className="profile-id">
        <motion.div {...stagger(0)}>
          <Avatar party={p} size={88} ring={openToWork ? 'available' : undefined} />
        </motion.div>
        <motion.h1 className="profile-name" {...stagger(1)}>
          {p.name}
        </motion.h1>
        <motion.p className="profile-role" {...stagger(2)}>
          {p.role} · {p.city}
        </motion.p>
        <motion.div className="profile-chips" {...stagger(3)}>
          {p.years && <Chip>{p.years} yrs experience</Chip>}
          {p.languages && <Chip icon={<Languages size={12} />}>{p.languages.join(', ')}</Chip>}
          {p.identityVerified && <Chip icon={<ShieldCheck size={12} />}>ID verified</Chip>}
        </motion.div>

        {openToWork && (
          <motion.button className="profile-avail" {...stagger(4)} onClick={() => own && openSheet({ name: 'availability' })} disabled={!own}>
            <span className="status-dot" />
            <span>
              <b>{availableLabel(own ? availability.from : p.availableFrom!)}</b>
              <span className="muted"> · {own ? availability.scope : p.city}</span>
            </span>
            {own && <PenLine size={14} className="muted" />}
          </motion.button>
        )}

        <motion.div className="profile-actions" {...stagger(5)}>
          {own ? (
            <>
              <Button variant="light" size="m" icon={<PenLine size={15} />} onClick={() => showToast({ text: 'Edit profile' })}>
                Edit profile
              </Button>
              <Button variant="secondary" size="m" icon={<Share size={15} />} onClick={() => showToast({ text: 'Profile link copied' })}>
                Share
              </Button>
            </>
          ) : (
            <>
              <Button variant={isFollowing ? 'secondary' : 'light'} size="m" icon={isFollowing ? <UserCheck size={15} /> : <UserPlus size={15} />} onClick={() => toggleFollow(id)}>
                {isFollowing ? 'Following' : 'Follow'}
              </Button>
              <Button
                variant="secondary"
                size="m"
                icon={<MessageCircle size={15} />}
                onClick={() => {
                  const cid = startConversation(id, { kind: 'project', label: 'Direct', detail: `${p.role} · via profile`, refId: `profile-${id}` });
                  push({ name: 'conversation', id: cid });
                }}
              >
                Message
              </Button>
            </>
          )}
        </motion.div>

        <motion.div className="cred-strip" {...stagger(6)}>
          <button onClick={() => setTab('credits')}>
            <b>{d.credits.length}</b>
            <span>
              Verified credits <BadgeCheck size={12} className="verified-inline" />
            </span>
          </button>
          <button onClick={() => setTab('work')}>
            <b>{portfolio.length}</b>
            <span>Portfolio</span>
          </button>
          <button onClick={() => setTab('work')}>
            <b>{d.projects.length}</b>
            <span>Projects</span>
          </button>
        </motion.div>
      </section>

      {own && <OnlyYou />}

      <div className="profile-tabs">
        <Segmented
          id="profile"
          value={tab}
          onChange={setTab}
          options={[
            { value: 'overview', label: 'Overview' },
            { value: 'credits', label: 'Credits' },
            { value: 'work', label: 'Work' },
            { value: 'posts', label: 'Posts' },
          ]}
        />
      </div>

      <AnimatePresence mode="wait">
        <motion.div key={tab} className="profile-body" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -4 }} transition={{ duration: 0.18 }}>
          {tab === 'overview' && (
            <>
              {reel && (
                <Pressable className="reel" onClick={() => push({ name: 'media', items: [reel], index: 0 })} scale={0.985}>
                  <Still media={reel} />
                  <span className="reel-label">{reel.caption ?? 'Showreel'}</span>
                </Pressable>
              )}
              {d.about && (
                <section className="profile-section">
                  <h2>About</h2>
                  <p className="profile-about">{d.about}</p>
                </section>
              )}
              <section className="profile-section">
                <h2>Credits</h2>
                <CreditList credits={d.credits.slice(0, 3)} own={own} name={p.name.split(' ')[0]} />
                {d.credits.length > 3 && (
                  <button className="link-btn link-btn--block" onClick={() => setTab('credits')}>
                    All {d.credits.length} credits
                  </button>
                )}
              </section>
              {collabs.length > 0 && (
                <section className="profile-section">
                  <h2>Collaborations</h2>
                  <div className="row-list">
                    {collabs.map((o, i) => (
                      <OppRow key={o.id} o={o} index={i} />
                    ))}
                  </div>
                </section>
              )}
            </>
          )}
          {tab === 'credits' && (
            <section className="profile-section">
              <p className="profile-explain">
                <BadgeCheck size={14} /> Credits are issued by the production house. {own ? 'Missing one? Ask the production to add you.' : ''}
              </p>
              <CreditList credits={d.credits} own={own} name={p.name.split(' ')[0]} />
            </section>
          )}
          {tab === 'work' && (
            <>
              <section className="profile-section">
                <h2>Portfolio</h2>
                {portfolio.length ? (
                  <div className="portfolio-grid">
                    {portfolio.map((m, i) => (
                      <Pressable key={m.id + i} className={`portfolio-item ${i === 0 && m.kind === 'video' ? 'portfolio-item--wide' : ''}`} onClick={() => push({ name: 'media', items: portfolio, index: i })} scale={0.97}>
                        <Still media={m} />
                      </Pressable>
                    ))}
                  </div>
                ) : (
                  <EmptyState title="No work added yet" body={own ? 'Add stills and reels from Create, with "Also add to portfolio" on.' : undefined} />
                )}
              </section>
              <section className="profile-section">
                <h2>Projects</h2>
                <p className="profile-explain">Self-described work that isn't credited on Ana, such as independent shorts and music videos.</p>
                {d.projects.length ? (
                  d.projects.map((pr) => (
                    <div key={pr.id} className="project-row">
                      <Still media={pr.media} className="project-thumb" showPlay={false} />
                      <div>
                        <p className="project-title">{pr.title}</p>
                        <p className="project-meta">
                          {pr.role} · {pr.format} · {pr.year}
                        </p>
                        <p className="project-note">{pr.note}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <EmptyState title="No projects yet" />
                )}
              </section>
            </>
          )}
          {tab === 'posts' && (
            <section className="profile-section">
              {posts.length ? <div className="post-list">{posts.map((x) => <PostCard key={x.id} post={x} />)}</div> : <EmptyState icon={<FileText />} title="No posts yet" />}
            </section>
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

function CreditList({ credits, own, name }: { credits: Credit[]; own: boolean; name: string }) {
  const { openSheet } = useStore();
  if (!credits.length)
    return <EmptyState icon={<BadgeCheck />} title="No verified credits yet" body={own ? 'When a production house credits you on Ana, it appears here automatically.' : `${name} hasn't been credited by a production on Ana yet.`} />;
  return (
    <div className="credit-list">
      {credits.map((c, i) => (
        <motion.div key={c.id} className="credit" {...stagger(i, 0.03)}>
          <Still media={c.media} className="credit-poster" showPlay={false} />
          <div className="credit-text">
            <p className="credit-title">{c.title}</p>
            <p className="credit-role">{c.role}</p>
            <p className="credit-meta">
              {c.format} · {c.year}
              {c.status !== 'Released' && <span className="credit-status">{c.status}</span>}
            </p>
            <p className="credit-issuer">
              <Verified size={11} label="Verified credit" /> Issued by {org(c.orgId).name}
            </p>
          </div>
          {own && (
            <button className="credit-report" aria-label={`Report ${c.title}`} onClick={() => openSheet({ name: 'reportCredit', title: c.title })}>
              <Flag size={14} />
            </button>
          )}
        </motion.div>
      ))}
    </div>
  );
}

/** Private workspace on your own profile: saved items, what you've sent, what you've posted. */
function OnlyYou() {
  const { saved, responses, interestsSent, userCollabs, viewer, openSheet, interestsReceived } = useStore();
  const [open, setOpen] = useState<'saved' | 'responses' | 'collabs' | null>(null);
  const savedOpps = saved.map((id) => findOpportunity(id, userCollabs)).filter(Boolean) as Opportunity[];
  const sentIds = [...Object.keys(responses), ...Object.keys(interestsSent)];
  const sent = sentIds.map((id) => findOpportunity(id, userCollabs)).filter(Boolean) as Opportunity[];
  const mine = [...userCollabs, ...seed.opportunities.filter((o) => o.authorId === viewer.id)];

  const tiles = [
    { id: 'saved' as const, icon: <Bookmark size={15} />, label: 'Saved', n: savedOpps.length },
    { id: 'responses' as const, icon: <FileText size={15} />, label: 'My responses', n: sent.length },
    { id: 'collabs' as const, icon: <Handshake size={15} />, label: 'My collabs', n: mine.length },
  ];

  return (
    <section className="only-you">
      <p className="only-you-label">
        <Lock size={11} /> Only you see this
      </p>
      <div className="only-you-tiles">
        {tiles.map((t) => (
          <Pressable key={t.id} className={`only-tile ${open === t.id ? 'is-on' : ''}`} onClick={() => setOpen(open === t.id ? null : t.id)} scale={0.95}>
            {t.icon}
            <b>{t.n}</b>
            <span>{t.label}</span>
          </Pressable>
        ))}
      </div>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div className="only-you-panel" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
            <div className="row-list">
              {open === 'saved' && (savedOpps.length ? savedOpps.map((o, i) => <OppRow key={o.id} o={o} index={i} />) : <p className="hint">Tap the bookmark on any role to keep it here.</p>)}
              {open === 'responses' &&
                (sent.length ? (
                  <>
                    {sent.map((o, i) => (
                      <OppRow key={o.id} o={o} index={i} />
                    ))}
                    <p className="hint">A record of what you sent. Productions contact you in Inbox if they want to proceed.</p>
                  </>
                ) : (
                  <p className="hint">Roles you respond to and collaborations you show interest in are recorded here.</p>
                ))}
              {open === 'collabs' && (
                <>
                  {mine.map((o, i) => (
                    <OppRow key={o.id} o={o} index={i} />
                  ))}
                  {interestsReceived.length > 0 && (
                    <Button variant="secondary" size="s" onClick={() => openSheet({ name: 'reviewInterest' })}>
                      Review {interestsReceived.length} interested
                    </Button>
                  )}
                </>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
