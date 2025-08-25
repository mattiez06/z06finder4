const els = {
  q:document.getElementById('q'), location:document.getElementById('location'),
  minYear:document.getElementById('minYear'), maxYear:document.getElementById('maxYear'),
  minPrice:document.getElementById('minPrice'), maxPrice:document.getElementById('maxPrice'),
  source:document.getElementById('source'), vinOnly:document.getElementById('vinOnly'),
  searchBtn:document.getElementById('searchBtn'), csvLink:document.getElementById('csvLink'),
  grid:document.getElementById('grid'), stats:document.getElementById('stats'), pageInfo:document.getElementById('pageInfo')
};
let state = { page:1, limit:24, total:0, pageCount:1 };

function buildQs(){
  const p = new URLSearchParams();
  ['q','location','minYear','maxYear','minPrice','maxPrice','source'].forEach(k=>{
    const v = els[k].value.trim(); if (v) p.set(k, v);
  });
  if (els.vinOnly.checked) p.set('vinOnly','true');
  p.set('page', state.page); p.set('limit', state.limit);
  els.csvLink.href = '/api/listings.csv?' + p.toString();
  return p.toString();
}

async function run(){
  els.grid.innerHTML = '<p class="muted">Loading…</p>';
  const r = await fetch('/api/listings?' + buildQs());
  const d = await r.json();
  state.total=d.total; state.pageCount=d.pageCount;
  els.pageInfo.textContent = `Page ${state.page} of ${state.pageCount}`;
  els.stats.textContent = `${d.total} result(s)`;
  render(d.items);
}

function badgeColor(source){
  if(!source) return '#333';
  const s = source.toLowerCase();
  if(s.includes('ebay')) return '#1268eb';
  if(s.includes('trailer')) return '#e05d1b';
  if(s.includes('google')) return '#0dbb58';
  return '#444';
}

function render(items){
  if(!items.length){ els.grid.innerHTML = '<p class="muted">No results</p>'; return; }
  els.grid.innerHTML = items.map(it=>{
    const img = (it.thumbnail && it.thumbnail.startsWith('http')) ? it.thumbnail : '/z06-placeholder.svg';
    return `
    <article class="card">
      <a href="${it.url}" target="_blank" rel="noopener">
        <img class="thumb" src="${img}" alt="" onerror="this.src='/z06-placeholder.svg'">
      </a>
      <div class="pad">
        <h3 class="title">${it.year ? it.year + ' • ' : ''}${it.title}</h3>
        <div class="row">
          <strong class="price">${it.price ? ('$' + it.price.toLocaleString()) : '—'}</strong>
          <span class="muted small">${it.mileage ? it.mileage.toLocaleString() + ' mi' : '—'}</span>
        </div>
        <div class="row">
          <div class="muted small">${it.location || ''}</div>
          <span class="badge" style="background:${badgeColor(it.source)}">${it.source || ''}</span>
        </div>
      </div>
    </article>`;
  }).join('');
}

document.getElementById('prevBtn').onclick=()=>{ if(state.page>1){ state.page--; run(); } };
document.getElementById('nextBtn').onclick=()=>{ if(state.page<state.pageCount){ state.page++; run(); } };
els.searchBtn.onclick=()=>{ state.page=1; run(); };

run();
