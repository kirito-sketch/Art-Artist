import { AnimatePresence, motion, useDragControls, type PanInfo } from 'framer-motion';
import type { ReactNode } from 'react';
import { spring } from './motion';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** 'auto' hugs content; 'tall' reaches near the top for lists and forms. */
  size?: 'auto' | 'tall';
}

/**
 * iOS sheet: springs up, dims the screen, dismisses by dragging the handle or tapping outside.
 * Title is centred and quiet; the sheet's own content and its one button carry the weight.
 */
export function Sheet({ open, onClose, title, children, footer, size = 'auto' }: SheetProps) {
  const controls = useDragControls();
  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 650) onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="sheet-layer" role="dialog" aria-modal="true" aria-label={title ?? 'Sheet'}>
          <motion.div className="sheet-backdrop" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.22 }} onClick={onClose} />
          <motion.div
            className={`sheet sheet--${size}`}
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
              <span className="sheet-grabber" />
              {title && <h3 className="sheet-title">{title}</h3>}
            </div>
            <div className="sheet-body">{children}</div>
            {footer && <div className="sheet-footer">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
