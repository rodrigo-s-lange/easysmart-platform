'use strict';

const { pool } = require('../config/database');
const pino = require('pino');
const logger = pino({ level: process.env.LOG_LEVEL || 'info' });

/**
 * Retorna todos os devices.
 */
async function getAllDevices(req, res) {
  try {
    const result = await pool.query(
      `SELECT id, name, status, device_token, last_seen, metadata
       FROM devices
       ORDER BY last_seen DESC`
    );
    res.json(result.rows);
  } catch (err) {
    logger.error({ err }, 'Erro ao listar devices');
    res.status(500).json({ message: 'Erro ao listar devices' });
  }
}

/**
 * Retorna detalhes de um device específico.
 */
async function getDeviceById(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT id, name, status, device_token, metadata, last_seen
       FROM devices
       WHERE id = $1 LIMIT 1`,
      [id]
    );
    if (result.rows.length === 0)
      return res.status(404).json({ message: 'Device não encontrado' });
    res.json(result.rows[0]);
  } catch (err) {
    logger.error({ err, id }, 'Erro ao buscar device');
    res.status(500).json({ message: 'Erro ao buscar device' });
  }
}

/**
 * Retorna entities associadas a um device.
 */
async function getEntitiesByDevice(req, res) {
  const { id } = req.params;
  try {
    const result = await pool.query(
      `SELECT entity_id, entity_type, name, unit, device_class, metadata
       FROM entities
       WHERE device_id = $1
       ORDER BY name ASC`,
      [id]
    );
    res.json(result.rows);
  } catch (err) {
    logger.error({ err, id }, 'Erro ao listar entities');
    res.status(500).json({ message: 'Erro ao listar entities' });
  }
}

/**
 * Remove um device e suas entities.
 */
async function deleteDevice(req, res) {
  const { id } = req.params;
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query('DELETE FROM entities WHERE device_id = $1', [id]);
    const delRes = await client.query('DELETE FROM devices WHERE id = $1 RETURNING id', [id]);
    await client.query('COMMIT');

    if (delRes.rowCount === 0)
      return res.status(404).json({ message: 'Device não encontrado' });

    logger.info(`🗑️ Device [${id}] removido`);
    res.json({ message: 'Device removido com sucesso' });
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error({ err, id }, 'Erro ao deletar device');
    res.status(500).json({ message: 'Erro ao deletar device' });
  } finally {
    client.release();
  }
}

module.exports = {
  getAllDevices,
  getDeviceById,
  getEntitiesByDevice,
  deleteDevice,
};
