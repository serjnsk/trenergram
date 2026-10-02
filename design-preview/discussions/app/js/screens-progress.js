/* ═══════════════════════════════════════════════════════════════
   2. ПРОГРЕСС — максимумы, замеры, регулярность (PRO-2, PRO-4, PRO-6)
   Те же данные, что тренер видит в карточке клиента, — с другой стороны.
   ═══════════════════════════════════════════════════════════════ */
const MS = {metric:'w'};
const METRICS = [['w','Вес','кг'],['waist','Талия','см'],['chest','Грудь','см'],['hips','Бёдра','см'],['fat','Жир','%']];
const deltaHTML = (d, unit = '', goodUp = true) => {
  if(d == null || isNaN(d)) return '';
  const r = Math.round(d * 10) / 10; if(!r) return `<span class="delta eq">±0${unit ? NB + unit : ''}</span>`;
  const up = r > 0, good = goodUp ? up : !up;
  return `<span class="delta ${good ? 'up' : 'dn'}">${up ? '+' : '−'}${fmtN(Math.abs(r))}${unit ? NB + unit : ''}</span>`;
};

/* Регулярность за 4 недели: квадрат на день, цвет — статус. */
function consistency(){
  const start = addDays(weekStart(TODAY), -21);
  const cells = Array.from({length:28}, (_, i) => { const d = addDays(start, i), st = Model.status(d);
    const cls = d > TODAY ? (st.st === 'planned' ? 'fut plan' : 'fut') : st.st;
    return `<i class="${cls}${d === TODAY ? ' td' : ''}" title="${esc(dLong(d))}"></i>` });
  return `<div class="cons">${RU.map(r => `<span>${r}</span>`).join('')}${cells.join('')}</div>
    <div class="legend">
      <span><i class="cc done"></i>выполнена</span><span><i class="cc part"></i>частично</span><span><i class="cc prog"></i>в процессе</span>
      <span><i class="cc miss"></i>без отметок</span><span><i class="cc rest"></i>отдых</span></div>`;
}
function streak(){
  let n = 0;
  for(let i = 0; i < 90; i++){
    const d = addDays(TODAY, -i), st = Model.status(d);
    if(st.st === 'rest' || st.st === 'none') continue;
    const fin = st.st === 'done' || st.st === 'part';          /* серия — выполненные, в том числе частично */
    if(i === 0 && !fin) continue;
    if(fin) n++; else break;
  }
  return n;
}
function periodStats(days){
  /* done — выполненные (полностью и частично), part — из них частично */
  let plan = 0, done = 0, part = 0;
  for(let i = 0; i < days; i++){ const d = addDays(TODAY, -i), st = Model.status(d);
    if(['done','part','prog','miss'].includes(st.st)){ plan++; if(st.st !== 'prog' && st.st !== 'miss') done++; if(st.st === 'part') part++ } }
  return {plan, done, part};
}
/* Рекорды: каждый рост максимума в истории. */
function records(limit = 3){
  const out = [];
  Model.pmKeys().forEach(k => { const h = Model.pmHist(k).filter(x => x.date);
    for(let i = 1; i < h.length; i++) if(h[i].v > h[i - 1].v) out.push({k, v:h[i].v, d:h[i].v - h[i - 1].v, date:h[i].date, by:h[i].by}) });
  return out.sort((a, b) => a.date < b.date ? 1 : -1).slice(0, limit);
}
const pmOrder = keys => { const pri = ['squat','dead','bench','press','clean','snatch','jerk','fsquat']; return keys.sort((a, b) => (pri.indexOf(a) + 1 || 99) - (pri.indexOf(b) + 1 || 99)) };

