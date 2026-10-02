/* ═══════════════════════════════════════════════════════════════
   1. ТРЕНИРОВКИ — неделя (главная), календарь, упражнение
   ═══════════════════════════════════════════════════════════════ */
const SEL = {d: TODAY};          /* выбранный день на главной — без записи в историю */

/* Под заголовком — только тренер: названия программы и группы бывают длинными
   и растягивают шапку. Строка не зависит от сообщения к тренировке. */
const progSub = () => 'Тренер ' + esc(TRAINER.n);
/* Метка дня в полосе недели и в месяце. */
function wkMark(st){
  if(st.comp) return `<span class="cmp">${ICO.trophy}</span>`;
  switch(st.st){
    case 'done': return `<span class="ok">${ICO.chk}</span>`;
    case 'part': return `<span class="ok part">${ICO.chk}</span>`;
    case 'prog': return `<span class="dot prog"></span>`;
    case 'miss': return `<span class="dot hollow"></span>`;
    case 'today': case 'planned': return `<span class="dot"></span>`;
    case 'rest': return `<span class="miss">${ICO.moon}</span>`;
  }
  return '';
}
const STATUS_CHIP = {done:['ok','Выполнена'], part:['acc','Частично'], prog:['prog','В процессе'], miss:['','Без отметок']};

/* Список блоков дня — как вид «Блоки» в календаре тренера, но с составом. */
/* Список блоков дня: строка — кнопка со стрелкой, как в настройках iOS; ведёт в
   тренировку сразу на этот блок (прокрутка и короткая подсветка). */
function blocksPreview(W){
  return `<div class="bl">${W.blocks.map((B, i) => {
    const names = B.mode === 'text' ? textLines(B.text).slice(0, 3).map(l => l.replace(LIST_RE, '')).join(' · ')
      : [...new Set(B.parts.flatMap(P => P.type === 'ss' ? P.members : [P]).map(P => P.type === 'ex' || P.type === 'txtex' ? P.e.ru : P.type === 'chain' ? P.parts.map(x => x.name).join(' + ') : P.text))].join(', ');
    const n = B.parts.reduce((a, P) => a + (P.type === 'ss' ? P.members.length : 1), 0);
    /* формат или число упражнений — сразу за названием, через точку */
    const m = B.fmt ? `<span class="m"> · ${esc(fmtLabel(B.fmt))}</span>` : B.mode === 'text' ? '' : `<span class="m"> · ${n} ${plural(n, 'упр.', 'упр.', 'упр.')}</span>`;
    const t = B.title || B.type || 'Блок';
    return `<button class="it" data-go="#/train/day/${W.date}?f=${encodeURIComponent(B.key)}" aria-label="${esc('Блок ' + (i + 1) + ': ' + t + ' — открыть в тренировке')}"><span class="n">${i + 1}</span><span><b>${esc(t)}</b>${m}<s>${esc(names)}</s></span><span class="ch">${ICO.chev}</span></button>`;
  }).join('')}</div>`;
}
/* Сообщение тренера к тренировке (COM-4) — инструкция, она остаётся в задании.
   «Ответить» открывает чат с этой тренировкой во вложении. */
/* compact — на главной: тренер уже назван в шапке, поэтому вместо строки с
   аватаром и именем — маленькая подпись «Тренер» внутри сообщения. */
function coachMsg(date, full, compact){
  const msg = dayMsg(CS.cid, date) || '';
  if(!msg) return '';
  return `<button class="coach${compact ? ' c' : ''}" data-act="ask" data-k="day" data-d="${date}">
    ${compact ? '' : `<span class="who">${UI.av(TRAINER.ini, 's')}<b>${esc(TRAINER.n)}</b><s>тренер</s></span>`}
    <span class="msg">${compact ? `<span class="h">${ICO.chat}Тренер</span>` : ''}<i>${esc(msg)}</i>${full ? '' : `<em>Ответить ${ICO.chev}</em>`}</span></button>`;
}
function nextWork(from){
  for(let i = 1; i < 30; i++){ const d = addDays(from, i); const x = Model.day(d); if(x.kind === 'work' && x.blocks.length) return x }
  return null;
}

