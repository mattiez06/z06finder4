import fetch from 'node-fetch';

export async function fetchGoogleMeta(query = {}) {
  const key = process.env.GOOGLE_API_KEY;
  const cx  = process.env.GOOGLE_CX;
  if (!key || !cx) return [];

  const sites = (process.env.GOOGLE_SITES || '')
    .split(',').map(s => s.trim()).filter(Boolean);
  const siteStr = sites.map(s => `site:${s}`).join(' OR ');
  const q = [query.q || 'Corvette Z06', siteStr].filter(Boolean).join(' ');
  const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(key)}&cx=${encodeURIComponent(cx)}&q=${encodeURIComponent(q)}`;

  try {
    const res = await fetch(url);
    const data = await res.json();
    const items = data.items || [];
    return items.map((it, i) => ({
      id: `g-${i}`,
      source: 'Google Meta',
      title: it.title || 'Listing',
      url: it.link,
      thumbnail: '',
      price: null, year: null, mileage: null, location: '',
      transmission: '', salvage: false,
      postedAt: new Date().toISOString(),
      description: it.snippet || ''
    }));
  } catch (e) {
    console.error('Google meta error', e);
    return [];
  }
}
