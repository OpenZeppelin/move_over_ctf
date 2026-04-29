"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLocale } from "@/contexts/LocaleContext";
import { PanelCard } from "@/components/ui/PanelCard";
import { Typography } from "@/components/ui/Typography";
import { Footer } from "@/components/Footer";

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
      <main className="flex-1 overflow-auto bg-background p-5 sm:p-8">
        <div className="mx-auto max-w-5xl min-h-full flex items-center justify-center">
          <PanelCard as="section" className="w-full">
            <div className="border-b border-border bg-background/60 px-4 sm:px-6 py-3 font-mono text-xs text-muted-foreground">
              {t("landing.landingUrl")}
            </div>

            <div className="p-5 sm:p-8">
              <div className="mx-auto max-w-3xl text-center">
                <Typography.H1 variant="hero">
                  Move<Typography.Span className="text-selected">-over</Typography.Span>
                </Typography.H1>
                <Typography.P
                  variant="unstyled"
                  className="mt-2 text-sm sm:text-lg text-selected font-medium"
                >
                  {t("landing.subtitle")}
                </Typography.P>
                <Typography.P className="mt-4">
                  {t("landing.intro")}
                </Typography.P>
                <Typography.P variant="smallMuted" className="mt-3">
                  {t("landing.introMuted")}{" "}
                  <a
                    href="https://github.com/OpenZeppelin/move_over_ctf"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-selected hover:underline"
                  >
                    {t("landing.github")}
                  </a>
                  .
                </Typography.P>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-3">
                <div className="rounded-xl border border-border bg-muted/50 p-4 text-center">
                  <Typography.P variant="cardLabel">{t("landing.cardFormat")}</Typography.P>
                  <Typography.P variant="cardValue" className="mt-1">
                    {t("landing.cardValueCtf")}
                  </Typography.P>
                </div>
                <div className="rounded-xl border border-border bg-muted/50 p-4 text-center">
                  <Typography.P variant="cardLabel">{t("landing.cardRuntime")}</Typography.P>
                  <Typography.P variant="cardValue" className="mt-1">
                    {t("landing.cardValueBrowser")}
                  </Typography.P>
                </div>
                <div className="rounded-xl border border-border bg-muted/50 p-4 text-center">
                  <Typography.P variant="cardLabel">{t("landing.cardGoal")}</Typography.P>
                  <Typography.P variant="cardValue" className="mt-1">
                    {t("landing.cardValueReturnFlag")}
                  </Typography.P>
                </div>
              </div>

              <div className="mt-5 rounded-xl border border-border bg-muted/40 overflow-hidden">
                <div className="px-4 py-2 border-b border-border bg-card/60 font-mono text-xs text-selected">
                  {t("landing.feedTitle")}
                </div>
                <div className="relative h-56 sm:h-64 overflow-hidden font-mono text-[11px] sm:text-xs glitch-feed">
                  <div className="pointer-events-none absolute inset-x-0 top-0 h-10 bg-gradient-to-b from-background/95 to-transparent z-10" />
                  <div className="pointer-events-none absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-background/95 to-transparent z-10" />
                  <div className="pointer-events-none absolute inset-0 z-20 glitch-scanlines" />
                  <div className="pointer-events-none absolute inset-0 z-[21] glitch-slices" />
                  <div className="hack-scroll-track absolute inset-0 px-4 py-3 text-muted-foreground">
                    <div className="hack-glitch-copy">
                      <div className="space-y-1.5">
                        <Typography.P variant="unstyled">{t("landing.feedLine1")}</Typography.P>
                        <Typography.P variant="unstyled">{t("landing.feedLine2")}</Typography.P>
                        <Typography.P variant="unstyled">{t("landing.feedLine3")}</Typography.P>
                        <Typography.P variant="unstyled">{t("landing.feedLine4")}</Typography.P>
                        <Typography.P variant="unstyled">{t("landing.feedLine5")}</Typography.P>
                        <Typography.P variant="unstyled">
                          <Typography.Span>{t("landing.feedLine6Prefix")} </Typography.Span>
                          <ProgressiveGlitchText text="OpenZeppelin" className="text-selected" />
                        </Typography.P>
                        <Typography.P variant="unstyled">{t("landing.feedLine7")}</Typography.P>
                        <Typography.P variant="unstyled">{t("landing.feedLine8")}</Typography.P>
                        <Typography.P variant="unstyled" className="text-foreground">
                          {t("landing.feedLine9")}
                        </Typography.P>
                      </div>
                      <div className="mt-6 space-y-1.5">
                        <Typography.P variant="unstyled">{t("landing.feedLine1")}</Typography.P>
                        <Typography.P variant="unstyled">{t("landing.feedLine2")}</Typography.P>
                        <Typography.P variant="unstyled">{t("landing.feedLine3")}</Typography.P>
                        <Typography.P variant="unstyled">{t("landing.feedLine4")}</Typography.P>
                        <Typography.P variant="unstyled">{t("landing.feedLine5")}</Typography.P>
                        <Typography.P variant="unstyled">
                          <Typography.Span>{t("landing.feedLine6Prefix")} </Typography.Span>
                          <ProgressiveGlitchText text="OpenZeppelin" className="text-selected" />
                        </Typography.P>
                        <Typography.P variant="unstyled">{t("landing.feedLine7")}</Typography.P>
                        <Typography.P variant="unstyled">{t("landing.feedLine8")}</Typography.P>
                        <Typography.P variant="unstyled" className="text-foreground">
                          {t("landing.feedLine9")}
                        </Typography.P>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <section className="mt-6 rounded-xl border border-border bg-muted/30 p-5 sm:p-6 text-left">
                <Typography.H2>
                  {t("landing.sectionTitle")}
                </Typography.H2>
                <Typography.P className="mt-2">
                  {t("landing.sectionIntro")}
                </Typography.P>

                <Typography.H3 className="mt-4">
                  {t("landing.howItWorksTitle")}
                </Typography.H3>
                <Typography.P className="mt-2">
                  {t("landing.howItWorksBody")}
                </Typography.P>

                <Typography.H4 className="mt-4">
                  {t("landing.writeRunTitle")}
                </Typography.H4>
                <Typography.P className="mt-2">
                  {t("landing.writeRunBody")}
                </Typography.P>

                <Typography.H5 className="mt-4">{t("landing.coreSkillsTitle")}</Typography.H5>
                <ul className="mt-2 list-disc pl-5 space-y-1 text-sm text-foreground/90">
                  <li>{t("landing.coreSkill1")}</li>
                  <li>{t("landing.coreSkill2")}</li>
                  <li>{t("landing.coreSkill3")}</li>
                </ul>

                <Typography.H6 className="mt-4">{t("landing.recommendedTitle")}</Typography.H6>
                <Typography.P className="mt-2">
                  {t("landing.recommendedBody")}
                </Typography.P>
              </section>
            </div>

            <div className="border-t border-border px-4 sm:px-6 py-4 sm:py-5">
              <div className="flex flex-wrap justify-center gap-3">
                <Link
                  href={`/${locale}/levels/how-to-play`}
                  className="group inline-flex items-center justify-center gap-2 h-11 px-6 sm:px-8 rounded-md bg-foreground text-background text-sm font-medium hover:bg-foreground/90 transition-colors"
                >
                  {t("landing.startHowToPlay")}
                  <Typography.Span className="opacity-80 group-hover:translate-x-1 transition-transform">→</Typography.Span>
                </Link>
                <Link
                  href={`/${locale}/levels/0`}
                  className="inline-flex items-center justify-center h-11 px-6 sm:px-8 rounded-md border border-input bg-background text-foreground text-sm font-medium hover:bg-accent transition-colors"
                >
                  {t("landing.cta")}
                </Link>
              </div>
            </div>
          </PanelCard>
        </div>
      </main>

      <Footer />
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
