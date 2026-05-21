import { Router, type IRouter } from "express";
import healthRouter from "./health";
import runnerRouter from "./runner";

const router: IRouter = Router();

router.use(healthRouter);
router.use(runnerRouter);

export default router;
