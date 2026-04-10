import Device from "../../../DB/Models/device.model.js";
import Home from "../../../DB/Models/home.model.js";


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

    if (!device) {
        return res.status(404).json({ message: "Device not found" });
    }

    return res.status(200).json({
        message: "Device fetched successfully",
        device
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

    const device = await Device.findByIdAndUpdate(
        deviceId,
        {
            status: "online",
            lastSeen: new Date()
        },
        { new: true }
    );

    if (!device) {
        return res.status(404).json({ message: "Device not found" });
    }

    return res.status(200).json({
        message: "Device status updated",
        device
    });
};