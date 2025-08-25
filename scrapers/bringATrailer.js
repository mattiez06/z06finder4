import fetch from 'node-fetch';
import { parseStringPromise } from 'xml2js';

export async function fetchBAT(query = {}) {
  const base = process.env.BAT_RSS || 'https://bringatrailer.com/search/?s=corvette+z06&feed=rss2';
  try {
    const res = await fetch(base);
    const xml = await res.text();
    const rss = await parseStringPromise(xml);
    const items = rss?.rss?.channel?.[0]?.item || [];
    const q = (query.q || '').toLowerCase();
    const filtered = items.filter(it => {
      const title = (it?.title?.[0] || '').toLowerCase();
      return q ? title.includes(q) : true;
    });

    return filtered.map((it, i) => ({
      id: `bat-${i}`,
      source: 'Bring a Trailer',
      title: it?.title?.[0] || 'BaT Listing',
      url: it?.link?.[0],
      thumbnail: '',
      price: null,
      year: guessYear(it?.title?.[0] || ''),
      mileage: null,
      location: '',
      transmission: '',
      salvage: false,
      postedAt: it?.pubDate?.[0] ? new Date(it.pubDate[0]).toISOString() : null,
      description: (it?.description?.[0] || '').replace(/<[^>]+>/g, '').slice(0, 280)
    }));
  } catch (e) {
    console.error('BAT RSS error', e);
    return [];
  }
}

function guessYear(title) {
  const m = title.match(/\b(200[5-9]|201[0-3])\b/);
  return m ? Number(m[0]) : null;
}
