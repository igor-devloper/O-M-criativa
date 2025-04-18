import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { addDays, addMonths } from "date-fns";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // ➤ Desembrulha o Promise para pegar o ID
    const { id } = await params;
    const maintenanceId = Number.parseInt(id, 10);
    if (isNaN(maintenanceId)) {
      return new NextResponse("Invalid maintenance ID", { status: 400 });
    }

    // Verifica se a manutenção existe e pertence ao usuário
    const maintenance = await prisma.maintenanceRecord.findUnique({
      where: { id: maintenanceId, userId },
      include: { plant: true },
    });
    if (!maintenance) {
      return new NextResponse("Maintenance not found", { status: 404 });
    }

    // Transação para concluir e agendar próxima manutenção
    const updated = await prisma.$transaction(async (tx) => {
      // 1) Atualiza o registro atual
      const updatedMaintenance = await tx.maintenanceRecord.update({
        where: { id: maintenanceId },
        data: {
          endDate: new Date(),
          isCompleted: true,
        },
      });

      // 2) Atualiza datas na usina atual
      await tx.plant.update({
        where: { id: maintenance.plantId },
        data: {
          lastMaintenanceDate: new Date(),
          nextMaintenanceDate: null,
        },
      });

      // 3) Busca ordem da usina atual
      const curr = await tx.plant.findUnique({
        where: { id: maintenance.plantId },
        select: { maintenanceSequenceOrder: true, userId: true },
      });

      if (curr?.maintenanceSequenceOrder != null) {
        // 4) Próxima usina na sequência
        const nextPlant = await tx.plant.findFirst({
          where: {
            userId: curr.userId,
            maintenanceSequenceOrder: { gt: curr.maintenanceSequenceOrder },
          },
          orderBy: { maintenanceSequenceOrder: "asc" },
        });

        if (nextPlant) {
          // Agendar 7 dias depois
          const nextDate = addDays(new Date(), 7);
          await tx.plant.update({
            where: { id: nextPlant.id },
            data: { nextMaintenanceDate: nextDate },
          });
          await tx.maintenanceRecord.create({
            data: {
              plantId: nextPlant.id,
              userId,
              startDate: nextDate,
              endDate: null,
              notes: "Manutenção agendada automaticamente",
            },
          });
        } else {
          // Reinicia ciclo na primeira usina — 1 mês depois
          const firstPlant = await tx.plant.findFirst({
            where: { userId: curr.userId },
            orderBy: { maintenanceSequenceOrder: "asc" },
          });
          if (firstPlant) {
            const nextDate = addMonths(new Date(), 1);
            await tx.plant.update({
              where: { id: firstPlant.id },
              data: { nextMaintenanceDate: nextDate },
            });
            await tx.maintenanceRecord.create({
              data: {
                plantId: firstPlant.id,
                userId,
                startDate: nextDate,
                endDate: null,
                notes: "Manutenção agendada automaticamente (ciclo reiniciado)",
              },
            });
          }
        }
      }

      return updatedMaintenance;
    });

    return NextResponse.json({ id: updated.id });
  } catch (error) {
    console.error("[MAINTENANCE_COMPLETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
