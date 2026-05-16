# Devices API Documentation for Frontend

This document describes the device-related endpoints available to the React Native frontend, including the new `getDevicesByHomeId` endpoint.
All endpoints require authentication via the `accesstoken` header.

## Authentication

Send the JWT access token in every request:

```http
accesstoken: YOUR_JWT_ACCESS_TOKEN
```

---

## 1. Get Devices by Home ID

**Endpoint**: `GET /devices/getDevicesByHome/:homeId`

**Purpose**: fetch all devices belonging to a specific home owned by the authenticated user.

### Example

`GET /devices/getDevicesByHome/6456d1c8f3a9b1a9d1234567`

### Success response

- Status: `200 OK`

```json
{
  "message": "Devices fetched successfully by home",
  "devices": [
    {
      "_id": "6456d1c8f3a9b1a9d1231234",
      "name": "Kitchen Sensor",
      "location": "kitchen",
      "isActive": true,
      "lastSeen": "2026-05-15T08:15:00.000Z",
      "homeId": {
        "_id": "6456d1c8f3a9b1a9d1234567",
        "name": "Main Home",
        "location": "123 Maple Street"
      },
      "userId": "6a0609373e14f5fa362303c6",
      "createdAt": "2026-05-14T12:00:00.000Z",
      "updatedAt": "2026-05-15T08:15:00.000Z"
    }
  ]
}
```

### Errors

- `404 Not Found` if the `homeId` does not exist or does not belong to the current user.

---

## 2. Existing Device Endpoints

### Get all devices

**Endpoint**: `GET /devices/getDevices`

**Purpose**: fetch all devices owned by the authenticated user.

### Get device by ID

**Endpoint**: `GET /devices/getDevice/:id`

**Purpose**: fetch a specific device by its MongoDB `_id`.

### Create device

**Endpoint**: `POST /devices/createDevice`

**Purpose**: create a new device under an existing home.

### Update device

**Endpoint**: `PUT /devices/updateDevice/:id`

**Purpose**: update device metadata.

### Delete device

**Endpoint**: `DELETE /devices/deleteDevice/:id`

**Purpose**: delete a device owned by the authenticated user.

### Update device status

**Endpoint**: `PATCH /devices/updateDeviceStatus`

**Purpose**: mark a device as online and set its latest seen timestamp.

---

## Frontend integration notes

- Use `GET /devices/getDevicesByHome/:homeId` when the UI needs device data for a specific home.
- Use `GET /devices/getDevices` for global device lists across all homes.
- Prefer `homeId`-scoped queries when rendering home detail screens or device lists grouped by home.
- Handle `404` by refreshing the home list and informing the user that the selected home is not available.
- This endpoint returns populated home metadata (`name` and `location`) for easy UI rendering.
