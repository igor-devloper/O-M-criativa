import { Header } from "@/app/components/header"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { DashboardActions } from "./components/dashboard-actions"

export default async function DashboardPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/login")
  }

  // Fetch data for dashboard
  const totalPlants = await prisma.plant.count()

  // Buscar a próxima planta com manutenção agendada
  const nextPlantMaintenance = await prisma.plant.findFirst({
    where: {
      nextMaintenanceDate: {
        not: null,
        gt: new Date(),
      },
    },
    orderBy: {
      nextMaintenanceDate: "asc",
    },
  })

  // Find the next scheduled maintenance (with a future start date)
  const nextMaintenance = await prisma.maintenanceRecord.findFirst({
    where: {
      startDate: {
        gt: new Date(), // Greater than today
      },
    },
    orderBy: {
      startDate: "asc",
    },
    include: {
      plant: {
        select: {
          name: true,
        },
      },
    },
  })

  // Count completed maintenances (those with an end date in the past)
  const completedMaintenances = await prisma.maintenanceRecord.count({
    where: {
      endDate: {
        lte: new Date(), // Less than or equal to today
        not: null,
      },
    },
  })

  // Count pending maintenances (those with a future start date)
  const pendingMaintenances = await prisma.maintenanceRecord.count({
    where: {
      startDate: {
        gt: new Date(), // Greater than today
      },
    },
  })

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
              <p className="text-3xl font-bold">{totalPlants}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Próxima Manutenção</CardTitle>
              <CardDescription>Usina com manutenção programada</CardDescription>
            </CardHeader>
            <CardContent>
              {nextMaintenance ? (
                <>
                  <p className="text-xl font-bold">{nextMaintenance.plant.name}</p>
                  <p className="text-sm text-muted-foreground">
                    {format(new Date(nextMaintenance.startDate), "dd/MM/yyyy", { locale: ptBR })}
                  </p>
                </>
              ) : (
                <>
                  <p className="text-3xl font-bold">-</p>
                  <p className="text-sm text-muted-foreground">Nenhuma manutenção agendada</p>
                </>
              )}
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Manutenções Realizadas</CardTitle>
              <CardDescription>Total de manutenções concluídas</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{completedMaintenances}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Manutenções Pendentes</CardTitle>
              <CardDescription>Manutenções a serem realizadas</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{pendingMaintenances}</p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-6">
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent>
              <DashboardActions />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  )
}
