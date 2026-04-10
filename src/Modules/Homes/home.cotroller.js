import * as homeServices from "./Services/home.service.js";
import { Router } from "express";


const homeRouter = Router();

homeRouter.post("/createHome", homeServices.createHomeService);
homeRouter.get("/getHomes", homeServices.getHomesService);
homeRouter.get("/getHome/:location", homeServices.getHomeService);
homeRouter.put("/updateHome/:location", homeServices.updateHomeService);
homeRouter.delete("/deleteHome/:location", homeServices.deleteHomeService);


export default homeRouter;