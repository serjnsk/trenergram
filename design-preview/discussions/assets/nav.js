/* ═══════════ МЕНЮ РАБОЧЕГО ПРОСТРАНСТВА — ЕДИНСТВЕННЫЙ ИСТОЧНИК ═══════════
   Файл подключают все страницы, включая конструктор. Раньше конфиг был
   продублирован в ui.js и trainer.js, причём в копии конструктора все ссылки
   стояли заглушками '#': с экрана конструктора нельзя было уйти никуда.
   Дублировать этот массив нельзя — меню обязано быть сквозным. */
const NAV = [
 {g:'Работа'},
 {h:'index.html',      k:'dash',  n:'Дашборд'},
 /* Обсуждения клиентов — ветки под тренировками и упражнениями (версия 2).
    Счётчик — сколько веток ждут ответа тренера; акцентом — на это нужно нажать. */
 {h:'messages.html',   k:'chat',  n:'Обсуждения',             a:'Обсуж',  c:()=>typeof Chat !== 'undefined' ? CLIENTS.reduce((s, c) => s + Chat.unreadThreads(c.id, 't'), 0) : 0, hot:true},
 {h:'calendar.html',   k:'cal',   n:'Календарь',              a:'Кален'},
 {h:'clients.html',    k:'users', n:'Клиенты',                a:'Клиен',  c:()=>CLIENTS.length},
 {h:'groups.html',     k:'grp',   n:'Группы',                 a:'Группы', c:()=>GRPS.length},
 {g:'Базы шаблонов'},
 /* Четыре базы по уровням сущностей из документации: упражнение → блок →
    тренировка → программа (недели живут вкладкой внутри базы программ).
    В каждой — и общая база сервиса, и сохранённое тренером, личное с пометкой. */
 {h:'exercises.html',  k:'dumb',  n:'Упражнения',             a:'Упраж',  c:()=>EX.length},
 {h:'blocks.html',     k:'folder',n:'Блоки'                  , a:'Блоки',  c:()=>TPL.filter(t=>t.lvl==='блок').length},
 {h:'workouts.html',   k:'tpl',   n:'Тренировки',             a:'Трен',   c:()=>TPL.filter(t=>t.lvl==='тренировка').length},
 {h:'programs.html',   k:'prog',  n:'Программы',              a:'Прогр',  c:()=>TPL.filter(t=>t.lvl==='программа').length},
];



/* ═══════════ ЛОГОТИП — ЕДИНСТВЕННЫЙ ИСТОЧНИК ═══════════
   Был продублирован в ui.js и trainer.js ровно как меню до этого. Держим
   здесь: обе оболочки подключают этот файл.

   Не SVG, а текст: «ТРЕНЕРГРАМ» — десять кириллических прописных, рисовать
   их путями до утверждения финального знака рано. Срез 45° сверху-слева и
   снизу-справа — тот же приём, что на заставке (см. design.html), поэтому
   шапка и первый экран читаются как один бренд. */
const BRAND = 'ТРЕНЕРГРАМ';
const MARK  = 'ТМ';               /* сокращение — иконки и мобильный вид */
/* Два начертания: слово в развёрнутом меню, знак «Т» — в свёрнутом.
   Оба в разметке, переключает CSS: перерисовывать меню ради этого незачем. */
/* Первая и последняя буквы — акцентом: Т…М читается как «Тренерграм» даже
   в одном слове, а знак «Т» свёрнутого меню того же цвета. */
const LOGO = `<span class="logo" role="img" aria-label="${BRAND}">`
  + `<i><b>${BRAND[0]}</b>${BRAND.slice(1,-1)}<b>${BRAND.slice(-1)}</b></i><em>${MARK}</em></span>`;

/* ═══════════ ОТРИСОВКА МЕНЮ — ОДНА НА ОБЕ ОБОЛОЧКИ ═══════════
   Третий дубль подряд после NAV и LOGO: конструктор живёт на своей оболочке,
   и любое общее определение норовит в ней размножиться. Держим здесь. */
