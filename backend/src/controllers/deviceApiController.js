const pool = require('../config/database');
const logger = require('../config/logger');

// GET /api/v1/devices - Lista todos os devices do tenant
const getDevices = async (req, res) => {
  try {
    const tenantId = req.user.tenantId; // Pega do JWT

    const result = await pool.query(
      `SELECT 
        id,
        name,
        status,
        last_seen,
        device_token,
        metadata,
        created_at
      FROM devices
      WHERE tenant_id = $1
      ORDER BY created_at DESC`,
      [tenantId]
    );

    res.json(result.rows);
  } catch (error) {
    logger.error('Erro ao listar devices', { error: error.message });
    res.status(500).json({ error: 'Erro ao listar devices' });
  }
};

// GET /api/v1/devices/:id - Detalhes de um device específico
const getDeviceById = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const result = await pool.query(
      `SELECT 
        d.id,
        d.name,
        d.model,
        d.manufacturer,
        d.status,
        d.last_seen,
        d.device_token,
        d.metadata,
        d.created_at,
        COUNT(e.id) as entity_count
      FROM devices d
      LEFT JOIN entities e ON e.device_id = d.id
      WHERE d.id = $1 AND d.tenant_id = $2
      GROUP BY d.id`,
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Device não encontrado' });
    }

    res.json(result.rows[0]);
  } catch (error) {
    logger.error('Erro ao buscar device', { error: error.message, deviceId: req.params.id });
    res.status(500).json({ error: 'Erro ao buscar device' });
  }
};

// GET /api/v1/devices/:id/entities - Lista entities de um device
const getDeviceEntities = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    // Primeiro verifica se device pertence ao tenant
    const deviceCheck = await pool.query(
      'SELECT id FROM devices WHERE id = $1 AND tenant_id = $2',
      [id, tenantId]
    );

    if (deviceCheck.rows.length === 0) {
      return res.status(404).json({ error: 'Device não encontrado' });
    }

    const result = await pool.query(
      `SELECT 
        id,
        entity_id,
        entity_type,
        device_class,
        name,
        unit_of_measurement,
        state,
        attributes,
        last_updated
      FROM entities
      WHERE device_id = $1
      ORDER BY entity_type, name`,
      [id]
    );

    res.json(result.rows);
  } catch (error) {
    logger.error('Erro ao listar entities', { error: error.message, deviceId: req.params.id });
    res.status(500).json({ error: 'Erro ao listar entities' });
  }
};

// DELETE /api/v1/devices/:id - Deleta device (e suas entities em cascata)
const deleteDevice = async (req, res) => {
  try {
    const { id } = req.params;
    const tenantId = req.user.tenantId;

    const result = await pool.query(
      'DELETE FROM devices WHERE id = $1 AND tenant_id = $2 RETURNING id, name',
      [id, tenantId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Device não encontrado' });
    }

    logger.info('Device deletado com sucesso', { 
      deviceId: id, 
      deviceName: result.rows[0].name,
      tenantId 
    });

    res.json({ 
      message: 'Device deletado com sucesso',
      device: result.rows[0]
    });
  } catch (error) {
    logger.error('Erro ao deletar device', { error: error.message, deviceId: req.params.id });
    res.status(500).json({ error: 'Erro ao deletar device' });
  }
};

module.exports = {
  getDevices,
  getDeviceById,
  getDeviceEntities,
  deleteDevice,
};