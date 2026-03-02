"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { useTheme } from "next-themes";
import { useLocale } from "@/contexts/LocaleContext";
import { DIFFICULTY_BADGE_CLASS, LEVEL_IDS, LEVEL_RUN_CONFIG, type Level } from "@/data/levels";
import { parseModulePath } from "@/lib/contractCode";
import { codeStyleDark, codeStyleLight } from "@/lib/codeHighlight";
import { runLevelInBrowser } from "@/lib/browserRunLevel";

type Tab = "instructions" | "code";
const SOLVED_STORAGE_KEY = "move-over-ctf-solved";
const SOLUTIONS_STORAGE_KEY = "move-over-ctf-solutions";

function readSolvedIdsFromStorage(): Set<number> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(SOLVED_STORAGE_KEY);
    return new Set(raw ? (JSON.parse(raw) as number[]) : []);
  } catch {
    return new Set();
  }
}

function saveSolvedIdToStorage(levelId: number): void {
  if (typeof window === "undefined") return;
  try {
    const solvedIds = readSolvedIdsFromStorage();
    solvedIds.add(levelId);
    localStorage.setItem(SOLVED_STORAGE_KEY, JSON.stringify([...solvedIds]));
    window.dispatchEvent(new CustomEvent("move-over-ctf-solved", { detail: levelId }));
  } catch {
    // ignore
  }
}

function readSolutionFromStorage(levelId: number): string {
  if (typeof window === "undefined") return "";
  try {
    const raw = localStorage.getItem(SOLUTIONS_STORAGE_KEY);
    const solutions = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    return typeof solutions[String(levelId)] === "string" ? solutions[String(levelId)] : "";
  } catch {
    return "";
  }
}

function saveSolutionToStorage(levelId: number, solution: string): void {
  if (typeof window === "undefined") return;
  try {
    const raw = localStorage.getItem(SOLUTIONS_STORAGE_KEY);
    const solutions = raw ? (JSON.parse(raw) as Record<string, string>) : {};
    solutions[String(levelId)] = solution;
    localStorage.setItem(SOLUTIONS_STORAGE_KEY, JSON.stringify(solutions));
  } catch {
    // ignore
  }
}

