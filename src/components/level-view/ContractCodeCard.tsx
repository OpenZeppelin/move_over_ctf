import type { CSSProperties } from "react";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import type { LevelContractModule } from "@/data/levels/types";
import { CodeWindowHeader } from "@/components/ui/CodeWindowHeader";
import { PanelCard } from "@/components/ui/PanelCard";
import { Tabs, TabsList, TabsTrigger } from "@openzeppelin/ui-components";

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
          <TabsList className="flex h-auto w-full justify-start gap-1 rounded-none border-b border-border bg-card px-3 py-2 shadow-none">
            {contractModules.map((contract, idx) => (
              <TabsTrigger
                key={`${contract.module}-${idx}`}
                value={String(idx)}
                className="rounded-md px-2.5 py-1 text-[11px] font-mono text-muted-foreground transition-colors hover:text-foreground data-[state=active]:bg-muted data-[state=active]:text-foreground data-[state=active]:shadow-sm sm:text-xs"
                title={`Open ${contract.module}.move`}
                aria-label={`Open ${contract.module}.move`}
              >
                {contract.module}.move
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>
      )}
      <div className="border-l-[3px] border-l-[var(--selected)] bg-card">
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
