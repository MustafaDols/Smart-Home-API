import 'dotenv/config';
//Dependencies
import express from "express";
import cors from "cors";
import helmet from "helmet";
import http from "http";
//Modules
import userRouter from "./Modules/Users/user.controller.js";
import homeRouter from "./Modules/Homes/home.cotroller.js";
import devcieRouter from "./Modules/Devices/device.controller.js";
import alertRouter from "./Modules/Alert/alert.routes.js";

//DB
import dbConnection from "./DB/db.connection.js";
//Middlewares
import { generalLimiter, authLimiter } from './Middlewares/rate-limiter.middleware.js';
import {initializeSocket} from './config/socket.js';


const app = express();
const httpServer = http.createServer(app);

// Parser middleware
app.use(express.json());
app.use("/uploads", express.static("uploads"));


// Some CORS options
const whitelist = process.env.WHITE_LISTED_ORIGINS || [];
const corsOptions = {
    origin: function (origin, callback) {
        console.log("origin: ", origin);

        if (!origin || whitelist.includes(origin)) {
            callback(null, true)
        } else {
            callback(new Error('Not allowed by CORS'))
        }
    }
}

// Use some Security middlewares
app.use(cors(corsOptions))
app.use(generalLimiter)
app.use(helmet())

// database connection
dbConnection();
initializeSocket(httpServer);


// Handle routes
app.use("/users", userRouter);
app.use("/homes", homeRouter);
app.use("/devices", devcieRouter);
app.use("/alerts", alertRouter);

// Error handling middleware
app.use(async (error, req, res, next) => {
    console.log("session inside error handling middleware: ", req.session);

    if (req.session && req.session.inTransaction()) {

        //abort transaction
        await req.session.abortTransaction()
        //end session
        req.session.endSession()
        return res.status(500).json({ message: "the transaction is aborted" })
    }
    res.status(error.cause || 500).json({ message: "something broke!", error: error.message, stack: error.stack });
});

// Not found middleware
app.use((req, res) => {
    res.status(404).send("Page Not found!");
});

// Start server 
httpServer.listen(process.env.PORT, () => {
    console.log("Server is running on port ", process.env.PORT);
});