function renderNav(page){
  $('#nav').innerHTML = `
    <div class="nh">
      ${LOGO}
      <button class="navtog" id="navtog" title="Свернуть меню" aria-label="Свернуть меню">${ICON.back}</button>
    </div>
    <div class="nbody">
      ${NAV.map(x => x.g
        ? `<div class="ngrp">${esc(x.g)}</div>`
        : `<a href="${x.h}" class="${x.h===page?'on':''}" title="${esc(x.n)}">${ICON[x.k]}
             <span class="ntxt">${esc(x.n)}</span><i class="nab">${esc(x.a||x.n)}</i>
             ${x.c ? (v => x.hot ? (v ? `<span class="cnt hot">${v}</span>` : '') : `<span class="cnt">${v}</span>`)(x.c()) : ''}</a>`).join('')}
    </div>
    <a class="nfoot" href="profile.html" title="${esc(TRAINER.n)}">
      <span class="av">${esc(TRAINER.ini)}</span>
      <span><b>${esc(TRAINER.n)}</b></span>
    </a>`;
  $('#navtog').onclick = () => setNavMin(true);
  /* Из свёрнутого состояния выходят кликом по знаку: кнопки-стрелки там нет,
     она заняла бы половину колонки. */
  $('#nav .logo').onclick = () => { if(document.body.classList.contains('navmin')) setNavMin(false) };
}

/* Клиент написал в соседней вкладке — счётчик «Обсуждений» обновляется сам. */
addEventListener('storage', e => { if(typeof Chat !== 'undefined' && Chat.isChatKey(e.key) && document.getElementById('nav')){
  const cur = document.querySelector('#nav .nbody a.on'); renderNav(cur ? cur.getAttribute('href') : '') } });

/* Состояние сворачивания переживает переход между страницами — иначе меню
   разворачивалось бы на каждом клике и сворачивать его было бы бессмысленно. */
function setNavMin(min){
  document.body.classList.toggle('navmin', min);
  const b = document.getElementById('navtog');
  if(b) b.title = b.ariaLabel = min ? 'Развернуть меню' : 'Свернуть меню';
  try{ localStorage.setItem('tg.navmin', min ? '1' : '') }catch(_){}
}
try{ if(localStorage.getItem('tg.navmin')) document.documentElement.classList.add('navmin-boot') }catch(_){}
addEventListener('DOMContentLoaded', ()=>{
  if(document.documentElement.classList.contains('navmin-boot')) setNavMin(true);
});


/* ═══════════ ГЛАВНАЯ КНОПКА ШАПКИ — С РАСКРЫВАЮЩИМСЯ СПИСКОМ ═══════════
   Основной клик создаёт тренировку; стрелка справа открывает дополнительные
   действия. Пока одно — «Создать несколько тренировок» (визард массового
   копирования, CON-4). На конструкторе визард открывается на месте, с других
   страниц — переходом на конструктор с ?wizard=1. */
function topButton(){
  return `<span class="tsplit">
    <a class="btn" href="constructor.html">Создать тренировку</a>
    <button class="btn arrow" id="topmore" title="Ещё действия" aria-label="Ещё действия"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6.5l4 4 4-4"/></svg></button>
    <div class="dd" id="topdd">
      <a class="dd-i" href="constructor.html?wizard=1" data-wizard>${ICON.copy}<span><b>Создать несколько тренировок</b><s>Выбрать из шаблонов или существующих и скопировать клиенту в нужные дни</s></span></a>
    </div>
  </span>`;
}
function bindTopButton(){
  const b = document.getElementById('topmore'), dd = document.getElementById('topdd');
  if(!b || !dd) return;
  b.onclick = e => { e.stopPropagation(); dd.classList.toggle('on') };
  document.addEventListener('click', e => { if(!e.target.closest('#topdd')) dd.classList.remove('on') });
  /* На конструкторе визард открывается без перехода — функция определена там. */
  const w = dd.querySelector('[data-wizard]');
  if(w && typeof openWizard === 'function') w.onclick = e => { e.preventDefault(); dd.classList.remove('on'); openWizard() };
}


