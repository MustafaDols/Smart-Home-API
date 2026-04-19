import Alert from "../../../DB/Models/alert.model.js";
import { getIO } from "../../../config/socket.js";

export const createAlert = async ({
    userId,
    homeId,
    deviceId,
    anomaly
}) => {

    const alert = await Alert.create({
        userId,
        homeId,
        deviceId,
        anomalyId: anomaly._id,
        anomalyType: anomaly.anomalyType,
        severity: anomaly.severity,
        message: `${anomaly.anomalyType} detected`
    });

    const io = getIO();

    if (!userId) throw new Error("UserId is required");

    const room = userId.toString();

    const clients = io.sockets.adapter.rooms.get(room);

    if (clients && clients.size > 0) {
        io.to(room).emit("notification", {
            type: "alert",
            category: "anomaly",
            severity: alert.severity,
            data: alert,
            createdAt: alert.createdAt
        });
    } else {
        console.log(`User ${room} is offline, alert stored in DB only`);
    }
    return alert;
};