/* ═══════════ 1.1 НЕДЕЛЯ ═══════════ */
route('/train', (p, q) => {
  if(q.d) SEL.d = q.d;
  const sel = SEL.d, ws = weekStart(sel), cw = weekStart(TODAY);
  const days = Array.from({length:7}, (_, i) => addDays(ws, i));
  const me = Model.me();
  const noProg = !Model.pid();
  const lbl = (() => { const a = D(days[0]), b = D(days[6]);
    return a.getMonth() === b.getMonth() ? a.getDate() + '–' + b.getDate() + ' ' + MONTHS[b.getMonth()] : dShort(days[0]) + ' – ' + dShort(days[6]) })();

  const strip = `<div class="wkbar"><span class="lbl">${ws === cw ? 'Эта неделя · ' : ''}${lbl}</span>
      <span class="ar">${ws !== cw ? `<button class="today-b" data-act="wkToday">Сегодня</button>` : ''}
        <button class="ib" data-act="wkShift" data-n="-7" aria-label="Прошлая неделя">${ICO.back}</button>
        <button class="ib" data-act="wkShift" data-n="7" aria-label="Следующая неделя">${ICO.fwd}</button></span></div>
    <div class="wk">${days.map(d => { const st = Model.status(d), x = Model.day(d);
      return `<button class="${d === TODAY ? 'td' : ''} ${d === sel ? 'sel' : ''}" data-act="pickDay" data-d="${d}" aria-label="${esc(dLong(d))}">
        <span class="dw">${RU[dowMon(d)]}</span><span class="dn">${D(d).getDate()}</span><span class="mk">${wkMark(st)}</span></button>` }).join('')}</div>
    <button class="wkpull" aria-label="Открыть календарь месяца — потяните вниз или нажмите"><i class="grab"></i></button>`;

  let body = '', foot = '';
  const x = Model.day(sel), st = Model.status(sel), rel = dRel(sel);
  const whenRow = extra => `<div class="when"><span class="caps${sel === TODAY ? ' today' : ''}">${esc(dLong(sel))}${rel && rel !== 'сегодня' ? ' · ' + rel : sel === TODAY ? ' · сегодня' : ''}</span>${extra || ''}</div>`;

  if(noProg){
    body = UI.empty({ico:ICO.cal, title:'Тренер составляет вашу программу',
      text:'Как только он опубликует первую тренировку, она появится здесь. А пока можно заполнить профиль и вписать максимумы — от них тренер посчитает веса.',
      btn:`<div style="display:flex;flex-direction:column;gap:8px;margin-top:20px"><button class="btn" data-go="#/progress/pm">Вписать максимумы</button><button class="btn ghost" data-go="#/me/data">Заполнить профиль</button></div>`});
  } else if(x.kind === 'work'){
    const W = Model.workout(sel);
    const G = x.g ? grp(x.g) : null;
    const chip = STATUS_CHIP[st.st];
    const tags = [x.comp ? `<span class="chip comp">${ICO.trophy}Соревнование</span>` : '', G ? `<span class="chip">${ICO.grp}Группа «${esc(G.n)}»</span>` : ''].join('');
    const r = Model.res(sel);
    let sum = '';
    if(st.st === 'done' || st.st === 'part' || (st.st === 'prog' && st.k)){
      const vol = workVolume(W, r);
      const bp = blockProg(W, r), nb = bp.length, kb = bp.filter(b => b.k === b.n).length;
      sum = `<div class="dsum"><div><b class="num">${kb}<span style="color:var(--tx4);font-weight:600"> / ${nb}</span></b><s>${plural(nb, 'блок', 'блока', 'блоков')}</s></div>${vol ? `<div><b class="num">${fmtN(vol)}</b><s>кг объём</s></div>` : ''}${r && r.rpe ? `<div><b>${r.rpe}<span style="color:var(--tx4);font-weight:600">/10</span></b><s>самочувствие</s></div>` : ''}</div>`;
    }
    const needs = [...new Set(W.blocks.flatMap(B => B.parts.flatMap(P => P.type === 'ss' ? P.members : [P])).filter(P => P.type === 'ex' && P.load.needPm).map(P => P.load.pmKey))];
    body = `<div class="dov">
      ${whenRow(chip ? `<span class="chip ${chip[0]}">${chip[1]}</span>` : '')}
      <h2>${esc(x.title)}</h2>
      <div class="tags">${tags}</div>
      ${coachMsg(sel, false, true)}
      ${sum}
      ${W.blocks.length ? blocksPreview(W) : ''}
      ${!W.blocks.length && x.comp ? `<div class="state"><div class="ic" style="background:var(--comp-mark);color:var(--comp-ink)">${ICO.trophy}</div><b>День соревнований</b><p>Тренер отметил этот день как старт. Удачи!</p></div>` : ''}
    </div>
    ${needs.length ? `<button class="tip acc" data-act="needPm" data-k="${needs[0]}" data-d="${sel}"><span class="i">${ICO.bolt}</span><span><b>Впишите максимум: ${esc(needs.map(k => Model.pmName(k).toLowerCase()).join(', '))}</b><s>Тренер задал вес от вашего 1ПМ — без него приложение не посчитает килограммы</s></span></button>` : ''}`;
    if(W.blocks.length){
      /* завершена (полностью или частично) — смотреть; начата — продолжить, а если
         отмечено всё, но «Завершить» не нажато, — завершить */
      if(st.st === 'done' || st.st === 'part') foot = `<button class="btn dark" data-go="#/train/day/${sel}">Посмотреть результаты</button>`;
      else if(st.st === 'prog') foot = st.n && st.k === st.n
        ? `<button class="btn" data-act="goFinish" data-d="${sel}">${ICO.chk}Завершить тренировку</button><div class="hint">Всё отмечено — осталось завершить</div>`
        : (() => { const bp = blockProg(W, Model.res(sel)), nb = bp.length, kb = bp.filter(b => b.k === b.n).length;
            return `<button class="btn" data-go="#/train/day/${sel}">Продолжить${kb ? ` <span class="c">· ${kb} из ${nb} ${blkWord(nb)}</span>` : ''}</button>` })();
      else if(sel === TODAY) foot = `<button class="btn" data-act="goStart" data-d="${sel}">Начать тренировку</button>`;
      else if(sel > TODAY) foot = `<button class="btn dark" data-go="#/train/day/${sel}">Открыть тренировку</button><div class="hint">Можно сделать раньше — результат запишется на ${esc(DOW_ACC[dowMon(sel)])}</div>`;
      else foot = `<button class="btn dark" data-go="#/train/day/${sel}">Записать результаты</button><div class="hint">Тренировка прошла без отметок</div>`;
    }
  } else if(x.kind === 'rest'){
    const nx = nextWork(sel);
    body = `<div class="dov">${whenRow()}
      <div class="state"><img src="../assets/icons/rest.png" alt=""><b>День отдыха</b><p>Восстановление — тоже часть программы.</p></div>
      ${nx ? `<div class="nextw">${UI.sec('Следующая тренировка')}<div class="list top">${UI.row({title:esc(nx.title), sub:esc(cap1(dLong(nx.date))) + (dRel(nx.date) ? ' · ' + dRel(nx.date) : ''), act:'pickDay', data:`data-d="${nx.date}"`})}</div></div>` : ''}
    </div>`;
  } else if(x.kind === 'before'){
    const s = Model.progStart();
    body = `<div class="dov">${whenRow()}<div class="state"><div class="ic" style="background:var(--s1);color:var(--tx3)">${ICO.cal}</div><b>Программа ещё не началась</b><p>Первая тренировка — ${esc(dLong(s))}.</p></div></div>`;
  } else {
    const lp = Model.lastPub();
    body = `<div class="dov">${whenRow()}<div class="state"><div class="ic" style="background:var(--s1);color:var(--tx3)">${ICO.edit}</div>
      <b>Тренировки пока нет</b><p>Тренер ещё не опубликовал тренировку на этот день. Как только опубликует — она появится здесь.${lp ? '<br>Сейчас расписано до ' + esc(dDM(lp)) + '.' : ''}</p></div></div>`;
  }

  /* подсказки: ждёт отправки, новый ответ тренера */
  const pend = Model.pending().length;
  const unm = Chat.unreadMsgs(CS.cid, 'c'), un = unm.length ? unm[unm.length - 1] : null;
  let tips = '';
  if(un) tips += `<button class="tip" data-go="#/chat"><span class="i">${ICO.chat}</span><span><b>Тренер ${unm.length > 1 ? 'написал · ' + unm.length : 'ответил'}</b><s>${esc(un.text.slice(0, 90))}${un.text.length > 90 ? '…' : ''}</s></span></button>`;
  if(pend) tips += `<button class="tip" data-go="#/me/device"><span class="i">${ICO.clock}</span><span><b>${pend} ${plural(pend, 'запись ждёт', 'записи ждут', 'записей ждут')} отправки</b><s>Уйдут тренеру, как только появится сеть</s></span></button>`;

  /* Шапка с неделей — белая; ниже серый фон и белый блок выбранного дня.
     Пока программы нет, недели нет — шапка скругляется сама (класс zero),
     календарь в ней не нужен: месяц был бы пустым. */
  return {tab:'train', cls:'grey home' + (noProg ? ' zero' : ''), mount: v => wirePull(v), html:`
    ${UI.lt({title:'Тренировки', sub:progSub(), acts: noProg ? '' : `<button class="ib" data-go="#/train/month" aria-label="Календарь">${ICO.cal}</button>`})}
    <div class="body${foot ? ' pad-foot' : ''}">${noProg ? '' : strip}${body}${tips}</div>
    ${foot ? `<div class="foot">${foot}</div>` : ''}`};
});
/* Ручка под неделей: потянуть вниз — открывается календарь месяца, как шторка
   сверху. Касание без жеста делает то же (жест — не единственный путь, HIG). */
