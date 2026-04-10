import Joi from "joi";

export const HomeSchema = {

    body: Joi.object().keys({

        name: Joi.string().min(3).max(50).required(),
        location: Joi.string().min(3).max(100).required().unique(),
    })
        
} 