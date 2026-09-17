/* ═══════════ МАССОВЫЕ ДЕЙСТВИЯ С ДНЯМИ (календарь и полоса недель конструктора) ═══════════
   Галочка в шапке дня с тренировкой отмечает день; Shift+клик — диапазон.
   При первой отметке снизу появляется строка действий: копировать,
   переместить, опубликовать, в черновик, удалить, снять выделение (или Esc).
   Копия и перенос раскладываются от первой даты по правилу: как в источнике,
   те же дни недели, подряд, через день — к этому клиенту или к другим
   (копия — сразу к нескольким). Результат всегда черновики: клиент ничего
   не узнает, пока тренер не опубликует. Комментарии, результаты и переписка
   клиента не копируются; сообщение тренера к дню переезжает только при
   перемещении. Занятые дни заменяются после предупреждения. Любое действие
   отменяется из тоста.
   Страница подключает модуль: bulkInit({cid, refresh, beforeOp, afterOp}) —
   чей календарь открыт, как перерисовать выбор, как сбросить правки на диск
   до операции и как перечитать данные после. Модуль грузится до скриптов
   страницы: разметка дня зовёт bulkBox/bulkCls уже при первой отрисовке. */

const BK = { host:null, cid:null, sel:new Set(), anchor:null, dlg:null, dlgEl:null, pick:false };
const BK_I = {
  chk:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.5l3 3 6-7"/></svg>',
  copy:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 5.5V3.8A1.3 1.3 0 0 0 9.2 2.5H3.8A1.3 1.3 0 0 0 2.5 3.8v5.4a1.3 1.3 0 0 0 1.3 1.3h1.7"/></svg>',
  move:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 8h10M9 4.5 12.5 8 9 11.5"/></svg>',
  trash:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 4.5h11M6.5 4.5V3a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5v1.5M4 4.5l.7 8.3a1 1 0 0 0 1 .9h4.6a1 1 0 0 0 1-.9l.7-8.3"/></svg>',
  x:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
  cal:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><rect x="2.5" y="3.5" width="11" height="10" rx="1.5"/><path d="M2.5 6.5h11M5.5 2v3M10.5 2v3"/></svg>',
  chev:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6.5l4 4 4-4"/></svg>',
  warn:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 2.5 14 13H2L8 2.5z"/><path d="M8 6.5v3M8 11.3v.2"/></svg>',
  plus:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M8 3v10M3 8h10"/></svg>',
};

/* ─── мелочи: экранирование, даты, склонения ─── */
const bkEsc = s => String(s == null ? '' : s).replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
const bkD  = d => +d.slice(8) + ' ' + MONTHS[+d.slice(5,7) - 1].slice(0,3);
const bkDW = d => RU[dowMon(d)] + ' ' + bkD(d);
const bkN  = (n, a, b, c) => n + ' ' + plural3(n, a, b, c);
function bkRange(ds){
  if(!ds.length) return '';
  const a = ds[0], b = ds[ds.length - 1];
  if(a === b) return bkD(a);
  return a.slice(0,7) === b.slice(0,7) ? +a.slice(8) + '–' + bkD(b) : bkD(a) + ' – ' + bkD(b);
}

/* ─── подключение страницы ─── */
function bulkInit(host){
  BK.host = host; BK.cid = host.cid();
  const m = document.querySelector('.main');
  if(m && window.ResizeObserver) new ResizeObserver(bkPlaceBar).observe(m);
  addEventListener('resize', bkPlaceBar);
}
function bulkReset(){ BK.sel.clear(); BK.anchor = null; bkPaint(); bkBar() }

/* Выбор живёт внутри одного клиента: сменили клиента — выбор сброшен. */
function bkSyncClient(){
  if(!BK.host) return;
  const cid = BK.host.cid();
  if(BK.cid !== cid){ BK.cid = cid; BK.sel.clear(); BK.anchor = null; queueMicrotask(bkBar) }
}
/* Разметка для страницы: галочка в шапку дня и класс выбранной клетки. */
function bulkBox(date){
  bkSyncClient();
  const on = BK.sel.has(date);
  return `<i class="bk-box${on ? ' on' : ''}" data-bk="${date}" role="checkbox" aria-checked="${on}" aria-label="Выбрать день">${BK_I.chk}</i>`;
}
function bulkCls(date){ bkSyncClient(); return BK.sel.has(date) ? ' bksel' : '' }