/* ═══════════ 2.1 ОБЗОР ═══════════ */
route('/progress', () => {
  const me = Model.me();
  if(!me) return {tab:'progress', cls:'grey sx', html:UI.lt({title:'Прогресс'})};
  const wk = periodStats(dowMon(TODAY) + 1), mo = periodStats(28), sk = streak();
  const M = Model.meas(), m0 = M[0], m1 = M[1];
  const keys = pmOrder(Model.pmKeys()), pm = Model.pm();
  const recs = records(3);
  const noProg = !Model.pid();
  return {tab:'progress', cls:'grey sx', html:`${UI.lt({title:'Прогресс', sub:'Максимумы, замеры и регулярность'})}
    <div class="body">
      <section class="sect"><div class="kpis">
        <div class="kpi"><div class="k">Неделя</div><div class="v num">${wk.done}<small>/ ${wk.plan}</small></div><div class="d">тренировок</div></div>
        <div class="kpi"><div class="k">Серия</div><div class="v num">${sk}</div><div class="d">подряд</div></div>
        <div class="kpi"><div class="k">Вес</div><div class="v num">${m0 && m0.w ? fmtN(m0.w) + '<small>кг</small>' : '—'}</div><div class="d">${m0 && m1 && m0.w && m1.w ? deltaHTML(m0.w - m1.w, 'кг', false) : m0 ? dShort(m0.date) : 'нет замеров'}</div></div>
      </div></section>
      ${noProg ? '' : `<section class="sect">${UI.sec('Регулярность · 4 недели')}<div class="card">${consistency()}
        <p class="note-s">За 4 недели выполнено ${mo.done} из ${mo.plan} ${plural(mo.plan, 'тренировки', 'тренировок', 'тренировок')}${mo.part ? `, из них ${mo.part} — частично` : ''}.</p></div></section>`}
      <section class="sect">${UI.sec('Максимумы · 1ПМ', keys.length ? 'Все' : '', '#/progress/pm')}
      ${keys.length ? `<div class="list">${keys.slice(0, 4).map(k => { const h = Model.pmHist(k), prev = h.length > 1 ? h[h.length - 2].v : null;
          return UI.row({title:esc(Model.pmName(k)), sub: prev != null ? deltaHTML(pm[k] - prev, 'кг') + ' с ' + (h[h.length - 2].date ? dShort(h[h.length - 2].date) : 'прошлого') : 'от него считаются веса', v:`<b class="num">${fmtN(pm[k])}</b> кг`, go:'#/progress/pm/' + k}) }).join('')}</div>`
        : `<button class="tip acc" data-go="#/progress/pm"><span class="i">${ICO.bolt}</span><span><b>Впишите свои максимумы</b><s>Тренер задаёт вес в процентах — приложение посчитает килограммы</s></span></button>`}</section>
      ${recs.length ? `<section class="sect">${UI.sec('Последние рекорды')}<div class="list">${recs.map(r => UI.row({ico:ICO.star, title:esc(Model.pmName(r.k)) + ' · ' + kgS(r.v), sub:esc(cap1(dDM(r.date))) + (r.by === 'client' ? ' · внесли вы' : ''), v:deltaHTML(r.d, 'кг'), go:'#/progress/pm/' + r.k})).join('')}</div></section>` : ''}
      <section class="sect">${UI.sec('Замеры', 'Все', '#/progress/meas')}
      ${m0 ? `<div class="list">${UI.row({ico:ICO.scale, title:`Вес ${fmtN(m0.w)} кг`, sub:esc(cap1(dDM(m0.date))) + ' · талия ' + m0.waist + ' · грудь ' + m0.chest + ' · бёдра ' + m0.hips, go:'#/progress/meas'})}</div>`
        : `<button class="tip" data-act="measNew"><span class="i">${ICO.plus}</span><span><b>Добавить первый замер</b><s>Вес и объёмы — тренер увидит динамику</s></span></button>`}</section>
    </div>`};
});

