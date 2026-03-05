import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "panel" | "accentSoft" | "accent" | "unstyled";
type ButtonSize = "icon" | "sm" | "md" | "none";

const BASE_BUTTON_CLASS =
  "inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-oz-violet/60 disabled:cursor-not-allowed disabled:opacity-60 touch-manipulation";

const BUTTON_VARIANT_CLASS: Record<ButtonVariant, string> = {
  panel: "rounded-lg border border-move-border bg-move-panel text-move-text hover:bg-move-border/30 active:scale-[0.98]",
  accentSoft: "rounded-md border border-oz-violet/40 bg-oz-violet/15 text-oz-violet hover:bg-oz-violet/25",
  accent:
    "rounded-lg border border-oz-violet/70 bg-gradient-to-r from-oz-violet to-indigo-500 text-white shadow-[0_0_18px_rgba(124,58,237,0.35)] hover:brightness-110",
  unstyled: "",
};

const BUTTON_SIZE_CLASS: Record<ButtonSize, string> = {
  icon: "size-10",
  sm: "px-3 py-1.5 text-xs sm:text-sm font-medium",
  md: "px-3 py-2 text-sm font-medium",
  none: "",
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
