import type { Reel } from '../state/profile';
import { videoDuration, videoFileError, videoMetadataError } from '../domain/showreel';

/** Device-only preview. No transfer, transcoding or production processing is claimed here. */
export async function previewVideo(file: File, signal: AbortSignal): Promise<Reel> {
  const invalid = videoFileError(file);
  if (invalid) throw new Error(invalid);
  const url = URL.createObjectURL(file);
  const video = document.createElement('video');
  video.preload = 'auto';
  video.muted = true;
  video.playsInline = true;
  try {
    await new Promise<void>((resolve, reject) => {
      const timer = window.setTimeout(() => finish(new Error('This video could not be previewed. Try an MP4 export.')), 15000);
      const abort = () => finish(new DOMException('Cancelled', 'AbortError'));
      const finish = (error?: Error) => {
        clearTimeout(timer);
        signal.removeEventListener('abort', abort);
        video.onloadeddata = video.onerror = null;
        error ? reject(error) : resolve();
      };
      video.onloadeddata = () => finish();
      video.onerror = () => finish(new Error('This video could not be previewed. Try an MP4 export.'));
      signal.addEventListener('abort', abort, { once: true });
      if (signal.aborted) return abort();
      video.src = url;
    });
    const error = videoMetadataError(video.duration, video.videoWidth, video.videoHeight);
    if (error) throw new Error(error);
    const canvas = document.createElement('canvas');
    canvas.width = 640;
    canvas.height = Math.round(640 * video.videoHeight / video.videoWidth);
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    const id = crypto.randomUUID();
    return { id, source: { kind: 'native', status: 'draft' }, url, title: file.name.replace(/\.[^.]+$/, ''), duration: videoDuration(video.duration), cover: { id: `cover-${id}`, kind: 'image', src: canvas.toDataURL('image/jpeg', 0.8) } };
  } catch (error) { URL.revokeObjectURL(url); throw error; }
  finally { video.removeAttribute('src'); video.load(); }
}
