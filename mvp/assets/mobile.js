/* ============================================================
   Тренерграм · мобильная оболочка кабинета тренера (≤ 760 px)

   Подключается последним скриптом каждой страницы, включая конструктор.
   Левое меню на телефоне прячет CSS (assets/mobile.css); здесь строится
   то, что его заменяет: нижняя панель из трёх главных разделов и «Ещё» —
   шторка со всем остальным. Источник пунктов тот же, что у десктопного
   меню, — массив NAV из assets/nav.js; второй конфиг не заводим.

   Ширину не проверяем: панель и шторка живут в DOM всегда, на десктопе их
   скрывает CSS. Так поворот экрана и ресайз ничего не перерисовывают.
   ============================================================ */
(function(){
  const MQ = matchMedia('(max-width:760px)');

  /* ─── стенд тренерского приложения ───
     trainer/index.html открывает кабинет во фрейме телефона и пишет режим в
     атрибут фрейма: data-mode="<iphone|android>:<web|app>" — атрибут живёт на
     самом <iframe>, поэтому переживает переходы по ссылкам внутри телефона.
     В режиме приложения страница во весь экран, а env(safe-area-inset-*) во
     фрейме всегда 0 — задаём безопасные зоны сами, как их отдаст WebView. */
  const SA = {iphone:[59, 34], android:[24, 16]};
  let fe = null; try{ fe = window.frameElement }catch(_){}
  const fm = fe && /^(iphone|android):(app|web)$/.exec(fe.dataset.mode || '');
  if(fm){
    document.documentElement.classList.add('in-stand');
    if(fm[2] === 'app'){ const r = document.documentElement.style; r.setProperty('--sat', SA[fm[1]][0] + 'px'); r.setProperty('--sab', SA[fm[1]][1] + 'px') }
  }

  /* ─── стенд: «Данные: длинные» ───
     Проверка, что интерфейс не ломают длинные имена клиентов и групп, названия
     упражнений, тренировок и программ (в том числе слово без пробелов). Только во
     фрейме стенда с параметром (localStorage tr.long) или по ?long=1 в адресе —
     обычный кабинет это не задевает. Данные подменяем сразу после data.js, до
     отрисовки страницы: load у <script> срабатывает до следующего скрипта. */
  let longOn = /[?&]long=1\b/.test(location.search);
  try{ if(fm && localStorage.getItem('tr.long') === '1') longOn = true }catch(_){}
  if(longOn) document.addEventListener('load', e => {
    if(!e.target.src || !/assets\/data\.js/.test(e.target.src)) return;
    try{ longData() }catch(err){ console.warn('longData', err) }
  }, true);
  function longData(){
    const NAMES = ['Александр Константинопольский-Преображенский', 'Мария-Антуанетта Римская-Корсакова', 'Вольфганг Шварценеггерштадтмахерович',
                   'Анастасия Владиславовна Большакова-Малышевская', 'Христофор Бонифатьевич Длинноименный'];
    CLIENTS.slice(0, NAMES.length).forEach((c, i) => { c.n = NAMES[i] });
    TRAINER.first = 'Константин'; TRAINER.last = 'Константинопольский-Преображенский'; TRAINER.n = TRAINER.first + ' ' + TRAINER.last;
    PROGRAMS.forEach(p => { if(p.title && p.kind !== 'group') p.title += ': подготовка к соревновательному сезону 2027 года' });
    GRPS.forEach(g => { g.n = 'Лечебная физкультура для спины, суставов и баланса — утро'; const p = PROGRAMS.find(x => x.id === g.prog); if(p) p.title = g.n });
    TPL.forEach((t, i) => { if(i % 3 === 0) t.title += ' — расширенная версия для продвинутых спортсменов' });
    const ex = id => EX.find(e => e.id === id);
    const set = (id, ru) => { const e = ex(id); if(e) e.ru = ru };
    set('own_rom', 'Суставная разминка от шеи до голеностопа по кругу без остановок');
    set('own_row', 'Греблянатренажёреконцепттуинтервалами');      /* одно слово без пробелов */
    set('own_pvc', 'Мобилити плечевого пояса с гимнастической палкой PVC');
  }

  /* ─── до загрузки страницы ─── */
  /* Страницы списков при каждой перерисовке зовут focus() на поле поиска — на
     телефоне это поднимало бы клавиатуру от тапа по фильтру. Пропускаем вызов,
     если пользователь только что не печатал в этом же поле: тогда перерисовка
     заменила поле под пальцем, и фокус надо вернуть, иначе ввод оборвётся. */
  let typedAt = 0;
  addEventListener('input', () => { typedAt = Date.now() }, true);
  const nativeFocus = HTMLElement.prototype.focus;
  HTMLElement.prototype.focus = function(o){
    if(MQ.matches && this.matches && this.matches('input#q, .pane-h input, .dsel-s input, #cl-q') && Date.now() - typedAt > 600) return;
    return nativeFocus.call(this, o);
  };

  function build(){
  if(typeof NAV === 'undefined') return;

  /* viewport-fit=cover — иначе env(safe-area-inset-bottom) на iPhone равен нулю,
     и панель встаёт под «домашнюю» полосу. */
  const vp = document.querySelector('meta[name=viewport]');
  if(vp && !/viewport-fit/.test(vp.content)) vp.content += ',viewport-fit=cover';

  const MAIN = ['index.html', 'calendar.html', 'clients.html'];
  /* Страницы-потомки подсвечивают раздел-родитель. Конструктор в режиме шаблона
     получает активный пункт от renderNav (см. trainer.js), его берём из меню. */
  const PARENT = {'client.html':'clients.html', 'exercise.html':'exercises.html', 'program.html':'programs.html'};
  const file = location.pathname.split('/').pop() || 'index.html';
  const navOn = document.querySelector('#nav a.on');
  const cur = navOn ? navOn.getAttribute('href') : (PARENT[file] || file);

  const items = NAV.filter(x => x.h);
  const main  = MAIN.map(h => items.find(x => x.h === h)).filter(Boolean);
  const more  = items.filter(x => !MAIN.includes(x.h));
  const moreOn = !MAIN.includes(cur) && cur !== 'constructor.html' ? true : false;

  const DOTS = '<svg viewBox="0 0 20 20" fill="currentColor"><circle cx="4.5" cy="10" r="1.6"/><circle cx="10" cy="10" r="1.6"/><circle cx="15.5" cy="10" r="1.6"/></svg>';
  const esc_ = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

  const tab = x => `<a class="mt${x.h === cur ? ' on' : ''}" href="${x.h}">${ICON[x.k]}<span>${esc_(x.n)}</span></a>`;

  const bar = document.createElement('nav');
  bar.className = 'mtabs';
  bar.setAttribute('aria-label', 'Основная навигация');
  bar.innerHTML = main.map(tab).join('')
    + `<button class="mt${moreOn ? ' on' : ''}" id="mt-more" aria-haspopup="dialog" aria-expanded="false">${DOTS}<span>Ещё</span></button>`;

  const sheet = document.createElement('div');
  sheet.className = 'msh-ov';
  sheet.innerHTML = `<div class="msh" role="dialog" aria-modal="true" aria-label="Разделы">
      <div class="msh-grab"></div>
      ${NAV.filter(x => x.g || more.includes(x)).map(x => {
        if(x.g){
          /* заголовок «Работа» нужен, только если под ним есть пункты шторки */
          return more.some(m => NAV.indexOf(m) > NAV.indexOf(x) && !NAV.slice(NAV.indexOf(x)+1, NAV.indexOf(m)).some(y => y.g))
            ? `<div class="msh-g">${esc_(x.g)}</div>` : '';
        }
        return `<a class="msh-i${x.h === cur ? ' on' : ''}" href="${x.h}">${ICON[x.k]}<span>${esc_(x.n)}</span>${x.c ? `<s>${x.c()}</s>` : ''}</a>`;
      }).join('')}
      <div class="msh-g">Аккаунт</div>
      <a class="msh-i${cur === 'profile.html' ? ' on' : ''}" href="profile.html"><span class="msh-av">${esc_(TRAINER.ini)}</span><span>${esc_(TRAINER.n)}</span></a>
    </div>`;

  document.body.append(bar, sheet);

  const more_ = document.getElementById('mt-more');
  const open  = on => {
    sheet.classList.toggle('on', on);
    more_.setAttribute('aria-expanded', on);
    document.documentElement.classList.toggle('msh-lock', on);
  };
  more_.onclick = () => open(!sheet.classList.contains('on'));
  sheet.addEventListener('click', e => { if(e.target === sheet || e.target.closest('a')) open(false) });
  document.addEventListener('keydown', e => { if(e.key === 'Escape') open(false) });
  railSheet();
  }

  /* ─── конструктор: правая панель — шторка ───
     Панель (календарь клиента и базы шаблонов) на десктопе стоит справа; на
     телефоне её место — под большим пальцем. Строка над днём открывает шторку,
     крестик и затемнение закрывают. */
  function railSheet(){
    const rail = document.querySelector('.rail'), main = document.querySelector('.cons main');
    if(!rail || !main) return;
    const body = document.body;
    const bd = document.createElement('div'); bd.className = 'mrail-bd';
    const top = document.createElement('div'); top.className = 'mrail-x';
    top.innerHTML = '<b>Календарь и базы</b><button type="button" aria-label="Закрыть"><svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg></button>';
    rail.prepend(top);
    const btn = document.createElement('button');
    btn.type = 'button'; btn.className = 'mrail-btn';
    btn.innerHTML = '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="1.6"><rect x="2.5" y="4" width="15" height="13.5" rx="2"/><path d="M2.5 8h15M6.5 2.5v3M13.5 2.5v3"/></svg><span>Календарь и базы шаблонов</span><s>скопировать · добавить</s>';
    main.prepend(btn);
    document.body.append(bd);
    const set = on => body.classList.toggle('mrail-on', on);
    btn.onclick = () => set(true);
    bd.onclick = top.querySelector('button').onclick = () => set(false);
    document.addEventListener('keydown', e => { if(e.key === 'Escape') set(false) });
  }

  /* ─── перетаскивание пальцем ───
     Страница двигает строки, блоки и дни родным HTML5 drag-and-drop (мышь).
     Пальцем его не начать, поэтому за ручкой «⋮⋮» (.gr) прокладываем
     мост: касание ручки → те же события dragstart / dragover / drop / dragend,
     что послала бы мышь. Логика страницы остаётся одна; в ней ничего не менялось. */
  function touchDnD(){
    const mk = (type, t, dt) => { let ev;
      const init = {bubbles:true, cancelable:true, clientX:t ? t.clientX : 0, clientY:t ? t.clientY : 0, dataTransfer:dt};
      try{ ev = new DragEvent(type, init) }catch(_){ ev = new Event(type, init); ev.dataTransfer = dt; ev.clientX = init.clientX; ev.clientY = init.clientY }
      return ev };
    let st = null;
    const ghostText = h => ((h.querySelector('.nm, .bt, #d-title, b') || h).value || (h.querySelector('.nm') || h).textContent || '').trim().slice(0, 40) || 'Переместить';
    addEventListener('touchstart', e => {
      if(!MQ.matches || e.touches.length !== 1) return;
      const gr = e.target.closest && e.target.closest('.gr'); if(!gr) return;
      const host = gr.closest('.line') || gr.closest('.blk') || gr.closest('.doc') || gr.closest('.cyc'); if(!host) return;
      const t = e.touches[0], dt = (() => { try{ return new DataTransfer() }catch(_){ return {setData(){}, setDragImage(){}, effectAllowed:''} } })();
      gr.dispatchEvent(new MouseEvent('mousedown', {bubbles:true, cancelable:true, clientX:t.clientX, clientY:t.clientY}));
      st = {host, dt, last:null, y:t.clientY, raf:0};
      host.dispatchEvent(mk('dragstart', t, dt));
      const g = document.createElement('div'); g.className = 'mdrag-ghost'; g.textContent = ghostText(host);
      document.body.append(g); st.g = g; move(t);
      document.documentElement.classList.add('mdragging');
    }, {passive:true});
    function move(t){
      st.g.style.left = Math.min(t.clientX + 12, innerWidth - 60) + 'px'; st.g.style.top = (t.clientY - 52) + 'px';
      st.g.style.visibility = 'hidden'; const under = document.elementFromPoint(t.clientX, t.clientY); st.g.style.visibility = '';
      if(under){ st.last = under; under.dispatchEvent(mk('dragover', t, st.dt)) }
      st.y = t.clientY;
    }
    /* у края экрана — подкручиваем страницу, иначе блок не донести до далёкого места */
    function auto(){ if(!st) return;
      const edge = 90, bottom = innerHeight - 70;   /* снизу — над панелью сохранения */
      if(st.y < edge) scrollBy(0, -14); else if(st.y > bottom - edge + 60) scrollBy(0, 14);
      st.raf = requestAnimationFrame(auto) }
    addEventListener('touchmove', e => { if(!st) return; e.preventDefault(); move(e.touches[0]); if(!st.raf) st.raf = requestAnimationFrame(auto) }, {passive:false});
    const end = (e, drop) => { if(!st) return;
      const t = (e.changedTouches && e.changedTouches[0]) || {clientX:0, clientY:st.y}, s = st; st = null;
      cancelAnimationFrame(s.raf); s.g.remove(); document.documentElement.classList.remove('mdragging');
      const under = (drop && s.last) || document.elementFromPoint(t.clientX, t.clientY) || s.host;
      if(drop) under.dispatchEvent(mk('drop', t, s.dt));
      s.host.dispatchEvent(mk('dragend', t, s.dt)) };
    addEventListener('touchend', e => end(e, true));
    addEventListener('touchcancel', e => end(e, false));
  }

  /* ─── «умная» липкая шапка ───
     Шапка календаря (клиент, даты, вид) нужна в начале и при листании вверх;
     при листании вниз она съедала бы четверть экрана. Прячем её на прокрутке
     вниз и возвращаем на малейшем движении вверх. */
  function smartSticky(){
    let last = scrollY;
    addEventListener('scroll', () => {
      const h = document.querySelector('.calwrap .wkh'); if(!h || !MQ.matches) return;
      const y = scrollY, d = y - last; if(Math.abs(d) < 8) return;
      h.classList.toggle('mhid', d > 0 && y > 160); last = y;
    }, {passive:true});
  }

  /* ─── таблицы → карточки: то, что не вмещается в карточку, добавляем здесь ─── */

  /* Ячейка с прочерком в карточке — пустая строка; прячем (CSS: .mnil). */
  function markNil(root){
    root.querySelectorAll('.tbl[data-tbl]:not([data-tbl="pm"]) td:not(.mnil)').forEach(td => { if(/^[—–-]?$/.test(td.textContent.trim()) && !td.querySelector('img,svg,input,button')) td.classList.add('mnil') });
  }

  /* Шапку таблицы на телефоне не видно, а вместе с ней и сортировку. Возвращаем её
     одной строкой над списком: выбор поля и направление. Нажимаем на ту самую
     <th>, поэтому логика сортировки остаётся страницы — копии у нас нет. */
  function sortBar(root){
    root.querySelectorAll('.tblwrap').forEach(w => {
      if(w.previousElementSibling && w.previousElementSibling.classList.contains('msort')) return;
      const ths = [...w.querySelectorAll('th[data-sort]')]; if(!ths.length) return;
      const cur = ths.find(t => /\b(up|dn)\b/.test(t.className));
      const bar = document.createElement('div');
      bar.className = 'msort';
      bar.innerHTML = `<label><span>Сортировка</span><select data-native aria-label="Сортировка">${
        (cur ? '' : '<option value="" selected disabled>по умолчанию</option>')
        + ths.map(t => `<option value="${t.dataset.sort}"${t === cur ? ' selected' : ''}>${t.textContent.trim()}</option>`).join('')
      }</select></label><button type="button" aria-label="Направление сортировки"${cur ? '' : ' disabled'}>${cur && /dn/.test(cur.className) ? '↓' : '↑'}</button>`;
      const [sel, dir] = [bar.querySelector('select'), bar.querySelector('button')];
      sel.onchange = () => { const t = ths.find(x => x.dataset.sort === sel.value); if(t && t !== cur) t.click() };
      dir.onclick = () => { if(cur) cur.click() };
      w.before(bar);
    });
  }

  /* Страницы-потомки: слева в шапке — «назад». Возвращаемся туда, откуда пришли
     (из ленты, календаря или списка), а если зашли по прямой ссылке — в свой раздел. */
  const BACK = {'client.html':'clients.html', 'exercise.html':'exercises.html', 'program.html':'programs.html', 'constructor.html':'index.html', 'workout.html':'clients.html'};
  function backBtn(){
    const file = location.pathname.split('/').pop() || 'index.html', tb = document.getElementById('topbar');
    if(!tb || !BACK[file] || tb.querySelector('.mback')) return;
    const a = document.createElement('a');
    a.className = 'mback'; a.href = BACK[file]; a.setAttribute('aria-label', 'Назад');
    a.innerHTML = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M10 3 5 8l5 5"/></svg>';
    a.onclick = e => { let same = false; try{ same = document.referrer && new URL(document.referrer).origin === location.origin }catch(_){}
      if(same && history.length > 1){ e.preventDefault(); history.back() } };
    tb.prepend(a);
  }

  /* ─── конструктор, компактный вид: режим «Изменить» ───
     В покое у строк нет ручек ⋮⋮ и ✕ — как в списках iOS, они появляются по
     кнопке «Изменить» в шапке дня (html.medit, стили — mobile.css). День
     перерисовывается целиком, поэтому кнопку ставим заново в каждом sweep. */
  function editBtn(){
    const h = document.querySelector('#doc .doch'); if(!h || h.querySelector('.medit-btn')) return;
    const root = document.documentElement, b = document.createElement('button');
    const paint = x => { const on = root.classList.contains('medit'); x.textContent = on ? 'Готово' : 'Изменить'; x.setAttribute('aria-pressed', on) };
    b.type = 'button'; b.className = 'medit-btn'; paint(b);
    b.onclick = e => { e.stopPropagation(); root.classList.toggle('medit'); document.querySelectorAll('.medit-btn').forEach(paint) };
    const menu = h.querySelector('#day-menu'); menu ? menu.before(b) : h.append(b);
  }
  /* В покое цифры строки — текстом, поле по ширине значения. Safari не умеет
     field-sizing, поэтому ширину отдаём переменной --fw (в символах). */
  function fitFields(root){
    root.querySelectorAll('#doc .line input.pf, #doc .line .pf input').forEach(i => {
      const n = Math.max(1, (i.value || '').length); if(i._fw !== n){ i._fw = n; i.style.setProperty('--fw', n + 'ch') } });
  }
  addEventListener('input', e => { if(MQ.matches && e.target.matches && e.target.matches('#doc .line input.pf, #doc .line .pf input')) fitFields(document) }, true);

  /* ─── шторки: закрыть смахиванием вниз (HIG) ───
     Окна (.ov .md), шторка «Ещё», панель «Календарь и базы», выбор клиента и
     даты — шторки снизу. Как в iOS, их можно смахнуть вниз; тянуть — за верхнюю
     полосу (хват и заголовок, 56 px), чтобы жест не спорил с прокруткой внутри.
     Кнопка ✕ и тап по затемнению остаются — у жеста есть альтернатива кнопкой. */
  const SHEET = '.ov.on .md, .ov.on .wmd, .msh-ov.on .msh, body.mrail-on .rail, .sug.dsl, .sug.clipick, .sug.dpick, .sug.dpk, .sug.setup';
  const RM = matchMedia('(prefers-reduced-motion: reduce)');
  function closeSheet(sh){
    if(sh.matches('.msh')){ sh.parentElement.click(); return }
    if(sh.matches('.rail')){ const bd = document.querySelector('.mrail-bd'); if(bd) bd.click(); return }
    if(sh.matches('.sug')){ document.body.dispatchEvent(new MouseEvent('click', {bubbles:true})); setTimeout(() => { if(sh.isConnected) sh.remove() }, 60); return }
    const ov = sh.closest('.ov'), x = sh.querySelector('.cls, [data-x], [data-bkd="close"], [data-close]');
    if(x) x.click(); else if(ov && ov.id === 'ov' && typeof closeModal === 'function') closeModal(); else if(ov) ov.remove();
  }
  let sw = null;
  addEventListener('touchstart', e => {
    if(!MQ.matches || e.touches.length !== 1) return;
    const sh = e.target.closest && e.target.closest(SHEET); if(!sh) return;
    if(e.target.closest('input, textarea, select, [contenteditable]')) return;
    const t = e.touches[0], top = sh.getBoundingClientRect().top;
    if(t.clientY - top > 56) return;
    sw = {sh, y0:t.clientY, dy:0, t0:Date.now()};
  }, {passive:true});
  addEventListener('touchmove', e => {
    if(!sw) return;
    sw.dy = Math.max(0, e.touches[0].clientY - sw.y0);
    if(sw.dy > 4){ e.preventDefault(); sw.sh.style.transition = 'none'; sw.sh.style.transform = `translateY(${sw.dy}px)` }
  }, {passive:false});
  const swEnd = () => { if(!sw) return;
    const {sh, dy, t0} = sw; sw = null;
    const fast = dy > 30 && dy / Math.max(1, Date.now() - t0) > .6;
    const done = () => { sh.style.transition = ''; sh.style.transform = '' };
    if(dy > 90 || fast){
      if(RM.matches){ done(); closeSheet(sh); return }
      sh.style.transition = 'transform .18s ease-in'; sh.style.transform = 'translateY(100%)';
      setTimeout(() => { closeSheet(sh); setTimeout(done, 30) }, 170);
    } else { sh.style.transition = RM.matches ? 'none' : 'transform .2s cubic-bezier(.2,.8,.2,1)'; sh.style.transform = ''; setTimeout(done, 220) }
  };
  addEventListener('touchend', swEnd); addEventListener('touchcancel', swEnd);

  /* ─── VoiceOver: у кнопок-значков имя только в title — даём aria-label ─── */
  function names(root){
    root.querySelectorAll('button[title]:not([aria-label]), a[title]:not([aria-label]), [role=button][title]:not([aria-label]), .dmark[title]:not([aria-label])').forEach(b => {
      if(!b.textContent.trim()) b.setAttribute('aria-label', b.title) });
    /* иконки без title — по назначению */
    const BY = [['[data-del]', 'Удалить упражнение'], ['[data-delpart]', 'Убрать из связки'], ['[data-delss]', 'Удалить сет'], ['[data-notedel]', 'Удалить заметку'], ['.kebab', 'Действия'], ['.cls', 'Закрыть']];
    root.querySelectorAll('button:not([aria-label]):not([title])').forEach(b => {
      if(b.textContent.trim()) return; const m = BY.find(([s]) => b.matches(s)); if(m) b.setAttribute('aria-label', m[1]) });
  }

  /* ─── «+» в шапке — действие этого экрана (HIG: кнопка панели относится к экрану) ───
     На компьютере «+» везде — «Создать тренировку». На телефоне: в списках он
     делает то, что ждут от «+» здесь (пригласить клиента, создать группу, добавить
     в базу), а дублирующая оранжевая кнопка в списке скрыта (mobile.css); в
     календаре и карточке клиента — тренировка этому клиенту; в профиле и на
     страницах-потомках «+» нет. */
  const PLUS = {'clients.html':['#btnInvite', 'Пригласить клиента'], 'groups.html':['#gNew', 'Создать группу'],
                'exercises.html':['#btnAdd'], 'blocks.html':['#btnAdd'], 'workouts.html':['#btnAdd'], 'programs.html':['#btnAdd']};
  const NOPLUS = ['profile.html', 'exercise.html', 'program.html', 'constructor.html', 'workout.html'];
  function plusBtn(){
    const file = location.pathname.split('/').pop() || 'index.html';
    const b = document.querySelector('#topbar .tsplit .btn'); if(!b) return;
    const wrap = b.closest('.tsplit');
    if(NOPLUS.includes(file)){ wrap.classList.add('mnone'); return }
    let subj = '';
    try{ if(file === 'calendar.html' && typeof C !== 'undefined' && C.cid) subj = subjQ(C.cid) }catch(_){}
    if(file === 'client.html'){ const id = new URLSearchParams(location.search).get('id') || (typeof STATE !== 'undefined' && STATE.curClient); if(id) subj = 'client=' + id }
    if(subj){ const h = 'constructor.html?' + subj; if(b.getAttribute('href') !== h) b.setAttribute('href', h); return }
    const p = PLUS[file]; if(!p) return;
    const t = document.querySelector(p[0]); if(!t){ wrap.classList.add('mnone'); return }
    wrap.classList.remove('mnone');
    const name = p[1] || t.textContent.trim();
    if(b.dataset.mplus === name) return;
    b.dataset.mplus = name; b.setAttribute('aria-label', name); b.title = name;
    b.onclick = e => { e.preventDefault(); t.click() };
  }

  let queued = false;
  function sweep(){ queued = false; if(!MQ.matches) return; markNil(document); sortBar(document); backBtn(); plusBtn(); editBtn(); fitFields(document); names(document) }
  new MutationObserver(() => { if(!queued){ queued = true; requestAnimationFrame(sweep) } })
    .observe(document.documentElement, {childList:true, subtree:true});
  document.addEventListener('DOMContentLoaded', sweep);

  touchDnD();
  smartSticky();

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
