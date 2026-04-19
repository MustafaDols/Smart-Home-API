// Dependencies
import "dotenv/config";
import express from "express";
import cors from "cors";
import helmet from "helmet";
import http from "http";
// Routers
import userRouter from "./Modules/Users/user.controller.js";
import homeRouter from "./Modules/Homes/home.cotroller.js";
import deviceRouter from "./Modules/Devices/device.controller.js";
import alertRouter from "./Modules/Alert/alert.routes.js";
import readingRouter from "./Modules/Readings/reading.controller.js";
import anomalyRouter from "./Modules/Anomalies/anomaly.controller.js";
// DB
import dbConnection from "./DB/db.connection.js";
// Middlewares
import { generalLimiter } from "./Middlewares/rate-limiter.middleware.js";
// Socket
import { initializeSocket } from "./config/socket.js";

const app = express();
const httpServer = http.createServer(app);

const PORT = process.env.PORT || 3000;
 

// Middlewares
app.use(express.json());
app.use("/uploads", express.static("uploads"));

// CORS
const whitelist = process.env.WHITE_LISTED_ORIGINS
    ? process.env.WHITE_LISTED_ORIGINS.split(",")
    : [];

app.use(
    cors({
        origin: function (origin, callback) {
            if (!origin || whitelist.includes(origin)) {
                callback(null, true);
            } else {
                callback(new Error("Not allowed by CORS"));
            }
        },
    })
);

// Security
app.use(helmet());
app.use(generalLimiter);

//Routes  
app.use("/users", userRouter);
app.use("/homes", homeRouter); 
app.use("/devices", deviceRouter); 
app.use("/alerts", alertRouter);
app.use("/readings", readingRouter);
app.use("/anomalies", anomalyRouter);

// Error Handler
app.use(async (error, req, res, next) => {
    try {
        if (req.session && req.session.inTransaction()) {
            await req.session.abortTransaction();
            req.session.endSession();
        }

        res.status(error.cause || 500).json({
            success: false,
            message: error.message || "Something broke!",
        });
    } catch {
        res.status(500).json({
            success: false,
            message: "Internal Server Error",
        });
    }
});

// Page Not Found
app.use((req, res) => {
    res.status(404).json({
        success: false,
        message: "Page Not Found",
    });
});

// Start Server
const startServer = async () => {
    try {
        await dbConnection();

        const server = httpServer.listen(PORT, () => {
            console.log(`Server is running on port ${PORT}`);
        });

        initializeSocket(server);

        server.on("error", (error) => {
            if (error.code === "EADDRINUSE") {
                console.error(`Port ${PORT} is already in use`);
            } else {
                console.error(error);
            }
        });

        const shutdown = () => {
            console.log("Shutting down server...");

            server.close(() => {
                console.log("Server closed gracefully");
                process.exit(0);
            });
        };

        process.on("SIGINT", shutdown);
        process.on("SIGTERM", shutdown);
    } catch (error) {
        console.error("Failed to start server:", error.message);
        process.exit(1);
    }
};

startServer();
  