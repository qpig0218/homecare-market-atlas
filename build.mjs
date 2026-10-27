import fs from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {marked}=await import(require.resolve('marked'));
const raw=JSON.parse(fs.readFileSync('research.json','utf8'));
const escape=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const byUrl=new Map(raw.documents.map(d=>[d.url,d.number]));
marked.use({renderer:{link({href,tokens}) {
 const label=this.parser.parseInline(tokens);
 if(byUrl.has(href))return '<button type="button" class="text-link" data-doc="'+byUrl.get(href)+'">'+label+'</button>';
 if(!/^https?:\/\//.test(href||''))return label;
 return '<a href="'+escape(href)+'" target="_blank" rel="noopener noreferrer">'+label+' <span aria-hidden="true">↗</span></a>';
}}});
const simpleChart=n=>n===1?'<div class="archive-chart"><h3>2017 → 2024｜居護市場增長</h3><p>機構 538 → 730 家（+35.7%）<br>人員 1,775 → 2,464 人（+38.8%）<br>年度服務 96 萬 → 128 萬人次（+33.3%）</p><a href="#market" data-jump="market">查看互動市場圖表 →</a></div>':'<div class="archive-chart"><h3>手機方案損益兩平</h3><p>含門號 2,437 台（97.1%）；不含門號 1,576 台（62.8%）。<br>比較基準：2025-08-31 居護人力 2,509 人，每人一台假設。</p><a href="#economics" data-jump="economics">開啟財務情境試算 →</a></div>';
const workflow='<div class="archive-chart"><h3>從既有紀錄到外部處理結果</h3><ol><li>接手既有紀錄與附件，檢查來源、版本及規則。</li><li>資料未齊備：追索缺件及必要確認，回到檢查。</li><li>資料齊備：授權送件，保存外部回執。</li><li>若退件：定位原因、修正與重送，保留前後版本。</li><li>受理後追蹤核定、核付及入帳對帳。</li><li>同步保存評鑑與稽核證據。</li></ol></div>';
const docs=raw.documents.map(d=>{
 let md=d.markdown.replace(/^\[返回[^\n]*\n\n/,'').replace(/!\[[^\]]*\]\(visualize:[^)]+\)/g,()=>simpleChart(d.number===2?2:1));
 if(d.number===0){let count=0;md=d.markdown.replace(/!\[[^\]]*\]\(visualize:[^)]+\)/g,()=>simpleChart(++count));}
 md=md.replace(new RegExp('\\x60{3}mermaid[\\s\\S]*?\\x60{3}','g'),workflow);
 md=md.replace('最終頁面在深／淺色及窄螢幕的實際呈現尚未完成 UI 檢視。','原始 Pages 報告的深／淺色及窄螢幕呈現，當時尚未完成 UI 檢視；這項限制與本互動網站的測試分開記錄。');
 return {...d,html:marked.parse(md).replaceAll('<table>','<div class="article-table"><table>').replaceAll('</table>','</table></div>')};
});
const names={
A1:['neoCare HC','諾歐科技'],A2:['CarePro 居護','構思數位策略'],A3:['Cloud HIS 居護','展望亞洲'],A4:['HCare','博鈞科技'],A5:['uCare 居護','諾亞克科技'],A6:['TLCA 居護','瑞友品牌'],A7:['CareOne','契約法人待核'],
B1:['DHA 居家大師','醫療天地・法人待核'],B2:['Chiline 全家寶','英華達'],B3:['杏雲','杏翔'],B4:['居護服務平台','鴻鼎資訊'],C1:['報告汪','契約法人待核'],C2:['Ragic 自建資料庫','希望愛居護所案例'],D1:['御曲','九日生 9Rise'],D2:['幸福宅醫・照顧共筆','現行供應者待核'],D3:['Jubo 智齡','智齡科技'],D4:['tCare','大同醫護'],D5:['OmniCare+','華碩健康照護'],D6:['Care U','新光保全'],D7:['優照護','優護平台']};
const labels={A:'核心居護',B:'範圍待確認',C:'行政替代',D:'相鄰產品'};
const vendors=raw.documents[3].markdown.split('\n').filter(l=>/^\| [ABCD]\d+ /.test(l)).map(l=>{
 const cells=l.split('|').slice(1,-1).map(x=>x.trim()),id=cells[0].match(/^[ABCD]\d+/)[0],group=id[0];
 return {id,group,label:labels[group],name:names[id][0],company:names[id][1],scope:cells[1],price:group==='A'||group==='C'?cells[2]:'本次未核實公開居護套裝價格',boundary:group==='B'?cells[2]:group==='D'?cells[2].replace(/\[[^\]]+\]\([^)]+\)/g,'').replace(/^[；：\s]+/,''):'所有功能均未完成本次登入後實測；未知不等於不支援。',sources:[...l.matchAll(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g)].map(m=>({label:m[1],url:m[2],doc:byUrl.get(m[2])??null})),evidence:id==='A1'||id==='C1'?'P · D':id==='B1'?'I':id==='A6'?'I · P':id==='A3'?'P · U':'P',doc:id==='A1'?4:id==='C1'?5:id==='C2'?6:3};
});
const tests=raw.documents[9].markdown.split('\n').filter(l=>/^\| T\d+ /.test(l)).map(l=>{const c=l.split('|').slice(1,-1).map(x=>x.trim());return {name:c[0],setup:c[1],pass:c[2],proof:c[3]};});
if(vendors.length!==20||tests.length!==12||docs.length!==10)throw Error('Incomplete source conversion');
fs.writeFileSync('docs/research-data.js','window.RESEARCH='+JSON.stringify({date:raw.date,documents:docs,vendors,tests}).replaceAll('<','\\u003c')+';\n');
fs.copyFileSync('research.json','docs/research-snapshot.json');
console.log(JSON.stringify({documents:docs.length,vendors:vendors.length,tests:tests.length,sourceCharacters:raw.documents.reduce((n,d)=>n+d.markdown.length,0)}));