function wirePull(v){
  const el = $('.wkpull', v); if(!el) return;
  let S = null;
  const reset = () => { el.classList.remove('drag', 'armed'); el.style.removeProperty('--pull') };
  el.addEventListener('pointerdown', e => { S = {y:e.clientY, dy:0, id:e.pointerId}; el.classList.add('drag'); try{ el.setPointerCapture(e.pointerId) }catch(_){} });
  el.addEventListener('pointermove', e => { if(!S || e.pointerId !== S.id) return;
    S.dy = Math.max(0, e.clientY - S.y); el.style.setProperty('--pull', Math.round(Math.min(64, S.dy * .6)) + 'px'); el.classList.toggle('armed', S.dy > 48) });
  el.addEventListener('pointerup', e => { if(!S || e.pointerId !== S.id) return; const dy = S.dy; S = null; reset(); if(dy > 48 || dy < 6) openMonth() });
  el.addEventListener('pointercancel', () => { S = null; reset() });
  el.addEventListener('click', e => { if(e.detail === 0) openMonth() });     /* с клавиатуры */
}
function openMonth(){ Nav.dropNext = true; Nav.go('#/train/month') }
ACT.pickDay = el => { SEL.d = el.dataset.d; if(location.hash.startsWith('#/train') && !location.hash.startsWith('#/train/')) App.refresh(); else Nav.go('#/train') };
ACT.wkShift = el => { const n = +el.dataset.n, ws = addDays(weekStart(SEL.d), n);
  SEL.d = weekStart(TODAY) === ws ? TODAY : ws; App.refresh() };
