import axios from "axios";
import type { AxiosError } from "axios";
import { clearAuthCookies } from "./authCookies";

const REQUEST_TIMEOUT = Number(process.env.NEXT_PUBLIC_API_TIMEOUT) || 15000;

const apiClient = axios.create({
  baseURL: "",
  timeout: REQUEST_TIMEOUT,
});

apiClient.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = "Bearer " + token;
    }
  }
  return config;
});

function isNetworkOrTimeoutError(error: AxiosError): boolean {
  return (
    !error.response &&
    (error.code === "ERR_NETWORK" ||
      error.code === "ECONNABORTED" ||
      error.message === "Network Error" ||
      error.message.includes("timeout"))
  );
}

function dispatchGlobalError(detail: { type: string; message: string }) {
  if (typeof window !== "undefined") {
    window.dispatchEvent(
      new CustomEvent("api:error", { detail })
    );
  }
}

apiClient.interceptors.response.use(
  (response) => response,
  (error: AxiosError) => {
    if (typeof window === "undefined") return Promise.reject(error);

    const url = error.config?.url ?? "";
    const isAuthEndpoint = url.includes("/api/v1/auth/");

    if (error.response?.status === 401 && !isAuthEndpoint) {
      localStorage.removeItem("token");
      localStorage.removeItem("role");
      localStorage.removeItem("user");
      clearAuthCookies();
      if (window.location.pathname !== "/login") window.location.href = "/login";
      return Promise.reject(error);
    }

    if (isNetworkOrTimeoutError(error)) {
      console.error(
        "[API Client] Backend unreachable or request timed out:",
        error.config?.url,
        error.message
      );
      dispatchGlobalError({
        type: "CONNECTION_ERROR",
        message:
          "Unable to reach the server. Please check your connection and try again.",
      });
    }

    if (error.response && error.response.status >= 400 && error.response.status < 500 && !isAuthEndpoint) {
      const code = (error.response.data as any)?.code || "CLIENT_ERROR";
      const message = (error.response.data as any)?.message || (error.response.data as any)?.error || "Request failed. Please try again.";
      dispatchGlobalError({
        type: code,
        message: message,
      });
    }

    if (error.response && error.response.status >= 500) {
      console.error(
        `[API Client] Server error ${error.response.status} on`,
        error.config?.url
      );
      dispatchGlobalError({
        type: "SERVER_ERROR",
        message: `Server encountered an error (${error.response.status}). Please try again later.`,
      });
    }

    return Promise.reject(error);
  }
);

export default apiClient;
