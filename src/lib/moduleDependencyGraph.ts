import type { LevelContractModule } from "@/data/levels/types";

export interface ModuleEdge {
  from: string;
  to: string;
}

export interface ModuleDependencyGraph {
  modules: string[];
  edges: ModuleEdge[];
  outgoing: Map<string, string[]>;
}

export function buildModuleDependencyGraph(
  contractModules: LevelContractModule[],
  runModule?: string,
): ModuleDependencyGraph | null {
  const moduleNames = [
    ...new Set(
      contractModules
        .map((contract) => String(contract.module || "").trim())
        .filter((moduleName) => moduleName.length > 0),
    ),
  ];
  if (moduleNames.length < 2) return null;

  const knownSet = new Set(moduleNames);
  const edgeSet = new Set<string>();
  const edges: ModuleEdge[] = [];
  for (const contract of contractModules) {
    const from = String(contract.module || "").trim();
    if (!knownSet.has(from)) continue;
    for (const match of String(contract.contractCode || "").matchAll(
      /move_over::([A-Za-z_][A-Za-z0-9_]*)::/g,
    )) {
      const to = String(match[1] || "").trim();
      if (!to || to === from || !knownSet.has(to)) continue;
      const edgeKey = `${from}->${to}`;
      if (edgeSet.has(edgeKey)) continue;
      edgeSet.add(edgeKey);
      edges.push({ from, to });
    }
  }

  const orderedModules = [...moduleNames].sort((a, b) => {
    if (runModule) {
      if (a === runModule) return -1;
      if (b === runModule) return 1;
    }
    return a.localeCompare(b);
  });

  const outgoing = new Map<string, string[]>();
  for (const moduleName of orderedModules) {
    outgoing.set(moduleName, []);
  }
  for (const edge of edges) {
    outgoing.get(edge.from)?.push(edge.to);
  }
  for (const [moduleName, targets] of outgoing.entries()) {
    outgoing.set(
      moduleName,
      [...new Set(targets)].sort((a, b) => a.localeCompare(b)),
    );
  }

  return { modules: orderedModules, edges, outgoing };
}
