"use client";

import { useSyncExternalStore } from "react";
import { useTheme } from "next-themes";
import { useLocale } from "@/contexts/LocaleContext";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";

const EMPTY_SUBSCRIBE = () => () => {};

function useHasHydrated() {
  return useSyncExternalStore(EMPTY_SUBSCRIBE, () => true, () => false);
}

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useLocale();
  const hasHydrated = useHasHydrated();

  if (!hasHydrated || resolvedTheme === undefined) {
    return (
      <Typography.Span
        className="inline-flex size-10 items-center justify-center rounded-lg border border-move-border bg-move-panel"
        aria-hidden
      >
        <Typography.Span className="size-5 rounded-full bg-move-muted/30" />
      </Typography.Span>
    );
  }

  const isDark = resolvedTheme === "dark";
  const label = isDark ? t("theme.toggleToLight") : t("theme.toggleToDark");

  return (
    <Button
      onClick={() => setTheme(isDark ? "light" : "dark")}
      variant="panel"
      size="icon"
      className="hover:bg-move-border/50"
      aria-label={label}
      title={label}
    >
      {isDark ? (
        <SunIcon className="size-5 text-move-muted" />
      ) : (
        <MoonIcon className="size-5 text-move-muted" />
      )}
    </Button>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z"
      />
    </svg>
  );
}

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
      />
    </svg>
  );
}
