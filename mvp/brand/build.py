"""Генератор файлов брендбука Тренерграм.

Логотип-слово в кабинете и на лендинге — живой текст: Montserrat 900,
капс, трекинг −0.035em, line-height 1 и clip-path, который срезает
по 7/22 em у левого верхнего и правого нижнего угла строки. Партнёрам
нужен файл без шрифта, поэтому здесь та же геометрия переведена в кривые.
Т и М в Montserrat Black — чистые многоугольники, срез вырезается прямо
в контуре (Сазерленд — Ходжмен по выпуклому шестиугольнику клипа).

Знак ТМ — пути из docs/assets/logo.svg (ветка main), без шрифта.

Запуск:  python3 build.py
  → logo/*.svg, logo/*.png (рендер через Chrome), animation/* из ../mvp/logo-lottie,
    trenergram-brand.zip со всем сразу.
Шрифт скачивается в .cache/ при первом запуске (нужен fontTools).
"""
import pathlib, shutil, subprocess, tempfile, urllib.request, zipfile

HERE = pathlib.Path(__file__).parent
CACHE = HERE / '.cache'
LOGO = HERE / 'logo'
ANIM = HERE / 'animation'
LOTTIE = HERE.parent / 'logo-lottie'
CHROME = '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
FONT_URL = 'https://github.com/google/fonts/raw/main/ofl/montserrat/Montserrat%5Bwght%5D.ttf'

ORANGE, INK, WHITE = '#FC5200', '#141414', '#FFFFFF'
WORD = 'ТРЕНЕРГРАМ'
TRACK = -35            # letter-spacing −0.035em в единицах шрифта (UPM 1000)
CUT = 1000 * 7 / 22    # срез clip-path: 7px при кегле 22px


# ───────────── шрифт ─────────────
def black_font():
    from fontTools.ttLib import TTFont
    from fontTools.varLib import instancer
    CACHE.mkdir(exist_ok=True)
    src, out = CACHE / 'Montserrat.ttf', CACHE / 'Montserrat-Black.ttf'
    if not out.exists():
        if not src.exists():
            urllib.request.urlretrieve(FONT_URL, src)
        instancer.instantiateVariableFont(TTFont(src), {'wght': 900}).save(out)
    return TTFont(out)


def kern_table(font):
    """Парный кернинг из GPOS (фича kern) — Chrome применяет его и при трекинге."""
    gpos = font['GPOS'].table
    idx = {i for fr in gpos.FeatureList.FeatureRecord if fr.FeatureTag == 'kern'
           for i in fr.Feature.LookupListIndex}
    pairs = {}
    for li in sorted(idx):
        lk = gpos.LookupList.Lookup[li]
        for st in lk.SubTable:
            if lk.LookupType == 9:
                st = st.ExtSubTable
            if getattr(st, 'Format', None) == 1 and hasattr(st, 'PairSet'):
                for g1, ps in zip(st.Coverage.glyphs, st.PairSet):
                    for r in ps.PairValueRecord:
                        v = getattr(r.Value1, 'XAdvance', 0) or 0
                        pairs.setdefault((g1, r.SecondGlyph), v)
            elif getattr(st, 'Format', None) == 2:
                c1, c2 = st.ClassDef1.classDefs, st.ClassDef2.classDefs
                for g1 in st.Coverage.glyphs:
                    rec = st.Class1Record[c1.get(g1, 0)]
                    for g2 in font.getGlyphOrder():
                        v = getattr(rec.Class2Record[c2.get(g2, 0)].Value1, 'XAdvance', 0) or 0
                        if v:
                            pairs.setdefault((g1, g2), v)
    return pairs


# ───────────── геометрия ─────────────
def clip_poly(subject, clip):
    """Сазерленд — Ходжмен: subject — любой многоугольник, clip — выпуклый, против часовой."""
    def inside(p, a, b):
        return (b[0] - a[0]) * (p[1] - a[1]) - (b[1] - a[1]) * (p[0] - a[0]) >= 0

    def cross(p, q, a, b):
        x1, y1, x2, y2, x3, y3, x4, y4 = *p, *q, *a, *b
        d = (x1 - x2) * (y3 - y4) - (y1 - y2) * (x3 - x4)
        t = ((x1 - x3) * (y3 - y4) - (y1 - y3) * (x3 - x4)) / d
        return (x1 + t * (x2 - x1), y1 + t * (y2 - y1))

    out = subject
    for a, b in zip(clip, clip[1:] + clip[:1]):
        inp, out = out, []
        for i, q in enumerate(inp):
            p = inp[i - 1]
            if inside(q, a, b):
                if not inside(p, a, b):
                    out.append(cross(p, q, a, b))
                out.append(q)
            elif inside(p, a, b):
                out.append(cross(p, q, a, b))
    return out


