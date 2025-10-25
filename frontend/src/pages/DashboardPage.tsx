/**
 * DashboardPage - Gradient VIBRANTE ciano → roxo
 */

import { CollapsibleDeviceCard } from '../components/CollapsibleDeviceCard';
import { useMqttTelemetryContext } from '../providers/MqttTelemetryProvider';

export function DashboardPage() {
  const { isConnected, status } = useMqttTelemetryContext();

  const devices = [
    {
      id: 'esp32s3-lab',
      name: 'ESP32-S3 Lab',
      location: 'Laboratório Principal',
      icon: '🌡️',
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
          id: 'button',
          name: 'Botão',
          type: 'binary_sensor' as const,
          icon: '🔘',
          hasHistory: false,
        },
        {
          id: 'status_led',
          name: 'LED Status',
          type: 'switch' as const,
          icon: '💡',
          hasHistory: false,
        },
      ],
    },
    {
      id: 'esp32-lab',
      name: 'ESP32 Lab',
      location: 'Laboratório Secundário',
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
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-400 via-purple-500 to-purple-700">
      {/* Animated Background Blobs */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-20 -left-20 w-96 h-96 bg-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute top-1/4 -right-20 w-96 h-96 bg-purple-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        <div className="absolute -bottom-20 left-1/3 w-96 h-96 bg-pink-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-4000"></div>
      </div>

      {/* Content */}
      <div className="relative">
        {/* Header */}
        <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-10 shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-white/20 rounded-lg shadow-lg">
                  <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-white drop-shadow-lg">
                    EasySmart Platform
                  </h1>
                  <p className="text-sm text-white/90 drop-shadow">
                    Monitoramento em Tempo Real
                  </p>
                </div>
              </div>

              {/* Connection Status */}
              <div className="flex items-center gap-2 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-full border border-white/30 shadow-lg">
                <div
                  className={`w-2.5 h-2.5 rounded-full shadow-lg ${
                    isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'
                  }`}
                />
                <span className="text-sm text-white font-medium drop-shadow">
                  {status === 'connected'
                    ? 'Conectado'
                    : status === 'connecting'
                    ? 'Conectando...'
                    : 'Desconectado'}
                </span>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/15 backdrop-blur-md border border-white/30 rounded-xl p-6 text-white shadow-xl transform transition-all hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Total Devices</p>
                  <p className="text-5xl font-bold mt-2 drop-shadow-lg">{devices.length}</p>
                </div>
                <div className="text-6xl opacity-70">📱</div>
              </div>
            </div>

            <div className="bg-white/15 backdrop-blur-md border border-white/30 rounded-xl p-6 text-white shadow-xl transform transition-all hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Online</p>
                  <p className="text-5xl font-bold mt-2 text-green-300 drop-shadow-lg">
                    {devices.length}
                  </p>
                </div>
                <div className="text-6xl opacity-70">✅</div>
              </div>
            </div>

            <div className="bg-white/15 backdrop-blur-md border border-white/30 rounded-xl p-6 text-white shadow-xl transform transition-all hover:scale-105">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/80 text-sm font-medium">Entidades</p>
                  <p className="text-5xl font-bold mt-2 drop-shadow-lg">
                    {devices.reduce((sum, d) => sum + d.entities.length, 0)}
                  </p>
                </div>
                <div className="text-6xl opacity-70">📊</div>
              </div>
            </div>
          </div>

          {/* Devices Grid */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3 drop-shadow-lg">
              <span>🔌 Meus Devices</span>
              <span className="text-base font-normal text-white/80 bg-white/20 px-3 py-1 rounded-full border border-white/30">
                {devices.length} ativos
              </span>
            </h2>
            {devices.map((device) => (
              <CollapsibleDeviceCard key={device.id} device={device} />
            ))}
          </div>
        </main>
      </div>

      <style>{`
        @keyframes blob {
          0%, 100% {
            transform: translate(0, 0) scale(1);
          }
          33% {
            transform: translate(40px, -60px) scale(1.15);
          }
          66% {
            transform: translate(-30px, 30px) scale(0.85);
          }
        }
        .animate-blob {
          animation: blob 8s infinite;
        }
        .animation-delay-2000 {
          animation-delay: 2s;
        }
        .animation-delay-4000 {
          animation-delay: 4s;
        }
      `}</style>
    </div>
  );
}
