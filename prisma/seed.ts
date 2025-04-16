
import { PrismaClient } from "@prisma/client"

const prisma = new PrismaClient()

async function main() {
  // Criar itens de checklist padrão
  const checklistItems = [
    { description: "Verificar níveis de óleo" },
    { description: "Inspecionar filtros de ar" },
    { description: "Verificar sistema de refrigeração" },
    { description: "Testar sistema elétrico" },
    { description: "Verificar vazamentos" },
    { description: "Inspecionar correias e mangueiras" },
    { description: "Verificar sistema de combustível" },
    { description: "Testar alarmes e sensores" },
    { description: "Verificar baterias" },
    { description: "Limpar área ao redor do equipamento" },
  ]

  for (const item of checklistItems) {
    await prisma.checklistItem.upsert({
      where: { id: checklistItems.indexOf(item) + 1 },
      update: {},
      create: {
        description: item.description,
      },
    })
  }

  console.log("Seed concluído com sucesso!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
