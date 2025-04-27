import { Button } from "@/app/components/ui/button"
import { Header } from "@/app/components/header"
import Link from "next/link"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"

export default async function Home() {
    const { userId } = await auth()
  
    if (!userId) {
      redirect("/login")
    }
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <section className="w-full py-12 md:py-24 lg:py-32 xl:py-48">
          <div className="container px-4 md:px-6">
            <div className="flex flex-col items-center space-y-4 text-center">
              <div className="space-y-2">
                <h1 className="text-3xl font-bold tracking-tighter sm:text-4xl md:text-5xl lg:text-6xl/none">
                  Sistema de Manutenção Preventiva de Usinas
                </h1>
                <p className="mx-auto max-w-[700px] text-gray-500 md:text-xl dark:text-gray-400">
                  Gerencie suas usinas e manutenções preventivas de forma eficiente e organizada.
                </p>
              </div>
              <div className="space-x-4">
                <Link href="/dashboard">
                  <Button>Acessar Dashboard</Button>
                </Link>
                <Link href="/plants">
                  <Button variant="outline">Ver Usinas</Button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}
