import axios from "axios";
import Cookies from "js-cookie";
import { useAuthStore } from "../store/useAuthStore";
import createAuthRefreshInterceptor from "axios-auth-refresh";
import { getDeviceId } from "../utils/device-id";

export const instance = axios.create({
  baseURL: import.meta.env.VITE_BASE_URL,
});

instance.interceptors.request.use(async (config) => {
  const accessToken =
    Cookies.get("accessToken") ||
    JSON.parse(localStorage.getItem("auth") || "{}")?.state?.token;

  // auth token
  if (accessToken && config.url !== "/auth/refresh") {
    config.headers["Authorization"] = `Bearer ${accessToken}`;
  }

  // device id (HAR DOIM yuboramiz)
  config.headers["X-Device-Id"] = getDeviceId();

  return config;
});

const refreshAuthLogic = async (failedRequest) => {
  const { setToken } = useAuthStore.getState();
  try {
    const response = await instance.post("/auth/refresh", null, {
      withCredentials: true,
    });

    const newAccessToken = response.data?.data?.access_token;
    Cookies.set("accessToken", newAccessToken);
    setToken(newAccessToken);

    failedRequest.response.config.headers["Authorization"] =
      `Bearer ${newAccessToken}`;

    return Promise.resolve();
  } catch (err) {
    Cookies.remove("accessToken");
    localStorage.removeItem("auth");
    window.location.href = "/";
    return Promise.reject(err);
  }
};

createAuthRefreshInterceptor(instance, refreshAuthLogic, {
  statusCodes: [401],
});
