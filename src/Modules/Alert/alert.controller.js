import Alert from "../../DB/Models/alert.model.js";
import Device from "../../DB/Models/device.model.js";
import { getIO } from "../../config/socket.js";

// Get all alerts for the logged-in user
export const getAllAlerts = async (req, res) => {
    try {
        const userId = req.loggedInUser.user._id;

        const alerts = await Alert.find({ userId })
            .populate("deviceId", "name location")
            .populate("homeId", "name")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Alerts fetched successfully",
            count: alerts.length,
            alerts
        });
    } catch (error) {
        return res.status(500).json({ message: "Error fetching alerts", error: error.message });
    }
};

// Get unread alerts for the logged-in user
export const getUnreadAlerts = async (req, res) => {
    try {
        const userId = req.loggedInUser.user._id;

        const alerts = await Alert.find({ userId, isRead: false })
            .populate("deviceId", "name location")
            .populate("homeId", "name")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Unread alerts fetched successfully",
            count: alerts.length,
            alerts
        });
    } catch (error) {
        return res.status(500).json({ message: "Error fetching unread alerts", error: error.message });
    }
};

// Get alerts by device ID
export const getAlertsByDeviceId = async (req, res) => {
    try {
        const { deviceId } = req.params;
        const userId = req.loggedInUser.user._id;

        // Verify device belongs to user
        const device = await Device.findOne({ _id: deviceId, userId });
        if (!device) {
            return res.status(404).json({ message: "Device not found or unauthorized" });
        }

        const alerts = await Alert.find({ deviceId, userId })
            .populate("deviceId", "name location")
            .populate("homeId", "name")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: "Device alerts fetched successfully",
            count: alerts.length,
            alerts
        });
    } catch (error) {
        return res.status(500).json({ message: "Error fetching device alerts", error: error.message });
    }
};

// Mark alert as read
export const markAlertAsRead = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.loggedInUser.user._id;

        const alert = await Alert.findOneAndUpdate(
            { _id: id, userId },
            { isRead: true },
            { new: true }
        ).populate("deviceId").populate("homeId");

        if (!alert) {
            return res.status(404).json({ message: "Alert not found or unauthorized" });
        }

        // Broadcast via socket.io
        const io = getIO();
        io.to(userId.toString()).emit("alert-updated", alert);

        return res.status(200).json({
            message: "Alert marked as read",
            alert
        });
    } catch (error) {
        return res.status(500).json({ message: "Error marking alert as read", error: error.message });
    }
};

// Resolve alert
export const resolveAlert = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.loggedInUser.user._id;

        const alert = await Alert.findOneAndUpdate(
            { _id: id, userId },
            {
                isResolved: true,
                resolvedAt: new Date()
            },
            { new: true }
        ).populate("deviceId").populate("homeId");

        if (!alert) {
            return res.status(404).json({ message: "Alert not found or unauthorized" });
        }

        // Broadcast via socket.io
        const io = getIO();
        io.to(userId.toString()).emit("alert-resolved", alert);

        return res.status(200).json({
            message: "Alert resolved successfully",
            alert
        });
    } catch (error) {
        return res.status(500).json({ message: "Error resolving alert", error: error.message });
    }
};

// Delete alert
export const deleteAlert = async (req, res) => {
    try {
        const { id } = req.params;
        const userId = req.loggedInUser.user._id;

        const alert = await Alert.findOneAndDelete({ _id: id, userId });

        if (!alert) {
            return res.status(404).json({ message: "Alert not found or unauthorized" });
        }

        // Broadcast via socket.io
        const io = getIO();
        io.to(userId.toString()).emit("alert-deleted", { alertId: id });

        return res.status(200).json({
            message: "Alert deleted successfully"
        });
    } catch (error) {
        return res.status(500).json({ message: "Error deleting alert", error: error.message });
    }
};

// Get alerts by severity
export const getAlertsBySeverity = async (req, res) => {
    try {
        const { severity } = req.params;
        const userId = req.loggedInUser.user._id;

        const validSeverities = ["critical", "high", "medium", "low"];
        if (!validSeverities.includes(severity)) {
            return res.status(400).json({ message: "Invalid severity level" });
        }

        const alerts = await Alert.find({ userId, severity })
            .populate("deviceId", "name location")
            .populate("homeId", "name")
            .sort({ createdAt: -1 });

        return res.status(200).json({
            message: `${severity.toUpperCase()} alerts fetched successfully`,
            count: alerts.length,
            alerts
        });
    } catch (error) {
        return res.status(500).json({ message: "Error fetching severity alerts", error: error.message });
    }
};

