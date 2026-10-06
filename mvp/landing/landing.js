/* ═══════════════════════════════════════════════════════════════
   Лендинг: сценарии пяти вариантов hero, вкладки возможностей,
   тарифы. Каждый hero — асинхронный сценарий; переключение варианта
   увеличивает RUN, и прежний сценарий останавливается на ближайшей
   паузе (wait бросает 'stop').
   ═══════════════════════════════════════════════════════════════ */
(() => {
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const IMG = id => `../assets/ex/img/${id}.jpg`;
/* Вес — с шагом 2,5 кг, как блины в зале; запятая — по-русски */
const kg = v => (Math.round(v / 2.5) * 2.5).toLocaleString('ru-RU');
const plural = (n, a, b, c) => { const m = n % 10, h = n % 100; return m === 1 && h !== 11 ? a : m >= 2 && m <= 4 && (h < 12 || h > 14) ? b : c; };

let RUN = 0;
const alive = id => id === RUN;
const wait = (ms, id) => new Promise((ok, no) => setTimeout(() => alive(id) ? ok() : no('stop'), ms));
const frame = () => new Promise(r => requestAnimationFrame(r));

/* курсор-указатель: остриё в точке (x, y) элемента-сцены */
function pointTo(cur, el, host, dx = .5, dy = .5){
  const h = host.getBoundingClientRect(), r = el.getBoundingClientRect();
  cur.style.left = (r.left - h.left + r.width * dx - 5) + 'px';
  cur.style.top  = (r.top  - h.top  + r.height * dy - 3) + 'px';
}
async function press(el, id){ el.classList.add('press'); await wait(160, id); el.classList.remove('press'); }

/* ═══════════ A · текст → тренировка ═══════════ */
const A_TEXT = `Разминка
Гребля 500 м

Силовая
Присед со штангой 5×5 70%
Жим лёжа 4×6 75%

AMRAP 12
10 подтягиваний
15 махов гирей 24 кг
200 м бег`;
const prow = (img, nm, sc, pc = '') =>
  `<div class="pr">${img ? `<img src="${IMG(img)}" alt="">` : '<span class="ph"></span>'}<span class="nm">${nm}</span><span class="sc">${sc}</span><span class="pc">${pc}</span></div>`;
const A_PARSED = `
  <div class="ha-band" id="haBand">Разобрано ИИ — проверьте<span class="sp"></span><button class="g" tabindex="-1">Вернуть текст</button><button id="haAcc" tabindex="-1">Принять</button></div>
  <div class="pb"><h6>Разминка</h6>${prow('', 'Гребля', '500 м')}</div>
  <div class="pb"><h6>Силовая</h6>${prow('0043-qXTaZnJ', 'Присед со штангой', '5×5', '70 %')}${prow('0025-EIeI8Vf', 'Жим лёжа', '4×6', '75 %')}</div>
  <div class="pb"><h6>Комплекс <i>AMRAP 12</i></h6>${prow('0652-lBDjFxJ', 'Подтягивания', '10')}${prow('0549-UHJlbu3', 'Махи гирей', '15', '24 кг')}${prow('', 'Бег', '200 м')}</div>`;

async function heroA(id){
  const ed = $('.ha-ed'), txt = $('#haTxt'), tb = $('#haTb'), ai = $('#haAi'), parsed = $('#haParsed'),
        st = $('#haSt'), tgl = $('#haTgl'), chip = $('#haChip'), ph = $('#haPh'), push = $('#haPush'),
        cur = $('#haCur'), dot = $('#haDot');
  // исходное состояние
  txt.textContent = ''; tb.classList.remove('busy', 'gone'); ai.classList.remove('busy');
  parsed.classList.remove('on'); parsed.innerHTML = '';
  st.textContent = 'Черновик'; st.classList.remove('pub'); tgl.classList.remove('on');
  chip.classList.remove('in'); ph.classList.remove('in'); push.classList.remove('show');
  cur.classList.remove('show'); dot.style.opacity = 0; dot.setAttribute('cx', 0);

  const finish = () => {
    tb.classList.add('gone'); parsed.innerHTML = A_PARSED; parsed.classList.add('on');
    $('#haBand').remove(); $$('.pb', parsed).forEach(b => b.classList.add('in'));
    tgl.classList.add('on'); st.textContent = 'Опубликована'; st.classList.add('pub');
    chip.classList.add('in'); ph.classList.add('in');
  };
  if (RM){ finish(); return; }

  await wait(700, id);
  // набор текста — как тренер пишет в заметках
  const caret = '<span class="caret"></span>';
  for (let i = 1; i <= A_TEXT.length; i++){
    txt.innerHTML = A_TEXT.slice(0, i).replace(/</g, '&lt;') + caret;
    const c = A_TEXT[i - 1];
    await wait(c === '\n' ? 140 : 18 + Math.random() * 26, id);
  }
  txt.textContent = A_TEXT;
  await wait(450, id);

  // курсор к кнопке AI
  pointTo(cur, txt, ed, .5, .9); cur.classList.add('show');
  await wait(80, id); pointTo(cur, ai, ed, .55, .6);
  await wait(800, id); await press(ai, id);
  ai.classList.add('busy'); tb.classList.add('busy');
  await wait(1300, id);

  // структура
  tb.classList.add('gone'); parsed.innerHTML = A_PARSED; parsed.classList.add('on');
  for (const b of $$('.pb', parsed)){ await wait(170, id); b.classList.add('in'); }
  await wait(700, id);
  const acc = $('#haAcc');
  pointTo(cur, acc, ed); await wait(800, id); await press(acc, id);
  $('#haBand').style.display = 'none';
  await wait(350, id);

  // публикация
  pointTo(cur, tgl, ed); await wait(800, id); await press(tgl, id);
  tgl.classList.add('on'); st.textContent = 'Опубликована'; st.classList.add('pub');
  await wait(250, id); cur.classList.remove('show');

  // точка летит к телефону
  dot.style.opacity = 1;
  const t0 = performance.now();
  while (true){
    await frame(); if (!alive(id)) return;
    const k = Math.min(1, (performance.now() - t0) / 650);
    dot.setAttribute('cx', 150 * (1 - Math.pow(1 - k, 3)));
    if (k === 1) break;
  }
  dot.style.opacity = 0; chip.classList.add('in');
  push.classList.add('show');
  await wait(350, id); ph.classList.add('in');
  await wait(2600, id); push.classList.remove('show');
  await wait(6000, id);
  return heroA(id);
}
$('#haReplay').addEventListener('click', () => { RUN++; heroA(RUN).catch(() => {}); });

/* ═══════════ B · шторка до/после ═══════════ */
(function buildCal(){
  // Октябрь 2026: 1-е — четверг, сетка с понедельника 28 сентября. Сегодня — 5 октября.
  const W = [
    ['Сила · присед', '5×5 · AMRAP 12'], null, ['Гимнастика', 'подтягивания, стойка'], null,
    ['Тяга + EMOM', '3×3 · EMOM 12'], ['Метком', 'на время 20 мин'], null];
  const names = [
    ['Сила · присед', 'Жим + AMRAP', 'Фронт + Табата', 'Присед · тест'],
    ['Тяга + EMOM', 'Рывок · техника', 'Тяга · 3ПМ', 'Толчок + метком']];
  let html = '';
  for (let i = 0; i < 35; i++){
    const dt = new Date(2026, 8, 28 + i), d = dt.getDate(), out = dt.getMonth() !== 9, wd = i % 7, wk = i / 7 | 0;
    let w = W[wd];
    if (w && wd === 0) w = [names[0][wk % 4], w[1]];
    if (w && wd === 4) w = [names[1][wk % 4], w[1]];
    const cls = !w ? 'rest' : i < 7 ? 'w dn' : i < 21 ? 'w' : 'w dr';
    html += `<div class="d ${cls}${out ? ' out' : ''}"><span class="n">${d}</span>${w ? `<b>${w[0]}</b><i>${w[1]}</i>` : '<i>отдых</i>'}</div>`;
  }
  $('#hbGrid').innerHTML = html;
})();

const hb = $('#hb'), hbH = $('#hbHandle');
let hbTouched = false;
function hbSet(p){
  p = Math.max(4, Math.min(96, p));
  hb.style.setProperty('--x', p + '%'); hbH.setAttribute('aria-valuenow', Math.round(p));
}
function hbFromEvent(e){ const r = hb.getBoundingClientRect(); hbSet((e.clientX - r.left) / r.width * 100); }
hb.addEventListener('pointerdown', e => {
  hbTouched = true; hb.classList.add('drag'); hb.setPointerCapture(e.pointerId); hbFromEvent(e);
});
hb.addEventListener('pointermove', e => { if (hb.classList.contains('drag')) hbFromEvent(e); });
hb.addEventListener('pointerup', () => hb.classList.remove('drag'));
hb.addEventListener('pointercancel', () => hb.classList.remove('drag'));
hbH.addEventListener('keydown', e => {
  const v = parseFloat(hb.style.getPropertyValue('--x')) || 50;
  if (e.key === 'ArrowLeft'){ hbTouched = true; hbSet(v - 5); e.preventDefault(); }
  if (e.key === 'ArrowRight'){ hbTouched = true; hbSet(v + 5); e.preventDefault(); }
});
async function heroB(id){
  hbTouched = false; hbSet(50);
  if (RM) return;
  // подсказка: шторка сама качнётся туда-обратно, пока её не тронули
  await wait(900, id);
  const keys = [[50, 0], [22, 900], [78, 1900], [50, 2700]];
  const t0 = performance.now();
  while (!hbTouched){
    await frame(); if (!alive(id)) return;
    const t = performance.now() - t0;
    if (t >= 2700){ hbSet(50); break; }
    let i = 0; while (keys[i + 1][1] < t) i++;
    const [a, ta] = keys[i], [b, tb] = keys[i + 1], k = (t - ta) / (tb - ta), e = k < .5 ? 2 * k * k : 1 - Math.pow(-2 * k + 2, 2) / 2;
    hbSet(a + (b - a) * e);
  }
}

/* ═══════════ C · одна тренировка — двадцать атлетов ═══════════ */
const ATH = [
  ['Иван Петров', 190], ['Мария Соколова', 85], ['Олег Руденко', 160], ['Аня Ким', 70], ['Дима Лебедев', 145],
  ['Катя Власова', 95], ['Саша Титов', 130], ['Никита Белов', 175], ['Лена Морозова', 80], ['Артём Гусев', 150],
  ['Юля Никитина', 75], ['Паша Жуков', 140, { why: 'колено', ex: 'Жим ногами', sc: '4×10' }], ['Вика Федорова', 90], ['Рома Шилов', 200], ['Настя Егорова', 65],
  ['Илья Демин', 120], ['Света Орлова', 100], ['Гоша Карпов', 165], ['Даша Романова', 72.5], ['Миша Усов', 135]];
const AV = ['var(--acc)', 'var(--ink)', 'var(--tx3)', 'var(--acc-d)', 'var(--tx2)'];
const ini = n => n.split(/\s+/).map(s => s[0]).join('').replace('.', '');
const hcGrid = $('#hcGrid'), hcPct = $('#hcPct'), hcOut = $('#hcOut'), hcTip = $('#hcTip'), hcVis = $('#hc');
hcGrid.insertAdjacentHTML('beforeend', ATH.map(([n, rm, sub], i) => `
  <div class="hc-a${sub ? ' alt' : ''}" data-i="${i}">
    <div class="t"><span class="av" style="background:${AV[i % AV.length]}">${ini(n)}</span><span class="nm">${n.split(' ')[0]}</span></div>
    <div class="kg num">${sub ? 'Замена' : ''}</div>
    <div class="rm num">${sub ? sub.ex.toLowerCase() : `1ПМ ${kg(rm)} кг`}</div>
  </div>`).join(''));
function hcRender(flash){
  const p = +hcPct.value;
  hcOut.textContent = p + ' %';
  hcPct.style.setProperty('--p', (p - 50) / 45 * 100 + '%');
  $$('.hc-a', hcGrid).forEach(el => {
    const [, rm, sub] = ATH[el.dataset.i];
    if (sub) return;
    $('.kg', el).innerHTML = `${kg(rm * p / 100)} <small>кг</small>`;
    if (flash){ el.classList.remove('flash'); void el.offsetWidth; el.classList.add('flash'); }
  });
}
hcRender();
let hcTouched = false;
hcPct.addEventListener('input', () => { hcTouched = true; hcRender(true); });
hcGrid.addEventListener('mouseover', e => {
  const el = e.target.closest('.hc-a'); if (!el) return;
  const [n, rm, sub] = ATH[el.dataset.i], p = +hcPct.value;
  hcTip.innerHTML = sub
    ? `${n} · <b>${sub.ex.toLowerCase()} ${sub.sc}</b> вместо приседа (${sub.why})<br>Тренер поправил только его день`
    : `${n} · 1ПМ ${kg(rm)} кг × ${p} % = <b>${kg(rm * p / 100)} кг</b>`;
  const v = hcVis.getBoundingClientRect(), r = el.getBoundingClientRect();
  hcTip.style.left = (r.left - v.left + r.width / 2) + 'px';
  hcTip.style.top = (r.top - v.top) + 'px';
  hcTip.classList.add('show');
});
hcGrid.addEventListener('mouseleave', () => hcTip.classList.remove('show'));

async function heroC(id){
  const tiles = $$('.hc-a', hcGrid);
  hcTouched = false; hcPct.value = 75; hcRender();
  if (RM){ tiles.forEach(t => t.classList.add('in')); return; }
  tiles.forEach(t => t.classList.remove('in'));
  await wait(700, id);
  // волна от тренировки группы — тренировка расходится по атлетам
  const wave = $('#hcWave'); wave.classList.remove('go'); void wave.offsetWidth; wave.classList.add('go');
  const order = tiles.map((t, i) => [t, Math.abs(i % 5 - 2) + (i / 5 | 0) * 1.2]).sort((a, b) => a[1] - b[1]);
  for (const [t] of order){ t.classList.add('in'); await wait(45, id); }
  // показать, что ползунок живой: сам сходит на 85 % и обратно, если его не трогали
  await wait(1500, id);
  for (const v of [80, 85, 80, 75]){
    if (hcTouched) return;
    hcPct.value = v; hcRender(true); await wait(650, id);
  }
}

/* ═══════════ D · без связи ═══════════ */
const hdSets = $('#hdSets'), hdTgl = $('#hdTgl'), hdPh = $('#hdPh'), hdVis = $('#hd');
hdSets.innerHTML = [1, 2, 3, 4, 5].map(n =>
  `<div class="p-row" data-n="${n}"><span class="ck"><svg><use href="#i-check"/></svg></span><span class="t">Подход ${n} · 5 × 132,5 кг<span class="q">ждёт сети</span></span></div>`).join('');
let hdOnline = true, hdUser = false, hdOkTimer;
function hdSync(){
  const q = $$('.p-row.queued', hdSets);
  if (!q.length) return;
  q.forEach(r => r.classList.remove('queued'));
  const done = $$('.p-row.done', hdSets).length;
  $('#hdBanOkT').textContent = `Сеть есть. Отправлено тренеру: ${q.length} ${plural(q.length, 'подход', 'подхода', 'подходов')}`;
  $('#hdBanOk').classList.add('show');
  $('#hdSyncT').textContent = `Присед со штангой — ${done} ${plural(done, 'подход', 'подхода', 'подходов')} × 5 по 132,5 кг`;
  $('#hdSync').classList.add('show');
  clearTimeout(hdOkTimer); hdOkTimer = setTimeout(() => $('#hdBanOk').classList.remove('show'), 3500);
}
function hdNet(on){
  hdOnline = on;
  hdTgl.classList.toggle('on', on); hdTgl.setAttribute('aria-checked', on);
  hdPh.classList.toggle('off', !on); hdVis.classList.toggle('off', !on);
  $('#hdBanOff').classList.toggle('show', !on);
  $('#hdNetS').textContent = on ? 'Выключите — и отметьте подходы на телефоне' : 'Связи нет. Отметьте подходы и включите обратно';
  if (on) hdSync(); else { $('#hdBanOk').classList.remove('show'); }
}
function hdMark(row){
  const on = !row.classList.contains('done');
  row.classList.toggle('done', on);
  row.classList.toggle('queued', on && !hdOnline);
  if (on && hdOnline){ row.classList.add('queued'); hdSync(); }
}
hdTgl.addEventListener('click', () => { hdUser = true; hdNet(!hdOnline); });
hdTgl.addEventListener('keydown', e => { if (e.key === ' ' || e.key === 'Enter'){ e.preventDefault(); hdUser = true; hdNet(!hdOnline); } });
hdSets.addEventListener('click', e => { const r = e.target.closest('.p-row'); if (r){ hdUser = true; hdMark(r); } });

async function heroD(id){
  hdUser = false;
  $$('.p-row', hdSets).forEach(r => r.classList.remove('done', 'queued'));
  $('#hdSync').classList.remove('show'); $('#hdBanOk').classList.remove('show');
  hdNet(true);
  if (RM) return;
  await wait(1400, id); if (hdUser) return;
  hdNet(false);
  for (const n of [1, 2, 3]){
    await wait(n === 1 ? 1100 : 750, id); if (hdUser) return;
    hdMark($(`.p-row[data-n="${n}"]`, hdSets));
  }
  await wait(1500, id); if (hdUser) return;
  hdNet(true);
}

/* ═══════════ E · меловая доска ═══════════ */
async function heroE(id){
  const lines = $$('#heChalk > div'), board = $('#heBoard'), scan = $('#heScan'), ph = $('#hePh'), t1 = $('#heTag1'), t2 = $('#heTag2');
  const reset = () => {
    lines.forEach(l => { l.style.transition = 'none'; l.classList.remove('w'); });
    void board.offsetWidth; lines.forEach(l => l.style.transition = '');
    board.classList.remove('dig'); scan.classList.remove('go'); ph.classList.remove('in'); t1.classList.remove('in'); t2.classList.remove('in');
  };
  reset();
  if (RM){ lines.forEach(l => l.classList.add('w')); ph.classList.add('in'); t1.classList.add('in'); t2.classList.add('in'); return; }
  await wait(600, id);
  for (const l of lines){
    l.classList.add('w');
    await wait(parseFloat(l.style.getPropertyValue('--d')) * 1000 + 160, id);
  }
  await wait(600, id);
  scan.classList.add('go');
  await wait(800, id);
  board.classList.add('dig'); ph.classList.add('in');
  await wait(700, id); t1.classList.add('in');
  await wait(350, id); t2.classList.add('in');
  await wait(7000, id);
  return heroE(id);
}

/* ═══════════ переключение вариантов ═══════════ */
const HEROES = { a: heroA, b: heroB, c: heroC, d: heroD, e: heroE };
let CUR = 'a';
function show(v){
  if (!HEROES[v]) v = 'a';
  CUR = v; RUN++;
  $$('.hero').forEach(h => h.classList.toggle('on', h.dataset.hero === v));
  $$('#hsw button').forEach(b => { b.classList.toggle('on', b.dataset.v === v); b.setAttribute('aria-selected', b.dataset.v === v); });
  const u = new URL(location.href); u.searchParams.set('hero', v); history.replaceState(null, '', u);
  onScroll();
  HEROES[v](RUN).catch(() => {});
}
$('#hsw').addEventListener('click', e => { const b = e.target.closest('button'); if (b) show(b.dataset.v); });
document.addEventListener('keydown', e => {
  if (e.target.closest('input,textarea') || e.metaKey || e.ctrlKey || e.altKey) return;
  const v = { 1: 'a', 2: 'b', 3: 'c', 4: 'd', 5: 'e' }[e.key];
  if (v) show(v);
});

/* шапка: линия после прокрутки, тёмная поверх hero E */
const top = $('#top');
function onScroll(){
  top.classList.toggle('scrolled', scrollY > 4);
  const he = $('.hero.he');
  document.body.classList.toggle('dark-top', CUR === 'e' && scrollY < he.offsetHeight - 64);
}
addEventListener('scroll', onScroll, { passive: true });

/* ═══════════ возможности: вкладки категорий ═══════════ */
const tabs = $$('#ftabs a');
/* Активна та категория, чей заголовок прошёл 40 % высоты экрана */
const grps = $$('.fgrp');
let spyCur = '';
function spy(){
  let id = grps[0].id;
  for (const g of grps) if (g.getBoundingClientRect().top < innerHeight * .4) id = g.id;
  if (id === spyCur) return;
  spyCur = id;
  tabs.forEach(t => {
    const on = t.getAttribute('href') === '#' + id;
    t.classList.toggle('on', on);
    /* Только горизонтально внутри полоски: scrollIntoView двигал и страницу,
       и прокрутка колесом дёргалась назад на каждой смене категории */
    if (on){
      const bar = t.parentElement, l = t.offsetLeft, r = l + t.offsetWidth;
      if (l < bar.scrollLeft) bar.scrollLeft = l - 8;
      else if (r > bar.scrollLeft + bar.clientWidth) bar.scrollLeft = r - bar.clientWidth + 8;
    }
  });
}
addEventListener('scroll', spy, { passive: true });
spy();

/* ═══════════ тарифы ═══════════ */
/* Рыба: тарифная сетка не утверждена (OQ-8). Годовая — −20 %. */
const CK = '<svg><use href="#i-check"/></svg>';
const PLANS = [
  { name: 'Старт', for: 'Попробовать на своих клиентах', m: 0, lim: 'до 3 клиентов', note: 'Бессрочно, без банковской карты',
    btn: 'Начать бесплатно', cls: 'ln', head: 'Всё для старта:',
    items: ['Конструктор с вводом текстом', 'База 1 300 упражнений с анимацией', 'Приложение для клиентов', 'Офлайн у клиента и тренера', 'Кнопка AI — 30 разборов в месяц'] },
  { name: 'Тренер', for: 'Личное ведение', m: 990, lim: 'до 15 клиентов', note: '14 дней бесплатно, затем помесячно', pop: true,
    btn: 'Попробовать 14 дней', cls: '', head: 'Всё из «Старт», плюс:',
    items: ['Группы с личными правками', 'Проценты от ПМ → килограммы', 'Копирование и перенос дней', 'Импорт из TRNR, Excel и Google Таблиц', 'Кнопка AI без ограничений'] },
  { name: 'Профи', for: 'Большая база клиентов', m: 1990, lim: 'до 50 клиентов', note: 'Помесячно, отмена в любой момент',
    btn: 'Подключить «Профи»', cls: 'gh', head: 'Всё из «Тренер», плюс:',
    items: ['Перенос клиентов силами менеджера', 'Шаблоны программ и блоков', 'Приоритетная поддержка в чате', 'Ранний доступ к оплатам от клиентов'] },
  { name: 'Команда', for: 'Зал или команда', m: 3990, lim: 'до 150 клиентов', note: 'Помесячно, отмена в любой момент',
    btn: 'Подключить «Команду»', cls: 'gh', head: 'Всё из «Профи», плюс:',
    items: ['Лимит в 3 раза выше', 'Личный менеджер', 'Помощь с переносом программ', 'Страница тренера с вашим брендом — скоро'] }];
const rub = n => n.toLocaleString('ru-RU').replace(/ /g, ' ');
function renderPlans(per){
  $('#plans').innerHTML = PLANS.map(p => {
    const y = Math.round(p.m * .8 / 10) * 10, price = per === 'y' ? y : p.m;
    return `<div class="pl${p.pop ? ' pop' : ''}">
      ${p.pop ? '<span class="tag">Популярный</span>' : ''}
      <h4>${p.name}</h4><div class="for">${p.for}</div>
      <div class="pr"><b class="num">${rub(price)} ₽</b><s>/ мес</s></div>
      <div class="old">${per === 'y' && p.m ? `${rub(p.m)} ₽ · ${rub(y * 12)} ₽ за год` : ''}</div>
      <div class="lim"><span>${p.lim}</span></div>
      <div class="note">${p.note}</div>
      <a class="lb ${p.cls}" href="../">${p.btn}</a>
      <ul><li class="h">${p.head}</li>${p.items.map(i => `<li>${CK}${i}</li>`).join('')}</ul>
    </div>`;
  }).join('');
}
$('#per').addEventListener('click', e => {
  const b = e.target.closest('button'); if (!b) return;
  $$('#per button').forEach(x => { x.classList.toggle('on', x === b); x.setAttribute('aria-selected', x === b); });
  renderPlans(b.dataset.per);
});
renderPlans('m');

/* ═══════════ появление при прокрутке ═══════════ */
const rv = new IntersectionObserver(es => es.forEach(e => { if (e.isIntersecting){ e.target.classList.add('in'); rv.unobserve(e.target); } }),
  { threshold: .12, rootMargin: '0px 0px -40px 0px' });
$$('.rv-in').forEach(el => rv.observe(el));

show(new URLSearchParams(location.search).get('hero') || 'a');
})();
