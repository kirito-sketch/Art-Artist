import { AnimatePresence, motion } from 'framer-motion';
import { ArrowLeft, ArrowRight, ImagePlus, Images, Plus, Trash2 } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import type { Media, Post } from '../../data/types';
import { addMedia, addMessage, isSessionMedia, MEDIA_LIMIT, moveBy, portfolioSplit, removeMedia, selectionStatus } from '../../domain/mediaSelection';
import { useStore } from '../../state/store';
import { org, person } from '../../state/selectors';
import { DeviceMediaButton } from '../../ui/DeviceMedia';
import { MediaPicker } from '../../ui/MediaPicker';
import { MediaTray } from '../../ui/MediaTray';
import { Avatar, Button, Toggle } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';
import { PostCard } from '../home/PostCard';


/*
 * One composer for every post (docs/ux-refinement/PLAN.md, Stage 6). Text-first: write, Post. Media-first: the photo
 * tool opens the device's own picker and the choice lands in the tray under the text. Tap a thumbnail to preview
 * the post exactly as the feed will show it (the feed's own PostCard), and reorder or remove from there.
 * There is no framing step: new posts keep each image's own proportions inside the feed's bounds, and nothing is
 * cropped (decision C1). Device media stays in this session (D6) and the composer says so.
 */
