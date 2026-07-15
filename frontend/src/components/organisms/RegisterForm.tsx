"use client";

import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormField } from "../molecules/FormField";
import { CheckboxField } from "../molecules/CheckboxField";
import { Button } from "../ui/button";
import { AlertCircle } from "lucide-react";
import apiClient from "@/lib/apiClient";

const registerSchema = z
  .object({
    name: z
      .string()
      .min(1, "Full Name is required")
      .min(2, "Full Name must be at least 2 characters"),
    email: z
      .string()
      .min(1, "Email Address is required")
      .email("Invalid email address format"),
    phone: z
      .string()
      .min(1, "Phone Number is required")
      .regex(/^[0-9]+$/, "Phone number must contain only numbers")
      .min(8, "Phone number must be at least 8 digits"),
    password: z.string().min(6, "Password must be at least 6 characters long"),
    confirmPassword: z.string().min(1, "Please confirm your password"),
    agree: z.boolean().refine((val) => val === true, {
      message: "You must agree to the Terms of Service and Privacy Policy",
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

type RegisterSchemaType = z.infer<typeof registerSchema>;

export function RegisterForm() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterSchemaType>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      password: "",
      confirmPassword: "",
      agree: false,
    },
  });

  const onSubmit = async (data: RegisterSchemaType) => {
    setIsLoading(true);
    setApiError(null);

    // Normalize phone number to start with '0' as per API spec example (e.g. 081234567890)
    let formattedPhone = data.phone.replace(/^\+/, "");
    if (formattedPhone.startsWith("62")) {
      formattedPhone = "0" + formattedPhone.slice(2);
    } else if (!formattedPhone.startsWith("0")) {
      formattedPhone = "0" + formattedPhone;
    }

    const payload = {
      name: data.name,
      email: data.email,
      phone: formattedPhone,
      password: data.password,
    };

    try {
      const response = await apiClient.post("/api/v1/auth/register", payload);

      const { token, role, user } = response.data;

      // Store credentials in localStorage
      localStorage.setItem("token", token);
      localStorage.setItem("role", role || "MEMBER");
      localStorage.setItem("user", JSON.stringify(user));

      // Auto-navigate to Member Home / Dashboard (Screen 2)
      router.push("/dashboard");
    } catch (error: any) {
      console.error("Registration failed:", error);

      // Show connection error if server is offline
      if (!error.response) {
        setApiError(
          "Cannot connect to registration service. Please check if the server is running."
        );
        return;
      }

      // Follow the Technical Spec error response schema
      if (error.response?.data?.message) {
        setApiError(error.response.data.message);
      } else if (error.response?.data?.error) {
        setApiError(error.response.data.error);
      } else {
        setApiError(
          "Registration failed. Please check your details and try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {apiError && (
        <div className="flex items-start gap-2.5 p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs font-medium animate-in fade-in slide-in-from-top-2 duration-200">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <span>{apiError}</span>
        </div>
      )}

      <FormField
        label="Full Name"
        type="text"
        placeholder="Budi Santoso"
        disabled={isLoading}
        error={errors.name?.message}
        {...register("name")}
      />

      <FormField
        label="Email"
        type="email"
        placeholder="you@email.com"
        disabled={isLoading}
        error={errors.email?.message}
        {...register("email")}
      />

      <FormField
        label="Phone Number"
        type="tel"
        placeholder="81234567890"
        startAdornment="+62"
        disabled={isLoading}
        error={errors.phone?.message}
        {...register("phone")}
      />

      <FormField
        label="Password"
        type="password"
        placeholder="********"
        disabled={isLoading}
        error={errors.password?.message}
        {...register("password")}
      />

      <FormField
        label="Confirm Password"
        type="password"
        placeholder="********"
        disabled={isLoading}
        error={errors.confirmPassword?.message}
        {...register("confirmPassword")}
      />

      <CheckboxField
        label={
          <span>
            I agree to the{" "}
            <Link
              href="/terms"
              className="text-brand-primary font-semibold hover:underline"
            >
              Terms of Service
            </Link>{" "}
            and{" "}
            <Link
              href="/privacy"
              className="text-brand-primary font-semibold hover:underline"
            >
              Privacy Policy
            </Link>
            .
          </span>
        }
        disabled={isLoading}
        error={errors.agree?.message}
        {...register("agree")}
      />

      <Button
        type="submit"
        disabled={isLoading}
        className="w-full bg-brand-primary hover:bg-brand-primary-dark text-white rounded-xl py-6 font-semibold transition-all shadow-md active:translate-y-px mt-3 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:pointer-events-none"
      >
        {isLoading ? (
          <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        ) : (
          <>Create Account</>
        )}
      </Button>
    </form>
  );
}
export default RegisterForm;
