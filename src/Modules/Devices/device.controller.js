import { Router } from "express";
import { authenticationMiddleware } from "../../Middlewares/authentication.middleware.js";
import { validationMiddleware } from "../../Middlewares/validation.middleware.js";
import { DeviceSchema } from "../../Validators/Schemas/device.schema.js";
import * as deviceServices from "./Services/device.service.js";

const deviceRouter = Router();

deviceRouter.use(authenticationMiddleware);

deviceRouter.post("/createDevice", validationMiddleware(DeviceSchema), deviceServices.createDeviceService);
deviceRouter.get("/getDevices", deviceServices.getDevicesService);
deviceRouter.get("/getDevice/:id", deviceServices.getDeviceService);
deviceRouter.put("/updateDevice/:id", deviceServices.updateDeviceService);
deviceRouter.delete("/deleteDevice/:id", deviceServices.deleteDeviceService);
deviceRouter.patch("/updateDeviceStatus", deviceServices.updateDeviceStatusService);


export default deviceRouter;
