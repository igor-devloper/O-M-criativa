import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const checklist = await prisma.checklistItem.findMany({
      orderBy: {
        id: "asc",
      },
    })

    return NextResponse.json(checklist)
  } catch (error) {
    console.error("[CHECKLIST_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { description } = body

    if (!description) {
      return new NextResponse("Missing description", { status: 400 })
    }

    const checklistItem = await prisma.checklistItem.create({
      data: {
        description,
      },
    })

    return NextResponse.json({ id: checklistItem.id })
  } catch (error) {
    console.error("[CHECKLIST_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
