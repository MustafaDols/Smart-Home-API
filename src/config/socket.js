import { Server } from "socket.io";
import { verifyToken } from "../Utils/tokens.utils.js";

let io; // 🔥 global variable

export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.CLIENT_URL || "http://localhost:3000",
      credentials: true,
      methods: ["GET", "POST"]
    },
    transports: ["websocket", "polling"]
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;

    if (!token) return next(new Error("Unauthorized"));

    try {
      // verify JWT هنا
      const decoded = verifyToken(token);

      socket.user = decoded;
      const userRoom = decoded.id.toString();
      socket.join(userRoom);
      next();
    } catch (err) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {

    console.log(`User connected: ${socket.id} | UserId: ${socket.user?.id}`);

    socket.on("join-room", (roomId) => {
      if (!socket.user || !roomId) return;

      // مثال بسيط
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

// 🔥 دي أهم إضافة
export const getIO = () => {
  if (!io) throw new Error("Socket not initialized");
  return io;
};