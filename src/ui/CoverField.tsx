import { ImagePlus } from 'lucide-react';
import { useState } from 'react';
import type { Media, MediaSurface } from '../data/types';
import { MediaFramingEditor } from './MediaFraming';
import { MediaPicker } from './MediaPicker';
import { Button } from './primitives';
import { Sheet } from './Sheet';

/*
 * One optional cover image on a create form (docs/ux-refinement/PLAN.md, Stage 6): an event cover, a project image.
 * Empty: one "Add" button that opens the shared picker. Chosen: the image appears once, in its real frame, where
 * it can be repositioned, with Change and Remove under it. Every form uses this rather than its own variant.
 */
export function CoverField({ label, media, surface, onChange, addLabel = 'Add a cover' }: { label: string; media?: Media; surface: MediaSurface; onChange: (media: Media | undefined) => void; addLabel?: string }) {
  const [picking, setPicking] = useState(false);
  return (
    <div className="cover-field">
      <span className="field-label">{label}</span>
      {media ? (
        <>
          <MediaFramingEditor media={media} surface={surface} onChange={onChange} title="Reposition" />
          <span className="cover-field-actions">
            <Button size="s" variant="secondary" onClick={() => setPicking(true)}>
              Change
            </Button>
            <Button size="s" variant="secondary" onClick={() => onChange(undefined)}>
              Remove
            </Button>
          </span>
        </>
      ) : (
        <Button variant="secondary" icon={<ImagePlus size={16} />} onClick={() => setPicking(true)}>
          {addLabel}
        </Button>
      )}
      <Sheet open={picking} onClose={() => setPicking(false)} title={label} size="tall">
        <MediaPicker
          single
          kind="image"
          selected={[]}
          onDone={(items) => {
            if (items[0]) onChange(items[0]);
            setPicking(false);
          }}
        />
      </Sheet>
    </div>
  );
}
