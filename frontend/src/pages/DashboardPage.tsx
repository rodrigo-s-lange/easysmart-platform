import { useEffect } from "react";
import { RealtimeTelemetryCard } from "../components/RealtimeTelemetryCard";
import { DeviceStatusGrid } from "../components/DeviceStatusGrid";
import { useMqttTelemetry } from "../hooks/useMqttTelemetry";

export function DashboardPage() {
  const { connected, lastMessage } = useMqttTelemetry();

  useEffect(() => {
    console.log("[Dashboard] MQTT conectado:", connected);
    if (lastMessage) {
      console.log("[Dashboard] Última mensagem:", lastMessage);
    }
  }, [connected, lastMessage]);

  return (
    <div className="min-h-screen bg-gray-950 text-white p-6">
      <h1 className="text-2xl font-bold mb-6 text-green-400">
        EasySmart Dashboard
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <DeviceStatusGrid />
        <RealtimeTelemetryCard />
      </div>
    </div>
  );
}
