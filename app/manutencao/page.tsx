import { Header } from "@/app/components/header"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { format } from "date-fns"
import { ptBR } from "date-fns/locale"
import { ScheduleMaintenanceDialog } from "./components/schedule-maintenance-dialog"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/app/components/ui/table"
import { Badge } from "@/app/components/ui/badge"
import Link from "next/link"
import { Button } from "@/app/components/ui/button"
import { Eye } from "lucide-react"

export default async function MaintenancePage() {
  const { userId } = await auth()

  if (!userId) {
    redirect("/login")
  }

  const maintenanceRecords = await prisma.maintenanceRecord.findMany({
    include: {
      plant: {
        select: {
          id: true,
          name: true,
          address: true,
          nextMaintenanceDate: true,
        },
      },
    },
    orderBy: {
      startDate: "asc",
    },
  })

  const getStatusBadge = (record: any) => {
    const now = new Date()
    const startDate = new Date(record.startDate)
    const endDate = record.endDate ? new Date(record.endDate) : null

    if (endDate) {
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
          Concluída
        </Badge>
      )
    } else if (now >= startDate) {
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
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

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Manutenções</h1>
          <ScheduleMaintenanceDialog />
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Agenda de Manutenções</CardTitle>
            <CardDescription>Visualize e gerencie todas as manutenções agendadas.</CardDescription>
          </CardHeader>
          <CardContent>
            {maintenanceRecords.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">
                Nenhuma manutenção agendada. Use o botão acima para agendar uma nova manutenção.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usina</TableHead>
                    <TableHead>Data de Início</TableHead>
                    <TableHead>Data de Término</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Observações</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {maintenanceRecords.map((record) => (
                    <TableRow key={record.id}>
                      <TableCell className="font-medium">{record.plant.name}</TableCell>
                      <TableCell>{format(new Date(record.startDate), "PPP", { locale: ptBR })}</TableCell>
                      <TableCell>
                        {record.endDate ? format(new Date(record.endDate), "PPP", { locale: ptBR }) : "—"}
                      </TableCell>
                      <TableCell>{getStatusBadge(record)}</TableCell>
                      <TableCell className="max-w-xs truncate">{record.notes || "—"}</TableCell>
                      <TableCell className="text-right">
                        <Link href={`/manutencao/${record.id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-1" />
                            Detalhes
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