/* ═══════════ 2.2 МАКСИМУМЫ ═══════════ */
route('/progress/pm', () => {
  const keys = pmOrder(Model.pmKeys()), pm = Model.pm();
  const rows = keys.map(k => { const h = Model.pmHist(k), last = h[h.length - 1] || {};
    return UI.row({title:esc(Model.pmName(k)), sub:(last.date ? 'обновлён ' + dShort(last.date) : 'внёс тренер') + (last.by === 'client' ? ' · внесли вы' : '') + (last.p ? ' · ' + UI.pend(1) : ''),
      v:`<b class="num">${fmtN(pm[k])}</b> кг`, go:'#/progress/pm/' + k}) }).join('');
  return {tab:'progress', cls:'grey sx', html:`${UI.nav({title:'Максимумы', back:'#/progress', line:true})}
    <div class="body pad-foot">
      <section class="sect"><p class="note-s lead">1ПМ — вес на один повтор на пределе. От него тренер задаёт проценты, а приложение считает килограммы в ваших тренировках.</p>
      ${keys.length ? `<div class="list">${rows}</div>` : UI.empty({ico:ICO.dumb, title:'Максимумов пока нет', text:'Впишите хотя бы присед, становую и жим — тренер сможет задавать веса в процентах.'})}</section>
    </div>
    <div class="foot"><button class="btn" data-act="pmPick">${ICO.plus}Добавить максимум</button></div>`};
});
/* 2.2.1 Выбор упражнения — только упражнения с весом. */
function openPickSheet(){
  const have = new Set(Model.pmKeys());
  const pool = EX.filter(e => (e.u || []).includes('кг')).map(e => ({e, k:pmKey(e)})).filter((x, i, a) => x.k && !have.has(x.k) && a.findIndex(y => y.k === x.k) === i);
  const list = q => pool.filter(x => !q || norm(x.e.ru + ' ' + x.e.en).includes(norm(q))).slice(0, 30)
    .map(x => UI.row({pic:UI.thumb(x.e, 'th2'), title:esc(x.e.ru), sub:esc(x.e.g + (x.e.eq && x.e.eq !== '—' ? ' · ' + x.e.eq : '')), act:'pmPickOne', data:`data-k="${x.k}"`})).join('') || `<p class="plan">Ничего не нашлось</p>`;
  Sheet.open(`<div class="shh"><span class="t"><b>Добавить максимум</b><s>упражнения с весом</s></span><button class="ib" data-act="sheetClose">${ICO.x}</button></div>
    <label class="search">${ICO.search}<input id="pk-q" placeholder="Поиск упражнения"></label>
    <div class="list" id="pk-l">${list('')}</div>`, {mount(sh){ const i = $('#pk-q', sh); i.oninput = () => { $('#pk-l', sh).innerHTML = list(i.value) } }});
}
ACT.pmPick = () => openPickSheet();
ACT.pmPickOne = el => { Sheet.close(true); openPmSheet(el.dataset.k) };

/* ═══════════ 2.3 МАКСИМУМ УПРАЖНЕНИЯ ═══════════ */
route('/progress/pm/:k', p => {
  const k = p.k, pm = Model.pm(), v = pm[k], h = Model.pmHist(k);
  const e = byId(k);
  const series = h.filter(x => x.date).map(x => [x.date, x.v]);
  const prev = h.length > 1 ? h[h.length - 2] : null;
  const pctRow = v ? [70, 80, 90].map(pc => `<div class="kpi"><div class="k">${pc} %</div><div class="v num">${fmtN(Math.round(v * pc / 100 / 2.5) * 2.5)}<small>кг</small></div></div>`).join('') : '';
  return {tab:'progress', cls:'grey sx', html:`${UI.nav({title:Model.pmName(k), sub:'1ПМ', back:'#/progress/pm', line:true})}
    <div class="body pad-foot">
      <section class="sect"><div class="bigv"><b class="num">${v ? fmtN(v) : '—'}<small>кг</small></b>
        <div class="d">${prev ? deltaHTML(v - prev.v, 'кг') + ' с ' + (prev.date ? dDM(prev.date) : 'прошлой записи') : 'Первая запись'}${h.length && h[h.length - 1].by === 'client' ? ` <span class="by">внесли вы</span>` : ''}</div></div>
      <div class="chart">${lineChart(series, 'кг')}</div></section>
      ${v ? `<section class="sect">${UI.sec('Веса от максимума')}<div class="kpis">${pctRow}</div>
        <p class="note-s">Так приложение считает вес, когда тренер пишет проценты. Округление — до 2,5 кг.</p></section>` : ''}
      <section class="sect">${UI.sec('История')}
      <div class="list">${[...h].reverse().map(x => UI.row({title:`<span class="num">${kgS(x.v)}</span>`, sub:(x.date ? esc(cap1(dDM(x.date))) : 'дата не записана') + ' · ' + (x.by === 'client' ? 'внесли вы' : 'внёс тренер') + (x.p ? ' · ' + UI.pend(1) : '')})).join('')}</div>
      ${e ? `<div class="list">${UI.row({ico:ICO.dumb, title:'Упражнение', sub:'Техника и мои результаты', go:'#/ex/' + e.id})}</div>` : ''}</section>
    </div>
    <div class="foot"><button class="btn" data-act="pmUpd" data-k="${k}">Обновить максимум</button></div>`};
});
ACT.pmUpd = el => openPmSheet(el.dataset.k, {title:'Обновить максимум'});

