"use client";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { MoreVertical } from "lucide-react";
import { Plant } from "@prisma/client";

export function PlantDropdownMenu({ plant }: { plant: Plant }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <p className="px-2 py-1 text-sm text-muted-foreground space-y-1 cursor-pointer">Ver Detalhes</p>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-72">
        <DropdownMenuLabel>Detalhes da Usina</DropdownMenuLabel>
        <div className="px-2 py-1 text-sm text-muted-foreground space-y-1">
          <p>
            <strong>Endereço:</strong> {plant.address}
          </p>
          <p>
            <strong>Status:</strong> {plant.status}
          </p>
          <p>
            <strong>Latitude:</strong> {plant.latitude.toString()}
          </p>
          <p>
            <strong>Longitude:</strong> {plant.longitude.toString()}
          </p>
          <p>
            <strong>Última manutenção:</strong>{" "}
            {plant.lastMaintenanceDate
              ? new Date(plant.lastMaintenanceDate).toLocaleDateString()
              : "Não registrada"}
          </p>
          <p>
            <strong>Próxima manutenção:</strong>{" "}
            {plant.nextMaintenanceDate
              ? new Date(plant.nextMaintenanceDate).toLocaleDateString()
              : "Não agendada"}
          </p>
        </div>
        <DropdownMenuSeparator />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
