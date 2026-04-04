import { io } from "socket.io-client";

export const createSocket = () => {
  const data = JSON.parse(localStorage.getItem("auth") || "{}");
  const token = data?.state?.token;

  return io(import.meta.env.VITE_SOCKET_IO, {
    transports: ["websocket"],
    auth: {
      token,
    },
  });
};
