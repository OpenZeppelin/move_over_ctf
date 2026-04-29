import type { ReactNode } from "react";
import { Typography } from "@/components/ui/Typography";

type Props = {
  label: string;
  value: ReactNode;
  metaContent?: ReactNode;
  rightContent?: ReactNode;
};

export function CodeWindowHeader({ label, value, metaContent, rightContent }: Props) {
  return (
    <div className="flex items-center gap-2 px-4 py-2.5 border-b border-border bg-muted/50 font-mono text-xs text-muted-foreground">
      <Typography.Span className="w-2 h-2 rounded-full bg-red-500/80" aria-hidden />
      <Typography.Span className="w-2 h-2 rounded-full bg-amber-500/80" aria-hidden />
      <Typography.Span className="w-2 h-2 rounded-full bg-emerald-500/80" aria-hidden />
      <Typography.Span className="ml-2">
        <Typography.Span className="text-muted-foreground/80">{label}</Typography.Span>{" "}
        <Typography.Span className="text-selected">{value}</Typography.Span>
      </Typography.Span>
      {metaContent ? <div className="inline-flex items-center gap-2">{metaContent}</div> : null}
      {rightContent ? <div className="ml-auto inline-flex items-center gap-2">{rightContent}</div> : null}
    </div>
  );
}
