/* ═══════════════════════════════════════════════════════════════
   ТРЕНЕРСКОЕ ПРИЛОЖЕНИЕ · РЕДАКТОР ТРЕНИРОВКИ (#/edit/<кто>/<дата>)

   Конструктор кабинета, перерисованный под телефон (структура согласована
   14.11.2026). Документ дня читается сверху вниз: название · «Клиент видит»
   · блоки карточками · «+ Блок». Строка упражнения показывает итог
   («5×3 · 80 % → 96 кг»), правка — в шторке с цифровыми полями: поля прямо
   в строке на телефоне и были неуклюжими. Модель и запись — общие с
   кабинетом (data.js): блоки, сеты (ss + sub), связки (chain), строки и
   блоки текстом, тип блока и настройка комплекса; запись — putDay(), как у
   «Сохранить» в кабинете, поэтому день сразу виден в кабинете и у клиента.

   Сохранение — кнопкой «Сохранить»: плавает внизу экрана, пока есть
   несохранённые правки; «‹» с правками спрашивает; «Отменить правки» —
   в настройках тренировки (шестерёнка). Публикация — глаз в шапке,
   срабатывает сразу и записывает день (выключен — черновик). Жесты дублируются кнопками (HIG): смахнуть строку — «Удалить»
   (есть в шторке строки), долгое нажатие — меню строки (то же в шторке),
   перетаскивание — в режиме «Изменить порядок» из меню дня.
   ═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';
const T = window.TAPP; if(!T) return;
const {I, sheet, closeSheet, say, ava} = T;
const h = esc;
const root = document.documentElement;

let ED = null;           /* открытый день: кто, дата, рабочая копия блоков, статус */
let LAYER = null;

const REST_T = new Set(['Отдых', '—', '']);
const VOL = ['м', 'сек', 'мин', 'кал'];
const PRESETS = ['3×10', '4×8', '5×5', '5×3', '3×12', '3×15', '21-15-9'];
const REST_PRESETS = ['', '30 сек', '1 мин', '1:30', '2 мин'];
const sv = d => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">${d}</svg>`;
const IC = {
  grip: sv('<path d="M5 9h14M5 15h14"/>'),
  text: sv('<path d="M5 6h14M5 11h14M5 16h9"/>'),
  spark: sv('<path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8L12 18.5l-1.8-5.9L4.5 10.8 10.2 9z"/><path d="M19 3.5v3M17.5 5h3"/>'),
  list: sv('<circle cx="5" cy="7" r="1" fill="currentColor"/><circle cx="5" cy="12" r="1" fill="currentColor"/><circle cx="5" cy="17" r="1" fill="currentColor"/><path d="M9 7h11M9 12h11M9 17h11"/>'),
  set: sv('<path d="M4 12a8 8 0 0 1 13.7-5.6L20 8.5M20 4v4.5h-4.5M20 12a8 8 0 0 1-13.7 5.6L4 15.5M4 20v-4.5h4.5"/>'),
  chain: sv('<path d="M10 14a4 4 0 0 0 5.7 0l3-3a4 4 0 0 0-5.7-5.7l-1 1M14 10a4 4 0 0 0-5.7 0l-3 3a4 4 0 0 0 5.7 5.7l1-1"/>'),
  move: sv('<path d="M5 12h14M13 6l6 6-6 6"/>'),
  trash: sv('<path d="M4.5 7h15M10 11v6M14 11v6M6.5 7l1 12.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5l1-12.5M9.5 7V4.5h5V7"/>'),
  erase: sv('<path d="M8 20h12M5.5 14.5 14 6l5 5-8.5 8.5H8z"/>'),
  sort: sv('<path d="M8 4v16M4.5 7.5 8 4l3.5 3.5M16 20V4M12.5 16.5 16 20l3.5-3.5"/>'),
  minus: sv('<path d="M6 12h12"/>'),
  range: sv('<path d="M4 12h16M4 8v8M20 8v8"/>'),
  ungroup: sv('<path d="M4 7h7M4 12h7M4 17h7M15 9l4 3-4 3"/>'),
  undo: sv('<path d="M9 14 4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>'),
  pen: sv('<path d="M15 4.5 19.5 9 9 19.5H4.5V15z"/><path d="M12.5 7l4.5 4.5"/>'),
  tglyph: sv('<path d="M5.5 7V5h13v2M12 5v14M9 19h6"/>'),
  cam: sv('<path d="M3 8a2 2 0 0 1 2-2h2l1.5-2h7L17 6h2a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><circle cx="12" cy="12.5" r="3.5"/>')
};

/* ─── помощники ─── */
const isG = () => !!(ED && ED.w && ED.w.members);
const pm = () => isG() || !ED.w ? {} : pmOf(ED.w.id);
const firstN = n => String(n || '').split(' ')[0];
const aud = () => isG() ? 'участники' : ED.w ? firstN(ED.w.n) : 'клиент';
/* режим шаблона (Базы → блок или тренировка, bases.js): ED.tpl = {lvl, t, folder, done};
   клиента и даты нет — ED.w и ED.date пусты. solo — шаблон блока: в нём ровно один блок. */
const TM = () => ED && ED.tpl ? ED.tpl.lvl : null;
const solo = () => TM() === 'блок';
const sees = () => isG() ? 'видят' : 'видит';
/* «для Артёма»: родительный падеж имени по простому правилу (как в кабинете) */
const GEN_EX = {'Пётр':'Петра', 'Павел':'Павла', 'Лев':'Льва', 'Игорь':'Игоря'};
function gen(name){
  const n = firstN(name); if(GEN_EX[n]) return GEN_EX[n];
  const l = n.slice(-1).toLowerCase(), pre = n.slice(-2, -1).toLowerCase();
  if(l === 'а') return n.slice(0, -1) + ('гкхжчшщ'.includes(pre) ? 'и' : 'ы');
  if(l === 'я') return n.slice(0, -1) + 'и';
  if(l === 'й' || l === 'ь') return n.slice(0, -1) + 'я';
  return n + 'а';
}
const num = s => { const t = String(s ?? '').trim().replace(',', '.'); return t === '' || isNaN(+t) ? null : +t };
const blk = id => ED.blocks.find(b => b.id === id);
function findIt(id){
  for(const b of ED.blocks){ const k = (b.items || []).findIndex(x => x.id === id); if(k >= 0) return {b, k, it:b.items[k]} }
  return null;
}
const exName = it => it.exId ? (byId(it.exId) || {}).ru || 'Упражнение' : String(it.raw || '').trim();
const cap1 = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const pl = (n, a, b, c) => n + ' ' + plural3(n, a, b, c);

/* ─── день: загрузка, слепок, запись ─── */
const msgArr = (id, date) => TALK.workout[talkKey(id, date)] || [];
const msgOf = (id, date) => (msgArr(id, date).find(m => m.who === 'trainer') || {}).text || '';
function putMsg(id, date, text){
  const arr = (TALK.workout[talkKey(id, date)] ||= []), k = arr.findIndex(m => m.who === 'trainer'), t = String(text || '').trim();
  if(!t){ if(k >= 0) arr.splice(k, 1); return }
  if(k >= 0) arr[k].text = t; else arr.unshift({who:'trainer', text:t, at:'сейчас'});
}
function load(w, date){
  let x = null, rec = false; const pid = w.prog && program(w.prog) ? w.prog : null;
  if(pid){ const i = daysBetween(program(pid).start, date); if(i >= 0){ x = buildPlan(pid)[i] || null; rec = !!((STATE.days || {})[pid] || {})[i] } }
  const has = !!x && dayHas(x);
  ED = {w, date, pid,
    title: x && !REST_T.has(x.title) ? x.title : '', comp: !!(x && x.comp),
    blocks: x ? restoreBlocks(JSON.parse(serializeDay(x))) : [],
    on: has && !x.draft, pub: x ? x.pub || '' : '', had: has,
    g: x && x.g && !w.members ? grp(x.g) || null : null,
    msg: msgOf(w.id, date), reorder: false, pending: null, flash: new Set(),
    wrote: rec && !!x && !REST_T.has(x.title) && !!String(x.title || '').trim()};   /* день с одним названием уже записан — пишем и его очистку */
  ED.blocks.forEach(normSS);
  mark();
}
const content = () => serializeDay({title:ED.title, comp:ED.comp, blocks:ED.blocks});
const sig = () => content() + '|' + ED.on + '|' + ED.msg + (ED.tpl ? '|' + ED.tpl.folder : '');
const dirty = () => !!ED && sig() !== ED.sig0;
/* слепок последней записи — для «Отменить правки» (настройки тренировки): вернуть к сохранённому */
const snapOf = () => JSON.stringify({title:ED.title, comp:ED.comp, blocks:ED.blocks, on:ED.on, msg:ED.msg, folder:ED.tpl ? ED.tpl.folder : null});
function mark(){ ED.sig0 = sig(); ED.snap = snapOf() }
function restore(s){ const o = JSON.parse(s); Object.assign(ED, {title:o.title, comp:o.comp, blocks:o.blocks, on:o.on, msg:o.msg, pending:null}); if(ED.tpl) ED.tpl.folder = o.folder }
const hasContent = () => ED.blocks.some(blockHas);

/* ─── сохранение ───
   Явное, кнопкой: пока есть несохранённые правки, внизу экрана плавает «Сохранить» (под большим
   пальцем); нажали — день записан, кнопка ушла, подсказка говорит, видит ли клиент. «‹» с
   несохранённым спрашивает «Сохранить изменения?»; уход жестом «назад» правки не теряет — дописывает. */
const keep = () => dirty() ? doneMsg(save()) : '';
const emptyMsg = () => ED.tpl ? 'Пустой шаблон не сохраняется — добавьте название или упражнение' : 'Пустая тренировка не сохраняется — добавьте упражнение';
function syncBar(){
  const full = LAYER && LAYER.querySelector('.full.ed'); if(!full || !ED) return;
  if(!full.querySelector('.ed-save')) full.insertAdjacentHTML('beforeend', `<div class="ed-save"><button class="btn" data-act="e-save">Сохранить</button></div>`);
  const on = dirty() && !ED.reorder && !ED.sel;
  full.classList.toggle('dirty', on); full.querySelector('.ed-save').inert = !on;
  selBar(full);
}
document.addEventListener('input', () => { if(ED) setTimeout(syncBar, 0) });   /* поля без перерисовки (названия) — тоже правка */

function save(){
  if(ED.tpl) return saveTpl();
  const c = content(), has = contentHas(c), named = !isG() && !!ED.title.trim();
  /* совсем пустой новый день не создаём; с одним названием — создаём (у группы — нет: её день расходится участникам) */
  if(!has && !named && !ED.had && !ED.wrote){ writeMsg(); saveState(); mark(); return ED.msg ? 'msg' : 'none' }
  const loc = ensureDay(ED.w.id, ED.date); if(!loc) return 'none';
  const on = ED.on && has;
  if(on) putDay(loc.pid, loc.i, {c, draft:false});
  else putDay(loc.pid, loc.i, {c, pub:ED.pub, draft:true});
  const un = (STATE.unsaved || {})[loc.pid]; if(un) delete un[loc.i];       /* несохранённые правки кабинета на этот день устарели */
  writeMsg(); saveState();
  mark(); ED.had = has; ED.wrote = true; if(on) ED.pub = c;
  return on ? 'pub' : has || named ? 'draft' : 'empty';
}
/* сообщение ко всей тренировке; у группы — каждому участнику, у кого день группы */
function writeMsg(){
  putMsg(ED.w.id, ED.date, ED.msg);
  if(isG()){ const st = groupDayStat(ED.w, ED.date); (st ? st.got : []).forEach(cid => putMsg(cid, ED.date, ED.msg)) }
}
const doneMsg = r => !r || r === 'none' ? '' : savedMsg(r);
const savedMsg = r => r === 'pub' ? `Сохранено — ${aud()} ${sees()} тренировку`
  : r === 'draft' ? `Сохранено черновиком — ${aud()} не ${sees()}` : r === 'empty' ? 'День очищен' : r === 'msg' ? 'Сообщение сохранено'
  : r === 'tpl' ? 'Сохранено в базе' : r === 'tplnew' ? (solo() ? 'Блок добавлен в вашу базу' : 'Тренировка добавлена в вашу базу') : 'Сохранено';

/* ═══════════ ШАБЛОН В БАЗЕ (как ?tpl= конструктора кабинета) ═══════════
   Тот же редактор, но без клиента, даты, публикации и сообщения. Блок
   шаблона помнит, из какого блока базы пришёл (src) и каким был (srcSig):
   не изменился — тренировка так и ссылается на блок базы; изменённый
   становится её собственным (inline), блок в базе и другие тренировки
   правка не трогает (trainer.js: tplPersist). */
const blockSig = b => serializeDay({title:'', blocks:[b]});
function tplBlockOf(t){
  const b = tplToBlock(t); b.title = t.title;
  b.src = t.id; b.srcSig = blockSig(b); return b;
}
function loadTpl(t, lvl, opt){
  const isB = lvl === 'блок';
  const blocks = isB ? [t ? tplBlockOf(t) : mkBlock(null, '', '', null, [])] : t ? (t.blocks || []).map(tplById).filter(Boolean).map(tplBlockOf) : [];
  ED = {w:null, date:null, pid:null, tpl:{lvl, t:t || null, folder:(t && t.folder) || opt.folder || null, done:opt.done || null, saved:null},
    title: !isB && t ? t.title : '', comp:false, blocks, on:false, pub:'', had:!!t, g:null, msg:'', reorder:false, pending:null, flash:new Set()};
  ED.blocks.forEach(normSS);
  mark();
}
const blockRec = b => ({kind:b.kind || null,
  title: b.title || blockTypeLabel(b) || (isTextBlock(b) ? firstTextLine(b.text) : '') || 'Блок без названия', fmt: b.fmt ? {...b.fmt} : null,
  ...(isTextBlock(b) ? {text:b.text, items:[]}
    : {items: normSS({items:(b.items || []).filter(i => itemHas(i) || i.ss).map(i => ({...i}))}).items.map(i => i.ss ? [SS_TAG, i.rounds, i.rest || ''] : tplArr(i))})});
function saveTpl(){
  /* id новой записи — один на шаблон и на его собственные блоки (owner): иначе повторная запись плодила бы блоки */
  const P = ED.tpl, T0 = P.t, nid = T0 ? T0.id : freshId('u'), meta = lvl => T0 ? {id:T0.id, lvl, own:true, at:T0.at, used:T0.used || 0} : {id:nid, lvl, own:true, at:TODAY, used:0};
  let t;
  if(P.lvl === 'блок'){
    const b = ED.blocks[0]; if(!b || (!T0 && !blockHas(b) && !String(b.title || '').trim())) return 'none';
    t = {...meta('блок'), folder: P.folder || TYPE_FOLDER[b.kind] || 'Разминки', ...blockRec(b)};
  } else {
    if(!T0 && !hasContent() && !ED.title.trim()) return 'none';
    const wid = nid;
    const ids = ED.blocks.filter(b => blockHas(b) || ownTitle(b) || b.note).map(b => {
      const src = b.src && tplById(b.src);
      if(src && !src.inline && blockSig(b) === b.srcSig) return src.id;
      const x = src && src.inline && src.owner === wid ? {...src, ...blockRec(b)}
        : {id:freshId('u'), lvl:'блок', own:true, inline:true, owner:wid, at:TODAY, used:0, folder:TYPE_FOLDER[b.kind] || 'Разминки', ...blockRec(b)};
      if(!isTextBlock(b)) delete x.text;
      tplPut(x); b.src = x.id; b.srcSig = blockSig(b);
      return x.id;
    });
    t = {...meta('тренировка'), title: ED.title.trim() || 'Тренировка без названия', blocks:ids};
  }
  tplPut(t); P.t = P.saved = t; ED.had = true; mark();
  return T0 ? 'tpl' : 'tplnew';
}
/* «Добавить клиенту» / «В тренировку» из базы (bases.js): выбранный день получает упражнение
   или шаблон, как ?addex= / ?addtpl= кабинета. Готовая тренировка с mode 'replace' встаёт
   вместо тренировки дня, иначе добавляется к ней. */
