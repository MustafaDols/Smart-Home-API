import { authenticationMiddleware } from "../../Middlewares/authentication.middleware.js";

import { Router } from "express";
import * as DashboardService  from "./dashboard.controller.js";

const DashboardRoutes = Router();


DashboardRoutes.use(authenticationMiddleware);


DashboardRoutes.get("/", DashboardService.getDashboardService);

export default DashboardRoutes;