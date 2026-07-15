"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormField } from "../molecules/FormField";
import { Button } from "../ui/button";
import { LogIn, AlertCircle } from "lucide-react";
import apiClient from "@/lib/apiClient";
import { setAuthCookies } from "@/lib/authCookies";

const loginSchema = z.object({
  email: z
    .string()
    .min(1, "Email Address is required")
    .email("Invalid email address format"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

type LoginSchemaType = z.infer<typeof loginSchema>;

export function LoginForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginSchemaType>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = async (data: LoginSchemaType) => {
    setIsLoading(true);
    setApiError(null);

    try {
      // In production, the URL is relative or uses an environment variable
      const response = await apiClient.post("/api/v1/auth/login", data);

      const { token, role, user } = response.data;

      // Store credentials in localStorage (per AGENTS.md guidelines)
      localStorage.setItem("token", token);
      localStorage.setItem("role", role);
      localStorage.setItem("user", JSON.stringify(user));
      setAuthCookies(token, role);

      // Redirect depending on role
      if (role === "ADMIN") {
        router.push("/admin");
      } else {
        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error("Login failed:", error);

      // Show connection error if server is offline
      if (!error.response) {
        setApiError("Cannot connect to authentication service. Please check if the server is running.");
        return;
      }

      // Follow the Technical Spec error response schema
      if (error.response?.data?.message) {
        setApiError(error.response.data.message);
      } else if (error.response?.data?.error) {
        setApiError(error.response.data.error);
      } else {
        setApiError("Invalid email or password. Please try again.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {apiError && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{apiError}</span>
        </div>
      )}

      <FormField
        label="Email Address"
        type="email"
        placeholder="you@email.com"
        disabled={isLoading}
        error={errors.email?.message}
        {...register("email")}
      />

      <div className="space-y-2">
        <FormField
          label="Password"
          type="password"
          placeholder="********"
          disabled={isLoading}
          error={errors.password?.message}
          {...register("password")}
        />

        {/* not implemented now */}
        {/* <div className="flex justify-end">
          <Link
            href="/"
            className="text-xs font-semibold text-brand-primary hover:text-brand-primary-dark transition-colors"
          >
            Forgot Password?
          </Link>
        </div> */}
      </div>

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl py-6 font-semibold transition-all shadow-md active:translate-y-px mt-2 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>
            Sign In
            <LogIn className="w-4 h-4" />
          </>
        )}
      </Button>
    </form>
  );
}
export default LoginForm;
