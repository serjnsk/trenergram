#!/usr/bin/env python3
"""База упражнений прототипа из hasaneyldrm/exercises-dataset.

Датасет — статичные файлы в GitHub, API у него нет: берём JSON один раз
с закреплённого коммита и раскладываем в два скрипта для mvp/:

  mvp/assets/exdb.js        — список для поиска и таблиц: id, названия en/ru,
                              часть тела, оснащение, мышцы, id медиа
  mvp/assets/exdb-steps.js  — пошаговая техника на русском (≈1 МБ), грузит
                              только страница базы упражнений

Русские названия в датасете нет — они в names-ru.json рядом (наш перевод,
правится руками). Инструкции на русском в датасете машинные: типовые ошибки
перевода правит FIXES ниже. Превью 180×180 лежат в mvp/assets/ex/img/
(скачивает --images), GIF берутся с jsDelivr с того же коммита.

  python3 tools/exdb/build-exdb.py            # пересобрать js
  python3 tools/exdb/build-exdb.py --images   # и докачать превью
"""
import json, os, re, sys, urllib.request
from concurrent.futures import ThreadPoolExecutor

REPO = 'hasaneyldrm/exercises-dataset'
SHA = '7455efae41b330c265e7cd4b78dfa848e7ce5ebd'
RAW = f'https://raw.githubusercontent.com/{REPO}/{SHA}/'
CDN = f'https://cdn.jsdelivr.net/gh/{REPO}@{SHA}/'

HERE = os.path.dirname(os.path.abspath(__file__))
MVP = os.path.join(HERE, '..', '..', 'mvp')
CACHE = os.path.join(HERE, '.cache-exercises.json')

# Типовые ошибки машинного перевода инструкций: «скамья для проповедника»,
# «тросовая машина», «мяч для упражнений». Порядок важен — сначала фразы,
# потом отдельные слова.
FIXES = [
    (r'скамь([юеия]) (?:для )?проповедника', r'скамь\1 Скотта'),
    (r'скамейк([аеиу]) (?:для )?проповедника', r'скамь\1 Скотта'),
    (r'(?:для сгибаний )?проповедника', 'скамьи Скотта'),
    (r'тросов(?:ое крепление|ую ручку|ую рукоятку)', 'рукоятку блока'),
    (r'(?:низк|нижн)(ему|им|его|ого) шкив(у|ам|ом|а)', r'нижн\1 блок\2'),
    (r'(?:высок|верхн)(ему|им|его|ого) шкив(у|ам|ом|а)', r'верхн\1 блок\2'),
    (r'шкивы троса', 'блоки'),
    (r'(?:тросов|канатн)ая машина', 'блочный тренажёр'),
    (r'(?:тросов|канатн)ую машину', 'блочный тренажёр'),
    (r'(?:тросов|канатн)ой машины', 'блочного тренажёра'),
    (r'(?:тросов|канатн)ой машине', 'блочном тренажёре'),
    (r'(?:тросов|канатн)ой машиной', 'блочным тренажёром'),
    (r'машин(?:а|у) для пересечения тросов', 'кроссовер'),
    (r'машины для пересечения тросов', 'кроссовера'),
    (r'машине для пересечения тросов', 'кроссовере'),
    (r'тросовый шкив', 'блок'), (r'тросового шкива', 'блока'),
    (r'шкив(ы|у|а|ом|ам|ами|ах|е)?\b', lambda m: 'блок' + {'ы': 'и', None: ''}.get(m.group(1), m.group(1) or '')),
    (r'рукоятк([уиа]) троса', r'рукоятк\1 блока'),
    (r'машин([уеы]) Смита', lambda m: {'у': 'тренажёр', 'е': 'тренажёре', 'ы': 'тренажёра'}[m.group(1)] + ' Смита'),
    (r'машина Смита', 'тренажёр Смита'),
    (r'медицинский мяч', 'медбол'), (r'медицинского мяча', 'медбола'),
    (r'медицинским мячом', 'медболом'), (r'медицинскому мячу', 'медболу'),
    (r'медицинском мяче', 'медболе'),
    (r'мяч для упражнений', 'фитбол'), (r'мяча для упражнений', 'фитбола'),
    (r'мячом для упражнений', 'фитболом'), (r'мяче для упражнений', 'фитболе'),
    (r'мячу для упражнений', 'фитболу'),
    (r'\bмашина\b', 'тренажёр'), (r'\bмашину\b', 'тренажёр'), (r'\bмашины\b', 'тренажёра'),
    (r'\bмашине\b', 'тренажёре'), (r'\bмашиной\b', 'тренажёром'),
    (r'тренажер', 'тренажёр'),
]


