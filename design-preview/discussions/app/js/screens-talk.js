/* ═══════════════════════════════════════════════════════════════
   4. ОБСУЖДЕНИЯ — версия 2 (COM-1…COM-4)

   Не единый чат, а ветки на объекте: тренировка дня («w:<дата>») или
   упражнение («x:<упражнение>»). Вкладка «Обсуждения» собирает все ветки,
   ветки с непрочитанным ответом тренера — сверху. Из тренировки ветка
   открывается шторкой: «Спросить» у упражнения, значок в шапке — у дня.

   Сообщение тренера к тренировке — инструкция: оно закреплено сверху ветки
   тренировки и в непрочитанные не идёт. Отметки и результаты в обсуждения
   сами не уходят — только то, что человек написал.
   Хранилище — ../assets/chat.js (общее с кабинетом тренера, поле th у сообщения).
   ═══════════════════════════════════════════════════════════════ */
const TK = {dr:{}};                       /* черновики по веткам — пока открыто приложение */
const hmS = at => { const d = new Date(at); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') };
const daySep = d => d === TODAY ? 'Сегодня' : daysBetween(d, TODAY) === 1 ? 'Вчера' : cap1(dDM(d));
const whenS = at => { const d = String(at).slice(0, 10); return d === TODAY ? hmS(at) : daysBetween(d, TODAY) === 1 ? 'вчера' : dShort(d) };

/* О чём ветка: подпись, название, куда ведёт, миниатюра. */
function thTitle(th){
  const I = Chat.thInfo(CS.cid, th);
  return I.kind === 'x'
    ? {k:'Упражнение', t:I.t, go:'#/ex/' + I.exId, pic:UI.thumb(I.e, 'th2'), sub:'обсуждение упражнения'}
    : {k:'Тренировка · ' + dShort(I.date), t:I.t, go:'#/train/day/' + I.date, pic:`<span class="th2">${ICO.cal}</span>`, sub:'обсуждение тренировки', date:I.date};
}
/* Сообщение тренера к тренировке — первым облачком тренера в ветке тренировки
   (не отдельной карточкой): оно же стоит в самой тренировке. */
const pinHTML = th => { const ins = th[0] === 'w' ? dayMsg(CS.cid, th.slice(2)) : '';
  return ins ? `<div class="msg tr pin"><span class="who">${esc(TRAINER.n)}<i>к тренировке</i></span>${esc(ins)}</div>` : '' };
/* Сообщение — карточка-комментарий, как было до чата: автор и время сверху,
   у тренера — тёплая подложка, у клиента — серая. */
function talkMsgHTML(m){
  const tr = m.by === 't';
  return `<div class="msg ${tr ? 'tr' : ''}" id="m-${esc(m.id)}"><span class="who">${tr ? esc(TRAINER.n) : 'Вы'}<i>${esc(whenS(m.at))}</i></span>${esc(m.text)}${!tr && m.sim ? `<div>${UI.pend(1)}</div>` : ''}</div>`;
}
/* Облачка ветки: сверху сообщение тренера к тренировке, дальше переписка по дням. */
function msgsHTML(L, hint, th){
  let day = '', out = '';
  L.forEach(m => { const d = m.at.slice(0, 10); if(d !== day){ day = d; out += `<div class="day">${esc(daySep(d))}</div>` } out += talkMsgHTML(m) });
  return pinHTML(th) + (out || `<div class="hint">${hint}</div>`);
}
/* Форма комментария: текст не теряется при перерисовке, отправка — в эту ветку. */
function wireComposer(root, th, after){
  const t = $('#tk-t', root), s = $('#tk-s', root); if(!t) return;
  t.oninput = () => { TK.dr[th] = t.value };
  s.onclick = () => { const v = t.value.trim(); if(!v){ t.focus(); return }
    Chat.say(CS.cid, 'c', th, v, off()); TK.dr[th] = '';
    if(off()) toast('Нет сети: сообщение сохранено и уйдёт тренеру, когда сеть появится (в прототипе — имитация)');
    after && after() };
}
const composerHTML = (th, ph) => `<div class="tkform"><textarea class="ta" id="tk-t" placeholder="${esc(ph)}">${esc(TK.dr[th] || '')}</textarea>
  <button class="btn" id="tk-s">Отправить тренеру</button></div>`;
const phOf = th => th[0] === 'w' ? 'Как прошла тренировка?' : 'Вес, техника, ощущения — что не так?';

/* ═══════════ 4.1 ВСЕ ОБСУЖДЕНИЯ ═══════════ */
route('/talk', () => {
  const T = Chat.threads(CS.cid, 'c');
  const un = th => Chat.thUnread(CS.cid, 'c', th).length;
  const ids = Object.keys(T).sort((a, b) => (un(b) ? 1 : 0) - (un(a) ? 1 : 0) || (T[a][T[a].length - 1].at < T[b][T[b].length - 1].at ? 1 : -1));
  const rows = ids.map(th => { const L = T[th], last = L[L.length - 1], tt = thTitle(th), n = un(th), waiting = last.by === 'c';
    return `<button class="row thr" data-go="#/talk/${encodeURIComponent(th)}" aria-label="${esc(tt.k + ': ' + tt.t + (n ? '. Новый ответ тренера' : ''))}">${tt.pic}
      <span class="tx"><b>${esc(tt.t)}</b><s>${esc(tt.k)}${waiting ? ' · ждёт ответа' : ''}</s><s class="sn">${last.by === 't' ? 'Тренер: ' : 'Вы: '}${esc(last.text)}</s></span>
      <span class="r"><span class="when">${n ? '<i class="unr" aria-hidden="true"></i>' : ''}${esc(whenS(last.at))}</span></span><span class="ch">${ICO.chev}</span></button>` }).join('');
  return {tab:'talk', cls:'grey sx', html:`${UI.lt({title:'Обсуждения', sub:'Вопросы тренеру — под тренировками и упражнениями'})}
    <div class="body">${ids.length ? `<section class="sect"><div class="list thl">${rows}</div>
      <p class="note-s">Чтобы спросить о новом, откройте тренировку или упражнение и нажмите «Спросить».</p></section>`
      : `<section class="sect">${UI.empty({ico:ICO.chat, title:'Обсуждений пока нет', text:'Спросите тренера под любой тренировкой или упражнением — ответ придёт сюда.',
          btn:`<button class="btn ghost" style="margin-top:20px" data-go="#/train">К тренировкам</button>`})}</section>`}</div>`};
});

/* ═══════════ 4.2 ВЕТКА ═══════════ */
route('/talk/:th', p => {
  const th = p.th, tt = thTitle(th), L = Chat.thread(CS.cid, 'c', th);
  return {tab:'talk', tabs:false, cls:'tkv', html:`${UI.nav({title:tt.t, sub:tt.sub, back:'#/talk', line:true})}
    <div class="body"><button class="ctx" data-go="${tt.go}">${tt.pic}<span class="t"><span class="caps">${esc(tt.k)}</span><b>${esc(tt.t)}</b></span>${ICO.chev}</button>
      <div class="msgs">${msgsHTML(L, 'Напишите тренеру — он ответит в этой ветке.', th)}</div></div>
    ${composerHTML(th, phOf(th))}`,
    mount(v){
      Chat.markThread(CS.cid, 'c', th); Tabs.paint('talk');
      const b = $('.body', v); b.scrollTop = b.scrollHeight;
      wireComposer(v, th, () => { App.refresh(); const nb = $('.view .body'); if(nb) nb.scrollTop = nb.scrollHeight;
        if(!off()) toast('Отправлено — тренер ответит здесь же') });
    }};
});

/* ═══════════ 1.3.4 ОБСУЖДЕНИЕ — ШТОРКОЙ ИЗ ТРЕНИРОВКИ ═══════════
   Ветка открывается поверх тренировки: прочитать ответ и написать, не уходя
   из зала. «Открыть обсуждение» — та же ветка во вкладке «Обсуждения». */
function openTalkSheet(th){
  const tt = thTitle(th);
  const paint = sh => { const box = $('.tkbox', sh);
    box.innerHTML = `<div class="msgs">${msgsHTML(Chat.thread(CS.cid, 'c', th),
      th[0] === 'w' ? 'Напишите, как прошла тренировка, — тренер ответит здесь же.' : 'Спросите про вес, технику или ощущения — тренер ответит здесь же.', th)}</div>`;
    box.scrollTop = box.scrollHeight };
  Chat.markThread(CS.cid, 'c', th);
  Sheet.open(`<div class="shh"><span class="t"><b>${esc(th[0] === 'w' ? 'Обсуждение тренировки' : tt.t)}</b><s>${esc(th[0] === 'w' ? tt.t + ' · ' + dShort(tt.date) : 'обсуждение упражнения')}</s></span><button class="ib" data-act="sheetClose" aria-label="Закрыть">${ICO.x}</button></div>
    <div class="tkbox"></div>
    ${composerHTML(th, phOf(th))}
    <button class="lnk tkall" data-act="talkFull" data-th="${esc(th)}">Открыть обсуждение ${ICO.chev}</button>`, {mount(sh){
      paint(sh);
      wireComposer(sh, th, () => { paint(sh); $('#tk-t', sh).value = '';
        toast(off() ? 'Сообщение уйдёт тренеру, когда появится сеть' : 'Отправлено — тренер ответит здесь же') });
    }, onClose(){ if(App.view) App.refresh() }});
}
ACT.talk = el => openTalkSheet(el.dataset.th);
ACT.talkFull = el => { Sheet.close(true); Nav.go('#/talk/' + encodeURIComponent(el.dataset.th)) };
ACT.talkOpen = el => Nav.go('#/talk/' + encodeURIComponent(el.dataset.th));

Object.assign(DEMO_SHEET, {
  talkEx: () => { const d = Side.anyWork(); const P = Model.workout(d).blocks.flatMap(B => B.parts).find(x => x.type === 'ex');
    Nav.go('#/train/day/' + d); setTimeout(() => openTalkSheet(P ? 'x:' + P.exId : 'w:' + d), 80) },
});
