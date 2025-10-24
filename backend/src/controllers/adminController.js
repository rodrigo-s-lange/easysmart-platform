const { pool } = require('../config/database');
const logger = require('../config/logger');
const { generateAccessToken, generateRefreshToken } = require('../utils/token');
const { auditImpersonate, getAuditLogs, getAuditStats } = require('../utils/auditLogger');

/**
 * GET /api/v1/admin/tenants
 * Lista todos os tenants com estatísticas
 */
const listTenants = async (req, res) => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const result = await pool.query(
      `SELECT 
        t.id,
        t.name,
        t.created_at,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT d.id) as device_count,
        CASE 
          WHEN COUNT(DISTINCT d.id) > 0 THEN 'active'
          ELSE 'inactive'
        END as status
      FROM tenants t
      LEFT JOIN users u ON u.tenant_id = t.id
      LEFT JOIN devices d ON d.tenant_id = t.id
      GROUP BY t.id, t.name, t.created_at
      ORDER BY t.created_at DESC
      LIMIT $1 OFFSET $2`,
      [parseInt(limit), parseInt(offset)]
    );

    const countResult = await pool.query('SELECT COUNT(*) as total FROM tenants');
    const total = parseInt(countResult.rows[0].total);

    res.json({
      tenants: result.rows,
      total,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    logger.error({ error }, 'Erro ao listar tenants');
    res.status(500).json({ error: 'Erro ao listar tenants' });
  }
};

/**
 * GET /api/v1/admin/tenants/:id
 * Detalhes de um tenant específico
 */
