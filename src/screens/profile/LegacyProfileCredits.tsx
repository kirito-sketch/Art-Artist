import type { Credit, Person } from '../../data/types';
import { org } from '../../state/selectors';
import { useStore } from '../../state/store';
import { world } from '../../state/world';
import { CreditSeal } from '../../ui/CreditSeal';
import { HowItWorks, Photo, Pressable, SectionHeader, Verified } from '../../ui/primitives';

/** Explicit legacy comparison presentation. Never rendered by the default immersive profile. */
export function LegacyProfileCredits({ credits, person: p, own }: { credits: Credit[]; person: Person; own: boolean }) {
  const { push, justAccepted } = useStore();
  return (
        <section className="section section--flush">
          <SectionHeader title="Verified credits" />
          <div className="meta evidence-note">
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
  );
}
