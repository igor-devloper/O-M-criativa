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
      where: {
        userId,
      },
      orderBy: [{ maintenanceSequenceOrder: { sort: "asc", nulls: "last" } }, { name: "asc" }],
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

    // Verificar se o usuário existe, se não, criar
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

    // Obter a maior ordem de sequência
    const maxOrder = await prisma.plant.aggregate({
      where: { userId },
      _max: { maintenanceSequenceOrder: true },
    })

    const nextOrder = (maxOrder._max.maintenanceSequenceOrder || 0) + 1
    const isFirstPlant = nextOrder === 1

    // Usar uma transação para garantir a integridade dos dados
    const result = await prisma.$transaction(async (tx) => {
      // Criar usina
      const plant = await tx.plant.create({
        data: {
          name,
          address,
          latitude,
          longitude,
          userId,
          maintenanceSequenceOrder: nextOrder,
          nextMaintenanceDate: isFirstPlant && maintenanceDate ? new Date(maintenanceDate) : null,
        },
      })

      // Se for a primeira usina e tiver data de manutenção definida
      if (isFirstPlant && maintenanceDate) {
        // Criar manutenção inicial
        await tx.maintenanceRecord.create({
          data: {
            plantId: plant.id,
            userId,
            startDate: new Date(maintenanceDate),
            endDate: null,
            notes: "Manutenção inicial agendada",
          },
        })
      } else if (isFirstPlant) {
        // Criar manutenção inicial para hoje se não tiver data específica
        await tx.maintenanceRecord.create({
          data: {
            plantId: plant.id,
            userId,
            startDate: new Date(),
            endDate: null,
            notes: "Manutenção inicial automática",
          },
        })
      }

      // Se houver mais de uma usina, configurar as próximas manutenções
      if (!isFirstPlant) {
        const otherPlants = await tx.plant.findMany({
          where: {
            id: { not: plant.id },
          },
          orderBy: {
            maintenanceSequenceOrder: "asc",
          },
        })

        // Verificar se a primeira usina já tem manutenção agendada
        const firstPlant = otherPlants[0]
        if (firstPlant && firstPlant.nextMaintenanceDate) {
          const nextMaintenanceDate = addDays(new Date(firstPlant.nextMaintenanceDate), 7)

          // Definir a próxima manutenção da nova usina para uma semana depois da primeira
          await tx.plant.update({
            where: { id: plant.id },
            data: {
              nextMaintenanceDate: nextMaintenanceDate,
            },
          })

          // Criar um registro de manutenção para a nova usina
          await tx.maintenanceRecord.create({
            data: {
              plantId: plant.id,
              userId,
              startDate: nextMaintenanceDate,
              endDate: null,
              notes: "Manutenção agendada automaticamente",
            },
          })
        }
      }

      return plant
    })

    return NextResponse.json({ id: result.id })
  } catch (error) {
    console.error("[PLANTS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
