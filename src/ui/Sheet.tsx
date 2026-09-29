import { AnimatePresence, motion, useDragControls, type PanInfo } from 'framer-motion';
import type { ReactNode } from 'react';
import { X } from 'lucide-react';
import { spring } from './motion';
import { IconButton } from './primitives';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: ReactNode;
  subtitle?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  /** 'auto' hugs content; 'tall' reaches near the top for lists and forms. */
  size?: 'auto' | 'tall';
  showClose?: boolean;
  label?: string;
}

/**
 * iOS-style sheet: spring in from the bottom, dimmed backdrop, drag the grabber or header down to dismiss.
 * Dragging is scoped to the header so scrolling content never fights the dismiss gesture.
 */
export function Sheet({ open, onClose, title, subtitle, children, footer, size = 'auto', showClose = true, label }: SheetProps) {
  const controls = useDragControls();

  const onDragEnd = (_: unknown, info: PanInfo) => {
    if (info.offset.y > 110 || info.velocity.y > 650) onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="sheet-layer" role="dialog" aria-modal="true" aria-label={label ?? (typeof title === 'string' ? title : 'Sheet')}>
          <motion.div
            className="sheet-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.22 }}
            onClick={onClose}
          />
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
              {(title || showClose) && (
                <div className="sheet-titlebar">
                  <div>
                    {title && <h3 className="sheet-title">{title}</h3>}
                    {subtitle && <p className="sheet-subtitle">{subtitle}</p>}
                  </div>
                  {showClose && (
                    <IconButton label="Close" className="icon-btn--soft" onClick={onClose} onPointerDown={(e) => e.stopPropagation()}>
                      <X size={18} />
                    </IconButton>
                  )}
                </div>
              )}
            </div>
            <div className="sheet-body">{children}</div>
            {footer && <div className="sheet-footer">{footer}</div>}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
