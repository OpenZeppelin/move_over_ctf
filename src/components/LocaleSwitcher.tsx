"use client";

import { usePathname, useRouter } from "next/navigation";
import { useLocale } from "@/contexts/LocaleContext";
import { LOCALE_OPTIONS } from "@/i18n/locales";
import type { Locale } from "@/i18n/types";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@openzeppelin/ui-components";

export function LocaleSwitcher() {
  const { locale, setLocale, t } = useLocale();
  const pathname = usePathname();
  const router = useRouter();

  function handleValueChange(newLocale: string) {
    setLocale(newLocale as Locale);
    const pathWithoutLocale = pathname.replace(/^\/[^/]+/, "") || "/";
    router.push(`/${newLocale}${pathWithoutLocale}`);
  }

  return (
    <Select value={locale} onValueChange={handleValueChange} dir="ltr">
      <SelectTrigger
        className="min-h-[40px] min-w-[100px] gap-1.5 rounded-md border border-input bg-background text-foreground hover:bg-accent sm:min-w-[140px] [&>svg]:size-4 [&>svg]:text-muted-foreground"
        aria-label={t("header.language")}
      >
        <SelectValue placeholder={t("header.language")} className="max-w-[120px] truncate sm:max-w-[140px]" />
      </SelectTrigger>
      <SelectContent
        className="max-h-[70vh] min-w-[180px] border-border bg-popover text-popover-foreground"
        position="popper"
        sideOffset={4}
      >
        {LOCALE_OPTIONS.map((option) => (
          <SelectItem
            key={option.code}
            value={option.code}
            className="cursor-pointer px-3 py-2.5 text-sm transition-colors hover:bg-accent data-[highlighted]:bg-accent data-[state=checked]:bg-selected/10 data-[state=checked]:text-selected data-[state=checked]:font-medium"
            dir="auto"
          >
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
