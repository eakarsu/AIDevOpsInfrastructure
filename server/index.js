const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.SERVER_PORT || 3001;
if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('JWT_SECRET must be configured with at least 32 characters');
if (!process.env.DATABASE_URL && !process.env.DB_PASSWORD) throw new Error('DATABASE_URL or DB_PASSWORD is required');

// Security middleware
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginResourcePolicy: { policy: 'cross-origin' },
}));

// CORS — allowlist from env (comma-separated)
const corsOrigins = (process.env.CORS_ORIGINS || 'http://localhost:3000')
  .split(',')
  .map(s => s.trim())
  .filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin) return cb(null, true);
    if (corsOrigins.includes('*') || corsOrigins.includes(origin)) return cb(null, true);
    return cb(new Error(`CORS: origin ${origin} not allowed`));
  },
  credentials: true,
}));

app.use(express.json({ limit: '5mb' }));

// Routes
app.use('/api/auth', require('./routes/auth'));
app.use('/api/auto-scaling', require('./routes/autoScaling'));
app.use('/api/incidents', require('./routes/incidents'));
app.use('/api/deployments', require('./routes/deployments'));
app.use('/api/monitoring', require('./routes/monitoring'));
app.use('/api/security', require('./routes/security'));
app.use('/api/cost-optimization', require('./routes/costOptimization'));
app.use('/api/containers', require('./routes/containers'));
app.use('/api/log-analysis', require('./routes/logAnalysis'));
app.use('/api/iac', require('./routes/iac'));
app.use('/api/disaster-recovery', require('./routes/disasterRecovery'));
app.use('/api/cicd-agents', require('./routes/cicdAgents'));
app.use('/api/ai-insights', require('./routes/aiInsights'));
app.use('/api/ai', require('./routes/aiNew'));





app.use('/api/ai', require('./routes/securityPosture'));
app.use('/api/ai', require('./routes/failurePredict'));
app.use('/api/ai', require('./routes/costOptimize'));
app.use('/api/ai', require('./routes/anomalyDetect'));
app.use('/api/ai', require('./routes/scalingPredict'));
app.use('/api/ai-backlog', require('./routes/aiBacklog'));
app.use('/api/slo-error-budget-burn', require('./routes/sloErrorBudgetBurn'));
app.use('/api/governed-changes', require('./routes/governedChanges'));

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Generated gap routers are quarantined; no fake cloud action is exposed.

app.listen(PORT, () => {
  console.log(`🚀 AI DevOps Infrastructure Server running on port ${PORT}`);
  console.log(`   CORS allowlist: ${corsOrigins.join(', ')}`);
});
