import { prisma } from "@/lib/prisma"
import { auth } from "@clerk/nextjs/server"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const { userId } = await auth()

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Buscar todos os itens de checklist
    const checklistItems = await prisma.checklistItem.findMany({
      orderBy: {
        id: "asc",
      },
    })

    // Se não houver itens, criar alguns padrão
    if (checklistItems.length === 0) {
      const defaultItems = [
        { description: "Verificar conexões elétricas" },
        { description: "Inspecionar painéis solares" },
        { description: "Limpar superfícies dos painéis" },
        { description: "Verificar inversores" },
        { description: "Testar sistema de monitoramento" },
        { description: "Verificar estruturas de suporte" },
        { description: "Inspecionar cabeamento" },
        { description: "Verificar sistema de aterramento" },
        { description: "Testar desempenho do sistema" },
        { description: "Documentar leituras de energia" },
      ]

      // Criar os itens padrão
      const createdItems = await Promise.all(
        defaultItems.map((item) =>
          prisma.checklistItem.create({
            data: item,
          }),
        ),
      )

      return NextResponse.json(createdItems)
    }

    return NextResponse.json(checklistItems)
  } catch (error) {
    console.error("[CHECKLIST_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
