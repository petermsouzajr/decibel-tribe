"use client";
import SearchField from "@/components/SearchField";
import UserButton from "@/components/UserButton";
import useScrollDirection from "@/hooks/useScrollDirection";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function Navbar() {
  const scrollDirection = useScrollDirection();

  return (
    <header
      className={`sticky top-0 z-10 bg-card shadow-sm transition-transform ${
        scrollDirection === "down" ? "-translate-y-full" : "translate-y-0"
      } scroll-hide`}
    >
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-5 py-3">
        <Link href="/" className="shrink-0 text-2xl font-bold text-primary">
          <span className="hidden md:inline">Decibel Tribe</span>
          <span className="hidden pl-2 text-base font-bold lg:inline">
            {"Stay Human"}
          </span>
          <span className="hidden sm:inline md:hidden">Decibel Tribe</span>
          <span className="inline sm:hidden">Tribe</span>
        </Link>

        <SearchField />

        <UserButton className="ml-auto sm:ms-auto" />
      </div>
    </header>
  );
}
