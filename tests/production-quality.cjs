
async function productionPreflight(browser, url) {
  const probe = await browser.newPage();
  await probe.goto(url + '/');
  const canonical = await probe.locator('link[rel="canonical"]').getAttribute('href');
  const preview = await probe.locator('.preview-strip').count();
  await probe.close();
  if (canonical !== 'https://aigen.fi/' || preview) throw new Error('Test server is not the promoted production root: ' + url);
}

const { chromium } = require('/opt/homebrew/lib/node_modules/openclaw/node_modules/playwright-core');
const fs=require('fs'); const BASE=process.env.AIGEN_TEST_BASE || 'http://127.0.0.1:8768';
const rep=JSON.parse(fs.readFileSync(require('path').join(__dirname, '../testi-sivu3/_build/build-report.json')));
const all=[]; for (const [k,l] of Object.entries(rep.pages)) { all.push([k+':fi',l.fi.replace('/testi-sivu3/', '/')]); all.push([k+':en',l.en.replace('/testi-sivu3/', '/')]); }
const reps=['home','apps','app-ilmoo','app-tasapay','guide-aiact','guide-cbam','blog','post-aigen-cbam-avattu','post-grok-bot-tekoalyagentti-tyokaverina','custom','company','guides'];
const deep=all.filter(([k])=>reps.includes(k.split(':')[0]));
const out=[]; let issues=0;
async function audit(b, name, url, w, full){
  const ctx=await b.newContext({viewport:{width:w,height:w>800?900:844},reducedMotion:'reduce'}); const p=await ctx.newPage();
  const errs=[],bad=[],remote=[];
  p.on('pageerror',e=>errs.push(e.message)); p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
  p.on('response',r=>{if(r.status()>=400)bad.push(r.status()+' '+r.url())}); p.on('request',r=>{if(!r.url().startsWith(BASE))remote.push(r.url())});
  await p.goto(BASE+url,{waitUntil:'networkidle'});
  // scroll to load lazy images
  await p.evaluate(async()=>{for(let y=0;y<document.body.scrollHeight;y+=600){window.scrollTo(0,y);await new Promise(r=>setTimeout(r,40));}window.scrollTo(0,0);});
  await p.waitForTimeout(400);
  const m=await p.evaluate(()=>{
    const de=document.documentElement;
    const over=[...document.querySelectorAll('body *')].filter(e=>{const r=e.getBoundingClientRect();const cs=getComputedStyle(e);if(!r.width||cs.position==='fixed'||e.closest('.skip-link,.on-page ul,.video'))return false;return r.right>de.clientWidth+1||r.left<-1}).map(e=>e.tagName+'.'+e.className).slice(0,4);
    const imgs=[...document.images].filter(i=>!i.complete||!i.naturalWidth).map(i=>i.src);
    return {sw:de.scrollWidth,cw:de.clientWidth,over,imgs};
  });
  const iss=[];
  if(m.sw!==m.cw)iss.push('overflow '+m.sw); if(m.over.length)iss.push('overEls '+m.over); if(m.imgs.length)iss.push('imgs '+m.imgs);
  if(errs.length)iss.push('errs '+errs); if(bad.length)iss.push('4xx '+bad); if(remote.length)iss.push('remote '+remote);
  if(full){
    const c=await p.evaluate(()=>{
      const lum=c=>{const m=c.match(/[\d.]+/g).map(Number);return m.slice(0,3).map(v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4)}).reduce((s,v,i)=>s+v*[.2126,.7152,.0722][i],0)};
      const bg=e=>{while(e){const c=getComputedStyle(e).backgroundColor;const L=c.match(/[\d.]+/g);if(L&&(L.length<4||Number(L[3])>.5))return c;e=e.parentElement}return 'rgb(245,243,236)'};
      let worst={cr:99};
      document.querySelectorAll('body *').forEach(e=>{if(![...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim()))return;const r=e.getBoundingClientRect();if(!r.width||e.closest('.visually-hidden,[hidden],.is-disabled'))return;const cs=getComputedStyle(e);if(cs.visibility==='hidden')return;
        const f=lum(cs.color),g=lum(bg(e));const cr=(Math.max(f,g)+.05)/(Math.min(f,g)+.05);if(cr<worst.cr)worst={cr:+cr.toFixed(2),t:e.textContent.trim().slice(0,30)};});
      return worst;});
    if(c.cr<4.5) iss.push('contrast '+JSON.stringify(c));
    let stops=0, first=null; const fb=[];
    for(let i=0;i<160;i++){await p.keyboard.press('Tab');
      const f=await p.evaluate(()=>{const e=document.activeElement;if(!e||e===document.body)return null;const r=e.getBoundingClientRect();
        const cs=getComputedStyle(e);const sr=e.closest('.search-row');const sum=e.matches('summary');
        const ring=cs.outlineStyle!=='none'||e.matches('.app-link,.feat a,.choice input,.post-card a')||(sr&&getComputedStyle(sr).boxShadow!=='none')||(e.closest('.choice')&&getComputedStyle(e.closest('.choice')).outlineStyle!=='none');
        const cx=Math.min(Math.max(r.left+Math.min(r.width/2,20),1),innerWidth-1), cy=Math.min(Math.max(r.top+r.height/2,1),innerHeight-1);
        const top=document.elementFromPoint(cx,cy);
        const vis=r.width>0&&r.height>0;
        const obscured=vis&&!e.closest('.skip-link')&&!!top&&!(e.contains(top)||top.contains(e)||(e.matches('.app-link,.feat a')&&e.closest('li').contains(top))||(e.closest('.choice')&&e.closest('.choice').contains(top))||(e.closest('.post-card')&&e.closest('.post-card').contains(top)));
        return {k:e.outerHTML.slice(0,70),id:(e.textContent||'').trim().slice(0,20),ring,obscured,vis}});
      if(!f)break; if(f.k===first)break; if(!first)first=f.k; stops++; if(!f.ring||f.obscured)fb.push(f.id+(f.ring?'':' noring')+(f.obscured?' obscured':''));}
    if(fb.length)iss.push('focus '+JSON.stringify(fb.slice(0,6)));
    out.push(`${name.padEnd(46)} ${String(w).padEnd(5)} contrast=${c.cr} tabs=${stops} ${iss.length?'ISSUES '+iss.join(' | '):'OK'}`);
  } else out.push(`${name.padEnd(46)} ${String(w).padEnd(5)} ${iss.length?'ISSUES '+iss.join(' | '):'OK'}`);
  issues+=iss.length; await ctx.close();
}
(async()=>{
  const b=await chromium.launch({channel:'chrome'});await productionPreflight(b,BASE);
  for (const w of [390,1440]) for (const [n,u] of all) await audit(b,n,u,w,false);
  for (const w of [320,390,768,1440]) for (const [n,u] of deep) await audit(b,n,u,w,true);
  await b.close();
  out.push(`\nTotal issues: ${issues}`); fs.writeFileSync(__dirname+'/../docs/production-quality-results.txt',out.join('\n'));
  console.log(out.filter(l=>!/ OK$/.test(l)).join('\n')); console.log(out.length-1,'audits');
})();
