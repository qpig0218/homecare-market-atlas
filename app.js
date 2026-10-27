(function(){
 'use strict';
 const $=s=>document.querySelector(s),$$=s=>Array.from(document.querySelectorAll(s));
 const data=window.RESEARCH,esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 const fmt=(v,d=0)=>new Intl.NumberFormat('zh-TW',{maximumFractionDigits:d,minimumFractionDigits:d}).format(v);
 const shortDocs=['完整市場報告','市場基準','財務重算','競品完整名錄','neoCare 深度流程','報告汪深度流程','使用者證據','支付與評鑑規則','本一藍圖 v0.3','端到端驗證協定'];
 let group='A',query='',model='device',selected=new Set(),toastTimer;
 const vendorsById=new Map(data.vendors.map(v=>[v.id,v]));
 function toast(message){$('#toast').textContent=message;$('#toast').hidden=false;clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('#toast').hidden=true,3000);}
 function setPressed(selector,value,attribute){$$(selector).forEach(b=>b.setAttribute('aria-pressed',String(b.dataset[attribute]===String(value))));}
 function closeAll(){document.querySelectorAll('dialog[open]').forEach(d=>d.close());}
 function show(dialog){closeAll();dialog.showModal();}
 document.addEventListener('click',e=>{
  const close=e.target.closest('[data-close]');if(close){close.closest('dialog').close();return;}
  const doc=e.target.closest('[data-doc]');if(doc){e.preventDefault();openDoc(Number(doc.dataset.doc));return;}
  const jump=e.target.closest('[data-jump]');if(jump){e.preventDefault();closeAll();document.getElementById(jump.dataset.jump).scrollIntoView({behavior:'smooth'});return;}
  const detail=e.target.closest('[data-detail]');if(detail)openDetail(detail.dataset.detail);
 });
 $$('dialog').forEach(d=>d.addEventListener('click',e=>{if(e.target===d){const r=d.getBoundingClientRect();if(e.clientX<r.left||e.clientX>r.right||e.clientY<r.top||e.clientY>r.bottom)d.close();}}));
 const marketMetrics={agencies:{before:538,after:730,unit:'家',max:800},nurses:{before:1775,after:2464,unit:'人',max:3000},visits:{before:960000,after:1280000,unit:'人次',max:1500000}};
 function renderMarket(key){
  const m=marketMetrics[key],growth=(m.after/m.before-1)*100,cagr=(Math.pow(m.after/m.before,1/7)-1)*100;
  $('#market-chart-content').innerHTML='<div class="growth-head"><strong>+'+fmt(growth,1)+'%</strong><span>七年增幅 · 年化約 '+fmt(cagr,1)+'%</span></div>'+[[2017,m.before],[2024,m.after]].map((r,i)=>'<div class="bar-row '+(i?'current':'')+'"><span>'+r[0]+'</span><div class="bar-track"><span class="bar-value">'+fmt(r[1])+' '+m.unit+'</span><div class="bar-fill" style="width:'+r[1]/m.max*100+'%"></div></div></div>').join('')+'<div class="bar-axis"><span>0</span><span>'+fmt(m.max/2)+'</span><span>'+fmt(m.max)+' '+m.unit+'</span></div>';
  setPressed('[data-metric]',key,'metric');
 }
 $$('[data-metric]').forEach(b=>b.addEventListener('click',()=>renderMarket(b.dataset.metric)));
 function renderVendors(){
  const items=MarketModel.filter(data.vendors,group,query);
  $('#vendor-count').textContent='顯示 '+items.length+' / 20 條線索 · 截至 2026.10.27';
  $('#vendor-list').innerHTML=items.length?items.map(v=>'<div class="vendor-row"><label class="vendor-select"><input type="checkbox" data-select="'+v.id+'" aria-label="選取 '+esc(v.name)+' 進行比較" '+(selected.has(v.id)?'checked':'')+'></label><div class="vendor-name"><span class="vendor-monogram" aria-hidden="true">'+esc(v.id)+'</span><div><h3>'+esc(v.name)+'</h3><small>'+esc(v.company)+'</small></div></div><div class="vendor-copy-wrap"><div class="vendor-meta"><span class="tag">'+v.label+'</span><span class="evidence-tag">'+v.evidence+'</span></div><p class="vendor-copy">'+esc(v.scope)+'</p></div><button class="vendor-detail" data-detail="'+v.id+'" aria-label="查看 '+esc(v.name)+' 詳情">看證據 <span>↗</span></button></div>').join(''):'<div class="empty-results">目前分類沒有符合的結果。<button class="text-link" id="reset-search">清除搜尋並顯示全部 20 條</button></div>';
  const reset=$('#reset-search');if(reset)reset.addEventListener('click',()=>{group='all';query='';$('#vendor-search').value='';setPressed('[data-group]',group,'group');renderVendors();});
 }
 $$('[data-group]').forEach(b=>b.addEventListener('click',()=>{group=b.dataset.group;setPressed('[data-group]',group,'group');renderVendors();}));
 $('#vendor-search').addEventListener('input',e=>{query=e.target.value;renderVendors();});
 $('#vendor-list').addEventListener('change',e=>{
  if(!e.target.matches('[data-select]'))return;const id=e.target.dataset.select;
  if(e.target.checked){if(selected.size>=3){e.target.checked=false;toast('最多比較 3 項。請先取消一項，再加入新的產品。');return;}selected.add(id);}else selected.delete(id);
  updateCompareBar();
 });
 function updateCompareBar(){
  $('#compare-bar').hidden=!selected.size;
  $('#compare-count').textContent='已選 '+selected.size+' 項'+(selected.size<2?' · 再選 1 項即可比較':'');
  $('#compare-names').textContent=[...selected].map(id=>vendorsById.get(id).name).join(' / ');
  $('#open-compare').disabled=selected.size<2;
 }
 $('#clear-compare').addEventListener('click',()=>{selected.clear();renderVendors();updateCompareBar();});
 function sourceLinks(v){return v.sources.map(s=>s.doc!==null?'<button class="text-link" data-doc="'+s.doc+'">'+esc(s.label)+' ↗</button>':'<a href="'+esc(s.url)+'" target="_blank" rel="noopener noreferrer">'+esc(s.label)+' ↗</a>').join('');}
 function openDetail(id){
  const v=vendorsById.get(id);if(!v)return;
  $('#detail-content').innerHTML='<div class="detail-head"><span class="vendor-monogram">'+v.id+'</span><div><span class="tag">'+v.label+'</span><h2>'+esc(v.name)+'</h2><p>'+esc(v.company)+'</p></div></div><div class="detail-field"><h3>公開材料支持的範圍</h3><p>'+esc(v.scope)+'</p></div><div class="detail-field"><h3>價格與體驗入口</h3><p>'+esc(v.price)+'</p></div><div class="detail-field"><h3>查核界線</h3><p>'+esc(v.boundary)+'</p></div><div class="detail-field"><h3>證據類型 '+v.evidence+'</h3><p>P：產品公開聲明　D：操作文件　I：僅索引／存取限制　U：使用端流程。證據類型不是功能評分。</p></div><p class="detail-warning">本次未完成此產品的登入後實測與外部核付驗證。所列價格、版本及服務範圍仍需同條件確認。</p><div class="detail-field"><h3>原始來源</h3><div class="detail-sources">'+sourceLinks(v)+'</div></div><button class="source-button" data-doc="'+v.doc+'">閱讀完整分析與限制 ↗</button>';
  show($('#detail-dialog'));
 }
 $('#open-compare').addEventListener('click',()=>{
  const vs=[...selected].map(id=>vendorsById.get(id));
  const rows=[['定位',v=>esc(v.label)],['公開能力',v=>esc(v.scope)],['價格／入口',v=>esc(v.price)],['證據類型',v=>esc(v.evidence)+'<small>P 公開聲明／D 手冊／I 存取待核／U 使用端</small>'],['待查事項',v=>esc(v.boundary)],['登入後實測',()=>'<span style="color:var(--orange)">未完成</span>'],['外部受理／核付',()=>'<span style="color:var(--orange)">本次未驗證</span>'],['來源',v=>'<div class="detail-sources">'+sourceLinks(v)+'</div>']];
  $('#compare-content').innerHTML='<table class="compare-table"><thead><tr><th class="row-title">比較項目</th>'+vs.map(v=>'<th>'+esc(v.name)+'<small>'+esc(v.company)+'</small></th>').join('')+'</tr></thead><tbody>'+rows.map(r=>'<tr><td class="row-title">'+r[0]+'</td>'+vs.map(v=>'<td>'+r[1](v)+'</td>').join('')+'</tr>').join('')+'</tbody></table><p class="input-footnote">選取結果不代表推薦或排名。不同模組、版本及合約條件，須在實際比較時對齊。</p>';
  show($('#compare-dialog'));
 });
 function financeInput(){return {model,price:$('#price').value,fixed:$('#fixed-cost').value,phone:$('#include-phone').checked,delivery:$('#delivery-cost').value};}
 function renderFinance(){
  const input=financeInput(),r=MarketModel.calculate(input);
  $('#price-label').textContent=fmt(Number(input.price))+' 元';
  if(!r.valid){
   $('#break-even').textContent='請填有效數值';$('#break-even').style.fontSize='30px';$('#coverage-description').textContent='收費需大於零，成本需為非負數。';$('#contribution').textContent='—';$('#coverage').textContent='—';$('#finance-chart').innerHTML='';$('#finance-verdict').textContent='請補齊輸入，避免把空白當成零成本。';$('#finance-reference').textContent='';return;
  }
  $('#break-even').style.fontSize=r.needed!==null&&r.needed>999999?'36px':'';
  $('#break-even').innerHTML=r.needed===null?'<span style="font-size:29px">無法損益兩平</span>':fmt(r.needed)+'<small>'+r.unit+'</small>';
  $('#coverage-description').textContent=model==='device'?'每人一台假設 · 比較 2,509 名居護人員':'按機構收費假設 · 比較 743 家機構';
  $('#contribution').textContent=fmt(r.contribution,2)+' 元';
  $('#coverage').textContent=r.coverage===null?'—':fmt(r.coverage,1)+'%';
  const maximum=Math.max(r.base,r.needed||0)*1.1;
  $('#finance-chart').innerHTML=(r.needed===null?'':financeBar('損益兩平所需',r.needed,r.unit,maximum,false))+financeBar('2025.08.31 市場基準',r.base,model==='device'?'人':'家',maximum,true);
  $('#finance-verdict').textContent=r.needed===null?'單位貢獻不為正；增加客戶無法覆蓋固定成本。先修正價格或交付成本。':r.coverage>100?'所需規模已超過此市場基準。應先調整成本、價格或客群定義，不能視為已成立的成長計畫。':model==='device'?'本方案仍須負擔漏列的獲客、介接及更多人工例外成本。達到損益兩平台數，不代表累積回本。':'價格與交付成本尚未驗證。下一個關鍵是量出每家人工處理時間，並確認買方願意付費續用。';
  $('#finance-reference').textContent='兩條長條共用零基準、相同尺度。'+(model==='device'?'固定成本採會計口徑；含手機折舊。':'固定費口徑依輸入假設。')+'市場數字為歷史快照，並非永久上限。';
 }
 function financeBar(label,value,unit,max,ref){return '<div class="finance-bar-label"><span>'+label+'</span><span>'+fmt(value)+' '+unit+'</span></div><div class="finance-track"><div class="finance-fill '+(ref?'reference':'')+'" style="width:'+value/max*100+'%"></div></div>';}
 function resetFinance(){
  $('#price').max=model==='device'?'7000':'12000';$('#price').value=model==='device'?'1500':'5000';$('#fixed-cost').value=model==='device'?'1333333':'500000';$('#delivery-cost').value='1500';$('#include-phone').checked=true;
  $('#device-fields').hidden=model!=='device';$('#agency-fields').hidden=model!=='agency';$('#model-title').textContent=model==='device'?'調整原手機方案假設':'探索機構收費與交付成本';setPressed('[data-model]',model,'model');renderFinance();
 }
 $$('[data-model]').forEach(b=>b.addEventListener('click',()=>{model=b.dataset.model;resetFinance();}));
 ['price','fixed-cost','include-phone','delivery-cost'].forEach(id=>document.getElementById(id).addEventListener('input',renderFinance));
 $('#reset-finance').addEventListener('click',resetFinance);
 const stages=[
 {title:'從現有資料接手，少一次重打。',intro:'先接一種現用系統的授權匯出或介接，保留附件與欄位來源。經驗豐富的護理師不需要為新工具重建整套工作。',deliver:'同案資料一次接手；缺漏、矛盾與版本清楚指出，不能靠模型猜測補齊。',proof:'來源與欄位對照、前後版本、重複輸入次數、初始化人工工時。',stop:'資料無法合法取得，或導入後需要更多重打與核對。',doc:8},
 {title:'缺件被找出，也要有人追到完成。',intro:'真正的負擔常在跨人、跨系統的來回。每一個缺件都需要負責人、下一步與期限，讓使用者只處理必要的事實確認。',deliver:'接手非臨床資料追索，保留待辦與歷程；不補造訪視、簽署或會議紀錄。',proof:'追件來回、客戶被打斷次數、實際完成時間、本一人工分鐘。',stop:'只產生另一張缺件清單，客戶仍得自己完成全部追索。',doc:6},
 {title:'送出之後，看見外部是否受理。',intro:'內部顯示成功，只能證明內部步驟執行。系統應分開送出與受理，並保存可回查的外部結果。',deliver:'依既有權限準備與送件，關聯回執；逾時時確認狀態，避免無意重複交易。',proof:'批次內容、送件時間、請求識別、外部受理回執與錯誤碼。',stop:'無法取得授權或外部狀態，卻只能請客戶再登入另一系統人工確認。',doc:4},
 {title:'讓修正、重送與原案連在一起。',intro:'退件是工作的一部分。非臨床錯誤應由供應商定位和處理，臨床內容仍由有權責者確認。',deliver:'同案關聯退件原因、原始資料、修正版本及重送，不以覆寫抹去歷程。',proof:'原退件、修正前後差異、新回執、原因分類、雙方介入工時。',stop:'每次退件都依賴未計成本的客製處理，無法在第二家重複交付。',doc:9},
 {title:'核定、核付與入帳，是不同狀態。',intro:'收入不能由「已送件」推定。把核減、核付及銀行入帳的差異回到原始案件，才能知道還有哪些工作沒有完成。',deliver:'對應案件與金額差異，追蹤未結項；等待外部處理時保留等待狀態。',proof:'核定、核付、入帳對照、差異原因與處理歷程。',stop:'差異太低頻、可省時間不足，或取得與維護資料的成本高於價值。',doc:8},
 {title:'評鑑時，讓每個數字都回得去。',intro:'A5 指標與 B2 評估計畫，需要真實資料、正確分母及跨案一致性。原始材料應在日常工作同步保存。',deliver:'將指標、期間、規則版本及改善紀錄連到原件，支援跨案抽查。',proof:'至少 10 案的來源追溯、取證時間、資料一致性與修改歷程。',stop:'只生成漂亮敘事，找不到原件，或把未發生的活動寫成既有事實。',doc:7}
 ];
 function renderStage(n){
  const s=stages[n];setPressed('[data-stage]',n,'stage');
  $('#stage-detail').innerHTML='<span class="stage-kicker">OPPORTUNITY '+String(n+1).padStart(2,'0')+' · 待驗證命題</span><h3>'+s.title+'</h3><p>'+s.intro+'</p><div class="stage-section"><span>本一應交付什麼</span><p>'+s.deliver+'</p></div><div class="stage-section"><span>如何證明完成</span><p>'+s.proof+'</p></div><div class="stage-section stop"><span>什麼情況應停止或縮小</span><p>'+s.stop+'</p></div><button class="source-button" data-doc="'+s.doc+'">閱讀相關證據 ↗</button>';
 }
 $$('[data-stage]').forEach(b=>b.addEventListener('click',()=>renderStage(Number(b.dataset.stage))));
 $('#test-cases').innerHTML=data.tests.map(t=>'<details class="test-case"><summary>'+esc(t.name)+'<span>尚待執行</span></summary><div class="test-body"><p><b>起點與例外</b><br>'+esc(t.setup)+'</p><p><b>通過標準</b><br>'+esc(t.pass)+'</p><p><b>必留證據</b><br>'+esc(t.proof)+'</p></div></details>').join('');
 $('#source-index').innerHTML=shortDocs.slice(1).map((s,i)=>'<button data-doc="'+(i+1)+'"><span>'+String(i+1).padStart(2,'0')+'</span>'+s+' ↗</button>').join('');
 $('#reader-nav').innerHTML=shortDocs.map((s,i)=>'<button data-doc="'+i+'" aria-current="false">'+(i?String(i).padStart(2,'0')+' / ':'')+s+'</button>').join('');
 function openDoc(n){
  const d=data.documents[n];if(!d)return;
  $('#reader-article').innerHTML='<h1>'+esc(d.title.replace(/^\[\d+\]\s*/,''))+'</h1><div class="reader-meta">研究快照 '+data.date+' · 保存的完整分析內容 <a href="'+esc(d.url)+'" target="_blank" rel="noopener noreferrer">開啟原始文件 ↗</a></div>'+d.html;
  $$('#reader-nav button').forEach(b=>b.setAttribute('aria-current',String(Number(b.dataset.doc)===n)));
  if(!$('#reader-dialog').open)show($('#reader-dialog'));
  $('#reader-article').scrollTop=0;
 }
 const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){$$('.site-header nav a').forEach(a=>a.classList.toggle('active',a.getAttribute('href')==='#'+e.target.id));}});},{rootMargin:'-15% 0px -65% 0px'});
 ['market','landscape','economics','opportunity','evidence'].forEach(id=>observer.observe(document.getElementById(id)));
 renderMarket('agencies');renderVendors();renderFinance();renderStage(0);
})();
