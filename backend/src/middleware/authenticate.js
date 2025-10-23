/**
 * Authenticate Middleware
 * 
 * Valida JWT token e anexa dados do usuário em req.user
 */

const jwt = require('jsonwebtoken');
const logger = require('../config/logger');

function authenticate(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ error: 'Token não fornecido' });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2) {
      return res.status(401).json({ error: 'Token malformado' });
    }

    const [scheme, token] = parts;

    if (!/^Bearer$/i.test(scheme)) {
      return res.status(401).json({ error: 'Token malformado' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
      if (err) {
        logger.warn({ err, ip: req.ip }, 'Token inválido ou expirado');
        return res.status(401).json({ error: 'Token inválido ou expirado' });
      }

      // Anexar dados do usuário na request
      req.user = {
        userId: decoded.userId,
        tenantId: decoded.tenantId,
        role: decoded.role,
      };

      return next();
    });
  } catch (error) {
    logger.error({ error }, 'Erro no middleware de autenticação');
    return res.status(500).json({ error: 'Erro interno do servidor' });
  }
}

module.exports = { authenticate };
