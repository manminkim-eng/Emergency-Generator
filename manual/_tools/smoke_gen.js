// 화면 동작 점검 — usage: node smoke_gen.js <repoDir> <outDir>
const {chromium}=require(process.env.MM_PW||'playwright');const fs=require('fs');const path=require('path');const {setup,server}=require('./serve');
const repo=path.resolve(process.argv[2]),out=path.resolve(process.argv[3]);fs.mkdirSync(out,{recursive:true});
const set=(pg,o)=>pg.evaluate(o=>{for(const k in o){const e=document.getElementById(k);if(e.type==='checkbox')e.checked=o[k];else e.value=o[k];}},o);
(async()=>{const s=await server(repo,8953);const b=await chromium.launch();const R=[];
 for(const [w,h,d] of [[1440,900,1],[390,844,2]]){
  const ctx=await b.newContext({viewport:{width:w,height:h},deviceScaleFactor:d,serviceWorkers:'block',locale:'ko-KR'});await setup(ctx);
  const pg=await ctx.newPage();const errs=[];pg.on('pageerror',e=>errs.push(e.message));
  await pg.goto('http://127.0.0.1:8953/index.html');await pg.waitForTimeout(1500);
  const cases=[
   [{'hyd-pump':15,'hyd-charge':0,'hyd-etc':0,'spr-pump':22,'spr-charge':0,'spr-etc':0,'smk-supply':18.5,'smk-exhaust':0,'smk-etc':0,'oth-detect':3,'oth-light':0,'oth-sign':0,'oth-misc':0,'gp-a':'1.45','gp-c':'2','gp-k':1.10,'gp-pl':0,'gp-ef':0.85,'inst-kva':150},'127.5'],
   [{'gp-c':'6'},'(3.529411764705882+33.5*1.45+22*1.45*6)*1.1'],
   [{'gp-c':'1.5','gp-a':'1.38','gp-k':1.07},'(3.529411764705882+33.5*1.38+22*1.38*1.5)*1.07'],
   [{'gp-pl':40},'(3.529411764705882+15.5*1.38+40*1.38*1.5)*1.07'],
  ];
  for(const [o,exp] of cases){await set(pg,o);await pg.evaluate(()=>calcAll());await pg.waitForTimeout(100);
   const v=(await pg.textContent('#res-kva')).trim();const e=(eval(exp)).toFixed(1);R.push({w,exp:e,got:v,ok:v===e,judge:(await pg.textContent('#rd-judge')).trim()});}
  await pg.screenshot({path:path.join(out,`calc_${w}.png`),fullPage:true});
  await pg.evaluate(()=>showTab('t-judge',document.querySelectorAll('.tab-btn')[2]));
  for(const [fl,tun,exp] of [[5,false,'20분'],[12,false,'20분'],[35,false,'40분'],[55,false,'60분'],[3,true,'60분']]){
   await set(pg,{'j-floors':fl,'j-tunnel':tun});await pg.evaluate(()=>onFloorChange());await pg.waitForTimeout(80);
   const t=(await pg.textContent('#judge-result-area .time-banner-main')).trim();R.push({w,floors:fl,tunnel:tun,banner:t,ok:t.includes(exp)});}
  await pg.screenshot({path:path.join(out,`judge_${w}.png`),fullPage:true});
  const ov=[];for(const [i,id] of [[3,'t-std'],[4,'t-print'],[0,'t-calc']]){await pg.evaluate(([i,id])=>showTab(id,document.querySelectorAll('.tab-btn')[i]),[i,id]);await pg.waitForTimeout(700);
   ov.push(await pg.evaluate(()=>document.documentElement.scrollWidth-innerWidth));await pg.screenshot({path:path.join(out,`${id}_${w}.png`),fullPage:true});}
  R.push({w,overflow:ov,errs,manualBtn:await pg.evaluate(()=>!!document.getElementById('mm-manual-btn')&&getComputedStyle(document.getElementById('mm-manual-btn')).display)});await ctx.close();}
 console.log(JSON.stringify(R));await b.close();s.close();})();
