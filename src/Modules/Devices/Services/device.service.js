import Device from "../../../DB/Models/device.model.js";
import Home from "../../../DB/Models/home.model.js";
import { emitDashboardUpdateEvent, emitDeviceStatusChangedEvent } from "../../Dashboard/dashboard.events.js";


export const createDeviceService = async (req, res) => {

    const { name, location, isActive, homeId } = req.body;

    
    const home = await Home.findOne({
        _id: homeId,
        ownerId: req.loggedInUser.user._id
    });

    if (!home) {
        return res.status(404).json({ message: "Home not found or unauthorized" });
    }

    
    const isExist = await Device.findOne({
        name,
        homeId
    });

    if (isExist) {
        return res.status(409).json({ message: "Device already exists in this home" });
    }

    const device = await Device.create({
        name,
        location,
        isActive,
        homeId,
        userId: req.loggedInUser.user._id
    });

    return res.status(201).json({
        message: "Device created successfully",
        device
    });
};

export const getDevicesService = async (req, res) => {

    const devices = await Device.find({
        userId: req.loggedInUser.user._id
    }).populate("homeId", "name location").sort({ createdAt: -1 });

    return res.status(200).json({
        message: "Devices fetched successfully",
        devices
    });
};

export const getDeviceService = async (req, res) => {

    const { id } = req.params;

    const device = await Device.findOne({
        _id: id,
        userId: req.loggedInUser.user._id
    }).populate("homeId", "name location");

    if (!updatedDevice) {
        return res.status(404).json({ message: "Device not found" });
    }

    const statusOfDevice = (device) => {
        if (!device.isActive) {
            return "offline";
        }

        const staleMs = 1000 * 60 * 15;
        const lastSeen = device.lastSeen ? device.lastSeen.getTime() : 0;
        return Date.now() - lastSeen <= staleMs ? "online" : "stale";
    };

    const oldStatus = statusOfDevice(existingDevice);
    const newStatus = statusOfDevice(updatedDevice);
    const statusDelta = {};

    if (oldStatus !== newStatus) {
        const addMap = {
            online: { activeDevicesCountDelta: 1 },
            offline: { offlineDevicesCountDelta: 1 },
            stale: { staleDeviceCountDelta: 1 }
        };
        const removeMap = {
            online: { activeDevicesCountDelta: -1 },
            offline: { offlineDevicesCountDelta: -1 },
            stale: { staleDeviceCountDelta: -1 }
        };

        Object.assign(statusDelta, removeMap[oldStatus] || {}, addMap[newStatus] || {});
    }

    emitDeviceStatusChangedEvent(userId, {
        device: {
            deviceId: updatedDevice._id,
            name: updatedDevice.name,
            location: updatedDevice.location
        },
        isActive: updatedDevice.isActive,
        lastSeen: updatedDevice.lastSeen,
        status: newStatus
    });

    if (Object.keys(statusDelta).length) {
        emitDashboardUpdateEvent(userId, {
            deviceHealth: statusDelta
        });
    }

    return res.status(200).json({
        message: "Device status updated",
        device: updatedDevice
    });
};

export const updateDeviceService = async (req, res) => {

    const { id } = req.params;

    const device = await Device.findOneAndUpdate(
        { _id: id, userId: req.loggedInUser.user._id },
        req.body,
        { new: true }
    );

    if (!device) {
        return res.status(404).json({ message: "Device not found or unauthorized" });
    }

    return res.status(200).json({
        message: "Device updated successfully",
        device
    });
};

export const deleteDeviceService = async (req, res) => {

    const { id } = req.params;

    const device = await Device.findOneAndDelete({
        _id: id,
        userId: req.loggedInUser.user._id
    });

    if (!device) {
        return res.status(404).json({ message: "Device not found or unauthorized" });
    }

    return res.status(200).json({
        message: "Device deleted successfully"
    });
};

export const updateDeviceStatusService = async (req, res) => {

    const { deviceId } = req.body;
    const userId = req.loggedInUser.user._id;

    const existingDevice = await Device.findOne({ _id: deviceId, userId }).lean();
    if (!existingDevice) {
        return res.status(404).json({ message: "Device not found or unauthorized" });
    }

    const updatedDevice = await Device.findByIdAndUpdate(
        deviceId,
        {
            isActive: true,
            lastSeen: new Date()
        },
        { new: true }
    ).lean();

    if (!device) {
        return res.status(404).json({ message: "Device not found" });
    }

    return res.status(200).json({
        message: "Device status updated",
        device
    });
};