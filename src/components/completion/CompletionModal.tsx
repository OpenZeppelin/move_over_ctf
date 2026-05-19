"use client";

import Link from "next/link";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@openzeppelin/ui-components";
import { useLocale } from "@/contexts/LocaleContext";
import { CompletionShare } from "./CompletionShare";

type Props = {
  /** Controlled by the parent — set to true to show the dialog. */
  open: boolean;
  onClose: () => void;
  levelsTotal: number;
};

export function CompletionModal({ open, onClose, levelsTotal }: Props) {
  const { t, locale } = useLocale();

  return (
    <Dialog open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t("completion.modalTitle")}</DialogTitle>
          <DialogDescription>{t("completion.modalDescription")}</DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <CompletionShare levelsTotal={levelsTotal} />
        </div>
        <div className="mt-4 text-sm text-muted-foreground">
          <Link
            href={`/${locale}/completion`}
            className="text-selected hover:underline"
          >
            {t("completion.viewLater")}
          </Link>
        </div>
      </DialogContent>
    </Dialog>
  );
}
