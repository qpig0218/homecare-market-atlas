(function(root){
 'use strict';
 function calculate(input){
  var agency=input.model==='agency',price=Number(input.price),fixed=Number(input.fixed),delivery=Number(input.delivery);
  if(input.price===''||input.fixed===''||(agency&&input.delivery==='')||!Number.isFinite(price)||!Number.isFinite(fixed)||price<=0||fixed<0||(agency&&(!Number.isFinite(delivery)||delivery<0)))return {valid:false};
  var variable=agency?delivery:10500/36+142+120+100+(input.phone?299:0),contribution=price-variable,base=agency?743:2509;
  var needed=contribution>0?Math.ceil(fixed/contribution):null;
  return {valid:true,variable:variable,contribution:contribution,needed:needed,base:base,coverage:needed===null?null:needed/base*100,unit:agency?'家':'台'};
 }
 function filter(vendors,group,query){
  var q=(query||'').trim().toLocaleLowerCase();
  return vendors.filter(function(v){return (group==='all'||v.group===group)&&(!q||[v.name,v.company,v.scope,v.price,v.boundary].join(' ').toLocaleLowerCase().includes(q));});
 }
 root.MarketModel={calculate:calculate,filter:filter};
})(globalThis);
