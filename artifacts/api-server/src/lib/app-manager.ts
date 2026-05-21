import { spawn, type ChildProcess } from "child_process";
import { writeFileSync, mkdirSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { db, appsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { logger } from "./logger";

const APP_DIR = join(tmpdir(), "deployed-apps");
const PORT_START = 4100;
const PORT_END = 4200;
const MAX_LOG_LINES = 500;

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

export async function startApp(id: string, code: string): Promise<number> {
  // Stop existing process if any
  await stopApp(id);

  const port = allocatePort();

  // Write code to temp file
  const dir = join(APP_DIR, id);
  mkdirSync(dir, { recursive: true });
  const file = join(dir, "app.mjs");
  writeFileSync(file, code, "utf-8");

  const stdoutLines: string[] = [];
  const stderrLines: string[] = [];

  const child = spawn("node", [file], {
    env: {
      ...process.env,
      PORT: String(port),
      NODE_ENV: "production",
    },
    cwd: dir,
  });

  child.stdout.on("data", (chunk: Buffer) => {
    const lines = chunk.toString().split("\n").filter(Boolean);
    stdoutLines.push(...lines);
    if (stdoutLines.length > MAX_LOG_LINES) {
      stdoutLines.splice(0, stdoutLines.length - MAX_LOG_LINES);
    }
  });

  child.stderr.on("data", (chunk: Buffer) => {
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

  // Give the process a moment to start, then mark running
  await new Promise((r) => setTimeout(r, 1000));

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
