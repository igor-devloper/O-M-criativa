// app/api/manutencao/[…]/route.ts  (ou onde quer que esse handler esteja)

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { addDays, addMonths } from "date-fns";

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const {
      plantId,
      startDate,
      endDate,
      notes,
      checklistItems,
      isFirstPlant,
    } = await req.json();

    if (!plantId || !startDate || !checklistItems) {
      return new NextResponse("Missing required fields", { status: 400 });
    }

    const result = await prisma.$transaction(async (tx) => {
      const maintenance = await tx.maintenanceRecord.create({
        data: {
          plantId,
          userId,
          startDate: new Date(startDate),
          endDate: endDate ? new Date(endDate) : null,
          notes,
        },
      });

      for (const item of checklistItems) {
        await tx.completedChecklistItem.create({
          data: {
            maintenanceId: maintenance.id,
            checklistItemId: item.id,
            completed: item.completed,
            notes: item.notes,
            completedAt: item.completed ? new Date() : null,
          },
        });
      }

      await tx.plant.update({
        where: { id: plantId },
        data: {
          lastMaintenanceDate: new Date(),
          nextMaintenanceDate: null,
        },
      });

      if (isFirstPlant) {
        let nextDate = addDays(new Date(startDate), 7);
        const otherPlants = await tx.plant.findMany({
          where: { userId, id: { not: plantId } },
          orderBy: { maintenanceSequenceOrder: "asc" },
        });

        for (const plant of otherPlants) {
          await tx.plant.update({
            where: { id: plant.id },
            data: { nextMaintenanceDate: nextDate },
          });
          await tx.maintenanceRecord.create({
            data: {
              plantId: plant.id,
              userId,
              startDate: nextDate,
              endDate: null,
              notes: "Manutenção agendada automaticamente",
            },
          });
          nextDate = addDays(nextDate, 7);
        }
      } else {
        const curr = await tx.plant.findUnique({
          where: { id: plantId },
          select: { maintenanceSequenceOrder: true, userId: true },
        });
        if (curr?.maintenanceSequenceOrder != null) {
          const nextPlant = await tx.plant.findFirst({
            where: {
              userId: curr.userId,
              maintenanceSequenceOrder: { gt: curr.maintenanceSequenceOrder },
            },
            orderBy: { maintenanceSequenceOrder: "asc" },
          });
          if (nextPlant) {
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
            const firstPlant = await tx.plant.findFirst({
              where: { userId },
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
                  notes:
                    "Manutenção agendada automaticamente (ciclo reiniciado)",
                },
              });
            }
          }
        }
      }

      return maintenance;
    });

    return NextResponse.json({ id: result.id });
  } catch (error) {
    console.error("[MAINTENANCE_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
