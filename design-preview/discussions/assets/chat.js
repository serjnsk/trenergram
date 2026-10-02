/* ═══════════════════════════════════════════════════════════════
   ЕДИНЫЙ ЧАТ ТРЕНЕР ↔ КЛИЕНТ

   Один хронологический диалог на пару «тренер — клиент». Тренировка, блок
   или конкретное упражнение конкретного дня — не отдельная ветка, а вложение
   сообщения. Вложение хранит снимок задания на момент отправки (дата,
   название, назначение) и адрес задания (дата + номер блока + номер строки),
   поэтому одинаковые упражнения разных дней не смешиваются, а правка или
   удаление плана не ломают старое сообщение: карточка показывает снимок и
   честно пишет, что задание с тех пор изменилось.

   Инструкции тренера к дню и заметки к блоку (COM-4) — часть задания, а не
   переписки: в чат они не попадают. Отметки, результаты и рекорды в чат сами
   не уходят — только то, что человек явно написал.

   Хранилище — отдельные ключи localStorage, общие для кабинета тренера и
   приложения клиента в одном браузере. Каждая сторона пишет только в свои
   ключи: trenergram.design.discussions.talk.c.<клиент> — сообщения клиента, что он прочёл, его
   черновик; trenergram.design.discussions.talk.t.<клиент> — то же у тренера. Читаются оба.
   Так вкладка тренера, отмечая прочитанное, физически не может затереть
   свежее сообщение или черновик клиента, и наоборот. Каждая запись читает
   свежую копию своего ключа и дописывает к ней.

   Отправка «без сети» в прототипе — имитация: сообщение лежит в этом браузере
   с пометкой sim и показывается тренеру, когда клиент «включит сеть».
   Настоящего сервера здесь нет.
   ═══════════════════════════════════════════════════════════════ */
