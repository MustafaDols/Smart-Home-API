import mongoose from "mongoose";

const registeredFaceSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    name: {
        type: String,
        required: true,
        trim: true
    },
    registeredAt: {
        type: Date,
        default: Date.now
    }
}, { timestamps: true });

const RegisteredFace = mongoose.model("RegisteredFace", registeredFaceSchema);
export default RegisteredFace;