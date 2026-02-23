// database connection
import mongoose from "mongoose";

export const dbConnection = async () => {
    try {
        //30s timeout
        await mongoose.connect(process.env.DB_URL_LOCAL);
        console.log("Database connected successfully");
    } catch (error) {
        console.log(" Database failing to connect", error);
    }
};

export default dbConnection;