import mongoose from "mongoose";

const deviceSchema = new mongoose.Schema({

    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        index: true
    },

    homeId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Home',
        required: true,
        index: true
    },

    name: {
        type: String,
        required: true,
        trim: true
    },

    location: {
        type: String,
        required: true,
        trim: true
    },

    isActive: {
        type: Boolean,
        default: true
    },

    lastSeen: {
        type: Date,
        default: null
    }

}, {
    timestamps: true
});


deviceSchema.index({ homeId: 1, name: 1 }, { unique: true });

//create model
const Device = mongoose.model("Device", deviceSchema);

export default Device;