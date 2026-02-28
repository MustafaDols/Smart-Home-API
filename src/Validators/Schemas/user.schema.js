import Joi from "joi";
import { GenderEnum } from "../../Common/enums/user.enum.js";
import { generalRules } from "../../Utils/general-rules.utils.js";



export const SignUpSchema = {

    body: Joi.object().keys({
        firstname: Joi.string().alphanum().min(3).max(20).required().messages({
            "string.min": "First name must be at least 3 characters long",
            "string.max": "First name must be at most 20 characters long",
            "any.required": "First name is required",
            "string.alphanum": "First name must contain only letters and numbers"
        }),
        lastname: Joi.string().alphanum().min(3).max(20).required(),
        email: generalRules.email.required(),
        password: generalRules.password.required(),
        confirmPassword: Joi.string().valid(Joi.ref("password")).required(),
        age: Joi.number().integer().positive().min(18).max(50).required(),
        gender: Joi.string().valid(...Object.values(GenderEnum)).optional(),
        phoneNumber: Joi.string().required()

    })
        .options({ presence: "required" })
        .with("password", "confirmPassword")

} 