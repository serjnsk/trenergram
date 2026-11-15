/* ═══════════════════════════════════════════════════════════════
   ТРЕНЕРСКОЕ ПРИЛОЖЕНИЕ · БАЗЫ (#/more/ex · blocks · workouts · programs)

   «Ещё → Базы» — те же четыре базы, что в кабинете (exercises.html,
   blocks.html, workouts.html, programs.html и страницы элементов), но под
   телефон (план согласован 14.11.2026). Данные и запись общие с кабинетом
   (data.js: exPut, exDrop, techPut, addOwnEx, tplPut, tplDrop, tplClone,
   usesOf), поэтому правка здесь сразу видна на десктопе и наоборот.

   Список: переключатель «Все · Свои» (в кабинете — галочка «Только свои»),
   поиск, фильтр и порядок — в шторке (в кабинете — выпадающие списки и
   сортировка по столбцам). Поиск, фильтр и прокрутка переживают уход на
   элемент, как в кабинете. Упражнений больше тысячи — строки дорисовываются
   при прокрутке.

   Элемент — экран просмотра. Своё правится строками: значение в строке,
   правка в шторке (как в редакторе тренировки), сохраняется сразу — как
   автосохранение кабинета. Общее из базы сервиса только смотрят. Блок и
   тренировку правит редактор тренировки в режиме шаблона (editor.js →
   TED.openTpl). «Добавить клиенту» (тренировка) и «В тренировку» (блок,
   упражнение) — кому, какой день и редактор этого дня (TED.queue), как окно
   кабинета assets/assign.js; «Назначить клиенту» у программы — цикл в
   календарь клиента или группы (progAssign в data.js, CON-9).
   ═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';
const T = window.TAPP; if(!T) return;
const {I, h, sheet, closeSheet, say, go, nav, nb} = T;

const LV = {
  ex:      {t:'Упражнения', one:'Упражнение', add:'Новое упражнение', ph:'Поиск упражнения'},
  blocks:  {lvl:'блок', t:'Блоки', one:'Блок', add:'Новый блок', ph:'Поиск блока'},
  workouts:{lvl:'тренировка', t:'Тренировки', one:'Тренировка', add:'Новая тренировка', ph:'Поиск тренировки'},
  programs:{lvl:'программа', t:'Программы', one:'Программа', add:'Новая программа', ph:'Поиск программы'}};
const KEY_OF = {'блок':'blocks', 'тренировка':'workouts', 'программа':'programs'};
const hrefOf = t => '#/more/' + KEY_OF[t.lvl] + '/' + t.id;
/* Единицы — те же, что на странице упражнения в кабинете (exercise.html) */
const EX_UNITS = ['кг','повт','сек','м','кал','темп','скорость','мощность','высота','пульс','RPE'];
const CH = 60;     /* строк упражнений за раз */

/* Состояние списков — живёт, пока открыто приложение: вернулись с элемента —
   поиск, фильтр, порядок и прокрутка те же. */
const ST = {
  ex:      {own:false, q:'', g:'Все', eq:'', sort:'name', n:CH, y:0},
  blocks:  {own:false, q:'', folder:'Все', type:'all', sort:'def', y:0},
  workouts:{own:false, q:'', sort:'def', y:0},
  programs:{own:false, q:'', sort:'def', y:0}};
const SORTS = {
  ex:      [['name', 'По названию'], ['own', 'Сначала свои'], ['g', 'По группе мышц'], ['eq', 'По оснащению']],
  blocks:  [['def', 'Сначала свои, новые выше'], ['name', 'По названию'], ['used', 'По использованию'], ['n', 'По числу упражнений'], ['folder', 'По папке']],
  workouts:[['def', 'Сначала свои, новые выше'], ['name', 'По названию'], ['used', 'По использованию'], ['blocks', 'По числу блоков'], ['n', 'По числу упражнений']],
  programs:[['def', 'Сначала свои, новые выше'], ['name', 'По названию'], ['used', 'По использованию'], ['days', 'По длительности'], ['cycle', 'По длине цикла']]};
const SORT_DEF = {ex:'name', blocks:'def', workouts:'def', programs:'def'};

let CUR = null, PREV = null;     /* текущий и прошлый экран баз: {k, id} */
let XD = null, PD = null;        /* черновики нового упражнения и программы */
const XS = {more:{}};            /* «Показать все» у похожих и замен */
let PRE = false;                 /* программа: режим «Порядок» */

/* ─── помощники ─── */
const pl = (n, a, b, c) => n + ' ' + plural3(n, a, b, c);
const chev = I.chev.replace('<svg', '<svg class="chev" aria-hidden="true"');
const backBtn = to => `<button class="nb" data-act="back" data-to="${to}" aria-label="Назад">${I.back}</button>`;
const imgSrc = e => !e.img ? '' : /^(https?:|data:|\.\.\/)/.test(e.img) ? e.img : '../' + e.img;
const thumb = (e, cls = '') => `<span class="bx-th${cls}" aria-hidden="true">${e.img && e.m !== 'pending' ? `<img src="${imgSrc(e)}" alt="" loading="lazy">` : h(initials(e) || '•')}</span>`;
const ownPill = x => x.own ? '<span class="pill ok">своё</span>' : '';
const dLong = iso => { const d = new Date(iso + 'T00:00:00'); return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear() };
const dShort = iso => { const d = new Date(iso + 'T00:00:00'); return d.getDate() + '\u00a0' + MONTHS[d.getMonth()] };
const cap1 = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const optR = (act, on, label, extra = '', n = '') => `<button class="opt${on ? ' on' : ''}" data-act="${act}" role="radio" aria-checked="${on}" ${extra}><span class="box rnd">${I.check}</span><span class="ot">${h(label)}</span>${n !== '' ? `<span class="n">${n}</span>` : ''}</button>`;
const optC = (act, on, label, extra = '') => `<button class="opt${on ? ' on' : ''}" data-act="${act}" role="checkbox" aria-checked="${on}" ${extra}><span class="box">${I.check}</span><span class="ot">${h(label)}</span></button>`;
const optA = (act, ic, label, extra = '', cls = '') => `<button class="opt${cls ? ' ' + cls : ''}" data-act="${act}" ${extra}>${ic ? `<span class="oi">${ic}</span>` : ''}${label}</button>`;
const goBack = to => T.ACT.back({dataset:{to}});
const IC = {
  copy: I.copy,
  trash: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4.5 7h15M10 11v6M14 11v6M6.5 7l1 12.5a1.5 1.5 0 0 0 1.5 1.5h6a1.5 1.5 0 0 0 1.5-1.5l1-12.5M9.5 7V4.5h5V7"/></svg>',
  up: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 19V5M6 11l6-6 6 6"/></svg>',
  dn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14M6 13l6 6 6-6"/></svg>',
  rest: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19.5 14.5A8 8 0 0 1 9.5 4.5a8 8 0 1 0 10 10z"/></svg>',
  grip: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M5 9h14M5 15h14"/></svg>',
  swap: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 8h14l-3.5-3.5M20 16H6l3.5 3.5"/></svg>'
};

