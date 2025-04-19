import { NextResponse } from "next/server"

// Dados de teste para depuração
const testPlants = [
  {
    id: 1,
    name: "Usina Teste 1",
    address: "Rua Teste, 123",
    latitude: -8.0476,
    longitude: -34.877,
    nextMaintenanceDate: "2023-12-01",
    status: "Operacional",
    maintenanceSequenceOrder: 1,
  },
  {
    id: 2,
    name: "Usina Teste 2",
    address: "Av. Exemplo, 456",
    latitude: -23.5505,
    longitude: -46.6333,
    nextMaintenanceDate: "2023-12-08",
    status: "Operacional",
    maintenanceSequenceOrder: 2,
  },
  {
    id: 3,
    name: "Usina Teste 3",
    address: "Praça Central, 789",
    latitude: -15.7801,
    longitude: -47.9292,
    nextMaintenanceDate: "2023-12-15",
    status: "Manutenção Pendente",
    maintenanceSequenceOrder: 3,
  },
]

export async function GET() {
  return NextResponse.json(testPlants)
}
