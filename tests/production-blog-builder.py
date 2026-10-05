"""Exercise the real JS ingestion and production renderer only in an isolated copy."""
import hashlib,json,shutil,subprocess,tempfile
from pathlib import Path
from xml.etree import ElementTree as ET
from bs4 import BeautifulSoup
ROOT=Path(__file__).resolve().parents[1]
def hashes(root):return {str(p.relative_to(root)):hashlib.sha256(p.read_bytes()).hexdigest() for p in root.rglob('*') if p.is_file() and '.git' not in p.parts}
def soup(p):return BeautifulSoup(p.read_text(),'html.parser')
def article(p):
 for s in soup(p).find_all('script',type='application/ld+json'):
  d=json.loads(s.text);objects=d if isinstance(d,list) else d.get('@graph',[d])
  for obj in objects:
   if obj.get('@type')=='BlogPosting':return obj
before=hashes(ROOT)
with tempfile.TemporaryDirectory(prefix='aigen-blog-fixture-',dir='/private/tmp') as directory:
 copy=Path(directory)/'site';shutil.copytree(ROOT,copy,ignore=shutil.ignore_patterns('.git'))
 existing=json.loads((copy/'blog/linkedin-posts.json').read_text())[0]
 existing_path=copy/'blog'/existing['slug']/'index.html'
 doc=soup(existing_path);caption=doc.new_tag('figcaption');caption.string='Existing meaningful caption';doc.select_one('.post-figure').append(caption);existing_path.write_text(str(doc))
 baseline_copy=hashes(copy)
 original_schema=article(copy/'blog'/existing['slug']/'index.html')
 original_card_urls={e['href'] for e in soup(copy/'blog/index.html').select('.post-card h2 a')}
 fixture=[dict(existing,content='Updated existing fixture paragraph.',updatedAt='2026-10-05T18:00:00Z'),{
 'id':'fixture-published','slug':'fixture-production-published','title':'Fixture <script> & safe title','status':'published',
 'createdAt':'2026-10-05T12:00:00Z','publishedAt':'2026-10-05T12:00:00Z','updatedAt':'2026-10-05T13:00:00Z',
 'content':'Fixture <script>alert(1)</script> body.\n\n- first task\n- second task','hashtags':['Fixture topic'],'imageUrl':'/assets/logo-slogan.png'},
 {'slug':'fixture-draft','title':'Do not publish','status':'draft','content':'ignored'}]
 source=Path(directory)/'fixture.json';source.write_text(json.dumps(fixture))
 def build(input_file):return subprocess.run(['node',str(copy/'scripts/build-blog-from-draftpad.js'),str(input_file)],check=True,capture_output=True,text=True).stdout.strip()
 print(build(source));after=hashes(copy)
 allowed={'blog/index.html','sitemap.xml','blog/'+existing['slug']+'/index.html','blog/fixture-production-published/index.html'}
 assert {f for f in after if after[f]!=baseline_copy.get(f)}==allowed
 page=soup(copy/'blog/fixture-production-published/index.html');assert page.h1.text==fixture[1]['title']
 assert page.select_one('.breadcrumb').get_text(' ',strip=True)=='Etusivu Blogi'
 assert page.select_one('.post-next a')['href']=='/sovellukset/'
 assert page.select_one('.footer-bottom a[hreflang=en]')['href']=='/en/blog/'
 assert 'Agentit tekevät monivaiheisesta selvitystyöstä' not in str(page)
 assert not page.select_one('.post-figure figcaption')
 assert page.select_one('.post-hero time')['datetime']=='2026-10-05'
 assert article(copy/'blog/fixture-production-published/index.html')['author']=={'@type':'Organization','name':'AI Generation Oy'}
 assert not page.select('.post-body script');assert 'Fixture <script>alert(1)</script> body.' in page.select_one('.post-body').text
 assert len(page.select('.post-body li'))==2;assert page.select_one('.menu-button') and page.select_one('.footer')
 assert page.select_one('.lang-switch')['href']=='/en/blog/';assert not page.find('link',hreflang='en')
 assert {x['hreflang'] for x in page.find_all('link',rel='alternate')}=={'fi','x-default'}
 html=str(page);assert not any(x in html for x in ['testi-sivu','cookie-consent','aigen-preview.css'])
 new_schema=article(copy/'blog'/existing['slug']/'index.html')
 assert soup(existing_path).select_one('figcaption').text=='Existing meaningful caption'
 assert new_schema['datePublished']==original_schema['datePublished'];assert new_schema['author']==original_schema['author']
 assert new_schema['dateModified']=='2026-10-05'
 cards={e['href'] for e in soup(copy/'blog/index.html').select('.post-card h2 a')}
 assert cards==original_card_urls|{'/blog/fixture-production-published/'}
 assert not (copy/'blog/fixture-draft').exists()
 urls={e.text for e in ET.parse(copy/'sitemap.xml').getroot().iter('{http://www.sitemaps.org/schemas/sitemap/0.9}loc')}
 assert len(urls)==67;assert 'https://aigen.fi/blog/fixture-production-published/' in urls
 for url in urls:
  d=soup(copy/url.removeprefix('https://aigen.fi/').rstrip('/')/'index.html')
  assert d.find('link',rel='canonical')['href']==url
  assert 'noindex' not in d.find('meta',attrs={'name':'robots'})['content']
 print(build(source));assert hashes(copy)==after,'Fixture build must be idempotent'
 print(build(copy/'blog/linkedin-posts.json'))
 # Real source ingestion is exercised in the copy only; manually maintained cards remain.
 assert original_card_urls<= {e['href'] for e in soup(copy/'blog/index.html').select('.post-card h2 a')}
 # Invalid image must fail before any write.
 bad=dict(fixture[1],imageUrl='/assets/fixture-missing.png');source.write_text(json.dumps([bad]));pre_bad=hashes(copy)
 result=subprocess.run(['node',str(copy/'scripts/build-blog-from-draftpad.js'),str(source)],capture_output=True,text=True)
 assert result.returncode!=0 and 'Missing image' in result.stderr;assert hashes(copy)==pre_bad
assert hashes(ROOT)==before,'Real worktree changed during fixture tests'
print('PASS: isolated ingestion, existing/new/draft posts, approved shell, manual posts, escaping, dates/author, sitemap, idempotence, failure-before-write, worktree unchanged')
