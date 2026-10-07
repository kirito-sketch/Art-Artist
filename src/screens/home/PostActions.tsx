import * as seed from '../../data/seed';
import { motion } from 'framer-motion';
import { Bookmark, Heart, MoreHorizontal, Send } from 'lucide-react';
import type { Post } from '../../data/types';
import { useStore } from '../../state/store';
import { party } from '../../state/selectors';
import { spring } from '../../ui/motion';
import { IconButton } from '../../ui/primitives';
import { usePostLike } from '../../state/postLikes';

/** Compact shared actions. Comments stay absent until Ana supports a comments experience. */
export function PostActions({ post }: { post: Post }) {
  const { openSheet, viewer, isSaved, toggleSave, showToast, dismissToast } = useStore();
  const [liked, toggleLike] = usePostLike(viewer.id, post.id);
  const saved = isSaved('post', post.id);
  const author = party(post.authorId);
  const label = `Post by ${author?.name ?? 'someone'}`;
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
  return <div className="ana-post-actions">
    <motion.button whileTap={{ scale: .92 }} transition={spring.press} onClick={toggleLike} aria-pressed={liked} aria-label={`${liked ? 'Unlike' : 'Like'} post by ${author?.name ?? 'someone'}`}>
      <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
      {post.likes + Number(liked) > 0 && <span className="ana-post-likes" aria-hidden="true">{post.likes + Number(liked)}</span>}
    </motion.button>
    <motion.button whileTap={{ scale: .94 }} onClick={share} aria-label={`Share post by ${author?.name ?? 'someone'}`}><Send size={19} /></motion.button>
    <motion.button whileTap={{ scale: .94 }} onClick={() => toggleSave(post.id, 'post')} aria-pressed={saved} aria-label={saved ? 'Remove post from saved' : 'Save post'}><Bookmark size={19} fill={saved ? 'currentColor' : 'none'} /></motion.button>
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
