import { Button } from "@/app/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/app/components/ui/tabs"
import { Calendar } from "@/app/components/ui/calendar"
import { Plus } from "lucide-react"

export default function PaginaManutencao() {
  return (
    <div className="flex-1 space-y-4 p-8 pt-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Cronograma de Manutenção</h2>
        <Button>
          <Plus className="mr-2 h-4 w-4" /> Agendar Manutenção
        </Button>
      </div>

      <Tabs defaultValue="calendario" className="space-y-4">
        <TabsList>
          <TabsTrigger value="calendario">Visualização de Calendário</TabsTrigger>
          <TabsTrigger value="lista">Visualização em Lista</TabsTrigger>
        </TabsList>
        <TabsContent value="calendario" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Calendário de Manutenção</CardTitle>
              <CardDescription>Visualize e gerencie tarefas de manutenção agendadas</CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar mode="single" className="rounded-md border" />
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="lista" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Cronograma de Manutenção</CardTitle>
              <CardDescription>Visualize todas as tarefas de manutenção agendadas</CardDescription>
            </CardHeader>
            <CardContent>
              <p>A lista de cronograma de manutenção será exibida aqui</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
