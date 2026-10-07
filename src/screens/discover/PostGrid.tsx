import { motion } from 'framer-motion';
import { Layers, Play } from 'lucide-react';
import { shared, spring } from '../../ui/motion';
import type { Post } from '../../data/types';
import { party } from '../../state/selectors';
import { Photo, PressCard } from '../../ui/primitives';

/*
 * Discover → Posts as a contact sheet: a tight three-column grid of the work itself. No captions,
 * no counters, no cards. A small mark tells a set of frames or a clip from a single still. A post
 * without media is set as a quiet note tile, never an empty box.
 */
export function PostGrid({ posts, onOpen, bento = false }: { posts: Post[]; onOpen: (index: number) => void; bento?: boolean }) {
  const tiles = posts.map((p, i) => {
    const first = p.media[0];
    const author = party(p.authorId);
    const kind = !first ? 'note' : first.kind === 'video' ? 'video' : p.media.length > 1 ? 'set' : 'still';
    const label = `${author?.name ?? 'Post'}${kind === 'video' ? ', video' : kind === 'set' ? `, ${p.media.length} images` : ''}: ${p.text.slice(0, 80)}`;
    return <PressCard key={p.id} className={`post-tile post-tile--${kind}`} onPress={() => onOpen(i)} scale={0.97} aria-label={label} role="listitem" data-post-id={p.id}>
      <motion.div className="post-tile-media" layoutId={shared.post(p.id)} transition={spring.push}>
        {bento && first && <div className="post-tile-atmosphere" aria-hidden><Photo media={first} showPlay={false} /></div>}
        {first ? <Photo media={first} showPlay={false} /> : <span className="post-tile-note">{p.text}</span>}
      </motion.div>
      {kind === 'set' && <span className="post-tile-mark" aria-hidden><Layers size={14} strokeWidth={2.4} /></span>}
      {kind === 'video' && <span className="post-tile-mark" aria-hidden><Play size={12} fill="currentColor" strokeWidth={0} /></span>}
    </PressCard>;
  });
  // Result order stays intact. Every group of three cycles left, right, then wide.
  // This is layout rhythm, never a ranking or a paid placement.
  if (bento) return <div className="post-grid post-grid--bento" role="list" aria-label="Posts">
    {Array.from({ length: Math.ceil(tiles.length / 3) }, (_, group) => <div key={posts[group * 3].id} className={`post-bento-group post-bento-group--${group % 3} post-bento-group--count-${Math.min(3, tiles.length - group * 3)}`} role="presentation">{tiles.slice(group * 3, group * 3 + 3)}</div>)}
  </div>;
  return (
    <div className="post-grid" role="list" aria-label="Posts">
      {tiles}
    </div>
  );
}
