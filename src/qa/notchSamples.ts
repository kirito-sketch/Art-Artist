import type { Media, Post } from '../data/types';
import * as seed from '../data/seed';

/*
 * Review samples for Option A (?actions=notch&samples, docs/NAV_AND_POST_NOTCH.md). Not product content: they only
 * open in that preview. Real seeded posts come first; the rest reuse files already in the repository, unchanged.
 * The repository has no landscape or 9:16 footage (every clip is a native 4:5, six-second file), so the two video
 * geometry samples declare a 16:9 and a 9:16 frame around the existing clip: the player crops it with object-fit,
 * it never stretches it. One sample points at a missing file to show the failure state.
 */
const clip = (id: string, width: number, height: number, alt: string, src = 'video/neela.mp4'): Media => ({ id, kind: 'video', src, width, height, duration: '0:06', poster: 'images/posts/vikram-video-poster.jpg', contentType: 'photo', alt });
const still = (id: string, src: string, width: number, height: number, alt: string): Media => ({ id, kind: 'image', src, width, height, contentType: 'photo', alt });

const samples: Post[] = [
  { id: 'qa-notch-16x9', authorId: 'vikram', time: '1h', likes: 18, comments: 0, text: 'Review sample: 16:9 video frame (the existing 4:5 clip, cropped by the player).', media: [clip('qa-clip-16x9', 1600, 900, 'Camera overlooking a mountain valley')] },
  { id: 'qa-notch-9x16', authorId: 'vikram', time: '1h', likes: 7, comments: 0, text: 'Review sample: 9:16 video frame (the existing 4:5 clip, cropped by the player).', media: [clip('qa-clip-9x16', 1080, 1920, 'Camera overlooking a mountain valley')] },
  { id: 'qa-notch-scope', authorId: 'devika', time: '2h', likes: 41, comments: 0, text: 'Review sample: a 2.34:1 still, the shortest frame the notch has to sit in.', media: [still('qa-scope', 'images/covers/journalist.jpg', 504, 215, 'Film still from Journalist')] },
  { id: 'qa-notch-square', authorId: 'ishaan', time: '3h', likes: 12, comments: 0, presentation: 'square', text: 'Review sample: square framing chosen by the creator.', media: [{ ...still('qa-square', 'images/people/ishaan.jpg', 480, 600, 'Portrait of Ishaan Bose outdoors'), contentType: 'portrait', presentations: { post: { fit: 'cover', focal: { x: 50, y: 40 } } } }] },
  { id: 'qa-notch-34', authorId: 'tara', time: '3h', likes: 9, comments: 0, presentation: 'portrait', text: 'Review sample: 3:4 framing chosen by the creator, with a long caption. '.concat('The notch never moves for the caption, and the caption never moves for the notch. '.repeat(3)), media: [{ ...still('qa-34', 'images/people/tara.jpg', 400, 500, 'Side profile of Tara Menon on a production set'), contentType: 'portrait', presentations: { post: { fit: 'cover', focal: { x: 60, y: 40 } } } }] },
  { id: 'qa-notch-failed', authorId: 'vikram', time: '4h', likes: 0, comments: 0, text: 'Review sample: a video that fails to load.', media: [clip('qa-clip-missing', 400, 500, 'Missing clip', 'video/missing-sample.mp4')] },
];

const real = ['p-vikram-video', 'p1', 'p-sameer-portrait', 'p5'];
export const NOTCH_SAMPLES = samples;
export const NOTCH_SAMPLE_IDS = [...real.filter((id) => seed.posts.some((p) => p.id === id)), ...samples.map((p) => p.id)];
