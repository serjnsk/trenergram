"""Генератор Lottie-анимаций логотипа Тренерграм.

Буквы нарисованы путями в тех же «единицах знака», что и docs/assets/logo.svg:
высота прописной 40, штрих 10, ширина Т = 34, М = 38 — поэтому Т и М
из вордмарка без подмены ложатся ровно в иконку «ТМ».

Запуск:  python3 build.py   → *.json рядом + index.html с превью.
"""
import json, math, pathlib

HERE = pathlib.Path(__file__).parent
FR = 60
ORANGE = [252/255, 82/255, 0, 1]
WHITE = [1, 1, 1, 1]
INK = [0.11, 0.12, 0.15, 1]

# ───────────── easing ─────────────
EASE = {
    'lin':  ((0, 0), (1, 1)),
    'io':   ((0.65, 0), (0.35, 1)),
    'out':  ((0.33, 1), (0.68, 1)),
    'in':   ((0.32, 0), (0.67, 0)),
    'back': ((0.34, 1.56), (0.64, 1)),
    'soft': ((0.33, 0), (0.67, 1)),
}


def val(v):
    if isinstance(v, (int, float)):
        return [v]
    if isinstance(v, dict):
        return [v]
    return list(v)


def P(v):
    """Свойство: статичное значение или список кадров [(t, v, ease), ...]."""
    if isinstance(v, list) and v and isinstance(v[0], tuple):
        ks = []
        for j, kf in enumerate(v):
            t, x = kf[0], kf[1]
            e = kf[2] if len(kf) > 2 else 'io'
            d = {'t': t, 's': val(x)}
            if j < len(v) - 1:
                if e == 'hold':
                    d['h'] = 1
                else:
                    (ox, oy), (ix, iy) = EASE[e]
                    d['o'] = {'x': [ox], 'y': [oy]}
                    d['i'] = {'x': [ix], 'y': [iy]}
            ks.append(d)
        return {'a': 1, 'k': ks}
    return {'a': 0, 'k': v}


def shape(verts, closed=True, ins=None, outs=None):
    n = len(verts)
    return {'i': ins or [[0, 0]] * n, 'o': outs or [[0, 0]] * n,
            'v': [list(map(float, p)) for p in verts], 'c': closed}


def sh(s):  # путь (статичный shape или кадры)
    return {'ty': 'sh', 'ks': P(s)}


def fill(c=ORANGE, rule=2):
    return {'ty': 'fl', 'c': P(c), 'o': P(100), 'r': rule}


def stroke(c=ORANGE, w=10):
    return {'ty': 'st', 'c': P(c), 'o': P(100), 'w': P(w), 'lc': 2, 'lj': 2, 'ml': 4}


def trim(s=0, e=100):
    return {'ty': 'tm', 's': P(s), 'e': P(e), 'o': P(0), 'm': 1}


def rect(cx, cy, w, h, r=0):
    return {'ty': 'rc', 'p': P([cx, cy]), 's': P([w, h]), 'r': P(r), 'd': 1}


def ellipse(cx, cy, w, h):
    return {'ty': 'el', 'p': P([cx, cy]), 's': P([w, h]), 'd': 1}


def group(items, p=(0, 0), a=(0, 0), s=(100, 100), r=0, o=100):
    tr = {'ty': 'tr', 'p': P(p if isinstance(p, list) else list(p)),
          'a': P(list(a)), 's': P(s if isinstance(s, list) else list(s)),
          'r': P(r), 'o': P(o), 'sk': P(0), 'sa': P(0)}
    return {'ty': 'gr', 'it': items + [tr]}


def s2(v):
    """Масштаб: число → [v, v]; кадры с числами → кадры с парами."""
    if isinstance(v, list) and v and isinstance(v[0], tuple):
        return [(k[0], [k[1], k[1]] if isinstance(k[1], (int, float)) else k[1], *k[2:]) for k in v]
    return [v, v] if isinstance(v, (int, float)) else v


