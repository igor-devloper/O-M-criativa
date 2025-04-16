import { Header } from "@/app/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/login")
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Total de Usinas</CardTitle>
              <CardDescription>Usinas cadastradas no sistema</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Próxima Manutenção</CardTitle>
              <CardDescription>Usina com manutenção programada</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">-</p>
              <p className="text-sm text-muted-foreground">Nenhuma manutenção agendada</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Manutenções Realizadas</CardTitle>
              <CardDescription>Total de manutenções concluídas</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Manutenções Pendentes</CardTitle>
              <CardDescription>Manutenções a serem realizadas</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">0</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              <Link href="/plants/new">
                <Card className="cursor-pointer hover:bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Adicionar Usina</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Cadastre uma nova usina no sistema</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/maintenance/new">
                <Card className="cursor-pointer hover:bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Registrar Manutenção</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Registre uma nova manutenção realizada</p>
                  </CardContent>
                </Card>
              </Link>
              <Link href="/plants/map">
                <Card className="cursor-pointer hover:bg-muted/50">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg">Ver Mapa de Usinas</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground">Visualize todas as usinas no mapa</p>
                  </CardContent>
                </Card>
              </Link>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
