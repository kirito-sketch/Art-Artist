import { motion } from 'framer-motion';
import { Layers, Play } from 'lucide-react';
import { shared, spring } from '../../ui/motion';
import type { Post } from '../../data/types';
import { party } from '../../state/selectors';
import { Photo, PressCard } from '../../ui/primitives';
import { bentoGroups } from '../../domain/bentoLayout';

/** Source-aware derived previews. DOM and opening indexes preserve result order. */
export function PostGrid({ posts, onOpen, bento = false }: { posts: Post[]; onOpen: (index: number) => void; bento?: boolean }) {
  const tile = (post: Post, index: number, slot?: number, frameRatio = 1) => {
      const first = post.media[0], author = party(post.authorId);
      const kind = !first ? 'note' : first.kind === 'video' ? 'video' : post.media.length > 1 ? 'set' : 'still';
      const label = `${author?.name ?? 'Post'}${kind === 'video' ? ', video' : kind === 'set' ? `, ${post.media.length} images` : ''}: ${post.text.slice(0,80)}`;
      return <PressCard key={post.id} className={`post-tile post-tile--${kind}`} data-slot={slot} data-post-id={post.id} role="listitem" onPress={() => onOpen(index)} scale={.97} aria-label={label}>
        <motion.div className="post-tile-media" layoutId={shared.post(post.id)} transition={spring.push}>{first ? <Photo media={first} surface={bento ? 'discover-bento' : 'search-thumbnail'} frameRatio={frameRatio} showPlay={false} /> : <span className="post-tile-note">{post.text}</span>}</motion.div>
        {kind === 'set' && <span className="post-tile-mark" aria-hidden><Layers size={14} /></span>}{kind === 'video' && <span className="post-tile-mark" aria-hidden><Play size={12} fill="currentColor" /></span>}
      </PressCard>;
  };
  return <div className={`post-grid ${bento ? 'post-grid--bento' : ''}`} role="list" aria-label="Posts">
    {bento ? <div className="media-bento" role="presentation">
      {bentoGroups(posts).map(group => <div key={posts[group.start].id} className="bento-group" data-pattern={group.pattern} style={{ aspectRatio: group.ratio }} role="presentation">
        {posts.slice(group.start, group.start + group.count).map((post, slot) => tile(post, group.start + slot, slot, group.slots[slot]))}
      </div>)}
    </div> : <div className="post-grid-inner" style={{ display: 'contents' }}>{posts.map((post, index) => tile(post, index))}</div>}
  </div>;
}
