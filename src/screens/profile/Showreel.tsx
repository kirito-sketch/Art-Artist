import { MediaFramingEditor } from '../../ui/MediaFraming';
import { Link2, Play, Upload } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { videoEmbed, videoLink } from '../../domain/showreel';
import { profiles, type Reel } from '../../state/profile';
import { Button, Photo, Row } from '../../ui/primitives';
import { Sheet } from '../../ui/Sheet';
import { previewVideo } from '../../ui/showreelPreview';
import { MediaPicker } from '../../ui/MediaPicker';

export function ShowreelMedia({ reel, privateDraft = false, active = true, startPlaying = false }: { reel: Reel; privateDraft?: boolean; active?: boolean; startPlaying?: boolean }) {
  const [playing, setPlaying] = useState(startPlaying);
  const [failed, setFailed] = useState(false);
  const native = reel.source?.kind === 'native';
  const ready = !native || reel.source?.kind === 'native' && reel.source.status === 'ready';
  const embed = videoEmbed(reel.source, reel.url);
  useEffect(() => { setPlaying(startPlaying); setFailed(false); }, [reel.url, startPlaying]);
  useEffect(() => { if (!active) setPlaying(false); }, [active]);
  useEffect(() => {
    const hide = () => { if (document.hidden) setPlaying(false); };
    document.addEventListener('visibilitychange', hide);
    return () => document.removeEventListener('visibilitychange', hide);
  }, []);
  if (!ready && !privateDraft) return null;
  const playable = native ? !!reel.url : !!embed;
  return <div className="ana-showreel">
    {playing ? <>
      <div className="ana-reel-player">
        {native ? <video src={reel.url} controls playsInline autoPlay poster={reel.cover?.src} onError={() => setFailed(true)} /> : <iframe src={`${embed}${embed?.includes('?') ? '&' : '?'}autoplay=1`} title={reel.title} allow="autoplay; fullscreen; picture-in-picture; encrypted-media" allowFullScreen referrerPolicy="strict-origin-when-cross-origin" />}
      </div>
      {failed && <p className="meta" role="alert">This video could not play. Try replacing it with an MP4 export.</p>}
      <div className="ana-reel-player-actions"><Button size="s" variant="plain" onClick={() => setPlaying(false)}>Close player</Button>{!native && <a className="link link--small" href={reel.url} target="_blank" rel="noopener noreferrer">Open on {videoLink(reel.url)?.source.provider === 'youtube' ? 'YouTube' : 'Vimeo'}</a>}</div>
    </> : <button className="reel ana-reel-cover" onClick={() => setPlaying(true)} disabled={!playable} aria-label={`Play showreel, ${reel.title}${reel.duration ? `, ${reel.duration}` : ''}`}>
      {reel.cover ? <Photo surface="showreel" media={reel.cover} showPlay={false} /> : <span className="reel-blank" />}
      <span className="reel-play" aria-hidden><Play size={20} fill="currentColor" strokeWidth={0} /></span>
      <span className="reel-caption"><span className="item-title">{reel.title}</span><span className="reel-sub">{playable ? ['Play showreel', reel.duration].filter(Boolean).join(' · ') : 'Video link unavailable'}</span></span>
    </button>}
    {native && !ready && <p className="meta ana-reel-draft">Private device preview · not uploaded or published</p>}
    {reel.source?.kind === 'native' && reel.source.status === 'uploading' && <div role="status"><label className="meta">Uploading <progress value={reel.source.progress ?? 0} max={100} /></label></div>}
    {reel.source?.kind === 'native' && reel.source.status === 'processing' && <p className="meta" role="status">Processing video. Your current showreel stays public.</p>}
    {reel.source?.kind === 'native' && reel.source.status === 'failed' && <p className="meta" role="alert">{reel.source.error ?? 'Upload failed. Your draft is kept.'}</p>}
  </div>;
}

