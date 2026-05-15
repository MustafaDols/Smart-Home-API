import { Types } from "mongoose";
import Alert from "../../../src/DB/Models/alert.model.js";
import Anomaly from "../../../src/DB/Models/anomaly.model.js";
import Device from "../../../src/DB/Models/device.model.js";
import Reading from "../../../src/DB/Models/reading.model.js";
import User from "../../../src/DB/Models/user.model.js";

const STALE_DEVICE_MS = 1000 * 60 * 15;
const MAX_LATEST_ALERTS = 5;
const MAX_LATEST_SENSOR_STATES = 5;
const MAX_RECENT_ACTIVITY = 6;

const normalizeAlertSummary = (alert) => ({
    alertId: alert._id,
    anomalyType: alert.anomalyType,
    severity: alert.severity,
    isRead: alert.isRead,
    isResolved: alert.isResolved,
    createdAt: alert.createdAt,
    message: alert.message,
    device: alert.deviceId
        ? {
              deviceId: alert.deviceId._id,
              name: alert.deviceId.name,
              location: alert.deviceId.location
          }
        : null,
    home: alert.homeId
        ? {
              homeId: alert.homeId._id,
              name: alert.homeId.name
          }
        : null
});

const normalizeSensorState = (reading) => ({
    device: {
        deviceId: reading.device.id,
        name: reading.device.name,
        location: reading.device.location
    },
    reading: {
        readingId: reading.readingId,
        ts: reading.ts,
        temp: reading.temp,
        smoke: reading.smoke,
        gas: reading.gas,
        power: reading.power,
        motion: reading.motion,
        door: reading.door,
        water_flow: reading.water_flow,
        isAnomaly: reading.isAnomaly,
        anomalyType: reading.anomalyType
    }
});

const buildDeviceStatus = (device) => {
    const now = Date.now();
    const lastSeen = device.lastSeen ? device.lastSeen.getTime() : null;
    let status = "offline";

    if (device.isActive) {
        if (lastSeen && now - lastSeen <= STALE_DEVICE_MS) {
            status = "online";
        } else {
            status = "stale";
        }
    }

    return status;
};