const CHAT_KEY = 'trenergram.design.discussions.talk';
const Chat = {
  _seeds: {},

  /* ─── хранилище: ключ стороны side ('c' | 't') для клиента cid ─── */
  key(side, cid){ return CHAT_KEY + '.' + side + '.' + cid },
  get(side, cid){
    let o = null;
    try{ o = JSON.parse(localStorage.getItem(Chat.key(side, cid)) || 'null') }catch(_){}
    o = o && typeof o === 'object' ? o : {};
    o.m ||= []; o.read ||= []; if(!('dr' in o)) o.dr = null;
    return o;
  },
  /* Прочитать свежую копию своего ключа, изменить, записать. */
  tx(side, cid, fn){
    const o = Chat.get(side, cid); const r = fn(o);
    try{ localStorage.setItem(Chat.key(side, cid), JSON.stringify(o)) }catch(_){}
    return r;
  },
  uid(){ return 'm' + Date.now().toString(36) + Math.random().toString(36).slice(2, 7) },
  /* Отпечаток содержимого дня: по нему видно, менял ли тренер задание после сообщения. */
  sig(c){ let h = 2166136261; const t = String(c || ''); for(let i = 0; i < t.length; i++){ h ^= t.charCodeAt(i); h = Math.imul(h, 16777619) } return (h >>> 0).toString(36) },

  /* ─── сообщения ───
     side: 'c' — смотрит клиент, 't' — тренер. Тренер не видит сообщений
     клиента, которые ещё «не ушли» (имитация без сети). */
  list(cid, side){
    const C = Chat.get('c', cid), T = Chat.get('t', cid);
    /* wiped — клиент удалил аккаунт: переписки нет ни у кого, демо тоже не возвращается */
    if(C.wiped) return [];
    const st = [...C.m.map(m => ({...m, by:'c'})), ...T.m.map(m => ({...m, by:'t'}))];
    const ids = new Set(st.map(m => m.id));
    let all = [...Chat.seeds(cid).filter(m => !ids.has(m.id)), ...st];
    if(side === 't') all = all.filter(m => !(m.by === 'c' && m.sim));
    return all.sort((a, b) => a.at < b.at ? -1 : a.at > b.at ? 1 : 0);
  },
  find(cid, id){ return Chat.list(cid).find(m => m.id === id) || null },
  send(cid, by, {text, att, rep, sim} = {}){
    const m = {id:Chat.uid(), by, text:String(text || '').trim(), at:new Date().toISOString()};
    if(att) m.att = att; if(rep) m.rep = rep; if(sim && by === 'c') m.sim = 1;
    /* своё сообщение отправитель прочёл — и всё, что было до него */
    const seen = Chat.list(cid).filter(x => x.by !== by).map(x => x.id);
    Chat.tx(by, cid, o => { o.m.push(m); o.read = [...new Set([...o.read, ...seen])] });
    return m;
  },
  /* Цитата: кто сказал, начало текста и что было приложено. */
  quoteOf(m){ return m ? {id:m.id, by:m.by, text:String(m.text || '').slice(0, 160), att: m.att ? {k:m.att.k, name:(m.att.snap || {}).name || ''} : null} : null },

  /* ─── непрочитанное, отдельно у каждой стороны ─── */
  unreadMsgs(cid, side){
    const read = new Set(Chat.get(side, cid).read), other = side === 'c' ? 't' : 'c';
    return Chat.list(cid, side).filter(m => m.by === other && !read.has(m.id) && !(m.seedRead && m.seedRead[side]));
  },
  unread(cid, side){ return Chat.unreadMsgs(cid, side).length },
  /* Пишет, только если есть что отметить: лишняя запись — лишний шанс гонки. */
  markRead(cid, side){
    const un = Chat.unreadMsgs(cid, side); if(!un.length) return;
    Chat.tx(side, cid, o => { o.read = [...new Set([...o.read, ...un.map(m => m.id)])] });
  },
  /* Диалоги для тренера: у кого есть сообщения, непрочитанные и свежие сверху. */
  dialogs(){
    return CLIENTS.map(c => { const L = Chat.list(c.id, 't'); return {c, last:L[L.length - 1] || null, n:L.length, un:Chat.unread(c.id, 't')} })
      .filter(x => x.n).sort((a, b) => (b.un ? 1 : 0) - (a.un ? 1 : 0) || (a.last.at < b.last.at ? 1 : -1));
  },
  /* Сколько диалогов ждут тренера. */
  unreadDialogs(){ return CLIENTS.filter(c => Chat.unread(c.id, 't') > 0).length },

  /* ─── черновики: свои у каждой стороны и каждого диалога ─── */
  draft(side, cid){ return Chat.get(side, cid).dr || null },
  setDraft(side, cid, d){
    Chat.tx(side, cid, o => { o.dr = d && (String(d.text || '').trim() || d.att || d.rep) ? d : null });
  },

  /* Удаление аккаунта клиента: диалог исчезает у обеих сторон (флаг в ключе клиента). */
  wipe(cid){ Chat.tx('c', cid, o => { o.m = []; o.read = []; o.dr = null; o.wiped = true }) },

  /* ─── имитация отправки без сети ─── */
  simCount(cid){ return Chat.get('c', cid).m.filter(m => m.sim).length },
  flushSim(cid){ return Chat.tx('c', cid, o => { let n = 0; o.m.forEach(m => { if(m.sim){ delete m.sim; n++ } }); return n }) },

  /* Первая версия хранила всё одним ключом — раскладываем по сторонам один раз. */
  upgrade(){
    let old = null; try{ old = JSON.parse(localStorage.getItem(CHAT_KEY) || 'null') }catch(_){}
    if(!old || !old.d) return;
    Object.entries(old.d).forEach(([cid, b]) => {
      ['c', 't'].forEach(side => Chat.tx(side, cid, o => {
        const have = new Set(o.m.map(m => m.id));
        (b.m || []).filter(m => m.by === side && !have.has(m.id)).forEach(m => { const x = {...m}; delete x.by; o.m.push(x) });
        o.read = [...new Set([...o.read, ...((side === 'c' ? b.rc : b.rt) || [])])];
        if(b.wiped && side === 'c') o.wiped = true;
        const dr = ((old.dr || {})[side] || {})[cid]; if(dr && !o.dr) o.dr = dr;
      }));
    });
    try{ localStorage.removeItem(CHAT_KEY) }catch(_){}
  },
  isChatKey(k){ return !!k && k.indexOf(CHAT_KEY) === 0 },

  /* ═══════════ ВЕТКИ ОБСУЖДЕНИЙ (версия 2) ═══════════
     Переписка не одним диалогом, а ветками на объекте: тренировка дня
     («w:<дата>») или упражнение («x:<id упражнения>»). Хранилище по сторонам,
     непрочитанное и «без сети» — те же, что у чата; у сообщения — поле th.
     У демо-переписки ветка выводится из вложения. */
  thOf(m){
    if(m.th) return m.th;
    const a = m.att;
    if(a){ if(a.k === 'ex' && a.exId) return 'x:' + a.exId; if(a.date) return 'w:' + a.date }
    const mm = String(m.id || '').match(/^seed:wk:[^@]+@(\d{4}-\d{2}-\d{2})/); if(mm) return 'w:' + mm[1];
    return 'w:' + String(m.at || '').slice(0, 10);
  },
  /* О чём ветка: вид, название, дата (у тренировки) или упражнение. */
  thInfo(cid, th){
    const x = th.slice(2);
    if(th[0] === 'x'){ const e = byId(x); return {kind:'x', t:e ? e.ru : 'Упражнение', exId:x, e} }
    const D = Chat.dayOf(cid, x);
    return {kind:'w', t:D && D.has ? D.title : 'Тренировка', date:x};
  },
  threads(cid, side){ const T = {}; Chat.list(cid, side).forEach(m => (T[Chat.thOf(m)] ||= []).push(m)); return T },
  thread(cid, side, th){ return Chat.list(cid, side).filter(m => Chat.thOf(m) === th) },
  thUnread(cid, side, th){ return Chat.unreadMsgs(cid, side).filter(m => Chat.thOf(m) === th) },
  markThread(cid, side, th){
    const un = Chat.thUnread(cid, side, th); if(!un.length) return;
    Chat.tx(side, cid, o => { o.read = [...new Set([...o.read, ...un.map(m => m.id)])] });
  },
  /* Сообщение в ветку; всё, что было в ней до него, отправитель прочёл. */
  say(cid, by, th, text, sim){
    const m = {id:Chat.uid(), by, th, text:String(text || '').trim(), at:new Date().toISOString()};
    if(sim && by === 'c') m.sim = 1;
    Chat.markThread(cid, by, th);
    Chat.tx(by, cid, o => { o.m.push(m) });
    return m;
  },
  /* Для тренера: ветки всех клиентов, где ждут ответа — сверху. */
  allThreads(){
    const out = [];
    CLIENTS.forEach(c => Object.entries(Chat.threads(c.id, 't')).forEach(([th, L]) =>
      out.push({c, th, last:L[L.length - 1], n:L.length, un:Chat.thUnread(c.id, 't', th).length})));
    return out.sort((a, b) => (b.un ? 1 : 0) - (a.un ? 1 : 0) || (a.last.at < b.last.at ? 1 : -1));
  },
  unreadThreads(cid, side){ return Object.keys(Chat.threads(cid, side)).filter(th => Chat.thUnread(cid, side, th).length).length },

  /* ═══════════ ВЛОЖЕНИЕ: ссылка на задание + снимок ═══════════
     Вложение хранит постоянные ID (did — день, bid — блок, iid — строка; см.
     assets/data.js) в контексте клиента и снимок на момент отправки: дату,
     названия, назначение двумя голосами (client — кг клиента, plan — как
     писал тренер), отпечаток содержимого дня без ID (sig). Снимок не режется:
     сокращает его только карточка на экране.
     sel: {k:'day'} | {k:'block', bid} | {k:'ex', iid}; для переноса прежней
     переписки ещё {k:'ex', exId | exName} — первое такое упражнение дня. */
  _dm: new Map(), _dmT: 0,
  dayOf(cid, date){
    const mk = cid + '@' + date;
    if(Chat._dm.has(mk)) return Chat._dm.get(mk);
    if(!Chat._dmT){ Chat._dmT = setTimeout(() => { Chat._dm.clear(); Chat._dmT = 0 }, 0) }
    let out = null;
    const c = client(cid);
    if(c && c.prog && program(c.prog)){
      const at = dayAt(c.prog, date);
      if(at && at.i >= 0){
        let p = null; try{ p = JSON.parse(at.c) }catch(_){}
        const pre = dayPre(c.prog, at.i);
        out = {at, c:at.c, fp:Chat.sig(stripIds(at.c)), id:(p && p.id) || pre,
          title: p && p.t && p.t !== 'Отдых' && p.t !== '—' ? p.t : 'Тренировка',
          blocks: p ? restoreBlocks(p, pre).filter(blockHas) : [], draft: !!(at.rec && at.rec.draft), has: contentHas(at.c)};
      }
    }
    Chat._dm.set(mk, out); return out;
  },
  /* Где в дне элемент с этим ID: блок и строка (с участниками суперсета). */
  locate(D, id){
    if(!D || !id) return null;
    for(let bi = 0; bi < D.blocks.length; bi++){ const b = D.blocks[bi];
      if(b.id === id) return {b, bi};
      const k = (b.items || []).findIndex(it => it.id === id);
      if(k >= 0) return {b, bi, it:b.items[k], ii:k};
    }
    return null;
  },
  itemTexts(it, pm){
    const sc = String(it.scheme || '').replace(/(\d)\s*[xхХ]\s*/g, '$1×');
    if(it.chain){ const parts = (it.parts || []).filter(partHas);
      const one = p => { const t = Chat.itemTexts(p, pm); return partName(p) + (t.client ? ' (' + t.client + ')' : '') };
      const onePlan = p => { const t = Chat.itemTexts(p, pm); return partName(p) + (t.plan ? ' (' + t.plan + ')' : '') };
      return {name: parts.map(partName).join(' + '), client: parts.map(one).join(' + '), plan: parts.map(onePlan).join(' + ')} }
    if(!it.exId) return {name: String(it.raw || '').trim(), client:'', plan:''};
    const e = byId(it.exId) || {ru:'Упражнение'};
    if(it.txt) return {name:e.ru, client:it.txt, plan:it.txt};
    let load = '';
    if(it.pct != null){ const kg = pm ? kgText(it, pm) : null; load = kg ? kg + ' кг' : 'вес от 1ПМ' }
    else if(it.val) load = loadText(it);
    /* Время — как в тренировке клиента: «2 × 1:30», «0:45», а не «2× · 90 сек» */
    if(it.pct == null && it.val && it.unit === 'сек'){
      const s = String(it.scheme || '').replace(/[xхХ]/g, '×').replace(/\s+/g, ''), m = s.match(/^(\d+)×(\d+)?$/), n = m ? +m[1] : 1;
      const t = mmssRaw(it.val) + (it.val2 ? RNG + mmssRaw(it.val2) : '');
      const one = n > 1 ? n + ' × ' + t : [s && !/^\d+$/.test(s) ? sc : '', t].filter(Boolean).join(' · ');
      return {name:e.ru, client:one, plan:one};
    }
    const plan = itemLabel(it), kgPlan = it.pct != null && pm ? kgText(it, pm) : null;
    return {name:e.ru, client:[sc, load].filter(Boolean).join(' · '), plan: [plan, kgPlan ? '→ ' + kgPlan + ' кг' : ''].filter(Boolean).join(' ')};
  },
  blockName(b){ return b.title || blockTypeLabel(b) || (isTextBlock(b) ? firstTextLine(b.text) || 'Блок текстом' : 'Блок') },
  /* pm — максимумы, от которых считать кг; по умолчанию те, что видит тренер.
     Приложение клиента передаёт свои (с максимумами, вписанными клиентом). */
  snap(cid, date, sel, pmIn){
    const D = Chat.dayOf(cid, date);
    const pm = pmIn || (typeof pmOf === 'function' ? pmOf(cid) : null);
    const byEx = sel.k === 'ex' && !sel.iid;
    const exId = byEx ? (sel.exId || (EX.find(e => e.ru === sel.exName) || EX.find(e => sel.exName && e.ru.startsWith(sel.exName)) || {}).id) : null;
    const hasEx = X => X && X.has && !X.draft && X.blocks.some(b => (b.items || []).some(it => it.exId === exId));
    /* Прежняя переписка об упражнении из дня, где его нет, — о последнем дне, где оно было. */
    if(byEx && exId && !sel.noBack && !hasEx(D)){
      for(let k = 1; k <= 7; k++){ const d2 = addDays(date, -k); if(hasEx(Chat.dayOf(cid, d2))) return Chat.snap(cid, d2, {...sel, noBack:true}, pm) }
    }
    if(!D || !D.has) return null;
    const base = {date, did:D.id, sig:D.fp};
    const dayAtt = () => ({...base, k:'day', snap:{day:D.title, name:D.title, presc:D.blocks.map(Chat.blockName).join(' · ')}});
    if(sel.k === 'day') return dayAtt();
    let L = null;
    if(sel.k === 'block') L = Chat.locate(D, sel.bid);
    else if(sel.iid) L = Chat.locate(D, sel.iid);
    else if(exId){ D.blocks.some((b, bi) => (b.items || []).some((it, ii) => { if(it.exId === exId){ L = {b, bi, it, ii}; return true } return false })) }
    if(!L) return byEx && exId ? {...base, k:'ex', exId, snap:{day:D.title, block:'', name:(byId(exId) || {}).ru || 'Упражнение', presc:'', plan:''}} : dayAtt();
    const b = L.b, bname = Chat.blockName(b), fmt = b.fmt && typeof b.fmt === 'object' ? fmtLabel(b.fmt) : '';
    if(sel.k === 'block' || !L.it){
      const its = (b.items || []).filter(it => itemHas(it));
      const lines = isTextBlock(b) ? textLines(b.text).map(l => l.replace(LIST_RE, ''))
        : its.map(it => { const t = Chat.itemTexts(it, pm); return it.chain ? t.client : t.name + (t.client ? ' ' + t.client : '') });
      const linesPlan = isTextBlock(b) ? lines : its.map(it => { const t = Chat.itemTexts(it, pm); return it.chain ? t.plan : t.name + (t.plan ? ' ' + t.plan : '') });
      return {...base, k:'block', bid:b.id, snap:{day:D.title, block:bname, name:bname, fmt, presc:lines.join('; '), plan:linesPlan.join('; ')}};
    }
    const t = Chat.itemTexts(L.it, pm);
    return {...base, k:'ex', bid:b.id, iid:L.it.id, exId:L.it.exId || null,
      snap:{day:D.title, block:bname, name:t.name, presc:t.client, plan:t.plan, fmt}};
  },

  /* ═══════════ ЧТО СТАЛО С ЗАДАНИЕМ ═══════════
     → {st, date, focus, legacy}
     st: same — как было; changed — тренировку меняли, но элемент на месте
     (ID тот же — подсвечиваем его); moved — тренировку перенесли на другой
     день; removed — элемента в тренировке больше нет; hidden — снята с
     публикации; gone — на этот день тренировки больше нет.
     focus — ID блока или строки для подсветки, null — открыть день без
     выделения. Старое вложение без ID указывает на номер строки: доверяем
     ему, только если день с тех пор не менялся (отпечаток совпал). */
  attResolve(cid, att){
    if(!att || !att.date) return {st:'same', date:null, focus:null};
    const D = Chat.dayOf(cid, att.date);
    const target = att.k === 'ex' ? att.iid : att.k === 'block' ? att.bid : null;
    const legacy = !att.did && !att.bid && !att.iid;
    if(legacy){
      if(!D || !D.has) return {st:'gone', date:att.date, focus:null, legacy};
      if(D.draft) return {st:'hidden', date:att.date, focus:null, legacy};
      const same = att.sig === D.fp || att.sig === stripIds(D.c);
      if(!same) return {st:'changed', date:att.date, focus:null, legacy};
      const b = att.bi != null ? D.blocks[att.bi] : null, it = b && att.ii != null ? (b.items || [])[att.ii] : null;
      const ok = att.k === 'ex' ? it && (!att.exId || it.exId === att.exId) : true;
      return {st:'same', date:att.date, focus: ok ? (att.k === 'ex' ? it.id : att.k === 'block' && b ? b.id : null) : null, legacy};
    }
    /* Черновик клиент не видит; тренеру строку всё равно показываем. */
    if(D && D.has && D.draft) return {st:'hidden', date:att.date, focus: target && Chat.locate(D, target) ? target : null};
    const here = D && D.has && (target ? Chat.locate(D, target) : D.id === att.did);
    if(here) return {st: D.fp === att.sig ? 'same' : 'changed', date:att.date, focus:target};
    /* Нет на своей дате — может, тренировку перенесли: ищем тот же ID рядом. */
    const want = target || att.did;
    for(let k = 1; k <= 45; k++) for(const sgn of [1, -1]){
      const d2 = addDays(att.date, k * sgn), D2 = Chat.dayOf(cid, d2);
      if(D2 && D2.has && !D2.draft && (target ? Chat.locate(D2, target) : D2.id === want)) return {st:'moved', date:d2, focus:target};
    }
    if(!D || !D.has) return {st:'gone', date:att.date, focus:null};
    return {st: target ? 'removed' : 'changed', date:att.date, focus:null};
  },
  /* Пояснение под карточкой: тренировку меняли, перенесли, убрали. side — 'c' или 't'. */
  attNote(r, att, side){
    const what = att.k === 'ex' ? 'Этого упражнения' : 'Этого блока';
    const D2 = s => { const d = D(s); return d.getDate() + ' ' + MONTHS[d.getMonth()] };
    switch(r.st){
      case 'changed': return r.legacy ? 'Тренировку изменили после сообщения — откроется день без выделения строки' : 'Тренировку изменили после сообщения — показан снимок на момент сообщения';
      case 'moved':   return 'Тренировку перенесли на ' + D2(r.date);
      case 'removed': return what + ' в тренировке больше нет — показан снимок на момент сообщения';
      case 'hidden':  return side === 't' ? 'Тренировка сейчас в черновике — клиент её не видит' : 'Тренировка сейчас снята с публикации';
      case 'gone':    return 'Тренировки на этот день больше нет — показан снимок на момент сообщения';
    }
    return '';
  },
  attKind(att){ return att.k === 'day' ? 'Тренировка' : att.k === 'block' ? 'Блок' : 'Упражнение' },
  /* Карточка вложения одинакова на обеих сторонах. Коротко: вид и дата,
     название, у упражнения — схема и нагрузка. «Подробнее» — остальной
     сохранённый контекст, ничего не обрезая и не повторяя названий.
     side 'c' — килограммы клиента, 't' — назначение, как его писал тренер. */
  attBrief(att, side){ const s = att.snap || {}; return att.k === 'ex' ? (side === 't' ? s.plan || s.presc : s.presc) || '' : '' },
  attRows(att, side){
    const s = att.snap || {}, rows = [];
    if(att.k !== 'day' && s.day) rows.push(['Тренировка', s.day]);
    if(att.k === 'ex' && s.block) rows.push(['Блок', s.block]);
    if(s.fmt) rows.push(['Формат', s.fmt]);
    if(att.k === 'day' && s.presc) rows.push(['Блоки', s.presc]);
    if(att.k === 'block'){ const v = side === 't' ? s.plan || s.presc : s.presc; if(v) rows.push(['Состав', v.split('; ').join('\n')]) }
    if(att.k === 'ex' && side === 't' && s.plan && s.presc && s.presc !== s.plan) rows.push(['У клиента', s.presc]);
    return rows;
  },

  /* ═══════════ СООБЩЕНИЕ ТРЕНЕРА К ДНЮ — «ОТПРАВИТЬ И В ЧАТ» ═══════════
     Сообщение ко всей тренировке (COM-4) — инструкция и живёт в задании. По
     галочке в конструкторе оно ещё и уходит в чат: сообщением тренера с этой
     тренировкой во вложении. Уходит, только когда клиент тренировку видит:
     опубликована — сразу, черновик — в момент публикации. Один раз: поправили
     текст после отправки — конструктор предложит «Отправить снова».
     Флаг и что ушло — в состоянии кабинета тренера: STATE.wchat[кто@дата]. */
  dmKey(sid, date){ return sid + '@' + date },
  dmGet(sid, date){ return ((typeof STATE !== 'undefined' && STATE.wchat) || {})[Chat.dmKey(sid, date)] || null },
  dmText(sid, date){ return ((TALK.workout[talkKey(sid, date)] || []).find(m => m.who === 'trainer') || {}).text || '' },
  /* Кому: клиенту — ему; группе — участникам, у кого в этот день тренировка группы. */
  dmTargets(sid, date){
    const G = typeof grp === 'function' ? grp(sid) : null;
    if(!G) return [sid];
    return G.members.filter(cid => { const m = memberDay(cid, date); return m.g === G.id && m.has });
  },
  dmVisible(cid, date){ const D = Chat.dayOf(cid, date); return !!(D && D.has && !D.draft) },
  /* Состояние для подписи под полем: off · empty · wait · sent · changed. */
  dmState(sid, date){
    const w = Chat.dmGet(sid, date), text = Chat.dmText(sid, date);
    if(!w || !w.on) return {st:'off'};
    if(!text.trim()) return {st:'empty'};
    if(w.sent) return {st: w.sent.h === Chat.sig(text) ? 'sent' : 'changed', at:w.sent.at, n:w.sent.n};
    return {st:'wait'};
  },
  dmSet(sid, date, on){
    STATE.wchat ||= {}; const k = Chat.dmKey(sid, date);
    if(on) STATE.wchat[k] = {...(STATE.wchat[k] || {}), on:1}; else if(STATE.wchat[k]) STATE.wchat[k].on = 0;
  },
  dmClear(sid, date){ if(STATE.wchat) delete STATE.wchat[Chat.dmKey(sid, date)] },
  /* Отправить, если пора. force — «Отправить снова» после правки текста. */
  dmFlush(sid, date, force){
    const w = Chat.dmGet(sid, date), text = Chat.dmText(sid, date).trim();
    if(!w || !w.on || !text) return 0;
    if(w.sent && !force) return 0;
    const to = Chat.dmTargets(sid, date).filter(cid => Chat.dmVisible(cid, date));
    if(!to.length) return 0;
    to.forEach(cid => Chat.send(cid, 't', {text, att:Chat.snap(cid, date, {k:'day'})}));
    w.sent = {h:Chat.sig(text), at:new Date().toISOString(), n:to.length};
    if(typeof saveState === 'function') saveState();
    return to.length;
  },

  /* ═══════════ ПЕРЕНОС ПРЕЖНЕЙ ПЕРЕПИСКИ ═══════════
     Демо-переписка из данных тренера (вопросы под тренировками, ветки
     упражнений) складывается в единый диалог при каждом запуске — с
     постоянными id, поэтому дублей нет, а даты едут вместе с остальными
     демо-данными. Сообщение тренера к дню — инструкция: в чат не идёт. */
  seeds(cid){
    if(Chat._seeds[cid]) return Chat._seeds[cid];
    const out = [], c = client(cid); if(!c) return (Chat._seeds[cid] = out);
    const MON = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
    const ruDate = s => { const m = String(s || '').match(/(\d{1,2})\s+([а-яё]{3})/i); if(!m) return null;
      const k = MON.indexOf(m[2].toLowerCase()); if(k < 0) return null;
      return shiftDate(ANCHOR.slice(0, 4) + '-' + String(k + 1).padStart(2, '0') + '-' + String(m[1]).padStart(2, '0')) };
    /* ветки упражнений → сообщения с вложением упражнения того дня */
    Object.entries(TALK.item || {}).forEach(([k, arr]) => { const [cc, exId] = k.split('@'); if(cc !== cid) return;
      let first = null;
      arr.forEach((m, i) => { const date = ruDate(m.at) || TODAY, by = m.who === 'trainer' ? 't' : 'c';
        const msg = {id:'seed:it:' + k + ':' + i, by, text:m.text, at:date + 'T' + (by === 't' ? '20:40' : '19:15') + ':00', seedRead:{c:true, t:true}};
        if(!first && by === 'c'){ msg.att = Chat.snap(cid, date, {k:'ex', exId}); first = msg }
        else if(first && by === 't') msg.rep = Chat.quoteOf(first);
        out.push(msg) }) });
    /* разговор под тренировкой: всё, кроме инструкции тренера к дню */
    Object.entries(TALK.workout || {}).forEach(([k, arr]) => { const [cc, date] = k.split('@'); if(cc !== cid) return;
      const ins = arr.findIndex(m => m.who === 'trainer');
      let first = null;
      arr.forEach((m, i) => { if(i === ins) return; const by = m.who === 'trainer' ? 't' : 'c';
        const msg = {id:'seed:wk:' + k + ':' + i, by, text:m.text, at:date + 'T' + (by === 't' ? '21:00' : '19:30') + ':00', seedRead:{c:true, t:true}};
        if(!first && by === 'c'){ msg.att = Chat.snap(cid, date, {k:'day'}); first = msg } else if(first) msg.rep = Chat.quoteOf(first);
        out.push(msg) }) });
    /* вопросы из ленты дашборда: вопрос клиента и, если был, ответ тренера */
    (c.comments || []).forEach((cm, i) => {
      const att = cm.ex ? Chat.snap(cid, cm.d, {k:'ex', exName:cm.ex}) : Chat.snap(cid, cm.d, {k:'day'});
      const answered = !!(cm.reply || (typeof STATE !== 'undefined' && STATE.replied && STATE.replied[cid + ':' + i]));
      const q = {id:'seed:cm:' + cid + ':' + i, by:'c', text:cm.tx, at:cm.d + 'T18:30:00', seedRead:{c:true, t:answered}};
      if(att) q.att = att;
      out.push(q);
      if(cm.reply) out.push({id:'seed:cmr:' + cid + ':' + i, by:'t', text:cm.reply, at:cm.d + 'T21:05:00', rep:Chat.quoteOf(q),
        seedRead:{c: daysBetween(cm.d, TODAY) > 2, t:true}});
    });
    return (Chat._seeds[cid] = out);
  },
};
Chat.upgrade();
