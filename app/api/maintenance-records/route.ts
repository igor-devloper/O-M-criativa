import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const maintenanceRecords = await prisma.maintenanceRecord.findMany({
      where: {
        userId,
      },
      include: {
        plant: {
          select: {
            id: true,
            name: true,
            address: true,
          },
        },
        completedItems: {
          include: {
            checklistItem: true,
          },
        },
      },
      orderBy: {
        startDate: "asc",
      },
    })

    return NextResponse.json(maintenanceRecords)
  } catch (error) {
    console.error("[MAINTENANCE_RECORDS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { plantId, startDate, endDate, notes } = body

    if (!plantId || !startDate) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Verificar se a usina pertence ao usuário
    const plant = await prisma.plant.findFirst({
      where: {
        id: plantId,
        userId,
      },
    })

    if (!plant) {
      return new NextResponse("Plant not found or not authorized", { status: 404 })
    }

    // Criar o registro de manutenção
    const maintenanceRecord = await prisma.maintenanceRecord.create({
      data: {
        startDate: new Date(startDate),
        endDate: endDate ? new Date(endDate) : null,
        notes,
        plant: {
          connect: {
            id: plantId,
          },
        },
        user: {
          connect: {
            id: userId,
          },
        },
      },
    })

    // Atualizar a data da última manutenção na usina
    await prisma.plant.update({
      where: {
        id: plantId,
      },
      data: {
        lastMaintenanceDate: new Date(startDate),
        // Se a data de término for fornecida, definir a próxima manutenção para 30 dias após
        nextMaintenanceDate: endDate ? new Date(new Date(endDate).setDate(new Date(endDate).getDate() + 30)) : null,
      },
    })

    return NextResponse.json({ id: maintenanceRecord.id })
  } catch (error) {
    console.error("[MAINTENANCE_RECORDS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
