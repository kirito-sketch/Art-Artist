import { Layers, Play } from 'lucide-react';
import type { Post } from '../../data/types';
import { party } from '../../state/selectors';
import { Photo, PressCard } from '../../ui/primitives';

/*
 * Discover → Posts as a contact sheet: a tight three-column grid of the work itself. No captions,
 * no counters, no cards. A small mark tells a set of frames or a clip from a single still. A post
 * without media is set as a quiet note tile, never an empty box.
 */
export function PostGrid({ posts, onOpen }: { posts: Post[]; onOpen: (index: number) => void }) {
  return (
    <div className="post-grid" role="list" aria-label="Posts">
      {posts.map((p, i) => {
        const first = p.media[0];
        const author = party(p.authorId);
        const kind = !first ? 'note' : first.kind === 'video' ? 'video' : p.media.length > 1 ? 'set' : 'still';
        const label = `${author?.name ?? 'Post'}${kind === 'video' ? ', video' : kind === 'set' ? `, ${p.media.length} images` : ''}: ${p.text.slice(0, 80)}`;
        return (
          <PressCard key={p.id} className={`post-tile post-tile--${kind}`} onPress={() => onOpen(i)} scale={0.97} aria-label={label} role="listitem">
            {first ? <Photo media={first} showPlay={false} /> : <span className="post-tile-note">{p.text}</span>}
            {kind === 'set' && (
              <span className="post-tile-mark" aria-hidden>
                <Layers size={14} strokeWidth={2.4} />
              </span>
            )}
            {kind === 'video' && (
              <span className="post-tile-mark" aria-hidden>
                <Play size={12} fill="currentColor" strokeWidth={0} />
              </span>
            )}
          </PressCard>
        );
      })}
    </div>
  );
}
