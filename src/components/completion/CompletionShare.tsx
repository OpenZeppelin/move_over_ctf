"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/Button";
import { Typography } from "@/components/ui/Typography";
import { useLocale } from "@/contexts/LocaleContext";
import {
  getCompletionName,
  setCompletionName,
} from "@/lib/completionStorage";
import { CompletionCard } from "./CompletionCard";

type Props = {
  levelsTotal: number;
};

function todayISO(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function fileNameFor(name: string): string {
  const slug = name
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 32);
  return `move-over-ctf-${slug || "completion"}.png`;
}

async function svgToPngBlob(svgEl: SVGSVGElement): Promise<Blob | null> {
  const serializer = new XMLSerializer();
  const xml = serializer.serializeToString(svgEl);
  const svgBlob = new Blob([xml], { type: "image/svg+xml;charset=utf-8" });
  const url = URL.createObjectURL(svgBlob);

  try {
    return await new Promise<Blob | null>((resolve) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 1200;
        canvas.height = 630;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(null);
          return;
        }
        ctx.drawImage(img, 0, 0, 1200, 630);
        canvas.toBlob((blob) => resolve(blob), "image/png");
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function CompletionShare({ levelsTotal }: Props) {
  const { t } = useLocale();
  const { resolvedTheme } = useTheme();
  const cardTheme: "light" | "dark" = resolvedTheme === "light" ? "light" : "dark";
  const [name, setName] = useState("");
  const [hydrated, setHydrated] = useState(false);
  const [downloading, setDownloading] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const date = useMemo(() => todayISO(), []);

  useEffect(() => {
    setName(getCompletionName());
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    setCompletionName(name);
  }, [name, hydrated]);

  async function handleDownload() {
    if (!svgRef.current) return;
    setDownloading(true);
    try {
      const blob = await svgToPngBlob(svgRef.current);
      if (!blob) return;
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = fileNameFor(name);
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="flex w-full flex-col gap-5">
      <label className="flex flex-col gap-2">
        <Typography.Span className="text-sm font-medium text-foreground">
          {t("completion.nameLabel")}
        </Typography.Span>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={32}
          placeholder={t("completion.namePlaceholder")}
          className="h-10 w-full rounded-md border border-border bg-background px-3 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-1 focus:ring-selected"
          aria-label={t("completion.nameLabel")}
        />
      </label>

      <div className="overflow-hidden rounded-xl border border-border">
        <CompletionCard
          ref={svgRef}
          name={name}
          levelsTotal={levelsTotal}
          date={date}
          theme={cardTheme}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <Button
          onClick={handleDownload}
          disabled={downloading}
          variant="accentSoft"
          size="sm"
          className="h-10 px-4"
          aria-label={t("completion.downloadAriaLabel")}
        >
          {downloading ? t("completion.downloading") : t("completion.downloadPng")}
        </Button>
      </div>
    </div>
  );
}