def layer(name, shapes, p, a=(0, 0), s=100, r=0, o=100, parent=None, null=False):
    def three(v, z=0):
        if isinstance(v, list) and v and isinstance(v[0], tuple):
            return [(k[0], list(k[1]) + [z], *k[2:]) for k in v]
        return list(v) + [z]
    sc = s2(s)
    if isinstance(sc, list) and sc and isinstance(sc[0], tuple):
        sc = [(k[0], list(k[1]) + [100], *k[2:]) for k in sc]
    else:
        sc = list(sc) + [100]
    L = {'ddd': 0, 'ty': 3 if null else 4, 'nm': name, 'sr': 1,
         'ks': {'o': P(o), 'r': P(r), 'p': P(three(p)), 'a': P(three(list(a))), 's': P(sc)},
         'ao': 0, 'st': 0, 'bm': 0}
    if not null:
        L['shapes'] = shapes
    if parent is not None:
        L['parent'] = parent
    return L


def comp(name, op, layers, w=512, h=512):
    # первый слой в массиве — верхний
    for i, L in enumerate(layers):
        L['ind'] = L.get('ind', i + 1)
        L['ip'], L['op'] = 0, op
    return {'v': '5.7.4', 'fr': FR, 'ip': 0, 'op': op, 'w': w, 'h': h,
            'nm': name, 'ddd': 0, 'assets': [], 'layers': layers}


# ───────────── буквы (единицы знака, y вниз, 0..40) ─────────────
W = {'Т': 34, 'Р': 30, 'Е': 26, 'Н': 32, 'Г': 26, 'А': 36, 'М': 38}


def T_shape(a=0, b=0):
    """a — срез 45° сверху-слева (вордмарк), b — срез низа ножки (знак)."""
    return shape([(0, a), (a, 0), (34, 0), (34, 10), (22, 10), (22, 40 - b),
                  (22 - b, 40), (12, 40), (12, 10), (0, 10)])


def M_shape(d=0):
    """d — срез 45° снизу-справа (вордмарк)."""
    return shape([(0, 0), (10, 0), (19, 18), (28, 0), (38, 0), (38, 40 - d), (38 - d, 40),
                  (29, 40), (29, 17), (21, 32), (17, 32), (9, 17), (9, 40), (0, 40)])


GLYPH = {
    'Р': [[(0, 0), (24, 0), (30, 6), (30, 20), (24, 26), (10, 26), (10, 40), (0, 40)],
          [(10, 8), (20, 8), (20, 18), (10, 18)]],
    'Е': [[(0, 0), (26, 0), (26, 9), (10, 9), (10, 15.5), (23, 15.5), (23, 24.5), (10, 24.5),
           (10, 31), (26, 31), (26, 40), (0, 40)]],
    'Н': [[(0, 0), (10, 0), (10, 15), (22, 15), (22, 0), (32, 0), (32, 40), (22, 40), (22, 25),
           (10, 25), (10, 40), (0, 40)]],
    'Г': [[(0, 0), (26, 0), (26, 9), (10, 9), (10, 40), (0, 40)]],
    'А': [[(11, 0), (25, 0), (36, 40), (26, 40), (24, 32), (12, 32), (10, 40), (0, 40)],
          [(14.5, 24), (21.5, 24), (18, 11)]],
}


def glyph_items(ch, color=ORANGE):
    if ch == 'Т':
        return [sh(T_shape(b=6)), fill(color)]
    if ch == 'М':
        return [sh(M_shape()), fill(color)]
    return [sh(shape(c)) for c in GLYPH[ch]] + [fill(color)]


# Знак из logo.svg в координатах коробки 100×100
MARK_T = shape([(12, 32), (46, 32), (46, 42), (34, 42), (34, 66), (28, 72), (24, 72), (24, 42), (12, 42)])
MARK_M = shape([(52, 32), (62, 32), (71, 50), (80, 32), (90, 32), (90, 72), (81, 72), (81, 49),
                (73, 64), (69, 64), (61, 49), (61, 72), (52, 72)])


