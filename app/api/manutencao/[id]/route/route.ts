// app/api/manutencao/[id]/route/route.ts

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Desembrulha o Promise para obter o ID
    const { id } = await params;
    const maintenanceId = Number.parseInt(id, 10);
    if (isNaN(maintenanceId)) {
      return new NextResponse("Invalid maintenance ID", { status: 400 });
    }

    // Verificar se a manutenção existe e pertence ao usuário
    const maintenance = await prisma.maintenanceRecord.findUnique({
      where: { id: maintenanceId, userId },
    });
    if (!maintenance) {
      return new NextResponse("Maintenance not found", { status: 404 });
    }

    // Obter os dados da rota do corpo da requisição
    const { route, arrivalTime } = await req.json();
    if (!route || !arrivalTime) {
      return new NextResponse("Missing route information", { status: 400 });
    }

    // Atualizar as informações de rota na manutenção
    const updated = await prisma.maintenanceRecord.update({
      where: { id: maintenanceId },
      data: {
        route,
        arrivalTime: new Date(arrivalTime),
      },
    });

    return NextResponse.json({ id: updated.id });
  } catch (error) {
    console.error("[ROUTE_UPDATE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
