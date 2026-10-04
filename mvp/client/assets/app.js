/* ═══════════════════════════════════════════════════════════════
   КЛИЕНТСКОЕ ПРИЛОЖЕНИЕ — роутер и экраны

   Адрес экрана — в хеше: app.html#/phone или #/splash?v=invite.
   На телефоне страница работает сама по себе; в стенде она живёт
   во фрейме (app.html?frame=iphone) и обменивается со стендом
   сообщениями: стенд говорит «открой экран», приложение — «я на экране».

   Экран без своей отрисовки в CL_RENDER показывается заглушкой
   с переходами из карты — так сценарий проходится насквозь ещё до дизайна.
   ═══════════════════════════════════════════════════════════════ */

const clEsc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

const CL_ICON = {
  back: '<svg viewBox="0 0 24 24"><path d="M15 5l-7 7 7 7"/></svg>',
  next: '<svg viewBox="0 0 24 24"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
  signal: '<svg width="17" height="11" viewBox="0 0 17 11"><rect x="0" y="7" width="3" height="4" rx="1"/><rect x="4.5" y="5" width="3" height="6" rx="1"/><rect x="9" y="2.5" width="3" height="8.5" rx="1"/><rect x="13.5" y="0" width="3" height="11" rx="1"/></svg>',
  wifi: '<svg width="15" height="11" viewBox="0 0 15 11"><path d="M7.5 2.2c2.2 0 4.2.9 5.7 2.3l1.2-1.2A9.7 9.7 0 0 0 7.5.5 9.7 9.7 0 0 0 .6 3.3l1.2 1.2c1.5-1.4 3.5-2.3 5.7-2.3zm0 3.3c1.3 0 2.5.5 3.4 1.3l1.2-1.2a6.5 6.5 0 0 0-9.2 0l1.2 1.2c.9-.8 2.1-1.3 3.4-1.3zM7.5 11l2.1-2.1a3 3 0 0 0-4.2 0z"/></svg>',
  batt: '<svg width="25" height="12" viewBox="0 0 25 12"><rect x=".5" y=".5" width="21" height="11" rx="3" fill="none" stroke="currentColor" opacity=".4"/><rect x="2" y="2" width="16" height="8" rx="1.6"/><rect x="23" y="4" width="1.5" height="4" rx=".7" opacity=".4"/></svg>'
};

/* ── экраны с дизайном ── */
const CL_RENDER = Object.assign({
  /* S1. Первый кадр — логотип на оранжевом, со второго — слайдшоу */
  splash(sc, v, p) {
    const go = clLinks('splash', v, p)[0].to;
    return `<div class="splash play" data-go="${go}" role="button" aria-label="Продолжить">
      <div class="wm"><span>Тренерграм</span></div>
      <div class="ss" aria-hidden="true"></div>
    </div>`;
  }
}, CL_UI);

/* Оживление экрана после вставки; возвращает уборку (таймеры) */
const CL_MOUNT = Object.assign({
  splash(scr) {
    return clSlideshow(scr.querySelector('.splash'));
  }
}, CL_UI_MOUNT);

/* ── S1: слайдшоу в духе комикса ──
   Кадр за кадром на оранжевую страницу «шлёпаются» фото: сначала одно во
   весь экран, поверх — три панели с косыми оранжевыми просветами, затем
   вырезанные фигуры в белой обводке, как наклейки, и плашка со знаком.
   Цикл повторяется, пока не загрузились данные (минимум 3 с — решено).
   Наклейки задаём шириной от левого края: размер не зависит от того,
   успела ли картинка загрузиться к моменту раскладки.
   Фото — свои (слайды в client/slides/: фон и панели — JPEG, наклейки —
   вырезанные фигуры в WebP с прозрачностью). */
/* Формы кусков: clip — многоугольник в долях экрана, box — рамка, в которую
   вписывается фото (левый, верхний край, ширина, высота в %). Края косые —
   тот же язык, что срез 45° в логотипе. */
