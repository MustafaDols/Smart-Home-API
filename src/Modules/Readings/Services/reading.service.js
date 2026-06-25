import axios from "axios";
import Reading from "../../../DB/Models/reading.model.js";
import Anomaly from "../../../DB/Models/anomaly.model.js";
import Device from "../../../DB/Models/device.model.js";
import { getIO } from "../../../config/socket.js";
import { createAlert } from "../../Alert/service/createAlert.js";
import { shouldEmit } from "../../Alert/service/shouldEmit.js";

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

    const now = new Date();
    const time = {
        hour: now.getHours(),
        day: now.getDate(),
        dayofweek: now.getDay(),
        is_night: now.getHours() >= 23 || now.getHours() <= 5 ? 1 : 0
    };

    const lag = {};
    for (const key of SENSOR_KEYS) {
        lag[`${key}_lag1`] = get(0, key);
        lag[`${key}_lag2`] = get(1, key);
    }


    const rolling = {};
    for (const key of SENSOR_KEYS) {
        const window = history.slice(0, 5).map((r) => r[key]);
        const usableWindow = window.length > 0 ? window : [current[key]];

        const mean =
            usableWindow.reduce((s, v) => s + v, 0) / usableWindow.length;

        const std =
            usableWindow.length < 2
                ? 0
                : Math.sqrt(
                    usableWindow.reduce((s, v) => s + Math.pow(v - mean, 2), 0) /
                    usableWindow.length
                );

        rolling[`${key}_roll_mean`] = mean;
        rolling[`${key}_roll_std`] = std;
    }

    const interaction = {
        motion_door: current.motion * current.door,
        high_power: current.power > 400 ? 1 : 0,
        high_smoke: current.smoke > 10 ? 1 : 0,
        smoke_gas_ratio: current.smoke / (current.gas + 1),
        temp_power_ratio: current.temp / (current.power + 1)
    };

    return { ...base, ...time, ...lag, ...rolling, ...interaction };
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

    
    const history = await Reading.find({ deviceId, _id: { $ne: reading._id } })
        .sort({ ts: -1 })
        .limit(5)
        .lean();

    const features = buildFeatures(
        { temp, smoke, gas, power, motion, door, water_flow },
        history
    );

    let fastapiResult;
    try {
        const { data } = await axios.post(
            `${process.env.FASTAPI_URL}/predict`,
            { deviceId, ...features }
        );
        fastapiResult = data;
    } catch (err) {
        console.error("FastAPI error:", err.message);
        return res.status(207).json({
            message: "Reading saved but AI service unavailable",
            reading
        });
    }

    const { isAnomaly, type: anomalyType } = fastapiResult;

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

        alert = await createAlert({
            userId: device.userId,
            homeId: device.homeId,
            deviceId,
            anomaly,
            device,
            reading
        });
    } else {
        const sensorSnapshot = { temp, smoke, gas, power, water_flow };

        if (shouldEmit(deviceId, sensorSnapshot)) {
            try {
                const io = getIO();
                io.to(device.userId.toString()).emit("new_reading", { reading });
            } catch (socketErr) {
                console.error("Socket emit error:", socketErr.message);
            }
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

export const getAllReadingsService = async (req, res) => {
    const userId = req.loggedInUser.user._id;

    const userDevices = await Device.find({ userId }).lean();
    if (!userDevices.length) {
        return res.status(200).json({
            message: "No devices found for this user",
            count: 0,
            readings: []
        });
    }

    const deviceIds = userDevices.map((device) => device._id);
    const readings = await Reading.find({ deviceId: { $in: deviceIds } })
        .sort({ ts: -1 })
        .lean();

    return res.status(200).json({
        message: "All readings fetched successfully for the authenticated user",
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
