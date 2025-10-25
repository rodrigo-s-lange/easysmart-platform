// frontend/src/pages/RealtimePage.tsx
import { useEffect, useState } from "react";
import api from "../lib/api";
import DeviceCard from "../components/DeviceCard";

interface Device {
  id: string;
  name: string;
  metadata?: { id?: string };
}

export default function RealtimePage() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDevices = async () => {
      try {
        const { data } = await api.get("/api/v1/devices");
        if (data?.success && Array.isArray(data.devices)) {
          setDevices(data.devices);
        } else {
          console.warn("[Realtime] No devices found");
        }
      } catch (err: any) {
        console.error("[Realtime] Error loading devices:", err);
        setError("Erro ao carregar dispositivos");
      } finally {
        setLoading(false);
      }
    };

    fetchDevices();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-black text-gray-400 text-xl">
        Carregando dispositivos...
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center h-screen bg-black text-red-500 text-xl">
        {error}
      </div>
    );

  if (devices.length === 0)
    return (
      <div className="flex items-center justify-center h-screen bg-black text-gray-500 text-xl">
        Nenhum dispositivo encontrado.
      </div>
    );

  return (
    <div className="min-h-screen bg-gray-950 p-6 text-white">
      <h1 className="text-3xl font-bold mb-6 text-center text-green-400">
        EasySmart Realtime
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6 justify-items-center">
        {devices.map((dev) => (
          <DeviceCard
            key={dev.id}
            id={dev.id}
            name={dev.name}
            entityId="temp"
            entityName="Temperature"
          />
        ))}
      </div>
    </div>
  );
}
