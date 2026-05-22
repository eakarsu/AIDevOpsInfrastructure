const express = require('express');
const router = express.Router();

router.get('/', (req, res) => {
  res.json({
    summary: { services: 24, burning_fast: 5, deploy_freezes: 2, remaining_budget_hours: 41 },
    services: [
      { service: 'checkout-api', slo: '99.9%', burn_rate: '7.2x', action: 'freeze deploys and page owner' },
      { service: 'search-indexer', slo: '99.5%', burn_rate: '3.4x', action: 'scale queue workers' },
      { service: 'admin-web', slo: '99.0%', burn_rate: '0.8x', action: 'normal monitoring' },
    ],
  });
});

router.post('/simulate', (req, res) => {
  const { burnRate = 1 } = req.body || {};
  res.json({ status: burnRate > 4 ? 'policy breach' : 'within policy', recommendation: burnRate > 4 ? 'block risky deploys' : 'continue standard release flow' });
});

module.exports = router;
