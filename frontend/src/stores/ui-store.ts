import { create } from "zustand";

/**
 * Global UI store (Phase 0 skeleton).
 *
 * Holds cross-cutting UI state — color theme and layout chrome — that later
 * phases build on. Auth/session and domain state get their own slices.
 */

export type Theme = "light" | "dark";

const THEME_STORAGE_KEY = "remind-theme";

/**
 * Read the theme the anti-FOUC script already applied to <html>. Runs at store
 * creation: on the client the class is set before this module loads, so the
 * store starts in the correct theme; on the server it defaults to light.
 */
function getInitialTheme(): Theme {
  if (typeof document === "undefined") return "light";
  return document.documentElement.classList.contains("dark") ? "dark" : "light";
}

function applyTheme(theme: Theme): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", theme === "dark");
  try {
    localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    /* localStorage may be unavailable (SSR / privacy mode) — non-fatal */
  }
}

interface UIState {
  theme: Theme;
  sidebarOpen: boolean;
  setTheme: (theme: Theme) => void;
  toggleTheme: () => void;
  setSidebarOpen: (open: boolean) => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  theme: getInitialTheme(),
  sidebarOpen: false,

  setTheme: (theme) => {
    applyTheme(theme);
    set({ theme });
  },

  toggleTheme: () => {
    const next: Theme = get().theme === "dark" ? "light" : "dark";
    applyTheme(next);
    set({ theme: next });
  },

  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
}));
