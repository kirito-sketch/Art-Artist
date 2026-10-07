import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { scriptLang } from '../../ui/compose';
import { mediaName } from '../../ui/a11y';
import { mediaFit, mediaPosition, mediaRatio } from '../../domain/mediaLayout';
import type { Post } from '../../data/types';
import { useStore } from '../../state/store';
import { party, postWork } from '../../state/selectors';
import { Avatar, Photo, Pressable } from '../../ui/primitives';
import { shared, spring } from '../../ui/motion';
import { PostActions, PostMore } from './PostActions';

function PostVideo({ src, label, fit, position }: { src: string; label: string; fit: 'cover' | 'contain'; position: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) video.pause(); }, { threshold: .1 });
    observer.observe(video);
    return () => { observer.disconnect(); video.pause(); };
  }, []);
  return <video ref={ref} src={src} controls playsInline preload="metadata" aria-label={label} style={{ objectFit: fit, objectPosition: position }} />;
}

/** One post presentation for Home, Discover, Profile and public Project pages. */
export function PostCard({ post, anchor = false }: { post: Post; anchor?: boolean }) {
  const { push } = useStore();
  const author = party(post.authorId)!;
  const work = postWork(post);
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const long = post.text.length > 140;
  const hasMedia = post.media.length > 0;
  const playable = (src: string) => /\.(mp4|webm)(?:[?#]|$)/i.test(src) || src.startsWith('blob:') || src.startsWith('data:video/');
  const video = post.media[page]?.kind === 'video' && playable(post.media[page].src);
  const identity = <Pressable className="ana-post-author" onClick={() => push(author.kind === 'org' ? { name: 'org', id: author.id } : { name: 'profile', id: author.id })} scale={0.98} aria-label={`View ${author.name}'s profile`}>
    <Avatar party={author} size={32} />
    <span><strong>{author.name}</strong><small>{author.kind === 'person' ? author.role : 'Production house'} · {post.time === 'now' ? 'Just now' : post.time}</small></span>
  </Pressable>;
  return <article className={`ana-post ${hasMedia ? '' : 'ana-post--text'}`} data-post={post.id}>
    {hasMedia ? <motion.div className={`ana-post-stage ${video ? 'ana-post-stage--video' : ''}`} layoutId={anchor ? shared.post(post.id) : undefined} transition={spring.push}>
      <div className="ana-post-track" ref={track} style={{ aspectRatio: Math.max(.75, Math.min(1.5, mediaRatio(post.media[0]))) }} tabIndex={post.media.length > 1 ? 0 : undefined} role={post.media.length > 1 ? 'region' : undefined} aria-label={post.media.length > 1 ? 'Post media. Swipe or use left and right arrow keys.' : undefined}
        onKeyDown={e => { if (e.target !== e.currentTarget || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return; e.preventDefault(); const next = Math.max(0, Math.min(post.media.length - 1, page + (e.key === 'ArrowRight' ? 1 : -1))); track.current?.scrollTo({ left: next * track.current.clientWidth, behavior: 'smooth' }); }}
        onScroll={e => { const el = e.currentTarget; const next = Math.round(el.scrollLeft / el.clientWidth); setPage(Math.max(0, Math.min(post.media.length - 1, next))); el.querySelectorAll('video').forEach(v => { if (Number(v.closest<HTMLElement>('.ana-post-slide')?.dataset.index) !== next) v.pause(); }); }}>
        {post.media.map((m, i) => <div key={`${m.id}-${i}`} className="ana-post-slide" data-index={i}>
          {m.kind === 'video' && playable(m.src) ? <PostVideo src={m.src} label={mediaName(m, i, post.media.length, 'Video', `in ${author.name}'s post`)} fit={mediaFit(m)} position={mediaPosition(m)} /> : <Photo media={m} alt={mediaName(m, i, post.media.length, 'Photo', `in ${author.name}'s post`)} showPlay={false} imageFit={mediaFit(m)} />}
        </div>)}
      </div>
      {identity}<div className="ana-post-more"><PostMore post={post} /></div>
      {post.media.length > 1 && <span className="ana-post-index" aria-live="polite">{page + 1} / {post.media.length}</span>}
      <PostActions post={post} />
    </motion.div> : <div className="ana-post-text-head">{identity}<PostMore post={post} /></div>}
    {post.text && <div className="ana-post-copy"><p className={`ana-post-caption ${long && !expanded ? 'is-clamped' : ''}`} lang={scriptLang(post.text)}>{post.text}</p>
      {long && !expanded && <button className="link ana-post-expand" onClick={() => setExpanded(true)} aria-label={`Read more of ${author.name}'s post`}>More</button>}
    </div>}
    {work ? <Pressable className="ana-post-context" onClick={() => push({ name: 'work', id: work.id })} scale={.98}><small>Project</small><strong>{work.title}</strong></Pressable> : post.project ? <p className="ana-post-context"><small>Project</small><strong>{post.project}</strong></p> : null}
    {!hasMedia && <PostActions post={post} />}
  </article>;
}
