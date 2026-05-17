import Device from "../../DB/Models/device.model.js";
import Reading from "../../DB/Models/reading.model.js";

export const getAnalyticsService = async (req, res) => {
    const userId = req.loggedInUser.user._id;
    const { range = '24h' } = req.query; // '24h' | '7d' | '30d'


    const userDevices = await Device.find({ userId }).lean();
    const deviceIds = userDevices.map(d => d._id);

    // حساب from date بناءً على range
    const now = new Date();
    const from = new Date(now);
    if (range === '7d') from.setDate(now.getDate() - 7);
    else if (range === '30d') from.setDate(now.getDate() - 30);
    else from.setHours(now.getHours() - 24);

    const readings = await Reading.find({
        deviceId: { $in: deviceIds },
        ts: { $gte: from }
    }).sort({ ts: 1 }).lean();

    // --- حساب الـ stats ---
    const totalReadings = readings.length;
    const anomalies = readings.filter(r => r.isAnomaly);
    const normal = readings.filter(r => !r.isAnomaly);

    // Anomaly breakdown by type
    const anomalyBreakdown = anomalies.reduce((acc, r) => {
        acc[r.anomalyType] = (acc[r.anomalyType] || 0) + 1;
        return acc;
    }, {});

    // Sensor averages
    const avg = (key) =>
        readings.length ? readings.reduce((s, r) => s + r[key], 0) / readings.length : 0;

    // Time series: group by hour (for 24h) or day (for 7d/30d)
    const groupKey = (ts) => {
        const d = new Date(ts);
        if (range === '24h') return `${d.getHours()}:00`;
        return d.toISOString().split('T')[0]; // YYYY-MM-DD
    };

    const timeSeries = {};
    for (const r of readings) {
        const key = groupKey(r.ts);
        if (!timeSeries[key]) timeSeries[key] = { temp: [], gas: [], smoke: [], power: [], anomalies: 0 };
        timeSeries[key].temp.push(r.temp);
        timeSeries[key].gas.push(r.gas);
        timeSeries[key].smoke.push(r.smoke);
        timeSeries[key].power.push(r.power);
        if (r.isAnomaly) timeSeries[key].anomalies++;
    }

    const timeSeriesData = Object.entries(timeSeries).map(([label, vals]) => ({
        label,
        avgTemp: vals.temp.reduce((s, v) => s + v, 0) / vals.temp.length,
        avgGas: vals.gas.reduce((s, v) => s + v, 0) / vals.gas.length,
        avgSmoke: vals.smoke.reduce((s, v) => s + v, 0) / vals.smoke.length,
        avgPower: vals.power.reduce((s, v) => s + v, 0) / vals.power.length,
        anomalies: vals.anomalies,
    }));

    return res.status(200).json({
        message: "Analytics fetched successfully",
        range,
        summary: {
            totalReadings,
            totalAnomalies: anomalies.length,
            normalReadings: normal.length,
            anomalyRate: totalReadings ? ((anomalies.length / totalReadings) * 100).toFixed(1) : 0,
            activeDevices: userDevices.length,
            avgTemp: avg('temp').toFixed(1),
            avgGas: avg('gas').toFixed(1),
            avgSmoke: avg('smoke').toFixed(1),
            avgPower: avg('power').toFixed(1),
        },
        anomalyBreakdown,  // { fire: 5, gas_leak: 3 }
        timeSeries: timeSeriesData,  // للـ charts
    });
};