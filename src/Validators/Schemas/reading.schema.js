import Joi from "joi";
import { generalRules } from "../../Utils/general-rules.utils.js";

export const CreateReadingSchema = {
    body: Joi.object().keys({
        deviceId: generalRules._id.required(),
        temp: Joi.number().required(),
        smoke: Joi.number().min(0).required(),
        gas: Joi.number().min(0).required(),
        power: Joi.number().min(0).required(),
        motion: Joi.number().valid(0, 1).required(),
        door: Joi.number().valid(0, 1).required(),
        water_flow: Joi.number().min(0).required(),
    })
};

export const GetReadingsSchema = {
    params: Joi.object().keys({
        deviceId: generalRules._id.required()
    })
};