export const getDashboardSummary = async (userId) => {
    const userObjectId = new Types.ObjectId(userId);

    const user = await User.findById(userObjectId).select("unreadAlerts").lean();

    const devices = await Device.find({ userId: userObjectId }).select(
        "name location isActive lastSeen"
    ).lean();

    const deviceIds = devices.map((device) => device._id);

    const deviceHealth = {
        totalDevices: devices.length,
        onlineDeviceCount: 0,
        offlineDeviceCount: 0,
        staleDeviceCount: 0,
        staleThresholdMinutes: 15
    };

    const deviceStatusSummary = devices.map((device) => {
        const status = buildDeviceStatus(device);
        if (status === "online") {
            deviceHealth.onlineDeviceCount += 1;
        } else if (status === "offline") {
            deviceHealth.offlineDeviceCount += 1;
        } else {
            deviceHealth.staleDeviceCount += 1;
        }

        return {
            deviceId: device._id,
            name: device.name,
            location: device.location,
            isActive: device.isActive,
            status,
            lastSeen: device.lastSeen
        };
    });

    const latestAlertsPromise = Alert.find({ userId: userObjectId })
        .sort({ createdAt: -1 })
        .limit(MAX_LATEST_ALERTS)
        .populate("deviceId", "name location")
        .populate("homeId", "name")
        .lean();

    const criticalAlertCountPromise = Alert.countDocuments({
        userId: userObjectId,
        severity: "critical",
        isResolved: false
    });

    const anomalyStatsPromise = deviceIds.length
        ? Anomaly.aggregate([
              { $match: { deviceId: { $in: deviceIds } } },
              {
                  $facet: {
                      byType: [
                          {
                              $group: {
                                  _id: "$anomalyType",
                                  count: { $sum: 1 }
                              }
                          },
                          {
                              $project: {
                                  type: "$_id",
                                  count: 1,
                                  _id: 0
                              }
                          }
                      ],
                      bySeverity: [
                          {
                              $group: {
                                  _id: "$severity",
                                  count: { $sum: 1 }
                              }
                          },
                          {
                              $project: {
                                  severity: "$_id",
                                  count: 1,
                                  _id: 0
                              }
                          }
                      ],
                      total: [{ $count: "count" }]
                  }
              }
          ])
        : Promise.resolve([{ byType: [], bySeverity: [], total: [{ count: 0 }] }]);

    const latestSensorStatesPromise = deviceIds.length
        ? Reading.aggregate([
              { $match: { deviceId: { $in: deviceIds } } },
              { $sort: { ts: -1 } },
              {
                  $group: {
                      _id: "$deviceId",
                      latest: { $first: "$$ROOT" }
                  }
              },
              {
                  $lookup: {
                      from: "devices",
                      localField: "_id",
                      foreignField: "_id",
                      as: "device"
                  }
              },
              { $unwind: "$device" },
              {
                  $project: {
                      device: {
                          id: "$device._id",
                          name: "$device.name",
                          location: "$device.location"
                      },
                      readingId: "$latest._id",
                      ts: "$latest.ts",
                      temp: "$latest.temp",
                      smoke: "$latest.smoke",
                      gas: "$latest.gas",
                      power: "$latest.power",
                      motion: "$latest.motion",
                      door: "$latest.door",
                      water_flow: "$latest.water_flow",
                      isAnomaly: "$latest.isAnomaly",
                      anomalyType: "$latest.anomalyType"
                  }
              },
              { $sort: { ts: -1 } },
              { $limit: MAX_LATEST_SENSOR_STATES }
          ])
        : Promise.resolve([]);

    const [latestAlerts, criticalAlertCount, anomalyStatsResult, latestSensorStates] =
        await Promise.all([
            latestAlertsPromise,
            criticalAlertCountPromise,
            anomalyStatsPromise,
            latestSensorStatesPromise
        ]);

    const anomalyStatsData = anomalyStatsResult[0] || {
        byType: [],
        bySeverity: [],
        total: [{ count: 0 }]
    };

    const recentActivity = [
        ...latestAlerts.map((alert) => ({
            id: alert._id,
            type: "alert",
            occurredAt: alert.createdAt,
            title: `${alert.severity.toUpperCase()} ${alert.anomalyType.replace("_", " ")}`,
            subtitle: alert.message,
            severity: alert.severity,
            device: alert.deviceId
                ? {
                      deviceId: alert.deviceId._id,
                      name: alert.deviceId.name,
                      location: alert.deviceId.location
                  }
                : null,
            home: alert.homeId ? { homeId: alert.homeId._id, name: alert.homeId.name } : null,
            link: {
                type: "alert",
                id: alert._id
            }
        })),
        ...latestSensorStates.map((state) => ({
            id: state.readingId,
            type: "sensor",
            occurredAt: state.ts,
            title: `Latest reading from ${state.device.name}`,
            subtitle: state.isAnomaly
                ? `${state.anomalyType?.replace("_", " ") ?? "Anomaly"} detected`
                : "Sensor telemetry updated",
            device: state.device,
            anomalyType: state.anomalyType,
            isAnomaly: state.isAnomaly,
            link: {
                type: "device",
                id: state.device.deviceId
            }
        }))
    ]
        .sort((a, b) => new Date(b.occurredAt) - new Date(a.occurredAt))
        .slice(0, MAX_RECENT_ACTIVITY);

    return {
        unreadAlertCount: user?.unreadAlerts ?? 0,
        criticalAlertCount,
        activeDevicesCount: deviceHealth.onlineDeviceCount,
        offlineDevicesCount: deviceHealth.offlineDeviceCount,
        deviceHealthSummary: deviceHealth,
        anomalyStatistics: {
            totalAnomalies: anomalyStatsData.total[0]?.count ?? 0,
            byType: anomalyStatsData.byType,
            bySeverity: anomalyStatsData.bySeverity
        },
        latestAlerts: latestAlerts.map(normalizeAlertSummary),
        latestSensorStates: latestSensorStates.map(normalizeSensorState),
        recentActivity,
        lastUpdatedAt: new Date()
    };
};