/* Перекраска галочек без перерисовки страницы — прокрутка и фокус не сбиваются. */
function bkPaint(){
  document.querySelectorAll('.bk-box').forEach(b => {
    const on = BK.sel.has(b.dataset.bk);
    b.classList.toggle('on', on); b.setAttribute('aria-checked', on);
    const cell = b.closest('.day'); if(cell) cell.classList.toggle('bksel', on);
  });
}

/* ─── чтение дней ─── */
function bkCtx(cid){
  const c = client(cid); if(!c || !c.prog) return null;
  const p = program(c.prog); return p ? {pid:c.prog, p, plan:buildPlan(c.prog)} : null;
}
function bkDay(ctx, date){
  if(!ctx) return null;
  const i = daysBetween(ctx.p.start, date);
  return i >= 0 ? (ctx.plan[i] || null) : null;
}
const bkSelectable = x => !!x && dayStatus(x, x.draft) !== 'rest';
const bkHas = x => !!x && (!!x.comp || (x.blocks||[]).some(b => (b.items||[]).some(y => y.exId || y.raw)));
const bkTitle = x => !x ? '' : (x.title && !['Отдых','—'].includes(x.title) ? x.title : (x.comp ? 'Соревнование' : 'Без названия'));

/* ─── выбор ─── */
function bkToggle(date, range){
  bkSyncClient();
  const on = !BK.sel.has(date);
  if(range && BK.anchor && BK.anchor !== date){
    BK.host.beforeOp();
    const ctx = bkCtx(BK.cid), [a, b] = BK.anchor < date ? [BK.anchor, date] : [date, BK.anchor];
    for(let d = a; d <= b; d = addDays(d, 1)) if(bkSelectable(bkDay(ctx, d))) on ? BK.sel.add(d) : BK.sel.delete(d);
  } else on ? BK.sel.add(date) : BK.sel.delete(date);
  BK.anchor = date;
  bkPaint(); bkBar();
}

/* ─── строка действий ─── */
function bkBar(){
  let bar = document.getElementById('bkBar');
  if(!bar){
    bar = document.createElement('div'); bar.id = 'bkBar'; bar.className = 'bk-bar';
    bar.addEventListener('click', bkBarClick);
    document.body.appendChild(bar);
  }
  const on = BK.pick || BK.sel.size > 0;
  document.body.classList.toggle('bk-on', on);
  document.body.classList.toggle('bk-picking', BK.pick);
  if(!on){ bar.innerHTML = ''; return }
  const ds = [...BK.sel].sort();
  bar.innerHTML = BK.pick
    ? `<span class="bk-pickmsg">${BK_I.cal}Кликните день, с которого вставить</span><span class="bk-sep"></span>
       <button data-bka="pickcancel">${BK_I.x}Отмена</button>`
    : `<span class="bk-n"><b>Выбрано ${ds.length}</b><s>${bkRange(ds)}</s></span><span class="bk-sep"></span>
       <button data-bka="copy">${BK_I.copy}Копировать</button>
       <button data-bka="move">${BK_I.move}Переместить</button>
       <button data-bka="pub">${DAYICON.pub}Опубликовать</button>
       <button data-bka="draft">${DAYICON.draft}В черновик</button>
       <button data-bka="del" class="rm">${BK_I.trash}Удалить</button>
       <span class="bk-sep"></span>
       <button data-bka="clear" class="clr">${BK_I.x}Снять выделение</button>`;
  bkPlaceBar();
}
function bkPlaceBar(){
  const bar = document.getElementById('bkBar'), m = document.querySelector('.main');
  if(!bar || !m) return;
  const r = m.getBoundingClientRect();
  bar.style.left = Math.round(r.left + r.width / 2) + 'px';
}
function bkBarClick(e){
  const b = e.target.closest('[data-bka]'); if(!b) return;
  const a = b.dataset.bka;
  if(a === 'clear') return bulkReset();
  if(a === 'pickcancel') return bkPickCancel();
  if(a === 'del') return bkDelete();
  if(a === 'pub' || a === 'draft') return bkStatus(a === 'pub');
  if(a === 'copy' || a === 'move') return bkDlgOpen(a);
}

