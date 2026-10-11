import * as seed from '../../data/seed';
import { motion } from 'framer-motion';
import { Bookmark, Heart, MoreHorizontal, Send } from 'lucide-react';
import type { Post } from '../../data/types';
import { useStore } from '../../state/store';
import { party } from '../../state/selectors';
import { spring } from '../../ui/motion';
import { IconButton } from '../../ui/primitives';
import { usePostLike } from '../../state/postLikes';
import { haptic } from '../../ui/haptics';

/**
 * One set of post actions for every placement, always Like, Share, Save, on one Like state (state/postLikes.ts).
 *   row     the production default: a row under the media (Reddit's structure, our tokens), Like with its count on the
 *           left, Share and Save on the right (docs/ux-refinement/PLAN.md D1)
 *   pill    archived: the original frosted pill on the media (Studio, ?actions=pill)
 *   notch   archived: the corner cut-out, Option A (Studio, ?actions=notch, docs/NAV_AND_POST_NOTCH.md)
 *   viewer  its own row in the full-screen video viewer
 * Comments, reposts and votes stay absent: Ana doesn't support them.
 */
export function PostActions({ post, variant = 'row' }: { post: Post; variant?: 'row' | 'pill' | 'notch' | 'viewer' }) {
  const { openSheet, viewer, isSaved, toggleSave, showToast, dismissToast } = useStore();
  const [liked, toggleLike] = usePostLike(viewer.id, post.id);
  const saved = isSaved('post', post.id);
  const author = party(post.authorId);
  const label = `Post by ${author?.name ?? 'someone'}`;
  const likes = post.likes + Number(liked);
  const quiet = variant === 'notch' || variant === 'viewer';
  const counted = variant === 'row' || quiet;
  const share = async () => {
    dismissToast();
    const url = new URL(location.pathname, location.origin);
    url.searchParams.set('post', post.id);
    // Uploaded prototype posts are session-only; don't offer a link that cannot reopen them.
    const persistent = seed.posts.some(p => p.id === post.id);
    if (!persistent) { showToast({ text: 'This prototype post is only available in this session.' }); return; }
    openSheet({ name: 'share', label, url: url.href, card: { title: label, sub: 'Post', image: post.media[0], route: { name: 'posts', ids: [post.id], index: 0 } } });
  };
  const size = quiet ? 22 : 20, stroke = quiet || variant === 'row' ? 1.85 : 2;
  return <div className={`ana-post-actions ana-post-actions--${variant}`}>
    <motion.button whileTap={{ scale: quiet ? .9 : 1.06 }} transition={spring.press} onClick={() => { haptic('toggle'); toggleLike(); }} aria-pressed={liked} aria-label={`${liked ? 'Unlike' : 'Like'} post by ${author?.name ?? 'someone'}${counted && likes > 0 ? `, ${likes} ${likes === 1 ? 'like' : 'likes'}` : ''}`}>
      <motion.span className="ana-post-icon" animate={variant !== 'pill' && liked ? { scale: [1, 1.18, 1] } : { scale: 1 }} transition={{ duration: .28, ease: 'easeOut' }}>
        <Heart size={size} strokeWidth={stroke} fill={liked ? 'currentColor' : 'none'} />
      </motion.span>
      {!quiet && likes > 0 && <span className="ana-post-likes" aria-hidden="true">{likes}</span>}
    </motion.button>
    <motion.button whileTap={{ scale: quiet ? .9 : .94 }} onClick={share} aria-label={`Share post by ${author?.name ?? 'someone'}`}><Send size={quiet ? 21 : 19} strokeWidth={stroke} /></motion.button>
    <motion.button whileTap={{ scale: quiet ? .9 : .94 }} onClick={() => toggleSave(post.id, 'post')} aria-pressed={saved} aria-label={saved ? 'Remove post from saved' : 'Save post'}><Bookmark size={quiet ? 21 : 19} strokeWidth={stroke} fill={saved ? 'currentColor' : 'none'} /></motion.button>
  </div>;
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
