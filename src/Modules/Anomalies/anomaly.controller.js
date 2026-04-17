import { Router } from "express";
import { authenticationMiddleware } from "../../Middlewares/authentication.middleware.js";
import { validationMiddleware } from "../../Middlewares/validation.middleware.js";
import { GetAnomaliesSchema, GetDeviceAnomaliesSchema } from "../../Validators/Schemas/anomaly.schema.js";
import * as anomalyServices from "./Services/anomaly.service.js";

const anomalyRouter = Router();

anomalyRouter.use(authenticationMiddleware);


anomalyRouter.get("/stats", anomalyServices.getAnomaliesStatsService);
anomalyRouter.get("/", validationMiddleware(GetAnomaliesSchema), anomalyServices.getAnomaliesService);
anomalyRouter.get("/:deviceId", validationMiddleware(GetDeviceAnomaliesSchema), anomalyServices.getDeviceAnomaliesService);

export default anomalyRouter;