/* ═══════════ СПИСКИ ═══════════ */
function exList(){
  const S = ST.ex, n = norm(S.q || '');
  const L = exLive().filter(e => (!S.own || e.own) && (S.g === 'Все' || e.g === S.g) && (!S.eq || e.eq === S.eq)
    && (!n || norm(e.ru).includes(n) || norm(e.en || '').includes(n)));
  const byName = (a, b) => a.ru.localeCompare(b.ru, 'ru');
  const by = {name:byName, own:(a, b) => (b.own ? 1 : 0) - (a.own ? 1 : 0) || byName(a, b),
    g:(a, b) => String(a.g).localeCompare(String(b.g), 'ru') || byName(a, b), eq:(a, b) => String(a.eq).localeCompare(String(b.eq), 'ru') || byName(a, b)}[S.sort] || byName;
  return L.sort(by);
}
function tplList(k){
  const S = ST[k], lvl = LV[k].lvl, n = norm(S.q || '');
  if(lvl === 'блок') TPL.filter(t => t.lvl === 'блок').forEach(normFmt);    /* как в кабинете: формат из названия — в тип */
  const L = tplLive(lvl).filter(t => (!S.own || t.own) && (!n || norm(t.title).includes(n))
    && (lvl !== 'блок' || ((S.folder === 'Все' || t.folder === S.folder) && (S.type === 'all' || (t.kind || 'none') === S.type))));
  const st = t => tplStats(t), byName = (a, b) => a.title.localeCompare(b.title, 'ru');
  const by = {def:libSort, name:byName, used:(a, b) => (b.used || 0) - (a.used || 0) || libSort(a, b),
    n:(a, b) => st(b).n - st(a).n || libSort(a, b), blocks:(a, b) => st(b).blocks - st(a).blocks || libSort(a, b),
    days:(a, b) => (b.days || 0) - (a.days || 0) || libSort(a, b), cycle:(a, b) => st(b).cycle - st(a).cycle || libSort(a, b),
    folder:(a, b) => TPL_FOLDERS.indexOf(a.folder) - TPL_FOLDERS.indexOf(b.folder) || libSort(a, b)}[S.sort] || libSort;
  return L.sort(by);
}
/* подпись строки: блок — тип и состав, тренировка — блоки и упражнения, программа — срок и цикл; N× — сколько раз использован */
function tplSub(t){
  const s = tplStats(t);
  const parts = t.lvl === 'блок' ? [blockTypeLabel(t), isTextBlock(t) ? pl(s.n, 'строка', 'строки', 'строк') + ' текстом' : s.n + ' упр.']
    : t.lvl === 'тренировка' ? [pl(s.blocks, 'блок', 'блока', 'блоков'), s.n + ' упр.']
    : [pl(t.days || 0, 'день', 'дня', 'дней'), 'цикл ' + pl(s.cycle, 'день', 'дня', 'дней'), pl(s.workouts, 'тренировка', 'тренировки', 'тренировок')];
  if(t.used) parts.push(t.used + '×');
  return parts.filter(Boolean).join(' · ');
}
const exSub = e => [e.g, e.eq && e.eq !== '—' ? e.eq : '', e.pm ? 'от 1ПМ' : ''].filter(Boolean).join(' · ');
const exRowHTML = e => `<a class="row bx-r" href="#/more/ex/${e.id}">${thumb(e)}<span class="t"><b>${h(e.ru)}</b><s>${h(exSub(e))}</s></span>${ownPill(e)}${chev}</a>`;
const tplRowHTML = t => `<a class="row bx-r nt" href="${hrefOf(t)}"><span class="t"><b>${h(t.title)}</b><s>${h(tplSub(t))}</s></span>${ownPill(t)}${chev}</a>`;
/* sheetOn — в шторке выбран фильтр; narrowed — список сужен поиском или фильтром; filtersOn — в шторке что-то изменено, включая порядок */
const sheetOn = k => { const S = ST[k]; return (k === 'ex' && (S.g !== 'Все' || !!S.eq)) || (k === 'blocks' && (S.folder !== 'Все' || S.type !== 'all')) };
const narrowed = k => !!ST[k].q || sheetOn(k);
const filtersOn = k => ST[k].sort !== SORT_DEF[k] || sheetOn(k);
function fsumHTML(k){
  const S = ST[k], f = [];
  if(k === 'ex'){ if(S.g !== 'Все') f.push(S.g); if(S.eq) f.push(S.eq === '—' ? 'Без оснащения' : S.eq) }
  if(k === 'blocks'){ if(S.folder !== 'Все') f.push(S.folder); if(S.type !== 'all') f.push(S.type === 'none' ? 'Без типа' : cap1(typeName(S.type))) }
  if(S.sort !== SORT_DEF[k]) f.push((SORTS[k].find(x => x[0] === S.sort) || ['', ''])[1].toLowerCase());
  return f.length ? `<div class="fsum"><span>${h(cap1(f.join(', ')))}</span><button class="lnk" data-act="b-f-reset" data-k="${k}">Сбросить</button></div>` : '';
}
const emptyHTML = k => ST[k].own && !narrowed(k)
  ? `<div class="empty"><b>Своих пока нет</b>${k === 'ex' ? 'Добавьте упражнение кнопкой «+» вверху' : 'Создайте кнопкой «+» вверху или сохраните копию общего'}</div>`
  : `<div class="empty"><b>Ничего не нашли</b>Измените поиск или фильтр</div>`;
let LAST = [];
function listHTML(k){
  const S = ST[k];
  if(k === 'ex'){
    const L = LAST = exList(); if(!L.length) return emptyHTML(k);
    const n = Math.min(L.length, Math.max(S.n, CH)), cap = narrowed(k) ? 'Найдено' : S.own ? 'Свои упражнения' : 'Все упражнения';
    return `<div class="cap">${cap} · ${L.length}</div><div class="bx-rows">${L.slice(0, n).map(exRowHTML).join('')}</div>`
      + (L.length > n ? `<div class="bx-more" id="bxMore"><button class="btn s o" data-act="b-more">Показать ещё</button></div>` : '');
  }
  const L = tplList(k); if(!L.length) return emptyHTML(k);
  /* блоки без поиска, фильтра и своего порядка — по папкам: единственный уровень с папками (TPL-1) */
  if(k === 'blocks' && !S.q && S.folder === 'Все' && S.type === 'all' && (S.sort === 'def' || S.sort === 'folder')){
    const fs = [...TPL_FOLDERS, ...new Set(L.map(t => t.folder).filter(f => !TPL_FOLDERS.includes(f)))];
    return fs.map(f => { const xs = L.filter(t => (t.folder || '') === (f || '')); return xs.length ? `<div class="cap">${h(f || 'Без папки')} · ${xs.length}</div>` + xs.map(tplRowHTML).join('') : '' }).join('');
  }
  return `<div class="cap">${narrowed(k) ? 'Найдено' : S.own ? 'Свои' : 'Все'} · ${L.length}</div>` + L.map(tplRowHTML).join('');
}
function scrList(k){
  const C = LV[k], S = ST[k], all = k === 'ex' ? exLive() : tplLive(C.lvl), ownN = all.filter(x => x.own).length, on = filtersOn(k);
  return nav(C.t, backBtn('#/more'), nb('b-new', I.plus, C.add, `data-k="${k}"`))
    + `<div class="utabs" role="tablist">${[[false, 'Все', all.length], [true, 'Свои', ownN]].map(([v, t, n]) =>
        `<button role="tab" aria-selected="${S.own === v}" class="${S.own === v ? 'on' : ''}" data-act="b-own" data-k="${k}" data-v="${v ? 1 : ''}">${t}<s>${n}</s></button>`).join('')}</div>
    <main class="scr bx">
      <div class="srow"><label class="search">${I.search}<input id="bq" type="search" value="${h(S.q)}" placeholder="${C.ph}" aria-label="${C.ph}" enterkeyhint="search" autocomplete="off"></label>
        <button class="nb${on ? ' on' : ''}" data-act="b-filter" data-k="${k}" aria-label="Фильтр и порядок${on ? ' — включены' : ''}">${I.filter}</button></div>
      <div id="bFsum">${fsumHTML(k)}</div>
      <div id="bList" data-k="${k}">${listHTML(k)}</div>
    </main>` + T.tabbar('more');
}
/* фильтр и порядок — шторкой; меняется на месте, список под шторкой перерисовывается */
function filterBody(k){
  const S = ST[k]; let out = '';
  const pool = k === 'ex' ? exLive().filter(e => !S.own || e.own) : null;
  if(k === 'ex'){
    out += `<div class="cap">Группа мышц</div>` + GROUPS.map(g => { const n = g === 'Все' ? pool.length : pool.filter(e => e.g === g).length;
      return n || g === S.g ? optR('b-f', S.g === g, g === 'Все' ? 'Все группы' : g, `data-k="ex" data-f="g" data-v="${h(g)}"`, n) : '' }).join('');
    out += `<div class="cap">Оснащение</div>` + ['', ...EQUIP].map(q => { const n = q ? pool.filter(e => e.eq === q).length : pool.length;
      return n || q === S.eq ? optR('b-f', S.eq === q, q ? (q === '—' ? 'Без оснащения' : q) : 'Любое', `data-k="ex" data-f="eq" data-v="${h(q)}"`, n) : '' }).join('');
  }
  if(k === 'blocks'){
    const pb = tplLive('блок').filter(t => !S.own || t.own);
    out += `<div class="cap">Папка</div>` + ['Все', ...TPL_FOLDERS].map(f => optR('b-f', S.folder === f, f === 'Все' ? 'Все папки' : f, `data-k="blocks" data-f="folder" data-v="${h(f)}"`, f === 'Все' ? pb.length : pb.filter(t => t.folder === f).length)).join('');
    out += `<div class="cap">Тип блока</div>` + [['all', 'Все типы'], ...BLOCK_TYPES.map(t => [t.k || 'none', t.k ? t.n : 'Без типа'])].map(([v, n]) =>
      optR('b-f', S.type === v, cap1(n), `data-k="blocks" data-f="type" data-v="${v}"`, v === 'all' ? pb.length : pb.filter(t => (t.kind || 'none') === v).length)).join('');
  }
  out += `<div class="cap">Порядок</div>` + SORTS[k].map(([v, n]) => optR('b-f', S.sort === v, n, `data-k="${k}" data-f="sort" data-v="${v}"`)).join('');
  return out;
}
const filterFoot = k => { const n = k === 'ex' ? exList().length : tplList(k).length;
  return `<div class="sh-f row2"><button class="btn o" data-act="b-f-reset" data-k="${k}">Сбросить</button><button class="btn" data-act="close-sheet">${n ? 'Показать · ' + n : 'Ничего не найдено'}</button></div>` };
