import { motion } from 'framer-motion';
import { Heart, MoreHorizontal, Share } from 'lucide-react';
import { useState } from 'react';
import type { Post } from '../../data/types';
import { useStore } from '../../state/store';
import { party } from '../../state/selectors';
import { spring } from '../../ui/motion';
import { IconButton } from '../../ui/primitives';
import { SaveButton } from './OpportunityCard';

/*
 * The post action model (docs/SAVE_MODEL.md): every full post has Like, Share and Save in one
 * quiet row under the work, and More in its header. No comments anywhere. Icons, not pills; the
 * like count is the only number, kept small.
 */
export function PostActions({ post }: { post: Post }) {
  const { openSheet } = useStore();
  const [liked, setLiked] = useState(false);
  const author = party(post.authorId);
  return (
    <div className="post-actions">
      <motion.button className={`post-action ${liked ? 'is-on' : ''}`} whileTap={{ scale: 0.8 }} transition={spring.press} onClick={() => setLiked((l) => !l)} aria-pressed={liked} aria-label={`Like post by ${author?.name ?? 'someone'}`}>
        <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
        {post.likes + (liked ? 1 : 0) || null}
      </motion.button>
      <motion.button className="post-action" whileTap={{ scale: 0.85 }} transition={spring.press} onClick={() => openSheet({ name: 'share', label: `Post by ${author?.name ?? 'someone'}` })} aria-label={`Share post by ${author?.name ?? 'someone'}`}>
        <Share size={19} />
      </motion.button>
      <span className="post-action-save">
        <SaveButton id={post.id} kind="post" name={`post by ${author?.name ?? 'someone'}`} />
      </span>
    </div>
  );
}

/**
 * More: secondary, trust and ownership actions only, never Share or Save again. On someone else's
 * post it holds Report post. Your own post has no supported owner actions yet (no edit or delete in
 * the prototype), so it shows no More at all rather than an empty menu.
 */
export function PostMore({ post }: { post: Post }) {
  const { openSheet, viewer } = useStore();
  if (post.authorId === viewer.id) return null;
  const author = party(post.authorId);
  return (
    <IconButton label={`More options for post by ${author?.name ?? 'someone'}`} className="post-more" onClick={() => openSheet({ name: 'postMore', id: post.id })}>
      <MoreHorizontal size={20} />
    </IconButton>
  );
}
