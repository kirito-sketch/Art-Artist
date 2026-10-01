import { motion } from 'framer-motion';
import { ChevronLeft, Heart } from 'lucide-react';
import { useLayoutEffect, useRef, useState } from 'react';
import * as seed from '../../data/seed';
import type { Post } from '../../data/types';
import { useStore } from '../../state/store';
import { party, postWork } from '../../state/selectors';
import { FrameLabel } from '../../ui/compose';
import { shared, spring } from '../../ui/motion';
import { Avatar, IconButton, Photo, Pressable } from '../../ui/primitives';

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
        <StreamPost key={p.id} post={p} anchor={i === index} />
      ))}
      <p className="end">You've seen the latest posts</p>
    </motion.div>
  );
}

function StreamPost({ post, anchor }: { post: Post; anchor: boolean }) {
  const { push } = useStore();
  const author = party(post.authorId)!;
  const work = postWork(post);
  const [liked, setLiked] = useState(false);
  const [page, setPage] = useState(0);
  const many = post.media.length > 1;
  const open = () => push(author.kind === 'org' ? { name: 'org', id: author.id } : { name: 'profile', id: author.id });

  return (
    <article className="stream-post" data-post={post.id}>
      <Pressable className="stream-author" onClick={open} scale={0.98}>
        <Avatar party={author} size={36} />
        <span className="stream-author-text">
          <span className="item-title">{author.name}</span>
          <span className="meta">
            {author.kind === 'person' ? author.role : 'Production house'} · {post.time === 'now' ? 'Just now' : post.time}
          </span>
        </span>
      </Pressable>

      {post.media.length > 0 ? (
        <motion.div className="stream-media" layoutId={anchor ? shared.post(post.id) : undefined} transition={spring.push}>
          <div className="stream-media-track" onScroll={(e) => setPage(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}>
            {post.media.map((m, i) => (
              <Pressable key={m.id + i} className="stream-media-item" onClick={() => push({ name: 'media', items: post.media, index: i })} scale={0.99}>
                <Photo media={m} />
              </Pressable>
            ))}
          </div>
          {many && (
            <span className="stream-media-count">
              <FrameLabel>
                {page + 1} / {post.media.length}
              </FrameLabel>
            </span>
          )}
        </motion.div>
      ) : (
        <motion.div className="stream-note" layoutId={anchor ? shared.post(post.id) : undefined} transition={spring.push}>
          <span className="title-card-rule" />
          <p>{post.text}</p>
        </motion.div>
      )}

      <div className="stream-body">
        {post.media.length > 0 && <p className="stream-caption">{post.text}</p>}
        {work ? (
          <Pressable className="stream-context" onClick={() => push({ name: 'work', id: work.id })} scale={0.98}>
            <span className="stream-context-label">Project</span> {work.title}
          </Pressable>
        ) : post.project ? (
          <p className="stream-context">
            <span className="stream-context-label">Project</span> {post.project}
          </p>
        ) : null}
        <div className="post-actions">
          <motion.button className={`post-action ${liked ? 'is-on' : ''}`} whileTap={{ scale: 0.8 }} transition={spring.press} onClick={() => setLiked((l) => !l)} aria-pressed={liked} aria-label="Like">
            <Heart size={20} fill={liked ? 'currentColor' : 'none'} />
            {post.likes + (liked ? 1 : 0) || null}
          </motion.button>
        </div>
      </div>
    </article>
  );
}
