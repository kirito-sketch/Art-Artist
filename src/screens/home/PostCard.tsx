import { useState } from 'react';
import { scriptLang } from '../../ui/compose';
import { mediaName } from '../../ui/a11y';
import type { Post } from '../../data/types';
import { useStore } from '../../state/store';
import { party } from '../../state/selectors';
import { Avatar, Photo, Pressable } from '../../ui/primitives';
import { PostActions, PostMore } from './PostActions';

/** Posts are the secondary layer: no card, no role line. The same actions as the full post. */
export function PostCard({ post }: { post: Post }) {
  const { push } = useStore();
  const author = party(post.authorId)!;
  const [expanded, setExpanded] = useState(false);
  const long = post.text.length > 140;

  return (
    <article className="post">
      <div className="post-head">
        <Pressable className="post-author" onClick={() => push(author.kind === 'org' ? { name: 'org', id: author.id } : { name: 'profile', id: author.id })} scale={0.98}>
          <Avatar party={author} size={36} />
          <span className="post-name">{author.name}</span>
          <span className="meta">{post.time === 'now' ? 'Just now' : post.time}</span>
        </Pressable>
        <PostMore post={post} />
      </div>

      {post.media.length > 0 && (
        <div className={`post-media post-media--${Math.min(post.media.length, 2)}`}>
          {post.media.slice(0, 2).map((m, i) => (
            <Pressable key={m.id} className="post-media-item" onClick={() => push({ name: 'posts', ids: [post.id], index: 0 })} scale={0.98} aria-label={mediaName(m, i, post.media.length, 'Photo', `in ${author.name}'s post`)}>
              <Photo media={m} />
            </Pressable>
          ))}
        </div>
      )}

      {/* Under the work, as on Instagram: the actions first, then the words. A text-only post keeps its words first. */}
      {post.media.length > 0 && <PostActions post={post} />}
      {post.text && (
        <>
          <p className={`post-text ${long && !expanded ? 'is-clamped' : ''}`} lang={scriptLang(post.text)} onClick={() => setExpanded(true)}>
            {post.text}
          </p>
          {/* A real control, so the rest of a long post can be read from the keyboard too. */}
          {long && !expanded && (
            <button className="link post-more-text" onClick={() => setExpanded(true)} aria-label={`Read more of ${author.name}'s post`}>
              More
            </button>
          )}
        </>
      )}

      {post.media.length === 0 && <PostActions post={post} />}
    </article>
  );
}
