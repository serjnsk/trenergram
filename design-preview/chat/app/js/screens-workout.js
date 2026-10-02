/* ═══════════════════════════════════════════════════════════════
   1.3 ТРЕНИРОВКА — главный экран приложения (CLI-1, CLI-2, COM-1…4)

   Основа — архивный экран «01 · Список»: серая лента, блоки белыми
   полосами, подход отмечается одним касанием, касание по цифрам —
   фактический результат. Приложение не указывает, что делать дальше:
   порядок в зале выбирает атлет, метка «сейчас» идёт за ним.
   ═══════════════════════════════════════════════════════════════ */
const WS = {date:null, last:{}};
const unitPart = u => u.part ? u.part.key : u.block.key;
const isDone = (r, key) => !!(r && r.u && r.u[key] && r.u[key].d);
/* Метка «сейчас» идёт за атлетом: остаётся в упражнении, где он отмечает, а
   когда оно закончено — переходит к следующему по порядку шагу, а не назад к
   пропущенному в начале тренировки. */
function curUnit(W, r, date){
  const left = W.units.filter(u => !isDone(r, u.key));
  if(!left.length) return null;
  const last = WS.last[date];
  if(last){
    const same = left.find(u => unitPart(u) === last); if(same) return same;
    let at = -1; W.units.forEach((u, i) => { if(unitPart(u) === last) at = i });
    const next = at >= 0 ? W.units.slice(at + 1).find(u => !isDone(r, u.key)) : null; if(next) return next;
  }
  return left[0];
}
/* Метка «сейчас» у строки, которая отмечается целиком (без подходов). */
const nowCls = (C, key) => C.mode === 'sets' && C.cur && C.cur.key === key ? ' now' : '';
const chkBtn = (done, act, key, label = 'Отметить') => `<button class="chk ${done ? 'done' : ''}" data-act="${act}" data-k="${esc(key)}" role="checkbox" aria-checked="${done}" aria-label="${esc(label)}">${ICO.chk}</button>`;

/* ─── прогресс по блокам ───
   Блок выполнен, когда отмечены все его шаги: подходы, круги, строки,
   результат комплекса или отметка блока текстом. Своих единиц у блока нет. */
function blockProg(W, r){
  return W.blocks.map(B => { const us = W.units.filter(u => u.block === B); return {B, n:us.length, k:us.filter(u => isDone(r, u.key)).length} }).filter(x => x.n);
}
const blkWord = n => plural(n, 'блока', 'блоков', 'блоков');

/* ─── подходы таблицей ───
   Как в журналах силовых: подход · кг · повт · отметка. Единицы — в заголовке
   колонок, в строках только числа, колонки одинаковы у всех подходов.
   Набор колонок — по показателю упражнения: время, дистанция, калории —
   своя колонка, без пустых «кг» и «повт»; текстовое задание — одна. */
function setCols(P){
  const S = P.sets, k = S[0].kind, reps = S.some(s => s.reps != null);
  if(k === 'kg') return reps ? ['kg', 'r'] : ['kg'];
  if(k === 'time') return reps ? ['t', 'r'] : ['t'];
  if(k === 'dist') return ['m'];
  if(k === 'cal') return ['cal'];
  if(k === 'other') return ['v'];
  return reps ? ['r'] : ['f'];
}
const colHead = (c, P) => ({kg:'кг', r:'повт.', t:'время', m:'м', cal:'кал', v:P.load.unit || 'результат', f:'задание'})[c];
/* Значение ячейки: факт, если записан, иначе назначенное. ed — факт отличается от плана. */
function setCell(c, s, x){
  /* a — назначение на момент отметки: правка тренера после неё не делает факт «другим» */
  const f = x || {}, a = f.a || {kg:s.kg, r:s.reps, v:s.val};
  s = {...s, kg:a.kg, reps:a.r, val:a.v};
  const kg = f.kg != null ? f.kg : s.kg, reps = f.r != null ? f.r : s.reps, v = f.v != null ? f.v : s.val;
  if(c === 'kg') return kg == null ? {t:'<span class="soft">от 1ПМ</span>', ed:false, a:'вес от 1ПМ'}
    : {t:fmtN(kg) + (s.kgHi != null && f.kg == null ? '–' + fmtN(s.kgHi) : ''), ed:f.kg != null && f.kg !== s.kg, a:fmtN(kg) + ' кг'};
  if(c === 'r') return {t:reps != null ? String(reps) : '—', ed:f.r != null && f.r !== s.reps, a:reps != null ? reps + ' повт' : ''};
  if(c === 't') return {t:v != null ? mmss(v) : '—', ed:f.v != null && f.v !== s.val, a:v != null ? mmss(v) : ''};
  if(c === 'f') return {t:`<span class="soft">${esc(s.free || 'как назначено')}</span>`, ed:false, a:s.free || ''};
  const u = c === 'm' ? ' м' : c === 'cal' ? ' кал' : '';
  return {t:v != null ? fmtN(v) : '—', ed:f.v != null && f.v !== s.val, a:v != null ? fmtN(v) + u : ''};
}
function setsHTML(P, C){
  const {r, cur} = C, cols = setCols(P);
  const head = `<div class="sth" aria-hidden="true"><span>№</span>${cols.map(c => `<span>${esc(colHead(c, P))}</span>`).join('')}<span></span></div>`;
  const rows = P.sets.map(s => { const x = r && r.u[s.key], d = isDone(r, s.key), now = cur && cur.key === s.key;
    const cells = cols.map(c => setCell(c, s, x)), ed = cells.some(z => z.ed);
    const lab = `Подход ${s.n}: ${cells.map(z => z.a).filter(Boolean).join(', ')}${ed ? ', записан факт' : ''} — изменить`;
    return `<div class="set${d ? ' done' : ''}${now ? ' now' : ''}" data-act="setOpen" data-k="${esc(s.key)}" role="button" tabindex="0" aria-label="${esc(lab)}">
      <span class="n">${s.n}${x && x.p ? UI.pend(1, '') : ''}</span>${cells.map(z => `<span class="c${z.ed ? ' ed' : ''}"><span class="v">${z.t}</span>${z.ed ? '<span class="tag">факт</span>' : ''}</span>`).join('')}
      ${chkBtn(d, 'unit', s.key, `Подход ${s.n} выполнен`)}</div>` }).join('');
  return `<div class="sets${cols[0] === 'f' ? ' wide' : ''}" style="--n:${cols.length}">${head}${rows}</div>`;   /* текст задания — во всю ширину */
}

