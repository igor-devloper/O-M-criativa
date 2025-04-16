import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function GET(req: Request, { params }: { params: { plantId: string } }) {
  try {
    const { userId } =  await auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const plant = await prisma.plant.findUnique({
      where: {
        id: Number.parseInt(params.plantId),
        userId,
      },
    })

    if (!plant) {
      return new NextResponse("Plant not found", { status: 404 })
    }

    return NextResponse.json(plant)
  } catch (error) {
    console.error("[PLANT_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PATCH(req: Request, { params }: { params: { plantId: string } }) {
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

    const plant = await prisma.plant.findUnique({
      where: {
        id: Number.parseInt(params.plantId),
        userId,
      },
    })

    if (!plant) {
      return new NextResponse("Plant not found", { status: 404 })
    }

    await prisma.plant.update({
      where: {
        id: Number.parseInt(params.plantId),
      },
      data: {
        name,
        address,
        latitude,
        longitude,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PLANT_PATCH]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(req: Request, { params }: { params: { plantId: string } }) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const plant = await prisma.plant.findUnique({
      where: {
        id: Number.parseInt(params.plantId),
        userId,
      },
    })

    if (!plant) {
      return new NextResponse("Plant not found", { status: 404 })
    }

    // Remover a usina
    await prisma.plant.delete({
      where: {
        id: Number.parseInt(params.plantId),
      },
    })

    // Reordenar as usinas restantes
    const plants = await prisma.plant.findMany({
      where: {
        userId,
      },
      orderBy: {
        maintenanceSequenceOrder: "asc",
      },
    })

    // Atualizar a ordem de sequência
    for (let i = 0; i < plants.length; i++) {
      await prisma.plant.update({
        where: {
          id: plants[i].id,
        },
        data: {
          maintenanceSequenceOrder: i + 1,
        },
      })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("[PLANT_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
