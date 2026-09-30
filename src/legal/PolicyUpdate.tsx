import { useState } from 'react';
import { useStore } from '../state/store';
import { Button } from '../ui/primitives';
import { Sheet } from '../ui/Sheet';
import { DraftTag, LegalDocView } from './docs';

/** Material policy change: shown once on next launch; agreeing is required to keep using Ana. */
export function PolicyUpdate() {
  const { setPolicyUpdate, recordConsent, push, showToast } = useStore();
  const [read, setRead] = useState(false);
  return (
    <div className="policy-update">
      <div className="policy-card">
        <DraftTag />
        <h1 className="ob-title">We've updated our Terms</h1>
        <p className="meta">What changed, in short:</p>
        <ul className="block-list">
          <li>How credits stay on a film's record when an account is deleted</li>
          <li>What acting for an organisation makes you responsible for</li>
        </ul>
        <button className="link" onClick={() => setRead(true)}>
          Read the updated Terms
        </button>
        <Button
          block
          size="l"
          onClick={() => {
            recordConsent(['Terms of Service (updated)'], 'Re-consent');
            setPolicyUpdate(false);
            showToast({ text: 'Thanks. Your agreement is saved in Settings → Your data.' });
          }}
        >
          Agree and continue
        </Button>
        <button
          className="link link--muted"
          onClick={() => {
            setPolicyUpdate(false);
            push({ name: 'yourData' });
          }}
        >
          I don't agree: download or delete my data
        </button>
      </div>
      <Sheet open={read} onClose={() => setRead(false)} title="" size="tall">
        <LegalDocView id="terms" />
      </Sheet>
    </div>
  );
}
