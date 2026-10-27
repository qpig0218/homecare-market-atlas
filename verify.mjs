import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
const context=vm.createContext({});vm.runInContext(fs.readFileSync('docs/model.js','utf8'),context);
const calculate=context.MarketModel.calculate;
assert.equal(calculate({model:'device',price:1500,fixed:1333333,phone:true}).needed,2437);
assert.equal(calculate({model:'device',price:1500,fixed:1333333,phone:false}).needed,1576);
assert.equal(calculate({model:'agency',price:5000,fixed:500000,delivery:1500}).needed,143);
assert.equal(calculate({model:'agency',price:3000,fixed:500000,delivery:1500}).needed,334);
assert.equal(calculate({model:'agency',price:1500,fixed:500000,delivery:1500}).needed,null);
assert.equal(calculate({model:'agency',price:1000,fixed:500000,delivery:1500}).needed,null);
assert.equal(calculate({model:'agency',price:5000,fixed:'',delivery:1500}).valid,false);
assert.equal(calculate({model:'agency',price:5000,fixed:500000,delivery:-1}).valid,false);
assert.ok(calculate({model:'agency',price:1600,fixed:500000,delivery:1500}).coverage>100);
const dc=vm.createContext({window:{}});vm.runInContext(fs.readFileSync('docs/research-data.js','utf8'),dc);
const d=dc.window.RESEARCH;assert.equal(d.vendors.length,20);assert.equal(d.documents.length,10);assert.equal(d.tests.length,12);
assert.equal(d.vendors.filter(v=>v.group==='A').length,7);assert.equal(d.vendors.filter(v=>v.group==='B').length,4);assert.equal(d.vendors.filter(v=>v.group==='C').length,2);assert.equal(d.vendors.filter(v=>v.group==='D').length,7);
assert.equal(context.MarketModel.filter(d.vendors,'all','RAGIC').length,1);
assert.equal(context.MarketModel.filter(d.vendors,'A','Ragic').length,0);
assert.equal(context.MarketModel.filter(d.vendors,'all','不存在測試品牌').length,0);
assert.equal(new Set(d.vendors.map(v=>v.id)).size,20);
for(const doc of d.documents){assert.ok(doc.html.length>500);assert.ok(!doc.html.includes('visualize:'));assert.ok(!doc.html.includes(String.fromCharCode(96).repeat(3)+'mermaid'));}
for(const v of d.vendors){assert.ok(v.sources.length);assert.ok(v.name&&v.scope&&v.price);}
console.log('PASS: 9 finance cases; 20 vendors; 10 complete documents; 12 protocol cases; source links and search.');
