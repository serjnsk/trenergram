/* ═══════════════════════════════════════════════════════════════
   4. ЧАТ С ТРЕНЕРОМ (COM-1…COM-3)

   Один хронологический диалог с тренером — вкладка сразу открывает его,
   общий вопрос можно задать и без программы. Вопрос о тренировке, блоке
   или упражнении — сообщение со вложением: «Спросить тренера» в задании
   открывает чат с подготовленной карточкой, её можно убрать. Карточка —
   снимок задания на момент отправки и переход к нему. Ответ — с цитатой.

   Сообщение тренера к дню и заметка к блоку — инструкции, они остаются в
   тренировке. Отметки и результаты в чат сами не уходят.
   Хранилище — ../assets/chat.js, общее с кабинетом тренера.
   ═══════════════════════════════════════════════════════════════ */
const CH = {from:null, open:new Set()};
const attDay = d => RU[dowMon(d)] + ', ' + dShort(d);

/* Карточка вложения — компактная: вид и дата, название (до двух строк), у
   упражнения — схема и нагрузка. Остальной снимок — по «Подробнее», внутри
   карточки; переход к заданию — отдельная кнопка. Пояснение «тренировку
   изменили / упражнения больше нет» видно всегда. */
const attGoLabel = (r, a) => r.st === 'hidden' || r.st === 'gone' ? '' : a.k === 'day' ? 'Открыть тренировку' : r.focus ? 'Открыть задание' : 'Открыть день';
function attCard(a, {preview = false, mid = ''} = {}){
  if(!a) return '';
  const s = a.snap || {}, brief = Chat.attBrief(a, 'c');
  const head = `<span class="k">${esc(Chat.attKind(a))} · ${esc(attDay(a.date))}</span><b class="nm">${esc(s.name || s.day || '')}</b>${brief ? `<span class="p num">${esc(brief)}</span>` : ''}`;
  if(preview) return `<div class="attc pv"><span class="t">${head}</span><button class="x" data-act="attX" aria-label="Убрать вложение">${ICO.x}</button></div>`;
  const r = Chat.attResolve(CS.cid, a), note = Chat.attNote(r, a, 'c'), go = attGoLabel(r, a), open = CH.open.has(mid);
  const rows = Chat.attRows(a, 'c');
  return `<div class="attc${open ? ' open' : ''}"><span class="t">${head}${note ? `<span class="st">${esc(note)}</span>` : ''}
      ${rows.length ? `<dl class="more">${rows.map(([k, v]) => `<dt>${esc(k)}</dt><dd>${esc(v)}</dd>`).join('')}</dl>` : ''}</span>
    <span class="acts">${rows.length ? `<button class="mo" data-act="attMore" data-id="${esc(mid)}" aria-expanded="${open}">${open ? 'Свернуть' : 'Подробнее'}</button>` : ''}
      ${go ? `<button class="go" data-act="attGo" data-id="${esc(mid)}">${go}${ICO.chev}</button>` : ''}</span></div>`;
}
const quoteBox = r => r ? `<button class="qt" data-act="quoteGo" data-id="${esc(r.id)}"><b>${r.by === 't' ? esc(TRAINER.n) : 'Вы'}</b><span>${esc(r.text || (r.att ? 'Вложение: ' + r.att.name : ''))}</span></button>` : '';
const hmS = at => { const d = new Date(at); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0') };
const daySep = d => d === TODAY ? 'Сегодня' : daysBetween(d, TODAY) === 1 ? 'Вчера' : cap1(dDM(d));

function chatMsgHTML(m){
  const me = m.by === 'c';
  return `<div class="cm ${me ? 'me' : ''}" id="m-${esc(m.id)}">
    <span class="swr" aria-hidden="true">${ICO.reply}</span>
    <div class="bub" data-act="msgTap" data-id="${esc(m.id)}" role="button">${quoteBox(m.rep)}${m.text ? `<span class="tx">${esc(m.text)}</span>` : ''}${attCard(m.att, {mid:m.id})}</div>
    <div class="meta">${hmS(m.at)}${me && m.sim ? ` · ${UI.pend(1, 'ждёт отправки')}` : ''}</div></div>`;
}

/* ═══════════ 4.1 ДИАЛОГ ═══════════ */
route('/chat', (p, q) => {
  CH.from = q.from || null;          /* «назад» — только если чат открыт из задания */
  const cid = CS.cid, L = Chat.list(cid, 'c'), dr = Chat.draft('c', cid) || {};
  let day = '', body = '';
  L.forEach(m => { const d = m.at.slice(0, 10); if(d !== day){ day = d; body += `<div class="day">${esc(daySep(d))}</div>` } body += chatMsgHTML(m) });
  if(!L.length) body = `<div class="hint">Напишите тренеру — о тренировке, переносе, самочувствии.<br><br>Вопрос о конкретном упражнении удобнее задать из тренировки: кнопка «Спросить тренера» прикрепит задание к сообщению.</div>`;
  const back = CH.from ? `<button class="ib" data-act="chatBack" aria-label="Назад">${ICO.back}</button>` : '';
  return {tab:'chat', cls:'chatv', html:`
    <div class="chh">${back}${UI.av(TRAINER.ini, 's')}<span class="t"><b>${esc(TRAINER.n)}</b><s>ваш тренер</s></span></div>
    <div class="body chatb"><div class="msgs">${body}</div></div>
    <div class="compose">
      ${dr.att ? attCard(dr.att, {preview:true}) : ''}
      ${dr.rep ? `<div class="repl"><span class="t"><b>Ответ ${dr.rep.by === 't' ? 'тренеру' : 'на своё сообщение'}</b><span>${esc(dr.rep.text || (dr.rep.att ? 'Вложение: ' + dr.rep.att.name : ''))}</span></span><button class="x" data-act="repX" aria-label="Убрать цитату">${ICO.x}</button></div>` : ''}
      <div class="r2"><textarea id="cm-t" rows="1" placeholder="${dr.att ? (dr.att.k === 'day' ? 'Как прошла тренировка?' : 'Вопрос о задании…') : 'Сообщение тренеру'}">${esc(dr.text || '')}</textarea>
        <button class="send" id="cm-s" aria-label="Отправить" ${String(dr.text || '').trim() ? '' : 'disabled'}>${ICO.send}</button></div>
    </div>`,
    mount(v){
      Chat.markRead(cid, 'c'); Tabs.paint('chat');
      const b = $('.body', v), t = $('#cm-t', v), s = $('#cm-s', v);
      const flash = CH.flash && document.getElementById('m-' + CH.flash);
      if(flash){ flash.classList.add('flash'); flash.scrollIntoView({block:'center'}); setTimeout(() => flash.classList.remove('flash'), 1600); CH.flash = null }
      else if(!CH.keep) b.scrollTop = b.scrollHeight;
      CH.keep = false;
      const grow = () => { t.style.height = 'auto'; t.style.height = Math.min(120, t.scrollHeight) + 'px'; t.style.overflowY = t.scrollHeight > 120 ? 'auto' : 'hidden' }; grow();
      t.oninput = () => { grow(); s.disabled = !t.value.trim(); const d = Chat.draft('c', cid) || {}; Chat.setDraft('c', cid, {...d, text:t.value}) };
      s.onclick = () => chatSend();
      wireSwipe(v);
      if(CH.focus){ CH.focus = false; setTimeout(() => { t.focus(); t.setSelectionRange(t.value.length, t.value.length) }, 260) }
    }};
});
function chatSend(){
  const t = $('#cm-t'), v = t ? t.value.trim() : ''; if(!v){ t && t.focus(); return }
  const dr = Chat.draft('c', CS.cid) || {};
  Chat.send(CS.cid, 'c', {text:v, att:dr.att || null, rep:dr.rep || null, sim:off()});
  Chat.setDraft('c', CS.cid, null);
  App.refresh();
  const b = $('.view .body'); if(b) b.scrollTop = b.scrollHeight;
  if(off()) toast('Нет сети: сообщение сохранено в этом браузере и уйдёт тренеру, когда сеть появится (в прототипе — имитация)');
}

/* «Спросить тренера» из дня, блока или упражнения: чат с подготовленным
   вложением. Текст черновика сохраняется, вложение заменяется новым. */
function askCoach({k, d, id}){
  const sel = k === 'ex' && id ? {k:'ex', iid:id} : k === 'block' && id ? {k:'block', bid:id} : {k:'day'};
  const att = d ? Chat.snap(CS.cid, d, sel, Model.pm()) : null;
  const dr = Chat.draft('c', CS.cid) || {};
  Chat.setDraft('c', CS.cid, {...dr, att: att || dr.att || null});
  /* О задании уже есть сообщения — чат открывается на последнем из них. */
  const rel = id && d ? Chat.list(CS.cid, 'c').filter(m => m.att && m.att.date === d && (k === 'ex' ? m.att.iid === id : m.att.k === 'block' && m.att.bid === id)) : [];
  if(rel.length) CH.flash = rel[rel.length - 1].id;
  CH.focus = true;
  Nav.go('#/chat?from=' + encodeURIComponent(Nav.cur || '#/train'));
}
ACT.ask = el => askCoach(el.dataset);
/* «Ответ» у задания — чат прямо на непрочитанном ответе тренера, без нового вложения. */
ACT.askRead = el => { CH.flash = el.dataset.mid; Nav.go('#/chat?from=' + encodeURIComponent(Nav.cur || '#/train')) };
ACT.chatBack = () => { const f = CH.from; CH.from = null; Nav.popNext = true; App.lastTab = 'train'; location.hash = f || '#/train' };
ACT.attX = () => { const d = Chat.draft('c', CS.cid) || {}; Chat.setDraft('c', CS.cid, {...d, text:($('#cm-t') || {}).value || d.text || '', att:null}); CH.keep = true; App.refresh() };
ACT.repX = () => { const d = Chat.draft('c', CS.cid) || {}; Chat.setDraft('c', CS.cid, {...d, text:($('#cm-t') || {}).value || d.text || '', rep:null}); CH.keep = true; App.refresh() };
/* Переход к заданию — по постоянному ID: та же строка, даже если тренер
   переставил строки; переехавшая тренировка — на новую дату. Удалённое не
   подменяем соседней строкой: открываем день без выделения. */
function attOpen(a){
  const r = Chat.attResolve(CS.cid, a);
  if(r.st === 'hidden' || r.st === 'gone' || !r.date){ toast(Chat.attNote(r, a, 'c') || 'Задание недоступно'); return }
  if(a.k !== 'day' && !r.focus) toast(r.st === 'removed' ? (a.k === 'ex' ? 'Этого упражнения' : 'Этого блока') + ' в тренировке больше нет — открыт день'
    : 'Тренировку меняли после сообщения — открыт день без выделения');
  Nav.go('#/train/day/' + r.date + (r.focus ? '?f=' + encodeURIComponent(r.focus) : ''));
}
ACT.attGo = el => { const m = Chat.find(CS.cid, el.dataset.id); if(m && m.att) attOpen(m.att) };
/* «Подробнее» — раскрыть снимок на месте, без перерисовки ленты. */
ACT.attMore = el => { const id = el.dataset.id, card = el.closest('.attc'), on = !CH.open.has(id);
  on ? CH.open.add(id) : CH.open.delete(id);
  if(card){ card.classList.toggle('open', on); el.textContent = on ? 'Свернуть' : 'Подробнее'; el.setAttribute('aria-expanded', on) } };
ACT.quoteGo = el => { const x = document.getElementById('m-' + el.dataset.id); if(x){ x.scrollIntoView({block:'center', behavior:motion()}); x.classList.add('flash'); setTimeout(() => x.classList.remove('flash'), 1400) } };
/* Касание сообщения — действия с ним. */
ACT.msgTap = el => {
  const m = Chat.find(CS.cid, el.dataset.id); if(!m) return;
  Sheet.open(`<div class="shh"><span class="t"><b>${m.by === 't' ? esc(TRAINER.n) : 'Ваше сообщение'}</b><s>${esc(daySep(m.at.slice(0, 10)))}, ${hmS(m.at)}</s></span><button class="ib" data-act="sheetClose">${ICO.x}</button></div>
    <p class="plan" style="margin-bottom:10px">${esc(String(m.text || '').slice(0, 200))}</p>
    <div class="list">
      ${UI.row({ico:ICO.chat, title:'Ответить с цитатой', act:'msgReply', data:`data-id="${esc(m.id)}"`, chev:false})}
      ${m.att && attGoLabel(Chat.attResolve(CS.cid, m.att), m.att) ? UI.row({ico:ICO.cal, title:attGoLabel(Chat.attResolve(CS.cid, m.att), m.att), sub:esc(Chat.attKind(m.att) + ' · ' + attDay(m.att.date)), act:'msgAtt', data:`data-id="${esc(m.id)}"`, chev:false}) : ''}
      ${UI.row({ico:ICO.edit, title:'Скопировать текст', act:'msgCopy', data:`data-id="${esc(m.id)}"`, chev:false})}
    </div>`);
};
/* Ответ на сообщение: цитата над полем ввода, набранный текст не теряется. */
function replyTo(id){
  const m = Chat.find(CS.cid, id); if(!m) return;
  const d = Chat.draft('c', CS.cid) || {}, t = $('#cm-t');
  Chat.setDraft('c', CS.cid, {...d, text: t ? t.value : (d.text || ''), rep:Chat.quoteOf(m)});
  CH.keep = true; CH.focus = true; App.refresh();
}
ACT.msgReply = el => { Sheet.close(true); replyTo(el.dataset.id) };

/* Свайп вправо по сообщению — ответить, как в мессенджерах. Пузырь едет за
   пальцем, из-под него проявляется стрелка; дотянул до порога — стрелка
   залита, отпустил — цитата над полем ввода. Вертикальное движение — это
   прокрутка, свайп не начинается. Касание без сдвига — меню, как раньше. */
function wireSwipe(v){
  const box = $('.chatb', v); if(!box) return;
  const ARM = 56;
  let S = null;
  const reset = s => { s.row.classList.remove('drag', 'armed'); s.bub.style.transform = ''; s.row.style.removeProperty('--sw') };
  box.addEventListener('pointerdown', e => {
    const bub = e.target.closest('.cm .bub'); if(!bub || (e.pointerType === 'mouse' && e.button !== 0)) return;
    S = {x:e.clientX, y:e.clientY, bub, row:bub.closest('.cm'), id:bub.dataset.id, pid:e.pointerId, mode:null, armed:false};
  });
  box.addEventListener('pointermove', e => {
    if(!S || e.pointerId !== S.pid) return;
    const dx = e.clientX - S.x, dy = e.clientY - S.y;
    if(!S.mode){
      if(Math.abs(dy) > 10 && Math.abs(dy) > Math.abs(dx)){ S = null; return }
      if(dx > 10 && dx > Math.abs(dy) * 1.2){ S.mode = 'swipe'; S.row.classList.add('drag'); try{ S.bub.setPointerCapture(e.pointerId) }catch(_){} }
      else return;
    }
    e.preventDefault();
    const t = Math.min(90, Math.max(0, dx < 64 ? dx : 64 + (dx - 64) * .25));
    S.bub.style.transform = 'translateX(' + t + 'px)';
    S.row.style.setProperty('--sw', Math.min(1, t / ARM).toFixed(2));
    const arm = t >= ARM;
    if(arm !== S.armed){ S.armed = arm; S.row.classList.toggle('armed', arm); if(arm && navigator.vibrate) try{ navigator.vibrate(8) }catch(_){} }
  });
  box.addEventListener('pointerup', e => {
    if(!S || e.pointerId !== S.pid) return;
    const s = S; S = null; if(s.mode !== 'swipe') return;
    reset(s); CH.swallow = Date.now();
    if(s.armed) replyTo(s.id);
  });
  box.addEventListener('pointercancel', () => { if(S && S.mode === 'swipe') reset(S); S = null });
}
/* Клик, который браузер шлёт после свайпа, не должен открыть меню или задание. */
addEventListener('click', e => { if(CH.swallow && Date.now() - CH.swallow < 450 && e.target.closest('.cm')){ e.preventDefault(); e.stopImmediatePropagation(); CH.swallow = 0 } }, true);
ACT.msgAtt = el => { const m = Chat.find(CS.cid, el.dataset.id); Sheet.close(true); if(m && m.att) attOpen(m.att) };
ACT.msgCopy = el => { const m = Chat.find(CS.cid, el.dataset.id); try{ navigator.clipboard.writeText(m.text) }catch(_){} Sheet.close(); toast('Текст скопирован') };

/* Прежняя переписка приложения (обсуждения-ветки) переезжает в единый чат один
   раз: у каждой записи свой источник, повторный запуск дублей не даёт. */
function migrateTalk(){
  const old = CS.talk || {}; const keys = Object.keys(old);
  if(!keys.length){ if(CS.talk || CS.read){ delete CS.talk; delete CS.read; saveCS() } return 0 }
  let n = 0;
  keys.forEach(key => { const [cid, id] = key.split('|');
    (old[key] || []).forEach((m, i) => {
      const src = 'cst:' + key + ':' + i;
      const date = id.startsWith('w:') ? id.slice(2) : (m.day || TODAY);
      const att = id.startsWith('w:') ? Chat.snap(cid, date, {k:'day'}) : Chat.snap(cid, date, {k:'ex', exId:id.slice(2)});
      Chat.tx('c', cid, o => { if(o.m.some(x => x.src === src)) return;
        o.m.push({id:Chat.uid(), src, by:'c', text:m.text, at:m.at && /^\d{4}-/.test(m.at) ? m.at : date + 'T12:00:00', ...(att ? {att} : {}), ...(m.p ? {sim:1} : {})}); n++ });
    }) });
  delete CS.talk; delete CS.read; saveCS();
  return n;
}

Object.assign(DEMO_SHEET, {
  ask: () => { const d = Side.anyWork(); const W = Model.workout(d); const u = W.units.find(x => x.part && x.part.type === 'ex');
    if(!u) return Nav.go('#/chat');
    Nav.go('#/train/day/' + d); setTimeout(() => askCoach({k:'ex', d, id:u.part.key}), 80) },
  reply: () => { Nav.go('#/chat'); setTimeout(() => { const L = Chat.list(CS.cid, 'c'), m = [...L].reverse().find(x => x.by === 't') || L[L.length - 1];
    if(m) ACT.msgTap({dataset:{id:m.id}}); else toast('В диалоге пока нет сообщений') }, 80) },
});
