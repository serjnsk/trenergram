/* ═══════════ ВЫПАДАЮЩИЙ СПИСОК — ОДИН НА ВЕСЬ КАБИНЕТ ═══════════
   Системный список браузера выглядит по-разному в Chrome и Safari, не ищет и
   не умеет подписей. Страницы по-прежнему пишут обычный <select> — с его
   value, onchange и <optgroup>, — а этот файл прячет его и ставит рядом
   кнопку: по ней открывается наш список. Выбор пишется в <select> и шлёт
   change, поэтому обработчики страниц не меняются.

   Поиск — в списках длиннее DD_SEARCH_FROM пунктов: в коротких он мешает.
   Подпись справа у пункта — атрибут data-sub у <option>. Свой системный
   список оставить — data-native у <select>.

   Отдельный файл без глобальных имён (кроме DD): его подключает и страница
   дизайн-системы, которая живёт без общих скриптов кабинета. */
(function(){
  const DD_SEARCH_FROM = 5;
  const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
  const nrm = s => String(s || '').toLowerCase().replace(/ё/g, 'е').trim();
  const CHEV = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 6.5l4 4 4-4"/></svg>';
  const CHK = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.9" aria-hidden="true"><path d="M3.5 8.5 6.5 11.5 12.5 5"/></svg>';
  const SRCH = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" aria-hidden="true"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5 14 14"/></svg>';

  let OPEN = null;                       /* {box, btn, sel, off} — открыт всегда один */

  const label = sel => { const o = sel.options[sel.selectedIndex];
    return o ? `${esc(o.textContent)}${o.dataset.sub ? `<s>${esc(o.dataset.sub)}</s>` : ''}` : '' };
  function sync(sel){
    const b = sel._dd; if(!b) return;
    b.querySelector('.dselv').innerHTML = label(sel);
    b.disabled = sel.disabled;
    b.classList.toggle('ph', !sel.value);                      /* «Отдых», «Все папки» — приглушённо */
  }

  /* Кнопка вместо <select>: та же ширина (инлайн-стиль переезжает), а у поля
     формы (.inp) — на всю ширину, как было. */
  function enhance(root){
    (root || document).querySelectorAll('select:not([data-dsel]):not([data-native])').forEach(sel => {
      sel.dataset.dsel = '1';
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'dsel' + (sel.classList.contains('inp') ? ' dsel-inp' : '');
      if(sel.getAttribute('style')) b.setAttribute('style', sel.getAttribute('style'));
      if(sel.id) b.dataset.for = sel.id;
      if(sel.hasAttribute('tabindex')) b.tabIndex = sel.tabIndex;
      b.setAttribute('aria-haspopup', 'listbox');
      const lab = sel.getAttribute('aria-label') || sel.title; if(lab) b.setAttribute('aria-label', lab);
      b.innerHTML = `<span class="dselv"></span>${CHEV}`;
      sel._dd = b; b._sel = sel;
      sel.after(b);
      sync(sel);
      sel.addEventListener('change', () => sync(sel));
    });
  }

  function close(back){
    if(!OPEN) return;
    const {box, btn, off} = OPEN; OPEN = null;
    box.remove(); btn.classList.remove('open'); btn.setAttribute('aria-expanded', 'false');
    document.removeEventListener('mousedown', off, true);
    removeEventListener('resize', onWin); removeEventListener('scroll', onScroll, true);
    if(back) btn.focus({preventScroll:true});
  }
  const onWin = () => close();
  const onScroll = e => { if(OPEN && !OPEN.box.contains(e.target)) place() };

  /* Под кнопкой, а не помещается вниз — над ней. Ширина — не уже кнопки. */
  function place(){
    const {box, btn} = OPEN, r = btn.getBoundingClientRect();
    if(!r.width){ close(); return }                             /* кнопку спрятали (строка связки без курсора) */
    box.style.minWidth = Math.max(240, r.width) + 'px';
    const h = box.offsetHeight, below = innerHeight - r.bottom - 8, up = below < h && r.top > below;
    box.style.left = Math.min(r.left, innerWidth - box.offsetWidth - 8) + scrollX + 'px';
    box.style.top = (up ? r.top - h - 6 : r.bottom + 6) + scrollY + 'px';
    box.classList.toggle('up', up);
  }

  function open(btn){
    const sel = btn._sel; if(!sel || sel.disabled) return;
    if(OPEN && OPEN.btn === btn){ close(true); return }
    close();
    const items = [...sel.options].map((o, i) => ({i, t:o.textContent, sub:o.dataset.sub || '', dis:o.disabled,
      g: o.parentElement.tagName === 'OPTGROUP' ? o.parentElement.label : ''}));
    const search = items.length > DD_SEARCH_FROM && !sel.hasAttribute('data-nosearch');
    const box = document.createElement('div');
    box.className = 'sug dsl';
    box.setAttribute('role', 'listbox');
    box.innerHTML = (search ? `<label class="dsel-s">${SRCH}<input placeholder="Поиск…" autocomplete="off" spellcheck="false" aria-label="Поиск в списке"></label>` : '')
      + '<div class="dsel-list"></div>';
    document.body.appendChild(box);
    const list = box.querySelector('.dsel-list'), inp = box.querySelector('input');
    const draw = q => {
      const qq = nrm(q), rows = items.filter(x => !qq || nrm(x.t + ' ' + x.sub).includes(qq));
      let g = null, h = '';
      rows.forEach(x => {
        if(x.g && x.g !== g){ g = x.g; h += `<div class="dsel-cap">${esc(g)}</div>` }
        const cur = x.i === sel.selectedIndex;
        h += `<button type="button" class="row${cur ? ' cur' : ''}" role="option" aria-selected="${cur}" data-i="${x.i}"${x.dis ? ' disabled' : ''}>`
          + `<span class="dsel-t">${esc(x.t)}</span>${x.sub ? `<s>${esc(x.sub)}</s>` : ''}${cur ? CHK : ''}</button>`;
      });
      list.innerHTML = h || '<div class="dsel-none">Ничего не нашли</div>';
      const on = (!qq && list.querySelector('.row.cur')) || list.querySelector('.row:not([disabled])');
      if(on){ on.classList.add('on'); on.scrollIntoView({block:'nearest'}) }
    };
    draw('');
    const off = e => { if(!box.contains(e.target) && !btn.contains(e.target)) close() };
    OPEN = {box, btn, sel, off, key: null};
    btn.classList.add('open'); btn.setAttribute('aria-expanded', 'true');
    place();
    document.addEventListener('mousedown', off, true);
    addEventListener('resize', onWin); addEventListener('scroll', onScroll, true);
    /* Без поиска фокус остаётся на кнопке: поля связки в конструкторе видны,
       только пока курсор в строке. Клавиши с кнопки уходят в список. */
    if(inp){ inp.focus({preventScroll:true}); inp.addEventListener('input', () => { draw(inp.value); place() }) }

    const pick = i => {
      close(true);
      if(i === sel.selectedIndex) return;
      sel.selectedIndex = i;
      sel.dispatchEvent(new Event('input', {bubbles:true}));
      sel.dispatchEvent(new Event('change', {bubbles:true}));
    };
    box.addEventListener('mousedown', e => { if(e.target.closest('.row')) e.preventDefault() });   /* фокус остаётся в поиске */
    box.addEventListener('click', e => { const r = e.target.closest('.row:not([disabled])'); if(r) pick(+r.dataset.i) });
    box.addEventListener('mousemove', e => { const r = e.target.closest('.row:not([disabled])'); if(!r || r.classList.contains('on')) return;
      list.querySelectorAll('.row.on').forEach(x => x.classList.remove('on')); r.classList.add('on') });
    const key = e => {
      const rows = [...list.querySelectorAll('.row:not([disabled])')], k = rows.findIndex(x => x.classList.contains('on'));
      if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); close(true); return }
      if(e.key === 'Tab'){ close(); return }
      if(e.key === 'ArrowDown' || e.key === 'ArrowUp'){ e.preventDefault(); if(!rows.length) return;
        if(k >= 0) rows[k].classList.remove('on');
        const n = (k + (e.key === 'ArrowDown' ? 1 : -1) + rows.length) % rows.length;
        rows[n].classList.add('on'); rows[n].scrollIntoView({block:'nearest'}); return }
      if(e.key === 'Enter' || (e.key === ' ' && !inp)){ e.preventDefault(); const r = rows[k] || rows[0]; if(r) pick(+r.dataset.i) }
    };
    box.addEventListener('keydown', key);
    OPEN.key = key;
  }

  document.addEventListener('click', e => { const b = e.target.closest('button.dsel'); if(b){ e.preventDefault(); open(b) } });
  document.addEventListener('keydown', e => {
    if(OPEN && e.target === OPEN.btn){ OPEN.key(e); return }
    const b = e.target.closest && e.target.closest('button.dsel');
    if(b && (e.key === 'ArrowDown' || e.key === 'ArrowUp')){ e.preventDefault(); open(b) }
  });
  /* Страницы перерисовывают разметку целиком — новые <select> подхватываем
     сразу, до отрисовки кадра: системный список не успевает мелькнуть. */
  const mo = new MutationObserver(ms => { for(const m of ms) for(const n of m.addedNodes) if(n.nodeType === 1){
    if(n.tagName === 'SELECT') enhance(n.parentElement); else if(n.querySelector('select:not([data-dsel])')) enhance(n) }
    if(OPEN && !OPEN.btn.isConnected) close() });
  const start = () => { enhance(); mo.observe(document.body, {childList:true, subtree:true}) };
  if(document.body) start(); else addEventListener('DOMContentLoaded', start);
  window.DD = {enhance, sync, close};
})();
