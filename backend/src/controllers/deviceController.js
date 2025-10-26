/**
 * Device Controller
 *
 * Gerencia dispositivos e comandos
 */

const pool = require('../config/database');
const mqttService = require('../services/mqttService');
const logger = require('../config/logger');
const crypto = require('crypto');

/**
 * POST /api/v1/devices/:deviceId/command
 * Envia comando MQTT para dispositivo
 */
async function sendCommand(req, res, next) {
  try {
    const { deviceId } = req.params;
    const { entityId, command } = req.body;

    if (!entityId || !command) {
      return res.status(400).json({
        success: false,
        error: 'entityId and command are required',
      });
    }

    // Buscar device no banco
    const deviceResult = await pool.query(
      `SELECT id, mqtt_id, tenant_id FROM devices 
       WHERE mqtt_id = $1 OR id::text = $1`,
      [deviceId]
    );

    if (deviceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Device not found',
      });
    }

    const device = deviceResult.rows[0];

    // Verificar se device pertence ao tenant do usuário
    if (device.tenant_id !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Publicar comando MQTT
    // Formato: easysmart/{mqttId}/switch/{entityId}/command
    const topic = `easysmart/${device.mqtt_id}/switch/${entityId}/command`;
    const payload = command;

    await mqttService.publish(topic, payload, {
      qos: 1,
      retain: false,
    });

    logger.info({
      deviceId: device.mqtt_id,
      entityId,
      command,
      userId: req.user.userId,
    }, 'Command sent');

    res.json({
      success: true,
      message: 'Command sent',
      data: {
        deviceId: device.mqtt_id,
        entityId,
        command,
        topic,
      },
    });

  } catch (err) {
    logger.error({ err }, 'Error sending command');
    next(err);
  }
}

/**
 * GET /api/v1/devices
 * Lista todos os devices do tenant do usuário
 */
async function getDevices(req, res, next) {
  try {
    const { tenantId, role } = req.user;
    const { status, limit = 50, offset = 0 } = req.query;

    let query = `
      SELECT
        d.id,
        d.mqtt_id,
        d.name,
        d.status,
        d.device_token,
        d.metadata,
        d.last_seen,
        d.created_at,
        d.tenant_id,
        COUNT(e.id) as entity_count
      FROM devices d
      LEFT JOIN entities e ON e.device_id = d.id
      WHERE d.tenant_id = $1
    `;

    const params = [tenantId];
    let paramIndex = 2;

    // Filtrar por status se fornecido
    if (status) {
      query += ` AND d.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    query += ` GROUP BY d.id ORDER BY d.created_at DESC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    // Contar total
    const countResult = await pool.query(
      'SELECT COUNT(*) FROM devices WHERE tenant_id = $1',
      [tenantId]
    );

    const devices = result.rows.map(row => ({
      id: row.id,
      mqttId: row.mqtt_id,
      name: row.name,
      status: row.status,
      deviceToken: row.device_token,
      metadata: row.metadata,
      lastSeen: row.last_seen,
      createdAt: row.created_at,
      entityCount: parseInt(row.entity_count),
    }));

    res.json({
      success: true,
      devices,
      total: parseInt(countResult.rows[0].count),
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + devices.length < parseInt(countResult.rows[0].count),
      },
    });

  } catch (err) {
    logger.error({ err }, 'Error fetching devices');
    next(err);
  }
}

/**
 * GET /api/v1/devices/:id
 * Busca um device específico com suas entities
 */
