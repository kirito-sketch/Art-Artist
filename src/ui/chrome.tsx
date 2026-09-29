import { AnimatePresence, motion } from 'framer-motion';
import { AlertCircle, CheckCircle2, RotateCcw, WifiOff, X } from 'lucide-react';
import { useStore } from '../state/store';
import { spring } from './motion';
import { Still } from './Still';

export function StatusBar({ tone = 'light' }: { tone?: 'light' | 'dark' }) {
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
          <motion.div
            key={toast.id}
            className={`toast toast--${toast.tone ?? 'default'}`}
            initial={{ opacity: 0, y: 16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.98 }}
            transition={spring.snappy}
          >
            {toast.tone === 'success' && <CheckCircle2 size={16} className="toast-icon" />}
            {toast.tone === 'error' && <AlertCircle size={16} className="toast-icon" />}
            <span className="toast-text">{toast.text}</span>
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

/** Publishing lives as a slim, persistent card at the top of Home so the user can keep browsing. */
export function PublishBar() {
  const { publishing, retryPublish, cancelPublish, scenario } = useStore();
  return (
    <AnimatePresence>
      {publishing && (
        <motion.div
          className={`publish-bar publish-bar--${publishing.state}`}
          initial={{ opacity: 0, y: -12, height: 0 }}
          animate={{ opacity: 1, y: 0, height: 'auto' }}
          exit={{ opacity: 0, y: -12, height: 0 }}
          transition={spring.gentle}
        >
          <div className="publish-bar-inner">
            <span className="publish-thumb">{publishing.thumb ? <Still media={publishing.thumb} showPlay={false} /> : <span className="publish-thumb-text">Aa</span>}</span>
            <div className="publish-copy">
              <p className="publish-label">
                {publishing.state === 'uploading' && publishing.label}
                {publishing.state === 'done' && (publishing.kind === 'post' ? 'Posted' : 'Published')}
                {publishing.state === 'failed' && (scenario.offline ? 'Waiting for connection' : 'Upload failed')}
              </p>
              <p className="publish-sub">
                {publishing.state === 'uploading' && `${Math.round(publishing.progress * 100)}% · you can keep browsing`}
                {publishing.state === 'done' && 'Visible to your network'}
                {publishing.state === 'failed' && 'Your draft is safe. Nothing was published.'}
              </p>
            </div>
            {publishing.state === 'failed' ? (
              <div className="publish-actions">
                <button className="publish-action" onClick={retryPublish} aria-label="Retry">
                  <RotateCcw size={16} />
                </button>
                <button className="publish-action publish-action--muted" onClick={cancelPublish} aria-label="Cancel upload">
                  <X size={16} />
                </button>
              </div>
            ) : publishing.state === 'done' ? (
              <CheckCircle2 size={20} className="publish-done" />
            ) : null}
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
        <motion.div className="offline-banner" initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}>
          <WifiOff size={14} />
          <span>Offline · showing what was loaded at 9:12</span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
