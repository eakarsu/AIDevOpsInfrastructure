import React, { useState } from 'react';

const API_URL = 'http://localhost:3001/api';

const renderResult = (obj, depth = 0) => {
  if (obj === null || obj === undefined) return null;
  if (typeof obj === 'string') return <p style={{ color: '#e0e0e0', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{obj}</p>;
  if (Array.isArray(obj)) return <div style={{ marginLeft: depth * 12 }}>{obj.map((item, i) =>
    <div key={i} style={{ background: '#1a1a2e', padding: 12, borderRadius: 8, marginBottom: 8, borderLeft: '3px solid #e94560' }}>
      {typeof item === 'object' ? renderResult(item, depth + 1) : <span style={{ color: '#e0e0e0' }}>{String(item)}</span>}
    </div>)}</div>;
  if (typeof obj !== 'object') return <span style={{ color: '#e0e0e0' }}>{String(obj)}</span>;
  return <div style={{ marginLeft: depth * 12 }}>{Object.entries(obj).map(([k, v]) =>
    <div key={k} style={{ marginBottom: 12 }}>
      <div style={{ color: '#e94560', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 }}>{k.replace(/_/g, ' ')}</div>
      {typeof v === 'object' && v !== null ? renderResult(v, depth + 1) :
        <div style={{ color: '#e0e0e0', background: '#1a1a2e', padding: '8px 12px', borderRadius: 6, fontSize: 14 }}>
          {typeof v === 'number' ? <span style={{ color: '#2ecc71', fontWeight: 'bold', fontSize: 18 }}>{v}</span> :
           typeof v === 'boolean' ? <span style={{ color: v ? '#2ecc71' : '#e94560', fontWeight: 'bold' }}>{v ? 'Yes' : 'No'}</span> : String(v ?? '')}
        </div>}
    </div>)}</div>;
};

export default function AINewToolsPage({ token }) {
  const [tab, setTab] = useState('recommend-scaling');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  // recommend-scaling fields
  const [serviceName, setServiceName] = useState('');
  const [metrics, setMetrics] = useState('');
  const [trafficPattern, setTrafficPattern] = useState('');

  // security-risk-assessment fields
  const [postureSummary, setPostureSummary] = useState('');
  const [assetInventory, setAssetInventory] = useState('');

  // predict-failure fields
  const [pfComponent, setPfComponent] = useState('');
  const [pfTelemetry, setPfTelemetry] = useState('');
  const [pfHistory, setPfHistory] = useState('');

  // incident-prediction fields
  const [ipRecent, setIpRecent] = useState('');
  const [ipState, setIpState] = useState('');
  const [ipWindow, setIpWindow] = useState('24');

  // cost-forecasting fields
  const [cfHistorical, setCfHistorical] = useState('');
  const [cfGrowth, setCfGrowth] = useState('');
  const [cfMonths, setCfMonths] = useState('6');

  // detect-anomalies fields
  const [daMetric, setDaMetric] = useState('');
  const [daSeries, setDaSeries] = useState('');
  const [daBaseline, setDaBaseline] = useState('');

  const tryParseJson = (s) => {
    if (!s || !s.trim()) return undefined;
    try { return JSON.parse(s); } catch { return s; }
  };

  const run = async (endpoint, body) => {
    setLoading(true);
    setResult(null);
    setError(null);
    try {
      const res = await fetch(`${API_URL}/ai/${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (res.status === 503) {
        const data = await res.json().catch(() => ({}));
        setError(data.error || 'AI service unavailable: API key not configured');
        setLoading(false);
        return;
      }
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || `HTTP ${res.status}`);
      } else {
        setResult(data);
      }
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleRecommendScaling = () => {
    if (!serviceName.trim() || !metrics.trim()) {
      setError('service_name and metrics are required');
      return;
    }
    run('recommend-scaling', {
      service_name: serviceName,
      metrics: tryParseJson(metrics),
      traffic_pattern: tryParseJson(trafficPattern),
    });
  };

  const handleSecurityAssessment = () => {
    if (!postureSummary.trim()) {
      setError('posture_summary is required');
      return;
    }
    run('security-risk-assessment', {
      posture_summary: tryParseJson(postureSummary),
      asset_inventory: tryParseJson(assetInventory),
    });
  };

  const handlePredictFailure = () => {
    if (!pfComponent.trim()) { setError('component is required'); return; }
    run('predict-failure', {
      component: pfComponent,
      telemetry: tryParseJson(pfTelemetry),
      history: tryParseJson(pfHistory),
    });
  };

  const handleIncidentPrediction = () => {
    run('incident-prediction', {
      recent_incidents: tryParseJson(ipRecent),
      system_state: tryParseJson(ipState),
      time_window_hours: parseInt(ipWindow) || 24,
    });
  };

  const handleCostForecasting = () => {
    if (!cfHistorical.trim()) { setError('historical_spend is required'); return; }
    run('cost-forecasting', {
      historical_spend: tryParseJson(cfHistorical),
      growth_factors: tryParseJson(cfGrowth),
      forecast_months: parseInt(cfMonths) || 6,
    });
  };

  const handleDetectAnomalies = () => {
    if (!daMetric.trim() || !daSeries.trim()) { setError('metric_name and series are required'); return; }
    run('detect-anomalies', {
      metric_name: daMetric,
      series: tryParseJson(daSeries),
      baseline: tryParseJson(daBaseline),
    });
  };

  const tools = [
    { id: 'recommend-scaling', name: 'Scaling Advisor', icon: '📈', desc: 'Recommend scaling actions from service metrics' },
    { id: 'security-risk-assessment', name: 'Security Risk', icon: '🛡️', desc: 'Assess security posture and recommend actions' },
    { id: 'predict-failure', name: 'Failure Prediction', icon: '⚠️', desc: 'Predict failure probability for a component' },
    { id: 'incident-prediction', name: 'Incident Prediction', icon: '🔮', desc: 'Predict likely incidents in a time window' },
    { id: 'cost-forecasting', name: 'Cost Forecast', icon: '💰', desc: 'Forecast cloud spend' },
    { id: 'detect-anomalies', name: 'Anomaly Detection', icon: '📊', desc: 'Detect anomalies in a metric series' },
  ];

  const inp = { width: '100%', padding: 12, marginBottom: 12, background: '#1a1a2e', border: '1px solid #0f3460', borderRadius: 8, color: '#e0e0e0', fontSize: 14, outline: 'none', minHeight: 100, resize: 'vertical', fontFamily: 'monospace', boxSizing: 'border-box' };
  const inpSm = { ...inp, minHeight: 'auto' };

  return (
    <div style={{ padding: 30 }}>
      <h1 style={{ fontSize: 24, color: '#e0e0e0', marginBottom: 8 }}>🤖 AI New Tools</h1>
      <p style={{ color: '#888', marginBottom: 24 }}>Stateless AI advisors for scaling and security posture</p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {tools.map(t => (
          <div
            key={t.id}
            onClick={() => { setTab(t.id); setResult(null); setError(null); }}
            style={{
              padding: '16px 20px',
              background: tab === t.id ? '#16213e' : '#1a1a2e',
              borderRadius: 10,
              cursor: 'pointer',
              border: tab === t.id ? '2px solid #e94560' : '2px solid transparent',
              flex: 1,
              minWidth: 200,
            }}
          >
            <div style={{ fontSize: 28, marginBottom: 8 }}>{t.icon}</div>
            <div style={{ color: '#fff', fontWeight: 'bold', fontSize: 14, marginBottom: 4 }}>{t.name}</div>
            <div style={{ color: '#888', fontSize: 12 }}>{t.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#16213e', padding: 24, borderRadius: 12, marginBottom: 20, border: '1px solid #0f3460' }}>
        {tab === 'recommend-scaling' && (
          <>
            <label style={{ color: '#a0a0b0', fontSize: 12 }}>Service Name *</label>
            <input
              style={inpSm}
              type="text"
              value={serviceName}
              onChange={(e) => setServiceName(e.target.value)}
              placeholder="e.g., checkout-api"
            />
            <label style={{ color: '#a0a0b0', fontSize: 12 }}>Metrics * (JSON or text)</label>
            <textarea
              style={inp}
              value={metrics}
              onChange={(e) => setMetrics(e.target.value)}
              placeholder='{"cpu_pct_p95": 78, "memory_pct_p95": 62, "rps": 1200, "error_rate_pct": 0.4, "current_replicas": 6}'
            />
            <label style={{ color: '#a0a0b0', fontSize: 12 }}>Traffic Pattern (optional, JSON or text)</label>
            <textarea
              style={inp}
              value={trafficPattern}
              onChange={(e) => setTrafficPattern(e.target.value)}
              placeholder='{"peak_hours": "09:00-11:00 UTC", "weekly_seasonality": true}'
            />
            <button
              onClick={handleRecommendScaling}
              disabled={loading || !serviceName || !metrics}
              style={{
                padding: '12px 24px',
                background: loading ? '#555' : '#e94560',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                width: '100%',
              }}
            >
              {loading ? '⏳ Analyzing...' : '📈 Recommend Scaling'}
            </button>
          </>
        )}

        {tab === 'predict-failure' && (
          <>
            <label style={{ color: '#a0a0b0', fontSize: 12 }}>Component *</label>
            <input style={inpSm} type="text" value={pfComponent} onChange={(e) => setPfComponent(e.target.value)} placeholder="e.g., db-primary-01" />
            <label style={{ color: '#a0a0b0', fontSize: 12 }}>Telemetry (optional, JSON or text)</label>
            <textarea style={inp} value={pfTelemetry} onChange={(e) => setPfTelemetry(e.target.value)} placeholder='{"disk_io_wait_pct": 22, "errors_last_1h": 12, "uptime_days": 412}' />
            <label style={{ color: '#a0a0b0', fontSize: 12 }}>History (optional, JSON or text)</label>
            <textarea style={inp} value={pfHistory} onChange={(e) => setPfHistory(e.target.value)} placeholder='{"prior_incidents": ["disk_full_2024_11_03"]}' />
            <button onClick={handlePredictFailure} disabled={loading || !pfComponent} style={{ padding: '12px 24px', background: loading ? '#555' : '#e94560', color: '#fff', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', width: '100%' }}>
              {loading ? '⏳ Predicting...' : '⚠️ Predict Failure'}
            </button>
          </>
        )}

        {tab === 'incident-prediction' && (
          <>
            <label style={{ color: '#a0a0b0', fontSize: 12 }}>Recent Incidents (optional, JSON or text)</label>
            <textarea style={inp} value={ipRecent} onChange={(e) => setIpRecent(e.target.value)} placeholder='[{"class":"db_failover","severity":"P2"}]' />
            <label style={{ color: '#a0a0b0', fontSize: 12 }}>System State (optional, JSON or text)</label>
            <textarea style={inp} value={ipState} onChange={(e) => setIpState(e.target.value)} placeholder='{"open_alerts": 3, "deploys_last_24h": 7}' />
            <label style={{ color: '#a0a0b0', fontSize: 12 }}>Time Window (hours)</label>
            <input style={inpSm} type="number" value={ipWindow} onChange={(e) => setIpWindow(e.target.value)} />
            <button onClick={handleIncidentPrediction} disabled={loading} style={{ padding: '12px 24px', background: loading ? '#555' : '#e94560', color: '#fff', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', width: '100%' }}>
              {loading ? '⏳ Predicting...' : '🔮 Predict Incidents'}
            </button>
          </>
        )}

        {tab === 'cost-forecasting' && (
          <>
            <label style={{ color: '#a0a0b0', fontSize: 12 }}>Historical Spend * (JSON or text)</label>
            <textarea style={inp} value={cfHistorical} onChange={(e) => setCfHistorical(e.target.value)} placeholder='[{"month":"2025-01","spend":12000},{"month":"2025-02","spend":13500}]' />
            <label style={{ color: '#a0a0b0', fontSize: 12 }}>Growth Factors (optional, JSON or text)</label>
            <textarea style={inp} value={cfGrowth} onChange={(e) => setCfGrowth(e.target.value)} placeholder='{"new_product_launch":"Q3","headcount_growth_pct":15}' />
            <label style={{ color: '#a0a0b0', fontSize: 12 }}>Forecast Months</label>
            <input style={inpSm} type="number" value={cfMonths} onChange={(e) => setCfMonths(e.target.value)} />
            <button onClick={handleCostForecasting} disabled={loading || !cfHistorical} style={{ padding: '12px 24px', background: loading ? '#555' : '#e94560', color: '#fff', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', width: '100%' }}>
              {loading ? '⏳ Forecasting...' : '💰 Forecast Cost'}
            </button>
          </>
        )}

        {tab === 'detect-anomalies' && (
          <>
            <label style={{ color: '#a0a0b0', fontSize: 12 }}>Metric Name *</label>
            <input style={inpSm} type="text" value={daMetric} onChange={(e) => setDaMetric(e.target.value)} placeholder="e.g., requests_per_second" />
            <label style={{ color: '#a0a0b0', fontSize: 12 }}>Series * (JSON array or text)</label>
            <textarea style={inp} value={daSeries} onChange={(e) => setDaSeries(e.target.value)} placeholder='[120, 130, 125, 800, 140, 135]' />
            <label style={{ color: '#a0a0b0', fontSize: 12 }}>Baseline (optional, JSON or text)</label>
            <textarea style={inp} value={daBaseline} onChange={(e) => setDaBaseline(e.target.value)} placeholder='{"mean":130,"stddev":12}' />
            <button onClick={handleDetectAnomalies} disabled={loading || !daMetric || !daSeries} style={{ padding: '12px 24px', background: loading ? '#555' : '#e94560', color: '#fff', border: 'none', borderRadius: 8, cursor: loading ? 'not-allowed' : 'pointer', fontWeight: 'bold', width: '100%' }}>
              {loading ? '⏳ Analyzing...' : '📊 Detect Anomalies'}
            </button>
          </>
        )}

        {tab === 'security-risk-assessment' && (
          <>
            <label style={{ color: '#a0a0b0', fontSize: 12 }}>Posture Summary * (JSON or text)</label>
            <textarea
              style={inp}
              value={postureSummary}
              onChange={(e) => setPostureSummary(e.target.value)}
              placeholder='{"open_findings": 12, "critical_count": 2, "compliance_score": 78, "iam_review_overdue_days": 45}'
            />
            <label style={{ color: '#a0a0b0', fontSize: 12 }}>Asset Inventory (optional, JSON or text)</label>
            <textarea
              style={inp}
              value={assetInventory}
              onChange={(e) => setAssetInventory(e.target.value)}
              placeholder='{"vms": 22, "kubernetes_clusters": 3, "databases": 5, "public_endpoints": 4}'
            />
            <button
              onClick={handleSecurityAssessment}
              disabled={loading || !postureSummary}
              style={{
                padding: '12px 24px',
                background: loading ? '#555' : '#e94560',
                color: '#fff',
                border: 'none',
                borderRadius: 8,
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                width: '100%',
              }}
            >
              {loading ? '⏳ Assessing...' : '🛡️ Run Security Assessment'}
            </button>
          </>
        )}
      </div>

      {error && (
        <div style={{ background: '#2a1818', padding: 16, borderRadius: 12, border: '1px solid #e94560', color: '#fecaca', marginBottom: 16 }}>
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && (
        <div style={{ background: '#16213e', padding: 24, borderRadius: 12, border: '1px solid #e94560' }}>
          <h3 style={{ color: '#e94560', margin: '0 0 16px' }}>✨ AI Result</h3>
          {renderResult(
            tab === 'recommend-scaling' ? result.scaling_recommendation :
            tab === 'security-risk-assessment' ? result.assessment :
            tab === 'predict-failure' ? result.prediction :
            tab === 'incident-prediction' ? result.prediction :
            tab === 'cost-forecasting' ? result.forecast :
            tab === 'detect-anomalies' ? result.detection :
            result
          )}
        </div>
      )}
    </div>
  );
}