async function getDeviceById(req, res, next) {
  try {
    const { id } = req.params;
    const { tenantId } = req.user;

    // Buscar device
    const deviceResult = await pool.query(
      `SELECT id, mqtt_id, name, status, device_token, metadata, last_seen, created_at, tenant_id
       FROM devices
       WHERE (id::text = $1 OR mqtt_id = $1) AND tenant_id = $2`,
      [id, tenantId]
    );

    if (deviceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Device not found',
      });
    }

    const deviceRow = deviceResult.rows[0];

    // Buscar entities
    const entitiesResult = await pool.query(
      `SELECT id, entity_id, entity_type, name, unit, device_class, state_class, metadata
       FROM entities
       WHERE device_id = $1
       ORDER BY created_at ASC`,
      [deviceRow.id]
    );

    const device = {
      id: deviceRow.id,
      mqttId: deviceRow.mqtt_id,
      name: deviceRow.name,
      status: deviceRow.status,
      deviceToken: deviceRow.device_token,
      metadata: deviceRow.metadata,
      lastSeen: deviceRow.last_seen,
      createdAt: deviceRow.created_at,
    };

    const entities = entitiesResult.rows.map(row => ({
      id: row.id,
      entityId: row.entity_id,
      entityType: row.entity_type,
      name: row.name,
      unit: row.unit,
      deviceClass: row.device_class,
      stateClass: row.state_class,
      metadata: row.metadata,
    }));

    res.json({
      success: true,
      device,
      entities,
    });

  } catch (err) {
    logger.error({ err }, 'Error fetching device');
    next(err);
  }
}

/**
 * POST /api/v1/devices/provision
 * Provisiona manualmente um novo device
 */
async function provisionDevice(req, res, next) {
  try {
    const { name, metadata } = req.body;
    const { tenantId } = req.user;

    if (!name) {
      return res.status(400).json({
        success: false,
        error: 'Device name is required',
      });
    }

    // Gerar token único
    const deviceToken = `easysmrt_dev_${crypto.randomBytes(16).toString('hex')}`;

    // Gerar mqtt_id baseado no nome (slugify)
    const mqttId = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      + '-' + crypto.randomBytes(4).toString('hex');

    const result = await pool.query(
      `INSERT INTO devices (tenant_id, mqtt_id, name, device_token, status, metadata)
       VALUES ($1, $2, $3, $4, 'offline', $5)
       RETURNING id, mqtt_id, name, device_token, status, created_at`,
      [tenantId, mqttId, name, deviceToken, metadata || {}]
    );

    const device = result.rows[0];

    logger.info({
      deviceId: device.mqtt_id,
      tenantId,
      userId: req.user.userId,
    }, 'Device provisioned manually');

    res.status(201).json({
      success: true,
      message: 'Device provisioned successfully',
      device: {
        id: device.id,
        mqttId: device.mqtt_id,
        name: device.name,
        deviceToken: device.device_token,
        status: device.status,
        createdAt: device.created_at,
      },
    });

  } catch (err) {
    logger.error({ err }, 'Error provisioning device');
    next(err);
  }
}

/**
 * POST /api/v1/devices/:deviceId/command
 * Envia comando MQTT para dispositivo
 */
async function sendCommand(req, res, next) {
  try {
    const { deviceId } = req.params;
    const { entityId, command } = req.body;

    if (!entityId || !command) {
      return res.status(400).json({
        success: false,
        error: 'entityId and command are required',
      });
    }

    // Buscar device no banco
    const deviceResult = await pool.query(
      `SELECT id, mqtt_id, tenant_id FROM devices
       WHERE mqtt_id = $1 OR id::text = $1`,
      [deviceId]
    );

    if (deviceResult.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: 'Device not found',
      });
    }

    const device = deviceResult.rows[0];

    // Verificar se device pertence ao tenant do usuário
    if (device.tenant_id !== req.user.tenantId) {
      return res.status(403).json({
        success: false,
        error: 'Access denied',
      });
    }

    // Publicar comando MQTT
    // Formato: easysmart/{mqttId}/switch/{entityId}/command
    const topic = `easysmart/${device.mqtt_id}/switch/${entityId}/command`;
    const payload = command;

    await mqttService.publish(topic, payload, {
      qos: 1,
      retain: false,
    });

    logger.info({
      deviceId: device.mqtt_id,
      entityId,
      command,
      userId: req.user.userId,
    }, 'Command sent');

    res.json({
      success: true,
      message: 'Command sent',
      data: {
        deviceId: device.mqtt_id,
        entityId,
        command,
        topic,
      },
    });

  } catch (err) {
    logger.error({ err }, 'Error sending command');
    next(err);
  }
}

module.exports = {
  getDevices,
  getDeviceById,
  provisionDevice,
  sendCommand,
};
