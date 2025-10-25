import { createContext, useContext, ReactNode } from 'react';
import { useMqttTelemetry } from '../hooks/useMqttTelemetry';

interface MqttTelemetryContextType {
  telemetry: Map<string, any>;
  availability: Map<string, string>;
  status: 'disconnected' | 'connecting' | 'connected';
  isConnected: boolean;
  subscribe: (deviceId: string, entityId?: string) => void;
  unsubscribe: (deviceId: string, entityId?: string) => void;
}

const MqttTelemetryContext = createContext<MqttTelemetryContextType | null>(null);

export function MqttTelemetryProvider({ children }: { children: ReactNode }) {
  const mqttData = useMqttTelemetry();

  return (
    <MqttTelemetryContext.Provider value={mqttData}>
      {children}
    </MqttTelemetryContext.Provider>
  );
}

export function useMqttTelemetryContext() {
  const context = useContext(MqttTelemetryContext);
  
  if (!context) {
    throw new Error('useMqttTelemetryContext must be used within MqttTelemetryProvider');
  }
  
  return context;
}
