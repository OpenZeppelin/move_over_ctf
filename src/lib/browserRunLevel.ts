type WorkerSuccess = {
  success: boolean;
  output: string;
};

type WorkerResponse =
  | { id: number; ok: true; result: WorkerSuccess }
  | { id: number; ok: false; error?: { code?: string; message?: string } };

interface BrowserRunLevelInput {
  levelId: number;
  contractCode: string;
  contractModules?: Array<{
    module: string;
    contractCode?: string;
  }>;
  module: string;
  typeName: string;
  solutionModule: string;
  solutionBody: string;
  verifierModule: string;
  cleanupFunction?: string;
}

let worker: Worker | null = null;
let seq = 0;
const pending = new Map<
  number,
  {
    resolve: (value: WorkerSuccess) => void;
    reject: (reason?: unknown) => void;
    timer: ReturnType<typeof setTimeout>;
  }
>();

const WORKER_TIMEOUT_MS = 120_000;
const WORKER_URL = "/workers/move_runner.worker.js?v=20260306_symbolic_charge_flow";

function getWorker(): Worker {
  if (typeof window === "undefined") {
    throw new Error("Browser worker is unavailable on the server.");
  }
  if (worker) return worker;

  worker = new Worker(WORKER_URL);

  worker.onmessage = (event: MessageEvent<WorkerResponse>) => {
    const data = event?.data;
    const id = Number(data?.id);
    if (!Number.isInteger(id) || !pending.has(id)) return;
    const slot = pending.get(id);
    if (!slot) return;
    pending.delete(id);
    clearTimeout(slot.timer);

    if (data.ok) {
      slot.resolve(data.result);
      return;
    }

    const message =
      data && data.error && typeof data.error.message === "string"
        ? data.error.message
        : "Browser worker failed.";
    slot.reject(new Error(message));
  };

  worker.onerror = (event) => {
    const message =
      event && typeof event.message === "string" && event.message.trim()
        ? event.message.trim()
        : "Browser worker crashed.";
    for (const [id, slot] of pending.entries()) {
      clearTimeout(slot.timer);
      slot.reject(new Error(message));
      pending.delete(id);
    }
  };

  return worker;
}

export function runLevelInBrowser(payload: BrowserRunLevelInput): Promise<WorkerSuccess> {
  const w = getWorker();
  const id = ++seq;

  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error("Browser Move runner timed out."));
    }, WORKER_TIMEOUT_MS);

    pending.set(id, { resolve, reject, timer });
    w.postMessage({
      id,
      type: "run_level",
      payload,
    });
  });
}

