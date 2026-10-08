import { AnimatePresence, motion } from 'framer-motion';
import { Check, ImagePlus, X } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import * as seed from '../../data/seed';
import type { Media, PostPresentation } from '../../data/types';
import { useStore } from '../../state/store';
import { org, person } from '../../state/selectors';
import { spring } from '../../ui/motion';
import { Avatar, Button, Photo, Row, Toggle } from '../../ui/primitives';
import { previewImage, previewPostVideo } from '../../ui/imagePreview';
import { PostFramingEditor } from '../../ui/MediaFraming';
import { Sheet } from '../../ui/Sheet';

export const MEDIA_LIMIT = 10;

/** One composer for text, photos and video. */
export function PostComposer() {
  const { pop, viewer, publishPost, lastDraft, acting } = useStore();
  // Publishing always shows who it comes from: the person, or the house they act for.
  const me = acting !== 'self' ? org(acting) : person(viewer.id);
  const prev = lastDraft.current?.kind === 'post' ? lastDraft.current.draft : null;
  const [text, setText] = useState(prev?.text ?? '');
  const [media, setMedia] = useState<Media[]>(prev?.media ?? []);
  const [presentation, setPresentation] = useState<PostPresentation>(prev?.presentation ?? 'original');
  const [framing, setFraming] = useState(false);
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
        <Button size="s" disabled={!dirty} onClick={() => publishPost({ text: text.trim(), media, presentation, addToPortfolio: portfolio && media.length > 0 })}>
          Post
        </Button>
      </header>

      <div className="composer-body">
        <h1 className="sr-only">New post</h1>
        <div className="composer-who">
          <Avatar party={me} size={40} />
          <span className="item-title">{me.name}</span>
        </div>
        <label className="field-label composer-label" htmlFor="post-text">
          What are you working on?
        </label>
        <textarea id="post-text" ref={ref} className="composer-text" placeholder="Write a post" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} />

        <AnimatePresence initial={false}>
          {media.length > 0 && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="stack">
              <div className="composer-media">
                <AnimatePresence initial={false}>
                  {media.map((m) => (
                    <motion.div key={m.id} className="composer-thumb" layout initial={{ opacity: 0, scale: 0.85 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.85 }} transition={spring.snappy}>
                      <Photo media={m} />
                      <button className="composer-remove" aria-label="Remove this photo" onClick={() => setMedia((ms) => ms.filter((x) => x.id !== m.id))}>
                        <X size={14} strokeWidth={2.6} />
                      </button>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
              <Button variant="secondary" onClick={() => setFraming(true)}>Adjust framing</Button>
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

      <Sheet open={framing} onClose={() => setFraming(false)} title="Post framing" size="tall"><PostFramingEditor media={media} presentation={presentation} onMediaChange={setMedia} onPresentationChange={setPresentation} /><Button block onClick={() => setFraming(false)}>Done</Button></Sheet>
      <Sheet open={picker} onClose={() => setPicker(false)} title="Photos and video" size="tall">
        <MediaPicker
          selected={media}
          onDone={(ms) => {
            setMedia(ms);
            setPicker(false);
          }}
        />
      </Sheet>
      <Sheet open={discard} onClose={() => setDiscard(false)} title="Discard post?" close={false}>
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

export function MediaPicker({ selected, onDone, single, kind }: { selected: Media[]; onDone: (m: Media[]) => void; single?: boolean; kind?: Media['kind'] }) {
  const [local, setLocal] = useState<Media[]>([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [geometry, setGeometry] = useState<Record<string, { width: number; height: number }>>({});
  const [picked, setPicked] = useState<Media[]>(selected);
  const toggle = (source: Media) => {
    const m = { ...source, ...geometry[source.id] };
    if (single) return onDone([m]);
    setPicked((p) => (p.some((x) => x.id === m.id) ? p.filter((x) => x.id !== m.id) : p.length >= MEDIA_LIMIT ? p : [...p, m]));
  };
  return (
    <div>
      {<div className="media-upload"><label className="field-label">Choose {kind === 'image' ? 'images' : kind === 'video' ? 'video' : 'photos or video'} from your device<input type="file" accept={kind === 'image' ? 'image/*' : kind === 'video' ? 'video/*' : 'image/*,video/*'} multiple={!single} disabled={loading} onChange={async e => {
        const files = Array.from(e.target.files ?? []); e.target.value = ''; setError(''); setLoading(true);
        const next: Media[] = []; const limit = single ? 1 : Math.max(0, MEDIA_LIMIT - picked.length);
        try { for (const file of files.slice(0, limit)) next.push(await (file.type.startsWith('video/') ? previewPostVideo(file) : previewImage(file)));
          if (single && next[0]) onDone(next); else { setLocal(old => [...old, ...next]); setPicked(old => [...old, ...next]); }
          if (files.length > limit) setError(`You can choose ${MEDIA_LIMIT} items per set.`);
        } catch (error) { next.forEach(m => URL.revokeObjectURL(m.src)); setError(error instanceof Error ? error.message : 'Choose another image.'); }
        finally { setLoading(false); }
      }} /></label><p className="meta">Device media stays in this prototype session. They are not uploaded or saved to a server.</p>{loading && <p role="status" className="meta">Preparing device previews…</p>}{error && <p role="alert" className="meta">{error}</p>}</div>}
      {/* V30: the limit is stated up front, not discovered by a tap that does nothing. */}
      {!single && (
        <p className="meta picker-limit" role="status">
          {picked.length >= MEDIA_LIMIT ? `That's the limit: ${MEDIA_LIMIT} ${kind === 'image' ? 'images' : 'photos or videos'} at a time.` : `Choose up to ${MEDIA_LIMIT} ${kind === 'image' ? 'images' : 'photos or videos'}. ${picked.length} selected.`}
        </p>
      )}
      <div className="picker">
        {[...seed.cameraRoll, ...local].filter((m) => !kind || m.kind === kind).map((m, i) => {
          const idx = picked.findIndex((x) => x.id === m.id);
          return (
            <motion.button key={m.id} className={`picker-item ${idx >= 0 ? 'is-on' : ''}`} whileTap={{ scale: 0.94 }} onClick={() => toggle(m)} aria-label={kind ? `Image ${i + 1}` : undefined} aria-pressed={idx >= 0}>
              <Photo media={m} surface="search-thumbnail" onImageLoad={image => {
                if (image.src !== new URL(m.src, document.baseURI).href) return;
                const width = image.naturalWidth, height = image.naturalHeight;
                if (width && height) setGeometry(old => old[m.id]?.width === width && old[m.id]?.height === height ? old : { ...old, [m.id]: { width, height } });
              }} />
              {!single && <span className="picker-check">{idx >= 0 ? <Check size={14} strokeWidth={3} /> : null}</span>}
            </motion.button>
          );
        })}
      </div>
      {!single && (
        <div className="sheet-sticky">
          <Button block size="l" disabled={loading} onClick={() => onDone(picked.map(m => ({ ...m, ...geometry[m.id] })))}>
            {picked.length ? `Add ${picked.length}` : 'Done'}
          </Button>
        </div>
      )}
    </div>
  );
}
