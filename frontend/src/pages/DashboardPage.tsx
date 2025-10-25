/**
 * Dashboard Page - Real-time com WebSocket único
 */
import { MqttTelemetryProvider } from '../providers/MqttTelemetryProvider';
import { RealtimeTelemetryCard, RealtimeTelemetryCardCompact } from '../components/RealtimeTelemetryCard';
import { RealtimeChart } from '../components/RealtimeChart';
import { DeviceStatusGrid } from '../components/DeviceStatusGrid';

export function DashboardPage() {
  // Configuração de devices
  const devices = [
    {
      id: 'esp32s3-lab',
      name: 'ESP32-S3 Lab',
      location: 'Laboratório Principal',
      type: 'Sensor Ambiental',
      icon: '🌡️',
      keyEntities: ['temperature'],
    },
    {
      id: 'esp32-lab',
      name: 'ESP32 Lab',
      location: 'Laboratório Secundário',
      type: 'Sensor de Temperatura',
      icon: '🔬',
      keyEntities: ['temperature'],
    },
  ];

  return (
    <MqttTelemetryProvider>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Header */}
        <header className="bg-white dark:bg-gray-800 shadow">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Dashboard Real-Time
            </h1>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Meus Devices */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Meus Devices
            </h2>
            <DeviceStatusGrid devices={devices} />
          </section>

          {/* Telemetrias Principais */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Telemetrias Principais
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <RealtimeTelemetryCard
                deviceId="esp32s3-lab"
                entityId="temperature"
                entityName="Temperatura Lab"
                icon="🌡️"
              />
              <RealtimeTelemetryCard
                deviceId="esp32-lab"
                entityId="temperature"
                entityName="Temperatura Lab 2"
                icon="🔬"
              />
              <RealtimeTelemetryCard
                deviceId="esp32s3-lab"
                entityId="button"
                entityName="Botão"
                icon="🔘"
              />
            </div>
          </section>

          {/* Gráficos Real-time */}
          <section className="mb-8">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Gráficos Real-time
            </h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <RealtimeChart
                deviceId="esp32s3-lab"
                entityId="temperature"
                entityName="Temperatura ESP32-S3"
                unit="°C"
                maxPoints={20}
              />
              <RealtimeChart
                deviceId="esp32-lab"
                entityId="temperature"
                entityName="Temperatura ESP32"
                unit="°C"
                maxPoints={20}
              />
            </div>
          </section>

          {/* Resumo Rápido */}
          <section>
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Resumo Rápido
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <RealtimeTelemetryCardCompact
                deviceId="esp32s3-lab"
                entityId="temperature"
                icon="🌡️"
              />
              <RealtimeTelemetryCardCompact
                deviceId="esp32-lab"
                entityId="temperature"
                icon="🔬"
              />
              <RealtimeTelemetryCardCompact
                deviceId="esp32s3-lab"
                entityId="status_led"
                icon="💡"
              />
              <RealtimeTelemetryCardCompact
                deviceId="esp32s3-lab"
                entityId="button"
                icon="🔘"
              />
            </div>
          </section>
        </main>
      </div>
    </MqttTelemetryProvider>
  );
}
