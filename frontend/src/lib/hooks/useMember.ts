"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MemberUser } from "@/types";
import { clearAuthCookies } from "@/lib/authCookies";


export function useMember() {
  const router = useRouter();
  
  const [member, setMember] = useState<MemberUser | null>(() => {
    if (typeof window !== "undefined") {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      const userString = localStorage.getItem("user");
      if (token && role === "MEMBER" && userString) {
        try {
          return JSON.parse(userString) as MemberUser;
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
      return !!(token && role === "MEMBER" && userString);
    }
    return false;
  });

  useEffect(() => {
    try {
      const token = localStorage.getItem("token");
      const role = localStorage.getItem("role");
      const userString = localStorage.getItem("user");

      if (!token || role !== "MEMBER" || !userString) {
        router.push("/login");
      } else {
        const parsedUser = JSON.parse(userString) as MemberUser;
        setMember(parsedUser);
      }
    } catch (error) {
      console.error("Failed to load authenticated member:", error);
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
    member,
    memberId: member?.id || "",
    isLoaded,
    isAuthenticated: !!member,
    logout,
  };
}
