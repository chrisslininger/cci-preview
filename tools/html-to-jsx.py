"""HTML -> JSX converter tuned for this port.

Faithfulness is the priority: markup is transformed structurally, never
re-typed. The one deliberate CHANGE is that every `onclick="go(...)"` becomes a
real <a href> pointing at the new route, because that is the entire purpose of
the rebuild.
"""
import re, json

# site key (+optional id) -> real route
ROUTE = {
    'home': '/', 'about': '/about', 'difference': '/advo-difference',
    'board': '/board-of-directors', 'research': '/research',
    'seminars': '/seminars', 'certification': '/certification',
    'cert-l1': '/certification/advo-level-1',
    'cert-l2': '/certification/advo-level-2',
    'membership': '/membership', 'articles': '/articles',
    'contact': '/contact', 'account': '/account',
    'confirm': '/registration-confirmed',
}
SEM_SLUG = {'intro':'intro-to-advo','fund1':'fundamental-1','fund2':'fundamental-2',
            'fund3':'fundamental-3','intensive':'advo-intensive-west',
            'bootcamp':'advo-bootcamp-2027','conference':'annual-conference-2026',
            'internship':'internships'}
PROB_SLUG = {'repeat':'corrections-that-do-not-hold','respond':'patients-who-do-not-respond',
             'uncertain':'uncertainty-in-the-listing','doctordep':'doctor-dependence',
             'strain':'physical-strain-on-the-doctor'}

def href_for(page, ident=None):
    if page == 'sem' and ident:   return '/seminars/' + SEM_SLUG[ident]
    if page == 'problem' and ident: return '/clinical-challenges/' + PROB_SLUG[ident]
    if page == 'article' and ident: return '/articles/' + ident
    return ROUTE.get(page, '/')

CAMEL = {
    'class':'className','for':'htmlFor','tabindex':'tabIndex','colspan':'colSpan',
    'rowspan':'rowSpan','maxlength':'maxLength','autocomplete':'autoComplete',
    'autofocus':'autoFocus','readonly':'readOnly','novalidate':'noValidate',
    'srcset':'srcSet','crossorigin':'crossOrigin','playsinline':'playsInline',
    'frameborder':'frameBorder','allowfullscreen':'allowFullScreen',
    'contenteditable':'contentEditable','spellcheck':'spellCheck',
    'accept-charset':'acceptCharset','http-equiv':'httpEquiv','datetime':'dateTime',
    'enctype':'encType','usemap':'useMap','minlength':'minLength',
    # SVG
    'viewbox':'viewBox',
    'stroke-width':'strokeWidth','stroke-linecap':'strokeLinecap',
    'stroke-linejoin':'strokeLinejoin','fill-rule':'fillRule','clip-rule':'clipRule',
    'stop-color':'stopColor','stop-opacity':'stopOpacity','stroke-opacity':'strokeOpacity',
    'fill-opacity':'fillOpacity','stroke-dasharray':'strokeDasharray',
    'stroke-dashoffset':'strokeDashoffset','clip-path':'clipPath',
    'preserve-aspect-ratio':'preserveAspectRatio','text-anchor':'textAnchor',
    'dominant-baseline':'dominantBaseline','stroke-miterlimit':'strokeMiterlimit',
    'shape-rendering':'shapeRendering','vector-effect':'vectorEffect',
    'paint-order':'paintOrder','color-interpolation':'colorInterpolation','strokewidth':'strokeWidth','strokelinecap':'strokeLinecap',
    'strokelinejoin':'strokeLinejoin','fillrule':'fillRule','cliprule':'clipRule',
    'stopcolor':'stopColor','stopopacity':'stopOpacity','strokeopacity':'strokeOpacity',
    'fillopacity':'fillOpacity','strokedasharray':'strokeDasharray',
    'strokedashoffset':'strokeDashoffset','clippath':'clipPath',
    'preserveaspectratio':'preserveAspectRatio','textanchor':'textAnchor',
    'dominantbaseline':'dominantBaseline','xlink:href':'xlinkHref',
}

# The old stylesheet's variable names were renamed to role-based tokens. Inline
# styles in the markup still reference the old ones, so they are mapped here.
LEGACY_VARS = {
    '--midnight-2':'--color-surface-inverse-raised',
    '--midnight':'--color-surface-inverse',
    '--teal-deep':'--color-brand-primary-deep',
    '--teal':'--color-brand-primary',
    '--gold-hi':'--color-brand-accent-bright',
    '--gold':'--color-brand-accent',
    '--bronze':'--color-brand-accent-strong',
    '--mist':'--color-surface-raised',
    '--line':'--color-border-subtle',
    '--body':'--color-content-secondary',
    '--ink':'--color-content-primary',
}

