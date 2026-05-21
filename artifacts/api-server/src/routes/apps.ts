import { Router } from "express";
import { randomUUID } from "crypto";
import { db, appsTable } from "@workspace/db";
import { eq } from "drizzle-orm";
import { startApp, stopApp, getAppLogs } from "../lib/app-manager";
import { CreateAppBody, GetAppParams, DeleteAppParams, RestartAppParams, GetAppLogsParams } from "@workspace/api-zod";

const router = Router();

function appUrl(id: string): string {
  const domain = process.env.REPLIT_DOMAINS?.split(",")[0];
  if (domain) return `https://${domain}/apps/${id}`;
  return `/apps/${id}`;
}

router.get("/apps", async (req, res) => {
  const apps = await db.select().from(appsTable).orderBy(appsTable.createdAt);
  res.json(apps.map((a) => ({ ...a, url: appUrl(a.id) })));
});

router.post("/apps", async (req, res) => {
  const parsed = CreateAppBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid request body" });
    return;
  }

  const { name, code } = parsed.data;
  const id = randomUUID();

  const [app] = await db
    .insert(appsTable)
    .values({ id, name, code, port: 0, status: "starting" })
    .returning();

  // Start the process async — don't await so we can return immediately
  startApp(id, code).catch((err) => {
    req.log.error({ err, id }, "Failed to start app");
    db.update(appsTable).set({ status: "crashed" }).where(eq(appsTable.id, id)).catch(() => {});
  });

  res.status(201).json({ ...app, url: appUrl(id) });
});

router.get("/apps/:id", async (req, res) => {
  const parsed = GetAppParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [app] = await db.select().from(appsTable).where(eq(appsTable.id, parsed.data.id));
  if (!app) {
    res.status(404).json({ error: "App not found" });
    return;
  }
  res.json({ ...app, url: appUrl(app.id) });
});

router.delete("/apps/:id", async (req, res) => {
  const parsed = DeleteAppParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [app] = await db.select().from(appsTable).where(eq(appsTable.id, parsed.data.id));
  if (!app) {
    res.status(404).json({ error: "App not found" });
    return;
  }

  await stopApp(parsed.data.id);
  await db.delete(appsTable).where(eq(appsTable.id, parsed.data.id));
  res.status(204).send();
});

router.post("/apps/:id/restart", async (req, res) => {
  const parsed = RestartAppParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [app] = await db.select().from(appsTable).where(eq(appsTable.id, parsed.data.id));
  if (!app) {
    res.status(404).json({ error: "App not found" });
    return;
  }

  await db.update(appsTable).set({ status: "starting" }).where(eq(appsTable.id, app.id));

  startApp(app.id, app.code).catch((err) => {
    req.log.error({ err, id: app.id }, "Failed to restart app");
    db.update(appsTable).set({ status: "crashed" }).where(eq(appsTable.id, app.id)).catch(() => {});
  });

  const [updated] = await db.select().from(appsTable).where(eq(appsTable.id, app.id));
  res.json({ ...updated, url: appUrl(updated.id) });
});

router.get("/apps/:id/logs", async (req, res) => {
  const parsed = GetAppLogsParams.safeParse(req.params);
  if (!parsed.success) {
    res.status(400).json({ error: "Invalid id" });
    return;
  }

  const [app] = await db.select().from(appsTable).where(eq(appsTable.id, parsed.data.id));
  if (!app) {
    res.status(404).json({ error: "App not found" });
    return;
  }

  res.json(getAppLogs(parsed.data.id));
});

export default router;
