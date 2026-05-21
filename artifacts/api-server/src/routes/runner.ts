import { Router } from "express";
import { spawn } from "child_process";
import { writeFileSync, unlinkSync } from "fs";
import { join } from "path";
import { tmpdir } from "os";
import { randomUUID } from "crypto";
import { db, snippetsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import {
  RunCodeBody,
  CreateSnippetBody,
  DeleteSnippetParams,
} from "@workspace/api-zod";

const router = Router();

const CODE_TIMEOUT_MS = 10_000;

router.post("/run", async (req, res) => {
  const parsed = RunCodeBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { code, stdin } = parsed.data;
  const tmpFile = join(tmpdir(), `node-runner-${randomUUID()}.mjs`);

  try {
    writeFileSync(tmpFile, code, "utf-8");
  } catch {
    res.status(500).json({ error: "Failed to write code to temp file" });
    return;
  }

  const startTime = Date.now();
  let timedOut = false;

  await new Promise<void>((resolve) => {
    const child = spawn("node", ["--input-type=module", tmpFile], {
      timeout: CODE_TIMEOUT_MS,
      env: { ...process.env, NODE_ENV: "sandbox" },
    });

    let stdout = "";
    let stderr = "";

    if (stdin) {
      child.stdin.write(stdin);
      child.stdin.end();
    }

    child.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    child.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    const timer = setTimeout(() => {
      timedOut = true;
      child.kill("SIGKILL");
    }, CODE_TIMEOUT_MS);

    child.on("close", (exitCode) => {
      clearTimeout(timer);
      const executionTimeMs = Date.now() - startTime;

      try {
        unlinkSync(tmpFile);
      } catch {
        // ignore cleanup errors
      }

      res.json({
        stdout,
        stderr,
        exitCode,
        executionTimeMs,
        timedOut,
      });

      resolve();
    });

    child.on("error", (err) => {
      clearTimeout(timer);
      const executionTimeMs = Date.now() - startTime;

      try {
        unlinkSync(tmpFile);
      } catch {
        // ignore cleanup errors
      }

      res.json({
        stdout: "",
        stderr: err.message,
        exitCode: 1,
        executionTimeMs,
        timedOut: false,
      });

      resolve();
    });
  });
});

router.get("/snippets", async (req, res) => {
  const snippets = await db
    .select()
    .from(snippetsTable)
    .orderBy(snippetsTable.createdAt);
  res.json(snippets);
});

router.post("/snippets", async (req, res) => {
  const parsed = CreateSnippetBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const [snippet] = await db
    .insert(snippetsTable)
    .values(parsed.data)
    .returning();

  res.status(201).json(snippet);
});

router.delete("/snippets/:id", async (req, res) => {
  const parsed = DeleteSnippetParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const deleted = await db
    .delete(snippetsTable)
    .where(eq(snippetsTable.id, parsed.data.id))
    .returning();

  if (deleted.length === 0) {
    res.status(404).json({ error: "Snippet not found" });
    return;
  }

  res.status(204).send();
});

export default router;
