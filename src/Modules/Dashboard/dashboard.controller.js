import Device from "../../DB/Models/device.model.js";
import Reading from "../../DB/Models/reading.model.js";
import Alert from "../../DB/Models/alert.model.js";
function formatTimeAgo(date) {
    const diff = Math.floor((Date.now() - new Date(date)) / 1000);
    if (diff < 60) return `${diff} seconds ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)} minutes ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} hours ago`;
    return `${Math.floor(diff / 86400)} days ago`;
}

export const getDashboardService = async (req, res) => {
    const userId = req.loggedInUser.user._id;

    const userDevices = await Device.find({ userId }).lean();
    if (!userDevices.length) {
        return res.status(200).json({
            message: "Dashboard data fetched successfully",
            sensors: null,
            systemStatus: "safe",
            recentActivity: [],
            activeDevices: 0,
        });
    }

    const deviceIds = userDevices.map((d) => d._id);

    // Latest reading per device → aggregate sensors
    const latestReadings = await Promise.all(
        deviceIds.map((id) =>
            Reading.findOne({ deviceId: id }).sort({ ts: -1 }).lean()
        )
    );
    const validReadings = latestReadings.filter(Boolean);

    const avg = (key) =>
        validReadings.length
            ? validReadings.reduce((s, r) => s + (r[key] ?? 0), 0) / validReadings.length
            : 0;

    const sensors = {
        temp: parseFloat(avg("temp").toFixed(1)),
        gas: parseFloat(avg("gas").toFixed(2)),
        smoke: parseFloat(avg("smoke").toFixed(1)),
        motion: validReadings.some((r) => r.motion === 1),
        water_flow: parseFloat(avg("water_flow").toFixed(2)),
        power: parseFloat(avg("power").toFixed(1)),
    };

    // System status — any anomaly in latest readings?
    const anomalyReadings = validReadings.filter((r) => r.isAnomaly);

    // System status — consider only unresolved alerts for active critical/warning state
    const [unresolvedAlerts, recentAlerts, recentAnomalyReadings] = await Promise.all([
        Alert.find({ userId, isResolved: false }).lean(),
        Alert.find({ userId }).sort({ createdAt: -1 }).limit(10).lean(),
        Reading.find({ deviceId: { $in: deviceIds }, isAnomaly: true })
            .sort({ ts: -1 })
            .limit(10)
            .lean(),
    ]);

    const hasCritical = unresolvedAlerts.some((r) =>
        ['fire', 'gas_leak', 'intrusion'].includes(r.anomalyType)
    );
    const hasMedium = unresolvedAlerts.some((r) =>
        ['water_leak', 'energy_anomaly'].includes(r.anomalyType)
    );

    const systemStatus = hasCritical ? "alert" : hasMedium ? "warning" : "safe";

    // Recent Activity — last 10 alerts + last 10 anomaly readings, merged by date

    const alertActivities = recentAlerts.map((a) => ({
        id: a._id,
        type: "alert",
        title: a.message || `${a.anomalyType} detected`,
        deviceId: a.deviceId,
        time: a.createdAt,
    }));

    const readingActivities = recentAnomalyReadings.map((r) => ({
        id: r._id,
        type: "anomaly",
        title: `${r.anomalyType?.replace("_", " ")} detected`,
        deviceId: r.deviceId,
        time: r.ts,
    }));

    const recentActivity = [...alertActivities, ...readingActivities]
        .sort((a, b) => new Date(b.time) - new Date(a.time))
        .slice(0, 10)
        .map((item) => ({
            ...item,
            timeAgo: formatTimeAgo(item.time),
        }));

    return res.status(200).json({
        message: "Dashboard data fetched successfully",
        sensors,
        systemStatus,
        activeDevices: validReadings.length,
        totalDevices: userDevices.length,
        recentActivity,
    });
};

