const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { authenticate } = require('../middleware/authenticate');
const { requireSuperAdmin } = require('../middleware/requireSuperAdmin');
const { adminLimiter } = require('../middleware/rateLimit');

// Aplicar autenticação e super_admin em todas rotas
router.use(authenticate);
router.use(requireSuperAdmin);
router.use(adminLimiter);

// Tenants
router.get('/tenants', adminController.listTenants);
router.get('/tenants/:id', adminController.getTenantDetails);

// Devices (cross-tenant)
router.get('/devices', adminController.listAllDevices);

// Metrics
router.get('/metrics', adminController.getMetrics);

// Impersonate
router.post('/tenants/:id/impersonate', adminController.impersonate);

// Audit Logs (compliance)
router.get('/audit-logs', adminController.listAuditLogs);

module.exports = router;