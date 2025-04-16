import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { plantId, startDate, endDate, notes, checklistItems } = body

    if (!plantId || !startDate || !checklistItems) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Usar uma transação para garantir a integridade dos dados
    const result = await prisma.$transaction(async (tx) => {
      // Inserir o registro de manutenção
      const maintenance = await tx.maintenanceRecord.create({
        data: {
          plantId,
          userId,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          notes,
        },
      })

      // Inserir os itens de checklist completados
      for (const item of checklistItems) {
        await tx.completedChecklistItem.create({
          data: {
            maintenanceId: maintenance.id,
            checklistItemId: item.id,
            completed: item.completed,
            notes: item.notes,
            completedAt: item.completed ? new Date() : null,
          },
        })
      }

      // Atualizar a data da última manutenção da usina
      await tx.plant.update({
        where: { id: plantId },
        data: {
          lastMaintenanceDate: endDate ? new Date(endDate) : new Date(startDate),
          nextMaintenanceDate: null,
        },
      })

      // Definir a próxima usina na sequência para manutenção
      const currentPlant = await tx.plant.findUnique({
        where: { id: plantId },
        select: { maintenanceSequenceOrder: true },
      })

      if (currentPlant?.maintenanceSequenceOrder !== null) {
        const nextPlant = await tx.plant.findFirst({
          where: {
            userId,
            maintenanceSequenceOrder: {
              gt: currentPlant?.maintenanceSequenceOrder,
            },
          },
          orderBy: {
            maintenanceSequenceOrder: "asc", // ✅ corrigido
          },
        })

        if (nextPlant) {
          await tx.plant.update({
            where: { id: nextPlant.id },
            data: {
              nextMaintenanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 dias
            },
          })
        } else {
          // Voltar para a primeira
          const firstPlant = await tx.plant.findFirst({
            where: { userId },
            orderBy: {
              maintenanceSequenceOrder: "asc",
            },
          })

          if (firstPlant) {
            await tx.plant.update({
              where: { id: firstPlant.id },
              data: {
                nextMaintenanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              },
            })
          }
        }
      }

      return maintenance
    })

    return NextResponse.json({ id: result.id })
  } catch (error) {
    console.error("[MAINTENANCE_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