let QUEUE = null;
function applyQueue(q){
  if(q.ex){ const e = byId(q.ex); if(!e) return ''; const b = mkBlock(null, '', '', null, []), it = mkItem(e.id);
    ED.blocks = ED.blocks.filter(x => blockHas(x) || x.title || x.note); b.items.push(it); ED.blocks.push(b); ED.flash.add(it.id);
    return '«' + e.ru + '» — в тренировке'; }
  const t = q.tpl && tplById(q.tpl); if(!t) return '';
  const bs = t.lvl === 'блок' ? [tplToBlock(t)] : tplToWorkout(t).blocks;
  const keep = ED.blocks.filter(x => blockHas(x) || x.title || x.note), rep = t.lvl !== 'блок' && q.mode === 'replace';
  if(t.lvl !== 'блок' && (rep || !ED.title.trim())) ED.title = t.title;
  ED.blocks = (rep ? [] : keep).concat(bs);
  bs.forEach(b => (b.items || []).forEach(i => ED.flash.add(i.id)));
  return (t.lvl === 'блок' ? 'Блок «' : 'Тренировка «') + t.title + '» — ' + (rep ? 'вместо прежней' : keep.length && t.lvl !== 'блок' ? 'добавлена к тренировке дня' : 'в тренировке');
}
function openTpl(t, lvl, layer, opt = {}){
  LAYER = layer; closeSheet(true);
  loadTpl(t, lvl, opt);
  const html = `<div class="full ed tplm" data-key="${h('tpl|' + (t ? t.id : 'new'))}"><div class="ed-hd"></div><div class="ed-scr" id="edScr"></div></div>`;
  const old = LAYER.querySelector('.full'); if(old) old.outerHTML = html; else LAYER.insertAdjacentHTML('beforeend', html);
  const el = LAYER.querySelector('.full.tplm');
  draw(true);
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('on')));
  if(!t) setTimeout(() => { const i = el.querySelector('#edTitle'); if(i) i.focus() }, 340);
}
function tplHead(){
  const isB = solo(), T0 = ED.tpl.t;
  return `<header class="nav"><div class="nav-in">
    <div class="nav-l">${backBtn()}</div>
    <h1>${isB ? (T0 ? 'Блок' : 'Новый блок') : (T0 ? 'Тренировка' : 'Новая тренировка')}<small>шаблон в базе</small></h1>
    <div class="nav-r"></div></div></header>`;
}
/* выход — «‹»; с несохранёнными правками спросит (askLeave). Сохраняют кнопкой «Сохранить» внизу экрана */
const backBtn = () => `<button class="nb" data-act="e-close" aria-label="Назад">${I.back}</button>`;
function tplStatusHTML(){
  const rows = [];
  if(solo()) rows.push(`<button class="lrow" data-act="e-tfolder"><span class="ic">${I.bases}</span><span class="t"><b>Папка</b><s>${h(ED.tpl.folder || TYPE_FOLDER[(ED.blocks[0] || {}).kind] || 'Разминки')}</s></span>${I.chev}</button>`);
  rows.push(`<div class="lrow"><span class="ic">${I.eyeoff || I.bases}</span><span class="t"><b>Шаблон — клиенты его не видят</b><s>Правка не меняет тренировки, где он уже стоит в календаре. Сохраняется кнопкой «Сохранить»</s></span></div>`);
  return `<section class="ed-st">${rows.join('')}</section>`;
}

/* ═══════════ ОТКРЫТЬ / ЗАКРЫТЬ ═══════════ */
function open(w, date, layer){
  LAYER = layer;
  const key = 'ed|' + w.id + '|' + date;
  let el = LAYER.querySelector('.full');
  if(el && el.dataset.key === key && ED) return;
  load(w, date);
  const q = QUEUE; QUEUE = null; const qmsg = q ? applyQueue(q) : '';
  const html = `<div class="full ed" data-key="${h(key)}"><div class="ed-hd"></div><div class="ed-scr" id="edScr"></div></div>`;
  if(el) el.outerHTML = html; else LAYER.innerHTML = html;
  el = LAYER.querySelector('.full');
  draw(true);
  if(qmsg) say(qmsg + '. Нажмите «Сохранить»');
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('on')));
}
function exit(){
  if(ED && ED.tpl){ const P = ED.tpl, el = LAYER && LAYER.querySelector('.full.tplm'); ED = null;
    if(el){ el.classList.remove('on'); setTimeout(() => el.remove(), 320) } if(P.done) P.done(P.saved); return }
  ED = null; T.ACT['full-close']();
}
function askLeave(then){
  if(!dirty()){ then(false); return }
  const ov = sheet({id:'leave', title:'Сохранить изменения?', sub:ED.tpl ? 'В шаблоне есть несохранённые правки' : 'В тренировке есть несохранённые правки',
    body:`<div class="sh-p ed-ask">
      <button class="btn" data-act="e-leave" data-k="save">Сохранить</button>
      <button class="btn o rm" data-act="e-leave" data-k="drop">Не сохранять</button>
      <button class="btn o" data-act="close-sheet">Продолжить правку</button></div>`});
  ov._then = then;
}
/* ушли из правки не через «‹» (жест/кнопка «Назад» браузера, ссылка): спросить уже нельзя — дописываем,
   чтобы правки не пропали. app.js зовёт перед каждой сменой экрана; тот же день — не уход. */
function leave(r){
  if(!ED || ED.tpl) return;
  if(r && r.name === 'edit' && r.args[0] === ED.w.id && r.args[1] === ED.date) return;
  const msg = keep(); ED = null; if(msg) say(msg);
}

/* ═══════════ ОТРИСОВКА ═══════════ */
function headHTML(){
  if(ED.sel){ const n = ED.sel.size;
    return `<header class="nav"><div class="nav-in"><div class="nav-l"></div><h1>Объединить<small>${n ? 'выбрано ' + n : 'отметьте строки одного блока'}</small></h1>
    <div class="nav-r"><button class="nb" data-act="e-sel-x" aria-label="Отменить выбор">${I.x}</button></div></div></header>` }
  if(ED.reorder) return `<header class="nav"><div class="nav-in"><div class="nav-l"></div><h1>Порядок<small>перетащите за ${'≡'}</small></h1>
    <div class="nav-r"><button class="nb ok" data-act="e-reorder" aria-label="Готово"><i>${I.check}</i></button></div></div></header>`;
  if(ED.tpl) return tplHead();
  /* шапка — как в просмотре: «‹», имя ▾ (сменить), справа значки — день (календарь с числом) и глаз публикации
     (в просмотре к ним добавляется карандаш) */
  return `<header class="nav lead"><div class="nav-in">
    <div class="nav-l">${backBtn()}</div>
    <h1>${T.whoT(ED.w, 'e-who')}</h1>
    <div class="nav-r">${T.cal(ED.date, 'e-date')}${ED.blocks.length || ED.had ? pubEye() : ''}</div></div></header>`;
}
function draw(top){
  if(!ED || !LAYER) return;
  syncBar();
  const full = LAYER.querySelector('.full.ed'); if(!full) return;
  const scr = full.querySelector('.ed-scr'), y = scr.scrollTop;
  full.querySelector('.ed-hd').innerHTML = headHTML();
  full.classList.toggle('reorder', ED.reorder);
  scr.innerHTML = bodyHTML();
  scr.scrollTop = top ? 0 : y;
  bind(scr);
  ED.flash.clear();
}
function meta(){
  const bs = ED.blocks.filter(blockHas), nx = bs.reduce((a, b) => a + (isTextBlock(b) ? 0 : b.items.filter(itemHas).length), 0),
    nt = bs.filter(isTextBlock).reduce((a, b) => a + textLines(b.text).length, 0);
  return [bs.length ? pl(bs.length, 'блок', 'блока', 'блоков') : '', nx ? pl(nx, 'упражнение', 'упражнения', 'упражнений') : '',
    nt ? pl(nt, 'строка', 'строки', 'строк') + ' текстом' : ''].filter(Boolean).join(' · ') || 'пока пусто';
}
function bodyHTML(){
  const fresh = !ED.blocks.length;
  /* верх дня — оранжевая плашка, как шапка просмотра (workout.html, .wvdoc .doch): только название тренировки
     (переносится, не обрезается) и справа шестерёнка настроек — единственное отличие от плашки просмотра.
     День выбирают значком календаря в шапке экрана, публикацию — глазом там же. Под названием — только
     отметка «Соревнование», у шаблона — его сводка; «N блоков · N упражнений» у дня не пишем */
  const comp = ED.comp ? `<span class="pill acc">${I.trophy.replace('<svg', '<svg width="13" height="13"')}Соревнование</span>` : '';
  const sub = ED.reorder ? '' : ED.tpl ? h(fresh ? 'Выберите, с чего начать' : meta()) : comp;
  let out = `<section class="ed-top">
      <div class="ed-tr"><textarea class="ed-title" id="edTitle" rows="1" placeholder="${solo() ? 'Название блока' : TM() ? 'Название тренировки' : 'Новая тренировка'}" aria-label="${solo() ? 'Название блока' : 'Название тренировки'}" enterkeyhint="done" autocomplete="off" ${ED.reorder ? 'disabled' : ''}>${h(solo() ? (ED.blocks[0] || {}).title || '' : ED.title)}</textarea>
      ${ED.reorder ? '' : `<button class="nb gear" data-act="e-dmenu" aria-label="${solo() ? 'Настройки блока' : 'Настройки тренировки'}">${I.gear}</button>`}</div>
      ${sub ? `<div class="ed-sub">${sub}</div>` : ''}
    </section>`;
  if(!ED.reorder) out += ED.tpl ? tplStatusHTML() : statusHTML(fresh);
  if(fresh && !ED.reorder) return out + startHTML();
  const pendAt = ED.pending ? ED.blocks.findIndex(b => ED.pending.ids.has(b.id)) : -1;
  out += `<div class="ed-blocks">${ED.blocks.map((b, k) => (k === pendAt ? pendingHTML() : '') + blockHTML(b, k)).join('')}</div>`;
  if(!ED.reorder && !solo()) out += `<section class="ed-add">
      <button class="btn s o" data-act="e-addblk">${I.plus}Блок</button>
      <button class="btn s o" data-act="e-photo">${IC.cam}Фото</button>
      <button class="btn s o" data-act="e-tpl" data-k="блок">${I.bases}Из базы</button></section>`;
  return out;
}
/* день коротко, как в просмотре: «Сегодня», «Вчера», «Завтра», иначе «14 ноября» */
/* публикация — глаз в шапке справа (тот же, что в просмотре и у «Опубликовать / Скрыть» в календаре):
   оранжевый — клиент видит, серый перечёркнутый — черновик. Подпись не нужна, состояние видно по значку */
function pubEye(){
  const has = hasContent(), on = ED.on && has;
  return T.eye(on, 'e-pub', isG() ? 'Видят участники' : 'Видит клиент', has ? '' : 'disabled');
}
function statusHTML(fresh){
  const rows = [];
  if(ED.msg) rows.push(`<button class="lrow" data-act="e-msg">
      <span class="ic">${I.msg}</span><span class="t"><b>Сообщение ${isG() ? 'группе' : 'клиенту'}</b><s>${h(ED.msg)}</s></span>${I.chev}</button>`);
  if(isG()){
    const G = ED.w, st = groupDayStat(G, ED.date), n = G.members.length;
    rows.push(`<div class="lrow ed-grp"><span class="stk">${G.members.slice(0, 4).map(id => ava(client(id), 's')).join('')}</span>
      <span class="t"><b>${pl(n, 'участник', 'участника', 'участников')}</b><s>${!n ? 'добавьте участников в карточке группы' : st ? (st.none.length ? `тренировка у ${st.got.length} из ${n}` : 'тренировка у всех') : 'тренировка появится у каждого'}</s></span></div>`);
  }
  if(ED.g) rows.push(`<div class="lrow ed-from"><span class="ic">${I.users}</span>
      <span class="t"><b>Тренировка группы «${h(ED.g.n)}»</b><s>Правка — только для ${h(gen(ED.w.n))}. Следующая правка дня в группе её заменит</s></span>
      <a class="lnk" href="#/edit/${ED.g.id}/${ED.date}">Группа</a></div>`);
  return rows.length ? `<section class="ed-st">${rows.join('')}</section>` : '';
}
/* «Как начать» (15.11.2026, одинаково с кабинетом): «Написать» — первый блок с клавиатурой
   в строке «Добавить упражнение» (подсказки из базы, Enter — строка текстом, вставка
   нескольких строк — блок текстом), «Скопировать из календаря» и «Из базы». Отдельные
   «Добавить упражнение» и «Вставить текстом» вошли в «Написать»; «Повторить прошлую» не нужна —
   копируют похожую тренировку, а не предыдущую */
function startHTML(){
  const S = [
    ['e-write', IC.pen, 'Написать', 'Упражнения из базы или любой текст'],
    ['e-photo', IC.cam, 'Фото', 'Тетрадь, доска или скриншот — ИИ разберёт на упражнения'],
    ['e-copy', I.cal, 'Скопировать из календаря', `Тренировка с любого дня — ${isG() ? 'этой группы' : 'этого клиента'} или другого`],
    ['e-tpl', I.bases, 'Из базы', solo() ? 'Блок из ваших баз' : 'Тренировка или блок из ваших баз']].filter(x => (!ED.tpl || x[0] !== 'e-copy') && (!solo() || x[0] !== 'e-photo'));
  return `<section class="ed-start"><div class="cap">Как начать</div>${S.map(([a, ic, b, s]) =>
    `<button class="lrow" data-act="${a}" data-new="1"><span class="ic acc">${ic}</span><span class="t"><b>${b}</b><s>${s}</s></span>${I.chev}</button>`).join('')}</section>`;
}
function pendingHTML(){
  const P = ED.pending, bs = ED.blocks.filter(b => P.ids.has(b.id)), its = bs.flatMap(b => b.items.filter(itemHas));
  const ex = its.filter(i => i.exId || i.chain).length, raw = its.length - ex;
  return `<div class="ed-ai"><b>${IC.spark}${P.photo ? 'Распознано с фото' : 'Разобрано ИИ'} — проверьте</b>
    <s>${[pl(bs.length, 'блок', 'блока', 'блоков'), pl(ex, 'упражнение', 'упражнения', 'упражнений'), raw ? pl(raw, 'строка', 'строки', 'строк') + ' текстом' : ''].filter(Boolean).join(' · ')}</s>
    <div><button class="btn s o" data-act="e-ai-no">${P.photo ? 'Оставить текстом' : 'Вернуть текст'}</button><button class="btn s" data-act="e-ai-yes">Принять</button></div>
    <button class="lnk" data-act="e-ai-src" style="margin:6px 0 0">${P.photo ? 'Фото' : 'Исходный текст'}</button></div>`;
}
const handle = (kind, id) => `<span class="hd" data-drag="${kind}" data-id="${id}" role="button" aria-label="Перетащить">${IC.grip}</span>`;
/* Блок в режиме правки — как в просмотре (формат клиентского приложения): название 17 pt,
   справа тип мелким серым и «•••», строки «5×3 Приседания со штангой 80 % · 120 кг» одной
   строкой, группы (настройка комплекса, сет) — через тонкую линию. Нажатие на строку —
   шторка правки; смахивание — «Удалить»; в конце блока — строка ввода. */
