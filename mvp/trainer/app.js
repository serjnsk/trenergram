/* ═══════════════════════════════════════════════════════════════
   ТРЕНЕРСКОЕ ПРИЛОЖЕНИЕ · прототип (trainer/app.html)

   Экраны спроектированы под телефон заново, по задачам тренера (список
   задач и решения — память trainer-app-scope): Сегодня · Календарь ·
   Клиенты · Базы · Профиль; конструктор — во весь экран поверх вкладок.
   Данные и логика — общие с кабинетом (data.js, nav.js, ui.js): лента —
   appFeed(), оплата — feeReceive(), обсуждение — talkAdd(), публикация —
   setPublished(). Глобальные имена кабинета ($, esc, ICON…) не трогаем — весь
   код здесь в замыкании.

   Маршруты (хэш):
     #/today                       Сегодня: «Тренируются сегодня» + лента
     #/calendar[/<клиент|группа>]  календарь
     #/clients · #/clients/groups  клиенты и группы
     #/client/<id> · #/group/<id>  карточки
     #/edit/<кто>/<дата>           редактор тренировки во весь экран (editor.js)
     #/edit/<кто>/wizard           мастер «Создать несколько тренировок» (страница кабинета)
     #/workout/<клиент>/<дата>     тренировка клиента (страница кабинета)
     #/bases · #/profile           следующая итерация
   ═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';
const APP_EL = document.getElementById('app'), LAYER = document.getElementById('layer');
const root = document.documentElement;

/* стенд: режим телефона пишет атрибут фрейма (как для кабинета, mobile.js) */
let fe = null; try{ fe = window.frameElement }catch(_){}
const fm = fe && /^(iphone|android):(app|web)$/.exec(fe.dataset.mode || '');
if(fm){
  root.classList.add('in-stand');
  if(fm[2] === 'app'){ const sa = {iphone:[59, 34], android:[24, 16]}[fm[1]]; root.style.setProperty('--sat', sa[0] + 'px'); root.style.setProperty('--sab', sa[1] + 'px') }
}

