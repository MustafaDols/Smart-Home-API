import { Router } from "express";
import { authenticationMiddleware } from "../../Middlewares/authentication.middleware.js";
import * as alertController from "./alert.controller.js";

const alertRouter = Router();

// Apply authentication middleware to all routes
alertRouter.use(authenticationMiddleware);

// Get all alerts
alertRouter.get("/", alertController.getAllAlerts);

// Get unread alerts
alertRouter.get("/unread", alertController.getUnreadAlerts);

// Get alerts by severity
alertRouter.get("/severity/:severity", alertController.getAlertsBySeverity);

// Get alerts by device ID
alertRouter.get("/device/:deviceId", alertController.getAlertsByDeviceId);

// Mark alert as read
alertRouter.patch("/:id/read", alertController.markAlertAsRead);

// Resolve alert
alertRouter.patch("/:id/resolved", alertController.resolveAlert);

// Delete alert
alertRouter.delete("/:id", alertController.deleteAlert);

export default alertRouter;