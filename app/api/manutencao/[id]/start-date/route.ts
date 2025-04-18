import { prisma } from "@/lib/prisma"
import { NextRequest, NextResponse } from "next/server"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const body = await req.json()
  const { startDate } = body
  const { id } = await params;

  const maintenanceId = Number.parseInt(id, 10);
  if (isNaN(maintenanceId)) {
    return new NextResponse("Invalid maintenance ID", { status: 400 });
  }

  try {
    await prisma.maintenanceRecord.update({
      where: { id: maintenanceId },
      data: { startDate: new Date(startDate) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao atualizar data de início:", error)
    return new NextResponse("Erro ao atualizar data", { status: 500 })
  }
}
