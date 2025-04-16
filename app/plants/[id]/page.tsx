// app/plants/[id]/page.tsx

import { Header } from "@/app/components/header"
import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { notFound } from "next/navigation"

interface PlantDetailsPageProps {
  params: {
    id: string
  }
}

export default async function PlantDetailsPage({ params }: PlantDetailsPageProps) {
  const { userId } = await auth()

  if (!userId) {
    notFound()
  }

  const plant = await prisma.plant.findFirst({
    where: {
      id: parseInt(params.id),
      userId,
    },
  })

  if (!plant) {
    return notFound()
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-6 max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">{plant.name}</h1>

        <div className="space-y-2 text-muted-foreground">
          <p><strong>Endereço:</strong> {plant.address}</p>
          <p><strong>Status:</strong> {plant.status}</p>
          <p><strong>Latitude:</strong> {plant.latitude.toString()}</p>
          <p><strong>Longitude:</strong> {plant.longitude.toString()}</p>
          <p>
            <strong>Última manutenção:</strong>{" "}
            {plant.lastMaintenanceDate
              ? new Date(plant.lastMaintenanceDate).toLocaleDateString()
              : "Não registrada"}
          </p>
          <p>
            <strong>Próxima manutenção:</strong>{" "}
            {plant.nextMaintenanceDate
              ? new Date(plant.nextMaintenanceDate).toLocaleDateString()
              : "Não agendada"}
          </p>
        </div>
      </main>
    </div>
  )
}
