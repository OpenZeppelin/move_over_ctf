import { NextResponse } from "next/server";
import { writeFile, mkdir } from "fs/promises";
import { join } from "path";
import { execSync } from "child_process";
import {
  MAX_CODE_BYTES,
  getClientIp,
  checkRateLimit,
  tryAcquireRun,
  releaseRun,
  checkAndConsumeGlobalRunLimit,
} from "@/lib/runLevelLimits";
import { LEVEL_RUN_CONFIG, SUPPORTED_LEVEL_IDS } from "@/data/levels/runConfig";

export const runtime = "nodejs";

const RUN_TIMEOUT_MS = 30_000;
const SOURCES_DIR = "move_over/sources";

/** Path to the solution file for a level (e.g. move_over/sources/level_0_solution.move). */
function getSolutionPath(levelId: number): string {
  return `${SOURCES_DIR}/level_${levelId}_solution.move`;
}

/** Build solution module content for a level: module move_over::level_N_solution, same template shape. */
function buildSolutionMoveContent(levelId: number, solutionBody: string): string {
  const config = LEVEL_RUN_CONFIG[levelId];
  if (!config) throw new Error(`Unsupported level: ${levelId}`);
  const trimmed = solutionBody.trim();
  const body = trimmed
    ? trimmed
        .split("\n")
        .map((line) => `    ${line.trim()}`)
        .join("\n")
    : "";
  const mod = config.module;
  const typ = config.typeName;
  const fullMod = `move_over::${config.solutionModule}`;
  return `module ${fullMod};

use move_over::${mod};

public fun run(t: &mut tx_context::TxContext): ${mod}::${typ} {
${body}
}
`;
}

export type RunLevelResponse =
  | { ok: true; success: boolean; output: string }
  | { ok: false; error: string };

export async function POST(request: Request): Promise<NextResponse<RunLevelResponse>> {
  const ip = getClientIp(request);
  const rate = checkRateLimit(ip);
  if (!rate.allowed) {
    const msg = rate.retryAfterSeconds
      ? `Too many runs. Try again in ${rate.retryAfterSeconds} seconds.`
      : "Too many runs. Please try again later.";
    return NextResponse.json(
      { ok: false, error: msg },
      {
        status: 429,
        headers: rate.retryAfterSeconds
          ? { "Retry-After": String(rate.retryAfterSeconds) }
          : undefined,
      }
    );
  }

  if (!tryAcquireRun()) {
    return NextResponse.json(
      { ok: false, error: "Server is busy. Please try again in a moment." },
      { status: 429 }
    );
  }

  if (!checkAndConsumeGlobalRunLimit()) {
    releaseRun();
    return NextResponse.json(
      { ok: false, error: "Hourly run limit reached. Please try again later." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const levelId = typeof body?.levelId === "number" ? body.levelId : undefined;
    const code = typeof body?.code === "string" ? body.code : undefined;

    if (levelId === undefined || code === undefined) {
      return NextResponse.json(
        { ok: false, error: "Missing levelId or code" },
        { status: 400 }
      );
    }

    const codeBytes = new TextEncoder().encode(code).byteLength;
    if (codeBytes > MAX_CODE_BYTES) {
      return NextResponse.json(
        {
          ok: false,
          error: `Solution code is too long (${codeBytes} bytes). Maximum is ${MAX_CODE_BYTES} bytes.`,
        },
        { status: 400 }
      );
    }

    if (!LEVEL_RUN_CONFIG[levelId]) {
      return NextResponse.json(
        { ok: false, error: `Unsupported level: ${levelId}. Supported: ${SUPPORTED_LEVEL_IDS.join(", ")}.` },
        { status: 400 }
      );
    }

    const fullMoveCode = buildSolutionMoveContent(levelId, code);

    const cwd = process.cwd();
    const solutionPath = join(cwd, getSolutionPath(levelId));

    try {
      await mkdir(join(cwd, SOURCES_DIR), { recursive: true });
      await writeFile(solutionPath, fullMoveCode, "utf-8");
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      return NextResponse.json(
        { ok: false, error: `Failed to write solution: ${msg}` },
        { status: 500 }
      );
    }

    try {
      const testFilter = LEVEL_RUN_CONFIG[levelId].testModule;
      const result = execSync(`sui move test ${testFilter}`, {
        cwd: join(cwd, "move_over"),
        encoding: "utf-8",
        timeout: RUN_TIMEOUT_MS,
        maxBuffer: 1024 * 1024,
      });
      return NextResponse.json({
        ok: true,
        success: true,
        output: result || "All tests passed.",
      });
    } catch (err: unknown) {
      const out = err && typeof err === "object" && "stdout" in err ? String((err as { stdout: unknown }).stdout) : "";
      const errOut = err && typeof err === "object" && "stderr" in err ? String((err as { stderr: unknown }).stderr) : "";
      const output = [out, errOut].filter(Boolean).join("\n") || (err instanceof Error ? err.message : String(err));
      return NextResponse.json({
        ok: true,
        success: false,
        output: output.trim() || "Test run failed.",
      });
    }
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { ok: false, error: msg },
      { status: 500 }
    );
  } finally {
    releaseRun();
  }
}
