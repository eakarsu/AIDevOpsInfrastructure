const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const router = express.Router();

// Ensure ai_insights table exists
pool.query(`
  CREATE TABLE IF NOT EXISTS ai_insights (
    id SERIAL PRIMARY KEY,
    resource_type VARCHAR(100) NOT NULL,
    resource_id INTEGER,
    prompt_summary TEXT,
    response_text TEXT,
    model_used VARCHAR(200),
    tokens_estimate INTEGER,
    user_id INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`).catch(err => console.error('Failed to create ai_insights table:', err.message));

// POST /api/ai-insights - store an AI result
router.post('/', authenticateToken, async (req, res) => {
  try {
    const { resource_type, resource_id, prompt_summary, response_text, model_used, tokens_estimate } = req.body;

    if (!resource_type) return res.status(400).json({ error: 'resource_type is required' });
    if (!response_text) return res.status(400).json({ error: 'response_text is required' });

    const user_id = req.user ? req.user.id : null;
    const saved = await pool.query(
      `INSERT INTO ai_insights (resource_type, resource_id, prompt_summary, response_text, model_used, tokens_estimate, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7) RETURNING *`,
      [resource_type, resource_id || null, prompt_summary || null, response_text, model_used || null, tokens_estimate || null, user_id]
    );

    res.status(201).json(saved.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai-insights - list with pagination, optional filter by resource_type
router.get('/', authenticateToken, async (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;
    const { resource_type } = req.query;

    const whereClause = resource_type ? 'WHERE resource_type = $3' : '';
    const countWhere = resource_type ? 'WHERE resource_type = $1' : '';

    const [result, countResult] = await Promise.all([
      resource_type
        ? pool.query(
            `SELECT * FROM ai_insights WHERE resource_type = $1 ORDER BY created_at DESC LIMIT $2 OFFSET $3`,
            [resource_type, limit, offset]
          )
        : pool.query(
            `SELECT * FROM ai_insights ORDER BY created_at DESC LIMIT $1 OFFSET $2`,
            [limit, offset]
          ),
      resource_type
        ? pool.query('SELECT COUNT(*) as total FROM ai_insights WHERE resource_type = $1', [resource_type])
        : pool.query('SELECT COUNT(*) as total FROM ai_insights'),
    ]);

    const total = parseInt(countResult.rows[0].total);
    res.json({
      data: result.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/ai-insights/:resource_type/:resource_id - history for specific resource
router.get('/:resource_type/:resource_id', authenticateToken, async (req, res) => {
  try {
    const { resource_type, resource_id } = req.params;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
    const offset = (page - 1) * limit;

    const [result, countResult] = await Promise.all([
      pool.query(
        'SELECT * FROM ai_insights WHERE resource_type = $1 AND resource_id = $2 ORDER BY created_at DESC LIMIT $3 OFFSET $4',
        [resource_type, resource_id, limit, offset]
      ),
      pool.query(
        'SELECT COUNT(*) as total FROM ai_insights WHERE resource_type = $1 AND resource_id = $2',
        [resource_type, resource_id]
      ),
    ]);

    const total = parseInt(countResult.rows[0].total);
    res.json({
      data: result.rows,
      pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
