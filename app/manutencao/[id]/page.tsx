import { Header } from "@/app/components/header"
import { auth } from "@clerk/nextjs/server"
import { redirect, notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { MaintenanceDetails } from "./components/maintenance-details"
import { ChecklistSection } from "./components/checklist-section"
import { RouteMap } from "./components/route-map"

interface MaintenancePageProps {
  params: {
    id: string
  }
}

export default async function MaintenancePage({ params }: MaintenancePageProps) {
  const { userId } = await auth()

  if (!userId) {
    redirect("/login")
  }

  const maintenanceId = Number.parseInt(params.id)

  if (isNaN(maintenanceId)) {
    notFound()
  }

  const maintenance = await prisma.maintenanceRecord.findUnique({
    where: {
      id: maintenanceId,
      userId,
    },
    include: {
      plant: true,
      completedItems: {
        include: {
          checklistItem: true,
        },
      },
    },
  })

  if (!maintenance) {
    notFound()
  }

  // Buscar todos os itens de checklist para garantir que temos a lista completa
  const allChecklistItems = await prisma.checklistItem.findMany()

  // Se não houver itens de checklist, criar alguns padrão
  if (allChecklistItems.length === 0) {
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
    await Promise.all(
      defaultItems.map((item) =>
        prisma.checklistItem.create({
          data: item,
        }),
      ),
    )

    // Buscar novamente após criar
    const newChecklistItems = await prisma.checklistItem.findMany()

    // Mapear os itens completados para o formato esperado pelo componente
    const checklistItems = newChecklistItems.map((item) => {
      return {
        id: item.id,
        description: item.description,
        completed: false,
        notes: "",
        completedAt: null,
      }
    })

    // Converter os valores de Decimal para number ao passar para o componente RouteMap
    return (
      <div className="flex min-h-screen flex-col">
        <Header />
        <main className="flex-1 p-4 md:p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold">Detalhes da Manutenção</h1>
            <p className="text-muted-foreground">
              {maintenance.plant.name} - {format(new Date(maintenance.startDate), "PPP", { locale: ptBR })}
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            <div className="space-y-6">
              <MaintenanceDetails maintenance={maintenance} />
              <ChecklistSection
                maintenanceId={maintenance.id}
                checklistItems={checklistItems}
                isCompleted={!!maintenance.endDate}
              />
            </div>
            <RouteMap
              plant={{
                id: maintenance.plant.id,
                name: maintenance.plant.name,
                address: maintenance.plant.address,
                latitude: Number(maintenance.plant.latitude),
                longitude: Number(maintenance.plant.longitude),
              }}
              maintenance={maintenance}
            />
          </div>
        </main>
      </div>
    )
  }

  // Mapear os itens completados para o formato esperado pelo componente
  const checklistItems = allChecklistItems.map((item) => {
    const completedItem = maintenance.completedItems.find((ci) => ci.checklistItemId === item.id)

    return {
      id: item.id,
      description: item.description,
      completed: completedItem?.completed || false,
      notes: completedItem?.notes || "",
      completedAt: completedItem?.completedAt || null,
    }
  })

  // Converter os valores de Decimal para number ao passar para o componente RouteMap
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Detalhes da Manutenção</h1>
          <p className="text-muted-foreground">
            {maintenance.plant.name} - {format(new Date(maintenance.startDate), "PPP", { locale: ptBR })}
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-6">
            <MaintenanceDetails maintenance={maintenance} />
            <ChecklistSection
              maintenanceId={maintenance.id}
              checklistItems={checklistItems}
              isCompleted={!!maintenance.endDate}
            />
          </div>
          <RouteMap
            plant={{
              id: maintenance.plant.id,
              name: maintenance.plant.name,
              address: maintenance.plant.address,
              latitude: Number(maintenance.plant.latitude),
              longitude: Number(maintenance.plant.longitude),
            }}
            maintenance={maintenance}
          />
        </div>
      </main>
    </div>
  )
}
