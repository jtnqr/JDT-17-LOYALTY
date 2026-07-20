import React from "react";
import { BrandLogo } from "@/components/atoms/BrandLogo";
import { LoginForm } from "@/components/organisms/LoginForm";
import Link from "next/link";

export const metadata = {
  title: "Member Login | PISTOS",
  description:
    "Access your PISTOS member account to manage points and redeem rewards.",
};

export default function LoginPage() {
  return (
    <main className="min-h-screen bg-white md:bg-neutral-100 flex flex-col md:flex-row font-sans">
      {/* Desktop Brand Section - Visible on desktop, hidden on mobile */}
      <section className="hidden md:flex md:w-1/2 bg-linear-to-br from-brand-primary to-brand-primary-dark flex-col items-center justify-center p-12 text-white relative overflow-hidden">
        {/* Decorative background blur shapes */}
        <div className="absolute top-[-10%] right-[-10%] w-[300px] h-[300px] rounded-full bg-white/5 blur-2xl pointer-events-none" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[250px] h-[250px] rounded-full bg-white/5 blur-xl pointer-events-none" />

        <div className="max-w-md text-center space-y-6 z-10">
          <BrandLogo variant="light" showTagline={true} />
        </div>
      </section>

      {/* Form Section - Full width on mobile, split-view side on desktop */}
      <section className="flex-1 flex flex-col justify-between bg-white md:bg-neutral-100 md:items-center md:justify-center p-0 md:p-6">
        {/* Mobile Header (Gradient bg) - Hidden on desktop */}
        <div className="md:hidden bg-linear-to-br from-brand-primary to-brand-primary-dark pt-12 pb-14 px-6 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-[-20px] right-[-20px] w-[120px] h-[120px] rounded-full bg-white/5 blur-lg pointer-events-none" />
          <BrandLogo variant="light" showTagline={true} />
        </div>

        {/* Login Card: Flush and full width on mobile, floating card on desktop */}
        <div className="w-full md:max-w-[420px] bg-white rounded-t-[32px] md:rounded-[24px] -mt-6 md:mt-0 flex-1 md:flex-initial px-6 md:px-8 pt-8 md:py-8 pb-6 flex flex-col shadow-[0_-8px_30px_rgba(0,0,0,0.06)] md:shadow-[0_8px_30px_rgba(0,0,0,0.08)] md:border md:border-neutral-100 relative z-10">
          <div className="flex-1 flex flex-col">
            <header className="mb-6">
              <h1 className="text-xl md:text-2xl font-bold text-neutral-900 tracking-tight">
                Welcome back
              </h1>
              <p className="text-xs md:text-sm text-neutral-700 mt-1 leading-relaxed">
                Please enter your credentials to access your account.
              </p>
            </header>

            {/* Atomic Login Form */}
            <LoginForm />

            <div className="text-center text-sm text-neutral-700 font-medium mt-6">
              Don't have an account?{" "}
              <Link
                href="/register"
                className="text-brand-primary font-bold hover:text-brand-primary-dark transition-colors inline-block"
              >
                Create Account
              </Link>
            </div>

            <footer className="mt-auto pt-6">
              <p className="text-[11px] text-neutral-400 text-center font-medium">
                &copy; 2026 PISTOS Inc. &bull; All rights reserved.
              </p>
            </footer>
          </div>
        </div>
      </section>
    </main>
  );
}