const getTenantDetails = async (req, res) => {
  try {
    const { id } = req.params;

    const tenantResult = await pool.query(
      'SELECT id, name, created_at FROM tenants WHERE id = $1',
      [id]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    const usersResult = await pool.query(
      'SELECT id, email, role, created_at FROM users WHERE tenant_id = $1',
      [id]
    );

    const devicesResult = await pool.query(
      'SELECT id, name, status, last_seen FROM devices WHERE tenant_id = $1',
      [id]
    );

    const tenant = tenantResult.rows[0];

    res.json({
      tenant,
      users: usersResult.rows,
      devices: devicesResult.rows,
      stats: {
        total_users: usersResult.rows.length,
        total_devices: devicesResult.rows.length,
        online_devices: devicesResult.rows.filter(d => d.status === 'online').length,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Erro ao buscar detalhes do tenant');
    res.status(500).json({ error: 'Erro ao buscar detalhes do tenant' });
  }
};

/**
 * GET /api/v1/admin/devices
 * Lista todos os devices (cross-tenant)
 */
const listAllDevices = async (req, res) => {
  try {
    const { status, tenant_id, limit = 10, offset = 0 } = req.query;

    let query = `
      SELECT 
        d.id,
        d.name,
        d.status,
        d.last_seen,
        d.created_at,
        d.tenant_id,
        t.name as tenant_name,
        COUNT(e.id) as entity_count
      FROM devices d
      LEFT JOIN tenants t ON t.id = d.tenant_id
      LEFT JOIN entities e ON e.device_id = d.id
      WHERE 1=1
    `;

    const params = [];
    let paramIndex = 1;

    if (status) {
      query += ` AND d.status = $${paramIndex}`;
      params.push(status);
      paramIndex++;
    }

    if (tenant_id) {
      query += ` AND d.tenant_id = $${paramIndex}`;
      params.push(tenant_id);
      paramIndex++;
    }

    query += ` GROUP BY d.id, d.name, d.status, d.last_seen, d.created_at, d.tenant_id, t.name`;
    query += ` ORDER BY d.created_at DESC`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    const countQuery = `SELECT COUNT(*) as total FROM devices WHERE 1=1${
      status ? ` AND status = '${status}'` : ''
    }${tenant_id ? ` AND tenant_id = '${tenant_id}'` : ''}`;

    const countResult = await pool.query(countQuery);
    const total = parseInt(countResult.rows[0].total);

    res.json({
      devices: result.rows,
      pagination: {
        total,
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: total > parseInt(offset) + parseInt(limit),
      },
    });
  } catch (error) {
    logger.error({ error }, 'Erro ao listar devices');
    res.status(500).json({ error: 'Erro ao listar devices' });
  }
};

/**
 * GET /api/v1/admin/metrics
 * Métricas da plataforma
 */
const getMetrics = async (req, res) => {
  try {
    const tenantsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_tenants,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_tenants_30d
      FROM tenants
    `);

    const usersResult = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30d
      FROM users
    `);

    const devicesResult = await pool.query(`
      SELECT 
        COUNT(*) as total_devices,
        COUNT(CASE WHEN status = 'online' THEN 1 END) as online_devices,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_devices_30d,
        COUNT(CASE WHEN last_seen >= NOW() - INTERVAL '24 hours' THEN 1 END) as active_devices_24h
      FROM devices
    `);

    res.json({
      platform: {
        total_tenants: parseInt(tenantsResult.rows[0].total_tenants),
        new_tenants_30d: parseInt(tenantsResult.rows[0].new_tenants_30d),
        total_users: parseInt(usersResult.rows[0].total_users),
        new_users_30d: parseInt(usersResult.rows[0].new_users_30d),
        total_devices: parseInt(devicesResult.rows[0].total_devices),
        online_devices: parseInt(devicesResult.rows[0].online_devices),
        new_devices_30d: parseInt(devicesResult.rows[0].new_devices_30d),
        active_devices_24h: parseInt(devicesResult.rows[0].active_devices_24h),
      },
      system: {
        uptime: process.uptime(),
        version: require('../../package.json').version,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Erro ao buscar métricas');
    res.status(500).json({ error: 'Erro ao buscar métricas' });
  }
};

/**
 * POST /api/v1/admin/tenants/:id/impersonate
 * Impersonate (fazer login como outro tenant para suporte)
 */
const impersonate = async (req, res) => {
  try {
    const { id: tenantId } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        error: 'Motivo obrigatório (mínimo 10 caracteres)',
      });
    }

    const tenantResult = await pool.query(
      'SELECT id, name FROM tenants WHERE id = $1',
      [tenantId]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    const tenant = tenantResult.rows[0];

    const userResult = await pool.query(
      `SELECT id, email, role FROM users 
       WHERE tenant_id = $1 AND role = 'tenant_admin' 
       LIMIT 1`,
      [tenantId]
    );

    if (userResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Nenhum tenant_admin encontrado para este tenant',
      });
    }

    const targetUser = userResult.rows[0];

    const accessToken = generateAccessToken({
      userId: targetUser.id,
      tenantId: tenant.id,
      role: targetUser.role,
    });

    const refreshToken = generateRefreshToken();

    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [targetUser.id, refreshToken, expiresAt]
    );

    // Audit log: impersonate
    await auditImpersonate(req, tenant, targetUser, reason);

    res.json({
      message: 'Impersonate realizado com sucesso',
      warning: 'Você está logado como outro tenant. Use com responsabilidade.',
      target_tenant: {
        id: tenant.id,
        name: tenant.name,
      },
      target_user: {
        id: targetUser.id,
        email: targetUser.email,
        role: targetUser.role,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    });
  } catch (error) {
    logger.error({ error }, 'Erro ao fazer impersonate');
    res.status(500).json({ error: 'Erro ao fazer impersonate' });
  }
};

/**
 * GET /api/v1/admin/audit-logs
 * Visualizar audit logs (para compliance)
 */
const listAuditLogs = async (req, res) => {
  try {
    const {
      userId,
      tenantId,
      eventType,
      startDate,
      endDate,
      limit = 50,
      offset = 0,
    } = req.query;

    const logs = await getAuditLogs({
      userId,
      tenantId,
      eventType,
      startDate,
      endDate,
      limit: parseInt(limit),
      offset: parseInt(offset),
    });

    const stats = await getAuditStats();

    res.json({
      logs,
      stats,
      pagination: {
        limit: parseInt(limit),
        offset: parseInt(offset),
      },
    });
  } catch (error) {
    logger.error({ error }, 'Erro ao buscar audit logs');
    res.status(500).json({ error: 'Erro ao buscar audit logs' });
  }
};

module.exports = {
  listTenants,
  getTenantDetails,
  listAllDevices,
  getMetrics,
  impersonate,
  listAuditLogs,
};