/* ═══════════ ВЫБОР КЛИЕНТА — ОБЩИЙ ═══════════
   Не <select>: у тренера полсотни клиентов, нужен поиск с клавиатуры.
   Поле в фокусе сразу, список фильтруется по имени и программе, стрелки и
   Enter — выбор без мыши. У каждого — докуда составлена программа: это и
   есть ответ «кому писать следующим». Используется конструктором и календарём. */
/* Подпись под именем: у клиента — программа и группы, у группы — сколько
   участников; у обоих — докуда составлено. Личный контейнер участника группы
   («Тренировки») не называем: его тренировки и есть тренировки группы. */
const clientProgSub = c => {
  const tail = pid => { const n = composedDays(pid); return n ? 'составлено до ' + dm(dayDate(pid, n-1)) : 'ничего не составлено' };
  if(isGrp(c.id)){ const last = lastWorkoutDay(c.prog);
    return c.members.length + ' ' + plural3(c.members.length, 'участник', 'участника', 'участников') + ' · ' + (last ? 'составлено до ' + dm(last) : 'ничего не составлено') }
  const g = groupOf(c.id), gl = g ? 'группа ' + g.n : '';
  if(!c.prog) return gl || 'программа не назначена';
  const p = program(c.prog);
  return [p.personal && gl ? '' : p.title, gl].filter(Boolean).join(' · ') + ' · ' + tail(c.prog);
};
/* Параметр адреса для календаря и конструктора: ?client= или ?group=. */
const subjQ = id => (isGrp(id) ? 'group=' : 'client=') + id;
/* Аватар и подпись в кнопке выбора клиента или группы — одна разметка на все шапки. */
const whoBtnHTML = w => `<span class="cav${isGrp(w.id) ? ' grp' : ''}">${esc(w.ini)}</span><span class="cl-t"><b>${esc(w.n)}</b><s>${esc(clientProgSub(w))}</s></span>`;
function openClientPicker(btn, curId, onPick, opts = {}){
  document.querySelectorAll('.sug.clipick').forEach(x=>x.remove());
  const box = document.createElement('div'); box.className = 'sug clipick';
  const r = btn.getBoundingClientRect();
  box.style.left = r.left + 'px'; box.style.top = (r.bottom + window.scrollY + 6) + 'px';
  document.body.appendChild(box);
  /* opts.all — и клиенты без программы (им заводится контейнер дней); opts.exclude — уже выбранные.
     Группы — сверху отдельным списком: календарь и конструктор открывают их так же, как клиента
     (GRP-2); opts.groups === false — только клиенты. */
  const list = CLIENTS.filter(c=>(opts.all || c.prog) && !(opts.exclude && opts.exclude.has(c.id))).sort((a,b)=>a.n.localeCompare(b.n,'ru'));
  const groups = opts.groups === false ? [] : GRPS.filter(g=>!(opts.exclude && opts.exclude.has(g.id))).sort((a,b)=>a.n.localeCompare(b.n,'ru'));
  const draw = q => {
    const qq = norm(q||'');
    const gr = groups.filter(g=>!qq || norm(g.n).includes(qq));
    const rows = list.filter(c=>!qq || norm(c.n).includes(qq) || (c.prog && norm(program(c.prog).title).includes(qq)) || (groupOf(c.id) && norm(groupOf(c.id).n).includes(qq)));
    let k = 0;
    /* opts.disabled(id) → почему выбрать нельзя (клиент уже в другой группе): строка видна, но не кликается. */
    const row = c => { const why = opts.disabled ? opts.disabled(c.id) : null;
      if(why) return `<div class="row dis"><span class="cav${isGrp(c.id) ? ' grp' : ''}">${esc(c.ini)}</span><span class="cl-t"><b>${esc(c.n)}</b><s>${esc(why)}</s></span></div>`;
      return `<button class="row ${c.id===curId?'cur':''} ${k++===0?'on':''}" data-cli="${c.id}">${whoBtnHTML(c)}${c.id===curId?ICON.chk:''}</button>` };
    box.querySelector('.cl-list').innerHTML = gr.length || rows.length
      ? (gr.length ? `<div class="cl-cap">Группы</div>${gr.map(row).join('')}` + (rows.length ? '<div class="cl-cap">Клиенты</div>' : '') : '') + rows.map(row).join('')
      : '<div class="cap">Никого не нашли</div>';
  };
  box.innerHTML = `<div class="cl-s">${ICON.search}<input id="cl-q" placeholder="${groups.length ? 'Клиент, группа или программа' : 'Имя клиента или программа'}" autocomplete="off"></div><div class="cl-list"></div>`;
  draw('');
  const close = () => { box.remove(); document.removeEventListener('click', off, true) };
  const pick = id => { close(); onPick(id) };
  const off = e => { if(!box.isConnected){ document.removeEventListener('click', off, true); return }
    if(!box.contains(e.target) && !btn.contains(e.target)) close() };
  setTimeout(()=>document.addEventListener('click', off, true));
  const inp = box.querySelector('#cl-q'); inp.focus();
  inp.addEventListener('input', e => draw(e.target.value));
  box.addEventListener('keydown', e => {
    const rows = [...box.querySelectorAll('[data-cli]')]; let k = rows.findIndex(x=>x.classList.contains('on'));
    if(e.key==='Escape'){ e.preventDefault(); close(); return }
    if(e.key==='ArrowDown' || e.key==='ArrowUp'){ e.preventDefault(); if(!rows.length) return;
      if(k>=0) rows[k].classList.remove('on'); k = (k + (e.key==='ArrowDown'?1:-1) + rows.length) % rows.length;
      rows[k].classList.add('on'); rows[k].scrollIntoView({block:'nearest'}); return }
    if(e.key==='Enter'){ e.preventDefault(); const on = rows[k] || rows[0]; if(on) pick(on.dataset.cli) }
  });
  box.addEventListener('click', e => { e.stopPropagation(); const row = e.target.closest('[data-cli]'); if(row) pick(row.dataset.cli) });
  return box;
}

