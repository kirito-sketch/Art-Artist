import { Check, ImagePlus } from 'lucide-react';
import { useState } from 'react';
import * as seed from '../data/seed';
import type { Media } from '../data/types';
import { addMedia, addMessage, MEDIA_LIMIT, removeMedia, selectionStatus, type MediaKind } from '../domain/mediaSelection';
import { DeviceMediaButton } from './DeviceMedia';
import { MediaTray } from './MediaTray';
import { Button, Photo } from './primitives';

/*
 * The one media picker every create surface opens (docs/ux-refinement/PLAN.md, Stage 6). Device first: the system
 * picker returns only the files someone chooses, read in this tab for this session (D6). Below it, the prototype's
 * sample media sit in their own labelled group, never mixed in with device files, so nobody mistakes them for their
 * camera roll. Multi-select surfaces show the selection as a tray with order numbers; single-item surfaces finish
 * on the first choice. The props are unchanged, so every existing call site keeps working.
 */
export function MediaPicker({ selected, onDone, single, kind, limit = MEDIA_LIMIT }: { selected: Media[]; onDone: (m: Media[]) => void; single?: boolean; kind?: MediaKind; limit?: number }) {
  const rules = { limit: single ? 1 : limit, kind };
  const [picked, setPicked] = useState<Media[]>(selected);
  const [message, setMessage] = useState('');
  // Sample assets may not carry their pixel size; learn it as the thumbnail loads so framing stays exact.
  const [geometry, setGeometry] = useState<Record<string, { width: number; height: number }>>({});
  const sized = (m: Media) => ({ ...m, ...geometry[m.id] });
  const status = selectionStatus(picked, rules);

  const take = (items: Media[]) => {
    const r = addMedia(picked, items.map(sized), rules);
    setMessage(addMessage(r, rules) ?? '');
    if (single) return r.selection[0] && onDone([r.selection[0]]);
    setPicked(r.selection);
  };
  const toggleSample = (m: Media) => (picked.some((x) => x.id === m.id) ? setPicked(removeMedia(picked, m.id)) : take([m]));
  const samples = seed.cameraRoll.filter((m) => !kind || m.kind === kind);

  return (
    <div className="mpick">
      <DeviceMediaButton kind={kind} multiple={!single} max={single ? 1 : limit - picked.length} disabled={!single && status.full} onPicked={take} onError={setMessage}>
        <ImagePlus size={18} aria-hidden /> Choose from this device
      </DeviceMediaButton>
      <p className="meta mpick-note">Files stay on this device for this session. Nothing is uploaded.</p>
      {message && (
        <p className="meta mpick-error" role="alert">
          {message}
        </p>
      )}

      {!single && picked.length > 0 && (
        <section className="mpick-selected" aria-label="Selected">
          <p className="meta" role="status">
            {status.full ? `That's the limit: ${status.limit}.` : `${status.label} selected. Drag to change the order.`}
          </p>
          <MediaTray items={picked} onChange={setPicked} />
        </section>
      )}

      {samples.length > 0 && (
        <section className="mpick-samples" aria-labelledby="mpick-samples-title">
          <h3 className="mpick-title" id="mpick-samples-title">
            Sample media <span className="meta">Prototype only</span>
          </h3>
          <div className="mpick-grid">
            {samples.map((m, i) => {
              const at = picked.findIndex((x) => x.id === m.id);
              return (
                <button key={m.id} type="button" className={`mpick-item${at >= 0 ? ' is-on' : ''}`} aria-pressed={single ? undefined : at >= 0} aria-label={`Sample ${m.kind === 'video' ? 'video' : 'photo'} ${i + 1}`} onClick={() => toggleSample(m)} disabled={!single && at < 0 && status.full}>
                  <Photo
                    media={m}
                    surface="search-thumbnail"
                    onImageLoad={(image) => {
                      if (image.src !== new URL(m.src, document.baseURI).href) return;
                      const { naturalWidth: width, naturalHeight: height } = image;
                      if (width && height) setGeometry((old) => (old[m.id]?.width === width && old[m.id]?.height === height ? old : { ...old, [m.id]: { width, height } }));
                    }}
                  />
                  {!single && <span className="mpick-check">{at >= 0 ? at + 1 : <Check size={12} strokeWidth={3} aria-hidden className="mpick-check-off" />}</span>}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {!single && (
        <div className="sheet-sticky">
          <Button block size="l" onClick={() => onDone(picked.map(sized))}>
            {picked.length ? `Add ${picked.length}` : 'Done'}
          </Button>
        </div>
      )}
    </div>
  );
}
