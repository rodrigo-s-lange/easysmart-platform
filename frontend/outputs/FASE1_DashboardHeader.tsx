/**
 * DashboardHeader
 * 
 * Header fixo com:
 * - Logo EasySmart
 * - Usuário logado
 * - Total devices / Online / Offline (colapsáveis)
 * - Logout
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useMqttTelemetryContext } from '../providers/MqttTelemetryProvider';
import api from '../lib/api';

interface Device {
  id: string;
  name: string;
  mqttId: string;
  status: 'online' | 'offline';
  lastSeen: string;
}

export function DashboardHeader() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const { availability, isConnected } = useMqttTelemetryContext();
  
  const [devices, setDevices] = useState<Device[]>([]);
  const [showDevicesList, setShowDevicesList] = useState(false);
  const [expandedSection, setExpandedSection] = useState<'online' | 'offline' | 'all' | null>(null);

  useEffect(() => {
    fetchDevices();
  }, []);

  // Atualizar status dos devices com availability do WebSocket
  useEffect(() => {
    if (devices.length > 0) {
      setDevices(prev => prev.map(device => ({
        ...device,
        status: availability.get(device.mqttId) === 'online' ? 'online' : 'offline'
      })));
    }
  }, [availability]);

  const fetchDevices = async () => {
    try {
      const response = await api.get('/api/v1/admin/devices');
      setDevices(response.data.devices || []);
    } catch (err) {
      console.error('Erro ao buscar devices:', err);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleSection = (section: 'online' | 'offline' | 'all') => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const onlineDevices = devices.filter(d => d.status === 'online');
  const offlineDevices = devices.filter(d => d.status === 'offline');

  return (
    <header className="bg-white/10 backdrop-blur-md border-b border-white/20 sticky top-0 z-50 shadow-lg">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          {/* Logo + Nome */}
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-lg shadow-lg">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div>
              <h1 className="text-xl font-bold text-white drop-shadow-lg">
                EasySmart Platform
              </h1>
              <p className="text-xs text-white/80 drop-shadow">
                Monitoramento Industrial
              </p>
            </div>
          </div>

          {/* Status + User Info */}
          <div className="flex items-center gap-4">
            {/* Devices Count - Colapsável */}
            <div className="relative">
              <button
                onClick={() => setShowDevicesList(!showDevicesList)}
                className="flex items-center gap-3 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30 hover:bg-white/25 transition-all shadow-lg"
              >
                <div className="flex items-center gap-2">
                  <span className="text-white font-bold text-lg">{devices.length}</span>
                  <span className="text-white/80 text-sm">devices</span>
                </div>
                <div className="h-6 w-px bg-white/30" />
                <div className="flex items-center gap-2">
                  <span className="text-green-300 font-bold">{onlineDevices.length}</span>
                  <span className="text-white/80 text-sm">online</span>
                </div>
                {offlineDevices.length > 0 && (
                  <>
                    <div className="h-6 w-px bg-white/30" />
                    <div className="flex items-center gap-2">
                      <span className="text-red-300 font-bold">{offlineDevices.length}</span>
                      <span className="text-white/80 text-sm">offline</span>
                    </div>
                  </>
                )}
                <svg
                  className={`w-4 h-4 text-white transition-transform ${showDevicesList ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown de Devices */}
              {showDevicesList && (
                <div className="absolute right-0 mt-2 w-96 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
                  {/* Online */}
                  <div className="border-b border-gray-200 dark:border-gray-700">
                    <button
                      onClick={() => toggleSection('online')}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="font-semibold text-green-600 dark:text-green-400">
                        🟢 Online ({onlineDevices.length})
                      </span>
                      <svg
                        className={`w-4 h-4 transition-transform ${expandedSection === 'online' ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedSection === 'online' && (
                      <div className="max-h-60 overflow-y-auto">
                        {onlineDevices.map(device => (
                          <div key={device.id} className="px-4 py-2 text-sm border-t border-gray-100 dark:border-gray-700">
                            <p className="font-medium text-gray-900 dark:text-white">{device.name}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{device.mqttId}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Offline */}
                  {offlineDevices.length > 0 && (
                    <div className="border-b border-gray-200 dark:border-gray-700">
                      <button
                        onClick={() => toggleSection('offline')}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      >
                        <span className="font-semibold text-red-600 dark:text-red-400">
                          🔴 Offline ({offlineDevices.length})
                        </span>
                        <svg
                          className={`w-4 h-4 transition-transform ${expandedSection === 'offline' ? 'rotate-180' : ''}`}
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                      {expandedSection === 'offline' && (
                        <div className="max-h-60 overflow-y-auto">
                          {offlineDevices.map(device => (
                            <div key={device.id} className="px-4 py-2 text-sm border-t border-gray-100 dark:border-gray-700">
                              <p className="font-medium text-gray-900 dark:text-white">{device.name}</p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">{device.mqttId}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Todos */}
                  <div>
                    <button
                      onClick={() => toggleSection('all')}
                      className="w-full flex items-center justify-between p-3 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                      <span className="font-semibold text-gray-700 dark:text-gray-300">
                        📋 Todos ({devices.length})
                      </span>
                      <svg
                        className={`w-4 h-4 transition-transform ${expandedSection === 'all' ? 'rotate-180' : ''}`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>
                    {expandedSection === 'all' && (
                      <div className="max-h-60 overflow-y-auto">
                        {devices
                          .sort((a, b) => new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime())
                          .map(device => (
                            <div key={device.id} className="px-4 py-2 text-sm border-t border-gray-100 dark:border-gray-700">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-gray-900 dark:text-white">{device.name}</p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">{device.mqttId}</p>
                                </div>
                                <span className={`text-xs font-semibold ${device.status === 'online' ? 'text-green-600' : 'text-red-600'}`}>
                                  {device.status}
                                </span>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* User Info */}
            <div className="flex items-center gap-3 bg-white/15 backdrop-blur-sm px-4 py-2 rounded-lg border border-white/30 shadow-lg">
              <div className="text-right">
                <p className="text-white font-medium text-sm">{user?.email || 'Usuário'}</p>
                <p className="text-white/70 text-xs">{user?.role || 'user'}</p>
              </div>
              <button
                onClick={handleLogout}
                className="p-2 bg-red-500/20 hover:bg-red-500/30 rounded-lg transition-colors"
                title="Logout"
              >
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>

            {/* Connection Status */}
            <div className="flex items-center gap-2">
              <div className={`w-2.5 h-2.5 rounded-full shadow-lg ${isConnected ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
              <span className="text-xs text-white/90 font-medium">
                {isConnected ? 'WS Conectado' : 'WS Desconectado'}
              </span>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