/* ═══════════ ЗАНЯТЫЕ ДНИ ПРИ ПУБЛИКАЦИИ ГРУППЫ (GRP-3) ═══════════
   Перед публикацией дня группы смотрим, у кого из участников на эту дату
   стоит другая тренировка. Если такие есть — одно окно на всех: по каждому
   «заменить» или «пропустить», по умолчанию заменить. proceed получает набор
   ключей «клиент@дата», кому заменять; пропуски запоминаются (STATE.gskip).
   Отмена — публикации нет. Без занятых дней proceed зовётся сразу. */
function withGroupConflicts(pid, dates, proceed, cancel){
  const G = grpByProg(pid);
  const rows = G ? groupConflicts(G, dates) : [];
  if(!rows.length) return proceed(null);
  openGroupConflicts(G, rows, choice => {
    const replace = new Set();
    rows.forEach(r => { const rep = choice.get(r.key) !== 'skip'; setSkip(G, r.cid, r.date, !rep); if(rep) replace.add(r.key) });
    proceed(replace);
  }, cancel);
}
function openGroupConflicts(G, rows, onOk, onCancel){
  const ov = document.createElement('div'); ov.className = 'ov on gconf';
  const choice = new Map(rows.map(r => [r.key, 'replace']));
  const n = rows.length, people = new Set(rows.map(r => r.cid)).size;
  const draw = () => {
    ov.innerHTML = `<div class="md ask gcm">
      <div class="mdh"><span class="dot"></span><h2>${people === 1 ? 'У участника уже есть тренировка' : 'У ' + people + ' участников уже есть тренировки'}</h2><button class="cls" data-x>✕</button></div>
      <div class="mdb">
        <p class="lead">Тренировка группы «${esc(G.n)}» встанет всем участникам. ${n === 1 ? 'На этот день у него стоит другая — заменить её или пропустить?' : 'На эти дни у них стоят другие — по каждому решите: заменить или пропустить.'}</p>
        <div class="gc-list">${rows.map(r => { const c = client(r.cid), v = choice.get(r.key); return `<div class="gc-r">
          <span class="cav">${esc(c.ini)}</span>
          <span class="gc-t"><b>${esc(c.n)}</b><s>${RU[dowMon(r.date)]} ${dm(r.date)} · ${esc(r.title)}</s></span>
          <span class="seg"><button class="${v === 'replace' ? 'on' : ''}" data-gc="${r.key}" data-v="replace">Заменить</button><button class="${v === 'skip' ? 'on' : ''}" data-gc="${r.key}" data-v="skip">Пропустить</button></span>
        </div>` }).join('')}</div>
        ${n > 1 ? `<div class="gc-all"><button data-gcall="replace">Заменить у всех</button><button data-gcall="skip">Пропустить всех</button></div>` : ''}
        <p class="sub">Пропущенный сохранит свою тренировку; поставить ему тренировку группы можно потом из его календаря.</p>
      </div>
      <div class="mdf"><span class="sp"></span><button class="btn gh" data-x>Отмена</button><button class="btn" data-ok>Опубликовать</button></div>
    </div>`;
  };
  const close = () => { ov.remove(); document.removeEventListener('keydown', key, true) };
  const key = e => { if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); close(); if(onCancel) onCancel() } };
  document.addEventListener('keydown', key, true);
  ov.addEventListener('click', e => {
    const b = e.target.closest('[data-gc]'); if(b){ choice.set(b.dataset.gc, b.dataset.v); draw(); return }
    const all = e.target.closest('[data-gcall]'); if(all){ rows.forEach(r => choice.set(r.key, all.dataset.gcall)); draw(); return }
    if(e.target === ov || e.target.closest('[data-x]')){ close(); if(onCancel) onCancel(); return }
    if(e.target.closest('[data-ok]')){ close(); onOk(choice) }
  });
  draw();
  document.body.appendChild(ov);
}

