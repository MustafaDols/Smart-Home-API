import { Router } from "express";
import { authenticationMiddleware } from "../../Middlewares/authentication.middleware.js";
import * as dashboardController from "./dashboard.controller.js";

const dashboardRouter = Router();

dashboardRouter.use(authenticationMiddleware);

dashboardRouter.get("/summary", dashboardController.getDashboardSummary);

export default dashboardRouter;
