import { motion } from 'framer-motion';
import { Layers, Play } from 'lucide-react';
import { shared, spring } from '../../ui/motion';
import type { Post } from '../../data/types';
import { party } from '../../state/selectors';
import { Photo, PressCard } from '../../ui/primitives';
import { bentoTile } from '../../domain/mediaPresentation';

/** Source-aware derived previews. DOM and opening indexes preserve result order. */
export function PostGrid({ posts, onOpen, bento = false }: { posts: Post[]; onOpen: (index: number) => void; bento?: boolean }) {
  return <div className={`post-grid ${bento ? 'post-grid--bento' : ''}`} role="list" aria-label="Posts"><div className={bento ? 'media-bento' : 'post-grid-inner'} style={!bento ? { display: 'contents' } : undefined}>
    {posts.map((post, index) => {
      const first = post.media[0], author = party(post.authorId), tile = bentoTile(first,index,posts.length);
      const kind = !first ? 'note' : first.kind === 'video' ? 'video' : post.media.length > 1 ? 'set' : 'still';
      const label = `${author?.name ?? 'Post'}${kind === 'video' ? ', video' : kind === 'set' ? `, ${post.media.length} images` : ''}: ${post.text.slice(0,80)}`;
      return <PressCard key={post.id} className={`post-tile post-tile--${kind}`} style={bento ? { aspectRatio: tile.ratio } : undefined} data-shape={tile.shape} data-span={tile.span} data-post-id={post.id} role="listitem" onPress={() => onOpen(index)} scale={.97} aria-label={label}>
        <motion.div className="post-tile-media" layoutId={shared.post(post.id)} transition={spring.push}>{first ? <Photo media={first} surface={bento ? 'discover-bento' : 'search-thumbnail'} frameRatio={bento ? tile.ratio : 1} showPlay={false} /> : <span className="post-tile-note">{post.text}</span>}</motion.div>
        {kind === 'set' && <span className="post-tile-mark" aria-hidden><Layers size={14} /></span>}{kind === 'video' && <span className="post-tile-mark" aria-hidden><Play size={12} fill="currentColor" /></span>}
      </PressCard>;
    })}
  </div></div>;
}
