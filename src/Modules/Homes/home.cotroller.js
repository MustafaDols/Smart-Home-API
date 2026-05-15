import * as homeServices from "./Services/home.service.js";
import { authenticationMiddleware } from "../../Middlewares/authentication.middleware.js";
import { Router } from "express";


const homeRouter = Router();

homeRouter.use(authenticationMiddleware);

homeRouter.post("/createHome", homeServices.createHomeService);
homeRouter.get("/getHomes", homeServices.getHomesService);
homeRouter.get("/getHome/:location", homeServices.getHomeService);
homeRouter.get("/getHomeById/:id", homeServices.getHomeByIdService);
homeRouter.delete("/deleteHome/:location", homeServices.deleteHomeService);
homeRouter.delete("/deleteHomeById/:id", homeServices.deleteHomeByIdService);

export default homeRouter;