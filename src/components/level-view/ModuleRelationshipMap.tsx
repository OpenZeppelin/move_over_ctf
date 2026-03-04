import type { ModuleDependencyGraph } from "@/lib/moduleDependencyGraph";

type Props = {
  graph: ModuleDependencyGraph;
  runModule?: string;
};

export function ModuleRelationshipMap({ graph, runModule }: Props) {
  return (
    <section className="rounded-lg border border-move-border bg-move-panel/60 p-3 sm:p-4">
      <h2 className="text-xs sm:text-sm font-semibold text-move-text">Module Relationship Map</h2>
      <p className="mt-1 text-[11px] sm:text-xs text-move-muted">
        Cross-module calls detected in this level&apos;s contracts.
      </p>
      <div className="mt-3 space-y-2">
        {graph.modules.map((moduleName) => {
          const targets = graph.outgoing.get(moduleName) ?? [];
          const isRunModule = runModule === moduleName;
          return (
            <div key={moduleName} className="flex flex-wrap items-center gap-1.5 text-[11px] sm:text-xs">
              <span
                className={`inline-flex items-center gap-1 rounded border px-2 py-0.5 font-mono ${
                  isRunModule
                    ? "border-oz-violet/45 bg-oz-violet/15 text-oz-violet"
                    : "border-move-border bg-move-dark text-move-text"
                }`}
              >
                {moduleName}
                {isRunModule ? (
                  <span className="rounded bg-oz-violet/20 px-1 py-[1px] text-[9px] uppercase tracking-wide">
                    run
                  </span>
                ) : null}
              </span>
              <span className="text-move-muted">→</span>
              {targets.length ? (
                targets.map((target) => (
                  <span
                    key={`${moduleName}->${target}`}
                    className="rounded border border-move-border bg-move-dark px-2 py-0.5 font-mono text-move-text"
                  >
                    {target}
                  </span>
                ))
              ) : (
                <span className="text-move-muted/80">no cross-module calls</span>
              )}
            </div>
          );
        })}
      </div>
      {!graph.edges.length && (
        <p className="mt-2 text-[11px] sm:text-xs text-move-muted">
          No explicit `move_over::module::function` calls were found between modules.
        </p>
      )}
    </section>
  );
}