export function LevelView({ level }: { level: Level }) {
  const [tab, setTab] = useState<Tab>("instructions");
  const [solutionCode, setSolutionCode] = useState<string>(() => "");
  const [isCompleted, setIsCompleted] = useState(false);
  const [runResult, setRunResult] = useState<{ success: boolean; output: string } | null>(null);
  const [runLoading, setRunLoading] = useState(false);
  const solutionHighlightRef = useRef<HTMLDivElement>(null);
  const solutionWrapperRef = useRef<HTMLDivElement>(null);
  const solutionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const { resolvedTheme } = useTheme();
  const { t, locale } = useLocale();
  const isDark = resolvedTheme !== "light";
  const codeStyle = isDark ? codeStyleDark : codeStyleLight;
  const modulePath = parseModulePath(level.contractCode);
  const runConfig = LEVEL_RUN_CONFIG[level.id];
  const hasRunner = runConfig != null;
  const levelIndex = LEVEL_IDS.indexOf(level.id);
  const prevLevelId = levelIndex > 0 ? LEVEL_IDS[levelIndex - 1] : undefined;
  const prevHref =
    levelIndex === 0
      ? `/${locale}/levels/how-to-play`
      : prevLevelId !== undefined
        ? `/${locale}/levels/${prevLevelId}`
        : undefined;
  const nextLevelId = levelIndex >= 0 ? LEVEL_IDS[levelIndex + 1] : undefined;
  const handleSolutionChange = useCallback(
    (value: string) => {
      setSolutionCode(value);
      saveSolutionToStorage(level.id, value);
    },
    [level.id],
  );

  const handleRun = useCallback(async () => {
    if (!runConfig) {
      setRunResult({
        success: false,
        output: "Run configuration is missing for this level.",
      });
      return;
    }
    setRunResult(null);
    setRunLoading(true);
    try {
      const result = await runLevelInBrowser({
        levelId: level.id,
        contractCode: level.contractCode,
        module: runConfig.module,
        typeName: runConfig.typeName,
        solutionModule: runConfig.solutionModule,
        solutionBody: solutionCode,
        verifierModule: `level_${level.id}_verifier`,
        cleanupFunction: runConfig.cleanupFunction,
      });
      setRunResult(result);
      if (result.success) {
        setIsCompleted(true);
        saveSolvedIdToStorage(level.id);
        saveSolutionToStorage(level.id, solutionCode);
      }
    } catch (e) {
      setRunResult({
        success: false,
        output: e instanceof Error ? e.message : "Network error",
      });
    } finally {
      setRunLoading(false);
    }
  }, [level.contractCode, level.id, runConfig, solutionCode]);

  useEffect(() => {
    setRunResult(null);
    setSolutionCode(readSolutionFromStorage(level.id));
    setIsCompleted(readSolvedIdsFromStorage().has(level.id));
  }, [level.id]);

  // Expand/shrink solution textarea wrapper with content
  useEffect(() => {
    const wrapper = solutionWrapperRef.current;
    const ta = solutionTextareaRef.current;
    if (!wrapper || !ta) return;
    const padding = 16;
    const minH = 96; // 6rem

    const updateHeight = () => {
      if (!wrapper || !ta) return;
      wrapper.style.height = `${minH}px`;
      ta.style.height = "0";
      const contentH = ta.scrollHeight;
      ta.style.height = "";
      wrapper.style.height = `${Math.max(minH, contentH + padding)}px`;
    };

    const id = requestAnimationFrame(updateHeight);
    return () => cancelAnimationFrame(id);
  }, [solutionCode]);

  return (
    <div className="flex-1 flex flex-col min-w-0">
      {/* Level header – Ethernaut-style: badge + code-style title + contract path */}
      <div className="border-b border-move-border bg-move-panel px-4 sm:px-6 py-4 sm:py-5">
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          <span
            className="font-mono text-[10px] sm:text-xs uppercase tracking-widest px-2.5 py-1 rounded border border-move-border bg-move-dark text-move-muted"
            aria-label={`Level ${level.id}`}
          >
            Level {level.id}
          </span>
          <h1 className="font-mono text-base sm:text-lg font-semibold text-move-text bg-move-dark/80 border border-move-border rounded px-3 py-1.5 inline-block">
            {level.name}
          </h1>
          <span
            className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${DIFFICULTY_BADGE_CLASS[level.difficulty]}`}
          >
            {level.difficulty}
          </span>
          {isCompleted && (
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border border-emerald-300/40 bg-gradient-to-r from-emerald-500/20 to-cyan-400/20 text-emerald-100 shadow-[0_0_22px_rgba(16,185,129,0.3)]">
              <span aria-hidden>✨</span>
              Challenge Conquered
            </span>
          )}
          {(prevHref !== undefined || nextLevelId !== undefined) && (
            <div className="ml-auto inline-flex items-center gap-2">
              {prevHref !== undefined && (
                <Link
                  href={prevHref}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-move-border bg-move-dark text-move-text hover:bg-move-panel transition-colors"
                  aria-label={prevLevelId !== undefined ? `Go to level ${prevLevelId}` : "Go to How to Play"}
                  title={prevLevelId !== undefined ? `Previous level (${prevLevelId})` : "How to Play"}
                >
                  ←
                </Link>
              )}
              {nextLevelId !== undefined && (
                <Link
                  href={`/${locale}/levels/${nextLevelId}`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-move-border bg-move-dark text-move-text hover:bg-move-panel transition-colors"
                  aria-label={`Go to level ${nextLevelId}`}
                  title={`Next level (${nextLevelId})`}
                >
                  →
                </Link>
              )}
            </div>
          )}
        </div>
        <p className="mt-2 font-mono text-xs text-move-muted">
          <span className="text-move-muted/80">Contract:</span>{" "}
          <code className="text-move-accent">{modulePath}</code>
        </p>
        <p className="mt-1 text-move-muted text-xs sm:text-sm">{level.description}</p>
        {isCompleted && (
          <p className="mt-2 inline-flex items-center gap-2 rounded-lg border border-emerald-300/40 bg-gradient-to-r from-emerald-500/15 to-teal-400/10 px-3 py-1.5 text-xs sm:text-sm font-medium text-emerald-100 shadow-[0_0_24px_rgba(16,185,129,0.2)]">
            <span aria-hidden>🏆</span>
            Flag captured. Level domination confirmed.
          </p>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-move-border bg-move-panel/80 overflow-x-auto">
        <button
          type="button"
          onClick={() => setTab("instructions")}
          className={`shrink-0 min-h-[48px] px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors touch-manipulation ${
            tab === "instructions"
              ? "border-move-accent text-move-accent"
              : "border-transparent text-move-muted hover:text-move-text"
          }`}
        >
          {t("level.instructions")}
        </button>
        <button
          type="button"
          onClick={() => setTab("code")}
          className={`shrink-0 min-h-[48px] px-4 sm:px-6 py-3 text-sm font-medium border-b-2 transition-colors touch-manipulation ${
            tab === "code"
              ? "border-move-accent text-move-accent"
              : "border-transparent text-move-muted hover:text-move-text"
          }`}
        >
          {t("level.contractCode")}
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-4 sm:p-6 bg-move-dark">
        {tab === "instructions" && (
          <article className="prose prose-sm max-w-none text-move-text prose-headings:text-move-text prose-p:text-move-text prose-li:text-move-text">
            <ReactMarkdown
              className="[&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:mt-6 [&_h3]:text-sm [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:leading-relaxed [&_pre]:font-mono [&_code]:font-mono"
            >
              {level.instructions}
            </ReactMarkdown>
          </article>
        )}
        {tab === "code" && (
          <div className="flex flex-col gap-4">
            {/* Contract code */}
            <div className="rounded-lg border border-move-border overflow-hidden bg-move-panel text-sm shadow-sm">
              <div className="flex items-center gap-2 px-3 py-2 border-b border-move-border bg-move-dark/80 font-mono text-xs text-move-muted">
                <span className="w-2 h-2 rounded-full bg-red-500/80" aria-hidden />
                <span className="w-2 h-2 rounded-full bg-amber-500/80" aria-hidden />
                <span className="w-2 h-2 rounded-full bg-emerald-500/80" aria-hidden />
                <span className="ml-2">
                  <span className="text-move-muted/80">Contract:</span>{" "}
                  <span className="text-move-accent">{modulePath}.move</span>
                </span>
              </div>
              <div className="border-l-[3px] border-l-[var(--oz-violet)] bg-move-panel">
                <SyntaxHighlighter
                  language="rust"
                  style={codeStyle}
                  customStyle={{
                    margin: 0,
                    padding: "0.75rem 1rem",
                    background: "transparent",
                    fontSize: "0.75rem",
                    lineHeight: 1.6,
                    color: "var(--code-text)",
                  }}
                  codeTagProps={{
                    style: {
                      fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                      fontSize: "clamp(0.7rem, 2.5vw, 0.875rem)",
                    },
                  }}
                  showLineNumbers={false}
                  PreTag="div"
                >
                  {level.contractCode}
                </SyntaxHighlighter>
              </div>
            </div>

            {/* Solution block (levels with runner): below contract, same code-block style + highlight overlay */}
            {hasRunner && runConfig && (
              <div className="rounded-lg border border-move-border overflow-hidden bg-move-panel text-sm shadow-sm">
                <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-move-border bg-move-dark/80 font-mono text-xs text-move-muted">
                  <span className="w-2 h-2 rounded-full bg-red-500/80" aria-hidden />
                  <span className="w-2 h-2 rounded-full bg-amber-500/80" aria-hidden />
                  <span className="w-2 h-2 rounded-full bg-emerald-500/80" aria-hidden />
                  <span className="ml-2">
                    <span className="text-move-muted/80">Solution:</span>{" "}
                    <span className="text-move-accent">level_{level.id}_solution.move</span>
                  </span>
                  <button
                    type="button"
                    onClick={handleRun}
                    disabled={runLoading}
                    className="ml-auto px-3 py-1.5 rounded border border-move-border bg-move-accent/20 text-move-accent hover:bg-move-accent/30 disabled:opacity-50 text-xs font-medium"
                  >
                    {runLoading ? "Running…" : t("level.run")}
                  </button>
                </div>
                <div className="border-l-[3px] border-l-[var(--oz-violet)] bg-move-panel">
                  <SyntaxHighlighter
                    language="rust"
                    style={codeStyle}
                    customStyle={{
                      margin: 0,
                      padding: "0.75rem 1rem 0 1rem",
                      background: "transparent",
                      fontSize: "0.75rem",
                      lineHeight: 1.6,
                      color: "var(--code-text)",
                    }}
                    codeTagProps={{
                      style: {
                        fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                        fontSize: "clamp(0.7rem, 2.5vw, 0.875rem)",
                      },
                    }}
                    showLineNumbers={false}
                    PreTag="div"
                  >
{`module move_over::${runConfig.solutionModule};

use move_over::${runConfig.module};

public fun run(t: &mut tx_context::TxContext): ${runConfig.module}::${runConfig.typeName} {`}
                  </SyntaxHighlighter>
                  {/* Editable middle with syntax-highlight overlay */}
                  <div ref={solutionWrapperRef} className="relative min-h-[6rem]" style={{ minHeight: "6rem" }}>
                    <div
                      ref={solutionHighlightRef}
                      className="absolute inset-0 overflow-auto"
                      style={{
                        padding: "0.25rem 1rem 0.25rem calc(1rem + 4ch)",
                        fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                        fontSize: "clamp(0.7rem, 2.5vw, 0.875rem)",
                        lineHeight: 1.6,
                      }}
                      aria-hidden
                    >
                      <SyntaxHighlighter
                        language="rust"
                        style={codeStyle}
                        customStyle={{
                          margin: 0,
                          padding: 0,
                          background: "transparent",
                          fontSize: "inherit",
                          lineHeight: "inherit",
                        }}
                        codeTagProps={{
                          style: {
                            fontFamily: "inherit",
                            fontSize: "inherit",
                            lineHeight: "inherit",
                          },
                        }}
                        showLineNumbers={false}
                        PreTag="div"
                      >
                        {solutionCode || "\n"}
                      </SyntaxHighlighter>
                    </div>
                    <textarea
                      ref={solutionTextareaRef}
                      value={solutionCode}
                      onChange={(e) => handleSolutionChange(e.target.value)}
                      onScroll={(e) => {
                        const el = solutionHighlightRef.current;
                        if (el) {
                          el.scrollTop = e.currentTarget.scrollTop;
                          el.scrollLeft = e.currentTarget.scrollLeft;
                        }
                      }}
                      placeholder={t("level.solutionPlaceholder")}
                      spellCheck={false}
                      className="absolute inset-0 w-full min-h-full overflow-auto resize-none border-0 focus:ring-0 focus:outline-none focus:bg-move-dark/30 placeholder:text-move-muted/60 caret-[var(--code-text)] z-10 bg-transparent"
                      style={{
                        padding: "0.25rem 1rem 0.25rem calc(1rem + 4ch)",
                        fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                        fontSize: "clamp(0.7rem, 2.5vw, 0.875rem)",
                        lineHeight: 1.6,
                        color: "transparent",
                      }}
                    />
                  </div>
                  <SyntaxHighlighter
                    language="rust"
                    style={codeStyle}
                    customStyle={{
                      margin: 0,
                      padding: "0 1rem 0.75rem 1rem",
                      background: "transparent",
                      fontSize: "0.75rem",
                      lineHeight: 1.6,
                      color: "var(--code-text)",
                    }}
                    codeTagProps={{
                      style: {
                        fontFamily: "var(--font-jetbrains), ui-monospace, monospace",
                        fontSize: "clamp(0.7rem, 2.5vw, 0.875rem)",
                      },
                    }}
                    showLineNumbers={false}
                    PreTag="div"
                  >
{`}`}
                  </SyntaxHighlighter>
                </div>
                {runResult && (
                  <div
                    className={`border-t border-move-border p-4 font-mono text-xs whitespace-pre-wrap ${
                      runResult.success
                        ? "border-emerald-500/50 bg-emerald-500/10 text-emerald-200"
                        : "border-red-500/50 bg-red-500/10 text-red-200"
                    }`}
                  >
                    <p className="font-semibold mb-1">
                      {runResult.success ? t("level.runSuccess") : t("level.runError")}
                    </p>
                    <pre className="text-inherit overflow-x-auto">{runResult.output}</pre>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
