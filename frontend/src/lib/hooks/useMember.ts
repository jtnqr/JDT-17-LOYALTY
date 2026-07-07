"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export interface MemberUser {
  id: string;
  name: string;
  email: string;
  phone: string;
  status: string;
}

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
        // Backend not running/no auth, auto-set mock credentials for easy slicing
        console.warn("Auth token missing. Seeding localStorage with mock user Budi Santoso.");
        const mockUser = {
          id: "550e8400-e29b-41d4-a716-446655440001",
          name: "Budi Santoso",
          email: "budi.santoso@example.com",
          phone: "081234567890",
          status: "ACTIVE",
        };
        localStorage.setItem("token", "mock-jwt-token-for-slicing");
        localStorage.setItem("role", "MEMBER");
        localStorage.setItem("user", JSON.stringify(mockUser));
        
        setMember(mockUser);
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
