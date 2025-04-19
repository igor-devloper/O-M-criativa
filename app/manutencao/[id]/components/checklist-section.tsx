"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Checkbox } from "@/app/components/ui/checkbox";
import { Textarea } from "@/app/components/ui/textarea";
import { Button } from "@/app/components/ui/button";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toast } from "@/hooks/use-toast";
import { ScrollArea } from "@/app/components/ui/scroll-area";

// Atualizar a interface ChecklistItem para aceitar undefined no completedAt
interface ChecklistItem {
  id: number;
  description: string;
  completed: boolean;
  notes: string;
  completedAt: Date | null | undefined;
}

interface ChecklistSectionProps {
  maintenanceId: number;
  checklistItems: ChecklistItem[];
  isCompleted: boolean;
}

export function ChecklistSection({
  maintenanceId,
  checklistItems,
  isCompleted,
}: ChecklistSectionProps) {
  const router = useRouter();
  const [items, setItems] = useState<ChecklistItem[]>(checklistItems);
  const [isSaving, setIsSaving] = useState(false);

  // Função para atualizar o estado de um item do checklist
  const handleCheckChange = (id: number, checked: boolean) => {
    if (isCompleted) return;

    setItems(
      items.map((item) =>
        item.id === id
          ? {
              ...item,
              completed: checked,
              completedAt: checked ? new Date() : null,
            }
          : item
      )
    );
  };

  // Função para atualizar as notas de um item
  const handleNotesChange = (id: number, notes: string) => {
    if (isCompleted) return;

    setItems(items.map((item) => (item.id === id ? { ...item, notes } : item)));
  };

  // Função para salvar as alterações no checklist
  const saveChecklist = async () => {
    setIsSaving(true);
    try {
      const response = await fetch(
        `/api/manutencao/${maintenanceId}/checklist`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ items }),
        }
      );

      if (!response.ok) {
        throw new Error("Falha ao salvar checklist");
      }

      toast({
        title: "Checklist salvo",
        description: "As alterações foram salvas com sucesso.",
      });

      router.refresh();
    } catch (error) {
      console.error("Erro ao salvar checklist:", error);
      toast({
        title: "Erro",
        description: "Não foi possível salvar o checklist.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Card className="h-[500px] flex flex-col">
      <CardHeader>
        <CardTitle>Checklist de Manutenção</CardTitle>
        <CardDescription>
          Itens a serem verificados durante a manutenção
        </CardDescription>
      </CardHeader>
      <ScrollArea className="flex-1 overflow-auto">
        <CardContent>
          <div className="space-y-4 pb-4">
            {items.map((item) => (
              <div key={item.id} className="space-y-2">
                <div className="flex items-start space-x-2">
                  <Checkbox
                    id={`item-${item.id}`}
                    checked={item.completed}
                    onCheckedChange={(checked) =>
                      handleCheckChange(item.id, checked as boolean)
                    }
                    disabled={isCompleted}
                  />
                  <div className="grid gap-1.5 leading-none">
                    <label
                      htmlFor={`item-${item.id}`}
                      className={`text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 ${
                        item.completed
                          ? "line-through text-muted-foreground"
                          : ""
                      }`}
                    >
                      {item.description}
                    </label>
                    {item.completedAt && (
                      <p className="text-xs text-muted-foreground">
                        Concluído em:{" "}
                        {format(new Date(item.completedAt), "PPP", {
                          locale: ptBR,
                        })}
                      </p>
                    )}
                  </div>
                </div>
                <Textarea
                  placeholder="Observações sobre este item"
                  value={item.notes || ""}
                  onChange={(e) => handleNotesChange(item.id, e.target.value)}
                  className="h-20"
                  disabled={isCompleted}
                />
              </div>
            ))}

            {!isCompleted && (
              <Button
                onClick={saveChecklist}
                className="w-full mt-4"
                disabled={isSaving}
              >
                {isSaving ? "Salvando..." : "Salvar Checklist"}
              </Button>
            )}
          </div>
        </CardContent>
      </ScrollArea>
    </Card>
  );
}
