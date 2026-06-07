import { Router } from "express";
import multer from "multer";
import { authenticationMiddleware } from "../../Middlewares/authentication.middleware.js";
import { registerFaceService, verifyFaceService } from "./Services/face.service.js";

const faceRouter = Router();


const upload = multer({ storage: multer.memoryStorage() });

faceRouter.use(authenticationMiddleware);

faceRouter.post("/register", upload.single("file"), registerFaceService);
faceRouter.post("/verify", upload.single("file"), verifyFaceService);

export default faceRouter;