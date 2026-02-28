import { Router } from "express";
import { authLimiter } from "../../Middlewares/rate-limiter.middleware.js";
import { validationMiddleware } from "../../Middlewares/validation.middleware.js";
import { SignUpSchema } from "../../Validators/Schemas/user.schema.js";
import * as userServices from "./Services/user.service.js";

const router = Router();



//Authentication Routes

router.post("/signup", authLimiter, validationMiddleware(SignUpSchema), userServices.signUpService);
router.post("/signin", authLimiter, userServices.signinService);




export default router;


