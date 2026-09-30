import { AnimatePresence, motion } from 'framer-motion';
import { Check, ImagePlus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import * as seed from '../../data/seed';
import type { Media } from '../../data/types';
import { useStore } from '../../state/store';
import { org, person } from '../../state/selectors';
import { spring } from '../../ui/motion';
import { Avatar, Button, Photo, Row, Toggle } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';

const MEDIA_LIMIT = 10;

/** One composer for text, photos and video. */
export function PostComposer() {
  const { pop, viewer, publishPost, lastDraft, acting } = useStore();
  // Publishing always shows who it comes from: the person, or the house they act for.
  const me = acting !== 'self' ? org(acting) : person(viewer.id);
  const prev = lastDraft.current?.kind === 'post' ? lastDraft.current.draft : null;
  const [text, setText] = useState(prev?.text ?? '');
  const [media, setMedia] = useState<Media[]>(prev?.media ?? []);
  const [portfolio, setPortfolio] = useState(prev?.addToPortfolio ?? false);
  const [picker, setPicker] = useState(false);
  const [discard, setDiscard] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => ref.current?.focus(), 350);
    return () => window.clearTimeout(t);
  }, []);

  const dirty = text.trim().length > 0 || media.length > 0;

  return (
    <div className="composer">
      <header className="composer-bar">
        <button className="link link--muted" onClick={() => (dirty ? setDiscard(true) : pop())}>
          Cancel
        </button>
        <Button size="s" disabled={!dirty} onClick={() => publishPost({ text: text.trim(), media, addToPortfolio: portfolio && media.length > 0 })}>
          Post
        </Button>
      </header>

      <div className="composer-body">
        <div className="composer-who">
          <Avatar party={me} size={40} />
          <span className="item-title">{me.name}</span>
        </div>
        <textarea ref={ref} className="composer-text" placeholder="What are you working on?" value={text} onChange={(e) => setText(e.target.value)} aria-label="Post text" maxLength={2000} />

        <AnimatePresence initial={false}>
          {media.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="stack">
              <div className="composer-media">
                <AnimatePresence initial={false}>
                  {media.map((m) => (
                    <motion.div key={m.id} className="composer-thumb" layout initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} transition={spring.snappy}>
                      <Photo media={m} />
                      <button className="composer-remove" aria-label="Remove" onClick={() => setMedia((ms) => ms.filter((x) => x.id !== m.id))}>
                        <X size={14} strokeWidth={2.6} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <div className="group">
                <Row label="Add to portfolio">
                  <Toggle on={portfolio} onChange={setPortfolio} label="Add to portfolio" />
                </Row>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="composer-tools">
        <button className="tool" onClick={() => setPicker(true)} disabled={media.length >= MEDIA_LIMIT} aria-label="Add photos or video">
          <ImagePlus size={24} />
        </button>
        {media.length > 0 && <span className="meta">{media.length} of {MEDIA_LIMIT}</span>}
      </div>

      <Sheet open={picker} onClose={() => setPicker(false)} title="Photos and video" size="tall">
        <MediaPicker
          selected={media}
          onDone={(ms) => {
            setMedia(ms);
            setPicker(false);
          }}
        />
      </Sheet>
      <Sheet open={discard} onClose={() => setDiscard(false)} title="Discard post?">
        <div className="stack">
          <Button block size="l" variant="danger" onClick={pop}>
            Discard
          </Button>
          <Button block size="l" variant="secondary" onClick={() => setDiscard(false)}>
            Keep editing
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

export function MediaPicker({ selected, onDone, single }: { selected: Media[]; onDone: (m: Media[]) => void; single?: boolean }) {
  const [picked, setPicked] = useState<Media[]>(selected);
  const toggle = (m: Media) => {
    if (single) return onDone([m]);
    setPicked((p) => (p.some((x) => x.id === m.id) ? p.filter((x) => x.id !== m.id) : p.length >= MEDIA_LIMIT ? p : [...p, m]));
  };
  return (
    <div>
      <div className="picker">
        {seed.cameraRoll.map((m) => {
          const idx = picked.findIndex((x) => x.id === m.id);
          return (
            <motion.button key={m.id} className={`picker-item ${idx >= 0 ? 'is-on' : ''}`} whileTap={{ scale: 0.94 }} onClick={() => toggle(m)} aria-pressed={idx >= 0}>
              <Photo media={m} />
              {!single && <span className="picker-check">{idx >= 0 ? <Check size={14} strokeWidth={3} /> : null}</span>}
            </motion.button>
          );
        })}
      </div>
      {!single && (
        <div className="sheet-sticky">
          <Button block size="l" onClick={() => onDone(picked)}>
            {picked.length ? `Add ${picked.length}` : 'Done'}
          </Button>
        </div>
      )}
    </div>
  );
}
