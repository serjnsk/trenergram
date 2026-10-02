/* ═══════════════════════════════════════════════════════════════
   ОБЩИЕ ЭЛЕМЕНТЫ ЭКРАНОВ + ПАНЕЛЬ ПРОТОТИПА
   ═══════════════════════════════════════════════════════════════ */
const UI = {
  /* Навбар вложенного экрана. back — куда вернуться, если истории нет. */
  nav({title = '', sub = '', back = '#/train', right = '', line = false, reveal = false} = {}){
    return `<div class="nav${line ? ' line' : ''}${reveal ? ' rv' : ''}">
      <div>${back ? `<button class="ib" data-act="back" data-to="${back}" aria-label="Назад">${ICO.back}</button>` : ''}</div>
      <div class="nt">${title ? `<b>${esc(title)}</b>` : ''}${sub ? `<s>${esc(sub)}</s>` : ''}</div>
      <div class="r">${right}</div></div>`;
  },
  /* Крупный заголовок корневого экрана вкладки. */
  lt({title, sub = '', acts = ''}){
    return `<div class="lt"><div class="row1"><h1>${esc(title)}</h1><div class="acts">${acts}</div></div>${sub ? `<div class="sub">${sub}</div>` : ''}</div>`;
  },
  row({ico = '', pic = '', title, sub = '', v = '', go = '', act = '', data = '', chev = true, cls = '', bold = true}){
    const tag = go || act ? 'button' : 'div';
    return `<${tag} class="row ${cls}"${go ? ` data-go="${go}"` : ''}${act ? ` data-act="${act}"` : ''} ${data}>
      ${pic}${ico ? `<span class="ico">${ico}</span>` : ''}
      <span class="tx"><b class="${bold ? '' : 'n'}">${title}</b>${sub ? `<s>${sub}</s>` : ''}</span>
      ${v ? `<span class="v">${v}</span>` : ''}${chev && (go || act) ? `<span class="ch">${ICO.chev}</span>` : ''}</${tag}>`;
  },
  sec(t, link = '', go = ''){ return `<div class="sech"><span class="t">${esc(t)}</span>${link ? `<button class="lnk" data-go="${go}">${esc(link)}</button>` : ''}</div>` },
  empty({ico = ICO.info, img = '', title, text = '', btn = ''}){
    return `<div class="empty"><div class="pic">${img ? `<img src="${img}" alt="">` : ico}</div><b>${esc(title)}</b>${text ? `<p>${text}</p>` : ''}${btn}</div>`;
  },
  av(ini, cls = ''){ return `<span class="av ${cls}">${esc(ini)}</span>` },
  pend(p, txt = 'ждёт отправки'){ return p ? `<span class="pend">${ICO.clock}${txt}</span>` : '' },
  /* Миниатюра упражнения: GIF, а без сети и без загруженного — заглушка. */
  thumb(e, cls = 'th'){
    if(!e) return `<span class="${cls} ph">${ICO.dumb}</span>`;
    if(Model.mediaReady(e.id) && e.gif) return `<span class="${cls}"><img src="${Model.gif(e, 180)}" alt="" loading="lazy"></span>`;
    return `<span class="${cls} ph" title="Демонстрация загрузится при подключении">${ICO.img}</span>`;
  },
};
ACT.back = el => Nav.back(el.dataset.to);

/* ─── сеть: полоса «нет сети» и возвращение ─── */
function paintNet(){
  $('#scr').classList.toggle('off', off());
  $('#net').innerHTML = `${ICO.off}<span>Нет сети · всё сохраняется на телефоне</span>`;
}
function setOffline(v){
  if(!!CS.off === !!v) return;
  CS.off = !!v; saveCS(); paintNet();
  if(!v){
    const n = Model.syncAll();
    if(n) toast('Отправлено: ' + n + ' ' + plural(n, 'запись', 'записи', 'записей') + ' — тренер их видит');
    else toast('Сеть есть — всё синхронизировано');
  } else toast('Нет сети. Записи сохранятся на телефоне и уйдут позже');
  App.refresh(); Side.render();
}

/* ═══════════ ПАНЕЛЬ ПРОТОТИПА ═══════════
   Живёт рядом с телефоном только на компьютере: карта экранов по иерархии,
   выбор клиента, переключатель сети. На телефоне её нет. */
