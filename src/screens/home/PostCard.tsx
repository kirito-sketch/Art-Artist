import { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import { scriptLang } from '../../ui/compose';
import { mediaName } from '../../ui/a11y';
import { postActionPlacement } from '../../domain/postActionPlacement';
import { isPlayableVideo, mediaPresentation, postFrame } from '../../domain/mediaPresentation';
import type { Post } from '../../data/types';
import { useStore } from '../../state/store';
import { party, postWork } from '../../state/selectors';
import { Avatar, Photo, Pressable } from '../../ui/primitives';
import { shared, spring } from '../../ui/motion';
import { PostActions, PostMore } from './PostActions';
import { FeedVideo } from './FeedVideo';
import { POST_NOTCH } from '../../ui/preview';

function PostVideo({ src, label, fit, position, onMetadata, poster }: { poster?: string; src: string; label: string; fit: 'cover' | 'contain'; position: string; onMetadata: (video: HTMLVideoElement) => void }) {
  const ref = useRef<HTMLVideoElement>(null);
  useEffect(() => {
    const video = ref.current;
    if (!video) return;
    const observer = new IntersectionObserver(([entry]) => { if (!entry.isIntersecting) video.pause(); }, { threshold: .1 });
    observer.observe(video);
    return () => { observer.disconnect(); video.pause(); };
  }, []);
  return <video ref={ref} src={src} poster={poster} controls playsInline preload="metadata" onLoadedMetadata={e => onMetadata(e.currentTarget)} aria-label={label} style={{ objectFit: fit, objectPosition: position }} />;
}

/** One post presentation for Home, Discover, Profile and public Project pages. */
export function PostCard({ post, anchor = false }: { post: Post; anchor?: boolean }) {
  const { push } = useStore();
  const author = party(post.authorId)!;
  const work = postWork(post);
  const [expanded, setExpanded] = useState(false);
  const [page, setPage] = useState(0);
  const track = useRef<HTMLDivElement>(null);
  const [frame, setFrame] = useState({ width: 0, height: 0 });
  const [geometry, setGeometry] = useState<Record<string, { width: number; height: number }>>({});
  useEffect(() => {
    const node = track.current;
    if (!node) return;
    const observer = new ResizeObserver(() => setFrame(previous => previous.width === node.clientWidth && previous.height === node.clientHeight ? previous : { width: node.clientWidth, height: node.clientHeight }));
    observer.observe(node);
    return () => observer.disconnect();
  }, [post.id, post.media.length]);
  const rememberGeometry = (id: string, width: number, height: number) => {
    if (width && height) setGeometry(previous => previous[id]?.width === width && previous[id]?.height === height ? previous : { ...previous, [id]: { width, height } });
  };
  const long = post.text.length > 140;
  const hasMedia = post.media.length > 0;
  const ratio = postFrame(post.media, post.presentation);
  const video = !!post.media[page] && isPlayableVideo(post.media[page]);
  const current = post.media[page];
  const policy = current ? mediaPresentation(current, 'post', ratio) : undefined;
  // Option A (?actions=notch): the actions live in a fixed corner cut-out, so the pill's focal-point placement is not used.
  const actionPlacement = POST_NOTCH ? { bottom: 0, side: 'right' as const } : postActionPlacement(current ? { ...current, ...geometry[current.id], focal: policy?.focal } : undefined, frame, video, policy?.fit);
  const identity = <Pressable className="ana-post-author" onClick={() => push(author.kind === 'org' ? { name: 'org', id: author.id } : { name: 'profile', id: author.id })} scale={0.98} aria-label={`View ${author.name}'s profile`}>
    <Avatar party={author} size={32} />
    <span><strong>{author.name}</strong><small>{author.kind === 'person' ? author.role : 'Production house'} · {post.time === 'now' ? 'Just now' : post.time}</small></span>
  </Pressable>;
  return <article className={`ana-post ${hasMedia ? '' : 'ana-post--text'}`} data-post={post.id}>
    <header className="ana-post-head">{identity}<PostMore post={post} /></header>
    {hasMedia ? <motion.div className={`ana-post-stage ${video ? 'ana-post-stage--video' : ''} ${POST_NOTCH ? 'ana-post-stage--notch' : ''} ${actionPlacement.side === 'left' ? 'ana-post-stage--actions-left' : ''}`} layoutId={anchor ? shared.post(post.id) : undefined} transition={spring.push} style={POST_NOTCH ? undefined : { '--post-action-bottom': `${actionPlacement.bottom}px` } as import('react').CSSProperties}>
      <div className="ana-post-track" ref={track} style={{ aspectRatio: ratio }} tabIndex={post.media.length > 1 ? 0 : undefined} role={post.media.length > 1 ? 'region' : undefined} aria-label={post.media.length > 1 ? 'Post media. Swipe or use left and right arrow keys.' : undefined}
        onKeyDown={e => { if (e.target !== e.currentTarget || !['ArrowLeft', 'ArrowRight'].includes(e.key)) return; e.preventDefault(); const next = Math.max(0, Math.min(post.media.length - 1, page + (e.key === 'ArrowRight' ? 1 : -1))); track.current?.scrollTo({ left: next * track.current.clientWidth, behavior: 'smooth' }); }}
        onScroll={e => { const el = e.currentTarget; const next = Math.round(el.scrollLeft / el.clientWidth); setPage(Math.max(0, Math.min(post.media.length - 1, next))); el.querySelectorAll('video').forEach(v => { if (Number(v.closest<HTMLElement>('.ana-post-slide')?.dataset.index) !== next) v.pause(); }); }}>
        {post.media.map((m, i) => <div key={`${m.id}-${i}`} className="ana-post-slide" data-index={i}>
          {isPlayableVideo(m) && POST_NOTCH ? <FeedVideo post={post} index={i} media={m} label={mediaName(m, i, post.media.length, 'Video', `in ${author.name}'s post`)} fit={mediaPresentation(m, 'post', ratio).fit} position={mediaPresentation(m, 'post', ratio).position} onMetadata={video => rememberGeometry(m.id, video.videoWidth, video.videoHeight)} /> : isPlayableVideo(m) ? <PostVideo src={m.src} poster={m.poster} label={mediaName(m, i, post.media.length, 'Video', `in ${author.name}'s post`)} fit={mediaPresentation(m, 'post', ratio).fit} position={mediaPresentation(m, 'post', ratio).position} onMetadata={video => rememberGeometry(m.id, video.videoWidth, video.videoHeight)} /> : <Photo media={m} alt={mediaName(m, i, post.media.length, 'Photo', `in ${author.name}'s post`)} showPlay={false} surface="post" frameRatio={ratio} onImageLoad={image => rememberGeometry(m.id, image.naturalWidth, image.naturalHeight)} />}
        </div>)}
      </div>
      {post.media.length > 1 && <span className="ana-post-index" aria-live="polite">{page + 1} / {post.media.length}</span>}
      <PostActions post={post} variant={POST_NOTCH ? 'notch' : 'pill'} />
    </motion.div> : null}

    {post.text && <div className="ana-post-copy"><p className={`ana-post-caption ${long && !expanded ? 'is-clamped' : ''}`} lang={scriptLang(post.text)}>{post.text}</p>
      {long && !expanded && <button className="link ana-post-expand" onClick={() => setExpanded(true)} aria-label={`Read more of ${author.name}'s post`}>More</button>}
    </div>}
    {work ? <Pressable className="ana-post-context" onClick={() => push({ name: 'work', id: work.id })} scale={.98}><small>Project</small><strong>{work.title}</strong></Pressable> : post.project ? <p className="ana-post-context"><small>Project</small><strong>{post.project}</strong></p> : null}
    {!hasMedia && <PostActions post={post} variant={POST_NOTCH ? 'notch' : 'pill'} />}
  </article>;
}
