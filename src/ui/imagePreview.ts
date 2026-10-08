import type { Media } from '../data/types';

/** Exact File is retained by its object URL. This is a session preview, not a server upload. */
export async function previewImage(file: File): Promise<Media> {
  if (!file.type.startsWith('image/')) throw new Error('Choose an image file.');
  if (file.size > 25 * 1024 * 1024) throw new Error('Choose an image under 25 MB for this device preview.');
  const src = URL.createObjectURL(file);
  try {
    const image = new Image(); image.src = src; await image.decode();
    return { id: crypto.randomUUID(), kind: 'image', src, width: image.naturalWidth, height: image.naturalHeight, contentType: 'photo', alt: file.name.replace(/\.[^.]+$/, '') };
  } catch { URL.revokeObjectURL(src); throw new Error('This image could not be previewed. Try a JPEG, PNG or WebP export.'); }
}

/** Browser poster generation only. Original video bytes are never transcoded or cropped. */
export async function previewPostVideo(file: File): Promise<Media> {
  if (!file.type.startsWith('video/')) throw new Error('Choose a video file.');
  if (file.size > 200 * 1024 * 1024) throw new Error('Choose a video under 200 MB for this device preview.');
  const src = URL.createObjectURL(file), video = document.createElement('video');
  video.muted = true; video.playsInline = true; video.preload = 'auto';
  try {
    await new Promise<void>((resolve,reject) => {
      const timer = window.setTimeout(() => finish(new Error('This video cannot be previewed on this device. Try an MP4 export.')),15000);
      const finish = (error?: Error) => { clearTimeout(timer); video.onloadeddata = video.onerror = null; error ? reject(error) : resolve(); };
      video.onloadeddata = () => finish(); video.onerror = () => finish(new Error('This video cannot be previewed on this device. Try an MP4 export.')); video.src = src;
    });
    const canvas = document.createElement('canvas'), scale = Math.min(1, 640 / Math.max(video.videoWidth,video.videoHeight));
    canvas.width = Math.max(1,Math.round(video.videoWidth * scale)); canvas.height = Math.max(1,Math.round(video.videoHeight * scale));
    canvas.getContext('2d')?.drawImage(video,0,0,canvas.width,canvas.height);
    return { id: crypto.randomUUID(), kind: 'video', src, width: video.videoWidth, height: video.videoHeight, poster: canvas.toDataURL('image/jpeg',.8), alt: file.name.replace(/\.[^.]+$/,''), duration: Number.isFinite(video.duration) ? `${Math.floor(video.duration / 60)}:${Math.floor(video.duration % 60).toString().padStart(2,'0')}` : undefined };
  } catch (error) { URL.revokeObjectURL(src); throw error; }
  finally { video.removeAttribute('src'); video.load(); }
}
