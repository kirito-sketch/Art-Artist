/** One primary professional video. Source details never define the visible product. */
export type VideoSource =
  | { kind: 'external'; provider: 'youtube' | 'vimeo'; videoId: string; hash?: string }
  | { kind: 'native'; status: 'draft' | 'uploading' | 'processing' | 'ready' | 'failed'; assetId?: string; progress?: number; error?: string };

export const VIDEO_PILOT = { seconds: 180, bytes: 200 * 1024 * 1024, longEdge: 1920, shortEdge: 1080 };

export function videoLink(raw: string): { url: string; source: Extract<VideoSource, { kind: 'external' }> } | null {
  try {
    const u = new URL(raw.trim());
    if (u.protocol !== 'https:' || u.username || u.password || u.port) return null;
    const host = u.hostname.toLowerCase().replace(/^www\./, '');
    const parts = u.pathname.split('/').filter(Boolean);
    if (['youtube.com', 'm.youtube.com', 'youtu.be', 'youtube-nocookie.com'].includes(host)) {
      const id = host === 'youtu.be' ? parts[0] : parts[0] === 'watch' ? u.searchParams.get('v') : ['shorts', 'embed', 'live'].includes(parts[0]) ? parts[1] : null;
      if (!id || !/^[A-Za-z0-9_-]{11}$/.test(id)) return null;
      return { url: `https://www.youtube.com/watch?v=${id}`, source: { kind: 'external', provider: 'youtube', videoId: id } };
    }
    if (host === 'vimeo.com' || host === 'player.vimeo.com') {
      const index = host === 'player.vimeo.com' ? parts[0] === 'video' ? 1 : -1 : ['channels', 'groups', 'album', 'showcase'].includes(parts[0]) ? parts.reduce((found, part, i) => /^\d+$/.test(part) ? i : found, -1) : 0;
      const id = parts[index];
      if (!id || !/^\d{1,12}$/.test(id)) return null;
      const candidate = u.searchParams.get('h') ?? parts[index + 1];
      const hash = candidate && /^[A-Za-z0-9]{6,32}$/.test(candidate) ? candidate : undefined;
      return { url: `https://vimeo.com/${id}${hash ? `/${hash}` : ''}`, source: { kind: 'external', provider: 'vimeo', videoId: id, ...(hash ? { hash } : {}) } };
    }
  } catch { /* Inline validation explains unsupported links. */ }
  return null;
}

export function videoEmbed(source: VideoSource | undefined, url: string): string | null {
  const s = source?.kind === 'external' ? source : videoLink(url)?.source;
  if (!s) return null;
  return s.provider === 'youtube'
    ? `https://www.youtube-nocookie.com/embed/${s.videoId}?playsinline=1&rel=0`
    : `https://player.vimeo.com/video/${s.videoId}${s.hash ? `?h=${s.hash}` : ''}`;
}

export function videoDuration(seconds: number) {
  const n = Math.max(0, Math.round(seconds));
  return `${Math.floor(n / 60)}:${String(n % 60).padStart(2, '0')}`;
}

/** Pilot policy, not a claim about the absent production upload service. Server must revalidate it. */
export function videoFileError(file: { size: number; name: string; type: string }) {
  if (!/\.(mp4|mov|webm)$/i.test(file.name) || !['video/mp4', 'video/quicktime', 'video/webm', ''].includes(file.type)) return 'Choose an MP4, MOV or WebM video.';
  if (!file.size) return 'This file is empty. Choose another video.';
  if (file.size > VIDEO_PILOT.bytes) return 'Use an export of 200 MB or less.';
  return null;
}

export function videoMetadataError(seconds: number, width: number, height: number) {
  if (!Number.isFinite(seconds) || seconds <= 0 || !width || !height) return 'This video could not be previewed. Try an MP4 export.';
  if (seconds > VIDEO_PILOT.seconds) return 'Trim your primary showreel to 3 minutes or less.';
  if (Math.max(width, height) > VIDEO_PILOT.longEdge || Math.min(width, height) > VIDEO_PILOT.shortEdge) return 'Use a 1080p export for this pilot.';
  return null;
}