ACT.wkToday = () => { SEL.d = TODAY; App.refresh() };
ACT.goFinish = el => { const d = el.dataset.d; Nav.go('#/train/day/' + d); setTimeout(() => openFinishSheet(), 80) };
ACT.goStart = el => { const d = el.dataset.d; Model.ensureRes(d); Nav.go('#/train/day/' + d) };

function workVolume(W, r){
  if(!r) return 0; let v = 0;
  W.units.forEach(u => { if(u.type !== 'set') return; const x = r.u[u.key]; if(!x || !x.d) return;
    const kg = x.kg ?? u.set.kg, rep = x.r ?? u.set.reps; if(u.set.kind === 'kg' && kg && rep) v += kg * rep });
  return Math.round(v);
}

/* ═══════════ 1.2 КАЛЕНДАРЬ ═══════════ */
route('/train/month', () => {
  const start = Model.progStart() || TODAY;
  const lp = Model.lastPub() || TODAY;
  let m0 = D(start); m0 = new Date(m0.getFullYear(), m0.getMonth(), 1);
  const from = new Date(Math.min(m0, new Date(D(TODAY).getFullYear(), D(TODAY).getMonth() - 1, 1)));
  const toD = D(lp > TODAY ? lp : TODAY); const to = new Date(toD.getFullYear(), toD.getMonth() + 1, 1);
  let html = '';
  for(let m = new Date(from); m <= to; m = new Date(m.getFullYear(), m.getMonth() + 1, 1)){
    const first = iso(m), lead = dowMon(first), n = new Date(m.getFullYear(), m.getMonth() + 1, 0).getDate();
    const cells = Array(lead).fill('<span></span>');
    for(let i = 1; i <= n; i++){
      const d = iso(new Date(m.getFullYear(), m.getMonth(), i)), st = Model.status(d);
      const cls = [d === TODAY ? 'td' : '', d === SEL.d ? 'sel' : '', st.comp ? 'cmp' : st.st].join(' ');
      cells.push(`<button class="${cls}" data-act="monPick" data-d="${d}"><span class="n">${i}</span><span class="mk">${st.st === 'planned' || st.st === 'today' || st.st === 'prog' ? '<span class="dot"></span>' : st.st === 'rest' ? `<span style="color:var(--tx4)">${ICO.moon}</span>` : ''}</span></button>`);
    }
    const id = m.getFullYear() + '-' + String(m.getMonth() + 1).padStart(2, '0');
    html += `<div class="mon" id="m${id}"><h3>${MONTHS_N[m.getMonth()]}${m.getFullYear() !== D(TODAY).getFullYear() ? ' ' + m.getFullYear() : ''}</h3>
      <div class="dws">${RU.map(r => `<span>${r}</span>`).join('')}</div><div class="mgrid">${cells.join('')}</div></div>`;
  }
  return {tab:'train', html:`${UI.nav({title:'Календарь', sub:Model.pid() ? 'расписано до ' + dDM(Model.lastPub() || TODAY) : '', back:'#/train', line:true,
      right:`<button class="ib" data-act="monLegend" aria-label="Обозначения">${ICO.info}</button>`})}
    <div class="body">${html}</div>`,
    mount(v){ const id = 'm' + TODAY.slice(0, 7); const el = $('#' + id, v); const b = $('.body', v);
      if(el && b && Nav.scroll[location.hash] == null) b.scrollTop = el.offsetTop - 60 }};
});
ACT.monPick = el => { SEL.d = el.dataset.d; Nav.back('#/train') };
/* Обозначения — шторкой по «i» в шапке, а не блоком над первым месяцем:
   календарь открывается на текущем месяце, до начала ленты никто не долистает.
   Образцы — те же клетки, что в сетке. */