function sheetFilter(k){
  const ov = sheet({id:'bfilter', title:'Фильтр и порядок', sub:LV[k].t, body:filterBody(k), foot:`<div id="bfFoot">${filterFoot(k)}</div>`});
  if(k !== 'workouts' && k !== 'programs') ov.classList.add('tall');
  ov.dataset.k = k;
}
function refreshList(k){
  const el = document.getElementById('bList'); if(!el) return;
  el.innerHTML = listHTML(k); const fs = document.getElementById('bFsum'); if(fs) fs.innerHTML = fsumHTML(k);
  const fb = document.querySelector('.srow [data-act="b-filter"]'); if(fb){ const on = filtersOn(k); fb.classList.toggle('on', on); fb.setAttribute('aria-label', 'Фильтр и порядок' + (on ? ' — включены' : '')) }
  bindMore();
}
function refreshFilter(k){
  const ov = document.querySelector('.ov[data-sheet="bfilter"]'); if(!ov) return;
  const b = ov.querySelector('.sh-b'), y = b.scrollTop; b.innerHTML = filterBody(k); b.scrollTop = y;
  ov.querySelector('#bfFoot').innerHTML = filterFoot(k);
}
/* дорисовать упражнения при прокрутке; кнопка «Показать ещё» — то же без жеста */
let IO = null;
function moreRows(){
  const S = ST.ex, box = document.querySelector('#bList .bx-rows'); if(!box) return;
  const from = box.children.length; S.n = from + CH;
  box.insertAdjacentHTML('beforeend', LAST.slice(from, S.n).map(exRowHTML).join(''));
  if(S.n >= LAST.length){ const m = document.getElementById('bxMore'); if(m) m.remove(); if(IO){ IO.disconnect(); IO = null } }
}
function bindMore(){
  if(IO){ IO.disconnect(); IO = null }
  const m = document.getElementById('bxMore'); if(!m || !('IntersectionObserver' in window)) return;
  IO = new IntersectionObserver(es => { if(es.some(e => e.isIntersecting)) moreRows() }, {rootMargin:'800px 0px'});
  IO.observe(m);
}

/* ═══════════ ОБЩЕЕ ДЛЯ ЭКРАНОВ ЭЛЕМЕНТОВ ═══════════ */
/* строка «подпись — значение»: своё нажимается и правится в шторке */
function kv(label, value, act, extra = ''){
  const v = value === '' || value == null ? '<b class="none">не указано</b>' : `<b>${value}</b>`;
  const inner = `<span class="t"><s>${h(label)}</s>${v}</span>`;
  return act ? `<button class="lrow ci bx-kv" data-act="${act}" ${extra}>${inner}${chev}</button>` : `<div class="lrow ci bx-kv">${inner}</div>`;
}
const note = (b, s) => `<div class="bx-note" role="note"><b>${b}</b><s>${s}</s></div>`;
const hint = s => `<p class="bx-hint">${s}</p>`;
function notFound(k){
  return nav(LV[k].one, backBtn('#/more/' + k)) + `<main class="scr"><div class="empty"><b>Нет в базе</b>Его удалили или адрес неверный<div style="margin-top:12px"><a class="btn s o" href="#/more/${k}">К списку «${LV[k].t}»</a></div></div></main>` + T.tabbar('more');
}
/* шторка с полем: текст одной строкой, числом или абзацем; «Готово» — записать */
function sheetField({title, sub = '', value = '', multi = false, num = false, ph = '', done}){
  const body = `<div class="sh-p">${multi ? `<textarea class="note bx-ta" id="bxF" rows="6" placeholder="${h(ph)}" aria-label="${h(title)}">${h(value)}</textarea>`
    : `<label class="field" style="margin:0"><input id="bxF" ${num ? 'inputmode="numeric" type="number" min="1" max="365"' : 'type="text"'} value="${h(value)}" placeholder="${h(ph)}" aria-label="${h(title)}" enterkeyhint="done" autocomplete="off"></label>`}</div>`;
  const ov = sheet({id:'bxfield', title, sub, body, foot:`<div class="sh-f"><button class="btn" data-act="bx-field-ok">Готово</button></div>`});
  ov._done = done;
  const inp = ov.querySelector('#bxF');
  if(!multi) inp.addEventListener('keydown', e => { if(e.key === 'Enter'){ e.preventDefault(); ov.querySelector('[data-act="bx-field-ok"]').click() } });
  setTimeout(() => { inp.focus(); try{ inp.setSelectionRange(inp.value.length, inp.value.length) }catch(_){} }, 260);
  return ov;
}
const confirmDel = (title, sub, act, attrs) => sheet({id:'bxdel', title, sub, body:`<div class="sh-p ed-ask">
    <button class="btn rm" data-act="${act}" ${attrs}>Удалить</button><button class="btn o" data-act="close-sheet">Отмена</button></div>`});
/* «Добавить клиенту» (готовая тренировка) и «В тренировку» (блок, упражнение): кому →
   какой день (календарь клиента; выбран день после последней тренировки) → редактор
   этого дня, элемент уже в нём. Готовая тренировка на занятый день — «Добавить к ней»
   или «Заменить»; блок и упражнение просто добавляются. Как окно кабинета (assets/assign.js). */
let TO = null;
function toClient(item, title){
  if(!window.TED || !window.TED.queue){ say('Редактор тренировки не загружен'); return }
  const t = item.tpl && tplById(item.tpl), isW = !!t && t.lvl === 'тренировка';
  T.pick('bxto', (isW ? 'Добавить клиенту' : 'В тренировку') + ' · ' + title, wid => {
    const w = who(wid); if(!w) return;
    T.sheetDate(w, progAssignStart(wid), d => {
      TO = {item, wid, d};
      const busy = subjDayAt(wid, d);
      if(!busy || !isW) return toOpen('add');
      sheet({id:'bxbusy', title:'День занят', sub:w.n + ' · ' + T.dayLong(d), body:`<p class="bx-p" style="padding-top:12px">Уже стоит «${h(busy)}». Добавить «${h(title)}» к ней или поставить вместо неё?</p>
        <div class="ed-acts">${optA('to-mode', I.plus, 'Добавить к ней', 'data-m="add"')}${optA('to-mode', IC.swap, 'Заменить', 'data-m="replace"')}</div>`});
    }, 'Какой день');
  });
}
function toOpen(mode){ if(!TO) return; const {item, wid, d} = TO; TO = null; window.TED.queue({...item, mode}); go(`#/edit/${wid}/${d}`) }

