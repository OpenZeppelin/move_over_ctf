import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "panel" | "accentSoft";
type ButtonSize = "icon" | "sm" | "md";

const BASE_BUTTON_CLASS =
  "inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oz-violet/60 disabled:cursor-not-allowed disabled:opacity-60 touch-manipulation";

const BUTTON_VARIANT_CLASS: Record<ButtonVariant, string> = {
  panel: "rounded-lg border border-move-border bg-move-panel text-move-text hover:bg-move-border/30 active:scale-[0.98]",
  accentSoft: "rounded-md border border-oz-violet/40 bg-oz-violet/15 text-oz-violet hover:bg-oz-violet/25",
};

const BUTTON_SIZE_CLASS: Record<ButtonSize, string> = {
  icon: "size-10",
  sm: "px-3 py-1.5 text-xs sm:text-sm font-medium",
  md: "px-3 py-2 text-sm font-medium",
};

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({ variant = "panel", size = "md", className, type = "button", ...props }: Props) {
  return (
    <button
      type={type}
      className={joinClassNames(BASE_BUTTON_CLASS, BUTTON_VARIANT_CLASS[variant], BUTTON_SIZE_CLASS[size], className)}
      {...props}
    />
  );
}