/* ─── вопрос тренеру: «Спросить» внизу карточки упражнения и в шапке блока ───
   Всегда «Спросить»: чат с готовым вложением этого задания (постоянный ID),
   на последнем сообщении о нём, если оно есть. Исключение одно — тренер
   ответил по заданию, а клиент ещё не прочитал: оранжевое «Ответ» с точкой,
   касание открывает чат прямо на ответе. */
const askAttrs = (k, date, id) => `data-act="ask" data-k="${k}" data-d="${date}" data-id="${esc(id || '')}"`;
function askBtn(k, date, id, what){
  const n = Model.askCount(date, id), rep = Model.askReply(date, id);
  const nm = /^«.*»$/.test(what) ? what : '«' + what + '»', about = (k === 'block' ? 'о блоке ' : 'об упражнении ') + nm;
  if(rep) return `<button class="qa rep" data-act="askRead" data-mid="${esc(rep.id)}" aria-label="${esc('Непрочитанный ответ тренера ' + about)}"><span class="qi">${ICO.chat}<i class="qd" aria-hidden="true"></i></span>Ответ</button>`;
  const lab = 'Спросить тренера ' + about + (n ? '. В чате ' + n + ' ' + plural(n, 'сообщение', 'сообщения', 'сообщений') : '');
  return `<button class="qa" ${askAttrs(k, date, id)} aria-label="${esc(lab)}"><span class="qi">${ICO.chat}</span>Спросить</button>`;
}
/* Низ карточки: слева «в прошлый раз» (факт из журнала, длинный результат
   переносится), справа «Спросить». */
function exFoot(P, date){
  const lf = P.exId ? Model.lastFact(P.exId, date) : null;
  return `<div class="exf">${lf ? `<span class="exprev">${ICO.hist}<span>В прошлый раз: <b>${lf.text}</b></span></span>` : '<span></span>'}${askBtn('ex', date, P.key, P.e.ru)}</div>`;
}

/* Название со стрелкой: стрелка не уезжает на отдельную строку, а держится за последнее слово. */
const nmT = t => { const s = esc(t), i = s.lastIndexOf(' ');
  return `<b>${i > 0 ? s.slice(0, i + 1) : ''}<span class="nw">${i > 0 ? s.slice(i + 1) : s}<span class="go">${ICO.chev}</span></span></b>` };

/* ─── упражнение ───
   С подходами: общая галочка у названия отмечает все подходы сразу (пусто /
   часть / все), подходы — своими галочками в строках ниже. Без схемы —
   одна галочка у названия. Название открывает технику. */
function exHTML(P, C){
  const {r, date, mode} = C;
  const inSets = mode === 'sets';
  const withSets = inSets && P.sets.length;
  const solo = inSets && P.solo;
  const n = withSets ? P.sets.length : 0, k = withSets ? P.sets.filter(s => isDone(r, s.key)).length : 0;
  const multi = n > 1;
  const need = P.load.needPm ? `<button class="needpm" data-act="needPm" data-k="${P.load.pmKey}">${ICO.bolt}Указать 1ПМ — посчитаем вес</button>` : '';
  const all = multi ? `<button class="chk ${k === n ? 'done' : k ? 'part' : ''}" data-act="exAll" data-k="${esc(P.key)}" role="checkbox" aria-checked="${k === n ? 'true' : k ? 'mixed' : 'false'}"
      aria-label="${esc('Все подходы: ' + P.e.ru)}">${ICO.chk}</button>` : '';
  return `<div class="ex${solo ? nowCls(C, P.key) : ''}" data-part="${esc(P.key)}">
    <div class="exh">${UI.thumb(P.e)}
      <div class="exn"><div class="exr"><button class="nm" data-go="#/ex/${P.exId}?d=${date}&i=${encodeURIComponent(P.key)}">${nmT(P.e.ru)}</button></div>
        <s class="meta num">${mode === 'ss' ? esc(Model.roundTxt(P.round)) : (P.meta || '')}</s></div>
      ${all}${solo ? chkBtn(isDone(r, P.key), 'unit', P.key, 'Упражнение выполнено: ' + P.e.ru) : ''}
    </div>${need}${withSets ? setsHTML(P, C) : ''}${inSets ? exFoot(P, date) : ''}</div>`;
}
function txtexHTML(P, C, withChk){
  return `<div class="ex${nowCls(C, P.key)}" data-part="${esc(P.key)}"><div class="exh">${UI.thumb(P.e)}
    <div class="exn"><div class="exr"><button class="nm" data-go="#/ex/${P.exId}?d=${C.date}&i=${encodeURIComponent(P.key)}">${nmT(P.e.ru)}</button></div><s class="meta">${esc(P.txt)}</s></div>
    ${withChk ? chkBtn(isDone(C.r, P.key), 'unit', P.key, 'Упражнение выполнено: ' + P.e.ru) : ''}</div>${C.mode === 'sets' ? exFoot(P, C.date) : ''}</div>`;
}
function chainTxt(P){
  return P.parts.map(pp => { const L = pp.load, bits = [];
    if(pp.scheme) bits.push(esc(String(pp.scheme).replace(/(\d)\s*[xхХ]\s*/g, '$1×')));
    if(L.kind === 'kg') bits.push(L.needPm ? 'вес от 1ПМ' : `<span class="kg">${Model.kgTxt(L.kg, L.kgHi)}</span>`);
    else if(L.val != null) bits.push(Model.valTxt(L.kind, L.val, L.val2));
    return `<b>${esc(pp.name)}</b>${bits.length ? ` <em>(${bits.join(' · ')})</em>` : ''}` }).join('<span class="plus"> + </span>');
}
function partHTML(P, C){
  const withChk = C.mode === 'sets';
  if(P.type === 'ex') return exHTML(P, C);
  if(P.type === 'txtex') return txtexHTML(P, C, withChk);
  if(P.type === 'chain') return `<div class="ex${nowCls(C, P.key)}" data-part="${esc(P.key)}"><div class="exh"><span class="chain">${chainTxt(P)}</span>${withChk ? chkBtn(isDone(C.r, P.key), 'unit', P.key, 'Связка выполнена') : ''}</div></div>`;
  if(P.type === 'raw') return `<div class="ex raw${nowCls(C, P.key)}" data-part="${esc(P.key)}"><div class="exh"><span class="tx">${esc(P.text)}</span>${withChk ? chkBtn(isDone(C.r, P.key), 'unit', P.key, 'Строка выполнена') : ''}</div></div>`;
  if(P.type === 'ss'){
    /* прогресс кругов виден по самим кнопкам: отмеченные залиты, текущий обведён */
    const rs = C.mode === 'sets' ? `<div class="rounds"><span class="lb">Отмечайте круги по мере выполнения</span>${Array.from({length:P.rounds}, (_, i) => {
      const key = P.key + '.r' + (i + 1), d = isDone(C.r, key), now = C.cur && C.cur.key === key;
      return `<button class="${d ? 'done' : ''} ${now ? 'now' : ''}" data-act="round" data-k="${key}" role="checkbox" aria-checked="${d}" aria-label="Круг ${i + 1}">${d ? ICO.chk : ''}${i + 1}</button>` }).join('')}</div>` : '';
    return `<div class="ss"><div class="ssh">${esc(ssLabel({rounds:P.rounds, rest:P.rest}))}</div>
      ${P.members.map(m => partHTML(m, {...C, mode:'ss'})).join('')}${rs}</div>`;
  }
  return '';
}
/* Блок текстом — как написал тренер; список остаётся списком (CON-5). */
function textHTML(text){
  const out = []; let ul = [];
  const flush = () => { if(ul.length){ out.push('<ul>' + ul.map(l => `<li>${esc(l)}</li>`).join('') + '</ul>'); ul = [] } };
  String(text || '').split('\n').map(s => s.trim()).forEach(l => { if(!l){ flush(); return }
    if(LIST_RE.test(l)) ul.push(l.replace(LIST_RE, '')); else { flush(); out.push(`<p>${esc(l)}</p>`) } });
  flush(); return out.join('');
}
const RES_HINT = f => !f ? 'время или раунды' : f.k === 'AMRAP' ? 'раунды и повторы' : f.k === 'FOR TIME' ? 'время' : f.k === 'DEATH BY' ? 'последний полный раунд' : f.k === 'NFT' ? 'отметить выполненным' : 'сколько раундов выдержали';