/* ─── запись и отмена ─── */
const BK_EMPTY = () => serializeDay({title:'', blocks:[], comp:false});
/* День пишется в хранилище клиента; ensureDay заводит контейнер дней, если
   у клиента нет программы, и сдвигает старт, если дата раньше него. */
function bkWrite(cid, date, c, draft){
  const r = ensureDay(cid, date); if(!r) return;
  const cur = buildPlan(r.pid)[r.i];
  const bag = ((STATE.days ||= {})[r.pid] ||= {});
  bag[r.i] = draft ? {c, pub: cur ? (cur.pub || '') : '', draft:true} : {c, draft:false};
}
/* Сообщение тренера к дню привязано к дате: при переносе забираем и кладём заново. */
function bkTakeMsg(cid, date){
  const arr = TALK.workout[talkKey(cid, date)]; if(!arr) return null;
  const i = arr.findIndex(m => m.who === 'trainer');
  return i < 0 ? null : arr.splice(i, 1)[0];
}
function bkPutMsg(cid, date, m){
  if(!m) return;
  const arr = (TALK.workout[talkKey(cid, date)] ||= []);
  const i = arr.findIndex(x => x.who === 'trainer');
  if(i >= 0) arr[i] = m; else arr.unshift(m);
}
function bkSnap(){
  return {
    state: JSON.stringify({days: STATE.days || {}, pstart: STATE.pstart || {}, calprog: STATE.calprog || {}}),
    plan: Object.fromEntries(Object.entries(PLAN).map(([k, v]) => [k, (v || []).slice()])),
    progs: PROGRAMS.map(p => ({id:p.id, start:p.start, days:p.days})),
    ids: new Set(PROGRAMS.map(p => p.id)),
    cprog: CLIENTS.map(c => [c.id, c.prog]),
    talk: JSON.stringify(TALK.workout),
    cid: BK.cid, sel: [...BK.sel],
  };
}
function bkRestore(s){
  const st = JSON.parse(s.state);
  STATE.days = st.days; STATE.pstart = st.pstart; STATE.calprog = st.calprog;
  Object.keys(PLAN).forEach(k => { if(!(k in s.plan)) delete PLAN[k] });
  Object.entries(s.plan).forEach(([k, v]) => { PLAN[k] = v.slice() });
  for(let i = PROGRAMS.length - 1; i >= 0; i--) if(!s.ids.has(PROGRAMS[i].id)) PROGRAMS.splice(i, 1);
  s.progs.forEach(q => { const p = program(q.id); if(p){ p.start = q.start; p.days = q.days } });
  s.cprog.forEach(([id, prog]) => { const c = client(id); if(c) c.prog = prog });
  const t = JSON.parse(s.talk);
  Object.keys(TALK.workout).forEach(k => delete TALK.workout[k]);
  Object.assign(TALK.workout, t);
  if(BK.cid === s.cid) BK.sel = new Set(s.sel);
  saveState();
}
/* Любое изменение: сбросить правки страницы → снимок → действие → перечитать → тост с отменой. */
function bkRun(fn){
  BK.host.beforeOp();
  const snap = bkSnap();
  const text = fn();
  saveState();
  BK.host.afterOp();
  bkPaint(); bkBar();
  bkToast(text, () => {
    BK.host.beforeOp(); bkRestore(snap); BK.host.afterOp();
    bkPaint(); bkBar(); bkToast('Действие отменено');
  });
}
let BK_TOAST = null;
function bkToast(text, undo){
  if(BK_TOAST) BK_TOAST.remove();
  const t = BK_TOAST = document.createElement('div');
  t.className = 'toast bk-toast';
  t.innerHTML = `<span>${bkEsc(text)}</span>` + (undo ? '<button class="undo">Отменить</button>' : '');
  if(undo) t.querySelector('.undo').addEventListener('click', () => { if(BK_TOAST === t) BK_TOAST = null; t.remove(); undo() });
  document.body.appendChild(t);
  requestAnimationFrame(() => t.classList.add('on'));
  setTimeout(() => { if(BK_TOAST !== t) return; BK_TOAST = null; t.classList.remove('on'); setTimeout(() => t.remove(), 260) }, undo ? 8000 : 2600);
}
function bkConfirm({title, lead, sub, ok}, onOk){
  const ov = document.createElement('div');
  ov.className = 'ov on bk-confirm';
  ov.innerHTML = `<div class="md ask">
    <div class="mdh"><span class="dot"></span><h2>${bkEsc(title)}</h2><button class="cls" data-x>✕</button></div>
    <div class="mdb"><p class="lead">${lead}</p>${sub ? `<p class="sub">${sub}</p>` : ''}</div>
    <div class="mdf"><span class="sp"></span><button class="btn gh" data-x>Отмена</button><button class="btn rm" data-ok>${bkEsc(ok)}</button></div>
  </div>`;
  ov.addEventListener('click', e => {
    if(e.target === ov || e.target.closest('[data-x]')){ ov.remove(); return }
    if(e.target.closest('[data-ok]')){ ov.remove(); onOk() }
  });
  document.body.appendChild(ov);
}

