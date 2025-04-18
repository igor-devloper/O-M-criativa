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

    // Aqui vem sua lógica de criação/atualização...
    const body = await req.json();
    // Exemplo mínimo de resposta:
    // await prisma.maintenanceRecord.update({ /* … */ });

    return NextResponse.json({ success: true, id: maintenanceId });
  } catch (error) {
    console.error("[MAINT_ROUTE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
