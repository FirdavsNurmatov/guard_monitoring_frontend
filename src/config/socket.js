import { io } from "socket.io-client";

const data = JSON.parse(localStorage.getItem("auth") || "{}");
const token = data?.state?.token;

export const socket = io(import.meta.env.VITE_SERVER_PORT, {
  transports: ["websocket"],
  auth: {
    token, // 🔥 MUHIM
  },
});

socket.on("connect", () => {
  // console.log("✅ Connected", socket.id);
});

socket.on("connect_error", (err) => {
  // console.error("❌ Connection error:", err.message);
});

socket.onAny((event, data) => {
  // console.log("📦 ANY EVENT:", event, data);
});
