import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * Returns false during SSR and the initial hydration render, then true once
 * mounted on the client — without a setState-in-effect. Use it to gate
 * client-only UI (e.g. theme-dependent icons) and avoid hydration mismatches.
 */
export function useMounted(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
