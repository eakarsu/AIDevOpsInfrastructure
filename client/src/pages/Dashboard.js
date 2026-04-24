import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

function Dashboard({ features, token }) {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ incidents: 0, deployments: 0, alerts: 0, savings: 0 });

  useEffect(() => {
    const headers = { Authorization: `Bearer ${token}` };
    Promise.all([
      fetch('http://localhost:3001/api/incidents', { headers }).then(r => r.json()).catch(() => []),
      fetch('http://localhost:3001/api/deployments', { headers }).then(r => r.json()).catch(() => []),
      fetch('http://localhost:3001/api/monitoring', { headers }).then(r => r.json()).catch(() => []),
      fetch('http://localhost:3001/api/cost-optimization', { headers }).then(r => r.json()).catch(() => []),
    ]).then(([incidents, deployments, alerts, costs]) => {
      const activeIncidents = Array.isArray(incidents) ? incidents.filter(i => i.status !== 'resolved').length : 0;
      const activePipelines = Array.isArray(deployments) ? deployments.filter(d => d.status === 'active').length : 0;
      const activeAlerts = Array.isArray(alerts) ? alerts.filter(a => a.status === 'active').length : 0;
      const totalSavings = Array.isArray(costs) ? costs.reduce((sum, c) => sum + parseFloat(c.potential_savings || 0), 0) : 0;
      setStats({ incidents: activeIncidents, deployments: activePipelines, alerts: activeAlerts, savings: totalSavings });
    });
  }, [token]);

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h1 className="dashboard-title">Infrastructure Command Center</h1>
        <p className="dashboard-subtitle">AI-powered DevOps intelligence across your entire infrastructure</p>
      </div>

      <div className="stats-bar">
        <div className="stat-card">
          <div className="stat-label">Active Incidents</div>
          <div className={`stat-value ${stats.incidents > 0 ? 'red' : 'green'}`}>{stats.incidents}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Pipelines</div>
          <div className="stat-value blue">{stats.deployments}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Active Alerts</div>
          <div className="stat-value orange">{stats.alerts}</div>
        </div>
        <div className="stat-card">
          <div className="stat-label">Potential Savings</div>
          <div className="stat-value green">${stats.savings.toLocaleString()}</div>
        </div>
      </div>

      <div className="features-grid">
        {features.map(f => (
          <div key={f.key} className="feature-card" style={{ '--card-color': f.color }} onClick={() => navigate(`/${f.key}`)}>
            <div className="feature-card-icon">{f.icon}</div>
            <div className="feature-card-title">{f.label}</div>
            <div className="feature-card-desc">{f.description}</div>
            <div className="feature-card-arrow">&rarr;</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Dashboard;
