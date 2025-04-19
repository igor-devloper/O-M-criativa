"use client";

import {
  GoogleMap,
  DirectionsRenderer,
  useJsApiLoader,
} from "@react-google-maps/api";
import { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/app/components/ui/card";
import { Skeleton } from "@/app/components/ui/skeleton";
import { Clock, MapPin, MapPinned, Navigation } from "lucide-react";
import Image from "next/image";

interface RouteMapProps {
  plant: {
    id: number;
    name: string;
    address: string;
    latitude: number | any;
    longitude: number | any;
  };
  maintenance: {
    id: number;
    route?: string | null;
    arrivalTime?: Date | null;
  };
}

export function RouteMap({ plant, maintenance }: RouteMapProps) {
  const [currentPosition, setCurrentPosition] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [distance, setDistance] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [arrivalTime, setArrivalTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY!,
    language: "pt", // Português
    region: "BR",
  });

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentPosition({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (err) => {
          console.error("Erro ao obter localização:", err);
          setError("Não foi possível obter sua localização.");
        }
      );
    } else {
      setError("Geolocalização não é suportada.");
    }
  }, []);

  useEffect(() => {
    if (isLoaded && currentPosition) {
      calculateRoute();
    }
  }, [isLoaded, currentPosition]);

  const calculateRoute = async () => {
    const directionsService = new google.maps.DirectionsService();

    const destination = {
      lat:
        typeof plant.latitude === "number"
          ? plant.latitude
          : Number(plant.latitude),
      lng:
        typeof plant.longitude === "number"
          ? plant.longitude
          : Number(plant.longitude),
    };

    directionsService.route(
      {
        origin: currentPosition!,
        destination,
        travelMode: google.maps.TravelMode.DRIVING,
      },
      async (result, status) => {
        if (status === google.maps.DirectionsStatus.OK && result) {
          setDirections(result);

          const leg = result.routes[0].legs[0];
          setDistance(leg.distance?.text ?? null);
          setDuration(leg.duration?.text ?? null);

          const now = new Date();
          const arrival = new Date(
            now.getTime() + (leg.duration?.value ?? 0) * 1000
          );
          setArrivalTime(arrival.toLocaleTimeString());

          // Salvar no backend
          await saveRouteInfo(leg.distance?.text, leg.duration?.text, arrival);
        } else {
          setError("Erro ao calcular a rota.");
        }
      }
    );
  };

  const saveRouteInfo = async (
    distance: string | undefined,
    duration: string | undefined,
    arrivalTime: Date
  ) => {
    try {
      await fetch(`/api/manutencao/${maintenance.id}/route`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          route: `${distance}, ${duration}`,
          arrivalTime: arrivalTime.toISOString(),
        }),
      });
    } catch (err) {
      console.error("Erro ao salvar rota:", err);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Rota até a Usina</CardTitle>
        <CardDescription>Informações de deslocamento e mapa</CardDescription>
      </CardHeader>
      <CardContent>
        {!isLoaded || !currentPosition ? (
          <Skeleton className="h-[300px] w-full" />
        ) : error ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{error}</p>
          </div>
        ) : (
          <>
            <div className="h-[300px] w-full rounded-md overflow-hidden">
              <GoogleMap
                center={currentPosition}
                zoom={10}
                mapContainerStyle={{ width: "100%", height: "100%" }}
              >
                {directions && <DirectionsRenderer directions={directions} />}
              </GoogleMap>
            </div>

            <div className="mt-4 space-y-4">
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
              {currentPosition && (
                <div className="flex items-center gap-2">
                  <a
                    href={`https://www.google.com/maps/dir/?api=1&origin=${currentPosition.lat},${currentPosition.lng}&destination=${plant.latitude},${plant.longitude}&travelmode=driving`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 underline cursor-pointer "
                  >
                    <img
                      src="/google-maps.svg"
                      alt="Google Maps"
                      className="h-6 w-6 object-contain"
                    />
                    <p className="text-sm font-medium">Abrir no Google Maps</p>
                  </a>
                </div>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
}
