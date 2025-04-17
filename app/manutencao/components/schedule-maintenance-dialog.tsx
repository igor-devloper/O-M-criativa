"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { PlusIcon, Calendar } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { Button } from "@/app/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/app/components/ui/dialog"
import { Label } from "@/app/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Textarea } from "@/app/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar as CalendarComponent } from "@/app/components/ui/calendar"

export function ScheduleMaintenanceDialog() {
  const [open, setOpen] = useState(false)
  const [plantId, setPlantId] = useState("")
  const [startDate, setStartDate] = useState<Date>()
  const [endDate, setEndDate] = useState<Date>()
  const [notes, setNotes] = useState("")
  const [plants, setPlants] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { toast } = useToast()
  const router = useRouter()

  // Fetch plants when dialog opens
  const handleOpenChange = (open: boolean) => {
    setOpen(open)
    if (open) {
      fetchPlants()
    }
  }

  const fetchPlants = async () => {
    setIsLoading(true)
    try {
      const response = await fetch("/api/plants")
      if (!response.ok) {
        throw new Error("Failed to fetch plants")
      }
      const data = await response.json()
      setPlants(data)
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível carregar as usinas.",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!plantId || !startDate) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha todos os campos obrigatórios.",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)

    try {
      const response = await fetch("/api/maintenance-records", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          plantId: Number.parseInt(plantId),
          startDate: startDate.toISOString(),
          endDate: endDate ? endDate.toISOString() : null,
          notes,
        }),
      })

      if (!response.ok) {
        throw new Error("Failed to schedule maintenance")
      }

      // Close dialog
      setOpen(false)

      // Show success toast
      toast({
        title: "Manutenção agendada",
        description: `A manutenção foi agendada com sucesso para ${format(startDate, "PPP", { locale: ptBR })}.`,
        variant: "default",
      })

      // Reset form
      setPlantId("")
      setStartDate(undefined)
      setEndDate(undefined)
      setNotes("")

      // Refresh the page to show the new maintenance
      router.refresh()
    } catch (error) {
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao agendar a manutenção.",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <PlusIcon className="h-4 w-4" />
          Agendar Manutenção
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Agendar Manutenção</DialogTitle>
          <DialogDescription>Preencha os dados para agendar uma nova manutenção.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="plant" className="text-right">
                Usina
              </Label>
              <div className="col-span-3">
                <Select value={plantId} onValueChange={setPlantId} disabled={isLoading}>
                  <SelectTrigger id="plant">
                    <SelectValue placeholder="Selecione uma usina" />
                  </SelectTrigger>
                  <SelectContent>
                    {isLoading ? (
                      <SelectItem value="loading" disabled>
                        Carregando...
                      </SelectItem>
                    ) : (
                      plants.map((plant) => (
                        <SelectItem key={plant.id} value={plant.id.toString()}>
                          {plant.name}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="startDate" className="text-right">
                Data de Início
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${!startDate && "text-muted-foreground"}`}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {startDate ? format(startDate, "PPP", { locale: ptBR }) : "Selecione uma data"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={startDate}
                      onSelect={setStartDate}
                      initialFocus
                      locale={ptBR}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="endDate" className="text-right">
                Data de Término
              </Label>
              <div className="col-span-3">
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={`w-full justify-start text-left font-normal ${!endDate && "text-muted-foreground"}`}
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {endDate ? format(endDate, "PPP", { locale: ptBR }) : "Selecione uma data (opcional)"}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <CalendarComponent
                      mode="single"
                      selected={endDate}
                      onSelect={setEndDate}
                      initialFocus
                      locale={ptBR}
                      disabled={(date) => (startDate ? date < startDate : false)}
                    />
                  </PopoverContent>
                </Popover>
              </div>
            </div>

            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="notes" className="text-right align-top mt-2">
                Observações
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                className="col-span-3"
                placeholder="Descreva os detalhes da manutenção"
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Agendando..." : "Agendar"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
