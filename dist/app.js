const METRICS = [
  { id: 'sacrament', name: 'Frequência da reunião sacramental', short: 'Reunião sacramental', category: 'Viver', color: '#007bff', target: 667, baseline: 515, type: 'snapshot' },
  { id: 'participating', name: 'Membros participantes', short: 'Membros participantes', category: 'Viver', color: '#007bff', target: 471, baseline: 585, type: 'snapshot' },
  { id: 'returning', name: 'Membros retornando', short: 'Membros retornando', category: 'Cuidar', color: '#00a857', target: 103, baseline: null, type: 'snapshot' },
  { id: 'fasting', name: 'Membros jejuando mensalmente', short: 'Membros jejuando', category: 'Cuidar', color: '#00a857', target: 175, baseline: 54, type: 'snapshot' },
  { id: 'baptisms', name: 'Batismos de conversos', short: 'Batismos', category: 'Convidar', color: '#0f172a', target: 131, baseline: 116, type: 'cumulative' },
  { id: 'missionaries', name: 'Missionários servindo do Brasil', short: 'Missionários servindo', category: 'Convidar', color: '#0f172a', target: 28, baseline: 9, type: 'snapshot' },
  { id: 'endowed', name: 'Recomendações para o templo — com investidura', short: 'Recomendação c/ investidura', category: 'Unir', color: '#64748b', target: 355, baseline: 278, type: 'snapshot' },
  { id: 'unendowed', name: 'Recomendações para o templo — sem investidura', short: 'Recomendação s/ investidura', category: 'Unir', color: '#64748b', target: 147, baseline: 118, type: 'snapshot' }
];

const PUBLISHED_DATA = window.STAKE_DASHBOARD_DATA;
const PUBLISHED_VERSION = PUBLISHED_DATA.version;
const STARTER_REPORTS = PUBLISHED_DATA.reports;
const UNITS = PUBLISHED_DATA.units;

const MONTHS = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
const STORAGE_KEY = 'jaboatao-stake-dashboard-v1';
let reports = loadReports();

function loadReports() {
  try {
    const saved = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (Array.isArray(saved) && saved.length) return saved;
    if (Array.isArray(saved?.reports) && saved.reports.length) {
      if (saved.baseVersion === PUBLISHED_VERSION) return saved.reports;
      const merged = new Map(saved.reports.map(report => [`${report.year}-${report.month}`, report]));
      STARTER_REPORTS.forEach(report => merged.set(`${report.year}-${report.month}`, structuredClone(report)));
      return [...merged.values()];
    }
    return structuredClone(STARTER_REPORTS);
  } catch { return structuredClone(STARTER_REPORTS); }
}
function saveReports() { localStorage.setItem(STORAGE_KEY, JSON.stringify({ baseVersion:PUBLISHED_VERSION, reports })); }
saveReports();
function latestReport() { return [...reports].sort((a,b) => (a.year*12+a.month)-(b.year*12+b.month)).at(-1); }
function valueStatus(metric, value, report = latestReport()) {
  if (value === null || value === undefined || value === '') return { key:'missing', label:'Sem dados', ratio:null };
  let ratio = value / metric.target;
  if (metric.type === 'cumulative') ratio = (value / report.month * 12) / metric.target;
  if (ratio >= .9) return { key:'good', label:'No caminho', ratio };
  if (ratio >= .7) return { key:'watch', label:'Atenção', ratio };
  return { key:'risk', label:'Prioridade', ratio };
}
function formatNumber(value) { return value === null || value === undefined ? '—' : new Intl.NumberFormat('pt-BR').format(value); }
function signed(value) { if (!Number.isFinite(value)) return '—'; return `${value > 0 ? '+' : ''}${formatNumber(value)}`; }
function reportDate(r) { return `${MONTHS[r.month-1]} de ${r.year}`; }
function monthShort(n) { return MONTHS[n-1].slice(0,3); }

function render() {
  reports.sort((a,b) => (a.year*12+a.month)-(b.year*12+b.month));
  const latest = latestReport();
  document.querySelector('#latestMonthLabel').textContent = reportDate(latest);
  document.querySelector('#reportsCount').textContent = reports.length;
  document.querySelector('#updatedLabel').textContent = `Base: ${monthShort(latest.month)} ${latest.year}`;
  document.querySelector('#unitHelp').textContent = `O cálculo usa os cinco indicadores por unidade disponíveis no relatório de ${PUBLISHED_DATA.unitReportLabel}. “Falta” representa a distância entre o valor atual e a meta informada no relatório.`;
  renderScore(latest);
  renderInsights(latest);
  renderMetricCards(latest);
  renderTrendOptions();
  renderTrend();
  renderUnits();
  renderReports();
}

