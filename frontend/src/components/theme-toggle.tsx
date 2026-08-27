"use client";

import { Moon, Sun } from "lucide-react";

import { useMounted } from "@/hooks/use-mounted";
import { useUIStore } from "@/stores/ui-store";

/**
 * Accessible light/dark toggle backed by the UI store. Shows a stable icon
 * during SSR/hydration (via useMounted) so it can't cause a hydration
 * mismatch — the real theme is applied pre-paint by the script in the root
 * layout, and the store initializes from it.
 */
export function ThemeToggle() {
  const mounted = useMounted();
  const theme = useUIStore((s) => s.theme);
  const toggleTheme = useUIStore((s) => s.toggleTheme);

  const isDark = mounted && theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Switch to light theme" : "Switch to dark theme"}
      className="border-border bg-card text-foreground hover:bg-muted focus-visible:ring-ring inline-flex h-11 w-11 items-center justify-center rounded-full border shadow-sm transition-colors focus-visible:ring-2 focus-visible:outline-none"
    >
      {isDark ? <Sun size={20} aria-hidden /> : <Moon size={20} aria-hidden />}
    </button>
  );
}
