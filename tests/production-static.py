"""Verify promoted generated pages; optionally check the session's preservation baseline."""
import hashlib,json,re,sys
from pathlib import Path
from urllib.parse import urlsplit,unquote,urljoin
from xml.etree import ElementTree as ET
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]
r=json.loads((ROOT/'testi-sivu3/_build/build-report.json').read_text())
route=lambda u:u.replace('/testi-sivu3/','/')
canonical={route(u) for pair in r['pages'].values() for u in pair.values()}
aliases={route(a):route(t) for a,t in r['aliases'].items()}
pages={u:BeautifulSoup((ROOT/u.lstrip('/')/'index.html').read_text(),'html.parser') for u in canonical|aliases.keys()}
errors=[]; counts={'canonical':len(canonical),'aliases':len(aliases),'references':0,'fragments':0,'article_dates':0}
def check(ok,msg):
 if not ok: errors.append(msg)
for u,s in pages.items():
 html=str(s); check('testi-sivu' not in html,u+' preview reference');check(not re.search('preview|esikatselu',s.title.text,re.I),u+' preview title')
 check(s.find('link',rel='canonical')['href']=='https://aigen.fi'+aliases.get(u,u),u+' canonical')
 check(s.find('meta',attrs={'name':'robots'})['content']==('noindex,follow' if u in aliases else 'index,follow'),u+' robots')
 if u in aliases:
  script=s.find('script').text;m=json.loads(re.search(r'var m = (.*?), h =',script).group(1))
  source=BeautifulSoup((ROOT/'testi-sivu3'/u.lstrip('/')/'index.html').read_text(),'html.parser')
  check('location.search' in script and 'location.hash' in script,u+' fragment/query preservation')
  for dest in m.values(): check(pages[aliases[u]].find(id=dest) is not None,u+' mapped fragment '+dest)
  continue
 check(not re.search(r'preview|esikatselu|testi-sivu',str(s.head),re.I),u+' preview metadata')
 check(not s.select('.preview-strip,[data-live-escape]'),u+' preview UI')
 pair=next(p for p in r['pages'].values() if u in map(route,p.values()))
 for lang,url in dict(pair,**{'x-default':pair['fi']}).items():
  check(s.find('link',rel='alternate',hreflang=lang)['href']=='https://aigen.fi'+route(url),u+' hreflang '+lang)
 check(s.select_one('.lang-switch')['href']==route(pair['fi' if s.html['lang']=='en' else 'en']),u+' language switch')
 for tag,attr in [('a','href'),('img','src'),('script','src'),('link','href'),('form','action'),('source','src')]:
  for el in s.find_all(tag):
   val=el.get(attr)
   if not val:continue
   target=urlsplit(urljoin('https://aigen.fi'+u,val))
   if target.netloc!='aigen.fi':continue
   counts['references']+=1
   path=unquote(target.path);f=ROOT/path.lstrip('/');f=f/'index.html' if path.endswith('/') else f
   check(f.is_file(),u+' missing '+val)
   if target.fragment:
    counts['fragments']+=1
    doc=pages.get(path)
    if doc:check(doc.find(id=unquote(target.fragment)) is not None,u+' missing fragment '+val)
 for script in s.find_all('script',type='application/ld+json'):
  for obj in json.loads(script.text):
   if obj['@type']=='BlogPosting':
    key=next(k for k,pair in r['pages'].items() if u in map(route,pair.values()));post=r['posts'][key+':'+s.html['lang']]
    old=json.loads((ROOT/'scripts/production-article-metadata.json').read_text()).get(post['src'],{})
    for field,default in [('datePublished','published'),('dateModified','modified')]:check(obj[field]==old.get(field,post[default]),u+' '+field)
    counts['article_dates']+=1
check({x.text for x in ET.parse(ROOT/'sitemap.xml').getroot().iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')}=={'https://aigen.fi'+u for u in canonical},'sitemap exact canonical set')
for f in (ROOT/'assets/catalog-site').rglob('*'):
 if f.suffix in ['.js','.css']:
  check('/testi-sivu' not in f.read_text(),str(f)+' preview path')
if len(sys.argv)>1:
 baseline=json.loads(Path(sys.argv[1]).read_text())
 for f,h in baseline['protected'].items():check(hashlib.sha256((ROOT/f).read_bytes()).hexdigest()==h,'protected '+f)
 counts['protected_files']=len(baseline['protected'])
print(json.dumps({'counts':counts,'errors':errors},indent=2));sys.exit(bool(errors))
