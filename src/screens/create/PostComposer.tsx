import { AnimatePresence, motion } from 'framer-motion';
import { Check, ImagePlus, Play, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import * as seed from '../../data/seed';
import type { Media } from '../../data/types';
import { useStore } from '../../state/store';
import { person } from '../../state/selectors';
import { spring } from '../../ui/motion';
import { Avatar, Button, Toggle } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';
import { Still } from '../../ui/Still';

const MEDIA_LIMIT = 10;
const TEXT_LIMIT = 2000;

/** One composer for text, images and video. No content-type decision up front. */
export function PostComposer() {
  const { pop, viewer, publishPost, lastDraft } = useStore();
  const me = person(viewer.id);
  const prev = lastDraft.current?.kind === 'post' ? lastDraft.current.draft : null;
  const [text, setText] = useState(prev?.text ?? '');
  const [media, setMedia] = useState<Media[]>(prev?.media ?? []);
  const [portfolio, setPortfolio] = useState(prev?.addToPortfolio ?? false);
  const [picker, setPicker] = useState(false);
  const [confirmDiscard, setConfirmDiscard] = useState(false);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => ref.current?.focus(), 350);
    return () => window.clearTimeout(t);
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(120, el.scrollHeight)}px`;
  }, [text]);

  const dirty = text.trim().length > 0 || media.length > 0;
  const canPost = dirty && text.length <= TEXT_LIMIT;
  const close = () => (dirty ? setConfirmDiscard(true) : pop());

  return (
    <div className="composer">
      <header className="composer-bar">
        <button className="composer-cancel" onClick={close}>
          Cancel
        </button>
        <p className="composer-title">New post</p>
        <Button size="s" disabled={!canPost} onClick={() => publishPost({ text: text.trim(), media, addToPortfolio: portfolio && media.length > 0 })}>
          Post
        </Button>
      </header>

      <div className="composer-body">
        <div className="composer-identity">
          <Avatar party={me} size={40} />
          <div>
            <p className="composer-name">{me.name}</p>
            <p className="composer-audience">Your followers and network</p>
          </div>
        </div>
        <textarea
          ref={ref}
          className="composer-text"
          placeholder="What are you working on?"
          value={text}
          onChange={(e) => setText(e.target.value)}
          aria-label="Post text"
        />
        {text.length > TEXT_LIMIT * 0.9 && <p className={`counter ${text.length > TEXT_LIMIT ? 'counter--over' : ''}`}>{TEXT_LIMIT - text.length}</p>}

        <AnimatePresence initial={false}>
          {media.length > 0 && (
            <motion.div className="composer-media" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
              <div className="composer-media-rail">
                <AnimatePresence initial={false}>
                  {media.map((m) => (
                    <motion.div key={m.id} className="composer-thumb" layout initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={spring.snappy}>
                      <Still media={m} />
                      <button className="composer-thumb-remove" aria-label="Remove" onClick={() => setMedia((ms) => ms.filter((x) => x.id !== m.id))}>
                        <X size={13} strokeWidth={2.6} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <div className="composer-portfolio">
                <div>
                  <p className="form-label">Also add to portfolio</p>
                  <p className="form-help">Shows on your profile as work, not just a post.</p>
                </div>
                <Toggle on={portfolio} onChange={setPortfolio} label="Also add to portfolio" />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Toolbar rides above the keyboard on device. */}
      <div className="composer-toolbar">
        <button className="composer-tool" onClick={() => setPicker(true)} disabled={media.length >= MEDIA_LIMIT}>
          <ImagePlus size={20} />
          <span>{media.length ? `Media ${media.length}/${MEDIA_LIMIT}` : 'Add photos or video'}</span>
        </button>
      </div>

      <Sheet open={picker} onClose={() => setPicker(false)} title="Add media" subtitle={`Up to ${MEDIA_LIMIT} photos or videos · videos up to 10 min`} size="tall">
        <MediaPicker
          selected={media}
          onDone={(ms) => {
            setMedia(ms);
            setPicker(false);
          }}
        />
      </Sheet>

      <Sheet open={confirmDiscard} onClose={() => setConfirmDiscard(false)} title="Discard this post?" showClose={false}>
        <div className="form">
          <p className="form-lead">Your text and media will be lost.</p>
          <Button block size="l" variant="danger" onClick={pop}>
            Discard
          </Button>
          <Button block size="l" variant="secondary" onClick={() => setConfirmDiscard(false)}>
            Keep editing
          </Button>
        </div>
      </Sheet>
    </div>
  );
}

export function MediaPicker({ selected, onDone, limit = MEDIA_LIMIT, single }: { selected: Media[]; onDone: (m: Media[]) => void; limit?: number; single?: boolean }) {
  const [picked, setPicked] = useState<Media[]>(selected);
  const toggle = (m: Media) => {
    if (single) return onDone([m]);
    setPicked((p) => (p.some((x) => x.id === m.id) ? p.filter((x) => x.id !== m.id) : p.length >= limit ? p : [...p, m]));
  };
  return (
    <div>
      <div className="picker-grid">
        {seed.cameraRoll.map((m) => {
          const idx = picked.findIndex((x) => x.id === m.id);
          return (
            <motion.button key={m.id} className={`picker-item ${idx >= 0 ? 'is-on' : ''}`} whileTap={{ scale: 0.94 }} onClick={() => toggle(m)} aria-pressed={idx >= 0}>
              <Still media={m} showPlay={false} />
              {m.kind === 'video' && (
                <span className="picker-video">
                  <Play size={10} fill="currentColor" /> {m.duration}
                </span>
              )}
              {!single && <span className="picker-check">{idx >= 0 ? idx + 1 : ''}</span>}
            </motion.button>
          );
        })}
      </div>
      {picked.length >= limit && <p className="form-fineprint">You've reached the {limit} item limit.</p>}
      {!single && (
        <div className="sheet-sticky">
          <Button block size="l" icon={<Check size={18} />} onClick={() => onDone(picked)}>
            {picked.length ? `Add ${picked.length}` : 'Done'}
          </Button>
        </div>
      )}
    </div>
  );
}
