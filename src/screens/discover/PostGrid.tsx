import { motion } from 'framer-motion';
import { Layers, Play } from 'lucide-react';
import { shared, spring } from '../../ui/motion';
import type { Post } from '../../data/types';
import { party } from '../../state/selectors';
import { Photo, PressCard } from '../../ui/primitives';
import { bentoPattern, mediaFit, mediaPosition, mediaRatio } from '../../domain/mediaLayout';
import { useState } from 'react';

/*
 * Discover → Posts as a contact sheet: a tight three-column grid of the work itself. No captions,
 * no counters, no cards. A small mark tells a set of frames or a clip from a single still. A post
 * without media is set as a quiet note tile, never an empty box.
 */
export function PostGrid({ posts, onOpen, bento = false }: { posts: Post[]; onOpen: (index: number) => void; bento?: boolean }) {
  const [geometry, setGeometry] = useState<Record<string, { width: number; height: number }>>({});
  const tiles = posts.map((p, i) => {
    const first = p.media[0];
    const author = party(p.authorId);
    const kind = !first ? 'note' : first.kind === 'video' ? 'video' : p.media.length > 1 ? 'set' : 'still';
    const label = `${author?.name ?? 'Post'}${kind === 'video' ? ', video' : kind === 'set' ? `, ${p.media.length} images` : ''}: ${p.text.slice(0, 80)}`;
    return <PressCard key={p.id} className={`post-tile post-tile--${kind}`} onPress={() => onOpen(i)} scale={0.97} aria-label={label} role="listitem" data-post-id={p.id}>
      <motion.div className="post-tile-media" style={bento && first ? { '--media-fit': mediaFit(first), '--media-position': mediaPosition(first) } as import('react').CSSProperties : undefined} layoutId={shared.post(p.id)} transition={spring.push}>
        {first ? <Photo key={first.src} media={first} showPlay={false} onImageLoad={bento ? image => {
          const width = image.naturalWidth, height = image.naturalHeight;
          if (width && height) setGeometry(previous => previous[first.src]?.width === width && previous[first.src]?.height === height ? previous : { ...previous, [first.src]: { width, height } });
        } : undefined} /> : <span className="post-tile-note">{p.text}</span>}
      </motion.div>
      {kind === 'set' && <span className="post-tile-mark" aria-hidden><Layers size={14} strokeWidth={2.4} /></span>}
      {kind === 'video' && <span className="post-tile-mark" aria-hidden><Play size={12} fill="currentColor" strokeWidth={0} /></span>}
    </PressCard>;
  });
  // Result order stays intact. Every group of three cycles left, right, then wide.
  // This is layout rhythm, never a ranking or a paid placement.
  if (bento) return <div className="post-grid post-grid--bento" role="list" aria-label="Posts">
    {Array.from({ length: Math.ceil(tiles.length / 3) }, (_, group) => {
      const items = posts.slice(group * 3, group * 3 + 3);
      const reserved = bentoPattern(items.map(p => p.media[0]), group);
      const measured = items.map(p => p.media[0] ? { ...p.media[0], ...geometry[p.media[0].src] } : undefined);
      let pattern = bentoPattern(measured, group);
      // Unknown geometry may change placement, never the group's reserved height.
      if (pattern.kind === 'portrait-pair' && reserved.kind !== 'portrait-pair') {
        const feature = measured.reduce((best, m, i) => m && (!measured[best] || mediaRatio(m) < mediaRatio(measured[best]!)) ? i : best, 0);
        pattern = { kind: group % 2 ? 'portrait-right' : 'portrait-left', feature };
      }
      return <div key={items[0].id} style={items.length === 3 ? { aspectRatio: reserved.kind === 'portrait-pair' ? .8 : 1.15 } : undefined} className={`post-bento-group post-bento-group--${pattern.kind} post-bento-group--count-${items.length}`} data-feature={pattern.feature} role="presentation">{tiles.slice(group * 3, group * 3 + 3)}</div>;
    })}
  </div>;
  return (
    <div className="post-grid" role="list" aria-label="Posts">
      {tiles}
    </div>
  );
}
