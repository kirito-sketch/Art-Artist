import { motion } from 'framer-motion';
import { useState } from 'react';
import { Layers, Play } from 'lucide-react';
import type { Post } from '../../data/types';
import { party } from '../../state/selectors';
import { shared, spring } from '../../ui/motion';
import { Photo, PressCard } from '../../ui/primitives';

/**
 * Posts as a two-column masonry, one tile per kind of post (docs/feedback/2026-10-10/README.md, Discover):
 * image, video, several images, and text on its own set in the serif on a tinted panel.
 * Tiles are placed in the shorter column, so the page has no holes.
 */
type Kind = 'image' | 'video' | 'set' | 'text';
const hash = (s: string) => [...s].reduce((a, c) => (a * 31 + c.charCodeAt(0)) >>> 0, 7);
const RATIOS = [4 / 5, 1, 3 / 4, 5 / 4, 2 / 3];
const PANELS = ['panel-0', 'panel-1', 'panel-2', 'panel-3'];

function kindOf(p: Post): Kind {
  const m = p.media[0];
  return !m ? 'text' : m.kind === 'video' ? 'video' : p.media.length > 1 ? 'set' : 'image';
}

/** Media tiles keep the picture's own shape when it is known, else a calm variation by post. */
function ratioOf(p: Post, kind: Kind) {
  const m = p.media[0];
  if (m?.width && m?.height) return Math.min(1.5, Math.max(0.66, m.width / m.height));
  if (kind === 'video') return 4 / 5;
  return RATIOS[hash(p.id) % RATIOS.length];
}

/** Rough height of a tile in column-width units, to choose the shorter column. */
function heightOf(p: Post, kind: Kind) {
  if (kind === 'text') return 0.9 + Math.min(p.text.length, 140) / 140 * 0.7;
  return 1 / ratioOf(p, kind);
}

export function PostMasonry({ posts, onOpen }: { posts: Post[]; onOpen: (index: number) => void }) {
  const [claimed, setClaimed] = useState<string | null>(null);
  const cols: { post: Post; index: number }[][] = [[], []];
  const heights = [0, 0];
  posts.forEach((post, index) => {
    const kind = kindOf(post);
    const c = heights[0] <= heights[1] ? 0 : 1;
    cols[c].push({ post, index });
    heights[c] += heightOf(post, kind) + 0.06;
  });
  return (
    <div className="pmason" role="list" aria-label="Posts">
      {cols.map((col, ci) => (
        <div key={ci} className="pmason-col" role="presentation">
          {col.map(({ post, index }) => {
            const kind = kindOf(post);
            const first = post.media[0];
            const author = party(post.authorId);
                    const label = `${author?.name ?? 'Post'}${kind === 'video' ? ', video' : kind === 'set' ? `, ${post.media.length} images` : ''}: ${post.text.slice(0, 80)}`;
            return (
              <PressCard key={post.id} className={`pm-tile pm-tile--${kind}`} role="listitem" data-post-id={post.id} onPress={() => onOpen(index)} onPointerDown={() => setClaimed(post.id)} onFocus={() => setClaimed(post.id)} scale={0.975} aria-label={label}>
                {kind === 'text' ? (
                  <span className={`pm-text ${PANELS[hash(post.id) % PANELS.length]}`}>
                    <span className="pm-quote">{post.text}</span>
                    <span className="pm-by">{author?.name}</span>
                  </span>
                ) : (
                  <>
                    <motion.span className={`pm-media${kind === 'set' ? ' pm-media--set' : ''}`} style={{ aspectRatio: String(ratioOf(post, kind)) }} layoutId={claimed === post.id ? shared.post(post.id) : undefined} transition={spring.push}>
                      <Photo media={first} surface="search-thumbnail" showPlay={false} />
                      {kind === 'set' && <span className="pm-mark" aria-hidden><Layers size={14} /></span>}
                      {kind === 'video' && <span className="pm-mark pm-mark--play" aria-hidden><Play size={12} fill="currentColor" /></span>}
                    </motion.span>
                  </>
                )}
              </PressCard>
            );
          })}
        </div>
      ))}
    </div>
  );
}
