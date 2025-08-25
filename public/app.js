
function render(items) {
  if (!items.length) {
    els.grid.innerHTML = '<p class="muted">No results</p>';
    return;
  }
  els.grid.innerHTML = items.map(it => `
    <article class="card">
      <a href="${it.url}" target="_blank" rel="noopener">
        ${it.thumbnail
          ? `<img class="thumb" src="${it.thumbnail}" alt="listing image"
               onerror="this.src='https://via.placeholder.com/640x360?text=No+Image'">`
          : `<img class="thumb" src="https://via.placeholder.com/640x360?text=No+Image" alt="no image">`
        }
      </a>
      <div class="pad">
        <h3 class="title">${it.year ? it.year + ' • ' : ''}${it.title}</h3>
        <div class="row">
          <strong class="price">${it.price ? ('$' + it.price.toLocaleString()) : '—'}</strong>
          <span class="muted small">${it.mileage ? it.mileage.toLocaleString() + ' mi' : '—'}</span>
        </div>
        <div class="muted small">${it.location || ''}</div>
        <div class="muted small" style="margin-top:6px">${it.source}</div>
      </div>
    </article>
  `).join('');
}
