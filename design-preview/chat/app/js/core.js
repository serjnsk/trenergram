/* ═══════════════════════════════════════════════════════════════
   ЯДРО ПРИЛОЖЕНИЯ КЛИЕНТА
   Помощники, иконки, хранилище записей клиента, навигация, шторки,
   уведомления. Доменная модель — общая с кабинетом тренера
   (../assets/data.js): тренировки, упражнения, максимумы приходят оттуда.
   ═══════════════════════════════════════════════════════════════ */
const $  = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const plural = (n, a, b, c) => plural3(Math.abs(Math.round(n)), a, b, c);
/* «Уменьшить движение» в системе — прокрутка без плавности (HIG). */
const motion = () => matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth';
const fmtN = v => String(Math.round(v * 100) / 100).replace('.', ',');
const NB = ' ';
const kgS = v => fmtN(v) + NB + 'кг';
const mmss = t => { t = Math.max(0, Math.round(+t || 0)); return Math.floor(t / 60) + ':' + String(t % 60).padStart(2, '0') };
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));

/* ─── даты по-человечески ─── */
const DOW_FULL = ['понедельник','вторник','среда','четверг','пятница','суббота','воскресенье'];
const DOW_ACC  = ['понедельник','вторник','среду','четверг','пятницу','субботу','воскресенье'];
const MON_S = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
const cap1 = s => s ? s[0].toUpperCase() + s.slice(1) : s;
const dLong  = s => { const d = D(s); return DOW_FULL[dowMon(s)] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()] + (d.getFullYear() !== D(TODAY).getFullYear() ? ' ' + d.getFullYear() : '') };
const dDM    = s => { const d = D(s); return d.getDate() + ' ' + MONTHS[d.getMonth()] };
const dShort = s => { const d = D(s); return d.getDate() + ' ' + MON_S[d.getMonth()] };
const dRel = s => { const n = daysBetween(TODAY, s);
  return n === 0 ? 'сегодня' : n === -1 ? 'вчера' : n === 1 ? 'завтра' : n === -2 ? 'позавчера' : n === 2 ? 'послезавтра' : '' };
