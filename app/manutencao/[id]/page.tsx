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
  params: Promise<{ id: string }>;
}

export default async function MaintenancePage({ params }: MaintenancePageProps) {
  const { id } = await params
  const { userId } = await auth()

  if (!userId) {
    redirect("/login")
  }

  const maintenanceId = Number.parseInt(id, 10)
  if (isNaN(maintenanceId)) {
    notFound()
  }

  const maintenance = await prisma.maintenanceRecord.findUnique({
    where: { id: maintenanceId },
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

  // Buscar todos os itens de checklist para garantir lista completa
  const allChecklistItems = await prisma.checklistItem.findMany()

  // Se não houver itens, criar padrões
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

    await Promise.all(
      defaultItems.map(item =>
        prisma.checklistItem.create({ data: item })
      )
    )

    const newChecklistItems = await prisma.checklistItem.findMany()
    const checklistItems = newChecklistItems.map(item => ({
      id: item.id,
      description: item.description,
      completed: false,
      notes: "",
      completedAt: null,
    }))

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

  // Itens de checklist existentes
  const checklistItems = allChecklistItems.map(item => {
    const completedItem = maintenance.completedItems.find(
      ci => ci.checklistItemId === item.id
    )
    return {
      id: item.id,
      description: item.description,
      completed: completedItem?.completed || false,
      notes: completedItem?.notes || "",
      completedAt: completedItem?.completedAt || null,
    }
  })

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