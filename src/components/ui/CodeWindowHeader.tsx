import type { ReactNode } from "react";

type Props = {
  label: string;
  value: ReactNode;
  metaContent?: ReactNode;
  rightContent?: ReactNode;
};

export function CodeWindowHeader({ label, value, metaContent, rightContent }: Props) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 border-b border-move-border bg-move-dark/80 font-mono text-xs text-move-muted">
      <span className="w-2 h-2 rounded-full bg-red-500/80" aria-hidden />
      <span className="w-2 h-2 rounded-full bg-amber-500/80" aria-hidden />
      <span className="w-2 h-2 rounded-full bg-emerald-500/80" aria-hidden />
      <span className="ml-2">
        <span className="text-move-muted/80">{label}</span>{" "}
        <span className="text-move-accent">{value}</span>
      </span>
      {metaContent ? <div className="inline-flex items-center gap-2">{metaContent}</div> : null}
      {rightContent ? <div className="ml-auto inline-flex items-center gap-2">{rightContent}</div> : null}
    </div>
  );
}
