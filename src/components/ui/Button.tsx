import type { ButtonHTMLAttributes } from "react";

type ButtonVariant = "default" | "outline" | "ghost" | "accentSoft";
type ButtonSize = "icon" | "sm" | "md";

const BASE_BUTTON_CLASS =
  "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 cursor-pointer";

const BUTTON_VARIANT_CLASS: Record<ButtonVariant, string> = {
  default: "bg-primary text-primary-foreground hover:bg-primary/90",
  outline: "border border-input bg-background text-foreground hover:bg-accent hover:text-accent-foreground",
  ghost: "text-foreground hover:bg-accent hover:text-accent-foreground",
  accentSoft: "border border-selected/30 bg-selected/10 text-selected hover:bg-selected/15",
};

const BUTTON_SIZE_CLASS: Record<ButtonSize, string> = {
  icon: "size-10 shrink-0",
  sm: "h-9 px-3",
  md: "h-10 px-4 py-2",
};

function joinClassNames(...classNames: Array<string | undefined>) {
  return classNames.filter(Boolean).join(" ");
}

type Props = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
};

export function Button({ variant = "default", size = "md", className, type = "button", ...props }: Props) {
  return (
    <button
      type={type}
      className={joinClassNames(BASE_BUTTON_CLASS, BUTTON_VARIANT_CLASS[variant], BUTTON_SIZE_CLASS[size], className)}
      {...props}
    />
  );
}