export function PostComposer() {
  const { pop, viewer, publishPost, lastDraft, acting } = useStore();
  // Publishing always shows who it comes from: the person, or the house they act for.
  const asHouse = acting !== 'self';
  const me = asHouse ? org(acting) : person(viewer.id);
  const prev = lastDraft.current?.kind === 'post' ? lastDraft.current.draft : null;
  const [text, setText] = useState(prev?.text ?? '');
  const [media, setMedia] = useState<Media[]>(prev?.media ?? []);
  const [portfolio, setPortfolio] = useState(prev?.addToPortfolio ?? false);
  const [message, setMessage] = useState('');
  const [reading, setReading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [samples, setSamples] = useState(false);
  const [discard, setDiscard] = useState(false);
  const [preview, setPreview] = useState<number | null>(null);
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const t = window.setTimeout(() => ref.current?.focus(), 350);
    return () => window.clearTimeout(t);
  }, []);
  // The caption grows with its text, so a long caption is read in full in the page, never in a small scrolling box.
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${el.scrollHeight}px`;
  }, [text]);

  const status = selectionStatus(media);
  const split = portfolioSplit(media);
  const dirty = text.trim().length > 0 || media.length > 0;
  const canPost = dirty && !reading && !posting;
  const add = (items: Media[]) => {
    const r = addMedia(media, items);
    setMedia(r.selection);
    setMessage(addMessage(r) ?? '');
  };
  const post = () => {
    setPosting(true);
    // One frame for the button to show it's working, then the existing publish flow takes over (Home progress bar,
    // failure banner with Retry, success toast with View).
    requestAnimationFrame(() => publishPost({ text: text.trim(), media, addToPortfolio: !asHouse && portfolio && split.images.length > 0 }));
  };
  const deviceTool = (
    <DeviceMediaButton className="tool" label="Add photos or video" max={MEDIA_LIMIT - media.length} disabled={status.full} onPicked={add} onError={setMessage} onBusyChange={setReading}>
      <ImagePlus size={24} aria-hidden />
    </DeviceMediaButton>
  );

  return (
    <div className="composer composer--post">
      <header className="composer-bar">
        <button className="link link--muted" onClick={() => (dirty ? setDiscard(true) : pop())}>
          Cancel
        </button>
        <h1 className="composer-title">New post</h1>
        <Button size="s" disabled={!canPost} loading={posting} onClick={post}>
          Post
        </Button>
      </header>

      <div className="composer-body">
        <div className="composer-who">
          <Avatar party={me} size={40} />
          <span className="composer-who-text">
            <span className="item-title">{me.name}</span>
            <span className="meta">{asHouse ? 'Posting as the house' : 'Posting as you'}</span>
          </span>
        </div>
        <textarea id="post-text" ref={ref} className="composer-text" aria-label="Post text" placeholder="What are you working on?" value={text} onChange={(e) => setText(e.target.value)} maxLength={2000} />

        {media.length > 0 && (
          <section className="composer-media-v2" aria-label="Media in this post">
            <MediaTray
              items={media}
              onChange={setMedia}
              onOpen={setPreview}
              add={
                !status.full && (
                  <DeviceMediaButton className="mtray-add" label="Add more photos or video" max={MEDIA_LIMIT - media.length} onPicked={add} onError={setMessage} onBusyChange={setReading}>
                    <Plus size={22} aria-hidden />
                  </DeviceMediaButton>
                )
              }
            />
            <p className="meta composer-media-meta">
              {status.label}
              {media.length > 1 ? ' · Tap to preview, hold and drag to reorder' : ' · Tap to preview'}
            </p>
            {media.some(isSessionMedia) && <p className="meta">Media from your device stays in this session only. It isn't uploaded.</p>}
          </section>
        )}
        {reading && (
          <p className="meta" role="status">
            Preparing your media…
          </p>
        )}
        {message && (
          <p className="field-error" role="alert">
            {message}
          </p>
        )}

        {!asHouse && split.images.length > 0 && (
          <div className="composer-option">
            <span className="composer-option-text">
              <span className="item-title">Also add photos to Selected work</span>
              <span className="meta">
                Shows {split.images.length === 1 ? 'this photo' : `these ${split.images.length} photos`} on your profile. It isn't a credit.
                {split.videos > 0 && ` ${split.videos === 1 ? 'The video stays' : 'Videos stay'} in the post only.`}
              </span>
            </span>
            <Toggle on={portfolio} onChange={setPortfolio} label="Also add photos to Selected work" />
          </div>
        )}
      </div>

      <div className="composer-tools">
        {deviceTool}
        <button className="tool tool--text" onClick={() => setSamples(true)} disabled={status.full}>
          <Images size={20} aria-hidden /> Samples
        </button>
        {media.length > 0 && (
          <button className="link composer-preview-link" onClick={() => setPreview(0)}>
            Preview
          </button>
        )}
      </div>

      <AnimatePresence>
        {preview !== null && media.length > 0 && (
          <PostPreview
            draft={{ id: 'draft', authorId: asHouse ? acting : viewer.id, time: 'now', text: text.trim(), media, likes: 0, comments: 0 }}
            index={Math.min(preview, media.length - 1)}
            onIndex={setPreview}
            onChange={(next) => {
              setMedia(next);
              if (!next.length) setPreview(null);
            }}
            onClose={() => setPreview(null)}
          />
        )}
      </AnimatePresence>

      <Sheet open={samples} onClose={() => setSamples(false)} title="Add media" size="tall">
        <MediaPicker
          selected={media}
          onDone={(ms) => {
            setMedia(ms);
            setSamples(false);
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

/**
 * The post as the feed will show it, with the item controls under it: Move earlier, Move later, Remove. These are
 * also the keyboard and switch-control way to reorder (decision C3).
 */
function PostPreview({ draft, index, onIndex, onChange, onClose }: { draft: Post; index: number; onIndex: (i: number) => void; onChange: (media: Media[]) => void; onClose: () => void }) {
  const { media } = draft;
  const current = media[index];
  const move = (by: -1 | 1) => {
    onChange(moveBy(media, current.id, by));
    onIndex(index + by);
  };
  return (
    <motion.div className="composer-preview" role="dialog" aria-modal="true" aria-label="Post preview" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 24 }} transition={{ duration: 0.2 }}>
      <header className="composer-bar">
        <button className="link" onClick={onClose}>
          Done
        </button>
        <span className="composer-title">Preview</span>
        <span className="composer-bar-spacer" />
      </header>
      <div className="composer-preview-body post-stream">
        {/* Keyed by order and position, so it re-opens on the moved item. */}
        <PostCard key={`${media.map((m) => m.id).join()}:${index}`} post={draft} preview startIndex={index} onPageChange={onIndex} />
      </div>
      <div className="composer-preview-tools" role="group" aria-label={`${current.kind === 'video' ? 'Video' : 'Photo'} ${index + 1} of ${media.length}`}>
        <button className="tool tool--text" onClick={() => move(-1)} disabled={index === 0} aria-label="Move earlier">
          <ArrowLeft size={18} aria-hidden /> Earlier
        </button>
        <span className="meta" aria-hidden>
          {index + 1} of {media.length}
        </span>
        <button className="tool tool--text" onClick={() => move(1)} disabled={index === media.length - 1} aria-label="Move later">
          Later <ArrowRight size={18} aria-hidden />
        </button>
        <button className="tool tool--text tool--danger" onClick={() => onChange(removeMedia(media, current.id))}>
          <Trash2 size={18} aria-hidden /> Remove
        </button>
      </div>
    </motion.div>
  );
}
