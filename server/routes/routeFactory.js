const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { queryOpenRouter } = require('../openrouter');
const { parseAIJson } = require('../parseAIJson');

const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

// Whitelist tableName/columns to prevent SQL injection (audit gap #3)
const TABLE_NAME_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
const COLUMN_NAME_RE = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
function safeTable(t) {
  if (!TABLE_NAME_RE.test(t)) throw new Error(`Invalid table name: ${t}`);
  return t;
}
function safeColumns(cols) {
  cols.forEach(c => { if (!COLUMN_NAME_RE.test(c)) throw new Error(`Invalid column name: ${c}`); });
  return cols;
}

async function persistFactoryInsight({ resource_type, resource_id, prompt_summary, raw_text, parsed, usage, user_id }) {
  try {
    const response_text = typeof parsed === 'object' ? JSON.stringify(parsed) : String(parsed || raw_text || '');
    const tokens_estimate = usage ? usage.total_tokens : null;
    await pool.query(
      `INSERT INTO ai_insights (resource_type, resource_id, prompt_summary, response_text, model_used, tokens_estimate, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [resource_type, resource_id || null, prompt_summary, response_text, MODEL, tokens_estimate, user_id || null]
    );
  } catch (err) {
    console.error('persistFactoryInsight error:', err.message);
  }
}

function createCrudRoutes(tableName, columns, aiConfig) {
  const safeT = safeTable(tableName);
  const safeC = safeColumns(columns);
  const router = express.Router();

  // GET all — paginated
  router.get('/', authenticateToken, async (req, res) => {
    try {
      const page = Math.max(1, parseInt(req.query.page) || 1);
      const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 20));
      const offset = (page - 1) * limit;

      const [result, countResult] = await Promise.all([
        pool.query(`SELECT * FROM ${safeT} ORDER BY created_at DESC LIMIT $1 OFFSET $2`, [limit, offset]),
        pool.query(`SELECT COUNT(*) as total FROM ${safeT}`),
      ]);

      const total = parseInt(countResult.rows[0].total);
      res.json({
        data: result.rows,
        pagination: { page, limit, total, totalPages: Math.ceil(total / limit) },
      });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // GET one
  router.get('/:id', authenticateToken, async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${safeT} WHERE id = $1`, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // POST create
  router.post('/', authenticateToken, async (req, res) => {
    try {
      const vals = safeC.map(c => req.body[c] ?? null);
      const placeholders = safeC.map((_, i) => `$${i + 1}`).join(',');
      const colStr = safeC.join(',');
      const result = await pool.query(
        `INSERT INTO ${safeT} (${colStr}) VALUES (${placeholders}) RETURNING *`,
        vals
      );
      res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // PUT update
  router.put('/:id', authenticateToken, async (req, res) => {
    try {
      const vals = safeC.map(c => req.body[c] ?? null);
      const setStr = safeC.map((c, i) => `${c}=$${i + 1}`).join(',');
      vals.push(req.params.id);
      const result = await pool.query(
        `UPDATE ${safeT} SET ${setStr}, updated_at=NOW() WHERE id=$${vals.length} RETURNING *`,
        vals
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // DELETE
  router.delete('/:id', authenticateToken, async (req, res) => {
    try {
      const result = await pool.query(`DELETE FROM ${safeT} WHERE id = $1 RETURNING *`, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ message: 'Deleted successfully' });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // AI Generate — persists to ai_insights, attempts JSON parse via 3-strategy helper
  router.post('/ai/generate', authenticateToken, aiRateLimiter, async (req, res) => {
    try {
      const prompt = aiConfig.buildPrompt(req.body);
      const aiResult = await queryOpenRouter(prompt, aiConfig.systemPrompt);

      const parsed = parseAIJson(aiResult.result || '');
      const enriched = {
        ...aiResult,
        parsed,
      };

      // Persist
      persistFactoryInsight({
        resource_type: safeT,
        resource_id: req.body.id || null,
        prompt_summary: `AI generate for ${safeT}: ${(req.body.title || '').slice(0, 200)}`,
        raw_text: aiResult.result,
        parsed,
        usage: aiResult.usage,
        user_id: req.user ? req.user.id : null,
      });

      res.json(enriched);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  return router;
}

module.exports = { createCrudRoutes };
