import Alert from "../../../DB/Models/alert.model.js";
import User from "../../../DB/Models/user.model.js";
import { getIO } from "../../../config/socket.js";
import { emitDashboardUpdateEvent } from "../../Dashboard/dashboard.events.js";

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
    await User.findByIdAndUpdate(userId, { $inc: { unreadAlerts: 1 } });

    const populatedAlert = await Alert.findById(alert._id)
        .populate("deviceId")
        .populate("homeId")
        .lean();

    const alertSummary = {
        alertId: populatedAlert._id,
        anomalyType: populatedAlert.anomalyType,
        severity: populatedAlert.severity,
        isRead: populatedAlert.isRead,
        isResolved: populatedAlert.isResolved,
        createdAt: populatedAlert.createdAt,
        message: populatedAlert.message,
        device: populatedAlert.deviceId
            ? {
                  deviceId: populatedAlert.deviceId._id,
                  name: populatedAlert.deviceId.name,
                  location: populatedAlert.deviceId.location
              }
            : null,
        home: populatedAlert.homeId
            ? {
                  homeId: populatedAlert.homeId._id,
                  name: populatedAlert.homeId.name
              }
            : null
    };

    try {
        const io = getIO();

        const room = userId.toString();

        io.to(room).emit("new_alert", {
            alert: populatedAlert,
            anomaly
        });

        emitDashboardUpdateEvent(userId, {
            unreadAlertCount: 1,
            criticalAlertCount: anomaly.severity === "critical" ? 1 : 0,
            anomalyStats: {
                type: anomaly.anomalyType,
                severity: anomaly.severity,
                count: 1
            },
            latestAlerts: [alertSummary]
        });
    } catch (socketErr) {
        console.error("Socket emit error:", socketErr.message);
    }

    return populatedAlert;
};