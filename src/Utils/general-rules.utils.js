import Joi from "joi";
import { isValidObjectId } from "mongoose";


function objectIdValidation(value, helper) {
    return isValidObjectId(value) ? value : helper.message('Invalid Object Id')
}

export const generalRules = {
    _id: Joi.string().custom(objectIdValidation),
    email: Joi.string().email({
        tlds: {
            allow: ["com", "net"],
            deny: ["org"]
        },
        // minDomainSegments: 2,
        // multiple: true,
        // separator: "#"
    }),
    password: Joi.string()
        .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/)
        .min(6).max(20).required(),
}