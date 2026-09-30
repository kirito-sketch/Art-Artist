import { ChevronLeft, WifiOff } from 'lucide-react';
import { useStore } from '../state/store';
import { Button, EmptyState, IconButton, Skeleton } from './primitives';

/** Shape of the page while it loads: the hero and a few lines, never a spinner on white. */
export function PageSkeleton() {
  const { pop } = useStore();
  return (
    <div className="screen" aria-busy="true">
      <div className="skel-hero">
        <IconButton label="Back" className="icon-btn--float skel-back" onClick={pop}>
          <ChevronLeft size={24} />
        </IconButton>
      </div>
      <div className="skel-body">
        <Skeleton w="60%" h={28} />
        <Skeleton w="40%" />
        <Skeleton w="90%" />
        <Skeleton w="80%" />
        <Skeleton h={120} r={16} />
      </div>
    </div>
  );
}

export function PageError({ what, retry }: { what: string; retry: () => void }) {
  const { pop } = useStore();
  return (
    <div className="screen">
      <header className="topbar topbar--nav">
        <IconButton label="Back" onClick={pop}>
          <ChevronLeft size={26} />
        </IconButton>
      </header>
      <EmptyState icon={<WifiOff />} title={`Couldn't load this ${what}`} body="Check your connection and try again." />
      <Button variant="secondary" className="center-btn" onClick={retry}>
        Try again
      </Button>
    </div>
  );
}
