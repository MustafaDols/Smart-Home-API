import { Router } from "express";
import { authenticationMiddleware } from "../../Middlewares/authentication.middleware.js";

import * as analyticsService from "./analytics.service.js";

const analyticsRouter = Router();

analyticsRouter.use(authenticationMiddleware);

analyticsRouter.get("/", analyticsService.getAnalyticsService);

export default analyticsRouter;