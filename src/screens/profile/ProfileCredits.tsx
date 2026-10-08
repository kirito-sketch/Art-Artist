import { ChevronLeft } from 'lucide-react';
import { useEffect, useRef } from 'react';
import { publicCreditsFor } from '../../domain/discovery';

import { org, person } from '../../state/selectors';
import { useStore } from '../../state/store';
import { project, publicName } from '../../state/world';
import { CreditSeal } from '../../ui/CreditSeal';
import { EmptyState, HowItWorks, IconButton, SectionHeader } from '../../ui/primitives';
import { PosterCard } from '../../ui/PosterCard';

export function profileCredits(id: string) {
  return [...publicCreditsFor(id)].sort((a, b) => (project(b.projectId)?.year ?? '').localeCompare(project(a.projectId)?.year ?? ''));
}
type PublicCredit = ReturnType<typeof profileCredits>[number];

/** One public credit as a 2:3 poster (src/ui/PosterCard.tsx), the same in the shelf and the full history. */
export function ProfileCreditCard({ credit }: { credit: PublicCredit }) {
  const { push, justAccepted } = useStore();
  const work = project(credit.projectId);
  if (!work) return null;
  const title = publicName(work);
  const issuer = work.houseId ? org(work.houseId) : undefined;
  const sealing = justAccepted === credit.id;
  return <span className="profile-credit-card" data-credit={credit.id}>
    <PosterCard projectId={work.id} title={title} year={work.year} line={credit.line} production={issuer?.name ?? 'Production'} productionVerified={issuer?.verified} confirmed sealing={sealing} seal={sealing ? <CreditSeal /> : undefined}
      onPress={() => push({ name: 'work', id: credit.projectId })} label={`${title}${work.year ? `, ${work.year}` : ''}, ${credit.line}, ${issuer?.name ?? 'Production'}, production-confirmed`} />
  </span>;
}

export function ProfileCreditsSection({ id }: { id: string }) {
  const { push, justAccepted, worldVersion } = useStore();
  void worldVersion;
  const credits = profileCredits(id);
  const shelf = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!justAccepted) return;
    const item = shelf.current?.querySelector<HTMLElement>('.poster-card--sealing')?.closest<HTMLElement>('.profile-credit-card');
    if (item && shelf.current) shelf.current.scrollTo({ left: item.offsetLeft - shelf.current.offsetLeft, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
  }, [justAccepted]);
  if (!credits.length) return null;
  return <section className="section section--flush profile-credits-section"><SectionHeader title={`Verified credits · ${credits.length}`} action={credits.length > 1 ? 'See all' : undefined} onAction={() => push({ name: 'profileCredits', id })} />
    <div className="profile-credit-help"><HowItWorks label="How credits work">Only a production can issue a credit. The individual accepts or corrects it before it appears publicly on a shared project. No one can add their own verified credits.</HowItWorks></div>
    <div ref={shelf} className="profile-credit-shelf" role="region" aria-label="Verified credits. Scroll horizontally to browse." tabIndex={credits.length > 1 ? 0 : undefined} onKeyDown={e => {
      if (e.target !== e.currentTarget || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
      e.preventDefault(); const item = shelf.current?.firstElementChild as HTMLElement | null;
      shelf.current?.scrollBy({ left: (e.key === 'ArrowRight' ? 1 : -1) * ((item?.offsetWidth ?? 180) + 12), behavior: 'smooth' });
    }}>{credits.slice(0, 6).map(c => <ProfileCreditCard key={c.id} credit={c} />)}</div>
  </section>;
}

export function ProfileCreditsScreen({ id }: { id: string }) {
  const { viewer, pop, blocked, cannotReach, worldVersion } = useStore();
  void worldVersion;
  const p = person(id);
  const allowed = p && (viewer.id === id || (p.visibility === 'public' && !blocked.includes(id) && !cannotReach(id)));
  const credits = allowed ? profileCredits(id) : [];
  return <div className="screen canvas profile-credit-history"><header className="topbar topbar--nav"><IconButton label="Back" onClick={pop}><ChevronLeft size={24} /></IconButton><h1 className="topbar-title">Verified credits</h1></header>
    {!allowed ? <EmptyState title="Profile unavailable" /> : <><p className="meta">{p.name} · {credits.length} verified {credits.length === 1 ? 'credit' : 'credits'}</p>{credits.length ? <div className="profile-credit-grid">{credits.map(c => <ProfileCreditCard key={c.id} credit={c} />)}</div> : <EmptyState title="No verified credits yet" />}</>}
  </div>;
}