/* Правая панель сворачивается в колонку; состояние — в localStorage. */
function initRail(){
  const b = document.getElementById('railtog'); if(!b) return;
  const setRailMin = min => { document.body.classList.toggle('railmin', min);
    b.title = min ? 'Развернуть панель' : 'Свернуть панель';
    try{ localStorage.setItem('tg.railmin', min ? '1' : '') }catch(_){} };
  b.onclick = () => setRailMin(!document.body.classList.contains('railmin'));
  try{ if(localStorage.getItem('tg.railmin')) setRailMin(true) }catch(_){}
}

/* ═══════════ ВЫБОР ДАТЫ (календарь, «перейти к дате») ═══════════
   Свой попап вместо системного <input type=date>: сетка месяца с понедельника,
   сегодня обведено, выбранная дата залита; стрелки листают месяцы, Esc закрывает. */
function openDatePicker(btn, curDate, onPick){
  document.querySelectorAll('.sug.dpick').forEach(x=>x.remove());
  const box = document.createElement('div'); box.className = 'sug dpick';
  document.body.appendChild(box);
  const r = btn.getBoundingClientRect();
  box.style.top = (r.bottom + window.scrollY + 6) + 'px';
  box.style.left = Math.max(8, r.right - 372) + 'px';
  const chev = d => `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="${d<0?'M10 3 5 8l5 5':'M6 3l5 5-5 5'}"/></svg>`;
  let sel = curDate || TODAY, view = sel.slice(0,7);
  const draw = () => {
    const [y, m] = view.split('-').map(Number);
    const first = `${view}-01`, off = dowMon(first), start = addDays(first, -off);
    const cells = Array.from({length:42}, (_,k)=>{ const d = addDays(start, k), out = d.slice(0,7)!==view;
      return `<button type="button" class="dp-d ${out?'out':''} ${d===TODAY?'today':''} ${d===sel?'sel':''}" data-date="${d}">${+d.slice(8)}</button>` });
    box.innerHTML = `<div class="dp-h"><button type="button" class="dp-nav" data-dp="-1" title="Предыдущий месяц">${chev(-1)}</button><b>${MONTHS_N[m-1]} ${y}</b><button type="button" class="dp-nav" data-dp="1" title="Следующий месяц">${chev(1)}</button></div>
      <div class="dp-w">${RU.map(d=>`<span>${d}</span>`).join('')}</div><div class="dp-g">${cells.join('')}</div>
      <div class="dp-f"><button type="button" class="btn gh sm" data-dp-today>Сегодня</button></div>`;
  };
  const close = () => { box.remove(); document.removeEventListener('click', off, true); document.removeEventListener('keydown', key, true) };
  const off = e => { if(!box.isConnected){ close(); return } if(!box.contains(e.target) && !btn.contains(e.target)) close() };
  const key = e => { if(e.key==='Escape'){ e.preventDefault(); close() } };
  setTimeout(()=>{ document.addEventListener('click', off, true); document.addEventListener('keydown', key, true) });
  box.addEventListener('click', e => { e.stopPropagation();
    const nav = e.target.closest('[data-dp]'); if(nav){ const [y,m] = view.split('-').map(Number); const d = new Date(y, m-1+ +nav.dataset.dp, 1); view = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}`; draw(); return }
    if(e.target.closest('[data-dp-today]')){ close(); onPick(TODAY); return }
    const c = e.target.closest('[data-date]'); if(c){ close(); onPick(c.dataset.date) } });
  draw();
  return box;
}

/* ═══════════ ПОДСКАЗКИ ═══════════
   Свои вместо системных title: крупнее, контрастнее и без секундной задержки.
   Атрибут title переносится в data-tip при первом наведении, чтобы не
   всплывала и системная. Позиция fixed — под элементом, у краёв экрана
   прижимается, снизу — переворачивается наверх. */
(function(){
  let tipEl = null, timer = null, cur = null;
  const box = () => tipEl || (tipEl = Object.assign(document.body.appendChild(document.createElement('div')), {className:'tip'}));
  const show = (t, text) => {
    if(!t.isConnected) return;
    const b = box(); b.textContent = text; b.classList.add('on');
    const r = t.getBoundingClientRect(), w = b.offsetWidth, h = b.offsetHeight;
    let x = r.left + r.width/2 - w/2, y = r.bottom + 8;
    if(y + h > innerHeight - 8) y = r.top - h - 8;
    x = Math.max(8, Math.min(innerWidth - w - 8, x));
    b.style.left = x + 'px'; b.style.top = y + 'px';
  };
  const hide = () => { clearTimeout(timer); timer = null; cur = null; if(tipEl) tipEl.classList.remove('on') };
  document.addEventListener('mouseover', e => {
    const t = e.target.closest ? e.target.closest('[title],[data-tip]') : null;
    if(!t || t === cur) return;
    hide(); cur = t;
    if(t.hasAttribute('title')){ t.dataset.tip = t.getAttribute('title'); t.removeAttribute('title') }
    const text = (t.dataset.tip || '').trim(); if(!text) return;
    timer = setTimeout(() => show(t, text), 120);
  });
  document.addEventListener('mouseout', e => { if(cur && !(e.relatedTarget && cur.contains(e.relatedTarget))) hide() });
  document.addEventListener('mousedown', hide, true);
  addEventListener('scroll', hide, true);
  addEventListener('keydown', hide, true);
})();