def contours(glyphset, name):
    from fontTools.pens.recordingPen import RecordingPen, DecomposingRecordingPen
    pen = DecomposingRecordingPen(glyphset)
    glyphset[name].draw(pen)
    return pen.value


def path_d(ops, dx, clip=None):
    """Контуры глифа → d в системе SVG (y вниз, базовая линия y=0)."""
    from fontTools.pens.svgPathPen import SVGPathPen
    from fontTools.pens.transformPen import TransformPen
    if clip:
        polys, cur = [], []
        for op, args in ops:
            if op in ('moveTo', 'lineTo'):
                cur.append(args[0])
            elif op == 'closePath':
                polys.append(cur); cur = []
            else:
                raise ValueError(f'кривая в клипуемом глифе: {op}')
        d = []
        for poly in polys:
            pts = [(x + dx, -y) for x, y in poly]
            pts = clip_poly(pts, clip)
            if len(pts) >= 3:
                d.append('M' + 'L'.join(f'{x:.1f} {y:.1f}' for x, y in pts) + 'Z')
        return ''.join(d)
    pen = SVGPathPen(None, ntos=lambda v: f'{v:.1f}'.rstrip('0').rstrip('.'))
    tp = TransformPen(pen, (1, 0, 0, -1, dx, 0))
    for op, args in ops:
        getattr(tp, op)(*args)
    return pen.getCommands()


def wordmark_paths():
    font = black_font()
    gs, cmap = font.getGlyphSet(), font.getBestCmap()
    kern = kern_table(font)
    asc, desc = font['hhea'].ascent, -font['hhea'].descent
    half = (1000 - (asc + desc)) / 2
    top, bot = -(asc + half), desc + half          # строка line-height:1 относительно базовой линии
    names = [cmap[ord(c)] for c in WORD]
    xs, x = [], 0
    for i, n in enumerate(names):
        xs.append(x)
        x += gs[n].width + TRACK + (kern.get((n, names[i + 1]), 0) if i + 1 < len(names) else 0)
    right = x                                      # ширина бокса с хвостовым трекингом, как в Chrome
    # clip-path: polygon(c 0, 100% 0, 100% calc(100% - c), calc(100% - c) 100%, 0 100%, 0 c)
    # обход по часовой на экране (y вниз) — в формуле inside() это «внутри слева»
    clip = [(CUT, top), (right, top), (right, bot - CUT), (right - CUT, bot), (0, bot), (0, top + CUT)]
    parts = []
    for i, (n, ch) in enumerate(zip(names, WORD)):
        edge = i in (0, len(WORD) - 1)
        parts.append((ch, path_d(contours(gs, n), xs[i], clip if edge else None), edge))
    # габарит краски: от верхней кромки прописной до базовой линии
    cap = font['OS/2'].sCapHeight
    from fontTools.pens.boundsPen import BoundsPen
    bp0, bp1 = BoundsPen(gs), BoundsPen(gs)
    gs[names[0]].draw(bp0); gs[names[-1]].draw(bp1)
    x0 = xs[0] + bp0.bounds[0]
    x1 = xs[-1] + bp1.bounds[2]
    return parts, (x0, -cap, x1 - x0, cap)


def wordmark_svg(parts, box, base, accent, pad=0):
    x, y, w, h = box
    vb = f'{x - pad:.1f} {y - pad:.1f} {w + 2 * pad:.1f} {h + 2 * pad:.1f}'
    a = ''.join(p for _, p, acc in parts if acc)
    b = ''.join(p for _, p, acc in parts if not acc)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}" role="img" aria-label="Тренерграм">'
            f'<path fill="{base}" d="{b}"/><path fill="{accent}" d="{a}"/></svg>\n')


MARK_T = 'M12 32H46V42H34V66L28 72H24V42H12Z'
MARK_M = 'M52 32H62L71 50L80 32H90V72H81V49L73 64H69L61 49V72H52Z'


