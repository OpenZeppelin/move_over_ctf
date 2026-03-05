import type { CSSProperties } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import type { LevelContractModule } from "@/data/levels/types";
import { CodeWindowHeader } from "@/components/ui/CodeWindowHeader";
import { Button } from "@/components/ui/Button";
import { PanelCard } from "@/components/ui/PanelCard";

type Props = {
  modulePath: string;
  contractModules: LevelContractModule[];
  activeContractIndex: number;
  onSelectContract: (index: number) => void;
  activeContractCode: string;
  codeStyle: Record<string, CSSProperties>;
};

export function ContractCodeCard({
  modulePath,
  contractModules,
  activeContractIndex,
  onSelectContract,
  activeContractCode,
  codeStyle,
}: Props) {
  return (
    <PanelCard>
      <CodeWindowHeader label="Contract:" value={`${modulePath}.move`} />
      {contractModules.length > 1 && (
        <div className="flex flex-wrap gap-1 border-b border-move-border bg-move-panel/60 px-2 py-1.5">
          {contractModules.map((contract, idx) => {
            const isActive = idx === activeContractIndex;
            return (
              <Button
                key={`${contract.module}-${idx}`}
                onClick={() => onSelectContract(idx)}
                variant="unstyled"
                size="none"
                className={`rounded-md border px-2.5 py-1 text-[11px] sm:text-xs font-mono ${
                  isActive
                    ? "border-oz-violet/45 bg-oz-violet/15 text-oz-violet"
                    : "border-move-border bg-move-dark text-move-muted hover:text-move-text"
                }`}
                title={`Open ${contract.module}.move`}
                aria-label={`Open ${contract.module}.move`}
                aria-pressed={isActive}
              >
                {contract.module}.move
              </Button>
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
    </PanelCard>
  );
}
