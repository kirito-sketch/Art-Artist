import { ChevronLeft } from 'lucide-react';
import { useState } from 'react';
import { DraftTag } from '../../legal/docs';
import { useStore } from '../../state/store';
import { org } from '../../state/selectors';
import { Button, IconButton, Row } from '../../ui/primitives';

/**
 * Your data: agreements you've made, download, and account deletion.
 * Deletion must not destroy other people's professional records. The retention rules below are a
 * product proposal marked for legal review (DECISIONS / FOUNDATION §6), not final policy.
 */
export function YourData({ start }: { start?: 'delete' } = {}) {
  const { pop, consents, showToast, memberships, startEntry } = useStore();
  // Settings › Delete account opens straight on the explanation; Back from there returns to Settings.
  const [step, setStep] = useState<'home' | 'delete' | 'confirm'>(start ?? 'home');
  const [typed, setTyped] = useState('');
  const lastOwner = memberships.some((m) => m.startsWith('h-'));

  return (
    <div className="screen">
      <header className="topbar topbar--nav">
        <IconButton label="Back" onClick={() => (step === 'home' || (start && step === 'delete') ? pop() : setStep(step === 'confirm' && start ? 'delete' : 'home'))}>
          <ChevronLeft size={26} />
        </IconButton>
      </header>

      {step === 'home' && (
        <>
          <div className="title-block">
            <h1 className="large-title">Your data</h1>
          </div>
          <div className="settings">
            <section className="settings-group">
              <h2 className="settings-h">What you've agreed to</h2>
              <div className="group">
                {consents.map((c, i) => (
                  <Row key={i} label={<span className="settings-label"><span>{c.doc}</span><span className="meta">{c.version} · {c.method}</span></span>} value={c.at} chevron={false} />
                ))}
              </div>
            </section>
            <section className="settings-group">
              <h2 className="settings-h">Your information</h2>
              <div className="group">
                <Row label="Download your data" onPress={() => showToast({ text: "We'll email you a copy within 48 hours" })} />
                <Row label={<span className="danger-text">Delete account</span>} chevron={false} onPress={() => setStep('delete')} />
              </div>
            </section>
          </div>
        </>
      )}

      {step === 'delete' && (
        <div className="ws-pad stack">
          <h1 className="large-title">Delete your account</h1>
          <DraftTag />
          <p className="body">Your account is deactivated first. Sign in within 30 days and everything comes back. After that it's deleted.</p>
          <div className="delete-table">
            <p className="field-label">Deleted</p>
            <ul className="block-list">
              <li>Your profile, photo, portfolio and posts</li>
              <li>Follows, saved roles and interest you've sent</li>
              <li>Projects you've been privately added to, and credits you haven't accepted</li>
            </ul>
            <p className="field-label">Kept, because they're other people's records too</p>
            <ul className="block-list">
              <li>Credits you've accepted stay on those films under your name, with no link to a profile</li>
              <li>Messages stay with the people you wrote to, shown as "Deleted account"</li>
              <li>Reports stay with Art and Artist's safety team for a limited time</li>
            </ul>
          </div>
          {lastOwner ? (
            <p className="inline-error" role="alert">You own {memberships.filter((m) => m.startsWith('h-')).map((m) => org(m).name).join(', ')}. Transfer it to someone else, or contact Art and Artist, before deleting your account.</p>
          ) : (
            <>
              <Button block size="l" variant="secondary" onClick={() => showToast({ text: "We'll email you a copy within 48 hours" })}>
                Download my data first
              </Button>
              <Button block size="l" onClick={() => setStep('confirm')}>
                Continue
              </Button>
            </>
          )}
        </div>
      )}

      {step === 'confirm' && (
        <div className="ws-pad stack">
          <h1 className="large-title">Are you sure?</h1>
          <p className="meta">Type DELETE to deactivate your account now. It's permanently deleted after 30 days.</p>
          <input className="field" value={typed} onChange={(e) => setTyped(e.target.value)} autoCapitalize="characters" aria-label="Type DELETE to confirm" />
          <Button block size="l" variant="danger" disabled={typed.trim().toUpperCase() !== 'DELETE'} onClick={() => startEntry('signin', 'Your account is deactivated and will be deleted in 30 days. Sign in before then to restore it.')}>
            Deactivate and delete
          </Button>
        </div>
      )}
    </div>
  );
}
