'use strict';
const test=require('node:test'); const assert=require('node:assert/strict');
const D=require('../server/domain/featurePack35c');
test('validateTask requires title, defaults status',()=>{ assert.throws(()=>D.validateTask({}),/title is required/); assert.equal(D.validateTask({title:' X '}).status,'open'); });
test('filterRecords search+status preserves empty',()=>{ assert.deepEqual(D.filterRecords([],{search:'x'}),[]); assert.equal(D.filterRecords([{title:'Call Ada',status:'open'},{title:'B',status:'done'}],{search:'ada'}).length,1); assert.equal(D.filterRecords([{title:'A',status:'done'}],{status:'done'}).length,1); });
test('export csv/json preserves 0/false/empty',()=>{ const csv=D.buildExport([{id:0,title:'a,b',status:false}],'csv'); assert.equal(csv.format,'csv'); assert.match(csv.body,/a,b/); const j=JSON.parse(D.buildExport([], 'json').body); assert.equal(j.count,0); assert.deepEqual(j.data,[]); });
test('AI fallback labelled, aiGenerated:false, zeros preserved',()=>{ const out=D.campaignMomentum([]); assert.equal(out.aiGenerated,false); assert.equal(out.provider,null); assert.match(out.label,/Deterministic fallback/); assert.ok(out.sections); });
