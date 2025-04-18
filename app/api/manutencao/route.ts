// app/api/manutencao/[id]/route/route.ts

import { prisma } from "@/lib/prisma";
import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth();
    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Obter o ID diretamente do params
    const { id } = params;
    const maintenanceId = Number.parseInt(id, 10);
    if (isNaN(maintenanceId)) {
      return new NextResponse("Invalid maintenance ID", { status: 400 });
    }

    // Obter dados do corpo da requisição
    const { route, arrivalTime } = await req.json();
    if (!route || !arrivalTime) {
      return new NextResponse("Missing route information", { status: 400 });
    }

    // Atualizar manutenção
    const updated = await prisma.maintenanceRecord.update({
      where: { id: maintenanceId },
      data: {
        route,
        arrivalTime: new Date(arrivalTime),
      },
    });

    return NextResponse.json({ success: true, id: updated.id });
  } catch (error) {
    console.error("[MAINT_ROUTE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
