const router = require('express').Router();
const pool = require('../db');
const { authenticateToken } = require('../middleware/auth');
const { aiRateLimiter } = require('../middleware/rateLimiter');
const { queryOpenRouter } = require('../openrouter');
const { parseAIJson } = require('../parseAIJson');

const MODEL = process.env.OPENROUTER_MODEL || 'anthropic/claude-3-5-sonnet-20241022';

async function persistInsight({ resource_type, resource_id, prompt_summary, result, user_id }) {
  try {
    const response_text = typeof result.result === 'string' ? result.result : JSON.stringify(result);
    const tokens_estimate = result.usage ? result.usage.total_tokens : null;
    await pool.query(
      `INSERT INTO ai_insights (resource_type, resource_id, prompt_summary, response_text, model_used, tokens_estimate, user_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [resource_type, resource_id || null, prompt_summary, response_text, MODEL, tokens_estimate, user_id || null]
    );
  } catch (err) {
    console.error('Failed to persist AI insight:', err.message);
  }
}

router.post('/analyze-failure', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { build_logs, error_output } = req.body;
    const result = await queryOpenRouter(`Analyze this CI/CD build failure and provide solutions.\n\nBuild Logs:\n${build_logs}\n\nError:\n${error_output}\n\nRespond in JSON: {"root_cause": "string", "severity": "string", "suggested_fixes": [{"fix": "string", "confidence": 0.9, "steps": ["string"]}], "prevention_tips": ["string"], "auto_fixable": true, "auto_fix_code": "string"}`);
    const parsed = parseAIJson(result.result || '');
    res.json({ ...result, parsed });
    persistInsight({
      resource_type: 'cicd_failure',
      prompt_summary: `Build failure analysis. Error: ${error_output ? error_output.slice(0, 200) : 'N/A'}`,
      result,
      user_id: req.user ? req.user.id : null,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/optimize-pipeline', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { pipeline_config } = req.body;
    const result = await queryOpenRouter(`Optimize this CI/CD pipeline configuration for speed and reliability.\n\nConfig:\n${JSON.stringify(pipeline_config)}\n\nRespond in JSON: {"optimizations": [{"area": "string", "current": "string", "suggested": "string", "impact": "string"}], "estimated_time_savings": "string", "reliability_improvements": ["string"], "best_practices": ["string"]}`);
    const parsed = parseAIJson(result.result || '');
    res.json({ ...result, parsed });
    persistInsight({
      resource_type: 'cicd_pipeline_optimization',
      prompt_summary: 'Pipeline optimization analysis',
      result,
      user_id: req.user ? req.user.id : null,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/security-scan', authenticateToken, aiRateLimiter, async (req, res) => {
  try {
    const { repo_info } = req.body;
    const result = await queryOpenRouter(`Perform a security analysis of this CI/CD pipeline.\n\nRepo: ${JSON.stringify(repo_info)}\n\nRespond in JSON: {"security_score": 78, "vulnerabilities": [{"type": "string", "severity": "string", "description": "string", "fix": "string"}], "recommendations": ["string"], "compliance_status": {"soc2": "string", "hipaa": "string"}}`);
    const parsed = parseAIJson(result.result || '');
    res.json({ ...result, parsed });
    persistInsight({
      resource_type: 'cicd_security_scan',
      prompt_summary: `Security scan for repo: ${repo_info ? JSON.stringify(repo_info).slice(0, 200) : 'N/A'}`,
      result,
      user_id: req.user ? req.user.id : null,
    });
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
