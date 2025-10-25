/**
 * EntityLightSwitch
 * 
 * Componente reutilizável para controlar luzes/LEDs
 * Ex: LED Status, Luz Quarto, Strip LED, etc
 * 
 * Envia comando via API
 */

import { useState } from 'react';
import api from '../lib/api';

interface EntityLightSwitchProps {
  deviceId: string;
  entityId: string;
  name: string;
  value: any;
  icon?: string;
}

export function EntityLightSwitch({
  deviceId,
  entityId,
  name,
  value,
  icon = '💡',
}: EntityLightSwitchProps) {
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

      console.log(`[${deviceId}:${entityId}] 💡 Luz ${newState}`);
    } catch (err: any) {
      console.error(`[${deviceId}:${entityId}] Erro ao enviar comando:`, err);
      alert(err.response?.data?.error || 'Falha ao enviar comando');
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      {/* Left Side - Nome */}
      <div className="flex items-center gap-2">
        <span className="text-xl" title={name}>{icon}</span>
        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
          {name}
        </span>
      </div>

      {/* Right Side - Toggle Switch */}
      <button
        onClick={handleToggle}
        disabled={sending}
        className={`relative inline-flex items-center h-8 w-16 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-inner ${
          isOn
            ? 'bg-gradient-to-r from-yellow-400 to-yellow-500 focus:ring-yellow-500'
            : 'bg-gray-300 dark:bg-gray-600 focus:ring-gray-500'
        }`}
        title={`${isOn ? 'Desligar' : 'Ligar'} ${name}`}
      >
        {/* Bolinha */}
        <span
          className={`inline-block w-6 h-6 transform rounded-full bg-white shadow-lg transition-all duration-300 ${
            isOn ? 'translate-x-9' : 'translate-x-1'
          }`}
        >
          {sending ? (
            <svg
              className="animate-spin h-6 w-6 text-gray-400"
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
          ) : isOn ? (
            <span className="flex items-center justify-center h-full text-yellow-500">💡</span>
          ) : (
            <span className="flex items-center justify-center h-full text-gray-400">⚫</span>
          )}
        </span>

        {/* Label ON/OFF */}
        <span
          className={`absolute text-xs font-bold transition-opacity ${
            isOn
              ? 'left-2 text-white opacity-100'
              : 'left-2 text-transparent opacity-0'
          }`}
        >
          ON
        </span>
        <span
          className={`absolute text-xs font-bold transition-opacity ${
            isOn
              ? 'right-2 text-transparent opacity-0'
              : 'right-2 text-gray-600 dark:text-gray-300 opacity-100'
          }`}
        >
          OFF
        </span>
      </button>
    </div>
  );
}