function blockHTML(b, k){
  const txt = isTextBlock(b), lab = blockTypeLabel(b), pend = ED.pending && ED.pending.ids.has(b.id), fmt = b.fmt && typeof b.fmt === 'object' ? b.fmt : null;
  /* шапка блока — как в просмотре (.wbh): номер, название, под ним тип серым (нажатие — сменить), справа «•••».
     У комплекса под типом «Комплекс ▾» — строкой в шапке настройка с расшифровкой: «AMRAP 12 — максимум раундов
     за 12:00» (15.11: не отдельной строкой в теле блока и не за «?»); нажатие — та же шторка типа */
  const ty = ED.reorder ? '' : `<button class="eb-ty${lab ? ' on' : ''}" data-act="e-type" data-b="${b.id}" aria-label="Тип блока: ${h(lab || 'не задан')}"><span>${h(lab ? (fmt ? 'Комплекс' : lab) : 'Тип блока')}</span>${I.down}</button>`;
  const fcap = fmt && !ED.reorder ? `<button class="eb-fmt" data-act="e-type" data-b="${b.id}">${h(fmtLabel(fmt) + (fmtDesc(fmt) ? ' — ' + fmtDesc(fmt) : ''))}</button>` : '';
  return `<section class="eb${pend ? ' pend' : ''}${txt ? ' tb' : ''}" data-b="${b.id}">
    <div class="eb-h${solo() ? ' solo' : ''}">
      ${solo() ? '<span class="eb-t eb-solo">Состав блока</span><span class="eb-tyr">' + ty + '</span>' : `<span class="eb-no" aria-hidden="true">${k + 1}</span>
      <div class="eb-tt"><textarea class="eb-t" data-bt="${b.id}" rows="1" placeholder="${txt ? 'Блок текстом' : 'Блок ' + (k + 1)}" aria-label="Название блока ${k + 1}" enterkeyhint="done" autocomplete="off" ${ED.reorder ? 'disabled' : ''}>${h(b.title)}</textarea><span class="eb-tyr">${ty}</span>${fcap}</div>`}
      ${txt && !ED.reorder ? `<button class="eb-ai" data-act="e-ai" data-b="${b.id}" aria-label="Разобрать на упражнения — ИИ" ${String(b.text || '').trim() ? '' : 'disabled'}>${IC.spark}<span>AI</span></button>` : ''}
      ${ED.reorder ? '' : `<button class="nb eb-tg${txt ? ' on' : ''}" data-act="e-btoggle" data-b="${b.id}" aria-pressed="${txt}" aria-label="${txt ? 'Блок текстом — вернуть строками' : 'Писать блок текстом'}">${IC.tglyph}</button>`}
      ${ED.reorder ? handle('b', b.id) : solo() ? '' : `<button class="nb" data-act="e-bmenu" data-b="${b.id}" aria-label="Действия с блоком ${h(b.title || 'Блок ' + (k + 1))}">${I.more}</button>`}
    </div>
    ${b.note && !ED.reorder ? `<button class="eb-n" data-act="e-note" data-b="${b.id}">${I.msg}<span>${h(b.note)}</span></button>` : ''}
    ${txt ? textBodyHTML(b) : `<div class="eb-items" data-items="${b.id}">${solo() && fcap ? fcap.replace('eb-fmt', 'er-fmt') : ''}
        ${itemsHTML(b)}</div>
      ${ED.reorder ? '' : `<div class="qadd"><span class="qi">${I.plus}</span><input class="qa-in" data-qb="${b.id}" placeholder="Добавить упражнение" enterkeyhint="enter" autocomplete="off" autocapitalize="sentences" aria-label="Добавить упражнение в блок">
        <button class="nb" data-act="e-add" data-b="${b.id}" aria-label="База упражнений — несколько сразу, сетом, связкой">${I.search}</button></div>
        <div class="qsug" data-sug="${b.id}"></div>`}`}
  </section>`;
}
function itemsHTML(b){
  let out = '', k = 0; const its = b.items || [];
  while(k < its.length){
    const it = its[k];
    if(it.ss){ const j = ssEnd(its, k); out += `<div class="ers" data-ss="${it.id}">${rowHTML(it)}${its.slice(k + 1, j).filter(itemHas).map(rowHTML).join('')}${it.rest && !ED.reorder ? `<div class="er-rest">Отдых ${h(it.rest)} между кругами</div>` : ''}</div>`; k = j; continue }
    if(itemHas(it)) out += rowHTML(it);
    k++;
  }
  return out;
}
/* нагрузка в строке: проценты и пересчёт в кг для клиента; у группы — только проценты */
function loadLine(it){
  const kg = kgText(it, pm()), l = loadText(it);
  if(it.pct != null) return isG() ? l : [l, kg ? kg + '\u00a0кг' : ''].filter(Boolean).join(' · ');
  return l;
}
function lineHTML(it){
  if(it.chain){ const prm = [loadLine(it), chainScheme(it)].filter(Boolean).join(' — ');
    return h(chainNames(it) || 'Связка') + (prm ? `: <span class="lx">${h(prm)}</span>` : ' <span class="ph">· задать повторы</span>') }
  if(!it.exId) return h(String(it.raw || ''));
  const nm = exName(it); if(it.txt) return h(nm) + ` <span class="lx">— ${h(it.txt)}</span>`;
  const ld = loadLine(it);
  return (it.scheme ? `<span class="sc">${h(it.scheme)}</span> ` : '') + h(nm) + (ld ? ` <span class="lx">${h(ld)}</span>` : '') + (!it.scheme && !ld ? ' <span class="ph">· задать схему</span>' : '');
}
function rowHTML(it){
  if(it.ss && ED.sel){ const on = ED.sel.has(it.id), sb = selBlock(), off = !!sb && !sb.items.includes(it);
    return `<div class="er ssh selr${on ? ' on' : ''}${off ? ' off' : ''}" data-id="${it.id}">
      <button class="er-m" data-act="e-sel-t" data-id="${it.id}" role="checkbox" aria-checked="${on}" ${off ? 'aria-disabled="true"' : ''}><span class="er-ck" aria-hidden="true">${I.check}</span><span class="xl">Сет · ${it.rounds} ${plural3(+it.rounds, 'круг', 'круга', 'кругов')}</span></button></div>` }
  if(it.ss) return `<div class="er ssh" data-id="${it.id}">
      <button class="er-m" data-act="e-ss" data-id="${it.id}" ${ED.reorder ? 'tabindex="-1"' : ''}><span class="xl">${it.rounds} ${plural3(+it.rounds, 'круг', 'круга', 'кругов')}:</span></button>${ED.reorder ? handle('ss', it.id) : ''}</div>`;
  const cls = it.chain ? 'chn' : it.exId ? 'ex' : 'raw';
  if(ED.sel){ const on = ED.sel.has(it.id), sb = selBlock(), off = !!sb && !sb.items.includes(it);
    return `<div class="er ${cls}${it.sub ? ' sub' : ''} selr${on ? ' on' : ''}${off ? ' off' : ''}" data-id="${it.id}">
    <button class="er-m" data-act="e-sel-t" data-id="${it.id}" role="checkbox" aria-checked="${on}" ${off ? 'aria-disabled="true"' : ''}><span class="er-ck" aria-hidden="true">${I.check}</span><span class="xl">${lineHTML(it)}</span></button></div>` }
  return `<div class="er ${cls}${it.sub ? ' sub' : ''}${ED.flash.has(it.id) ? ' new' : ''}" data-id="${it.id}">
    ${ED.reorder ? '' : `<button class="er-del" data-act="e-del" data-id="${it.id}" tabindex="-1">${IC.trash}Удалить</button>`}
    <button class="er-m" data-act="e-item" data-id="${it.id}" ${ED.reorder ? 'tabindex="-1"' : ''} aria-label="${h(it.chain ? 'Связка: ' + chainNames(it) : exName(it) || 'Строка')}"><span class="xl">${lineHTML(it)}</span></button>
    ${ED.reorder ? handle('it', it.id) : ''}</div>`;
}
function textBodyHTML(b){
  const t = String(b.text || '');
  const body = t.trim() ? t.split('\n').map(l => LIST_RE.test(l) ? `<span class="li">${h(l.replace(LIST_RE, ''))}</span>` : `<span>${h(l) || '&nbsp;'}</span>`).join('')
    : '<span class="ph">Пусто — нажмите, чтобы написать</span>';
  /* 15.11: текст пишут прямо в блоке, как в заметках (раньше — шторкой); body — вид для порядка и выбора строк */
  if(ED.reorder || ED.sel) return `<div class="eb-text">${body}</div>`;
  return `<textarea class="eb-ta" data-tb="${b.id}" rows="2" placeholder="Пишите как в заметках — каждое упражнение с новой строки" aria-label="Текст блока" autocapitalize="sentences">${h(t)}</textarea>`;
}

/* ═══════════ ЖИВЫЕ ЭЛЕМЕНТЫ: поля, смахивание, долгое нажатие, порядок ═══════════ */
function bind(scr){
  const t = scr.querySelector('#edTitle');
  if(t){
    /* название — многострочное поле по высоте текста: длинное переносится, а не обрезается; Enter — готово */
    const fit = () => { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px' };
    t.addEventListener('input', () => { if(/\n/.test(t.value)) t.value = t.value.replace(/\s*\n+\s*/g, ' ');
      if(solo()){ if(ED.blocks[0]) ED.blocks[0].title = t.value } else ED.title = t.value; fit() });
    t.addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); t.blur() } });
    fit(); requestAnimationFrame(fit);
  }
  scr.querySelectorAll('[data-bt]').forEach(i => {
    const fit = () => { i.style.height = 'auto'; i.style.height = i.scrollHeight + 'px' };
    i.addEventListener('input', () => { if(/\n/.test(i.value)) i.value = i.value.replace(/\s*\n+\s*/g, ' '); const b = blk(i.dataset.bt); if(b) b.title = i.value; fit() });
    i.addEventListener('change', () => { const b = blk(i.dataset.bt); if(b){ normFmt(b); draw() } });
    i.addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); i.blur() } });
    fit(); requestAnimationFrame(fit);
  });
  scr.querySelectorAll('.eb-ta').forEach(ta => {
    const fit = () => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px' };
    ta.addEventListener('input', () => { const x = blk(ta.dataset.tb); if(!x) return; x.text = ta.value; fit(); syncBar();
      const ai = ta.closest('.eb') && ta.closest('.eb').querySelector('.eb-ai'); if(ai) ai.disabled = !ta.value.trim() });
    ta.addEventListener('keydown', e => { if(e.key !== 'Enter') return;      /* Enter в пункте списка — новый пункт; пустой пункт — конец списка */
      const s = ta.selectionStart, ls = ta.value.lastIndexOf('\n', s - 1) + 1, line = ta.value.slice(ls, s);
      if(!LIST_RE.test(line)) return; e.preventDefault();
      if(!line.replace(LIST_RE, '').trim()) ta.setRangeText('', ls, s, 'end'); else ta.setRangeText('\n• ', s, ta.selectionEnd, 'end');
      ta.dispatchEvent(new Event('input')) });
    fit(); requestAnimationFrame(fit);
  });
  if(ED.focusTA){ const t = scr.querySelector(`.eb-ta[data-tb="${ED.focusTA}"]`); ED.focusTA = null;
    if(t){ t.focus({preventScroll:true}); t.setSelectionRange(t.value.length, t.value.length); t.scrollIntoView({block:'center'}) } }
  if(ED.reorder){ scr.querySelectorAll('.hd').forEach(d => d.addEventListener('pointerdown', dragStart)); return }
  if(ED.sel) return;
  scr.querySelectorAll('.er:not(.ssh)').forEach(bindRow);
  scr.querySelectorAll('.qa-in').forEach(bindQuick);
  if(ED.focusQ){ const i = scr.querySelector(`.qa-in[data-qb="${ED.focusQ}"]`); ED.focusQ = null; if(i){ i.focus(); i.scrollIntoView({block:'nearest'}) } }
}
/* Строка ввода в конце блока — как поле в конструкторе кабинета: печатают — подсказки из
   базы; выбрали — упражнение; Enter — строка остаётся текстом как написана (CON-5);
   «Разобрать ИИ» — схема и нагрузка из набранного; вставили несколько строк — блок текстом. */
function quickSug(bid, q){
  const t = q.trim(); if(!t) return '';
  const r = exSearch(t.replace(/\s+\d.*$/, '') || t, 'Все').slice(0, 5);
  return r.map(e => `<button class="qs-r" data-act="e-q-pick" data-b="${bid}" data-ex="${e.id}"><b>${h(e.ru)}</b><s>${h([e.g, e.eq].filter(x => x && x !== '—').join(' · '))}</s></button>`).join('')
    + `<button class="qs-r alt" data-act="e-q-raw" data-b="${bid}">${IC.text}<span>Добавить текстом: «${h(t)}»</span></button>`
    + (/\d/.test(t) ? `<button class="qs-r alt" data-act="e-q-ai" data-b="${bid}">${IC.spark}<span>Разобрать ИИ — упражнение, схема и нагрузка</span></button>` : '')
    + (r.length ? '' : `<button class="qs-r alt" data-act="e-q-own" data-b="${bid}">${I.plus}<span>Новое упражнение «${h(t)}»</span></button>`);
}
function bindQuick(inp){
  const bid = inp.dataset.qb, box = () => document.querySelector(`.qsug[data-sug="${bid}"]`);
  inp.addEventListener('input', () => { const b = box(); if(b) b.innerHTML = quickSug(bid, inp.value) });
  inp.addEventListener('keydown', e => { if(e.key !== 'Enter') return; e.preventDefault();
    if(inp.value.trim()) quickAdd(bid, rawItem(inp.value.trim()), 'Строка добавлена текстом — клиент увидит как написано'); else inp.blur() });
  /* подсказки (упражнение из базы, «Добавить текстом», ИИ) нажимаются, не забирая фокус у поля — клавиатура не закрывается */
  const sb = box(); if(sb) sb.addEventListener('mousedown', e => { if(e.target.closest('.qs-r')) e.preventDefault() });
  inp.addEventListener('paste', e => { const t = (e.clipboardData || window.clipboardData).getData('text');
    if(!t || !/\n/.test(t.trim())) return; e.preventDefault();
    const b = blk(bid), k = ED.blocks.indexOf(b), tb = textBlock(t.trim(), ''); ED.blocks.splice(k + 1, 0, tb); draw();
    setTimeout(() => scrollToBlock(tb.id), 30); say('Вставлено блоком текстом — разобрать на упражнения: значок AI справа вверху блока') });
}
/* Добавить строку из поля ввода блока. Поле и клавиатура остаются на месте (строки блока перерисовываются
   отдельно от поля), курсор — в пустом поле для следующей строки: пишут строка за строкой, как в Заметках;
   пустой «Ввод» — закончить. Подсказка про строку текстом — один раз, а не на каждой строке (15.11). */
