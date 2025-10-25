/**
 * EntitySlider
 * 
 * Componente reutilizável para controlar valores numéricos com slider
 * Ex: Brightness (0-255), Volume, Velocidade de Motor, PWM, etc
 * 
 * Suporta range customizado ou padrão 0-255
 */

import { useState, useEffect } from 'react';
import api from '../lib/api';

interface EntitySliderProps {
  deviceId: string;
  entityId: string;
  name: string;
  value: any;
  icon?: string;
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  showValue?: boolean; // Mostrar valor numérico
}

export function EntitySlider({
  deviceId,
  entityId,
  name,
  value,
  icon = '🎚️',
  min = 0,
  max = 255,
  step = 1,
  unit = '',
  showValue = true,
}: EntitySliderProps) {
  const [localValue, setLocalValue] = useState<number>(0);
  const [sending, setSending] = useState(false);

  // Sincronizar valor local com prop
  useEffect(() => {
    const numValue = parseFloat(value);
    if (!isNaN(numValue)) {
      setLocalValue(numValue);
    }
  }, [value]);

  // Enviar comando ao soltar o slider
  const handleChange = async (newValue: number) => {
    setLocalValue(newValue);
  };

  const handleMouseUp = async () => {
    setSending(true);
    
    try {
      await api.post('/api/v1/devices/command', {
        deviceId,
        entityId,
        command: String(localValue),
      });

      console.log(`[${deviceId}:${entityId}] 🎚️ Valor alterado para: ${localValue}`);
    } catch (err: any) {
      console.error(`[${deviceId}:${entityId}] Erro ao enviar comando:`, err);
      alert(err.response?.data?.error || 'Falha ao enviar comando');
    } finally {
      setSending(false);
    }
  };

  // Calcular percentual para visualização
  const percentage = ((localValue - min) / (max - min)) * 100;

  return (
    <div className="flex flex-col gap-2 p-3 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-md transition-shadow">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-xl" title={name}>{icon}</span>
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {name}
          </span>
        </div>

        {/* Valor Atual */}
        {showValue && (
          <div className="flex items-center gap-1">
            <span className="text-lg font-bold text-blue-600 dark:text-blue-400">
              {localValue}
            </span>
            {unit && (
              <span className="text-xs text-gray-500 dark:text-gray-400">
                {unit}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Slider */}
      <div className="relative">
        {/* Track Background */}
        <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          {/* Progress */}
          <div
            className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-150"
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Input Range */}
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={localValue}
          onChange={(e) => handleChange(parseFloat(e.target.value))}
          onMouseUp={handleMouseUp}
          onTouchEnd={handleMouseUp}
          disabled={sending}
          className="absolute top-0 left-0 w-full h-2 opacity-0 cursor-pointer disabled:cursor-not-allowed"
        />

        {/* Thumb Visual */}
        <div
          className={`absolute top-1/2 -translate-y-1/2 w-5 h-5 bg-white border-2 border-blue-500 rounded-full shadow-lg transition-all ${
            sending ? 'scale-110 animate-pulse' : ''
          }`}
          style={{ left: `calc(${percentage}% - 10px)` }}
        >
          {sending && (
            <svg
              className="absolute inset-0 animate-spin text-blue-500"
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
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
              ></path>
            </svg>
          )}
        </div>
      </div>

      {/* Labels Min/Max */}
      <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
        <span>{min}</span>
        <span>{max}</span>
      </div>
    </div>
  );
}
