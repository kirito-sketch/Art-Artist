import { useSyncExternalStore } from 'react';

// Session reactions shared across entry points and scoped to the individual, even when acting as a house.
const liked = new Set<string>();
const listeners = new Set<() => void>();
const subscribe = (listener: () => void) => { listeners.add(listener); return () => { listeners.delete(listener); }; };
export function usePostLike(viewerId: string, postId: string) {
  const key = `${viewerId}:${postId}`;
  const value = useSyncExternalStore(subscribe, () => liked.has(key), () => false);
  const toggle = () => { if (liked.has(key)) liked.delete(key); else liked.add(key); listeners.forEach(listener => listener()); };
  return [value, toggle] as const;
}
