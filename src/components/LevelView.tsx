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

type Tab = "instructions" | "code";

/** Build full solution module content from the editable body (same as API). Uses move_over::level_N_solution. */
function buildFullSolutionFile(levelId: number, solutionBody: string): string {
  const config = LEVEL_RUN_CONFIG[levelId];
  if (!config) return "";
  const trimmed = solutionBody.trim();
  const body = trimmed
    ? trimmed
        .split("\n")
        .map((line) => `    ${line.trim()}`)
        .join("\n")
    : "";
  const mod = config.module;
  const typ = config.typeName;
  const fullModule = `move_over::${config.solutionModule}`;
  return `module ${fullModule};

use move_over::${mod};

public fun run(t: &mut tx_context::TxContext): ${mod}::${typ} {
${body}
}
`;
}

export function LevelView({ level }: { level: Level }) {
  const [tab, setTab] = useState<Tab>("instructions");
  const [solutionCode, setSolutionCode] = useState<string>(() => "");
  const [runResult, setRunResult] = useState<{ success: boolean; output: string } | null>(null);
  const [runLoading, setRunLoading] = useState(false);
  const [copiedId, setCopiedId] = useState<"file" | "cmd" | null>(null);
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
  const nextLevelId = levelIndex >= 0 ? LEVEL_IDS[levelIndex + 1] : undefined;

  const handleRun = useCallback(async () => {
    setRunResult(null);
    setRunLoading(true);
    try {
      const res = await fetch("/api/run-level", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ levelId: level.id, code: solutionCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        setRunResult({
          success: false,
          output: data?.error ?? `Request failed: ${res.status}`,
        });
        return;
      }
      if (data.ok && typeof data.success === "boolean" && typeof data.output === "string") {
        setRunResult({ success: data.success, output: data.output });
      } else {
        setRunResult({ success: false, output: data?.error ?? "Invalid response" });
      }
    } catch (e) {
      setRunResult({
        success: false,
        output: e instanceof Error ? e.message : "Network error",
      });
    } finally {
      setRunLoading(false);
    }
  }, [level.id, solutionCode]);

  useEffect(() => {
    if (!runResult?.success || typeof window === "undefined") return;
    try {
      const key = "move-over-ctf-solved";
      const raw = localStorage.getItem(key);
      const set = new Set<number>(raw ? (JSON.parse(raw) as number[]) : []);
      set.add(level.id);
      localStorage.setItem(key, JSON.stringify([...set]));
      window.dispatchEvent(new CustomEvent("move-over-ctf-solved", { detail: level.id }));
    } catch {
      // ignore
    }
  }, [runResult?.success, level.id]);

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
          {(prevLevelId !== undefined || nextLevelId !== undefined) && (
            <div className="ml-auto inline-flex items-center gap-2">
              {prevLevelId !== undefined && (
                <Link
                  href={`/${locale}/levels/${prevLevelId}`}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-move-border bg-move-dark text-move-text hover:bg-move-panel transition-colors"
                  aria-label={`Go to level ${prevLevelId}`}
                  title={`Previous level (${prevLevelId})`}
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
                      onChange={(e) => setSolutionCode(e.target.value)}
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
                {/* Run locally — no server cost */}
                <div className="border-t border-move-border p-4 bg-move-dark/50">
                  <p className="text-sm font-medium text-move-text mb-2">{t("level.runLocally")}</p>
                  <p className="text-xs text-move-muted mb-3">{t("level.runLocallyDescription")}</p>
                  <ol className="text-xs text-move-text space-y-2 list-decimal list-inside">
                    <li>
                      {t("level.runLocallyStep1")}{" "}
                      <a
                        href="https://docs.sui.io/build/install"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-move-accent hover:underline"
                      >
                        docs.sui.io/build/install
                      </a>
                    </li>
                    <li>
                      {t("level.runLocallyStep2")}{" "}
                      <code className="text-move-accent">move_over/sources/level_{level.id}_solution.move</code>{" "}
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(buildFullSolutionFile(level.id, solutionCode));
                            setCopiedId("file");
                            setTimeout(() => setCopiedId(null), 2000);
                          } catch {
                            // ignore
                          }
                        }}
                        className="ml-1 px-2 py-0.5 rounded border border-move-border bg-move-panel text-move-accent hover:bg-move-accent/10 text-xs"
                      >
                        {copiedId === "file" ? t("level.runLocallyCopied") : t("level.runLocallyCopyFile")}
                      </button>
                    </li>
                    <li>
                      {t("level.runLocallyStep3")}{" "}
                      <code className="text-move-accent">{"cd move_over && sui move test " + runConfig.testModule}</code>{" "}
                      <button
                        type="button"
                        onClick={async () => {
                          try {
                            await navigator.clipboard.writeText(`cd move_over && sui move test ${runConfig.testModule}`);
                            setCopiedId("cmd");
                            setTimeout(() => setCopiedId(null), 2000);
                          } catch {
                            // ignore
                          }
                        }}
                        className="ml-1 px-2 py-0.5 rounded border border-move-border bg-move-panel text-move-accent hover:bg-move-accent/10 text-xs"
                      >
                        {copiedId === "cmd" ? t("level.runLocallyCopied") : t("level.runLocallyCopyCmd")}
                      </button>
                    </li>
                  </ol>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
