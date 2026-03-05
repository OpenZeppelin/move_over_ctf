import type { CSSProperties, RefObject } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import type { LevelRunConfig } from "@/data/levels";
import { CodeWindowHeader } from "@/components/ui/CodeWindowHeader";
import { Button } from "@/components/ui/Button";
import { PanelCard } from "@/components/ui/PanelCard";
import { Typography } from "@/components/ui/Typography";

type RunResult = { success: boolean; output: string } | null;

type Props = {
  levelId: number;
  runConfig: LevelRunConfig;
  hasPassed: boolean;
  runLoading: boolean;
  codeStyle: Record<string, CSSProperties>;
  solutionCode: string;
  runLabel: string;
  runSuccessLabel: string;
  runErrorLabel: string;
  solutionPlaceholder: string;
  runResult: RunResult;
  onRun: () => void;
  onSolutionChange: (value: string) => void;
  solutionWrapperRef: RefObject<HTMLDivElement | null>;
  solutionHighlightRef: RefObject<HTMLDivElement | null>;
  solutionTextareaRef: RefObject<HTMLTextAreaElement | null>;
};

export function SolutionEditorCard({
  levelId,
  runConfig,
  hasPassed,
  runLoading,
  codeStyle,
  solutionCode,
  runLabel,
  runSuccessLabel,
  runErrorLabel,
  solutionPlaceholder,
  runResult,
  onRun,
  onSolutionChange,
  solutionWrapperRef,
  solutionHighlightRef,
  solutionTextareaRef,
}: Props) {
  return (
    <PanelCard>
      <CodeWindowHeader
        label="Solution:"
        value={`level_${levelId}_solution.move`}
        metaContent={
          <>
            {hasPassed && (
              <Typography.Span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/50 bg-emerald-500/15 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-move-text">
                ✓ Passed
              </Typography.Span>
            )}
            <Typography.Span className="hidden lg:inline text-[10px] text-move-muted/80">
              Cmd/Ctrl+Enter to run
            </Typography.Span>
          </>
        }
        rightContent={
          <>
            <Button
              onClick={onRun}
              disabled={runLoading}
              variant={hasPassed ? "unstyled" : "accent"}
              size="none"
              className={`gap-2 px-3.5 py-2 text-xs sm:text-sm font-semibold tracking-wide ${
                hasPassed ? "rounded-lg border border-emerald-400/55 bg-emerald-500/15 text-move-text hover:bg-emerald-500/22" : ""
              }`}
              aria-label={
                runLoading
                  ? "Running solution"
                  : hasPassed
                    ? "Run solution again"
                    : "Run solution with Cmd or Control plus Enter shortcut"
              }
            >
              <Typography.Span
                aria-hidden
                className={`inline-flex size-4 items-center justify-center rounded-full border text-[10px] ${
                  hasPassed
                    ? "border-emerald-400/60 bg-emerald-500/20 text-move-text"
                    : "border-white/35 bg-white/15 text-white"
                }`}
              >
                {runLoading ? "…" : hasPassed ? "✓" : "▶"}
              </Typography.Span>
              {runLoading ? "Running…" : hasPassed ? "Run Again" : runLabel}
            </Button>
          </>
        }
      />
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
            onChange={(e) => onSolutionChange(e.target.value)}
            onKeyDown={(e) => {
              if ((e.metaKey || e.ctrlKey) && e.key === "Enter" && !runLoading) {
                e.preventDefault();
                onRun();
              }
            }}
            onScroll={(e) => {
              const el = solutionHighlightRef.current;
              if (el) {
                el.scrollTop = e.currentTarget.scrollTop;
                el.scrollLeft = e.currentTarget.scrollLeft;
              }
            }}
            placeholder={solutionPlaceholder}
            spellCheck={false}
            aria-label={`Solution editor for level ${levelId}`}
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
          <Typography.P
            variant="unstyled"
            className={`mb-1 font-semibold ${runResult.success ? "text-emerald-300" : "text-red-300"}`}
          >
            {runResult.success ? runSuccessLabel : runErrorLabel}
          </Typography.P>
          <pre className="text-inherit overflow-x-auto">{runResult.output}</pre>
        </div>
      )}
    </PanelCard>
  );
}
