import Anomaly from "../../../DB/Models/anomaly.model.js";
import Device from "../../../DB/Models/device.model.js";



const getUserDeviceIds = async (userId) => {
    const devices = await Device.find({ userId }, "_id").lean();
    return devices.map((d) => d._id);
};

export const getAnomaliesService = async (req, res) => {

    const { type, deviceId, from, to, limit } = req.query;

    const userDeviceIds = await getUserDeviceIds(req.loggedInUser.user._id);

    const filter = { deviceId: { $in: userDeviceIds } };

    if (type) filter.anomalyType = type;
    if (deviceId) filter.deviceId = deviceId;
    if (from || to) {
        filter.detectedAt = {};
        if (from) filter.detectedAt.$gte = new Date(from);
        if (to) filter.detectedAt.$lte = new Date(to);
    }

    const anomalies = await Anomaly.find(filter)
        .populate("deviceId", "name location")
        .sort({ detectedAt: -1 })
        .limit(limit ? parseInt(limit) : 100)
        .lean();

    return res.status(200).json({
        message: "Anomalies fetched successfully",
        count: anomalies.length,
        anomalies
    });
};



export const getAnomaliesStatsService = async (req, res) => {

    const userDeviceIds = await getUserDeviceIds(req.loggedInUser.user._id);

    const stats = await Anomaly.aggregate([
        { $match: { deviceId: { $in: userDeviceIds } } },
        { $group: { _id: "$anomalyType", count: { $sum: 1 } } },
        { $project: { _id: 0, type: "$_id", count: 1 } }
    ]);

    return res.status(200).json({
        message: "Anomaly stats fetched successfully",
        stats
    });
};



export const getDeviceAnomaliesService = async (req, res) => {

    const { deviceId } = req.params;

    // make sure device belongs to user
    const device = await Device.findOne({
        _id: deviceId,
        userId: req.loggedInUser.user._id
    }).lean();

    if (!device) {
        return res.status(404).json({ message: "Device not found or unauthorized" });
    }

    const anomalies = await Anomaly.find({ deviceId })
        .populate("deviceId", "name location")
        .sort({ detectedAt: -1 })
        .lean();

    return res.status(200).json({
        message: "Device anomalies fetched successfully",
        count: anomalies.length,
        anomalies
    });
};