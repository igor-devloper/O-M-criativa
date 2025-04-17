"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { Calendar } from "@/app/components/ui/calendar"
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
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/app/components/ui/form"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/app/components/ui/select"
import { Textarea } from "@/app/components/ui/textarea"
import { Popover, PopoverContent, PopoverTrigger } from "@/app/components/ui/popover"
import { CalendarIcon, Plus } from "lucide-react"
import { cn } from "@/lib/utils"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import * as z from "zod"
import { toast } from "@/hooks/use-toast"

// Definição do esquema de validação
const formSchema = z.object({
  plantId: z.string().min(1, { message: "Selecione uma usina" }),
  startDate: z.date({ required_error: "Selecione uma data de início" }),
  notes: z.string().optional(),
})

export function ScheduleMaintenanceDialog() {
  const router = useRouter()
  const [plants, setPlants] = useState<any[]>([])
  const [open, setOpen] = useState(false)
  const [isFirstPlant, setIsFirstPlant] = useState(false)
  const [loading, setLoading] = useState(false)

  // Inicializar o formulário
  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      notes: "",
    },
  })

  // Buscar usinas ao carregar o componente
  useEffect(() => {
    async function fetchPlants() {
      try {
        const response = await fetch("/api/plants")
        if (response.ok) {
          const data = await response.json()
          setPlants(data)

          // Verificar se é a primeira usina com manutenção
          const hasMaintenanceScheduled = data.some(
            (plant: any) => plant.lastMaintenanceDate || plant.nextMaintenanceDate,
          )
          setIsFirstPlant(!hasMaintenanceScheduled && data.length > 0)
        }
      } catch (error) {
        console.error("Erro ao buscar usinas:", error)
        toast({
          title: "Erro",
          description: "Não foi possível carregar as usinas",
          variant: "destructive",
        })
      }
    }

    if (open) {
      fetchPlants()
    }
  }, [open])

  // Função para lidar com o envio do formulário
  async function onSubmit(values: z.infer<typeof formSchema>) {
    setLoading(true)
    try {
      // Obter os itens de checklist padrão
      const checklistResponse = await fetch("/api/checklist")
      let checklistItems = []

      if (checklistResponse.ok) {
        checklistItems = await checklistResponse.json()
      }

      // Preparar os dados para envio
      const payload = {
        plantId: Number.parseInt(values.plantId),
        startDate: values.startDate,
        endDate: null,
        notes: values.notes,
        isFirstPlant: isFirstPlant,
        checklistItems: checklistItems.map((item: any) => ({
          id: item.id,
          completed: false,
          notes: "",
        })),
      }

      // Enviar para a API
      const response = await fetch("/api/manutencao", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      })

      if (response.ok) {
        toast({
          title: "Sucesso",
          description: "Manutenção agendada com sucesso",
        })
        setOpen(false)
        form.reset()
        router.refresh()
      } else {
        const error = await response.json()
        throw new Error(error.message || "Erro ao agendar manutenção")
      }
    } catch (error: any) {
      toast({
        title: "Erro",
        description: error.message || "Ocorreu um erro ao agendar a manutenção",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Plus className="mr-2 h-4 w-4" />
          Agendar Manutenção
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Agendar Manutenção</DialogTitle>
          <DialogDescription>Preencha os dados para agendar uma nova manutenção.</DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="plantId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Usina</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione uma usina" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {plants.map((plant) => (
                        <SelectItem key={plant.id} value={plant.id.toString()}>
                          {plant.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="startDate"
              render={({ field }) => (
                <FormItem className="flex flex-col">
                  <FormLabel>Data da Manutenção</FormLabel>
                  <Popover>
                    <PopoverTrigger asChild>
                      <FormControl>
                        <Button
                          variant={"outline"}
                          className={cn("pl-3 text-left font-normal", !field.value && "text-muted-foreground")}
                        >
                          {field.value ? format(field.value, "PPP", { locale: ptBR }) : <span>Selecione uma data</span>}
                          <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                      </FormControl>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={field.value}
                        onSelect={field.onChange}
                        disabled={(date) => date < new Date()}
                        locale={ptBR}
                      />
                    </PopoverContent>
                  </Popover>
                  {isFirstPlant && (
                    <FormDescription>
                      Esta é a primeira usina com manutenção. As próximas serão agendadas automaticamente.
                    </FormDescription>
                  )}
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Observações</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Observações sobre a manutenção" className="resize-none" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <DialogFooter>
              <Button type="submit" disabled={loading}>
                {loading ? "Agendando..." : "Agendar"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  )
}