function quickAdd(bid, it, msg){
  const b = blk(bid); if(!b) return;
  b.items = (b.items || []).filter(x => x.ss || itemHas(x)); b.items.push(it); normSS(b);
  ED.flash.add(it.id);
  const scr = document.getElementById('edScr'), box = scr && scr.querySelector(`.eb-items[data-items="${bid}"]`),
    inp = scr && scr.querySelector(`.qa-in[data-qb="${bid}"]`);
  if(box && inp && !ED.reorder && !ED.sel){
    const y0 = inp.getBoundingClientRect().top;
    const tmp = document.createElement('div'); tmp.innerHTML = blockHTML(b, ED.blocks.indexOf(b));
    const nb = tmp.querySelector('.eb-items'); box.replaceWith(nb); nb.querySelectorAll('.er:not(.ssh)').forEach(bindRow);
    scr.scrollTop += inp.getBoundingClientRect().top - y0;   /* поле остаётся на месте экрана — новая строка встаёт над ним */
    inp.value = ''; const sg = scr.querySelector(`.qsug[data-sug="${bid}"]`); if(sg) sg.innerHTML = '';
    const full = LAYER.querySelector('.full.ed'); full.querySelector('.ed-hd').innerHTML = headHTML();
    const sub = scr.querySelector('.ed-sub'); if(sub && ED.tpl) sub.textContent = meta();
    syncBar(); ED.flash.clear();
    inp.focus({preventScroll:true});
  } else { ED.focusQ = bid; draw() }
  ED.said = ED.said || new Set();
  if(msg && !ED.said.has(msg)){ ED.said.add(msg); say(msg) }
}
const quickText = bid => { const i = document.querySelector(`.qa-in[data-qb="${bid}"]`); return i ? i.value.trim() : '' };
let SWOPEN = null, LPFIRED = false;
function bindRow(er){
  const m = er.querySelector('.er-m'); if(!m) return;
  const W = 96; let x0 = null, y0 = 0, dx = 0, moved = false, lp = 0;
  m.addEventListener('pointerdown', e => {
    if(SWOPEN && SWOPEN !== er){ SWOPEN.classList.remove('open'); SWOPEN = null }
    x0 = e.clientX; y0 = e.clientY; dx = 0; moved = false; LPFIRED = false;
    clearTimeout(lp); lp = setTimeout(() => { if(!moved && x0 != null){ LPFIRED = true; x0 = null; try{ navigator.vibrate && navigator.vibrate(8) }catch(_){} itemMenu(er.dataset.id) } }, 520);
  });
  m.addEventListener('pointermove', e => {
    if(x0 == null) return; dx = e.clientX - x0;
    if(Math.abs(dx) > 8 || Math.abs(e.clientY - y0) > 8) clearTimeout(lp);
    if(Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(e.clientY - y0)){ moved = true; m.style.transition = 'none';
      m.style.transform = `translateX(${Math.max(-W - 24, Math.min(0, dx + (er.classList.contains('open') ? -W : 0)))}px)` }
  });
  const end = () => { clearTimeout(lp); if(x0 == null) return; x0 = null; m.style.transition = ''; m.style.transform = '';
    if(moved){ const op = dx < -44 || (er.classList.contains('open') && dx < 30); er.classList.toggle('open', op); SWOPEN = op ? er : null } };
  m.addEventListener('pointerup', end); m.addEventListener('pointercancel', end);
  m.addEventListener('click', e => { if(moved || LPFIRED || er.classList.contains('open')){ e.preventDefault(); e.stopImmediatePropagation(); if(!moved && !LPFIRED){ er.classList.remove('open'); SWOPEN = null } moved = false; LPFIRED = false } }, true);
}
/* перетаскивание за ≡: блоки между блоками, строки внутри блока, участники внутри сета */
let DR = null;
function dragStart(e){
  const hd = e.currentTarget, kind = hd.dataset.drag, scr = document.getElementById('edScr');
  const el = kind === 'b' ? hd.closest('.eb') : kind === 'ss' ? hd.closest('.ers') : hd.closest('.er');
  const box = el.parentElement, sel = kind === 'b' ? '.eb' : el.classList.contains('sub') ? '.er.sub' : ':scope > .er, :scope > .ers';
  e.preventDefault(); hd.setPointerCapture(e.pointerId);
  /* блок тащат свёрнутым: все блоки — до заголовков, иначе длинный блок пришлось бы тянуть через весь экран */
  if(kind === 'b'){ const t0 = el.getBoundingClientRect().top; box.classList.add('collapse'); scr.scrollTop += el.getBoundingClientRect().top - t0 }
  DR = {hd, el, box, sel, kind, scr, y0: e.clientY + scr.scrollTop, top0: el.offsetTop, last: e.clientY};
  el.classList.add('drag');
  /* слушаем окно: перестановка узла в DOM снимает захват указателя с ручки */
  addEventListener('pointermove', dragMove); addEventListener('pointerup', dragEnd); addEventListener('pointercancel', dragEnd);
}
function dragMove(e){
  if(!DR) return; const {el, box, scr} = DR; DR.last = e.clientY;
  const r = scr.getBoundingClientRect();
  if(e.clientY < r.top + 56) scr.scrollTop -= 10; else if(e.clientY > r.bottom - 56) scr.scrollTop += 10;
  const pos = () => e.clientY + scr.scrollTop - DR.y0 - (el.offsetTop - DR.top0);
  let dy = pos(); el.style.transform = `translateY(${dy}px)`;
  const sibs = [...box.querySelectorAll(DR.sel)].filter(x => x !== el && x.parentElement === box);
  const mid = el.offsetTop + dy + el.offsetHeight / 2;
  const next = sibs.find(s => s.offsetTop + s.offsetHeight / 2 > mid) || null;
  const curNext = (() => { let n = el.nextElementSibling; while(n && !sibs.includes(n)) n = n.nextElementSibling; return n })();
  if(next !== curNext){ if(next) box.insertBefore(el, next); else { const lastS = sibs[sibs.length - 1]; if(lastS) lastS.after(el) } dy = pos(); el.style.transform = `translateY(${dy}px)` }
}
function dragEnd(){
  if(!DR) return; const {el, kind} = DR; DR = null;
  removeEventListener('pointermove', dragMove); removeEventListener('pointerup', dragEnd); removeEventListener('pointercancel', dragEnd);
  el.classList.remove('drag'); el.style.transform = '';
  const scr = document.getElementById('edScr');
  if(kind === 'b'){ const id = el.dataset.b; const ids = [...scr.querySelectorAll('.ed-blocks > .eb')].map(x => x.dataset.b);
    ED.blocks.sort((a, b) => ids.indexOf(a.id) - ids.indexOf(b.id)); draw(); scrollToBlock(id); return }
  { const bid = el.closest('.eb').dataset.b, b = blk(bid), box = scr.querySelector(`[data-items="${bid}"]`), byIdI = new Map(b.items.map(x => [x.id, x])), out = [];
    [...box.children].forEach(c => { if(c.classList.contains('ers')) c.querySelectorAll('.er').forEach(r => { const x = byIdI.get(r.dataset.id); if(x) out.push(x) }); else { const x = byIdI.get(c.dataset.id); if(x) out.push(x) } });
    b.items = out; normSS(b) }
  draw();
}

/* ═══════════ ШТОРКИ ═══════════ */
const foot = (label = 'Готово', act = 'close-sheet') => `<div class="sh-f"><button class="btn" data-act="${act}">${label}</button></div>`;
const optRow = (act, ic, label, extra = '', cls = '') => `<button class="opt${cls ? ' ' + cls : ''}" data-act="${act}" ${extra}>${ic ? `<span class="oi">${ic}</span>` : ''}${label}</button>`;

/* ─── упражнение ─── */
function units(it){
  const ex = it.chain ? null : byId(it.exId), key = it.chain ? pctKey(it, pm()) : pmKey(ex), weighted = !!key;
  const exU = it.chain ? (it.parts || []).flatMap(p => (byId(p.exId) || {}).u || []) : (ex && ex.u) || [];
  const list = [...new Set([...(weighted ? ['%', 'кг'] : []), ...exU.filter(u => VOL.includes(u))])];
  if(it.unit && it.val && !list.includes(it.unit)) list.push(it.unit);
  const def = weighted ? (pm()[key] || isG() ? '%' : 'кг') : (list[0] || '');
  const cur = it.pct != null ? '%' : (it.val && it.unit) ? it.unit : (it._u && list.includes(it._u) ? it._u : def);
  return {key, weighted, list, cur};
}
function setLoad(it, u, a, b){
  delete it.pct2; delete it.val2; it._u = u;
  const x = num(a), y = num(b);
  if(x == null){ it.pct = null; it.val = ''; return }
  const lo = y != null && y !== x ? Math.min(x, y) : x, hi = y != null && y !== x ? Math.max(x, y) : null;
  if(u === '%'){ it.pct = lo; it.unit = ''; it.val = ''; if(hi != null) it.pct2 = hi }
  else { it.pct = null; it.unit = u; it.val = String(lo); if(hi != null) it.val2 = String(hi) }
}
function loadHint(it){
  const U = units(it); if(!U.weighted || U.cur !== '%') return '';
  if(isG()) return 'Вес у каждого участника — от его 1ПМ';
  if(!ED.w) return 'Вес посчитается от 1ПМ клиента, когда шаблон встанет в его тренировку';
  const kg = kgText(it, pm()), max = pm()[U.key];
  if(kg) return `→ <b>${kg} кг</b> для ${h(gen(ED.w.n))} · 1ПМ ${fmtNum(max)} кг`;
  return max ? '' : `1ПМ ${h(gen(ED.w.n))} пока не известен — вес посчитается, когда клиент введёт его у себя`;
}
/* Нагрузка — число и единица; диапазон «от–до» включают в «•••» шторки */
const hasRng = it => it.pct2 != null || !!it.val2 || !!it._rng;
function loadField(it){
  const U = units(it); if(!U.list.length) return '';
  const pc = U.cur === '%', v1 = pc ? it.pct ?? '' : it.val || '', v2 = pc ? it.pct2 ?? '' : it.val2 || '', rng = hasRng(it);
  return `<div class="field x-ld${rng ? ' rng' : ''}"><span>Нагрузка</span>
      <div class="ld">
        <input id="xLd" inputmode="decimal" value="${h(fmtNum(v1))}" placeholder="${pc ? '75' : '0'}" aria-label="Нагрузка${rng ? ' от' : ''}" autocomplete="off">
        ${rng ? `<i>–</i><input id="xLd2" inputmode="decimal" value="${h(fmtNum(v2))}" placeholder="до" aria-label="Нагрузка до" autocomplete="off">` : ''}
        ${U.list.length === 1 ? `<i class="u1">${h(U.list[0])}</i>` : `<div class="seg" role="radiogroup" aria-label="Единица">${U.list.map(u => `<button class="${u === U.cur ? 'on' : ''}" role="radio" aria-checked="${u === U.cur}" data-act="e-x-unit" data-u="${u}">${u}</button>`).join('')}</div>`}
      </div></div>`;
}
/* под рядом — одна строка пересчёта «→ 96 кг для Анны» и, если 1ПМ не известен, поле для него */
function loadExtra(it){
  const U = units(it); if(!U.list.length) return '';
  return `<p class="ed-hint" id="xHint">${loadHint(it)}</p>
    ${U.weighted && U.cur === '%' && !isG() && ED.w && !pm()[U.key] ? `<label class="pmset"><span>1ПМ ${h(gen(ED.w.n))}</span><input id="xPm" inputmode="decimal" placeholder="—" aria-label="1ПМ клиента, кг" autocomplete="off"><i>кг</i></label>` : ''}`;
}
/* Шторка упражнения — только главное, как строка в заметках: схема и нагрузка одним рядом.
   Заменить, дублировать, сет, перенос, диапазон, запись текстом и удаление — в «•••» шапки
   (то же меню, что по долгому нажатию на строку). */
const txtMode = it => !!(it.txt || it._tx);
function exBody(it){
  if(txtMode(it)) return `<div class="sh-p">
    <label class="field"><span>Запись — клиент увидит как написано</span><textarea id="xTxt" rows="3" placeholder="60×5, 70×5, 80×3×3">${h(it.txt)}</textarea></label></div>`;
  return `<div class="sh-p">
    <div class="x-row"><label class="field x-sch"><span>Схема</span><input id="xSch" value="${h(it.scheme)}" placeholder="3×10" autocomplete="off" spellcheck="false"></label>
      ${loadField(it)}</div>
    ${loadExtra(it)}
  </div>`;
}
/* «•••» в шапке шторки — меню действий со строкой */
function menuBtn(ov, id, label){
  const x = ov.querySelector('.sh-h [data-act="close-sheet"]');
  if(x) x.insertAdjacentHTML('beforebegin', `<button class="nb" data-act="e-imenu" data-id="${id}" aria-label="${h(label)}">${I.more}</button>`);
}
/* ═══ Объединить строки (15.11.2026, решение пользователя — только телефон: приложение и мобильный кабинет) ═══
   Из меню строки («Объединить с другими строками» — она уже отмечена) или из настроек тренировки. Отмечают
   строки одного блока (у сета можно отметить и его заголовок — весь сет), внизу одна кнопка «Объединить»:
   новая группа встаёт сетом; если среди отмеченных уже есть сет или связка — остальные строки встают в неё.
   Сет или связка — переключателем «Сет · Связка» в шторке группы, там же «Разъединить». Логика — общая
   с кабинетом, в data.js (grpMerge, grpToChain, grpToSet, grpUngroup). Отмена — из тоста. */
const canSel = b => !!b && !isTextBlock(b) && (b.items || []).filter(itemHas).length > 1;
const selBlock = () => ED && ED.sel ? ED.blocks.find(b => !isTextBlock(b) && (b.items || []).some(i => ED.sel.has(i.id))) || null : null;
function selBar(full){
  let bar = full.querySelector('.ed-selbar');
  if(!ED.sel){ full.classList.remove('selm'); if(bar) bar.remove(); return }
  full.classList.add('selm');
  if(!bar){ full.insertAdjacentHTML('beforeend', '<div class="ed-selbar" role="toolbar" aria-label="Объединить строки"></div>'); bar = full.querySelector('.ed-selbar') }
  const b = selBlock(), ok = !!b && grpCan(b, ED.sel);
  bar.innerHTML = `<button class="btn" data-act="e-sel-merge" ${ok ? '' : 'disabled'}>${IC.set}Объединить</button>`;
}
function selMerge(){
  const b = selBlock(); if(!b || !grpCan(b, ED.sel)) return;
  const snap = JSON.stringify(b.items), undo = () => { b.items = JSON.parse(snap); draw() };
  const r = grpMerge(b, ED.sel); ED.sel = null; if(!r){ draw(); return }
  ED.flash.add(r.id); draw();
  undoToast(r.into ? (r.kind === 'ss' ? 'Добавлено в сет' : 'Добавлено в связку')
    : 'Сет из ' + r.n + ' ' + plural3(r.n, 'упражнения', 'упражнений', 'упражнений') + ' — связкой можно сделать в настройках сета', undo);
}
function grpUn(id){
  const f = findIt(id); if(!f) return; const B = f.b, snap = JSON.stringify(B.items);
  if(!grpUngroup(B, id)) return; closeSheet(); draw();
  undoToast('Разъединено — упражнения отдельными строками', () => { B.items = JSON.parse(snap); draw() });
}
function itemActs(it){
  const f = findIt(it.id);
  const lu = (it.exId || it.chain) && !it.txt && units(it).list.length;
  return `<div class="ed-acts">
    ${it.exId || !it.chain && !it.exId ? optRow('e-x-replace', I.search, it.exId ? 'Заменить упражнение' : 'Выбрать из базы', `data-id="${it.id}"`) : ''}
    ${optRow('e-x-dup', I.copy, 'Дублировать', `data-id="${it.id}"`)}
    ${lu ? optRow('e-x-rng', IC.range, hasRng(it) ? 'Нагрузка одним числом' : 'Нагрузка диапазоном от–до', `data-id="${it.id}"`) : ''}
    ${it.exId && !it.chain ? optRow('e-x-txt', IC.text, txtMode(it) ? 'Вернуть схему и нагрузку' : 'Записать текстом, как в тетради', `data-id="${it.id}"`) : ''}
    ${it.sub ? optRow('e-x-unss', IC.ungroup, 'Убрать из сета', `data-id="${it.id}"`) : ''}
    ${it.chain ? optRow('e-g-un', IC.ungroup, 'Разъединить — упражнения станут отдельными строками', `data-id="${it.id}"`) : ''}
    ${canSel(f.b) ? optRow('e-sel', IC.set, 'Объединить с другими строками', `data-id="${it.id}"`) : ''}
    ${ED.blocks.filter(x => !isTextBlock(x)).length > 1 ? optRow('e-x-move', IC.move, 'Перенести в другой блок', `data-id="${it.id}"`) : ''}
    ${optRow('e-del', IC.trash, 'Удалить', `data-id="${it.id}"`, 'rm')}</div>`;
}
function sheetItem(id){
  const f = findIt(id); if(!f) return; const it = f.it;
  if(it.chain) return sheetChain(id);
  if(!it.exId) return sheetRaw(id);
  const e = byId(it.exId) || {};
  const ov = sheet({id:'ex', title:e.ru || 'Упражнение', body:exBody(it), foot:foot()});
  ov.dataset.id = id; menuBtn(ov, id, 'Действия с упражнением'); wireEx(ov, it);
}
function rerenderEx(ov, it){ ov.querySelector('.sh-b').innerHTML = exBody(it); wireEx(ov, it); draw() }
function wireEx(ov, it){
  const q = s => ov.querySelector(s), sch = q('#xSch'), ld = q('#xLd'), ld2 = q('#xLd2'), tx = q('#xTxt');
  const upd = () => { const hn = q('#xHint'); if(hn) hn.innerHTML = loadHint(it); draw() };
  if(sch){ sch.addEventListener('input', () => { it.scheme = sch.value.trim(); upd() });
    sch.addEventListener('change', () => { it.scheme = sch.value.trim().replace(/\s*[xхХ*]\s*/g, '×').replace(/\s+/g, ''); sch.value = it.scheme; upd() }) }
  const L = () => setLoad(it, units(it).cur, ld ? ld.value : '', ld2 ? ld2.value : '');
  [ld, ld2].forEach(i => i && i.addEventListener('input', () => { L(); upd() }));
  const pmi = q('#xPm'); if(pmi) pmi.addEventListener('change', () => { const v = parseFloat(pmi.value.replace(',', '.')), key = units(it).key; if(!(v > 0) || !key) return;
    pmOf(ED.w.id)[key] = v; const c = client(ED.w.id); if(c) ((c.hist ||= {})[key] ||= []).push([TODAY, v]); saveState(); rerenderEx(ov, it); say('1ПМ записан — вес посчитан') });
  if(tx) tx.addEventListener('input', () => { const v = tx.value; it.txt = v.trim() ? v : '';
    if(it.txt){ it.scheme = ''; it.pct = null; it.val = ''; delete it.pct2; delete it.val2 } draw() });
}

