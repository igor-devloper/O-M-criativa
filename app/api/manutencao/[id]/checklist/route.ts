import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { userId } = await auth()
    if (!userId) return new NextResponse("Unauthorized", { status: 401 })

    const maintenanceId = Number.parseInt(params.id)
    if (isNaN(maintenanceId))
      return new NextResponse("Invalid maintenance ID", { status: 400 })

    const maintenance = await prisma.maintenanceRecord.findUnique({
      where: { id: maintenanceId, userId },
    })
    if (!maintenance)
      return new NextResponse("Maintenance not found", { status: 404 })

    const { items } = await req.json()
    if (!Array.isArray(items))
      return new NextResponse("Invalid checklist items", { status: 400 })

    const results = await Promise.all(
      items.map(async (item) => {
        const existing = await prisma.completedChecklistItem.findFirst({
          where: { maintenanceId, checklistItemId: item.id },
        })
        if (existing) {
          return prisma.completedChecklistItem.update({
            where: { id: existing.id },
            data: {
              completed: item.completed,
              notes: item.notes,
              completedAt: item.completed
                ? item.completedAt || new Date()
                : null,
            },
          })
        }
        return prisma.completedChecklistItem.create({
          data: {
            maintenanceId,
            checklistItemId: item.id,
            completed: item.completed,
            notes: item.notes,
            completedAt: item.completed ? new Date() : null,
          },
        })
      })
    )

    return NextResponse.json({ success: true, count: results.length })
  } catch (err) {
    console.error("[CHECKLIST_UPDATE]", err)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
