import mongoose from "mongoose";

const readingSchema = new mongoose.Schema(
    {
        deviceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Device",
            required: true,
            index: true,
        },

        ts: {
            type: Date,
            default: Date.now,
        },

        temp: {
            type: Number,
            required: true,
        },

        smoke: {
            type: Number,
            required: true,
        },

        gas: {
            type: Number,
            required: true,
        },

        power: {
            type: Number,
            required: true,
        },

        motion: {
            type: Number,
            enum: [0, 1],
            required: true,
        },

        door: {
            type: Number,
            enum: [0, 1],
            required: true,
        },

        water_flow: {
            type: Number,
            required: true,
        },

        isAnomaly: {
            type: Boolean,
            default: false,
        },

        anomalyType: {
            type: String,
            default: null,
        },
    },
    {
        timestamps: true,
    }
);

//create model
const Reading = mongoose.model("Reading", readingSchema);

export default Reading;  