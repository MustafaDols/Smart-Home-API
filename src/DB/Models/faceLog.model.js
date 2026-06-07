import mongoose from "mongoose";

const faceLogSchema = new mongoose.Schema({
    deviceId: {
        type: String,
        required: true,
        index: true
    },
    known: {
        type: Boolean,
        required: true
    },
    name: {
        type: String,
        default: null
    },
    confidence: {
        type: Number
    },
    detectedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const FaceLog = mongoose.model("FaceLog", faceLogSchema);

export default FaceLog;