function blockHTML(B, i, C){
  const bp = (C.bp || []).find(x => x.B === B), bdone = !!(bp && bp.k === bp.n);
  const typeCaps = B.type && B.title && B.title.toLowerCase().indexOf(B.type.toLowerCase()) !== 0 ? ' · ' + B.type : '';
  const title = B.title || B.type || 'Блок';
  let body = '';
  if(B.mode === 'text'){
    const key = B.key + '.t', d = isDone(C.r, key);
    body = `<div class="tgrp"><div class="txtb">${textHTML(B.text)}</div><div class="txtdone"><span>${d ? 'Выполнено' : 'Отметить блок выполненным'}</span>${chkBtn(d, 'unit', key, 'Блок выполнен')}</div></div>`;
  } else {
    body = B.parts.map(P => partHTML(P, {...C, mode:B.mode})).join('');
    if(B.mode === 'result'){
      const key = B.key + '.res', x = C.r && C.r.u[key], now = C.cur && C.cur.key === key;
      body += x && x.d
        ? `<button class="mres done" data-act="resOpen" data-b="${B.bi}"><span class="t"><span class="caps">Ваш результат</span><b class="num">${esc(x.t || 'выполнено')}</b>${x.p ? UI.pend(1) : ''}</span>${ICO.edit}</button>`
        : `<button class="mres ${now ? 'now' : ''}" data-act="resOpen" data-b="${B.bi}"><span class="t"><span class="caps">Записать результат</span><b>${RES_HINT(B.fmt)}</b></span>${ICO.plus}</button>`;
      body = `<div class="cgrp">${body}</div>`;               /* комплекс — одно задание: упражнения и результат вместе */
    }
  }
  return `<div class="blk" data-blk="${esc(B.key)}">
    <div class="blkh"><div class="k"><span class="caps">Блок ${i + 1}${esc(typeCaps)}</span>${bdone ? `<span class="bok">${ICO.chk}выполнен</span>` : ''}${askBtn('block', C.date, B.key, title)}</div><h3>${esc(title)}</h3>
      ${B.fmt ? `<div class="fmt"><b>${esc(fmtLabel(B.fmt))}</b><span>${esc(fmtDesc(B.fmt))}</span></div>` : ''}
      ${B.note ? `<div class="tnote"><div class="h">${ICO.chat}Тренер</div>${esc(B.note)}</div>` : ''}</div>
    <div class="blkb">${body}</div></div>`;
}

