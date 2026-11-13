import { useState } from 'react';
import { profileOf } from '../../state/profile';
import { useStore } from '../../state/store';
import { Button } from '../../ui/primitives';

/** Instagram handle, or "I don't have one" so it is never asked again. Saved as the person types (no page Save). */
export function InstagramField({ onDone }: { onDone?: () => void }) {
  const { viewer, saveProfile } = useStore();
  const x = profileOf(viewer.id);
  const [handle, setHandle] = useState(x.instagram ?? '');
  const clean = handle.trim().replace(/^@/, '').replace(/^https?:\/\/(www\.)?instagram\.com\//, '').replace(/\/.*$/, '');
  const valid = /^[a-zA-Z0-9._]{1,30}$/.test(clean);
  const changed = clean !== (x.instagram ?? '');
  return (
    <section className="stack" aria-label="Instagram">
      <label className="field-label" htmlFor="ep-instagram">Instagram</label>
      <div className="ep-insta">
        <span aria-hidden>@</span>
        <input id="ep-instagram" className="field" value={handle} onChange={(e) => setHandle(e.target.value)} placeholder="yourhandle" autoCapitalize="none" autoCorrect="off" spellCheck={false} inputMode="url" />
      </div>
      {handle && !valid && <p className="field-error">Letters, numbers, dots and underscores only.</p>}
      <div className="ep-insta-actions">
        <Button size="s" disabled={!valid || !changed} onClick={() => (saveProfile({}, { instagram: clean, noInstagram: false }), onDone?.())}>
          Save handle
        </Button>
        {!x.instagram && (
          <button className="link link--small" aria-pressed={!!x.noInstagram} onClick={() => (saveProfile({}, { noInstagram: true }), onDone?.())}>
            {x.noInstagram ? "Marked: I don't have one" : "I don't have Instagram"}
          </button>
        )}
      </div>
    </section>
  );
}
