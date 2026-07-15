"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { clearAuthCookies } from "@/lib/authCookies";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  status: string;
}

export function useAdmin() {
  const router = useRouter();
  
  const [admin, setAdmin] = useState<AdminUser | null>(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      const userString = localStorage.getItem("user");
      if (token && role === "ADMIN" && userString) {
        try {
          return JSON.parse(userString) as AdminUser;
        } catch {
          return null;
        }
      }
    }
    return null;
  });

  const [isLoaded, setIsLoaded] = useState(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      const userString = localStorage.getItem("user");
      return !!(token && role === "ADMIN" && userString);
    }
    return false;
  });

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      const userString = localStorage.getItem("user");

      if (!token || role !== "ADMIN" || !userString) {
        router.push("/login");
      } else {
        const parsedUser = JSON.parse(userString) as AdminUser;
        setAdmin(parsedUser);
      }
    } catch (error) {
      console.error("Failed to load authenticated admin:", error);
      router.push("/login");
    } finally {
      setIsLoaded(true);
    }
  }, [router]);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    localStorage.removeItem("user");
    clearAuthCookies();
    router.push("/login");
  };

  return {
    admin,
    adminId: admin?.id || "",
    isLoaded,
    isAuthenticated: !!admin,
    logout,
  };
}
