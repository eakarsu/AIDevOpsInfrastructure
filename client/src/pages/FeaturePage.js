import React, { useState, useEffect, useCallback } from 'react';
import Pagination from '../components/Pagination';

function FeaturePage({ feature, fields, token }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({});
  const [aiLoading, setAiLoading] = useState(false);
  const [aiOutput, setAiOutput] = useState(null);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [aiHistory, setAiHistory] = useState([]);

  const API = `http://localhost:3001${feature.apiPath}`;
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}?page=${page}&limit=20`, { headers });
      const data = await res.json();
      // Paginated response: { data: [], pagination: { page, limit, total, totalPages } }
      if (data && Array.isArray(data.data)) {
        setItems(data.data);
        setTotalPages(data.pagination?.totalPages || 1);
        setTotal(data.pagination?.total || data.data.length);
      } else {
        setItems(Array.isArray(data) ? data : []);
        setTotalPages(1);
        setTotal(Array.isArray(data) ? data.length : 0);
      }
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, [feature.key, page]);

  // Fetch AI history for selected item
  const fetchAIHistory = useCallback(async (itemId) => {
    if (!itemId) return setAiHistory([]);
    try {
      const res = await fetch(`http://localhost:3001/api/ai-insights/${feature.key.replace(/-/g, '_')}/${itemId}?page=1&limit=5`, { headers });
      const data = await res.json();
      if (data && Array.isArray(data.data)) setAiHistory(data.data);
    } catch (err) { /* silent */ }
  }, [feature.key]);

  useEffect(() => {
    fetchItems();
    setShowDetail(false);
    setShowForm(false);
    setAiOutput(null);
  }, [feature.key]);

  const handleRowClick = (item) => {
    setSelectedItem(item);
    setShowDetail(true);
    setShowForm(false);
    setAiOutput(item.ai_output ? { success: true, result: item.ai_output, model: 'cached' } : null);
    fetchAIHistory(item.id);
  };

  const handleNew = () => {
    const empty = {};
    fields.forEach(f => {
      if (f.type === 'checkbox') empty[f.name] = false;
      else empty[f.name] = '';
    });
    setFormData(empty);
    setEditMode(false);
    setShowForm(true);
    setShowDetail(false);
    setAiOutput(null);
  };

  const handleEdit = () => {
    const data = {};
    fields.forEach(f => { data[f.name] = selectedItem[f.name] ?? ''; });
    setFormData(data);
    setEditMode(true);
    setShowForm(true);
    setShowDetail(false);
  };

  const handleDelete = async () => {
    if (!window.confirm(`Delete "${selectedItem.title}"?`)) return;
    try {
      await fetch(`${API}/${selectedItem.id}`, { method: 'DELETE', headers });
      setShowDetail(false);
      setSelectedItem(null);
      fetchItems();
    } catch (err) { alert('Delete failed: ' + err.message); }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const method = editMode ? 'PUT' : 'POST';
      const url = editMode ? `${API}/${selectedItem.id}` : API;
      const body = { ...formData };
      fields.forEach(f => {
        if (f.type === 'number' && body[f.name] !== '' && body[f.name] !== null) {
          body[f.name] = Number(body[f.name]);
        }
      });
      const res = await fetch(url, { method, headers, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setShowForm(false);
      fetchItems();
      if (editMode) { setSelectedItem(data); setShowDetail(true); }
    } catch (err) { alert('Save failed: ' + err.message); }
    finally { setSaving(false); }
  };

  const handleAiGenerate = async () => {
    setAiLoading(true);
    setAiOutput(null);
    try {
      const bodyData = showForm ? formData : (selectedItem || {});
      const res = await fetch(`${API}/ai/generate`, { method: 'POST', headers, body: JSON.stringify(bodyData) });
      const data = await res.json();
      setAiOutput(data);
    } catch (err) { setAiOutput({ success: false, error: err.message }); }
    finally { setAiLoading(false); }
  };

  const handleFormChange = (name, value) => {
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // Rich AI content formatter
  const formatAiContent = (text) => {
    if (!text) return '';
    let html = text;

    // Code blocks
    html = html.replace(/```(\w*)\n([\s\S]*?)```/g, '<div class="code-block">$2</div>');
    html = html.replace(/```([\s\S]*?)```/g, '<div class="code-block">$1</div>');

    // Tables - convert markdown tables
    html = html.replace(/(\|.+\|)\n(\|[-\s|:]+\|)\n((?:\|.+\|\n?)+)/g, (match, header, sep, body) => {
      const headerCells = header.split('|').filter(c => c.trim()).map(c => `<th>${c.trim()}</th>`).join('');
      const rows = body.trim().split('\n').map(row => {
        const cells = row.split('|').filter(c => c.trim()).map(c => {
          let cell = c.trim();
          // Color status indicators
          if (cell.includes('✅')) cell = `<span style="color:#3FB950">${cell}</span>`;
          if (cell.includes('⚠')) cell = `<span style="color:#F0883E">${cell}</span>`;
          if (cell.includes('❌')) cell = `<span style="color:#F85149">${cell}</span>`;
          if (cell.includes('↑')) cell = `<span style="color:#F85149">${cell}</span>`;
          if (cell.includes('↓')) cell = `<span style="color:#3FB950">${cell}</span>`;
          if (cell.includes('→')) cell = `<span style="color:#8B949E">${cell}</span>`;
          return `<td>${cell}</td>`;
        }).join('');
        return `<tr>${cells}</tr>`;
      }).join('');
      return `<div class="table-container"><table><thead><tr>${headerCells}</tr></thead><tbody>${rows}</tbody></table></div>`;
    });

    // Headers
    html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
    html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
    html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');

    // Bold & italic
    html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');

    // Inline code
    html = html.replace(/`(.*?)`/g, '<span class="inline-code">$1</span>');

    // List items
    html = html.replace(/^- (.*$)/gm, '<div class="list-item">$1</div>');
    html = html.replace(/^\d+\. (.*$)/gm, '<div class="list-item"><strong>$&</strong></div>');

    // Newlines
    html = html.replace(/\n/g, '<br/>');

    return html;
  };

  const getDisplayColumns = () => {
    const cols = ['title'];
    const extra = fields
      .filter(f => !['description', 'status', 'title', 'ai_output'].includes(f.name) && f.type !== 'textarea' && f.type !== 'checkbox')
      .slice(0, 3)
      .map(f => f.name);
    return [...cols, ...extra, 'status'];
  };

  const displayCols = getDisplayColumns();

  const renderCellValue = (item, col) => {
    const val = item[col];
    if (col === 'status') {
      return <span className={`status-badge status-${val}`}>{val?.replace(/_/g, ' ')}</span>;
    }
    if (col === 'severity' && val) {
      const sevNum = val.replace('SEV-', '');
      return <span className={`severity-badge sev-${sevNum}`}>{val}</span>;
    }
    if (col === 'title') {
      return <span style={{ fontWeight: 600, color: '#F0F6FC' }}>{val}</span>;
    }
    if (col === 'monthly_cost' || col === 'potential_savings') {
      return `$${parseFloat(val || 0).toLocaleString()}`;
    }
    return String(val ?? '—');
  };

  return (
    <div className="feature-page">
      <div className="feature-header">
        <div className="feature-header-left">
          <span className="feature-header-icon">{feature.icon}</span>
          <div>
            <h1 className="feature-title">{feature.label}</h1>
            <div className="feature-count">{total || items.length} items</div>
          </div>
        </div>
        <button className="btn-new" onClick={handleNew}>+ New Item</button>
      </div>

      {/* Table */}
      {loading ? (
        <div className="empty-state">
          <div className="ai-loading-spinner" style={{ margin: '0 auto 12px' }}></div>
          <div className="empty-state-text">Loading...</div>
        </div>
      ) : items.length === 0 ? (
        <div className="data-table-container">
          <div className="empty-state">
            <div className="empty-state-icon">{feature.icon}</div>
            <div className="empty-state-text">No items yet</div>
            <div className="empty-state-sub">Click "+ New Item" to create your first entry</div>
          </div>
        </div>
      ) : (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                {displayCols.map(col => (
                  <th key={col}>{col.replace(/_/g, ' ')}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {items.map(item => (
                <tr key={item.id} onClick={() => handleRowClick(item)}>
                  {displayCols.map(col => (
                    <td key={col}>{renderCellValue(item, col)}</td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
        </div>
      )}

      {/* Detail Modal */}
      {showDetail && selectedItem && (
        <div className="modal-overlay" onClick={() => { setShowDetail(false); setAiOutput(null); }}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{feature.icon} {selectedItem.title}</h2>
              <button className="modal-close" onClick={() => { setShowDetail(false); setAiOutput(null); }}>&times;</button>
            </div>
            <div className="modal-body">
              <div className="detail-grid">
                {fields.filter(f => f.name !== 'title').map(f => {
                  const val = selectedItem[f.name];
                  if (val === null || val === undefined || val === '') return null;
                  const isLong = f.type === 'textarea' || String(val).length > 80;
                  return (
                    <div key={f.name} className={`detail-item ${isLong ? 'full-width' : ''}`}>
                      <div className="detail-label">{f.label}</div>
                      <div className="detail-value">
                        {f.type === 'checkbox' ? (val ? 'Yes' : 'No') :
                         f.name === 'status' ? <span className={`status-badge status-${val}`}>{val?.replace(/_/g, ' ')}</span> :
                         f.name === 'severity' ? <span className={`severity-badge sev-${String(val).replace('SEV-','')}`}>{val}</span> :
                         (f.name === 'monthly_cost' || f.name === 'potential_savings') ? `$${parseFloat(val).toLocaleString()}` :
                         String(val)}
                      </div>
                    </div>
                  );
                }).filter(Boolean)}
              </div>

              <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
                <button className="btn-ai" onClick={handleAiGenerate} disabled={aiLoading}>
                  {aiLoading ? <><div className="ai-loading-spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></div> Generating...</> : <><span>✨</span> Generate AI Analysis</>}
                </button>
              </div>

              {aiLoading && (
                <div className="ai-output-container" style={{ marginTop: 16 }}>
                  <div className="ai-loading"><div className="ai-loading-spinner"></div>AI is analyzing your infrastructure...</div>
                </div>
              )}

              {aiOutput && !aiLoading && (
                <div className="ai-output-container" style={{ marginTop: 16 }}>
                  <div className="ai-output-header">
                    <span className="ai-output-badge">AI ANALYSIS</span>
                    <span className="ai-output-model">{aiOutput.model || 'OpenRouter'} {aiOutput.mock ? '(Demo)' : ''}</span>
                    {aiOutput.success === false && <span style={{ color: '#F85149', fontSize: 11 }}>{aiOutput.error}</span>}
                  </div>
                  <div className="ai-output-body">
                    <div className="ai-output-content" dangerouslySetInnerHTML={{ __html: formatAiContent(aiOutput.result || aiOutput.error || 'No response') }} />
                  </div>
                  {aiOutput.parsed && Object.keys(aiOutput.parsed).length > 0 && !aiOutput.parsed.raw_response && (
                    <details style={{ marginTop: 8, padding: 8, background: '#0D1117', borderRadius: 4 }}>
                      <summary style={{ cursor: 'pointer', fontSize: 11, color: '#58A6FF', fontWeight: 600 }}>Parsed JSON</summary>
                      <pre style={{ margin: 0, padding: 8, color: '#C9D1D9', fontSize: 11, overflow: 'auto' }}>{JSON.stringify(aiOutput.parsed, null, 2)}</pre>
                    </details>
                  )}
                  {aiOutput.usage && (
                    <div className="ai-output-meta">
                      <span>prompt: {aiOutput.usage.prompt_tokens}</span>
                      <span>completion: {aiOutput.usage.completion_tokens}</span>
                      <span>id: {aiOutput.id}</span>
                    </div>
                  )}
                </div>
              )}

              {aiHistory && aiHistory.length > 0 && (
                <div style={{ marginTop: 16, padding: 12, background: '#0D1117', borderRadius: 6, border: '1px solid #30363D' }}>
                  <div style={{ fontSize: 11, fontWeight: 700, color: '#58A6FF', textTransform: 'uppercase', marginBottom: 8 }}>AI Analysis History ({aiHistory.length})</div>
                  {aiHistory.map(h => (
                    <div key={h.id} style={{ padding: '6px 0', borderBottom: '1px solid #30363D', fontSize: 12 }}>
                      <div style={{ color: '#8B949E' }}>{new Date(h.created_at).toLocaleString()}</div>
                      <div style={{ color: '#C9D1D9', marginTop: 2 }}>{(h.prompt_summary || '').slice(0, 120)}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-danger" onClick={handleDelete}>Delete</button>
              <button className="btn-secondary" onClick={handleEdit}>Edit</button>
              <button className="btn-secondary" onClick={() => { setShowDetail(false); setAiOutput(null); }}>Close</button>
            </div>
          </div>
        </div>
      )}

      {/* Create / Edit Form Modal */}
      {showForm && (
        <div className="modal-overlay" onClick={() => setShowForm(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">{editMode ? 'Edit' : 'New'} Item</h2>
              <button className="modal-close" onClick={() => setShowForm(false)}>&times;</button>
            </div>
            <form onSubmit={handleSave}>
              <div className="modal-body">
                <div className="form-grid">
                  {fields.map(f => (
                    <div key={f.name} className={`form-group ${f.type === 'textarea' ? 'full-width' : ''}`}>
                      <label className="form-label">{f.label}</label>
                      {f.type === 'textarea' ? (
                        <textarea className="form-textarea" value={formData[f.name] || ''} onChange={e => handleFormChange(f.name, e.target.value)} rows={3} />
                      ) : f.type === 'select' ? (
                        <select className="form-select" value={formData[f.name] || f.options?.[0] || ''} onChange={e => handleFormChange(f.name, e.target.value)}>
                          {f.options?.map(o => <option key={o} value={o}>{o}</option>)}
                        </select>
                      ) : f.type === 'checkbox' ? (
                        <label className="form-checkbox">
                          <input type="checkbox" checked={!!formData[f.name]} onChange={e => handleFormChange(f.name, e.target.checked)} />
                          <span>{formData[f.name] ? 'Yes' : 'No'}</span>
                        </label>
                      ) : (
                        <input className="form-input" type={f.type} value={formData[f.name] ?? ''} onChange={e => handleFormChange(f.name, e.target.value)} required={f.required} placeholder={`Enter ${f.label.toLowerCase()}`} />
                      )}
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: 20, display: 'flex', gap: 8 }}>
                  <button type="button" className="btn-ai" onClick={handleAiGenerate} disabled={aiLoading}>
                    {aiLoading ? <><div className="ai-loading-spinner" style={{ width: 14, height: 14, borderWidth: 2 }}></div> Generating...</> : <><span>✨</span> Generate AI Analysis</>}
                  </button>
                </div>

                {aiLoading && (
                  <div className="ai-output-container" style={{ marginTop: 16 }}>
                    <div className="ai-loading"><div className="ai-loading-spinner"></div>AI is analyzing...</div>
                  </div>
                )}

                {aiOutput && !aiLoading && (
                  <div className="ai-output-container" style={{ marginTop: 16 }}>
                    <div className="ai-output-header">
                      <span className="ai-output-badge">AI ANALYSIS</span>
                      <span className="ai-output-model">{aiOutput.model || 'OpenRouter'} {aiOutput.mock ? '(Demo)' : ''}</span>
                    </div>
                    <div className="ai-output-body">
                      <div className="ai-output-content" dangerouslySetInnerHTML={{ __html: formatAiContent(aiOutput.result || aiOutput.error || 'No response') }} />
                    </div>
                    {aiOutput.usage && (
                      <div className="ai-output-meta">
                        <span>prompt: {aiOutput.usage.prompt_tokens}</span>
                        <span>completion: {aiOutput.usage.completion_tokens}</span>
                      </div>
                    )}
                  </div>
                )}
              </div>
              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="btn-primary" style={{ width: 'auto', padding: '8px 24px' }} disabled={saving}>
                  {saving ? 'Saving...' : editMode ? 'Update' : 'Create'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default FeaturePage;
