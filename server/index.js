const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const app = express();
const PORT = process.env.SERVER_PORT || 3001;

app.use(cors({ origin: 'http://localhost:3000', credentials: true }));
app.use(express.json());

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

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`🚀 AI DevOps Infrastructure Server running on port ${PORT}`);
});
