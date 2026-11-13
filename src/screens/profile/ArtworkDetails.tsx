import { useState } from 'react';
import { ARTWORK_FIELDS, PRICED, type ArtworkDetails } from '../../data/profileSchema';
import type { Media } from '../../data/types';
import { artworkMissing } from '../../domain/profileGates';
import { Button, Chip, Photo } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';

/*
 * Artwork details (gate 3, docs/feedback/2026-11-13/PROFILE_DATA_PLAN.md). Asked when a fine artist adds a piece,
 * one sheet per piece: six rows of chips, price only when the piece can be bought. A piece without its details is
 * a draft: the artist sees it, nobody else does, until it is described.
 */
export function ArtworkDetailsSheet({ media, value, step, onSave, onLater }: { media: Media | null; value?: ArtworkDetails; step?: string; onSave: (d: ArtworkDetails) => void; onLater: () => void }) {
  return (
    <Sheet className="ana-work-sheet art-sheet" open={!!media} onClose={onLater} title="About this artwork" size="tall">
      {media && <ArtworkForm key={media.id} media={media} value={value} step={step} onSave={onSave} onLater={onLater} />}
    </Sheet>
  );
}

function ArtworkForm({ media, value, step, onSave, onLater }: { media: Media; value?: ArtworkDetails; step?: string; onSave: (d: ArtworkDetails) => void; onLater: () => void }) {
  const [d, setD] = useState<ArtworkDetails>({ ...value });
  const fields = ARTWORK_FIELDS.filter((f) => f.id !== 'price' || PRICED.includes(d.sale ?? ''));
  const left = artworkMissing(d).length;
  return (
    <div className="art-form">
      <div className="art-head">
        <span className="art-thumb">
          <Photo surface="portfolio-thumbnail" media={media} showPlay={false} />
        </span>
        <p className="meta">{step ? `${step} · ` : ''}Shown on your profile once these are set. Until then only you see this piece.</p>
      </div>
      {fields.map((f) => (
        <div key={f.id} className="art-row">
          <p className="field-label" id={`art-${f.id}`}>{f.label}</p>
          <div className="chips" role="radiogroup" aria-labelledby={`art-${f.id}`}>
            {f.options!.map((o) => {
              const on = d[f.id as keyof ArtworkDetails] === o;
              return (
                <Chip key={o} active={on} onClick={() => setD((x) => ({ ...x, [f.id]: on ? undefined : o }))}>
                  {o}
                </Chip>
              );
            })}
          </div>
        </div>
      ))}
      <Button block disabled={left > 0} onClick={() => onSave({ ...d, price: PRICED.includes(d.sale ?? '') ? d.price : undefined })}>
        {left ? `${left} left` : 'Save details'}
      </Button>
      <button className="link link--small art-later" onClick={onLater}>
        Later, keep it as a draft
      </button>
    </div>
  );
}