/* ═══════════ 2.4 ЗАМЕРЫ ═══════════ */
route('/progress/meas', () => {
  const M = Model.meas(), [key, name, unit] = METRICS.find(m => m[0] === MS.metric);
  const series = [...M].reverse().filter(m => m[key] != null).map(m => [m.date, m[key]]);
  const rows = M.map((m, i) => { const nx = M[i + 1];
    const others = METRICS.filter(x => x[0] !== key && m[x[0]] != null).map(x => x[1].toLowerCase() + ' ' + fmtN(m[x[0]])).join(' · ');
    return UI.row({title:esc(cap1(dDM(m.date))), sub:esc(others) + (m.by === 'client' ? ' · внесли вы' : '') + (m.p ? ' · ' + UI.pend(1) : ''),
      v:`<b class="num">${m[key] != null ? fmtN(m[key]) : '—'}</b> ${unit}<br>${nx && m[key] != null && nx[key] != null ? deltaHTML(m[key] - nx[key], '', key === 'chest') : ''}`}) }).join('');
  return {tab:'progress', cls:'grey sx', html:`${UI.nav({title:'Замеры', back:'#/progress', line:true})}
    <div class="body pad-foot">
      <section class="sect"><div class="pills">${METRICS.map(([k, n]) => `<button class="${k === MS.metric ? 'on' : ''}" data-act="metric" data-k="${k}">${n}</button>`).join('')}</div>
      <div class="chart">${lineChart(series, unit)}</div></section>
      ${M.length ? `<section class="sect">${UI.sec('Все замеры')}<div class="list">${rows}</div></section>` : `<section class="sect">${UI.empty({ico:ICO.scale, title:'Замеров пока нет', text:'Вес и объёмы раз в несколько недель — тренер увидит динамику.'})}</section>`}
    </div>
    <div class="foot"><button class="btn" data-act="measNew">${ICO.plus}Добавить замер</button></div>`};
});
ACT.metric = el => { MS.metric = el.dataset.k; App.refresh() };

/* 2.4.1 Новый замер */
function openMeasSheet(){
  const last = Model.meas()[0] || {};
  Sheet.open(`<div class="shh"><span class="t"><b>Новый замер</b><s>тренер увидит его в вашей карточке</s></span><button class="ib" data-act="sheetClose">${ICO.x}</button></div>
    <label class="fl" style="margin-top:6px"><span class="k">Дата</span><input id="ms-d" type="date" value="${TODAY}" max="${TODAY}"></label>
    <div class="fields">${METRICS.map(([k, n, u]) => fieldHTML('ms-' + k, n, '', u, 'decimal', last[k] != null ? fmtN(last[k]) : '')).join('')}</div>
    <p class="plan" style="font-size:13.5px;color:var(--tx3);margin:0 0 12px">Серым — прошлый замер. Заполните, что измерили; остальное можно пропустить.</p>
    <button class="btn" id="ms-s">Сохранить замер</button>`, {mount(sh){
      setTimeout(() => $('#ms-w', sh).focus(), 280);
      $('#ms-s', sh).onclick = () => { const rec = {date:$('#ms-d', sh).value || TODAY};
        METRICS.forEach(([k]) => { const v = numOf($('#ms-' + k, sh).value); if(v != null) rec[k] = v });
        if(Object.keys(rec).length < 2){ $('#ms-w', sh).focus(); return }
        (CS.meas[CS.cid] ||= []).push({...rec, ...pendMark()}); saveCS(); Sheet.close(); App.refresh();
        toast(off() ? 'Замер сохранён — уйдёт тренеру, когда появится сеть' : 'Замер сохранён') };
    }});
}
ACT.measNew = () => openMeasSheet();
Object.assign(DEMO_SHEET, {
  pick: () => { Nav.go('#/progress/pm'); setTimeout(openPickSheet, 80) },
  meas: () => { Nav.go('#/progress/meas'); setTimeout(openMeasSheet, 80) },
});
