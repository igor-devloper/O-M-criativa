import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function POST(req: Request, context: { params: { id: string } }) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const maintenanceId = Number.parseInt(context.params.id)

    if (isNaN(maintenanceId)) {
      return new NextResponse("Invalid maintenance ID", { status: 400 })
    }

    const maintenance = await prisma.maintenanceRecord.findUnique({
      where: {
        id: maintenanceId,
        userId,
      },
    })

    if (!maintenance) {
      return new NextResponse("Maintenance not found", { status: 404 })
    }

    const body = await req.json()
    const { items } = body

    if (!items || !Array.isArray(items)) {
      return new NextResponse("Invalid checklist items", { status: 400 })
    }

    const results = await Promise.all(
      items.map(async (item) => {
        const existingItem = await prisma.completedChecklistItem.findFirst({
          where: {
            maintenanceId,
            checklistItemId: item.id,
          },
        })

        if (existingItem) {
          return prisma.completedChecklistItem.update({
            where: { id: existingItem.id },
            data: {
              completed: item.completed,
              notes: item.notes,
              completedAt: item.completed ? item.completedAt || new Date() : null,
            },
          })
        } else {
          return prisma.completedChecklistItem.create({
            data: {
              maintenanceId,
              checklistItemId: item.id,
              completed: item.completed,
              notes: item.notes,
              completedAt: item.completed ? new Date() : null,
            },
          })
        }
      })
    )

    return NextResponse.json({ success: true, count: results.length })
  } catch (error) {
    console.error("[CHECKLIST_UPDATE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