function renderScore(latest) {
  const scores = METRICS.map(m => valueStatus(m, latest.values[m.id], latest).ratio).filter(v => v !== null).map(v => Math.min(v, 1));
  const score = Math.round(scores.reduce((a,b) => a+b, 0) / scores.length * 100);
  document.querySelector('#scoreValue').textContent = `${score}%`;
  document.querySelector('#scoreRing').style.setProperty('--score', score);
  document.querySelector('#scoreCaption').textContent = score >= 80 ? 'A estaca avança bem, com alguns indicadores pedindo foco.' : 'Há progresso, mas os indicadores prioritários pedem ação coordenada.';
}

function renderInsights(latest) {
  const states = METRICS.map(m => ({ metric:m, value:latest.values[m.id], state:valueStatus(m, latest.values[m.id], latest) }));
  const best = states.filter(x => x.state.ratio !== null).sort((a,b) => b.state.ratio-a.state.ratio)[0];
  const risk = states.filter(x => x.state.ratio !== null).sort((a,b) => a.state.ratio-b.state.ratio)[0];
  const bapt = states.find(x => x.metric.id === 'baptisms');
  const projection = bapt.value ? Math.round(bapt.value/latest.month*12) : null;
  const items = [
    { key:'good', icon:'↑', label:'Força atual', title:`${best.metric.short}: ${Math.round(best.value/best.metric.target*100)}% da meta`, text:'O indicador já alcançou o patamar esperado. Vale identificar e compartilhar as práticas que estão sustentando esse resultado.' },
    { key:'risk', icon:'!', label:'Maior lacuna', title:`${risk.metric.short}: ${formatNumber(risk.value)} de ${formatNumber(risk.metric.target)}`, text:`Mantido o nível atual, este é o indicador com maior distância proporcional da meta e merece um plano de ação específico.` },
    { key:'watch', icon:'↗', label:'Projeção anual', title:`Batismos: projeção de ${formatNumber(projection)}`, text:`No ritmo até ${monthShort(latest.month)}, a projeção fica em ${Math.round(projection/131*100)}% da meta anual de 131. É preciso acelerar o acompanhamento de amigos e novos conversos.` }
  ];
  document.querySelector('#insightsGrid').innerHTML = items.map(i => `<article class="insight ${i.key}"><div class="insight-head"><span class="insight-icon">${i.icon}</span><span class="insight-label">${i.label}</span></div><h3>${i.title}</h3><p>${i.text}</p></article>`).join('');
}

function renderMetricCards(latest) {
  const previous = reports.filter(r => r.year*12+r.month < latest.year*12+latest.month).at(-1);
  document.querySelector('#metricGrid').innerHTML = METRICS.map(m => {
    const value = latest.values[m.id];
    const state = valueStatus(m, value, latest);
    const rawRatio = value === null ? 0 : value/m.target;
    const delta = previous && value !== null && previous.values[m.id] !== null ? value-previous.values[m.id] : null;
    const contextual = m.type === 'cumulative' && value !== null ? `Projeção: ${Math.round(value/latest.month*12)}` : `2025: ${formatNumber(m.baseline)}`;
    return `<article class="metric-card" style="--accent:${m.color}" data-metric="${m.id}" tabindex="0">
      <div class="metric-card-top"><div><span class="metric-category">${m.category}</span><h3 class="metric-name">${m.name}</h3></div><span class="status-pill ${state.key}">${state.label}</span></div>
      <div class="metric-values"><strong>${formatNumber(value)}</strong><span>de ${formatNumber(m.target)}</span></div>
      <div class="progress-track"><div class="progress-bar" style="width:${Math.min(rawRatio*100,100)}%"></div></div>
      <div class="metric-foot"><span>${contextual}</span><span>vs. mês anterior <b>${delta === null ? '—' : signed(delta)}</b></span></div>
    </article>`;
  }).join('');
  document.querySelectorAll('.metric-card').forEach(card => {
    const choose = () => { document.querySelector('#trendMetric').value = card.dataset.metric; renderTrend(); document.querySelector('.trend-section').scrollIntoView({behavior:'smooth'}); };
    card.addEventListener('click', choose);
    card.addEventListener('keydown', e => { if (e.key === 'Enter') choose(); });
  });
}

