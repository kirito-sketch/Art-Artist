import { Check } from 'lucide-react';
import { useId, useState } from 'react';
import { useStore } from '../state/store';
import { maskedPhone, normalisePhone, validPhone } from '../state/profile';
import { Button } from './primitives';

export const TEST_CODE = '246810';

/**
 * A mobile number, confirmed with a code. For identity and matching only: the number is never shown on the
 * profile and never shared with anyone automatically (docs/REVIEW_EVENTS_PROFILE.md §5). `checkOnly` is for
 * onboarding, before the account exists: it checks the number isn't verified elsewhere and the profile saves it.
 */
export function MobileVerify({ value, onChange, checkOnly }: { value: { number: string; verified: boolean } | null; onChange: (v: { number: string; verified: boolean } | null) => void; checkOnly?: boolean }) {
  const { verifyPhone } = useStore();
  const [number, setNumber] = useState(value?.number ?? '');
  const [sent, setSent] = useState(false);
  const [code, setCode] = useState('');
  const [error, setError] = useState('');
  const id = useId();
  if (value?.verified)
    return (
      <div className="ob-verified" role="status">
        <Check size={18} aria-hidden />
        <span>
          <b>{maskedPhone(value.number)}</b> verified
        </span>
        <button className="link link--small" onClick={() => (onChange(null), setSent(false), setCode(''))}>
          Change
        </button>
      </div>
    );
  return (
    <>
      <p className="meta">Helps us match production credits and keep your professional record connected to you. Never shown on your profile.</p>
      <div>
        <label className="field-label" htmlFor={`${id}-n`}>
          Mobile number
        </label>
        <div className="ob-phone">
          <span className="ob-phone-cc" aria-hidden>
            +91
          </span>
          <input id={`${id}-n`} className="field" type="tel" inputMode="tel" value={number} onChange={(e) => (setNumber(e.target.value), setSent(false), setError(''))} placeholder="98480 12345" autoComplete="tel-national" aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-e` : undefined} />
        </div>
        {error && (
          <p className="field-error" role="alert" id={`${id}-e`}>
            {error}
          </p>
        )}
      </div>
      {!sent ? (
        <Button block variant="secondary" disabled={!validPhone(number)} onClick={() => setSent(true)}>
          Send code
        </Button>
      ) : (
        <>
          <div className="test-code" role="note">
            <p>
              <b>This is a test version, so no text message is sent.</b> Use this code:
            </p>
            <button type="button" className="test-code-btn" onClick={() => setCode(TEST_CODE)} aria-label={`Use code ${TEST_CODE.split('').join(' ')}`}>
              <span className="test-code-digits">
                {TEST_CODE.slice(0, 3)} {TEST_CODE.slice(3)}
              </span>
              <span className="test-code-use">Use code</span>
            </button>
          </div>
          <input className="field code-input" inputMode="numeric" maxLength={6} value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))} placeholder="••••••" aria-label="6-digit code" autoComplete="one-time-code" />
          <Button
            block
            variant="secondary"
            disabled={code.length !== 6}
            onClick={() => {
              if (code !== TEST_CODE) return setError("That code didn't match. Try again.");
              const r = verifyPhone(number, checkOnly);
              if (r === 'taken') return setError('This number is already verified on another account. Sign in there, or skip for now.');
              if (r === 'invalid') return setError('Enter a 10-digit mobile number.');
              onChange({ number: normalisePhone(number), verified: true });
            }}
          >
            Verify
          </Button>
        </>
      )}
    </>
  );
}
