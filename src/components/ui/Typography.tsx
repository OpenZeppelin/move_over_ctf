import type { HTMLAttributes } from "react";

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

const H1_VARIANTS = {
  default: "text-xl sm:text-2xl font-semibold text-foreground",
  hero: "text-3xl sm:text-5xl font-bold text-foreground tracking-tight",
  page: "font-mono text-xl sm:text-2xl font-semibold text-foreground",
  level: "font-mono text-base sm:text-lg font-semibold text-foreground",
  unstyled: "",
} as const;

const H2_VARIANTS = {
  default: "text-base sm:text-lg font-semibold text-foreground",
  compact: "text-sm sm:text-base font-semibold text-foreground",
  tiny: "text-xs sm:text-sm font-semibold text-foreground",
  sidebar: "text-sm font-semibold text-muted-foreground uppercase tracking-wider",
  unstyled: "",
} as const;

const H3_VARIANTS = {
  default: "text-sm sm:text-base font-semibold text-foreground",
  unstyled: "",
} as const;

const H4_VARIANTS = {
  default: "text-sm font-semibold text-foreground",
  unstyled: "",
} as const;

const H5_VARIANTS = {
  default: "text-xs uppercase tracking-wide text-muted-foreground",
  unstyled: "",
} as const;

const H6_VARIANTS = {
  default: "text-xs uppercase tracking-wide text-muted-foreground",
  unstyled: "",
} as const;

const P_VARIANTS = {
  default: "text-sm sm:text-base text-muted-foreground leading-relaxed",
  muted: "text-sm sm:text-base text-muted-foreground",
  smallMuted: "text-xs sm:text-sm text-muted-foreground",
  tinyMuted: "text-[11px] sm:text-xs text-muted-foreground",
  cardLabel: "font-mono text-[10px] uppercase tracking-wide text-muted-foreground",
  cardValue: "text-sm font-semibold text-foreground",
  unstyled: "",
} as const;

type HeadingProps<V extends string> = HTMLAttributes<HTMLHeadingElement> & {
  variant?: V;
};

type ParagraphProps<V extends string> = HTMLAttributes<HTMLParagraphElement> & {
  variant?: V;
};

type SpanProps = HTMLAttributes<HTMLSpanElement>;

function H1({ variant = "default", className, ...props }: HeadingProps<keyof typeof H1_VARIANTS>) {
  return <h1 className={joinClassNames(H1_VARIANTS[variant], className)} {...props} />;
}

function H2({ variant = "default", className, ...props }: HeadingProps<keyof typeof H2_VARIANTS>) {
  return <h2 className={joinClassNames(H2_VARIANTS[variant], className)} {...props} />;
}

function H3({ variant = "default", className, ...props }: HeadingProps<keyof typeof H3_VARIANTS>) {
  return <h3 className={joinClassNames(H3_VARIANTS[variant], className)} {...props} />;
}

function H4({ variant = "default", className, ...props }: HeadingProps<keyof typeof H4_VARIANTS>) {
  return <h4 className={joinClassNames(H4_VARIANTS[variant], className)} {...props} />;
}

function H5({ variant = "default", className, ...props }: HeadingProps<keyof typeof H5_VARIANTS>) {
  return <h5 className={joinClassNames(H5_VARIANTS[variant], className)} {...props} />;
}

function H6({ variant = "default", className, ...props }: HeadingProps<keyof typeof H6_VARIANTS>) {
  return <h6 className={joinClassNames(H6_VARIANTS[variant], className)} {...props} />;
}

function P({ variant = "default", className, ...props }: ParagraphProps<keyof typeof P_VARIANTS>) {
  return <p className={joinClassNames(P_VARIANTS[variant], className)} {...props} />;
}

function Span({ className, ...props }: SpanProps) {
  return <span className={className} {...props} />;
}

export const Typography = {
  H1,
  H2,
  H3,
  H4,
  H5,
  H6,
  P,
  Span,
};
