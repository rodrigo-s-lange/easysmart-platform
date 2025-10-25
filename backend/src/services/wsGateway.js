/**
 * WebSocket Gateway Service
 * 
 * Broadcaster de telemetria MQTT para clientes WebSocket.
 * Permite frontend receber dados em tempo real.
 * 
 * Arquitetura:
 * MQTT Broker → Backend MQTT Service → WebSocket Gateway → Frontend
 */

const WebSocket = require('ws');
const mqtt = require('mqtt');
const logger = require('../config/logger');

class WebSocketGateway {
  constructor() {
    this.wss = null;
    this.mqttClient = null;
    this.clients = new Map(); // userId -> WebSocket[]
    this.subscriptions = new Map(); // userId -> Set<topics>
  }

  /**
   * Inicia WebSocket Server
   */
  start(server) {
    this.wss = new WebSocket.Server({ 
      server,
      path: '/ws/telemetry',
    });

    this.wss.on('connection', (ws, req) => {
      this.handleConnection(ws, req);
    });

    // Conectar ao MQTT para broadcast
    this.connectMQTT();

    logger.info('WebSocket Gateway iniciado em /ws/telemetry');
  }

  /**
   * Conecta ao MQTT para escutar telemetria
   */
  connectMQTT() {
    const mqttUrl = `mqtt://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`;
    
    this.mqttClient = mqtt.connect(mqttUrl, {
      username: process.env.MQTT_USERNAME,
      password: process.env.MQTT_PASSWORD,
      clientId: `easysmart-ws-gateway-${Date.now()}`,
    });

    this.mqttClient.on('connect', () => {
      logger.info('WebSocket Gateway conectado ao MQTT');
      
      // Subscribe a todos tópicos de telemetria
      this.mqttClient.subscribe('easysmart/+/sensor/+/state');
      this.mqttClient.subscribe('easysmart/+/switch/+/state');
      this.mqttClient.subscribe('easysmart/+/binary_sensor/+/state');
      this.mqttClient.subscribe('easysmart/+/availability');
    });

    this.mqttClient.on('message', (topic, message) => {
      this.handleMQTTMessage(topic, message.toString());
    });

    this.mqttClient.on('error', (err) => {
      logger.error({ err }, 'Erro MQTT no WebSocket Gateway');
    });
  }

  /**
   * Handle nova conexão WebSocket
   */
  handleConnection(ws, req) {
    const connectionId = Math.random().toString(36).substring(7);
    
    logger.info({ connectionId, ip: req.socket.remoteAddress }, 'Nova conexão WebSocket');

    // Estado da conexão
    ws.userId = null;
    ws.tenantId = null;
    ws.connectionId = connectionId;
    ws.isAlive = true;

    // Heartbeat
    ws.on('pong', () => {
      ws.isAlive = true;
    });

    // Mensagens do cliente
    ws.on('message', (data) => {
      try {
        const message = JSON.parse(data);
        this.handleClientMessage(ws, message);
      } catch (err) {
        logger.error({ err, data: data.toString() }, 'Erro ao parsear mensagem WebSocket');
        this.sendError(ws, 'Invalid JSON');
      }
    });

    // Desconexão
    ws.on('close', () => {
      this.handleDisconnection(ws);
    });

    // Erro
    ws.on('error', (err) => {
      logger.error({ err, connectionId }, 'Erro WebSocket');
    });

    // Enviar welcome
    this.send(ws, {
      type: 'welcome',
      connectionId,
      message: 'Connected to EasySmart WebSocket Gateway',
    });
  }

  /**
   * Handle mensagens do cliente
   */
  handleClientMessage(ws, message) {
    const { type, token, deviceId, entityId } = message;

    switch (type) {
      case 'auth':
        this.handleAuth(ws, token);
        break;

      case 'subscribe':
        this.handleSubscribe(ws, deviceId, entityId);
        break;

      case 'unsubscribe':
        this.handleUnsubscribe(ws, deviceId, entityId);
        break;

      case 'ping':
        this.send(ws, { type: 'pong' });
        break;

      default:
        this.sendError(ws, `Unknown message type: ${type}`);
    }
  }

  /**
   * Autenticar cliente
   */
  handleAuth(ws, token) {
    try {
      const jwt = require('jsonwebtoken');
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      ws.userId = decoded.userId;
      ws.tenantId = decoded.tenantId;
      ws.role = decoded.role;

      // Adicionar ao mapa de clientes
      if (!this.clients.has(ws.userId)) {
        this.clients.set(ws.userId, []);
      }
      this.clients.get(ws.userId).push(ws);

      this.send(ws, {
        type: 'auth_success',
        userId: ws.userId,
        role: ws.role,
      });

      logger.info({ 
        userId: ws.userId, 
        tenantId: ws.tenantId,
        connectionId: ws.connectionId,
      }, 'Cliente WebSocket autenticado');

    } catch (err) {
      logger.warn({ err }, 'Falha na autenticação WebSocket');
      this.sendError(ws, 'Authentication failed');
      ws.close();
    }
  }

