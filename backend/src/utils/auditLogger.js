/**
 * Audit Logger
 * 
 * Sistema de auditoria para compliance e segurança.
 * Registra ações críticas em tabela dedicada.
 * 
 * Eventos auditados:
 * - Login/Logout
 * - Criação/Deleção de usuários
 * - Criação/Deleção de devices
 * - Impersonate (super_admin)
 * - Mudanças de role
 * - Acessos negados
 * - Operações admin
 */

const { pool } = require('../config/database');
const logger = require('../config/logger');

/**
 * Tipos de eventos
 */
const AuditEventType = {
  // Auth
  LOGIN: 'auth.login',
  LOGOUT: 'auth.logout',
  LOGIN_FAILED: 'auth.login_failed',
  TOKEN_REFRESH: 'auth.token_refresh',
  
  // Users
  USER_CREATED: 'user.created',
  USER_DELETED: 'user.deleted',
  USER_UPDATED: 'user.updated',
  ROLE_CHANGED: 'user.role_changed',
  
  // Devices
  DEVICE_CREATED: 'device.created',
  DEVICE_DELETED: 'device.deleted',
  DEVICE_UPDATED: 'device.updated',
  DEVICE_PROVISIONED: 'device.provisioned',
  
  // Admin
  IMPERSONATE_START: 'admin.impersonate_start',
  IMPERSONATE_END: 'admin.impersonate_end',
  ADMIN_ACCESS: 'admin.access',
  ADMIN_ACCESS_DENIED: 'admin.access_denied',
  
  // Tenant
  TENANT_CREATED: 'tenant.created',
  TENANT_DELETED: 'tenant.deleted',
  TENANT_SUSPENDED: 'tenant.suspended',
  
  // Security
  ACCESS_DENIED: 'security.access_denied',
  RATE_LIMIT_EXCEEDED: 'security.rate_limit',
  INVALID_TOKEN: 'security.invalid_token',
};

/**
 * Log audit event
 */
async function logAudit(event) {
  const {
    eventType,
    userId = null,
    tenantId = null,
    targetUserId = null,
    targetTenantId = null,
    targetDeviceId = null,
    action,
    details = {},
    ipAddress = null,
    userAgent = null,
    success = true,
  } = event;

  try {
    await pool.query(
      `INSERT INTO audit_logs (
        event_type,
        user_id,
        tenant_id,
        target_user_id,
        target_tenant_id,
        target_device_id,
        action,
        details,
        ip_address,
        user_agent,
        success,
        created_at
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, NOW())`,
      [
        eventType,
        userId,
        tenantId,
        targetUserId,
        targetTenantId,
        targetDeviceId,
        action,
        JSON.stringify(details),
        ipAddress,
        userAgent,
        success,
      ]
    );

    logger.info({
      eventType,
      userId,
      tenantId,
      success,
    }, 'Audit log created');
  } catch (err) {
    logger.error({ err, event }, 'Failed to create audit log');
    // Não falha a request se audit log falhar
  }
}

/**
 * Express middleware para auditar requests automaticamente
 */
function auditMiddleware(eventType) {
  return (req, res, next) => {
    const originalSend = res.send;

    res.send = function (data) {
      const success = res.statusCode < 400;

      // Log audit após response
      setImmediate(() => {
        logAudit({
          eventType,
          userId: req.user?.userId,
          tenantId: req.user?.tenantId,
          action: `${req.method} ${req.path}`,
          details: {
            method: req.method,
            path: req.path,
            query: req.query,
            statusCode: res.statusCode,
          },
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          success,
        });
      });

      return originalSend.call(this, data);
    };

    next();
  };
}

/**
 * Helper: Auditar login
 */
async function auditLogin(req, user, success) {
  await logAudit({
    eventType: success ? AuditEventType.LOGIN : AuditEventType.LOGIN_FAILED,
    userId: success ? user.id : null,
    tenantId: success ? user.tenant_id : null,
    action: 'User login attempt',
    details: {
      email: user.email || req.body.email,
      role: user.role,
    },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    success,
  });
}

/**
 * Helper: Auditar logout
 */