const CL_SHAPES = {
  full: { clip: 'polygon(0 0,100% 0,100% 100%,0 100%)', box: [0, 0, 100, 100] },
  /* три полосы */
  b1: { clip: 'polygon(0 0,100% 0,100% 28.6%,0 36.6%)', box: [0, 0, 100, 37] },
  b2: { clip: 'polygon(0 37.5%,100% 29.5%,100% 62.5%,0 69.5%)', box: [0, 29, 100, 41] },
  b3: { clip: 'polygon(0 70.5%,100% 63.5%,100% 100%,0 100%)', box: [0, 63, 100, 37] },
  /* две колонки с косым разрезом */
  cL: { clip: 'polygon(0 0,57% 0,41% 100%,0 100%)', box: [0, 0, 57, 100] },
  cR: { clip: 'polygon(59% 0,100% 0,100% 100%,43% 100%)', box: [43, 0, 57, 100] },
  /* большой сверху и два снизу */
  gT: { clip: 'polygon(0 0,100% 0,100% 50%,0 58%)', box: [0, 0, 100, 58] },
  gL: { clip: 'polygon(0 59.6%,48.6% 55.6%,44.6% 100%,0 100%)', box: [0, 55, 49, 45] },
  gR: { clip: 'polygon(50.6% 55.4%,100% 51.6%,100% 100%,46.6% 100%)', box: [46, 51, 54, 49] },
  /* наклонённая карточка в центре */
  fr: { clip: 'polygon(9% 22%,91% 17%,93% 68%,7% 74%)', box: [7, 17, 86, 57] },
  /* углы */
  kT: { clip: 'polygon(26% 0,100% 0,100% 50%)', box: [26, 0, 74, 50] },
  kB: { clip: 'polygon(0 48%,74% 100%,0 100%)', box: [0, 48, 74, 52] }
};

/* Поток кадров: t — когда кусок ложится (мс от начала слайдшоу), from —
   откуда въезжает (l, r, t, b — край, z — из глубины). Кадры только
   наслаиваются: ничего не убирается, к финалу собирается коллаж. */
const CL_SLIDES = {
  dir: 'slides/',
  seq: [
    { t: 0,    img: 'full-p04.jpg', pos: '50% 30%', shape: 'full', from: 'z' },
    { t: 320,  img: 'pan-p11.jpg', shape: 'b1', from: 'l' },
    { t: 500,  img: 'pan-p12.jpg', pos: '50% 40%', shape: 'b2', from: 'r' },
    { t: 680,  img: 'pan-p14.jpg', shape: 'b3', from: 'b' },
    { t: 900,  st: 'st-p01.webp', css: 'left:-3%;bottom:-3%;width:40%', r: -3 },
    { t: 1080, st: 'st-p03.webp', css: 'left:40%;bottom:12%;width:64%', r: 5 },
    { t: 1380, img: 'full-p08.jpg', pos: '50% 30%', shape: 'cL', from: 't' },
    { t: 1560, img: 'pan-p02.jpg', shape: 'cR', from: 'b' },
    { t: 1780, st: 'st-p05.webp', css: 'left:-7%;bottom:-3%;width:58%', r: -4 },
    { t: 2020, img: 'pan-p07.jpg', pos: '50% 32%', shape: 'fr', from: 'z' },
    { t: 2240, st: 'st-p16.webp', css: 'left:57%;bottom:6%;width:44%', r: 4 },
    { t: 2540, img: 'pan-p13.jpg', pos: '50% 28%', shape: 'gT', from: 't' },
    { t: 2720, img: 'pan-p11.jpg', shape: 'gL', from: 'l' },
    { t: 2900, img: 'full-p10.jpg', pos: '50% 35%', shape: 'gR', from: 'r' },
    { t: 3140, st: 'st-p06.webp', css: 'left:-12%;top:14%;width:70%', r: -5 },
    { t: 3340, st: 'st-p09.webp', css: 'left:42%;bottom:-4%;width:62%', r: 4 },
    { t: 3620, img: 'pan-p14.jpg', shape: 'kT', from: 'r' },
    { t: 3800, img: 'pan-p12.jpg', pos: '50% 40%', shape: 'kB', from: 'l' },
    { t: 4040, st: 'st-p15.webp', css: 'left:-8%;bottom:1%;width:62%', r: -3 }
  ],
  /* Вся заставка — 7 с: логотип, раскол, поток кадров, плашка по центру.
     Грузится дольше — поток идёт дальше поверх, без сброса. */
  logo: 900,     /* чистый логотип */
  final: 5400,   /* плашка «Тренерграм» по центру */
  total: 7000,
  keep: 34       /* сколько кусков держать в DOM — старые давно закрыты новыми */
};


