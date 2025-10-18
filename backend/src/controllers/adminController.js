/**
 * Admin Controller
 * 
 * Rotas administrativas para super_admin gerenciar a plataforma.
 * Todas as rotas requerem role = 'super_admin'
 * 
 * Phase: 2.1.5 - Sprint 2
 * Date: 2025-10-18
 */

const pool = require('../config/database');
const logger = require('../config/logger');
const { generateAccessToken, generateRefreshToken } = require('../utils/token');

// ==================== TENANTS ====================

/**
 * GET /api/v1/admin/tenants
 * Lista todos os tenants da plataforma com métricas
 */
const getTenants = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT 
        t.id,
        t.name,
        t.created_at,
        COUNT(DISTINCT u.id) as user_count,
        COUNT(DISTINCT d.id) as device_count,
        COALESCE(
          CASE 
            WHEN COUNT(DISTINCT d.id) > 0 THEN 'active'
            ELSE 'inactive'
          END,
          'inactive'
        ) as status
      FROM tenants t
      LEFT JOIN users u ON u.tenant_id = t.id
      LEFT JOIN devices d ON d.tenant_id = t.id
      GROUP BY t.id, t.name, t.created_at
      ORDER BY t.created_at DESC
    `);

    logger.info('Tenants listados', {
      adminUserId: req.user.userId,
      tenantCount: result.rows.length,
    });

    res.json({
      tenants: result.rows,
      total: result.rows.length,
    });
  } catch (error) {
    logger.error('Erro ao listar tenants', { error: error.message });
    res.status(500).json({ error: 'Erro ao listar tenants' });
  }
};

/**
 * GET /api/v1/admin/tenants/:id
 * Detalhes completos de um tenant específico
 */
const getTenantById = async (req, res) => {
  try {
    const { id } = req.params;

    // Buscar tenant
    const tenantResult = await pool.query(
      'SELECT id, name, created_at FROM tenants WHERE id = $1',
      [id]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    const tenant = tenantResult.rows[0];

    // Buscar usuários do tenant
    const usersResult = await pool.query(
      `SELECT id, email, role, created_at 
       FROM users 
       WHERE tenant_id = $1 
       ORDER BY created_at DESC`,
      [id]
    );

    // Buscar devices do tenant
    const devicesResult = await pool.query(
      `SELECT 
        d.id, 
        d.name, 
        d.status, 
        d.last_seen, 
        d.created_at,
        COUNT(e.id) as entity_count
       FROM devices d
       LEFT JOIN entities e ON e.device_id = d.id
       WHERE d.tenant_id = $1
       GROUP BY d.id, d.name, d.status, d.last_seen, d.created_at
       ORDER BY d.created_at DESC`,
      [id]
    );

    // Buscar métricas recentes (última semana)
    // Nota: Isso é uma simulação. Em produção, buscar do InfluxDB
    const metricsResult = await pool.query(
      `SELECT 
        COUNT(DISTINCT d.id) as total_devices,
        COUNT(DISTINCT CASE WHEN d.status = 'online' THEN d.id END) as online_devices,
        COUNT(DISTINCT e.id) as total_entities
       FROM devices d
       LEFT JOIN entities e ON e.device_id = d.id
       WHERE d.tenant_id = $1`,
      [id]
    );

    logger.info('Detalhes do tenant consultados', {
      adminUserId: req.user.userId,
      tenantId: id,
    });

    res.json({
      tenant: {
        ...tenant,
        user_count: usersResult.rows.length,
        device_count: devicesResult.rows.length,
      },
      users: usersResult.rows,
      devices: devicesResult.rows,
      metrics: metricsResult.rows[0] || {
        total_devices: 0,
        online_devices: 0,
        total_entities: 0,
      },
    });
  } catch (error) {
    logger.error('Erro ao buscar tenant', { error: error.message });
    res.status(500).json({ error: 'Erro ao buscar tenant' });
  }
};

/**
 * POST /api/v1/admin/tenants/:id/impersonate
 * Gera tokens para "logar como" um tenant (suporte técnico)
 */
const impersonateTenant = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({ 
        error: 'Motivo é obrigatório (mínimo 10 caracteres)' 
      });
    }

    // Buscar tenant
    const tenantResult = await pool.query(
      'SELECT id, name FROM tenants WHERE id = $1',
      [id]
    );

    if (tenantResult.rows.length === 0) {
      return res.status(404).json({ error: 'Tenant não encontrado' });
    }

    const tenant = tenantResult.rows[0];

    // Buscar um usuário tenant_admin desse tenant
    const userResult = await pool.query(
      `SELECT id, email, role 
       FROM users 
       WHERE tenant_id = $1 AND role = 'tenant_admin' 
       LIMIT 1`,
      [id]
    );

    if (userResult.rows.length === 0) {
      return res.status(400).json({ 
        error: 'Nenhum tenant_admin encontrado para este tenant' 
      });
    }

    const user = userResult.rows[0];

    // Gerar tokens como se fosse o tenant_admin
    const accessToken = generateAccessToken({
      userId: user.id,
      tenantId: id,
      role: user.role,
    });

    const refreshToken = generateRefreshToken();

    // Salvar refresh token
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
    await pool.query(
      'INSERT INTO refresh_tokens (user_id, token_hash, expires_at) VALUES ($1, $2, $3)',
      [user.id, refreshToken, expiresAt]
    );

    // Log de auditoria (IMPORTANTE para compliance)
    logger.warn('Impersonate realizado', {
      adminUserId: req.user.userId,
      adminEmail: req.user.email,
      targetTenantId: id,
      targetTenantName: tenant.name,
      targetUserId: user.id,
      targetUserEmail: user.email,
      reason: reason,
      timestamp: new Date().toISOString(),
    });

    res.json({
      message: 'Impersonate realizado com sucesso',
      tenant: {
        id: tenant.id,
        name: tenant.name,
      },
      user: {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      tokens: {
        accessToken,
        refreshToken,
      },
      expires_in: '15m',
      warning: 'Use apenas para suporte técnico. Todas ações são auditadas.',
    });
  } catch (error) {
    logger.error('Erro ao realizar impersonate', { error: error.message });
    res.status(500).json({ error: 'Erro ao realizar impersonate' });
  }
};

// ==================== DEVICES ====================

/**
 * GET /api/v1/admin/devices
 * Lista TODOS os devices de TODOS os tenants (cross-tenant)
 */
const getAllDevices = async (req, res) => {
  try {
    const { 
      tenant_id, 
      status, 
      limit = 50, 
      offset = 0 
    } = req.query;

    // Construir query dinamicamente
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
      JOIN tenants t ON t.id = d.tenant_id
      LEFT JOIN entities e ON e.device_id = d.id
    `;

    const params = [];
    const conditions = [];

    // Filtro por tenant_id (opcional)
    if (tenant_id) {
      conditions.push(`d.tenant_id = $${params.length + 1}`);
      params.push(tenant_id);
    }

    // Filtro por status (opcional)
    if (status && status !== 'all') {
      conditions.push(`d.status = $${params.length + 1}`);
      params.push(status);
    }

    // Adicionar WHERE se houver filtros
    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(' AND ')}`;
    }

    query += `
      GROUP BY d.id, d.name, d.status, d.last_seen, d.created_at, d.tenant_id, t.name
      ORDER BY d.created_at DESC
      LIMIT $${params.length + 1} OFFSET $${params.length + 2}
    `;

    params.push(parseInt(limit), parseInt(offset));

    const result = await pool.query(query, params);

    // Contar total (para paginação)
    let countQuery = 'SELECT COUNT(DISTINCT d.id) as total FROM devices d';
    const countParams = [];

    if (tenant_id) {
      countQuery += ' WHERE d.tenant_id = $1';
      countParams.push(tenant_id);
    }

    const countResult = await pool.query(countQuery, countParams);

    logger.info('Devices listados (admin)', {
      adminUserId: req.user.userId,
      filters: { tenant_id, status, limit, offset },
      resultCount: result.rows.length,
    });

    res.json({
      devices: result.rows,
      pagination: {
        total: parseInt(countResult.rows[0].total),
        limit: parseInt(limit),
        offset: parseInt(offset),
        hasMore: parseInt(offset) + result.rows.length < parseInt(countResult.rows[0].total),
      },
    });
  } catch (error) {
    logger.error('Erro ao listar devices (admin)', { error: error.message });
    res.status(500).json({ error: 'Erro ao listar devices' });
  }
};

// ==================== METRICS ====================

/**
 * GET /api/v1/admin/metrics
 * Métricas agregadas da plataforma
 */
const getPlatformMetrics = async (req, res) => {
  try {
    // Métricas de tenants
    const tenantsResult = await pool.query(`
      SELECT 
        COUNT(*) as total_tenants,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_tenants_30d
      FROM tenants
    `);

    // Métricas de usuários
    const usersResult = await pool.query(`
      SELECT 
        COUNT(*) as total_users,
        COUNT(CASE WHEN role = 'super_admin' THEN 1 END) as super_admins,
        COUNT(CASE WHEN role = 'tenant_admin' THEN 1 END) as tenant_admins,
        COUNT(CASE WHEN role = 'user' THEN 1 END) as regular_users,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_users_30d
      FROM users
    `);

    // Métricas de devices
    const devicesResult = await pool.query(`
      SELECT 
        COUNT(*) as total_devices,
        COUNT(CASE WHEN status = 'online' THEN 1 END) as online_devices,
        COUNT(CASE WHEN status = 'offline' THEN 1 END) as offline_devices,
        COUNT(CASE WHEN status = 'unclaimed' THEN 1 END) as unclaimed_devices,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '30 days' THEN 1 END) as new_devices_30d,
        COUNT(CASE WHEN last_seen >= NOW() - INTERVAL '24 hours' THEN 1 END) as active_24h
      FROM devices
    `);

    // Métricas de entities
    const entitiesResult = await pool.query(`
      SELECT 
        COUNT(*) as total_entities,
        COUNT(DISTINCT device_id) as devices_with_entities,
        COUNT(CASE WHEN entity_type = 'sensor' THEN 1 END) as sensors,
        COUNT(CASE WHEN entity_type = 'switch' THEN 1 END) as switches,
        COUNT(CASE WHEN entity_type = 'binary_sensor' THEN 1 END) as binary_sensors
      FROM entities
    `);

    // Métricas de refresh tokens (atividade de login)
    const tokensResult = await pool.query(`
      SELECT 
        COUNT(*) as total_active_tokens,
        COUNT(CASE WHEN created_at >= NOW() - INTERVAL '24 hours' THEN 1 END) as tokens_24h
      FROM refresh_tokens
      WHERE expires_at > NOW()
    `);

    logger.info('Métricas da plataforma consultadas', {
      adminUserId: req.user.userId,
    });

    res.json({
      platform: {
        total_tenants: parseInt(tenantsResult.rows[0].total_tenants),
        new_tenants_30d: parseInt(tenantsResult.rows[0].new_tenants_30d),
        total_users: parseInt(usersResult.rows[0].total_users),
        new_users_30d: parseInt(usersResult.rows[0].new_users_30d),
        total_devices: parseInt(devicesResult.rows[0].total_devices),
        online_devices: parseInt(devicesResult.rows[0].online_devices),
        new_devices_30d: parseInt(devicesResult.rows[0].new_devices_30d),
        active_devices_24h: parseInt(devicesResult.rows[0].active_24h),
      },
      users: {
        total: parseInt(usersResult.rows[0].total_users),
        super_admins: parseInt(usersResult.rows[0].super_admins),
        tenant_admins: parseInt(usersResult.rows[0].tenant_admins),
        regular_users: parseInt(usersResult.rows[0].regular_users),
      },
      devices: {
        total: parseInt(devicesResult.rows[0].total_devices),
        online: parseInt(devicesResult.rows[0].online_devices),
        offline: parseInt(devicesResult.rows[0].offline_devices),
        unclaimed: parseInt(devicesResult.rows[0].unclaimed_devices),
      },
      entities: {
        total: parseInt(entitiesResult.rows[0].total_entities),
        devices_with_entities: parseInt(entitiesResult.rows[0].devices_with_entities),
        sensors: parseInt(entitiesResult.rows[0].sensors),
        switches: parseInt(entitiesResult.rows[0].switches),
        binary_sensors: parseInt(entitiesResult.rows[0].binary_sensors),
      },
      activity: {
        active_sessions: parseInt(tokensResult.rows[0].total_active_tokens),
        logins_24h: parseInt(tokensResult.rows[0].tokens_24h),
      },
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    logger.error('Erro ao buscar métricas da plataforma', { error: error.message });
    res.status(500).json({ error: 'Erro ao buscar métricas' });
  }
};

// ==================== EXPORTS ====================

module.exports = {
  getTenants,
  getTenantById,
  impersonateTenant,
  getAllDevices,
  getPlatformMetrics,
};