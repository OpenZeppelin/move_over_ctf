"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, usePathname } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import { DIFFICULTY_DOTS, DIFFICULTY_TEXT_CLASS, type Level } from "@/data/levels";

const SOLVED_STORAGE_KEY = "move-over-ctf-solved";

function getSolvedIds(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SOLVED_STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as number[]) : []);
  } catch {
    return new Set();
  }
}

export function LevelSidebar({ levels }: { levels: Level[] }) {
  const params = useParams();
  const pathname = usePathname();
  const currentId = typeof params?.id === "string" ? Number(params.id) : Number.NaN;
  const isHowToPlayActive = pathname?.includes("/levels/how-to-play") ?? false;
  const { t, locale } = useLocale();
  const [solvedIds, setSolvedIds] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    setSolvedIds(getSolvedIds());
    const handler = () => setSolvedIds(getSolvedIds());
    window.addEventListener("move-over-ctf-solved", handler);
    return () => window.removeEventListener("move-over-ctf-solved", handler);
  }, []);

  return (
    <aside className="hidden md:flex w-64 shrink-0 border-r border-move-border bg-move-panel flex-col">
      <div className="p-4 border-b border-move-border">
        <h2 className="text-sm font-semibold text-move-muted uppercase tracking-wider">
          {t("sidebar.levels")}
        </h2>
      </div>
      <nav className="flex-1 overflow-y-auto p-2" aria-label="Level list">
        <Link
          href={`/${locale}/levels/how-to-play`}
          className={`
            w-full text-left px-3 py-2.5 rounded-lg mb-1 flex items-center gap-3
            transition-colors block
            ${
              isHowToPlayActive
                ? "bg-oz-violet/15 text-oz-violet border border-oz-violet/30"
                : "text-move-text hover:bg-white/5 border border-transparent"
            }
          `}
        >
          <span className="text-move-muted font-mono text-sm w-6">?</span>
          <span className="flex-1 truncate font-medium">How to Play</span>
        </Link>
        {levels.map((level) => {
          const isActive = !isHowToPlayActive && level.id === currentId;
          const dotCount = DIFFICULTY_DOTS[level.difficulty];
          return (
            <Link
              key={level.id}
              href={`/${locale}/levels/${level.id}`}
              className={`
                w-full text-left px-3 py-2.5 rounded-lg mb-0.5 flex items-center gap-3
                transition-colors block
                ${
                  isActive
                    ? "bg-oz-violet/15 text-oz-violet border border-oz-violet/30"
                    : "text-move-text hover:bg-white/5 border border-transparent"
                }
              `}
            >
              <span className="text-move-muted font-mono text-sm w-6">
                {level.id}
              </span>
              <span className="flex-1 truncate font-medium">{level.name}</span>
              <span
                className={`flex gap-0.5 ${DIFFICULTY_TEXT_CLASS[level.difficulty]}`}
                title={level.difficulty}
              >
                {Array.from({ length: dotCount }).map((_, i) => (
                  <span key={i} className="text-xs">
                    ●
                  </span>
                ))}
              </span>
              {level.completed || solvedIds.has(level.id) ? (
                <span className="text-move-success text-sm" title="Completed">
                  ✓
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
