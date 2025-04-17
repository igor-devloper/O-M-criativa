"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/app/components/ui/card"
import { ScheduleMaintenanceDialog } from "@/app/manutencao/components/schedule-maintenance-dialog"
import { AddPowerPlantDialog } from "@/app/plants/components/add-power-plant-dialog"
import Link from "next/link"

export function DashboardActions() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      <Card className="hover:bg-muted/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Adicionar Usina</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Cadastre uma nova usina no sistema</p>
          <AddPowerPlantDialog />
        </CardContent>
      </Card>
      <Card className="hover:bg-muted/50">
        <CardHeader className="pb-2">
          <CardTitle className="text-lg">Registrar Manutenção</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">Registre uma nova manutenção realizada</p>
          <ScheduleMaintenanceDialog />
        </CardContent>
      </Card>
      <Link href="/plants/map">
        <Card className="cursor-pointer hover:bg-muted/50">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Ver Mapa de Usinas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">Visualize todas as usinas no mapa</p>
          </CardContent>
        </Card>
      </Link>
    </div>
  )
}
