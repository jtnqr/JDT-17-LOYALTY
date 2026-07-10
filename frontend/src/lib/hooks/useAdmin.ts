"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  status: string;
}

export function useAdmin() {
  const router = useRouter();
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      let token = localStorage.getItem("token");
      let role = localStorage.getItem("role");
      let userString = localStorage.getItem("user");

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
