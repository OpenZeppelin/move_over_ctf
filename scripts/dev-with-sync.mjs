import { watch } from "node:fs";
import path from "node:path";
import { spawn, spawnSync } from "node:child_process";

const root = process.cwd();
const contractsDir = path.join(root, "public", "contracts");

const useShell = process.platform === "win32";

let syncing = false;
let queued = false;
let debounceTimer = null;
let nextDevProc = null;

function runSync(reason) {
  if (syncing) {
    queued = true;
    return;
  }
  syncing = true;
  process.stdout.write(`[sync:meta] ${reason}\n`);

  const syncProc = spawn("npm", ["run", "sync:meta"], {
    cwd: root,
    stdio: "inherit",
    shell: useShell,
  });

  syncProc.on("exit", (_code) => {
    syncing = false;
    if (queued) {
      queued = false;
      runSync("draining queued sync");
    }
  });
}

function scheduleSync(reason) {
  if (debounceTimer) clearTimeout(debounceTimer);
  debounceTimer = setTimeout(() => {
    runSync(reason);
  }, 180);
}

const watcher = watch(
  contractsDir,
  { recursive: true },
  (_eventType, filename) => {
    if (!filename) return;
    const file = String(filename);
    if (!file.endsWith(".move")) return;
    scheduleSync(`contract changed: ${file}`);
  }
);
const initial = spawnSync("npm", ["run", "sync:meta"], {
  cwd: root,
  stdio: "inherit",
  shell: useShell,
});
if (typeof initial.status === "number" && initial.status !== 0) {
  process.exit(initial.status);
}

nextDevProc = spawn("npm", ["run", "dev:next"], {
  cwd: root,
  stdio: "inherit",
  shell: useShell,
});

function shutdown(signal) {
  try {
    watcher.close();
  } catch {
    // ignore
  }
  if (nextDevProc && !nextDevProc.killed) {
    nextDevProc.kill(signal);
  }
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));

nextDevProc.on("exit", (code, signal) => {
  try {
    watcher.close();
  } catch {
    // ignore
  }
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});

