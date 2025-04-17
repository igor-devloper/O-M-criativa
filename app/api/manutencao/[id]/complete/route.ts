import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { addDays, addMonths } from "date-fns"

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
      include: {
        plant: true,
      },
    })

    if (!maintenance) {
      return new NextResponse("Maintenance not found", { status: 404 })
    }

    // Usar uma transação para garantir a integridade dos dados
    const result = await prisma.$transaction(async (tx) => {
      // Marcar a manutenção como concluída
      const updatedMaintenance = await tx.maintenanceRecord.update({
        where: { id: maintenanceId },
        data: {
          endDate: new Date(),
          isCompleted: true,
        },
      })

      // Atualizar a data da última manutenção da usina
      await tx.plant.update({
        where: { id: maintenance.plantId },
        data: {
          lastMaintenanceDate: new Date(),
          nextMaintenanceDate: null,
        },
      })

      // Verificar se esta é a última usina na sequência
      const currentPlant = await tx.plant.findUnique({
        where: { id: maintenance.plantId },
        select: { maintenanceSequenceOrder: true },
      })

      if (currentPlant?.maintenanceSequenceOrder !== null) {
        // Verificar se há uma próxima usina na sequência
        const nextPlant = await tx.plant.findFirst({
          where: {
            userId,
            maintenanceSequenceOrder: {
              gt: currentPlant?.maintenanceSequenceOrder,
            },
          },
          orderBy: {
            maintenanceSequenceOrder: "asc",
          },
        })

        if (nextPlant) {
          // Se houver próxima usina, agendar sua manutenção para uma semana depois
          const nextMaintenanceDate = addDays(new Date(), 7)

          // Atualizar a data da próxima manutenção da usina
          await tx.plant.update({
            where: { id: nextPlant.id },
            data: {
              nextMaintenanceDate: nextMaintenanceDate,
            },
          })

          // Criar um novo registro de manutenção para a próxima usina
          await tx.maintenanceRecord.create({
            data: {
              plantId: nextPlant.id,
              userId,
              startDate: nextMaintenanceDate,
              endDate: null,
              notes: "Manutenção agendada automaticamente",
            },
          })
        } else {
          // Se não houver próxima usina (esta é a última), voltar para a primeira
          // e agendar sua manutenção para um mês depois
          const firstPlant = await tx.plant.findFirst({
            where: { userId },
            orderBy: {
              maintenanceSequenceOrder: "asc",
            },
          })

          if (firstPlant) {
            const nextMaintenanceDate = addMonths(new Date(), 1)

            // Atualizar a data da próxima manutenção da primeira usina
            await tx.plant.update({
              where: { id: firstPlant.id },
              data: {
                nextMaintenanceDate: nextMaintenanceDate,
              },
            })

            // Criar um novo registro de manutenção para a primeira usina
            await tx.maintenanceRecord.create({
              data: {
                plantId: firstPlant.id,
                userId,
                startDate: nextMaintenanceDate,
                endDate: null,
                notes: "Manutenção agendada automaticamente (ciclo reiniciado)",
              },
            })
          }
        }
      }

      return updatedMaintenance
    })

    return NextResponse.json({ id: result.id })
  } catch (error) {
    console.error("[MAINTENANCE_COMPLETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
