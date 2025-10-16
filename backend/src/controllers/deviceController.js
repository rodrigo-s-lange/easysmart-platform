'use strict';

const { pool } = require('../config/database');
const { v4: uuidv4 } = require('uuid');
const crypto = require('crypto');
const pino = require('pino');
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

/**
 * Gera um token aleatório para o dispositivo (32 caracteres hexadecimais).
 */
function generateDeviceToken() {
  return 'easysmrt_dev_' + crypto.randomBytes(16).toString('hex');
}

/**
 * Registra ou atualiza um dispositivo descoberto via MQTT.
 * @param {object} discovery - Payload do tópico discovery.
 * @param {string} mqttDeviceId - ID do dispositivo no tópico MQTT (ex: esp32-lab)
 */
async function registerDiscovery(discovery, mqttDeviceId) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const { device, entities } = discovery;
    const metadata = { ...device, mqtt_id: mqttDeviceId };
    let dbDeviceId;

    // Verifica se já existe device com mesmo mqtt_id
    const existing = await client.query(
      `SELECT id FROM devices WHERE metadata->>'mqtt_id' = $1 LIMIT 1`,
      [mqttDeviceId]
    );

    if (existing.rows.length > 0) {
      dbDeviceId = existing.rows[0].id;
      await client.query(
        `UPDATE devices
         SET name = $1,
             status = 'online',
             metadata = $2,
             last_seen = NOW()
         WHERE id = $3`,
        [device.name || mqttDeviceId, JSON.stringify(metadata), dbDeviceId]
      );
      logger.info(`🔁 Device [${mqttDeviceId}] atualizado`);
    } else {
      dbDeviceId = uuidv4();
      const deviceToken = generateDeviceToken();

      await client.query(
        `INSERT INTO devices (id, name, status, metadata, last_seen, device_token)
         VALUES ($1, $2, 'online', $3, NOW(), $4)`,
        [dbDeviceId, device.name || mqttDeviceId, JSON.stringify(metadata), deviceToken]
      );

      logger.info(`🆕 Device [${mqttDeviceId}] criado com token ${deviceToken}`);
    }

    // 2. Criar/atualizar entities
    for (const entity of entities || []) {
      await client.query(
        `INSERT INTO entities (device_id, entity_type, entity_id, name, unit, device_class, metadata)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (device_id, entity_id) DO UPDATE
         SET name = EXCLUDED.name,
             unit = EXCLUDED.unit,
             device_class = EXCLUDED.device_class,
             metadata = EXCLUDED.metadata`,
        [
          dbDeviceId,
          entity.type,
          entity.id,
          entity.name || entity.id,
          entity.unit || null,
          entity.device_class || null,
          JSON.stringify(entity),
        ]
      );
    }

    await client.query('COMMIT');
    logger.info(`💾 Device [${mqttDeviceId}] persistido com sucesso (${entities?.length || 0} entities).`);
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error({ err, mqttDeviceId }, 'Erro ao registrar discovery');
  } finally {
    client.release();
  }
}

module.exports = { registerDiscovery };