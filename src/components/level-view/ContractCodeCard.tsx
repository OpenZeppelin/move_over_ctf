import type { CSSProperties } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import type { LevelContractModule } from "@/data/levels/types";
import { CodeWindowHeader } from "@/components/ui/CodeWindowHeader";
import { PanelCard } from "@/components/ui/PanelCard";
import { Tabs, TabsList, TabsTrigger } from "@openzeppelin/ui-builder-ui";

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
        <Tabs
          value={String(activeContractIndex)}
          onValueChange={(v) => onSelectContract(Number(v))}
          className="w-full"
        >
          <TabsList className="flex h-auto w-full justify-start gap-1 rounded-none border-b border-move-border bg-move-panel/60 p-2 shadow-none">
            {contractModules.map((contract, idx) => (
              <TabsTrigger
                key={`${contract.module}-${idx}`}
                value={String(idx)}
                className="rounded-md border px-2.5 py-1 text-[11px] font-mono data-[state=inactive]:border-move-border data-[state=inactive]:bg-move-dark data-[state=inactive]:text-move-muted data-[state=inactive]:hover:text-move-text data-[state=active]:border-oz-violet/45 data-[state=active]:bg-oz-violet/15 data-[state=active]:text-oz-violet sm:text-xs"
                title={`Open ${contract.module}.move`}
                aria-label={`Open ${contract.module}.move`}
              >
                {contract.module}.move
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
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
