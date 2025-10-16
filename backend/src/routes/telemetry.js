const express = require('express');
const router = express.Router();
const telemetryController = require('../controllers/telemetryController');
const { requireAuth } = require('../middleware/auth');

/**
 * Todas as rotas exigem autenticação
 */
router.use(requireAuth);

/**
 * GET /api/v1/telemetry/metrics
 * Métricas do writer (admin)
 */
router.get('/metrics', telemetryController.getMetrics);

/**
 * GET /api/v1/telemetry/:deviceId/latest/:entityId
 * Último valor de uma entidade
 */
router.get('/:deviceId/latest/:entityId', telemetryController.getLatest);

/**
 * GET /api/v1/telemetry/:deviceId/:entityId
 * Série temporal com agregação
 * 
 * Query params:
 * - start: -6h (default)
 * - stop: now() (default)
 * - window: 1m (default)
 * - aggregation: mean (default)
 */
router.get('/:deviceId/:entityId', telemetryController.getSeries);

module.exports = router;
