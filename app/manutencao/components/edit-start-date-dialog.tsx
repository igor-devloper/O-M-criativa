"use client"

import { Dialog, DialogContent, DialogTrigger } from "@/app/components/ui/dialog"
import { Button } from "@/app/components/ui/button"
import { Calendar } from "@/app/components/ui/calendar"
import { useState } from "react"
import { ptBR } from "date-fns/locale"
import { Pencil } from "lucide-react"
import { toast } from "@/hooks/use-toast"
import { useRouter } from "next/navigation"

interface Props {
  recordId: number
  currentDate: Date
}

export function EditStartDateDialog({ recordId, currentDate }: Props) {
  const [date, setDate] = useState<Date | undefined>(currentDate)
  const [open, setOpen] = useState(false)
  const router = useRouter()

  const handleSave = async () => {
    if (!date) return
    const res = await fetch(`/api/manutencao/${recordId}/start-date`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ startDate: date }),
    })
    router.refresh()
    if (res.ok) {
      toast({ title: "Data atualizada com sucesso!" })
      setOpen(false)
    } else {
      toast({ title: "Erro ao atualizar a data.", variant: "destructive" })
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="ml-2">
          <Pencil className="w-4 h-4" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm flex items-center flex-col justify-center">
        <Calendar
          mode="single"
          selected={date}
          onSelect={setDate}
          locale={ptBR}
          initialFocus
        />
        <Button onClick={handleSave} disabled={!date} className="mt-4 w-full">
          Salvar
        </Button>
      </DialogContent>
    </Dialog>
  )
}
