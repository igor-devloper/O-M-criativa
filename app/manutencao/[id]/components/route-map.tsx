"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/app/components/ui/card"
import { Skeleton } from "@/app/components/ui/skeleton"
import { Clock, MapPin, Navigation } from "lucide-react"

interface RouteMapProps {
  plant: {
    id: number
    name: string
    address: string
    latitude: number | any // Aceitar Decimal do Prisma
    longitude: number | any // Aceitar Decimal do Prisma
  }
  maintenance: {
    id: number
    route?: string | null
    arrivalTime?: Date | null
  }
}

export function RouteMap({ plant, maintenance }: RouteMapProps) {
  const [currentPosition, setCurrentPosition] = useState<{ lat: number; lng: number } | null>(null)
  const [distance, setDistance] = useState<string | null>(null)
  const [duration, setDuration] = useState<string | null>(null)
  const [arrivalTime, setArrivalTime] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Obter a posição atual do usuário
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentPosition({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          })
        },
        (err) => {
          console.error("Erro ao obter localização:", err)
          setError("Não foi possível obter sua localização atual.")
          setIsLoading(false)
        },
      )
    } else {
      setError("Geolocalização não é suportada pelo seu navegador.")
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    // Calcular rota quando tivermos a posição atual
    if (currentPosition && plant.latitude && plant.longitude) {
      calculateRoute()
    }
  }, [currentPosition, plant])

  const calculateRoute = async () => {
    setIsLoading(true)
    try {
      // Converter latitude e longitude para número se necessário
      const plantLat = typeof plant.latitude === "number" ? plant.latitude : Number(plant.latitude)
      const plantLng = typeof plant.longitude === "number" ? plant.longitude : Number(plant.longitude)

      // Simular o cálculo de rota (em uma implementação real, usaríamos a API do Google Maps)
      // Aqui estamos apenas simulando os dados para demonstração

      // Calcular distância aproximada (fórmula de Haversine)
      const R = 6371 // Raio da Terra em km
      const dLat = deg2rad(plantLat - currentPosition!.lat)
      const dLon = deg2rad(plantLng - currentPosition!.lng)
      const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(currentPosition!.lat)) * Math.cos(deg2rad(plantLat)) * Math.sin(dLon / 2) * Math.sin(dLon / 2)
      const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
      const distanceInKm = R * c

      // Estimar tempo (assumindo velocidade média de 50 km/h)
      const durationInMinutes = Math.round((distanceInKm / 50) * 60)

      // Calcular horário de chegada
      const now = new Date()
      const arrival = new Date(now.getTime() + durationInMinutes * 60000)

      // Atualizar o estado com as informações calculadas
      setDistance(`${distanceInKm.toFixed(1)} km`)
      setDuration(`${durationInMinutes} minutos`)
      setArrivalTime(arrival.toLocaleTimeString())

      // Salvar as informações de rota no banco de dados
      await saveRouteInfo(distanceInKm, durationInMinutes, arrival)
    } catch (err) {
      console.error("Erro ao calcular rota:", err)
      setError("Não foi possível calcular a rota até a usina.")
    } finally {
      setIsLoading(false)
    }
  }

  const saveRouteInfo = async (distance: number, duration: number, arrivalTime: Date) => {
    try {
      const response = await fetch(`/api/manutencao/${maintenance.id}/route`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: `${distance.toFixed(1)} km, ${duration} minutos`,
          arrivalTime: arrivalTime.toISOString(),
        }),
      })

      if (!response.ok) {
        console.error("Erro ao salvar informações de rota")
      }
    } catch (err) {
      console.error("Erro ao salvar rota:", err)
    }
  }

  const deg2rad = (deg: number) => {
    return deg * (Math.PI / 180)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rota até a Usina</CardTitle>
        <CardDescription>Informações de deslocamento e chegada</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="space-y-4">
            <Skeleton className="h-[300px] w-full" />
            <div className="space-y-2">
              <Skeleton className="h-4 w-[250px]" />
              <Skeleton className="h-4 w-[200px]" />
              <Skeleton className="h-4 w-[150px]" />
            </div>
          </div>
        ) : error ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{error}</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="h-[300px] w-full bg-muted rounded-md flex items-center justify-center">
              <p className="text-muted-foreground">Mapa indisponível na versão de demonstração</p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <MapPin className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Distância</p>
                  <p className="text-sm text-muted-foreground">{distance}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Tempo Estimado</p>
                  <p className="text-sm text-muted-foreground">{duration}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Navigation className="h-5 w-5 text-muted-foreground" />
                <div>
                  <p className="text-sm font-medium">Horário de Chegada</p>
                  <p className="text-sm text-muted-foreground">{arrivalTime}</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
