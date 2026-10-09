import { useId, useState, type ReactNode } from 'react';
import type { Media } from '../data/types';
import type { MediaKind } from '../domain/mediaSelection';
import { previewImage, previewPostVideo } from './imagePreview';

/*
 * The device's own photo and video picker (docs/ux-refinement/PLAN.md, Stage 6). A web app never sees the camera
 * roll: the system picker opens and returns only the files the person chose. Files are read in this tab only (D6),
 * so every result is session media. A future storage backend replaces readDeviceFiles, nothing else.
 */
export const ACCEPT: Record<'any' | MediaKind, string> = { any: 'image/*,video/*', image: 'image/*', video: 'video/*' };

/** Reads chosen files in order. One unreadable file doesn't lose the rest; its reason is returned instead. */
export async function readDeviceFiles(files: File[], kind?: MediaKind): Promise<{ media: Media[]; errors: string[] }> {
  const media: Media[] = [];
  const errors: string[] = [];
  for (const file of files) {
    const isVideo = file.type.startsWith('video/');
    if (kind && (kind === 'video') !== isVideo) {
      errors.push(kind === 'image' ? 'Only photos can be used here.' : 'Only video can be used here.');
      continue;
    }
    try {
      media.push(await (isVideo ? previewPostVideo(file) : previewImage(file)));
    } catch (e) {
      errors.push(e instanceof Error ? e.message : 'This file could not be read.');
    }
  }
  return { media, errors: [...new Set(errors)] };
}

/**
 * A control that opens the system picker. It is a <label> around a visually hidden input, so it opens the picker
 * natively on every browser (no scripted click), and it reads like any other button or tool.
 */
export function DeviceMediaButton({ kind, multiple = true, max, onPicked, onError, onBusyChange, className = 'btn btn--primary btn--l btn--block', label, children, disabled }: {
  kind?: MediaKind;
  multiple?: boolean;
  /** Only this many files are read (the room left in the selection). */
  max?: number;
  onPicked: (media: Media[]) => void;
  onError?: (message: string) => void;
  /** True while chosen files are being read (the composer keeps Post disabled meanwhile). */
  onBusyChange?: (busy: boolean) => void;
  className?: string;
  /** Accessible name when the visible content is only an icon. */
  label?: string;
  children: ReactNode;
  disabled?: boolean;
}) {
  const id = useId();
  const [busy, setBusy] = useState(false);
  const off = disabled || busy;
  return (
    <label htmlFor={id} className={`device-pick ${className}${off ? ' is-disabled' : ''}`} aria-label={label} aria-busy={busy || undefined} aria-disabled={off || undefined}>
      <input
        id={id}
        type="file"
        className="sr-only"
        accept={ACCEPT[kind ?? 'any']}
        multiple={multiple}
        disabled={off}
        onChange={async (e) => {
          const all = Array.from(e.target.files ?? []);
          e.target.value = '';
          if (!all.length) return;
          const files = max === undefined ? all : all.slice(0, Math.max(0, max));
          setBusy(true);
          onBusyChange?.(true);
          try {
            const { media, errors } = await readDeviceFiles(files, kind);
            if (all.length > files.length) errors.push(`That's the limit. ${all.length - files.length} not added.`);
            if (errors.length) onError?.(errors.join(' '));
            if (media.length) onPicked(media);
          } finally {
            setBusy(false);
            onBusyChange?.(false);
          }
        }}
      />
      {busy ? (
        <span className="device-pick-busy" role="status">
          Preparing…
        </span>
      ) : (
        children
      )}
    </label>
  );
}
