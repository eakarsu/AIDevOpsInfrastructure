
function hasProviderKey(env=process.env){return Boolean(env.OPENROUTER_API_KEY||env.OPENAI_API_KEY);}
function esc(v){if(v===null||v===undefined)return '';const s=String(v);return /[",\n]/.test(s)?'"'+s.replace(/"/g,'""')+'"':s;}
function toCSV(rows,columns){const cols=columns&&columns.length?columns:Object.keys(rows[0]||{});return [cols.join(','),...rows.map(r=>cols.map(c=>esc(r[c])).join(','))].join('\n')+(rows.length?'\n':'');}
function filterRows(rows,{q='',status,priority,...rest}={}){const needle=String(q||'').toLowerCase();return rows.filter(r=>{if(needle&&!Object.values(r).some(v=>v!==null&&v!==undefined&&String(v).toLowerCase().includes(needle)))return false;if(status!==undefined&&status!==''&&String(r.status??'')!==String(status))return false;if(priority!==undefined&&priority!==''&&String(r.priority??'')!==String(priority))return false;for(const[k,v]of Object.entries(rest)){if(v!==undefined&&v!==''&&String(r[k]??'')!==String(v))return false;}return true;});}
function validateTask(b={}){if(!b.title||!String(b.title).trim())return 'title is required';if(b.status&&!['pending','in_progress','completed','cancelled'].includes(b.status))return 'invalid status';return null;}
function section(label,value){return {label,value:value===undefined?null:value};}

function incidentSeverity(rows=[]){const sev=rows.filter(r=>['SEV-1','critical','high'].includes(String(r.severity||''))).length;return {aiGenerated:false,provider:'deterministic-fallback',feature:'incident-severity',sections:[section('Total incidents',rows.length),section('High severity',sev),section('Summary',sev+' high-severity incident(s)')],sev,total:rows.length};}
function failureRisk(rows=[]){const open=rows.filter(r=>r.status!=='resolved'&&r.status!=='closed').length;return {aiGenerated:false,provider:'deterministic-fallback',feature:'failure-risk',sections:[section('Total incidents',rows.length),section('Open incidents',open),section('Score (open count)',open)],open,total:rows.length,score:open};}
function costAnomaly(rows=[]){return {aiGenerated:false,provider:'deterministic-fallback',feature:'cost-anomaly',sections:[section('Total incidents',rows.length),section('Anomaly score',0),section('Summary','No provider anomaly prediction without a key; 0 preserved')],total:rows.length,score:0};}

module.exports={hasProviderKey,toCSV,filterRows,validateTask,section,incidentSeverity,failureRisk,costAnomaly};