/* ─── связка ─── */
function chainBody(it){
  const U = units(it), ws = chainWeighted(it), seen = new Set(), wsu = ws.filter(p => !seen.has(p.exId) && seen.add(p.exId));
  return `<div class="sh-p">
    <div class="seg wide gkind" role="radiogroup" aria-label="Сет или связка"><button class="" role="radio" aria-checked="false" data-act="e-g-kind" data-k="ss" data-id="${it.id}">Сет</button><button class="on" role="radio" aria-checked="true" >Связка</button></div>
    <div class="field"><span>Упражнения и повторы</span>
      <div class="cparts">${(it.parts || []).map(p => `<div class="cpart"><b>${h(partName(p))}</b>
        <input data-part="${p.id}" value="${h(p.scheme || '')}" inputmode="numeric" placeholder="повт" aria-label="Повторы: ${h(partName(p))}" autocomplete="off">
        <button class="nb" data-act="e-c-del" data-p="${p.id}" aria-label="Убрать ${h(partName(p))} из связки">${I.x}</button></div>`).join('')}</div>
      <button class="lnk" data-act="e-c-add" data-id="${it.id}">${I.plus.replace('<svg', '<svg width="18" height="18"')}Упражнение в связку</button></div>
    <label class="field"><span>Подходы</span><input id="cSets" inputmode="numeric" value="${h(it.sets || '')}" placeholder="1" autocomplete="off"></label>
    ${loadField(it)}${loadExtra(it)}
    ${U.weighted && wsu.length > 1 && U.cur === '%' ? `<label class="field"><span>% от 1ПМ упражнения</span><select id="cOf">
      <option value="">самого слабого</option>${wsu.map(p => `<option value="${p.exId}" ${it.of === p.exId ? 'selected' : ''}>${h(partName(p))}</option>`).join('')}</select></label>` : ''}
  </div>
  <div class="ed-acts">${optRow('e-g-un', IC.ungroup, 'Разъединить — упражнения станут отдельными строками', `data-id="${it.id}"`)}</div>`;
}
function sheetChain(id){
  const f = findIt(id); if(!f) return; const it = f.it;
  const ov = sheet({id:'chain', title:'Связка', sub:'Подряд, одним подходом', body:chainBody(it), foot:foot()});
  ov.dataset.id = id; menuBtn(ov, id, 'Действия со связкой'); wireChain(ov, it);
}
function wireChain(ov, it){
  ov.querySelectorAll('[data-part]').forEach(i => i.addEventListener('input', () => { const p = it.parts.find(x => x.id === i.dataset.part); if(p){ p.scheme = i.value.trim(); draw() } }));
  const s = ov.querySelector('#cSets'); if(s) s.addEventListener('input', () => { it.sets = s.value.replace(/\D/g, ''); draw() });
  const ld = ov.querySelector('#xLd'), ld2 = ov.querySelector('#xLd2');
  [ld, ld2].forEach(i => i && i.addEventListener('input', () => { setLoad(it, units(it).cur, ld ? ld.value : '', ld2 ? ld2.value : ''); const hn = ov.querySelector('#xHint'); if(hn) hn.innerHTML = loadHint(it); draw() }));
  const of = ov.querySelector('#cOf'); if(of) of.addEventListener('change', () => { it.of = of.value || null; const hn = ov.querySelector('#xHint'); if(hn) hn.innerHTML = loadHint(it); draw() });
}
const rerenderSheet = ov => { const it = (findIt(ov.dataset.id) || {}).it; if(!it) return;
  if(ov.dataset.sheet === 'chain'){ ov.querySelector('.sh-b').innerHTML = chainBody(it); wireChain(ov, it) } else rerenderEx(ov, it); draw() };

/* ─── своё упражнение: название, группа, в чём меряется (как окно «Новое упражнение» в кабинете) ─── */
function sheetNewEx(name, done){
  const gs = (typeof GROUP_ORDER !== 'undefined' ? GROUP_ORDER : ['Ноги', 'Спина', 'Грудь', 'Плечи', 'Руки', 'Кор', 'Кардио']);
  const ov = sheet({id:'newex', title:'Новое упражнение', sub:'Попадёт в вашу базу — клиенты увидят название как написано', body:`<div class="sh-p">
      <label class="field"><span>Название</span><input id="neN" value="${h(name)}" autocomplete="off"></label>
      <div class="field"><span>Группа</span><div class="chips wrap" style="padding:0">${gs.map((g, i) => `<button class="chip${i === 0 ? ' on' : ''}" data-act="e-new-g" data-ng="${h(g)}">${h(g)}</button>`).join('')}</div></div>
      <div class="field"><span>В чём записывать</span><div class="chips wrap" style="padding:0">${[['кг', 'вес, кг'], ['повт', 'повторы'], ['сек', 'время'], ['м', 'дистанция'], ['кал', 'калории']].map(([u, t], i) => `<button class="chip${i < 2 ? ' on' : ''}" data-act="e-new-u" data-nu="${u}">${t}</button>`).join('')}</div></div></div>`,
    foot:'<div class="sh-f"><button class="btn" data-act="e-new-ok">Создать и добавить</button></div>'});
  ov._done = done;
}
/* ─── строка текстом ─── */
function sheetRaw(id){
  const f = findIt(id); if(!f) return; const it = f.it;
  const ov = sheet({id:'raw', title:'Строка текстом', sub:'Клиент видит её как написано', body:`<div class="sh-p">
      <label class="field"><span>Текст</span><textarea id="rTx" rows="3">${h(it.raw || '')}</textarea></label></div>
    <div class="ed-acts">${optRow('e-x-replace', I.search, 'Выбрать упражнение из базы', `data-id="${id}"`)}
      ${optRow('e-r-ai', IC.spark, 'Разобрать — ИИ найдёт упражнение, схему и нагрузку', `data-id="${id}"`)}
      ${optRow('e-del', IC.trash, 'Удалить', `data-id="${id}"`, 'rm')}</div>`, foot:foot()});
  ov.dataset.id = id;
  const ta = ov.querySelector('#rTx'); ta.addEventListener('input', () => { it.raw = ta.value; draw() });
}

/* ─── сет ─── */
function sheetSS(id){
  const f = findIt(id); if(!f) return; const it = f.it;
  const body = () => `<div class="sh-p">
      <div class="seg wide gkind" role="radiogroup" aria-label="Сет или связка"><button class="on" role="radio" aria-checked="true" >Сет</button><button class="" role="radio" aria-checked="false" data-act="e-g-kind" data-k="ch" data-id="${it.id}">Связка</button></div>
      <div class="stp"><span>Круги</span><button class="nb" data-act="e-ss-r" data-d="-1" aria-label="Меньше кругов">${IC.minus}</button><b>${it.rounds}</b><button class="nb" data-act="e-ss-r" data-d="1" aria-label="Больше кругов">${I.plus}</button></div>
      <label class="field"><span>Отдых между кругами</span><input id="sRest" value="${h(it.rest || '')}" placeholder="без отдыха" autocomplete="off"></label>
      <div class="chips pre">${REST_PRESETS.map(p => `<button class="chip${(it.rest || '') === p ? ' on' : ''}" data-act="e-ss-rest" data-v="${p}">${p || 'без отдыха'}</button>`).join('')}</div>
      <p class="ed-note">Упражнения сета выполняют подряд по кругу; нагрузка у каждого — на один круг</p></div>
    <div class="ed-acts">${optRow('e-ss-ungroup', IC.ungroup, 'Разъединить — упражнения станут отдельными строками', `data-id="${id}"`)}
      ${optRow('e-ss-del', IC.trash, 'Удалить сет вместе с упражнениями', `data-id="${id}"`, 'rm')}</div>`;
  const ov = sheet({id:'ss', title:'Сет', sub:'Упражнения подряд по кругу', body:body(), foot:foot()});
  ov.dataset.id = id; ov._body = body;
  const wire = () => { const r = ov.querySelector('#sRest'); if(r) r.addEventListener('input', () => { it.rest = r.value.trim(); draw() }) };
  ov._wire = wire; wire();
}
const reSS = ov => { ov.querySelector('.sh-b').innerHTML = ov._body(); ov._wire(); draw() };

/* ─── поиск упражнения ─── */
let SR = null;      /* {mode:'add'|'replace'|'part', bid, id, q, g, picked:[], as:'one'|'ss'|'ch'} */
function recents(){
  const out = [], seen = new Set(), pid = ED.pid; if(!pid) return out;
  const p = program(pid), plan = buildPlan(pid), i0 = daysBetween(p.start, ED.date);
  for(let d = 0; d <= 35 && out.length < 10; d++) [i0 - d, i0 + d].forEach(i => { const x = plan[i]; if(!x || d && i === i0) return;
    (x.blocks || []).forEach(b => (b.items || []).forEach(it => [it, ...(it.parts || [])].forEach(y => { if(y.exId && !seen.has(y.exId) && byId(y.exId) && !byId(y.exId).del){ seen.add(y.exId); out.push(byId(y.exId)) } }))) });
  return out.slice(0, 10);
}
function exSearch(q, g){
  const toks = norm(q).split(' ').filter(t => t && !/^\d/.test(t)), out = [];
  for(const {e, c} of CAND){
    if(e.del || (g && g !== 'Все' && e.g !== g)) continue;
    if(!toks.length){ out.push([0, e]); continue }
    let best = 0;
    for(const cand of c){ const ws = cand.split(' ');
      if(toks.every(t => ws.some(w => w.startsWith(t)))){ const sc = 100 - ws.length * 3 + (ws[0].startsWith(toks[0]) ? 20 : 0) + (e.own ? 5 : 0); if(sc > best) best = sc } }
    if(best) out.push([best, e]);
  }
  return toks.length ? out.sort((a, b) => b[0] - a[0]).map(x => x[1]) : out.map(x => x[1]).sort((a, b) => a.ru.localeCompare(b.ru, 'ru'));
}
const exRow = e => { const on = SR.picked.includes(e.id), multi = SR.mode === 'add';
  return `<button class="opt exr${on ? ' on' : ''}" data-act="e-s-pick" data-ex="${e.id}" aria-pressed="${on}"><span class="t"><b>${h(e.ru)}</b><s>${h([e.g, e.eq].filter(x => x && x !== '—').join(' · '))}${e.own ? ' · своё' : ''}</s></span>${multi ? `<span class="box rnd">${on ? SR.picked.indexOf(e.id) + 1 : ''}</span>` : ''}</button>` };
function searchList(){
  const q = SR.q.trim(); let html = '';
  if(q) html += `<div class="ed-acts top">${SR.mode !== 'part' ? optRow('e-s-raw', IC.text, `Добавить текстом «${h(q)}»`) : ''}${optRow('e-s-own', I.plus, `Новое упражнение «${h(q)}»`)}</div>`;
  if(!q && SR.g === 'Все'){ const r = recents(); if(r.length) html += `<div class="cap">Недавние у ${isG() ? 'группы' : h(gen(ED.w.n))}</div>` + r.map(exRow).join('') }
  const res = exSearch(q, SR.g), shown = res.slice(0, 60);
  html += `<div class="cap">${q ? 'Найдено · ' + res.length : SR.g === 'Все' ? 'Все упражнения' : h(SR.g)}</div>` + (shown.length ? shown.map(exRow).join('') : `<p class="ed-note" style="padding:0 16px">Ничего не нашлось — добавьте строку текстом или своё упражнение</p>`);
  if(res.length > shown.length) html += `<p class="ed-note" style="padding:4px 16px 12px">и ещё ${res.length - shown.length} — уточните поиск</p>`;
  return html;
}
function searchFoot(){
  const n = SR.picked.length; if(SR.mode !== 'add') return '';
  return `<div class="sh-f">${n > 1 ? `<div class="seg wide" role="radiogroup" aria-label="Как добавить">${[['one', 'Отдельно'], ['ss', 'Вместе']].map(([k, t]) =>
      `<button class="${SR.as === k ? 'on' : ''}" role="radio" aria-checked="${SR.as === k}" data-act="e-s-as" data-k="${k}">${t}</button>`).join('')}</div>` : ''}
    <button class="btn" data-act="e-s-add" ${n ? '' : 'disabled'}>${n ? 'Добавить · ' + n : 'Отметьте упражнения'}</button></div>`;
}
function sheetSearch(ctx){
  SR = Object.assign({q:'', g:'Все', picked:[], as:'one'}, ctx);
  const title = SR.mode === 'replace' ? 'Заменить упражнение' : SR.mode === 'part' ? 'Упражнение в связку' : 'Добавить упражнения';
  const ov = sheet({id:'search', title, body:`<div class="srch"><label class="search">${I.search}<input id="sq" type="search" value="${h(SR.q)}" placeholder="Название упражнения" aria-label="Поиск упражнения" enterkeyhint="search" autocomplete="off"></label>
      <div class="chips">${GROUPS.map(g => `<button class="chip${SR.g === g ? ' on' : ''}" data-act="e-s-g" data-g="${h(g)}">${h(g)}</button>`).join('')}</div></div>
    <div id="sres">${searchList()}</div>`, foot:`<div id="sfoot">${searchFoot()}</div>`});
  ov.classList.add('tall');
  const inp = ov.querySelector('#sq');
  inp.addEventListener('input', () => { SR.q = inp.value; ov.querySelector('#sres').innerHTML = searchList() });
}
const reSearch = () => { const ov = document.querySelector('.ov[data-sheet="search"]'); if(!ov) return;
  ov.querySelector('#sres').innerHTML = searchList(); ov.querySelector('#sfoot').innerHTML = searchFoot();
  ov.querySelectorAll('[data-act="e-s-g"]').forEach(c => c.classList.toggle('on', c.dataset.g === SR.g)) };
/* куда класть новые строки: в блок; пустой день — в новый первый блок */
function targetBlock(bid){
  let b = bid && blk(bid);
  if(!b){ b = mkBlock(null, '', '', null, []); ED.blocks.push(b) }
  b.items = (b.items || []).filter(x => x.ss || itemHas(x));
  return b;
}
function addPicked(){
  const b = targetBlock(SR.bid), ids = SR.picked; if(!ids.length) return;
  let add;
  if(ids.length > 1 && SR.as === 'ss') add = [ssItem(3, ''), ...ids.map(id => Object.assign(mkItem(id), {sub:true}))];
  else add = ids.map(id => mkItem(id));
  b.items.push(...add); normSS(b);
  add.forEach(x => ED.flash.add(x.id));
  closeSheet(); draw(); scrollToBlock(b.id, true);
  say(ids.length > 1 ? (SR.as === 'ss' ? 'Вместе — сетом из ' + ids.length + '; связкой можно сделать в настройках сета' : 'Добавлено: ' + ids.length) : 'Добавлено — нажмите строку, чтобы задать схему');
}
function scrollToBlock(bid, end){
  const scr = document.getElementById('edScr'), el = scr && scr.querySelector(`.eb[data-b="${bid}"]`); if(!el) return;
  const r = el.getBoundingClientRect(), sr = scr.getBoundingClientRect();
  if(end){ if(r.bottom > sr.bottom - 24) scr.scrollTop += r.bottom - sr.bottom + 24 } else scr.scrollTop += r.top - sr.top - 8;
}
function pickOne(exId){
  const f = SR.id && findIt(SR.id);
  if(SR.mode === 'part'){ if(f){ f.it.parts.push(Object.assign(mkItem(exId), {unit:'', val:''})); normChain(f.it) } closeSheet(true); draw(); if(f) sheetChain(f.it.id); return }
  if(f){ const it = f.it, e = byId(exId);
    Object.assign(it, {exId, raw:null}); if(!it.scheme && !it.txt) it.scheme = '';
    if(it.unit && e && !e.u.includes(it.unit) && it.unit !== '' && !it.val) it.unit = e.u[0] || '';
    ED.flash.add(it.id); closeSheet(true); draw(); sheetItem(it.id); say('Упражнение заменено') }
}

