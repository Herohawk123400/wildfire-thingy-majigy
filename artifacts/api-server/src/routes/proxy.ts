import { Router, type Request, type Response } from "express";
import httpProxy from "http-proxy";
import { getRunningApp } from "../lib/app-manager";

const router = Router();
const proxy = httpProxy.createProxyServer({ selfHandleResponse: false });

proxy.on("error", (err, _req, res) => {
  const r = res as Response;
  if (!r.headersSent) {
    r.status(502).json({ error: "App is not reachable. It may still be starting." });
  }
});

router.all("/apps/:id", (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const app = getRunningApp(id);
  if (!app) {
    res.status(503).json({ error: "App is not running" });
    return;
  }
  req.url = "/";
  proxy.web(req, res, { target: `http://localhost:${app.port}` });
});

router.all("/apps/:id/*splat", (req: Request, res: Response) => {
  const id = req.params["id"] as string;
  const splat = req.params["splat"] as string;
  const app = getRunningApp(id);
  if (!app) {
    res.status(503).json({ error: "App is not running" });
    return;
  }
  const qs = req.url.includes("?") ? req.url.slice(req.url.indexOf("?")) : "";
  req.url = `/${splat}${qs}`;
  proxy.web(req, res, { target: `http://localhost:${app.port}` });
});

export default router;
