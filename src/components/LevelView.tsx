"use client";

import { useState, useCallback, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import ReactMarkdown from "react-markdown";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { useTheme } from "next-themes";
import { useLocale } from "@/contexts/LocaleContext";
import { DIFFICULTY_BADGE_CLASS, LEVEL_IDS, LEVEL_RUN_CONFIG, type Level } from "@/data/levels";
import { parseModulePath } from "@/lib/contractCode";
import { codeStyleDark, codeStyleLight } from "@/lib/codeHighlight";
import { runLevelInBrowser } from "@/lib/browserRunLevel";
import {
  getRevealedHintCountForLevel,
  getSolutionForLevel,
  getSolvedIdsFromStorage,
  setLastVisitedLevel,
  setRevealedHintCountForLevel,
  markLevelSolved,
  saveSolutionForLevel,
} from "@/lib/progressStorage";

type Tab = "instructions" | "code";
type ScrollSnapshot = {
  panelTop: number | null;
  editorTop: number | null;
  editorLeft: number | null;
};

export function LevelView({ level }: { level: Level }) {
  const [tab, setTab] = useState<Tab>("instructions");
  const [activeContractIndex, setActiveContractIndex] = useState(0);
  const [solutionCode, setSolutionCode] = useState<string>(() => "");
  const [isCompleted, setIsCompleted] = useState(false);
  const [runResult, setRunResult] = useState<{ success: boolean; output: string } | null>(null);
  const [runLoading, setRunLoading] = useState(false);
  const [revealedHintCount, setRevealedHintCount] = useState(0);
  const contentScrollRef = useRef<HTMLDivElement>(null);
  const solutionHighlightRef = useRef<HTMLDivElement>(null);
  const solutionWrapperRef = useRef<HTMLDivElement>(null);
  const solutionTextareaRef = useRef<HTMLTextAreaElement>(null);
  const { resolvedTheme } = useTheme();
  const { t, locale } = useLocale();
  const isDark = resolvedTheme !== "light";
  const codeStyle = isDark ? codeStyleDark : codeStyleLight;
  const runConfig = LEVEL_RUN_CONFIG[level.id];
  const hasRunner = runConfig != null;
  const hints = useMemo(
    () =>
      Array.isArray(level.hints)
        ? level.hints
            .map((hint) => String(hint).trim())
            .filter((hint) => hint.length > 0)
        : [],
    [level.hints],
  );
  const contractModules = useMemo(() => {
    if (Array.isArray(level.contractModules) && level.contractModules.length) {
      return level.contractModules.map((item) => ({
        module: String(item.module || "").trim(),
        contractCode: String(item.contractCode || ""),
      }));
    }
    const fallbackCode = String(level.contractCode || "");
    const parsedPath = parseModulePath(fallbackCode);
    const fallbackModule = parsedPath.includes("::") ? parsedPath.split("::").pop() || "contract" : parsedPath;
    return [
      {
        module: fallbackModule.replace(/[;{]+$/, ""),
        contractCode: fallbackCode,
      },
    ];
  }, [level.contractCode, level.contractModules]);
  const activeContract = contractModules[activeContractIndex] ?? contractModules[0];
  const activeContractCode = activeContract?.contractCode || level.contractCode;
  const modulePath = parseModulePath(activeContractCode);
  const levelIndex = LEVEL_IDS.indexOf(level.id);
  const prevLevelId = levelIndex > 0 ? LEVEL_IDS[levelIndex - 1] : undefined;
  const prevHref =
    levelIndex === 0
      ? `/${locale}/levels/how-to-play`
      : prevLevelId !== undefined
        ? `/${locale}/levels/${prevLevelId}`
        : undefined;
  const nextLevelId = levelIndex >= 0 ? LEVEL_IDS[levelIndex + 1] : undefined;
  const hasPassed = isCompleted || runResult?.success === true;
  const handleSolutionChange = useCallback(
    (value: string) => {
      setSolutionCode(value);
      saveSolutionForLevel(level.id, value);
    },
    [level.id],
  );

  const captureScrollSnapshot = useCallback((): ScrollSnapshot => {
    const panel = contentScrollRef.current;
    const editor = solutionTextareaRef.current;
    return {
      panelTop: panel ? panel.scrollTop : null,
      editorTop: editor ? editor.scrollTop : null,
      editorLeft: editor ? editor.scrollLeft : null,
    };
  }, []);

  const restoreScrollSnapshot = useCallback((snapshot: ScrollSnapshot) => {
    requestAnimationFrame(() => {
      if (snapshot.panelTop !== null) {
        const panel = contentScrollRef.current;
        if (panel) {
          const max = Math.max(0, panel.scrollHeight - panel.clientHeight);
          panel.scrollTop = Math.min(snapshot.panelTop, max);
        }
      }

      if (snapshot.editorTop !== null || snapshot.editorLeft !== null) {
        const editor = solutionTextareaRef.current;
        if (editor) {
          if (snapshot.editorTop !== null) editor.scrollTop = snapshot.editorTop;
          if (snapshot.editorLeft !== null) editor.scrollLeft = snapshot.editorLeft;
        }

        const highlight = solutionHighlightRef.current;
        if (highlight) {
          if (snapshot.editorTop !== null) highlight.scrollTop = snapshot.editorTop;
          if (snapshot.editorLeft !== null) highlight.scrollLeft = snapshot.editorLeft;
        }
      }
    });
  }, []);

  const handleRevealNextHint = useCallback(() => {
    if (!hints.length) return;
    setRevealedHintCount((prev) => {
      const next = Math.min(prev + 1, hints.length);
      if (next !== prev) {
        setRevealedHintCountForLevel(level.id, next);
      }
      return next;
    });
  }, [hints.length, level.id]);

  const handleRun = useCallback(async () => {
    if (!runConfig) {
      setRunResult({
        success: false,
        output: "Run configuration is missing for this level.",
      });
      return;
    }
    const scrollSnapshot = captureScrollSnapshot();
    setRunLoading(true);
    restoreScrollSnapshot(scrollSnapshot);
    try {
      const result = await runLevelInBrowser({
        levelId: level.id,
        contractCode: level.contractCode,
        contractModules: contractModules.map((contract) => ({
          module: contract.module,
          contractCode: contract.contractCode,
        })),
        module: runConfig.module,
        typeName: runConfig.typeName,
        solutionModule: runConfig.solutionModule,
        solutionBody: solutionCode,
        verifierModule: `level_${level.id}_verifier`,
        cleanupFunction: runConfig.cleanupFunction,
      });
      setRunResult(result);
      restoreScrollSnapshot(scrollSnapshot);
      if (result.success) {
        setIsCompleted(true);
        markLevelSolved(level.id, { usedHint: revealedHintCount > 0 });
        saveSolutionForLevel(level.id, solutionCode);
      }
    } catch (e) {
      setRunResult({
        success: false,
        output: e instanceof Error ? e.message : "Network error",
      });
      restoreScrollSnapshot(scrollSnapshot);
    } finally {
      setRunLoading(false);
      restoreScrollSnapshot(scrollSnapshot);
    }
  }, [
    captureScrollSnapshot,
    contractModules,
    level.contractCode,
    level.id,
    revealedHintCount,
    restoreScrollSnapshot,
    runConfig,
    solutionCode,
  ]);

  useEffect(() => {
    const preferredIndex = runConfig
      ? contractModules.findIndex((contract) => contract.module === runConfig.module)
      : -1;
    setActiveContractIndex(preferredIndex >= 0 ? preferredIndex : 0);
  }, [contractModules, level.id, runConfig]);

  useEffect(() => {
    setRunResult(null);
    setSolutionCode(getSolutionForLevel(level.id));
    setIsCompleted(getSolvedIdsFromStorage().has(level.id));
    setLastVisitedLevel(level.id);
    const persistedHints = getRevealedHintCountForLevel(level.id);
    setRevealedHintCount(Math.min(persistedHints, hints.length));
  }, [hints.length, level.id]);

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
          <div className="ml-auto inline-flex items-center gap-2">
            {prevHref !== undefined && (
              <Link
                href={prevHref}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-move-border bg-move-dark text-move-text hover:bg-move-panel transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oz-violet/60"
                aria-label={prevLevelId !== undefined ? `Go to level ${prevLevelId}` : "Go to How to Play"}
                title={prevLevelId !== undefined ? `Previous level (${prevLevelId})` : "How to Play"}
              >
                ←
              </Link>
            )}
            {nextLevelId !== undefined && (
              <Link
                href={`/${locale}/levels/${nextLevelId}`}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-move-border bg-move-dark text-move-text hover:bg-move-panel transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oz-violet/60"
                aria-label={`Go to level ${nextLevelId}`}
                title={`Next level (${nextLevelId})`}
              >
                →
              </Link>
            )}
          </div>
        </div>
        <p className="mt-2 flex flex-wrap items-center gap-2 font-mono text-xs text-move-muted">
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-medium capitalize ${DIFFICULTY_BADGE_CLASS[level.difficulty]}`}
          >
            {level.difficulty}
          </span>
          <span className="text-move-muted/70" aria-hidden>
            ·
          </span>
          <span className="text-move-muted/80">Contract:</span>
          <code className="text-move-accent">{modulePath}</code>
        </p>
        <p className="mt-1 text-move-muted text-xs sm:text-sm">{level.description}</p>
        {level.author && (
          <p className="mt-1 text-move-muted text-xs sm:text-sm">
            <span className="text-move-muted/80">Author:</span>{" "}
            {level.author.github ? (
              <a
                href={level.author.github}
                target="_blank"
                rel="noopener noreferrer"
                className="text-oz-violet hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oz-violet/60 rounded"
              >
                {level.author.name}
              </a>
            ) : (
              <span className="text-move-text">{level.author.name}</span>
            )}
          </p>
        )}
        {hasPassed && (
          <div className="mt-3 rounded-xl border-2 border-emerald-400/55 bg-emerald-500/12 px-3 py-2.5 shadow-[0_0_20px_rgba(16,185,129,0.18)]">
            <p className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-move-text">
              <span aria-hidden>🏆</span>
              Flag captured. This level is officially passed.
            </p>
          </div>
        )}
      </div>

      {/* Tabs */}
      <div
        className="flex border-b border-move-border bg-move-panel/80 overflow-x-auto"
        role="tablist"
        aria-label="Level content tabs"
      >
        <button
          type="button"
          onClick={() => setTab("instructions")}
          id="tab-instructions"
          role="tab"
          aria-selected={tab === "instructions"}
          aria-controls="panel-instructions"
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
          id="tab-code"
          role="tab"
          aria-selected={tab === "code"}
          aria-controls="panel-code"
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
      <div ref={contentScrollRef} className="flex-1 overflow-auto p-4 sm:p-6 bg-move-dark">
        {tab === "instructions" && (
          <div id="panel-instructions" role="tabpanel" aria-labelledby="tab-instructions" className="space-y-5">
            <article className="prose prose-sm max-w-none text-move-text prose-headings:text-move-text prose-p:text-move-text prose-li:text-move-text">
              <ReactMarkdown
                className="[&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:mt-6 [&_h3]:text-sm [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:leading-relaxed [&_pre]:font-mono [&_code]:font-mono"
              >
                {level.instructions}
              </ReactMarkdown>
            </article>
            {hints.length > 0 && (
              <section className="rounded-lg border border-move-border bg-move-panel/60 p-4" aria-label="Hints">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-move-text">Hints</h2>
                    <p className="mt-1 text-xs sm:text-sm text-move-muted">
                      Reveal hints one by one. Solving without revealing hints unlocks a no-hint achievement.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={handleRevealNextHint}
                    disabled={revealedHintCount >= hints.length}
                    className="inline-flex shrink-0 items-center rounded-md border border-oz-violet/40 bg-oz-violet/15 px-3 py-1.5 text-xs sm:text-sm font-medium text-oz-violet hover:bg-oz-violet/25 disabled:cursor-not-allowed disabled:opacity-60"
                    aria-label={
                      revealedHintCount >= hints.length
                        ? "All hints already revealed"
                        : `Reveal hint ${revealedHintCount + 1}`
                    }
                  >
                    {revealedHintCount >= hints.length ? "All hints shown" : "Reveal next hint"}
                  </button>
                </div>
                {revealedHintCount > 0 && (
                  <ol className="mt-3 space-y-2 list-decimal pl-5 text-sm text-move-text">
                    {hints.slice(0, revealedHintCount).map((hint, idx) => (
                      <li key={`${level.id}-hint-${idx}`}>{hint}</li>
                    ))}
                  </ol>
                )}
              </section>
            )}
          </div>
        )}
        {tab === "code" && (
          <div id="panel-code" role="tabpanel" aria-labelledby="tab-code" className="flex flex-col gap-4">
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
              {contractModules.length > 1 && (
                <div className="flex flex-wrap gap-1 border-b border-move-border bg-move-panel/60 px-2 py-1.5">
                  {contractModules.map((contract, idx) => {
                    const isActive = idx === activeContractIndex;
                    return (
                      <button
                        key={`${contract.module}-${idx}`}
                        type="button"
                        onClick={() => setActiveContractIndex(idx)}
                        className={`rounded-md border px-2.5 py-1 text-[11px] sm:text-xs font-mono transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oz-violet/60 ${
                          isActive
                            ? "border-oz-violet/45 bg-oz-violet/15 text-oz-violet"
                            : "border-move-border bg-move-dark text-move-muted hover:text-move-text"
                        }`}
                        title={`Open ${contract.module}.move`}
                        aria-label={`Open ${contract.module}.move`}
                        aria-pressed={isActive}
                      >
                        {contract.module}.move
                      </button>
                    );
                  })}
                </div>
              )}
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
                  {activeContractCode}
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
                  <span className="ml-2 inline-flex items-center gap-2">
                    <span className="text-move-muted/80">Solution:</span>{" "}
                    <span className="text-move-accent">level_{level.id}_solution.move</span>
                    <span className="hidden sm:inline text-[10px] text-move-muted/80">Cmd/Ctrl+Enter to run</span>
                  </span>
                  {hasPassed && (
                    <span className="ml-2 inline-flex items-center gap-1 rounded-full border border-emerald-400/50 bg-emerald-500/15 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-move-text">
                      ✓ Passed
                    </span>
                  )}
                  <button
                    type="button"
                    onClick={handleRun}
                    disabled={runLoading}
                    className={`ml-auto inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-xs sm:text-sm font-semibold tracking-wide transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oz-violet/60 disabled:opacity-60 disabled:cursor-not-allowed ${
                      hasPassed
                        ? "border-emerald-400/55 bg-emerald-500/15 text-move-text hover:bg-emerald-500/22"
                        : "border-oz-violet/70 bg-gradient-to-r from-oz-violet to-indigo-500 text-white shadow-[0_0_18px_rgba(124,58,237,0.35)] hover:brightness-110"
                    }`}
                    aria-label={
                      runLoading
                        ? "Running solution"
                        : hasPassed
                          ? "Run solution again"
                          : "Run solution with Cmd or Control plus Enter shortcut"
                    }
                  >
                    <span
                      aria-hidden
                      className={`inline-flex size-4 items-center justify-center rounded-full border text-[10px] ${
                        hasPassed
                          ? "border-emerald-400/60 bg-emerald-500/20 text-move-text"
                          : "border-white/35 bg-white/15 text-white"
                      }`}
                    >
                      {runLoading ? "…" : hasPassed ? "✓" : "▶"}
                    </span>
                    {runLoading ? "Running…" : hasPassed ? "Run Again" : t("level.run")}
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
                      onKeyDown={(e) => {
                        if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && hasRunner && !runLoading) {
                          e.preventDefault();
                          void handleRun();
                        }
                      }}
                      onScroll={(e) => {
                        const el = solutionHighlightRef.current;
                        if (el) {
                          el.scrollTop = e.currentTarget.scrollTop;
                          el.scrollLeft = e.currentTarget.scrollLeft;
                        }
                      }}
                      placeholder={t("level.solutionPlaceholder")}
                      spellCheck={false}
                      aria-label={`Solution editor for level ${level.id}`}
                      aria-keyshortcuts="Control+Enter Meta+Enter"
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
                        ? "border-emerald-400/55 bg-emerald-500/12 text-emerald-200"
                        : "border-red-400/55 bg-red-500/12 text-red-200"
                    }`}
                    role="status"
                    aria-live="polite"
                  >
                    <p
                      className={`mb-1 font-semibold ${
                        runResult.success ? "text-emerald-300" : "text-red-300"
                      }`}
                    >
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
