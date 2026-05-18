const DEAD_BAND = {
    temp:       2,
    gas:        5,
    smoke:      10,
    power:      50,
    water_flow: 0.5,
};

const THROTTLE_MS = 5_000; // 5 seconds

const lastEmittedCache = {};

export function shouldEmit(deviceId, reading) {
    const now  = Date.now();
    const last = lastEmittedCache[deviceId];

    // First reading for this device → always emit
    if (!last) {
        lastEmittedCache[deviceId] = { values: reading, time: now };
        return true;
    }

    // Big change in any sensor → emit immediately
    const bigChange = Object.keys(DEAD_BAND).some(
        (key) => Math.abs((reading[key] ?? 0) - (last.values[key] ?? 0)) > DEAD_BAND[key]
    );

    if (bigChange) {
        lastEmittedCache[deviceId] = { values: reading, time: now };
        return true;
    }

    // Small change but throttle window passed → emit
    if (now - last.time >= THROTTLE_MS) {
        lastEmittedCache[deviceId] = { values: reading, time: now };
        return true;
    }

    // Small change within throttle window → skip
    return false;
}

// Cleanup devices inactive for more than 1 hour to prevent memory leak
setInterval(() => {
    const oneHourAgo = Date.now() - 3_600_000;
    for (const id in lastEmittedCache) {
        if (lastEmittedCache[id].time < oneHourAgo) {
            delete lastEmittedCache[id];
        }
    }
}, 3_600_000);
