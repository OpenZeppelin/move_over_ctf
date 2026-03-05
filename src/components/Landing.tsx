"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/contexts/LocaleContext";
import { PanelCard } from "@/components/ui/PanelCard";
import { Typography } from "@/components/ui/Typography";

const LETTERS_UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function randomizeChar(char: string): string {
  if (/[A-Z]/.test(char)) {
    return LETTERS_UPPER[Math.floor(Math.random() * LETTERS_UPPER.length)];
  }
  if (/[a-z]/.test(char)) {
    return LETTERS_UPPER[Math.floor(Math.random() * LETTERS_UPPER.length)].toLowerCase();
  }
  return char;
}

function ProgressiveGlitchText({ text, className }: { text: string; className?: string }) {
  const [display, setDisplay] = useState(text);

  useEffect(() => {
    let cycleInterval: number | undefined;
    let stepInterval: number | undefined;
    let settleTimeout: number | undefined;
    let kickoffTimeout: number | undefined;
    let running = false;

    const runCycle = () => {
      if (running) return;
      running = true;
      let step = 0;

      stepInterval = window.setInterval(() => {
        step += 1;
        setDisplay(
          text
            .split("")
            .map((char, index) => (index < step ? randomizeChar(char) : char))
            .join(""),
        );

        if (step >= text.length) {
          if (stepInterval !== undefined) window.clearInterval(stepInterval);
          settleTimeout = window.setTimeout(() => {
            setDisplay(text);
            running = false;
          }, 220);
        }
      }, 70);
    };

    kickoffTimeout = window.setTimeout(runCycle, 1700);
    cycleInterval = window.setInterval(runCycle, 7000);

    return () => {
      if (kickoffTimeout !== undefined) window.clearTimeout(kickoffTimeout);
      if (cycleInterval !== undefined) window.clearInterval(cycleInterval);
      if (stepInterval !== undefined) window.clearInterval(stepInterval);
      if (settleTimeout !== undefined) window.clearTimeout(settleTimeout);
    };
  }, [text]);

  return <Typography.Span className={className}>{display}</Typography.Span>;
}