route('/train/day/:date', (p, q) => {
  const date = p.date; WS.date = date;
  const W = Model.workout(date), x = W.d;
  const navT = cap1(dRel(date)) || cap1(DOW_FULL[dowMon(date)]), navS = dDM(date);
  const talkBtn = `<button class="ib" data-act="ask" data-k="day" data-d="${date}" aria-label="Спросить тренера о тренировке">${ICO.chat}</button>`;
  if(x.kind !== 'work' || !W.blocks.length){
    return {tab:'*', tabs:false, html:`${UI.nav({title:navT, sub:navS, back:'#/train', line:true})}<div class="body">${UI.empty({ico:ICO.cal, title:'Тренировки на этот день нет', text:'Тренер её ещё не опубликовал или день — отдых.'})}</div>`};
  }
  const r = Model.res(date), real = Model.resReal(date);
  const n = W.units.length, k = W.units.filter(u => isDone(r, u.key)).length;
  const fin = !!(r && r.fin);
  const cur = real && !fin ? curUnit(W, r, date) : null;
  const G = x.g ? grp(x.g) : null;

  /* прогресс: отрезок на каждый блок; начатый блок заполнен частично */
  const bp = blockProg(W, r), nb = bp.length, kb = bp.filter(x => x.k === x.n).length;
  const bar = `<div class="bbar" aria-hidden="true">${bp.map(x => `<i class="${x.k === x.n ? 'on' : x.k ? 'part' : ''}"><b style="width:${Math.round(x.k / x.n * 100)}%"></b></i>`).join('')}</div>`;
  const vol = workVolume(W, r);
  const full = fin && k === n;
  const chip = fin ? (full ? `<span class="chip ok">${ICO.chk}Выполнена</span>` : `<span class="chip acc">Частично</span>`)
    : real ? `<span class="chip prog">В процессе</span>` : date < TODAY ? `<span class="chip">Без отметок</span>` : '';

  let banners = '';
  if(real && real.legacy && Object.keys(real.legacy).length && !real.legacyOk)
    banners += `<div class="wbanner">${ICO.info}<span class="t"><b>Тренер изменил тренировку после ваших отметок.</b> Прежние отметки сохранены, но к строкам новой версии не привязаны.</span><button data-act="chgOk">Понятно</button></div>`;
  else if(real && real.sig && real.sig !== x.sig && !fin)
    banners += `<div class="wbanner">${ICO.info}<span class="t"><b>Тренер обновил тренировку.</b> Ваши отметки остались у тех же упражнений; убранные из тренировки не показаны.</span><button data-act="chgOk">Понятно</button></div>`;
  if(!r && date > TODAY)
    banners += `<div class="wbanner info">${ICO.cal}<span class="t">Тренировка на ${esc(DOW_ACC[dowMon(date)])}, ${esc(dDM(date))}. Можно сделать раньше — отметки запишутся в этот день.</span></div>`;
  if(!r && date < TODAY)
    banners += `<div class="wbanner info">${ICO.info}<span class="t">Эта тренировка прошла без отметок. Сделали её — отметьте, тренер увидит.</span></div>`;
  if(real && JSON.stringify(real).includes('"p":1'))
    banners += `<div class="wbanner info">${ICO.clock}<span class="t">Отметки сохранены на телефоне и уйдут тренеру, когда появится сеть.</span></div>`;

  let sum = '';
  if(fin){
    sum = `<div class="sumc"><span class="caps" style="color:${full ? 'var(--ok-t)' : 'var(--acc-d)'}">${full ? 'Тренировка выполнена' : 'Выполнена частично'}</span>
      <div class="row3"><div><b class="num">${kb}<span style="color:var(--tx4);font-weight:600"> / ${nb}</span></b><s>${plural(nb, 'блок', 'блока', 'блоков')}</s></div>
        <div><b class="num">${vol ? fmtN(vol) : '—'}</b><s>кг объём</s></div>
        <div><b class="num">${r.rpe ? r.rpe + '<span style="color:var(--tx4);font-weight:600">/10</span>' : '—'}</b><s>самочувствие</s></div></div>
      ${r.seed ? '' : `<div class="fb">Результаты у тренера${Model.pending().length && off() ? ' — уйдут, когда появится сеть' : ''}. Отметки можно поправить ниже.</div>`}</div>`;
  }

  const C = {r, date, cur, bp};
  let foot = '';
  if(!fin){
    if(!real) foot = `<button class="btn" data-act="wStart">${date < TODAY ? 'Записать результаты' : date > TODAY ? 'Начать сейчас' : 'Начать тренировку'}</button>`;
    else if(k === n) foot = `<button class="btn" data-act="finOpen">${ICO.chk}Завершить тренировку</button>`;
    else if(cur){
      const lab = cur.type === 'set' ? 'Выполнено <span class="c">→</span> далее' : cur.type === 'round' ? `Круг ${cur.n} выполнен <span class="c">→</span> далее`
        : cur.type === 'result' ? 'Записать результат' : 'Выполнено <span class="c">→</span> далее';
      foot = `<button class="btn" data-act="cta">${lab}</button><div class="hint"><button class="lnk" style="font-size:14px" data-act="finOpen">Закончить тренировку</button></div>`;
    }
  }

  return {tab:'*', tabs:false, cls:'grey', sb:'', mount: v => focusTask(v, q.f), html:`
    ${UI.nav({title:x.title, sub:navT + ', ' + navS, back:'#/train', right:talkBtn, reveal:true})}
    <div class="body${foot ? ' pad-foot' : ''}">
      <div class="wh">
        <div class="when"><span class="caps">${esc(cap1(dLong(date)))}</span>${chip}</div>
        <h1>${esc(x.title)}</h1>
        <div class="tags">${x.comp ? `<span class="chip comp">${ICO.trophy}Соревнование</span>` : ''}${G ? `<span class="chip">${ICO.grp}Группа «${esc(G.n)}»</span>` : ''}</div>
        ${coachMsg(date)}
        <div class="wprog" role="progressbar" aria-valuemin="0" aria-valuemax="${nb}" aria-valuenow="${kb}" aria-label="Выполнено ${kb} из ${nb} ${blkWord(nb)}">${bar}<div class="lg"><span>Выполнено <b>${kb}</b> из ${nb} ${blkWord(nb)}</span><span>${vol ? fmtN(vol) + ' кг объём' : real ? '' : 'начните тренировку'}</span></div></div>
      </div>
      ${banners}${sum}
      <div class="feed">${W.blocks.map((B, i) => blockHTML(B, i, C)).join('')}</div>
      <div class="wend">Конец тренировки</div>
    </div>
    ${foot ? `<div class="foot">${foot}</div>` : ''}`};
});

/* Переход из чата к заданию: блок или строка подсвечиваются на месте. */
function focusTask(v, key){
  /* Подсвечиваем только при переходе к заданию; при возврате назад — прежний скролл. */
  if(!key || App.anim !== 'push') return;
  const q = (window.CSS && CSS.escape) ? CSS.escape(key) : key;
  const el = $('[data-part="' + q + '"]', v) || $('[data-blk="' + q + '"]', v);
  if(!el) return;
  /* блок — к верху экрана (высокий по центру потерял бы заголовок), задание — по центру */
  setTimeout(() => { el.scrollIntoView({block: el.matches('.blk') ? 'start' : 'center'}); el.classList.add('flash'); setTimeout(() => el.classList.remove('flash'), 1800) }, 60);
}

/* ─── действия ─── */
const W_ = () => Model.workout(WS.date);
const unitOf = key => W_().units.find(u => u.key === key);
/* Подкрутка к следующему шагу — только вперёд и только если его не видно:
   экран не прыгает назад и не уезжает, когда следующий шаг и так на виду. */
function scrollNow(){ setTimeout(() => {
  const el = $('.view .set.now, .view .rounds .now, .view .mres.now') || $('.view .ex.now'), b = $('.view .body'); if(!el || !b) return;
  const r = el.getBoundingClientRect(), top = b.getBoundingClientRect().top, foot = $('.view .foot');
  const bottom = foot ? foot.getBoundingClientRect().top : b.getBoundingClientRect().bottom;
  if(r.top < top || r.bottom <= bottom) return;
  el.scrollIntoView({block:'center', behavior:motion()}) }, 30) }
/* Снятая отметка не стирает записанный факт подхода или круга (вес, повторы,
   время, факт по участникам): отметили снова — факт на месте. */
const FACT = ['kg', 'r', 'v'];
/* Назначение подхода сейчас (вес уже посчитан от максимума). */
const planOf = s => { const a = {}; if(s.kg != null) a.kg = s.kg; if(s.reps != null) a.r = s.reps; if(s.val != null) a.v = s.val; return a };
/* Отметка фиксирует цифры на этот момент: вписанные вручную, а где их нет — назначенные.
   Иначе после правки задания тренером прошлый результат «переписался» бы вместе с планом. */