/* ─── удалить, опубликовать, в черновик ─── */
function bkDelete(){
  const cid = BK.cid, ds = [...BK.sel].sort(); if(!ds.length) return;
  BK.host.beforeOp();
  const ctx = bkCtx(cid);
  const pub = ds.filter(d => { const x = bkDay(ctx, d); return bkHas(x) && !x.draft }).length;
  bkConfirm({
    title: 'Удалить ' + bkN(ds.length, 'тренировку', 'тренировки', 'тренировок') + '?',
    lead: `${bkEsc(client(cid).n)} · ${bkRange(ds)}`,
    sub: pub ? `Опубликовано из них: ${pub}. Клиент перестанет их видеть.` : 'Все выбранные — черновики, клиент их не видит.',
    ok: 'Удалить',
  }, () => bkRun(() => {
    const empty = BK_EMPTY();
    ds.forEach(d => { bkWrite(cid, d, empty, false); bkTakeMsg(cid, d) });
    BK.sel.clear(); BK.anchor = null;
    return 'Удалено: ' + bkN(ds.length, 'тренировка', 'тренировки', 'тренировок');
  }));
}
function bkStatus(pub){
  const cid = BK.cid, ds = [...BK.sel].sort(); if(!ds.length) return;
  BK.host.beforeOp();
  const ctx = bkCtx(cid);
  const todo = ds.map(d => ({d, x: bkDay(ctx, d)})).filter(o => bkHas(o.x) && (pub ? o.x.draft : !o.x.draft));
  if(!todo.length) return bkToast(pub ? 'Все выбранные уже опубликованы' : 'Все выбранные уже в черновиках');
  bkRun(() => {
    const bag = ((STATE.days ||= {})[ctx.pid] ||= {});
    todo.forEach(({d, x}) => {
      const i = daysBetween(ctx.p.start, d), c = serializeDay(x);
      bag[i] = pub ? {c, draft:false} : {c, pub: x.pub || '', draft:true};
    });
    return (pub ? 'Опубликовано: ' : 'В черновик: ') + bkN(todo.length, 'тренировка', 'тренировки', 'тренировок');
  });
}

/* ─── копировать и переместить ─── */
/* Правила раскладки. «Те же дни недели» — сдвиг кратно неделе: первая
   тренировка встаёт на ближайший тот же день недели не раньше первой даты. */