const MAP = [
  ['Вход', [
    ['0.1', 'Заставка', '#/in/splash', 'in'],
    ['0.2', 'Приглашение тренера', '#/in/invite', 'in'],
    ['', '— ссылка недействительна', '#/in/invite?bad=1', 'in'],
    ['0.3', 'Номер телефона', '#/in/phone', 'in'],
    ['0.4', 'Код из СМС', '#/in/code', 'in'],
    ['0.5', 'Знакомство', '#/in/about', 'in'],
    ['0.6', 'Без тренера', '#/in/notrainer', 'in'],
  ]],
  ['Тренировки', [
    ['1.1', 'Неделя', '#/train'],
    ['1.2', 'Календарь', '#/train/month'],
    ['1.3', 'Тренировка', () => '#/train/day/' + Side.anyWork()],
    ['1.3.1', 'Подход', 'sheet:set', 'шторка'],
    ['1.3.2', 'Результат комплекса', 'sheet:res', 'шторка'],
    ['1.3.3', 'Мой максимум', 'sheet:pm', 'шторка'],
    ['1.3.4', 'Обсуждение тренировки', 'sheet:talk', 'шторка'],
    ['1.3.5', 'Завершение', 'sheet:fin', 'шторка'],
    ['1.4', 'Упражнение', '#/ex/squat'],
  ]],
  ['Прогресс', [
    ['2.1', 'Обзор', '#/progress'],
    ['2.2', 'Максимумы', '#/progress/pm'],
    ['2.2.1', 'Выбор упражнения', 'sheet:pick', 'шторка'],
    ['2.3', 'Максимум упражнения', '#/progress/pm/squat'],
    ['2.4', 'Замеры', '#/progress/meas'],
    ['2.4.1', 'Новый замер', 'sheet:meas', 'шторка'],
  ]],
  ['Обсуждения', [
    ['4.1', 'Все обсуждения', '#/talk'],
    ['4.2', 'Ветка тренировки', () => '#/talk/' + encodeURIComponent('w:' + Side.anyWork())],
    ['4.2', 'Ветка упражнения', '#/talk/' + encodeURIComponent('x:squat')],
    ['4.3', 'Обсуждение упражнения', 'sheet:talkEx', 'шторка'],
  ]],
  ['Профиль', [
    ['3.1', 'Профиль', '#/me'],
    ['3.2', 'Личные данные', '#/me/data'],
    ['3.3', 'Мой тренер', '#/me/trainer'],
    ['3.4', 'Настройки', '#/me/settings'],
    ['3.5', 'Данные на устройстве', '#/me/device'],
  ]],
];
const Side = {
  anyWork(){
    for(let i = 0; i < 20; i++){ const d = addDays(TODAY, i); if(Model.day(d).kind === 'work') return d }
    for(let i = 1; i < 40; i++){ const d = addDays(TODAY, -i); if(Model.day(d).kind === 'work') return d }
    return TODAY;
  },
  render(){
    const el = $('#side'); if(!el) return;
    const opts = CLIENTS.map(c => { const G = groupOf(c.id), p = c.prog && program(c.prog);
      return `<option value="${c.id}"${c.id === CS.cid ? ' selected' : ''}>${esc(c.n)}${G ? ' · группа ' + esc(G.n) : p ? ' · ' + esc(p.title) : ' · без программы'}</option>` }).join('');
    let k = 0;
    el.innerHTML = `
      <h1>Приложение клиента</h1>
      <p class="lede">Кликабельный прототип по иерархии страниц: четыре вкладки, вход, шторки. Данные общие с кабинетом тренера — опубликованная там тренировка появляется здесь.</p>
      <div class="grp"><span class="caps">Кто вошёл</span>
        <select id="sd-client">${opts}</select></div>
      <div class="grp"><span class="caps">Состояния</span>
        <button class="tg" data-sd="off"><span>Нет сети</span><span class="sw ${off() ? 'on' : ''}"></span></button>
        <div class="acts" style="margin-top:6px">
          <button data-sd="first">Пройти вход как новый клиент →</button>
          <button data-sd="demo">Добавить тренировку со всеми видами записей →</button>
          <a href="../calendar.html" target="_blank" rel="noopener">Кабинет тренера в новой вкладке →</a>
          <a href="../messages.html" target="_blank" rel="noopener">Сообщения тренера в новой вкладке →</a>
          <button data-sd="reset">Стереть записи клиента</button>
        </div></div>
      <div class="grp"><span class="caps">Карта экранов</span>
        <div class="map">${MAP.map(([h, items]) => `<div class="h">${esc(h)}</div>` + items.map(([code, name, to, tag]) => {
          const i = k++;
          return `<button data-sd="map" data-i="${i}"><code>${esc(code)}</code><span>${esc(name)}</span>${tag && tag !== 'in' ? `<i>${esc(tag)}</i>` : ''}</button>` }).join('')).join('')}</div></div>
      <p class="foot2">Прототип живёт только на этом компьютере. Демонстрация упражнений — одна GIF на все, как в кабинете тренера.</p>`;
    Side.flat = MAP.flatMap(([, items]) => items);
    $('#sd-client').onchange = e => Side.switchTo(e.target.value);
  },
  switchTo(cid){
    CS.cid = cid; CS.onb = true; saveCS(); Model.flush(); SEL.d = TODAY;
    Nav.stack = []; Nav.last = {}; Nav.scroll = {};
    Sheet.close(true);
    if(location.hash === '#/train') App.render('fade'); else location.hash = '#/train';
    Side.render();
  },
  mark(){
    const el = $('#side .map'); if(!el || !Side.flat) return;
    $$('button', el).forEach(b => { const it = Side.flat[+b.dataset.i]; const to = typeof it[2] === 'function' ? '' : it[2];
      b.classList.toggle('on', !!to && to === location.hash) });
  },
  run(i){
    const [code, , to] = Side.flat[i];
    if(typeof to === 'function'){ Nav.go(to()); return }
    if(to.startsWith('sheet:')){ DEMO_SHEET[to.slice(6)] && DEMO_SHEET[to.slice(6)](); return }
    if(to.startsWith('#/in/') && CS.onb){ /* экраны входа смотрим, не выходя из аккаунта */ }
    Nav.go(to);
  },
};
document.addEventListener('click', e => {
  const b = e.target.closest('#side [data-sd]'); if(!b) return;
  const a = b.dataset.sd;
  if(a === 'off') setOffline(!off());
  if(a === 'map') Side.run(+b.dataset.i);
  if(a === 'demo') addShowcase();
  if(a === 'first'){ CS.cid = 'c6'; CS.onb = false; delete CS.prof.c6; saveCS(); Model.flush(); Nav.stack = []; Side.render(); location.hash = '#/in/splash'; App.render('fade') }
  if(a === 'reset'){ if(confirm('Стереть всё, что клиент записал в прототипе? Кабинет тренера не затронется.')){
    const keep = {cid:CS.cid, onb:true}; Object.keys(CS).forEach(k => delete CS[k]);
    Object.assign(CS, {v:1, off:false, wifiOnly:true, cache:500, synced:null, res:{}, pm:{}, meas:{}, prof:{}, seen:{}}, keep);
    saveCS(); Model.flush(); paintNet(); App.refresh(); Side.render(); toast('Записи клиента стёрты') } }
});
/* Демо-входы в шторки с карты экранов: открыть нужный экран и шторку на нём. */
const DEMO_SHEET = {};

