const mqtt = require('mqtt');
const logger = require('../config/logger');
const { pool } = require('../config/database');
const influxService = require('./influxService');

let client = null;
let isConnected = false;

/**
 * Conecta ao broker MQTT e configura listeners
 */
async function connect() {
  const mqttUrl = `mqtt://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`;
  
  logger.info(`🔌 Conectando ao broker MQTT em ${mqttUrl}...`);

  client = mqtt.connect(mqttUrl, {
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD,
    clientId: `easysmart-backend-${Date.now()}`,
    clean: true,
    reconnectPeriod: 5000,
  });

  client.on('connect', () => {
    isConnected = true;
    logger.info('✅ Conectado ao broker MQTT');

    // Subscribe a tópicos de discovery
    client.subscribe('easysmart/+/discovery', (err) => {
      if (err) {
        logger.error({ err }, 'Erro ao se inscrever em discovery');
      }
    });

    // Subscribe a tópicos de telemetria
    client.subscribe('easysmart/+/sensor/+/state', (err) => {
      if (err) {
        logger.error({ err }, 'Erro ao se inscrever em sensor/state');
      }
    });

    client.subscribe('easysmart/+/switch/+/state', (err) => {
      if (err) {
        logger.error({ err }, 'Erro ao se inscrever em switch/state');
      }
    });

    client.subscribe('easysmart/+/binary_sensor/+/state', (err) => {
      if (err) {
        logger.error({ err }, 'Erro ao se inscrever em binary_sensor/state');
      }
    });

    logger.info('✅ Serviço MQTT ativo e escutando tópicos');
  });

  client.on('message', async (topic, message) => {
    try {
      await handleMessage(topic, message.toString());
    } catch (err) {
      logger.error({ err, topic }, 'Erro ao processar mensagem MQTT');
    }
  });

  client.on('error', (err) => {
    logger.error({ err }, 'Erro MQTT');
  });

  client.on('reconnect', () => {
    logger.warn('Reconectando ao MQTT...');
  });

  client.on('close', () => {
    isConnected = false;
    logger.warn('Conexão MQTT fechada');
  });
}

/**
 * Handle de mensagens MQTT
 */
async function handleMessage(topic, payload) {
  const parts = topic.split('/');

  // easysmart/{device}/discovery
  if (parts[2] === 'discovery') {
    await handleDiscovery(parts[1], payload);
    return;
  }

  // easysmart/{device}/{type}/{entity}/state
  if (parts.length === 5 && parts[4] === 'state') {
    await handleTelemetry({
      mqttId: parts[1],
      entityType: parts[2], // sensor, switch, binary_sensor
      entityId: parts[3],
      payload,
      topic,
    });
    return;
  }
}

/**
 * Handle de discovery (já existente)
 */
async function handleDiscovery(deviceId, payload) {
  logger.info({ topic: `easysmart/${deviceId}/discovery`, deviceId }, '📡 [DISCOVERY] Recebido discovery');

  try {
    const data = JSON.parse(payload);
    const { device, entities } = data;

    // Verifica se device já existe
    const deviceResult = await pool.query(
      'SELECT id, device_token FROM devices WHERE metadata->>\'mqtt_id\' = $1',
      [deviceId]
    );

    let deviceUuid;
    let deviceToken;

    if (deviceResult.rows.length === 0) {
      // Cria novo device
      deviceToken = `easysmrt_dev_${require('crypto').randomBytes(16).toString('hex')}`;
      
      const insertResult = await pool.query(
        `INSERT INTO devices (name, device_token, status, metadata, last_seen)
         VALUES ($1, $2, 'online', $3, NOW())
         RETURNING id`,
        [device.name || deviceId, deviceToken, JSON.stringify(device)]
      );

      deviceUuid = insertResult.rows[0].id;
      logger.info(`🆕 Device [${deviceId}] criado com token ${deviceToken}`);

      // Cache
      influxService.cacheDevice(deviceId, deviceUuid);
    } else {
      // Atualiza device existente
      deviceUuid = deviceResult.rows[0].id;
      deviceToken = deviceResult.rows[0].device_token;

      await pool.query(
        `UPDATE devices SET status = 'online', last_seen = NOW(), metadata = $1 WHERE id = $2`,
        [JSON.stringify(device), deviceUuid]
      );

      logger.info(`🔁 Device [${deviceId}] atualizado`);

      // Cache
      influxService.cacheDevice(deviceId, deviceUuid);
    }

    // Processa entities
    if (entities && Array.isArray(entities)) {
      for (const entity of entities) {
        await pool.query(
          `INSERT INTO entities (device_id, entity_type, entity_id, name, unit, device_class, metadata)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           ON CONFLICT (device_id, entity_id) DO UPDATE SET
             name = EXCLUDED.name,
             unit = EXCLUDED.unit,
             device_class = EXCLUDED.device_class,
             metadata = EXCLUDED.metadata`,
          [
            deviceUuid,
            entity.type,
            entity.id,
            entity.name,
            entity.unit || null,
            entity.device_class || null,
            JSON.stringify(entity),
          ]
        );
      }
    }

    logger.info(`💾 Device [${deviceId}] persistido com sucesso (${entities?.length || 0} entities).`);

  } catch (err) {
    logger.error({ err, deviceId }, 'Erro ao processar discovery');
  }
}

