import React, { useState } from 'react';

const API_URL = 'http://localhost:3001/api';

const renderResult = (obj, depth = 0) => {
  if (!obj) return null;
  if (typeof obj === 'string') return <p style={{ color: '#e0e0e0', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{obj}</p>;
  if (Array.isArray(obj)) return <div style={{ marginLeft: depth * 12 }}>{obj.map((item, i) =>
    <div key={i} style={{ background: '#1a1a2e', padding: 12, borderRadius: 8, marginBottom: 8, borderLeft: '3px solid #e94560' }}>
      {typeof item === 'object' ? renderResult(item, depth + 1) : <span style={{ color: '#e0e0e0' }}>{String(item)}</span>}
    </div>)}</div>;
  return <div style={{ marginLeft: depth * 12 }}>{Object.entries(obj).map(([k, v]) =>
    <div key={k} style={{ marginBottom: 12 }}>
      <div style={{ color: '#e94560', fontSize: 13, fontWeight: 'bold', textTransform: 'uppercase', marginBottom: 4 }}>{k.replace(/_/g, ' ')}</div>
      {typeof v === 'object' && v !== null ? renderResult(v, depth + 1) :
        <div style={{ color: '#e0e0e0', background: '#1a1a2e', padding: '8px 12px', borderRadius: 6, fontSize: 14 }}>
          {typeof v === 'number' ? <span style={{ color: '#2ecc71', fontWeight: 'bold', fontSize: 18 }}>{v}</span> :
           typeof v === 'boolean' ? <span style={{ color: v ? '#2ecc71' : '#e94560', fontWeight: 'bold' }}>{v ? 'Yes' : 'No'}</span> : String(v)}
        </div>}
    </div>)}</div>;
};

export default function CICDAgentsPage({ token }) {
  const [tab, setTab] = useState('analyze-failure');
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [buildLogs, setBuildLogs] = useState('');
  const [errorOutput, setErrorOutput] = useState('');
  const [pipelineConfig, setPipelineConfig] = useState('');
  const [repoInfo, setRepoInfo] = useState('');

  const run = async (endpoint, body) => {
    setLoading(true); setResult(null);
    try {
      const res = await fetch(`${API_URL}/cicd-agents/${endpoint}`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify(body)
      });
      setResult(await res.json());
    } catch (err) { setResult({ error: err.message }); }
    setLoading(false);
  };

  const agents = [
    { id: 'analyze-failure', name: 'Failure Analyzer', icon: '🔍', desc: 'Analyze CI/CD build failures and get fix suggestions' },
    { id: 'optimize-pipeline', name: 'Pipeline Optimizer', icon: '⚡', desc: 'Optimize pipeline config for speed and reliability' },
    { id: 'security-scan', name: 'Security Scanner', icon: '🛡️', desc: 'Security analysis of CI/CD pipeline and repo' },
  ];

  const inp = { width: '100%', padding: 12, marginBottom: 12, background: '#1a1a2e', border: '1px solid #0f3460', borderRadius: 8, color: '#e0e0e0', fontSize: 14, outline: 'none', minHeight: 100, resize: 'vertical', fontFamily: 'monospace', boxSizing: 'border-box' };

  return (
    <div style={{ padding: 30 }}>
      <h1 style={{ fontSize: 24, color: '#e0e0e0', marginBottom: 8 }}>🤖 CI/CD Pipeline Agents</h1>
      <p style={{ color: '#888', marginBottom: 24 }}>AI-powered CI/CD analysis, optimization, and security scanning</p>

      <div style={{ display: 'flex', gap: 12, marginBottom: 24, flexWrap: 'wrap' }}>
        {agents.map(a => (
          <div key={a.id} onClick={() => { setTab(a.id); setResult(null); }}
            style={{ padding: '16px 20px', background: tab === a.id ? '#16213e' : '#1a1a2e', borderRadius: 10, cursor: 'pointer', border: tab === a.id ? '2px solid #e94560' : '2px solid transparent', flex: 1, minWidth: 200 }}>
            <div style={{ fontSize: 28, marginBottom: 8 }}>{a.icon}</div>
            <div style={{ color: '#fff', fontWeight: 'bold', fontSize: 14, marginBottom: 4 }}>{a.name}</div>
            <div style={{ color: '#888', fontSize: 12 }}>{a.desc}</div>
          </div>
        ))}
      </div>

      <div style={{ background: '#16213e', padding: 24, borderRadius: 12, marginBottom: 20, border: '1px solid #0f3460' }}>
        {tab === 'analyze-failure' && <>
          <label style={{ color: '#a0a0b0', fontSize: 12 }}>Build Logs</label>
          <textarea style={inp} value={buildLogs} onChange={e => setBuildLogs(e.target.value)} placeholder="Paste build logs here..." />
          <label style={{ color: '#a0a0b0', fontSize: 12 }}>Error Output</label>
          <textarea style={inp} value={errorOutput} onChange={e => setErrorOutput(e.target.value)} placeholder="Paste error output here..." />
          <button onClick={() => run('analyze-failure', { build_logs: buildLogs, error_output: errorOutput })} disabled={loading || !buildLogs}
            style={{ padding: '12px 24px', background: loading ? '#555' : '#e94560', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>
            {loading ? '⏳ Analyzing...' : '🔍 Analyze Failure'}
          </button>
        </>}

        {tab === 'optimize-pipeline' && <>
          <label style={{ color: '#a0a0b0', fontSize: 12 }}>Pipeline Configuration (JSON or YAML)</label>
          <textarea style={inp} value={pipelineConfig} onChange={e => setPipelineConfig(e.target.value)} placeholder='{"stages": ["build", "test", "deploy"], "language": "node", ...}' />
          <button onClick={() => run('optimize-pipeline', { pipeline_config: pipelineConfig })} disabled={loading || !pipelineConfig}
            style={{ padding: '12px 24px', background: loading ? '#555' : '#e94560', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>
            {loading ? '⏳ Optimizing...' : '⚡ Optimize Pipeline'}
          </button>
        </>}

        {tab === 'security-scan' && <>
          <label style={{ color: '#a0a0b0', fontSize: 12 }}>Repository / Pipeline Info</label>
          <textarea style={inp} value={repoInfo} onChange={e => setRepoInfo(e.target.value)} placeholder='{"repo": "myorg/myapp", "language": "python", "ci_tool": "GitHub Actions", ...}' />
          <button onClick={() => run('security-scan', { repo_info: repoInfo })} disabled={loading || !repoInfo}
            style={{ padding: '12px 24px', background: loading ? '#555' : '#e94560', color: '#fff', border: 'none', borderRadius: 8, cursor: 'pointer', fontWeight: 'bold', width: '100%' }}>
            {loading ? '⏳ Scanning...' : '🛡️ Security Scan'}
          </button>
        </>}
      </div>

      {result && (
        <div style={{ background: '#16213e', padding: 24, borderRadius: 12, border: '1px solid #e94560' }}>
          <h3 style={{ color: '#e94560', margin: '0 0 16px' }}>✨ AI Result</h3>
          {renderResult(result)}
        </div>
      )}
    </div>
  );
}
