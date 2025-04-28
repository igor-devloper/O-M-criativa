import { Header } from "@/app/components/header"
import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { PlantDropdownMenu } from "./components/dropdown-planta"
import { AddPowerPlantDialog } from "./components/add-power-plant-dialog"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"

export default async function PlantsPage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/login")
  }

  // const plants = await prisma.plant.findMany({
  //   orderBy: { createdAt: "asc" },
  // })

  const maintenanceRecords = await prisma.maintenanceRecord.findMany({
    include: {
      plant: {
        select: {
          id: true,
          name: true,
          address: true,
          nextMaintenanceDate: true,
          latitude: true,
          longitude: true,
          status: true,
          lastMaintenanceDate: true,
          maintenanceSequenceOrder:true,
          createdAt: true,
          userId: true,
        },
      },
    },
    orderBy: {
      startDate: "asc",
    },
  });
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Usinas</h1>
          <AddPowerPlantDialog />
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {maintenanceRecords.map((plant) => (
            <Card key={plant.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle>{plant.plant.name}</CardTitle>
                  <PlantDropdownMenu plant={plant.plant} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">Endereço: {plant.plant.address}</p>
                <p className="text-sm text-muted-foreground mb-4">
                  Próxima manutenção:{" "}
                  {plant.startDate
                    ? format(new Date(plant.startDate), "PPP", {locale: ptBR,})
                    : "Não agendada"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  )
}
