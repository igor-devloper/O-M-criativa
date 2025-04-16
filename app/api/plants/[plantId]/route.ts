import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"

export async function GET(req: NextRequest, { params }: { params: { plantId: string } }) {
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