const agoS = s => { const n = daysBetween(s, TODAY); return n <= 0 ? 'сегодня' : n === 1 ? 'вчера' : n < 7 ? n + ' ' + plural(n,'день','дня','дней') + ' назад' : dShort(s) };
const weekStart = s => addDays(s, -dowMon(s));
const nowHM = () => { const d = new Date(); return String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0') };
/* Время сообщения: ISO → «сейчас», «14:20», «вчера, 21:14», «19 сен». Демо-сообщения
   тренера приходят готовой строкой — их показываем как есть. */
function atS(at){
  if(!at) return '';
  if(!/^\d{4}-\d{2}-\d{2}T/.test(at)) return at;
  const d = new Date(at), day = iso(d), hm = String(d.getHours()).padStart(2,'0') + ':' + String(d.getMinutes()).padStart(2,'0');
  if(Date.now() - d.getTime() < 60000) return 'сейчас';
  if(day === TODAY) return hm;
  if(daysBetween(day, TODAY) === 1) return 'вчера, ' + hm;
  return dShort(day);
}
const ageOf = born => { if(!born) return null; const b = D(born), t = D(TODAY); let a = t.getFullYear() - b.getFullYear();
  if(t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--; return a };

/* ═══════════ ИКОНКИ ═══════════
   Тот же почерк, что у тренера: контур, скруглённые концы, currentColor.
   Сетка 24, толщина 1.7 — на телефоне иконки крупнее, чем в кабинете. */
const svg = (d, sw = 1.7, extra = '') => `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round" ${extra}>${d}</svg>`;
const ICO = {
  train:  svg('<path d="M6.5 7v10M3.5 9.5v5M17.5 7v10M20.5 9.5v5M6.5 12h11"/>', 1.9),
  prog:   svg('<path d="M4 19h16"/><path d="M5.5 15.5 10 11l3 3 5.5-6.5"/><path d="M15 7.5h3.5V11"/>', 1.8),
  talk:   svg('<path d="M20 11.4a7.6 7.6 0 0 1-10.9 6.9L4 19.6l1.4-4.6A7.6 7.6 0 1 1 20 11.4z"/>', 1.8),
  me:     svg('<circle cx="12" cy="8.2" r="3.7"/><path d="M4.8 19.8c.9-3.6 3.8-5.6 7.2-5.6s6.3 2 7.2 5.6"/>', 1.8),
  back:   svg('<path d="M15 5l-7 7 7 7"/>', 2),
  fwd:    svg('<path d="M9 5l7 7-7 7"/>', 2),
  chev:   svg('<path d="M9 6l6 6-6 6"/>', 2),
  down:   svg('<path d="M6 9l6 6 6-6"/>', 2),
  x:      svg('<path d="M6 6l12 12M18 6 6 18"/>', 2),
  chk:    svg('<path d="M5 12.5 10 17.5 19 7"/>', 2.4),
  undo:   svg('<path d="M8.5 8.5H4.5v-4"/><path d="M4.9 8.3A7.5 7.5 0 1 1 4.6 14"/>', 2),
  plus:   svg('<path d="M12 5v14M5 12h14"/>', 2),
  cal:    svg('<rect x="3.5" y="5" width="17" height="15.5" rx="2.5"/><path d="M3.5 10h17M8 3v4M16 3v4"/>'),
  more:   '<svg viewBox="0 0 24 24" fill="currentColor"><circle cx="5.5" cy="12" r="1.8"/><circle cx="12" cy="12" r="1.8"/><circle cx="18.5" cy="12" r="1.8"/></svg>',
  chat:   svg('<path d="M20 11.4a7.6 7.6 0 0 1-10.9 6.9L4 19.6l1.4-4.6A7.6 7.6 0 1 1 20 11.4z"/>'),
  clock:  svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/>'),
  hist:   svg('<path d="M4.5 12a7.5 7.5 0 1 0 2.2-5.3"/><path d="M4.5 4.5v3.4h3.4"/><path d="M12 8.5V12l2.5 1.6"/>'),
  off:    svg('<path d="M3 3l18 18"/><path d="M8.5 16.5a5 5 0 0 1 7 0M5 13a10 10 0 0 1 4.2-2.4M12 8.5a10 10 0 0 1 7 4.5M2 9.5a15 15 0 0 1 4-2.8M12 4a15 15 0 0 1 10 5.5"/><circle cx="12" cy="20" r=".6" fill="currentColor"/>'),
  cloud:  svg('<path d="M7 18.5h10.5a4 4 0 0 0 .6-7.95A6 6 0 0 0 6.5 9.2 4.7 4.7 0 0 0 7 18.5z"/><path d="M12 11v5M9.8 13.8 12 16l2.2-2.2"/>'),
  sync:   svg('<path d="M19.5 12a7.5 7.5 0 0 1-13 5.1M4.5 12a7.5 7.5 0 0 1 13-5.1"/><path d="M17.5 3.5v3.4h-3.4M6.5 20.5v-3.4h3.4"/>'),
  trophy: svg('<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M7 6H4.5a1.5 1.5 0 0 0 0 3H7M17 6h2.5a1.5 1.5 0 0 1 0 3H17"/>'),
  moon:   svg('<path d="M19.5 14.5A7.8 7.8 0 0 1 9.5 4.5a7.8 7.8 0 1 0 10 10z"/>'),
  grp:    svg('<circle cx="9" cy="8" r="3.2"/><path d="M3 19c.6-3.2 3-5 6-5s5.4 1.8 6 5"/><path d="M15.5 5.2a3.2 3.2 0 0 1 0 5.6M17.5 14.2c1.8.6 3 2.2 3.4 4.8"/>'),
  play:   svg('<path d="M8 5.5v13l10.5-6.5z"/>'),
  img:    svg('<rect x="3.5" y="4.5" width="17" height="15" rx="2.5"/><circle cx="9" cy="10" r="1.8"/><path d="M20.5 16l-5-5-8.5 8.5"/>'),
  info:   svg('<circle cx="12" cy="12" r="8.5"/><path d="M12 11v5.5M12 7.8v.2"/>'),
  warn:   svg('<path d="M12 4 2.8 19.5h18.4z"/><path d="M12 10v4.5M12 17.2v.2"/>'),
  lock:   svg('<rect x="5" y="10.5" width="14" height="10" rx="2.2"/><path d="M8.5 10.5V8a3.5 3.5 0 0 1 7 0v2.5"/>'),
  link:   svg('<path d="M10 14a4 4 0 0 0 5.7 0l3.2-3.2a4 4 0 0 0-5.7-5.7l-1 1"/><path d="M14 10a4 4 0 0 0-5.7 0l-3.2 3.2a4 4 0 0 0 5.7 5.7l1-1"/>'),
  phone:  svg('<path d="M5.5 4h3l1.5 4-2 1.2a10 10 0 0 0 5 5L14.2 12l4 1.5v3A2 2 0 0 1 16 18.5 13.5 13.5 0 0 1 3.5 6 2 2 0 0 1 5.5 4z"/>'),
  mail:   svg('<rect x="3.5" y="5.5" width="17" height="13" rx="2.2"/><path d="M4 7l8 6 8-6"/>'),
  tg:     svg('<path d="M20.5 4.5 3.5 11l5.5 2 2 6 3-4 5 3.5z"/><path d="M9 13l8-5.5"/>'),
  edit:   svg('<path d="M15.5 5.5l3 3L9 18l-4 1 1-4z"/>'),
  trash:  svg('<path d="M5 7h14M10 7V5h4v2M7 7l1 12.5h8L17 7"/>'),
  scale:  svg('<rect x="3.5" y="3.5" width="17" height="17" rx="4"/><path d="M8 9.5a5.5 5.5 0 0 1 8 0l-2.5 3"/>'),
  ruler:  svg('<path d="M3.5 16.5 16.5 3.5l4 4-13 13z"/><path d="M7 13l1.5 1.5M10 10l1.5 1.5M13 7l1.5 1.5"/>'),
  bolt:   svg('<path d="M13 3 5 13.5h6L10 21l8-10.5h-6z"/>'),
  send:   svg('<path d="M12 19V5M5.5 11.5 12 5l6.5 6.5"/>', 2.2),
  reply:  svg('<path d="M10 7 5 12l5 5"/><path d="M5 12h9a5 5 0 0 1 5 5v1"/>', 2),
  search: svg('<circle cx="10.5" cy="10.5" r="6"/><path d="M15 15l5 5"/>'),
  set:    svg('<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M4.2 7.4l2.1 1.2M17.7 15.4l2.1 1.2M4.2 16.6l2.1-1.2M17.7 8.6l2.1-1.2"/>'),
  device: svg('<rect x="6.5" y="2.8" width="11" height="18.4" rx="2.6"/><path d="M10.5 18h3"/>'),
  exit:   svg('<path d="M14 4.5H6.5a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2H14"/><path d="M10 12h10M16.5 8.5 20 12l-3.5 3.5"/>'),
  user:   svg('<circle cx="12" cy="8.2" r="3.7"/><path d="M4.8 19.8c.9-3.6 3.8-5.6 7.2-5.6s6.3 2 7.2 5.6"/>'),
  heart:  svg('<path d="M12 19.5s-7.5-4.4-7.5-9.8A4.2 4.2 0 0 1 12 7.2a4.2 4.2 0 0 1 7.5 2.5c0 5.4-7.5 9.8-7.5 9.8z"/>'),
  dumb:   svg('<path d="M6.5 7v10M3.5 9.5v5M17.5 7v10M20.5 9.5v5M6.5 12h11"/>', 1.8),
  up:     svg('<path d="M12 19V5M6 11l6-6 6 6"/>', 2),
  star:   svg('<path d="M12 3.8l2.5 5.2 5.6.7-4.1 3.9 1 5.6L12 16.5l-5 2.7 1-5.6-4.1-3.9 5.6-.7z"/>'),
};

/* ═══════════ ХРАНИЛИЩЕ КЛИЕНТА ═══════════
   Всё, что пишет клиент, — отдельный ключ localStorage. Состояние кабинета
   тренера (trenergram.design.chat.state) приложение только читает: иначе вкладка тренера
   и вкладка клиента затирали бы друг другу правки старыми копиями.
   p:1 у записи — «ждёт отправки»: сделана без сети (CLI-5). */
const CS_KEY = 'trenergram.design.chat.client';
const CS = (function(){
  const def = {v:1, cid:'c1', onb:true, off:false, wifiOnly:true, cache:500, synced:null,
               res:{}, pm:{}, meas:{}, prof:{}, seen:{}};
  try{ const raw = localStorage.getItem(CS_KEY); if(raw) return Object.assign(def, JSON.parse(raw)) }catch(_){}
  return def;
})();
function saveCS(){ try{ localStorage.setItem(CS_KEY, JSON.stringify(CS)) }catch(_){} }
const off = () => !!CS.off;
const pendMark = () => off() ? {p:1} : {};

/* ═══════════ НАВИГАЦИЯ ═══════════
   Адрес экрана — в хеше: #/train, #/train/day/2026-09-30, #/progress/pm/squat…
   Каждый маршрут отдаёт разметку, вкладку и родителя (куда ведёт «назад»,
   если истории нет). Переходы: вглубь — справа, назад — слева, между
   вкладками — без сдвига, как в iOS. */
const ROUTES = [];
function route(pat, fn){
  const keys = [];
  const re = new RegExp('^' + pat.replace(/:([a-zA-Z]+)/g, (_, k) => { keys.push(k); return '([^/]+)' }) + '$');
  ROUTES.push({re, keys, fn});
}
const TAB_ROOT = {train:'#/train', progress:'#/progress', chat:'#/chat', me:'#/me'};
const Nav = {
  stack: [], cur: null, last: {}, scroll: {}, popNext: false,
  go(h){ if(location.hash === h) App.render(); else location.hash = h },
  replace(h){ history.replaceState(null, '', h); App.render('fade') },
  /* Нет истории — переходим к родителю, но как «назад»: слева и с прежним скроллом. */
  back(parent){ if(Nav.stack.length > 1) history.back(); else { Nav.popNext = true; location.hash = parent || '#/train' } },
};
function parseHash(){
  const h = location.hash || '#/train';
  const [path, qs] = h.slice(1).split('?');
  const q = Object.fromEntries(new URLSearchParams(qs || ''));
  for(const r of ROUTES){
    const m = path.match(r.re);
    if(m){ const p = {}; r.keys.forEach((k, i) => p[k] = decodeURIComponent(m[i + 1])); return {r, p, q, h} }
  }
  return null;
}

/* Цвет верхнего края экрана: первый элемент с непрозрачным фоном — от шапки к экрану. */
function topBg(v){
  for(let e = v.firstElementChild || v; e; e = e.parentElement){
    const c = getComputedStyle(e).backgroundColor;
    if(c && c !== 'transparent' && !/^rgba\(.*,\s*0\)$/.test(c)) return c;
    if(e === v) break;
  }
  return 'var(--bg)';
}
const App = {
  view: null, screen: null,
  render(mode){
    const hit = parseHash();
    if(!hit){ location.replace('#/train'); return }
    /* Незавершённый вход — только экраны входа. */
    if(!CS.onb && !hit.h.startsWith('#/in/')){ location.replace('#/in/splash'); return }
    const prev = Nav.cur, nextTab = App.nextTab; App.nextTab = null;
    if(prev && App.view){ const b = $('.body', App.view); if(b) Nav.scroll[prev] = b.scrollTop }
    let anim = mode || 'push';
    if(!mode && Nav.popNext){ Nav.popNext = false; anim = 'pop'; Nav.stack = [hit.h]; mode = 'pop' }
    const drop = !mode && Nav.dropNext; Nav.dropNext = false;          /* экран выезжает сверху — календарь из «шторки» */
    if(!mode){
      const i = Nav.stack.lastIndexOf(hit.h);
      if(i >= 0 && i < Nav.stack.length - 1){ Nav.stack = Nav.stack.slice(0, i + 1); anim = 'pop' }
      else if(hit.h !== prev) Nav.stack.push(hit.h);
      else anim = 'none';
    }
    Nav.cur = hit.h;
    const s = hit.r.fn(hit.p, hit.q) || {};
    App.screen = s;
    /* tab:'*' — экран, который открывается из разных вкладок (тренировка,
       упражнение): остаётся во вкладке, из которой его открыли. */
    if(s.tab === '*') s.tab = nextTab || App.lastTab || 'train';
    if(s.tab){
      /* смена вкладки — без сдвига, стек начинается заново */
      if(App.lastTab && App.lastTab !== s.tab && !mode){ anim = 'fade'; Nav.stack = [hit.h] }
      App.lastTab = s.tab; Nav.last[s.tab] = hit.h;
    }
    const v = document.createElement('div');
    if(drop && anim === 'push') anim = 'down';
    v.className = 'view' + (s.cls ? ' ' + s.cls : '') + (anim === 'push' ? ' a-push' : anim === 'pop' ? ' a-pop' : anim === 'fade' ? ' a-fade' : anim === 'down' ? ' a-down' : '');
    v.innerHTML = s.html || '';
    const box = $('#views');
    box.innerHTML = ''; box.appendChild(v);
    App.view = v;
    const scr = $('#scr');
    scr.classList.toggle('tabs-on', !!s.tab && s.tabs !== false);
    /* Статус-бар — цвета верха экрана, как в iOS: фон шапки экрана, а если
       она прозрачная — фон самого экрана. Вручную задаётся только оранжевый. */
    scr.style.setProperty('--sbbg', s.sb === 'acc' ? 'var(--acc)' : topBg(v));
    scr.style.setProperty('--sbfg', s.sb === 'acc' ? '#fff' : 'var(--ink)');
    scr.classList.toggle('hb-light', s.sb === 'acc');
    Tabs.paint(s.tab);
    /* Вернулись назад или в другую вкладку — туда же, где были: тренировка не
       прыгает в начало, пока клиент сходил в чат и обратно. */
    if(anim !== 'push'){ const b = $('.body', v); if(b && Nav.scroll[hit.h] != null) b.scrollTop = Nav.scroll[hit.h] }
    App.anim = anim;
    if(s.mount) s.mount(v);
    App.wire(v);
    Side.mark();
  },
  wire(v){
    const nv = $('.nav.rv', v), b = $('.body', v);
    if(nv && b){ const f = () => nv.classList.toggle('on', b.scrollTop > 64); b.addEventListener('scroll', f, {passive:true}); f() }
  },
  /* Перерисовать текущий экран после изменения данных — без анимации и с тем же скроллом. */
  refresh(){ const b = App.view && $('.body', App.view), y = b ? b.scrollTop : 0;
    const hit = parseHash(); if(!hit) return;
    const s = hit.r.fn(hit.p, hit.q) || {}; App.screen = s;
    if(s.tab === '*') s.tab = App.lastTab || 'train';
    App.view.className = 'view' + (s.cls ? ' ' + s.cls : '');
    App.view.innerHTML = s.html || '';
    const nb = $('.body', App.view); if(nb) nb.scrollTop = y;
    App.anim = 'none';
    if(s.mount) s.mount(App.view);
    App.wire(App.view);
    Tabs.paint(s.tab); Side.mark();
  },
};
window.addEventListener('hashchange', () => { Sheet.close(true); App.render() });

/* ═══════════ ДЕЙСТВИЯ ═══════════
   Разметка экранов — строки, поэтому клики разбираются одним делегатом:
   data-go — переход, data-act — именованное действие из реестра ACT. */
const ACT = {};
document.addEventListener('click', e => {
  const g = e.target.closest('[data-go]');
  if(g && g.closest('#scr')){ e.preventDefault(); Nav.go(g.dataset.go); return }
  const a = e.target.closest('[data-act]');
  if(a){ const f = ACT[a.dataset.act]; if(f){ e.preventDefault(); f(a, e) } }
});

/* ═══════════ ВКЛАДКИ ═══════════ */
const TABS = [['train','Тренировки',ICO.train],['progress','Прогресс',ICO.prog],['chat','Чат',ICO.talk],['me','Профиль',ICO.me]];
const Tabs = {
  paint(active){
    const unread = Model.unreadCount();
    $('#tabs').innerHTML = TABS.map(([k, n, ic]) => `<button class="${k === active ? 'on' : ''}" data-act="tab" data-k="${k}" aria-label="${n}">
      ${ic}<span>${n}</span>${k === 'chat' && unread ? `<b class="bd">${unread}</b>` : ''}</button>`).join('');
  }
};
ACT.tab = el => { const k = el.dataset.k;
  /* Нажатие на активную вкладку возвращает к её началу, на другую — туда, где остановились.
     Экран, общий для вкладок (тренировка, упражнение), открывается во вкладке, на
     которую нажали, а не в той, где были до этого. Чат — один экран: всегда сам
     диалог, без «назад» к заданию, из которого его когда-то открыли. */
  App.nextTab = k;
  Nav.go(k === 'chat' ? TAB_ROOT.chat : k === App.lastTab ? TAB_ROOT[k] : (Nav.last[k] || TAB_ROOT[k])) };

/* ═══════════ ШТОРКА ═══════════ */
const Sheet = {
  cur: null,
  open(html, {mount, onClose} = {}){
    Sheet.close(true);
    const box = $('#sheets');
    box.innerHTML = `<div class="sov" data-act="sheetClose"></div><div class="sht" role="dialog" aria-modal="true"><div class="grab"></div><div class="sbody">${html}</div></div>`;
    Sheet.cur = {onClose};
    void $('.sht', box).offsetHeight;          /* зафиксировать исходное положение — и сразу поехать вверх */
    $('.sov', box).classList.add('on'); $('.sht', box).classList.add('on');
    if(mount) mount($('.sht', box));
  },
  close(now){
    const box = $('#sheets'); if(!Sheet.cur) return;
    const c = Sheet.cur; Sheet.cur = null;
    if(now){ box.innerHTML = '' } else {
      $('.sov', box)?.classList.remove('on'); $('.sht', box)?.classList.remove('on');
      setTimeout(() => { if(!Sheet.cur) box.innerHTML = '' }, 260);
    }
    if(c.onClose) c.onClose();
  },
};
ACT.sheetClose = () => Sheet.close();
document.addEventListener('keydown', e => { if(e.key === 'Escape') Sheet.close() });

/* ═══════════ УВЕДОМЛЕНИЕ ═══════════ */
let TT = null;
function toast(text, label, fn, ms){
  const t = $('#toast');
  t.innerHTML = `<span>${esc(text)}</span>${label ? `<button>${esc(label)}</button>` : ''}`;
  if(label) $('button', t).onclick = () => { t.classList.remove('on'); fn && fn() };
  t.classList.add('on');
  clearTimeout(TT); TT = setTimeout(() => t.classList.remove('on'), ms || (label ? 5000 : 2400));
}

/* ═══════════ ГРАФИК (PRO-6) ═══════════
   Тот же рисунок, что в карточке клиента у тренера (ui.js → lineChart),
   под ширину телефона. */
let CHN = 0;
function lineChart(series, unit = 'кг'){
  if(!series || series.length < 2) return `<div class="nod">Нужна ещё одна запись, чтобы построить график</div>`;
  const W = 350, H = 170, PL = 42, PR = 8, PT = 24, PB = 24, id = 'lg' + (++CHN);
  const vals = series.map(s => s[1]);
  const min = Math.min(...vals), max = Math.max(...vals);
  const lo = min - (max - min || 10) * .35, hi = max + (max - min || 10) * .25;
  const x = i => PL + i / (series.length - 1) * (W - PL - PR);
  const y = v => PT + (1 - (v - lo) / (hi - lo)) * (H - PT - PB);
  const ticks = [lo + (hi - lo) * .15, (lo + hi) / 2, hi - (hi - lo) * .08].map(v => Math.round(v / 2.5) * 2.5);
  const pts = series.map((s, i) => [x(i), y(s[1])]);
  const path = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const area = path + ` L${pts[pts.length - 1][0].toFixed(1)} ${H - PB} L${pts[0][0].toFixed(1)} ${H - PB} Z`;
  const step = Math.ceil(series.length / 6);
  return `<svg viewBox="0 0 ${W} ${H}">
    <defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="var(--acc)" stop-opacity=".16"/><stop offset="1" stop-color="var(--acc)" stop-opacity="0"/></linearGradient></defs>
    ${ticks.map(t => `<line x1="${PL}" y1="${y(t).toFixed(1)}" x2="${W - PR}" y2="${y(t).toFixed(1)}" stroke="var(--line)"/>
      <text class="yl" x="${PL - 6}" y="${(y(t) + 4).toFixed(1)}" text-anchor="end">${fmtN(t)}</text>`).join('')}
    <path d="${area}" fill="url(#${id})"/>
    <path d="${path}" fill="none" stroke="var(--acc)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
    ${pts.map((p, i) => `<circle cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${i === pts.length - 1 ? 4.5 : 3.2}" fill="${i === pts.length - 1 ? 'var(--acc)' : 'var(--bg)'}" stroke="var(--acc)" stroke-width="1.8"/>`).join('')}
    ${series.map((s, i) => (i % step === 0 || i === series.length - 1) && !(i !== series.length - 1 && series.length - 1 - i < step) ? `<text class="yl" x="${x(i).toFixed(1)}" y="${H - 6}" text-anchor="${i === 0 ? 'start' : i === series.length - 1 ? 'end' : 'middle'}">${dm(s[0])}</text>` : '').join('')}
    <text class="yl" x="${x(series.length - 1).toFixed(1)}" y="${(y(series[series.length - 1][1]) - 12).toFixed(1)}" text-anchor="end" fill="var(--acc)" style="font-size:13px;font-weight:700;fill:var(--acc)">${fmtN(series[series.length - 1][1])} ${unit}</text>
  </svg>`;
}
