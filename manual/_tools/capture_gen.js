// 비상발전기 용량 산정 계산서 매뉴얼 화면 캡처 — usage: node capture_gen.js <repoDir> <outDir>
// 규격: 1440×900 · DSF 1.25 (영상용 좁은 화면: MM_VW=720 MM_VH=1280 MM_DSF=2) · serviceWorkers block · _marks.json · _example.json
const {chromium}=require(process.env.MM_PW||'playwright');const fs=require('fs');const path=require('path');const {setup,server}=require('./serve');
const repo=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);fs.mkdirSync(out,{recursive:true});
const VW=+(process.env.MM_VW||1440),VH=+(process.env.MM_VH||900),DSF=+(process.env.MM_DSF||1.25),PORT=8954;
const HIDE='#pwa-banner,#pwa-hdr-btn,#sw-update-bar,#install-fab-btn,.pwa-banner{display:none!important} *{animation:none!important;transition:none!important}';
const HELP=`window.__vis=e=>e&&e.getClientRects().length>0;
window.__find=sel=>{if(sel.startsWith('up:')){const [n,q]=sel.slice(3).split('|');let e=[...document.querySelectorAll(q)].find(__vis);for(let i=0;i<+n&&e;i++)e=e.parentElement;return e;}
 if(sel.startsWith('box:')){const t=sel.slice(4);return [...document.querySelectorAll('.box')].find(b=>__vis(b)&&b.querySelector('.box-hd')&&b.querySelector('.box-hd').textContent.includes(t))||null;}
 if(sel.startsWith('row:')){const t=sel.slice(4);return [...document.querySelectorAll('tr,.result-row')].find(r=>__vis(r)&&r.textContent.includes(t))||null;}
 if(sel.startsWith('nth:')){const [q,i]=sel.slice(4).split('|');return [...document.querySelectorAll(q)].filter(__vis)[+i]||null;}
 for(const s of sel.split(',')){const e=[...document.querySelectorAll(s)].find(__vis);if(e)return e;}return null;};
window.__T=['t-calc','t-load','t-judge','t-std','t-print'];
window.__tab=i=>showTab(__T[i],document.querySelectorAll('.tab-btn')[i]);
window.__set=o=>{for(const k in o){const e=document.getElementById(k);if(e.type==='checkbox')e.checked=o[k];else e.value=o[k];}};
window.__EXA={'hyd-pump':15,'hyd-charge':2.2,'hyd-etc':0,'spr-pump':22,'spr-charge':2.2,'spr-etc':0,'smk-supply':18.5,'smk-exhaust':11,'smk-etc':0,'oth-detect':1.5,'oth-light':2,'oth-sign':0.5,'oth-misc':0,'gp-a':'1.45','gp-c':'2','gp-k':1.10,'gp-pl':0,'gp-ef':0.85,'gen-type':'fire','hold-time':'20','inst-kva':200,'pf':0.8,'df':1.0,'mf':1.2};
window.__ex=(o)=>{__tab(0);__set(__EXA);if(o)__set(o);calcAll();};
window.__help=(id,i)=>{openHelp();helpTab(id,document.querySelectorAll('.hm-tab')[i]);};
window.__judge=(fl,tun)=>{__tab(2);__set({'j-floors':fl,'j-tunnel':!!tun,'j-bsmt':0});onFloorChange();};`;
const EXA="__ex()";
const SHOTS=[
 {id:'s01_overview',pre:EXA+";window.scrollTo(0,0)",clip:'viewport',m:[['nth:.tab-btn|0','작업 탭 5개'],['.mm-manual-btn','📘 매뉴얼'],['.sum-bar','요약 바'],['.link-banner','타 계산기 연동 띠'],['.gen-hero','필요 용량 GP']]},
 {id:'s02_header',clip:'.site-header',m:[['.hdr-h1','도구 이름 · Ver-5.1'],['.mm-manual-btn','📘 매뉴얼'],['.hdr-right','KDS 31 60 20 · NFTC 103 2.9 · NFPC 602'],['.tab-bar-wrap','탭 5개']]},
 {id:'s03_input',clip:'box:소방 부하 입력',m:[['up:1|.bh-indigo','옥내소화전 — 전동기'],['up:1|.bh-green','스프링클러 — 전동기'],['up:1|.bh-amber','제연 — 전동기'],['up:1|.bh-energy','기타 — 전동기 이외']]},
 {id:'s04_coef',clip:'box:발전기 설계 계수',m:[['nth:code.fml.navy|1','식 (4.1-1)'],['up:1|#gp-a','a 입력용량 계수'],['up:1|#gp-c','c 기동계수'],['up:2|#gp-k','k 전압강하계수'],['up:2|#gp-pl','PL (0 = 자동)'],['up:2|#gp-ef','효율 × 역률'],['up:2|#pf','간이식(참고)'],['up:1|#gen-type','발전기 형식'],['up:1|#hold-time','유지시간'],['.calc-btn','필요 용량 산정']]},
 {id:'s05_hero',clip:'.gen-hero',m:[['#res-kva','GP (kVA)'],['#res-kva-sub','대입식']]},
 {id:'s06_detail',clip:'box:산정 상세',m:[['row:ΣPm 전동기','ΣPm'],['row:PL 기동용량','PL'],['row:ΣP 전동기 이외','ΣP'],['row:GP (KDS','GP'],['row:참고 · S =','간이식(참고)'],['row:판  정','판정'],['#fml-calc','대입식']]},
 {id:'s07_dol',pre:"__ex({'gp-c':'6'})",clip:'box:산정 상세',post:EXA,m:[['row:a · c · k','c = 6 (직입)'],['row:GP (KDS','GP'],['row:판  정','부족']]},
 {id:'s08_load',pre:"__tab(1);window.scrollTo(0,0)",clip:'box:소방부하 목록표',m:[]},
 {id:'s09_judge35',pre:"__judge(35)",clip:'#t-judge',m:[['box:건물 조건 입력','층수 · 지하층 · 특수 조건'],['.time-banner','최소 40분'],['nth:#judge-result-area .dt|0','설비별 시간 · 근거'],['box:판정 기준표','판정 기준표']]},
 {id:'s10_tunnel',pre:"__judge(1,true)",clip:'box:판정 결과',post:"__judge(5)",m:[['.time-banner','도로터널 60분']]},
 {id:'s11_std602',pre:"__tab(3);window.scrollTo(0,0)",clip:'box:NFTC 602 핵심',m:[]},
 {id:'s12_stdkds',clip:'box:발전기 용량 산정 기준',m:[]},
 {id:'s13_stdtime',clip:'box:관련 설비별',m:[]},
 {id:'s14_print',pre:EXA+";__tab(4);window.scrollTo(0,0)",wait:1200,clip:'viewport',m:[['#btn-jpg','🖼️ JPG 저장'],['.mm-btn-pdf','🖨️ 인쇄 · PDF'],['#rpt-outer','A4 미리보기']]},
 {id:'s15_a4page',clip:'#report-zone',m:[]},
 {id:'s16_help_use',pre:"__help('hm-usage',0)",wait:500,fixed:true,clip:'#help-modal',m:[]},
 {id:'s17_help_fml',pre:"__help('hm-formula',1)",wait:400,fixed:true,clip:'#help-modal',m:[]},
 {id:'s18_help_law',pre:"__help('hm-law',3)",wait:400,fixed:true,clip:'#help-modal',post:"closeHelp();__tab(0)",m:[]},
];
(async()=>{
 const s=await server(repo,PORT);const b=await chromium.launch();
 const ctx=await b.newContext({viewport:{width:VW,height:VH},deviceScaleFactor:DSF,serviceWorkers:'block',locale:'ko-KR'});await setup(ctx);
 const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
 await pg.goto(`http://127.0.0.1:${PORT}/index.html`);await pg.evaluate(()=>document.fonts.ready);await pg.waitForTimeout(1500);
 await pg.addStyleTag({content:HIDE});await pg.evaluate(HELP);await pg.evaluate(()=>{const d=document.getElementById('proj-date');if(d)d.value='2026-10-16';});await pg.waitForTimeout(300);
 const meta={};
 for(const S of SHOTS){
  if(S.pre){try{await pg.evaluate(S.pre);}catch(e){errs.push(S.id+' pre '+e.message);}}
  await pg.waitForTimeout(S.wait||500);
  if(S.clip!=='viewport'&&!S.fixed){await pg.evaluate(c=>{const e=__find(c);if(e){window.scrollTo(0,e.getBoundingClientRect().top+scrollY-40);}},S.clip);await pg.waitForTimeout(400);}
  const info=await pg.evaluate(({S,VW,VH})=>{
   const abs=e=>{const r=e.getBoundingClientRect();return {x:r.left+scrollX,y:r.top+scrollY,w:r.width,h:r.height};};
   let clip;
   if(S.clip==='viewport'){clip={x:0,y:scrollY,width:VW,height:VH};}
   else{const el=__find(S.clip);if(!el)return {err:'clip '+S.clip};const a=abs(el);const P=S.fixed?0:10;clip={x:Math.max(0,a.x-P),y:Math.max(0,a.y-P),width:a.w+2*P,height:a.h+2*P};}
   const marks=[];(S.m||[]).forEach(([sel,label],i)=>{const e=__find(sel);if(!e){marks.push({n:i+1,label,miss:sel});return;}const a=abs(e);
     marks.push({n:i+1,label,x:+((a.x-clip.x)/clip.width*100).toFixed(2),y:+((a.y-clip.y)/clip.height*100).toFixed(2),w:+(Math.min(a.w,clip.x+clip.width-a.x)/clip.width*100).toFixed(2),h:+(Math.min(a.h,clip.y+clip.height-a.y)/clip.height*100).toFixed(2)});});
   return {clip,marks};},{S,VW,VH});
  if(info.err){errs.push(S.id+' '+info.err);continue;}
  const c=info.clip;const cl={x:Math.max(0,c.x),y:Math.max(0,c.y),width:Math.min(c.width,VW-Math.max(0,c.x)),height:c.height};
  if(S.clip==='viewport'){await pg.screenshot({path:path.join(out,S.id+'.png'),clip:{x:0,y:0,width:VW,height:VH}});}
  else if(S.fixed){const sy=await pg.evaluate(()=>scrollY),sx=await pg.evaluate(()=>scrollX);await pg.screenshot({path:path.join(out,S.id+'.png'),clip:{x:Math.max(0,c.x-sx),y:Math.max(0,c.y-sy),width:Math.min(c.width,VW),height:Math.min(c.height,VH-Math.max(0,c.y-sy))}});}
  else{await pg.screenshot({path:path.join(out,S.id+'.png'),clip:cl,fullPage:true});}
  meta[S.id]={w:Math.round(cl.width),h:Math.round(Math.min(cl.height,S.fixed?VH:1e9)),marks:info.marks};
  if(S.post){try{await pg.evaluate(S.post);}catch(e){errs.push(S.id+' post '+e.message);}await pg.waitForTimeout(300);}
 }
 const EX=await pg.evaluate(()=>{const m=[15,2.2,0,22,2.2,0,18.5,11,0];return {A:GENENG.kds(m,4,0.85,1.45,2,1.10,0),D:GENENG.kds(m,4,0.85,1.45,6,1.10,0),V:GENENG.kds(m,4,0.85,1.45,1.5,1.10,0),S:GENENG.simple(74.9,1,1.2,0.8),H35:GENENG.hold(35,0,false,false,false),H55:GENENG.hold(55,0,false,false,false),HT:GENENG.hold(1,0,false,false,true),H5:GENENG.hold(5,0,false,false,false)};});
 fs.writeFileSync(path.join(out,'_example.json'),JSON.stringify(EX,null,1));
 const mctx=await b.newContext({viewport:{width:390,height:844},deviceScaleFactor:2,serviceWorkers:'block',isMobile:true,hasTouch:true,locale:'ko-KR'});await setup(mctx);
 const mp=await mctx.newPage();await mp.goto(`http://127.0.0.1:${PORT}/index.html`);await mp.waitForTimeout(1500);await mp.addStyleTag({content:HIDE});await mp.evaluate(HELP);
 await mp.screenshot({path:path.join(out,'s19_mobile_main.png')});meta['s19_mobile_main']={w:390,h:844,marks:[]};
 await mp.evaluate(EXA);await mp.waitForTimeout(500);await mp.evaluate(()=>{const e=document.querySelector('.gen-hero');window.scrollTo(0,e.getBoundingClientRect().top+scrollY-12);});await mp.waitForTimeout(500);
 await mp.screenshot({path:path.join(out,'s20_mobile_result.png')});meta['s20_mobile_result']={w:390,h:844,marks:[]};
 await mp.evaluate(()=>{__judge(35);const e=document.getElementById('judge-result-area');window.scrollTo(0,e.getBoundingClientRect().top+scrollY-60);});await mp.waitForTimeout(500);
 await mp.screenshot({path:path.join(out,'s21_mobile_judge.png')});meta['s21_mobile_judge']={w:390,h:844,marks:[]};
 const mob=await mp.evaluate(()=>({page:document.documentElement.scrollWidth,vw:innerWidth}));
 fs.writeFileSync(path.join(out,'_marks.json'),JSON.stringify(meta,null,1));
 const miss=[];Object.entries(meta).forEach(([k,v])=>v.marks.forEach(m=>{if(m.miss)miss.push(k+':'+m.miss);else if(m.x<0||m.y<0||m.x+m.w>100.5||m.y+m.h>100.5||m.w<=0||m.h<=0)miss.push(k+':OUT '+m.label+' '+m.x+','+m.y+','+m.w+','+m.h);}));
 console.log(JSON.stringify({mobile:mob,sizes:Object.fromEntries(Object.entries(meta).map(([k,v])=>[k,v.w+'x'+v.h])),miss,errs:errs.slice(0,15)},null,1));
 await b.close();s.close();
})();
