/* ═══════════════════════════════════════════════════════════════
   МОДЕЛЬ КЛИЕНТА — тренировки глазами клиента

   Источник — те же дни, что тренер составляет в календаре и конструкторе
   (dayAt / restoreBlocks из data.js). Правила показа клиенту:
   · видно только опубликованное (CON-20): черновик — как будто дня нет;
   · процентов нет — только килограммы от максимума клиента (CON-16);
   · текст — как написал тренер (CON-5, CON-19), диапазон — «84–96 кг» (CON-24);
   · сообщение тренера к дню и заметка к блоку видны (COM-4).
   ═══════════════════════════════════════════════════════════════ */
const hash32 = s => { let h = 2166136261; for(let i = 0; i < s.length; i++){ h ^= s.charCodeAt(i); h = Math.imul(h, 16777619) } return h >>> 0 };
const numOf = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isNaN(n) ? null : n };
const PLACEHOLDER_T = new Set(['', 'Отдых', '—']);

const Model = {
  memo: {}, lastPubMemo: {},
  flush(){ Model.memo = {}; Model.lastPubMemo = {} },
  cid(){ return CS.cid },
  me(){ const c = client(CS.cid); return c ? {...c, ...(CS.prof[CS.cid] || {})} : null },
  pid(){ const c = client(CS.cid); return c && c.prog && program(c.prog) ? c.prog : null },
  grp(){ return groupOf(CS.cid) },

  /* ─── день клиента ─── */
  day(date, cid = CS.cid){
    const mk = cid + '@' + date;
    if(Model.memo[mk]) return Model.memo[mk];
    const c = client(cid), base = {date, cid, kind:'none'};
    let out = base;
    if(c && c.prog && program(c.prog)){
      const at = dayAt(c.prog, date);
      if(!at || at.i < 0) out = {...base, kind:'before'};
      else if(at.rec && at.rec.draft) out = {...base, kind:'hidden'};
      else {
        let parsed = null; try{ parsed = JSON.parse(at.c) }catch(_){}
        const has = contentHas(at.c), comp = !!(parsed && parsed.c);
        if(!has && !comp) out = {...base, kind: date <= Model.lastPub(cid) ? 'rest' : 'unplanned'};
        else {
          /* ID блоков и строк — постоянные, из слепка тренера (или выведенные из места
             в программе у заготовок и старых дней — так же, как в кабинете тренера). */
          const pre = dayPre(c.prog, at.i);
          const blocks = has ? restoreBlocks(parsed, pre).filter(blockHas) : [];
          const t = parsed && !PLACEHOLDER_T.has(parsed.t || '') ? parsed.t : '';
          /* sig — содержимое без ID: по нему видно, менял ли тренер тренировку. */
          out = {...base, kind:'work', title: t || (comp ? 'Соревнование' : 'Тренировка'), comp, g: at.g || null, blocks, sig: stripIds(at.c), did:(parsed && parsed.id) || pre};
        }
      }
    }
    return Model.memo[mk] = out;
  },
  /* Последний опубликованный день с тренировкой — дальше «тренер ещё не написал». */
  lastPub(cid = CS.cid){
    if(cid in Model.lastPubMemo) return Model.lastPubMemo[cid];
    const c = client(cid); let res = '';
    if(c && c.prog && program(c.prog)){
      for(let i = planLength(c.prog) - 1; i >= 0; i--){
        const d = dayDate(c.prog, i), at = dayAt(c.prog, d);
        if(at && !(at.rec && at.rec.draft) && contentHas(at.c)){ res = d; break }
      }
    }
    return Model.lastPubMemo[cid] = res;
  },
  progStart(cid = CS.cid){ const c = client(cid); return c && c.prog && program(c.prog) ? program(c.prog).start : null },

  /* ─── результаты дня ─── */
  resReal(date, cid = CS.cid){ return ((CS.res[cid] || {})[date]) || null },
  res(date, cid = CS.cid){
    const r = Model.resReal(date, cid); if(r) return r;
    return Model.seedRes(date, cid);
  },
  /* Демо-история: прошедшие тренировки выполнены как назначено, кроме пропусков.
     Доля выполненного — из карточки клиента (done / plan), после последней
     активности — пропуски. Не сохраняется: как только клиент что-то запишет
     сам, работает его запись. */
  seedRes(date, cid = CS.cid){
    if(date >= TODAY) return null;
    const c = client(cid); if(!c) return null;
    const d = Model.day(date, cid); if(d.kind !== 'work' || !d.blocks.length) return null;
    const forced = LOG.some(r => r.cid === cid && r.date === date);
    let done = forced;
    if(!forced){
      if(c.last && date > c.last) done = false;
      else { const ratio = c.plan ? c.done / c.plan : .8; done = (hash32(cid + date) % 100) < ratio * 100 + 4 }
    }
    if(!done) return null;
    const W = Model.workout(date, cid, true), u = {};
    W.units.forEach(x => { u[x.key] = x.type === 'result' ? {d:1, t:Model.seedResult(x.block)} : {d:1} });
    return {seed:1, st:1, fin:1, u};
  },
  seedResult(B){
    const f = B.fmt || {};
    if(f.k === 'AMRAP') return '6 раундов + 4';
    if(f.k === 'FOR TIME') return f.total ? mmss(f.total * .72) : '9:48';
    if(f.rounds) return f.rounds + ' из ' + f.rounds;
    return 'выполнено';
  },
  /* k / n — сколько шагов отмечено из скольких: по ним кабинет тренера отличает
     «Выполнена» от «Частично», не собирая тренировку заново (factStatus в data.js). */
  saveRes(date, rec, cid = CS.cid){
    try{ const W = Model.workout(date, cid, true); rec.n = W.units.length; rec.k = W.units.filter(x => rec.u[x.key] && rec.u[x.key].d).length }catch(_){}
    (CS.res[cid] ||= {})[date] = rec; saveCS() },
  /* Запись дня для правки. Демо-история превращается в настоящую запись при
     первой же правке — дальше работает только она. */
  ensureRes(date){
    const real = Model.resReal(date); if(real) return real;
    const W = Model.workout(date), seed = Model.seedRes(date);
    const r = seed ? {st:1, fin:seed.fin, sig:W.d.sig, kv:2, u:JSON.parse(JSON.stringify(seed.u))} : {st:Date.now(), sig:W.d.sig, kv:2, u:{}};
    Model.saveRes(date, r); return r;
  },

  /* Статус дня — один для главной, календаря, тренировки и прогресса:
     prog — начата (есть своя запись), но не завершена; все галочки без
            «Завершить» — тоже ещё «в процессе»;
     done — «Выполнена»: нажато «Завершить», отмечено всё;
     part — «Частично»: нажато «Завершить», отмечено не всё;
     miss / today / planned — не начата: прошла, сегодня, впереди. */
  status(date, cid = CS.cid){
    const d = Model.day(date, cid);
    if(d.kind === 'rest') return {st:'rest', comp:false};
    if(d.kind !== 'work') return {st:'none', comp:false};
    if(!d.blocks.length) return {st: date < TODAY ? 'none' : 'planned', comp:d.comp};
    const r = Model.res(date, cid);
    const W = Model.workout(date, cid, true);
    const n = W.units.length, k = r ? W.units.filter(x => r.u[x.key] && r.u[x.key].d).length : 0;
    const own = Model.resReal(date, cid);
    let st = r && r.fin ? (n && k < n ? 'part' : 'done') : own ? 'prog' : date < TODAY ? 'miss' : date === TODAY ? 'today' : 'planned';
    return {st, comp:d.comp, n, k};
  },

  /* ─── максимумы (CON-16, PRO-4, PRO-6) ─── */
  pmBase(cid = CS.cid){ return STATE.pm && STATE.pm[cid] ? STATE.pm[cid] : ((client(cid) || {}).pm || {}) },
  pm(cid = CS.cid){
    const out = {...Model.pmBase(cid)};
    Object.entries(CS.pm[cid] || {}).forEach(([k, arr]) => { if(arr && arr.length) out[k] = arr[arr.length - 1].v });
    return out;
  },
  pmName(k){ return PMNAMES[k] || (byId(k) || {}).ru || k },
  pmFull(k){ const e = byId(k); return e ? e.ru : Model.pmName(k) },
  /* История максимума: из карточки (что вносил тренер) плюс записи клиента. */
  pmHist(k, cid = CS.cid){
    const c = client(cid) || {}, h = ((c.hist || {})[k] || []).map(([d, v]) => ({date:d, v, by:'trainer'}));
    const base = Model.pmBase(cid)[k];
    if(!h.length && base) h.push({date:null, v:base, by:'trainer'});
    (CS.pm[cid] || {})[k]?.forEach(x => h.push({date:x.at, v:x.v, by:'client', p:x.p}));
    return h;
  },
  pmKeys(cid = CS.cid){
    const keys = new Set([...Object.keys(Model.pmBase(cid)), ...Object.keys(CS.pm[cid] || {})]);
    return [...keys].filter(k => Model.pm(cid)[k]);
  },
  setPm(k, v){
    (CS.pm[CS.cid] ||= {})[k] ||= [];
    CS.pm[CS.cid][k].push({v, at:TODAY, ...pendMark()});
    saveCS();
  },

  /* ─── тренировка: блоки → части → шаги ─── */
  workout(date, cid = CS.cid, quick){
    const d = Model.day(date, cid);
    const W = {d, date, blocks:[], units:[]};
    if(d.kind !== 'work') return W;
    const pm = Model.pm(cid);
    d.blocks.forEach((b, bi) => {
      /* Ключи шагов — постоянные ID блока и строки: отметка остаётся у своего
         упражнения, даже если тренер переставит строки. */
      const B = {bi, key:b.id, title:b.title || '', kind:b.kind || null, fmt:b.fmt || null, note:b.note || '', parts:[]};
      B.label = b.title || blockTypeLabel(b) || (isTextBlock(b) ? 'Блок' : 'Блок');
      B.type = b.kind ? typeName(b.kind) : '';
      if(isTextBlock(b)){
        B.mode = 'text'; B.text = b.text;
        W.units.push({key:B.key + '.t', type:'text', block:B});
      } else {
        B.mode = b.fmt ? 'result' : 'sets';
        const its = b.items || [];
        let k = 0;
        while(k < its.length){
          const it = its[k];
          if(it.ss){
            const j = ssEnd(its, k);
            const mem = [];
            for(let m = k + 1; m < j; m++) if(itemHas(its[m])) mem.push(Model.part(its[m], its[m].id, pm, true));
            if(mem.length){
              const S = {type:'ss', key:it.id, rounds:+it.rounds || 1, rest:it.rest || '', members:mem};
              B.parts.push(S);
              if(B.mode === 'sets') for(let r = 1; r <= S.rounds; r++) W.units.push({key:S.key + '.r' + r, type:'round', block:B, part:S, n:r});
            }
            k = j; continue;
          }
          if(itemHas(it)){
            const P = Model.part(it, it.id, pm);
            B.parts.push(P);
            if(B.mode === 'sets'){
              if(P.type === 'ex' && P.sets.length) P.sets.forEach(s => W.units.push({key:s.key, type:'set', block:B, part:P, set:s}));
              else W.units.push({key:P.key, type:'item', block:B, part:P});
            }
          }
          k++;
        }
        if(B.mode === 'result') W.units.push({key:B.key + '.res', type:'result', block:B});
      }
      W.blocks.push(B);
    });
    return W;
  },
  /* Одна строка блока в виде для клиента. inSS — участник суперсета: его
     назначение — на один круг, подходы считаются кругами. */
  part(it, key, pm, inSS){
    if(it.chain){
      const parts = (it.parts || []).filter(partHas).map(p => {
        const e = p.exId ? byId(p.exId) : null, L = Model.load(p, pm);
        return {name: partName(p), exId: p.exId || null, scheme: p.txt ? p.txt : (p.scheme || ''), load: L};
      });
      return {type:'chain', key, parts};
    }
    if(!it.exId) return {type:'raw', key, text: String(it.raw || '').trim()};
    const e = byId(it.exId) || {id:it.exId, ru:'Упражнение', en:'', u:[]};
    if(it.txt) return {type:'txtex', key, exId:e.id, e, txt:it.txt};
    const L = Model.load(it, pm);
    const P = {type:'ex', key, exId:e.id, e, scheme:it.scheme || '', load:L, pmKey:pmKey(e)};
    /* Нет схемы подходов — нет и строк подходов: отмечается упражнение целиком,
       нагрузка или дистанция остаются видны в строке под названием. */
    P.solo = !inSS && !String(it.scheme || '').trim();
    P.sets = inSS || P.solo ? [] : Model.sets(it, L, key);
    P.meta = Model.meta(it, L, P.sets);
    if(inSS) P.round = Model.oneRound(it, L);
    return P;
  },
  /* Нагрузка строки: кг от максимума, фиксированный вес или единица упражнения. */
  load(it, pm){
    const e = it.exId ? byId(it.exId) : null;
    const L = {kind:'none', unit:it.unit || '', val:null, val2:null, kg:null, kgHi:null, needPm:false, pmKey: e ? pmKey(e) : null, free:''};
    if(it.pct != null){
      L.kind = 'kg';
      L.kg = workKg(it, pm);
      L.kgHi = it.pct2 != null ? workKg({...it, pct:it.pct2}, pm) : null;
      if(L.kgHi === L.kg) L.kgHi = null;
      if(L.kg == null) L.needPm = !!L.pmKey;
      return L;
    }
    const v = numOf(it.val), v2 = numOf(it.val2);
    if(it.val && v == null){ L.free = String(it.val); return L }
    if(v == null) return L;
    const u = L.unit;
    if(u === 'кг'){ L.kind = 'kg'; L.kg = v; L.kgHi = v2; return L }
    if(u === 'сек'){ L.kind = 'time'; L.val = v; L.val2 = v2; return L }
    if(u === 'мин'){ L.kind = 'time'; L.val = v * 60; L.val2 = v2 != null ? v2 * 60 : null; return L }
    if(u === 'м'){ L.kind = 'dist'; L.val = v; L.val2 = v2; return L }
    if(u === 'кал'){ L.kind = 'cal'; L.val = v; L.val2 = v2; return L }
    if(u === 'повт'){ L.kind = 'reps'; L.val = v; L.val2 = v2; return L }
    L.kind = 'other'; L.val = v; L.val2 = v2; return L;
  },
  /* Схема → подходы: «5×3», «5x3», «2×», лесенка «21-15-9», «8». */
  schemeOf(sc){
    const s = String(sc || '').replace(/[xхХ]/g, '×').replace(/\s+/g, '');
    let m;
    if((m = s.match(/^(\d+)×(\d+)$/))) return {n:+m[1], reps:Array(+m[1]).fill(+m[2])};
    if((m = s.match(/^(\d+)×$/)))      return {n:+m[1], reps:Array(+m[1]).fill(null)};
    if(/^\d+(-\d+)+$/.test(s))         { const l = s.split('-').map(Number); return {n:l.length, reps:l, ladder:true} }
    if(/^\d+$/.test(s))                return {n:1, reps:[+s]};
    return {n:1, reps:[null], free: s ? String(sc) : ''};
  },
  sets(it, L, key){
    const S = Model.schemeOf(it.scheme);
    return S.reps.map((r, i) => {
      let reps = r;
      if(reps == null && L.kind === 'reps') reps = L.val;
      return {key: key + '.s' + (i + 1), n:i + 1, reps, kind:L.kind === 'reps' ? 'reps' : L.kind, kg:L.kg, kgHi:L.kgHi, val:L.val, val2:L.val2,
              needPm:L.needPm, free:L.free || S.free || ''};
    });
  },
  oneRound(it, L){ const S = Model.schemeOf(it.scheme); return {reps: S.reps[0] ?? (L.kind === 'reps' ? L.val : null), kind:L.kind, kg:L.kg, kgHi:L.kgHi, val:L.val, val2:L.val2, needPm:L.needPm, free:L.free || S.free || ''} },

  /* ─── тексты назначения ─── */
  kgTxt(kg, hi){ return kg == null ? '' : fmtN(kg) + (hi != null ? '–' + fmtN(hi) : '') + NB + 'кг' },
  valTxt(kind, v, v2){
    if(v == null) return '';
    const r = x => kind === 'time' ? mmss(x) : fmtN(x);
    const s = r(v) + (v2 != null ? '–' + r(v2) : '');
    return kind === 'time' ? s : kind === 'dist' ? s + NB + 'м' : kind === 'cal' ? s + NB + 'кал' : kind === 'reps' ? s + NB + 'повт' : s;
  },
  /* Всё назначенное одной строкой: схема · вес. Проценты клиенту не показываем. */
  meta(it, L, sets){
    const parts = [];
    const S = Model.schemeOf(it.scheme);
    const sc = String(it.scheme || '').replace(/(\d)\s*[xхХ]\s*/g, '$1×');
    if(L.kind === 'kg'){
      if(sc) parts.push(esc(sc));
      if(L.needPm) parts.push('вес от вашего 1ПМ');
      else if(L.kg != null) parts.push(`<span class="kg">${Model.kgTxt(L.kg, L.kgHi)}</span>`);
    } else if(L.kind === 'reps'){
      parts.push(esc(sc && !/^\d+$/.test(sc) ? sc + ' · ' + Model.valTxt('reps', L.val, L.val2) : Model.valTxt('reps', L.val, L.val2)));
    } else if(L.kind === 'time' || L.kind === 'dist' || L.kind === 'cal' || L.kind === 'other'){
      if(S.n > 1) parts.push(S.n + ' × ' + Model.valTxt(L.kind, L.val, L.val2));
      else { if(sc && !/^\d+$/.test(sc)) parts.push(esc(sc)); parts.push(Model.valTxt(L.kind, L.val, L.val2)) }
    } else {
      if(sc) parts.push(esc(sc) + (S.reps.length === 1 && S.reps[0] != null && !S.ladder ? NB + 'повт' : ''));
      if(L.free) parts.push(esc(L.free));
    }
    return parts.filter(Boolean).join(' · ');
  },
  /* Одна строка для прошлых результатов и «в прошлый раз». */
  roundTxt(R){
    if(R.needPm) return 'вес от 1ПМ' + (R.reps ? ' × ' + R.reps : '');
    if(R.kind === 'kg' && R.kg != null) return Model.kgTxt(R.kg, R.kgHi) + (R.reps ? ' × ' + R.reps : '');
    if(R.kind === 'reps') return Model.valTxt('reps', R.reps ?? R.val);
    if(R.val != null) return Model.valTxt(R.kind, R.val, R.val2) + (R.reps ? ' × ' + R.reps : '');
    if(R.reps) return R.reps + NB + 'повт';
    return R.free || '';
  },

  /* ─── факты: «в прошлый раз» и история упражнения (CLI-2) ─── */
  /* Факт по упражнению за день: максимальный вес выполненных подходов и схема. */
  factOn(date, exId, cid = CS.cid){
    const r = Model.res(date, cid);
    const logs = LOG.filter(x => x.cid === cid && x.exId === exId && x.date === date);
    if(logs.length){ const x = logs.sort((a, b) => (b.kg || 0) - (a.kg || 0))[0];
      return {date, kg:x.kg, text: x.kg != null ? kgS(x.kg) + ' · ' + x.scheme : (x.done || x.scheme)} }
    if(!r) return null;
    const W = Model.workout(date, cid, true);
    const us = W.units.filter(u => u.part && u.part.exId === exId && u.type === 'set');
    const done = us.filter(u => r.u[u.key] && r.u[u.key].d);
    if(done.length){
      const vals = done.map(u => ({kg: r.u[u.key].kg ?? u.set.kg, reps: r.u[u.key].r ?? u.set.reps, v: r.u[u.key].v ?? u.set.val, kind:u.set.kind}));
      const k0 = vals[0].kind;
      if(k0 === 'kg'){ const mx = Math.max(...vals.map(v => v.kg || 0)); if(!mx) return null;
        const top = vals.filter(v => v.kg === mx), reps = top.map(v => v.reps).filter(Boolean);
        return {date, kg:mx, text: kgS(mx) + ' · ' + top.length + '×' + (reps[0] ?? '')} }
      /* схема без веса («2×10»): подходы × повторы */
      if(k0 === 'reps' || (vals[0].v == null && vals.some(v => v.reps != null))){ const rs = vals.map(v => v.reps ?? '—');
        return {date, text: done.length + '×' + (rs.every(x => x === rs[0]) ? rs[0] : rs.join('/'))} }
      if(vals[0].v == null) return {date, text: done.length + ' ' + plural(done.length, 'подход', 'подхода', 'подходов')};
      return {date, text: done.length > 1 ? done.length + ' × ' + Model.valTxt(k0, vals[0].v) : Model.valTxt(k0, vals[0].v)};
    }
    const other = W.units.find(u => u.part && u.part.exId === exId && u.type === 'item' && r.u[u.key] && r.u[u.key].d);
    if(other){ const P = other.part, L = P.load;
      /* упражнение без схемы — отмечено целиком: факт — назначенная нагрузка */
      if(P.type === 'ex' && L){ if(L.kind === 'kg' && L.kg != null) return {date, kg:L.kg, text:kgS(L.kg)};
        if(L.val != null) return {date, text:Model.valTxt(L.kind, L.val, L.val2)}; if(L.free) return {date, text:L.free} }
      return {date, text: P.txt || 'выполнено'} }
    return null;
  },
  lastFact(exId, before, cid = CS.cid){
    const start = Model.progStart(cid); if(!start) return null;
    for(let d = addDays(before, -1); d >= start; d = addDays(d, -1)){
      const f = Model.factOn(d, exId, cid); if(f) return f;
    }
    return null;
  },
  exHistory(exId, cid = CS.cid, max = 12){
    const out = [], start = Model.progStart(cid); if(!start) return out;
    for(let d = TODAY; d >= start && out.length < max; d = addDays(d, -1)){ const f = Model.factOn(d, exId, cid); if(f) out.push(f) }
    return out;
  },

  /* ─── замеры (PRO-2) ─── */
  meas(cid = CS.cid){
    const c = client(cid) || {};
    return [...(c.meas || []).map(m => ({...m, by:'trainer'})), ...((CS.meas[cid]) || []).map(m => ({...m, by:'client'}))]
      .sort((a, b) => a.date < b.date ? 1 : -1);
  },

  /* ─── чат с тренером: единый диалог в ../assets/chat.js ─── */
  unreadCount(cid = CS.cid){ return client(cid) ? Chat.unread(cid, 'c') : 0 },
  /* Сколько сообщений чата прикреплено к этому заданию этого дня. */
  /* Сколько сообщений чата об этом блоке или строке — по постоянному ID.
     Старое вложение без ID засчитывается, только если его номер строки
     подтверждён (см. Chat.attResolve). */
  attOn(a, date, id, cid = CS.cid){
    if(!a || a.k === 'day') return false;
    if(a.iid || a.bid) return a.date === date && (a.k === 'ex' ? a.iid === id : a.bid === id);
    return a.date === date && Chat.attResolve(cid, a).focus === id;
  },
  askCount(date, id, cid = CS.cid){ return Chat.list(cid, 'c').filter(m => Model.attOn(m.att, date, id, cid)).length },
  /* Непрочитанный ответ тренера об этом задании: его сообщение со вложением
     задания или ответ с цитатой на вопрос о нём. Для точки у «Спросить». */
  askReply(date, id, cid = CS.cid){
    const L = Chat.unreadMsgs(cid, 'c').filter(m => Model.attOn(m.att, date, id, cid)
      || (m.rep && Model.attOn((Chat.find(cid, m.rep.id) || {}).att, date, id, cid)));
    return L.length ? L[L.length - 1] : null;
  },

  /* ─── перенос прежних отметок: номера строк → постоянные ID ───
     Раньше отметка подхода хранилась под номером блока и строки («b1.i0.s2»).
     Переносим её на ID той же строки, только если тренировка с тех пор не
     менялась (отпечаток совпал) — тогда номер точно указывает на ту же строку.
     Иначе прежние отметки сохраняются отдельно (legacy) и не показываются
     у чужих упражнений. Ничего не удаляется. */
  legacyMap(D){
    const map = {};
    D.blocks.forEach((b, bi) => { const L = 'b' + bi;
      if(isTextBlock(b)){ map[L + '.t'] = b.id + '.t'; return }
      if(b.fmt){ map[L + '.res'] = b.id + '.res'; return }
      const its = b.items || []; let k = 0;
      while(k < its.length){ const it = its[k];
        if(it.ss){ const j = ssEnd(its, k);
          if(its.slice(k + 1, j).some(itemHas)) for(let r = 1; r <= (+it.rounds || 1); r++) map[L + '.s' + k + '.r' + r] = it.id + '.r' + r;
          for(let m = k + 1; m < j; m++) map[L + '.i' + m] = its[m].id;      /* факт круга по участникам: m[ключ участника] */
          k = j; continue }
        if(itemHas(it)){
          if(!it.chain && it.exId && !it.txt){ const solo = !String(it.scheme || '').trim();
            Model.schemeOf(it.scheme).reps.forEach((_, n) => { map[L + '.i' + k + '.s' + (n + 1)] = solo ? it.id : it.id + '.s' + (n + 1) }) }
          else map[L + '.i' + k] = it.id;
        }
        k++;
      }
    });
    return map;
  },
  /* Записям, сохранённым до сводки k / n, досчитываем её один раз: иначе кабинет
     тренера не отличит «Частично» от «Выполнена» (factStatus в data.js). */
  fillSums(){
    let ch = false;
    Object.entries(CS.res || {}).forEach(([cid, days]) => Object.entries(days || {}).forEach(([date, rec]) => {
      if(rec && rec.n == null && rec.u){ try{ const W = Model.workout(date, cid, true); rec.n = W.units.length; rec.k = W.units.filter(x => rec.u[x.key] && rec.u[x.key].d).length; ch = true }catch(_){} } }));
    if(ch) saveCS();
  },
  migrateRes(){
    const isOld = k => /^b\d+\./.test(k);
    let n = 0;
    Object.entries(CS.res || {}).forEach(([cid, days]) => Object.entries(days || {}).forEach(([date, rec]) => {
      if(!rec || rec.kv === 2) return;
      const u = rec.u || {}, old = Object.keys(u).filter(isOld);
      const D = Model.day(date, cid);
      if(old.length && D.kind === 'hidden') return;      /* снята с публикации — перенесём, когда вернётся */
      if(old.length){
        const keep = {}, left = {};
        const map = D.kind === 'work' && rec.sig && rec.sig === D.sig ? Model.legacyMap(D) : null;
        const sub = v => v && v.m ? {...v, m:Object.fromEntries(Object.entries(v.m).map(([mk, mv]) => [map[mk] || mk, mv]))} : v;
        Object.entries(u).forEach(([k, v]) => { if(!isOld(k)) keep[k] = v; else if(map && map[k]) keep[map[k]] = {...(keep[map[k]] || {}), ...sub(v)}; else left[k] = v });
        rec.u = keep; if(Object.keys(left).length) rec.legacy = {...(rec.legacy || {}), ...left};
      }
      rec.kv = 2; n++;
    }));
    if(n){ saveCS(); Model.flush() }
    return n;
  },

  /* ─── ждёт отправки (CLI-5) ─── */
  pending(cid = CS.cid){
    const out = [];
    Object.entries(CS.res[cid] || {}).forEach(([d, r]) => Object.entries(r.u || {}).forEach(([k, u]) => { if(u.p) out.push({t:'Результат', d}) }));
    Object.entries(CS.pm[cid] || {}).forEach(([k, arr]) => arr.forEach(x => { if(x.p) out.push({t:'Максимум · ' + Model.pmName(k), d:x.at}) }));
    (CS.meas[cid] || []).forEach(m => { if(m.p) out.push({t:'Замер', d:m.date}) });
    Chat.list(cid, 'c').forEach(m => { if(m.by === 'c' && m.sim) out.push({t:'Сообщение тренеру', d:m.at.slice(0, 10)}) });
    if(CS.prof[cid] && CS.prof[cid].p) out.push({t:'Личные данные', d:TODAY});
    return out;
  },
  syncAll(){
    const n = Model.pending().length;
    const clr = o => { if(o && typeof o === 'object'){ if(o.p) delete o.p; Object.values(o).forEach(clr) } };
    clr(CS.res); clr(CS.pm); clr(CS.meas); clr(CS.prof);
    Chat.flushSim(CS.cid);
    CS.synced = Date.now(); saveCS();
    return n;
  },

  /* ─── медиа (офлайн-кэш по техстеку: GIF на 14 дней вперёд) ─── */
  gif(e, size = 180){ return e && e.gif ? '../' + e.gif + '-' + size + '.gif' : null },
  mediaReady(exId){
    if(!off()) return true;
    for(let i = -1; i <= 14; i++){
      const d = Model.day(addDays(TODAY, i));
      if(d.kind === 'work' && JSON.stringify(d.blocks).includes('"exId":"' + exId + '"')) return true;
    }
    return false;
  },

  /* ─── упражнения ближайших дней, где вес считается от 1ПМ, а максимума нет ─── */
  needPmSoon(days = 14){
    const miss = new Map();
    for(let i = 0; i <= days; i++){
      const date = addDays(TODAY, i), W = Model.workout(date);
      W.blocks.forEach(B => B.parts.forEach(P => {
        const list = P.type === 'ss' ? P.members : [P];
        list.forEach(p => { if(p.type === 'ex' && p.load.needPm && !miss.has(p.load.pmKey)) miss.set(p.load.pmKey, date) });
      }));
    }
    return [...miss.entries()].map(([k, d]) => ({k, date:d}));
  },
};