def mark_items(bg=ORANGE, fg=WHITE):
    return [group([sh(MARK_T), sh(MARK_M), fill(fg)]),
            group([rect(50, 50, 100, 100, 22.5), fill(bg)])]


# ═════════════ 1. Схлопывание ТРЕНЕРГРАМ → ТМ ═════════════
def anim_collapse():
    op = 240
    word = 'ТРЕНЕРГРАМ'
    k1, k2 = 130, 260            # масштаб вордмарка и знака, %
    offs, x = [], 0
    for ch in word:
        offs.append(x); x += W[ch] + 4
    total = x - 4
    x0 = 256 - total * k1 / 200
    cx = [x0 + (o + W[c] / 2) * k1 / 100 for o, c in zip(offs, word)]
    mark_l = 256 - 78 * k2 / 200
    tx, mx = mark_l + 17 * k2 / 100, mark_l + 59 * k2 / 100
    cut = 6

    col = [(59, ORANGE, 'soft'), (68, WHITE, 'hold'), (150, WHITE, 'soft'), (162, ORANGE)]
    layers = []
    # Т
    layers.append(layer('Т', [sh([(40, T_shape(a=cut), 'io'), (75, T_shape(b=6), 'hold'),
                                  (160, T_shape(b=6), 'io'), (195, T_shape(a=cut))]), fill(col)],
                        p=[(40, [cx[0], 256], 'io'), (75, [tx, 256], 'hold'),
                           (160, [tx, 256], 'io'), (195, [cx[0], 256])],
                        a=(17, 20),
                        s=[(40, k1, 'io'), (75, k2, 'hold'), (160, k2, 'io'), (195, k1)]))
    layers.append(layer('М', [sh([(40, M_shape(cut), 'io'), (75, M_shape(0), 'hold'),
                                  (160, M_shape(0), 'io'), (195, M_shape(cut))]), fill(col)],
                        p=[(40, [cx[-1], 256], 'io'), (75, [mx, 256], 'hold'),
                           (160, [mx, 256], 'io'), (195, [cx[-1], 256])],
                        a=(19, 20),
                        s=[(40, k1, 'io'), (75, k2, 'hold'), (160, k2, 'io'), (195, k1)]))
    # середина слова — исчезает от краёв к центру: Т и М «съедают» буквы на ходу
    for i in range(1, 9):
        d = int(abs(i - 4.5))
        t0, t1 = 30 + (3 - d) * 6, 168 + d * 5
        layers.append(layer(word[i], glyph_items(word[i]),
                            p=[(t0, [cx[i], 256], 'in'), (t0 + 18, [cx[i], 266], 'hold'),
                               (t1, [cx[i], 246], 'out'), (t1 + 22, [cx[i], 256])],
                            a=(W[word[i]] / 2, 20),
                            s=[(t0, k1, 'in'), (t0 + 18, 0, 'hold'), (t1, 0, 'back'), (t1 + 22, k1)]))
    # плашка знака
    layers.append(layer('плашка', [rect(50, 50, 100, 100, 22.5), fill(ORANGE)],
                        p=[256 - k2 / 100, 256 - 2 * k2 / 100], a=(50, 50),
                        r=[(60, -12, 'back'), (82, 0)],
                        o=[(150, 100, 'soft'), (162, 0, 'hold'), (238, 0), (239, 100)],
                        s=[(60, 0, 'back'), (82, k2, 'hold'), (150, k2, 'out'), (162, k2 * 1.18, 'hold'),
                           (238, k2 * 1.18), (239, 0)]))
    return comp('1 · Схлопывание', op, layers)


# ═════════════ 2. Бицепс ═════════════
def arm_path(sx, elbow, hand):
    return shape([sx, elbow, hand], closed=False)