function clSlideshow(root) {
  const ss = root.querySelector('.ss');
  const T = [];
  const at = (ms, fn) => T.push(setTimeout(fn, ms));
  const src = f => CL_SLIDES.dir + f;
  const add = (cls, html, style) => {
    const el = document.createElement('div');
    el.className = cls;
    if (style) el.style.cssText = style;
    el.innerHTML = html;
    ss.appendChild(el);
    /* Старые куски давно закрыты новыми — не копим их в DOM */
    const all = ss.querySelectorAll('.pc,.stk');
    if (all.length > CL_SLIDES.keep) all[0].remove();
    return el;
  };
  /* Кусок фото: обёртка рисует оранжевую обводку по контуру формы
     (drop-shadow повторяет срез), внутри — фото, вписанное в рамку формы */
  const piece = x => {
    const sh = CL_SHAPES[x.shape], [l, t, w, h] = sh.box;
    add('pc' + (x.shape === 'full' ? ' full' : '') + ' from-' + (x.from || 'z'),
      `<div class="pcc" style="clip-path:${sh.clip}"><img src="${src(x.img)}" alt="" style="left:${l}%;top:${t}%;width:${w}%;height:${h}%${x.pos ? ';object-position:' + x.pos : ''}"><i class="ht"></i></div>`);
  };
  const sticker = x => add('stk', `<img src="${src(x.st)}" alt="">`, x.css + ';--r:' + x.r + 'deg');

  /* Картинки — заранее, чтобы кадр не лёг пустым. Набора нет — остаётся логотип */
  const files = [...new Set(CL_SLIDES.seq.map(x => x.img || x.st))];
  let missing = false;
  files.forEach(f => { const im = new Image(); im.onerror = () => { missing = true; }; im.src = src(f); });

  /* Прогон потока. Повтор — без кадра во весь экран: поток продолжает
     наслаиваться поверх, плашка плавно уходит */
  function run(first) {
    const seq = first ? CL_SLIDES.seq : CL_SLIDES.seq.slice(1);
    const shift = first ? 0 : seq[0].t - 200;
    if (!first) ss.querySelectorAll('.dim,.cap').forEach(el => { el.classList.add('out'); setTimeout(() => el.remove(), 400); });
    seq.forEach(x => at(x.t - shift, () => (x.st ? sticker(x) : piece(x))));
    const span = CL_SLIDES.final - CL_SLIDES.logo;
    at(span, () => { add('dim', ''); add('cap', '<span>Тренерграм</span>'); });
    at(CL_SLIDES.total - CL_SLIDES.logo, () => run(false));
  }

  at(CL_SLIDES.logo, () => {
    if (missing) return;
    /* Переход: оранжевый экран раскалывается по диагонали — срез 45°, как
       в логотипе, — половины разъезжаются, под ними уже первое фото */
    const split = document.createElement('div');
    split.className = 'split';
    split.innerHTML = '<i class="sa"></i><i class="sb"></i>';
    root.appendChild(split);
    root.classList.add('go');
    setTimeout(() => split.remove(), 900);
    run(true);
  });
  return () => T.forEach(clearTimeout);
}

/* Заглушка: заголовок, назначение из карты и кнопки переходов */
function clStub(id, sc, canBack, v, p) {
  const links = clLinks(id, v, p);
  return `
    <header class="top">
      <button class="ib${canBack ? '' : ' ghost'}" data-back aria-label="Назад">${CL_ICON.back}</button>
      <div class="t">${clEsc(sc.title)}</div>
      <span class="ib ghost"></span>
    </header>
    <div class="body">
      <div class="stub">
        <span class="cd">${clEsc(sc.code)}</span>
        <h1>${clEsc(sc.title)}</h1>
        <p>${clEsc((sc.desc || [])[0] || '')}</p>
        <span class="tag">Заглушка — дизайн экрана ещё не сделан</span>
      </div>
      <div class="sk"><i></i><i></i><i></i><b></b></div>
    </div>
    <div class="foot">${links.length
      ? links.map((l, i) => `<button class="btn ${i ? 'sec' : 'pri'}" data-go="${l.to}" data-v="${l.v || ''}">${clEsc(l.label)}${i ? '' : CL_ICON.next}</button>`).join('')
      : '<button class="btn sec" data-back>Назад</button>'}
    </div>`;
}

