import Link from "next/link"
import { UserButton } from "@clerk/nextjs"
import { ModeToggle } from "./mode-toggle"

export function Header() {
  return (
    <header className="border-b">
      <div className="container flex h-16 items-center justify-between px-4">
        <Link href="/" className="flex items-center gap-2 font-semibold">
          <span className="text-xl">Sistema de Manutenção Preventiva</span>
        </Link>
        <div className="flex items-center gap-4">
          <nav className="hidden md:flex gap-6">
            <Link href="/dashboard" className="text-sm font-medium transition-colors hover:text-primary">
              Dashboard
            </Link>
            <Link href="/plants" className="text-sm font-medium transition-colors hover:text-primary">
              Usinas
            </Link>
            <Link href="/manutencao" className="text-sm font-medium transition-colors hover:text-primary">
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
  )
}