def anim_biceps():
    op = 200
    K = 170
    cx, bottom = 256, 360
    mark = layer('знак', mark_items(), p=[cx, bottom], a=(50, 100),
                 s=[(0, [K, K], 'hold'), (40, [K, K], 'out'), (48, [K * 1.07, K * .9], 'back'),
                    (64, [K, K], 'hold'), (140, [K, K])])
    layers = [mark]
    for side in (-1, 1):
        X = lambda x: 256 + side * (256 - x)
        sh_ = (X(184), 292)
        straight = arm_path(sh_, (X(102), 292), (X(26), 292))
        flexed = arm_path(sh_, (X(100), 300), (X(96), 224))
        fist_kf_pos = [(40, [X(26), 292], 'back'), (58, [X(96), 224], 'hold'),
                       (140, [X(96), 224], 'io'), (156, [X(26), 292])]
        layers.append(layer('кулак', [ellipse(0, 0, 50, 50), fill(ORANGE)], p=fist_kf_pos,
                            s=[(28, 0, 'back'), (38, 100, 'hold'), (156, 100, 'in'), (164, 0)]))
        bx, by = X(142), 276
        layers.append(layer('бицепс', [ellipse(0, 0, 62, 46), fill(ORANGE)], p=[bx, by],
                            r=side * -10,
                            s=[(50, 0, 'back'), (62, 100, 'out'), (74, 100, 'back'), (80, 120, 'out'),
                               (90, 100, 'out'), (98, 100, 'back'), (104, 124, 'out'), (116, 100, 'hold'),
                               (140, 100, 'in'), (150, 0)]))
        sparks = []
        for ang in ((-170, -100, -68) if side < 0 else (-10, -80, -112)):
            a = math.radians(ang)
            r1, r2 = 44, 66
            sparks.append(sh(shape([(bx + r1 * math.cos(a), by - 4 + r1 * math.sin(a)),
                                    (bx + r2 * math.cos(a), by - 4 + r2 * math.sin(a))], closed=False)))
        layers.append(layer('искры', sparks + [
            trim(s=[(66, 0, 'out'), (90, 100, 'hold'), (100, 0, 'out'), (124, 100)],
                 e=[(62, 0, 'out'), (80, 100, 'hold'), (96, 0, 'out'), (114, 100)]),
            stroke(INK, 7)], p=[0, 0]))
        layers.append(layer('рука', [sh([(40, straight, 'back'), (58, flexed, 'hold'),
                                         (140, flexed, 'io'), (156, straight)]),
                                     trim(e=[(15, 0, 'out'), (34, 100, 'hold'), (156, 100, 'in'), (174, 0)]),
                                     stroke(ORANGE, 32)], p=[0, 0]))
    # первый слой — верхний: знак, искры, кулаки, бицепсы, руки
    by = lambda n: [l for l in layers[1:] if l['nm'] == n]
    order = [layers[0]] + by('искры') + by('кулак') + by('бицепс') + by('рука')
    return comp('2 · Бицепс', op, order)


