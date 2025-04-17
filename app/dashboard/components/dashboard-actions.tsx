"use client"

import { Button } from "@/app/components/ui/button"
import { PlusCircle, Wrench, Map } from "lucide-react"
import Link from "next/link"

export function DashboardActions() {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Link href="/plants" className="w-full">
        <Button variant="outline" className="w-full h-24 flex flex-col gap-2 items-center justify-center">
          <PlusCircle className="h-6 w-6" />
          <span>Adicionar Usina</span>
        </Button>
      </Link>

      <Link href="/manutencao" className="w-full">
        <Button variant="outline" className="w-full h-24 flex flex-col gap-2 items-center justify-center">
          <Wrench className="h-6 w-6" />
          <span>Gerenciar Manutenções</span>
        </Button>
      </Link>

      <Link href="/plants/map" className="w-full">
        <Button variant="outline" className="w-full h-24 flex flex-col gap-2 items-center justify-center">
          <Map className="h-6 w-6" />
          <span>Ver Mapa de Usinas</span>
        </Button>
      </Link>
    </div>
  )
}