const snapOf = (s, x) => { const a = (x && x.a) || planOf(s), f = {a}; FACT.forEach(k => { const v = x && x[k] != null ? x[k] : a[k]; if(v != null) f[k] = v }); return f };
/* После снятия отметки остаётся только то, что вписано вручную (отличается от назначения). */
const ownOf = x => { const k = {}; FACT.forEach(f => { if(x[f] != null && (!x.a || x[f] !== x.a[f])) k[f] = x[f] }); if(Object.keys(k).length && x.a) k.a = x.a; return k };
/* Первая отметка начинает тренировку — явно: статус «В процессе», об этом — короткое сообщение. */
function startRes(){
  const had = Model.resReal(WS.date), r = Model.ensureRes(WS.date);
  if(!had) toast(WS.date < TODAY ? 'Записываем результаты за ' + dDM(WS.date) : WS.date > TODAY ? 'Тренировка начата раньше — отметки запишутся на ' + DOW_ACC[dowMon(WS.date)] : 'Тренировка началась');
  return r;
}
function mark(key, on, extra){
  const r = startRes(), u = unitOf(key), x = {...(r.u[key] || {}), ...(extra || {})};
  if(on){
    let snap = {};
    if(u && u.type === 'set') snap = snapOf(u.set, x);
    else if(u && u.type === 'round'){ const m = {}; u.part.members.filter(p => p.type === 'ex').forEach(p => { m[p.key] = snapOf(p.round, (x.m || {})[p.key]) }); snap = {m} }
    r.u[key] = {...x, ...snap, d:1, ...pendMark()};
  } else {
    const keep = ownOf(x);
    if(x.m){ const m = {}; Object.entries(x.m).forEach(([k, y]) => { const o = ownOf(y); if(Object.keys(o).length) m[k] = o }); if(Object.keys(m).length) keep.m = m }
    if(Object.keys(keep).length) r.u[key] = keep; else delete r.u[key];
  }
  Model.saveRes(WS.date, r);
}
ACT.wStart = () => { Model.ensureRes(WS.date); WS.last[WS.date] = null; App.refresh(); scrollNow() };
ACT.unit = el => { const key = el.dataset.k, u = unitOf(key); if(!u) return;
  const r = Model.res(WS.date), on = !isDone(r, key);
  mark(key, on); WS.last[WS.date] = unitPart(u); App.refresh(); if(on) scrollNow() };
ACT.exAll = el => { const W = W_(), us = W.units.filter(u => u.part && u.part.key === el.dataset.k); const r = Model.res(WS.date);
  const on = !us.every(u => isDone(r, u.key)); us.forEach(u => mark(u.key, on)); WS.last[WS.date] = el.dataset.k; App.refresh() };
ACT.round = el => { const key = el.dataset.k; const r = Model.res(WS.date);
  if(!isDone(r, key)){ mark(key, true); WS.last[WS.date] = unitOf(key).part.key; App.refresh(); scrollNow() } else openRoundSheet(key) };
ACT.setOpen = el => openSetSheet(el.dataset.k);
ACT.resOpen = el => openResSheet(+el.dataset.b);
ACT.chgOk = () => { const r = Model.resReal(WS.date); if(r){ r.sig = W_().d.sig; if(r.legacy) r.legacyOk = 1; Model.saveRes(WS.date, r) } App.refresh() };
ACT.cta = () => {
  const W = W_(), r = Model.res(WS.date), cur = curUnit(W, r, WS.date); if(!cur) return;
  if(cur.type === 'result'){ openResSheet(cur.block.bi); return }
  mark(cur.key, true); WS.last[WS.date] = unitPart(cur); App.refresh(); scrollNow();
};
ACT.finOpen = () => openFinishSheet();
ACT.needPm = el => openPmSheet(el.dataset.k);

/* ═══════════ 1.3.1 ПОДХОД ═══════════ */
const fieldHTML = (id, k, v, u, mode = 'decimal', ph = '') => `<label class="field"><span class="k">${k}</span><span class="v"><input id="${id}" inputmode="${mode}" value="${esc(v ?? '')}" placeholder="${esc(ph)}">${u ? `<u>${u}</u>` : ''}</span></label>`;
function setFields(s, x, pre = 'f'){
  const kg = x && x.kg != null ? x.kg : s.kg, reps = x && x.r != null ? x.r : s.reps, v = x && x.v != null ? x.v : s.val;
  if(s.kind === 'kg') return {cls:'', html: fieldHTML(pre + '-kg', 'Вес', kg != null ? fmtN(kg) : '', 'кг', 'decimal', s.needPm ? 'сколько' : '') + fieldHTML(pre + '-r', 'Повторы', reps ?? '', 'повт', 'numeric')};
  if(s.kind === 'time') return {cls:'', html: fieldHTML(pre + '-m', 'Минуты', v != null ? Math.floor(v / 60) : '', 'мин', 'numeric') + fieldHTML(pre + '-s', 'Секунды', v != null ? String(Math.round(v) % 60).padStart(2, '0') : '', 'сек', 'numeric')};
  if(s.kind === 'dist') return {cls:'one', html: fieldHTML(pre + '-v', 'Дистанция', v != null ? fmtN(v) : '', 'м')};
  if(s.kind === 'cal') return {cls:'one', html: fieldHTML(pre + '-v', 'Калории', v != null ? fmtN(v) : '', 'кал')};
  if(s.kind === 'other') return {cls:'one', html: fieldHTML(pre + '-v', 'Результат', v != null ? fmtN(v) : '', '')};
  return {cls:'one', html: fieldHTML(pre + '-r', 'Повторы', reps ?? '', 'повт', 'numeric')};
}
/* Чтение полей подхода: всё, что в них стоит, — это факт. Пустое и неверное не
   заменяется назначенным, а объясняется у поля. Ноль — допустимое значение. */
