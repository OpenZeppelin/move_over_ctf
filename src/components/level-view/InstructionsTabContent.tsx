import ReactMarkdown from "react-markdown";
import { HintsPanel } from "@/components/level-view/HintsPanel";

type Props = {
  levelId: number;
  instructions: string;
  hints: string[];
  revealedHintCount: number;
  onRevealNextHint: () => void;
};

export function InstructionsTabContent({
  levelId,
  instructions,
  hints,
  revealedHintCount,
  onRevealNextHint,
}: Props) {
  return (
    <div id="panel-instructions" role="tabpanel" aria-labelledby="tab-instructions" className="space-y-5">
      <article className="prose prose-sm max-w-none text-move-text prose-headings:text-move-text prose-p:text-move-text prose-li:text-move-text">
        <ReactMarkdown
          className="[&_h1]:text-lg [&_h1]:font-semibold [&_h2]:text-base [&_h2]:mt-6 [&_h3]:text-sm [&_ul]:list-disc [&_ul]:pl-6 [&_ol]:list-decimal [&_ol]:pl-6 [&_p]:leading-relaxed [&_pre]:font-mono [&_code]:font-mono"
        >
          {instructions}
        </ReactMarkdown>
      </article>
      <HintsPanel
        levelId={levelId}
        hints={hints}
        revealedHintCount={revealedHintCount}
        onRevealNextHint={onRevealNextHint}
      />
    </div>
  );
}
