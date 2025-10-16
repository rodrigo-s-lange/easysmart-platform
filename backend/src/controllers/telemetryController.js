const influxService = require('../services/influxService');
const logger = require('../config/logger');
const { z } = require('zod');

/**
 * Schema de validação para query de série
 */
const seriesQuerySchema = z.object({
  start: z.string().default('-6h'),
  stop: z.string().optional().default('now()'),
  window: z.string().optional().default('1m'),
  aggregation: z.enum(['mean', 'min', 'max', 'sum', 'count', 'first', 'last']).optional().default('mean'),
});

/**
 * GET /api/v1/telemetry/:deviceId/latest/:entityId
 * Retorna o último valor de uma entidade
 */
async function getLatest(req, res, next) {
  try {
    const { deviceId, entityId } = req.params;

    logger.debug({ deviceId, entityId }, 'Query latest value');

    const result = await influxService.getLatest(deviceId, entityId);

    if (!result) {
      return res.status(404).json({
        success: false,
        error: 'No data found for this entity',
      });
    }

    res.json({
      success: true,
      data: result,
    });

  } catch (err) {
    logger.error({ err }, 'Erro em getLatest');
    next(err);
  }
}

/**
 * GET /api/v1/telemetry/:deviceId/:entityId
 * Retorna série temporal com agregação
 * 
 * Query params:
 * - start: -6h, -24h, -7d (default: -6h)
 * - stop: now() (default)
 * - window: 1m, 5m, 1h (default: 1m)
 * - aggregation: mean, min, max, sum, count (default: mean)
 */
async function getSeries(req, res, next) {
  try {
    const { deviceId, entityId } = req.params;

    // Valida query params
    const params = seriesQuerySchema.parse(req.query);

    logger.debug({ deviceId, entityId, params }, 'Query series');

    const data = await influxService.getSeries({
      deviceUuid: deviceId,
      entityId,
      ...params,
    });

    res.json({
      success: true,
      count: data.length,
      params: {
        deviceId,
        entityId,
        ...params,
      },
      data,
    });

  } catch (err) {
    if (err instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        error: 'Invalid query parameters',
        details: err.errors,
      });
    }

    logger.error({ err }, 'Erro em getSeries');
    next(err);
  }
}

/**
 * GET /api/v1/telemetry/metrics
 * Retorna métricas do writer (admin)
 */
async function getMetrics(req, res, next) {
  try {
    const metrics = influxService.getMetrics();

    res.json({
      success: true,
      metrics,
    });

  } catch (err) {
    logger.error({ err }, 'Erro em getMetrics');
    next(err);
  }
}

module.exports = {
  getLatest,
  getSeries,
  getMetrics,
};