ACT.monLegend = () => {
  const C = (cls, n, mk, t, s) => `<div class="lgr"><span class="mgrid" aria-hidden="true"><span class="c ${cls}"><span class="n">${n}</span><span class="mk">${mk}</span></span></span>
    <span class="tx"><b>${t}</b>${s ? `<s>${s}</s>` : ''}</span></div>`;
  Sheet.open(`<div class="shh"><span class="t"><b>Обозначения</b></span><button class="ib" data-act="sheetClose" aria-label="Закрыть">${ICO.x}</button></div>
    <div class="lgd">
      ${C('done', 9, '', 'Выполнена', 'Отмечено всё')}
      ${C('part', 10, '', 'Частично', 'Тренировку закончили, отмечено не всё')}
      ${C('prog', 15, '<span class="dot"></span>', 'В процессе', 'Начали, но ещё не закончили')}
      ${C('miss', 14, '', 'Без отметок', 'День прошёл, отметок нет')}
      ${C('planned', 21, '<span class="dot"></span>', 'Впереди', 'Тренировка запланирована')}
      ${C('cmp', 25, '', 'Соревнование', 'Тренер отметил день как старт')}
      ${C('rest', 12, `<span style="color:var(--tx4)">${ICO.moon}</span>`, 'Отдых', 'День восстановления')}
      ${C('td', 2, '', 'Сегодня', '')}
      ${C('sel', 8, '', 'Выбранный день', 'Он открыт на экране «Тренировки»')}
    </div>`);
};