function bkPlace(ds, first, rule){
  const base = ds[0];
  if(rule === 'week'){ const w = Math.ceil(daysBetween(base, first) / 7); return ds.map(s => ({src:s, dst: addDays(s, 7 * w)})) }
  return ds.map((s, k) => ({src:s, dst: addDays(first, rule === 'daily' ? k : rule === 'alt' ? 2 * k : daysBetween(base, s))}));
}
/* По умолчанию — сразу за выбранным диапазоном, с шагом в целые недели. */
function bkDefaultFirst(ds){ return addDays(ds[0], 7 * Math.ceil((daysBetween(ds[0], ds[ds.length - 1]) + 1) / 7)) }
/* У другого клиента проценты считаются от его максимумов — предупреждаем, если их нет. */
function bkNoPm(x, cid){
  if(!x) return [];
  const pm = pmOf(cid), out = new Set();
  (x.blocks||[]).forEach(b => (b.items||[]).forEach(it => {
    if(it.pct == null || !it.exId) return;
    const e = byId(it.exId), k = pmKey(e);
    if(k && !pm[k]) out.add(PMNAMES[k] || (e && e.ru) || k);
  }));
  return [...out];
}
function bkPreview(){
  const g = BK.dlg, src = BK.cid, ds = [...BK.sel].sort(), move = g.mode === 'move';
  const sctx = bkCtx(src), pairs = bkPlace(ds, g.first, g.rule), moved = new Set(ds);
  return g.targets.map(cid => {
    const ctx = cid === src ? sctx : bkCtx(cid);
    return {cid, rows: pairs.map(({src:s, dst}) => {
      const x = bkDay(sctx, s), occ = bkDay(ctx, dst);
      const same = move && cid === src && s === dst;
      /* При переносе у того же клиента дни-источники освобождаются первыми,
         поэтому попадание на них — не конфликт. */
      const conflict = !same && bkHas(occ) && !(move && cid === src && moved.has(dst));
      return {s, dst, x, same, conflict, occ: conflict ? bkTitle(occ) : '', past: dst < TODAY, noPm: cid === src ? [] : bkNoPm(x, cid)};
    })};
  });
}
function bkDlgOpen(mode){
  const ds = [...BK.sel].sort(); if(!ds.length) return;
  if(mode) BK.dlg = {mode, targets:[BK.cid], first: bkDefaultFirst(ds), rule:'src', confirm:false};
  BK.host.beforeOp();
  if(!BK.dlgEl){
    const ov = BK.dlgEl = document.createElement('div');
    ov.className = 'ov on bk-dlg';
    ov.addEventListener('click', bkDlgClick);
    document.body.appendChild(ov);
  }
  bkDlgDraw();
}
function bkDlgClose(){ if(BK.dlgEl){ BK.dlgEl.remove(); BK.dlgEl = null } }
function bkPickStart(){ bkDlgClose(); BK.pick = true; bkBar() }
function bkPickCancel(){ BK.pick = false; bkBar(); if(BK.dlg) bkDlgOpen() }
function bkPicked(date){ BK.pick = false; BK.dlg.first = date; BK.dlg.confirm = false; bkBar(); bkDlgOpen() }

