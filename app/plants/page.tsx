import { Header } from "@/app/components/header";
import { Button } from "@/app/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { auth } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";
import { prisma } from "@/lib/prisma"; // certifique-se que esse caminho esteja correto
import { PlantDropdownMenu } from "./components/dropdown-planta";

export default async function PlantsPage() {
  const { userId } = await auth();

  if (!userId) {
    redirect("/login");
  }

  const plants = await prisma.plant.findMany({
    where: { userId: userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-6">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Usinas</h1>
          <Link href="/plants/new">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Nova Usina
            </Button>
          </Link>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {plants.map((plant) => (
            <Card key={plant.id}>
              <CardHeader className="pb-2">
                <div className="flex justify-between items-start">
                  <CardTitle>{plant.name}</CardTitle>
                  <PlantDropdownMenu plant={plant} />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-2">
                  Endereço: {plant.address}
                </p>
                <p className="text-sm text-muted-foreground mb-4">
                  Próxima manutenção:{" "}
                  {plant.nextMaintenanceDate
                    ? new Date(plant.nextMaintenanceDate).toLocaleDateString()
                    : "Não agendada"}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </main>
    </div>
  );
}
