import { prisma } from "@/lib/prisma"
import { NextResponse } from "next/server"

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json()
  const { startDate } = body

  try {
    await prisma.maintenanceRecord.update({
      where: { id: Number(params.id) },
      data: { startDate: new Date(startDate) },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Erro ao atualizar data de início:", error)
    return new NextResponse("Erro ao atualizar data", { status: 500 })
  }
}
