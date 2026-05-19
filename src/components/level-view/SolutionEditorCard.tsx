"use client";

import type { CSSProperties, RefObject } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import type { LevelRunConfig } from "@/data/levels";
import { CodeWindowHeader } from "@/components/ui/CodeWindowHeader";
import { PanelCard } from "@/components/ui/PanelCard";
import {
  Alert,
  AlertTitle,
  LoadingButton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@openzeppelin/ui-components";
import { Typography } from "@/components/ui/Typography";
import { useLocale } from "@/contexts/LocaleContext";
import { replaceTemplate } from "@/i18n/utils";

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
  const { t } = useLocale();
  const editorAriaLabel = replaceTemplate(t("level.solutionEditorAriaLabel"), { id: levelId });
  const runButtonAriaLabel = runLoading
    ? t("level.runningAriaLabel")
    : hasPassed
      ? t("level.runAgainAriaLabel")
      : t("level.runShortcutAriaLabel");
  return (
    <PanelCard>
      <CodeWindowHeader
        label={t("level.solutionLabel")}
        value={`level_${levelId}_solution.move`}
        metaContent={
          <>
            {hasPassed && (
              <Typography.Span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/50 bg-emerald-500/15 px-2 py-0.5 text-[10px] sm:text-xs font-semibold text-foreground">
                ✓ {t("level.passedBadge")}
              </Typography.Span>
            )}
            <Typography.Span className="hidden lg:inline text-[10px] text-muted-foreground/80">
              {t("level.runShortcutHint")}
            </Typography.Span>
          </>
        }
        rightContent={
          <>
            <Tooltip>
              <TooltipTrigger asChild>
                <LoadingButton
                  onClick={onRun}
                  disabled={runLoading}
                  loading={runLoading}
                  className={`inline-flex items-center justify-center gap-2 rounded-md h-9 px-4 text-sm font-medium cursor-pointer disabled:cursor-not-allowed ${
                    hasPassed
                      ? "border border-success/40 bg-success/10 text-foreground hover:bg-success/15"
                      : "bg-foreground text-background hover:bg-foreground/90"
                  }`}
                  aria-label={runButtonAriaLabel}
                >
                  <Typography.Span
                    aria-hidden
                    className={`inline-flex size-4 items-center justify-center rounded-full text-[10px] ${
                      hasPassed
                        ? "bg-success/20 text-foreground"
                        : "bg-background/15 text-background"
                    }`}
                  >
                    {runLoading ? "…" : hasPassed ? "✓" : "▶"}
                  </Typography.Span>
                  {runLoading ? t("level.running") : hasPassed ? t("level.runAgain") : runLabel}
                </LoadingButton>
              </TooltipTrigger>
              <TooltipContent className="border-border bg-popover text-popover-foreground">
                <p className="text-xs">{t("level.runTooltip")}</p>
              </TooltipContent>
            </Tooltip>
          </>
        }
      />
      <div className="border-l-[3px] border-l-[var(--selected)] bg-card">
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
            aria-label={editorAriaLabel}
            aria-keyshortcuts="Control+Enter Meta+Enter"
            className="absolute inset-0 w-full min-h-full overflow-auto resize-none border-0 focus:ring-0 focus:outline-none focus:bg-background/30 placeholder:text-muted-foreground/60 caret-[var(--code-text)] z-10 bg-transparent"
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
        <div className="px-4 pb-4 pt-5">
          <Alert
            variant={runResult.success ? "success" : "destructive"}
            className={`rounded-xl border p-4 font-mono text-xs [&>svg]:hidden ${
              runResult.success
                ? "border-emerald-600/30 bg-emerald-50 text-emerald-800 dark:border-emerald-400/30 dark:bg-emerald-500/10 dark:text-emerald-200"
                : "border-red-600/30 bg-red-50 text-red-800 dark:border-red-400/30 dark:bg-red-500/10 dark:text-red-200"
            }`}
            role="status"
            aria-live="polite"
          >
            <AlertTitle
              className={`mb-1 font-semibold ${
                runResult.success ? "text-emerald-700 dark:text-emerald-300" : "text-red-700 dark:text-red-300"
              }`}
            >
              {runResult.success ? runSuccessLabel : runErrorLabel}
            </AlertTitle>
            <pre className="text-inherit overflow-x-auto whitespace-pre-wrap break-words">{runResult.output}</pre>
          </Alert>
        </div>
      )}
    </PanelCard>
  );
}
