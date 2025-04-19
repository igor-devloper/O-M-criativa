import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function GET(request: Request, { params }: { params: Promise<{ id: string }>  }) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }
    const { id } = await params
    const plantId = Number.parseInt(id, 10)

    if (isNaN(plantId)) {
      return new NextResponse("Invalid plant ID", { status: 400 })
    }

    // Verificar se a usina existe (sem filtro de userId)
    const plant = await prisma.plant.findUnique({
      where: {
        id: plantId,
      },
    })

    if (!plant) {
      return new NextResponse("Plant not found", { status: 404 })
    }

    // Buscar a próxima manutenção agendada para a usina (sem filtro de userId)
    const maintenance = await prisma.maintenanceRecord.findFirst({
      where: {
        plantId,
        endDate: null,
        startDate: {
          gte: new Date(),
        },
      },
      orderBy: {
        startDate: "asc",
      },
    })

    if (!maintenance) {
      return new NextResponse("No scheduled maintenance found", { status: 404 })
    }

    return NextResponse.json({
      id: maintenance.id,
      plantId: maintenance.plantId,
      startDate: maintenance.startDate,
      endDate: maintenance.endDate,
      notes: maintenance.notes,
    })
  } catch (error) {
    console.error("[MAINTENANCE_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
