import { useEffect, useState } from 'react';
import { ArrowUpRight, ChevronRight, X } from 'lucide-react';
import { appLink, ARCHIVE, FLOWS, HOUSE_STATES, PERSONAS, STATUS, TEST_STATES } from '../dev/studioData';
import { SCENARIOS } from '../qa/scenarios';
import { effective, isSettled } from '../qa/status';
import lastRun from '../qa/last-run.json';
import './studio.css';

/*
 * Studio (/studio): everything for reviewing and testing Art and Artist, kept off the app itself. Each item
 * is a link that opens the app in that state (docs/STUDIO.md). Behind the shared password like the app.
 */
const P0_REMAINING = SCENARIOS.filter((s) => s.priority === 'P0' && !isSettled(effective(s, lastRun.results as never).status)).length;

function Item({ href, title, hint, external }: { href: string; title: string; hint?: string; external?: boolean }) {
  return (
    <a className="st-item" href={href} target={external ? '_blank' : undefined} rel={external ? 'noreferrer' : undefined}>
      <span className="st-item-text">
        <span className="st-item-title">{title}</span>
        {hint && <span className="st-item-hint">{hint}</span>}
      </span>
      {external ? <ArrowUpRight size={16} aria-hidden /> : <ChevronRight size={16} aria-hidden />}
    </a>
  );
}

function Section({ id, title, intro, children }: { id: string; title: string; intro?: string; children: React.ReactNode }) {
  return (
    <section className="st-section" aria-labelledby={`st-${id}`}>
      <h2 id={`st-${id}`} className="st-h2">
        {title}
      </h2>
      {intro && <p className="st-intro">{intro}</p>}
      {children}
    </section>
  );
}

export function Studio() {
  const [shot, setShot] = useState<{ src: string; alt: string } | null>(null);
  useEffect(() => {
    document.title = 'Art and Artist Studio';
  }, []);
  useEffect(() => {
    if (!shot) return;
    const k = (e: KeyboardEvent) => e.key === 'Escape' && setShot(null);
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [shot]);

  return (
    <div className="st">
      <header className="st-head">
        <div>
          <p className="st-eyebrow">Art and Artist</p>
          <h1 className="st-h1">Studio</h1>
          <p className="st-lede">Open the app as anyone, in any state. Every link starts fresh; reload it to start again.</p>
        </div>
        <a className="st-open" href="/">
          Open the app
        </a>
      </header>

      <Section id="compare" title="Compare">
        <div className="st-list">
          <Item href="/studio/compare" title="New Home and Legacy Home" hint="New Home is the product default. Keep Legacy Home for regression comparison." />
        </div>
      </Section>

      <Section id="as" title="Explore as">
        <div className="st-grid st-grid--4">
          {PERSONAS.map((p) => (
            <a key={p.id} className="st-card" href={appLink({ as: p.id })}>
              <span className="st-card-kind">{p.group}</span>
              <span className="st-card-title">{p.name}</span>
              <span className="st-card-hint">{p.sub}</span>
            </a>
          ))}
        </div>
        <div className="st-row-links">
          <span className="st-item-hint">Home:</span>
          <a href={appLink({ as: 'kiran' })}>New Home (default)</a>
          <a href={appLink({ as: 'kiran', home: 'legacy' })}>Legacy Home</a>
          <span className="st-item-hint">· View:</span>
          <a href={appLink({ view: 'app' })}>App mode (full screen)</a>
        </div>
      </Section>

      <Section id="flows" title="Flows">
        <div className="st-list">
          {FLOWS.map((f) => (
            <Item key={f.id} href={appLink({ flow: f.id })} title={f.label} hint={f.hint} />
          ))}
        </div>
      </Section>

      <Section id="states" title="Test states" intro="Failure and edge states, opened as Kiran (or as Aditi for Konark for the house states). A notice above the phone says when one is on.">
        <div className="st-list st-list--2">
          {TEST_STATES.map((t) => (
            <Item key={t.key} href={appLink({ as: 'kiran', state: [t.key] })} title={t.label} hint={t.hint} />
          ))}
          {HOUSE_STATES.map((t) => (
            <Item key={t.key} href={appLink({ as: 'konark', state: [t.key] })} title={t.label} hint={t.hint} />
          ))}
        </div>
      </Section>

      <Section id="approved" title="Glass navigation and post notch" intro="Both are the default. The links below show the review samples and the previous versions for comparison.">
        <div className="st-list st-list--2">
          <Item href="/?samples" title="Post notch review samples" hint="Ratios, video states, failure, long caption" />
          <Item href="/?nav=off&actions=pill" title="Previous navigation and post actions" hint="?nav=off · ?actions=pill, for comparison only" />
        </div>
      </Section>

      <Section id="tools" title="Testing and research">
        <div className="st-list st-list--2">
          <Item href="/?lab" title="Edge Case Lab" hint={`Scenarios and automated checks · P0 remaining: ${P0_REMAINING}`} />
          <Item href="/test" title="Participant test" hint="/test · the unmoderated study, public link" external />
          <Item href="/research" title="Research dashboard" hint="/research · sessions, findings, study health" external />
          <Item href="/?research" title="Moderated research session" hint="As Aditi for Konark, clean every load · Shift+E exits" />
          <Item href="/?admin" title="Moderation console" hint="Internal tool for Art and Artist staff" />
          <Item href="/?motion" title="Motion review" hint="Every interaction, side by side" />
          <Item href="/?specimen" title="Type and component specimen" hint="Tokens, type, components" />
        </div>
      </Section>

      <Section id="archive" title="Archive" intro="Earlier directions, kept as screenshots for comparison. Their code was removed in October 2026; git history has it.">
        <div className="st-archive">
          {ARCHIVE.map((a) => (
            <article key={a.title} className="st-arch">
              <h3 className="st-h3">{a.title}</h3>
              <p className="st-item-hint">{a.note}</p>
              <div className="st-shots">
                {a.shots.map((s) => (
                  <button key={s.src} className="st-shot" onClick={() => setShot(s)} aria-label={`Enlarge: ${s.alt}`}>
                    <img src={`/studio/archive/${s.src}.jpg`} alt={s.alt} loading="lazy" />
                  </button>
                ))}
              </div>
            </article>
          ))}
        </div>
      </Section>

      <Section id="status" title="Product status">
        <div className="st-grid st-grid--3">
          {(
            [
              ['Decided', STATUS.decided],
              ['Being validated', STATUS.validating],
              ['Deferred', STATUS.deferred],
            ] as const
          ).map(([h, list]) => (
            <div key={h} className="st-status">
              <h3 className="st-h3">{h}</h3>
              <ul>
                {list.map((x) => (
                  <li key={x}>{x}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <p className="st-note" role="note">
          Legal and policy copy (Before you join, Terms, Privacy, guidelines, house authority, policy update, Your data) is placeholder: draft for legal review.
        </p>
      </Section>

      {shot && (
        <div className="st-viewer" role="dialog" aria-modal="true" aria-label={shot.alt} onClick={() => setShot(null)}>
          <img src={`/studio/archive/${shot.src}.jpg`} alt={shot.alt} />
          <button className="st-viewer-close" onClick={() => setShot(null)} aria-label="Close">
            <X size={20} />
          </button>
        </div>
      )}
    </div>
  );
}
