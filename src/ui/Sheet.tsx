import { AnimatePresence, motion, useDragControls, type PanInfo } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect, useId, useRef, type KeyboardEvent, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { activation, currentScreen, focusInto, restoreFocus, trapTab, useModalLayer } from './a11y';
import { spring } from './motion';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  /** Accessible name when the sheet shows no visible title (menus, pickers). */
  label?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** 'auto' hugs content; 'tall' reaches near the top for lists and forms. */
  size?: 'auto' | 'tall';
  /** The visible close control. Omit it only where the sheet already has its own Cancel or Done. */
  close?: 'Close' | 'Done' | false;
  className?: string;
}

/**
 * iOS sheet: springs up, dims the screen, dismisses by dragging the handle, tapping outside, Escape,
 * or its Close button (the one way that works for everyone, including screen-reader users on a phone).
 * It is a modal dialog: focus moves in, stays in, and returns to whatever opened it; the screens
 * behind are inert while it is open. Title is centred and quiet.
 */
export function Sheet({ open, onClose, title, label, children, footer, size = 'auto', close = 'Close', className = '' }: SheetProps) {
  const controls = useDragControls();
  const layer = useModalLayer();
  const titleId = useId();
  const panel = useRef<HTMLDivElement>(null);
  const opener = useRef<Element | null>(null);
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 650) onClose();
  };

  useEffect(() => {
    // A replaced District house sheet can still be animating out below its successor.
    if (className === 'dhouse-sheet') {
      const dialog = panel.current?.closest<HTMLElement>('.sheet-layer');
      if (dialog) {
        dialog.inert = !open;
        if (open) dialog.removeAttribute('aria-hidden');
        else dialog.setAttribute('aria-hidden', 'true');
      }
    }
    if (!open) return;
    const active = document.activeElement;
    opener.current = active && active !== document.body ? active : activation.el;
    const release = layer?.register();
    const f = requestAnimationFrame(() => requestAnimationFrame(() => focusInto(panel.current)));
    return () => {
      cancelAnimationFrame(f);
      release?.();
      restoreFocus(opener.current, currentScreen);
    };
  }, [open, className]); // eslint-disable-line react-hooks/exhaustive-deps

  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.stopPropagation();
      e.preventDefault();
      onClose();
      return;
    }
    if (panel.current) trapTab(e, panel.current);
  };

  const content = (
    <AnimatePresence>
      {open && (
        <div className="sheet-layer" role="dialog" aria-modal="true" aria-labelledby={title ? titleId : undefined} aria-label={title ? undefined : label || 'Sheet'} onKeyDown={onKeyDown}>
          <motion.div className="sheet-backdrop" aria-hidden initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} onClick={onClose} />
          <motion.div
            ref={panel}
            tabIndex={-1}
            className={`sheet sheet--${size}${className ? ` ${className}` : ''}`}
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={spring.sheet}
            drag="y"
            dragControls={controls}
            dragListener={false}
            dragConstraints={{ top: 0, bottom: 0 }}
            dragElastic={{ top: 0.04, bottom: 0.8 }}
            onDragEnd={onDragEnd}
          >
            <div className="sheet-head" onPointerDown={(e) => controls.start(e)}>
              <span className="sheet-grabber" aria-hidden />
              {title && (
                <h2 className="sheet-title" id={titleId}>
                  {title}
                </h2>
              )}
              {close && (
                <button type="button" className="sheet-close" onClick={onClose} onPointerDown={(e) => e.stopPropagation()} aria-label={close === 'Done' ? 'Done' : title || label ? `Close ${title || label}` : 'Close'}>
                  {close === 'Done' ? <span className="sheet-close-text">Done</span> : <X size={18} strokeWidth={2.4} aria-hidden />}
                </button>
              )}
            </div>
            <div className="sheet-body">{children}</div>
            {footer && <div className="sheet-footer">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
  return layer?.root ? createPortal(content, layer.root) : content;
}