/**
 * Handle de telemetria (NOVO)
 */
async function handleTelemetry(data) {
  const { mqttId, entityType, entityId, payload, topic } = data;

  try {
    // 1. Resolve device_uuid (com cache)
    let deviceUuid = influxService.getDeviceFromCache(mqttId);

    if (!deviceUuid) {
      // Consulta PostgreSQL
      const result = await pool.query(
        'SELECT id, tenant_id FROM devices WHERE metadata->>\'mqtt_id\' = $1',
        [mqttId]
      );

      if (result.rows.length === 0) {
        logger.warn({ mqttId, topic }, '⚠️  Device não encontrado no banco');
        return;
      }

      deviceUuid = result.rows[0].id;
      influxService.cacheDevice(mqttId, deviceUuid);
    }

    // 2. Parse payload
    let parsedPayload;
    try {
      parsedPayload = JSON.parse(payload);
    } catch {
      parsedPayload = payload; // String pura (ex: "ON", "23.5")
    }

    // 3. Normaliza valor
    const { value, valueType, unit } = influxService.normalizePayload(parsedPayload, entityType);

    // 4. Busca device_class da entity (opcional, mas melhora tags)
    let deviceClass = null;
    try {
      const entityResult = await pool.query(
        'SELECT device_class FROM entities WHERE device_id = $1 AND entity_id = $2',
        [deviceUuid, entityId]
      );
      if (entityResult.rows.length > 0) {
        deviceClass = entityResult.rows[0].device_class;
      }
    } catch (err) {
      // Ignora erro (entity pode não existir ainda)
    }

    // 5. Cria Point
    const point = influxService.createPoint({
      deviceUuid,
      mqttId,
      entityId,
      entityType,
      deviceClass,
      unit,
      value,
      valueType,
      timestamp: null, // Usa timestamp do servidor
    });

    // 6. Enfileira para escrita
    influxService.enqueue(point);

    logger.debug({ mqttId, entityId, value, valueType }, '📊 Telemetria enfileirada');

  } catch (err) {
    logger.error({ err, topic }, 'Erro ao processar telemetria');
  }
}

/**
 * Publica mensagem MQTT
 */
function publish(topic, message) {
  if (!client || !isConnected) {
    logger.error('MQTT não conectado');
    throw new Error('MQTT not connected');
  }

  const payload = typeof message === 'object' ? JSON.stringify(message) : message;
  
  client.publish(topic, payload, { qos: 1 }, (err) => {
    if (err) {
      logger.error({ err, topic }, 'Erro ao publicar mensagem MQTT');
    } else {
      logger.debug({ topic, payload }, 'Mensagem publicada');
    }
  });
}

/**
 * Desconecta do MQTT
 */
async function disconnect() {
  if (client) {
    client.end(false, () => {
      logger.info('MQTT desconectado');
      isConnected = false;
    });
  }
}

/**
 * Status da conexão
 */
function getStatus() {
  return {
    connected: isConnected,
    clientId: client?.options?.clientId || null,
  };
}

module.exports = {
  connect,
  publish,
  disconnect,
  getStatus,
};