/* ═══════════ 1.4 УПРАЖНЕНИЕ ═══════════ */
ACT.chatOpen = el => { CH.flash = el.dataset.id; Nav.go('#/chat') };
route('/ex/:id', (p, q) => {
  const e = byId(p.id);
  if(!e) return {tab:'train', html:`${UI.nav({back:'#/train'})}<div class="body">${UI.empty({title:'Упражнение не найдено'})}</div>`};
  const pmk = pmKey(e), pm = Model.pm(), hist = Model.exHistory(e.id);
  const ready = Model.mediaReady(e.id);
  const media = ready && e.gif ? `<div class="media"><img src="${Model.gif(e, 360)}" alt="${esc(e.ru)}"></div>`
    : `<div class="media"><div class="ph">${ICO.img}<b>Демонстрация не загружена</b><s>Загрузится, когда появится сеть.<br>Техника и ваши результаты — ниже.</s></div></div>`;
  /* Если открыли из тренировки — напомнить, что назначено на этот день. */
  /* Строка — по ID из ссылки (в дне может быть два одинаковых упражнения),
     без него — первое такое упражнение дня. */
  const parts = q.d ? Model.workout(q.d).blocks.flatMap(B => B.parts.flatMap(x => x.type === 'ss' ? x.members : [x])) : [];
  const here = parts.find(x => q.i && x.key === q.i && x.exId === e.id) || parts.find(x => x.exId === e.id) || null;
  let today = '';
  if(q.d){ const P = here;
    if(P) today = `${UI.sec('В тренировке ' + (dRel(q.d) || dShort(q.d)))}<div class="txsec"><p>${P.type === 'txtex' ? esc(P.txt) : P.type === 'ex' ? (P.meta || '—') : ''}</p></div>` }
  const pmv = pmk ? pm[pmk] : null;
  const ph = pmk ? Model.pmHist(pmk) : [];
  const pmBox = pmk ? (pmv
    ? `${UI.sec('Мой максимум')}<button class="pmcard" data-go="#/progress/pm/${pmk}"><span class="t"><span class="caps">1ПМ · ${esc(Model.pmName(pmk))}</span><b class="num">${kgS(pmv)}</b><s>${ph.length && ph[ph.length - 1].date ? 'обновлён ' + dShort(ph[ph.length - 1].date) : 'от него считаются веса в тренировках'}</s></span><span class="ch">${ICO.chev}</span></button>`
    : `${UI.sec('Мой максимум')}<button class="tip acc" style="margin-top:0" data-act="needPm" data-k="${pmk}"><span class="i">${ICO.bolt}</span><span><b>Впишите свой 1ПМ</b><s>Тренер может задавать вес в процентах — приложение посчитает килограммы</s></span></button>`) : '';
  const tech = TECH[e.id], steps = e.id === 'bench' ? EDB_DEMO.instructions : null;
  /* Вопросы об этом упражнении — сообщения единого чата, у каждого свой день. */
  const about = Chat.list(CS.cid, 'c').filter(m => m.att && m.att.exId === e.id).slice(-3).reverse();
  const talk = `${UI.sec('В чате с тренером', about.length ? 'Открыть чат' : '', '#/chat')}
    ${about.length ? `<div class="list top">${about.map(m => UI.row({ico:ICO.chat, title:esc(m.text.slice(0, 80)) + (m.text.length > 80 ? '…' : ''),
        sub:esc(cap1(dDM(m.att.date))) + ' · ' + (m.by === 'c' ? 'вы' : 'тренер'), act:'chatOpen', data:`data-id="${esc(m.id)}"`})).join('')}</div>`
      : `<p class="note-s">Что-то не получается или болит — спросите тренера. Вопрос уйдёт в чат с этим упражнением${here ? ' этого дня' : ''} во вложении.</p>`}
    <div style="padding:10px var(--gut) 0"><button class="btn line sm" style="width:100%" ${here ? askAttrs('ex', q.d, here.key) : 'data-act="ask"'}>${ICO.chat}Спросить тренера</button></div>`;
  return {tab:'*', tabs:false, html:`${UI.nav({title:e.ru, back: q.d ? '#/train/day/' + q.d : '#/train', reveal:true})}
    <div class="body" style="padding-bottom:40px">
      ${media}
      <div class="exhead"><h1>${esc(e.ru)}</h1>${e.en ? `<div class="en">${esc(e.en)}</div>` : ''}
        <div class="tags">${e.g ? `<span class="chip">${esc(e.g)}</span>` : ''}${e.eq && e.eq !== '—' ? `<span class="chip">${esc(e.eq)}</span>` : ''}${e.own ? `<span class="chip acc">Упражнение тренера</span>` : ''}</div></div>
      ${today}
      ${tech ? `${UI.sec('Акценты тренера')}<div class="txsec"><p>${esc(tech)}</p></div>` : ''}
      ${steps ? `${UI.sec('Техника по шагам')}<ol class="steps">${steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>` : ''}
      ${pmBox}
      ${UI.sec('Мои результаты')}
      ${hist.length ? `<div class="list top">${hist.map(h => UI.row({title:`<span class="num">${h.text}</span>`, sub:esc(cap1(dLong(h.date))), go:'#/train/day/' + h.date})).join('')}</div>`
        : `<p class="note-s">Вы ещё не выполняли это упражнение в программе.</p>`}
      ${talk}
    </div>`};
});
