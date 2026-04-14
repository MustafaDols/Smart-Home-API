import { Router } from "express";
import { authenticationMiddleware } from "../../Middlewares/authentication.middleware.js";
import * as alertController from "./alert.controller.js";

const alertRouter = Router();


alertRouter.use(authenticationMiddleware);


alertRouter.get("/", alertController.getAllAlerts);
alertRouter.get("/unread", alertController.getUnreadAlerts);

alertRouter.get("/severity/:severity", alertController.getAlertsBySeverity);

alertRouter.get("/device/:deviceId", alertController.getAlertsByDeviceId);

alertRouter.patch("/:id/read", alertController.markAlertAsRead);
alertRouter.patch("/:id/resolved", alertController.resolveAlert);

alertRouter.delete("/:id", alertController.deleteAlert);

export default alertRouter;