# Raw hex is not permitted outside tokens.css. Inline SVG colours map to the
# same tokens the stylesheet uses, via var() which SVG presentation attributes
# accept just as CSS does.
SVG_COLOR = {
    '#c29a4b':'var(--color-brand-accent)',
    '#071a26':'var(--color-surface-inverse)',
    '#fff':'var(--color-surface-base)',
    '#ffffff':'var(--color-surface-base)',
    '#a9bdc8':'var(--color-content-on-inverse-muted)',
    '#9db4c0':'var(--color-content-on-inverse-muted)',
    '#c3d4dc':'var(--color-border-strong)',
    '#7b909b':'var(--color-content-muted)',
    '#6d8592':'var(--color-content-muted)',
    '#6c8592':'var(--color-content-muted)',
}
VOID = {'area','base','br','col','embed','hr','img','input','link','meta',
        'param','source','track','wbr'}
BOOL = {'autoplay','muted','loop','controls','playsinline','disabled','checked',
        'required','readonly','selected','defer','async','hidden','novalidate',
        'allowfullscreen','autofocus','open','multiple'}

def style_to_obj(css):
    out = {}
    for decl in css.split(';'):
        if ':' not in decl: continue
        k, v = decl.split(':', 1)
        k = k.strip(); v = v.strip()
        if not k or not v: continue
        for hx, tok in SVG_COLOR.items():
            v = re.sub(re.escape(hx) + r'\b', tok, v, flags=re.I)
        for old, new in LEGACY_VARS.items():
            v = v.replace('var(%s)' % old, 'var(%s)' % new)
        if k.startswith('--'):
            out[k] = v
        else:
            key = re.sub(r'-([a-z])', lambda m: m.group(1).upper(), k)
            out[key] = v
    return '{' + ', '.join(f'{json.dumps(k)}: {json.dumps(v)}' for k, v in out.items()) + '}'

ATTR = re.compile(r'''([:@a-zA-Z_][-:.\w]*)\s*(?:=\s*("([^"]*)"|'([^']*)'|([^\s>]+)))?''')

def convert(html, link_component='Link'):
    used = {'link': False}
    def tag_sub(m):
        closing, name, attrs, selfclose = m.group(1), m.group(2), m.group(3) or '', m.group(4)
        lname = name.lower()
        if closing:
            return f'</{lname}>'
        parts, go = [], None
        for a in ATTR.finditer(attrs):
            k = a.group(1)
            v = a.group(3) if a.group(3) is not None else (a.group(4) if a.group(4) is not None else a.group(5))
            lk = k.lower()
            if lk == 'onclick' and v and 'go(' in v:
                g = re.search(r"go\(\s*'([^']+)'\s*(?:,\s*'([^']+)')?", v)
                if g: go = (g.group(1), g.group(2))
                continue
            if lk.startswith('on'):
                continue
            if lk == 'style' and v is not None:
                parts.append(f'style={{{style_to_obj(v)}}}'); continue
            jk = CAMEL.get(lk, lk)
            if lk in ('fill', 'stroke', 'color', 'stop-color') and v:
                v = SVG_COLOR.get(v.strip().lower(), v)
                for old, new in LEGACY_VARS.items():
                    v = v.replace('var(%s)' % old, 'var(%s)' % new)
            if v is None:
                parts.append(f'{jk}={{true}}' if lk in BOOL else f'{jk}')
            elif lk in BOOL and v.lower() in ('', 'true', lk):
                parts.append(f'{jk}={{true}}')
            else:
                parts.append(f'{jk}={json.dumps(v)}')
        if go is not None:
            used['link'] = True
            href = href_for(*go)
            parts = [p for p in parts if not p.startswith('href=')]
            parts.insert(0, f'to={json.dumps(href)}')
            body = ' '.join(parts)
            # <a>/<span>/<div> that acted as a link all become a real router Link
            return f'<{link_component} {body}>' if not selfclose else f'<{link_component} {body} />'
        body = (' ' + ' '.join(parts)) if parts else ''
        if lname in VOID or selfclose:
            return f'<{lname}{body} />'
        return f'<{lname}{body}>'

    out = re.sub(r'<(/?)([a-zA-Z][\w-]*)((?:\s+[^<>]*?)?)(/?)>', tag_sub, html)
    # close tags that became Link
    out = _fix_link_closers(out, link_component)
    # HTML comments -> JSX comments
    out = re.sub(r'<!--(.*?)-->', lambda m: '{/*' + m.group(1).replace('*/', '* /') + '*/}', out, flags=re.S)
    # braces in text must be escaped
    out = re.sub(r'(?<![{])\{(?![{/*])', "{'{'}", out)
    return out, used['link']

def _fix_link_closers(s, lc):
    """Re-balance: an element rewritten to <Link> still has its original closer."""
    tokens = re.split(r'(<[^>]+>)', s)
    stack, out = [], []
    for t in tokens:
        m = re.match(r'<(/?)([A-Za-z][\w-]*)', t)
        if not m:
            out.append(t); continue
        closing, name = m.group(1), m.group(2)
        if t.endswith('/>'):
            out.append(t); continue
        if not closing:
            stack.append(name); out.append(t)
        else:
            if stack:
                opened = stack.pop()
                out.append(f'</{opened}>')
            else:
                out.append(t)
    return ''.join(out)
