/**
 * Types Centralizados - EasySmart Platform
 *
 * Definições de tipos compartilhados entre componentes
 */

// ============================================
// AUTH & USER
// ============================================

export interface User {
  id: string;
  email: string;
  tenantId: string;
  role: 'super_admin' | 'tenant_admin' | 'user';
  createdAt?: string;
}

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  tenant_name: string;
}

// ============================================
// DEVICES
// ============================================

export type DeviceStatus = 'online' | 'offline' | 'unknown';

export interface Device {
  id: string;
  mqttId: string; // ID usado no MQTT/WebSocket
  name: string;
  status: DeviceStatus;
  tenantId?: string;
  deviceToken?: string;
  metadata?: DeviceMetadata;
  lastSeen?: string;
  createdAt?: string;
  location?: string;
  icon?: string;
  entities?: Entity[];
}

export interface DeviceMetadata {
  id?: string;
  model?: string;
  manufacturer?: string;
  sw_version?: string;
  hw_version?: string;
  [key: string]: any; // Permite campos customizados
}

// ============================================
// ENTITIES
// ============================================

export type EntityType =
  | 'sensor'
  | 'binary_sensor'
  | 'switch'
  | 'light'
  | 'number'
  | 'text_sensor'
  | 'select'
  | 'button';

export interface Entity {
  id: string;
  entityId: string; // ID da entidade no device (ex: "temperature")
  deviceId: string;
  entityType: EntityType;
  name: string;
  unit?: string;
  icon?: string;
  deviceClass?: string;
  stateClass?: string;
  hasHistory?: boolean;
  min?: number;
  max?: number;
  step?: number;
  options?: string[]; // Para select
}

// ============================================
// TELEMETRY
// ============================================

export interface TelemetryPoint {
  _time: string;
  _value: number | string | boolean;
  deviceId?: string;
  entityId?: string;
}

export interface TelemetryData {
  type: 'telemetry';
  deviceId: string;
  entityType: string;
  entityId: string;
  value: number | string | boolean;
  timestamp: string;
}

export interface AvailabilityData {
  type: 'availability';
  deviceId: string;
  status: 'online' | 'offline';
  timestamp: string;
}

// ============================================
// WEBSOCKET MESSAGES
// ============================================

export interface WelcomeMessage {
  type: 'welcome';
  connectionId: string;
  message: string;
}

export interface AuthSuccessMessage {
  type: 'auth_success';
  userId: string;
  role: string;
}

export interface SubscribedMessage {
  type: 'subscribed';
  deviceId: string;
  entityId?: string;
}

export interface UnsubscribedMessage {
  type: 'unsubscribed';
  deviceId: string;
  entityId?: string;
}

export interface PongMessage {
  type: 'pong';
}

export interface ErrorMessage {
  type: 'error';
  error: string;
}

export type WebSocketMessage =
  | TelemetryData
  | AvailabilityData
  | WelcomeMessage
  | AuthSuccessMessage
  | SubscribedMessage
  | UnsubscribedMessage
  | PongMessage
  | ErrorMessage;

// ============================================
// API RESPONSES
// ============================================

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T = any> {
  data: T[];
  total: number;
  pagination: {
    limit: number;
    offset: number;
    hasMore?: boolean;
  };
}

export interface DevicesResponse {
  devices: Device[];
  total?: number;
  pagination?: {
    limit: number;
    offset: number;
    hasMore?: boolean;
  };
}

// ============================================
// DISCOVERY (UNS / Sparkplug B preparado)
// ============================================

export interface DiscoveryPayload {
  device: {
    id: string;
    name: string;
    model?: string;
    manufacturer?: string;
    sw_version?: string;
    hw_version?: string;
  };
  entities: Array<{
    type: EntityType;
    id: string;
    name: string;
    unit?: string;
    device_class?: string;
    state_class?: string;
    min?: number;
    max?: number;
    step?: number;
  }>;
}

// ============================================
// ADMIN
// ============================================

export interface Tenant {
  id: string;
  name: string;
  createdAt: string;
  status?: 'active' | 'inactive' | 'suspended';
  userCount?: number;
  deviceCount?: number;
}

export interface PlatformMetrics {
  platform: {
    total_tenants: number;
    new_tenants_30d: number;
    total_users: number;
    new_users_30d: number;
    total_devices: number;
    online_devices: number;
    new_devices_30d: number;
    active_devices_24h: number;
  };
  system: {
    uptime: number;
    version: string;
  };
}

// ============================================
// CHARTS
// ============================================

export interface ChartDataPoint {
  timestamp: string;
  value: number;
  label?: string;
}

export interface ChartConfig {
  title?: string;
  unit?: string;
  color?: string;
  aggregation?: 'mean' | 'min' | 'max' | 'count';
  window?: string; // ex: '1m', '5m', '1h'
}
