import mongoose from "mongoose";

const alertSchema = new mongoose.Schema({
    _id: {
        type: mongoose.Schema.Types.ObjectId,
        auto: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    deviceId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Device",
        required: true
    },
    homeId: { type: mongoose.Types.ObjectId, ref: "Home", required: true },
    anomalyId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Anomaly",
        required: true
    },
    anomalyType: {
        type: String,
        required: true
    },
    severity: {
        type: String,
        enum: ["critical", "high", "medium", "low"],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    isRead: {
        type: Boolean,
        default: false
    },
    isResolved: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    resolvedAt: {
        type: Date,
        default: null
    }
}, {
    timestamps: { createdAt: true, updatedAt: false }
});
alertSchema.index({ userId: 1, isRead: 1 });
alertSchema.index({ deviceId: 1 });
alertSchema.index({ createdAt: -1 });

//create model
const Alert = mongoose.model("Alert", alertSchema);

export default Alert ;  
  
