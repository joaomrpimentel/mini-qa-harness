# Higher-level shapes on top of xlib: short-named boxes, notes in dashed boxes linked by a
# dashed line, a stick figure for people, coloured dashed zones, and the dashed frame with a
# title around each diagram.
import copy, json, os, random
import xlib
from xlib import *
from xlib import _text

BLUE = '#1971c2'; GREEN = '#2f9e44'; ORANGE = '#e8590c'; RED = '#e03131'; GRAY = '#868e96'; VIO = '#6741d9'
FILL = {GREEN: '#b2f2bb', RED: '#ffc9c9', BLUE: '#a5d8ff'}
INK = '#1e1e1e'
FIGURE = json.load(open(os.path.join(os.path.dirname(os.path.abspath(__file__)), 'stick-figure.json')))


def head(d, title): d.meta = (title,)


def wrap(els, title, pad=110):
    """dashed frame around the diagram with the title centred on top; boxes inside a coloured zone take its colour"""
    ids = {e['id']: e for e in els}
    for e in els:
        c = ids.get(e.get('containerId'))
        if c and c['type'] != 'arrow': e['x'] = cx(c) - e['width'] / 2; e['y'] = cyv(c) - e['height'] / 2
    zs = sorted([e for e in els if e['type'] == 'rectangle' and e['strokeStyle'] == 'dashed' and e['strokeColor'] not in (INK, GRAY) and e['width'] > 300], key=lambda z: -z['width'] * z['height'])
    for z in zs:
        for e in els:
            if e['type'] in ('rectangle', 'ellipse', 'diamond') and e['strokeStyle'] == 'solid' and e.get('opacity', 100) > 0 and e['strokeColor'] == INK \
                    and e['x'] >= z['x'] and right(e) <= right(z) and e['y'] >= z['y'] and below(e) <= below(z):
                e['strokeColor'] = z['strokeColor']
    x0, y0, x1, y1 = bbox(els)
    r = base('rectangle', x0 - pad, y0 - pad, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad, style='dashed')
    h = _text(0, 0, title, 36); h['x'] = r['x'] + r['width'] / 2 - h['width'] / 2; h['y'] = r['y'] - h['height'] - 24
    return [r] + els + [h]


def setc(d, b, y=None, x=None):
    dy = 0 if y is None else y - cyv(b); dx = 0 if x is None else x - cx(b)
    b['x'] += dx; b['y'] += dy
    for e in b.get('_grp', []): e['x'] += dx; e['y'] += dy
    for e in d.els:
        if e.get('containerId') == b['id']: e['y'] += dy; e['x'] += dx
    return b


def B(d, x, y, label, t='rectangle', fill=None):
    return d.box(x, y, 200 if t == 'rectangle' else 190, 100 if t == 'rectangle' else 140, label, t=t,
                 stroke=fill or INK, bg=FILL[fill] if fill else 'transparent', raw=True)


def boneco(d, label=None, h=130):
    """a person as a stick figure; returns an invisible box of its size for arrows to bind to"""
    xs = [e['x'] for e in FIGURE]; ys = [e['y'] for e in FIGURE]
    x0, y0 = min(xs), min(ys)
    H = max(e['y'] + e['height'] for e in FIGURE) - y0; W = max(e['x'] + e['width'] for e in FIGURE) - x0; k = h / H
    gid = rid(); grp = []
    for e in FIGURE:
        n = base(e['type'], (e['x'] - x0) * k, (e['y'] - y0) * k, e['width'] * k, e['height'] * k, round=e.get('roundness'))
        n.update(groupIds=[gid], strokeWidth=e.get('strokeWidth', 2), roughness=e.get('roughness', 1))
        if 'points' in e:
            n.update(points=[[p[0] * k, p[1] * k] for p in e['points']], lastCommittedPoint=None, startBinding=None,
                     endBinding=None, startArrowhead=None, endArrowhead=None)
        grp.append(n)
    d.els += grp
    hit = base('rectangle', -10, 0, W * k + 20, h, stroke='transparent'); hit['opacity'] = 0; hit['_grp'] = grp
    d.els.append(hit)
    if label:
        t = _text(0, 0, label, FMIN); t['x'] = W * k / 2 - t['width'] / 2; t['y'] = h + 10; d.els.append(t); grp.append(t)
        hit['height'] = h + 10 + t['height']; hit['x'] = min(hit['x'], t['x'] - 10); hit['width'] = max(W * k + 20, t['width'] + 20)
    return hit


