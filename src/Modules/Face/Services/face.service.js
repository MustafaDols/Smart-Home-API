import axios from "axios";
import FormData from "form-data";
import FaceLog from "../../../DB/Models/faceLog.model.js";
import { getIO } from "../../../config/socket.js";
import Alert from "../../../DB/Models/alert.model.js";
import User from "../../../DB/Models/user.model.js";

const FLASK_URL = process.env.FLASK_URL || "http://localhost:7000";

export const registerFaceService = async (req, res) => {
    try {
        const { name } = req.body;
        const file = req.file;

        if (!file) return res.status(400).json({ success: false, message: "No file uploaded" });
        if (!name) return res.status(400).json({ success: false, message: "Name is required" });

        const formData = new FormData();
        formData.append("file", file.buffer, file.originalname);
        formData.append("name", name.trim());

        const { data } = await axios.post(
            `${FLASK_URL}/face-register`,
            formData,
            { headers: formData.getHeaders() }
        );

        return res.status(201).json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};


export const verifyFaceService = async (req, res) => {
    try {
        const { deviceId } = req.body;
        const file = req.file;
        const userId = req.loggedInUser.user._id;

        if (!file) return res.status(400).json({ success: false, message: "No file uploaded" });
        if (!deviceId) return res.status(400).json({ success: false, message: "deviceId is required" });

        const formData = new FormData();
        formData.append("file", file.buffer, file.originalname);

        const { data } = await axios.post(
            `${FLASK_URL}/face-auth`,
            formData,
            { headers: formData.getHeaders() }
        );

        const results = data.results || [];

        for (const result of results) {
            // Create face log
            await FaceLog.create({
                deviceId,
                known: result.known,
                name: result.name || null,
                confidence: result.confidence,
                detectedAt: new Date()
            });

            // Unknown face → create alert and send notification
            if (!result.known) {
                const alert = await Alert.create({
                    userId,
                    deviceId,
                    anomalyType: "intrusion",
                    severity: "high",
                    message: `Unknown person detected at device ${deviceId}`,
                    isRead: false,
                    isResolved: false,
                    createdAt: new Date()
                });

                await User.findByIdAndUpdate(userId, { $inc: { unreadAlerts: 1 } });

                try {
                    const io = getIO();
                    const updatedUser = await User.findById(userId).select("unreadAlerts");
                    io.to(userId.toString()).emit("new_alert", {
                        alert,
                        unreadAlerts: updatedUser.unreadAlerts
                    });
                } catch (socketErr) {
                    console.error("Socket emit error:", socketErr.message);
                }
            }
        }

        return res.status(200).json({ success: true, data });
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message });
    }
};