/* ═══════════ УПРАЖНЕНИЕ (EX-1, EX-2, EX-3) ═══════════ */
const newEx = () => ({ru:'', en:'', g:'', eq:'—', u:['кг', 'повт'], pm:null, mus:'', mus2:'', steps:[], tech:''});
let STEPS_LOADING = false;
/* шаги техники общей базы — отдельный файл на мегабайт: грузим, когда открыли упражнение */
function needSteps(){
  if(typeof EXDB_STEPS !== 'undefined' || STEPS_LOADING) return;
  STEPS_LOADING = true;
  const s = document.createElement('script'); s.src = '../assets/exdb-steps.js';
  s.onload = () => { if(CUR && CUR.k === 'ex') T.repaint() };
  s.onerror = () => { STEPS_LOADING = false };
  document.head.append(s);
}
const relRow = x => `<a class="row bx-r sm" href="#/more/ex/${x.id}">${thumb(x)}<span class="t"><b>${h(x.ru)}</b><s>${h(x.eq === '—' ? 'без оснащения' : x.eq)}</s></span>${chev}</a>`;
function relHTML(key, title, sub, list){
  if(!list.length) return '';
  const all = XS.more[key], shown = all ? list : list.slice(0, 3);
  return `<section class="sec p0"><div class="cap">${title} · ${list.length}</div><p class="bx-cap-s">${sub}</p>${shown.map(relRow).join('')}
    ${list.length > 3 ? `<button class="lrow bx-all" data-act="x-rel" data-k="${key}" aria-expanded="${!!all}">${all ? 'Свернуть' : 'Показать все · ' + list.length}</button>` : ''}</section>`;
}
function scrEx(id){
  const isNew = id === 'new';
  const E = isNew ? null : byId(id);
  if(!isNew && (!E || E.del)) return notFound('ex');
  if(isNew && !XD) XD = newEx();
  const x = E || XD, own = !E || !!E.own, d = E ? edbOf(E) : null;
  if(d) needSteps();
  const steps = d ? d.instructions : (x.steps || []), tech = E ? (TECH[E.id] || '') : XD.tech;
  const uses = E ? usesOf('упражнение', E.id) : [];
  const tags = [own ? '<span class="pill ok">своё</span>' : '<span class="pill gray">общая база</span>', x.g && x.g !== 'Без группы' ? `<span class="pill gray">${h(x.g)}</span>` : '', x.eq && x.eq !== '—' ? `<span class="pill gray">${h(x.eq)}</span>` : ''].join('');
  const L = isNew ? `<button class="nb t" data-act="back" data-to="#/more/ex">Отмена</button>` : backBtn('#/more/ex');
  const R = isNew ? `<button class="nb t b" data-act="x-add" ${x.ru.trim() ? '' : 'disabled aria-disabled="true"'}>Добавить</button>` : E && own ? nb('x-menu', I.more, 'Действия с упражнением') : '';
  return nav(isNew ? 'Новое упражнение' : 'Упражнение', L, R) + `<main class="scr gapbg bx">
    <section class="sec bx-hero">
      ${x.gif ? `<div class="bx-media"><img src="${h(x.gif)}" alt="${h(x.ru)} — демонстрация"></div>` : ''}
      <div class="bx-id">${x.gif ? '' : thumb(x, ' l')}<div class="bx-idt"><h2>${h(x.ru || 'Без названия')}</h2>${x.en ? `<p lang="en">${h(x.en)}</p>` : ''}<div class="bx-tags">${tags}</div></div></div>
      ${E ? `<button class="btn bx-go" data-act="x-to" data-id="${E.id}">${I.plus}В тренировку</button>` : ''}
    </section>
    ${!own ? note('Упражнение из общей базы', 'Не меняется — только смотреть. Менять можно свои упражнения: «+» в списке упражнений.') : ''}
    ${isNew ? note('Новое упражнение', 'Появится в вашей базе по «Добавить». Нужно только название, остальное — по желанию.') : ''}
    <section class="sec p0"><div class="cap">Основное</div>
      ${own ? kv('Название', h(x.ru), 'x-f', 'data-f="ru"') : ''}
      ${kv('Название по-английски', h(x.en || ''), own ? 'x-f' : '', 'data-f="en"')}
      ${kv('Группа', h(x.g && x.g !== 'Без группы' ? x.g : (own ? '' : '—')), own ? 'x-f' : '', 'data-f="g"')}
      ${kv('Оснащение', h(x.eq === '—' ? 'без оснащения' : x.eq || ''), own ? 'x-f' : '', 'data-f="eq"')}
      ${own ? kv('Целевые мышцы', h(x.mus || ''), 'x-f', 'data-f="mus"') + kv('Вспомогательные мышцы', h(x.mus2 || ''), 'x-f', 'data-f="mus2"')
        : d ? kv('Часть тела', h(d.bodyPart)) + kv('Целевая мышца', h(d.target)) + (d.secondary.length ? kv('Вспомогательные', h(d.secondary.join(', '))) : '') : ''}
    </section>
    <section class="sec p0"><div class="cap">Показатели</div>
      ${kv('Чем мерить', h((x.u || []).join(', ')), own ? 'x-f' : '', 'data-f="u"')}
      ${kv('Расчёт от рекорда', h(x.pm ? 'от 1ПМ · ' + (PMNAMES[x.pm] || x.pm) : 'нет'), own ? 'x-f' : '', 'data-f="pm"')}
      ${hint('В этих единицах вы задаёте нагрузку в тренировке, а клиент записывает результат. С расчётом от рекорда процент в тренировке считается от 1ПМ этого движения.')}
    </section>
    <section class="sec p0"><div class="cap">Техника</div>
      ${steps.length ? `<ol class="bx-steps">${steps.map(s => `<li>${h(s)}</li>`).join('')}</ol>`
        : d && typeof EXDB_STEPS === 'undefined' ? '<p class="bx-p muted">Загружаю шаги…</p>' : !own ? '<p class="bx-p muted">В базе нет описания техники.</p>' : ''}
      ${own ? `<button class="lrow bx-all" data-act="x-f" data-f="steps">${steps.length ? 'Изменить шаги' : I.plus + 'Добавить шаги техники'}</button>` : ''}
      ${hint('Клиент видит шаги в тренировке, по кнопке техники у упражнения.')}
    </section>
    ${own ? `<section class="sec p0"><div class="cap">Акценты тренера</div>
      ${tech ? `<p class="bx-p">${h(tech)}</p>` : ''}
      <button class="lrow bx-all" data-act="x-f" data-f="tech">${tech ? 'Изменить акценты' : I.plus + 'Добавить акценты'}</button>
      ${hint('На что смотреть в технике: ваши подсказки поверх шагов. Клиент видит их над шагами техники.')}</section>` : ''}
    ${d ? relHTML('sim', 'Похожие', 'Та же мышца и оснащение', d.similar) + relHTML('sub', 'Замены', 'Та же мышца, другое оснащение', d.subs) : ''}
    ${E ? `<section class="sec p0"><div class="cap">Где используется · блоки базы</div>
      ${uses.length ? uses.map(tplRowHTML).join('') : '<p class="bx-p muted">Пока нет ни в одном блоке базы.</p>'}</section>` : ''}
    ${E ? `<section class="sec p0"><div class="cap">Об упражнении</div>
      ${kv('Источник', own ? 'ваша база' : 'общая база сервиса')}${kv('В блоках', String(uses.length))}${d ? kv('ID в базе', h(d.id)) : ''}</section>` : ''}
  </main>` + (isNew ? '' : T.tabbar('more'));      /* создание — модально, без нижней панели */
}
/* правка поля: своё — сразу в базу (как в кабинете), новое — в черновик до «Добавить» */
function exCur(){ return CUR && CUR.k === 'ex' ? (CUR.id === 'new' ? null : byId(CUR.id)) : null }
function setEx(k, v){
  const E = exCur();
  if(E){ if(!E.own) return; if(k === 'tech') techPut(E.id, v); else exPut(E, {[k]: v}); say('Сохранено') }
  else if(XD) XD[k] = v;
  T.repaint();
}
const EXF = {ru:'Название', en:'Название по-английски', mus:'Целевые мышцы', mus2:'Вспомогательные мышцы'};
const EXPH = {ru:'Например: Присед со штангой', en:'Например: Back Squat', mus:'Например: квадрицепсы, ягодичные', mus2:'Например: мышцы кора'};
function sheetExField(f){
  const E = exCur(), x = E || XD; if(!x || (E && !E.own)) return;
  if(EXF[f]) return sheetField({title:EXF[f], value:x[f] || '', ph:EXPH[f], done: v => {
    if(f === 'ru' && !v){ say('Без названия упражнение не сохранить'); return false }
    setEx(f, f === 'ru' ? cap1(v) : v) }});
  if(f === 'steps') return sheetField({title:'Шаги техники', sub:'Каждый шаг — с новой строки', value:(x.steps || []).join('\n'), multi:true, ph:'Стопы на ширине плеч\nСпина нейтральна\nКолени — по направлению носков',
    done: v => setEx('steps', v.split('\n').map(s => s.trim()).filter(Boolean))});
  if(f === 'tech') return sheetField({title:'Акценты тренера', sub:'Клиент видит их над шагами техники', value:E ? (TECH[E.id] || '') : XD.tech, multi:true, ph:'На что смотреть в технике: ваши подсказки поверх шагов',
    done: v => setEx('tech', v)});
  let body = '', title = '', sub = '';
  if(f === 'g'){ title = 'Группа'; body = [['', 'Без группы'], ...GROUPS.filter(g => g !== 'Все').map(g => [g, g])].map(([v, n]) => optR('x-set', (x.g === 'Без группы' ? '' : x.g || '') === v, n, `data-f="g" data-v="${h(v)}"`)).join('') }
  if(f === 'eq'){ title = 'Оснащение'; body = [['—', 'Без оснащения'], ...EQUIP.filter(q => q !== '—').map(q => [q, q])].map(([v, n]) => optR('x-set', (x.eq || '—') === v, n, `data-f="eq" data-v="${h(v)}"`)).join('') }
  if(f === 'pm'){ title = 'Расчёт от рекорда'; sub = 'Процент в тренировке считается от 1ПМ движения';
    body = [['', 'Нет'], ...Object.entries(PMNAMES)].map(([v, n]) => optR('x-set', (x.pm || '') === v, n, `data-f="pm" data-v="${v}"`)).join('') }
  if(f === 'u'){ title = 'Чем мерить'; sub = 'Нужен хотя бы один показатель';
    body = EX_UNITS.map(u => optC('x-unit', (x.u || []).includes(u), u, `data-v="${h(u)}"`)).join('') }
  const ov = sheet({id:'bxpick', title, sub, body:`<div class="ed-opts">${body}</div>`, foot: f === 'u' ? `<div class="sh-f"><button class="btn" data-act="close-sheet">Готово</button></div>` : ''});
  if(f === 'eq') ov.classList.add('tall');
}

/* ═══════════ БЛОК И ТРЕНИРОВКА (TPL-1, TPL-2) ═══════════ */
/* Состав — как в просмотре дня календаря (app.js: pvBody): схема, упражнение, нагрузка */
function lineLoad(it){ return it.pct != null || it.val ? loadText(it) : '' }
function linePart(it){ const e = it.exId ? byId(it.exId) : null, name = e ? e.ru : String(it.raw || '');
  if(!e) return h(name); if(it.txt) return h(name + ' — ' + it.txt);
  return h([it.scheme, name, lineLoad(it)].filter(Boolean).join(' ')) }