/* ─── тип блока и настройка комплекса ─── */
const mm = s => mmssRaw(Math.max(0, s));
function fmtParams(f){
  const st = (k, label, val, d) => `<div class="stp"><span>${label}</span><button class="nb" data-act="e-f" data-f="${k}" data-d="${-d}" aria-label="${label}: меньше">${IC.minus}</button><b>${val}</b><button class="nb" data-act="e-f" data-f="${k}" data-d="${d}" aria-label="${label}: больше">${I.plus}</button></div>`;
  const seg = (vals) => `<div class="stp"><span>Интервал</span><div class="seg">${vals.map(w => `<button class="${f.work === w ? 'on' : ''}" data-act="e-f-work" data-v="${w}">${mm(w)}</button>`).join('')}</div></div>`;
  switch(f.k){
    case 'AMRAP': return st('total', 'Время', mm(f.total), 60);
    case 'EMOM': return st('rounds', 'Раундов', f.rounds, 1) + seg([60, 90, 120, 180]) + `<p class="ed-note">Всего ${mm(f.total)}</p>`;
    case 'FOR TIME': return st('rounds', 'Раундов', f.rounds, 1) + st('total', 'Лимит', f.total ? mm(f.total) : 'нет', 60);
    case 'TABATA': case 'ИНТЕРВАЛЫ': return st('rounds', 'Раундов', f.rounds, 1) + st('work', 'Работа', mm(f.work), f.k === 'TABATA' ? 5 : 15) + st('rest', 'Отдых', mm(f.rest), f.k === 'TABATA' ? 5 : 15);
    case 'DEATH BY': return seg([60, 90, 120]) + st('start', 'Старт, повт', f.start || 1, 1);
  }
  return '';
}
function typeBody(b){
  return `<div class="ed-opts">${BLOCK_TYPES.map(t => `<button class="opt${(b.kind || null) === t.k ? ' on' : ''}" data-act="e-type-k" data-k="${t.k || ''}" role="radio" aria-checked="${(b.kind || null) === t.k}"><span class="box rnd">${I.check}</span>${h(cap1(t.n))}</button>`).join('')}</div>
    ${b.kind === 'complex' ? `<div class="cap">Настройка комплекса</div>
      <div class="chips wrap">${FMT_TYPES.map(t => `<button class="chip${(b.fmt ? b.fmt.k : null) === t.k ? ' on' : ''}" data-act="e-type-f" data-k="${t.k || ''}">${h(cap1(t.n))}</button>`).join('')}</div>
      ${b.fmt ? `<p class="ed-note" style="padding:0 16px 8px">Клиент увидит: ${h(fmtDesc(b.fmt))}</p><div class="sh-p" style="padding-top:0">${fmtParams(b.fmt)}</div>` : ''}` : ''}`;
}
function sheetType(bid){
  const b = blk(bid); if(!b) return;
  const ov = sheet({id:'type', title:'Тип блока', sub:'Комплексу можно задать AMRAP, EMOM, на время…', body:typeBody(b), foot:foot()});
  ov.dataset.b = bid;
}
const reType = () => { const ov = document.querySelector('.ov[data-sheet="type"]'); if(!ov) return; const b = blk(ov.dataset.b); if(b){ ov.querySelector('.sh-b').innerHTML = typeBody(b); draw() } };
function fmtRecalc(f){
  if(f.k === 'AMRAP') f.work = f.total;
  if(f.k === 'EMOM') f.total = f.rounds * f.work;
  if(f.k === 'TABATA' || f.k === 'ИНТЕРВАЛЫ') f.total = f.rounds * (f.work + f.rest);
}

/* ─── меню блока и дня ─── */
/* «Отменить правки» — вернуть к сохранённому; только если есть несохранённое */
const revRow = () => dirty() ? optRow('e-revert', IC.undo, 'Отменить правки') : '';
function sheetBlockMenu(bid){
  const b = blk(bid); if(!b) return; const has = blockHas(b), txt = isTextBlock(b);
  /* в шаблоне заметки к блоку нет (в базе она не хранится); шаблон блока — сам блок базы: не сохраняется отдельно и не удаляется */
  sheet({id:'bmenu', title:b.title || blockTypeLabel(b) || 'Блок', sub:'Действия с блоком', body:`<div class="ed-acts">
    ${ED.tpl ? '' : optRow('e-note', I.msg, b.note ? 'Изменить заметку к блоку' : 'Заметка к блоку — увидит клиент', `data-b="${bid}"`)}
    ${has && !solo() ? optRow('e-bsave', I.star, 'Сохранить в базу блоков', `data-b="${bid}"`) : ''}
    ${!txt && has ? optRow('e-btext', IC.text, 'Перевести в блок текстом', `data-b="${bid}"`) : ''}
    ${solo() && (b.items || []).filter(itemHas).length > 1 ? optRow('e-reorder', IC.sort, 'Изменить порядок') : ''}
    ${solo() ? revRow() : ''}
    ${has ? optRow('e-bclear', IC.erase, 'Очистить блок', `data-b="${bid}"`, solo() ? 'rm' : '') : ''}
    ${solo() ? '' : optRow('e-bdel', IC.trash, 'Удалить блок', `data-b="${bid}"`, 'rm')}</div>`});
}
function sheetDayMenu(){
  const has = hasContent();
  if(solo()){ if(ED.blocks[0]) sheetBlockMenu(ED.blocks[0].id); return }
  if(ED.tpl){ sheet({id:'dmenu', title:ED.title || 'Тренировка', sub:'Шаблон в базе', body:`<div class="ed-acts">
    ${ED.blocks.length > 1 || ED.blocks.some(b => (b.items || []).filter(itemHas).length > 1) ? optRow('e-reorder', IC.sort, 'Изменить порядок') : ''}
    ${revRow()}
    ${ED.blocks.length ? optRow('e-dclear', IC.erase, 'Очистить шаблон', '', 'rm') : ''}</div>`}); return }
  sheet({id:'dmenu', title:ED.title || 'Тренировка', sub:T.fmtDay(ED.date), body:`<div class="ed-acts">
    ${optRow('e-msg', I.msg, ED.msg ? 'Изменить сообщение ' + (isG() ? 'группе' : 'клиенту') : 'Сообщение ' + (isG() ? 'группе' : 'клиенту') + ' ко всей тренировке')}
    ${optRow('e-comp', I.trophy, ED.comp ? 'Снять отметку «Соревнование»' : 'Отметить как соревнование')}
    ${has ? optRow('e-dsave', I.star, 'Сохранить в базу тренировок') : ''}
    ${has ? optRow('e-wizard', I.copy, 'Скопировать на другие дни') : ''}
    ${ED.blocks.some(canSel) ? optRow('e-sel', IC.set, 'Объединить строки') : ''}
    ${ED.blocks.length > 1 || ED.blocks.some(b => (b.items || []).filter(itemHas).length > 1) ? optRow('e-reorder', IC.sort, 'Изменить порядок') : ''}
    ${revRow()}
    ${ED.blocks.length ? optRow('e-dclear', IC.erase, 'Очистить день', '', 'rm') : ''}</div>`});
}
function sheetText(bid, isNew){
  const b = bid ? blk(bid) : null, val = b ? b.text : '';
  const ph = 'Пишите как в заметках — клиент увидит как есть.\n\nAMRAP 12:\n• трастеры 10 × 40 кг\n• подтягивания 8\n• гребля 250 м';
  const ov = sheet({id:'text', title:b ? (b.title || 'Блок текстом') : 'Блок текстом', sub:'Сохранится как написано; разобрать — по кнопке ИИ',
    body:`<div class="sh-p"><textarea id="tTx" class="txa" placeholder="${h(ph)}" aria-label="Текст блока">${h(val)}</textarea></div>`,
    foot:`<div class="sh-f row2"><button class="btn s o" data-act="e-t-list">${IC.list}Список</button><button class="btn s o" data-act="e-t-ai">${IC.spark}Разобрать</button><button class="btn s" data-act="e-t-ok">Готово</button></div>`});
  ov.classList.add('tall'); ov.dataset.b = bid || ''; ov.dataset.new = isNew ? '1' : '';
  const ta = ov.querySelector('#tTx');
  ta.addEventListener('input', () => { let x = ov.dataset.b && blk(ov.dataset.b); if(!x && ta.value.trim()) x = textTarget(ov).b; if(x){ x.text = ta.value; draw() } });
  ta.addEventListener('keydown', e => { if(e.key !== 'Enter') return;           /* Enter в пункте списка — новый пункт; пустой пункт — конец списка */
    const s = ta.selectionStart, ls = ta.value.lastIndexOf('\n', s - 1) + 1, line = ta.value.slice(ls, s);
    if(!LIST_RE.test(line)) return; e.preventDefault();
    if(!line.replace(LIST_RE, '').trim()){ ta.setRangeText('', ls, s, 'end') } else ta.setRangeText('\n• ', s, ta.selectionEnd, 'end');
    ta.dispatchEvent(new Event('input')) });
  if(isNew) setTimeout(() => ta.focus(), 260);
}
function textTarget(ov){
  const ta = ov.querySelector('#tTx'), text = ta.value;
  let b = ov.dataset.b && blk(ov.dataset.b);
  if(!b && text.trim()){ b = textBlock(text, ''); ED.blocks.push(b); ov.dataset.b = b.id }
  return {b, text};
}
/* ИИ-разбор (CON-5): предложение под полосой «проверьте» до «Принять»; «Вернуть текст» кладёт блок как был */
const isHeader = L => L.length <= 42 && (/:$/.test(L) || !/\d/.test(L));
const parseLine = t => { const r = parseText(String(t || '').trim())[0]; return r && r.type === 'ok' ? r.item : null };
function textToBlocks(text){
  const blocks = []; let cur = null, ss = null;
  const open_ = title => { cur = {title: title || '', items: [], src: []}; blocks.push(cur); ss = null };
  for(const line of String(text).split('\n')){
    const L = line.trim(); if(!L){ cur = null; ss = null; continue }
    const bullet = /^[-–—•*]\s*/.test(L), body = L.replace(/^[-–—•*]\s*/, '');
    if(!bullet && fmtPart(L)){ open_(L.replace(/:$/, '')); cur.src.push(L); continue }
    const sh = bullet ? null : parseSSHead(L);
    if(sh){ if(!cur) open_(''); cur.items.push(ssItem(sh.rounds, sh.rest)); cur.src.push(L);
      sh.list.forEach(t => { const it = parseLine(t) || rawItem(t); it.sub = true; cur.items.push(it) }); ss = sh.list.length ? null : {bullets:null}; continue }
    if(ss){ if(ss.bullets === null) ss.bullets = bullet; if((ss.bullets && !bullet) || /:$/.test(L)) ss = null }
    if(!ss && !bullet && isHeader(L)){ open_(L.replace(/:$/, '')); cur.src.push(L); continue }
    if(!cur) open_('');
    const it = parseLine(body) || rawItem(body); if(ss) it.sub = true;
    cur.items.push(it); cur.src.push(L);
  }
  const out = [];
  for(const b of blocks){ if(b.items.length){ out.push(b); continue } if(!b.title) continue;
    const it = rawItem(b.src[0] || b.title), prev = out[out.length - 1]; if(prev) prev.items.push(it); else out.push({title:'', items:[it], src:b.src}) }
  return out;
}
function aiParse(b){
  const parts = textToBlocks(b.text);
  if(!parts.some(p => p.items.some(i => i.exId || i.chain))){ say('Упражнений из базы не нашлось — текст останется как написан'); return false }
  const k = ED.blocks.indexOf(b);
  const nb = parts.map((p, n) => normSS(normFmt({id:nid('b'), kind: typeOfTitle(p.title) || (n === 0 ? b.kind : null), title: p.title || (n === 0 ? b.title : ''), note: n === 0 ? b.note : '', fmt:null, items:p.items})));
  ED.blocks.splice(k, 1, ...nb);
  ED.pending = {ids:new Set(nb.map(x => x.id)), text:b.text, title:b.title, kind:b.kind, note:b.note};
  draw(); setTimeout(() => { const scr = document.getElementById('edScr'), ai = scr && scr.querySelector('.ed-ai'); if(ai) scr.scrollTop += ai.getBoundingClientRect().top - scr.getBoundingClientRect().top - 8 }, 30);
  return true;
}

/* ─── шаблоны и копирование ─── */
function sheetTpl(k){
  const lvl = k === 'блок' ? 'блок' : 'тренировка', list = tplLive(lvl).sort((a, b) => (b.own ? 1 : 0) - (a.own ? 1 : 0) || String(b.at || '').localeCompare(String(a.at || '')));
  const row = t => { const s = tplStats(t), sub = lvl === 'блок' ? [t.folder, s.n ? pl(s.n, 'упражнение', 'упражнения', 'упражнений') : ''].filter(Boolean).join(' · ')
      : [s.blocks ? pl(s.blocks, 'блок', 'блока', 'блоков') : '', s.n ? pl(s.n, 'упражнение', 'упражнения', 'упражнений') : ''].filter(Boolean).join(' · ');
    return `<button class="row" data-act="e-tpl-pick" data-id="${t.id}"><span class="ic sq">${lvl === 'блок' ? I.bases : I.dumb}</span><span class="t"><b>${h(t.title)}</b><s>${h(sub)}${t.own ? ' · своё' : ''}</s></span>${I.chev.replace('<svg', '<svg class="chev"')}</button>` };
  const body = `<div class="utabs" role="tablist">${[['тренировка', 'Тренировки'], ['блок', 'Блоки']].map(([v, n]) => `<button class="${lvl === v ? 'on' : ''}" role="tab" aria-selected="${lvl === v}" data-act="e-tpl" data-k="${v}">${n}<s>${tplLive(v).length}</s></button>`).join('')}</div>
    ${list.length ? list.map(row).join('') : `<div class="empty"><b>Пока пусто</b>Сохраняйте тренировки и блоки в базу из меню «•••»</div>`}`;
  const ov = sheet({id:'tpl', title:'Из базы', sub:'Шаблон добавится в конец тренировки', body});
  ov.classList.add('tall');
}
function sheetCopy(id){
  const w = who(id || ED.w.id); if(!w) return;
  const rows = [];
  if(w.prog && program(w.prog)){
    for(let d = -42; d <= 28; d++){ const date = addDays(ED.date, d); if(date === ED.date && w.id === ED.w.id) continue;
      const x = dayAt(w.prog, date); if(!x || !contentHas(x.c)) continue;
      const c = JSON.parse(x.c), nb = (c.b || []).length; rows.push({date, t: c.t && !REST_T.has(c.t) ? c.t : 'Без названия', nb}) }
  }
  /* 30 ближайших к дню правки; листки дней одинаковые (прошлое/будущее не кодируем цветом), а делим разделами:
     «Впереди» (сегодня и дальше) и «Прошли» — в каждом ближайшие к сегодня сверху */
  rows.sort((a, b) => Math.abs(daysBetween(ED.date, a.date)) - Math.abs(daysBetween(ED.date, b.date)));
  const near = rows.slice(0, 30);
  const up = near.filter(r => r.date >= TODAY).sort((a, b) => a.date < b.date ? -1 : 1);
  const down = near.filter(r => r.date < TODAY).sort((a, b) => a.date > b.date ? -1 : 1);
  const drow = r => { const dt = new Date(r.date + 'T00:00:00');
    return `<button class="drow" data-act="e-copy-pick" data-id="${w.id}" data-d="${r.date}"><span class="badge-d"><s>${['вс','пн','вт','ср','чт','пт','сб'][dt.getDay()]}</s><b>${dt.getDate()}</b></span>
        <span class="t"><b>${h(r.t)}</b><s>${h(T.fmtDay(r.date))} · ${pl(r.nb, 'блок', 'блока', 'блоков')}</s></span>${I.chev.replace('<svg', '<svg class="chev" style="width:16px;height:16px;color:var(--tx3)"')}</button>` };
  const sec = (cap, list) => list.length ? `<div class="cap">${cap}</div>${list.map(drow).join('')}` : '';
  const body = `<button class="row" data-act="e-copy-who">${ava(w)}<span class="t"><b>${h(w.n)}</b><s>Чей календарь — сменить</s></span>${I.chev.replace('<svg', '<svg class="chev"')}</button>
    ${near.length ? sec('Впереди', up) + sec('Прошли', down)
      : `<div class="cap">Тренировки</div><div class="empty"><b>Тренировок нет</b>У ${h(isGrp(w.id) ? 'группы' : gen(w.n))} рядом с этой датой ничего не составлено</div>`}`;
  const ov = sheet({id:'copy', title:'Скопировать из календаря', sub:'Блоки добавятся в эту тренировку', body});
  ov.classList.add('tall');
}
function appendWorkout(title, blocks, msg){
  const was = hasContent();
  if(!ED.title.trim() && title && !REST_T.has(title)) ED.title = title;
  ED.blocks = ED.blocks.filter(b => blockHas(b) || b.title || b.note).concat(blocks);
  blocks.forEach(b => (b.items || []).forEach(i => ED.flash.add(i.id)));
  closeSheet(); draw(); if(was && blocks[0]) setTimeout(() => scrollToBlock(blocks[0].id), 30);
  say(msg);
}

