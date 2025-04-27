import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { startDate } = await req.json();

  const maintenanceId = Number(id);
  if (!maintenanceId) {
    return NextResponse.json({ error: "Invalid maintenance ID" }, { status: 400 });
  }

  try {
    // Verifica se existe
    const maintenance = await prisma.maintenanceRecord.findUnique({
      where: { id: maintenanceId },
    });

    if (!maintenance) {
      return NextResponse.json({ error: "Maintenance record not found" }, { status: 404 });
    }

    // Agora atualiza
    await prisma.maintenanceRecord.update({
      where: { id: maintenanceId },
      data: { startDate: new Date(startDate) },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Erro ao atualizar data de início:", error);
    return NextResponse.json({ error: "Erro ao atualizar data" }, { status: 500 });
  }
}
