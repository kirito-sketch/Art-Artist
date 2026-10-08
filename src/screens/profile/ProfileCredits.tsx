import { ChevronLeft } from 'lucide-react';
import { useEffect, useRef, type CSSProperties } from 'react';
import { cardRatio, CARD_LANDSCAPE } from '../../domain/mediaPresentation';
import { publicCreditsFor } from '../../domain/discovery';

import { org, person } from '../../state/selectors';
import { useStore } from '../../state/store';
import { project, publicName } from '../../state/world';
import { CreditSeal } from '../../ui/CreditSeal';
import { EmptyState, HowItWorks, IconButton, Photo, Pressable, SectionHeader, Verified } from '../../ui/primitives';

/** One card shape per set of credits: landscape when the artwork shown is landscape film stills. */
export const creditCardRatio = (credits: PublicCredit[]) => cardRatio(credits.map((c) => project(c.projectId)?.artwork));

export function profileCredits(id: string) {
  return [...publicCreditsFor(id)].sort((a, b) => (project(b.projectId)?.year ?? '').localeCompare(project(a.projectId)?.year ?? ''));
}
type PublicCredit = ReturnType<typeof profileCredits>[number];

/** The same public credit card is used in the shelf and the complete history, regardless of ownership. */
export function ProfileCreditCard({ credit, ratio }: { credit: PublicCredit; ratio: number }) {
  const { push, justAccepted } = useStore();
  const work = project(credit.projectId);
  if (!work) return null;
  const title = publicName(work);
  const issuer = work.houseId ? org(work.houseId) : undefined;
  return <Pressable className={`profile-credit-card${ratio === CARD_LANDSCAPE ? ' profile-credit-card--wide' : ''} ${justAccepted === credit.id ? 'profile-credit-card--sealing' : ''}`} data-credit={credit.id} scale={.98} onClick={() => push({ name: 'work', id: credit.projectId })} aria-label={`${title}, ${credit.line}, ${issuer?.name ?? 'Production'}, production-confirmed`}>
    <span className="profile-credit-image" style={{ aspectRatio: ratio } as CSSProperties}>
      {work.artwork ? <Photo media={work.artwork} surface="credit-card" frameRatio={ratio} showPlay={false} alt={`${title} project artwork`} /> : <span className="profile-credit-art">{title}</span>}
      {justAccepted === credit.id && <CreditSeal />}
    </span>
    <span className="profile-credit-copy"><strong>{title}</strong><span>{credit.line}</span><span className="profile-credit-issuer">{issuer?.name ?? 'Production'}{issuer?.verified && <Verified size={12} label="Verified production house" />}</span><small><Verified size={12} /> Production-confirmed</small></span>
  </Pressable>;
}

export function ProfileCreditsSection({ id }: { id: string }) {
  const { push, justAccepted, worldVersion } = useStore();
  void worldVersion;
  const credits = profileCredits(id);
  const shelf = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!justAccepted) return;
    const item = shelf.current?.querySelector<HTMLElement>('.profile-credit-card--sealing');
    if (item && shelf.current) shelf.current.scrollTo({ left: item.offsetLeft - shelf.current.offsetLeft, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }, [justAccepted]);
  if (!credits.length) return null;
  return <section className="section section--flush profile-credits-section"><SectionHeader title="Verified credits" action={credits.length > 1 ? 'See all' : undefined} onAction={() => push({ name: 'profileCredits', id })} />
    <div className="profile-credit-help"><HowItWorks label="How credits work">Only a production can issue a credit. The individual accepts or corrects it before it appears publicly on a shared project. No one can add their own verified credits.</HowItWorks></div>
    <div ref={shelf} className="profile-credit-shelf" role="region" aria-label="Verified credits. Scroll horizontally to browse." tabIndex={credits.length > 1 ? 0 : undefined} onKeyDown={e => {
      if (e.target !== e.currentTarget || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      e.preventDefault(); const item = shelf.current?.firstElementChild as HTMLElement | null;
      shelf.current?.scrollBy({ left: (e.key === 'ArrowRight' ? 1 : -1) * ((item?.offsetWidth ?? 180) + 12), behavior: 'smooth' });
    }}>{credits.slice(0, 6).map(c => <ProfileCreditCard key={c.id} credit={c} ratio={creditCardRatio(credits)} />)}</div>
  </section>;
}

export function ProfileCreditsScreen({ id }: { id: string }) {
  const { viewer, pop, blocked, cannotReach, worldVersion } = useStore();
  void worldVersion;
  const p = person(id);
  const allowed = p && (viewer.id === id || (p.visibility === 'public' && !blocked.includes(id) && !cannotReach(id)));
  const credits = allowed ? profileCredits(id) : [];
  return <div className="screen canvas profile-credit-history"><header className="topbar topbar--nav"><IconButton label="Back" onClick={pop}><ChevronLeft size={24} /></IconButton><h1 className="topbar-title">Verified credits</h1></header>
    {!allowed ? <EmptyState title="Profile unavailable" /> : <><p className="meta">{p.name} · {credits.length} verified {credits.length === 1 ? 'credit' : 'credits'}</p>{credits.length ? <div className="profile-credit-grid">{credits.map(c => <ProfileCreditCard key={c.id} credit={c} ratio={creditCardRatio(credits)} />)}</div> : <EmptyState title="No verified credits yet" />}</>}
  </div>;
}