function renderTrendOptions() {
  const select = document.querySelector('#trendMetric');
  const current = select.value || 'sacrament';
  select.innerHTML = METRICS.map(m => `<option value="${m.id}">${m.short}</option>`).join('');
  select.value = current;
}

function renderTrend() {
  const metric = METRICS.find(m => m.id === document.querySelector('#trendMetric').value) || METRICS[0];
  const data = reports.map(r => ({ label:monthShort(r.month), month:r.month, value:r.values[metric.id] })).filter(d => d.value !== null && d.value !== undefined);
  const current = data.at(-1)?.value ?? null;
  const previous = data.at(-2)?.value ?? null;
  document.querySelector('#trendCurrent').textContent = formatNumber(current);
  document.querySelector('#trendTarget').textContent = formatNumber(metric.target);
  document.querySelector('#trendDelta').textContent = current !== null && previous !== null ? signed(current-previous) : '—';
  document.querySelector('#trendDelta').style.color = current !== null && previous !== null && current-previous >= 0 ? 'var(--good)' : 'var(--risk)';
  drawLineChart(data, metric);
}

function drawLineChart(data, metric) {
  const host = document.querySelector('#trendChart');
  const width = 980, height = 300, pad = {l:52,r:28,t:28,b:44};
  const values = [...data.map(d=>d.value), metric.target];
  let min = Math.min(...values), max = Math.max(...values);
  const margin = Math.max((max-min)*.28, max*.08, 5); min = Math.max(0,min-margin); max += margin;
  const x = i => pad.l + (data.length === 1 ? 0 : i*(width-pad.l-pad.r)/(data.length-1));
  const y = v => pad.t + (max-v)*(height-pad.t-pad.b)/(max-min);
  const points = data.map((d,i)=>`${x(i)},${y(d.value)}`).join(' ');
  const area = data.length ? `${x(0)},${height-pad.b} ${points} ${x(data.length-1)},${height-pad.b}` : '';
  const grid = [0,.25,.5,.75,1].map(t => { const val=max-(max-min)*t, yy=pad.t+(height-pad.t-pad.b)*t; return `<line x1="${pad.l}" x2="${width-pad.r}" y1="${yy}" y2="${yy}" stroke="#e8e6e0"/><text x="${pad.l-10}" y="${yy+4}" text-anchor="end" font-size="9" fill="#8a918f">${Math.round(val)}</text>`; }).join('');
  const targetY = y(metric.target);
  host.innerHTML = `<svg viewBox="0 0 ${width} ${height}" aria-hidden="true">
    <defs><linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${metric.color}" stop-opacity=".28"/><stop offset="1" stop-color="${metric.color}" stop-opacity=".02"/></linearGradient></defs>
    ${grid}<line x1="${pad.l}" x2="${width-pad.r}" y1="${targetY}" y2="${targetY}" stroke="#9ba09e" stroke-dasharray="5 5"/><text x="${width-pad.r}" y="${targetY-7}" text-anchor="end" font-size="9" fill="#737a78">Meta ${metric.target}</text>
    ${data.length ? `<polygon points="${area}" fill="url(#areaGradient)"/><polyline points="${points}" fill="none" stroke="${metric.color}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` : ''}
    ${data.map((d,i)=>`<circle cx="${x(i)}" cy="${y(d.value)}" r="5" fill="#fff" stroke="${metric.color}" stroke-width="3"/><text x="${x(i)}" y="${y(d.value)-13}" text-anchor="middle" font-size="10" font-weight="800" fill="#343a38">${d.value}</text><text x="${x(i)}" y="${height-17}" text-anchor="middle" font-size="9" fill="#7a817f">${d.label}</text>`).join('')}
  </svg>`;
}

function cell(value, target) {
  const ratio = value/target, key = ratio >= .9 ? 'good' : ratio >= .7 ? 'watch' : 'risk';
  return `<span class="cell-value"><i class="mini-dot ${key}"></i><b>${value}</b><span class="cell-goal">/ ${target}</span></span>`;
}
function renderUnits() {
  document.querySelector('#unitTableBody').innerHTML = UNITS.map((u,index) => `<tr><td><button class="unit-link" data-unit-index="${index}" aria-label="Ver foco sugerido para ${u.name}">${u.name}</button></td><td>${cell(...u.sacrament)}</td><td>${cell(...u.participating)}</td><td>${cell(...u.fasting)}</td><td>${cell(...u.baptisms)}</td><td>${cell(...u.endowed)}</td></tr>`).join('');
  const ranked = UNITS.map(u => ({...u, score:['sacrament','participating','fasting','baptisms','endowed'].reduce((sum,k)=>sum+Math.min(u[k][0]/u[k][1],1),0)/5})).sort((a,b)=>a.score-b.score);
  const focus = ranked[0];
  document.querySelector('#focusTitle').textContent = focus.name;
  document.querySelector('#focusText').textContent = 'A menor média proporcional entre os cinco indicadores disponíveis. Uma conversa focada pode destravar avanços rápidos.';
  const gaps = ['sacrament','participating','fasting','baptisms','endowed'].map(id => ({ metric:METRICS.find(m=>m.id===id), pair:focus[id] })).sort((a,b)=>a.pair[0]/a.pair[1]-b.pair[0]/b.pair[1]).slice(0,3);
  document.querySelector('#focusList').innerHTML = gaps.map(g=>`<div class="focus-item"><span>${g.metric.short}</span><strong>${g.pair[0]} de ${g.pair[1]} · faltam ${Math.max(g.pair[1]-g.pair[0],0)}</strong></div>`).join('');
  document.querySelectorAll('[data-unit-index]').forEach(button => button.addEventListener('click', () => openUnitDialog(UNITS[Number(button.dataset.unitIndex)])));
}

function openUnitDialog(unit) {
  const metricIds = ['sacrament','participating','fasting','baptisms','endowed'];
  const details = metricIds.map(id => {
    const metric = METRICS.find(m => m.id === id);
    const [current,target] = unit[id];
    return { metric, current, target, ratio: current/target, gap: target-current };
  }).sort((a,b) => a.ratio-b.ratio);
  const score = Math.round(details.reduce((sum,item) => sum+Math.min(item.ratio,1),0)/details.length*100);
  const missing = details.filter(item => item.gap > 0).length;
  document.querySelector('#unitDialogTitle').textContent = unit.name;
  document.querySelector('#unitScore').textContent = `${score}%`;
  document.querySelector('#unitSummaryTitle').textContent = missing ? `${missing} ${missing === 1 ? 'indicador abaixo' : 'indicadores abaixo'} da meta` : 'Todos os indicadores alcançados';
  document.querySelector('#unitSummaryText').textContent = missing ? 'Os itens estão ordenados da maior para a menor lacuna proporcional, facilitando a definição de prioridades.' : 'A unidade alcançou ou superou todas as metas disponíveis neste relatório.';
  document.querySelector('#unitFocusList').innerHTML = details.map(item => {
    const complete = item.gap <= 0;
    const gapText = complete ? `+${Math.abs(item.gap)}` : item.gap;
    const gapLabel = complete ? 'acima da meta' : 'faltam para a meta';
    return `<div class="unit-focus-row" style="--row-color:${item.metric.color}">
      <div class="unit-focus-name"><span>${item.metric.category}</span><strong>${item.metric.short}</strong></div>
      <div class="unit-focus-progress" title="${Math.round(item.ratio*100)}% da meta"><i style="width:${Math.min(item.ratio*100,100)}%"></i></div>
      <div class="unit-gap ${complete?'complete':''}"><strong>${gapText}</strong><span>${gapLabel}<br>${item.current} de ${item.target}</span></div>
    </div>`;
  }).join('');
  document.querySelector('#unitDialog').showModal();
}

function renderReports() {
  document.querySelector('#reportsList').innerHTML = [...reports].reverse().map(r => {
    const count = METRICS.filter(m => r.values[m.id] !== null && r.values[m.id] !== undefined).length;
    const quality = count === METRICS.length ? ['good','Completo'] : count >= 6 ? ['watch','Parcial'] : ['risk','Incompleto'];
    return `<div class="report-row"><div class="report-month"><strong>${reportDate(r)}</strong><span>${r.source || 'Entrada manual'}</span></div><div>${count} de ${METRICS.length} indicadores</div><div class="quality"><i class="mini-dot ${quality[0]}"></i>${quality[1]}</div><div class="report-actions"><button class="text-button" data-edit="${r.year}-${r.month}">Editar</button></div></div>`;
  }).join('');
  document.querySelectorAll('[data-edit]').forEach(btn => btn.addEventListener('click', () => {
    const [year,month] = btn.dataset.edit.split('-').map(Number); openReportDialog(reports.find(r => r.year===year && r.month===month));
  }));
}

function setupForm() {
  document.querySelector('#reportMonth').innerHTML = MONTHS.map((m,i)=>`<option value="${i+1}">${m}</option>`).join('');
  document.querySelector('#metricFormGrid').innerHTML = METRICS.map(m=>`<label class="metric-input"><span>${m.short}</span><small>Meta 2026: ${m.target}${m.type==='cumulative'?' · acumulado':' · valor do mês'}</small><input type="number" min="0" step="1" id="input-${m.id}" placeholder="Sem dados"></label>`).join('');
}
function openReportDialog(report = null) {
  const nextMonth = Math.min((latestReport()?.month || 0)+1,12);
  document.querySelector('#reportMonth').value = report?.month || nextMonth;
  document.querySelector('#reportYear').value = report?.year || 2026;
  METRICS.forEach(m => document.querySelector(`#input-${m.id}`).value = report?.values[m.id] ?? '');
  document.querySelector('#reportDialog').showModal();
}
function saveFormReport(event) {
  event.preventDefault();
  const year = Number(document.querySelector('#reportYear').value), month = Number(document.querySelector('#reportMonth').value);
  const values = Object.fromEntries(METRICS.map(m => { const raw=document.querySelector(`#input-${m.id}`).value; return [m.id, raw===''?null:Number(raw)]; }));
  const existing = reports.findIndex(r => r.year===year && r.month===month);
  const item = { year, month, source:'Entrada manual', values };
  if (existing >= 0) reports[existing] = {...reports[existing], ...item}; else reports.push(item);
  saveReports(); document.querySelector('#reportDialog').close(); render(); toast('Relatório salvo com sucesso.');
}
function exportData() {
  const payload = { title:'Painel da Estaca Jaboatão dos Guararapes', exportedAt:new Date().toISOString(), publishedVersion:PUBLISHED_VERSION, metrics:METRICS.map(({id,name,target,type})=>({id,name,target,type})), reports };
  const blob = new Blob([JSON.stringify(payload,null,2)], {type:'application/json'}); const url=URL.createObjectURL(blob); const a=document.createElement('a'); a.href=url; a.download='painel-estaca-jaboatao-2026.json'; a.click(); URL.revokeObjectURL(url); toast('Cópia de segurança exportada.');
}
function importData(file) {
  const reader = new FileReader(); reader.onload = () => { try { const parsed=JSON.parse(reader.result); if(!Array.isArray(parsed.reports)) throw new Error(); reports=parsed.reports; saveReports(); render(); toast('Dados importados com sucesso.'); } catch { toast('Arquivo inválido. Use um JSON exportado por este painel.'); } }; reader.readAsText(file);
}
function toast(message) { const el=document.querySelector('#toast'); el.textContent=message; el.classList.add('show'); clearTimeout(toast.timer); toast.timer=setTimeout(()=>el.classList.remove('show'),2800); }

