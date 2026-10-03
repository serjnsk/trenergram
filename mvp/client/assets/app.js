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
const CL_RENDER = {
  /* S1. Первый кадр — логотип на оранжевом, со второго — слайдшоу */
  splash(sc, v, p) {
    const go = clLinks('splash', v, p)[0].to;
    return `<div class="splash play" data-go="${go}" role="button" aria-label="Продолжить">
      <div class="wm"><span>Тренерграм</span></div>
      <div class="ss" aria-hidden="true"></div>
    </div>`;
  }
};

/* Оживление экрана после вставки; возвращает уборку (таймеры) */
const CL_MOUNT = {
  splash(scr) {
    return clSlideshow(scr.querySelector('.splash'));
  }
};

/* ── S1: слайдшоу в духе комикса ──
   Кадр за кадром на оранжевую страницу «шлёпаются» фото: сначала одно во
   весь экран, поверх — три панели с косыми оранжевыми просветами, затем
   вырезанные фигуры в белой обводке, как наклейки, и плашка со знаком.
   Цикл повторяется, пока не загрузились данные (минимум 3 с — решено).
   Наклейки задаём шириной от левого края: размер не зависит от того,
   успела ли картинка загрузиться к моменту раскладки.
   Фото HWPO — временные, только для локального прототипа. */
const CL_SLIDES = {
  dir: 'ref/slides/',
  cycles: [
    { full: 'full.jpg', panels: ['band1.jpg', 'band2.jpg', 'band3.jpg'],
      stickers: [
        { src: 'st-sandbag.png',  css: 'left:-6%;bottom:-3%;width:58%', r: -4 },
        { src: 'st-dumbbell.png', css: 'left:50%;bottom:6%;width:58%', r: 5 }
      ] },
    { full: 'band3.jpg', panels: ['full.jpg', 'band1.jpg', 'band2.jpg'],
      stickers: [
        { src: 'st-hang.png', css: 'left:-8%;bottom:-8%;width:56%', r: 4 },
        { src: 'st-bend.png', css: 'left:40%;bottom:-2%;width:70%', r: -6 }
      ] }
  ],
  logo: 850,     /* сколько держится чистый логотип */
  cycle: 2400    /* длина одного круга */
};

function clSlideshow(root) {
  const ss = root.querySelector('.ss');
  const T = [];
  const at = (ms, fn) => T.push(setTimeout(fn, ms));
  const src = f => CL_SLIDES.dir + f;
  /* Удар: короткая тряска страницы при каждом приземлении кадра */
  const hit = () => { ss.classList.remove('shake'); void ss.offsetWidth; ss.classList.add('shake'); };
  const add = (layer, cls, html, style) => {
    const el = document.createElement('div');
    el.className = cls;
    if (style) el.style.cssText = style;
    el.innerHTML = html;
    layer.appendChild(el);
    return el;
  };
  const photo = f => `<img src="${src(f)}" alt=""><i class="ht"></i>`;

  /* Картинки — заранее, чтобы первый удар не пришёлся на пустоту. Набора нет
     (в публикации кадров HWPO нет, своих фото ещё нет) — остаётся логотип */
  const files = [...new Set(CL_SLIDES.cycles.flatMap(c => [c.full, ...c.panels, ...c.stickers.map(x => x.src)]))];
  let missing = false;
  files.forEach(f => { const im = new Image(); im.onerror = () => { missing = true; }; im.src = src(f); });

  let prev = null;
  function cycle(k) {
    const c = CL_SLIDES.cycles[k % CL_SLIDES.cycles.length];
    const layer = add(ss, 'lay', '');
    add(layer, 'full', photo(c.full)); hit();
    if (prev) { const old = prev; at(420, () => old.remove()); }
    prev = layer;
    c.panels.forEach((f, i) => at(300 + i * 220, () => {
      add(layer, 'pn p' + (i + 1), photo(f)); hit();
      /* оранжевый просвет — над панелью, которая легла второй и третьей */
      if (i) add(layer, 'gut g' + i, '');
    }));
    c.stickers.forEach((x, i) => at(1020 + i * 260, () =>
      add(layer, 'stk', `<img src="${src(x.src)}" alt="">`, x.css + ';--r:' + x.r + 'deg')));
    at(1650, () => { add(layer, 'cap', '<span>Тренерграм</span>'); hit(); });
    at(CL_SLIDES.cycle, () => cycle(k + 1));
  }

  at(CL_SLIDES.logo, () => { if (missing) return; root.classList.add('go'); cycle(0); });
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
if (clFrame === 'iphone' || clFrame === 'android') document.documentElement.classList.add('f-' + clFrame);
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
  scr.className = 'scr' + (dir ? ' ' + dir : '');
  scr.innerHTML = CL_RENDER[id] ? CL_RENDER[id](sc, v, clP, canBack) : clStub(id, sc, canBack, v, clP);
  const old = clDev.querySelector('.scr');
  if (old) { old._off?.(); old.remove(); }
  clDev.prepend(scr);
  scr._off = CL_MOUNT[id] ? CL_MOUNT[id](scr, sc, v) : null;

  const light = sc.bar === 'light';
  clSbar.classList.toggle('light', light);
  clHbar.classList.toggle('light', light);
  document.title = sc.title + ' · Тренерграм';
  document.querySelector('meta[name=theme-color]').content = light ? '#FC5200' : '#FFFFFF';
  clFit(scr);
  clSheet(sheet);

  if (clInFrame) parent.postMessage({ cl: 'at', id, v }, '*');
}

/* Попапы экранов. Пока дизайна нет — заглушка с кнопками */
const CL_SHEETS = {
  home: {
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
      <h2>${clEsc(x.title)}</h2>
      <p>${clEsc(x.text)}</p>
      <span class="tag">Заглушка — дизайн попапа ещё не сделан</span>
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
  if (g) clGo(g.dataset.go, g.dataset.v);
});

addEventListener('hashchange', clRender);
addEventListener('message', e => {
  const m = e.data || {};
  if (m.cl === 'go') { if (m.p) clP = clNorm(m.p); clGo(m.id, m.v, m.replace); }
  if (m.cl === 'params') clP = clNorm(m.p);
  if (m.cl === 'back' && clStack.length > 1) history.back();
});
addEventListener('resize', () => clFit());

clRender();
