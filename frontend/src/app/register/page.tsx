import React from "react";
import { BrandLogo } from "@/components/atoms/BrandLogo";
import { RegisterForm } from "@/components/organisms/RegisterForm";
import Link from "next/link";

export const metadata = {
  title: "Member Registration | PISTOS",
  description:
    "Join PISTOS today to start earning points and unlocking rewards.",
};

export default function RegisterPage() {
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
      <section className="flex-1 flex flex-col justify-between bg-gray-30/80 md:bg-neutral-100 md:items-center md:justify-center p-0 md:p-6 overflow-y-auto">
        {/* Mobile Header (Compact logo) - Hidden on desktop */}
        <div className="md:hidden pt-8 pb-4 px-6 flex flex-col items-center justify-center">
          <BrandLogo variant="dark" showTagline={false} />
          <p className="text-[11px] text-neutral-400 font-bold tracking-wider uppercase mt-1">
            Earn more, every bite.
          </p>
        </div>

        {/* Register Card: Flush and full width on mobile, floating card on desktop */}
        <div className="w-full md:max-w-[420px] bg-white rounded-t-[32px] md:rounded-[24px] px-6 md:px-8 pt-6 md:py-8 pb-6 flex flex-col justify-between md:shadow-[0_8px_30px_rgba(0,0,0,0.08)] md:border md:border-neutral-100 relative z-10">
          <div>
            <header className="mb-5">
              <h1 className="text-xl md:text-2xl font-bold text-neutral-900 tracking-tight">
                Create Account
              </h1>
              <p className="text-xs md:text-sm text-neutral-700 mt-1">
                Join us to start earning points.
              </p>
            </header>

            {/* Atomic Register Form */}
            <RegisterForm />
          </div>

          <footer className="mt-6 pt-2">
            <div className="text-center text-sm text-neutral-700 font-medium">
              Already have an account?{" "}
              <Link
                href="/login"
                className="text-brand-primary font-bold hover:text-brand-primary-dark transition-colors inline-block"
              >
                Sign In
              </Link>
            </div>
          </footer>
        </div>
      </section>
    </main>
  );
}
