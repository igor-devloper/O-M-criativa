import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

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
    const { name, address, latitude, longitude } = body

    if (!name || !address || latitude === undefined || longitude === undefined) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Verificar se o usuário existe, se não, criar
    const user = await prisma.user.findUnique({
      where: {
        id: userId,
      },
    })

    if (!user) {
      await prisma.user.create({
        data: {
          id: userId,
          email: "user@example.com", // Idealmente, você obteria esses dados do Clerk
          name: "User",
        },
      })
    }

    // Obter a maior ordem de sequência para adicionar a nova usina ao final
    const maxOrder = await prisma.plant.aggregate({
      where: {
        userId,
      },
      _max: {
        maintenanceSequenceOrder: true,
      },
    })

    const nextOrder = (maxOrder._max.maintenanceSequenceOrder || 0) + 1

    // Inserir a nova usina
    const plant = await prisma.plant.create({
      data: {
        name,
        address,
        latitude,
        longitude,
        userId,
        maintenanceSequenceOrder: nextOrder,
      },
    })

    return NextResponse.json({ id: plant.id })
  } catch (error) {
    console.error("[PLANTS_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
