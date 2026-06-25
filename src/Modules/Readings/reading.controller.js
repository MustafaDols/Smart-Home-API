import { Router } from "express";
import { authenticationMiddleware } from "../../Middlewares/authentication.middleware.js";
import { validationMiddleware } from "../../Middlewares/validation.middleware.js";
import { CreateReadingSchema, GetReadingsSchema } from "../../Validators/Schemas/reading.schema.js";
import * as readingServices from "./Services/reading.service.js";

const readingRouter = Router();


readingRouter.post("/create", validationMiddleware(CreateReadingSchema), readingServices.createReadingService);
readingRouter.use(authenticationMiddleware);
readingRouter.get("/", readingServices.getAllReadingsService);
readingRouter.get("/:deviceId", validationMiddleware(GetReadingsSchema), readingServices.getReadingsService);
readingRouter.get("/:deviceId/latest", validationMiddleware(GetReadingsSchema), readingServices.getLatestReadingService);

export default readingRouter;