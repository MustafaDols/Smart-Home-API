import Joi from "joi";
import { generalRules } from "../../Utils/general-rules.utils.js";

const severityLevels = ["critical", "high", "medium", "low"];

export const GetAlertsByDeviceSchema = {
    params: Joi.object().keys({
        deviceId: generalRules._id.required()
    })
};

export const AlertIdSchema = {
    params: Joi.object().keys({
        id: generalRules._id.required()
    })
};

export const GetAlertsBySeveritySchema = {
    params: Joi.object().keys({
        severity: Joi.string().valid(...severityLevels).required()
    })
};     