function lineChain(it){ const prm = [lineLoad(it), chainScheme(it)].filter(Boolean).join(' — ');
  return h(chainNames(it) + (prm ? ': ' + prm : '')) }
const lineHTML = it => `<div class="xl${it.sub ? ' in' : ''}">${it.chain ? lineChain(it) : linePart(it)}</div>`;
function compHTML(b){
  const seg = [], fmt = b.fmt && typeof b.fmt === 'object' ? b.fmt : null;
  if(fmt) seg.push(`<div class="xl fm">${h(fmtLabel(fmt) + ' — ' + fmtDesc(fmt))}</div>`);
  if(isTextBlock(b)) seg.push(textLines(b.text).map(l => `<div class="xl">${h(l)}</div>`).join(''));
  else {
    let run = '', k = 0; const its = b.items || [];
    const flush = () => { if(run){ seg.push(run); run = '' } };
    while(k < its.length){
      if(its[k].ss){ const hd = its[k], j = ssEnd(its, k), mem = its.slice(k + 1, j).filter(itemHas);
        if(mem.length){ flush(); seg.push(`<div class="xl ss">Сет · ${pl(+hd.rounds || 1, 'круг', 'круга', 'кругов')}${hd.rest ? ', отдых ' + h(hd.rest) : ''}</div>` + mem.map(lineHTML).join('')) }
        k = j; continue }
      if(itemHas(its[k])) run += lineHTML(its[k]);
      k++;
    }
    flush();
  }
  return seg.length ? seg.map(x => `<div class="pvs">${x}</div>`).join('') : '<p class="bx-p muted" style="padding:0">Пусто</p>';
}
function scrTpl(k, id){
  const C = LV[k], t = tplById(id);
  if(!t || t.del || t.lvl !== C.lvl) return notFound(k);
  const isB = t.lvl === 'блок', own = !!t.own, s = tplStats(t), uses = usesOf(t.lvl, t.id);
  const sub = isB ? [blockTypeLabel(t), isTextBlock(t) ? pl(s.n, 'строка', 'строки', 'строк') + ' текстом' : pl(s.n, 'упражнение', 'упражнения', 'упражнений')]
    : [pl(s.blocks, 'блок', 'блока', 'блоков'), pl(s.n, 'упражнение', 'упражнения', 'упражнений')];
  let comp;
  if(isB){ const b = tplToBlock(t); comp = `<div class="bx-comp">${compHTML(b)}</div>` }
  else comp = (t.blocks || []).map(tplById).filter(Boolean).map(bt => { const b = tplToBlock(bt), nm = bt.title || blockName(b) || 'Блок', lab = blockTypeLabel(bt);
    const head = `<span class="t"><b>${h(nm)}</b>${lab && lab !== nm ? `<s>${h(lab)}</s>` : ''}</span>`;
    return `<div class="bx-blk">${!bt.inline && !bt.del ? `<a class="bx-bh" href="${hrefOf(bt)}" aria-label="Блок «${h(nm)}» в базе">${head}${chev}</a>` : `<div class="bx-bh">${head}</div>`}
      <div class="bx-comp">${compHTML(b)}</div></div>` }).join('') || '<p class="bx-p muted">В тренировке пока нет блоков.</p>';
  const usedIn = isB ? 'В тренировках базы' : 'В программах базы';
  return nav(C.one, backBtn('#/more/' + k), nb('t-menu', I.more, isB ? 'Действия с блоком' : 'Действия с тренировкой', `data-id="${t.id}"`)) + `<main class="scr gapbg bx">
    <section class="sec bx-hero">
      <div class="bx-idt"><h2>${h(t.title)}</h2><p>${h(sub.filter(Boolean).join(' · '))}</p>
        <div class="bx-tags">${own ? '<span class="pill ok">своё</span>' : '<span class="pill gray">общая база</span>'}${isB && t.folder ? `<span class="pill gray">${h(t.folder)}</span>` : ''}</div></div>
      <div class="bx-acts"><button class="btn s" data-act="t-to" data-id="${t.id}">${I.plus}${isB ? 'В тренировку' : 'Добавить клиенту'}</button>
        ${own ? `<button class="btn s o" data-act="t-edit" data-id="${t.id}">${I.edit}Изменить</button>` : `<button class="btn s o" data-act="t-own" data-id="${t.id}">${I.copy}Сохранить как своё</button>`}</div>
    </section>
    ${!own ? note((isB ? 'Блок' : 'Тренировка') + ' из общей базы', 'Правится только своё. «Сохранить как своё» — появится ваша копия, её и правьте.') : ''}
    <section class="sec p0"><div class="cap">Состав</div>${comp}</section>
    <section class="sec p0"><div class="cap">${usedIn} · ${uses.length}</div>
      ${uses.length ? uses.map(tplRowHTML).join('') : `<p class="bx-p muted">Нигде — ${isB ? 'блок не стоит ни в одной тренировке базы' : 'тренировка не стоит ни в одной программе базы'}.</p>`}
      ${hint(isB ? 'Правка блока не меняет тренировки, где он уже стоит у клиентов в календаре.' : 'Правка не меняет тренировки, которые уже стоят у клиентов в календаре.')}</section>
    <section class="sec p0"><div class="cap">${isB ? 'О блоке' : 'О тренировке'}</div>
      ${isB ? kv('Папка', h(t.folder || ''), own ? 't-folder' : '', `data-id="${t.id}"`) : ''}
      ${kv('Использован' + (isB ? '' : 'а'), t.used ? t.used + '×' : '—')}
      ${kv('Источник', own ? 'ваша база' : 'общая база сервиса')}
      ${t.at ? kv('Создан' + (isB ? '' : 'а'), dLong(t.at)) : ''}
      ${own ? hint('Правки сохраняются в базе — их видно и в кабинете на компьютере.') : ''}</section>
  </main>` + T.tabbar('more');
}
/* редактор тренировки в режиме шаблона — поверх экрана; запись в базу — кнопкой «Сохранить»
   (тост даёт редактор); после выхода — экран нового элемента или перерисовка текущего */
function editTpl(t, lvl, opts = {}){
  if(!window.TED || !window.TED.openTpl){ say('Редактор тренировки не загружен'); return }
  window.TED.openTpl(t, lvl, document.getElementById('layer'), Object.assign({done: saved => {
    if(saved && !t) go(hrefOf(saved)); else T.repaint();
  }}, opts));
}

/* ═══════════ ПРОГРАММА (TPL-2) ═══════════
   Цикл дней (тренировка из базы или отдых) повторяется, пока не выйдет срок.
   Недели в модели нет: ритм задаёт тренер, длина цикла любая. */
