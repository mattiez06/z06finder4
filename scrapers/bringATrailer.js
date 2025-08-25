
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

    return items
      .filter(it => {
        const title = (it?.title?.[0] || '').toLowerCase();
        return q ? title.includes(q) : true;
      })
      .map((it, i) => {
        const desc = it?.description?.[0] || it?.['content:encoded']?.[0] || '';
        // Try media tags first
        let thumb =
          it?.['media:content']?.[0]?.$?.url ||
          it?.['media:thumbnail']?.[0]?.$?.url ||
          // Fallback: first <img src="..."> in the description HTML
          (desc.match(/<img[^>]+src="([^"]+)"/i)?.[1] || '');

        return {
          id: `bat-${i}`,
          source: 'Bring a Trailer',
          title: it?.title?.[0] || 'BaT Listing',
          url: it?.link?.[0],
          thumbnail: thumb,
          price: null,
          year: guessYear(it?.title?.[0] || ''),
          mileage: null,
          location: '',
          transmission: '',
          salvage: false,
          postedAt: it?.pubDate?.[0] ? new Date(it.pubDate[0]).toISOString() : null,
          description: desc.replace(/<[^>]+>/g, '').slice(0, 280)
        };
      });
  } catch (e) {
    console.error('BAT RSS error', e);
    return [];
  }
}

function guessYear(title) {
  const m = title.match(/\b(200[5-9]|201[0-3])\b/);
  return m ? Number(m[0]) : null;
}
