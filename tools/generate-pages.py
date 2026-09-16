import sys, re, importlib
sys.path.insert(0,'/home/claude/work/tools')
import h2j; importlib.reload(h2j)
from h2j import convert
SRC='/home/claude/work/extract/pages'
def build(page, comp, post=lambda s:s, extra=(), subs=None, wrapper=None):
    html=post(open(f'{SRC}/{page}.html',encoding='utf-8').read())
    jsx, link = convert(html)
    if subs:
        for k,v in subs.items(): jsx=jsx.replace(k,v)
    imp=(["import { Link } from '@/lib/router'"] if link else [])+list(extra)
    body='\n'.join('      '+l if l.strip() else '' for l in jsx.split('\n'))
    head=('\n'.join(imp)+'\n\n') if imp else ''
    # Some of the original CSS is scoped to the page wrapper (#pg-home ...),
    # so that scope has to survive as a class on the page root.
    open_tag = f'<div className="{wrapper}">' if wrapper else '<>'
    close_tag = '</div>' if wrapper else '</>'
    open(f'src/pages/{comp}.tsx','w',encoding='utf-8').write(
        f"{head}export default function {comp}() {{\n  return (\n    {open_tag}\n{body}\n    {close_tag}\n  )\n}}\n")
for p,c in [('about','AboutPage'),('difference','DifferencePage'),('membership','MembershipPage'),
            ('cert-l1','CertLevel1Page'),('cert-l2','CertLevel2Page')]: build(p,c)
# The v4.8 JS painted these backgrounds from IMGDATA at runtime. They become
# real image files here. Targeting the id (not the full tag) so a class change
# can never make the substitution silently miss.
def paint(html, element_id, image, position='center'):
    pattern = r'(<div[^>]*\bid="%s")' % re.escape(element_id)
    style = ' style="background-image:url(/images/%s.webp);background-size:cover;background-position:%s"' % (image, position)
    out, n = re.subn(pattern, r'\1' + style, html)
    assert n == 1, 'paint(%s): expected 1 match, got %d' % (element_id, n)
    return out

build('research','ResearchPage', lambda s: paint(s, 'rs-img', 'analyze'))
build('certification','CertificationPage', lambda s: paint(s, 'cert-bg', 'level', 'center 35%'))
def home_post(s):
    s=s.replace('<div class="probgrid" id="probgrid"></div>', '@@PROBGRID@@')
    s=paint(s, 'sol-img', 'analyze')
    s=s.replace('<div id="testi-pills" style="margin-top:14px;display:flex;gap:8px;flex-wrap:wrap"></div>','')
    s=re.sub(r'<div style="position:relative;border-radius:6px;overflow:hidden;aspect-ratio:16/9;background:#071A26;box-shadow:0 24px 60px rgba\(0,0,0,\.4\)">\s*<iframe id="testi-frame".*?</iframe>\s*</div>','@@TESTIFRAME@@', s, flags=re.S)
    s=re.sub(r'<video id="hero-vid".*?</video>', '@@HEROVIDEO@@', s, flags=re.S)
    return s
build('home','HomePage', home_post,
  ["import ProblemGrid from '@/components/blocks/ProblemGrid'","import TestimonialReel from '@/components/blocks/TestimonialReel'","import HeroVideo from '@/components/blocks/HeroVideo'"],
  {'@@PROBGRID@@':'<ProblemGrid />','@@TESTIFRAME@@':'<TestimonialReel />','@@HEROVIDEO@@':'<HeroVideo />'},
  wrapper='page-home')
print('regenerated')
