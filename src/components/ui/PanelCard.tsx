import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  className?: string;
  as?: "div" | "section";
};

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

export function PanelCard({ children, className, as: Tag = "div" }: Props) {
  return (
    <Tag
      className={joinClassNames(
        "rounded-xl border border-border overflow-hidden bg-card text-sm",
        className,
      )}
    >
      {children}
    </Tag>
  );
}
