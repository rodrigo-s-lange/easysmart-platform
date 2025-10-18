/**
 * Middleware: requireSuperAdmin
 * 
 * Validates that the authenticated user has super_admin role.
 * Must be used AFTER requireAuth middleware.
 * 
 * Usage:
 * router.use(requireAuth);
 * router.use(requireSuperAdmin);
 * router.get('/admin/tenants', getTenants);
 * 
 * Phase: 2.1.5
 */

const logger = require('../config/logger');

const requireSuperAdmin = (req, res, next) => {
  try {
    // Check if user is authenticated (should be set by requireAuth)
    if (!req.user) {
      logger.warn('requireSuperAdmin called without authentication');
      return res.status(401).json({ 
        error: 'Authentication required' 
      });
    }

    // Check if user has super_admin role
    if (req.user.role !== 'super_admin') {
      logger.warn('Unauthorized admin access attempt', {
        userId: req.user.userId,
        userRole: req.user.role,
        tenantId: req.user.tenantId,
        path: req.path,
        method: req.method,
      });

      return res.status(403).json({ 
        error: 'Access denied. Super admin privileges required.',
        requiredRole: 'super_admin',
        currentRole: req.user.role,
      });
    }

    // User is super_admin, allow access
    logger.debug('Super admin access granted', {
      userId: req.user.userId,
      path: req.path,
    });

    next();
  } catch (error) {
    logger.error('Error in requireSuperAdmin middleware', {
      error: error.message,
      stack: error.stack,
    });

    res.status(500).json({ 
      error: 'Internal server error' 
    });
  }
};

module.exports = requireSuperAdmin;