function readFields(s, box, pre = 'f'){
  const raw = id => { const el = $('#' + pre + '-' + id, box); return el ? el.value.trim() : '' };
  const vals = {}, errs = [];
  const num = (id, what, int) => { const t = raw(id);
    if(!t){ errs.push([id, 'Впишите ' + what]); return null }
    if(/^[−-]/.test(t)){ errs.push([id, 'Не может быть меньше нуля']); return null }
    if(!(int ? /^\d+$/ : /^\d+([.,]\d+)?$/).test(t)){ errs.push([id, int ? 'Нужно целое число' : 'Нужно число, например 82,5']); return null }
    return int ? parseInt(t, 10) : numOf(t) };
  if(s.kind === 'kg'){ const kg = num('kg', 'вес'); if(kg != null) vals.kg = kg;
    if(s.reps != null || raw('r')){ const r = num('r', 'повторы', true); if(r != null) vals.r = r } }
  else if(s.kind === 'time'){
    if(!raw('m') && !raw('s')) errs.push(['m', 'Впишите время']);
    else { const m = raw('m') ? num('m', 'минуты', true) : 0, sc = raw('s') ? num('s', 'секунды', true) : 0;
      if(sc != null && sc > 59) errs.push(['s', 'От 0 до 59']);
      else if(m != null && sc != null){ if(m * 60 + sc > 0) vals.v = m * 60 + sc; else errs.push(['m', 'Время должно быть больше нуля']) } } }
  else if(s.kind === 'dist' || s.kind === 'cal' || s.kind === 'other'){ const x = num('v', s.kind === 'dist' ? 'дистанцию' : s.kind === 'cal' ? 'калории' : 'результат'); if(x != null) vals.v = x }
  else { const r = num('r', 'повторы', true); if(r != null) vals.r = r }
  return {vals, errs};
}
/* Ошибки — у своих полей; исправили поле — подсказка уходит. */
function showErrs(box, pre, errs){
  /* сбрасываем только свои поля: в шторке круга у каждого упражнения своя приставка */
  [...$$('.field.bad', box)].filter(f => { const i = $('input', f); return i && i.id.startsWith(pre + '-') })
    .forEach(f => { f.classList.remove('bad'); const e = $('.ferr', f); if(e) e.remove() });
  errs.forEach(([id, msg]) => { const i = $('#' + pre + '-' + id, box); if(!i) return; const f = i.closest('.field');
    f.classList.add('bad'); f.insertAdjacentHTML('beforeend', `<span class="ferr" role="alert">${esc(msg)}</span>`);
    i.addEventListener('input', () => { f.classList.remove('bad'); const e = $('.ferr', f); if(e) e.remove() }, {once:true}) });
  if(errs.length && !$('.field.bad input:focus', box)){ const i = $('#' + pre + '-' + errs[0][0], box); if(i) i.focus() }
  return !errs.length;
}
function openSetSheet(key){
  const u = unitOf(key); if(!u) return;
  const s = u.set, P = u.part, r = Model.res(WS.date), x = r && r.u[key], F = setFields(s, x);
  const plan = s.kind === 'kg' && s.kg == null ? 'Тренер задал вес от вашего 1ПМ — впишите, сколько подняли' : 'Назначено: ' + Model.roundTxt({...s, reps:s.reps});
  Sheet.open(`<div class="shh"><span class="t"><b>${esc(P.e.ru)}</b><s>подход ${s.n} из ${P.sets.length}</s></span><button class="ib" data-act="sheetClose">${ICO.x}</button></div>
    <div class="plan">${esc(plan)}</div>
    <div class="fields ${F.cls}">${F.html}</div>
    ${s.kind === 'kg' && s.kg != null ? `<div class="quick">${[-5, -2.5, 2.5, 5].map(d => `<button data-d="${d}" aria-label="${d > 0 ? 'Прибавить' : 'Убавить'} ${fmtN(Math.abs(d))} кг">${d > 0 ? '+' : '−'}${fmtN(Math.abs(d))}</button>`).join('')}<button data-reset aria-label="Вернуть назначенный вес ${fmtN(s.kg)} кг">${ICO.undo}${fmtN(s.kg)}</button></div>` : '<div style="height:8px"></div>'}
    <button class="btn" id="sh-save">Записать подход</button>
    ${isDone(r, key) ? `<button class="btn ghost" id="sh-un" style="margin-top:8px">Снять отметку</button>` : ''}`, {mount(sh){
      $$('.quick [data-d]', sh).forEach(b => b.onclick = () => { const i = $('#f-kg', sh); const v = numOf(i.value) || 0; i.value = fmtN(Math.max(0, Math.round((v + +b.dataset.d) * 10) / 10)) });
      const rs = $('.quick [data-reset]', sh); if(rs) rs.onclick = () => { $('#f-kg', sh).value = fmtN(s.kg) };
      $('#sh-save', sh).onclick = () => { const {vals, errs} = readFields(s, sh); if(!showErrs(sh, 'f', errs)) return;
        const rr = startRes(); rr.u[key] = {d:1, ...vals, a:planOf(s), ...pendMark()}; Model.saveRes(WS.date, rr); WS.last[WS.date] = P.key; Sheet.close(); App.refresh(); scrollNow() };
      const un = $('#sh-un', sh); if(un) un.onclick = () => { mark(key, false); Sheet.close(); App.refresh() };
      const first = $('input', sh); if(first) setTimeout(() => first.select(), 280);
    }});
}
/* Круг суперсета: факт по каждому упражнению круга. */
function openRoundSheet(key){
  const u = unitOf(key); if(!u) return;
  const S = u.part, r = Model.res(WS.date), x = (r && r.u[key]) || {};
  const mems = S.members.filter(m => m.type === 'ex');
  Sheet.open(`<div class="shh"><span class="t"><b>Круг ${u.n} из ${S.rounds}</b><s>${esc(ssLabel({rounds:S.rounds, rest:S.rest}))}</s></span><button class="ib" data-act="sheetClose">${ICO.x}</button></div>
    <div class="plan">Если что-то сделали не так, как назначено, — впишите факт.</div>
    ${mems.map((m, i) => { const F = setFields(m.round, (x.m || {})[m.key], 'm' + i);
      return `<div class="caps" style="margin-top:16px">${esc(m.e.ru)}</div><div class="fields ${F.cls}" style="margin-top:8px">${F.html}</div>` }).join('')}
    <button class="btn" id="rd-save" style="margin-top:14px">Записать круг</button>
    <button class="btn ghost" id="rd-un" style="margin-top:8px">Снять отметку</button>`, {mount(sh){
      $('#rd-save', sh).onclick = () => { const mm = {}; let ok = true;
        mems.forEach((m, i) => { const {vals, errs} = readFields(m.round, sh, 'm' + i); if(!showErrs(sh, 'm' + i, errs)) ok = false; else mm[m.key] = {...vals, a:planOf(m.round)} });
        if(!ok){ const f = $('.field.bad input', sh); if(f) f.focus(); return }
        mark(key, true, {m:mm}); Sheet.close(); App.refresh() };
      $('#rd-un', sh).onclick = () => { mark(key, false); Sheet.close(); App.refresh() };
    }});
}