def place(d, b, x, y):
    """move a box (or a stick figure) so its top-left is at x,y"""
    return setc(d, b, x=x + b['width'] / 2, y=y + b['height'] / 2)


def note(d, b, txt, side='right', gap=90, dx=0, dy=0):
    """explanation outside the box, in a small dashed box linked by a dashed line"""
    t = _text(0, 0, txt, FMIN)
    if side == 'right': t['x'] = right(b, gap) + dx; t['y'] = cyv(b) - t['height'] / 2 + dy; p1 = (right(b, 8), cyv(b))
    elif side == 'left': t['x'] = b['x'] - gap - t['width'] + dx; t['y'] = cyv(b) - t['height'] / 2 + dy; p1 = (b['x'] - 8, cyv(b))
    elif side == 'above': t['x'] = cx(b) - t['width'] / 2 + dx; t['y'] = b['y'] - gap - t['height'] + dy; p1 = (cx(b), b['y'] - 8)
    else: t['x'] = cx(b) - t['width'] / 2 + dx; t['y'] = below(b, gap) + dy; p1 = (cx(b), below(b, 8))
    P = 18; nb = base('rectangle', t['x'] - P, t['y'] - P, t['width'] + 2 * P, t['height'] + 2 * P, style='dashed'); d.els.append(nb)
    if side == 'right': p2 = (nb['x'] - 4, cyv(t))
    elif side == 'left': p2 = (right(nb, 4), cyv(t))
    elif side == 'above': p2 = (cx(t), below(nb, 4))
    else: p2 = (cx(t), nb['y'] - 4)
    ln = base('line', p1[0], p1[1], abs(p2[0] - p1[0]), abs(p2[1] - p1[1]), style='dashed', round={'type': 2})
    ln.update(points=[[0, 0], [p2[0] - p1[0], p2[1] - p1[1]]], lastCommittedPoint=None, startBinding=None, endBinding=None,
              startArrowhead=None, endArrowhead=None)
    d.els += [ln, t]; return nb


def zone_around(d, els, title, c, pad=60, title_right=False):
    x0, y0, x1, y1 = bbox(els)
    z = base('rectangle', x0 - pad, y0 - pad - 70, x1 - x0 + 2 * pad, y1 - y0 + 2 * pad + 70, stroke=c, style='dashed'); d.els.insert(0, z)
    t = _text(0, z['y'] + 14, title, 28); t['x'] = right(z) - t['width'] - 24 if title_right else cx(z) - t['width'] / 2
    d.els.append(t); return z


def A(d, a, b, **k): return d.arrow(a, b, color=INK, **k)


def finish(d, path, seed_base):
    """wrap, clean helper keys, write a .excalidraw file"""
    els = wrap(d.els, *d.meta)
    for e in els:
        e.pop('_grp', None)
        if e['type'] == 'text': e['strokeColor'] = INK
    D62 = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
    for i, e in enumerate(els): e['index'] = 'a' + D62[i // 62] + D62[i % 62]
    scene = {'type': 'excalidraw', 'version': 2, 'source': 'https://excalidraw.com', 'elements': els,
             'appState': {'gridSize': 20, 'viewBackgroundColor': '#ffffff'}, 'files': {}}
    json.dump(scene, open(path, 'w'), ensure_ascii=False, indent=1)
    return len(els)
