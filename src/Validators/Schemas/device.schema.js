import Joi from "joi";

export const DeviceSchema = {

    body: Joi.object().keys({

        homeId: Joi.string().hex().length(24).required(),
        name: Joi.string().min(3).max(50).required(),
        location: Joi.string().min(3).max(100).required(),
        isActive: Joi.boolean().optional()

    })

}