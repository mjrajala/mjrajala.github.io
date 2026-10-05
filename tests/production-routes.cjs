const {chromium}=require('/opt/homebrew/lib/node_modules/openclaw/node_modules/playwright-core');
const fs=require('fs'),path=require('path'),assert=require('assert');
const root=path.resolve(__dirname,'..'),base=process.env.AIGEN_TEST_BASE||'http://127.0.0.1:8768';
const report=JSON.parse(fs.readFileSync(path.join(root,'testi-sivu3/_build/build-report.json'))),route=u=>u.replace('/testi-sivu3/','/');

async function productionPreflight(browser, url) {
  const probe = await browser.newPage();
  await probe.goto(url + '/');
  const canonical = await probe.locator('link[rel="canonical"]').getAttribute('href');
  const preview = await probe.locator('.preview-strip').count();
  await probe.close();
  if (canonical !== 'https://aigen.fi/' || preview) throw new Error('Test server is not the promoted production root: ' + url);
}

(async()=>{const browser=await chromium.launch({channel:'chrome'});await productionPreflight(browser,base);let checks=0;const errors=[];
for(const width of [390,1440]){const context=await browser.newContext({viewport:{width,height:900},reducedMotion:'reduce'});const p=await context.newPage();p.on('pageerror',e=>errors.push(e.message));p.on('console',m=>{if(m.type()==='error')errors.push(m.text())});p.on('response',r=>{if(r.status()>=400)errors.push(r.url())});
for(const pair of Object.values(report.pages))for(const u of Object.values(pair)){await p.goto(base+route(u));assert.equal(await p.locator('.preview-strip,[data-live-escape]').count(),0);assert.equal(await p.locator('link[rel=canonical]').getAttribute('href'),'https://aigen.fi'+route(u));assert.equal(await p.locator('meta[name=robots]').getAttribute('content'),'index,follow');checks++;}
for(const [a,t] of Object.entries(report.aliases)){const html=fs.readFileSync(path.join(root,route(a),'index.html'),'utf8');const map=JSON.parse(html.match(/var m = (.*?), h =/)[1]);for(const fragment of ['',...Object.keys(map)]){await p.goto(base+route(a)+'?legacy=1'+(fragment?'#'+fragment:''));await p.waitForURL(base+route(t)+'?legacy=1'+(fragment?'#'+map[fragment]:''));if(fragment)assert.equal(await p.locator('[id="'+map[fragment]+'"]').count(),1);checks++;}}
for(const [h,d] of Object.entries({contact:'/yritys/#yhteys',services:'/raataloity-kehitys/',about:'/yritys/',products:'/sovellukset/'})){await p.goto(base+'/#'+h);await p.waitForURL(base+d);checks++;}
for(const u of ['/yritys/#yhteys','/en/company/#contact','/sovellukset/aigen-cbam/#ominaisuudet','/en/apps/aigen-cbam/#features','/oppaat/ai-act-pk-yritys/#tarkistuslista']){await p.goto(base+u);await p.waitForTimeout(200);const bounds=await p.evaluate(()=>{const header=document.querySelector('.site-header'),anchor=document.getElementById(decodeURIComponent(location.hash.slice(1)));if(!header||!anchor)throw new Error('Missing '+(!header?'header':'anchor')+' on '+location.href);return {header:header.getBoundingClientRect().bottom,target:anchor.getBoundingClientRect().top};});assert(bounds.target>=bounds.header-1,JSON.stringify({u,width,bounds}));checks++;}
await context.close();}await browser.close();assert.deepEqual(errors,[]);fs.writeFileSync(path.join(root,'docs/production-browser-routes.json'),JSON.stringify({checks,errors},null,2));console.log(checks+' route checks passed');})().catch(e=>{console.error(e);process.exit(1)});