# ═════════════ 3. Штанга: перекладина Т — гриф ═════════════
def anim_barbell():
    op = 230
    k = 4
    left, top = 256 - 78 * k / 2, 220
    base = top + 40 * k              # 380
    bar_cx = left + 17 * k           # 168
    rest = top + 5 * k               # центр перекладины в покое 240
    # траектория грифа (y центра) — от неё считаем растяжение ножки
    path = [(20, rest, 'io'), (32, rest + 18, 'back'), (50, 170, 'out'),
            (56, 170, 'out'), (62, 184, 'back'), (72, 170, 'io'),
            (92, 170, 'io'), (104, 200, 'io'), (116, 166, 'io'), (130, 200, 'io'), (142, 166, 'hold'),
            (156, 166, 'in'), (172, rest + 10, 'back'), (184, rest, 'lin')]
    stem_h = 30 * k

    def stem_scale(y):
        return 100 * (base - (y + 5 * k)) / stem_h

    layers = []
    # блины (тёмные, падают сверху)
    for side in (-1, 1):
        ex = bar_cx + side * (17 * k * 1.5 - 14)
        drop = [(44, -80, 'in'), (56, 170, 'out'), (62, 184, 'back'), (72, 170, 'io'),
                (92, 170, 'io'), (104, 200, 'io'), (116, 166, 'io'), (130, 200, 'io'), (142, 166, 'out'), (143, 166, 'lin')]
        layers.append(layer('блин', [rect(0, 0, 26, 92, 7), fill(INK)],
                            p=[(t, [ex, y], e) for t, y, e in drop] +
                              [(156, [ex + side * 160, 120], 'hold'), (157, [ex, -80])],
                            r=[(142, 0, 'in'), (156, side * 50, 'hold'), (157, 0)]))
        layers.append(layer('блин2', [rect(0, 0, 14, 66, 5), fill(INK)],
                            p=[(t, [ex - side * 22, y], e) for t, y, e in drop] +
                              [(156, [ex - side * 22 + side * 150, 140], 'hold'), (157, [ex - side * 22, -80])],
                            r=[(142, 0, 'in'), (156, side * 40, 'hold'), (157, 0)]))
    # гриф = перекладина Т
    layers.append(layer('перекладина', [rect(17, 5, 34, 10), fill(ORANGE)],
                        p=[(t, [bar_cx, y], e) for t, y, e in path], a=(17, 5),
                        s=[(32, [k * 100, k * 100], 'back'), (48, [k * 150, k * 100], 'hold'),
                           (150, [k * 150, k * 100], 'io'), (170, [k * 100, k * 100])]))
    # ножка Т — тянется за грифом
    layers.append(layer('ножка', [sh(shape([(12, 10), (22, 10), (22, 34), (16, 40), (12, 40)])), fill(ORANGE)],
                        p=[bar_cx, base], a=(17, 40),
                        s=[(t, [k * 100, k * stem_scale(y)], e) for t, y, e in path]))
    # М болеет: приседает вместе со всеми и подпрыгивает от радости
    mx = left + 59 * k
    mx2 = mx + 34                    # М уступает место правому блину
    layers.append(layer('М', [sh(M_shape()), fill(ORANGE)],
                        p=[(30, [mx, base], 'io'), (46, [mx2, base], 'hold'),
                           (70, [mx2, base], 'out'), (80, [mx2, base - 36], 'in'), (90, [mx2, base], 'hold'),
                           (158, [mx2, base], 'io'), (174, [mx, base], 'hold'),
                           (184, [mx, base], 'out'), (194, [mx, base - 24], 'in'), (204, [mx, base])],
                        a=(19, 40),
                        s=[(20, [k * 100, k * 100], 'io'), (32, [k * 106, k * 88], 'back'), (46, [k * 100, k * 100], 'hold'),
                           (88, [k * 100, k * 100], 'out'), (92, [k * 108, k * 90], 'back'), (102, [k * 100, k * 100])]))
    return comp('3 · Штанга', op, layers)


