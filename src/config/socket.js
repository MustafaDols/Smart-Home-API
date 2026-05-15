import { Server } from "socket.io";
import { verifyToken } from "../Utils/tokens.utils.js";

let io;

export const initializeSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: true,
      credentials: true,
    },
    transports: ["websocket"],
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error("Unauthorized"));
      }

      const decoded = verifyToken(
        token,
        process.env.JWT_ACCESS_SECRET
      );

      socket.user = decoded;

      next();
    } catch (err) {
      next(new Error("Unauthorized"));
    }
  });

  io.on("connection", (socket) => {
    console.log("CONNECTED:", socket.id);

    const userRoom = socket.user._id.toString();

    socket.join(userRoom);

    console.log("JOINED ROOM:", userRoom);

    socket.on("disconnect", () => {
      console.log("DISCONNECTED:", socket.id);
    });
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket not initialized");
  }

  return io;
};