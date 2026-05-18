import Device from "../../DB/Models/device.model.js";
import Reading from "../../DB/Models/reading.model.js";
import Alert from "../../DB/Models/alert.model.js";

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
            totalDevices: 0,
        });
    }

    const deviceIds = userDevices.map((d) => d._id);

    // ── Sensors: average of latest reading per device ─────────────────────────
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
        temp:       parseFloat(avg("temp").toFixed(1)),
        gas:        parseFloat(avg("gas").toFixed(2)),
        smoke:      parseFloat(avg("smoke").toFixed(1)),
        motion:     validReadings.some((r) => r.motion === 1),
        water_flow: parseFloat(avg("water_flow").toFixed(2)),
        power:      parseFloat(avg("power").toFixed(1)),
    };

    // ── System status: from unresolved alerts only ────────────────────────────
    const [unresolvedAlerts, recentAlerts] = await Promise.all([
        Alert.find({ userId, isResolved: false }).lean(),
        Alert.find({ userId })
            .sort({ createdAt: -1 })
            .limit(10)
            .populate("deviceId", "name location")
            .lean(),
    ]);

    const hasCritical = unresolvedAlerts.some((a) =>
        ["fire", "gas_leak", "intrusion"].includes(a.anomalyType)
    );
    const hasMedium = unresolvedAlerts.some((a) =>
        ["water_leak", "energy_anomaly"].includes(a.anomalyType)
    );

    const systemStatus = hasCritical ? "alert" : hasMedium ? "warning" : "safe";

    // ── Recent activity: alerts only (no readings) — alerts already wrap readings ──
    const recentActivity = recentAlerts.map((a) => ({
        id:    a._id,
        type:  a.severity === "critical" || a.severity === "high" ? "Critical" : "Warning",
        title: a.message,
        time:  a.createdAt,
    }));

    return res.status(200).json({
        message: "Dashboard data fetched successfully",
        sensors,
        systemStatus,
        activeDevices: validReadings.length,
        totalDevices:  userDevices.length,
        recentActivity,
    });
};