def mark_svg(bg, fg, rx=22.5, tight=False):
    if tight:   # буквы без плашки: поле по 4 единицы вокруг ТМ
        return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="8 28 86 48" role="img" aria-label="Тренерграм">'
                f'<path fill="{fg}" d="{MARK_T}"/><path fill="{fg}" d="{MARK_M}"/></svg>\n')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100" role="img" aria-label="Тренерграм">'
            f'<rect width="100" height="100" rx="{rx}" fill="{bg}"/>'
            f'<path fill="{fg}" d="{MARK_T}"/><path fill="{fg}" d="{MARK_M}"/></svg>\n')


# ───────────── PNG через Chrome ─────────────
def render_png(svg_path, png_path, w, h):
    html = (f'<!doctype html><html><head><style>html,body{{margin:0;background:transparent}}'
            f'img{{display:block;width:{w}px;height:{h}px}}</style></head>'
            f'<body><img src="{svg_path.resolve().as_uri()}"></body></html>')
    with tempfile.TemporaryDirectory() as td:
        page = pathlib.Path(td) / 'p.html'
        page.write_text(html)
        subprocess.run([CHROME, '--headless=new', '--hide-scrollbars', '--force-device-scale-factor=1',
                        '--default-background-color=00000000', f'--window-size={w},{h}',
                        f'--screenshot={png_path.resolve()}', page.as_uri()],
                       check=True, capture_output=True)


def main():
    LOGO.mkdir(exist_ok=True)
    ANIM.mkdir(exist_ok=True)
    parts, box = wordmark_paths()
    pad = 0   # файлы без поля: охранное поле — по правилам брендбука
    words = {
        'trenergram-logo':             (INK, ORANGE),
        'trenergram-logo-on-dark':     (WHITE, ORANGE),
        'trenergram-logo-white':       (WHITE, WHITE),
        'trenergram-logo-black':       (INK, INK),
    }
    for name, (base, acc) in words.items():
        (LOGO / f'{name}.svg').write_text(wordmark_svg(parts, box, base, acc, pad))
    marks = {
        'trenergram-mark':             mark_svg(ORANGE, WHITE),
        'trenergram-mark-dark':        mark_svg(INK, ORANGE),
        'trenergram-avatar':           mark_svg(ORANGE, WHITE, rx=0),
        'trenergram-mark-letters':     mark_svg(None, ORANGE, tight=True),
        'trenergram-mark-letters-white': mark_svg(None, WHITE, tight=True),
    }
    for name, svg in marks.items():
        (LOGO / f'{name}.svg').write_text(svg)

    W = 2400
    H = round(W * box[3] / box[2])
    for name in words:
        render_png(LOGO / f'{name}.svg', LOGO / f'{name}.png', W, H)
    for name in marks:
        if 'letters' in name:
            render_png(LOGO / f'{name}.svg', LOGO / f'{name}.png', 1032, 576)
        else:
            render_png(LOGO / f'{name}.svg', LOGO / f'{name}.png', 1024, 1024)

    # анимации: Lottie JSON и стикеры из генератора прототипа, видео — рендеры тех же анимаций
    for key in ('collapse', 'biceps', 'barbell', 'rope'):
        shutil.copy(LOTTIE / f'trenergram-{key}.json', ANIM / f'trenergram-{key}.json')
        shutil.copy(LOTTIE / 'stickers' / f'trenergram-{key}.tgs', ANIM / f'trenergram-{key}.tgs')
    video = {'1-shlopyvanie': 'trenergram-collapse', '2-biceps': 'trenergram-biceps',
             '3-shtanga': 'trenergram-barbell', '4-skakalka': 'trenergram-rope',
             'avatar-shtanga': 'trenergram-avatar-barbell', 'avatar-skakalka': 'trenergram-avatar-rope'}
    for src, dst in video.items():
        f = LOTTIE / 'video' / f'{src}.mp4'
        if f.exists():
            shutil.copy(f, ANIM / f'{dst}.mp4')

    with zipfile.ZipFile(HERE / 'trenergram-brand.zip', 'w', zipfile.ZIP_DEFLATED) as z:
        for d in (LOGO, ANIM):
            for f in sorted(d.iterdir()):
                z.write(f, f'trenergram-brand/{d.name}/{f.name}')
    print('ok', box)


if __name__ == '__main__':
    main()
