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
  const BACK = {'client.html':'clients.html', 'exercise.html':'exercises.html', 'program.html':'programs.html', 'constructor.html':'index.html'};
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

  let queued = false;
  function sweep(){ queued = false; if(!MQ.matches) return; markNil(document); sortBar(document); backBtn() }
  new MutationObserver(() => { if(!queued){ queued = true; requestAnimationFrame(sweep) } })
    .observe(document.documentElement, {childList:true, subtree:true});
  document.addEventListener('DOMContentLoaded', sweep);

  touchDnD();
  smartSticky();

  if(document.readyState === 'loading') document.addEventListener('DOMContentLoaded', build); else build();
})();
