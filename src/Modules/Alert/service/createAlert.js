import Alert from "../../../DB/Models/alert.model.js";
import { getIO } from "../../../config/socket.js";

export const createAlert = async ({
    userId,
    homeId,
    deviceId,
    anomaly,
    device
}) => {

    if (!userId) {
        throw new Error("UserId is required");
    }

    const message =
        `${anomaly.anomalyType.replace("_", " ")} detected in ` +
        `${device.name} (${device.location})`;

    const alert = await Alert.create({
        userId,
        homeId,
        deviceId,
        anomalyId: anomaly._id,
        anomalyType: anomaly.anomalyType,
        severity: anomaly.severity,
        message
    });

    const populatedAlert = await Alert.findById(alert._id)
        .populate("deviceId")
        .populate("homeId")
        .lean();

    try {
        const io = getIO();

        const room = userId.toString();

        io.to(room).emit("new_alert", {
            alert: populatedAlert,
            anomaly
        });

    } catch (socketErr) {
        console.error("Socket emit error:", socketErr.message);
    }

    return populatedAlert;
};