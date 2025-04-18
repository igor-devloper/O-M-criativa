// app/api/manutencao/[id]/checklist/route.ts

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 1. Auth
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // 2. Param ID
    const { id } = await params;
    const maintenanceId = Number.parseInt(id, 10);
    if (isNaN(maintenanceId)) {
      return new NextResponse("Invalid maintenance ID", { status: 400 });
    }

    // 3. Verifica manutenção
    const maintenance = await prisma.maintenanceRecord.findUnique({
      where: { id: maintenanceId, userId },
    });
    if (!maintenance) {
      return new NextResponse("Maintenance not found", { status: 404 });
    }

    // 4. Lê itens do body
    const { items } = await req.json();
    if (!Array.isArray(items)) {
      return new NextResponse("Invalid checklist items", { status: 400 });
    }

    // 5. Cria/atualiza itens
    const results = await Promise.all(
      items.map(async (item: {
        id: number;
        completed: boolean;
        notes?: string;
        completedAt?: string;
      }) => {
        const existing = await prisma.completedChecklistItem.findFirst({
          where: {
            maintenanceId,
            checklistItemId: item.id,
          },
        });
        if (existing) {
          return prisma.completedChecklistItem.update({
            where: { id: existing.id },
            data: {
              completed: item.completed,
              notes: item.notes,
              completedAt: item.completed
                ? item.completedAt
                  ? new Date(item.completedAt)
                  : new Date()
                : null,
            },
          });
        }
        return prisma.completedChecklistItem.create({
          data: {
            maintenanceId,
            checklistItemId: item.id,
            completed: item.completed,
            notes: item.notes,
            completedAt: item.completed ? new Date() : null,
          },
        });
      })
    );

    // 6. Resposta
    return NextResponse.json({ success: true, count: results.length });
  } catch (error) {
    console.error("[CHECKLIST_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
