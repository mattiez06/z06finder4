import express from 'express';import morgan from 'morgan';import cors from 'cors';import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';import path from 'path';import { fileURLToPath } from 'url';
import { fetchEbay } from './scrapers/ebay.js';import { fetchBAT } from './scrapers/bringATrailer.js';import { fetchGoogleMeta } from './scrapers/googleMeta.js';
import { isC6Z06Vin } from './utils/vin.js';
dotenv.config();
const app=express(); const PORT=process.env.PORT||3000;
const __filename=fileURLToPath(import.meta.url); const __dirname=path.dirname(__filename);
app.use(cors()); app.use(morgan('dev')); app.use(express.json());
const apiLimiter=rateLimit({ windowMs:60_000, max:120 }); app.use('/api/', apiLimiter);
const parseBool=v=>v===undefined?undefined:String(v).toLowerCase()==='true'; const parseIntU=v=>{const n=parseInt(v,10); return Number.isNaN(n)?undefined:n;};
function normalize(it){return { id:it.id, source:it.source, title:it.title, url:it.url, thumbnail:it.thumbnail||'', price:it.price??null, year:it.year??null, mileage:it.mileage??null, location:it.location||'', transmission:(it.transmission||'').toLowerCase(), salvage:Boolean(it.salvage), postedAt:it.postedAt||null, description:it.description||'', vin:it.vin||'' };}
async function aggregate(q){ const src=q.source? q.source.split(',').map(s=>s.trim().toLowerCase()):null; const pulls=[];
  if(!src||src.includes('ebay')) pulls.push(fetchEbay(q));
  if(!src||src.includes('bat')) pulls.push(fetchBAT(q));
  if(!src||src.includes('google')) pulls.push(fetchGoogleMeta(q));
  let items=(await Promise.all(pulls)).flat().map(normalize);
  const minYear=parseIntU(q.minYear), maxYear=parseIntU(q.maxYear), minPrice=parseIntU(q.minPrice), maxPrice=parseIntU(q.maxPrice);
  const hasSalvage=parseBool(q.hasSalvage), tx=q.transmission?String(q.transmission).toLowerCase():undefined, term=q.q, loc=q.location, vinOnly=parseBool(q.vinOnly);
  items=items.filter(it=>{
    if(term){ const hay=`${it.title} ${it.description} ${it.location}`.toLowerCase(); if(!hay.includes(String(term).toLowerCase())) return false; }
    if(loc && !String(it.location||'').toLowerCase().includes(String(loc).toLowerCase())) return false;
    if(minYear!==undefined && (it.year??0) < minYear) return false;
    if(maxYear!==undefined && (it.year??9999) > maxYear) return false;
    if(minPrice!==undefined && (it.price??0) < minPrice) return false;
    if(maxPrice!==undefined && (it.price??0) > maxPrice) return false;
    if(tx && (it.transmission||'').toLowerCase() !== tx) return false;
    if(hasSalvage!==undefined && Boolean(it.salvage) !== hasSalvage) return false;
    if(vinOnly && !isC6Z06Vin(it.vin||'')) return false;
    return true;
  });
  items.sort((a,b)=>{ const t=(new Date(b.postedAt).getTime()||0)-(new Date(a.postedAt).getTime()||0); if(t) return t; return (a.price||0)-(b.price||0); });
  const page=Math.max(1, parseInt(q.page,10)||1); const limit=Math.max(1, Math.min(100, parseInt(q.limit,10)||24));
  const total=items.length; const pageCount=Math.max(1, Math.ceil(total/limit)); const start=(page-1)*limit; const paged=items.slice(start, start+limit);
  return { items:paged, total, page, pageCount };
}
app.get('/healthz', (req,res)=>res.json({ok:true}));
app.get('/api/sources', (req,res)=> res.json({ sources:[
  {id:'ebay',name:'eBay Motors (API)',enabled:Boolean(process.env.EBAY_APP_ID)},
  {id:'bat',name:'Bring a Trailer (RSS)',enabled:true},
  {id:'google',name:'Google Programmable Search',enabled:Boolean(process.env.GOOGLE_API_KEY&&process.env.GOOGLE_CX)}
]}));
app.get('/api/listings', async (req,res)=>{ try{ const data=await aggregate(req.query); res.json(data); }catch(e){ console.error(e); res.status(500).json({error:'Server error'});} });
app.get('/api/listings.csv', async (req,res)=>{ try{ const data=await aggregate(req.query);
  const headers=['id','source','title','year','price','mileage','transmission','salvage','location','postedAt','url','vin'];
  const rows=[headers.join(',')].concat(data.items.map(it=>headers.map(h=>{let v=it[h]; if(v==null) v=''; const s=String(v).replace(/"/g,'""'); return /[",\n]/.test(s)?`"${s}"`:s;}).join(',')));
  res.setHeader('Content-Type','text/csv; charset=utf-8'); res.setHeader('Content-Disposition','attachment; filename="z06-listings.csv"'); res.send(rows.join('\n'));
} catch(e){ console.error(e); res.status(500).json({error:'Server error'});} });
app.use(express.static(path.join(__dirname,'public')));
app.get('*',(req,res)=> res.sendFile(path.join(__dirname,'public','index.html')));
app.listen(PORT, ()=> console.log('Z06 Finder running at http://localhost:'+PORT));