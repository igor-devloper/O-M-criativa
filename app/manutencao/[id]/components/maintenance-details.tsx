"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Button } from "@/app/components/ui/button"
import { Badge } from "@/app/components/ui/badge"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/app/components/ui/alert-dialog"
import { CheckCircle, Clock } from "lucide-react"
import { toast } from "@/hooks/use-toast"

interface MaintenanceDetailsProps {
  maintenance: any
}

export function MaintenanceDetails({ maintenance }: MaintenanceDetailsProps) {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const isCompleted = !!maintenance.endDate
  const startDate = new Date(maintenance.startDate)
  const endDate = maintenance.endDate ? new Date(maintenance.endDate) : null

  // Determinar o status da manutenção
  const getStatusBadge = () => {
    const now = new Date()

    if (isCompleted) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          <CheckCircle className="w-3.5 h-3.5 mr-1" />
          Concluída
        </Badge>
      )
    } else if (now >= startDate) {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="w-3.5 h-3.5 mr-1" />
          Em Andamento
        </Badge>
      )
    } else {
      return (
        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
          Agendada
        </Badge>
      )
    }
  }

  // Função para finalizar a manutenção
  const completeMaintenanceHandler = async () => {
    setIsLoading(true)
    try {
      const response = await fetch(`/api/manutencao/${maintenance.id}/complete`, {
        method: "POST",
      })

      if (!response.ok) {
        throw new Error("Falha ao finalizar manutenção")
      }

      toast({
        title: "Manutenção finalizada",
        description: "A manutenção foi marcada como concluída com sucesso.",
      })

      router.refresh()
    } catch (error) {
      console.error("Erro ao finalizar manutenção:", error)
      toast({
        title: "Erro",
        description: "Não foi possível finalizar a manutenção.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Informações da Manutenção</span>
          {getStatusBadge()}
        </CardTitle>
        <CardDescription>Detalhes sobre a manutenção agendada</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h3 className="font-medium text-sm">Usina</h3>
          <p>{maintenance.plant.name}</p>
        </div>
        <div>
          <h3 className="font-medium text-sm">Endereço</h3>
          <p>{maintenance.plant.address}</p>
        </div>
        <div>
          <h3 className="font-medium text-sm">Data de Início</h3>
          <p>{format(startDate, "PPP", { locale: ptBR })}</p>
        </div>
        {endDate && (
          <div>
            <h3 className="font-medium text-sm">Data de Conclusão</h3>
            <p>{format(endDate, "PPP", { locale: ptBR })}</p>
          </div>
        )}
        {maintenance.notes && (
          <div>
            <h3 className="font-medium text-sm">Observações</h3>
            <p className="text-sm text-muted-foreground">{maintenance.notes}</p>
          </div>
        )}
      </CardContent>
      {!isCompleted && (
        <CardFooter>
          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button className="w-full">Finalizar Manutenção</Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Finalizar Manutenção</AlertDialogTitle>
                <AlertDialogDescription>
                  Tem certeza que deseja finalizar esta manutenção? Esta ação não pode ser desfeita.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                <AlertDialogAction onClick={completeMaintenanceHandler} disabled={isLoading}>
                  {isLoading ? "Finalizando..." : "Finalizar"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </CardFooter>
      )}
    </Card>
  )
}
