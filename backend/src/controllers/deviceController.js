const pool = require('../config/database');
const logger = require('../config/logger');
const crypto = require('crypto');

// POST /api/v1/devices/provision - Provisiona um novo device
const provisionDevice = async (req, res) => {
  try {
    const { name, metadata } = req.body;
    const tenantId = req.user.tenantId;

    if (!name) {
      return res.status(400).json({ error: 'Nome é obrigatório' });
    }

    // Gerar token único
    const deviceToken = `easysmrt_dev_${crypto.randomBytes(16).toString('hex')}`;

    const result = await pool.query(
      `INSERT INTO devices (
        tenant_id, name, device_token, status, metadata
      ) VALUES ($1, $2, $3, 'offline', $4)
      RETURNING id, name, device_token, status, created_at`,
      [tenantId, name, deviceToken, metadata || null]
    );

    logger.info('Device provisionado', { 
      deviceId: result.rows[0].id,
      name,
      tenantId 
    });

    res.status(201).json({
      message: 'Device provisionado com sucesso',
      device: result.rows[0],
    });
  } catch (error) {
    logger.error('Erro ao provisionar device', { error: error.message });
    res.status(500).json({ error: 'Erro ao provisionar device' });
  }
};

// POST /api/v1/devices/claim - Claim device via QR code
const claimDevice = async (req, res) => {
  try {
    const { device_token } = req.body;
    const tenantId = req.user.tenantId;

    if (!device_token) {
      return res.status(400).json({ error: 'device_token é obrigatório' });
    }

    // Buscar device pelo token
    const deviceResult = await pool.query(
      'SELECT id, mqtt_id, name, tenant_id FROM devices WHERE device_token = $1',
      [device_token]
    );

    if (deviceResult.rows.length === 0) {
      return res.status(404).json({ error: 'Device não encontrado' });
    }

    const device = deviceResult.rows[0];

    // Se já pertence a um tenant, verificar se é o mesmo
    if (device.tenant_id && device.tenant_id !== tenantId) {
      return res.status(403).json({ error: 'Device já pertence a outro tenant' });
    }

    // Associar device ao tenant
    await pool.query(
      'UPDATE devices SET tenant_id = $1, status = $2 WHERE id = $3',
      [tenantId, 'online', device.id]
    );

    logger.info('Device claimed com sucesso', { 
      deviceId: device.id,
      tenantId 
    });

    res.json({
      message: 'Device associado com sucesso',
      device: {
        id: device.id,
        mqtt_id: device.mqtt_id,
        name: device.name,
      },
    });
  } catch (error) {
    logger.error('Erro ao fazer claim do device', { error: error.message });
    res.status(500).json({ error: 'Erro ao fazer claim do device' });
  }
};

module.exports = {
  provisionDevice,
  claimDevice,
};