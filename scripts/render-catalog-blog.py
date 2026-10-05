#!/usr/bin/env python3
"""Production renderer for the existing Draftpad ingestion entry point.
Reads one JSON request on stdin, validates all output before writing.
"""
import json,re,sys
from pathlib import Path
from urllib.parse import urlsplit
from xml.etree import ElementTree as ET
from bs4 import BeautifulSoup
from xml.sax.saxutils import escape
BASE='https://aigen.fi'
request=json.load(sys.stdin);root=Path(request['root']).resolve();posts=request['posts']
templates=Path(__file__).resolve().parent/'catalog-blog-templates'
def soup(html):return BeautifulSoup(html,'html.parser')
def node(html):return soup(html).contents[0]
def textset(doc,selector,value):
 el=doc.select_one(selector)
 if el is None:raise ValueError('Missing template selector '+selector)
 el.clear();el.append(value)
def schemas(doc):
 for tag in doc.find_all('script',type='application/ld+json'):
  data=json.loads(tag.string or tag.text)
  yield tag,data if isinstance(data,list) else data.get('@graph',[data])
def article_schema(doc):
 return next((obj for _,objects in schemas(doc) for obj in objects if obj.get('@type') in ['Article','BlogPosting']),{})
def tags(post):return list(dict.fromkeys(post['tags']))
def card(post):
 d=soup('<li class="post-card"><div class="post-thumb"></div><div class="post-card-body"><p class="post-meta"></p><h2><a></a></h2><p class="description"></p></div></li>');li=d.li;li['data-tags']='|'.join(tags(post))
 img=d.new_tag('img',src=post['image'],alt=post['title'],width=str(post['width']),height=str(post['height']),loading='lazy',decoding='async');d.select_one('.post-thumb').append(img)
 time=d.new_tag('time',datetime=post['published']);time.string=post['dateText'];meta=d.select_one('.post-meta');meta.append(time);meta.append(' · '+' · '.join(tags(post)))
 a=d.a;a['href']=post['route'];a.string=post['title'];d.select_one('.description').string=post['description'];d.select_one('.description').attrs={};return li
index_path=root/'blog/index.html';index=soup(index_path.read_text());listing=index.select_one('.post-list')
if not listing:raise ValueError('Production blog list missing')
# Keep manually authored posts and cards outside the input feed.
existing={li.select_one('h2 a')['href']:li for li in listing.select(':scope > li')}
outputs={};seen=set()
for post in posts:
 route=post['route']
 if not re.fullmatch(r'/blog/[a-z0-9-]+/',route) or route in seen:raise ValueError('Invalid or duplicate post route '+route)
 seen.add(route)
 image=urlsplit(post['image'])
 if image.netloc or not image.path.startswith('/assets/') or '..' in Path(image.path).parts:raise ValueError('Non-local post image')
 if not (root/image.path.lstrip('/')).is_file():raise ValueError('Missing image '+post['image'])
 file=root/route.lstrip('/')/'index.html'
 doc=soup(file.read_text() if file.exists() else (templates/'article.html').read_text())
 old=article_schema(doc);url=BASE+route
 # For new FI-only posts, don't claim the template's EN counterpart.
 if not file.exists():
  for alt in doc.find_all('link',rel='alternate'):alt.decompose()
  for lang in ['fi','x-default']:
   alt=doc.new_tag('link',rel='alternate',hreflang=lang,href=url);doc.head.append(alt)
  doc.select_one('.lang-switch')['href']='/en/blog/'
  for link in doc.select('.footer-bottom a[hreflang=en]'):link['href']='/en/blog/'
  nextstep=doc.select_one('.post-next')
  nextstep.clear();nextstep.append(node('<aside class="mini-app mini-custom"><p class="mini-kicker">Tutustu myös</p><p>Aigenin sovellukset yrityksille.</p><a class="arrow-link" href="/sovellukset/">Selaa sovelluksia</a></aside>'))
  old={}
 doc.find('link',rel='canonical')['href']=url
 textset(doc,'title',post['title']+' | Aigen Blogi');doc.find('meta',attrs={'name':'description'})['content']=post['description']
 for prop,value in [('og:title',post['title']),('og:description',post['description']),('og:url',url),('og:image',BASE+post['image']),('og:type','article')]:
  el=doc.find('meta',property=prop)
  if not el:el=doc.new_tag('meta',property=prop);doc.head.append(el)
  el['content']=value
 textset(doc,'h1',post['title']);textset(doc,'.post-hero .lead',post['description'])
 published=old.get('datePublished',post['published']);published_day=published[:10]
 date=doc.select_one('.post-hero time');date['datetime']=published_day;date.string=post['dateText'] if published_day==post['published'] else published_day
 tagbar=doc.select_one('.post-tags');tagbar.clear()
 for tag in tags(post):t=doc.new_tag('li');t.string=tag;tagbar.append(t)
 img=doc.select_one('.post-figure img');previous_image=img.get('src');img.attrs.update(src=post['image'],alt=post['title'],width=str(post['width']),height=str(post['height']))
 caption=doc.select_one('.post-figure figcaption')
 if caption and (not file.exists() or previous_image!=post['image']):caption.decompose()
 body=doc.select_one('.post-body');body.clear()
 fragment=soup(post['body'])
 for child in list(fragment.contents):body.append(child)
 # Retain known author/publisher; preserve the original first publication date.
 new=dict(old);new.update({'@context':'https://schema.org','@type':'BlogPosting','headline':post['title'],'description':post['description'],'image':BASE+post['image'],'url':url,'mainEntityOfPage':url,'datePublished':published,'dateModified':post['modified'],'inLanguage':'fi'})
 new.setdefault('author',{'@type':'Organization','name':'AI Generation Oy'});new.setdefault('publisher',{'@id':BASE+'/#organization'})
 for key in ['@id','isPartOf']:
  if key=='@id':new[key]=url+'#article'
 for tag,objects in list(schemas(doc)):
  objects=[obj for obj in objects if obj.get('@type') not in ['Article','BlogPosting']]
  if objects:tag.string=json.dumps(objects,ensure_ascii=False).replace('</','<\\/')
  else:tag.decompose()
 tag=doc.new_tag('script',type='application/ld+json');tag.string=json.dumps(new,ensure_ascii=False).replace('</','<\\/');doc.head.append(tag)
 # Related cards use the current published feed, while keeping the approved layout.
 related=doc.select_one('.post-mini-grid');related.clear()
 for other in posts:
  if other['route']==route:continue
  li=doc.new_tag('li');a=doc.new_tag('a',href=other['route']);a['class']='post-mini'
  span=doc.new_tag('span');span.string=other['dateText'];strong=doc.new_tag('strong');strong.string=other['title'];a.extend([span,strong]);li.append(a);related.append(li)
  if len(related.select(':scope > li'))==3:break
 html=str(doc)
 if re.search(r'testi-sivu|cookie-consent|aigen-preview\.(css|js)',html):raise ValueError('Legacy layout/preview reference in '+route)
 outputs[file]=re.sub(r'\n{2,}', '\n', html).strip()+'\n';existing[route]=card(dict(post,published=published_day))