# ═════════════ 4. Пульс → М ═════════════
def anim_pulse():
    op = 230
    k = 3.2
    left, top = 256 - 78 * k / 2, 192
    bottom = top + 40 * k
    lx, rx, vx = left + 45 * k, left + 73.5 * k, left + 59 * k
    ecg = shape([(-10, bottom), (120, bottom), (138, bottom - 18), (156, bottom), (176, bottom),
                 (188, bottom + 22), (200, bottom), (lx, bottom), (lx, top + 6), (vx, top + 25 * k),
                 (rx, top + 6), (rx, bottom), (430, bottom), (522, bottom)], closed=False)
    null = layer('сердце', [], p=[256, 256], a=(256, 256), null=True,
                 s=[(104, 100, 'out'), (110, 112, 'in'), (117, 100, 'out'), (122, 106, 'in'), (132, 100, 'hold'),
                    (146, 100, 'out'), (152, 112, 'in'), (159, 100, 'out'), (164, 106, 'in'), (174, 100, 'hold'),
                    (196, 100, 'back'), (214, 0)])
    null['ind'] = 10
    layers = [
        layer('Т', [sh(T_shape(b=6)), fill(ORANGE)],
              p=[(70, [left + 17 * k, -120], 'in'), (88, [left + 17 * k, top + 20 * k], 'back'),
                 (100, [left + 17 * k, top + 20 * k])],
              a=(17, 20), s=[(86, [k * 100, k * 100], 'out'), (90, [k * 110, k * 86], 'out'), (100, [k * 100, k * 100])],
              parent=10),
        layer('М', [sh(M_shape()), fill(ORANGE)], p=[left + 59 * k, bottom], a=(19, 40),
              o=[(52, 0, 'out'), (60, 100)],
              s=[(52, [k * 60, k * 60], 'back'), (66, [k * 100, k * 100])], parent=10),
        layer('кардиограмма', [sh(ecg), trim(s=[(30, 0, 'soft'), (92, 100)], e=[(6, 0, 'soft'), (66, 100)]),
                               stroke(ORANGE, 10)], p=[0, 0]),
        null,
    ]
    return comp('4 · Пульс', op, layers)


