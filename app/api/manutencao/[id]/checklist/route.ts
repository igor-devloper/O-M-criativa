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

    // Obter os itens do checklist do corpo da requisição
    const body = await req.json()
    const { items } = body

    if (!items || !Array.isArray(items)) {
      return new NextResponse("Invalid checklist items", { status: 400 })
    }

    // Atualizar os itens do checklist
    const results = await Promise.all(
      items.map(async (item) => {
        // Verificar se o item já existe
        const existingItem = await prisma.completedChecklistItem.findFirst({
          where: {
            maintenanceId,
            checklistItemId: item.id,
          },
        })

        if (existingItem) {
          // Atualizar o item existente
          return prisma.completedChecklistItem.update({
            where: { id: existingItem.id },
            data: {
              completed: item.completed,
              notes: item.notes,
              completedAt: item.completed ? item.completedAt || new Date() : null,
            },
          })
        } else {
          // Criar um novo item
          return prisma.completedChecklistItem.create({
            data: {
              maintenanceId,
              checklistItemId: item.id,
              completed: item.completed,
              notes: item.notes,
              completedAt: item.completed ? new Date() : null,
            },
          })
        }
      }),
    )

    return NextResponse.json({ success: true, count: results.length })
  } catch (error) {
    console.error("[CHECKLIST_UPDATE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
