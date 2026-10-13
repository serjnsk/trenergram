"""Обложки «Актуального» (Highlights) Instagram — 9 иконок в трёх паках.

Instagram показывает обложку кругом из центра квадрата, поэтому файлы —
квадрат 1080×1080 с фоном во весь кадр, иконка ~36 % стороны по центру.
Иконки линейные на сетке 24, штрих 2, скругления — в духе иконок кабинета.
AI — те же три искры, что у кнопки ИИ в кабинете (AIMARK).

Запуск:  python3 highlights.py  (или из build.py)  → highlights/<пак>/*.svg|png
"""
import pathlib

HERE = pathlib.Path(__file__).parent
OUT = HERE / 'highlights'
SIZE = 1080
ICON = 0.36          # доля стороны под иконку 24×24

ORANGE, INK, WHITE, WARM = '#FC5200', '#141414', '#FFFFFF', '#F7F3EF'

# Каждая иконка — список (svg-элемент, акцент?, заливка?).
# Акцентные элементы в паке «Светлый» красятся оранжевым, остальное — тёмным.
ICONS = [
    ('features', 'Возможности', [
        ('<rect x="3.5" y="3.5" width="7" height="7" rx="1.8"/>', True, False),
        ('<rect x="13.5" y="3.5" width="7" height="7" rx="1.8"/>', False, False),
        ('<rect x="3.5" y="13.5" width="7" height="7" rx="1.8"/>', False, False),
        ('<rect x="13.5" y="13.5" width="7" height="7" rx="1.8"/>', False, False),
    ]),
    ('how-it-works', 'Как работает', [
        ('<circle cx="12" cy="12" r="9"/>', False, False),
        ('<path d="M10.2 8.6v6.8l5.3-3.4z"/>', True, True),
    ]),
    ('for-trainer', 'Для тренера', [
        ('<circle cx="12" cy="7.8" r="3.8"/>', True, False),
        ('<path d="M4.5 20.5v-.8a7.5 7.5 0 0 1 15 0v.8"/>', False, False),
    ]),
    ('ai', 'AI', [
        ('<path d="M14.6 3.2Q15.7 8.3 20.8 9.4Q15.7 10.5 14.6 15.6Q13.5 10.5 8.4 9.4Q13.5 8.3 14.6 3.2Z"/>', True, False),
        ('<path d="M6.4 2.8Q6.9 5 9.1 5.5Q6.9 6 6.4 8.2Q5.9 6 3.7 5.5Q5.9 5 6.4 2.8Z"/>', False, False),
        ('<path d="M7.2 14.6Q7.7 16.8 9.9 17.3Q7.7 17.8 7.2 20Q6.7 17.8 4.5 17.3Q6.7 16.8 7.2 14.6Z"/>', False, False),
    ]),
    ('groups', 'Группы', [
        ('<circle cx="9" cy="8" r="3.4"/>', False, False),
        ('<path d="M2.8 20v-.6a6.2 6.2 0 0 1 12.4 0v.6"/>', False, False),
        ('<circle cx="17" cy="9.2" r="2.7"/>', True, False),
        ('<path d="M17.6 14.1a4.8 4.8 0 0 1 3.9 4.7v1.2"/>', True, False),
    ]),
    ('client', 'Клиент', [
        ('<rect x="6.2" y="2.5" width="11.6" height="19" rx="2.6"/>', False, False),
        ('<path d="M10.8 18.3h2.4"/>', True, False),
    ]),
    ('pricing', 'Тарифы', [
        ('<path d="M17 6.5V5.2a1.2 1.2 0 0 0-1.5-1.2L5 6.7"/>', False, False),
        ('<rect x="3.5" y="6.5" width="17" height="13.5" rx="2.6"/>', False, False),
        ('<path d="M20.5 11h-3.6a2 2 0 0 0 0 4h3.6"/>', True, False),
    ]),
    ('reviews', 'Отзывы', [
        ('<path d="M20.5 11.6a8.5 8.5 0 0 1-12.3 7.6L3.5 20.5l1.3-4.6A8.5 8.5 0 1 1 20.5 11.6z"/>', False, False),
        ('<path d="M12 7.9l1.2 2.4 2.6.4-1.9 1.8.45 2.6L12 13.9l-2.35 1.2.45-2.6-1.9-1.8 2.6-.4z"/>', True, True),
    ]),
    ('faq', 'FAQ', [
        ('<circle cx="12" cy="12" r="9"/>', False, False),
        ('<path d="M9.4 9.3a2.7 2.7 0 0 1 5.2 1c0 1.8-2.6 2.4-2.6 2.4"/>', True, False),
        ('<circle cx="12" cy="16.6" r="1.15"/>', True, True),
    ]),
]

# Пак: фон (цвет или градиент), цвет иконки, цвет акцента
PACKS = [
    ('dark',   'Тёмный',     INK,    ORANGE, ORANGE),
    ('orange', 'Оранжевый',  'grad', WHITE,  WHITE),
    ('light',  'Светлый',    WARM,   INK,    ORANGE),
]

GRAD = ('<defs><linearGradient id="g" x1="0.25" y1="0" x2="0.75" y2="1">'
        '<stop offset="0" stop-color="#FF7A1F"/><stop offset=".48" stop-color="#FC5200"/>'
        '<stop offset="1" stop-color="#E24400"/></linearGradient></defs>')


def icon_svg(parts, bg, fg, acc, size=SIZE):
    s = size * ICON / 24
    off = (size - 24 * s) / 2
    back = (GRAD + f'<rect width="{size}" height="{size}" fill="url(#g)"/>') if bg == 'grad' \
        else f'<rect width="{size}" height="{size}" fill="{bg}"/>'
    els = []
    for el, is_acc, filled in parts:
        c = acc if is_acc else fg
        fill = c if filled else 'none'
        els.append(el.replace('/>', f' stroke="{c}" fill="{fill}"/>', 1))
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {size} {size}">{back}'
            f'<g transform="translate({off:.2f} {off:.2f}) scale({s:.4f})" stroke-width="2" '
            f'stroke-linecap="round" stroke-linejoin="round">{"".join(els)}</g></svg>\n')


def build(render=None):
    """render(svg_path, png_path, w, h) — из build.py; без него только SVG."""
    for key, _, bg, fg, acc in PACKS:
        d = OUT / key
        d.mkdir(parents=True, exist_ok=True)
        for i, (name, _, parts) in enumerate(ICONS, 1):
            f = d / f'{i:02d}-{name}.svg'
            f.write_text(icon_svg(parts, bg, fg, acc))
            if render:
                render(f, f.with_suffix('.png'), SIZE, SIZE)


if __name__ == '__main__':
    from build import render_png
    build(render_png)
    print('ok')
