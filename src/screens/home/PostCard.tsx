import { motion } from 'framer-motion';
import { Heart } from 'lucide-react';
import { useState } from 'react';
import type { Post } from '../../data/types';
import { useStore } from '../../state/store';
import { party } from '../../state/selectors';
import { spring } from '../../ui/motion';
import { Avatar, Photo, Pressable } from '../../ui/primitives';

/** Posts are the secondary layer: no card, no role line, two quiet actions. */
export function PostCard({ post }: { post: Post }) {
  const { push } = useStore();
  const author = party(post.authorId)!;
  const [liked, setLiked] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const long = post.text.length > 140;

  return (
    <article className="post">
      <Pressable className="post-author" onClick={() => push(author.kind === 'org' ? { name: 'org', id: author.id } : { name: 'profile', id: author.id })} scale={0.98}>
        <Avatar party={author} size={36} />
        <span className="post-name">{author.name}</span>
        <span className="meta">{post.time === 'now' ? 'Just now' : post.time}</span>
      </Pressable>

      {post.text && (
        <p className={`post-text ${long && !expanded ? 'is-clamped' : ''}`} onClick={() => setExpanded(true)}>
          {post.text}
        </p>
      )}

      {post.media.length > 0 && (
        <div className={`post-media post-media--${Math.min(post.media.length, 2)}`}>
          {post.media.slice(0, 2).map((m, i) => (
            <Pressable key={m.id} className="post-media-item" onClick={() => push({ name: 'media', items: post.media, index: i })} scale={0.98}>
              <Photo media={m} />
            </Pressable>
          ))}
        </div>
      )}

      <div className="post-actions">
        <motion.button className={`post-action ${liked ? 'is-on' : ''}`} whileTap={{ scale: 0.8 }} transition={spring.press} onClick={() => setLiked((l) => !l)} aria-pressed={liked} aria-label="Like">
          <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
          {post.likes + (liked ? 1 : 0) || null}
        </motion.button>
      </div>
    </article>
  );
}
