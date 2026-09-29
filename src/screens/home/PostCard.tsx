import { motion } from 'framer-motion';
import { Heart, MessageCircle, MoreHorizontal, Send } from 'lucide-react';
import { useState } from 'react';
import type { Post } from '../../data/types';
import { useStore } from '../../state/store';
import { person } from '../../state/selectors';
import { Avatar, IconButton, Pressable } from '../../ui/primitives';
import { Still } from '../../ui/Still';
import { spring } from '../../ui/motion';
import { SaveButton } from './OpportunityCard';

/** Posts are the secondary layer: smaller type, tighter media, no oversized engagement chrome. */
export function PostCard({ post }: { post: Post }) {
  const { push, showToast } = useStore();
  const author = person(post.authorId);
  const [liked, setLiked] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const long = post.text.length > 140;

  const openMedia = (index: number) => push({ name: 'media', items: post.media, index });

  return (
    <article className="post">
      <header className="post-head">
        <Pressable className="post-author" onClick={() => push({ name: 'profile', id: author.id })} scale={0.97}>
          <Avatar party={author} size={32} />
          <span>
            <span className="post-name">{author.name}</span>
            <span className="post-meta">
              {author.role} · {post.time === 'now' ? 'just now' : `${post.time} ago`}
            </span>
          </span>
        </Pressable>
        <IconButton label="Post options" className="icon-btn--ghost" onClick={() => showToast({ text: 'Options: share, report, mute' })}>
          <MoreHorizontal size={18} />
        </IconButton>
      </header>

      {post.text && (
        <>
          <p className={`post-text ${long && !expanded ? 'post-text--clamped' : ''}`}>{post.text}</p>
          {long && !expanded && (
            <button className="post-more" onClick={() => setExpanded(true)}>
              Read more
            </button>
          )}
        </>
      )}

      {post.media.length === 1 && (
        <Pressable className="post-media" onClick={() => openMedia(0)} scale={0.985}>
          <Still media={post.media[0]} />
        </Pressable>
      )}
      {post.media.length > 1 && (
        <div className="post-gallery">
          {post.media.map((m, i) => (
            <Pressable key={m.id} className="post-gallery-item" onClick={() => openMedia(i)} scale={0.97}>
              <Still media={m} />
            </Pressable>
          ))}
        </div>
      )}

      {post.project && <p className="post-project">On {post.project}</p>}

      <footer className="post-actions">
        <motion.button
          className={`post-action ${liked ? 'is-liked' : ''}`}
          whileTap={{ scale: 0.8 }}
          transition={spring.press}
          onClick={() => setLiked((l) => !l)}
          aria-pressed={liked}
          aria-label="Appreciate"
        >
          <motion.span key={String(liked)} initial={{ scale: liked ? 0.5 : 1 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 700, damping: 12 }}>
            <Heart size={17} fill={liked ? 'currentColor' : 'none'} />
          </motion.span>
          {post.likes + (liked ? 1 : 0) || ''}
        </motion.button>
        <button className="post-action" aria-label="Comments">
          <MessageCircle size={17} />
          {post.comments || ''}
        </button>
        <button className="post-action" aria-label="Share" onClick={() => showToast({ text: 'Share sheet' })}>
          <Send size={16} />
        </button>
        <span className="flex-spacer" />
        <SaveButton id={post.id} size={16} />
      </footer>
    </article>
  );
}
