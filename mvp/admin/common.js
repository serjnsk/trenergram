/* ============================================================
   Админка · общее для страниц прототипа

   Время и форматирование, иконки, роль, левое меню, тост и окно.
   Подключается первым: карточкой тренера (trainer.html) и
   страницей партнёрской программы (partners.html).
   ============================================================ */

/* ─── время ─── */
const NOW = new Date();
const DAY = 864e5;
const pad = n => String(n).padStart(2, '0');
const ago = (d, h = 12, m = 0) => { const x = new Date(NOW); x.setDate(x.getDate() - d); x.setHours(h, m, 0, 0); return x.toISOString(); };
const ahead = (d, h = 12, m = 0) => ago(-d, h, m);
const parseD = x => x instanceof Date ? x
  : (typeof x === 'string' && x.length === 10) ? new Date(+x.slice(0, 4), +x.slice(5, 7) - 1, +x.slice(8, 10))
  : new Date(x);
const sod = x => { const d = new Date(parseD(x)); d.setHours(0, 0, 0, 0); return d; };
const dd = (a, b) => Math.round((sod(b) - sod(a)) / DAY);          // дней от a до b
const daysAgo = x => dd(x, NOW);
const dstr = x => { const d = parseD(x); return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`; };
const MON = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];
const WD = ['воскресенье', 'понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота'];
const fd = x => { const d = parseD(x); return `${d.getDate()} ${MON[d.getMonth()]}`; };
const ft = x => { const d = parseD(x); return `${pad(d.getHours())}:${pad(d.getMinutes())}`; };
const fdt = x => `${fd(x)}, ${ft(x)}`;
const W = (n, a, b, c) => { const m = Math.abs(n) % 100, k = m % 10; return m > 10 && m < 20 ? c : k > 1 && k < 5 ? b : k === 1 ? a : c; };
const rel = x => {
  const s = (NOW - parseD(x)) / 1000, d = daysAgo(x);
  if (s < 60) return 'только что';
  if (s < 3600) return `${Math.floor(s / 60)} мин назад`;
  if (d === 0) return `${Math.floor(s / 3600)} ч назад`;
  if (d === 1) return 'вчера';
  return d < 30 ? `${d} ${W(d, 'день', 'дня', 'дней')} назад` : fd(x);
};
const dayLabel = x => { const d = daysAgo(x); return d === 0 ? `Сегодня · ${fd(x)}` : d === 1 ? `Вчера · ${fd(x)}` : `${fd(x)} · ${WD[parseD(x).getDay()]}`; };
const esc = s => String(s ?? '').replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fmtPhone = p => { const d = String(p || '').replace(/\D/g, ''); return d.length === 11 ? `+${d[0]} ${d.slice(1, 4)} ${d.slice(4, 7)}-${d.slice(7, 9)}-${d.slice(9)}` : (p || '—'); };
const initials = s => s.split(/\s+/).filter(Boolean).slice(0, 2).map(w => w[0]).join('').toUpperCase();
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
const $ = s => document.querySelector(s);

/* ─── иконки ─── */
const I = {
  back: 'M10 3 5 8l5 5', arrow: 'M3 8h10M9 4l4 4-4 4', plus: 'M8 3v10M3 8h10', x: 'M4 4l8 8M12 4l-8 8',
  phone: 'M3.5 2.5h2.2l1.1 3-1.5 1a8 8 0 0 0 4.2 4.2l1-1.5 3 1.1v2.2a1 1 0 0 1-1 1A11 11 0 0 1 2.5 3.5a1 1 0 0 1 1-1z',
  tg: 'M14 2.5 1.8 7.3l4.1 1.4 1.5 4.6 2.3-2.6 3.3 2.4L14 2.5zM5.9 8.7l6.2-4.4',
  wa: 'M8 1.8a6.2 6.2 0 0 0-5.4 9.3L1.8 14.2l3.2-.8A6.2 6.2 0 1 0 8 1.8zM6 5.5c0 2.5 2 4.5 4.5 4.5',
  sms: 'M13.5 7.6a5.2 5.2 0 0 1-7.4 4.7L2.5 13.2l1-3.6A5.2 5.2 0 1 1 13.5 7.6z',
  mail: 'M2 3.5h12v9H2zM2 4l6 4.5L14 4', meet: 'M1.8 4.5h8.4v7H1.8zM10.2 7l4-2.3v6.6l-4-2.3',
  note: 'M3 2h7l3 3v9H3zM10 2v3h3M5.5 8h5M5.5 10.5h3.5', task: 'M2.5 2.5h11v11h-11zM5 8l2 2 4-4',
  chk: 'M3 8.5 6.5 12 13 4.5', bolt: 'M9 1.5 3 9h4.5L7 14.5 13 7H8.5z', flag: 'M3.5 14V2.5M3.5 3h8l-1.5 3 1.5 3h-8',
  star: 'M8 1.8l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.6l-3.8 2 .7-4.3-3.1-3 4.3-.6z',
  user: 'M8 8a2.8 2.8 0 1 0 0-5.6A2.8 2.8 0 0 0 8 8zM2.5 14c.6-2.8 2.8-4.3 5.5-4.3s4.9 1.5 5.5 4.3',
  users: 'M6 7.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5zM1.5 13.5c.5-2.4 2.3-3.8 4.5-3.8s4 1.4 4.5 3.8M11 2.7a2.4 2.4 0 0 1 0 4.6M12.2 9.9c1.2.5 2 1.7 2.3 3.6',
  cal: 'M2.5 3.5h11v10h-11zM2.5 6.5h11M5.5 2v3M10.5 2v3', clock: 'M8 14.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13zM8 4.5V8l2.5 1.5',
  lock: 'M3.5 7h9v7h-9zM5.5 7V5a2.5 2.5 0 0 1 5 0v2', trash: 'M2.5 4h11M6 4V2.5h4V4M4 4l.7 9.5h6.6L12 4',
  dots: 'M3.5 8h.01M8 8h.01M12.5 8h.01', alert: 'M8 1.8 14.5 13.5h-13zM8 6v3.5M8 11.5h.01',
  moon: 'M13.5 9.5A5.8 5.8 0 0 1 6.5 2.5a5.8 5.8 0 1 0 7 7z',
  sun: 'M8 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM8 1v1.5M8 13.5V15M1 8h1.5M13.5 8H15M3 3l1 1M12 12l1 1M3 13l1-1M12 4l1-1',
  grid: 'M2.5 2.5h4.5v4.5H2.5zM9 2.5h4.5v4.5H9zM2.5 9h4.5v4.5H2.5zM9 9h4.5v4.5H9z', list: 'M2.5 4h11M2.5 8h11M2.5 12h11',
  pulse: 'M1.5 8h3l1.5-3.5 3 7L10.5 8h4', code: 'M5.5 4.5 2 8l3.5 3.5M10.5 4.5 14 8l-3.5 3.5',
  idea: 'M6 12.5h4M6.5 14.5h3M8 1.5a4.5 4.5 0 0 0-2.6 8.2c.5.4.6.9.6 1.3v.5h4V11c0-.4.1-.9.6-1.3A4.5 4.5 0 0 0 8 1.5z',
  bug: 'M5.5 5.5h5v6a2.5 2.5 0 0 1-5 0zM6 5.5a2 2 0 0 1 4 0M2.5 8.5h3M10.5 8.5h3M3 5l2.5 1.5M13 5l-2.5 1.5M3 13l2.5-1.5M13 13l-2.5-1.5',
  heart: 'M8 13.5S2 10 2 5.8A3 3 0 0 1 8 4.5a3 3 0 0 1 6 1.3C14 10 8 13.5 8 13.5z', edit: 'M10.5 2.5l3 3L6 13H3v-3z',
  out: 'M9.5 2.5h4v4M13.5 2.5 7 9M11.5 9.5v4h-9v-9h4', inn: 'M6.5 13.5h-4v-4M2.5 13.5 9 7M4.5 6.5v-4h9v9h-4',
  pct: 'M12.5 3.5l-9 9M3 5a2 2 0 1 0 4 0 2 2 0 1 0-4 0M9 11a2 2 0 1 0 4 0 2 2 0 1 0-4 0'
};
const ic = (k, w) => `<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="${w || 1.5}" stroke-linecap="round" stroke-linejoin="round"><path d="${I[k]}"/></svg>`;

/* ─── роль и меню ───
   Роль переключается кнопкой внизу меню (в прототипе) или адресом
   ?role=admin / ?role=mkt. Маркетолог видит только тренеров; разделы
   с адресом ведут на страницы прототипа, остальные уже есть в боевой админке. */
let ROLE = 'mkt';
try { ROLE = localStorage.getItem('tg-adm-role') || 'mkt'; } catch (e) {}
{ const r = new URLSearchParams(location.search).get('role');
  if (r === 'admin' || r === 'mkt') { ROLE = r; try { localStorage.setItem('tg-adm-role', r); } catch (e) {} } }

function renderNav(page) {
  const adm = ROLE === 'admin';
  const trainers = { n: 'Тренеры', k: 'user', c: 29, href: 'trainer.html' };
  const items = adm
    ? [{ g: 'Мониторинг' }, { n: 'Обзор', k: 'grid' }, { n: 'Журнал', k: 'list' }, { n: 'Здоровье', k: 'pulse' },
       { g: 'Управление' }, trainers, { n: 'Клиенты', k: 'users', c: 150 },
       { g: 'Настройки' }, { n: 'Партнёры', k: 'pct', href: 'partners.html' }, { n: 'Счётчики', k: 'code' }]
    : [{ g: 'Работа с тренерами' }, trainers];
  $('#nav').innerHTML = `
    <div class="nh"><span class="logo" role="img" aria-label="ТРЕНЕРГРАМ"><i><b>Т</b>РЕНЕРГРА<b>М</b></i><em>ТМ</em></span></div>
    <div class="nbody">${items.map(x => x.g ? `<div class="ngrp">${x.g}</div>`
      : `<a ${x.href ? `href="${x.href === page ? '#' : x.href}"` : 'href="#" data-a="nolink"'} class="${x.href === page ? 'on' : ''}">${ic(x.k)}<span class="ntxt">${x.n}</span>${x.c ? `<span class="cnt">${x.c}</span>` : ''}</a>`).join('')}</div>
    <button class="nfoot role" data-a="role" title="Прототип: переключить роль">
      <span class="av">${adm ? 'А' : 'АМ'}</span>
      <span><b>${adm ? 'Администратор' : 'Анна Миронова'}</b><s>${adm ? 'все разделы' : 'маркетолог'}</s></span>
      <span class="rl">роль</span>
    </button>`;
}
const toggleRole = () => { ROLE = ROLE === 'mkt' ? 'admin' : 'mkt'; try { localStorage.setItem('tg-adm-role', ROLE); } catch (e) {} };

/* ─── тост и окно ─── */
function toast(t) { const el = $('#toast'); el.textContent = t; el.classList.add('on'); clearTimeout(toast.h); toast.h = setTimeout(() => el.classList.remove('on'), 2200); }
function modal(title, body, foot, w = 620) {
  $('#ov').innerHTML = `<div class="md" style="max-width:${w}px"><div class="mdh"><span class="dot"></span><h2>${title}</h2><button class="cls" data-a="mclose">✕</button></div>
    <div class="mdb">${body}</div><div class="mdf">${foot}</div></div>`;
  $('#ov').classList.add('on');
}
