import { getIO } from "../../../src/config/socket.js";

const emit = (userId, event, payload) => {
    try {
        const io = getIO();
        io.to(userId.toString()).emit(event, payload);
    } catch (error) {
        console.error(`Socket ${event} emit error:`, error.message);
    }
};

export const emitDashboardUpdateEvent = (userId, delta) => {
    emit(userId, "dashboard_update", {
        eventType: "dashboard_update",
        delta,
        updatedAt: new Date()
    });
};

export const emitDeviceStatusChangedEvent = (userId, payload) => {
    emit(userId, "device_status_changed", {
        eventType: "device_status_changed",
        payload,
        updatedAt: new Date()
    });
};

export const emitSensorUpdateEvent = (userId, payload) => {
    emit(userId, "sensor_update", {
        eventType: "sensor_update",
        payload,
        updatedAt: new Date()
    });
};
