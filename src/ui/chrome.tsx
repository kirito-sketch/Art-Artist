import { AnimatePresence, motion } from 'framer-motion';
import { WifiOff } from 'lucide-react';
import { useStore } from '../state/store';
import { spring } from './motion';
import { Photo } from './primitives';

export function StatusBar({ tone = 'dark' }: { tone?: 'light' | 'dark' | 'paper' }) {
  return (
    <div className={`status-bar status-bar--${tone}`} aria-hidden>
      <span className="status-time">9:41</span>
      <span className="status-island" />
      <span className="status-icons">
        <svg width="18" height="11" viewBox="0 0 18 11" fill="currentColor">
          <rect x="0" y="7" width="3" height="4" rx="1" />
          <rect x="5" y="5" width="3" height="6" rx="1" />
          <rect x="10" y="2.5" width="3" height="8.5" rx="1" />
          <rect x="15" y="0" width="3" height="11" rx="1" />
        </svg>
        <svg width="16" height="11" viewBox="0 0 16 11" fill="currentColor">
          <path d="M8 2.2c2.3 0 4.4.9 6 2.4l1.2-1.3A10.4 10.4 0 0 0 8 .4 10.4 10.4 0 0 0 .8 3.3L2 4.6a8.6 8.6 0 0 1 6-2.4Zm0 3.4c1.4 0 2.6.5 3.6 1.4l1.2-1.3A7 7 0 0 0 8 3.8a7 7 0 0 0-4.8 1.9L4.4 7c1-.9 2.2-1.4 3.6-1.4Zm0 3.3c.5 0 1 .2 1.3.5L8 10.8 6.7 9.4c.3-.3.8-.5 1.3-.5Z" />
        </svg>
        <svg width="27" height="12" viewBox="0 0 27 12" fill="none">
          <rect x="0.5" y="0.5" width="23" height="11" rx="3.5" stroke="currentColor" opacity="0.4" />
          <rect x="2" y="2" width="20" height="8" rx="2" fill="currentColor" />
          <path d="M25 4v4c.8-.3 1.3-1.1 1.3-2S25.8 4.3 25 4Z" fill="currentColor" opacity="0.5" />
        </svg>
      </span>
    </div>
  );
}

export function ToastHost() {
  const { toast, dismissToast } = useStore();
  return (
    <div className="toast-host" aria-live="polite">
      <AnimatePresence>
        {toast && (
          <motion.div key={toast.id} className="toast" initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 10 }} transition={spring.snappy}>
            <span>{toast.text}</span>
            {toast.action && (
              <button
                className="toast-action"
                onClick={() => {
                  toast.action?.run();
                  dismissToast();
                }}
              >
                {toast.action.label}
              </button>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

/** Upload progress as one slim row; the user keeps browsing. */
export function PublishBar() {
  const { publishing, retryPublish, cancelPublish, scenario } = useStore();
  return (
    <AnimatePresence>
      {publishing && (
        <motion.div className={`publish publish--${publishing.state}`} initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} transition={spring.gentle}>
          <div className="publish-row">
            {publishing.thumb && <Photo media={publishing.thumb} className="publish-thumb" showPlay={false} />}
            <p className="publish-label">
              {publishing.state === 'uploading' && 'Posting…'}
              {publishing.state === 'done' && 'Posted'}
              {publishing.state === 'failed' && (scenario.offline ? 'Waiting for connection' : "Couldn't post")}
            </p>
            {publishing.state === 'failed' && (
              <>
                <button className="link" onClick={retryPublish}>
                  Retry
                </button>
                <button className="link link--muted" onClick={cancelPublish}>
                  Cancel
                </button>
              </>
            )}
          </div>
          <div className="publish-track">
            <motion.span className="publish-fill" animate={{ scaleX: publishing.progress }} transition={{ type: 'tween', ease: 'easeOut', duration: 0.2 }} />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export function OfflineBanner() {
  const { scenario } = useStore();
  return (
    <AnimatePresence>
      {scenario.offline && (
        <motion.p className="offline" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
          <WifiOff size={14} /> You're offline
        </motion.p>
      )}
    </AnimatePresence>
  );
}
