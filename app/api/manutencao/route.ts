import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const maintenance = await prisma.maintenanceRecord.findMany({
      where: {
        userId,
      },
      include: {
        plant: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    })

    return NextResponse.json(maintenance)
  } catch (error) {
    console.error("[MAINTENANCE_GET]", error)
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
    const { plantId, startDate, endDate, notes, checklistItems } = body

    if (!plantId || !startDate || !checklistItems) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Usar uma transação para garantir a integridade dos dados
    const result = await prisma.$transaction(async (tx: { maintenanceRecord: { create: (arg0: { data: { plantId: any; userId: any; startDate: Date; endDate: Date | null; notes: any } }) => any }; completedChecklistItem: { create: (arg0: { data: { maintenanceId: any; checklistItemId: any; completed: any; notes: any; completedAt: Date | null } }) => any }; plant: { update: (arg0: { where: { id: any } | { id: any } | { id: any }; data: { lastMaintenanceDate: Date; nextMaintenanceDate: null } | { nextMaintenanceDate: Date } | { nextMaintenanceDate: Date } }) => any; findUnique: (arg0: { where: { id: any }; select: { maintenanceSequenceOrder: boolean } }) => any; findFirst: (arg0: { where: { userId: any; maintenanceSequenceOrder: { gt: any } } | { userId: any }; orderBy: { maintenanceSequenceOrder: string } | { maintenanceSequenceOrder: string } }) => any } }) => {
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
        where: {
          id: plantId,
        },
        data: {
          lastMaintenanceDate: endDate ? new Date(endDate) : new Date(startDate),
          nextMaintenanceDate: null,
        },
      })

      // Definir a próxima usina na sequência para manutenção
      const currentPlant = await tx.plant.findUnique({
        where: {
          id: plantId,
        },
        select: {
          maintenanceSequenceOrder: true,
        },
      })

      if (currentPlant && currentPlant.maintenanceSequenceOrder) {
        // Encontrar a próxima usina na sequência
        const nextPlant = await tx.plant.findFirst({
          where: {
            userId,
            maintenanceSequenceOrder: {
              gt: currentPlant.maintenanceSequenceOrder,
            },
          },
          orderBy: {
            maintenanceSequenceOrder: "asc",
          },
        })

        if (nextPlant) {
          // Atualizar a próxima usina
          await tx.plant.update({
            where: {
              id: nextPlant.id,
            },
            data: {
              nextMaintenanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 dias
            },
          })
        } else {
          // Se não houver próxima usina, voltar para a primeira
          const firstPlant = await tx.plant.findFirst({
            where: {
              userId,
            },
            orderBy: {
              maintenanceSequenceOrder: "asc",
            },
          })

          if (firstPlant) {
            await tx.plant.update({
              where: {
                id: firstPlant.id,
              },
              data: {
                nextMaintenanceDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // +30 dias
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
