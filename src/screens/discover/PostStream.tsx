import { motion } from 'framer-motion';
import { ChevronLeft } from 'lucide-react';
import { useLayoutEffect, useRef } from 'react';
import * as seed from '../../data/seed';
import type { Post } from '../../data/types';
import { useStore } from '../../state/store';
import { PostCard } from '../home/PostCard';
import { IconButton } from '../../ui/primitives';

/*
 * Discover → Posts, opened: the grid hides everything but the work; the stream shows the rest.
 * It opens at the tapped post and keeps going through the ones after it (and before it, above), so
 * browsing continues instead of bouncing between a grid and single modals. Back returns to the grid
 * exactly where it was: the Discover tab stays mounted underneath.
 */
export function PostStream({ ids, index }: { ids: string[]; index: number }) {
  const { pop, userPosts } = useStore();
  const posts = ids.map((id) => userPosts.find((p) => p.id === id) ?? seed.posts.find((p) => p.id === id)).filter(Boolean) as Post[];
  const ref = useRef<HTMLDivElement>(null);

  // Open at the selected post, not at the top of the stream.
  useLayoutEffect(() => {
    const el = ref.current?.querySelector<HTMLElement>(`[data-post="${ids[index]}"]`);
    const bar = ref.current?.querySelector<HTMLElement>('.stream-bar');
    if (el && ref.current) ref.current.scrollTop = el.offsetTop - (bar?.offsetHeight ?? 0);
  }, [ids, index]);

  return (
    <motion.div className="screen canvas post-stream" ref={ref} layoutScroll>
      <header className="topbar topbar--nav stream-bar">
        <IconButton label="Back to posts" onClick={pop}>
          <ChevronLeft size={26} />
        </IconButton>
        <span className="stream-bar-title">Posts</span>
        <span className="stream-bar-spacer" />
      </header>
      {posts.map((p, i) => (
        <PostCard key={p.id} post={p} anchor={i === index} />
      ))}
      <p className="end">You've seen the latest posts</p>
    </motion.div>
  );
}
