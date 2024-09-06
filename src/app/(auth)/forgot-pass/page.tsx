import { useState, useTransition } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { resendVerificationEmail } from "../sendVerification";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { loginSchema, LoginValues } from "@/lib/validation";
import loginImage from "@/assets/login-image.jpg";
import Image from "next/image";
import Link from "next/link";
import LoadingButton from "@/components/LoadingButton";
import ForgotPassForm from "./forgotPassForm";

export default function Page() {
  return (
    <main className="flex h-screen flex-col items-center justify-center space-y-5 p-5">
      <div className="w-full text-center">
        <h1 className="text-6xl font-bold">Decibel Tribe</h1>
        <span className="text-3xl">Stay Human</span>
      </div>
      <div className="flex h-full max-h-[40rem] w-full max-w-[64rem] items-center justify-center overflow-hidden rounded-2xl bg-card shadow-2xl">
        <div className="w-full space-y-10 overflow-y-auto p-10 md:w-1/2">
          <div className="space-y-5">
            <h2 className="text-center text-xl font-semibold">
              Resend Verification Email
            </h2>
            <ForgotPassForm />

            <Link href="/signup" className="block text-center hover:underline">
              Don&apos;t have an account? Sign up
            </Link>
            <Link href="/login" className="block text-center hover:underline">
              Back to Login
            </Link>
          </div>
        </div>
        <Image
          src={loginImage}
          alt="Login Illustration"
          className="hidden w-1/2 object-cover md:block"
        />
      </div>
    </main>
  );
}
