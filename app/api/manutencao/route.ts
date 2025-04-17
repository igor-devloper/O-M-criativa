import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"
import { addDays, addMonths } from "date-fns"

export async function POST(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { plantId, startDate, endDate, notes, checklistItems, isFirstPlant } = body

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
          lastMaintenanceDate: new Date(),
          nextMaintenanceDate: null,
        },
      })

      // Se for a primeira usina com manutenção, configurar as próximas
      if (isFirstPlant) {
        // Obter todas as usinas do usuário, exceto a atual
        const otherPlants = await tx.plant.findMany({
          where: {
            userId,
            id: { not: plantId },
          },
          orderBy: {
            maintenanceSequenceOrder: "asc",
          },
        })

        // Configurar a próxima manutenção para cada usina, uma semana após a anterior
        let nextDate = addDays(new Date(startDate), 7)

        for (const plant of otherPlants) {
          await tx.plant.update({
            where: { id: plant.id },
            data: {
              nextMaintenanceDate: nextDate,
            },
          })

          // Criar um registro de manutenção para cada usina
          await tx.maintenanceRecord.create({
            data: {
              plantId: plant.id,
              userId,
              startDate: nextDate,
              endDate: null,
              notes: "Manutenção agendada automaticamente",
            },
          })

          nextDate = addDays(nextDate, 7)
        }
      } else {
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
              maintenanceSequenceOrder: "asc",
            },
          })

          if (nextPlant) {
            const nextMaintenanceDate = addDays(new Date(), 7)

            // Atualizar a data da próxima manutenção
            await tx.plant.update({
              where: { id: nextPlant.id },
              data: {
                nextMaintenanceDate: nextMaintenanceDate,
              },
            })

            // Criar um registro de manutenção para a próxima usina
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
            // Se não houver próxima usina, voltar para a primeira
            const firstPlant = await tx.plant.findFirst({
              where: { userId },
              orderBy: {
                maintenanceSequenceOrder: "asc",
              },
            })

            if (firstPlant) {
              const nextMaintenanceDate = addMonths(new Date(), 1)

              // Atualizar a data da próxima manutenção
              await tx.plant.update({
                where: { id: firstPlant.id },
                data: {
                  nextMaintenanceDate: nextMaintenanceDate,
                },
              })

              // Criar um registro de manutenção para a primeira usina
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
      }

      return maintenance
    })

    return NextResponse.json({ id: result.id })
  } catch (error) {
    console.error("[MAINTENANCE_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
