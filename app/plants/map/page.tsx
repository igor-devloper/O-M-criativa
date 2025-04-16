"use client";

import { Header } from "@/app/components/header";
import { Card, CardContent } from "@/app/components/ui/card";
import { useEffect, useState } from "react";
import {
  GoogleMap,
  LoadScript,
  Marker,
  InfoWindow,
} from "@react-google-maps/api";
import { useRouter } from "next/navigation";

// Tipo para as usinas
interface Plant {
  id: number;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
  next_maintenance_date: string | null;
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

export default function MapPage() {
  const router = useRouter();
  const [plants, setPlants] = useState<Plant[]>([]);
  const [selectedPlant, setSelectedPlant] = useState<Plant | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Função para buscar as usinas
  useEffect(() => {
    async function fetchPlants() {
      try {
        const response = await fetch("/api/plants");
        if (response.ok) {
          const data = await response.json();
          setPlants(data);
        }
      } catch (error) {
        console.error("Erro ao buscar usinas:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchPlants();
  }, []);

  // Função para calcular rota até a usina selecionada
  const calculateRoute = (plant: Plant) => {
    // Aqui você usaria a API de Direções do Google Maps
    // Por enquanto, apenas redirecionamos para a página de detalhes da usina
    router.push(`/plants/${plant.id}`);
  };

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-6">
        <h1 className="text-2xl font-bold mb-6">Mapa de Usinas</h1>

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
                >
                  {plants.map((plant) => {
                    // Verifica se lat e lng são números válidos
                    if (
                      typeof plant.latitude === "number" &&
                      typeof plant.longitude === "number"
                    ) {
                      return (
                        <Marker
                          key={plant.id}
                          position={{
                            lat: plant.latitude,
                            lng: plant.longitude,
                          }}
                          onClick={() => setSelectedPlant(plant)}
                        />
                      );
                    }
                    return null; // Retorna null se a posição não for válida
                  })}

                  {selectedPlant && (
                    <InfoWindow
                      position={{
                        lat: selectedPlant.latitude,
                        lng: selectedPlant.longitude,
                      }}
                      onCloseClick={() => setSelectedPlant(null)}
                    >
                      <div className="p-2">
                        <h3 className="font-bold">{selectedPlant.name}</h3>
                        <p className="text-sm">{selectedPlant.address}</p>
                        <p className="text-sm mt-2">
                          Próxima manutenção:{" "}
                          {selectedPlant.next_maintenance_date ||
                            "Não agendada"}
                        </p>
                        <button
                          className="mt-2 text-sm text-blue-600 hover:underline"
                          onClick={() => calculateRoute(selectedPlant)}
                        >
                          Ver rota até esta usina
                        </button>
                      </div>
                    </InfoWindow>
                  )}
                </GoogleMap>
              </LoadScript>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
