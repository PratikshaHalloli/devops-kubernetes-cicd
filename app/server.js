const express = require('express');
const { Pool } = require('pg');

const app = express();
app.use(express.json());

const PORT = Number(process.env.PORT || 3000);
const DB_HOST = process.env.DB_HOST || 'postgres';
const DB_PORT = Number(process.env.DB_PORT || 5432);
const DB_NAME = process.env.DB_NAME || 'devopsdb';
const DB_USER = process.env.DB_USER || 'devops';
const DB_PASSWORD = process.env.DB_PASSWORD || 'devopspass';

const pool = new Pool({
  host: DB_HOST,
  port: DB_PORT,
  database: DB_NAME,
  user: DB_USER,
  password: DB_PASSWORD,
  max: 5,
  idleTimeoutMillis: 10000,
  connectionTimeoutMillis: 2000
});

function log(level, message, extra = {}) {
  console.log(JSON.stringify({
    timestamp: new Date().toISOString(),
    level,
    message,
    ...extra
  }));
}

app.get('/', (_req, res) => {
  res.json({
    service: 'devops-demo-api',
    version: process.env.APP_VERSION || 'local',
    status: 'running'
  });
});

app.get('/healthz', (_req, res) => {
  res.status(200).json({ status: 'healthy' });
});

app.get('/readyz', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.status(200).json({ status: 'ready', database: 'reachable' });
  } catch (error) {
    log('error', 'readiness check failed', { error: error.message });
    res.status(503).json({ status: 'not-ready', database: 'unreachable' });
  }
});

app.get('/db', async (_req, res) => {
  const started = Date.now();
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS visits (
        id SERIAL PRIMARY KEY,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      )
    `);
    const result = await pool.query(
      'INSERT INTO visits DEFAULT VALUES RETURNING id, created_at'
    );
    const count = await pool.query('SELECT COUNT(*)::int AS count FROM visits');
    const durationMs = Date.now() - started;
    log('info', 'database request succeeded', { durationMs });
    res.json({
      message: 'PostgreSQL connectivity is working',
      visit: result.rows[0],
      totalVisits: count.rows[0].count,
      durationMs
    });
  } catch (error) {
    log('error', 'database request failed', { error: error.message });
    res.status(500).json({ error: 'database request failed' });
  }
});

app.use((err, _req, res, _next) => {
  log('error', 'unhandled application error', { error: err.message });
  res.status(500).json({ error: 'internal server error' });
});

const server = app.listen(PORT, () => {
  log('info', 'server started', { port: PORT });
});

function shutdown(signal) {
  log('info', 'shutdown requested', { signal });
  server.close(async () => {
    await pool.end();
    process.exit(0);
  });
}
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
