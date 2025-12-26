import loginImage from "@/assets/login-image.jpg";
import { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import GoogleSignInButton from "./google/GoogleSignInButton";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Login",
};

export default function Page() {
  return (
    <main className="flex h-screen flex-col items-center justify-center space-y-5 p-5">
      <div className="w-full text-center">
        <h1 className="text-6xl font-bold">Decibel Tribe</h1>
        <span className="text-3xl">Stay Human</span>
      </div>
      <div className="flex h-full max-h-[40rem] w-full max-w-[64rem] items-center justify-center overflow-hidden rounded-2xl bg-card shadow-2xl">
        <div className="w-full space-y-10 overflow-y-auto p-10 md:w-1/2">
          
          <p className="max-w-ms font-bold text-center text-md ">
          Connect with musicians. Find gigs, new music, live events, and love!
                Sign up to get started today.
              </p>
          <div className="space-y-5">
            <div className="flex justify-center">
            <h1 className="text-center text-xl font-bold">
            Login with Google
          </h1>
            </div>
            <GoogleSignInButton />
            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-muted" />
              <span>OR</span>
              <div className="h-px flex-1 bg-muted" />
            </div>
            <LoginForm />
            <Link href="/signup" className="block text-center hover:underline">
              Don&apos;t have an account? Sign up
            </Link>
            <Link
              href="/forgot-pass"
              className="block text-center hover:underline"
            >
              Forgot Password?
            </Link>
          </div>
        </div>
        <Image
          src={loginImage}
          alt=""
          className="hidden w-1/2 object-cover md:block"
          width={1024}
          height={1792}
          priority
        />
      </div>
    </main>
  );
}