async function auditLogout(req) {
  await logAudit({
    eventType: AuditEventType.LOGOUT,
    userId: req.user?.userId,
    tenantId: req.user?.tenantId,
    action: 'User logout',
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    success: true,
  });
}

/**
 * Helper: Auditar impersonate
 */
async function auditImpersonate(req, targetTenant, targetUser, reason) {
  await logAudit({
    eventType: AuditEventType.IMPERSONATE_START,
    userId: req.user.userId,
    tenantId: req.user.tenantId,
    targetUserId: targetUser.id,
    targetTenantId: targetTenant.id,
    action: 'Admin impersonate',
    details: {
      adminEmail: req.user.email || 'unknown',
      targetEmail: targetUser.email,
      targetTenantName: targetTenant.name,
      reason,
    },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    success: true,
  });

  logger.warn({
    adminUserId: req.user.userId,
    targetUserId: targetUser.id,
    targetTenantId: targetTenant.id,
    reason,
  }, '⚠️  IMPERSONATE: Admin logged in as tenant');
}

/**
 * Helper: Auditar acesso negado
 */
async function auditAccessDenied(req, reason) {
  await logAudit({
    eventType: AuditEventType.ACCESS_DENIED,
    userId: req.user?.userId,
    tenantId: req.user?.tenantId,
    action: `Access denied: ${req.method} ${req.path}`,
    details: {
      reason,
      requiredRole: reason.includes('admin') ? 'super_admin' : 'unknown',
      userRole: req.user?.role,
    },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    success: false,
  });
}

/**
 * Helper: Auditar device criado
 */
async function auditDeviceCreated(req, device) {
  await logAudit({
    eventType: AuditEventType.DEVICE_CREATED,
    userId: req.user?.userId,
    tenantId: req.user?.tenantId || device.tenant_id,
    targetDeviceId: device.id,
    action: 'Device created',
    details: {
      deviceName: device.name,
      mqttId: device.metadata?.id,
    },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    success: true,
  });
}

/**
 * Helper: Auditar device deletado
 */
async function auditDeviceDeleted(req, device) {
  await logAudit({
    eventType: AuditEventType.DEVICE_DELETED,
    userId: req.user.userId,
    tenantId: req.user.tenantId,
    targetDeviceId: device.id,
    action: 'Device deleted',
    details: {
      deviceName: device.name,
    },
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
    success: true,
  });
}

/**
 * Query: Obter audit logs (para admin dashboard)
 */
async function getAuditLogs(filters = {}) {
  const {
    userId,
    tenantId,
    eventType,
    startDate,
    endDate,
    limit = 100,
    offset = 0,
  } = filters;

  let query = 'SELECT * FROM audit_logs WHERE 1=1';
  const params = [];
  let paramIndex = 1;

  if (userId) {
    query += ` AND user_id = $${paramIndex}`;
    params.push(userId);
    paramIndex++;
  }

  if (tenantId) {
    query += ` AND tenant_id = $${paramIndex}`;
    params.push(tenantId);
    paramIndex++;
  }

  if (eventType) {
    query += ` AND event_type = $${paramIndex}`;
    params.push(eventType);
    paramIndex++;
  }

  if (startDate) {
    query += ` AND created_at >= $${paramIndex}`;
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    query += ` AND created_at <= $${paramIndex}`;
    params.push(endDate);
    paramIndex++;
  }

  query += ` ORDER BY created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limit, offset);

  const result = await pool.query(query, params);
  return result.rows;
}

/**
 * Query: Estatísticas de auditoria
 */
async function getAuditStats(tenantId = null) {
  let query = `
    SELECT 
      event_type,
      COUNT(*) as count,
      COUNT(CASE WHEN success = false THEN 1 END) as failures
    FROM audit_logs
  `;

  const params = [];
  if (tenantId) {
    query += ' WHERE tenant_id = $1';
    params.push(tenantId);
  }

  query += ' GROUP BY event_type ORDER BY count DESC';

  const result = await pool.query(query, params);
  return result.rows;
}

module.exports = {
  AuditEventType,
  logAudit,
  auditMiddleware,
  auditLogin,
  auditLogout,
  auditImpersonate,
  auditAccessDenied,
  auditDeviceCreated,
  auditDeviceDeleted,
  getAuditLogs,
  getAuditStats,
};
