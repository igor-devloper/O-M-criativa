"use client";

import { useState, useEffect, useRef } from "react";
import { Header } from "@/app/components/header";
import { Card, CardContent } from "@/app/components/ui/card";
import {
  GoogleMap,
  LoadScript,
  MarkerF,
  InfoWindowF,
  DirectionsRenderer,
} from "@react-google-maps/api";
import { useRouter } from "next/navigation";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";
import { Button } from "@/app/components/ui/button";
import { Info, Navigation, Clock, AlertTriangle } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/app/components/ui/alert";

// Tipo para as usinas
interface Plant {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  nextMaintenanceDate: string | null;
  lastMaintenanceDate?: string | null;
  status?: string;
  maintenanceSequenceOrder?: number | null;
}

// Tipo para manutenção
interface Maintenance {
  id: number;
  plantId: number;
  startDate: string;
  endDate: string | null;
  notes: string;
}

// Estilo do container do mapa
const containerStyle = {
  width: "100%",
  height: "600px",
};

// Centro inicial do mapa (Brasil)
const center = {
  lat: -15.7801,
  lng: -47.9292,
};

// Declare google variable
declare global {
  interface Window {
    google: any;
  }
}

// Componente de depuração para mostrar os dados das usinas
function DebugPanel({ plants }: { plants: Plant[] }) {
  return (
    <div className="bg-white p-4 mb-4 rounded-md border shadow-sm">
      <h3 className="font-bold mb-2">
        Depuração - Usinas Carregadas ({plants.length})
      </h3>
      {plants.length === 0 ? (
        <p className="text-red-500">Nenhuma usina encontrada no estado.</p>
      ) : (
        <div className="max-h-40 overflow-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b">
                <th className="text-left p-1">ID</th>
                <th className="text-left p-1">Nome</th>
                <th className="text-left p-1">Latitude</th>
                <th className="text-left p-1">Longitude</th>
              </tr>
            </thead>
            <tbody>
              {plants.map((plant) => (
                <tr key={plant.id} className="border-b">
                  <td className="p-1">{plant.id}</td>
                  <td className="p-1">{plant.name}</td>
                  <td className="p-1">
                    {plant.latitude} ({typeof plant.latitude})
                  </td>
                  <td className="p-1">
                    {plant.longitude} ({typeof plant.longitude})
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default function MapPage() {
  const router = useRouter();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [mapRef, setMapRef] = useState<google.maps.Map | null>(null);
  const dropdownRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});

  // Estados para o cálculo de rota
  const [currentPosition, setCurrentPosition] =
    useState<google.maps.LatLngLiteral | null>(null);
  const [directions, setDirections] =
    useState<google.maps.DirectionsResult | null>(null);
  const [distance, setDistance] = useState<string | null>(null);
  const [duration, setDuration] = useState<string | null>(null);
  const [arrivalTime, setArrivalTime] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [maintenance, setMaintenance] = useState<Maintenance | null>(null);
  const [isCalculatingRoute, setIsCalculatingRoute] = useState(false);

  // Estado para controlar se os marcadores foram adicionados
  const [markersAdded, setMarkersAdded] = useState(false);

  // Função para buscar as usinas
  useEffect(() => {
    async function fetchPlants() {
      try {
        setIsLoading(true);
        const response = await fetch("/api/plants");

        if (!response.ok) {
          if (response.status === 401) {
            // Redirecionar para login se não estiver autenticado
            router.push("/sign-in");
            return;
          }
          throw new Error(`Erro ao buscar usinas: ${response.status}`);
        }

        const data = await response.json();

        const processedData = data.map((plant: any) => {
          return {
            ...plant,
            latitude:
              typeof plant.latitude === "string"
                ? Number.parseFloat(plant.latitude)
                : plant.latitude,
            longitude:
              typeof plant.longitude === "string"
                ? Number.parseFloat(plant.longitude)
                : plant.longitude,
          };
        });

        setPlants(processedData);
      } catch (error) {
        console.error("Erro ao buscar usinas:", error);
        setError(
          "Não foi possível carregar as usinas. Tente novamente mais tarde."
        );
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlants();
  }, [router]);

  useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setCurrentPosition({
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.error("Erro ao obter localização:", error);
          setError(
            "Não foi possível obter sua localização atual. Verifique as permissões do navegador."
          );
        }
      );
    } else {
      setError("Geolocalização não é suportada pelo seu navegador.");
    }
  }, []);

  // Buscar informações de manutenção quando uma usina é selecionada
  useEffect(() => {
    if (selectedPlant) {
      fetchMaintenanceInfo(selectedPlant.id);
    } else {
      setMaintenance(null);
      setDirections(null);
      setDistance(null);
      setDuration(null);
      setArrivalTime(null);
    }
  }, [selectedPlant]);

  // Função para buscar informações de manutenção
  const fetchMaintenanceInfo = async (plantId: number) => {
    try {
      // Corrigido o erro de digitação na rota
      const response = await fetch(`/api/plants/${plantId}/manutencao`);
      if (response.ok) {
        const data = await response.json();
        if (data && data.id) {
          setMaintenance(data);
        }
      }
    } catch (error) {
      console.error("Erro ao buscar informações de manutenção:", error);
    }
  };

  // Função para calcular rota até a usina selecionada
  const calculateRoute = async () => {
    if (!selectedPlant || !currentPosition) {
      setError(
        "Não foi possível calcular a rota. Verifique se a usina está selecionada e se sua localização está disponível."
      );
      return;
    }

    setIsCalculatingRoute(true);
    setError(null);

    const directionsService = new window.google.maps.DirectionsService();

    const destination = {
      lat:
        typeof selectedPlant.latitude === "number"
          ? selectedPlant.latitude
          : Number(selectedPlant.latitude),
      lng:
        typeof selectedPlant.longitude === "number"
          ? selectedPlant.longitude
          : Number(selectedPlant.longitude),
    };

    directionsService.route(
      {
        origin: currentPosition,
        destination,
        travelMode: window.google.maps.TravelMode.DRIVING,
      },
      async (
        result: google.maps.DirectionsResult | null,
        status: google.maps.DirectionsStatus
      ) => {
        setIsCalculatingRoute(false);

        if (status === window.google.maps.DirectionsStatus.OK && result) {
          setDirections(result);

          const leg = result.routes[0].legs[0];
          setDistance(leg.distance?.text ?? null);
          setDuration(leg.duration?.text ?? null);

          const now = new Date();
          const arrival = new Date(
            now.getTime() + (leg.duration?.value ?? 0) * 1000
          );
          setArrivalTime(arrival.toLocaleTimeString());

          // Salvar no backend se houver manutenção
          if (maintenance) {
            await saveRouteInfo(
              leg.distance?.text,
              leg.duration?.text,
              arrival
            );
          }
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
    if (!maintenance) return;

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

  // Função para lidar com o carregamento do mapa
  const onLoad = (map: google.maps.Map) => {
    setMapRef(map);
    console.log("Mapa carregado com sucesso");
  };

  // Função para centralizar o mapa em uma usina
  const centerMapOnPlant = (plant: Plant) => {
    if (mapRef) {
      mapRef.panTo({ lat: plant.latitude, lng: plant.longitude });
      mapRef.setZoom(10);
    }
  };

  // Limpar rota
  const clearRoute = () => {
    setDirections(null);
    setDistance(null);
    setDuration(null);
    setArrivalTime(null);
  };

  // Função para adicionar marcadores manualmente
  const addMarkersManually = () => {
    if (!mapRef || plants.length === 0 || markersAdded) return;

    plants.forEach((plant) => {
      if (
        typeof plant.latitude === "number" &&
        typeof plant.longitude === "number"
      ) {
        const marker = new window.google.maps.Marker({
          position: { lat: plant.latitude, lng: plant.longitude },
          map: mapRef,
          title: plant.name,
        });

        marker.addListener("click", () => {
          setSelectedPlant(plant);
          centerMapOnPlant(plant);
        });
      }
    });

    setMarkersAdded(true);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-6">
        {error && (
          <Alert variant="destructive" className="mb-4">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Erro</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {plants.length === 0 && !isLoading && (
          <Alert className="mb-4">
            <Info className="h-4 w-4" />
            <AlertTitle>Nenhuma usina encontrada</AlertTitle>
            <AlertDescription>
              Você ainda não cadastrou nenhuma usina. Clique no botão "Adicionar
              Usina" para começar.
            </AlertDescription>
          </Alert>
        )}

        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex justify-center items-center h-[600px]">
                <p>Carregando mapa...</p>
              </div>
            ) : (
              <LoadScript
                googleMapsApiKey={
                  process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || ""
                }
              >
                <GoogleMap
                  mapContainerStyle={containerStyle}
                  center={center}
                  zoom={5}
                  onLoad={onLoad}
                >
                  {/* Marcador da posição atual */}
                  {currentPosition && (
                    <MarkerF
                      position={currentPosition}
                      icon={{
                        url: "https://maps.google.com/mapfiles/ms/icons/blue-dot.png",
                      }}
                    />
                  )}

                  {/* Marcadores das usinas */}
                  {plants.map((plant) => {
                    // Verifica se lat e lng são números válidos
                    if (
                      typeof plant.latitude === "number" &&
                      typeof plant.longitude === "number"
                    ) {
                      return (
                        <div key={plant.id}>
                          <MarkerF
                            position={{
                              lat: plant.latitude,
                              lng: plant.longitude,
                            }}
                            onClick={() => {
                              setSelectedPlant(plant);
                              centerMapOnPlant(plant);
                            }}
                          />

                          {selectedPlant?.id === plant.id && (
                            <div>
                              <InfoWindowF
                                options={{
                                  pixelOffset: new google.maps.Size(0, -30), // opcional: move um pouco para cima
                                  disableAutoPan: true,
                                }}
                                position={{
                                  lat: plant.latitude,
                                  lng: plant.longitude,
                                }}
                                onCloseClick={() => {
                                  setSelectedPlant(null);
                                  clearRoute();
                                }}
                              >
                                <div className="bg-gray-800 text-white rounded-lg shadow-lg p-4 max-w-xs">
                                  <PlantDropdownMenu
                                    plant={plant}
                                    onViewRoute={calculateRoute}
                                    distance={distance}
                                    duration={duration}
                                    arrivalTime={arrivalTime}
                                    isCalculatingRoute={isCalculatingRoute}
                                    hasRoute={!!directions}
                                    onClearRoute={clearRoute}
                                  />
                                </div>
                              </InfoWindowF>
                            </div>
                          )}
                        </div>
                      );
                    } else {
                      return null; // Retorna null se a posição não for válida
                    }
                  })}

                  {/* Renderização da rota */}
                  {directions && <DirectionsRenderer directions={directions} />}
                </GoogleMap>
              </LoadScript>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}

// Componente de dropdown para detalhes da usina
function PlantDropdownMenu({
  plant,
  onViewRoute,
  distance,
  duration,
  arrivalTime,
  isCalculatingRoute,
  hasRoute,
  onClearRoute,
}: {
  plant: Plant;
  onViewRoute: () => void;
  distance: string | null;
  duration: string | null;
  arrivalTime: string | null;
  isCalculatingRoute: boolean;
  hasRoute: boolean;
  onClearRoute: () => void;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <div className="flex items-center space-x-2 cursor-pointer">
          <h3 className="font-bold">{plant.name}</h3>
          <Info className="h-4 w-4 text-blue-600" />
        </div>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="start" className="w-72">
        <DropdownMenuLabel>Detalhes da Usina</DropdownMenuLabel>
        <div className="px-2 py-1 text-sm text-muted-foreground space-y-1">
          <p>
            <strong>Endereço:</strong> {plant.address}
          </p>
          <p>
            <strong>Status:</strong> {plant.status || "Operacional"}
          </p>
          <p>
            <strong>Latitude:</strong> {plant.latitude.toString()}
          </p>
          <p>
            <strong>Longitude:</strong> {plant.longitude.toString()}
          </p>
          <p>
            <strong>Última manutenção:</strong>{" "}
            {plant.lastMaintenanceDate
              ? new Date(plant.lastMaintenanceDate).toLocaleDateString()
              : "Não registrada"}
          </p>
          <p>
            <strong>Próxima manutenção:</strong>{" "}
            {plant.nextMaintenanceDate
              ? new Date(plant.nextMaintenanceDate).toLocaleDateString()
              : "Não agendada"}
          </p>
          {plant.maintenanceSequenceOrder !== null &&
            plant.maintenanceSequenceOrder !== undefined && (
              <p>
                <strong>Ordem na sequência:</strong>{" "}
                {plant.maintenanceSequenceOrder}
              </p>
            )}
        </div>

        {hasRoute && (
          <>
            <DropdownMenuSeparator />
            <div className="px-2 py-1 text-sm space-y-1">
              <p className="font-medium">Informações da Rota:</p>
              <div className="flex items-center text-muted-foreground">
                <Navigation className="h-4 w-4 mr-1" />
                <span>Distância: {distance}</span>
              </div>
              <div className="flex items-center text-muted-foreground">
                <Clock className="h-4 w-4 mr-1" />
                <span>Tempo estimado: {duration}</span>
              </div>
              {arrivalTime && (
                <div className="flex items-center text-muted-foreground">
                  <Clock className="h-4 w-4 mr-1" />
                  <span>Chegada estimada: {arrivalTime}</span>
                </div>
              )}
            </div>
          </>
        )}

        <DropdownMenuSeparator />
        <div className="px-2 py-1">
          {!hasRoute ? (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onViewRoute}
              disabled={isCalculatingRoute}
            >
              {isCalculatingRoute
                ? "Calculando..."
                : "Calcular rota até esta usina"}
            </Button>
          ) : (
            <Button
              variant="outline"
              size="sm"
              className="w-full"
              onClick={onClearRoute}
            >
              Limpar rota
            </Button>
          )}
        </div>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