const newProg = () => ({lvl:'программа', title:'', goal:'', days:28, seq:[]});
function progCur(){ return CUR && CUR.k === 'programs' && CUR.id !== 'new' ? tplById(CUR.id) : null }
function pSave(patch, msg){
  const P = progCur();
  if(P){ if(!P.own) return; Object.assign(P, patch); tplPut(P); if(msg !== false) say(msg || 'Сохранено') }
  else if(PD) Object.assign(PD, patch);
  T.repaint();
}
const WO = () => tplLive('тренировка');
function scrProg(id){
  const isNew = id === 'new';
  const P = isNew ? null : tplById(id);
  if(!isNew && (!P || P.del || P.lvl !== 'программа')) return notFound('programs');
  if(isNew && !PD) PD = newProg();
  const x = P || PD, own = !P || !!P.own, seq = x.seq || [], cyc = seq.length;
  if(!own || cyc < 2) PRE = false;
  const L = isNew ? `<button class="nb t" data-act="back" data-to="#/more/programs">Отмена</button>` : backBtn('#/more/programs');
  const R = isNew ? `<button class="nb t b" data-act="p-add" ${x.title.trim() ? '' : 'disabled aria-disabled="true"'}>Добавить</button>` : nb('p-menu', I.more, 'Действия с программой');
  const day = (wid, k) => {
    const w = wid && tplById(wid), st = w ? tplStats(w) : null;
    const lab = `День ${k + 1}: ${w ? w.title : 'отдых'}`;
    const inner = `<span class="bx-dn" aria-hidden="true">${k + 1}</span><span class="t"><b class="${w ? '' : 'rest'}">${w ? h(w.title) : 'Отдых'}</b>${w ? `<s>${pl(st.blocks, 'блок', 'блока', 'блоков')} · ${st.n} упр.${w.del ? ' · удалена из базы' : ''}</s>` : ''}</span>`;
    if(PRE) return `<div class="row bx-d" data-k="${k}">${inner}<span class="hd" data-k="${k}" role="button" aria-label="Перетащить: ${h(lab)}">${IC.grip}</span></div>`;
    if(own) return `<button class="row bx-d" data-act="p-day" data-k="${k}" aria-label="${h(lab)}">${inner}${chev}</button>`;
    return w && !w.del ? `<a class="row bx-d" href="${hrefOf(w)}" aria-label="${h(lab)}">${inner}${chev}</a>` : `<div class="row bx-d">${inner}</div>`;
  };
  return nav(isNew ? 'Новая программа' : 'Программа', L, R) + `<main class="scr gapbg bx${PRE ? ' with-bar' : ''}">
    <section class="sec bx-hero">
      <div class="bx-idt">${own ? `<button class="bx-tt" data-act="p-f" data-f="title" aria-label="Название: ${h(x.title || 'не указано')} — изменить"><h2 class="${x.title ? '' : 'ph'}">${h(x.title || 'Название программы')}</h2>${I.edit}</button>` : `<h2>${h(x.title)}</h2>`}
        <p>${h(progCycText(x))}${x.at ? ' · создана ' + dShort(x.at) : ''}</p>
        <div class="bx-tags">${own ? '<span class="pill ok">своё</span>' : '<span class="pill gray">общая база</span>'}</div></div>
      ${P ? `<div class="bx-acts"><button class="btn s" data-act="p-assign">${I.plus}Назначить клиенту</button>${own ? '' : `<button class="btn s o" data-act="p-own">${I.copy}Сохранить как своё</button>`}</div>` : ''}
    </section>
    ${!own ? note('Программа из общей базы', 'Правится только своё. «Сохранить как своё» — появится ваша копия, её и правьте.') : ''}
    ${isNew ? note('Новая программа', 'Появится в вашей базе по «Добавить». Нужно только название — нажмите на него вверху.') : ''}
    <section class="sec p0"><div class="cap">Основное</div>
      ${kv('Цель', h(x.goal || (own ? '' : '—')), own ? 'p-f' : '', 'data-f="goal"')}
      ${kv('Длительность', pl(+x.days || 0, 'день', 'дня', 'дней'), own ? 'p-f' : '', 'data-f="days"')}
    </section>
    <section class="sec p0"><div class="bx-h"><span class="cap">Цикл</span>${own && cyc > 1 ? `<button class="lnk" data-act="p-reorder">${PRE ? 'Готово' : 'Порядок'}</button>` : ''}</div>
      ${cyc ? `<div class="bx-cyc${PRE ? ' re' : ''}" id="bxCyc">${seq.map(day).join('')}</div>` : '<p class="bx-p muted">В цикле пока нет дней. Добавьте тренировку или день отдыха.</p>'}
      ${own && !PRE ? `<div class="bx-add"><button class="btn s o" data-act="p-addwo">${I.plus}Тренировка</button><button class="btn s o" data-act="p-addrest">${I.plus}Отдых</button></div>` : ''}
      ${hint(PRE ? 'Перетащите день за ≡ — порядок дней и есть ритм программы. То же без жеста — «Выше» и «Ниже» в меню дня.'
        : 'Цикл — дни подряд: тренировка из базы или отдых. Кончился цикл — начинается заново, пока не выйдет срок программы.' + (own && P ? ' Правка не меняет календари, где программа уже назначена.' : ''))}
    </section>
  </main>` + (PRE ? `<div class="pbar"><button class="btn" data-act="p-reorder">Готово</button></div>` : isNew ? '' : T.tabbar('more'));
}
function sheetProgField(f){
  const x = progCur() || PD; if(!x) return;
  if(f === 'title') return sheetField({title:'Название программы', value:x.title, ph:'Например: Сила + кроссфит', done: v => {
    if(!v){ say('Без названия программа в базе не живёт'); return false } pSave({title:v}) }});
  if(f === 'goal') return sheetField({title:'Цель', sub:'Чего добиваемся за программу', value:x.goal || '', multi:true, ph:'Например: рост силовых при сохранении метконовой формы', done: v => pSave({goal:v}) });
  if(f === 'days'){
    const ov = sheetField({title:'Длительность, дней', sub:'От 1 до 365 — цикл повторяется до последнего дня', value:String(x.days || 28), num:true, done: v => {
      const n = Math.max(1, Math.min(365, parseInt(v, 10) || 0)); if(!parseInt(v, 10)){ say('Укажите число дней'); return false } pSave({days:n}) }});
    ov.querySelector('.sh-p').insertAdjacentHTML('beforeend', `<div class="chips wrap" style="padding:12px 0 0">${[28, 42, 56, 84].map(n => `<button class="chip" data-act="p-days" data-v="${n}">${pl(n, 'день', 'дня', 'дней')}</button>`).join('')}</div>`);
  }
}
/* «Назначить клиенту» (CON-9): кому → шторка с датой старта, итогом, занятыми днями
   (пропустить или заменить) и «Клиент видит сразу» → цикл встаёт в календарь.
   Запись — progAssign в data.js, та же, что у окна кабинета (assets/assign.js). */
