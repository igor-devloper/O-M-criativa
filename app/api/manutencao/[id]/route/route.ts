import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

interface RouteParams {
  params: {
    id: string
  }
}

export async function POST(req: Request, { params }: RouteParams) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const maintenanceId = Number.parseInt(params.id)

    if (isNaN(maintenanceId)) {
      return new NextResponse("Invalid maintenance ID", { status: 400 })
    }

    // Verificar se a manutenção existe e pertence ao usuário
    const maintenance = await prisma.maintenanceRecord.findUnique({
      where: {
        id: maintenanceId,
        userId,
      },
    })

    if (!maintenance) {
      return new NextResponse("Maintenance not found", { status: 404 })
    }

    // Obter os dados da rota do corpo da requisição
    const body = await req.json()
    const { route, arrivalTime } = body

    if (!route || !arrivalTime) {
      return new NextResponse("Missing route information", { status: 400 })
    }

    // Atualizar as informações de rota da manutenção
    const updatedMaintenance = await prisma.maintenanceRecord.update({
      where: { id: maintenanceId },
      data: {
        route,
        arrivalTime: new Date(arrivalTime),
      },
    })

    return NextResponse.json({ id: updatedMaintenance.id })
  } catch (error) {
    console.error("[ROUTE_UPDATE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