# ═════════════ 5. Скакалка (лоадер) ═════════════
def anim_rope():
    cyc, n = 44, 3
    op = cyc * n
    K = 170
    ground = 360
    hand = [(-14, 62), (114, 62)]

    def rope(c):
        L, R = hand
        return shape([L, R], closed=False,
                     outs=[[(50 - L[0]) * .9, c - L[1]], [0, 0]],
                     ins=[[0, 0], [(50 - R[0]) * .9, c - R[1]]])

    rope_kf, hop, sq, shad = [], [], [], []
    for i in range(n):
        t = i * cyc
        rope_kf += [(t, rope(-95), 'soft'), (t + cyc // 2, rope(150), 'soft')]
        hop += [(t + 12, [256, ground], 'out'), (t + 22, [256, ground - 56], 'in'), (t + 32, [256, ground], 'hold')]
        sq += [(t, [K, K], 'soft'), (t + 8, [K * 1.04, K * .92], 'out'), (t + 14, [K * .96, K * 1.06], 'soft'),
               (t + 22, [K, K], 'soft'), (t + 32, [K * 1.08, K * .9], 'back')]
        shad += [(t + 12, 100, 'out'), (t + 22, 62, 'in'), (t + 32, 100, 'hold')]
    rope_kf.append((op, rope(-95)))
    hop.append((op, [256, ground]))
    sq.append((op, [K, K]))
    shad.append((op, 100))
    layers = [
        layer('знак', mark_items(), p=hop, a=(50, 100), s=sq),
        layer('ручки', [ellipse(hand[0][0], hand[0][1], 9, 9), ellipse(hand[1][0], hand[1][1], 9, 9), fill(INK)],
              p=[0, 0], parent=1),
        layer('скакалка', [sh(rope_kf), stroke(INK, 2.4)], p=[0, 0], parent=1),
        layer('тень', [ellipse(0, 0, 150, 16), {**fill(INK), 'o': P(14)}], p=[256, ground + 14], s=shad),
    ]
    layers[0]['ind'] = 1
    for i, L in enumerate(layers[1:], 2):
        L['ind'] = i
    return comp('5 · Скакалка', op, layers)


ANIMS = [
    ('collapse', anim_collapse, 'Схлопывание',
     'ТРЕНЕРГРАМ сжимается от центра: средние буквы проваливаются, Т и М съезжаются, срезы 45° перетекают в срез ножки, под ними вырастает плашка — получается иконка. Потом обратно.',
     'Заставка, онбординг, переход «сайт → приложение»'),
    ('biceps', anim_biceps, 'Бицепс',
     'У знака ТМ из-за плашки вырастают руки, сгибаются и дважды «качают» бицепс с искрами. Плашка приседает от напряжения.',
     'Успех: тренировка завершена, рекорд, пустые состояния'),
    ('barbell', anim_barbell, 'Перекладина Т — это гриф',
     'Перекладина Т отрывается и становится грифом, ножка тянется как руки. Сверху падают блины, гриф проседает, два повтора. М рядом приседает и подпрыгивает за компанию.',
     'Загрузка программы, «добавить вес», промо'),
    ('pulse', anim_pulse, 'Пульс',
     'Линия кардиограммы бежит по экрану, а главный пик рисует М. За ним с отскоком падает Т, знак дважды бьётся «тук-тук» и уходит.',
     'Сплэш, экран статистики, уведомление о сердечном ритме'),
    ('rope', anim_rope, 'Скакалка',
     'Знак прыгает через скакалку: сжимается перед прыжком, тянется в полёте, тень уменьшается. Цикл бесшовный — это лоадер.',
     'Индикатор загрузки, ожидание синхронизации'),
]


HIDDEN = {'pulse'}   # «Пульс» не понравился — на странице не показываем


def main():
    data = {}
    for key, fn, *_ in [a for a in ANIMS if a[0] not in HIDDEN]:
        j = fn()
        (HERE / f'trenergram-{key}.json').write_text(json.dumps(j, ensure_ascii=False, separators=(',', ':')))
        data[key] = j
    meta = [{'key': k, 'title': t, 'desc': d, 'use': u,
             'dur': round(data[k]['op'] / FR, 1)} for k, _, t, d, u in ANIMS if k not in HIDDEN]
    tpl = (HERE / 'index.template.html').read_text()
    html = tpl.replace('/*DATA*/null', json.dumps(data, ensure_ascii=False, separators=(',', ':'))) \
              .replace('/*META*/null', json.dumps(meta, ensure_ascii=False))
    (HERE / 'index.html').write_text(html)
    print('ok', {k: data[k]['op'] for k in data})


# ───────────── стикеры Telegram (.tgs) ─────────────
# Требования Telegram: 512×512, 60 fps, не длиннее 3 с, gzip ≤ 64 КБ, поле "tgs": 1.
# Фон чата бывает и светлым, и тёмным: почти чёрные детали (блины, скакалка,
# искры) на тёмной теме пропадают, поэтому в стикерах они серые, «металл».
STICKER_INK = [0.56, 0.59, 0.64, 1]
STICKERS = ['collapse', 'biceps', 'barbell', 'rope']


def retime(node, f):
    """Сжимает время анимации в f раз (все кадры t, ip/op слоёв и композиции)."""
    if isinstance(node, dict):
        for key in ('t', 'ip', 'op'):
            if isinstance(node.get(key), (int, float)):
                node[key] = round(node[key] * f, 3)
        for v in node.values():
            retime(v, f)
    elif isinstance(node, list):
        for v in node:
            retime(v, f)


def make_stickers():
    import gzip
    global INK
    ink, INK = INK, STICKER_INK
    out = HERE / 'stickers'
    out.mkdir(exist_ok=True)
    try:
        for key, fn, *_ in ANIMS:
            if key not in STICKERS:
                continue
            j = fn()
            if j['op'] > 3 * FR:
                retime(j, 3 * FR / j['op'])
                j['op'] = 3 * FR
                for L in j['layers']:
                    L['op'] = 3 * FR
            j['tgs'] = 1
            raw = json.dumps(j, ensure_ascii=False, separators=(',', ':')).encode()
            gz = gzip.compress(raw, 9, mtime=0)
            (out / f'trenergram-{key}.tgs').write_bytes(gz)
            print(f'{key}.tgs  {j["op"] / FR:.2f} с  {len(gz) / 1024:.1f} КБ', '' if len(gz) <= 65536 else '!! > 64 КБ')
    finally:
        INK = ink


if __name__ == '__main__':
    main()
    make_stickers()
