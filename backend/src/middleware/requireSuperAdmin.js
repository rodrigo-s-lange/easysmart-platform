/**
 * Require Super Admin Middleware
 * 
 * Verifica se usuário tem role super_admin.
 * Registra tentativas de acesso negado no audit log.
 */

const logger = require('../config/logger');
const { auditAccessDenied } = require('../utils/auditLogger');

async function requireSuperAdmin(req, res, next) {
  try {
    if (!req.user) {
      await auditAccessDenied(req, 'No user in request (authentication failed)');
      
      return res.status(401).json({
        error: 'Autenticação necessária',
      });
    }

    if (req.user.role !== 'super_admin') {
      await auditAccessDenied(req, 'Requires super_admin role');
      
      logger.warn({
        userId: req.user.userId,
        role: req.user.role,
        path: req.path,
        method: req.method,
      }, 'Acesso negado: super_admin requerido');

      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Apenas super_admin pode acessar este recurso',
      });
    }

    next();
  } catch (error) {
    logger.error({ error }, 'Erro no middleware requireSuperAdmin');
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

module.exports = { requireSuperAdmin };