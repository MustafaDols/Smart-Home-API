import axios from "axios";
import FormData from "form-data";
import FaceLog from "../../../DB/Models/faceLog.model.js";
import { getIO } from "../../../config/socket.js";
import Alert from "../../../DB/Models/alert.model.js";
import User from "../../../DB/Models/user.model.js";
import Device from "../../../DB/Models/device.model.js";   
import Anomaly from "../../../DB/Models/anomaly.model.js"; 
import RegisteredFace from "../../../DB/Models/registeredFace.model.js"; 

const FLASK_URL = process.env.FLASK_URL || "http://localhost:7000";

export const registerFaceService = async (req, res) => { 
    try {
        const { name } = req.body;
        const file = req.file;
        const userId = req.loggedInUser.user._id;

        if (!file) return res.status(400).json({ success: false, message: "No file uploaded" });
        if (!name) return res.status(400).json({ success: false, message: "Name is required" });

        const trimmedName = name.trim();

        
        const existingFace = await RegisteredFace.findOne({ 
            userId, 
            name: { $regex: new RegExp(`^${trimmedName}$`, "i") } 
        });

        if (existingFace) {
            return res.status(400).json({ 
                success: false, 
                message: `The name "${trimmedName}" is already registered.` 
            });
        }

        const formData = new FormData();
        formData.append("file", file.buffer, file.originalname);
        formData.append("name", trimmedName);

        
        const { data } = await axios.post(
            `${FLASK_URL}/face-register`,
            formData,
            { headers: formData.getHeaders() }
        );

        
        const savedFace = await RegisteredFace.create({
            userId,
            name: trimmedName,
            registeredAt: new Date()
        });

        return res.status(201).json({ success: true, flaskData: data, dbData: savedFace });

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

        
        const deviceData = await Device.findById(deviceId);
        if (!deviceData || !deviceData.homeId) {
            return res.status(404).json({ success: false, message: "Device or associated Home not found" });
        }
        const homeId = deviceData.homeId; 

        const formData = new FormData();
        formData.append("file", file.buffer, file.originalname);

        const { data } = await axios.post(
            `${FLASK_URL}/face-auth`,
            formData,
            { headers: formData.getHeaders() }
        );

        const results = data.results || [];

        for (const result of results) {
            await FaceLog.create({
                deviceId,
                known: result.known,
                name: result.name || null,
                confidence: result.confidence,
                detectedAt: new Date()
            });

            if (!result.known) {
                
                
                const anomaly = await Anomaly.create({
                    deviceId,
                    anomalyType: "intrusion",
                    severity: "high",
                    detectedAt: new Date()
                });

                // Create Alert
                const alert = await Alert.create({
                    userId,
                    deviceId,
                    homeId,                
                    anomalyId: anomaly._id, 
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