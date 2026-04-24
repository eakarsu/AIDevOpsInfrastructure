const express = require('express');
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { queryOpenRouter } = require('../openrouter');

function createCrudRoutes(tableName, columns, aiConfig) {
  const router = express.Router();

  // GET all
  router.get('/', authenticateToken, async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${tableName} ORDER BY created_at DESC`);
      res.json(result.rows);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // GET one
  router.get('/:id', authenticateToken, async (req, res) => {
    try {
      const result = await pool.query(`SELECT * FROM ${tableName} WHERE id = $1`, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // POST create
  router.post('/', authenticateToken, async (req, res) => {
    try {
      const vals = columns.map(c => req.body[c] ?? null);
      const placeholders = columns.map((_, i) => `$${i + 1}`).join(',');
      const colStr = columns.join(',');
      const result = await pool.query(
        `INSERT INTO ${tableName} (${colStr}) VALUES (${placeholders}) RETURNING *`,
        vals
      );
      res.status(201).json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // PUT update
  router.put('/:id', authenticateToken, async (req, res) => {
    try {
      const vals = columns.map(c => req.body[c] ?? null);
      const setStr = columns.map((c, i) => `${c}=$${i + 1}`).join(',');
      vals.push(req.params.id);
      const result = await pool.query(
        `UPDATE ${tableName} SET ${setStr}, updated_at=NOW() WHERE id=$${vals.length} RETURNING *`,
        vals
      );
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json(result.rows[0]);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // DELETE
  router.delete('/:id', authenticateToken, async (req, res) => {
    try {
      const result = await pool.query(`DELETE FROM ${tableName} WHERE id = $1 RETURNING *`, [req.params.id]);
      if (result.rows.length === 0) return res.status(404).json({ error: 'Not found' });
      res.json({ message: 'Deleted successfully' });
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  // AI Generate
  router.post('/ai/generate', authenticateToken, async (req, res) => {
    try {
      const prompt = aiConfig.buildPrompt(req.body);
      const aiResult = await queryOpenRouter(prompt, aiConfig.systemPrompt);
      res.json(aiResult);
    } catch (err) { res.status(500).json({ error: err.message }); }
  });

  return router;
}

module.exports = { createCrudRoutes };
