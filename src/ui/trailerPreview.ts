import { trailerFileError, trailerMetadataError } from '../domain/trailers';
import { videoDuration } from '../domain/showreel';
import type { Trailer } from '../state/world';

/*
 * A trailer file, read on this device only (docs/ux-refinement/PLAN.md, D6). Nothing is transferred or transcoded:
 * the file stays a blob: URL for this browser tab, which is why every trailer made here is marked `temporary`. The
 * steps report honest local progress (checking the file, reading the video, making the poster frame).
 */
export type TrailerStep = 'checking' | 'reading' | 'poster';

export async function previewTrailer(file: File, signal: AbortSignal, onStep: (step: TrailerStep) => void): Promise<Pick<Trailer, 'url' | 'poster' | 'duration' | 'width' | 'height' | 'temporary'>> {
  onStep('checking');
  const invalid = trailerFileError(file);
  if (invalid) throw new Error(invalid);
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  try {
    onStep('reading');
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => finish(new Error('This video could not be read. Try an MP4 export.')), 15000);
      const abort = () => finish(new DOMException('Cancelled', 'AbortError'));
      const finish = (error?: Error) => {
        clearTimeout(timer);
        signal.removeEventListener('abort', abort);
        video.onloadeddata = video.onerror = null;
        error ? reject(error) : resolve();
      };
      video.onloadeddata = () => finish();
      video.onerror = () => finish(new Error('This video could not be read. Try an MP4 export.'));
      signal.addEventListener('abort', abort, { once: true });
      if (signal.aborted) return abort();
      video.src = url;
    });
    const error = trailerMetadataError(video.duration, video.videoWidth, video.videoHeight);
    if (error) throw new Error(error);
    onStep('poster');
    const w = Math.min(960, video.videoWidth);
    const h = Math.round((w * video.videoHeight) / video.videoWidth);
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    canvas.getContext('2d')?.drawImage(video, 0, 0, w, h);
    const id = crypto.randomUUID();
    return { url, temporary: true, duration: videoDuration(video.duration), width: video.videoWidth, height: video.videoHeight, poster: { id: `trailer-poster-${id}`, kind: 'image', src: canvas.toDataURL('image/jpeg', 0.82), width: w, height: h } };
  } catch (e) {
    URL.revokeObjectURL(url);
    throw e;
  } finally {
    video.removeAttribute('src');
    video.load();
  }
}
