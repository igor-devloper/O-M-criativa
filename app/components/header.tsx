import Link from "next/link";
import { UserButton } from "@clerk/nextjs";
import { ModeToggle } from "./mode-toggle";
import Image from "next/image";

export function Header() {
  return (
    <header className="border-b">
      <div className="container flex h-20 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold w-auto h-auto bg-white mx-5 p-2 rounded">
          <img
            src="/logo.svg"
            alt="Google Maps"
            className="w-36 h-full object-contain"
          />
        </Link>
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex gap-6">
            <Link
              href="/dashboard"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Dashboard
            </Link>
            <Link
              href="/plants"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Usinas
            </Link>
            <Link
              href="/manutencao"
              className="text-sm font-medium transition-colors hover:text-primary"
            >
              Manutenções
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <ModeToggle />
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </div>
    </header>
  );
}
