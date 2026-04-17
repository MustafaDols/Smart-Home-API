import Joi from "joi";
import { generalRules } from "../../Utils/general-rules.utils.js";

const anomalyTypes = ["fire", "gas_leak", "intrusion", "water_leak", "energy_anomaly", "sensor_fault"];
const severityLevels = ["critical", "high", "medium", "low"];

export const GetAnomaliesSchema = {
    query: Joi.object().keys({
        type: Joi.string().valid(...anomalyTypes).optional(),
        deviceId: generalRules._id.optional(),
        from: Joi.date().iso().optional(),
        to: Joi.date().iso().min(Joi.ref("from")).optional(),
        limit: Joi.number().integer().min(1).max(500).optional()
    })
};

export const GetDeviceAnomaliesSchema = {
    params: Joi.object().keys({
        deviceId: generalRules._id.required()
    })
};