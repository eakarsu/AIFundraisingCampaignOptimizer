'use strict';
// FP wave 35C routes: authenticated tasks, export, domain AI (provider only when key set).
const express = require('express');
const D = require('../domain/featurePack35c');
const db = require('../db');
const auth = require('../middleware/auth');
const router = express.Router();
let ready = null;
const ensure = () => { if (!ready) { ready = db.query(`CREATE TABLE IF NOT EXISTS fp35c_tasks (id SERIAL PRIMARY KEY, title TEXT NOT NULL, status TEXT DEFAULT 'open', assignee TEXT, due_date DATE, notes TEXT, created_by INTEGER, created_at TIMESTAMP DEFAULT NOW(), updated_at TIMESTAMP DEFAULT NOW())`).catch((e)=>{ready=null;throw e;}); } return ready; };
async function ai(res, fallbackFn, records) {
  if (!D.hasProvider()) return res.json(fallbackFn(records));
  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', { method:'POST', headers:{ Authorization:`Bearer ${process.env.OPENROUTER_API_KEY||process.env.OPENAI_API_KEY}`, 'Content-Type':'application/json' }, body: JSON.stringify({ model: process.env.OPENROUTER_MODEL||'openai/gpt-4o-mini', messages:[{role:'user', content:'Summarise as JSON: '+JSON.stringify(records).slice(0,4000)}] }) });
    const j = await r.json(); const text = j.choices?.[0]?.message?.content;
    if (!text) throw new Error('empty provider response');
    return res.json({ aiGenerated:true, provider:'openrouter', sections:{ summary:text, metrics:{ recordCount: Array.isArray(records)?records.length:0 } } });
  } catch { return res.json(fallbackFn(records)); }
}
router.get('/tasks', auth, async (req,res)=>{ try{ await ensure(); const {rows}=await db.query('SELECT * FROM fp35c_tasks ORDER BY id DESC LIMIT 500'); res.json({ data: D.filterRecords(rows, req.query) }); }catch(e){ res.status(500).json({error:e.message}); } });
router.post('/tasks', auth, async (req,res)=>{ try{ const t=D.validateTask(req.body||{}); await ensure(); const {rows}=await db.query('INSERT INTO fp35c_tasks (title,status,assignee,due_date,notes,created_by) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',[t.title,t.status,t.assignee,t.due_date,t.notes,req.user?.id??null]); res.status(201).json(rows[0]); }catch(e){ res.status(e.message==='title is required'?400:500).json({error:e.message}); } });
router.put('/tasks/:id', auth, async (req,res)=>{ try{ await ensure(); const b=req.body||{}; const {rows}=await db.query(`UPDATE fp35c_tasks SET title=COALESCE($1,title),status=COALESCE($2,status),assignee=COALESCE($3,assignee),due_date=COALESCE($4,due_date),notes=COALESCE($5,notes),updated_at=NOW() WHERE id=$6 RETURNING *`,[b.title??null,b.status??null,b.assignee??null,b.due_date??null,b.notes??null,req.params.id]); if(!rows.length) return res.status(404).json({error:'Task not found'}); res.json(rows[0]); }catch(e){ res.status(500).json({error:e.message}); } });
router.get('/export', auth, async (req,res)=>{ try{ await ensure(); const {rows}=await db.query('SELECT * FROM fp35c_tasks ORDER BY id DESC LIMIT 500'); const filtered=D.filterRecords(rows, req.query); const out=D.buildExport(filtered, req.query.format||'json'); res.setHeader('Content-Type', out.contentType); if(out.format==='csv') res.setHeader('Content-Disposition','attachment; filename="tasks-export.csv"'); res.send(out.body); }catch(e){ res.status(500).json({error:e.message}); } });

router.post('/ai/campaign-momentum', auth, async (req,res)=>{ const records = Array.isArray(req.body?.records) ? req.body.records : (await db.query('SELECT * FROM campaigns ORDER BY id DESC LIMIT 100').catch(()=>({rows:[]}))).rows; return ai(res, D.campaignMomentum, records); });
router.post('/ai/donor-insight', auth, async (req,res)=>{ const records = Array.isArray(req.body?.records) ? req.body.records : (await db.query('SELECT * FROM donors ORDER BY id DESC LIMIT 100').catch(()=>({rows:[]}))).rows; return ai(res, D.donorSegmentInsight, records); });
router.post('/ai/goal-forecast', auth, async (req,res)=>{ const records = Array.isArray(req.body?.records) ? req.body.records : (await db.query('SELECT * FROM campaigns ORDER BY id DESC LIMIT 100').catch(()=>({rows:[]}))).rows; return ai(res, D.goalForecast, records); });

module.exports = router;
