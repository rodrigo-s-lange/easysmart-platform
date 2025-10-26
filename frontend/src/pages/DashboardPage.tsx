import { DashboardHeader } from '../components/DashboardHeader';
import { MqttTelemetryProvider } from '../providers/MqttTelemetryProvider';
import { CollapsibleDeviceCard } from '../components/CollapsibleDeviceCard';

export function DashboardPage() {
  const devices = [
    {
      id: 'esp32s3-lab',
      mqttId: 'esp32s3-lab',
      name: 'ESP32S3 Lab Sensor',
      location: 'Laboratório Principal',
      icon: '🔬',
      entities: [
        {
          id: 'temperature',
          name: 'Temperatura',
          type: 'sensor' as const,
          unit: '°C',
          icon: '🌡️',
          hasHistory: true,
        },
        {
          id: 'humidity',
          name: 'Umidade',
          type: 'sensor' as const,
          unit: '%',
          icon: '💧',
          hasHistory: true,
        },
        {
          id: 'button',
          name: 'Botão',
          type: 'binary_sensor' as const,
          icon: '🔘',
        },
        {
          id: 'status_led',
          name: 'LED Status',
          type: 'switch' as const,
          icon: '💡',
          deviceClass: 'light',
        },
        {
          id: 'relay1',
          name: 'Relé 1',
          type: 'switch' as const,
          icon: '🔌',
        },
      ],
    },
    {
      id: 'esp32-demo',
      mqttId: 'esp32-demo',
      name: 'ESP32 Demo',
      location: 'Sala de Testes',
      icon: '🧪',
      entities: [
        {
          id: 'temperature',
          name: 'Temperatura',
          type: 'sensor' as const,
          unit: '°C',
          icon: '🌡️',
          hasHistory: true,
        },
        {
          id: 'led',
          name: 'LED',
          type: 'light' as const,
          icon: '💡',
        },
      ],
    },
  ];

  return (
    <MqttTelemetryProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
        <DashboardHeader />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white drop-shadow-lg">
              📊 Dashboard
            </h2>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Monitoramento em tempo real dos dispositivos
            </p>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {devices.map((device) => (
              <CollapsibleDeviceCard key={device.mqttId} device={device} />
            ))}
          </div>
        </div>
      </div>
    </MqttTelemetryProvider>
  );
}
