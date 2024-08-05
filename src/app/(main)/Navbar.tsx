import SearchField from "@/components/SearchField";
import UserButton from "@/components/UserButton";
import Link from "next/link";

export default function Navbar() {
  return (
    <header className="sticky top-0 z-10 bg-card shadow-sm">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-5 px-5 py-3">
        <Link href="/" className="text-2xl text-primary">
          <span className="hidden font-bold lg:inline">Decibel Tribe </span>
          <span className="hidden pl-2 text-base font-bold lg:inline">
            {"Stay Human"}
          </span>
          <span className="hidden font-bold md:inline lg:hidden">
            Decibel Tribe
          </span>
          <span className="inline font-bold md:hidden">Tribe</span>
        </Link>
        <SearchField />
        <UserButton className="ml-auto sm:ms-auto" />
      </div>
    </header>
  );
}