setupForm(); render();
document.querySelector('#trendMetric').addEventListener('change', renderTrend);
document.querySelector('#newReportButton').addEventListener('click', () => openReportDialog());
document.querySelector('#reportForm').addEventListener('submit', saveFormReport);
document.querySelector('#closeDialogButton').addEventListener('click', () => document.querySelector('#reportDialog').close());
document.querySelector('#cancelDialogButton').addEventListener('click', () => document.querySelector('#reportDialog').close());
document.querySelector('#closeUnitDialogButton').addEventListener('click', () => document.querySelector('#unitDialog').close());
document.querySelector('#doneUnitDialogButton').addEventListener('click', () => document.querySelector('#unitDialog').close());
document.querySelector('#exportButton').addEventListener('click', exportData);
document.querySelector('#importInput').addEventListener('change', e => e.target.files[0] && importData(e.target.files[0]));
document.querySelector('#resetButton').addEventListener('click', () => { if(confirm('Restaurar os dados oficiais publicados? Entradas locais serão removidas.')) { reports=structuredClone(STARTER_REPORTS); saveReports(); render(); toast('Dados publicados restaurados.'); } });
document.querySelector('#menuButton').addEventListener('click', () => document.querySelector('.sidebar').classList.toggle('open'));
document.querySelectorAll('.nav-item').forEach(a => a.addEventListener('click', () => { document.querySelectorAll('.nav-item').forEach(x=>x.classList.remove('active')); a.classList.add('active'); document.querySelector('.sidebar').classList.remove('open'); }));
