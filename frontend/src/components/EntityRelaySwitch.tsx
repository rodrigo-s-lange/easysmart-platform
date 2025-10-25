/**
 * EntityRelaySwitch
 * 
 * Componente reutilizável para controlar relés/tomadas
 * Ex: Relé 1, Tomada 2, Ventilador, Bomba, etc
 * 
 * Visual mais "industrial" que o LightSwitch
 */

import { useState } from 'react';
import api from '../lib/api';

interface EntityRelaySwitchProps {
  deviceId: string;
  entityId: string;
  name: string;
  value: any;
  icon?: string;
}

export function EntityRelaySwitch({
  deviceId,
  entityId,
  name,
  value,
  icon = '🔌',
}: EntityRelaySwitchProps) {
  const [sending, setSending] = useState(false);

  // Determinar estado atual
  const isOn = value === 'ON' || value === true || value === 1;

  const handleToggle = async () => {
    const newState = isOn ? 'OFF' : 'ON';
    
    setSending(true);
    
    try {
      await api.post('/api/v1/devices/command', {
        deviceId,
        entityId,
        command: newState,
      });

      console.log(`[${deviceId}:${entityId}] 🔌 Relé ${newState}`);
    } catch (err: any) {
      console.error(`[${deviceId}:${entityId}] Erro ao enviar comando:`, err);
      alert(err.response?.data?.error || 'Falha ao enviar comando');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border-2 border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      {/* Left Side - Nome */}
      <div className="flex items-center gap-2">
        <span className="text-xl" title={name}>{icon}</span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {name}
        </span>
      </div>

      {/* Right Side - Botão Industrial */}
      <button
        onClick={handleToggle}
        disabled={sending}
        className={`relative px-6 py-2 rounded-lg font-bold text-sm transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-md active:scale-95 ${
          isOn
            ? 'bg-gradient-to-br from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700'
            : 'bg-gradient-to-br from-red-500 to-red-600 text-white hover:from-red-600 hover:to-red-700'
        }`}
        title={`${isOn ? 'Desligar' : 'Ligar'} ${name}`}
      >
        {sending ? (
          <span className="flex items-center gap-2">
            <svg
              className="animate-spin h-4 w-4"
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
            <span>...</span>
          </span>
        ) : (
          <span className="flex items-center gap-2">
            {isOn ? (
              <>
                <span>⚡</span>
                <span>ON</span>
              </>
            ) : (
              <>
                <span>⭕</span>
                <span>OFF</span>
              </>
            )}
          </span>
        )}
      </button>
    </div>
  );
}