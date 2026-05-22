import { forwardRef } from "react";
import { deriveStamp } from "@/lib/completionStorage";

type Props = {
  name: string;
  levelsTotal: number;
  date: string;
  theme: "light" | "dark";
};

const PALETTE = {
  dark: {
    bg: "#0e1116",
    text: "#e6edf3",
    muted: "#8b949e",
    rule: "#30363d",
    ozAsset: "/oz-logo.svg", // white wordmark
    moveSuiAsset: "/move-sui-logo-white.svg",
    stampAsset: "/stamp-white.svg",
  },
  light: {
    bg: "#f3f5f7",
    text: "#0d1117",
    muted: "#5b6471",
    rule: "#d0d7de",
    ozAsset: "/OZ-Logo-BlackBG.svg", // black wordmark (named "BlackBG" but the fill is black, used on light bg)
    moveSuiAsset: "/move-sui-logo-black.svg",
    stampAsset: "/stamp-black.svg",
  },
} as const;

const FONT_FAMILY = "ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace";
const SANS_FAMILY = "ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, sans-serif";

const MONTHS = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
] as const;

function formatStampDate(iso: string): { line1: string; line2: string } {
  const parts = iso.split("-");
  const y = parts[0] ?? "";
  const m = parseInt(parts[1] ?? "1", 10);
  const d = parseInt(parts[2] ?? "1", 10);
  const monthIdx = Math.max(0, Math.min(11, m - 1));
  return { line1: `${MONTHS[monthIdx]} ${d}`, line2: y };
}

/**
 * Completion certificate — matches the Move-over CTF certificate design.
 *
 * Layout is inline SVG so the card can be rasterised to PNG via Canvas
 * (see CompletionShare#svgToPngBlob). External brand assets — the
 * "MOVE-OVER CTF · Sui" lockup and the round completion stamp — are
 * referenced via <image href> and pre-inlined as data URIs by the
 * rasteriser before serialising, so they render in the PNG export too.
 */
export const CompletionCard = forwardRef<SVGSVGElement, Props>(function CompletionCard(
  { name, levelsTotal, date, theme },
  ref,
) {
  const p = PALETTE[theme];
  const displayName = (name.trim() || "anonymous").slice(0, 24);
  const stamp = deriveStamp(name);
  const stampDate = formatStampDate(date);

  // move-sui-logo asset is 286×31; we render at native size, top-right.
  const moveSuiW = 286;
  const moveSuiH = 31;
  const moveSuiX = 1140 - moveSuiW;
  const moveSuiY = 56;

  // stamp asset is 277×277; we render at 200×200, bottom-right.
  const stampSize = 200;
  const stampX = 1140 - stampSize;
  const stampY = 360;
  // Centre of the stamp in card coordinates — used for the date overlay.
  const stampCx = stampX + stampSize / 2;
  // The "MAY 21 / 2026" date sits in the inner ~90px-tall white area; two
  // baselines, stacked. Tuned visually to land in the same spot the asset
  // used to render its baked-in date.
  const dateLine1Y = stampY + stampSize * 0.50;
  const dateLine2Y = stampY + stampSize * 0.63;

  return (
    <svg
      ref={ref}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 1200 630"
      width={1200}
      height={630}
      preserveAspectRatio="xMidYMid meet"
      style={{ width: "100%", height: "auto", display: "block" }}
      role="img"
      aria-label={`Move-over CTF completion certificate for ${displayName}`}
    >
      {/* Card background */}
      <rect width="1200" height="630" fill={p.bg} />

      {/* ───── Header ────────────────────────────────────────────── */}

      {/* OpenZeppelin logo — top-left. Asset is 522×93, render at ~178×32. */}
      <image
        href={p.ozAsset}
        x={60}
        y={50}
        width={178}
        height={32}
        preserveAspectRatio="xMinYMid meet"
      />

      {/* "MOVE-OVER CTF | Sui" lockup — top-right */}
      <image
        href={p.moveSuiAsset}
        x={moveSuiX}
        y={moveSuiY}
        width={moveSuiW}
        height={moveSuiH}
        preserveAspectRatio="xMidYMid meet"
      />

      {/* ───── Center: command title + rule + stats ───────────────── */}

      <text
        x="600"
        y="270"
        textAnchor="middle"
        fontFamily={FONT_FAMILY}
        fontSize="48"
        fontWeight="800"
        fill={p.text}
        letterSpacing="-1"
      >
        $ ./move-over --solved-all
      </text>

      <line x1="260" y1="310" x2="940" y2="310" stroke={p.rule} strokeWidth="1" />

      <g
        fontFamily={FONT_FAMILY}
        fontSize="26"
        fill={p.text}
        textAnchor="middle"
      >
        <text x="600" y="368">User: {displayName}</text>
        <text x="600" y="412">
          Flags: {levelsTotal} / {levelsTotal} captured
        </text>
        <text x="600" y="456">Stamp: {stamp}</text>
      </g>

      {/* ───── Bottom-left: terminal output ───────────────────────── */}

      <g transform="translate(60, 540)" fontFamily={FONT_FAMILY} fontSize="14" fill={p.muted}>
        <text x="0" y="0">&gt; level_8::solve(margin_note)</text>
        <text x="0" y="22">BlackbookFlag {`{ }`}</text>
        <text x="0" y="44">completed: {date}</text>
      </g>

      {/* Round "Certificate of Completion" stamp — bottom-right */}
      <image
        href={p.stampAsset}
        x={stampX}
        y={stampY}
        width={stampSize}
        height={stampSize}
        preserveAspectRatio="xMidYMid meet"
      />

      {/* Dynamic date overlay — sits inside the stamp where the original
          static "MAY 21 / 2026" path used to be. */}
      <g
        fontFamily={SANS_FAMILY}
        fontSize="20"
        fontWeight="700"
        fill={p.text}
        textAnchor="middle"
        letterSpacing="0.5"
      >
        <text x={stampCx} y={dateLine1Y}>{stampDate.line1}</text>
        <text x={stampCx} y={dateLine2Y}>{stampDate.line2}</text>
      </g>
    </svg>
  );
});
