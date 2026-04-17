import axios from "axios";
import Reading from "../../../DB/Models/reading.model.js";
import Anomaly from "../../../DB/Models/anomaly.model.js";
import Alert from "../../../DB/Models/alert.model.js";
import Device from "../../../DB/Models/device.model.js";
import { getIO } from "../../../config/socket.js";

const SENSOR_KEYS = ["temp", "smoke", "gas", "power", "water_flow"];

const anomalySeverityMap = {
    fire: "critical", 
    gas_leak: "critical",  
    intrusion: "high",  
    water_leak: "medium",
    energy_anomaly: "medium",
    sensor_fault: "low"
};

function buildFeatures(current, history) {
    const get = (idx, key) =>
        history[idx] ? history[idx][key] : current[key];

    const base = {
        temp: current.temp,
        smoke: current.smoke,
        gas: current.gas,
        power: current.power,
        motion: current.motion,
        door: current.door,
        water_flow: current.water_flow
    };

    const lag = {};
    for (const key of SENSOR_KEYS) {
        lag[`${key}_lag1`] = get(0, key);
        lag[`${key}_lag2`] = get(1, key);
    }

    const rolling = {};
    for (const key of SENSOR_KEYS) {
        const window = [current[key], ...history.slice(0, 4).map((r) => r[key])];
        const mean = window.reduce((s, v) => s + v, 0) / window.length;
        const std =
            window.length < 2
                ? 0
                : Math.sqrt(
                    window.reduce((s, v) => s + Math.pow(v - mean, 2), 0) /
                    window.length
                );
        rolling[`${key}_roll_mean`] = mean;
        rolling[`${key}_roll_std`] = std;
    }

    const interaction = {
        temp_x_smoke: current.temp * current.smoke,
        gas_x_power: current.gas * current.power,
        motion_x_door: current.motion * current.door
    };

    const now = new Date();
    const hour = now.getHours();
    const time = {
        hour,
        day_of_week: now.getDay(),
        is_night: hour < 6 || hour >= 22 ? 1 : 0
    };

    return { ...base, ...lag, ...rolling, ...interaction, ...time };
}

export const createReadingService = async (req, res) => {
    const { deviceId, temp, smoke, gas, power, motion, door, water_flow } = req.body;

    const device = await Device.findOne({
        _id: deviceId,
        userId: req.loggedInUser.user._id
    }).lean();

    if (!device) {
        return res.status(404).json({ message: "Device not found or unauthorized" });
    }

    const reading = await Reading.create({
        deviceId,
        temp,
        smoke,
        gas,
        power,
        motion,
        door,
        water_flow,
        ts: new Date()
    });

    const history = await Reading.find({ deviceId })
        .sort({ ts: -1 })
        .skip(1)
        .limit(4)
        .lean();

    const features = buildFeatures(
        { temp, smoke, gas, power, motion, door, water_flow },
        history
    );

    let fastapiResult;
    try {
        const { data } = await axios.post(
            `${process.env.FASTAPI_URL}/predict`,
            features
        );
        fastapiResult = data;
    } catch (err) {
        console.error("FastAPI error:", err.message);
        return res.status(207).json({
            message: "Reading saved but AI service unavailable",
            reading
        });
    }

    const { isAnomaly, anomalyType } = fastapiResult;

    reading.isAnomaly = isAnomaly;
    reading.anomalyType = isAnomaly ? anomalyType : null;
    await reading.save();

    let anomaly = null;
    let alert = null;

    if (isAnomaly && anomalyType) {
        const severity = anomalySeverityMap[anomalyType] ?? "low";

        anomaly = await Anomaly.create({
            readingId: reading._id,
            deviceId,
            anomalyType,
            severity,
            detectedAt: new Date()
        });

        const message = `${anomalyType.replace("_", " ")} detected in ${device.name} (${device.location})`;

        alert = await Alert.create({
            userId: device.userId,
            homeId: device.homeId,
            deviceId,
            anomalyId: anomaly._id,
            anomalyType,
            severity,
            message
        });

        try {
            const io = getIO();
            io.to(req.loggedInUser.user._id.toString()).emit("new_alert", {
                alert,
                anomaly
            });
        } catch (socketErr) {
            console.error("Socket.io emit error:", socketErr.message);
        }
    }

    return res.status(201).json({
        message: "Reading processed successfully",
        reading,
        anomaly,
        alert
    });
};

export const getReadingsService = async (req, res) => {
    const { deviceId } = req.params;

    const device = await Device.findOne({
        _id: deviceId,
        userId: req.loggedInUser.user._id
    }).lean();

    if (!device) {
        return res.status(404).json({ message: "Device not found or unauthorized" });
    }

    const readings = await Reading.find({ deviceId })
        .sort({ ts: -1 })
        .lean();

    return res.status(200).json({
        message: "Readings fetched successfully",
        count: readings.length,
        readings
    });
};

export const getLatestReadingService = async (req, res) => {
    const { deviceId } = req.params;

    const device = await Device.findOne({
        _id: deviceId,
        userId: req.loggedInUser.user._id
    }).lean();

    if (!device) {
        return res.status(404).json({ message: "Device not found or unauthorized" });
    }

    const reading = await Reading.findOne({ deviceId })
        .sort({ ts: -1 })
        .lean();

    if (!reading) {
        return res.status(404).json({ message: "No readings found for this device" });
    }

    return res.status(200).json({
        message: "Latest reading fetched successfully",
        reading
    });
};