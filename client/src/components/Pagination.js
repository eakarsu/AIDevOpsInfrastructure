import React from 'react';

export default function Pagination({ page, totalPages, onPageChange }) {
  if (!totalPages || totalPages <= 1) return null;
  const goto = (p) => {
    if (p < 1 || p > totalPages || p === page) return;
    onPageChange(p);
  };
  const start = Math.max(1, page - 2);
  const end = Math.min(totalPages, start + 4);
  const pages = [];
  for (let i = start; i <= end; i++) pages.push(i);
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '14px 0', flexWrap: 'wrap' }}>
      <button className="btn-secondary" style={{ padding: '4px 10px' }} onClick={() => goto(1)} disabled={page <= 1}>« First</button>
      <button className="btn-secondary" style={{ padding: '4px 10px' }} onClick={() => goto(page - 1)} disabled={page <= 1}>‹ Prev</button>
      {pages.map(p => (
        <button key={p} className={p === page ? 'btn-primary' : 'btn-secondary'} style={{ padding: '4px 10px', fontWeight: p === page ? 700 : 400 }} onClick={() => goto(p)}>{p}</button>
      ))}
      <button className="btn-secondary" style={{ padding: '4px 10px' }} onClick={() => goto(page + 1)} disabled={page >= totalPages}>Next ›</button>
      <button className="btn-secondary" style={{ padding: '4px 10px' }} onClick={() => goto(totalPages)} disabled={page >= totalPages}>Last »</button>
      <span style={{ marginLeft: 8, fontSize: 12, color: '#8B949E' }}>Page {page} of {totalPages}</span>
    </div>
  );
}