const BK_RULES = [
  ['src',   'Как в источнике',  'Те же промежутки между днями'],
  ['week',  'Те же дни недели', 'Пн, Ср, Пт остаются Пн, Ср, Пт'],
  ['daily', 'Подряд',           'Каждый день без пропусков'],
  ['alt',   'Через день',       'День отдыха между тренировками'],
];
function bkDlgDraw(){
  const g = BK.dlg, ds = [...BK.sel].sort(), move = g.mode === 'move';
  const src = client(BK.cid), prev = bkPreview();
  const total = prev.reduce((a, x) => a + x.rows.length, 0);
  const conf  = prev.reduce((a, x) => a + x.rows.filter(r => r.conflict).length, 0);
  const past  = prev.reduce((a, x) => a + x.rows.filter(r => r.past).length, 0);
  const av = c => `<span class="cav">${bkEsc(c.ini)}</span>`;
  const verb = move ? 'Переместить' : 'Копировать';
  const tgt = move ? client(g.targets[0]) : null;
  BK.dlgEl.innerHTML = `<div class="md bkmd">
    <div class="mdh"><span class="dot"></span><h2>${verb} ${bkN(ds.length, 'тренировку', 'тренировки', 'тренировок')}</h2><button class="cls" data-bkd="close">✕</button></div>
    <div class="mdb bkd">
      <div class="bkd-l">
        <div class="lab">Откуда</div>
        <div class="bkd-src">${av(src)}<span><b>${bkEsc(src.n)}</b><s>${bkRange(ds)}</s></span></div>
        <div class="lab">${move ? 'Кому' : 'Кому — можно нескольким'}</div>
        <div class="bkd-to">${move
          ? `<button class="bkd-cli" data-bkd="setcli">${av(tgt)}<b>${bkEsc(tgt.n)}</b>${BK_I.chev}</button>`
          : g.targets.map(id => { const c = client(id); return `<span class="bkd-chip">${av(c)}<b>${bkEsc(c.n)}</b><button data-bkd="rm" data-cid="${id}" aria-label="Убрать">${BK_I.x}</button></span>` }).join('')
            + `<button class="bkd-add" data-bkd="addcli">${BK_I.plus}Добавить клиента</button>`}</div>
        <div class="lab">С какой даты</div>
        <div class="bkd-date">
          <button class="btn gh sm jumpb" data-bkd="date">${BK_I.cal}<span>${bkDW(g.first)}</span>${BK_I.chev}</button>
          <button class="bkd-lnk" data-bkd="pick">Выбрать в календаре</button>
        </div>
        <div class="lab">Как раскладывать</div>
        <div class="bkd-rules">${BK_RULES.map(([k, t, s]) => `<button class="${g.rule === k ? 'on' : ''}" data-bkd-rule="${k}"><b>${t}</b><s>${s}</s></button>`).join('')}</div>
      </div>
      <div class="bkd-r">
        <div class="lab">Что получится</div>
        ${prev.map(grp => `${g.targets.length > 1 ? `<div class="bkd-gh">${av(client(grp.cid))}${bkEsc(client(grp.cid).n)}</div>` : ''}
          ${grp.rows.map(r => `<div class="bkd-row${r.conflict ? ' conflict' : ''}">
            <span class="d1">${bkDW(r.s)}</span><span class="ar">→</span><span class="d2">${bkDW(r.dst)}</span>
            <span class="t"><b>${bkEsc(bkTitle(r.x))}</b>${r.conflict ? `<i class="chip warn">заменит «${bkEsc(r.occ)}»</i>` : ''}${r.past ? '<i class="chip ghost">прошедшая дата</i>' : ''}${r.noPm.length ? `<i class="chip rm">нет 1ПМ: ${bkEsc(r.noPm.join(', '))}</i>` : ''}</span>
          </div>`).join('')}`).join('')}
      </div>
    </div>
    <div class="mdf">${g.confirm && conf
      ? `<span class="bkd-warn">${BK_I.warn}${bkN(conf, 'день уже занят', 'дня уже заняты', 'дней уже заняты')}: тренировки на них будут заменены</span><span class="sp"></span>
         <button class="btn gh" data-bkd="back">Назад</button><button class="btn rm" data-bkd="apply">Заменить и ${move ? 'переместить' : 'копировать'}</button>`
      : `<span class="bkd-sum">Встанут черновиками: ${total}${conf ? ` · замен: ${conf}` : ''}${past ? ` · в прошлом: ${past}` : ''}</span><span class="sp"></span>
         <button class="btn gh" data-bkd="close">Отмена</button><button class="btn" data-bkd="apply" ${g.targets.length ? '' : 'disabled'}>${verb}</button>`}
    </div>
  </div>`;
}
function bkDlgClick(e){
  const g = BK.dlg;
  if(e.target === BK.dlgEl) return bkDlgClose();
  const r = e.target.closest('[data-bkd-rule]');
  if(r){ g.rule = r.dataset.bkdRule; g.confirm = false; return bkDlgDraw() }
  const b = e.target.closest('[data-bkd]'); if(!b) return;
  const a = b.dataset.bkd;
  if(a === 'close') return bkDlgClose();
  if(a === 'back'){ g.confirm = false; return bkDlgDraw() }
  if(a === 'rm'){ g.targets = g.targets.filter(id => id !== b.dataset.cid); g.confirm = false; return bkDlgDraw() }
  if(a === 'addcli') return openClientPicker(b, null, id => { if(!g.targets.includes(id)) g.targets.push(id); g.confirm = false; bkDlgDraw() }, {all:true, exclude:new Set(g.targets)});
  if(a === 'setcli') return openClientPicker(b, g.targets[0], id => { g.targets = [id]; g.confirm = false; bkDlgDraw() }, {all:true});
  if(a === 'date') return openDatePicker(b, g.first, d => { g.first = d; g.confirm = false; bkDlgDraw() });
  if(a === 'pick') return bkPickStart();
  if(a === 'apply') return bkApply();
}
function bkApply(){
  const g = BK.dlg; if(!g.targets.length) return;
  const prev = bkPreview();
  if(prev.some(x => x.rows.some(r => r.conflict)) && !g.confirm){ g.confirm = true; return bkDlgDraw() }
  const src = BK.cid, move = g.mode === 'move';
  const pay = prev[0].rows.filter(r => r.x).map(r => ({s:r.s, dst:r.dst, c: serializeDay(r.x), same:r.same}));
  bkDlgClose();
  bkRun(() => {
    /* Перенос атомарный: сначала освобождаем все источники, потом раскладываем. */
    if(move){ const empty = BK_EMPTY(); pay.forEach(p => { if(p.same) return; p.msg = bkTakeMsg(src, p.s); bkWrite(src, p.s, empty, false) }) }
    g.targets.forEach(cid => pay.forEach(p => { bkWrite(cid, p.dst, p.c, true); if(move && !p.same) bkPutMsg(cid, p.dst, p.msg) }));
    BK.sel.clear(); BK.anchor = null;
    const who = g.targets.length > 1 ? ' · ' + bkN(g.targets.length, 'клиенту', 'клиентам', 'клиентам') : (g.targets[0] !== src ? ' · ' + client(g.targets[0]).n : '');
    return (move ? 'Перемещено: ' : 'Скопировано: ') + bkN(pay.length, 'тренировка', 'тренировки', 'тренировок') + who + ' · черновики';
  });
}

