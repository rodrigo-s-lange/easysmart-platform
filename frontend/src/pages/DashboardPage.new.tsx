/**
 * DashboardPage - VERSÃO COM API REAL
 *
 * Agora busca devices da API ao invés de hardcode
 */

import { DashboardHeader } from '../components/DashboardHeader';
import { MqttTelemetryProvider } from '../providers/MqttTelemetryProvider';
import { CollapsibleDeviceCard } from '../components/CollapsibleDeviceCard';
import { useDevices } from '../hooks/useDevices';

export function DashboardPage() {
  const { devices, loading, error, refetch } = useDevices({
    autoRefresh: true,
    refreshInterval: 60000, // Refresh a cada 60s
  });

  return (
    <MqttTelemetryProvider>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 dark:from-gray-900 dark:via-purple-900 dark:to-gray-900">
        <DashboardHeader />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          {/* Header */}
          <div className="mb-6 flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-gray-900 dark:text-white drop-shadow-lg">
                📊 Dashboard
              </h2>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Monitoramento em tempo real dos dispositivos
              </p>
            </div>

            {/* Botão de refresh */}
            <button
              onClick={refetch}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg shadow-lg transition-all transform hover:scale-105 disabled:scale-100 disabled:cursor-not-allowed"
            >
              <svg
                className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {loading ? 'Atualizando...' : 'Atualizar'}
            </button>
          </div>

          {/* Loading State */}
          {loading && devices.length === 0 && (
            <div className="flex flex-col items-center justify-center py-20">
              <svg
                className="animate-spin h-12 w-12 text-blue-600 mb-4"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <p className="text-gray-600 dark:text-gray-400 font-medium">
                Carregando devices...
              </p>
            </div>
          )}

          {/* Error State */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-800 rounded-xl p-6">
              <div className="flex items-start gap-4">
                <svg
                  className="w-6 h-6 text-red-600 dark:text-red-400 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                <div className="flex-1">
                  <h3 className="text-red-800 dark:text-red-300 font-bold mb-1">
                    Erro ao carregar devices
                  </h3>
                  <p className="text-red-700 dark:text-red-400 text-sm">{error}</p>
                  <button
                    onClick={refetch}
                    className="mt-3 text-sm text-red-600 dark:text-red-400 hover:underline font-medium"
                  >
                    Tentar novamente
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Empty State */}
          {!loading && !error && devices.length === 0 && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl p-12 text-center">
              <svg
                className="w-20 h-20 mx-auto mb-4 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z"
                />
              </svg>
              <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                Nenhum device encontrado
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-6">
                Provisione seu primeiro dispositivo para começar o monitoramento.
              </p>
              <button className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium shadow-lg transition-all transform hover:scale-105">
                Adicionar Device
              </button>
            </div>
          )}

          {/* Devices Grid */}
          {!loading && !error && devices.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {devices.map((device) => (
                <CollapsibleDeviceCard key={device.mqttId || device.id} device={device} />
              ))}
            </div>
          )}

          {/* Footer Info */}
          {!loading && devices.length > 0 && (
            <div className="mt-6 text-center text-sm text-gray-500 dark:text-gray-400">
              <p>
                Mostrando {devices.length} dispositivo{devices.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </div>
    </MqttTelemetryProvider>
  );
}