  /**
   * Subscribe em device/entity específico
   */
  handleSubscribe(ws, deviceId, entityId) {
    if (!ws.userId) {
      return this.sendError(ws, 'Not authenticated');
    }

    const topic = entityId 
      ? `easysmart/${deviceId}/+/${entityId}/state`
      : `easysmart/${deviceId}/#`;

    if (!this.subscriptions.has(ws.userId)) {
      this.subscriptions.set(ws.userId, new Set());
    }

    this.subscriptions.get(ws.userId).add(topic);

    this.send(ws, {
      type: 'subscribed',
      deviceId,
      entityId,
      topic,
    });

    logger.debug({ userId: ws.userId, topic }, 'Cliente subscribed');
  }

  /**
   * Unsubscribe
   */
  handleUnsubscribe(ws, deviceId, entityId) {
    if (!ws.userId) return;

    const topic = entityId 
      ? `easysmart/${deviceId}/+/${entityId}/state`
      : `easysmart/${deviceId}/#`;

    if (this.subscriptions.has(ws.userId)) {
      this.subscriptions.get(ws.userId).delete(topic);
    }

    this.send(ws, {
      type: 'unsubscribed',
      deviceId,
      entityId,
    });
  }

  /**
   * Handle mensagens MQTT e broadcast para clientes
   */
  handleMQTTMessage(topic, payload) {
    const parts = topic.split('/');
console.log('[WS-DEBUG] MQTT Message:', topic, 'payload:', payload);
    // easysmart/{device_id}/{type}/{entity_id}/state
    if (parts.length === 5 && parts[4] === 'state') {
      const [, deviceId, entityType, entityId] = parts;

      let value;
      try {
        value = JSON.parse(payload);
      } catch {
        value = payload;
      }

      const telemetryMessage = {
        type: 'telemetry',
        deviceId,
        entityType,
        entityId,
        value,
        timestamp: new Date().toISOString(),
      };

      // Broadcast para clientes interessados
      this.broadcast(deviceId, entityId, telemetryMessage);
    }

    // easysmart/{device_id}/availability
    if (parts.length === 3 && parts[2] === 'availability') {
      const [, deviceId] = parts;

      const availabilityMessage = {
        type: 'availability',
        deviceId,
        status: payload, // "online" ou "offline"
        timestamp: new Date().toISOString(),
      };

      this.broadcast(deviceId, null, availabilityMessage);
    }
  }

  /**
   * Broadcast mensagem para clientes interessados
   */
  broadcast(deviceId, entityId, message) {
    console.log("[WS-DEBUG] Broadcasting:", message.type, "deviceId:", deviceId, "to", this.wss?.clients?.size || 0, "clients");
    this.wss.clients.forEach((ws) => {
      if (ws.readyState === WebSocket.OPEN && ws.userId) {
        // TODO: Verificar se cliente tem acesso ao device (tenant_id)
        // Por enquanto, broadcast para todos autenticados
        
        const userSubs = this.subscriptions.get(ws.userId);
        if (!userSubs || userSubs.size === 0) {
          // Sem filtro, enviar tudo
          this.send(ws, message);
          return;
        }

        // Verificar se subscrição match
        for (const subTopic of userSubs) {
          if (this.topicMatches(deviceId, entityId, subTopic)) {
            this.send(ws, message);
            break;
          }
        }
      }
    });
  }

  /**
   * Verificar se tópico match com subscrição
   */
  topicMatches(deviceId, entityId, subscription) {
    const subParts = subscription.split('/');
    
    // easysmart/{deviceId}/#
    if (subParts[1] === deviceId && subParts[2] === '#') {
      return true;
    }

    // easysmart/{deviceId}/+/{entityId}/state
    if (subParts[1] === deviceId && subParts[3] === entityId) {
      return true;
    }

    return false;
  }

  /**
   * Handle desconexão
   */
  handleDisconnection(ws) {
    logger.info({ 
      userId: ws.userId, 
      connectionId: ws.connectionId,
    }, 'Cliente WebSocket desconectado');

    // Remover do mapa de clientes
    if (ws.userId && this.clients.has(ws.userId)) {
      const userClients = this.clients.get(ws.userId);
      const index = userClients.indexOf(ws);
      if (index !== -1) {
        userClients.splice(index, 1);
      }
      if (userClients.length === 0) {
        this.clients.delete(ws.userId);
        this.subscriptions.delete(ws.userId);
      }
    }
  }

  /**
   * Enviar mensagem para cliente
   */
  send(ws, data) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(data));
    }
  }

  /**
   * Enviar erro
   */
  sendError(ws, error) {
    this.send(ws, {
      type: 'error',
      error,
    });
  }

  /**
   * Heartbeat para detectar conexões mortas
   */
  startHeartbeat() {
    setInterval(() => {
      this.wss.clients.forEach((ws) => {
        if (!ws.isAlive) {
          logger.debug({ connectionId: ws.connectionId }, 'Conexão WebSocket morta');
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 segundos
  }

  /**
   * Estatísticas
   */
  getStats() {
    return {
      totalConnections: this.wss.clients.size,
      authenticatedUsers: this.clients.size,
      totalSubscriptions: Array.from(this.subscriptions.values())
        .reduce((sum, set) => sum + set.size, 0),
    };
  }

  /**
   * Fechar gateway
   */
  close() {
    if (this.mqttClient) {
      this.mqttClient.end();
    }
    if (this.wss) {
      this.wss.close();
    }
    logger.info('WebSocket Gateway fechado');
  }
}

// Singleton
const wsGateway = new WebSocketGateway();

module.exports = wsGateway;