/* ─── значки (контур 1.8, как у Strava) ─── */
const sv = (d, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
const I = {
  home: sv('<path d="M3.5 10.5 12 3.5l8.5 7V20a.5.5 0 0 1-.5.5h-5.5v-6h-5v6H4a.5.5 0 0 1-.5-.5z"/>'),
  cal: sv('<rect x="3.5" y="5" width="17" height="15.5" rx="2"/><path d="M3.5 9.5h17M8 3v4M16 3v4"/>'),
  users: sv('<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/><path d="M15.5 4.9a3.2 3.2 0 0 1 0 6.2M17.5 14.3c2 .7 3.5 2.8 3.5 5.7"/>'),
  bases: sv('<path d="M12 3.5 3.5 8 12 12.5 20.5 8z"/><path d="M3.5 12 12 16.5 20.5 12M3.5 16 12 20.5 20.5 16"/>'),
  user: sv('<circle cx="12" cy="8" r="3.8"/><path d="M4.5 20.5c0-4 3.4-7 7.5-7s7.5 3 7.5 7"/>'),
  plus: sv('<path d="M12 5v14M5 12h14"/>'),
  filter: sv('<path d="M4 6h16M7 12h10M10 18h4"/>'),
  chev: sv('<path d="m9 5 7 7-7 7"/>'),
  back: sv('<path d="M15 5 8 12l7 7"/>'),
  down: sv('<path d="m6 9 6 6 6-6"/>'),
  x: sv('<path d="M6 6l12 12M18 6 6 18"/>'),
  check: sv('<path d="m5 12.5 4.5 4.5L19 7.5"/>', 'stroke-width="2.4"'),
  send: sv('<path d="M5 12h13M13 6l6 6-6 6"/>', 'stroke-width="2.2"'),
  msg: sv('<path d="M20 11.5a7.5 7.5 0 0 1-10.8 6.7L4 20l1.6-4.6A7.5 7.5 0 1 1 20 11.5z"/>'),
  wallet: sv('<rect x="3.5" y="6" width="17" height="13" rx="2.5"/><path d="M3.5 10h17M16 14.5h1.5"/>'),
  phone: sv('<path d="M6.5 3.5h3l1.5 4-2 1.3a10 10 0 0 0 6.2 6.2l1.3-2 4 1.5v3a2 2 0 0 1-2 2A16 16 0 0 1 4.5 5.5a2 2 0 0 1 2-2z"/>'),
  plane: sv('<path d="M21 4 3 11.5l6.5 2.2M21 4l-3.5 16-8-6.3M21 4 9.5 13.7V19l3-3"/>'),
  dumb: sv('<path d="M6.5 7.5v9M17.5 7.5v9M3.5 10v4M20.5 10v4M6.5 12h11"/>'),
  play: sv('<path d="M8 5.5v13l10-6.5z"/>', 'fill="currentColor"'),
  clock: sv('<circle cx="12" cy="12" r="8"/><path d="M12 8v4.5l3 2"/>'),
  star: sv('<path d="m12 4 2.4 5 5.4.6-4 3.7 1.1 5.3L12 16l-4.9 2.6 1.1-5.3-4-3.7 5.4-.6z"/>'),
  trophy: sv('<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5v1.5A3.5 3.5 0 0 0 8 11M16 6h3.5v1.5A3.5 3.5 0 0 1 16 11M12 13v4M8.5 20h7"/>'),
  search: sv('<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>'),
  edit: sv('<path d="M14.5 5.5 18.5 9.5 9 19H5v-4z"/>'),
  copy: sv('<rect x="8" y="8" width="11.5" height="11.5" rx="2"/><path d="M5 15.5V6a1.5 1.5 0 0 1 1.5-1.5H16"/>'),
  eye: sv('<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>'),
  eyeoff: sv('<path d="M3 3l18 18M10.6 6a9 9 0 0 1 1.4-.1c6 0 9.5 6.1 9.5 6.1a17 17 0 0 1-2.6 3.3M6.6 6.7C4 8.4 2.5 12 2.5 12S6 18.5 12 18.5c1.5 0 2.9-.4 4.1-1"/>'),
  more: sv('<circle cx="6" cy="12" r="1.2" fill="currentColor"/><circle cx="12" cy="12" r="1.2" fill="currentColor"/><circle cx="18" cy="12" r="1.2" fill="currentColor"/>'),
  gear: sv('<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>'),
  link: sv('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
  share: sv('<path d="M12 15V3.5M7.5 8 12 3.5 16.5 8"/><path d="M5 12v7.5a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V12"/>'),
  dots: sv('<circle cx="5.5" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="12" cy="12" r="1.7" fill="currentColor" stroke="none"/><circle cx="18.5" cy="12" r="1.7" fill="currentColor" stroke="none"/>'),
  bell: sv('<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 1.5h-15zM10 20.5h4"/>'),
  card: sv('<rect x="3.5" y="6" width="17" height="12.5" rx="2"/><path d="M3.5 10h17"/>'),
  gift: sv('<rect x="4" y="9" width="16" height="11.5" rx="1.5"/><path d="M12 9v11.5M3.5 9h17M12 9c-1.5-3-5-3.5-5-1.5S10 9 12 9zm0 0c1.5-3 5-3.5 5-1.5S14 9 12 9z"/>'),
  help: sv('<circle cx="12" cy="12" r="8.5"/><path d="M9.6 9.5a2.5 2.5 0 1 1 3.4 2.3c-.6.3-1 .8-1 1.5v.7M12 17h.01"/>'),
  ex: sv('<path d="M6.5 7.5v9M17.5 7.5v9M3.5 10v4M20.5 10v4M6.5 12h11"/>'),
  list: sv('<path d="M9 7h11M9 12h11M9 17h11M4.5 7h.01M4.5 12h.01M4.5 17h.01"/>'),
  clip: sv('<rect x="5.5" y="4.5" width="13" height="16" rx="2"/><path d="M9.5 3.5h5v3h-5zM8.5 11h7M8.5 14.5h7"/>')
};

/* ─── помощники ─── */
const h = esc;
const WD = ['вс','пн','вт','ср','чт','пт','сб'];
const fmtDay = d => { const x = new Date(d + 'T00:00:00'); return WD[x.getDay()] + ', ' + x.getDate() + ' ' + MONTHS[x.getMonth()] };
const dayWord = d => d === TODAY ? 'Сегодня' : d === addDays(TODAY, -1) ? 'Вчера' : d === addDays(TODAY, 1) ? 'Завтра' : fmtDay(d);
const first = n => String(n || '').split(' ')[0];
function ava(c, cls = ''){
  if(!c) return `<span class="ava ${cls}"></span>`;
  if(c.members) return `<span class="ava sq ${cls}">${h(c.ini || grpIni(c.n))}</span>`;
  return `<span class="ava ${cls}"><img src="${avaURL(c)}" alt="" loading="lazy" onerror="this.remove()">${h(c.ini)}</span>`;
}
let toastT = 0;
function say(msg){
  let t = document.querySelector('.toast'); if(!t){ t = document.createElement('div'); t.className = 'toast'; document.body.append(t) }
  t.textContent = msg; t.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove('on'), 2600);
}
const go = hash => { if(location.hash !== hash) location.hash = hash; else render() };
const back = fallback => { if(history.length > 1 && APP.came) history.back(); else go(fallback || '#/today') };

/* ─── состояние экранов (в памяти, пока открыто приложение) ─── */
const APP = { base:'#/today', came:false,
  feed:{types:new Set(), per:'all'},
  cal:{who:null, sel:TODAY, view:null, full:false, mode:null, picked:new Set(), clip:null, targets:new Set(), pstart:null, lp:0, open:new Set()},
  cl:{q:'', st:new Set(), sort:'att'} };

/* ═══════════ ДАННЫЕ ДЛЯ ЭКРАНОВ ═══════════ */

/* Кто тренируется сегодня — у кого на сегодня опубликована тренировка (черновик клиент
   не видит — его тут нет); группа — одним аватаром. Времени занятия в данных нет, поэтому
   статус — только по действиям клиента: ok — выполнили (завершил в приложении) ·
   go — в процессе (записал часть результатов, не завершил) · todo — ещё не начинали. */
const ORDER = {go:0, todo:1, ok:2};
const doneToday = c => !!(STATE.ddone || {})[c.id + '@' + TODAY] || c.last === TODAY;
/* в процессе: есть результаты за сегодня; в демо — ещё двое клиентов с тренировкой на сегодня */
let GO_DEMO = null;
const goDemo = () => GO_DEMO || (GO_DEMO = new Set(CLIENTS.filter(c => c.prog && !grpByProg(c.prog) && !doneToday(c) && dayHas(cliDay(c.id, TODAY))).slice(1, 3).map(c => c.id)));
const goToday = c => !doneToday(c) && (Object.keys(STATE.res || {}).some(k => k.startsWith(c.id + '@' + TODAY + '#')) || (NEWTR ? !!c.demo : goDemo().has(c.id)));
function trainingToday(){
  const out = [];
  CLIENTS.forEach(c => {
    if(!c.prog || grpByProg(c.prog)) return;
    const p = program(c.prog); if(!p) return;
    const i = daysBetween(p.start, TODAY); if(i < 0) return;
    const x = cliPlan(c.prog)[i]; if(!x || !dayHas(x) || (x.draft && !x.pub)) return;
    out.push({c, pid:c.prog, i, title:x.title, st: doneToday(c) ? 'ok' : goToday(c) ? 'go' : 'todo'});
  });
  GRPS.forEach(G => {
    const gd = dayAt(G.prog, TODAY); if(!gd || !contentHas(gd.c) || (gd.rec && gd.rec.draft)) return;
    const x = cliPlan(G.prog)[gd.i] || {}, ms = G.members.map(client).filter(Boolean);
    const done = ms.filter(doneToday).length, go = ms.filter(goToday).length;
    out.push({c:G, pid:G.prog, i:gd.i, title:x.title || 'Тренировка группы', grp:true, done, n:G.members.length,
      st: ms.length && done === ms.length ? 'ok' : done || go ? 'go' : 'todo'});
  });
  return out.sort((a, b) => ORDER[a.st] - ORDER[b.st]);
}
/* Один главный сигнал клиента — для списка и карточки */
function signal(c){
  const fs = feeState(c);
  if(fs === 'closed') return {t:'Доступ закрыт', k:'rm', lv:0};
  if(fs === 'today') return {t:'Оплата сегодня', k:'warn', lv:1};
  if(fs === 'tomorrow') return {t:'Оплата завтра', k:'warn', lv:2};
  if(talkKeys().some(k => talkWaits(k) && (blkParse(k) || {}).cid === c.id)) return {t:'Вопрос', k:'blue', lv:3};
  if(!c.prog) return {t:'Нет программы', k:'gray', lv:4};
  if(!grpByProg(c.prog)){ const last = composedDays(c.prog) ? dayDate(c.prog, composedDays(c.prog) - 1) : null;
    const run = last ? daysBetween(TODAY, last) : -1;
    if(run < 0) return {t:'Программа кончилась', k:'rm', lv:5};
    if(run <= 2) return {t: run === 0 ? 'Составлено на сегодня' : `Составлено на ${run + 1} дн`, k:'warn', lv:5} }
  if(c.last && daysBetween(c.last, TODAY) >= 3) return {t:`Не тренируется ${daysBetween(c.last, TODAY)} дн`, k:'gray', lv:6};
  return null;
}
/* Подпись под именем: программа и докуда составлено */
function progLine(c){
  if(!c.prog) return [c.sport, c.level].filter(Boolean).join(' · ') || 'программа не назначена';
  const G = grpByProg(c.prog); if(G) return 'группа ' + G.n;
  const p = program(c.prog), n = composedDays(c.prog);
  return p.title + (n ? ' · до ' + dm(dayDate(c.prog, n - 1)) : '');
}
/* Первый несоставленный день — куда вести «Составить» */
function nextFree(id){
  const w = who(id); if(!w || !w.prog) return TODAY;
  const n = composedDays(w.prog), d = n ? addDays(dayDate(w.prog, n - 1), 1) : TODAY;
  return d < TODAY ? TODAY : d;
}

/* ═══════════ КАРКАС: шапка, вкладки, шторки ═══════════ */
/* Профиль — аватаром слева вверху «Сегодня»; базы и остальные разделы — во вкладке «Ещё» */
const TABS = [['today', 'Сегодня', I.home], ['calendar', 'Календарь', I.cal], ['clients', 'Клиенты', I.users], ['more', 'Ещё', I.dots]];
function tabbar(cur){
  const q = unseenN();
  return `<nav class="tabbar" aria-label="Разделы">${TABS.map(([k, n, ic]) =>
    k === 'more' ? `<button data-act="more" class="${k === cur ? 'on' : ''}" aria-haspopup="dialog">${ic}${n}</button>`
    : `<a href="#/${k}" class="${k === cur ? 'on' : ''}" aria-current="${k === cur ? 'page' : 'false'}">${ic}${n}${k === 'today' && q ? `<span class="badge">${q}</span>` : ''}</a>`).join('')}</nav>`;
}
const nav = (title, l = '', r = '') => `<header class="nav"><div class="nav-in"><div class="nav-l">${l}</div><h1>${title}</h1><div class="nav-r">${r}</div></div></header>`;
/* Единый выбор «чей» и «какой день» во всех шапках: имя клиента или группы ▾ — заголовком
   (шторка выбора с поиском), день ▾ — подписью под ним (шторка с месяцем и отметками). */
const whoT = (w, act, extra = '') => `<button class="who-t" data-act="${act}" ${extra} aria-label="${h(w.n)} — сменить">${h(w.n)}${I.down}</button>`;
/* публикация — глаз в шапке (просмотр и правка тренировки): оранжевый — клиент видит, серый перечёркнутый — черновик;
   значки те же, что у «Опубликовать / Скрыть» в календаре. Для VoiceOver — переключатель с подписью */
const eyeBtn = (on, act, lbl, extra = '') => `<button class="nb eye${on ? ' on' : ''}" role="switch" aria-checked="${on}" aria-label="${h(lbl)}" data-act="${act}" ${extra}><i>${on ? I.eye : I.eyeoff}</i></button>`;
/* день — значок календаря с числом в шапке тренировки (просмотр и правка), слева от глаза; нажатие — выбор дня.
   Число — день месяца (в нативном — SF Symbols «N.calendar»); полная дата — в подписи для VoiceOver */
const calBtn = (d, act, extra = '') => `<button class="nb cal" data-act="${act}" ${extra} aria-label="${h(dayLong(d))} — другой день"><svg viewBox="0 0 28 28" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="5.5" width="20" height="18.5" rx="4"/><path d="M9.5 3v4M18.5 3v4"/><text x="14" y="19.9" text-anchor="middle" font-size="11" font-weight="700" fill="currentColor" stroke="none">${+d.slice(8)}</text></svg></button>`;
const dateT = (d, act, extra = '') =>`<small><button class="date-t" data-act="${act}" ${extra} aria-label="${h(dayLong(d))} — другой день">${h(dayLong(d))}${I.down}</button></small>`;
function sheetDate(w, cur, onPick, title = 'Другой день'){
  let m = cur.slice(0, 7) + '-01';
  const body = () => { const m0 = new Date(m + 'T00:00:00'), start = monOf(m), nx = new Date(m0); nx.setMonth(nx.getMonth() + 1);
    const lastD = addDays(nx.getFullYear() + '-' + String(nx.getMonth() + 1).padStart(2, '0') + '-01', -1), n = daysBetween(start, addDays(monOf(lastD), 6)) + 1;
    let g = ''; for(let k = 0; k < n; k++){ const d = addDays(start, k), dt = new Date(d + 'T00:00:00'), st = w.prog ? dayState(w, d, dayInfo(w, d)) : 'rest';
      g += `<button class="gd${dt.getMonth() !== m0.getMonth() ? ' out' : ''}${d === TODAY ? ' today' : ''}${d === cur ? ' sel' : ''}" data-act="dpick" data-d="${d}" aria-label="${fmtDay(d)}"><b>${dt.getDate()}</b><span class="mk">${st === 'rest' ? '' : `<i class="${st}"></i>`}</span></button>` }
    return `<div class="mh"><b>${MONTHS_N[m0.getMonth()]} ${m0.getFullYear()}</b><div>${nb('dpick-m', I.back, 'Предыдущий месяц', 'data-k="-1"')}${nb('dpick-m', I.chev, 'Следующий месяц', 'data-k="1"')}</div></div>
      <div class="dow">${['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'].map(x => `<span>${x}</span>`).join('')}</div><div class="grid">${g}</div>` };
  const ov = sheet({id:'dpick', title, sub:w.n, body:`<div class="ed-cal">${body()}</div>`});
  ov._pick = d => { closeSheet(true); onPick(d) };
  ov._month = k => { const x = new Date(m + 'T00:00:00'); x.setMonth(x.getMonth() + k); m = x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-01'; ov.querySelector('.ed-cal').innerHTML = body() };
}
const nb = (act, icon, label, extra = '') => `<button class="nb" data-act="${act}" aria-label="${h(label)}" ${extra}>${icon}</button>`;

/* шторка: заголовок слева, ✕ справа, смахивается вниз за верх */
function sheet({id, title, sub = '', body, foot = ''}){
  closeSheet(true);
  const ov = document.createElement('div'); ov.className = 'ov'; ov.dataset.sheet = id;
  ov.innerHTML = `<div class="sheet" role="dialog" aria-modal="true" aria-label="${h(title)}"><div class="grab"></div>
    <div class="sh-h"><b>${h(title)}${sub ? `<small>${h(sub)}</small>` : ''}</b><button class="nb" data-act="close-sheet" aria-label="Закрыть">${I.x}</button></div>
    <div class="sh-b">${body}</div>${foot}</div>`;
  document.body.append(ov); root.classList.add('lock');
  requestAnimationFrame(() => ov.classList.add('on'));
  ov.addEventListener('click', e => { if(e.target === ov) closeSheet() });
  swipeDown(ov.querySelector('.sheet'), () => closeSheet());
  return ov;
}
function closeSheet(now){
  document.querySelectorAll('.ov').forEach(ov => { ov.classList.remove('on'); if(now) ov.remove(); else setTimeout(() => ov.remove(), 220) });
  root.classList.remove('lock');
}
function swipeDown(sh, done){
  let y0 = null, dy = 0;
  sh.addEventListener('touchstart', e => { const t = e.touches[0], top = sh.getBoundingClientRect().top; if(t.clientY - top > 64) return; y0 = t.clientY; dy = 0 }, {passive:true});
  sh.addEventListener('touchmove', e => { if(y0 == null) return; dy = Math.max(0, e.touches[0].clientY - y0); sh.style.transition = 'none'; sh.style.transform = `translateY(${dy}px)` }, {passive:true});
  sh.addEventListener('touchend', () => { if(y0 == null) return; y0 = null; sh.style.transition = ''; sh.style.transform = ''; if(dy > 90) done() });
}

/* ═══════════ ЭКРАН 1 · СЕГОДНЯ ═══════════ */
const STLBL = {go:'В процессе', todo:'Ещё не начинали', ok:'Выполнили'};
/* статус — значком на аватаре: выполнили ✓ · в процессе ▶; ещё не начинали — без значка */
const stMark = st => st === 'ok' ? I.check : st === 'go' ? I.play : '';
const stAva = (x, cls = '') => `<span class="ring">${ava(x.c, cls)}${x.st !== 'todo' ? `<i aria-hidden="true">${stMark(x.st)}</i>` : ''}</span>`;
function scrToday(){
  const tr = trainingToday(), done = tr.filter(x => x.st === 'ok').length;
  const strip = tr.map(x => `<button class="st ${x.st === 'todo' ? '' : x.st}" data-act="trainee" data-id="${x.c.id}" aria-label="${h(x.c.n)} — ${STLBL[x.st]}">
      ${stAva(x)}<s>${x.grp ? h(x.c.n) : h(first(x.c.n))}</s></button>`).join('');
  /* свёрнутая полоса: при прокрутке ленты встаёт под заголовок — кто требует внимания и счёт */
  const hot = tr.filter(x => x.st === 'go');
  const cnt = st => tr.filter(x => x.st === st).length;
  const facts = cnt('go') ? `<span class="mf go">${cnt('go')} в процессе</span>` : '';
  const mini = tr.length ? `<button class="mini" data-act="all" aria-label="Тренируются сегодня: выполнили ${done} из ${tr.length}" tabindex="-1">
      <span class="mav">${hot.slice(0, 3).map(x => `<span class="st ${x.st}">${stAva(x)}</span>`).join('')}</span>
      <span class="mt"><b>Выполнили ${done} из ${tr.length}</b>${facts ? `<small>${facts}</small>` : ''}</span>${I.chev}</button>` : '';
  const nNew = freshNow().size, f = APP.feed, fOn = f.types.size || f.per !== 'all';
  const ph = (STATE.profile || {}).photo;
  return nav('Сегодня', `<a class="nb" href="#/profile" aria-label="Профиль"><span class="me">${ph ? `<img src="${ph}" alt="">` : h(TRAINER.ini)}</span></a>`, nb('new', I.plus, 'Новая тренировка')).replace('</header>', mini + '</header>')
    + `<main class="scr gapbg mods">
      ${onbModule()}
      <section class="mod" id="tsec">
        <div class="mod-h"><b>Тренируются сегодня${tr.length ? `<s>${tr.length}</s>` : ''}</b>${tr.length ? `<button class="lnk" data-act="all">Все${I.chev}</button>` : ''}</div>
        ${tr.length ? `<div class="strip">${strip}</div>` : '<p class="muted" style="margin:0;padding:0 16px 4px">Сегодня тренировок нет</p>'}
      </section>
      <div class="sec-h"><b>События${nNew ? `<span class="pill acc">${nNew} ${plural3(nNew, 'новое', 'новых', 'новых')}</span>` : ''}</b>
        <button class="nb${fOn ? ' on' : ''}" data-act="filter" aria-label="Фильтр ленты${fOn ? ' — включён' : ''}">${I.filter}</button></div>
      ${feedHTML_()}
    </main>` + tabbar('today');
}
/* ═══════════ ПЕРВЫЕ ШАГИ — первый вход тренера (режим «новый тренер») ═══════════
   Тот же чек-лист, что на дашборде кабинета (onbSteps в ui.js): отметки ставятся по фактам
   из данных — тренировка дополнена, новая создана, рекорд добавлен, ссылка отправлена. Шаги
   ведут на экраны приложения. Модуль — первым на «Сегодня»; свернуть, а когда пройдено
   всё — убрать. */
/* шаг: заголовок, пояснение, кнопка */
const ONB_T = {reply:['Ответьте на вопрос демо-клиента', 'Он спросил про сегодняшнюю тренировку', 'Ответить'],
  cal:['Добавьте упражнение в демо-тренировку', 'Календарь → день → «Открыть» → «+ Упражнение»', 'В календарь'],
  compose:['Создайте тренировку демо-клиенту', 'Новая тренировка на свободный день', 'Создать'],
  pm:['Добавьте демо-клиенту рекорд', 'Карточка клиента → Рекорды', 'К клиенту'],
  invite:['Пригласите первого клиента', 'Сообщение со ссылкой — в мессенджер', 'Пригласить']};
function onbModule(){
  if(!NEWTR || onbState().hidden) return '';
  const o = onbState(), dk = talkKeys().find(k => { const p = blkParse(k); return p && p.cid === ONB_DEMO && p.date === TODAY && talkOf(k).some(m => m.who === 'client') });
  const replied = !!dk && talkOf(dk).some(m => m.who === 'trainer');
  const st = [{k:'reply', done: replied || !!o.all || !!o.demoGone, key:dk}, ...onbSteps()].filter(x => x.k !== 'reply' || x.key || x.done);
  const n = st.filter(x => x.done).length, all = n === st.length, next = st.find(x => !x.done), fold = !!o.fold && !all;
  const last = program('p1') && composedDays('p1') ? addDays(dayDate('p1', composedDays('p1') - 1), 1) : TODAY;
  const href = {cal:`#/calendar/${ONB_DEMO}`, compose:`#/edit/${ONB_DEMO}/${last < TODAY ? TODAY : last}`, pm:`#/client/${ONB_DEMO}`};
  /* карточка шага в горизонтальной ленте: сначала невыполненные (следующий — первым), пройденные — в конце */
  const card = x => { const i = st.indexOf(x), [t, s, b] = ONB_T[x.k] || [x.n, '', 'Открыть'], cls = `ocard${x.done ? ' done' : ''}${x === next ? ' next' : ''}`;
    const inner = `<span class="oc-h"><span class="ock">${x.done ? I.check : i + 1}</span><b>${h(t)}</b></span><s>${x.done ? 'Готово' : h(s)}</s>${x.done ? '' : `<span class="cbtn">${b}</span>`}`;
    return x.done ? `<div class="${cls}">${inner}</div>` : href[x.k] ? `<a class="${cls}" href="${href[x.k]}">${inner}</a>`
      : x.k === 'reply' ? `<button class="${cls}" data-act="reply" data-key="${h(x.key)}">${inner}</button>` : `<button class="${cls}" data-act="invite">${inner}</button>` };
  const order = [...st.filter(x => !x.done), ...st.filter(x => x.done)];
  return `<section class="mod onbm${all ? ' fin' : ''}">
    <div class="mod-h"><b>${all ? 'Все шаги пройдены' : 'Первые шаги'}<s>${n} из ${st.length}</s></b>
      <button class="lnk" data-act="${all ? 'onb-hide' : 'onb-fold'}" aria-expanded="${!fold}">${all ? 'Убрать' : fold ? 'Показать' : 'Свернуть'}</button></div>
    <div class="obar" role="progressbar" aria-valuemin="0" aria-valuemax="${st.length}" aria-valuenow="${n}" aria-label="Пройдено шагов">${st.map(x => `<i class="${x.done ? 'on' : ''}"></i>`).join('')}</div>
    ${all ? `<p class="onb-fin">Основное освоено. Демо Клиент остаётся — на нём можно пробовать новое, клиенты его не видят.</p>`
      : fold ? '' : `<div class="ocar">${order.map(card).join('')}</div>`}
  </section>`;
}
/* Лента приложения — события кабинета без «Программы» («тренировки кончаются через N дней»):
   решение 14.11 — неинформативно; запас тренировок виден в «Клиентах» и в календаре. */
/* «Результат» — отдельное событие на каждого клиента, закрывшего тренировку (за последние
   дни — по данным; кабинетные «результаты» с лимитом в четыре заменяются этими).
   «Не закрыли» — утром следующего дня: одно событие со списком тех, кто вчерашнюю
   тренировку не закрыл. */
const FEED_DAYS = 3;
const APP_ORDER = {q:0, unclosed:1, fee:2, new:3, pr:4, miss:5, qa:6, start:7, done:8, pay:9};
const hadWorkout = (c, d) => { const x = cliDay(c.id, d); return !!(x && x.blocks && x.blocks.length) };
function resultEvents(){
  const out = [];
  for(let k = 0; k < FEED_DAYS; k++){ const d = addDays(TODAY, -k);
    CLIENTS.forEach(c => { if(hadWorkout(c, d) && (d === TODAY ? doneToday(c) : dayDoneBy(c.id, d)))
      out.push({t:'done', d, c, id:'done|' + c.id + '|' + d, title:c.n}) }) }
  return out;
}
function unclosedEvents(){
  const out = [];
  for(let k = 0; k < FEED_DAYS; k++){ const d = addDays(TODAY, -k), y = addDays(d, -1);
    const cs = CLIENTS.filter(c => hadWorkout(c, y) && !dayDoneBy(c.id, y));
    if(cs.length) out.push({t:'unclosed', d, of:y, cs, id:'unclosed|' + y, title:'Не закрыли тренировку'}) }
  return out;
}
/* Первый вход: у аккаунта нет истории — в ленте только сегодняшнее и только то, что
   касается демо-клиента: он подключился, задал вопрос к сегодняшней тренировке, потом —
   результат. Ни оплат, ни «Отвечено» за прошлые дни, ни «Не закрыли». */
const NEW_TYPES = new Set(['q', 'qa', 'new', 'done', 'start']);
const demoNew = () => { const c = CLIENTS.find(x => x.demo); return c ? [{t:'new', d:TODAY, c, id:'new|' + c.id + '|demo', title:c.n, demo:true}] : [] };
const appFeed = () => (NEWTR
    ? feedEvents().filter(e => e.d >= TODAY && NEW_TYPES.has(e.t) && e.t !== 'done' && e.t !== 'new').concat(demoNew(), resultEvents().filter(e => e.d >= TODAY))
    : feedEvents().filter(e => e.t !== 'prog' && e.t !== 'done').concat(resultEvents(), unclosedEvents()))
  .sort((a, b) => b.d.localeCompare(a.d) || (APP_ORDER[a.t] ?? 9) - (APP_ORDER[b.t] ?? 9));
/* Новые события. Просмотренным событие становится, когда его карточка побыла на экране
   (STATE.appSeen); точка у него гаснет при следующем открытии «Сегодня», а не сразу —
   иначе пропадала бы прямо под взглядом. Бейдж вкладки — сколько ещё не видели.
   Первый запуск: всё, что раньше сегодняшнего дня, считаем просмотренным. */
const seenSet = () => { if(!STATE.appSeen || !STATE.appSeenFrom){ STATE.appSeen ||= []; STATE.appSeenFrom = TODAY; saveState() } return new Set(STATE.appSeen) };
const isSeen = (s, e) => e.d < STATE.appSeenFrom || s.has(e.id);
let NEWSET = null;
const freshNow = () => NEWSET || (NEWSET = (s => new Set(appFeed().filter(e => !isSeen(s, e)).map(e => e.id)))(seenSet()));
const unseenN = () => { const s = seenSet(); return appFeed().filter(e => !isSeen(s, e)).length };
function markSeen(ids){
  const s = seenSet(), add = ids.filter(id => id && !s.has(id)); if(!add.length) return;
  STATE.appSeen.push(...add); saveState();
  const a = document.querySelector('.tabbar a[href="#/today"]'); if(!a) return;
  const n = unseenN(); let b = a.querySelector('.badge');
  if(!n){ if(b) b.remove() } else { if(!b){ b = document.createElement('span'); b.className = 'badge'; a.append(b) } b.textContent = n }
}
let SEEN_IO = null;
const EIDSEP = '§§';     /* в id события есть пробелы и «|» — склеенную карточку делим этим */
function watchSeen(){
  if(SEEN_IO) SEEN_IO.disconnect(); if(!('IntersectionObserver' in window)) return;
  const tm = new Map();
  SEEN_IO = new IntersectionObserver(es => es.forEach(en => { const el = en.target;
    if(en.isIntersecting){ tm.set(el, setTimeout(() => { markSeen(el.dataset.eid.split(EIDSEP)); SEEN_IO && SEEN_IO.unobserve(el) }, 700)) }
    else { clearTimeout(tm.get(el)); tm.delete(el) } }), {threshold:.6});
  document.querySelectorAll('.card[data-eid]').forEach(el => SEEN_IO.observe(el));
}
const PER = [['all', 'Всё время'], ['day', 'Сегодня'], ['week', '7 дней'], ['month', '30 дней']];
function feedList(){
  const f = APP.feed, from = {day:TODAY, week:addDays(TODAY, -6), month:addDays(TODAY, -29)}[f.per];
  return appFeed().filter(e => (!f.types.size || f.types.has(e.t)) && (!from || e.d >= from));
}
function feedHTML_(){
  const list = feedList(); if(!list.length) return `<div class="empty"><b>Тихо</b>Событий по фильтру нет</div>`;
  const fresh = freshNow();
  let html = '', day = null;
  list.forEach(e => { if(e.d !== day){ day = e.d; html += `<div class="day">${dayWord(e.d)}${e.d === TODAY || e.d === addDays(TODAY, -1) ? ' · ' + humanDate(e.d) : ''}</div>` }
    html += card(e, !!(e.id && fresh.has(e.id))) });
  return html;
}
const TL = {q:'Вопрос', qa:'Отвечено', pr:'Рекорд', miss:'Пропуск', unclosed:'Не закрыли', prog:'Программа', fee:'Оплата', new:'Новый клиент', start:'Первые шаги', done:'Результат', pay:'Подписка'};
/* метка типа: значок + слово на светлой подложке; цвет — смысл, единый по приложению */
const TK = {q:'blue', qa:'blue', fee:'warn', pr:'acc', start:'acc', miss:'rm', unclosed:'rm', new:'ok', done:'ok', prog:'gray', pay:'gray'};
const TI = {q:I.msg, qa:I.msg, fee:I.wallet, pr:I.trophy, start:I.star, miss:I.clock, unclosed:I.x, new:I.users, done:I.check, prog:I.cal, pay:I.wallet};
const tag = t => `<span class="tag ${TK[t] || 'gray'}">${(TI[t] || '').replace('<svg', '<svg aria-hidden="true"')}${TL[t]}</span>`;
const urlp = (href, k) => { try{ return new URL(href, location.href).searchParams.get(k) }catch(_){ return null } };
const plain = s => String(s || '').replace(/<[^>]+>/g, '');
/* Карточка одного формата: шапка (аватар, имя, одна серая строка, метка типа) · одна-две
   фразы текстом · одно действие. Где тренеру нужно действовать — мягкая кнопка, где для
   сведения — ссылка. Цифры живут в тексте, а не отдельными плитками разных кеглей. */
function card(e, fresh){
  const dot = fresh ? '<i class="dot" aria-label="новое"></i>' : '';
  const btn = (attrs, t) => `<button class="cbtn" ${attrs}>${t}</button>`, abtn = (href, t) => `<a class="cbtn" href="${href}">${t}</a>`;
  const lnk = (href, t) => `<a class="clnk" href="${href}">${t}${I.chev}</a>`;
  if(e.t === 'unclosed'){
    const cs = e.cs, names = cs.slice(0, 2).map(c => first(c.n)).join(', ') + (cs.length > 2 ? ` и ещё ${cs.length - 2}` : '');
    return `<article class="card" data-eid="${h(e.id)}"><div class="ch"><div class="stack">${cs.slice(0, 3).map(c => ava(c)).join('')}</div>
      <div class="t"><b>${dot}${h(names)}</b><s>тренировка ${e.of === addDays(TODAY, -1) ? 'вчера' : fmtDay(e.of)}</s></div>${tag('unclosed')}</div>
      <p>${cs.length} ${plural3(cs.length, 'клиент не закрыл', 'клиента не закрыли', 'клиентов не закрыли')} тренировку за ${e.of === addDays(TODAY, -1) ? 'вчера' : fmtDay(e.of)}.</p>
      <div class="cacts">${btn(`data-act="unclosed" data-d="${e.of}"`, 'Посмотреть список')}</div></article>`;
  }
  const c = e.c, nm = c ? c.n : (e.t === 'pay' ? 'Тренерграм' : e.title);
  const av = e.t === 'pay' ? '<span class="sys">ТМ</span>' : ava(c);
  const txt = String(e.tx || ''), cl = c && !c.members ? `#/client/${c.id}` : c ? `#/group/${c.id}` : null;
  let meta = '', body = '', act = '';
  switch(e.t){
    case 'q': case 'qa': { const t = e.key ? talkOf(e.key) : [], m = t.filter(x => x.who === 'client').pop(), ans = e.t === 'qa' ? t[t.length - 1] : null;
      meta = [e.sub, m && m.at ? (m.d === TODAY ? m.at : dayWord(m.d).toLowerCase() + ', ' + m.at) : ''].filter(Boolean).join(' · ');
      body = `<blockquote>${h(m ? m.text : plain(txt))}</blockquote>${ans && ans.who === 'trainer' ? `<p class="ans">Вы: ${h(ans.text)}</p>` : ''}`;
      act = e.t === 'q' ? btn(`data-act="reply" data-key="${h(e.key)}"`, 'Ответить') : `<button class="clnk" data-act="reply" data-key="${h(e.key)}">Обсуждение${I.chev}</button>`; break; }
    case 'pr': { const p = c && c.pr;
      meta = p ? (PMNAMES[p.ex] || p.ex) + ' · 1ПМ' : 'рекорд';
      body = p ? `<p>${fmtNum(p.v)} кг — на ${fmtNum(p.v - p.prev)} кг больше прежнего. Проценты в программе пересчитаны.</p>` : `<p>${txt}</p>`;
      act = cl ? lnk(cl, 'Открыть клиента') : ''; break; }
    case 'fee': { const st = c && feeState(c);
      meta = c ? [c.feeAmt ? rubs(c.feeAmt) : '', c.paidUntil ? 'оплачено до ' + dm(c.paidUntil) : ''].filter(Boolean).join(' · ') : '';
      body = `<p>${e.gone ? plain(txt).replace(/ · [\d\s ]+₽/, '') : {tomorrow:'Оплата заканчивается завтра.', today:'Сегодня последний оплаченный день — с завтра новые тренировки закроются.', closed:'Оплата закончилась — новые тренировки клиенту закрыты.'}[st] || plain(txt)}</p>`;
      act = e.gone || !c ? '' : btn(`data-act="fee" data-id="${c.id}"`, 'Получил оплату'); break; }
    case 'prog': { const who_ = urlp(e.href, 'client') || urlp(e.href, 'group'), d = urlp(e.href, 'date') || TODAY, pt = (plain(txt).match(/«([^»]+)»/) || [])[1];
      meta = pt ? '«' + pt + '»' : 'программа'; body = `<p>${plain(txt).replace(/ «[^»]+»/, '')}</p>`;
      act = who_ && !e.gone ? abtn(`#/edit/${who_}/${d}`, 'Составить') : ''; break; }
    case 'miss': meta = c && c.last ? 'заходил ' + ago(c.last) : 'пропуск'; body = `<p>${plain(txt)}</p>`;
      act = c && !c.members ? btn(`data-act="contact" data-id="${c.id}"`, 'Написать') : ''; break;
    case 'new': if(e.demo){ meta = 'по вашей ссылке';
        body = '<p>Это демо-клиент: на нём можно пробовать всё — настоящие клиенты его не видят. У него уже есть программа и тренировка на сегодня.</p>';
        act = cl ? lnk(cl, 'Открыть клиента') : ''; break }
      meta = c ? [c.sport, c.level].filter(Boolean).join(' · ') || 'по вашей ссылке' : ''; body = `<p>${plain(txt)}</p>`;
      act = c ? abtn(`#/edit/${c.id}/${TODAY}`, 'Составить первую тренировку') : ''; break;
    case 'start': meta = '«' + ((plain(txt).match(/«([^»]+)»/) || [])[1] || 'Первые шаги') + '»'; body = `<p>${plain(txt).replace(/: .*$/, '').replace(/ и получила? достижение «[^»]+»/, '')}.</p>`;
      act = cl ? lnk(cl, 'Открыть клиента') : ''; break;
    case 'done': { const x = c ? cliDay(c.id, e.d) : null, she = c && c.sex === 'ж';
      meta = x ? '«' + x.title + '»' : 'тренировка';
      body = `<p>${she ? 'Закрыла' : 'Закрыл'} тренировку${e.d === TODAY ? '' : ' за ' + fmtDay(e.d)}.</p>`;
      act = c ? lnk(`#/workout/${c.id}/${e.d}`, 'Посмотреть результат') : ''; break; }
    case 'pay': meta = 'подписка на сервис'; body = `<p>${plain(txt)}</p>`; act = lnk('#/profile', 'Подписка'); break;
    default: meta = ''; body = `<p>${plain(txt)}</p>`;
  }
  return `<article class="card${e.gone ? ' gone' : ''}"${e.id ? ` data-eid="${h(e.id)}"` : ''}><div class="ch">${cl ? `<a href="${cl}" aria-label="${h(nm)}">${av}</a>` : av}
      <div class="t"><b>${dot}${h(nm)}</b>${meta ? `<s>${h(meta)}</s>` : ''}</div>${tag(e.t)}</div>${body}${act ? `<div class="cacts">${act}</div>` : ''}</article>`;
}
/* «Не закрыли тренировку» — список за день: открыть тренировку или написать клиенту */
function sheetUnclosed(d){
  const cs = CLIENTS.filter(c => hadWorkout(c, d) && !dayDoneBy(c.id, d));
  const body = cs.map(c => `<a class="row" href="#/workout/${c.id}/${d}">${ava(c)}<span class="t"><b>${h(c.n)}</b><s>«${h(cliDay(c.id, d).title)}»</s></span>${I.chev.replace('<svg', '<svg class="chev"')}</a>`).join('') || '<div class="empty">Все закрыли тренировку</div>';
  sheet({id:'unclosed', title:'Не закрыли тренировку', sub:(d === addDays(TODAY, -1) ? 'Вчера' : cap(fmtDay(d))) + ' · ' + cs.length, body});
}
const cap = s => s ? s[0].toUpperCase() + s.slice(1) : s;
/* рекорды клиента — 1ПМ по упражнениям; проценты в тренировках пересчитываются от них */
function sheetPM(id){
  const c = client(id); if(!c) return; const pm = pmOf(id);
  const keys = [...new Set([...Object.keys(pm).filter(k => pm[k]), ...Object.keys(PMNAMES)])];
  const body = `<div class="sh-p pmf">${keys.map(k => `<label class="pmr"><span>${h(pmName(k))}</span>
      <input inputmode="decimal" data-pmk="${k}" value="${pm[k] ? fmtNum(pm[k]) : ''}" placeholder="—" aria-label="${h(pmName(k))}, 1ПМ, кг" autocomplete="off"><i>кг</i></label>`).join('')}
    <p class="ed-note" style="margin-top:12px">1ПМ — максимальный вес на один повтор. Проценты в тренировках ${h(first(c.n))} пересчитаются от нового значения.</p></div>`;
  const ov = sheet({id:'pm', title:'Рекорды', sub:c.n + ' · 1ПМ', body, foot:'<div class="sh-f"><button class="btn" data-act="close-sheet">Готово</button></div>'});
  ov.querySelectorAll('[data-pmk]').forEach(inp => inp.addEventListener('change', () => {
    const k = inp.dataset.pmk, v = parseFloat(inp.value.replace(',', '.'));
    if(!isFinite(v) || v <= 0){ delete pm[k] } else { pm[k] = v; ((c.hist ||= {})[k] ||= []).push([TODAY, v]) }
    saveState(); repaint(); say(isFinite(v) && v > 0 ? `1ПМ «${pmName(k)}» — ${fmtNum(v)} кг` : 'Рекорд убран') }));
}
/* шторка «Тренируются сегодня» — все, по разделам */
function sheetAll(){
  const tr = trainingToday(), secs = ['go', 'todo', 'ok'];
  const sub = x => x.grp ? `${x.done} из ${x.n} участников выполнили` : h(x.title);
  const body = secs.map(s => { const xs = tr.filter(x => x.st === s); if(!xs.length) return '';
    return `<div class="cap" style="color:${s === 'ok' ? 'var(--ok)' : s === 'go' ? 'var(--acc-t)' : 'var(--tx2)'}">${STLBL[s]} · ${xs.length}</div>`
      + xs.map(x => `<button class="row" data-act="trainee" data-id="${x.c.id}"><span class="st ${s === 'todo' ? '' : s}" aria-hidden="true">${stAva(x)}</span>
          <span class="t"><b>${h(x.c.n)}</b><s>${sub(x)}</s></span>${I.chev.replace('<svg', '<svg class="chev"')}</button>`).join('');
  }).join('') || '<div class="empty">Сегодня тренировок нет</div>';
  sheet({id:'all', title:'Тренируются сегодня', sub:`${tr.filter(x => x.st === 'ok').length} из ${tr.length} выполнили`, body});
}
function sheetFilter(){
  const f = APP.feed, all = appFeed();
  const body = `<div class="cap">Период</div><div class="chips" style="padding-top:0">${PER.map(([k, n]) => `<button class="chip${f.per === k ? ' on' : ''}" data-act="per" data-k="${k}">${n}</button>`).join('')}</div>
    <div class="cap">События</div>${Object.keys(TL).map(t => { const n = all.filter(e => e.t === t).length; if(!n) return '';
      return `<button class="opt${f.types.has(t) ? ' on' : ''}" data-act="type" data-k="${t}"><span class="box">${I.check}</span>${TYPES[t] || TL[t]}<span class="n">${n}</span></button>` }).join('')}
    <div class="sh-p" style="display:flex;gap:8px"><button class="btn o" data-act="feed-reset">Сбросить</button><button class="btn" data-act="close-sheet">Показать</button></div>`;
  sheet({id:'filter', title:'Фильтр ленты', sub: f.types.size ? `Выбрано: ${f.types.size}` : 'Все события', body});
}
function sheetReply(key){
  const p = blkParse(key), c = p && client(p.cid); if(!c) return;
  const b = cliDay(c.id, p.date).blocks[p.bi], t = talkOf(key);
  const body = `<div class="chat">${t.map(m => `<div class="bub ${m.who === 'trainer' ? 'me' : 'cl'}"><small>${m.who === 'trainer' ? 'Вы' : h(first(c.n))} · ${h(talkWhen(m))}</small>${h(m.text)}</div>`).join('')}</div>
    <div class="reply-go"><a class="clnk" href="#/workout/${c.id}/${p.date}">Перейти в тренировку${I.chev}</a></div>`;
  const foot = `<form class="reply" data-act-form="send" data-key="${h(key)}"><textarea rows="1" placeholder="Ответ клиенту" aria-label="Ответ клиенту"></textarea><button type="submit" aria-label="Отправить">${I.send}</button></form>`;
  sheet({id:'reply', title:c.n, sub:(b ? blockName(b) + ' · ' : '') + dayWord(p.date), body, foot});
}
function sheetFee(id){
  const c = client(id); if(!c) return; const nx = feeNext(c);
  const body = `<div class="sh-p">
      <div class="kv" style="margin-bottom:16px"><div><s>Оплачено до</s><b>${c.paidUntil ? humanDate(c.paidUntil) : 'не задано'}</b></div><div><s>Статус</s><b style="font-size:16px">${(signal(c) || {t:'всё в порядке'}).t}</b></div></div>
      <label class="field"><span>Сумма, ₽</span><input id="fAmt" inputmode="numeric" value="${c.feeAmt || ''}" placeholder="6000"></label>
      <label class="field"><span>Новый срок — оплачено до</span><input id="fUntil" type="date" value="${nx.until}"></label>
      <p class="muted small" style="margin:-4px 0 16px">Срок продлится с ${humanDate(nx.from)} на месяц — дату можно поправить. Тренировки клиента откроются сразу.</p>
      <button class="btn" data-act="fee-save" data-id="${c.id}">Получил оплату</button></div>`;
  sheet({id:'fee', title:'Оплата занятий', sub:c.n, body});
}
function sheetContact(id){
  const c = client(id); if(!c) return;
  const tel = (c.phone || '').replace(/[^\d+]/g, '');
  const body = `${tel ? `<a class="opt" href="tel:${tel}">${I.phone.replace('<svg', '<svg width="22" height="22"')}Позвонить<span class="n">${h(c.phone)}</span></a>` : ''}
    ${c.tg ? `<a class="opt" href="https://t.me/${h(c.tg.replace('@', ''))}" target="_blank" rel="noopener">${I.plane.replace('<svg', '<svg width="22" height="22"')}Telegram<span class="n">${h(c.tg)}</span></a>` : ''}
    <button class="opt" data-act="max">${I.msg.replace('<svg', '<svg width="22" height="22"')}Max<span class="n">${h(c.max || 'нет')}</span></button>`;
  sheet({id:'contact', title:'Написать', sub:c.n, body});
}
/* новая тренировка: кому → конструктор на первый свободный день */
function sheetPick(id, title, onPick){
  const list = q => { const n = norm(q || '');
    const gs = GRPS.filter(g => !n || norm(g.n).includes(n)), cs = CLIENTS.filter(c => !n || norm(c.n).includes(n));
    return (gs.length ? '<div class="cap">Группы</div>' + gs.map(g => `<button class="row" data-act="pick" data-id="${g.id}">${ava(g)}<span class="t"><b>${h(g.n)}</b><s>${h(clientProgSub(g))}</s></span></button>`).join('') : '')
      + '<div class="cap">Клиенты</div>' + cs.map(c => `<button class="row" data-act="pick" data-id="${c.id}">${ava(c)}<span class="t"><b>${h(c.n)}</b><s>${h(progLine(c))}</s></span></button>`).join('') };
  const ov = sheet({id, title, body:`<div class="search" style="margin:12px 16px">${I.search}<input placeholder="Клиент или группа" aria-label="Поиск"></div><div class="pl">${list('')}</div>`});
  const inp = ov.querySelector('input'), pl = ov.querySelector('.pl');
  inp.addEventListener('input', () => { pl.innerHTML = list(inp.value) });
  ov._pick = onPick;
}

/* ═══════════ ЭКРАН 2 · КАЛЕНДАРЬ ═══════════ */
function dayInfo(w, date){
  const p = program(w.prog); if(!p) return null;
  const i = daysBetween(p.start, date); if(i < 0 || i >= planLength(w.prog)) return null;
  const x = cliPlan(w.prog)[i]; if(!x) return null;
  const st = x.comp ? 'comp' : !dayHas(x) ? 'rest' : x.draft ? 'draft' : 'pub';
  const nb_ = (x.blocks || []).filter(blockHas).length;
  let done = null;
  if(st !== 'rest' && date < TODAY){
    if(w.members){ done = w.members.filter(id => dayDoneBy(id, date)).length }
    else done = dayDoneBy(w.id, date);
  }
  return {i, x, st, title:x.title, nb:nb_, done};
}
/* Календарь — под два сценария тренера: найти прошлую тренировку и скопировать;
   посмотреть чью-то тренировку. Сетка — две недели (⌄ — месяц целиком), под ней превью
   выбранного дня: статус словами, сводка блоков, «Открыть» и «Копировать». Несколько
   дней — долгим нажатием на день (копировать, опубликовать, скрыть). После «Копировать»
   календарь сразу в режиме вставки: одна тренировка — в любые дни касаниями, несколько —
   с выбранного первого дня с теми же промежутками; клиента в заголовке можно сменить —
   так копируют другому. Копии — черновики, как в кабинете: клиент их не видит до публикации. */
const monOf = d => addDays(d, -((new Date(d + 'T00:00:00').getDay() + 6) % 7));
const ST_W = {pub:['Опубликована', 'acc'], draft:['Черновик', 'gray'], done:['Выполнена', 'ok'], miss:['Пропущена', 'rm'], comp:['Соревнование', 'blue']};
/* Отметки дня — три цвета (решение 14.11): зелёная — выполнена, красная — пропущена,
   оранжевая — опубликована; черновик — оранжевый контур (клиент его не видит).
   Соревнование отдельным цветом не выделяется: впереди — как опубликованная, прошло — выполнена. */
function dayState(w, d, inf){
  if(!inf || inf.st === 'rest') return 'rest';
  if(inf.st === 'comp') return d < TODAY ? 'done' : 'pub';
  if(d < TODAY) return inf.done ? 'done' : 'miss';
  return inf.st;
}
const dayLong = d => d === TODAY ? 'Сегодня, ' + fmtDay(d).split(', ')[1] : d === addDays(TODAY, -1) ? 'Вчера, ' + fmtDay(d).split(', ')[1] : d === addDays(TODAY, 1) ? 'Завтра, ' + fmtDay(d).split(', ')[1] : cap(fmtDay(d));
function calCells(w){
  const C = APP.cal;
  let start, n;
  if(C.full){ const m1 = C.view.slice(0, 7) + '-01', nx = new Date(m1 + 'T00:00:00'); nx.setMonth(nx.getMonth() + 1);
    const last = addDays(nx.getFullYear() + '-' + String(nx.getMonth() + 1).padStart(2, '0') + '-01', -1);
    start = monOf(m1); n = daysBetween(start, addDays(monOf(last), 6)) + 1 }
  else { start = monOf(C.view); n = 14 }
  const paste = C.mode === 'paste', selm = C.mode === 'sel', mo = C.view.slice(0, 7);
  let g = '';
  for(let k = 0; k < n; k++){
    const d = addDays(start, k), dt = new Date(d + 'T00:00:00'), inf = dayInfo(w, d), st = dayState(w, d, inf);
    const cls = ['gd', C.full && d.slice(0, 7) !== mo ? 'out' : '', d === TODAY ? 'today' : '',
      !C.mode && d === C.sel ? 'sel' : '', selm && C.picked.has(d) ? 'pk' : '', paste && C.targets.has(d) ? 'trg' : '', paste && d < TODAY ? 'off' : ''].filter(Boolean).join(' ');
    g += `<button class="${cls}" data-act="cal-day" data-d="${d}" aria-label="${fmtDay(d)}${st !== 'rest' ? ' · ' + ST_W[st][0].toLowerCase() : ''}"${C.mode ? ` aria-pressed="${selm ? C.picked.has(d) : C.targets.has(d)}"` : ''}><b>${dt.getDate()}</b><span class="mk">${st === 'rest' ? '' : `<i class="${st}"></i>`}</span></button>`;
  }
  const a = start, z = addDays(start, n - 1), ma = new Date(a + 'T00:00:00'), mz = new Date(z + 'T00:00:00');
  const label = C.full ? MONTHS_N[new Date(C.view + 'T00:00:00').getMonth()] + ' ' + new Date(C.view + 'T00:00:00').getFullYear()
    : ma.getMonth() === mz.getMonth() ? MONTHS_N[ma.getMonth()] + ' ' + ma.getFullYear() : MONTHS_N[ma.getMonth()] + ' – ' + MONTHS_N[mz.getMonth()].toLowerCase() + ' ' + mz.getFullYear();
  return {g, label};
}
/* Превью тренировки — в формате просмотра клиентского приложения (client/assets/screens.js:
   clBlockBody): название блока над карточкой, в карточке строки «5×3 Приседания со штангой
   120 кг» — схема впереди, нагрузка после названия; группы (настройка комплекса, сет с
   кругами и отдыхом, текст) разделены линией. Тренер видит ровно то, что увидит клиент;
   у группы вместо веса — проценты (вес у каждого свой). */
function pvLoad(it, pm){ if(it.pct != null){ const kg = kgText(it, pm); return kg ? kg + '\u00a0кг' : loadText(it) } return it.val ? loadText(it) : '' }
function pvPart(it, pm){ const e = it.exId ? byId(it.exId) : null, name = e ? e.ru : String(it.raw || '');
  if(!e) return h(name); if(it.txt) return h(name + ' — ' + it.txt);
  return h([it.scheme, name, pvLoad(it, pm)].filter(Boolean).join(' ')) }
function pvChain(it, pm){ const prm = [pvLoad(it, pm), chainScheme(it)].filter(Boolean).join(' — ');
  return h(chainNames(it) + (prm ? ':' : '')) + (prm ? ' <span class="nw">' + h(prm) + '</span>' : '') }
const pvLine = (it, pm) => `<div class="xl">${it.chain ? pvChain(it, pm) : pvPart(it, pm)}</div>`;
function pvBody(b, pm){
  const seg = [], fmt = b.fmt && typeof b.fmt === 'object' ? b.fmt : null;
  if(fmt) seg.push(`<div class="xl">${h(fmtLabel(fmt) + ' — ' + fmtDesc(fmt))}</div>`);
  if(isTextBlock(b)){ seg.push(textLines(b.text).map(l => `<div class="xl">${h(l)}</div>`).join('')); return seg }
  let run = '', k = 0; const its = b.items || [];
  const flush = () => { if(run){ seg.push(run); run = '' } };
  while(k < its.length){
    if(its[k].ss){ const hd = its[k], j = ssEnd(its, k), mem = its.slice(k + 1, j).filter(itemHas);
      if(mem.length){ flush(); seg.push(`<div class="xl">${hd.rounds} ${plural3(+hd.rounds, 'круг', 'круга', 'кругов')}:</div>` + mem.map(x => pvLine(x, pm)).join('') + (hd.rest ? `<div class="xl">Отдых ${h(hd.rest)} между кругами</div>` : '')) }
      k = j; continue }
    if(itemHas(its[k])) run += pvLine(its[k], pm);
    k++;
  }
  flush(); return seg;
}
/* Тренировка дня — одной карточкой: шапка (дата, статус, название, действия), сообщение
   клиенту и блоки внутри той же карточки через линию. Блок — как в клиентском приложении:
   название 17 pt со стрелкой (сворачивает), под ним строки «схема упражнение вес». */
function dayPreview(w, d){
  const C = APP.cal, inf = dayInfo(w, d), st = dayState(w, d, inf);
  const head = `<div class="pv-h"><span>${h(dayLong(d))}</span>${st !== 'rest' ? `<span class="tag ${ST_W[st][1]}">${ST_W[st][0]}</span>` : ''}</div>`;
  if(st === 'rest') return `<section class="mod pv">${head}<h3 class="muted">${inf ? 'Отдых' : 'Тренировок нет'}</h3>
    <div class="pv-a"><a class="btn s" href="#/edit/${w.id}/${d}">${I.plus}Создать тренировку</a></div></section>`;
  const bs = inf.x.blocks.filter(blockHas), past = d < TODAY, pm = w.members ? {} : pmOf(w.id);
  const msg = (((TALK.workout[talkKey(w.id, d)] || []).find(m => m.who === 'trainer')) || {}).text || '';
  const grp = w.members && past ? `<p class="pv-n">Выполнили ${inf.done || 0} из ${w.members.length}</p>` : '';
  const open = past && !w.members ? `#/workout/${w.id}/${d}` : `#/edit/${w.id}/${d}`;
  /* блоки по умолчанию свёрнуты: видна структура дня; «Развернуть все» — одним нажатием */
  const keys = bs.map((b, i) => w.id + '|' + d + '|' + i), allOpen = keys.length && keys.every(k => C.open.has(k));
  const exN = b => (b.items || []).reduce((a, it) => a + (it.ss || !itemHas(it) ? 0 : it.chain ? (it.parts || []).filter(partHas).length : 1), 0);
  const blocks = bs.map((b, i) => { const key = keys[i], shut = !C.open.has(key), nm = blockName(b) || 'Блок', n = exN(b);
    /* коротко «5 упр.» — длинное название блока не переносится из-за счётчика; полностью — для VoiceOver */
    const full = isTextBlock(b) ? 'блок текстом' : n + ' ' + plural3(n, 'упражнение', 'упражнения', 'упражнений'), cnt = isTextBlock(b) ? 'текстом' : n + '\u00a0упр.';
    return `<div class="pvk${shut ? ' shut' : ''}"><button class="pvk-h" data-act="cal-blk" data-k="${h(key)}" aria-expanded="${!shut}" aria-label="${h(nm)}, ${full}"><b>${h(nm)}</b>${I.down}${shut ? `<span aria-hidden="true">${cnt}</span>` : ''}</button>
      ${shut ? '' : `<div class="pvk-c">${pvBody(b, pm).map(x => `<div class="pvs">${x}</div>`).join('')}</div>`}</div>` }).join('');
  return `<section class="mod pv">${head}<h3>${h(inf.title || 'Тренировка')}</h3>${grp}
      <div class="pv-a"><a class="btn s" href="${open}">${past && !w.members ? 'Посмотреть' : 'Открыть'}</a><button class="btn s o" data-act="cal-copy" data-d="${d}">${I.copy}Копировать</button></div>
      ${msg ? `<div class="pv-msg"><b>${I.msg}Сообщение ${w.members ? 'группе' : 'клиенту'}</b><p>${h(msg)}</p></div>` : ''}
      <div class="pv-w"><div class="pv-wh"><span>${bs.length} ${plural3(bs.length, 'блок', 'блока', 'блоков')}</span><button class="lnk" data-act="cal-all" data-k="${h(keys.join('§'))}">${allOpen ? 'Свернуть все' : 'Развернуть все'}</button></div>${blocks}</div></section>`;
}
function scrCal(id){
  const C = APP.cal;
  C.who = id || C.who || STATE.curClient || 'c1';
  const w = who(C.who) || CLIENTS[0]; C.who = w.id;
  if(!C.view) C.view = C.sel;
  const {g, label} = calCells(w), paste = C.mode === 'paste', selm = C.mode === 'sel';
  const whoBtn = whoT(w, 'cal-who');
  const L = C.mode ? `<button class="nb t" data-act="cal-cancel">Отмена</button>` : nb('cal-sel', I.copy, 'Выбрать дни, чтобы скопировать несколько');
  const title = selm ? `Выбрано: ${C.picked.size}` : whoBtn;
  const R = C.mode ? '' : nb('cal-new', I.plus, 'Тренировка на выбранный день');
  let below = '', foot = tabbar('calendar');
  if(paste){
    const single = C.clip.items.length === 1, ds = [...C.targets].sort(), busy = ds.filter(d => dayState(w, d, dayInfo(w, d)) !== 'rest');
    below = `<section class="mod pv">${ds.length ? `<div class="pv-h"><span>Вставка ${w.members ? 'группе' : 'для'} ${h(w.members ? w.n : gen_(w.n))}</span></div>
        <p class="pv-n" style="margin-top:6px">${ds.map(d => fmtDay(d).split(', ')[1]).join(', ')}</p>
        ${busy.length ? `<p class="pv-warn">${busy.map(d => new Date(d + 'T00:00:00').getDate()).join(', ')}-го уже есть тренировка — заменится</p>` : ''}`
      : `<p class="pv-n">${single ? 'Нажмите на дни, куда вставить тренировку — можно несколько' : 'Нажмите на день, с которого начать: остальные встанут с теми же промежутками'}</p>`}
      <p class="pv-hint">Копии — черновики: ${w.members ? 'участники их не видят' : 'клиент их не видит'}, пока не опубликуете. Клиента можно сменить в заголовке.</p></section>`;
    foot = `<div class="pbar"><button class="btn" data-act="cal-paste" ${ds.length ? '' : 'disabled'}>${ds.length ? `Вставить ${ds.length} ${plural3(ds.length, 'тренировку', 'тренировки', 'тренировок')}` : 'Выберите дни'}</button></div>`;
  } else if(selm){
    const ds = [...C.picked].sort(), withW = ds.filter(d => dayState(w, d, dayInfo(w, d)) !== 'rest');
    below = `<section class="mod pv"><div class="pv-h"><span>${ds.length ? ds.map(d => fmtDay(d).split(', ')[1]).join(', ') : 'Нажимайте на дни с тренировками — их можно скопировать, опубликовать или скрыть'}</span></div>
      ${ds.length ? `<p class="pv-n" style="margin-top:6px">${withW.length ? `${withW.length} ${plural3(withW.length, 'тренировка', 'тренировки', 'тренировок')}` : 'В выбранных днях тренировок нет'}</p>` : ''}</section>`;
    foot = `<div class="selbar">
      <button data-act="cal-bulk" data-k="copy" ${withW.length ? '' : 'disabled'}>${I.copy}Копировать</button>
      <button data-act="cal-bulk" data-k="pub" ${withW.length ? '' : 'disabled'}>${I.eye}Опубликовать</button>
      <button data-act="cal-bulk" data-k="draft" ${withW.length ? '' : 'disabled'}>${I.eyeoff}Скрыть</button></div>`;
  } else below = dayPreview(w, C.sel);
  const clip = paste ? `<div class="cal-clip">${I.copy}<span>${C.clip.items.length === 1 ? 'Скопировано: «' + h(C.clip.items[0].t) + '»' : 'Скопировано тренировок: ' + C.clip.items.length} · ${C.clip.items.length === 1 ? 'выберите дни' : 'выберите первый день'}</span></div>` : '';
  return nav(title, L, R) + `<main class="scr gapbg calm${C.mode ? ' with-bar' : ''}">
      ${clip}<section class="cal-top">
      <div class="mh"><b>${label}</b><div>${nb('cal-m', I.back, C.full ? 'Предыдущий месяц' : 'Две недели назад', 'data-k="-1"')}${nb('cal-m', I.chev, C.full ? 'Следующий месяц' : 'Две недели вперёд', 'data-k="1"')}</div></div>
      <div class="dow">${['пн', 'вт', 'ср', 'чт', 'пт', 'сб', 'вс'].map(x => `<span>${x}</span>`).join('')}</div>
      <div class="grid">${g}</div>
      <button class="cal-tg${C.full ? ' up' : ''}" data-act="cal-full" aria-label="${C.full ? 'Свернуть до двух недель' : 'Показать месяц'}">${I.down}</button></section>
      ${below}
    </main>` + foot;
}
const gen_ = n => { const f = first(n), GX = {'Пётр':'Петра', 'Павел':'Павла', 'Лев':'Льва', 'Игорь':'Игоря'}; if(GX[f]) return GX[f];
  const l = f.slice(-1).toLowerCase(), pre = f.slice(-2, -1).toLowerCase();
  return l === 'а' ? f.slice(0, -1) + ('гкхжчшщ'.includes(pre) ? 'и' : 'ы') : l === 'я' ? f.slice(0, -1) + 'и' : (l === 'й' || l === 'ь') ? f.slice(0, -1) + 'я' : f + 'а' };
function startClip(days){
  const C = APP.cal, w = who(C.who); if(!w || !w.prog) return;
  const items = [...days].sort().map(d => { const x = dayAt(w.prog, d); return x && contentHas(x.c) ? {d, c:x.c, t:dayTitleOf(x.c)} : null }).filter(Boolean);
  if(!items.length){ say('В выбранных днях нет тренировок'); return }
  const d0 = items[0].d;
  C.clip = {from:w.id, items:items.map(x => ({off:daysBetween(d0, x.d), c:x.c, t:x.t}))};
  C.mode = 'paste'; C.picked.clear(); C.targets = new Set(); C.pstart = null;
  if(C.view < TODAY) C.view = TODAY;
  render(); say(items.length === 1 ? 'Скопировано — выберите дни для вставки' : `Скопировано ${items.length} — выберите первый день`);
}
/* долгое нажатие на день — выбор нескольких дней */
function bindCalPress(){
  document.querySelectorAll('.calm .grid .gd').forEach(el => {
    let t = 0, x0 = 0, y0 = 0;
    el.addEventListener('pointerdown', e => { if(APP.cal.mode) return; x0 = e.clientX; y0 = e.clientY; clearTimeout(t);
      t = setTimeout(() => { const C = APP.cal; C.mode = 'sel'; C.picked = new Set([el.dataset.d]); C.lp = Date.now(); try{ navigator.vibrate && navigator.vibrate(8) }catch(_){} render() }, 480) });
    el.addEventListener('pointermove', e => { if(Math.abs(e.clientX - x0) > 8 || Math.abs(e.clientY - y0) > 8) clearTimeout(t) });
    ['pointerup', 'pointercancel', 'pointerleave'].forEach(k => el.addEventListener(k, () => clearTimeout(t)));
    el.addEventListener('contextmenu', e => e.preventDefault());
  });
}

/* ═══════════ ЭКРАН 3 · КЛИЕНТЫ ═══════════ */
const SORTS = [['att', 'По вниманию'], ['name', 'По имени'], ['act', 'По активности'], ['pay', 'По оплате']];
/* Фильтр по статусам — как на «Сегодня»: значок у поиска, шторка с отметками и сортировкой.
   Статус клиента — главный сигнал signal(c), по уровню: доступ закрыт, оплата, вопрос, нет
   программы, программа кончается, не тренируется; плюс «в группах». */
const CL_ST = [['closed', 'Доступ закрыт'], ['fee', 'Оплата сегодня или завтра'], ['q', 'Ждут ответа на вопрос'], ['noprog', 'Без программы'],
  ['prog', 'Кончаются тренировки'], ['idle', 'Не тренируются 3+ дня'], ['grp', 'В группах']];
const stOf = c => { const s = signal(c); return s ? ['closed', 'fee', 'fee', 'q', 'noprog', 'prog', 'idle'][s.lv] : null };
const clMatch = (c, k) => k === 'grp' ? !!groupOf(c.id) : stOf(c) === k;
function clientRows(){
  const S = APP.cl, n = norm(S.q);
  let list = CLIENTS.filter(c => !n || norm(c.n).includes(n));
  if(S.st.size) list = list.filter(c => [...S.st].some(k => clMatch(c, k)));
  const by = {att:(a, b) => ((signal(a) || {lv:9}).lv - (signal(b) || {lv:9}).lv) || a.n.localeCompare(b.n),
    name:(a, b) => a.n.localeCompare(b.n), act:(a, b) => String(b.last || '').localeCompare(String(a.last || '')),
    pay:(a, b) => String(a.paidUntil || '9').localeCompare(String(b.paidUntil || '9'))}[S.sort];
  list.sort(by);
  /* в строке — имя и под ним статус, если он есть; программа и прочее — в карточке клиента */
  const row = c => { const s = signal(c), fs = feeState(c), fee = ['closed', 'today', 'tomorrow', 'soon'].includes(fs);
    return `<div class="swipe" data-id="${c.id}"><div class="acts">${fee ? `<button class="a-fee" data-act="fee" data-id="${c.id}">${I.wallet}Получил оплату</button>` : ''}<button class="a-msg" data-act="contact" data-id="${c.id}">${I.msg}Написать</button></div>
      <a class="row cl" href="#/client/${c.id}" data-w="${fee ? 192 : 96}">${ava(c)}<span class="t"><b>${h(c.n)}</b>${s ? `<s><span class="pill ${s.k}">${s.t}</span></s>` : ''}</span><svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m9 5 7 7-7 7"/></svg></a></div>` };
  if(!list.length) return `<div class="empty"><b>Никого</b>Под фильтр никто не подходит</div>`;
  if(!S.st.size && S.sort === 'att' && !n){
    const a = list.filter(c => signal(c)), b = list.filter(c => !signal(c));
    return (a.length ? `<div class="cap">Требуют внимания · ${a.length}</div>${a.map(row).join('')}` : '') + `<div class="cap">Все остальные · ${b.length}</div>${b.map(row).join('')}`;
  }
  return `<div class="cap">${S.st.size ? 'Найдено' : 'Все клиенты'} · ${list.length}</div>` + list.map(row).join('');
}
function scrClients(tab){
  const S = APP.cl, groups = tab === 'groups';
  const head = nav('Клиенты', '', nb('add', I.plus, 'Пригласить клиента или создать группу'))
    + `<div class="utabs"><button data-act="cl-tab" data-k="" class="${groups ? '' : 'on'}">Клиенты<s>${CLIENTS.length}</s></button><button data-act="cl-tab" data-k="groups" class="${groups ? 'on' : ''}">Группы<s>${GRPS.length}</s></button></div>`;
  if(groups) return head + `<main class="scr">${GRPS.length ? GRPS.map(g => { const last = lastWorkoutDay(g.prog);
      return `<a class="row" href="#/group/${g.id}">${ava(g)}<span class="t"><b>${h(g.n)}</b><s>${g.members.length} ${plural(g.members.length, 'участник', 'участника', 'участников')}${last ? ' · составлено до ' + dm(last) : ''}</s></span><svg class="chev" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><path d="m9 5 7 7-7 7"/></svg></a>` }).join('')
    : `<div class="empty"><b>Групп пока нет</b>Соберите в группу тех, кто занимается по одной программе — тренировку напишете один раз.</div>`}</main>` + tabbar('clients');
  const on = S.st.size || S.sort !== 'att';
  return head + `<main class="scr">
      <div class="srow"><label class="search">${I.search}<input id="cq" value="${h(S.q)}" placeholder="Поиск по имени" aria-label="Поиск по имени"></label>
        <button class="nb${on ? ' on' : ''}" data-act="cl-filter" aria-label="Фильтр и сортировка${on ? ' — включены' : ''}">${I.filter}</button></div>
      ${S.st.size ? `<div class="fsum"><span>${[...S.st].map(k => CL_ST.find(x => x[0] === k)[1]).join(', ')}</span><button class="lnk" data-act="cl-reset">Сбросить</button></div>` : ''}
      <div id="cl-list">${clientRows()}</div>
    </main>` + tabbar('clients');
}
function sheetClFilter(){
  const S = APP.cl;
  const body = `<div class="cap">Статус</div>${CL_ST.map(([k, t]) => { const n = CLIENTS.filter(c => clMatch(c, k)).length; if(!n) return '';
      return `<button class="opt${S.st.has(k) ? ' on' : ''}" data-act="cl-st" data-k="${k}"><span class="box">${I.check}</span>${t}<span class="n">${n}</span></button>` }).join('')}
    <div class="cap">Сортировка</div>${SORTS.map(([k, n]) => `<button class="opt${S.sort === k ? ' on' : ''}" data-act="cl-sort-set" data-k="${k}"><span class="box" style="border-radius:50%">${I.check}</span>${n}</button>`).join('')}
    <div class="sh-p" style="display:flex;gap:8px"><button class="btn o" data-act="cl-reset">Сбросить</button><button class="btn" data-act="close-sheet">Показать</button></div>`;
  sheet({id:'clfilter', title:'Фильтр клиентов', sub: S.st.size ? `Выбрано: ${S.st.size}` : 'Все клиенты', body});
}
/* Карточка клиента — набор данных как в кабинете (client.html): шапка (фото, имя, пол и возраст,
   статус), кнопки действий, общая информация (программа и следующая тренировка, группа, оплата,
   активность, с нами с, связь, заметка тренера) и вкладки «Рекорды · Замеры · События». */
const MEAS = [['w', 'Вес', 'кг'], ['waist', 'Талия', 'см'], ['chest', 'Грудь', 'см'], ['hips', 'Бёдра', 'см'], ['fat', 'Жир', '%']];
const ageOf = born => { if(!born) return null; const b = new Date(born + 'T00:00:00'), t = new Date(TODAY + 'T00:00:00'); let a = t.getFullYear() - b.getFullYear(); if(t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--; return a };
const dLong = iso => { const d = new Date(iso + 'T00:00:00'); return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() };
function scrClient(id){
  const c = client(id); if(!c) return scrClients();
  const s = signal(c), G = groupOf(c.id), fs = feeState(c), tab = APP.cTab || 'pm';
  const n = c.prog ? composedDays(c.prog) : 0, last = n ? dayDate(c.prog, n - 1) : null;
  let next = null; if(c.prog) for(let k = 0; k < 30; k++){ const d = addDays(TODAY, k), x = cliDay(c.id, d); if(x.blocks.length){ next = {d, x}; break } }
  const age = ageOf(c.born), sub = [c.sex === 'ж' ? 'Женщина' : c.sex ? 'Мужчина' : '', age != null ? age + ' ' + plural3(age, 'год', 'года', 'лет') : '', c.sport, c.level].filter(Boolean).join(' · ');
  const feeTx = fs === 'none' ? 'не ведётся' : (c.paidUntil ? dm(c.paidUntil) : '—') + ({closed:' · доступ закрыт', today:' · последний день', tomorrow:' · завтра', soon:'', ok:''}[fs] || '');
  const feeK = fs === 'closed' ? 'rm' : fs === 'today' || fs === 'tomorrow' ? 'warn' : '';
  const info = [
    [I.dumb, 'Программа', c.prog ? (G ? 'группа ' + G.n : program(c.prog).title) + (last ? ' · до ' + dm(last) : '') : 'не назначена', next ? `#/workout/${c.id}/${next.d}` : `#/edit/${c.id}/${nextFree(c.id)}`],
    [I.cal, 'Следующая тренировка', next ? dayWord(next.d) + ' · ' + next.x.title : 'не составлена', next ? `#/workout/${c.id}/${next.d}` : null],
    [I.users, 'Группа', G ? G.n : 'не состоит', G ? `#/group/${G.id}` : null],
    [I.wallet, 'Оплачено до', feeTx, null, feeK, `data-act="fee" data-id="${c.id}"`],
    [I.clock, 'Активность', c.last ? 'заходил ' + ago(c.last) : 'ещё не заходил', null, c.last && daysBetween(c.last, TODAY) >= 3 ? 'warn' : ''],
    [I.star, 'С нами с', c.since ? dLong(c.since) : '—', null],
    [I.phone, 'Телефон', c.phone || '—', c.phone ? 'tel:' + c.phone.replace(/[^\d+]/g, '') : null],
    [I.plane, 'Telegram', c.tg || '—', c.tg ? 'https://t.me/' + c.tg.replace('@', '') : null]];
  const infoRow = ([ic, k, v, href, cls, attrs]) => { const inner = `<span class="ic">${ic}</span><span class="t"><s>${k}</s><b class="${cls || ''}">${h(v)}</b></span>${href || attrs ? I.chev : ''}`;
    return href ? `<a class="lrow ci" href="${href}"${/^https?:/.test(href) ? ' target="_blank" rel="noopener"' : ''}>${inner}</a>` : attrs ? `<button class="lrow ci" ${attrs}>${inner}</button>` : `<div class="lrow ci">${inner}</div>` };
  const tabs = [['pm', 'Рекорды'], ['meas', 'Замеры'], ['ev', 'События']];
  return nav('Клиент', `<button class="nb" data-act="back" data-to="#/clients" aria-label="Назад">${I.back}</button>`)
    + `<main class="scr gapbg">
      <section class="sec" style="padding:0">
        <div class="hero">${ava(c, 'l')}<div style="min-width:0"><h2>${h(c.n)}</h2><p>${h(sub)}</p>${s ? `<span class="pill ${s.k}" style="margin-top:8px">${s.t}</span>` : ''}</div></div>
        <div class="qa">
          <a href="#/edit/${c.id}/${next && next.d === TODAY ? TODAY : nextFree(c.id)}"><span>${I.dumb}</span>Тренировка</a>
          <a href="#/calendar/${c.id}"><span>${I.cal}</span>Календарь</a>
          <button data-act="contact" data-id="${c.id}"><span>${I.msg}</span>Написать</button>
          <button data-act="fee" data-id="${c.id}"><span>${I.wallet}</span>Оплата</button>
        </div>
      </section>
      <section class="sec" style="padding:0"><div class="cap">Общая информация</div>${info.map(infoRow).join('')}
        <div class="ci-note"><span>Заметка тренера · клиент не видит</span><textarea class="note" id="cnote" data-id="${c.id}" placeholder="Что важно помнить о клиенте">${h(c.note || '')}</textarea></div></section>
      <section class="sec" style="padding:0"><div class="utabs" role="tablist">${tabs.map(([k, t]) => `<button class="${tab === k ? 'on' : ''}" role="tab" aria-selected="${tab === k}" data-act="c-tab" data-k="${k}">${t}</button>`).join('')}</div>
        ${tab === 'pm' ? clientPM(c) : tab === 'meas' ? clientMeas(c) : clientEvents(c)}</section>
    </main>` + tabbar('clients');
}
/* Рекорды: 1ПМ и 3ПМ по упражнениям, график выбранного, «Изменить» — шторка */
function clientPM(c){
  const pm = pmOf(c.id), pm3 = (STATE.pm3 || {})[c.id] || {}, hist = c.hist || {}, keys = Object.keys(pm).filter(k => pm[k]);
  if(!keys.length) return `<div class="empty"><b>Рекордов пока нет</b>Клиент вносит их у себя, или добавьте сами<div style="margin-top:12px"><button class="btn s" data-act="pm" data-id="${c.id}">${I.plus}Добавить рекорд</button></div></div>`;
  const sel = keys.includes(APP.cPm) ? APP.cPm : keys[0], ser = (hist[sel] || []).length > 1 ? hist[sel] : null;
  return `<div class="cchart"><div class="cchart-h"><b>${h(pmName(sel))}</b><span>1ПМ, кг</span></div>${ser ? lineChart(ser, 'кг') : '<p class="muted small" style="margin:8px 0 4px">История появится после второго рекорда</p>'}</div>
    ${keys.map(k => { const hs = hist[k] || [], upd = hs.length ? hs[hs.length - 1][0] : null;
      return `<button class="lrow pmrow${k === sel ? ' on' : ''}" data-act="c-pm" data-k="${k}"><span class="t"><b>${h(pmName(k))}</b><s>${upd ? 'обновлён ' + humanDate(upd) : 'без истории'}</s></span>
        <span class="pmv"><b>${fmtNum(pm[k])} кг</b><s>${pm3[k] != null ? '3ПМ ' + fmtNum(pm3[k]) : '1ПМ'}</s></span></button>` }).join('')}
    <div class="sh-p" style="padding-top:12px"><button class="btn o" data-act="pm" data-id="${c.id}">Изменить рекорды</button></div>`;
}
/* Замеры: показатель чипами, график и даты со сдвигом */
function clientMeas(c){
  const rows = (c.meas || []).slice().sort((a, b) => a.date.localeCompare(b.date));
  const [k, name, unit] = MEAS.find(m => m[0] === APP.cMeas) || MEAS[0], ser = rows.filter(r => r[k] != null).map(r => [r.date, r[k]]);
  const fmt = v => v == null ? '—' : (k === 'w' || k === 'fat') ? String(Math.round(v * 10) / 10).replace('.', ',') : String(Math.round(v));
  const meta = [c.h ? 'Рост ' + c.h + ' см' : '', c.born ? 'Дата рождения ' + dLong(c.born) : ''].filter(Boolean).join(' · ');
  return `<div class="chips">${MEAS.map(([kk, n]) => `<button class="chip${kk === k ? ' on' : ''}" data-act="c-meas" data-k="${kk}">${n}</button>`).join('')}</div>
    <div class="cchart" style="padding-top:0">${ser.length > 1 ? lineChart(ser, unit) : '<p class="muted small" style="margin:4px 0">Мало замеров для графика</p>'}</div>
    ${ser.length ? ser.slice().reverse().map(([d, v], i, a) => { const pv = a[i + 1] ? a[i + 1][1] : null, dl = pv == null ? 0 : Math.round((v - pv) * 10) / 10;
      return `<div class="lrow"><span class="t"><b>${humanDate(d)}</b></span><span class="mv"><b>${fmt(v)} ${unit}</b>${dl ? `<s class="${dl < 0 ? 'dn' : 'up'}">${dl > 0 ? '+' : '−'}${String(Math.abs(dl)).replace('.', ',')}</s>` : ''}</span></div>` }).join('')
      : `<p class="muted" style="margin:0;padding:8px 16px">Замеров «${name.toLowerCase()}» пока нет</p>`}
    ${meta ? `<p class="muted small" style="margin:0;padding:10px 16px 0">${h(meta)}</p>` : ''}
    <div class="sh-p" style="padding-top:12px"><button class="btn o" data-act="c-meas-add" data-id="${c.id}">${I.plus}Добавить замер</button></div>`;
}
/* События клиента — те же карточки, что на «Сегодня» */
function clientEvents(c){
  const list = feedEvents(c.id).filter(e => e.t !== 'prog');
  if(!list.length) return '<div class="empty"><b>Событий пока нет</b>Здесь появятся вопросы, результаты, рекорды и оплаты клиента</div>';
  let html = '', day = null;
  list.slice(0, 40).forEach(e => { if(e.d !== day){ day = e.d; html += `<div class="day">${dayWord(e.d)}</div>` } html += card(e, false) });
  return `<div class="cev">${html}</div>`;
}
function sheetMeasAdd(c){
  const body = `<div class="sh-p pmf">${MEAS.map(([k, n, u]) => `<label class="pmr"><span>${n}</span><input inputmode="decimal" data-nm="${k}" placeholder="—" aria-label="${n}, ${u}" autocomplete="off"><i>${u}</i></label>`).join('')}
    <p class="ed-note" style="margin-top:12px">Замер запишется сегодняшним днём. Можно заполнить не всё.</p></div>`;
  sheet({id:'meas', title:'Новый замер', sub:c.n + ' · ' + humanDate(TODAY), body, foot:`<div class="sh-f"><button class="btn" data-act="c-meas-save" data-id="${c.id}">Записать</button></div>`});
}

/* Карточка группы: название и описание («Изменить» в шапке), календарь группы, участники —
   добавить, убрать (смахиванием или в режиме «Изменить» у списка), удалить группу.
   Операции — общие с кабинетом (groupAdd/groupRemove/groupUpdate/groupDelete, data.js). */
function scrGroup(id){
  const G = grp(id); if(!G) return scrClients('groups');
  const ed = APP.gEdit === G.id, n = G.members.length;
  const mem = G.members.map(cid => { const c = client(cid); if(!c) return '';
    const sub = G.joined && G.joined[cid] ? 'в группе с ' + dm(G.joined[cid]) : (c.last ? 'заходил ' + ago(c.last) : 'не заходил');
    if(ed) return `<div class="row gm">${`<button class="rm-b" data-act="g-rm" data-g="${G.id}" data-id="${c.id}" aria-label="Убрать ${h(c.n)} из группы"><i></i></button>`}${ava(c)}<span class="t"><b>${h(c.n)}</b><s>${sub}</s></span></div>`;
    return `<div class="swipe" data-id="${c.id}"><div class="acts"><button class="a-rm" data-act="g-rm" data-g="${G.id}" data-id="${c.id}">${I.x}Убрать</button></div>
      <a class="row" href="#/client/${c.id}" data-w="96">${ava(c)}<span class="t"><b>${h(c.n)}</b><s>${sub}</s></span>${I.chev.replace('<svg', '<svg class="chev"')}</a></div>` }).join('');
  return nav('Группа', `<button class="nb" data-act="back" data-to="#/clients/groups" aria-label="Назад">${I.back}</button>`, `<button class="nb pen" data-act="g-info" data-id="${G.id}" aria-label="Изменить группу">${I.edit}</button>`)
    + `<main class="scr gapbg"><section class="sec" style="padding:0">
        <div class="hero">${ava(G, 'l')}<div style="min-width:0"><h2>${h(G.n)}</h2><p>${G.about ? h(G.about) : '<span class="muted">Без описания</span>'}</p></div></div>
        <div class="g-cal"><a class="btn o" href="#/calendar/${G.id}">${I.cal}Календарь группы</a></div></section>
      <section class="sec" style="padding:0">
        <div class="h2 g-h"><b>Участники<s>${n}</s></b>${n ? `<button data-act="g-ed" data-id="${G.id}">${ed ? 'Готово' : 'Изменить'}</button>` : ''}</div>
        <button class="row add-r" data-act="g-add" data-id="${G.id}"><span class="ic acc">${I.plus}</span><span class="t"><b>Добавить участника</b></span></button>
        ${mem || '<p class="muted" style="margin:0;padding:4px 16px 16px">В группе пока никого — добавьте участников, и тренировка группы встанет каждому.</p>'}
      </section>
      <section class="sec" style="padding:0"><button class="row danger" data-act="g-del" data-id="${G.id}">Удалить группу</button></section>
    </main>` + tabbar('clients');
}
function sheetGroupInfo(G){
  const ov = sheet({id:'ginfo', title:'Группа', sub:'Название и описание видят участники', body:`<div class="sh-p">
      <label class="field"><span>Название</span><input id="gN" value="${h(G.n)}" maxlength="60" autocomplete="off"></label>
      <label class="field"><span>Описание</span><textarea id="gA" rows="3" placeholder="Например: лечебная физкультура — спина, суставы, баланс">${h(G.about || '')}</textarea></label></div>`,
    foot:`<div class="sh-f"><button class="btn" data-act="g-info-save" data-id="${G.id}">Сохранить</button></div>`});
  setTimeout(() => { const i = ov.querySelector('#gN'); if(i) i.focus() }, 260);
}
function sheetGroupAdd(G){
  const list = q => { const n = norm(q || '');
    const cs = CLIENTS.filter(c => !G.members.includes(c.id) && (!n || norm(c.n).includes(n)));
    return cs.map(c => { const og = groupOf(c.id);
      return og ? `<div class="row off"><span class="ava-w">${ava(c)}</span><span class="t"><b>${h(c.n)}</b><s>в группе «${h(og.n)}»</s></span></div>`
        : `<button class="row" data-act="g-add-id" data-g="${G.id}" data-id="${c.id}">${ava(c)}<span class="t"><b>${h(c.n)}</b><s>${h(progLine(c))}</s></span><span class="ic acc">${I.plus}</span></button>` }).join('') || '<div class="empty">Никого не нашлось</div>' };
  const ov = sheet({id:'gadd', title:'Добавить участника', sub:'Тренировки группы с сегодняшнего дня встанут ему в календарь',
    body:`<div class="search" style="margin:12px 16px">${I.search}<input placeholder="Клиент" aria-label="Поиск клиента"></div><div class="pl">${list('')}</div>`});
  ov.classList.add('tall');
  const inp = ov.querySelector('input'), pl = ov.querySelector('.pl');
  inp.addEventListener('input', () => { pl.innerHTML = list(inp.value) });
  ov._list = () => { pl.innerHTML = list(inp.value) };
}
const confirmSheet = (id, title, sub, label, act, attrs) => sheet({id, title, sub, body:`<div class="sh-p ed-ask">
    <button class="btn rm" data-act="${act}" ${attrs}>${label}</button><button class="btn o" data-act="close-sheet">Отмена</button></div>`});

/* ═══════════ БАЗЫ И ПРОФИЛЬ — следующая итерация ═══════════ */
/* «Ещё» — список разделов по-iOS: базы шаблонов, аккаунт, помощь. Сами разделы — следующая итерация. */
const MORE = [
  ['Базы', [['ex', I.ex, 'Упражнения', () => exLive().length], ['blocks', I.bases, 'Блоки', () => tplLive('блок').length],
    ['workouts', I.clip, 'Тренировки', () => tplLive('тренировка').length], ['programs', I.list, 'Программы', () => tplLive('программа').length]]],
  ['Аккаунт', [['profile', I.user, 'Профиль', () => ''], ['sub', I.card, 'Подписка', () => ''], ['notify', I.bell, 'Уведомления', () => ''], ['partner', I.gift, 'Партнёрская программа', () => '']]],
  ['Помощь', [['help', I.help, 'Поддержка и вопросы', () => '']]]];
const STUB = {ex:['Упражнения', 'Поиск по базе, своё упражнение, техника и видео.'], blocks:['Блоки', 'Шаблоны блоков по папкам: разминки, силовые, комплексы, заминки.'],
  workouts:['Тренировки', 'Шаблоны тренировок: просмотр, правка, «Назначить клиенту».'], programs:['Программы', 'Программы на недели вперёд и назначение клиентам.'],
  profile:['Профиль', 'Мои данные и фото, приглашение клиентов, реквизиты для оплаты, синхронизация, выход.'],
  sub:['Подписка', 'Срок и тариф. Оплата — только на сайте, в приложении кнопок оплаты нет.'],
  notify:['Уведомления', 'Пуши о вопросах, оплате, новых клиентах; тихие часы.'], partner:['Партнёрская программа', 'Ссылка, приглашённые тренеры и начисления; вывод средств — на сайте.'],
  help:['Поддержка', 'Частые вопросы и связь с поддержкой.']};
/* «Ещё» — шторкой поверх текущего экрана: вкладка не уводит с того, что открыто */
const moreList = () => MORE.map(([cap_, rows]) => `<div class="cap">${cap_}</div>${rows.map(([k, ic, t, n]) => { const v = n();
    return `<a class="lrow more-r" href="#/${k === 'profile' ? 'profile' : 'more/' + k}"><span class="ic sq">${ic}</span><span class="t"><b>${t}</b></span>${v !== '' ? `<span class="n">${v}</span>` : ''}${I.chev}</a>` }).join('')}`).join('');
function sheetMore(){ sheet({id:'more', title:'Ещё', body:`<div class="more-s">${moreList()}</div>`}) }
function scrStub(k){
  const T = STUB[k] || STUB.profile, back = k === 'profile' ? '#/today' : '#/more';
  return nav(T[0], `<button class="nb" data-act="back" data-to="${back}" aria-label="Назад">${I.back}</button>`) + `<main class="scr"><div class="empty"><b>Экран в работе</b>${T[1]}</div></main>` + tabbar(k === 'profile' ? 'today' : 'more');
}

/* ═══════════ ЭКРАН 4 · ТРЕНИРОВКА — во весь экран ═══════════
   Конструктор кабинета в режиме «внутри приложения» (html.inapp в mobile.css):
   без его шапки и нижней панели, с компактным видом дня, шторкой «Базы»,
   режимом «Изменить» и смахиванием окон. Шапку рисует приложение. */
function openFull(r){
  const [kind, id, d] = [r.name, r.args[0], r.args[1]];
  const w = who(id); if(!w){ go('#/today'); return }
  const wiz = d === 'wizard', date = wiz ? TODAY : (d || TODAY);
  /* день — новый редактор приложения (editor.js); мастер копирования пока страница кабинета */
  if(kind === 'edit' && !wiz && window.TED){ window.TED.open(w, date, LAYER); return }
  const src = kind === 'edit' ? `../constructor.html?${subjQ(w.id)}&date=${date}${wiz ? '&wizard=1' : ''}`
    : `../workout.html?client=${w.id}&date=${date}`;
  const key = kind + '|' + src;
  let el = LAYER.querySelector('.full');
  if(el && el.dataset.key === key) return;
  const title = kind === 'edit' ? (wiz ? 'Копирование тренировок' : 'Тренировка') : 'Тренировка клиента';
  const sub = `${w.n} · ${wiz ? 'несколько дней' : dayWord(date).toLowerCase()}`;
  /* шапки без слов: «‹» — назад (правка сохраняется сама), карандаш — править, глаз — публикация */
  const L = `<button class="nb" data-act="full-close" aria-label="Назад">${I.back}</button>`;
  const R = kind === 'edit' ? '' : `${calBtn(date, 'w-date', `data-id="${w.id}" data-d="${date}"`)}${viewEye(w, date)}<a class="nb pen" href="#/edit/${w.id}/${date}" aria-label="Править">${I.edit}</a>`;
  /* тренировка клиента: в шапке — чья (имя ▾, сразу после «‹») и справа значки: день (календарь с числом), глаз, карандаш */
  const head = kind === 'workout' ? whoT(w, 'w-who', `data-d="${date}"`) : `${title}<small>${h(sub)}</small>`;
  const html = `<div class="full${kind === 'workout' ? ' push' : ''}" data-key="${h(key)}">
      <header class="nav${kind === 'workout' ? ' lead' : ''}"><div class="nav-in"><div class="nav-l">${L}</div><h1>${head}</h1><div class="nav-r">${R}</div></div></header>
      <iframe title="${h(title)}" data-inapp="1" src="${src}"></iframe></div>`;
  if(el) el.outerHTML = html; else LAYER.innerHTML = html;
  el = LAYER.querySelector('.full');
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('on')));
}
/* глаз в шапке просмотра: опубликовать или скрыть, не открывая правку; на дне без тренировки — нет */
function viewEye(w, d, on){
  if(on == null){ const inf = dayInfo(w, d); if(!inf || !dayHas(inf.x)) return ''; on = !inf.x.draft }
  return eyeBtn(on, 'w-pub', w.members ? 'Видят участники' : 'Видит клиент', `data-id="${w.id}" data-d="${d}"`);
}
function closeFull(){const el = LAYER.querySelector('.full'); if(!el) return; el.classList.remove('on'); setTimeout(() => { if(!el.classList.contains('on')) el.remove() }, 320) }

/* ═══════════ МАРШРУТИЗАЦИЯ ═══════════ */
/* разделы аккаунта — account.js (подключён следом): профиль, подписка, уведомления, партнёрская программа */
const acc = k => window.TACC && window.TACC.scr[k];
/* базы — bases.js (подключён следом): упражнения, блоки, тренировки, программы и их элементы (#/more/<база>/<id>) */
const base = k => window.TBASES && window.TBASES.has(k);
const parse = hash => { const s = String(hash || '').replace(/^#\/?/, '') || 'today'; const [name, ...args] = s.split('/'); return {name, args} };
const route = () => parse(location.hash);
function screen(r){
  switch(r.name){
    case 'calendar': return scrCal(r.args[0]);
    case 'clients': return scrClients(r.args[0]);
    case 'client': return scrClient(r.args[0]);
    case 'group': return scrGroup(r.args[0]);
    case 'more': if(!r.args[0]){ setTimeout(sheetMore, 60); return scrToday() } return acc(r.args[0]) ? acc(r.args[0])() : base(r.args[0]) ? window.TBASES.screen(r.args) : scrStub(r.args[0]);
    case 'bases': return base('ex') ? window.TBASES.screen(['ex']) : scrStub('ex');
    case 'profile': return acc('profile') ? acc('profile')() : scrStub('profile');
    default: return scrToday();
  }
}
function render(){
  const r = route();
  if(window.TED && window.TED.leave) window.TED.leave(r);              /* ушли из правки не через «‹» — правки всё равно сохраняются */
  if(r.name === 'today' && APP.lastName !== 'today') NEWSET = null;     /* новое открытие «Сегодня» — новые считаются заново */
  APP.lastName = r.name;
  if(r.name === 'edit' || r.name === 'workout'){
    if(!APP_EL.innerHTML){ APP_EL.innerHTML = screen(parse(APP.base)) }   /* у #/edit без истории — под ним «Сегодня» */
    closeSheet(true);                                                       /* шторка, из которой ушли, не остаётся висеть */
    openFull(r); return;
  }
  closeFull(); closeSheet(true);
  APP.base = location.hash || '#/today';
  APP_EL.innerHTML = screen(r);
  if(r.name === 'calendar' && APP.cal.who) STATE.curClient = APP.cal.who;
  bindScreen();
  window.scrollTo(0, 0);
}
/* перерисовать экран под открытой шторкой, не закрывая её */
function repaint(){ const y = scrollY; APP_EL.innerHTML = screen(route()); bindScreen(); window.scrollTo(0, y) }
let first_ = true;
addEventListener('hashchange', () => { if(!first_) APP.came = true; render() });

/* живые элементы экрана: поиск, заметка, смахивание строк */
/* свернуть полосу «Тренируются сегодня», когда она ушла под заголовок */
function miniStrip(){
  const hd = document.querySelector('#app > .nav'); if(hd) hd.classList.toggle('scrolled', scrollY > 2);
  const sec = document.getElementById('tsec');
  if(!sec || !hd) return;
  const on = sec.getBoundingClientRect().bottom < hd.querySelector('.nav-in').getBoundingClientRect().bottom + 8;
  if(hd.classList.contains('mini-on') !== on){ hd.classList.toggle('mini-on', on); const b = hd.querySelector('.mini'); if(b) b.tabIndex = on ? 0 : -1 }
}
addEventListener('scroll', miniStrip, {passive:true});
function bindScreen(){
  miniStrip(); bindCalPress();
  if(document.querySelector('.card[data-eid]')) watchSeen(); else if(SEEN_IO){ SEEN_IO.disconnect(); SEEN_IO = null }
  const q = document.getElementById('cq');
  if(q) q.addEventListener('input', () => { APP.cl.q = q.value; document.getElementById('cl-list').innerHTML = clientRows(); bindSwipes() });
  const nt = document.getElementById('cnote');
  if(nt) nt.addEventListener('change', () => { const c = client(nt.dataset.id); if(c){ c.note = nt.value; say('Заметка сохранена') } });
  bindSwipes();
  if(window.TACC) window.TACC.bind();
  if(window.TBASES) window.TBASES.bind();
}
/* смахивание строки клиента влево — «Получил оплату», «Написать» */
function bindSwipes(){
  document.querySelectorAll('.swipe').forEach(sw => {
    if(sw._b) return; sw._b = true;
    const row = sw.querySelector('.row'); let x0 = null, y0 = 0, dx = 0, moved = false;
    const W = +row.dataset.w;
    row.addEventListener('pointerdown', e => { x0 = e.clientX; y0 = e.clientY; dx = 0; moved = false; document.querySelectorAll('.swipe.open').forEach(o => { if(o !== sw) o.classList.remove('open') }) });
    row.addEventListener('pointermove', e => { if(x0 == null) return; dx = e.clientX - x0; if(Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(e.clientY - y0)){ moved = true; row.style.transition = 'none'; row.style.transform = `translateX(${Math.max(-W - 30, Math.min(0, dx + (sw.classList.contains('open') ? -W : 0)))}px)` } });
    const end = () => { if(x0 == null) return; x0 = null; row.style.transition = ''; row.style.transform = '';
      if(moved){ const open = dx < -40 || (sw.classList.contains('open') && dx < 30); sw.classList.toggle('open', open); sw.style.setProperty('--sw', -W + 'px') } };
    row.addEventListener('pointerup', end); row.addEventListener('pointercancel', end);
    row.addEventListener('click', e => { if(moved || sw.classList.contains('open')){ e.preventDefault(); if(!moved) sw.classList.remove('open'); moved = false } });
  });
}

/* ═══════════ ДЕЙСТВИЯ ═══════════ */
const ACT = {
  'close-sheet': () => closeSheet(),
  back: b => back(b.dataset.to),
  all: () => sheetAll(),
  filter: () => sheetFilter(),
  per: b => { APP.feed.per = b.dataset.k; render(); sheetFilter() },
  type: b => { const s = APP.feed.types, k = b.dataset.k; s.has(k) ? s.delete(k) : s.add(k); render(); sheetFilter() },
  'feed-reset': () => { APP.feed.types.clear(); APP.feed.per = 'all'; render(); sheetFilter() },
  trainee: b => { const id = b.dataset.id, x = trainingToday().find(t => t.c.id === id); closeSheet(true);
    if(!x) return; if(x.grp) go(`#/edit/${id}/${TODAY}`); else go(`#/workout/${id}/${TODAY}`) },
  publish: b => { if(setPublished(b.dataset.pid, +b.dataset.i, true)){ say('Тренировка опубликована — клиент её видит'); render(); sheetAll() } },
  reply: b => sheetReply(b.dataset.key),
  fee: b => sheetFee(b.dataset.id),
  'fee-save': b => { const c = client(b.dataset.id), amt = +String(document.getElementById('fAmt').value).replace(/\D/g, ''), until = document.getElementById('fUntil').value;
    if(!amt || !until){ say('Укажите сумму и срок'); return }
    feeReceive(c, amt, until); closeSheet(); say(`Оплата принята — до ${humanDate(until)}`); render() },
  contact: b => sheetContact(b.dataset.id),
  max: () => say('Max: ссылка на чат появится, когда мессенджер откроет диплинки'),
  new: () => sheetPick('new', 'Новая тренировка', id => go(`#/edit/${id}/${nextFree(id)}`)),
  pick: b => { const ov = b.closest('.ov'), fn = ov && ov._pick; closeSheet(true); if(fn) fn(b.dataset.id) },
  add: () => sheet({id:'add', title:'Добавить', body:`<button class="opt" data-act="invite">${I.share.replace('<svg', '<svg width="22" height="22"')}Пригласить клиента</button><a class="opt" href="../groups.html" target="_blank" rel="noopener">${I.users.replace('<svg', '<svg width="22" height="22"')}Новая группа</a>`}),
  invite: () => { if(NEWTR && !onbState().invited){ onbState().invited = true; saveState(); if(route().name === 'today') setTimeout(render, 300) } const msg = inviteMessage(); if(navigator.share){ navigator.share({text:msg}).catch(() => {}) } else { try{ navigator.clipboard.writeText(msg) }catch(_){} say('Сообщение со ссылкой скопировано') } closeSheet() },
  more: () => sheetMore(),
  'c-tab': b => { APP.cTab = b.dataset.k; repaint() },
  'c-pm': b => { APP.cPm = b.dataset.k; repaint() },
  'c-meas': b => { APP.cMeas = b.dataset.k; repaint() },
  'c-meas-add': b => { const c = client(b.dataset.id); if(c) sheetMeasAdd(c) },
  'c-meas-save': b => { const c = client(b.dataset.id); if(!c) return; const r = {date:TODAY};
    document.querySelectorAll('[data-nm]').forEach(i => { const v = parseFloat(i.value.replace(',', '.')); if(isFinite(v) && v > 0) r[i.dataset.nm] = v });
    if(Object.keys(r).length < 2){ say('Заполните хотя бы один показатель'); return }
    (c.meas ||= []).push(r); if(r.w) c.w = r.w; closeSheet(); repaint(); say('Замер записан') },
  'g-info': b => { const G = grp(b.dataset.id); if(G) sheetGroupInfo(G) },
  'g-info-save': b => { const G = grp(b.dataset.id); if(!G) return; const n = document.getElementById('gN').value.trim(), a = document.getElementById('gA').value.trim();
    if(!n){ say('Укажите название'); return } groupUpdate(G, {n, about:a}); saveGroups(); closeSheet(); render(); say('Сохранено') },
  'g-ed': b => { APP.gEdit = APP.gEdit === b.dataset.id ? null : b.dataset.id; repaint() },
  'g-add': b => { const G = grp(b.dataset.id); if(G) sheetGroupAdd(G) },
  'g-add-id': b => { const G = grp(b.dataset.g), c = client(b.dataset.id); if(!G || !c) return;
    const n = groupAdd(G, c.id); saveGroups(); repaint();
    const ov = document.querySelector('.ov[data-sheet="gadd"]'); if(ov && ov._list) ov._list();
    say(`${first(c.n)} в группе${n ? ` — тренировок группы встало: ${n}` : ''}`) },
  'g-rm': b => { const G = grp(b.dataset.g), c = client(b.dataset.id); if(!G || !c) return;
    confirmSheet('grm', 'Убрать из группы?', `${c.n}: будущие тренировки группы пропадут, а те, что вы правили лично, останутся`, 'Убрать из группы', 'g-rm-ok', `data-g="${G.id}" data-id="${c.id}"`) },
  'g-rm-ok': b => { const G = grp(b.dataset.g), c = client(b.dataset.id); if(!G || !c) return; groupRemove(G, c.id); saveGroups(); closeSheet(); repaint(); say(`${first(c.n)} больше не в группе «${G.n}»`) },
  'g-del': b => { const G = grp(b.dataset.id); if(!G) return;
    confirmSheet('gdel', `Удалить группу «${G.n}»?`, 'Тренировки, которые уже стоят у участников, останутся у них. Вернуть группу нельзя', 'Удалить группу', 'g-del-ok', `data-id="${G.id}"`) },
  'g-del-ok': b => { const G = grp(b.dataset.id); if(!G) return; const n = G.n; groupDelete(G); saveGroups(); closeSheet(true); APP.gEdit = null; go('#/clients/groups'); say(`Группа «${n}» удалена`) },
  'onb-fold': () => { const o = onbState(); o.fold = !o.fold; saveState(); render() },
  'onb-hide': () => { onbState().hidden = true; saveState(); render(); say('Блок «Первые шаги» убран') },
  pm: b => sheetPM(b.dataset.id),
  unclosed: b => sheetUnclosed(b.dataset.d),
  'cl-tab': b => go(b.dataset.k ? '#/clients/groups' : '#/clients'),
  'cl-filter': () => sheetClFilter(),
  'cl-st': b => { const s = APP.cl.st, k = b.dataset.k; s.has(k) ? s.delete(k) : s.add(k); repaint(); sheetClFilter() },
  'cl-sort-set': b => { APP.cl.sort = b.dataset.k; repaint(); sheetClFilter() },
  'cl-reset': () => { APP.cl.st.clear(); APP.cl.sort = 'att'; closeSheet(true); render() },
  'cal-day': b => { const C = APP.cal, d = b.dataset.d;
    if(C.lp && Date.now() - C.lp < 700){ C.lp = 0; return }             /* отпускание после долгого нажатия — не касание */
    if(C.mode === 'sel'){ C.picked.has(d) ? C.picked.delete(d) : C.picked.add(d); render(); return }
    if(C.mode === 'paste'){ if(d < TODAY){ say('В прошедшие дни не вставляем'); return }
      if(C.clip.items.length === 1){ C.targets.has(d) ? C.targets.delete(d) : C.targets.add(d) }
      else { C.pstart = d; C.targets = new Set(C.clip.items.map(it => addDays(d, it.off))) }
      render(); return }
    C.sel = d; if(C.full) C.view = d; render() },
  'cal-m': b => { const C = APP.cal, k = +b.dataset.k;
    if(C.full){ const m = new Date(C.view.slice(0, 7) + '-01T00:00:00'); m.setMonth(m.getMonth() + k); C.view = m.getFullYear() + '-' + String(m.getMonth() + 1).padStart(2, '0') + '-01' }
    else C.view = addDays(monOf(C.view), 14 * k);
    render() },
  'cal-full': () => { const C = APP.cal; C.full = !C.full; C.view = C.mode === 'paste' && C.view > C.sel ? C.view : C.sel; render() },
  'cal-cancel': () => { const C = APP.cal; C.mode = null; C.picked.clear(); C.clip = null; C.targets.clear(); C.pstart = null; render() },
  'cal-copy': b => startClip([b.dataset.d]),
  'cal-sel': () => { const C = APP.cal; C.mode = 'sel'; C.picked = new Set(); render(); say('Отметьте дни, которые скопировать') },
  'cal-blk': b => { const s = APP.cal.open, k = b.dataset.k; s.has(k) ? s.delete(k) : s.add(k); repaint() },
  'cal-all': b => { const s = APP.cal.open, ks = b.dataset.k.split('§'), all = ks.every(k => s.has(k)); ks.forEach(k => all ? s.delete(k) : s.add(k)); repaint() },
  'cal-new': () => go(`#/edit/${APP.cal.who}/${APP.cal.sel}`),
  'cal-who': () => sheetPick('who', 'Чей календарь', id => { const C = APP.cal; C.who = id; C.targets.clear(); C.pstart = null; if(C.mode === 'sel'){ C.mode = null; C.picked.clear() } go('#/calendar/' + id) }),
  'cal-bulk': b => { const C = APP.cal, w = who(C.who), k = b.dataset.k;
    if(k === 'copy'){ startClip([...C.picked]); return }
    let n = 0; [...C.picked].forEach(d => { const inf = dayInfo(w, d); if(inf && inf.st !== 'rest' && setPublished(w.prog, inf.i, k === 'pub')) n++ });
    C.mode = null; C.picked.clear(); say(n ? (k === 'pub' ? `Опубликовано: ${n}` : `Скрыто от клиента: ${n}`) : 'В выбранных днях нет тренировок'); render() },
  'cal-paste': () => { const C = APP.cal, w = who(C.who), ds = [...C.targets].sort(); if(!ds.length || !C.clip) return;
    const single = C.clip.items.length === 1, pairs = single ? ds.map(d => [d, C.clip.items[0]]) : C.clip.items.map(it => [addDays(C.pstart, it.off), it]);
    pairs.forEach(([d, it]) => { const r = ensureDay(w.id, d); if(!r) return; const cur = buildPlan(r.pid)[r.i]; putDay(r.pid, r.i, {c:it.c, pub: cur ? (cur.pub || '') : '', draft:true}) });
    saveState(); const n = pairs.length;
    C.mode = null; C.clip = null; C.targets.clear(); C.pstart = null; C.sel = pairs[0][0]; C.view = C.sel;
    render(); say(`Вставлено: ${n} ${plural3(n, 'тренировка', 'тренировки', 'тренировок')} — черновиками, ${w.members ? 'участники не видят' : 'клиент не видит'}`) },
  'full-close': () => { if(APP.came) history.back(); else go(APP.base && !/^#\/(edit|workout)/.test(APP.base) ? APP.base : '#/today') },
  'w-who': b => { const d = b.dataset.d; sheetPick('wwho', 'Чья тренировка', id => location.replace(`#/workout/${id}/${d}`)) },
  'w-pub': b => { const w = who(b.dataset.id), d = b.dataset.d, inf = w && dayInfo(w, d); if(!inf || !dayHas(inf.x)) return;
    const on = b.getAttribute('aria-checked') !== 'true';       /* был черновиком — публикуем, и наоборот; состояние — с кнопки, план кэширован до конца такта */
    if(!setPublished(w.prog, inf.i, on)) return;
    b.outerHTML = viewEye(w, d, on); say(pubToggleMsg(on, w.prog)) },   /* состояние — явно: план дня кэширован до конца такта (cliPlan) */
  'w-date': b => {const w = who(b.dataset.id); if(w) sheetDate(w, b.dataset.d, d => location.replace(`#/workout/${w.id}/${d}`)) },
  dpick: b => { const ov = b.closest('.ov'); if(ov && ov._pick) ov._pick(b.dataset.d) },
  'dpick-m': b => { const ov = b.closest('.ov'); if(ov && ov._month) ov._month(+b.dataset.k) },
  'full-date': b => { const body = `<div class="sh-p"><label class="field"><span>Дата</span><input type="date" id="fd" value="${b.dataset.d}"></label><button class="btn" data-act="full-date-go" data-id="${b.dataset.id}" data-k="${b.dataset.k}">Открыть</button></div>`;
    sheet({id:'date', title:'Другой день', body}) },
  'full-date-go': b => { const d = document.getElementById('fd').value; closeSheet(true); if(d) location.replace(`#/${b.dataset.k}/${b.dataset.id}/${d}`) }
};
document.addEventListener('click', e => {
  const b = e.target.closest('[data-act]'); if(!b) return;
  const fn = ACT[b.dataset.act]; if(!fn) return;
  e.preventDefault(); fn(b);
});
document.addEventListener('submit', e => {
  const f = e.target.closest('[data-act-form="send"]'); if(!f) return; e.preventDefault();
  const t = f.querySelector('textarea'), text = t.value.trim(); if(!text) return;
  talkAdd(f.dataset.key, 'trainer', text); closeSheet(); say('Ответ отправлен — клиент увидит его в тренировке'); render();
});
document.addEventListener('keydown', e => { if(e.key === 'Escape') closeSheet() });

/* общее с редактором тренировки (editor.js — подключён следом): помощники и действия.
   Первая отрисовка — когда загружены все скрипты, иначе #/edit открылся бы без редактора. */
window.TAPP = {I, h, sheet, closeSheet, say, ava, go, nav, nb, fmtDay, dayWord, dayInfo, first, APP, ACT, pick: sheetPick, swipeDown, whoT, dateT, sheetDate, tabbar, repaint, nextFree, dayLong: d => dayLong(d), eye: eyeBtn, cal: calBtn};
const boot = () => { if(window.TED) Object.assign(ACT, window.TED.acts); if(window.TACC) Object.assign(ACT, window.TACC.acts); if(window.TBASES) Object.assign(ACT, window.TBASES.acts); render(); first_ = false };
if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