/* ─── дата ─── */
let DM = null;
function dateBody(){
  const w = ED.w, m0 = new Date(DM + 'T00:00:00'), first_ = new Date(m0.getFullYear(), m0.getMonth(), 1), start = new Date(first_); start.setDate(1 - (first_.getDay() + 6) % 7);
  let g = '';
  for(let k = 0; k < 42; k++){ const dt = new Date(start); dt.setDate(start.getDate() + k);
    const d = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0') + '-' + String(dt.getDate()).padStart(2, '0');
    if(k >= 35 && dt.getMonth() !== m0.getMonth()) break;
    const inf = w.prog ? T.dayInfo(w, d) : null, st = inf ? inf.st : 'rest';
    g += `<button class="gd${dt.getMonth() !== m0.getMonth() ? ' out' : ''}${d === TODAY ? ' today' : ''}${d === ED.date ? ' sel' : ''}" data-act="e-date-go" data-d="${d}" aria-label="${T.fmtDay(d)}${st !== 'rest' ? ' · есть тренировка' : ''}"><b>${dt.getDate()}</b><span class="mk">${st === 'pub' ? '<i class="pub"></i>' : st === 'draft' ? '<i class="draft"></i>' : st === 'comp' ? '<i class="comp"></i>' : ''}</span></button>`;
  }
  return `<div class="mh"><b>${MONTHS_N[m0.getMonth()]} ${m0.getFullYear()}</b><div><button class="nb" data-act="e-date-m" data-k="-1" aria-label="Предыдущий месяц">${I.back}</button><button class="nb" data-act="e-date-m" data-k="1" aria-label="Следующий месяц">${I.chev}</button></div></div>
    <div class="dow">${['пн','вт','ср','чт','пт','сб','вс'].map(x => `<span>${x}</span>`).join('')}</div><div class="grid">${g}</div>
    <div class="legend"><span><i style="background:var(--acc)"></i>опубликована</span><span><i style="box-shadow:inset 0 0 0 1.5px var(--acc)"></i>черновик</span><span>пустой день — новая тренировка</span></div>`;
}

/* ═══════════ ДЕЙСТВИЯ ═══════════ */
const sheetOf = b => b.closest('.ov');
function delItem(id){
  const f = findIt(id); if(!f) return;
  const snap = JSON.stringify(f.b.items), b = f.b;
  b.items.splice(f.k, 1); normSS(b);
  closeSheet(); SWOPEN = null; draw();
  undoToast((f.it.chain ? 'Связка удалена' : 'Удалено: ' + (exName(f.it) || 'строка')), () => { b.items = JSON.parse(snap); draw() });
}
let UT = 0;
function undoToast(msg, undo){
  let t = document.querySelector('.etoast'); if(!t){ t = document.createElement('div'); t.className = 'etoast'; t.setAttribute('role', 'status'); document.body.append(t) }
  t.innerHTML = `<span>${h(msg)}</span><button>Отменить</button>`; t.classList.add('on');
  t.querySelector('button').onclick = () => { t.classList.remove('on'); undo() };
  clearTimeout(UT); UT = setTimeout(() => t.classList.remove('on'), 4200);
}
function itemMenu(id){
  const f = findIt(id); if(!f) return; const it = f.it;
  sheet({id:'imenu', title: it.chain ? chainNames(it) || 'Связка' : exName(it) || 'Строка', sub: it.chain ? 'Связка' : it.exId ? 'Упражнение' : 'Строка текстом',
    body:`<div class="ed-acts">${optRow('e-item', I.edit, 'Изменить', `data-id="${id}"`)}</div>${itemActs(it)}`});
}