/* ─── события: галочки, выбор даты в календаре, Esc ─── */
document.addEventListener('mousedown', e => { if(e.shiftKey && e.target.closest && e.target.closest('[data-bk]')) e.preventDefault() }, true);
document.addEventListener('click', e => {
  if(!BK.host || !e.target.closest) return;
  if(BK.pick){
    const cell = e.target.closest('.days .day[data-date]');
    if(cell){ e.preventDefault(); e.stopPropagation(); bkPicked(cell.dataset.date) }
    return;
  }
  const box = e.target.closest('[data-bk]');
  if(box){ e.preventDefault(); e.stopPropagation(); bkToggle(box.dataset.bk, e.shiftKey) }
}, true);
document.addEventListener('keydown', e => {
  if(e.key !== 'Escape' || !BK.host || e.defaultPrevented) return;
  if(document.querySelector('.sug')) return;                 /* открыт выпадающий список — он закроется сам */
  const conf = document.querySelector('.bk-confirm');
  if(conf){ e.preventDefault(); conf.remove(); return }
  if(BK.dlgEl){ e.preventDefault(); bkDlgClose(); return }
  if(BK.pick){ e.preventDefault(); bkPickCancel(); return }
  const t = e.target;
  if(t && t.nodeType === 1 && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
  if(BK.sel.size){ e.preventDefault(); bulkReset() }
});
