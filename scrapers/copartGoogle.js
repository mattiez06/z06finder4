import fetch from 'node-fetch';

export async function fetchCopart(query = {}) {
  const key = process.env.GOOGLE_API_KEY;
  const cx  = process.env.GOOGLE_CX;
  if (!key || !cx) return []; // no keys set → skip Copart

  // Only Copart lot pages
  const q = [(query.q || 'Corvette Z06'), 'site:copart.com/lot'].join(' ');
  const url = `https://www.googleapis.com/customsearch/v1?key=${encodeURIComponent(key)}&cx=${encodeURIComponent(cx)}&q=${encodeURIComponent(q)}`;

  try {
    const r = await fetch(url);
    const d = await r.json();
    const items = d.items || [];

    return items.map((it, i) => {
      const pm = it.pagemap || {};
      const thumb =
        (pm.cse_thumbnail && pm.cse_thumbnail[0]?.src) ||
        (pm.cse_image && pm.cse_image[0]?.src) ||
        '';
      const title = it.title || '';
      const yearMatch = title.match(/\b(200[5-9]|201[0-3])\b/);

      return {
        id: `copart-${i}`,
        source: 'Copart (via Google)',
        title,
        url: it.link,
        thumbnail: thumb,
        price: null,
        year: yearMatch ? Number(yearMatch[0]) : null,
        mileage: null,
        location: '',
        transmission: '',
        salvage: true, // Copart is salvage/auction by default
        postedAt: new Date().toISOString(),
        description: it.snippet || ''
      };
    });
  } catch (e) {
    console.error('Copart via Google error', e);
    return [];
  }
}