# Sort all cards together; keep every manually maintained card.
items=sorted(existing.values(),key=lambda li:li.select_one('time')['datetime'],reverse=True);listing.clear()
for li in items:listing.append(li)
textset(index,'#tag-status',str(len(items))+' kirjoitusta')
bar=index.select_one('.tag-filter');bar.clear()
counts={}
for li in items:
 for tag in li.get('data-tags','').split('|'):
  if tag:counts[tag]=counts.get(tag,0)+1
for label,count in [('',len(items)),*sorted(counts.items())]:
 button=index.new_tag('button',type='button');button['data-tag']=label;button['aria-pressed']='true' if not label else 'false';button.string=label or 'Kaikki'
 if label:n=index.new_tag('span');n['class']='n';n.string=str(count);button.append(' ');button.append(n)
 bar.append(button)
outputs[index_path]=re.sub(r'\n{2,}', '\n', str(index)).strip()+'\n'
# Extend the current explicit canonical set. Never crawl source or preview folders.
ns='{http://www.sitemaps.org/schemas/sitemap/0.9}'
urls={el.text for el in ET.parse(root/'sitemap.xml').getroot().iter(ns+'loc')}|{BASE+p['route'] for p in posts}
for url in urls:
 u=urlsplit(url)
 if u.netloc!='aigen.fi' or not u.path.endswith('/') or any(part in ['testi-sivu','testi-sivu2','testi-sivu3','_build','scripts','tests','docs','artikkeli-pohja'] for part in u.path.split('/')):raise ValueError('Invalid canonical sitemap URL '+url)
 file=root/u.path.lstrip('/')/'index.html';doc=soup(outputs.get(file,file.read_text() if file.exists() else ''))
 canonical=doc.find('link',rel='canonical');robots=doc.find('meta',attrs={'name':'robots'})
 if not canonical or canonical['href']!=url or (robots and 'noindex' in robots['content']):raise ValueError('Noncanonical sitemap URL '+url)
outputs[root/'sitemap.xml']='<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n'+''.join('  <url><loc>'+escape(u)+'</loc></url>\n' for u in sorted(urls))+'</urlset>\n'
for file,html in outputs.items():file.parent.mkdir(parents=True,exist_ok=True);file.write_text(html)
print('Built '+str(len(posts))+' posts in production catalog layout; '+str(len(urls))+' canonical sitemap URLs.')
