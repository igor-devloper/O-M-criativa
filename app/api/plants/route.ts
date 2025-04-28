import { prisma } from "@/lib/prisma"
import { auth, clerkClient } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { addDays } from "date-fns"

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const plants = await prisma.plant.findMany({
      orderBy: [
        { maintenanceSequenceOrder: { sort: "asc", nulls: "last" } },
        { name: "asc" },
      ],
    })

    return NextResponse.json(plants)
  } catch (error) {
    console.error("[PLANTS_GET]", error)
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
    const { name, address, latitude, longitude, maintenanceDate } = body

    if (!name || !address || latitude === undefined || longitude === undefined) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!user) {
      const clerkUser = await (await clerkClient()).users.getUser(userId)
      await prisma.user.create({
        data: {
          id: userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || "",
          name: `${clerkUser.firstName || ""} ${clerkUser.lastName || ""}`.trim() || "User",
        },
      })
    }

    const maxOrder = await prisma.plant.aggregate({
      _max: { maintenanceSequenceOrder: true },
    })

    const nextOrder = (maxOrder._max.maintenanceSequenceOrder || 0) + 1
    const isFirstPlant = nextOrder === 1

    const result = await prisma.$transaction(async (tx) => {
      let scheduledMaintenanceDate: Date

      if (isFirstPlant) {
        // Primeira usina: usa a data escolhida ou hoje
        scheduledMaintenanceDate = maintenanceDate ? new Date(maintenanceDate) : new Date()
      } else {
        // Buscar a última manutenção (mais recente) registrada
        const latestMaintenance = await tx.maintenanceRecord.findFirst({
          orderBy: { startDate: "desc" },
        })

        if (latestMaintenance?.startDate) {
          // Agenda 7 dias depois da última manutenção existente
          scheduledMaintenanceDate = addDays(new Date(latestMaintenance.startDate), 7)
        } else {
          // Se não tiver nenhuma manutenção ainda, usa hoje
          scheduledMaintenanceDate = new Date()
        }
      }

      const plant = await tx.plant.create({
        data: {
          name,
          address,
          latitude,
          longitude,
          userId,
          maintenanceSequenceOrder: nextOrder,
          nextMaintenanceDate: scheduledMaintenanceDate,
        },
      })

      await tx.maintenanceRecord.create({
        data: {
          plantId: plant.id,
          userId,
          startDate: scheduledMaintenanceDate,
          endDate: null,
          notes: isFirstPlant ? "Manutenção inicial agendada" : "Manutenção agendada automaticamente",
          isCompleted: false,
        },
      })

      return plant
    })

    return NextResponse.json({ id: result.id })
  } catch (error) {
    console.error("[PLANTS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