export function Landing() {
  const { t, locale } = useLocale();
  return (
    <div className="flex-1 flex flex-col min-h-0">
      <main className="flex-1 overflow-auto bg-move-dark p-4 sm:p-6">
        <div className="mx-auto max-w-5xl min-h-full flex items-center justify-center">
          <PanelCard as="section" className="w-full">
            <div className="border-b border-move-border bg-move-dark/60 px-4 sm:px-6 py-3 font-mono text-xs text-move-muted">
              move-over://landing
            </div>

            <div className="p-5 sm:p-8">
              <div className="mx-auto max-w-3xl text-center">
                <Typography.H1 variant="hero">
                  Move<Typography.Span className="text-oz-violet">-over</Typography.Span>
                </Typography.H1>
                <Typography.P
                  variant="unstyled"
                  className="mt-2 text-sm sm:text-lg text-oz-violet font-medium"
                >
                  Browser-based Move security wargame
                </Typography.P>
                <Typography.P className="mt-4">
                  Move-over is a browser-first CTF for Move security. Read vulnerable contracts, write the `run()`
                  exploit path, and return the right `*Flag` to clear each level.
                </Typography.P>
                <Typography.P variant="smallMuted" className="mt-3">
                  Move-over is open source. Explore the code on{" "}
                  <a
                    href="https://github.com/OpenZeppelin/move_over_ctf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-oz-violet hover:underline"
                  >
                    GitHub
                  </a>
                  .
                </Typography.P>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-move-border bg-move-dark/60 p-3 text-center">
                  <Typography.P variant="cardLabel">Format</Typography.P>
                  <Typography.P variant="cardValue" className="mt-1">
                    Capture-the-Flag
                  </Typography.P>
                </div>
                <div className="rounded-lg border border-move-border bg-move-dark/60 p-3 text-center">
                  <Typography.P variant="cardLabel">Runtime</Typography.P>
                  <Typography.P variant="cardValue" className="mt-1">
                    100% in Browser
                  </Typography.P>
                </div>
                <div className="rounded-lg border border-move-border bg-move-dark/60 p-3 text-center">
                  <Typography.P variant="cardLabel">Goal</Typography.P>
                  <Typography.P variant="cardValue" className="mt-1">
                    Return the `*Flag`
                  </Typography.P>
                </div>
              </div>

              <div className="mt-5 rounded-lg border border-move-border bg-move-dark/70 overflow-hidden">
                <div className="px-4 py-2 border-b border-move-border bg-move-panel/60 font-mono text-xs text-move-accent">
                  Live Security Feed
                </div>
                <div className="relative h-56 sm:h-64 overflow-hidden font-mono text-[11px] sm:text-xs glitch-feed">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-move-dark/95 to-transparent z-10" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-move-dark/95 to-transparent z-10" />
                  <div className="pointer-events-none absolute inset-0 z-20 glitch-scanlines" />
                  <div className="pointer-events-none absolute inset-0 z-[21] glitch-slices" />
                  <div className="hack-scroll-track absolute inset-0 px-4 py-3 text-move-muted">
                    <div className="hack-glitch-copy">
                      <div className="space-y-1.5">
                        <Typography.P variant="unstyled">[00:00:01] booting move-over browser runtime...</Typography.P>
                        <Typography.P variant="unstyled">[00:00:02] loading challenge set: genesis, lockbox, fallout</Typography.P>
                        <Typography.P variant="unstyled">[00:00:03] objective detected: return level::Flag</Typography.P>
                        <Typography.P variant="unstyled">[00:00:04] parsing run() template... ready</Typography.P>
                        <Typography.P variant="unstyled">[00:00:05] no wallet requested, no network required</Typography.P>
                        <Typography.P variant="unstyled">
                          <Typography.Span>[00:00:06] partner channel connected: </Typography.Span>
                          <ProgressiveGlitchText text="OpenZeppelin" className="text-oz-violet" />
                        </Typography.P>
                        <Typography.P variant="unstyled">[00:00:07] exploit simulation sandbox: active</Typography.P>
                        <Typography.P variant="unstyled">[00:00:08] verifier status: waiting for your code...</Typography.P>
                        <Typography.P variant="unstyled" className="text-move-text">
                          [00:00:09] write run() and press Run_
                        </Typography.P>
                      </div>
                      <div className="mt-6 space-y-1.5">
                        <Typography.P variant="unstyled">[00:00:01] booting move-over browser runtime...</Typography.P>
                        <Typography.P variant="unstyled">[00:00:02] loading challenge set: genesis, lockbox, fallout</Typography.P>
                        <Typography.P variant="unstyled">[00:00:03] objective detected: return level::Flag</Typography.P>
                        <Typography.P variant="unstyled">[00:00:04] parsing run() template... ready</Typography.P>
                        <Typography.P variant="unstyled">[00:00:05] no wallet requested, no network required</Typography.P>
                        <Typography.P variant="unstyled">
                          <Typography.Span>[00:00:06] partner channel connected: </Typography.Span>
                          <ProgressiveGlitchText text="OpenZeppelin" className="text-oz-violet" />
                        </Typography.P>
                        <Typography.P variant="unstyled">[00:00:07] exploit simulation sandbox: active</Typography.P>
                        <Typography.P variant="unstyled">[00:00:08] verifier status: waiting for your code...</Typography.P>
                        <Typography.P variant="unstyled" className="text-move-text">
                          [00:00:09] write run() and press Run_
                        </Typography.P>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <section className="mt-6 rounded-lg border border-move-border bg-move-dark/45 p-4 sm:p-6 text-left">
                <Typography.H2>
                  Move Smart Contract Security in a Browser Runtime
                </Typography.H2>
                <Typography.P className="mt-2">
                  Move-over is a browser-based security playground where you learn by doing. Instead of reading theory
                  only, you inspect vulnerable contract code, write an exploit flow, run it instantly, and verify that
                  your solution can return the expected proof object. The core loop is practical: read, write, run,
                  return, and improve.
                </Typography.P>

                <Typography.H3 className="mt-4">
                  How the Move-over Browser Workflow Operates
                </Typography.H3>
                <Typography.P className="mt-2">
                  Every level runs in an in-browser runtime, so there is no wallet setup, chain state dependency, or
                  local VM requirement to start practicing. You focus on Move security logic: ownership checks,
                  capability misuse, object state transitions, and how to craft a safe, reproducible exploit path that
                  passes verification.
                </Typography.P>

                <Typography.H4 className="mt-4">
                  Write `run()`, Return the `Flag`, and Pass the Level
                </Typography.H4>
                <Typography.P className="mt-2">
                  Your target is explicit: write the `run()` body so it can return the correct `*Flag` object for the
                  challenge. If the return type and behavior match the level contract requirements, the level is
                  cleared and your progress is saved.
                </Typography.P>

                <Typography.H5 className="mt-4">Core Skills You Practice</Typography.H5>
                <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-move-text/90">
                  <li>Read and reason about Move smart contract security behavior.</li>
                  <li>Write exploit-oriented logic in a controlled browser environment.</li>
                  <li>Return proof objects correctly and validate deterministic outcomes.</li>
                </ul>

                <Typography.H6 className="mt-4">Recommended Starting Path</Typography.H6>
                <Typography.P className="mt-2">
                  Start with Genesis for fundamentals, continue with Lockbox for object manipulation patterns, and then
                  tackle Fallout for deeper exploit reasoning. This sequence builds practical Move security intuition
                  step by step.
                </Typography.P>
              </section>
            </div>

            <div className="border-t border-move-border px-4 sm:px-6 py-4 sm:py-5">
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href={`/${locale}/levels/how-to-play`}
                  className="group inline-flex items-center justify-center gap-2 min-h-[46px] px-5 sm:px-7 py-3 rounded-lg bg-oz-violet text-white text-sm sm:text-base font-semibold hover:brightness-110 active:scale-[0.98] transition-all"
                >
                  Start with How to Play
                  <Typography.Span className="opacity-80 group-hover:translate-x-1 transition-transform">→</Typography.Span>
                </Link>
                <Link
                  href={`/${locale}/levels/0`}
                  className="inline-flex items-center justify-center min-h-[46px] px-5 sm:px-7 py-3 rounded-lg border border-move-border bg-move-dark text-move-text text-sm sm:text-base font-semibold hover:bg-move-panel transition-colors"
                >
                  {t("landing.cta")}
                </Link>
              </div>
            </div>
          </PanelCard>
        </div>
      </main>

      <footer className="shrink-0 border-t border-move-border bg-move-panel/70 px-4 py-2.5">
        <div className="mx-auto max-w-5xl flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-move-muted">
          <a
            href="https://github.com/OpenZeppelin"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-move-text hover:underline"
          >
            GitHub
          </a>
          <Typography.Span aria-hidden>·</Typography.Span>
          <a
            href="https://x.com/openzeppelin"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-move-text hover:underline"
          >
            X
          </a>
          <Typography.Span aria-hidden>·</Typography.Span>
          <a
            href="https://www.linkedin.com/company/openzeppelin/"
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-move-text hover:underline"
          >
            LinkedIn
          </a>
          <Typography.Span aria-hidden>·</Typography.Span>
          <Typography.Span>© 2026 Zeppelin Group Ltd</Typography.Span>
        </div>
      </footer>
      <style jsx>{`
        .glitch-feed {
          animation: feed-flicker 7s steps(1, end) infinite;
        }

        .glitch-scanlines {
          background: repeating-linear-gradient(
            to bottom,
            rgba(255, 255, 255, 0.06),
            rgba(255, 255, 255, 0.06) 1px,
            transparent 1px,
            transparent 3px
          );
          mix-blend-mode: soft-light;
          opacity: 0.22;
          animation: scan-drift 3.2s linear infinite;
        }

        .glitch-slices {
          background:
            linear-gradient(
              to bottom,
              transparent 0 16%,
              rgba(255, 255, 255, 0.14) 16% 20%,
              transparent 20% 50%,
              rgba(148, 163, 184, 0.14) 50% 54%,
              transparent 54% 100%
            );
          mix-blend-mode: screen;
          opacity: 0;
          animation: slices-jump 7s steps(1, end) infinite;
        }

        .hack-scroll-track {
          animation: hack-scroll 14s linear infinite;
          will-change: transform;
        }

        .hack-glitch-copy {
          animation: text-glitch 7s steps(1, end) infinite;
        }

        @keyframes feed-flicker {
          0%,
          85%,
          100% {
            filter: none;
          }
          86% {
            filter: brightness(1.09) contrast(1.06);
          }
          88% {
            filter: brightness(0.95) contrast(1.08);
          }
          90% {
            filter: brightness(1.06) contrast(1.05);
          }
        }

        @keyframes text-glitch {
          0%,
          85%,
          100% {
            transform: translate(0, 0) skewX(0deg);
          }
          86% {
            transform: translate(-1px, 0) skewX(3deg);
          }
          88% {
            transform: translate(1px, 0) skewX(-3deg);
          }
          90% {
            transform: translate(-1px, 0) skewX(2deg);
          }
        }

        @keyframes slices-jump {
          0%,
          86%,
          100% {
            opacity: 0;
            transform: translateX(0);
          }
          87% {
            opacity: 0.5;
            transform: translateX(-3px);
          }
          89% {
            opacity: 0.4;
            transform: translateX(3px);
          }
          91% {
            opacity: 0.35;
            transform: translateX(-2px);
          }
        }

        @keyframes scan-drift {
          from {
            transform: translateY(0);
          }
          to {
            transform: translateY(6px);
          }
        }

        @keyframes hack-scroll {
          0% {
            transform: translateY(0%);
          }
          100% {
            transform: translateY(-50%);
          }
        }
      `}</style>
    </div>
  );
}