/* ── фикстура фрейма: системные полосы рисуем сами ── */
const clFrame = new URLSearchParams(location.search).get('frame');
/* frame: iphone, android — приложение; iphone-web, android-web — в браузере */
{ const [dev, web] = String(clFrame || '').split('-');
  if (dev === 'iphone' || dev === 'android') document.documentElement.classList.add('f-' + dev);
  if (web === 'web') document.documentElement.classList.add('f-web'); }
const clInFrame = window.parent !== window;

const clDev = document.getElementById('dev');
const clSbar = document.getElementById('sbar');
const clHbar = document.getElementById('hbar');
clSbar.innerHTML = `<span>9:41</span><span class="ic">${CL_ICON.signal}${CL_ICON.wifi}${CL_ICON.batt}</span>`;

/* ── роутер ── */
function clParse(h) {
  const m = (h || '').replace(/^#\/?/, '').split('?');
  const id = CL_SCREENS[m[0]] ? m[0] : CL_START;
  const v = clView(id, new URLSearchParams(m[1] || '').get('v'));
  return { id, v };
}
const clHash = (id, v) => '#/' + id + (v ? '?v=' + v : '');
/* Вид-попап (sheetView) — тот же экран плюс лист снизу; базовый — первый вид */
const clBase = (id, v) => { const sc = CL_SCREENS[id]; return sc.sheetView && v === sc.sheetView ? sc.views[0].id : v; };

/* Стек своих переходов — чтобы понять, вперёд шли или назад, и анимировать
   сдвиг в нужную сторону. Системная «назад» браузера тоже попадает сюда. */
const clStack = [];

/* Параметры сценария (CL_PARAMS): по ним «дальше» выбирает следующий экран.
   В стенде их задаёт панель над картой; на телефоне — пока по умолчанию.
   В адресе: ?p=platform:web,mem:no,… */
let clP = clNorm(Object.fromEntries((new URLSearchParams(location.search).get('p') || '')
  .split(',').filter(Boolean).map(x => x.split(':'))));

let clCur = '';
function clRender() {
  const { id, v } = clParse(location.hash);
  const h = clHash(id, v);
  const sheet = CL_SCREENS[id].sheetView && v === CL_SCREENS[id].sheetView ? id : '';
  let dir = 'enter';
  if (clStack.length > 1 && clStack[clStack.length - 2] === h) { clStack.pop(); dir = 'back'; }
  else if (clStack[clStack.length - 1] !== h) clStack.push(h);
  else dir = '';

  /* Открылся или закрылся только попап — экран под ним не перерисовываем */
  if (clCur === id + '|' + clBase(id, v) && clDev.querySelector('.scr')) {
    clSheet(sheet);
    if (clInFrame) parent.postMessage({ cl: 'at', id, v }, '*');
    return;
  }
  clCur = id + '|' + clBase(id, v);

  const sc = CL_SCREENS[id];
  const canBack = clStack.length > 1;
  const scr = document.createElement('main');
  scr.className = 'scr scr-' + id + (dir ? ' ' + dir : '');
  scr.innerHTML = CL_RENDER[id] ? CL_RENDER[id](sc, v, clP, canBack) : clStub(id, sc, canBack, v, clP);
  const old = clDev.querySelector('.scr');
  if (old) { old._off?.(); old.remove(); }
  clDev.prepend(scr);
  scr._off = CL_MOUNT[id] ? CL_MOUNT[id](scr, sc, v) : null;

  const light = sc.bar === 'light';
  clSbar.classList.toggle('light', light);
  clHbar.classList.toggle('light', light);
  document.title = sc.title + ' · Тренерграм';
  /* Цвет полос браузера: Safari и Chrome красят их в цвет страницы */
  document.querySelector('meta[name=theme-color]').content = light ? '#FC5200' : clPageColor();
  clFit(scr);
  clSheet(sheet);

  if (clInFrame) parent.postMessage({ cl: 'at', id, v }, '*');
}

/* Попапы экранов. Пока дизайна нет — заглушка с кнопками */
const CL_SHEETS = {
  home: {
    icon: true,
    title: 'Установите Тренерграм на телефон',
    text: 'Приложение будет открываться с главного экрана в одно касание и работать без интернета.',
    acts: ['Установить', 'Позже']
  }
};
function clSheet(id) {
  const old = clDev.querySelector('.shw');
  if (!id) { if (old) { old.classList.add('out'); setTimeout(() => old.remove(), 220); } return; }
  if (old) return;
  const x = CL_SHEETS[id];
  const w = document.createElement('div');
  w.className = 'shw';
  w.innerHTML = `<div class="shbg" data-close></div>
    <div class="sheet" role="dialog" aria-label="${clEsc(x.title)}"><i class="grab"></i>
      ${x.icon ? '<span class="appic"><i>ТМ</i></span>' : ''}
      <h2>${clEsc(x.title)}</h2>
      <p>${clEsc(x.text)}</p>
      <div class="acts">${x.acts.map((l, i) =>
        `<button class="btn ${i ? 'sec' : 'pri'}" data-close>${clEsc(l)}</button>`).join('')}</div>
    </div>`;
  clDev.appendChild(w);
}

/* Без явного вида — тот, в котором экран стоит в сценарии (R1 «по ссылке») */
/* Подсказка установки: в вебе сама открывается при первом входе на главную,
   один раз. Явно выбранный вид (из стенда) — как выбран */
let clSheetShown = false;
function clGo(id, v, replace) {
  const o = clInFlow(id, clP);
  const sc = CL_SCREENS[id];
  if (!v && sc.sheetView && clP.platform === 'web' && !clSheetShown) { v = sc.sheetView; clSheetShown = true; }
  const h = clHash(id, clView(id, v || (o && o.v)));
  if (h === location.hash) return clRender();
  if (replace) { clStack.pop(); location.replace(h); }
  else location.hash = h;
}

/* Подгонка wordmark под ширину: срез — доля от кегля, иначе на мелком
   кегле он съест букву. Первый замер — на подменном шрифте, повторяем
   после загрузки Montserrat. */
function clFit(root) {
  (root || document).querySelectorAll('.wm').forEach(wm => {
    const box = wm.parentElement.clientWidth - 56;
    const span = wm.querySelector('span');
    let size = 64, guard = 0;
    const apply = () => { span.style.fontSize = size + 'px'; wm.style.setProperty('--c', (size * .34).toFixed(1) + 'px'); };
    apply();
    while (wm.offsetWidth > box && size > 14 && guard++ < 100) { size--; apply(); }
  });
}
if (document.fonts) document.fonts.ready.then(() => clFit());

clDev.addEventListener('click', e => {
  const b = e.target.closest('[data-back]');
  if (b) { if (clStack.length > 1) history.back(); return; }
  const c = e.target.closest('[data-close]');
  if (c) { const { id, v } = clParse(location.hash); clGo(id, clBase(id, v), true); return; }
  const g = e.target.closest('[data-go]');
  if (g) {
    /* @next — следующий экран сценария при текущих параметрах */
    const to = g.dataset.go === '@next' ? clNext(clParse(location.hash).id, clP) : g.dataset.go;
    if (to) clGo(to, g.dataset.v);
  }
});

addEventListener('hashchange', clRender);
addEventListener('message', e => {
  const m = e.data || {};
  if (m.cl === 'go') { if (m.p) clP = clNorm(m.p); clGo(m.id, m.v, m.replace); }
  if (m.cl === 'params') clP = clNorm(m.p);
  /* Тема со стенда: перерисовываем текущий экран — в настройках виден выбор */
  if (m.cl === 'theme' && m.t && clInFrame) { clS.set.theme = m.t; clSave(); clApplyTheme(); clCur = ''; clRender(); parent.postMessage({ cl: 'theme' }, '*'); }
  if (m.cl === 'back' && clStack.length > 1) history.back();
});
addEventListener('resize', () => clFit());

clRender();
