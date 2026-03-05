import type { ModuleDependencyGraph } from "@/lib/moduleDependencyGraph";
import { Typography } from "@/components/ui/Typography";

type Props = {
  graph: ModuleDependencyGraph;
  runModule?: string;
};

export function ModuleRelationshipMap({ graph, runModule }: Props) {
  return (
    <section className="rounded-lg border border-move-border bg-move-panel/60 p-3 sm:p-4">
      <Typography.H2 variant="tiny">Module Relationship Map</Typography.H2>
      <Typography.P variant="tinyMuted" className="mt-1">
        Cross-module calls detected in this level&apos;s contracts.
      </Typography.P>
      <div className="mt-3 space-y-2">
        {graph.modules.map((moduleName) => {
          const targets = graph.outgoing.get(moduleName) ?? [];
          const isRunModule = runModule === moduleName;
          return (
            <div key={moduleName} className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs">
              <Typography.Span
                className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono ${
                  isRunModule
                    ? "border-oz-violet/45 bg-oz-violet/15 text-oz-violet"
                    : "border-move-border bg-move-dark text-move-text"
                }`}
              >
                {moduleName}
                {isRunModule ? (
                  <Typography.Span className="rounded bg-oz-violet/20 px-1 py-[1px] text-[9px] uppercase tracking-wide">
                    run
                  </Typography.Span>
                ) : null}
              </Typography.Span>
              <Typography.Span className="text-move-muted">→</Typography.Span>
              {targets.length ? (
                targets.map((target) => (
                  <Typography.Span
                    key={`${moduleName}->${target}`}
                    className="rounded border border-move-border bg-move-dark px-2 py-0.5 font-mono text-move-text"
                  >
                    {target}
                  </Typography.Span>
                ))
              ) : (
                <Typography.Span className="text-move-muted/80">no cross-module calls</Typography.Span>
              )}
            </div>
          );
        })}
      </div>
      {!graph.edges.length && (
        <Typography.P variant="tinyMuted" className="mt-2">
          No explicit `move_over::module::function` calls were found between modules.
        </Typography.P>
      )}
    </section>
  );
}
