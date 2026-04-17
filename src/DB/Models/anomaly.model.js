import mongoose from "mongoose";

const anomalySchema = new mongoose.Schema(
    {
        readingId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Reading",
            required: true,
            unique: true,
        },

        deviceId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Device",
            required: true,
            index: true,
        },

        anomalyType: {
            type: String,
            required: true,
            enum: [
                "fire",
                "gas_leak",
                "intrusion",
                "water_leak",
                "energy_anomaly",
                "sensor_fault",
            ],
        },

        severity: {
            type: String,
            required: true,
            enum: ["critical", "high", "medium", "low"],
        },

        detectedAt: {
            type: Date,
            default: Date.now,
        },
    },
    {
        timestamps: true,
    }
);

//create model
const Anomaly = mongoose.model("Anomaly", anomalySchema);

export default Anomaly;  