/* ─── Демо-тренировка со всеми видами записей ───
   В демо-данных тренера нет блока текстом, связки, диапазона и записи «как в
   тетради» — а экран клиента обязан показать каждую. Кнопка кладёт такую
   тренировку в данные кабинета тренера (trenergram.design.discussions.state, формат конструктора)
   на ближайший свободный день: её видит и тренер в конструкторе, и клиент. */
function addShowcase(){
  const c = client(CS.cid); if(!c || !c.prog || !program(c.prog)) return toast('У этого клиента нет программы — выберите другого');
  let date = null;
  for(let i = 1; i < 21 && !date; i++){ const d = addDays(TODAY, i), x = Model.day(d); if(x.kind === 'rest' || x.kind === 'unplanned') date = d }
  if(!date) return toast('Нет свободного дня в ближайшие три недели');
  const i = daysBetween(program(c.prog).start, date); if(i < 0) return toast('День раньше начала программы');
  const warm = textBlock('Разминка в своём темпе:\n• 5 минут гребли\n• суставная сверху вниз\n• 2 круга: 10 приседаний, 10 отжиманий', 'Разминка'); warm.kind = 'warmup';
  const str = mkBlock('strength', 'Сила', 'Держите спину нейтральной, вес — по самочувствию в пределах диапазона', null, [['squat', '5×3', 70]]);
  str.items[0].pct2 = 80;
  str.items.push(chainItem([mkItem('clean', '1', 70), mkItem('fsquat', '1'), mkItem('jerk', '2')]));
  str.items.push(mkItem('dead', '', null, null, '', '100×5, 120×5, 140×3×3'));
  const ss = mkBlock('accessory', 'Подкачка', '', null, [['@ss', 3, '90 сек'], ['pullup', '8', null, null, '', '', 1], ['ring', '10', null, null, '', '', 1]]);
  ss.items.push(rawItem('Растяжка грудного отдела на ролле — 2 минуты'));
  const met = normFmt(mkBlock('complex', '«Чиппер»', 'Темп ровный, без остановок', 'AMRAP 12', [['wb', '15', null, 'кг', '9'], ['burpee', '10'], ['row', null, null, 'м', '250']]));
  const cool = mkBlock('cooldown', 'Заминка', '', null, []); cool.items.push(rawItem('Растяжка по ощущениям 5 минут'));
  const rec = {c: serializeDay({title:'Все виды записей · демо', blocks:[warm, str, ss, met, cool]}), draft:false};
  let st = {}; try{ st = JSON.parse(localStorage.getItem('trenergram.design.discussions.state') || '{}') }catch(_){}
  ((st.days ||= {})[c.prog] ||= {})[i] = rec;
  try{ localStorage.setItem('trenergram.design.discussions.state', JSON.stringify(st)) }catch(_){}
  location.hash = '#/train/day/' + date; location.reload();
}