def fix_ru(s):
    """Замены без учёта регистра; в начале предложения заглавная сохраняется."""
    for pat, rep in FIXES:
        def sub(m, rep=rep):
            r = rep(m) if callable(rep) else m.expand(rep)
            return r[:1].upper() + r[1:] if m.group(0)[:1].isupper() else r
        s = re.sub(pat, sub, s, flags=re.I)
    return s


def load_dataset():
    if not os.path.exists(CACHE):
        print('скачиваю exercises.json @', SHA[:7])
        urllib.request.urlretrieve(RAW + 'data/exercises.json', CACHE)
    return json.load(open(CACHE, encoding='utf-8'))


def main():
    data = load_dataset()
    names = json.load(open(os.path.join(HERE, 'names-ru.json'), encoding='utf-8'))
    missing = [e['id'] for e in data if not names.get(e['id'])]
    if missing:
        sys.exit(f'нет русского названия у {len(missing)}: {missing[:10]}')

    rows, steps = [], {}
    for e in data:
        en = e['name'].replace('в°', '°')                    # битая кодировка «45°» в источнике
        rows.append([e['id'], en, names[e['id']], e['body_part'], e['equipment'],
                     e['target'], e['secondary_muscles'], e['media_id']])
        steps[e['id']] = [fix_ru(s) for s in e['instruction_steps']['ru']]

    head = (f'/* База упражнений — СГЕНЕРИРОВАНО tools/exdb/build-exdb.py, руками не править.\n'
            f'   Источник: github.com/{REPO} @ {SHA[:7]} — данные MIT, медиа © Gym visual.\n')
    with open(os.path.join(MVP, 'assets', 'exdb.js'), 'w', encoding='utf-8') as f:
        f.write(head + '   Строка: [id, en, ru, часть тела, оснащение, целевая мышца, [вспомогательные], id медиа]. */\n')
        f.write('const EXDB_SRC = ' + json.dumps({'repo': REPO, 'sha': SHA, 'gif': CDN + 'videos/', 'img': 'assets/ex/img/'}) + ';\n')
        f.write('const EXDB = [\n' + ',\n'.join(json.dumps(r, ensure_ascii=False) for r in rows) + '\n];\n')
    with open(os.path.join(MVP, 'assets', 'exdb-steps.js'), 'w', encoding='utf-8') as f:
        f.write(head + '   Пошаговая техника на русском: id → шаги. */\n')
        f.write('const EXDB_STEPS = {\n' + ',\n'.join(json.dumps(k) + ':' + json.dumps(v, ensure_ascii=False) for k, v in steps.items()) + '\n};\n')
    print(f'exdb.js: {len(rows)} упражнений; exdb-steps.js: {sum(map(len, steps.values()))} шагов')

    if '--images' in sys.argv:
        out = os.path.join(MVP, 'assets', 'ex', 'img')
        os.makedirs(out, exist_ok=True)
        todo = [e['image'].split('/')[-1] for e in data]
        todo = [n for n in todo if not os.path.exists(os.path.join(out, n))]
        def get(n): urllib.request.urlretrieve(RAW + 'images/' + n, os.path.join(out, n))
        with ThreadPoolExecutor(16) as ex: list(ex.map(get, todo))
        print(f'превью: докачано {len(todo)}')


if __name__ == '__main__':
    main()
