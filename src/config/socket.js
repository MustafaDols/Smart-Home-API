import { Server } from "socket.io";
import { verifyToken } from "../Utils/tokens.utils.js";

let io; 

export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "*",
      credentials: true,
      methods: ["GET", "POST"]
    },
    transports: ["websocket", "polling"],
  
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) {
      return next(new Error("Unauthorized - No token"));
    }
    try {
      const decoded = verifyToken(token, process.env.JWT_ACCESS_SECRET);
      socket.user = decoded;
      const userRoom = decoded._id.toString();
      socket.join(userRoom);
      next();
    } catch (err) {
      next(new Error("Unauthorized - Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`User connected: ${socket.id} | UserId: ${socket.user?._id}`);

    socket.on("join-room", (roomId) => {
      if (!socket.user || !roomId) return;

      if (!roomId || typeof roomId !== "string") return;
      socket.join(roomId);
    });

    socket.on("leave-room", (roomId) => {
      socket.leave(roomId);
    });

    socket.on("disconnect", () => {
      console.log(`User disconnected: ${socket.id}`);
    });
  });


  return io;
};

export const getIO = () => {
  if (!io) throw new Error("Socket not initialized");
  return io;
};