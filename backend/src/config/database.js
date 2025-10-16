const { Pool } = require('pg');
const logger = require('./logger');

// Configuração do pool de conexões PostgreSQL
const pool = new Pool({
  host: process.env.POSTGRES_HOST,
  port: process.env.POSTGRES_PORT,
  user: process.env.POSTGRES_USER,
  password: process.env.POSTGRES_PASSWORD,
  database: process.env.POSTGRES_DB,
  max: 20, // máximo de conexões no pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
});

// Event listeners para monitoramento
pool.on('connect', () => {
  logger.debug('Nova conexão PostgreSQL estabelecida no pool');
});

pool.on('error', (err) => {
  logger.error({ err }, 'Erro inesperado no pool PostgreSQL');
});

/**
 * Testa a conexão com o PostgreSQL
 * @returns {Promise<boolean>}
 */
async function testConnection() {
  try {
    const client = await pool.connect();
    const result = await client.query('SELECT NOW() as now, version() as version');
    
    logger.info({
      timestamp: result.rows[0].now,
      version: result.rows[0].version.split(' ')[0] + ' ' + result.rows[0].version.split(' ')[1]
    }, 'PostgreSQL conectado com sucesso');
    
    client.release();
    return true;
  } catch (err) {
    logger.error({ err }, 'Falha ao conectar no PostgreSQL');
    throw err;
  }
}

/**
 * Executa query com log automático (útil para debug)
 * @param {string} text - Query SQL
 * @param {Array} params - Parâmetros da query
 * @returns {Promise<Object>}
 */
async function query(text, params) {
  const start = Date.now();
  try {
    const res = await pool.query(text, params);
    const duration = Date.now() - start;
    
    logger.debug({
      query: text,
      duration: `${duration}ms`,
      rows: res.rowCount
    }, 'Query executada');
    
    return res;
  } catch (err) {
    logger.error({
      err,
      query: text,
      params
    }, 'Erro ao executar query');
    throw err;
  }
}

/**
 * Finaliza todas as conexões do pool (para shutdown graceful)
 */
async function closePool() {
  try {
    await pool.end();
    logger.info('Pool PostgreSQL fechado');
  } catch (err) {
    logger.error({ err }, 'Erro ao fechar pool PostgreSQL');
    throw err;
  }
}

module.exports = {
  pool,
  query,
  testConnection,
  closePool
};
