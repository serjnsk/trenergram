/* ═══════════ «НАЗНАЧИТЬ КЛИЕНТУ» И «ДОБАВИТЬ КЛИЕНТУ» — окна кабинета (CON-9, TPL-2) ═══════════
   Программа из базы встаёт клиенту или группе по циклу с даты старта
   (progAssign в data.js): занятые дни пропускаются или заменяются — одно
   решение на все. Тренировка, блок или упражнение из базы встают в выбранный
   день: открывается конструктор этого дня, элемент уже в нём; если там уже
   есть тренировка, готовую тренировку можно добавить к ней или поставить
   вместо неё. Окно своё, а не общее #ov: конструктор (trainer.js) общего окна
   страниц не подключает. Подключается после ui.js или trainer.js. */
const amDay = d => RU[dowMon(d)].toLowerCase() + ', ' + D(d).getDate() + ' ' + MONTHS[D(d).getMonth()];
const amWhoOpts = cur => [...GRPS, ...CLIENTS].map(c =>
  `<option value="${c.id}" ${c.id === cur ? 'selected' : ''}>${isGrp(c.id) ? 'Группа · ' : ''}${esc(c.n)}</option>`).join('');

function amOpen(title, draw, bind){
  const old = document.getElementById('amov'); if(old) old.remove();
  const ov = document.createElement('div'); ov.className = 'ov on'; ov.id = 'amov';
  const onKey = e => { if(e.key === 'Escape') close() };
  const close = () => { ov.remove(); document.removeEventListener('keydown', onKey) };
  document.addEventListener('keydown', onKey);
  ov.addEventListener('click', e => { if(e.target === ov || e.target.closest('[data-amx]')) close() });
  const paint = () => { const {body, foot} = draw();
    ov.innerHTML = `<div class="md am" role="dialog" aria-modal="true" aria-label="${esc(title)}">
      <div class="mdh"><span class="dot"></span><h2>${esc(title)}</h2><button class="cls" data-amx aria-label="Закрыть">✕</button></div>
      <div class="mdb">${body}</div><div class="mdf">${foot}</div></div>`;
    bind(ov, paint, close) };
  document.body.appendChild(ov); paint();
}

/* Программа → клиенту или группе. tid — со страницы программы, wid — из карточки клиента. */
function assignProgModal({tid = null, wid = null, onDone = null} = {}){
  const progs = tplLive('программа');
  const A = {tid: tid || (progs[0] || {}).id, wid: wid || (CLIENTS[0] || {}).id, replace: false, pub: true};
  A.start = progAssignStart(A.wid);
  let cur = null;
  amOpen(wid ? 'Назначить программу · ' + who(wid).n : 'Назначить клиенту', () => {
    const t = tplById(A.tid), G = isGrp(A.wid) ? grp(A.wid) : null;
    const rows = t ? progLayout(t, A.wid, A.start) : [], busy = rows.filter(r => r.busy);
    const put = rows.filter(r => A.replace || !r.busy), n = put.length;
    const mem = G && rows.length ? groupConflicts(G, rows.map(r => r.date)).length : 0;
    const rb = rows.length ? progRestBusy(t, A.wid, A.start) : 0;
    cur = {t, n};
    const body = `
      ${tid ? `<div class="mdt"><b>${esc(t.title)}</b><s>${esc(progCycText(t))}</s></div>`
        : `<div class="wz-row"><label class="wz-f"><span>Программа</span><select id="am-t">${progs.map(p =>
            `<option value="${p.id}" ${p.id === A.tid ? 'selected' : ''} data-sub="${esc(progCycText(p) + (p.own ? '' : ' · общая база'))}">${esc(p.title)}</option>`).join('')}</select></label></div>`}
      <div class="wz-row">
        ${wid ? '' : `<label class="wz-f"><span>Кому</span><select id="am-w">${amWhoOpts(A.wid)}</select></label>`}
        <label class="wz-f"><span>Начать с</span><input type="date" id="am-d" value="${A.start}"></label>
      </div>
      ${!rows.length ? `<p class="am-sum">В цикле программы нет тренировок — назначать нечего.</p>`
        : `<p class="am-sum">Встанет <b>${n} ${plural(n, 'тренировка', 'тренировки', 'тренировок')}</b>${n ? `: с ${amDay(put[0].date)} по ${amDay(put[n - 1].date)}` : ''}. Дни отдыха остаются свободными.</p>`}
      ${busy.length ? `<div class="wz-h">${G ? 'У группы уже' : 'Уже'} ${plural(busy.length, 'занят', 'заняты', 'заняты')} ${busy.length} ${plural(busy.length, 'день', 'дня', 'дней')}</div>
        <div class="wz-tabs" role="radiogroup" aria-label="Занятые дни">
          <button role="radio" aria-checked="${!A.replace}" data-amr="0" class="${A.replace ? '' : 'on'}">Пропустить</button>
          <button role="radio" aria-checked="${A.replace}" data-amr="1" class="${A.replace ? 'on' : ''}">Заменить</button></div>
        <div class="wz-list am-busy">${busy.slice(0, 4).map(r => `<div class="wz-it static"><span class="t"><b>${amDay(r.date)}</b>
          <s>${A.replace ? `«${esc(r.busy)}» → «${esc(r.tpl.title)}»` : `останется «${esc(r.busy)}»`}</s></span></div>`).join('')}
          ${busy.length > 4 ? `<div class="wz-it static"><span class="t"><s>и ещё ${busy.length - 4}</s></span></div>` : ''}</div>` : ''}
      ${rb ? `<p class="am-sum">В ${rb} ${plural(rb, 'день', 'дня', 'дней')} отдыха программы уже стоят тренировки — они останутся.</p>` : ''}
      ${mem ? `<p class="am-sum">У участников в эти дни ${mem} ${plural(mem, 'своя тренировка', 'своих тренировки', 'своих тренировок')} — ${A.replace ? 'заменятся тренировками группы' : 'останутся у них'}.</p>` : ''}
      ${n ? `<label class="wz-pub"><input type="checkbox" id="am-pub" ${A.pub ? 'checked' : ''}> ${G ? 'Участники видят сразу' : 'Клиент видит сразу'}. Иначе тренировки встанут черновиками.</label>` : ''}`;
    const foot = `<span class="sp"></span><button class="btn gh" data-amx>Отмена</button><button class="btn" id="am-go" ${n ? '' : 'disabled'}>Назначить</button>`;
    return {body, foot};
  }, (ov, paint, close) => {
    const q = s => ov.querySelector(s);
    if(q('#am-t')) q('#am-t').onchange = e => { A.tid = e.target.value; paint() };
    if(q('#am-w')) q('#am-w').onchange = e => { A.wid = e.target.value; A.start = progAssignStart(A.wid); paint() };
    q('#am-d').onchange = e => { if(e.target.value){ A.start = e.target.value; paint() } };
    ov.querySelectorAll('[data-amr]').forEach(b => b.onclick = () => { A.replace = b.dataset.amr === '1'; paint() });
    if(q('#am-pub')) q('#am-pub').onchange = e => { A.pub = e.target.checked };
    q('#am-go').onclick = () => {
      const {t} = cur, w = who(A.wid), res = progAssign(t, A.wid, A.start, {replace: A.replace, pub: A.pub});
      close();
      toast('«' + t.title + '» — ' + (isGrp(A.wid) ? 'группе ' : '') + w.n + ': ' + res.n + ' ' + plural(res.n, 'тренировка', 'тренировки', 'тренировок') + ' с ' + amDay(res.first)
        + (res.skip ? ', занятые дни пропущены' : '') + (A.pub ? '' : ' — черновиками'));
      if(onDone) onDone(res);
    };
  });
}

