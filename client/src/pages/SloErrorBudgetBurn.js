import React, { useEffect, useState } from 'react';

export default function SloErrorBudgetBurn() {
  const [data, setData] = useState(null);
  useEffect(() => {
    fetch('/api/slo-error-budget-burn').then((res) => res.json()).then(setData).catch(() => setData(null));
  }, []);
  return (
    <div className="page">
      <h1>SLO Error Budget Burn</h1>
      <p>Track burn rate, deploy freezes, and service-owner actions for reliability policy.</p>
      <div className="stats-grid">
        {data && Object.entries(data.summary).map(([key, value]) => <div className="stat-card" key={key}><span>{key.replaceAll('_', ' ')}</span><strong>{value}</strong></div>)}
      </div>
      <div className="card">
        {(data?.services || []).map((item) => <div key={item.service} style={{ padding: 12, borderBottom: '1px solid #e5e7eb' }}><strong>{item.service}</strong><div>{item.slo} SLO - burn {item.burn_rate} - {item.action}</div></div>)}
      </div>
    </div>
  );
}