/* ═══════════ 1.3.2 РЕЗУЛЬТАТ КОМПЛЕКСА ═══════════
   Что записывать, диктует формат, который задал тренер (CON-18). */
function openResSheet(bi){
  const W = W_(), B = W.blocks[bi]; if(!B) return;
  const f = B.fmt || {k:'FOR TIME', total:0}, key = B.key + '.res', r = Model.res(WS.date), x = (r && r.u[key]) || {};
  const plan = fmtDesc(f) ? cap1(fmtDesc(f)) : 'Запишите, как прошёл комплекс';
  let fields = '', extra = '';
  if(f.k === 'AMRAP') fields = `<div class="fields">${fieldHTML('rs-a', 'Раундов', x.a ?? '', 'полных', 'numeric')}${fieldHTML('rs-b', 'Повторов сверху', x.b ?? '', 'повт', 'numeric')}</div>`;
  else if(f.k === 'FOR TIME'){
    fields = `<div class="fields" id="rs-time">${fieldHTML('rs-a', 'Минуты', x.lim ? '' : (x.a ?? ''), 'мин', 'numeric')}${fieldHTML('rs-b', 'Секунды', x.lim ? '' : (x.b ?? ''), 'сек', 'numeric')}</div>
      <div class="fields" id="rs-cap" style="display:none">${fieldHTML('rs-c', 'Раундов', x.lim ? (x.a ?? '') : '', 'полных', 'numeric')}${fieldHTML('rs-d', 'Повторов сверху', x.lim ? (x.b ?? '') : '', 'повт', 'numeric')}</div>`;
    if(f.total) extra = `<button class="chkrow ${x.lim ? 'on' : ''}" id="rs-lim"><span class="bx">${ICO.chk}</span>Не уложился в лимит ${mmss(f.total)}</button>`;
  }
  else if(f.k === 'DEATH BY') fields = `<div class="fields one">${fieldHTML('rs-a', 'Последний полный раунд', x.a ?? '', '', 'numeric')}</div>`;
  else if(f.k === 'NFT') fields = '';
  else fields = `<div class="fields one">${fieldHTML('rs-a', 'Раундов выдержали', x.a ?? f.rounds ?? '', f.rounds ? 'из ' + f.rounds : '', 'numeric')}</div>`;
  Sheet.open(`<div class="shh"><span class="t"><b>Результат</b><s>${esc(B.title || 'Комплекс')} · ${esc(fmtLabel(f))}</s></span><button class="ib" data-act="sheetClose">${ICO.x}</button></div>
    <div class="plan">${esc(plan)}</div>${fields}${extra}
    <button class="btn" id="rs-save" style="margin-top:10px">${f.k === 'NFT' ? 'Отметить выполненным' : 'Записать результат'}</button>
    ${x.d ? `<button class="btn ghost" id="rs-un" style="margin-top:8px">Снять результат</button>` : ''}`, {mount(sh){
      const lim = $('#rs-lim', sh);
      const sync = () => { if(!lim) return; const on = lim.classList.contains('on'); $('#rs-time', sh).style.display = on ? 'none' : ''; $('#rs-cap', sh).style.display = on ? '' : 'none' };
      if(lim){ lim.onclick = () => { lim.classList.toggle('on'); sync() }; sync() }
      const iv = id => { const e = $('#' + id, sh); return e ? parseInt(e.value, 10) : NaN };
      $('#rs-save', sh).onclick = () => {
        let rec = {};
        if(f.k === 'AMRAP'){ const a = iv('rs-a'), b = iv('rs-b'); if(isNaN(a)) return $('#rs-a', sh).focus();
          rec = {a, b:isNaN(b) ? null : b, t: a + ' ' + plural(a, 'раунд', 'раунда', 'раундов') + (b ? ' + ' + b : '')} }
        else if(f.k === 'FOR TIME'){ if(lim && lim.classList.contains('on')){ const a = iv('rs-c'), b = iv('rs-d'); if(isNaN(a)) return $('#rs-c', sh).focus();
            rec = {lim:1, a, b:isNaN(b) ? null : b, t:'лимит · ' + a + ' ' + plural(a, 'раунд', 'раунда', 'раундов') + (b ? ' + ' + b : '')} }
          else { const a = iv('rs-a'), b = iv('rs-b'); if(isNaN(a) && isNaN(b)) return $('#rs-a', sh).focus();
            rec = {a:a || 0, b:b || 0, t:(a || 0) + ':' + String(b || 0).padStart(2, '0')} } }
        else if(f.k === 'DEATH BY'){ const a = iv('rs-a'); if(isNaN(a)) return $('#rs-a', sh).focus(); rec = {a, t:'до ' + a + '-го раунда'} }
        else if(f.k === 'NFT') rec = {t:'выполнено'};
        else { const a = iv('rs-a'); if(isNaN(a)) return $('#rs-a', sh).focus(); rec = {a, t:a + (f.rounds ? ' из ' + f.rounds : '') + ' ' + plural(f.rounds || a, 'раунда', 'раундов', 'раундов')} }
        mark(key, true, rec); WS.last[WS.date] = B.key; Sheet.close(); App.refresh(); scrollNow();
      };
      const un = $('#rs-un', sh); if(un) un.onclick = () => { mark(key, false); Sheet.close(); App.refresh() };
      const first = $('input', sh); if(first) setTimeout(() => first.focus(), 280);
    }});
}

/* ═══════════ 1.3.3 МОЙ МАКСИМУМ ═══════════
   Вес задан в % от 1ПМ, а максимума нет: клиент вписывает свой, приложение
   считает килограммы, тренер видит, что максимум внёс клиент. */
function openPmSheet(k, {title} = {}){
  const cur = Model.pm()[k];
  Sheet.open(`<div class="shh"><span class="t"><b>${esc(title || (cur ? 'Обновить максимум' : 'Ваш максимум'))}</b><s>${esc(Model.pmFull(k))} · 1ПМ</s></span><button class="ib" data-act="sheetClose">${ICO.x}</button></div>
    <div class="plan">${cur ? 'Сейчас записано ' + kgS(cur) + '. ' : ''}1ПМ — вес, который вы поднимете один раз на пределе. От него тренер задаёт проценты, а приложение считает килограммы во всех тренировках.</div>
    <div class="fields one">${fieldHTML('pm-v', 'Максимум', cur ? fmtN(cur) : '', 'кг')}</div>
    <p class="plan" style="font-size:13.5px;color:var(--tx3);margin:0 0 14px">Не знаете точно — впишите примерный. Тренер увидит и поправит.</p>
    <button class="btn" id="pm-save">Сохранить</button>`, {mount(sh){
      const i = $('#pm-v', sh); setTimeout(() => i.focus(), 280);
      $('#pm-save', sh).onclick = () => { const v = numOf(i.value); if(!v){ i.focus(); return }
        Model.setPm(k, v); Model.flush(); Sheet.close(); App.refresh();
        toast(off() ? 'Максимум сохранён — веса пересчитаны. Тренеру уйдёт, когда появится сеть' : 'Максимум сохранён — веса пересчитаны') };
    }});
}