/* Тренировка, блок или упражнение → в день клиента: конструктор этого дня. */
function toClientModal(kind, id){
  const t = kind === 'tpl' ? tplById(id) : null, e = kind === 'ex' ? byId(id) : null;
  if(!t && !e) return;
  const isW = !!t && t.lvl === 'тренировка', name = t ? t.title : e.ru;
  const A = {wid: (CLIENTS[0] || {}).id, mode: 'add'};
  A.date = progAssignStart(A.wid);
  amOpen(isW ? 'Добавить клиенту' : 'В тренировку', () => {
    const busy = subjDayAt(A.wid, A.date), G = isGrp(A.wid);
    const body = `
      <div class="mdt"><b>${esc(name)}</b><s>${isW ? 'Тренировка из базы' : t ? 'Блок из базы' : 'Упражнение'}</s></div>
      <div class="wz-row">
        <label class="wz-f"><span>Кому</span><select id="am-w">${amWhoOpts(A.wid)}</select></label>
        <label class="wz-f"><span>День</span><input type="date" id="am-d" value="${A.date}"></label>
      </div>
      ${!busy ? `<p class="am-sum">${amDay(A.date)} — свободный день${G ? ' группы' : ''}: ${isW ? 'тренировка встанет в него' : 'откроется новая тренировка'}.</p>`
        : isW ? `<p class="am-sum">На ${amDay(A.date)} уже стоит «${esc(busy)}». Добавить тренировку к ней или поставить вместо неё?</p>
          <div class="wz-tabs" role="radiogroup" aria-label="Что сделать с тренировкой дня">
            <button role="radio" aria-checked="${A.mode === 'add'}" data-amm="add" class="${A.mode === 'add' ? 'on' : ''}">Добавить к ней</button>
            <button role="radio" aria-checked="${A.mode === 'replace'}" data-amm="replace" class="${A.mode === 'replace' ? 'on' : ''}">Заменить</button></div>`
        : `<p class="am-sum">На ${amDay(A.date)} уже стоит «${esc(busy)}» — ${t ? 'блок добавится' : 'упражнение добавится'} к ней.</p>`}
      <p class="am-sum muted">Откроется конструктор этого дня. Клиент увидит тренировку, когда вы её опубликуете.</p>`;
    const foot = `<span class="sp"></span><button class="btn gh" data-amx>Отмена</button><button class="btn" id="am-go">Открыть день</button>`;
    return {body, foot};
  }, (ov, paint) => {
    const q = s => ov.querySelector(s);
    q('#am-w').onchange = ev => { A.wid = ev.target.value; A.date = progAssignStart(A.wid); paint() };
    q('#am-d').onchange = ev => { if(ev.target.value){ A.date = ev.target.value; paint() } };
    ov.querySelectorAll('[data-amm]').forEach(b => b.onclick = () => { A.mode = b.dataset.amm; paint() });
    q('#am-go').onclick = () => {
      const subj = (isGrp(A.wid) ? 'group=' : 'client=') + encodeURIComponent(A.wid) + '&date=' + A.date;
      location.href = 'constructor.html?' + subj + (t ? '&addtpl=' + encodeURIComponent(t.id) + '&tmode=' + A.mode : '&addex=' + encodeURIComponent(e.id));
    };
  });
}