let AS = null;
function assignProg(t){ T.pick('bxas', 'Назначить · ' + t.title, wid => { AS = {tid:t.id, wid, start:progAssignStart(wid), replace:false, pub:true}; sheetAssign() }) }
function sheetAssign(){
  const t = AS && tplById(AS.tid), w = AS && who(AS.wid); if(!t || !w) return;
  const G = isGrp(AS.wid) ? grp(AS.wid) : null, rows = progLayout(t, AS.wid, AS.start), busy = rows.filter(r => r.busy);
  const put = rows.filter(r => AS.replace || !r.busy), n = put.length, seen = G ? 'Участники видят сразу' : 'Клиент видит сразу';
  const mem = G && rows.length ? groupConflicts(G, rows.map(r => r.date)).length : 0, rb = rows.length ? progRestBusy(t, AS.wid, AS.start) : 0;
  const body = `${kv('Кому', (G ? 'Группа · ' : '') + h(w.n), 'as-who')}${kv('Начать с', h(T.dayLong(AS.start)), 'as-date')}
    ${!rows.length ? '<p class="bx-p muted bx-as-sum">В цикле программы нет тренировок — назначать нечего.</p>'
      : `<p class="bx-p bx-as-sum">Встанет <b>${pl(n, 'тренировка', 'тренировки', 'тренировок')}</b>${n ? `: с ${dShort(put[0].date)} по ${dShort(put[n - 1].date)}` : ''}. Дни отдыха остаются свободными.</p>`}
    ${busy.length ? `<div class="cap">${G ? 'У группы уже' : 'Уже'} ${plural3(busy.length, 'занят', 'заняты', 'заняты')} ${pl(busy.length, 'день', 'дня', 'дней')}</div>
      <div class="ed-opts" role="radiogroup" aria-label="Занятые дни">${optR('as-rep', !AS.replace, 'Пропустить — оставить их тренировки', 'data-v="0"')}${optR('as-rep', AS.replace, 'Заменить тренировками программы', 'data-v="1"')}</div>
      ${hint(busy.slice(0, 3).map(r => dShort(r.date) + ' — «' + h(r.busy) + '»').join(' · ') + (busy.length > 3 ? ` и ещё ${busy.length - 3}` : ''))}` : ''}
    ${rb ? hint(`В ${pl(rb, 'день', 'дня', 'дней')} отдыха программы уже стоят тренировки — они останутся.`) : ''}
    ${mem ? hint(`У участников в эти дни ${mem} ${plural3(mem, 'своя тренировка', 'своих тренировки', 'своих тренировок')} — ${AS.replace ? 'заменятся тренировками группы' : 'останутся у них'}.`) : ''}
    ${n ? `<div class="lrow bx-sw"><span class="t"><b>${seen}</b><s>${AS.pub ? 'Тренировки встанут опубликованными' : 'Встанут черновиками — опубликуете сами'}</s></span>
      <button class="tg${AS.pub ? ' on' : ''}" role="switch" aria-checked="${AS.pub}" aria-label="${seen}" data-act="as-pub"><i></i></button></div>` : ''}`;
  const foot = `<div class="sh-f"><button class="btn" data-act="as-go" ${n ? '' : 'disabled'}>Назначить</button></div>`;
  /* шторка уже открыта — меняем содержимое на месте, без повторного выезда */
  const ov = document.querySelector('.ov[data-sheet="bxassign"]');
  if(ov){ ov.querySelector('.sh-b').innerHTML = body; ov.querySelector('.sh-f').outerHTML = foot; return }
  sheet({id:'bxassign', title:'Назначить программу', sub:t.title, body, foot});
}
/* меню дня цикла: открыть, заменить, сделать отдыхом, переставить, убрать */
function sheetDay(k){
  const x = progCur() || PD, wid = x.seq[k], w = wid && tplById(wid), n = x.seq.length;
  sheet({id:'bxday', title:'День ' + (k + 1), sub: w ? w.title : 'Отдых', body:`<div class="ed-acts">
    ${w && !w.del ? `<a class="opt" href="${hrefOf(w)}"><span class="oi">${I.clip}</span>Открыть тренировку</a>` : ''}
    ${optA('p-pick', I.list, w ? 'Заменить тренировку' : 'Поставить тренировку', `data-k="${k}"`)}
    ${w ? optA('p-rest', IC.rest, 'Сделать днём отдыха', `data-k="${k}"`) : ''}
    ${k > 0 ? optA('p-mv', IC.up, 'Выше', `data-k="${k}" data-d="-1"`) : ''}
    ${k < n - 1 ? optA('p-mv', IC.dn, 'Ниже', `data-k="${k}" data-d="1"`) : ''}
    ${optA('p-dayrm', IC.trash, 'Убрать день из цикла', `data-k="${k}"`, 'rm')}</div>`});
}
/* выбор тренировки из базы — с поиском; k — день цикла или «add» (новый день в конец) */
function sheetPickWo(k){
  const x = progCur() || PD, cur = k === 'add' ? null : x.seq[+k];
  const opt = w => { const st = tplStats(w), on = w.id === cur;
    return `<button class="opt bx-wopt${on ? ' on' : ''}" data-act="p-pick-w" data-k="${k}" data-id="${w.id}" role="radio" aria-checked="${on}"><span class="box rnd">${I.check}</span>
      <span class="ot"><b>${h(w.title)}</b><s>${pl(st.blocks, 'блок', 'блока', 'блоков')} · ${st.n} упр.${w.own ? '' : ' · общая база'}</s></span></button>` };
  const list = q => { const n = norm(q || ''), L = WO().filter(w => !n || norm(w.title).includes(n)).sort(libSort);
    return L.length ? L.map(opt).join('') : `<div class="empty"><b>Ничего не нашли</b>${WO().length ? 'Измените поиск' : 'В базе пока нет тренировок'}</div>` };
  const ov = sheet({id:'bxwo', title: k === 'add' ? 'Тренировка в цикл' : cur ? 'Заменить тренировку' : 'Тренировка на день ' + (+k + 1),
    sub:'Из вашей базы и общей', body:`<div class="search" style="margin:12px 16px">${I.search}<input type="search" placeholder="Поиск тренировки" aria-label="Поиск тренировки" autocomplete="off"></div><div class="ed-opts bx-wo">${list('')}</div>`});
  ov.classList.add('tall');
  const inp = ov.querySelector('input'), box = ov.querySelector('.bx-wo');
  inp.addEventListener('input', () => { box.innerHTML = list(inp.value) });
}
/* перетаскивание дней цикла в режиме «Порядок» */
let DR = null;
function dragStart(e){
  const hd = e.target.closest('.hd'); if(!hd) return; e.preventDefault();
  const row = hd.closest('.bx-d'), box = row.parentElement, rows = [...box.children];
  DR = {row, box, rows, from: rows.indexOf(row), y0: e.clientY, to: rows.indexOf(row), hgt: row.getBoundingClientRect().height};
  row.classList.add('drag'); try{ hd.setPointerCapture(e.pointerId) }catch(_){}
  addEventListener('pointermove', dragMove); addEventListener('pointerup', dragEnd); addEventListener('pointercancel', dragEnd);
}
function dragMove(e){
  if(!DR) return; const dy = e.clientY - DR.y0; DR.row.style.transform = `translateY(${dy}px)`;
  const to = Math.max(0, Math.min(DR.rows.length - 1, DR.from + Math.round(dy / DR.hgt)));
  if(to === DR.to) return; DR.to = to;
  DR.rows.forEach((r, i) => { if(r === DR.row) return; const sh = DR.from < to ? (i > DR.from && i <= to ? -DR.hgt : 0) : (i < DR.from && i >= to ? DR.hgt : 0); r.style.transform = sh ? `translateY(${sh}px)` : '' });
}
function dragEnd(){
  removeEventListener('pointermove', dragMove); removeEventListener('pointerup', dragEnd); removeEventListener('pointercancel', dragEnd);
  if(!DR) return; const {from, to, rows} = DR; DR = null;
  rows.forEach(r => { r.style.transform = ''; r.classList.remove('drag') });
  if(from === to) return;
  const x = progCur() || PD, seq = [...x.seq], [m] = seq.splice(from, 1); seq.splice(to, 0, m); pSave({seq}, false);
}