const acts = {
  'e-close': () => askLeave(saved => { const msg = doneMsg(saved); exit(); if(msg) say(msg) }),
  'e-leave': b => { const ov = sheetOf(b), then = ov && ov._then; closeSheet(true); if(!then) return;
    if(b.dataset.k === 'save') then(save()); else { mark(); then(false) } },
  'e-save': () => { if(!dirty()) return; const r = save(); syncBar(); say(r === 'none' ? emptyMsg() : savedMsg(r)) },
  /* глаз срабатывает сразу, как в просмотре: публикует или скрывает то, что сейчас на экране */
  'e-pub': () => { if(!hasContent()) return; ED.on = !ED.on; const r = save(); draw();
    say(r === 'pub' || r === 'draft' ? pubToggleMsg(r === 'pub', ED.pid) : savedMsg(r)) },
  'e-revert': () => { if(!ED.snap || !dirty()) return; const cur = snapOf(); closeSheet(); restore(ED.snap); draw(true);
    undoToast('Правки отменены', () => { restore(cur); draw() }) },
  'e-dmenu': () => sheetDayMenu(),
  'e-bmenu': b => sheetBlockMenu(b.dataset.b),
  'e-item': b => { closeSheet(true); sheetItem(b.dataset.id) },
  'e-ss': b => sheetSS(b.dataset.id),
  'e-del': b => delItem(b.dataset.id),
  'e-add': b => { closeSheet(true); sheetSearch({mode:'add', bid:b.dataset.b || null}) },
  'e-write': () => { const b = mkBlock(null, '', '', null, []); ED.blocks.push(b); draw();
    const inp = document.querySelector(`#edScr .qa-in[data-qb="${b.id}"]`); if(inp) inp.focus() },
  /* «+ Блок» — только новый блок (15.11: раньше сразу открывался поиск упражнения); упражнения — строкой ввода в нём */
  'e-addblk': () => { const b = mkBlock(null, '', '', null, []); ED.blocks.push(b); ED.flash.add(b.id); draw(); scrollToBlock(b.id, true) },
  /* упражнение */
  'e-x-pre': b => { const ov = sheetOf(b), it = findIt(ov.dataset.id).it; it.scheme = b.dataset.v; rerenderEx(ov, it) },
  'e-x-unit': b => { const ov = sheetOf(b), it = findIt(ov.dataset.id).it, U = units(it), pc = U.cur === '%';
    const a = pc ? it.pct : it.val, z = pc ? it.pct2 : it.val2; setLoad(it, b.dataset.u, a ?? '', z ?? ''); it._u = b.dataset.u; rerenderSheet(ov) },
  'e-x-rng': b => { const id = b.dataset.id, f = findIt(id); if(!f) return; const it = f.it;
    if(hasRng(it)){ delete it.pct2; delete it.val2; it._rng = false } else it._rng = true; closeSheet(true); draw(); sheetItem(id) },
  'e-x-txt': b => { const id = b.dataset.id, f = findIt(id); if(!f) return; const it = f.it;
    if(txtMode(it)){ it.txt = ''; it._tx = false } else it._tx = true; closeSheet(true); draw(); sheetItem(id) },
  'e-imenu': b => itemMenu(b.dataset.id),
  'e-x-replace': b => { const f = findIt(b.dataset.id); closeSheet(true); sheetSearch({mode:'replace', id:b.dataset.id, q: f && !f.it.exId ? String(f.it.raw || '').slice(0, 40) : ''}) },
  'e-x-dup': b => { const f = findIt(b.dataset.id); if(!f) return; const c = JSON.parse(JSON.stringify(f.it)); c.id = nid('i'); (c.parts || []).forEach(p => p.id = nid('i'));
    f.b.items.splice(f.k + 1, 0, c); normSS(f.b); ED.flash.add(c.id); closeSheet(); draw(); say('Скопировано') },
  'e-sel': b => { const id = b.dataset.id, f = id && findIt(id); closeSheet(true); ED.sel = new Set(f && itemHas(f.it) ? [id] : []); ED.selAt = id || null; draw() },
  'e-sel-t': b => { const id = b.dataset.id, f = findIt(id); if(!f || b.getAttribute('aria-disabled') === 'true') return;
    if(ED.sel.has(id)) ED.sel.delete(id); else ED.sel.add(id); draw() },
  'e-sel-x': () => { ED.sel = null; draw() },
  'e-sel-merge': () => selMerge(),
  'e-x-unss': b => { const f = findIt(b.dataset.id); if(!f) return; const its = f.b.items; let hk = f.k; while(hk >= 0 && !its[hk].ss) hk--;
    const end = ssEnd(its, hk), [x] = its.splice(f.k, 1); x.sub = false; its.splice(end - 1, 0, x); normSS(f.b); closeSheet(); draw() },
  'e-x-move': b => { const id = b.dataset.id, f = findIt(id); if(!f) return;
    const ov = sheet({id:'move', title:'Перенести в блок', body:`<div class="ed-opts">${ED.blocks.map((x, k) => isTextBlock(x) || x === f.b ? '' :
      `<button class="opt" data-act="e-x-move-to" data-id="${id}" data-b="${x.id}"><span class="oi">${IC.move}</span>${h(x.title || blockTypeLabel(x) || 'Блок ' + (k + 1))}</button>`).join('')}</div>`}); },
  'e-x-move-to': b => { const f = findIt(b.dataset.id), to = blk(b.dataset.b); if(!f || !to) return; const [x] = f.b.items.splice(f.k, 1); x.sub = false;
    to.items = to.items.filter(y => y.ss || itemHas(y)); to.items.push(x); normSS(f.b); normSS(to); ED.flash.add(x.id); closeSheet(); draw(); scrollToBlock(to.id, true) },
  'e-r-ai': b => { const f = findIt(b.dataset.id); if(!f) return; const it = parseLine(f.it.raw);
    if(!it){ say('Упражнение не узнано — выберите его из базы'); return } it.sub = f.it.sub; f.b.items.splice(f.k, 1, it); ED.flash.add(it.id); closeSheet(true); draw(); sheetItem(it.id); say('Разобрано — проверьте схему и нагрузку') },
  /* связка */
  'e-c-del': b => { const ov = sheetOf(b), it = findIt(ov.dataset.id).it; it.parts = it.parts.filter(p => p.id !== b.dataset.p); rerenderSheet(ov) },
  'e-c-add': b => { const id = b.dataset.id; closeSheet(true); sheetSearch({mode:'part', id}) },
  /* сет */
  'e-ss-r': b => { const ov = sheetOf(b), it = findIt(ov.dataset.id).it; it.rounds = Math.max(1, Math.min(20, (+it.rounds || 1) + +b.dataset.d)); reSS(ov) },
  'e-ss-rest': b => { const ov = sheetOf(b), it = findIt(ov.dataset.id).it; it.rest = b.dataset.v; reSS(ov) },
  'e-ss-ungroup': b => grpUn(b.dataset.id),
  'e-g-un': b => grpUn(b.dataset.id),
  'e-g-kind': b => { const f = findIt(b.dataset.id); if(!f) return; const B = f.b, snap = JSON.stringify(B.items);
    const r = b.dataset.k === 'ch' ? grpToChain(B, b.dataset.id) : grpToSet(B, b.dataset.id); if(!r) return;
    closeSheet(true); draw(); if(r.chain) sheetChain(r.id); else if(r.ss) sheetSS(r.id);
    undoToast(r.chain ? 'Теперь связка' : 'Теперь сет', () => { closeSheet(true); B.items = JSON.parse(snap); draw() }) },
  'e-ss-del': b => { const f = findIt(b.dataset.id); if(!f) return; const snap = JSON.stringify(f.b.items), blk_ = f.b, end = ssEnd(f.b.items, f.k);
    f.b.items.splice(f.k, end - f.k); closeSheet(); draw(); undoToast('Сет удалён', () => { blk_.items = JSON.parse(snap); draw() }) },
  /* поиск */
  'e-s-g': b => { SR.g = b.dataset.g; reSearch() },
  'e-s-pick': b => { const id = b.dataset.ex;
    if(SR.mode === 'add'){ const k = SR.picked.indexOf(id); if(k >= 0) SR.picked.splice(k, 1); else SR.picked.push(id); reSearch(); return }
    pickOne(id) },
  'e-s-as': b => { SR.as = b.dataset.k; reSearch() },
  'e-s-add': () => addPicked(),
  'e-s-raw': () => { const q = SR.q.trim(); if(!q) return;
    if(SR.mode === 'replace'){ const f = findIt(SR.id); if(f){ Object.assign(f.it, {exId:null, raw:q, scheme:'', pct:null, unit:'', val:'', txt:''}); delete f.it.pct2; delete f.it.val2 } closeSheet(); draw(); return }
    const bl = targetBlock(SR.bid), it = rawItem(q); bl.items.push(it); ED.flash.add(it.id); closeSheet(); draw(); scrollToBlock(bl.id, true); say('Строка добавлена текстом — клиент увидит как написано') },
  'e-s-own': () => { const q = SR.q.trim(); if(!q) return; const ctx = {...SR};
    sheetNewEx(cap1(q), e => { if(ctx.mode === 'add'){ const bl = targetBlock(ctx.bid), it = mkItem(e.id); bl.items.push(it); ED.flash.add(it.id); draw(); say('«' + e.ru + '» — в вашей базе и в блоке') }
      else { SR = ctx; pickOne(e.id) } }) },
  'e-new-ok': b => { const ov = b.closest('.ov'); if(!ov || !ov._done) return; const n = ov.querySelector('#neN').value.trim(); if(!n){ say('Укажите название'); return }
    const g = (ov.querySelector('[data-ng].on') || {}).dataset?.ng || 'Без группы', u = [...ov.querySelectorAll('[data-nu].on')].map(x => x.dataset.nu);
    const e = addOwnEx({ru:n, g, u: u.length ? u : ['повт']}); const done = ov._done; closeSheet(true); done(e) },
  'e-new-g': b => { b.closest('.chips').querySelectorAll('.chip').forEach(c => c.classList.toggle('on', c === b)) },
  'e-new-u': b => b.classList.toggle('on'),
  'e-q-pick': b => quickAdd(b.dataset.b, mkItem(b.dataset.ex), 'Добавлено — нажмите строку, чтобы задать схему'),
  'e-q-raw': b => { const t = quickText(b.dataset.b); if(t) quickAdd(b.dataset.b, rawItem(t), 'Строка добавлена текстом — клиент увидит как написано') },
  'e-q-ai': b => { const t = quickText(b.dataset.b); if(!t) return; const it = parseLine(t);
    quickAdd(b.dataset.b, it || rawItem(t), it ? 'Разобрано ИИ — проверьте схему и нагрузку' : 'Упражнение не узнано — строка осталась текстом') },
  'e-q-own': b => { const t = quickText(b.dataset.b); if(t) sheetNewEx(cap1(t), e => quickAdd(b.dataset.b, mkItem(e.id), '«' + e.ru + '» — в вашей базе и в блоке')) },
  /* тип блока */
  'e-type': b => sheetType(b.dataset.b),
  'e-type-k': b => { const ov = sheetOf(b), x = blk(ov.dataset.b); x.kind = b.dataset.k || null; if(x.kind !== 'complex') x.fmt = null; reType() },
  'e-type-f': b => { const ov = sheetOf(b), x = blk(ov.dataset.b), t = FMT_TYPES.find(f => (f.k || '') === b.dataset.k); x.fmt = t && t.k ? {k:t.k, ...t.d} : null; reType() },
  'e-f': b => { const ov = sheetOf(b), f = blk(ov.dataset.b).fmt, k = b.dataset.f, d = +b.dataset.d;
    const lim = {rounds:[1, 99], total:[0, 7200], work:[5, 600], rest:[0, 600], start:[1, 50]}[k]; f[k] = Math.max(lim[0], Math.min(lim[1], (+f[k] || 0) + d)); fmtRecalc(f); reType() },
  'e-f-work': b => { const ov = sheetOf(b), f = blk(ov.dataset.b).fmt; f.work = +b.dataset.v; fmtRecalc(f); reType() },
  /* блок */
  'e-note': b => { const x = blk(b.dataset.b); if(!x) return;
    const ov = sheet({id:'note', title:'Заметка к блоку', sub:'Клиент увидит её над упражнениями блока', body:`<div class="sh-p"><textarea id="nTx" class="note" rows="4" placeholder="Например: темп спокойный, пульс до 130">${h(x.note || '')}</textarea></div>
      ${x.note ? `<div class="ed-acts">${optRow('e-note-del', IC.trash, 'Удалить заметку', `data-b="${x.id}"`, 'rm')}</div>` : ''}`, foot:foot()});
    const ta = ov.querySelector('#nTx'); ta.addEventListener('input', () => { x.note = ta.value.trim() ? ta.value : ''; draw() }); setTimeout(() => ta.focus(), 260) },
  'e-note-del': b => { const x = blk(b.dataset.b); if(x){ x.note = ''; closeSheet(); draw() } },
  'e-bsave': b => { const x = blk(b.dataset.b); if(!x) return; const guess = TYPE_FOLDER[x.kind] || 'Разминки';
    sheet({id:'folder', title:'Сохранить в базу блоков', sub:'Папка', body:`<div class="ed-opts">${TPL_FOLDERS.map(f => `<button class="opt${f === guess ? ' on' : ''}" data-act="e-bsave-to" data-b="${x.id}" data-f="${h(f)}"><span class="box rnd">${I.check}</span>${h(f)}${f === guess ? '<span class="n">подходит</span>' : ''}</button>`).join('')}</div>`}) },
  'e-bsave-to': b => { const x = blk(b.dataset.b); if(!x) return; blockToTpl(x, b.dataset.f); closeSheet(); say('Блок «' + (x.title || 'без названия') + '» — в папке «' + b.dataset.f + '»') },
  /* «Текст» в шапке блока (15.11): строки ↔ текст, как в заметках. В текст — строки блока как их видит клиент;
     обратно — если текст не меняли, возвращаются прежние строки (упражнения из базы, схемы, сеты),
     иначе каждая строка текста — строкой текстом: упражнение выбирают нажатием на неё или разбирают ИИ */
  'e-btoggle': b => { const x = blk(b.dataset.b); if(!x) return; const snap = JSON.stringify(x);
    const undo = () => { Object.keys(x).forEach(k => delete x[k]); Object.assign(x, JSON.parse(snap)); draw() };
    if(isTextBlock(x)){
      const back = x._from && x._from.text === x.text ? JSON.parse(x._from.items) : textLines(x.text).map(l => rawItem(l.replace(LIST_RE, '')));
      delete x.text; delete x._from; x.items = back; normSS(x); ED.focusQ = back.length ? null : x.id; draw();
      undoToast('Блок строками — упражнения из базы или текстом', undo);
    } else {
      x.text = blockToText(x); x._from = {items: JSON.stringify(x.items || []), text: x.text}; x.items = [];
      ED.focusTA = x.id; draw(); undoToast('Блок текстом — пишите как в заметках', undo);
    } },
  'e-btext': b => { const x = blk(b.dataset.b); if(!x) return; const snap = JSON.stringify(x), k = ED.blocks.indexOf(x);
    const tb = Object.assign(textBlock(blockToText(x), x.title), {kind:x.kind, note:x.note}); ED.blocks.splice(k, 1, tb); closeSheet(); draw();
    undoToast('Блок переведён в текст', () => { ED.blocks.splice(ED.blocks.indexOf(tb), 1, JSON.parse(snap)); draw() }) },
  'e-bclear': b => { const x = blk(b.dataset.b); if(!x) return; const snap = JSON.stringify(x);
    if(isTextBlock(x)) x.text = ''; else x.items = []; closeSheet(); draw(); undoToast('Блок очищен', () => { Object.assign(x, JSON.parse(snap)); draw() }) },
  'e-bdel': b => { const x = blk(b.dataset.b); if(!x) return; const k = ED.blocks.indexOf(x);
    ED.blocks.splice(k, 1); closeSheet(); draw(); undoToast('Блок удалён', () => { ED.blocks.splice(k, 0, x); draw() }) },
  /* день */
  'e-msg': () => { const ov = sheet({id:'msg', title:'Сообщение ' + (isG() ? 'группе' : 'клиенту'), sub:(isG() ? 'Каждый участник' : cap1(aud())) + ' увидит его первым, до блоков',
      body:`<div class="sh-p"><textarea id="mTx" class="note" rows="4" placeholder="Например: сегодня работаем на технику, вес не гоним">${h(ED.msg)}</textarea></div>
      ${ED.msg ? `<div class="ed-acts">${optRow('e-msg-del', IC.trash, 'Удалить сообщение', '', 'rm')}</div>` : ''}`, foot:foot()});
    const ta = ov.querySelector('#mTx'); ta.addEventListener('input', () => { ED.msg = ta.value.trim() ? ta.value : ''; draw() }); setTimeout(() => ta.focus(), 260) },
  'e-msg-del': () => { ED.msg = ''; closeSheet(); draw() },
  'e-comp': () => { ED.comp = !ED.comp; closeSheet(); draw(); say(ED.comp ? 'День отмечен как соревнование' : 'Отметка «Соревнование» снята') },
  'e-dsave': () => { const bs = ED.blocks.filter(blockHas); if(!bs.length) return; const ids = bs.map(b => blockToTpl(b));
    tplPut({id:freshId('u'), lvl:'тренировка', own:true, at:TODAY, used:0, title:ED.title || 'Тренировка без названия', blocks:ids});
    closeSheet(); say('Тренировка и ' + pl(bs.length, 'блок', 'блока', 'блоков') + ' — в базе') },
  'e-wizard': () => { closeSheet(true); const go_ = () => { const id = ED.w.id; ED = null; location.hash = `#/edit/${id}/wizard` };
    const msg = keep(); if(msg) say(msg); go_() },
  'e-reorder': () => { closeSheet(true); ED.reorder = !ED.reorder; draw() },
  'e-dclear': () => sheet({id:'clear', title:ED.tpl ? 'Очистить шаблон?' : 'Очистить день?', sub:'Все блоки и название тренировки', body:`<div class="sh-p ed-ask">
      <button class="btn rm" data-act="e-dclear-ok">Очистить</button><button class="btn o" data-act="close-sheet">Отмена</button></div>`}),
  'e-dclear-ok': () => { const snap = JSON.stringify({t:ED.title, b:ED.blocks}); ED.blocks = []; ED.title = ''; ED.pending = null; closeSheet(); draw(true);
    undoToast(ED.tpl ? 'Шаблон очищен' : 'День очищен', () => { const s = JSON.parse(snap); ED.title = s.t; ED.blocks = s.b; draw() }) },
  /* текст */
  'e-text': b => { closeSheet(true); sheetText(b.dataset.b || null, !b.dataset.b) },
  'e-t-list': b => { const ov = sheetOf(b), ta = ov.querySelector('#tTx'), v = ta.value, s = ta.selectionStart, e = ta.selectionEnd;
    const a = v.lastIndexOf('\n', s - 1) + 1, z = (k => k < 0 ? v.length : k)(v.indexOf('\n', e)), lines = v.slice(a, z).split('\n');
    const all = lines.every(l => LIST_RE.test(l)), nl = lines.map(l => all ? l.replace(LIST_RE, '') : LIST_RE.test(l) ? l : '• ' + l).join('\n');
    ta.setRangeText(nl, a, z, 'end'); ta.focus(); ta.dispatchEvent(new Event('input')) },
  'e-t-ok': b => { const ov = sheetOf(b), {b: x} = textTarget(ov); closeSheet(); draw(); if(x) setTimeout(() => scrollToBlock(x.id), 30) },
  'e-t-ai': b => { const ov = sheetOf(b), {b: x} = textTarget(ov); if(!x || !x.text.trim()){ say('Сначала напишите текст'); return }
    b.disabled = true; b.innerHTML = IC.spark + 'Разбираю…';
    setTimeout(() => { closeSheet(true); if(!aiParse(x)) draw() }, 700) },
  'e-ai': b => { const x = blk(b.dataset.b); if(!x) return; b.disabled = true; b.classList.add('busy'); b.setAttribute('aria-label', 'Разбираю…'); setTimeout(() => { if(!aiParse(x)) draw() }, 700) },
  'e-ai-src': () => { const P = ED.pending; if(P) sheet({id:'aisrc', title:P.photo ? 'Фото' : 'Исходный текст', sub:P.photo ? 'Снимок и распознанный текст — клиент их не видит' : 'Как было написано до разбора',
    body:`<div class="sh-p">${P.photo ? `<img class="ai-photo" src="${P.photo}" alt="Фото тренировки">` : ''}<p class="ai-src">${h(P.text)}</p></div>`}) },
  /* Фото — только разбор ИИ (15.11.2026): снимок тетради, доски или скриншот распознаётся в текст
     и сразу разбирается, как блок текстом; клиент снимок не видит. В прототипе вместо
     распознавания — пример записи из тетради (PHOTO_OCR_DEMO, data.js) */
  'e-photo': () => { closeSheet(true);
    let inp = document.getElementById('edPhotoIn');
    if(!inp){ inp = document.createElement('input'); inp.type = 'file'; inp.accept = 'image/*'; inp.id = 'edPhotoIn'; inp.hidden = true; document.body.appendChild(inp);
      inp.addEventListener('change', () => { const f = inp.files && inp.files[0]; inp.value = ''; if(!f || !ED) return;
        const r = new FileReader(); r.onload = () => { say('Распознаю фото…');
          setTimeout(() => { if(!ED) return; const tb = textBlock(PHOTO_OCR_DEMO, ''); ED.blocks.push(tb);
            if(aiParse(tb)){ ED.pending.photo = String(r.result); draw() } else draw() }, 700) };
        r.readAsDataURL(f) }) }
    inp.click() },
  'e-ai-yes': () => { ED.pending = null; draw(); say('Принято — проверьте схемы в строках') },
  'e-ai-no': () => { const P = ED.pending; if(!P) return; const k = ED.blocks.findIndex(b => P.ids.has(b.id));
    const tb = Object.assign(textBlock(P.text, P.title), {kind:P.kind || null, note:P.note || ''});
    ED.blocks = ED.blocks.filter(b => !P.ids.has(b.id)); ED.blocks.splice(Math.max(0, k), 0, tb); ED.pending = null; draw() },
  /* шаблоны и копирование */
  'e-tpl': b => { closeSheet(true); sheetTpl(b.dataset.k || (ED.blocks.length ? 'блок' : 'тренировка')) },
  'e-tpl-pick': b => { const t = tplById(b.dataset.id); if(!t) return;
    /* в шаблоне тренировки блок из базы остаётся ссылкой на него, пока его не правили */
    if(t.lvl === 'блок'){ const x = ED.tpl ? tplBlockOf(t) : tplToBlock(t); appendWorkout('', [x], 'Блок «' + t.title + '» добавлен') }
    else { const w = tplToWorkout(t); if(ED.tpl) w.blocks = (t.blocks || []).map(tplById).filter(Boolean).map(tplBlockOf);
      appendWorkout(w.title, w.blocks, 'Тренировка «' + t.title + '» добавлена') } },
  /* папка шаблона блока */
  'e-tfolder': () => { if(!solo()) return; const cur = ED.tpl.folder || TYPE_FOLDER[(ED.blocks[0] || {}).kind] || 'Разминки';
    sheet({id:'tfolder', title:'Папка', sub:'В какой папке базы лежит блок', body:`<div class="ed-opts">${TPL_FOLDERS.map(f => `<button class="opt${f === cur ? ' on' : ''}" data-act="e-tfolder-set" data-f="${h(f)}" role="radio" aria-checked="${f === cur}"><span class="box rnd">${I.check}</span>${h(f)}</button>`).join('')}</div>`}) },
  'e-tfolder-set': b => { if(!ED || !ED.tpl) return; ED.tpl.folder = b.dataset.f; closeSheet(); draw() },
  'e-copy': () => { closeSheet(true); sheetCopy(ED.w.id) },
  'e-copy-who': () => T.pick('copyw', 'Откуда копировать', id => sheetCopy(id)),
  'e-copy-pick': b => { const w = who(b.dataset.id), x = w && dayAt(w.prog, b.dataset.d); if(!x) return; const c = JSON.parse(x.c);
    appendWorkout(c.t, restoreBlocks(c), 'Скопировано из ' + T.fmtDay(b.dataset.d) + (w.id !== ED.w.id ? ' · ' + w.n : '')) },
  /* дата */
  'e-who': () => { const d = ED.date; T.pick('ewho', 'Чья тренировка', id => { if(id === ED.w.id) return;
    askLeave(saved => { const msg = doneMsg(saved); if(msg) say(msg); ED = null; location.replace(`#/edit/${id}/${d}`) }) }) },
  'e-date': () => { DM = ED.date.slice(0, 7) + '-01'; const ov = sheet({id:'edate', title:'Другой день', sub:ED.w.n, body:`<div class="ed-cal">${dateBody()}</div>`}); },
  'e-date-m': b => { const m = new Date(DM + 'T00:00:00'); m.setMonth(m.getMonth() + +b.dataset.k); DM = m.getFullYear() + '-' + String(m.getMonth() + 1).padStart(2, '0') + '-01';
    const ov = document.querySelector('.ov[data-sheet="edate"]'); if(ov) ov.querySelector('.ed-cal').innerHTML = dateBody() },
  'e-date-go': b => { const d = b.dataset.d; if(d === ED.date){ closeSheet(); return } closeSheet(true);
    askLeave(saved => { const msg = doneMsg(saved); if(msg) say(msg); const id = ED.w.id; ED = null; location.replace(`#/edit/${id}/${d}`) }) }
};

/* блок в базу — та же запись, что у кабинета (TPL-1) */
const tplArr = i => i.chain ? [CH_TAG, i.parts.filter(partHas).map(tplArr), serChain(i), '', '', i.sub ? 1 : 0]
  : !i.exId ? [TXT_TAG, String(i.raw).trim(), '', '', '', i.sub ? 1 : 0]
  : i.pct != null ? [i.exId, i.scheme || '', i.pct2 != null ? i.pct + RNG + i.pct2 : i.pct, '%', i.txt || '', i.sub ? 1 : 0]
  : [i.exId, i.scheme || '', i.val2 ? i.val + RNG + i.val2 : i.val || '', i.unit || '', i.txt || '', i.sub ? 1 : 0];
function blockToTpl(b, folder){
  const t = {id:freshId('u'), lvl:'блок', folder: folder || TYPE_FOLDER[b.kind] || 'Разминки', used:0, kind:b.kind || null, own:true, at:TODAY,
    title: b.title || blockTypeLabel(b) || (isTextBlock(b) ? firstTextLine(b.text) : '') || 'Блок без названия', fmt: b.fmt ? {...b.fmt} : null,
    ...(isTextBlock(b) ? {text:b.text} : {}),
    items: normSS({items:(b.items || []).filter(i => itemHas(i) || i.ss).map(i => ({...i}))}).items.map(i => i.ss ? [SS_TAG, i.rounds, i.rest || ''] : tplArr(i))};
  tplPut(t); return t.id;
}
function blockToText(b){
  const rng = (a, z) => String(a).replace('.', ',') + (z != null && z !== '' ? '–' + String(z).replace('.', ',') : '');
  const load = it => [it.pct != null ? rng(it.pct, it.pct2) + '%' : '', it.val ? rng(it.val, it.val2) + (it.unit ? ' ' + it.unit : '') : ''].filter(Boolean).join(' ');
  const line = it => it.chain ? chainNames(it) + ([load(it), chainScheme(it)].some(Boolean) ? ': ' + [load(it), chainScheme(it)].filter(Boolean).join(' — ') : '')
    : !it.exId ? exName(it) : [exName(it), it.scheme, load(it), it.txt].filter(Boolean).join(' ');
  return (b.items || []).map(it => it.ss ? 'Сет ' + pl(+it.rounds, 'круг', 'круга', 'кругов') + (it.rest ? ', отдых ' + it.rest : '') + ':'
    : itemHas(it) ? (it.sub ? '• ' : '') + line(it) : '').filter(Boolean).join('\n');
}

window.TED = {open, openTpl, leave, queue: q => { QUEUE = q }, acts, isOpen: () => !!ED};
})();
