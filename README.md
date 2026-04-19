# 🏠 Smart Home Anomaly Detection API

A scalable backend API for a Smart Home Anomaly Detection system, built with **Node.js, Express, MongoDB**, and **Socket.io**, with AI-powered anomaly detection powered by **FastAPI**.

This project supports authentication, homes, devices, sensor readings, real-time alerts, and AI-based anomaly detection.

---

## 📌 Project Overview

The API is designed using a **modular architecture** to ensure scalability and maintainability. It exposes:

- RESTful APIs for core resources
- Socket.io for real-time anomaly alerts
- AI pipeline integration with FastAPI for anomaly detection

---

## 📁 Project Structure

```
src
├── Common          # Shared enums & types
├── DB              # Database connection & models
├── config          # Socket.io, FastAPI & DB config
├── Middlewares     # Authentication, validation & rate limiting
├── Modules         # Application modules
│   ├── Users
│   ├── Homes
│   ├── Devices
│   ├── Readings
│   ├── Anomalies
│   └── Alerts
├── Utils           # Helpers (encryption, tokens, email)
├── Validators      # Request validation schemas (Joi)
└── index.js        # App entry point
```

---

## 🔐 Authentication

- JWT-based authentication (Access Token 5m + Refresh Token 7d)
- Protected routes via `authenticationMiddleware`
- Token blacklisting on logout
- AES + RSA encryption for sensitive data (phone number)
- OTP email verification on signup via Nodemailer

---

## 🔄 REST API Endpoints

### 👤 Auth & Users
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/users/signup` | Register new user + OTP email |
| POST | `/users/signin` | Login + get tokens |
| POST | `/users/logout` | Blacklist token |

### 🏠 Homes
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/homes/createHome` | Create a new home |
| GET | `/homes/getHomes` | List all homes |
| GET | `/homes/getHome/:location` | Get single home |
| PUT | `/homes/updateHome/:location` | Transfer ownership |
| DELETE | `/homes/deleteHome/:location` | Delete home |

### 📡 Devices
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/devices/createDevice` | Add device to home |
| GET | `/devices/getDevices` | List all devices |
| GET | `/devices/getDevice/:id` | Get single device |
| PUT | `/devices/updateDevice/:id` | Update device |
| DELETE | `/devices/deleteDevice/:id` | Remove device |
| PATCH | `/devices/updateDeviceStatus` | Mark online + update lastSeen |

### 📊 Readings
| Method | Route | Description |
|--------|-------|-------------|
| POST | `/readings` | Submit sensor data → triggers AI pipeline |
| GET | `/readings/:deviceId` | Get all readings for device |
| GET | `/readings/:deviceId/latest` | Get latest reading |

### ⚠️ Anomalies
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/anomalies` | List all anomalies (with filters) |
| GET | `/anomalies/stats` | Count per anomaly type |
| GET | `/anomalies/:deviceId` | Device anomalies |

### 🔔 Alerts
| Method | Route | Description |
|--------|-------|-------------|
| GET | `/alerts` | List all alerts |
| GET | `/alerts/unread` | Unread alerts |
| GET | `/alerts/severity/:severity` | Filter by severity |
| GET | `/alerts/device/:deviceId` | Device alerts |
| PATCH | `/alerts/:id/read` | Mark as read |
| PATCH | `/alerts/:id/resolved` | Mark as resolved |
| DELETE | `/alerts/:id` | Delete alert |

---

## 🤖 AI Pipeline

Every sensor reading triggers a full AI pipeline:

```
[Device] → POST /readings
              ↓
         Save to MongoDB
              ↓
    Compute lag & rolling features
              ↓
         POST /predict → FastAPI
              ↓
         isAnomaly?
        /           \
      No             Yes
      ↓               ↓
   return         Save Anomaly
   reading            ↓
                  Save Alert
                      ↓
               Socket.io → new_alert
                      ↓
                  Frontend ⚡
```

---

## ⚡ Real-Time (Socket.io)

- Initialized after server start
- JWT-authenticated connections
- Each user joins a private room by `userId`
- Events:

| Event | Direction | Description |
|-------|-----------|-------------|
| `new_alert` | Server → Client | Anomaly detected |
| `alert-updated` | Server → Client | Alert marked as read |
| `alert-resolved` | Server → Client | Alert resolved |
| `alert-deleted` | Server → Client | Alert deleted |

---

## ⚠️ Anomaly Types & Severity

| Type | Severity |
|------|----------|
| `fire` | critical |
| `gas_leak` | critical |
| `intrusion` | high |
| `water_leak` | medium |
| `energy_anomaly` | medium |
| `sensor_fault` | low |

---

## 🛠️ Technologies Used

- **Node.js**
- **Express.js**
- **MongoDB + Mongoose**
- **Socket.io**
- **JWT Authentication**
- **Joi** (validation)
- **bcrypt** (password hashing)
- **Nodemailer** (OTP emails)
- **Cloudinary** (profile pictures)
- **Axios** (FastAPI communication)
- **Helmet + CORS** (security)
- **express-rate-limit** (rate limiting)

---

## ❗ Error Handling

- Centralized error handling middleware
- Consistent JSON response shape
- Handles:
  - Validation errors (400)
  - Auth errors (401)
  - Not found errors (404)
  - Server errors (500)
  - AI service unavailable (207)

---

## 🗄️ Database Relations

```
User ──(1:N)──► Home ──(1:N)──► Device ──(1:N)──► Reading
                                                       │
                                                    (1:0..1)
                                                       ▼
                                                   Anomaly ──(1:1)──► Alert
```

---

## 🌐 Environment Variables



## 👨‍💻 Author

Developed by **Mustafa M. Abdelaziz**  
Backend Developer | Node.js  
Use, and improve this project 🚀
