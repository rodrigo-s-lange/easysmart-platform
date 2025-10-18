/**
 * Admin Routes
 * 
 * Rotas administrativas protegidas (apenas super_admin)
 * 
 * Base path: /api/v1/admin
 * 
 * Phase: 2.1.5 - Sprint 2
 * Date: 2025-10-18
 */

const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const { requireAuth } = require('../middleware/auth');
const requireSuperAdmin = require('../middleware/requireSuperAdmin');

// ==================== MIDDLEWARE ====================

// Todas as rotas admin requerem autenticação + super_admin
router.use(requireAuth);
router.use(requireSuperAdmin);

// ==================== TENANTS ====================

// GET /api/v1/admin/tenants - Listar todos tenants
router.get('/tenants', adminController.getTenants);

// GET /api/v1/admin/tenants/:id - Detalhes de um tenant
router.get('/tenants/:id', adminController.getTenantById);

// POST /api/v1/admin/tenants/:id/impersonate - Gerar token como tenant
router.post('/tenants/:id/impersonate', adminController.impersonateTenant);

// ==================== DEVICES ====================

// GET /api/v1/admin/devices - Listar todos devices (cross-tenant)
router.get('/devices', adminController.getAllDevices);

// ==================== METRICS ====================

// GET /api/v1/admin/metrics - Métricas da plataforma
router.get('/metrics', adminController.getPlatformMetrics);

// ==================== EXPORTS ====================

module.exports = router;