import { spawn, type ChildProcess } from "child_process";
import { writeFileSync, mkdirSync } from "fs";
import { join, resolve, dirname } from "path";
import { fileURLToPath } from "url";
import { tmpdir } from "os";
import { db, appsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

const __dirname = dirname(fileURLToPath(import.meta.url));

const APP_DIR = join(tmpdir(), "deployed-apps");
const HTML_SERVER = resolve(__dirname, "html-server.mjs");
const PORT_START = 4100;
const PORT_END = 4200;
const MAX_LOG_LINES = 500;

type Runtime = "node" | "python" | "bun" | "html";

interface RunningApp {
  process: ChildProcess;
  port: number;
  stdoutLines: string[];
  stderrLines: string[];
}

const running = new Map<string, RunningApp>();
const usedPorts = new Set<number>();

function allocatePort(): number {
  for (let p = PORT_START; p <= PORT_END; p++) {
    if (!usedPorts.has(p)) {
      usedPorts.add(p);
      return p;
    }
  }
  throw new Error("No free ports available");
}

function freePort(port: number) {
  usedPorts.delete(port);
}

export function getRunningApp(id: string): RunningApp | undefined {
  return running.get(id);
}

export function getAppLogs(id: string): { stdout: string; stderr: string } {
  const app = running.get(id);
  if (!app) return { stdout: "", stderr: "" };
  return {
    stdout: app.stdoutLines.join("\n"),
    stderr: app.stderrLines.join("\n"),
  };
}

function spawnForRuntime(runtime: Runtime, file: string, port: number, dir: string) {
  const env = { ...process.env, PORT: String(port), NODE_ENV: "production" };

  switch (runtime) {
    case "node":
      return spawn("node", [file], { env, cwd: dir });

    case "bun":
      return spawn("bun", ["run", file], { env, cwd: dir });

    case "python":
      return spawn("python3", [file], { env: { ...env, PYTHONUNBUFFERED: "1" }, cwd: dir });

    case "html":
      return spawn("node", [HTML_SERVER], {
        env: { ...env, HTML_FILE: file },
        cwd: dir,
      });

    default:
      throw new Error(`Unknown runtime: ${runtime}`);
  }
}

function fileExtension(runtime: Runtime): string {
  switch (runtime) {
    case "node": return "app.mjs";
    case "bun": return "app.ts";
    case "python": return "app.py";
    case "html": return "index.html";
  }
}

export async function startApp(id: string, code: string, runtime: Runtime): Promise<number> {
  await stopApp(id);

  const port = allocatePort();
  const dir = join(APP_DIR, id);
  mkdirSync(dir, { recursive: true });

  const file = join(dir, fileExtension(runtime));
  writeFileSync(file, code, "utf-8");

  const stdoutLines: string[] = [];
  const stderrLines: string[] = [];

  const child = spawnForRuntime(runtime, file, port, dir);

  child.stdout?.on("data", (chunk: Buffer) => {
    const lines = chunk.toString().split("\n").filter(Boolean);
    stdoutLines.push(...lines);
    if (stdoutLines.length > MAX_LOG_LINES) {
      stdoutLines.splice(0, stdoutLines.length - MAX_LOG_LINES);
    }
  });

  child.stderr?.on("data", (chunk: Buffer) => {
    const lines = chunk.toString().split("\n").filter(Boolean);
    stderrLines.push(...lines);
    if (stderrLines.length > MAX_LOG_LINES) {
      stderrLines.splice(0, stderrLines.length - MAX_LOG_LINES);
    }
  });

  child.on("exit", async (code) => {
    freePort(port);
    running.delete(id);
    const status = code === 0 ? "stopped" : "crashed";
    logger.info({ id, code, status }, "App process exited");
    try {
      await db.update(appsTable).set({ status }).where(eq(appsTable.id, id));
    } catch {
      // ignore DB errors on exit
    }
  });

  running.set(id, { process: child, port, stdoutLines, stderrLines });

  // Wait for process to start
  await new Promise((r) => setTimeout(r, 1200));

  if (running.has(id)) {
    await db.update(appsTable).set({ status: "running", port }).where(eq(appsTable.id, id));
  }

  return port;
}

export async function stopApp(id: string): Promise<void> {
  const app = running.get(id);
  if (!app) return;
  app.process.kill("SIGTERM");
  running.delete(id);
  freePort(app.port);
  await db.update(appsTable).set({ status: "stopped" }).where(eq(appsTable.id, id));
}

export async function restoreRunningApps(): Promise<void> {
  const apps = await db
    .select()
    .from(appsTable)
    .where(eq(appsTable.status, "running"));

  for (const app of apps) {
    try {
      await db.update(appsTable).set({ status: "stopped" }).where(eq(appsTable.id, app.id));
    } catch {
      // ignore
    }
  }
}
