"use client";

import { ThemeProvider as NextThemesProvider } from "next-themes";
import type { ReactNode } from "react";
import { TooltipProvider } from "@openzeppelin/ui-components";

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem
      disableTransitionOnChange
    >
      <TooltipProvider delayDuration={300}>{children}</TooltipProvider>
    </NextThemesProvider>
  );
}
