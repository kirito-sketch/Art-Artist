import * as seed from '../../data/seed';
import { motion } from 'framer-motion';
import { Bookmark, Heart, MoreHorizontal, Send } from 'lucide-react';
import type { Post } from '../../data/types';
import { useStore } from '../../state/store';
import { party } from '../../state/selectors';
import { spring } from '../../ui/motion';
import { IconButton } from '../../ui/primitives';
import { usePostLike } from '../../state/postLikes';

/**
 * One set of post actions for every placement, always Like, Share, Save. `pill` is the frosted pill on the media
 * (default app); `notch` sits in the card's corner cut-out and `viewer` on its own row in the expanded video viewer
 * (Option A, ?actions=notch, docs/NAV_AND_POST_NOTCH.md). Notch and viewer carry the like count in the label only, so
 * the cut-out keeps one width on every post. Comments stay absent until Ana supports a comments experience.
 */
export function PostActions({ post, variant = 'pill' }: { post: Post; variant?: 'pill' | 'notch' | 'viewer' }) {
  const { openSheet, viewer, isSaved, toggleSave, showToast, dismissToast } = useStore();
  const [liked, toggleLike] = usePostLike(viewer.id, post.id);
  const saved = isSaved('post', post.id);
  const author = party(post.authorId);
  const label = `Post by ${author?.name ?? 'someone'}`;
  const likes = post.likes + Number(liked);
  const quiet = variant !== 'pill';
  const share = async () => {
    dismissToast();
    const url = new URL(location.pathname, location.origin);
    url.searchParams.set('post', post.id);
    // Uploaded prototype posts are session-only; don't offer a link that cannot reopen them.
    const persistent = seed.posts.some(p => p.id === post.id);
    if (navigator.share && persistent) {
      try { await navigator.share({ title: label, text: post.text, url: url.href }); return; }
      catch (error) { if (error instanceof DOMException && error.name === 'AbortError') return; }
    }
    if (!persistent) { showToast({ text: 'This prototype post is only available in this session.' }); return; }
    openSheet({ name: 'share', label, url: url.href });
  };
  const size = quiet ? 22 : 20, stroke = quiet ? 1.75 : 2;
  return <div className={`ana-post-actions ana-post-actions--${variant}`}>
    <motion.button whileTap={{ scale: quiet ? .9 : 1.06 }} transition={spring.press} onClick={toggleLike} aria-pressed={liked} aria-label={`${liked ? 'Unlike' : 'Like'} post by ${author?.name ?? 'someone'}${quiet && likes > 0 ? `, ${likes} ${likes === 1 ? 'like' : 'likes'}` : ''}`}>
      <motion.span className="ana-post-icon" animate={quiet && liked ? { scale: [1, 1.18, 1] } : { scale: 1 }} transition={{ duration: .28, ease: 'easeOut' }}>
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