/* ═══════════ ДЕЙСТВИЯ ═══════════ */
const acts = {
  /* списки */
  'b-own': b => { const S = ST[b.dataset.k]; S.own = !!b.dataset.v; if(b.dataset.k === 'ex') S.n = CH; S.y = 0; T.repaint() },
  'b-filter': b => sheetFilter(b.dataset.k),
  'b-f': b => { const k = b.dataset.k, S = ST[k]; S[b.dataset.f] = b.dataset.v; if(k === 'ex') S.n = CH; refreshList(k); refreshFilter(k) },
  'b-f-reset': b => { const k = b.dataset.k, S = ST[k]; S.sort = SORT_DEF[k]; if(k === 'ex'){ S.g = 'Все'; S.eq = ''; S.n = CH } if(k === 'blocks'){ S.folder = 'Все'; S.type = 'all' }
    refreshList(k); refreshFilter(k) },
  'b-more': () => moreRows(),
  'b-new': b => { const k = b.dataset.k;
    if(k === 'ex'){ XD = newEx(); go('#/more/ex/new') }
    else if(k === 'programs'){ PD = newProg(); PRE = false; go('#/more/programs/new') }
    else editTpl(null, LV[k].lvl, {folder: k === 'blocks' && ST.blocks.folder !== 'Все' ? ST.blocks.folder : null}) },
  /* шторка с полем */
  'bx-field-ok': b => { const ov = b.closest('.ov'), inp = ov && ov.querySelector('#bxF'); if(!inp) return;
    const r = ov._done ? ov._done(inp.value.trim()) : null; if(r !== false) closeSheet() },
  /* упражнение */
  'x-f': b => sheetExField(b.dataset.f),
  'x-set': b => { closeSheet(); setEx(b.dataset.f, b.dataset.v === '' ? (b.dataset.f === 'g' ? 'Без группы' : null) : b.dataset.v) },
  'x-unit': b => { const E = exCur(), x = E || XD, u = b.dataset.v, cur = x.u || [];
    const next = cur.includes(u) ? cur.filter(v => v !== u) : [...cur, u];
    if(!next.length){ say('Нужен хотя бы один показатель'); return }
    setEx('u', next); b.classList.toggle('on', next.includes(u)); b.setAttribute('aria-checked', next.includes(u)) },
  'x-rel': b => { XS.more[b.dataset.k] = !XS.more[b.dataset.k]; T.repaint() },
  'x-add': () => { if(!XD || !XD.ru.trim()) return;
    const E = addOwnEx(XD); exPut(E, {pm:XD.pm, mus:XD.mus, mus2:XD.mus2, steps:XD.steps});
    if(XD.tech) techPut(E.id, XD.tech);
    XD = null; location.replace('#/more/ex/' + E.id); say('Упражнение добавлено в вашу базу') },
  'x-menu': () => { const E = exCur(); if(!E || !E.own) return;
    sheet({id:'bxmenu', title:E.ru, sub:'Своё упражнение', body:`<div class="ed-acts">${optA('x-to', I.plus, 'В тренировку', `data-id="${E.id}"`)}${optA('x-del', IC.trash, 'Удалить из базы', '', 'rm')}</div>`}) },
  'x-del': () => { const E = exCur(); if(!E) return;
    confirmDel('Удалить упражнение?', `«${E.ru}» уйдёт из вашей базы. В блоках и тренировках, где оно уже стоит, упражнение останется.`, 'x-del-ok', '') },
  'x-del-ok': () => { const E = exCur(); if(!E) return; const n = E.ru; exDrop(E); closeSheet(true); goBack('#/more/ex'); say(`«${n}» удалено из базы`) },
  'x-to': b => { closeSheet(true); const E = byId(b.dataset.id); if(E) toClient({ex:E.id}, E.ru) },
  /* блок и тренировка */
  't-to': b => { const t = tplById(b.dataset.id); if(t){ closeSheet(true); toClient({tpl:t.id}, t.title) } },
  'to-mode': b => { closeSheet(true); toOpen(b.dataset.m) },
  't-edit': b => { const t = tplById(b.dataset.id); if(t && t.own){ closeSheet(true); editTpl(t, t.lvl) } },
  't-own': b => { const t = tplById(b.dataset.id); if(!t) return; closeSheet(true); const c = tplClone(t); go(hrefOf(c)); say('Копия в вашей базе — её и правьте') },
  't-dup': b => { const t = tplById(b.dataset.id); if(!t) return; closeSheet(true); const c = tplClone(t, t.title + ' — копия'); go(hrefOf(c)); say('Копия создана') },
  't-menu': b => { const t = tplById(b.dataset.id); if(!t) return; const isB = t.lvl === 'блок';
    sheet({id:'bxmenu', title:t.title, sub: t.own ? (isB ? 'Свой блок' : 'Своя тренировка') : 'Общая база', body:`<div class="ed-acts">
      ${optA('t-to', I.plus, isB ? 'В тренировку' : 'Добавить клиенту', `data-id="${t.id}"`)}
      ${t.own ? optA('t-edit', I.edit, 'Изменить', `data-id="${t.id}"`) + optA('t-dup', IC.copy, 'Дублировать', `data-id="${t.id}"`) + optA('t-del', IC.trash, 'Удалить из базы', `data-id="${t.id}"`, 'rm')
        : optA('t-own', IC.copy, 'Сохранить как своё', `data-id="${t.id}"`)}</div>`}) },
  't-del': b => { const t = tplById(b.dataset.id); if(!t) return; const isB = t.lvl === 'блок', n = usesOf(t.lvl, t.id).length;
    confirmDel(`Удалить ${isB ? 'блок' : 'тренировку'}?`, `«${t.title}» уйдёт из вашей базы. ${n ? (isB ? 'В тренировках базы' : 'В программах базы') + ', где ' + (isB ? 'он стоит' : 'она стоит') + ' (' + n + '), ' + (isB ? 'блок останется' : 'тренировка останется') + '. ' : ''}Клиентам, у кого ${isB ? 'он уже стоит' : 'она уже стоит'} в календаре, ничего не изменится.`, 't-del-ok', `data-id="${t.id}"`) },
  't-del-ok': b => { const t = tplById(b.dataset.id); if(!t) return; const k = KEY_OF[t.lvl]; tplDrop(t); closeSheet(true); goBack('#/more/' + k); say(`«${t.title}» удалено из базы`) },
  't-folder': b => { const t = tplById(b.dataset.id); if(!t || !t.own) return;
    sheet({id:'bxpick', title:'Папка', sub:t.title, body:`<div class="ed-opts">${TPL_FOLDERS.map(f => optR('t-folder-set', t.folder === f, f, `data-id="${t.id}" data-v="${h(f)}"`)).join('')}</div>`}) },
  't-folder-set': b => { const t = tplById(b.dataset.id); if(!t) return; tplPut({...t, folder:b.dataset.v}); closeSheet(); T.repaint(); say('Папка «' + b.dataset.v + '»') },
  /* программа */
  'p-f': b => sheetProgField(b.dataset.f),
  'p-days': b => { const inp = document.getElementById('bxF'); if(inp){ inp.value = b.dataset.v; inp.focus() } },
  'p-add': () => { if(!PD || !PD.title.trim()) return;
    const P = {...PD, id:freshId('u'), own:true, at:TODAY, used:0}; tplPut(P); PD = null;
    location.replace('#/more/programs/' + P.id); say('Программа добавлена в вашу базу') },
  'p-menu': () => { const P = progCur(); if(!P) return;
    sheet({id:'bxmenu', title:P.title, sub: P.own ? 'Своя программа' : 'Общая база', body:`<div class="ed-acts">
      ${optA('p-assign', I.plus, 'Назначить клиенту')}
      ${P.own ? optA('p-dup', IC.copy, 'Дублировать') + optA('p-del', IC.trash, 'Удалить из базы', '', 'rm') : optA('p-own', IC.copy, 'Сохранить как своё')}</div>`}) },
  'p-own': () => { const P = progCur(); if(!P) return; closeSheet(true); const c = tplClone(P); go(hrefOf(c)); say('Копия в вашей базе — её и правьте') },
  'p-dup': () => { const P = progCur(); if(!P) return; closeSheet(true); const c = tplClone(P, P.title + ' — копия'); go(hrefOf(c)); say('Копия создана') },
  'p-dayrm': b => { const x = progCur() || PD; if(!x) return; const seq = x.seq.filter((_, i) => i !== +b.dataset.k); closeSheet(); pSave({seq}, 'День убран из цикла') },
  'p-del': () => { const P = progCur();
    if(!P) return; confirmDel('Удалить программу?', `«${P.title}» уйдёт из вашей базы. Клиентам, которым она уже стоит в календаре, ничего не изменится.`, 'p-del-ok', '') },
  'p-del-ok': () => { const P = progCur(); if(!P) return; tplDrop(P); closeSheet(true); goBack('#/more/programs'); say(`«${P.title}» удалена из базы`) },
  'p-day': b => sheetDay(+b.dataset.k),
  'p-pick': b => { closeSheet(true); sheetPickWo(b.dataset.k) },
  'p-pick-w': b => { const x = progCur() || PD; if(!x) return; const seq = [...x.seq];
    if(b.dataset.k === 'add') seq.push(b.dataset.id); else seq[+b.dataset.k] = b.dataset.id;
    closeSheet(); pSave({seq}, b.dataset.k === 'add' ? 'Тренировка добавлена в цикл' : 'Сохранено') },
  'p-rest': b => { const x = progCur() || PD; const seq = [...x.seq]; seq[+b.dataset.k] = null; closeSheet(); pSave({seq}) },
  'p-mv': b => { const x = progCur() || PD, k = +b.dataset.k, d = +b.dataset.d, seq = [...x.seq]; if(!seq[k + d] && seq[k + d] !== null) return;
    [seq[k], seq[k + d]] = [seq[k + d], seq[k]]; closeSheet(); pSave({seq}, false) },
  'p-addwo': () => sheetPickWo('add'),
  'p-addrest': () => { const x = progCur() || PD; pSave({seq:[...x.seq, null]}, false) },
  'p-reorder': () => { PRE = !PRE; T.repaint() },
  /* назначение программы */
  'p-assign': () => { const P = progCur(); if(P){ closeSheet(true); assignProg(P) } },
  'as-who': () => { const t = AS && tplById(AS.tid); if(!t) return;
    T.pick('bxas', 'Назначить · ' + t.title, wid => { AS.wid = wid; AS.start = progAssignStart(wid); sheetAssign() }) },
  'as-date': () => { const w = AS && who(AS.wid); if(w) T.sheetDate(w, AS.start, d => { AS.start = d; sheetAssign() }, 'Начать с') },
  'as-rep': b => { if(AS){ AS.replace = b.dataset.v === '1'; sheetAssign() } },
  'as-pub': () => { if(AS){ AS.pub = !AS.pub; sheetAssign() } },
  'as-go': () => { const t = AS && tplById(AS.tid), w = AS && who(AS.wid); if(!t || !w) return;
    const res = progAssign(t, AS.wid, AS.start, {replace:AS.replace, pub:AS.pub}), pub = AS.pub;
    AS = null; closeSheet(true); T.repaint();
    say(`«${t.title}» — ${isGrp(w.id) ? 'группе ' : ''}${w.n}: ${pl(res.n, 'тренировка', 'тренировки', 'тренировок')} с ${dShort(res.first)}${res.skip ? ', занятые дни пропущены' : ''}${pub ? '' : ' — черновиками'}`) }
};

/* ═══════════ ВХОД ИЗ app.js ═══════════ */
const has = k => !!LV[k];
function screen(args){
  const k = args[0], id = args[1] || null;
  PREV = CUR; CUR = {k, id};
  if(!PREV || PREV.k !== k || PREV.id !== id){ PRE = false; XS.more = {} }      /* другой экран — «Порядок» и «Показать все» сначала */
  if(!id) return scrList(k);
  if(k === 'ex') return scrEx(id);
  if(k === 'programs') return scrProg(id);
  return scrTpl(k, id);
}
/* после отрисовки экрана: поиск, дорисовка, перетаскивание; список — на прежнюю прокрутку */
function bind(){
  if(IO){ IO.disconnect(); IO = null }
  const r = String(location.hash).replace(/^#\/?/, '').split('/');
  if(r[0] !== 'more' || !has(r[1])){ CUR = null; return }
  const k = r[1];
  if(!r[2]){
    const q = document.getElementById('bq');
    if(q){ q.addEventListener('input', () => { ST[k].q = q.value; if(k === 'ex') ST.ex.n = CH; refreshList(k); scrollTo(0, 0) });
      q.addEventListener('keydown', e => { if(e.key === 'Enter') q.blur() }) }
    bindMore();
    /* вернулись с элемента этого списка — туда же, где были */
    const back = PREV && PREV.k === k && PREV.id && PREV.id !== 'new', y = back ? ST[k].y : 0;
    if(y) requestAnimationFrame(() => scrollTo(0, y));
    if(!back) ST[k].y = 0;
  }
  document.querySelectorAll('#bxCyc .hd').forEach(d => d.addEventListener('pointerdown', dragStart));
}
/* уходим со списка на элемент — запомнить прокрутку */
document.addEventListener('click', e => { const a = e.target.closest('#bList a.row'); if(a){ const k = document.getElementById('bList').dataset.k; ST[k].y = scrollY } }, true);

window.TBASES = {has, screen, bind, acts};
})();
