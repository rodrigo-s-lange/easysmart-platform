// frontend/src/components/DeviceCard.tsx
import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import useTelemetry from "../hooks/useTelemetry";

interface DeviceCardProps {
  id: string;
  name: string;
  entityId?: string;
  entityName?: string;
}

export default function DeviceCard({ id, name, entityId = "temp", entityName = "Temperature" }: DeviceCardProps) {
  const { value, loading, error } = useTelemetry(id, entityId);
  const [unit] = useState("°C");

  return (
    <Card className="bg-gray-900 border-gray-700 text-gray-200 w-64 hover:shadow-lg transition-all">
      <CardContent className="p-4 flex flex-col items-center justify-center text-center">
        <h2 className="text-xl font-semibold mb-2 text-green-400">{name}</h2>
        {loading ? (
          <p className="text-gray-500">Carregando...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : value != null ? (
          <p className="text-4xl font-bold text-white">
            {value.toFixed(1)} <span className="text-green-500">{unit}</span>
          </p>
        ) : (
          <p className="text-gray-500">Sem dados</p>
        )}
        <p className="text-sm text-gray-400 mt-2">{entityName}</p>
      </CardContent>
    </Card>
  );
}
