"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { MemberUser } from "@/types";
import { clearAuthCookies } from "@/lib/authCookies";


export function useMember() {
  const router = useRouter();
  const [member, setMember] = useState<MemberUser | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      let token = localStorage.getItem("token");
      let role = localStorage.getItem("role");
      let userString = localStorage.getItem("user");

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
