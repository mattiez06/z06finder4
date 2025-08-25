import fetch from 'node-fetch';

export async function fetchEbay(query = {}) {
  const appId = process.env.EBAY_APP_ID;
  if (!appId) return [];
  const keywords = encodeURIComponent(query.q || 'Corvette Z06');
  const url = `https://svcs.ebay.com/services/search/FindingService/v1`
    + `?OPERATION-NAME=findItemsByKeywords`
    + `&SERVICE-VERSION=1.0.0`
    + `&SECURITY-APPNAME=${appId}`
    + `&RESPONSE-DATA-FORMAT=JSON`
    + `&paginationInput.entriesPerPage=50`
    + `&keywords=${keywords}`
    + `&categoryId=6001`;

  try {
    const res = await fetch(url, { headers: { 'Accept': 'application/json' } });
    const data = await res.json();
    const items = data?.findItemsByKeywordsResponse?.[0]?.searchResult?.[0]?.item || [];
    return items.map((it, i) => ({
      id: `ebay-${it?.itemId?.[0] || i}`,
      source: 'eBay',
      title: it?.title?.[0] || 'eBay Listing',
      url: it?.viewItemURL?.[0],
      thumbnail: it?.galleryURL?.[0] || '',
      price: Number(it?.sellingStatus?.[0]?.currentPrice?.[0]?.__value__) || null,
      year: null, mileage: null,
      location: it?.location?.[0] || '',
      transmission: '', salvage: false,
      postedAt: new Date().toISOString(),
      description: ''
    }));
  } catch (e) {
    console.error('eBay fetch error', e);
    return [];
  }
}