/** Parents that keep onboarding state across Back own these resources until that flow ends. */
export function releaseUnusedShowreelPreviews(urls: Set<string>) {
  for (const url of urls) if (!Object.values(profiles).some((p) => p.reelDraft?.url === url || p.reel?.url === url)) URL.revokeObjectURL(url);
}

/** Editor shared by optional onboarding and Edit Profile. Parent owns the unsaved draft. */
export function ShowreelManager({ value, draft, onChange, onDraftChange, previewUrls }: { value?: Reel; draft?: Reel; onChange: (reel?: Reel) => void; onDraftChange: (reel?: Reel) => void; previewUrls?: Set<string> }) {
  const [sources, setSources] = useState(false);
  const [edit, setEdit] = useState<Reel | null>(null);
  const [cover, setCover] = useState(false);
  const [loading, setLoading] = useState(false);
  const [metadata, setMetadata] = useState<'idle' | 'loading' | 'loaded' | 'unavailable'>('idle');
  const [error, setError] = useState('');
  const input = useRef<HTMLInputElement>(null);
  const titleEdited = useRef(false);
  const files = useRef(previewUrls ?? new Set<string>());
  const inspection = useRef<AbortController | null>(null);
  const link = edit?.source?.kind === 'native' ? null : videoLink(edit?.url ?? '');
  const canonical = link?.url;
  useEffect(() => () => {
    inspection.current?.abort();
    if (!previewUrls) releaseUnusedShowreelPreviews(files.current);
  }, [previewUrls]);
  useEffect(() => {
    setMetadata('idle');
    if (!canonical) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setMetadata('loading');
      try {
        const response = await fetch(`/api/showreel?url=${encodeURIComponent(canonical)}`, { signal: controller.signal });
        if (!response.ok) throw new Error('unavailable');
        const data = await response.json() as { title?: string; thumbnail?: string; duration?: string };
        if (controller.signal.aborted) return;
        setEdit((old) => old && videoLink(old.url)?.url === canonical ? { ...old, title: !titleEdited.current && data.title ? data.title : old.title, cover: old.cover ?? (data.thumbnail ? { id: `reel-cover-${old.id}`, kind: 'image', src: data.thumbnail } : undefined), duration: data.duration ?? old.duration } : old);
        setMetadata('loaded');
      } catch { if (!controller.signal.aborted) setMetadata('unavailable'); }
    }, 500);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [canonical]);
  const close = () => { inspection.current?.abort(); setLoading(false); setError(''); setEdit(null); };
  const start = (reel: Reel) => { titleEdited.current = !!reel.url; setError(''); setEdit({ ...reel }); };
  const choose = async (file: File) => {
    inspection.current?.abort();
    const controller = new AbortController(); inspection.current = controller;
    setLoading(true); setError('');
    try {
      const next = await previewVideo(file, controller.signal);
      if (controller.signal.aborted) { URL.revokeObjectURL(next.url); return; }
      files.current.add(next.url); setEdit((old) => ({ ...next, title: titleEdited.current && old ? old.title : next.title }));
    } catch (e) { if (!controller.signal.aborted) setError(e instanceof Error ? e.message : 'Choose another video.'); }
    finally { if (!controller.signal.aborted) setLoading(false); }
  };
  return <>

    {value && <><ShowreelMedia reel={value} /><Button size="s" variant="secondary" onClick={() => start(value)}>Edit showreel</Button></>}
    {draft && <div className="ana-reel-pending"><p className="field-label">Replacement draft</p><ShowreelMedia reel={draft} privateDraft /><Button size="s" variant="secondary" onClick={() => start(draft)}>Edit draft</Button></div>}
    {!value && !draft && <Button variant="secondary" onClick={() => setSources(true)}>+ Add showreel</Button>}
    <Sheet className="ana-work-sheet" open={sources} onClose={() => setSources(false)} title="Add showreel">
      <div className="group">
        <Row icon={<Upload size={19} />} label={<span className="ana-reel-source">Upload video<span className="meta">Choose a video from your device</span></span>} onPress={() => { setSources(false); start({ id: crypto.randomUUID(), url: '', title: 'Showreel', source: { kind: 'native', status: 'draft' } }); }} />
        <Row icon={<Link2 size={19} />} label={<span className="ana-reel-source">Add video link<span className="meta">YouTube or Vimeo</span></span>} onPress={() => { setSources(false); start({ id: crypto.randomUUID(), url: '', title: 'Showreel' }); }} />
      </div>
    </Sheet>
    <Sheet className="ana-work-sheet" open={!!edit && !cover && !sources} onClose={close} title="Showreel" size="tall">
      {edit && <div className="stack ana-reel-editor">
    <input className="sr-only" ref={input} type="file" accept="video/mp4,video/quicktime,video/webm,.mp4,.mov,.webm" tabIndex={-1} aria-hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void choose(f); }} />
        {edit.source?.kind === 'native' ? <>
          <p className="meta">Choose an export up to 3 minutes, 200 MB and 1080p. MP4, MOV or WebM.</p>
          <p className="inline-note">Uploads are not connected yet. You can keep a private device preview. It will not appear on your public profile.</p>
          <Button variant="secondary" disabled={loading} onClick={() => input.current?.click()}>{edit.url ? 'Replace video file' : 'Choose video'}</Button>
          {loading && <p className="meta" role="status">Preparing device preview…</p>}
        </> : <>
          <label className="ob-field"><span className="field-label">Video link</span><input className="field" type="url" value={edit.url} placeholder="YouTube or Vimeo" onChange={(e) => { setEdit({ ...edit, url: e.target.value, source: undefined, duration: undefined, cover: undefined }); titleEdited.current = false; }} /></label>
          {edit.url && !link && <p className="meta" role="alert">Use a specific HTTPS YouTube or Vimeo video link.</p>}
          <p className="meta" role="status">{metadata === 'loading' ? 'Getting video details…' : metadata === 'unavailable' ? 'Video details are unavailable. Add a title and cover; playback depends on the video’s embed permissions.' : metadata === 'loaded' ? 'Video details added.' : ''}</p>
        </>}
        {error && <p role="alert" className="meta">{error}</p>}
        <label className="ob-field"><span className="field-label">Display title</span><input className="field" value={edit.title} maxLength={200} onChange={(e) => { titleEdited.current = true; setEdit({ ...edit, title: e.target.value }); }} /></label>
        {edit.url && <ShowreelMedia reel={edit} privateDraft />}
        {edit.cover && <MediaFramingEditor media={edit.cover} surface="showreel" onChange={cover => setEdit({ ...edit, cover })} title="Cover" />}
        <Button variant="secondary" onClick={() => setCover(true)}>{edit.cover ? 'Change cover' : 'Add cover'}</Button>
        <Button variant="secondary" onClick={() => setSources(true)}>Replace showreel</Button>
        <Button block size="l" disabled={loading || !edit.title.trim() || (edit.source?.kind === 'native' ? !edit.url : !link)} onClick={() => {
          if (edit.source?.kind === 'native') onDraftChange({ ...edit, title: edit.title.trim() });
          else if (link) { onChange({ ...edit, title: edit.title.trim(), url: link.url, source: link.source }); onDraftChange(undefined); }
          close();
        }}>{edit.source?.kind === 'native' ? 'Keep private draft' : 'Done'}</Button>
        {(value || draft) && <Button variant="danger" block onClick={() => { if (edit.source?.kind === 'native') onDraftChange(undefined); else onChange(undefined); close(); }}>Remove {edit.source?.kind === 'native' ? 'draft' : 'showreel'}</Button>}
      </div>}
    </Sheet>
    <Sheet className="ana-work-sheet" open={cover} onClose={() => setCover(false)} title="Cover image" size="tall"><MediaPicker kind="image" single selected={[]} onDone={(ms) => { if (ms[0]) setEdit((old) => old ? { ...old, cover: ms[0] } : old); setCover(false); }} /></Sheet>
  </>;
}