/* ═══════════ 1.3.5 ЗАВЕРШЕНИЕ ═══════════ */
function prCandidates(W, r){
  const pm = Model.pm(), best = {};
  W.units.forEach(u => { if(u.type !== 'set' || u.set.kind !== 'kg' || !isDone(r, u.key)) return;
    const k = u.part.pmKey; if(!k) return; const x = r.u[u.key], kg = x.kg ?? u.set.kg, reps = x.r ?? u.set.reps;
    if(reps === 1 && kg && kg > (pm[k] || 0) && kg > (best[k] || 0)) best[k] = kg });
  return Object.entries(best).map(([k, v]) => ({k, v, was:pm[k] || null}));
}
function openFinishSheet(){
  const W = W_(), r = Model.ensureRes(WS.date);
  const bp = blockProg(W, r), nb = bp.length, kb = bp.filter(x => x.k === x.n).length, left = nb - kb, vol = workVolume(W, r);
  const mins = r.st && r.st > 1 ? Math.round((Date.now() - r.st) / 60000) : null;
  const prs = prCandidates(W, r);
  let rpe = r.rpe || null;
  Sheet.open(`<div class="shh"><span class="t"><b>${!left ? 'Тренировка выполнена' : 'Закончить тренировку'}</b><s>${esc(W.d.title)}</s></span><button class="ib" data-act="sheetClose">${ICO.x}</button></div>
    <div class="sumc" style="padding:0;margin:0"><div class="row3"><div><b class="num">${kb}<span style="color:var(--tx4);font-weight:600"> / ${nb}</span></b><s>${plural(nb, 'блок', 'блока', 'блоков')}</s></div>
      <div><b class="num">${vol ? fmtN(vol) : '—'}</b><s>кг объём</s></div><div><b class="num">${mins != null && mins < 600 ? mins : '—'}</b><s>минут</s></div></div></div>
    ${left ? `<p class="plan" style="margin-top:12px">${left === 1 ? 'Не завершён 1 блок' : 'Не завершено ' + left + ' ' + plural(left, 'блок', 'блока', 'блоков')} — тренер увидит, что сделано не всё.</p>` : ''}
    ${prs.length ? `<div class="prl"><span class="caps">Новый максимум</span>${prs.map(p => `<button class="chkrow on" data-pr="${p.k}" data-v="${p.v}"><span class="bx">${ICO.chk}</span><span>${esc(Model.pmName(p.k))}: <b>${kgS(p.v)}</b>${p.was ? ' · был ' + kgS(p.was) : ''}<br><span style="font-size:13.5px;color:var(--tx3)">Обновить 1ПМ — веса в следующих тренировках пересчитаются</span></span></button>`).join('')}</div>` : ''}
    <div class="caps" style="margin-top:18px">Как тренировка?</div>
    <div class="rpe">${Array.from({length:10}, (_, i) => `<button data-rpe="${i + 1}" class="${rpe === i + 1 ? 'on' : ''}">${i + 1}</button>`).join('')}</div>
    <div class="rpe-l"><span>легко</span><span>на пределе</span></div>
    <textarea class="ta" id="fn-t" placeholder="Написать тренеру — необязательно"></textarea>
    <p class="plan" style="font-size:13.5px;color:var(--tx3);margin:-2px 0 12px">Комментарий уйдёт в чат с этой тренировкой во вложении. Отметки и результаты тренер видит в вашей тренировке — в чат они не отправляются.</p>
    <button class="btn" id="fn-go">Готово</button>`, {mount(sh){
      $$('[data-rpe]', sh).forEach(b => b.onclick = () => { rpe = +b.dataset.rpe; $$('[data-rpe]', sh).forEach(x => x.classList.toggle('on', x === b)) });
      $$('[data-pr]', sh).forEach(b => b.onclick = () => b.classList.toggle('on'));
      $('#fn-go', sh).onclick = () => {
        const rr = Model.ensureRes(WS.date); rr.fin = Date.now(); if(rpe) rr.rpe = rpe; Object.assign(rr, pendMark()); Model.saveRes(WS.date, rr);
        const t = $('#fn-t', sh).value.trim();
        if(t) Chat.send(CS.cid, 'c', {text:t, att:Chat.snap(CS.cid, WS.date, {k:'day'}, Model.pm()), sim:off()});
        const upd = $$('[data-pr].on', sh).map(b => { Model.setPm(b.dataset.pr, +b.dataset.v); return b.dataset.pr });
        if(upd.length) Model.flush();
        Sheet.close(); App.refresh();
        toast(off() ? 'Тренировка сохранена на телефоне — тренер увидит, когда появится сеть' : upd.length ? 'Готово! Новый максимум записан, тренер увидит' : 'Готово! Тренер увидит результаты');
      };
    }});
}

/* демо-входы в шторки с карты экранов */
function withWorkout(pred, fn){
  let d = null;
  for(let i = 0; i < 40 && !d; i++) for(const s of [1, -1]){ const x = addDays(TODAY, i * s); const W = Model.workout(x); if(W.blocks.length && pred(W)){ d = x; break } }
  if(!d) return toast('Нет подходящей тренировки в ближайшие дни');
  Nav.go('#/train/day/' + d); setTimeout(() => fn(Model.workout(d)), 80);
}
Object.assign(DEMO_SHEET, {
  set:  () => withWorkout(W => W.units.some(u => u.type === 'set' && u.set.kind === 'kg' && u.set.kg != null), W => openSetSheet(W.units.find(u => u.type === 'set' && u.set.kind === 'kg' && u.set.kg != null).key)),
  res:  () => withWorkout(W => W.blocks.some(B => B.mode === 'result'), W => openResSheet(W.blocks.find(B => B.mode === 'result').bi)),
  pm:   () => withWorkout(W => W.units.some(u => u.part && u.part.pmKey), W => openPmSheet(W.units.find(u => u.part && u.part.pmKey).part.pmKey)),
  talk: () => withWorkout(() => true, W => askCoach({k:'day', d:W.date})),
  fin:  () => withWorkout(() => true, () => openFinishSheet()),
});
