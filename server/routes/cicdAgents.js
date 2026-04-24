const router = require('express').Router();
const { authenticateToken } = require('../middleware/auth');
const { queryOpenRouter } = require('../openrouter');

router.post('/analyze-failure', authenticateToken, async (req, res) => {
  try {
    const { build_logs, error_output } = req.body;
    const result = await queryOpenRouter(`Analyze this CI/CD build failure and provide solutions.\n\nBuild Logs:\n${build_logs}\n\nError:\n${error_output}\n\nRespond in JSON: {"root_cause": "string", "severity": "string", "suggested_fixes": [{"fix": "string", "confidence": 0.9, "steps": ["string"]}], "prevention_tips": ["string"], "auto_fixable": true, "auto_fix_code": "string"}`);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/optimize-pipeline', authenticateToken, async (req, res) => {
  try {
    const { pipeline_config } = req.body;
    const result = await queryOpenRouter(`Optimize this CI/CD pipeline configuration for speed and reliability.\n\nConfig:\n${JSON.stringify(pipeline_config)}\n\nRespond in JSON: {"optimizations": [{"area": "string", "current": "string", "suggested": "string", "impact": "string"}], "estimated_time_savings": "string", "reliability_improvements": ["string"], "best_practices": ["string"]}`);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

router.post('/security-scan', authenticateToken, async (req, res) => {
  try {
    const { repo_info } = req.body;
    const result = await queryOpenRouter(`Perform a security analysis of this CI/CD pipeline.\n\nRepo: ${JSON.stringify(repo_info)}\n\nRespond in JSON: {"security_score": 78, "vulnerabilities": [{"type": "string", "severity": "string", "description": "string", "fix": "string"}], "recommendations": ["string"], "compliance_status": {"soc2": "string", "hipaa": "string"}}`);
    res.json(result);
  } catch (err) { res.status(500).json({ error: err.message }); }
});

module.exports = router;
