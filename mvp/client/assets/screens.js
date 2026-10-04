/* ═══════════════════════════════════════════════════════════════
   ЭКРАНЫ КЛИЕНТСКОГО ПРИЛОЖЕНИЯ

   Структура — по HWPO, содержимое — сущности кабинета тренера из
   ../assets/data.js: тренер, клиент, план дня, блоки с типом и
   форматом комплекса, упражнения со схемой и рабочим весом из %,
   суперсеты, связки, блоки текстом, заметки тренера, техника.
   Клиент процентов не видит — только килограммы (CON-16).

   Демо-клиент — Артём (c1), его программа p1. Состояние клиента
   (номер, анкета, отметки и заметки) — в localStorage
   «trenergram.client»; правки тренера приходят из «trenergram.state».

   Файл грузится до app.js: здесь только описания экранов, вызываются
   они роутером. Помощники роутера (clEsc, clGo, CL_ICON) к этому
   моменту уже есть.
   ═══════════════════════════════════════════════════════════════ */

const CL_ME = 'c1';

const CL_SVG = {
  phone: '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"/>',
  user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
  home: '<path d="M3 10.5 12 3l9 7.5V20a1 1 0 0 1-1 1h-5v-6h-6v6H4a1 1 0 0 1-1-1z"/>',
  cal: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
  left: '<path d="M15 5l-7 7 7 7"/>',
  right: '<path d="M9 5l7 7-7 7"/>',
  down: '<path d="M6 9l6 6 6-6"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5"/>',
  ruler: '<path d="M8 3v18M8 7h4M8 11h3M8 15h4M8 19h3"/>',
  scale: '<rect x="3" y="4" width="18" height="16" rx="3"/><path d="M8.5 9.5a5 5 0 0 1 7 0L13 12"/>',
  msg: '<path d="M20 12a8 8 0 0 1-11.6 7.1L4 20l1-4.2A8 8 0 1 1 20 12z"/>',
  play: '<path d="M8 5v14l11-7z"/>',
  trophy: '<path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M7 6H4.5a1.5 1.5 0 0 0 0 3H7M17 6h2.5a1.5 1.5 0 0 1 0 3H17"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
  video: '<rect x="3" y="5" width="18" height="14" rx="3"/><path d="M10.5 9.5v5l4-2.5z"/>',
  pen: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
  x: '<path d="M6 6l12 12M18 6L6 18"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  camera: '<path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/>',
  send: '<path d="M21 3 10.5 13.5"/><path d="M21 3l-6.5 18-4-7.5L3 9.5z"/>',
  gear: '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
  link: '<path d="M10 13a5 5 0 0 0 7.5.5l3-3a5 5 0 0 0-7-7l-1.7 1.7"/><path d="M14 11a5 5 0 0 0-7.5-.5l-3 3a5 5 0 0 0 7 7l1.7-1.7"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>'
};
/* Отдых — та же иконка, что в календаре кабинета тренера (из брифа) */
const CL_REST_ICON = '<img class="resti" src="../assets/icons/rest.png" alt="">';
const clI = (n, cls) => `<svg class="i${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true">${CL_SVG[n]}</svg>`;

/* ── состояние клиента ── */
const clS = (() => {
  const def = { phone: '', prof: {}, goal: '', goal2: '', done: {}, notes: {}, sent: {}, dayDone: {}, open: {}, hideTasks: false, read: {}, meas: [], pmh: {}, photo: '', set: {} };
  try { return Object.assign(def, JSON.parse(localStorage.getItem('trenergram.client') || '{}')); } catch (e) { return def; }
})();
const clSave = () => { try { localStorage.setItem('trenergram.client', JSON.stringify(clS)); } catch (e) {} };

/* ── тема: как в системе, светлая или тёмная (P1 «Настройки») ── */
const CL_THEMES = [['system', 'Как в системе'], ['light', 'Светлая'], ['dark', 'Тёмная']];
const clMqDark = matchMedia('(prefers-color-scheme: dark)');
const clDark = () => { const t = clS.set.theme || 'system'; return t === 'dark' || (t === 'system' && clMqDark.matches); };
/* Фон экрана для полос браузера: Safari и Chrome красят их в цвет страницы */
const clPageColor = () => clDark() ? '#121110' : '#F7F3EF';
function clApplyTheme() {
  document.documentElement.dataset.theme = clDark() ? 'dark' : 'light';
  const m = document.querySelector('meta[name=theme-color]');
  if (m && m.content !== '#FC5200') m.content = clPageColor();
}
clApplyTheme();
clMqDark.addEventListener('change', () => { if ((clS.set.theme || 'system') === 'system') clApplyTheme(); });

/* Выбранный на главной день; тренировка открывается на нём */
let clDate = TODAY;
/* Полоса недели на экране тренировки — выезжает по иконке календаря */
let clCalOpen = false;

/* ── день клиента из плана тренера ──
   Клиент видит только опубликованное: у черновика — прошлый слепок (pub),
   а если тренер ещё ни разу не публиковал день — его нет. */
/* План собирается долго (весь контейнер дней) — держим его в памяти, пока
   идёт одна отрисовка: месяц в календаре — это 30 дней подряд */
let clPlanMemo = null;
const clPlan = pid => { if (!clPlanMemo) { clPlanMemo = buildPlan(pid); setTimeout(() => { clPlanMemo = null; }, 0); } return clPlanMemo; };
function clDayAt(date) {
  const c = client(CL_ME), p = program(c.prog);
  const i = daysBetween(p.start, date);
  const x = i >= 0 ? clPlan(c.prog)[i] : null;
  const base = { date, title: 'Отдых', rest: true, comp: false, blocks: [] };
  if (!x) return base;
  let title = x.title, blocks = x.blocks, comp = x.comp;
  if (x.draft) {
    if (!x.pub) return base;
    const r = JSON.parse(x.pub);
    title = r.t; comp = !!r.c; blocks = restoreBlocks(r);
  }
  blocks = (blocks || []).filter(blockHas);
  return { date, title: blocks.length ? title : (comp ? title : 'Отдых'), rest: !blocks.length && !comp, comp, blocks };
}
const clDayKey = date => CL_ME + '@' + date;
const WD_FULL = ['понедельник', 'вторник', 'среда', 'четверг', 'пятница', 'суббота', 'воскресенье'];
const clDateLong = date => { const d = D(date); return WD_FULL[dowMon(date)] + ', ' + d.getDate() + ' ' + MONTHS[d.getMonth()]; };
const clBlockName = b => b.title || blockTypeLabel(b) || (isTextBlock(b) ? firstTextLine(b.text) : 'Блок');

/* ── строки упражнения — как у HWPO, одна строка на упражнение ──
   «3×5 Становая тяга 132,5 кг»: схема впереди, нагрузка после названия, без
   разделителей. Проценты клиенту не показываем — только рабочий вес.
   Упражнение из базы и строка, набранная текстом, выглядят одинаково. */
function clLoad(it, pm) {
  if (it.pct != null) { const kg = kgText(it, pm); return kg ? kg + '\u00a0кг' : ''; }
  return it.val ? loadText(it) : '';
}
function clPart(it, pm) {
  const e = it.exId ? byId(it.exId) : null;
  const name = e ? e.ru : (it.raw || '');
  if (!e) return clEsc(name);                         /* строка текстом — как написана */
  if (it.txt) return clEsc(name + ' — ' + it.txt);    /* пояснение вместо нагрузки */
  const load = clLoad(it, pm);
  return clEsc([it.scheme, name, load].filter(Boolean).join(' '));
}
/* Связка — один подход из нескольких упражнений, вес один на всю связку:
   «Взятие на грудь + Фронтальный присед + Толчок: 90 кг — 3×(1+1+1)». Строка
   переносится, где придётся, но вес с подходами не разрываются. */
function clChain(it, pm) {
  const prm = [clLoad(it, pm), chainScheme(it)].filter(Boolean).join(' — ');
  return clEsc(chainNames(it) + (prm ? ':' : '')) + (prm ? ' <span class="nw">' + clEsc(prm) + '</span>' : '');
}
const clLine = (it, pm) => `<div class="xl">${it.chain ? clChain(it, pm) : clPart(it, pm)}</div>`;

/* Содержимое блока по группам, разделитель — только между группами:
   формат комплекса, подряд идущие упражнения, суперсет («5 кругов:» …
   «Отдых 90 сек между кругами»), блок текстом */
function clBlockBody(b, pm) {
  const seg = [];
  const fmt = b.fmt && typeof b.fmt === 'object' ? b.fmt : null;
  if (fmt) seg.push(`<div class="xl">${clEsc(fmtLabel(fmt) + ' — ' + fmtDesc(fmt))}</div>`);
  if (isTextBlock(b)) { seg.push(textLines(b.text).map(l => `<div class="xl">${clEsc(l)}</div>`).join('')); return seg; }
  let run = '', k = 0;
  const its = b.items;
  const flush = () => { if (run) { seg.push(run); run = ''; } };
  while (k < its.length) {
    if (its[k].ss) {
      const h = its[k], j = ssEnd(its, k), mem = its.slice(k + 1, j).filter(itemHas);
      if (mem.length) {
        flush();
        seg.push(`<div class="xl">${h.rounds} ${plural3(+h.rounds, 'круг', 'круга', 'кругов')}:</div>` +
          mem.map(x => clLine(x, pm)).join('') +
          (h.rest ? `<div class="xl">Отдых ${clEsc(h.rest)} между кругами</div>` : ''));
      }
      k = j; continue;
    }
    if (itemHas(its[k])) run += clLine(its[k], pm);
    k++;
  }
  flush();
  return seg;
}
/* Ключи 1ПМ упражнений блока — для вкладки «Рекорд»: только те, от чьего
   максимума считается вес (штанга, гантели), без повторов */
const clBlockPm = b => [...new Set(clBlockEx(b).map(pmKey).filter(Boolean))];
/* Упражнения блока с карточкой в базе — для «Техники» */
const clBlockEx = b => {
  const out = [];
  (b.items || []).forEach(it => (it.chain ? it.parts || [] : [it]).forEach(p => {
    const e = p.exId && byId(p.exId);
    if (e && !out.includes(e)) out.push(e);
  }));
  return out;
};

/* ── общие куски ── */
const clTabs = on => { const n = on === 'feed' ? 0 : clEvents().filter(e => !clS.read[e.k]).length;
  return `<nav class="tabs">
  <button class="${on === 'home' ? 'on' : ''}" data-go="home">${clI('home')}<span>Главная</span></button>
  <button class="${on === 'feed' ? 'on' : ''}" data-go="feed"><i class="tbi">${clI('bell')}${n ? `<b class="badge">${n}</b>` : ''}</i><span>Лента</span></button>
  <button class="${on === 'profile' ? 'on' : ''}" data-go="profile">${clI('user')}<span>Профиль</span></button>
</nav>`; };
const clDots = (n, at) => `<div class="dots">${Array.from({ length: n }, (_, i) => `<i class="${i === at ? 'on' : ''}"></i>`).join('')}</div>`;
const clHead = (title, sub) => `<h1 class="h1">${clEsc(title)}</h1><i class="tbar"></i>${sub ? `<p class="hsub">${clEsc(sub)}</p>` : ''}`;
const clPhoneFmt = d => { d = d.slice(0, 10); return [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)].filter(Boolean)
  .reduce((s, x, i) => s + (i === 0 ? x : i === 1 ? ' ' + x : '-' + x), ''); };
const clAge = iso => { if (!iso) return ''; const b = D(iso), t = D(TODAY); let a = t.getFullYear() - b.getFullYear();
  if (t.getMonth() < b.getMonth() || (t.getMonth() === b.getMonth() && t.getDate() < b.getDate())) a--;
  return a > 0 && a < 120 ? a + ' ' + plural3(a, 'год', 'года', 'лет') : ''; };

const CL_LEVELS = ['Новичок', 'Есть опыт', 'Продвинутый', 'Спортсмен'];
const CL_GOALS = ['Похудеть', 'Набрать мышечную массу', 'Стать сильнее', 'Выносливость', 'Здоровье и самочувствие', 'Подготовка к соревнованиям'];

/* ═══════════ отрисовка ═══════════ */
const CL_UI = {
  /* R1. Вход по номеру — единый для новых и существующих */
  phone(sc, v) {
    const inv = v === 'invite' ? `<div class="invc">
        <div class="av">${clEsc(TRAINER.ini)}</div>
        <div><em>Приглашение тренера</em><b>${clEsc(TRAINER.n)}</b><s>приглашает вас тренироваться · ${clEsc(TRAINER.workspace)}</s></div>
      </div>`
      /* Ссылка живёт 7 дней (REG-1): после — только просьба запросить новую */
      : v === 'expired' ? `<div class="invc exp" role="alert">
        <div class="av">${clI('link')}</div>
        <div><b>Ссылка устарела</b><s>Пожалуйста, запросите новую ссылку у тренера</s></div>
      </div>` : '';
    return `<div class="pg auth">
      ${inv}
      ${clHead('Вход', 'Введите номер телефона — пришлём код')}
      <div class="card fcard">
        <label class="lbl" for="tel">Номер телефона</label>
        <div class="fld">${clI('phone')}<span class="pre">+7</span>
          <input id="tel" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="900 000-00-00" value="${clEsc(clPhoneFmt(clS.phone))}"></div>
        <button class="btn pri" id="getcode" disabled>Получить код</button>
        <p class="legal">Продолжая, вы соглашаетесь с условиями сервиса и обработкой персональных данных</p>
      </div>
    </div>`;
  },

  /* R2. Код из СМС — приходит и новому, и существующему */
  code() {
    return `<header class="top"><button class="ib" data-back aria-label="Назад">${CL_ICON.back}</button><div class="t"></div><span class="ib ghost"></span></header>
    <div class="pg auth">
      ${clHead('Код из СМС', 'Отправили на +7 ' + (clPhoneFmt(clS.phone) || '900 000-00-00'))}
      <label class="otp" for="otp">
        <input id="otp" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="4" aria-label="Код из СМС">
        <span></span><span></span><span></span><span></span>
      </label>
      <p class="resend" id="resend"></p>
      <button class="lnk" data-back>Изменить номер</button>
    </div>`;
  },

  /* W1. Создание аккаунта · данные — одна карточка строк, как форма HWPO
     и настройки iOS: подпись слева, значение справа, всё в столбик и на
     одном экране */
  'wiz-data'() {
    const p = clS.prof;
    const opt = (val, label) => `<button type="button" class="opt${p.sex === val ? ' on' : ''}" data-f="sex" data-val="${val}">${label}</button>`;
    return `<header class="top">${clDots(2, 0)}</header>
    <div class="pg form">
      ${clHead('Ваши данные')}
      <div class="glist">
        <div class="gr"><label for="f-last">Фамилия</label><input id="f-last" data-f="last" autocomplete="family-name" value="${clEsc(p.last || '')}"></div>
        <div class="gr"><label for="f-first">Имя</label><input id="f-first" data-f="first" autocomplete="given-name" value="${clEsc(p.first || '')}"></div>
        <div class="gr"><label>Пол</label><div class="seg2">${opt('м', 'Мужской')}${opt('ж', 'Женский')}</div></div>
        <div class="gr"><label for="f-born">Дата рождения</label><input id="f-born" type="date" data-f="born" max="${TODAY}" value="${clEsc(p.born || '')}"><span class="unit" id="age">${clEsc(clAge(p.born))}</span></div>
        <div class="gr"><label for="f-h">Рост</label><input id="f-h" inputmode="decimal" data-f="h" value="${clEsc(p.h || '')}" placeholder="по желанию"><span class="unit">см</span></div>
        <div class="gr"><label for="f-w">Вес</label><input id="f-w" inputmode="decimal" data-f="w" value="${clEsc(p.w || '')}" placeholder="по желанию"><span class="unit">кг</span></div>
        <div class="gr"><label for="f-lvl">Уровень</label>
          <select id="f-lvl" data-f="level" class="${p.level ? '' : 'ph'}"><option value=""${p.level ? '' : ' selected'} disabled>Выберите</option>
            ${CL_LEVELS.map(l => `<option${p.level === l ? ' selected' : ''}>${clEsc(l)}</option>`).join('')}</select>${clI('down')}</div>
      </div>
    </div>
    <div class="foot"><button class="btn pri" id="next" data-go="@next" disabled>Дальше</button></div>`;
  },

  /* W2. Создание аккаунта · цели — та же карточка строк: основная цель
     выпадающим списком, дополнительная — текстом */
  'wiz-goals'() {
    return `<header class="top"><button class="ib" data-back aria-label="Назад">${CL_ICON.back}</button>${clDots(2, 1)}<span class="ib ghost"></span></header>
    <div class="pg form">
      ${clHead('Ваша цель')}
      <label class="lbl gcap" for="f-goal">Основная цель</label>
      <div class="glist sel">
        <div class="gr">
          <select id="f-goal" class="${clS.goal ? '' : 'ph'}"><option value=""${clS.goal ? '' : ' selected'} disabled>Выберите цель</option>
            ${CL_GOALS.map(g => `<option${clS.goal === g ? ' selected' : ''}>${clEsc(g)}</option>`).join('')}</select>${clI('down')}</div>
      </div>
      <label class="lbl gcap" for="goal2">Дополнительная цель <em>по желанию</em></label>
      <div class="glist">
        <div class="gr col"><textarea id="goal2" rows="3" placeholder="Например: подтянуться 10 раз к лету">${clEsc(clS.goal2)}</textarea></div>
      </div>
    </div>
    <div class="foot"><button class="btn pri" id="done" data-go="@next" disabled>Готово</button></div>`;
  },

  /* H0. Главная: неделя, первые шаги, тренировка дня */
  home() {
    const sel = clDate, mon = addDays(sel, -dowMon(sel));
    const d = D(sel);
    const week = Array.from({ length: 7 }, (_, k) => {
      const date = addDays(mon, k), x = clDayAt(date);
      return `<button class="wd${date === sel ? ' on' : ''}${date === TODAY ? ' today' : ''}" data-date="${date}">
        <s>${RU[k]}</s><b>${D(date).getDate()}</b><i class="${x.rest ? '' : x.comp ? 'comp' : 'has'}"></i></button>`;
    }).join('');
    /* Первые шаги — как «Getting started» у HWPO, задачи — из нашего продукта */
    const pm = pmOf(CL_ME);
    const tasks = [
      ['Заполнить профиль', true, '', ''],
      ['Указать рекорды', Object.keys(pm).length > 0, 'Указать', 'profile'],
      ['Выполнить первую тренировку', Object.keys(clS.dayDone).length > 0, 'Начать', 'workout']
    ];
    const nDone = tasks.filter(t => t[1]).length;
    const steps = nDone < tasks.length ? `<section class="card steps">
      <button class="sth" id="hidetasks" aria-expanded="${!clS.hideTasks}"><b>Первые шаги</b>${clI('down', clS.hideTasks ? '' : 'up')}<span>${nDone} / ${tasks.length}</span></button>
      <div class="prog"><i style="width:${nDone / tasks.length * 100}%"></i></div>
      ${clS.hideTasks ? '' : `<div class="tasks">${tasks.map(([t, ok, act, to]) => `<div class="task${ok ? ' ok' : ''}">
        <i class="ck">${ok ? clI('check') : ''}</i><span>${clEsc(t)}</span>
        ${!ok && act ? `<button class="go" data-go="${to}">${clEsc(act)} ${CL_ICON.next}</button>` : ''}</div>`).join('')}</div>`}
    </section>` : '';
    return `<header class="hhead">
      <div class="wmk">Тренерграм</div>
      <button class="mon" data-mcal aria-label="Выбрать дату">${MONTHS_N[d.getMonth()]} ${d.getFullYear()} ${clI('cal')}</button>
    </header>
    <div class="pg home">
      <section class="card week">
        <button class="ib sm" data-week="-7" aria-label="Прошлая неделя">${clI('left')}</button>
        <div class="wds">${week}</div>
        <button class="ib sm" data-week="7" aria-label="Следующая неделя">${clI('right')}</button>
      </section>
      ${steps}
      ${clDayCard(clDayAt(sel))}
    </div>
    ${clTabs('home')}`;
  },

  /* T1. Тренировка дня */
  workout(sc, v) {
    const x = clDayAt(clDate), pm = pmOf(CL_ME), key = clDayKey(clDate);
    const msg = dayMsg(CL_ME, clDate);
    const doneAll = !!clS.dayDone[key];
    const blocks = x.blocks.map((b, i) => {
      const bk = key + '#' + i, done = !!(clS.done[bk] || doneAll);
      const open = clS.open[bk] !== false;
      const exs = clBlockEx(b);
      /* Обсуждение блока — переписка тренера и клиента: первым сообщением
         заметка тренера к блоку, дальше сообщения клиента, внизу поле ввода */
      const thread = (b.note ? `<div class="msgt"><span class="av">${clEsc(TRAINER.ini)}</span>
            <div class="bub"><s>${clEsc(TRAINER.n)}</s><p>${clEsc(b.note)}</p></div></div>` : '') +
        (clS.sent[bk] || []).map(m => `<div class="msgc"><div class="bub"><p>${clEsc(m.tx)}</p><s>${clEsc(m.at)}</s></div></div>`).join('');
      const rows = [
        ['chat', 'Обсуждение', 'msg', `${thread ? `<div class="thr">${thread}</div>` : ''}
          <div class="rin"><textarea class="inp ta" data-note="${bk}" rows="2" placeholder="Веса, повторы, время, вопрос тренеру…">${clEsc(clS.notes[bk] || '')}</textarea>
            <button class="snd" data-send="${bk}" aria-label="Отправить тренеру"${(clS.notes[bk] || '').trim() ? '' : ' disabled'}>${clI('send')}</button></div>`],
        exs.length ? ['tech', 'Техника', 'video', `<div class="demos">${exs.map(e => `<button class="demo" data-ex="${e.id}">
            <span class="th">${e.img ? `<img src="../${clEsc(e.img)}" alt="" loading="lazy">` : `<em>${clEsc(e.ru.slice(0, 1))}</em>`}<i>${clI('play')}</i></span>
            <span class="dn">${clEsc(e.ru)}</span></button>`).join('')}</div>`] : null,
        /* Рекорд — прямо в тренировке: в профиль за этим никто не пойдёт.
           Только упражнения, от 1ПМ которых считается вес; новый 1ПМ сразу
           пересчитывает веса этой и следующих тренировок. */
        clBlockPm(b).length ? ['rec', 'Рекорд', 'trophy', clBlockPm(b).map(k => `<div class="recr">
            <span><b>${clEsc(clPmName(k))}</b><s>${pm[k] ? '1ПМ сейчас ' + clNum(pm[k]) + '\u00a0кг' : '1ПМ ещё нет'}</s></span>
            <label class="recin"><input inputmode="decimal" data-pmin="${k}" placeholder="${pm[k] ? clNum(pm[k]) : '1ПМ'}" aria-label="Новый 1ПМ, ${clEsc(clPmName(k))}"><i>кг</i></label>
            <button class="snd recok" data-pmset="${k}" aria-label="Записать рекорд" disabled>${clI('check')}</button></div>`).join('')] : null
      ].filter(Boolean);
      const tab = rows.some(r => r[0] === clS.open[bk + ':tab']) ? clS.open[bk + ':tab'] : '';
      /* Точка — в обсуждении есть сообщение тренера, а клиент его ещё не открывал */
      const has = { chat: !!b.note && !clS.open[bk + ':seen'] };
      return `<section class="blk${done ? ' done' : ''}">
        <div class="bh">
          <button class="bt" data-bopen="${bk}" aria-expanded="${open}"><b>${clEsc(clBlockName(b))}</b>${clI('down', open ? 'up' : '')}</button>
          <button class="ring${done ? ' on' : ''}" data-bdone="${bk}" aria-label="${done ? 'Снять отметку' : 'Отметить блок выполненным'}">${done ? clI('check') : ''}</button>
        </div>
        ${open ? `<div class="card bcard">
          <div class="segs">${clBlockBody(b, pm).map(h => `<div class="seg">${h}</div>`).join('')}</div>
          <div class="sect" style="grid-template-columns:repeat(${rows.length},1fr)">${rows.map(([id, t, ic]) =>
            `<button class="${tab === id ? 'on' : ''}" data-tab="${bk}:${id}" aria-expanded="${tab === id}"><span class="sic">${clI(ic)}${has[id] ? '<i class="dot" aria-label="новое"></i>' : ''}</span><span>${t}</span></button>`).join('')}</div>
          ${tab ? `<div class="rb">${rows.find(r => r[0] === tab)[3]}</div>` : ''}
        </div>` : ''}
      </section>`;
    }).join('');
    const mon = addDays(clDate, -dowMon(clDate));
    const cal = clCalOpen ? `<div class="card wcal">
        <button class="ib sm" data-week="-7" aria-label="Прошлая неделя">${clI('left')}</button>
        <div class="wcd">${Array.from({ length: 7 }, (_, k) => { const date = addDays(mon, k);
          return `<button class="${date === clDate ? 'on' : ''}" data-date="${date}"><s>${RU[k]}</s><b>${D(date).getDate()}</b><i></i></button>`; }).join('')}</div>
        <button class="ib sm" data-week="7" aria-label="Следующая неделя">${clI('right')}</button>
      </div>` : '';
    const head = `<header class="top"><button class="ib" data-back aria-label="Назад">${CL_ICON.back}</button><div class="t caps">${clEsc(x.title)}</div>
      <button class="ib acc${clCalOpen ? ' on' : ''}" data-cal aria-label="Календарь" aria-expanded="${clCalOpen}">${clI('cal')}</button></header>`;
    const dl = D(clDate), dateTx = dl.getDate() + ' ' + MONTHS[dl.getMonth()] + ' ' + dl.getFullYear();
    if (!x.blocks.length) return head + `<div class="pg wk">${cal}<p class="wdate">${clEsc(dateTx)}</p>
      <div class="card empty">${x.comp ? clI('trophy') : CL_REST_ICON}<b>${x.comp ? clEsc(x.title) : 'День отдыха'}</b>
      <span>${x.comp ? 'Соревнование — тренер не расписывал тренировку' : 'Тренировки нет — восстанавливайтесь'}</span></div></div>${clTabs('home')}`;
    return head + `<div class="pg wk">${cal}
      <p class="wdate">${clEsc(dateTx)}</p>
      ${msg ? (() => { /* развёрнуто по умолчанию; свернул — запоминаем */ const on = clS.open[key + ':msg'] !== false;
        return `<div class="card vrow${on ? ' on' : ''}"><button class="vh" data-msg="${key}" aria-expanded="${on}">${clI(on ? 'down' : 'right')}<span>Сообщение тренера</span></button>
        ${on ? `<div class="vb"><p>${clEsc(msg)}</p></div>` : ''}</div>`; })() : ''}
      ${blocks}
      <button class="cday${doneAll ? ' ok' : ''}" id="dayDone">${doneAll ? clI('check') + 'Тренировка завершена' : 'Завершить тренировку'}</button>
    </div>${clTabs('home')}`;
  }
};

/* Карточка тренировки дня на главной — вместо курсов HWPO */
function clDayCard(x) {
  const key = clDayKey(x.date), done = !!clS.dayDone[key];
  const when = x.date === TODAY ? 'Сегодня' : clDateLong(x.date);
  if (x.rest) return `<section class="card dcard rest">${CL_REST_ICON}<div><s>${clEsc(when)}</s><b>Отдых</b><span>Тренировки нет — восстанавливайтесь</span></div></section>`;
  if (!x.blocks.length) return `<button class="card dcard rest" data-go="workout">${clI('trophy')}<div><s>${clEsc(when)}</s><b>${clEsc(x.title)}</b><span>Соревнование</span></div></button>`;
  const n = x.blocks.reduce((a, b) => a + blockCount(b), 0);
  return `<button class="dcard hero${done ? ' done' : ''}" data-go="workout">
    <i class="cut"></i>
    <s>${clEsc(when)}${done ? ' · выполнено' : ''}</s>
    <b>${clEsc(x.title)}</b>
    <span>${x.blocks.length} ${plural3(x.blocks.length, 'блок', 'блока', 'блоков')} · ${n} ${plural3(n, 'упражнение', 'упражнения', 'упражнений')}</span>
    <ol>${x.blocks.map(b => `<li>${clEsc(clBlockName(b))}${b.title && b.fmt && typeof b.fmt === 'object' ? ' · ' + clEsc(fmtLabel(b.fmt)) : ''}</li>`).join('')}</ol>
    <em>${done ? clI('check') + 'Выполнено' : 'Открыть тренировку'} ${CL_ICON.next}</em>
  </button>`;
}

/* ═══════════ поведение ═══════════ */
const CL_UI_MOUNT = {
  phone(scr) {
    const inp = scr.querySelector('#tel'), btn = scr.querySelector('#getcode');
    const sync = () => {
      const d = inp.value.replace(/\D/g, '').replace(/^[78](?=\d{10})/, '').slice(0, 10);
      inp.value = clPhoneFmt(d); clS.phone = d; btn.disabled = d.length < 10;
    };
    inp.addEventListener('input', sync); sync();
    btn.addEventListener('click', () => { clSave(); clGo('code'); });
  },

  code(scr) {
    const inp = scr.querySelector('#otp'), cells = [...scr.querySelectorAll('.otp span')];
    const draw = () => cells.forEach((c, i) => { c.textContent = inp.value[i] || ''; c.classList.toggle('cur', i === inp.value.length); });
    inp.addEventListener('input', () => {
      inp.value = inp.value.replace(/\D/g, '').slice(0, 4); draw();
      /* В прототипе подходит любой код. Новый номер — анкета, есть в базе — главная */
      if (inp.value.length === 4) setTimeout(() => clGo(clNext('code', clP)), 350);
    });
    draw();
    const r = scr.querySelector('#resend');
    let t = 59;
    const tick = () => { r.innerHTML = t > 0 ? `Отправить ещё раз через 0:${String(t).padStart(2, '0')}` : '<button class="lnk">Отправить код ещё раз</button>'; };
    tick();
    const iv = setInterval(() => { t--; tick(); if (t <= 0) clearInterval(iv); }, 1000);
    r.addEventListener('click', e => { if (e.target.closest('button')) { t = 59; tick(); } });
    return () => clearInterval(iv);
  },

  'wiz-data'(scr) {
    const p = clS.prof, btn = scr.querySelector('#next');
    const check = () => { btn.disabled = !(p.last && p.first && p.sex && p.born && p.level); };
    scr.addEventListener('input', e => {
      const f = e.target.dataset.f; if (!f) return;
      p[f] = e.target.value.trim();
      if (f === 'born') scr.querySelector('#age').textContent = clAge(p.born);
      if (f === 'level') e.target.classList.toggle('ph', !p.level);
      clSave(); check();
    });
    scr.addEventListener('click', e => {
      const o = e.target.closest('.opt'); if (!o) return;
      p[o.dataset.f] = o.dataset.val;
      scr.querySelectorAll(`.opt[data-f="${o.dataset.f}"]`).forEach(x => x.classList.toggle('on', x === o));
      clSave(); check();
    });
    check();
  },

  'wiz-goals'(scr) {
    const btn = scr.querySelector('#done'), sel = scr.querySelector('#f-goal');
    const check = () => { btn.disabled = !clS.goal; };
    sel.addEventListener('input', () => { clS.goal = sel.value; sel.classList.toggle('ph', !clS.goal); clSave(); check(); });
    scr.querySelector('#goal2').addEventListener('input', e => { clS.goal2 = e.target.value; clSave(); });
    check();
  },

  home(scr) {
    scr.addEventListener('click', e => {
      const d = e.target.closest('[data-date]');
      if (d) { clDate = d.dataset.date; clRepaint(scr, 'home'); return; }
      const w = e.target.closest('[data-week]');
      if (w) { clDate = addDays(clDate, +w.dataset.week); clRepaint(scr, 'home'); return; }
      if (e.target.closest('#hidetasks')) { clS.hideTasks = !clS.hideTasks; clSave(); clRepaint(scr, 'home'); }
      if (e.target.closest('[data-mcal]')) clMonthCal(date => { clDate = date; clRepaint(scr, 'home'); });
    });
  },

  workout(scr) {
    const key = clDayKey(clDate);
    scr.addEventListener('click', e => {
      const t = e.target.closest('[data-bdone]');
      if (t) { const k = t.dataset.bdone; clS.done[k] = !clS.done[k]; if (!clS.done[k]) delete clS.dayDone[key]; clSave(); clRepaint(scr, 'workout'); return; }
      const o = e.target.closest('[data-bopen]');
      if (o) { const k = o.dataset.bopen; clS.open[k] = clS.open[k] === false; clSave(); clRepaint(scr, 'workout'); return; }
      if (e.target.closest('[data-cal]')) { clCalOpen = !clCalOpen; clRepaint(scr, 'workout'); return; }
      const dd = e.target.closest('[data-date]');
      if (dd) { clDate = dd.dataset.date; clRepaint(scr, 'workout'); scr.scrollTop = 0; return; }
      const wk = e.target.closest('[data-week]');
      if (wk) { clDate = addDays(clDate, +wk.dataset.week); clRepaint(scr, 'workout'); scr.scrollTop = 0; return; }
      const sd = e.target.closest('[data-send]');
      if (sd) { const k = sd.dataset.send, tx = (clS.notes[k] || '').trim(); if (!tx) return;
        const n = new Date(); (clS.sent[k] ||= []).push({ tx, at: String(n.getHours()).padStart(2, '0') + ':' + String(n.getMinutes()).padStart(2, '0') });
        clS.notes[k] = ''; clSave(); clRepaint(scr, 'workout'); return; }
      const mg = e.target.closest('[data-msg]');
      if (mg) { const k = mg.dataset.msg + ':msg'; clS.open[k] = clS.open[k] === false; clSave(); clRepaint(scr, 'workout'); return; }
      const tb = e.target.closest('[data-tab]');
      if (tb) { const [b, id] = tb.dataset.tab.split(':'); const k = b + ':tab'; clS.open[k] = clS.open[k] === id ? '' : id;
        if (id === 'chat') clS.open[b + ':seen'] = true;
        clSave(); clRepaint(scr, 'workout'); return; }
      const r = e.target.closest('[data-row]');
      if (r) { const k = r.dataset.row; clS.open[k] = !clS.open[k]; clSave(); clRepaint(scr, 'workout'); return; }
      const x = e.target.closest('[data-ex]');
      if (x) { clTech(byId(x.dataset.ex)); return; }
      const ps = e.target.closest('[data-pmset]');
      if (ps) { const k = ps.dataset.pmset, inp = ps.parentElement.querySelector('[data-pmin]');
        const v = parseFloat(String(inp.value).replace(',', '.')); if (!(v > 0)) return;
        const pm = pmOf(CL_ME); pm[k] = v; (clS.pmh[k] ||= []).push([TODAY, v]);
        saveState(); clSave(); clRepaint(scr, 'workout'); clToast('Рекорд записан — веса пересчитаны'); return; }
      /* Завершить — просто отметка и назад на главную; снять отметку — на месте */
      if (e.target.closest('#dayDone')) {
        if (clS.dayDone[key]) { delete clS.dayDone[key]; clSave(); clRepaint(scr, 'workout'); return; }
        clS.dayDone[key] = true; clSave(); clToast('Тренировка завершена'); clGo('home'); }
    });
    /* Пока не отправлено — черновик; кнопка «Отправить» активна, когда есть текст */
    scr.addEventListener('input', e => {
      const n = e.target.dataset.note; if (n == null) return;
      clS.notes[n] = e.target.value; clSave();
      const b = e.target.parentElement.querySelector('[data-send]'); if (b) b.disabled = !e.target.value.trim();
    });
    scr.addEventListener('input', e => {
      if (e.target.dataset.pmin == null) return;
      const ok = parseFloat(String(e.target.value).replace(',', '.')) > 0;
      e.target.closest('.recr').querySelector('[data-pmset]').disabled = !ok;
    });
    scr.addEventListener('keydown', e => {
      if (e.key === 'Enter' && e.target.dataset.pmin != null) e.target.closest('.recr').querySelector('[data-pmset]').click();
    });
  }
};

/* Перерисовать экран на месте, без перехода и с сохранением прокрутки */
function clRepaint(scr, id) {
  const top = scr.scrollTop;
  scr.innerHTML = CL_UI[id](CL_SCREENS[id], clParse(location.hash).v, clP);
  scr.scrollTop = top;
}

/* Техника упражнения — лист снизу: демонстрация, акценты тренера и шаги из
   базы. Шаги — в exdb-steps.js; у своих упражнений тренера их нет. */
const clSteps = e => (typeof EXDB_STEPS !== 'undefined' && EXDB_STEPS[e.id]) || [];
function clTech(e) {
  if (!e) return;
  const w = document.createElement('div');
  w.className = 'shw';
  w.innerHTML = `<div class="shbg" data-x></div>
    <div class="sheet" role="dialog" aria-label="${clEsc(e.ru)}"><i class="grab"></i>
      ${e.gif ? `<img class="tgif" src="${clEsc(e.gif)}" alt="">` : `<div class="tgif none">${clI('play')}<span>Демонстрации пока нет</span></div>`}
      <h2>${clEsc(e.ru)}</h2>
      ${TECH[e.id] ? `<p>${clEsc(TECH[e.id])}</p>` : ''}
      ${clSteps(e).length ? `<ol class="tsteps">${clSteps(e).map(x => `<li>${clEsc(x)}</li>`).join('')}</ol>` : TECH[e.id] ? '' : '<p>Описание техники тренер ещё не добавил.</p>'}
      <div class="acts"><button class="btn sec" data-x>Понятно</button></div>
    </div>`;
  w.addEventListener('click', ev => { if (ev.target.closest('[data-x]')) { w.classList.add('out'); setTimeout(() => w.remove(), 220); } });
  document.getElementById('dev').appendChild(w);
}

/* ═══ Выбор даты — окно с месяцем, как «Select Date» у HWPO ═══
   Плитка дня, точка статуса в углу: запланирована (кольцо), выполнена
   (сплошная), пропущена (серая), отдых (тёмная). Неделя — с понедельника. */
const CL_DAYST = { plan: 'Запланирована', done: 'Выполнена', skip: 'Пропущена', rest: 'Отдых' };
function clDayStatus(date) {
  const x = clDayAt(date);
  if (x.rest) return 'rest';
  if (clS.dayDone[clDayKey(date)]) return 'done';
  return date < TODAY ? 'skip' : 'plan';
}
function clMonthCal(onPick) {
  let m = D(clDate); m.setDate(1);
  const w = document.createElement('div');
  w.className = 'calw';
  const draw = () => {
    const y = m.getFullYear(), mo = m.getMonth();
    const first = iso(new Date(y, mo, 1)), n = new Date(y, mo + 1, 0).getDate();
    const lead = dowMon(first);
    const cells = Array.from({ length: lead }, () => '<i></i>').join('') +
      Array.from({ length: n }, (_, k) => { const date = iso(new Date(y, mo, k + 1)), st = clDayStatus(date);
        return `<button class="${date === clDate ? 'on' : ''}${date === TODAY ? ' today' : ''}" data-d="${date}" aria-label="${k + 1} ${MONTHS[mo]}, ${CL_DAYST[st].toLowerCase()}">
          <span>${k + 1}</span><i class="${st}"></i></button>`; }).join('');
    w.innerHTML = `<div class="calbg" data-x></div>
      <div class="cal" role="dialog" aria-label="Выберите дату">
        <div class="calh"><b>Выберите дату</b><button class="calx" data-x aria-label="Закрыть">${clI('x')}</button></div>
        <div class="calm"><button class="caln" data-m="-1" aria-label="Прошлый месяц">${clI('left')}</button>
          <div><b>${MONTHS_N[mo]}</b><s>${y}</s></div>
          <button class="caln" data-m="1" aria-label="Следующий месяц">${clI('right')}</button></div>
        <div class="calwd">${RU.map(d => `<span>${d}</span>`).join('')}</div>
        <div class="calg">${cells}</div>
        <div class="call">${Object.entries(CL_DAYST).map(([k, t]) => `<span><i class="${k}"></i>${t}</span>`).join('')}</div>
        <div class="calb"><button class="btn sec" data-today>Сегодня</button><button class="btn sec" data-x>Закрыть</button></div>
      </div>`;
  };
  const close = () => { w.classList.add('out'); setTimeout(() => w.remove(), 180); };
  w.addEventListener('click', e => {
    const mm = e.target.closest('[data-m]'); if (mm) { m.setMonth(m.getMonth() + +mm.dataset.m); draw(); return; }
    const d = e.target.closest('[data-d]'); if (d) { onPick(d.dataset.d); close(); return; }
    if (e.target.closest('[data-today]')) { onPick(TODAY); close(); return; }
    if (e.target.closest('[data-x]')) close();
  });
  draw();
  document.getElementById('dev').appendChild(w);
}

/* ═══ E0. Лента событий — уведомления клиента ═══
   Как лента тренера на дашборде: события по дням, у каждого тип и переход.
   Источники — данные кабинета: опубликованные тренировки, сообщения тренера
   к тренировке (COM-4), ответы на комментарии (COM-3), новый максимум (PRO-4).
   Момента публикации в данных нет — в демо новая тренировка приходит накануне. */
const CL_EVT = {
  plan:  { icon: 'cal',    tag: 'Новая тренировка' },
  msg:   { icon: 'msg',    tag: 'Сообщение тренера' },
  reply: { icon: 'msg',    tag: 'Ответ тренера' },
  pr:    { icon: 'trophy', tag: 'Новый максимум' }
};
function clEvents() {
  const c = client(CL_ME), ev = [];
  for (let k = -6; k <= 3; k++) {
    const date = addDays(TODAY, k), x = clDayAt(date);
    if (x.rest || !x.blocks.length) continue;
    const d = addDays(date, -1);
    if (d > TODAY) continue;
    ev.push({ k: 'plan@' + date, t: 'plan', d, date, go: 'workout', title: x.title, text: 'Тренировка на ' + clDateLong(date) + ' · ' + x.blocks.length + ' ' + plural3(x.blocks.length, 'блок', 'блока', 'блоков') });
  }
  Object.keys(TALK.workout).filter(k => k.startsWith(CL_ME + '@')).forEach(key => {
    const date = key.split('@')[1], m = (TALK.workout[key] || []).find(x => x.who === 'trainer');
    if (!m || !m.text) return;
    const tm = (String(m.at || '').match(/\d{1,2}:\d{2}/) || [''])[0];
    const d = /вчера/.test(m.at || '') ? addDays(date, -1) : date;
    if (d <= TODAY) ev.push({ k: 'msg@' + key, t: 'msg', d, time: tm, date, go: 'workout', title: TRAINER.n, text: m.text, quote: 'к тренировке на ' + clDateLong(date) });
  });
  (c.comments || []).filter(x => x.reply).forEach((x, i) => ev.push({ k: 'reply@' + x.d + i, t: 'reply', d: x.d, date: x.d, go: 'workout',
    title: TRAINER.n, text: x.reply, quote: 'Вы: «' + x.tx + '»' }));
  if (c.pr) {
    const e = byId(c.pr.ex), d = shiftDate(c.pr.at);
    if (d <= TODAY) ev.push({ k: 'pr@' + c.pr.ex + c.pr.v, t: 'pr', d, go: 'profile', title: (PMNAMES[c.pr.ex] || (e && e.ru) || '') + ' — ' + fmtNum(c.pr.v) + '\u00a0кг',
      text: 'Тренер записал новый максимум' + (c.pr.prev ? ', было ' + fmtNum(c.pr.prev) + '\u00a0кг' : '') + '. Рабочие веса в тренировках пересчитаны.' });
  }
  const ord = { msg: 0, reply: 1, pr: 2, plan: 3 };
  return ev.sort((a, b) => b.d.localeCompare(a.d) || ord[a.t] - ord[b.t]);
}
const clDayLabel = d => (d === TODAY ? 'Сегодня · ' : d === addDays(TODAY, -1) ? 'Вчера · ' : '') + D(d).getDate() + ' ' + MONTHS[D(d).getMonth()];

CL_UI.feed = () => {
  const ev = clEvents();
  let day = null, html = '';
  ev.forEach(e => {
    if (e.d !== day) { if (day) html += '</div>'; day = e.d; html += `<div class="evday">${clEsc(clDayLabel(e.d))}</div><div class="glist evs">`; }
    const m = CL_EVT[e.t];
    html += `<button class="ev${clS.read[e.k] ? '' : ' new'}" data-ev="${clEsc(e.k)}">
      <span class="evi t-${e.t}">${clI(m.icon)}</span>
      <span class="evc"><span class="evh"><s>${m.tag}</s><time>${clEsc(e.time || '')}</time></span>
        <b>${clEsc(e.title)}</b><span class="evt">${clEsc(e.text)}</span>${e.quote ? `<em>${clEsc(e.quote)}</em>` : ''}</span>
    </button>`;
  });
  if (day) html += '</div>';
  return `<header class="hhead"><div class="wmk">Лента</div></header>
    <div class="pg feed">${html || '<div class="card empty">' + clI('bell') + '<b>Тихо</b><span>Новых событий нет</span></div>'}</div>
    ${clTabs('feed')}`;
};
CL_UI_MOUNT.feed = scr => {
  const ev = clEvents();
  scr.addEventListener('click', e => {
    const b = e.target.closest('[data-ev]'); if (!b) return;
    const x = ev.find(v => v.k === b.dataset.ev); if (!x) return;
    if (x.date) clDate = x.date;
    clGo(x.go);
  });
  /* Открыл ленту — всё прочитано: точки уйдут при следующем входе */
  ev.forEach(x => { clS.read[x.k] = true; }); clSave();
};

/* ═══ P0. Профиль ═══
   По разделению карточки клиента в кабинете тренера: сверху общая
   информация, ниже табы. Рекорды (1ПМ и 3ПМ) и замеры клиент вносит сам —
   они те же, что видит тренер; от 1ПМ считается вес в тренировках.
   Рекорды и замеры — табы одного экрана, выбранный помним до ухода. */
const CL_MEAS = [['w', 'Вес', 'кг'], ['waist', 'Талия', 'см'], ['chest', 'Грудь', 'см'], ['hips', 'Бёдра', 'см'], ['fat', 'Жир', '%']];
let clPmSel = null, clMeasSel = 'w', clProfOn = 'pr';
const clMe = () => client(CL_ME);
const clShortDate = iso => { const d = D(iso); return d.getDate() + ' ' + MONTHS[d.getMonth()].slice(0, 3) + (d.getFullYear() !== D(TODAY).getFullYear() ? ' ' + d.getFullYear() : ''); };
const clFullDate = iso => { const d = D(iso); return d.getDate() + ' ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); };
const clNum = (v, dec) => v == null || v === '' ? '—' : fmtNum(dec ? Math.round(v * 10) / 10 : v);
/* Свои данные клиента — поверх карточки у тренера */
function clProf() {
  const c = clMe(), p = clS.prof, [first, last] = c.n.split(' ');
  return { first: p.first || first, last: p.last || last, sex: p.sex || c.sex, born: p.born || c.born, h: p.h || c.h,
    level: p.level || c.level, goal: clS.goal || 'Стать сильнее', goal2: clS.goal2 || '' };
}
/* Замеры: внесённые у тренера и свои, по дате */
const clMeasAll = () => [...(clMe().meas || []), ...clS.meas].sort((a, b) => a.date.localeCompare(b.date));
/* Рекорды: история 1ПМ — у тренера и свои записи */
const clPmName = k => PMNAMES[k] || (byId(k) || {}).ru || k;
const clPmHist = k => [...((clMe().hist || {})[k] || []), ...(clS.pmh[k] || [])].sort((a, b) => a[0].localeCompare(b[0]));
const clPm3 = () => ((STATE.pm3 ||= {})[CL_ME] ||= {});

/* График по датам: линия с заливкой, точки, сетка с подписями справа */
function clChart(series, unit, dec) {
  const W = 320, H = 150, L = 6, R = 42, T = 14, B = 24;
  const xs = series.map(s => D(s[0]).getTime()), ys = series.map(s => s[1]);
  /* Шкала — круглыми числами: шаг 1, 2, 2,5 или 5 нужного порядка, 2–4 деления */
  let lo = Math.min(...ys), hi = Math.max(...ys); if (hi === lo) { hi += 1; lo -= 1; }
  const raw = (hi - lo) / 2, mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(x => x >= raw);
  const ticks = []; for (let t = Math.floor(lo / step) * step; t <= hi + step * .999; t += step) ticks.push(Math.round(t * 100) / 100);
  lo = ticks[0]; hi = ticks[ticks.length - 1];
  const x0 = xs[0], x1 = xs[xs.length - 1];
  const X = t => L + (W - L - R) * (x1 === x0 ? .5 : (t - x0) / (x1 - x0)), Y = v => T + (H - T - B) * (1 - (v - lo) / (hi - lo));
  const pts = series.map((s, i) => [X(xs[i]), Y(s[1])]);
  const line = pts.map((p, i) => (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' ');
  const grid = ticks.map(v => { const y = Y(v);
    return `<line x1="${L}" x2="${W - R + 6}" y1="${y.toFixed(1)}" y2="${y.toFixed(1)}"/><text x="${W - R + 10}" y="${(y + 4).toFixed(1)}">${clNum(v)}</text>`; }).join('');
  const lab = series.length <= 6 ? series.map((s, i) => [i, s[0]]) : [[0, series[0][0]], [series.length - 1, series[series.length - 1][0]]];
  return `<svg class="chart" viewBox="0 0 ${W} ${H}" role="img" aria-label="График, ${clEsc(unit)}">
    <defs><linearGradient id="chg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FC5200" stop-opacity=".22"/><stop offset="1" stop-color="#FC5200" stop-opacity="0"/></linearGradient></defs>
    <g class="gd">${grid}</g>
    <path class="ar" d="${line} L${pts[pts.length - 1][0].toFixed(1)} ${H - B} L${pts[0][0].toFixed(1)} ${H - B} Z"/>
    <path class="ln" d="${line}"/>
    ${pts.map((p, i) => `<circle class="${i === pts.length - 1 ? 'last' : ''}" cx="${p[0].toFixed(1)}" cy="${p[1].toFixed(1)}" r="${i === pts.length - 1 ? 4.5 : 3.2}"/>`).join('')}
    <g class="xl2">${lab.map(([i, d]) => `<text x="${pts[i][0].toFixed(1)}" y="${H - 6}" text-anchor="${lab.length > 2 ? 'middle' : i ? 'end' : 'start'}">${clShortDate(d)}</text>`).join('')}</g>
  </svg>`;
}
/* Изменение со знаком: «+17,5 кг», «−1,2 см» */
const clDelta = (d, unit, dec) => !d ? '' : (d > 0 ? '+' : '−') + clNum(Math.abs(d), dec) + (unit === '%' ? ' %' : ' ' + unit);

/* Рекорды — список упражнений; тап раскрывает график прямо под строкой.
   Рост рекорда — зелёным, падение — красным: для 1ПМ больше всегда лучше. */
const clDltCls = d => d > 0 ? 'up' : d < 0 ? 'dn' : '';
/* Изменение к прошлому рекорду: последняя запись истории — это и есть
   текущий 1ПМ, сравниваем с предыдущей */
function clPmPrev(k) {
  const pm = pmOf(CL_ME), vs = clPmHist(k).map(e => e[1]);
  const i = vs.length && vs[vs.length - 1] === pm[k] ? vs.length - 2 : vs.length - 1;
  return i >= 0 ? pm[k] - vs[i] : 0;
}
function clPrHead(k) {
  const pm = pmOf(CL_ME), h = clPmHist(k), first = h[0], d = h.length > 1 ? pm[k] - first[1] : 0;
  const since = h.length > 1 && d ? `<span class="dlt ${clDltCls(d)}">${clDelta(d, 'кг')}</span> с ${clShortDate(first[0])}` : '';
  return { since, chart: h.length > 1 ? clChart(h, 'кг') : `<div class="nochart">История появится после второго рекорда</div>` };
}
function clPrTab() {
  const pm = pmOf(CL_ME), pm3 = clPm3(), keys = Object.keys(pm);
  if (!keys.length) return `<div class="card empty">${clI('trophy')}<b>Рекордов нет</b><span>Добавьте 1ПМ — от него тренер считает вес в тренировках</span></div>
    <button class="btn pri pbtn" data-addpm>${clI('plus')}Добавить рекорд</button>`;
  /* null — ещё не выбирали, '' — в списке всё свёрнуто */
  const def = keys.find(x => clPmHist(x).length > 1) || keys[0];
  if (clPmSel == null || (clPmSel && !keys.includes(clPmSel))) clPmSel = def;
  const k = clPmSel, foot = `<button class="btn pri pbtn" data-addpm>${clI('plus')}Новый рекорд</button>
    <p class="pnote">От 1ПМ тренер считает вес в тренировках: новый рекорд — новые веса. Тренер увидит изменение.</p>`;
  /* Под названием — дата и 3ПМ; под числом — изменение к прошлому рекорду, как в замерах */
  const sub = x => { const hx = clPmHist(x), lx = hx[hx.length - 1];
    return (lx ? 'обновлён ' + clShortDate(lx[0]) : 'без истории') + (pm3[x] != null ? ' · 3ПМ ' + clNum(pm3[x]) + '\u00a0кг' : ''); };
  const val = x => { const d = clPmPrev(x);
    return `<span class="pv">${clNum(pm[x])}<i>кг</i>${d ? `<s class="dlt ${clDltCls(d)}">${clDelta(d, 'кг')}</s>` : ''}</span>`; };
  /* Раскрыт один: тап по раскрытому — свернуть */
  return `<div class="card plist acc">${keys.map(x => { const on = x === k, hd = on ? clPrHead(x) : null;
      return `<button class="prow${on ? ' on' : ''}" data-pm="${x}" aria-expanded="${on}"><span><b>${clEsc(clPmName(x))}</b><s>${sub(x)}</s></span>${val(x)}${clI('down', 'chev')}</button>
        ${on ? `<div class="pexp">${hd.since ? `<div class="since l">${hd.since}</div>` : ''}${hd.chart}</div>` : ''}`; }).join('')}</div>` + foot;
}
function clMeasTab() {
  const rows = clMeasAll(), [k, name, unit] = CL_MEAS.find(m => m[0] === clMeasSel) || CL_MEAS[0];
  const dec = k === 'w' || k === 'fat';
  const ser = rows.filter(r => r[k] != null).map(r => [r.date, r[k]]);
  const chips = `<div class="mchips">${CL_MEAS.map(([x, n]) => `<button class="${x === k ? 'on' : ''}" data-meas="${x}">${n}</button>`).join('')}</div>`;
  if (!ser.length) return chips + `<div class="card empty">${clI('scale')}<b>Замеров нет</b><span>Добавьте первый — будет видна динамика</span></div>
    <button class="btn pri pbtn" data-addmeas>${clI('plus')}Добавить замер</button>`;
  const cur = ser[ser.length - 1], d0 = cur[1] - ser[0][1];
  return chips + `<div class="card pch">
      <div class="pchh"><div><s>${name} · ${clShortDate(cur[0])}</s><b>${clNum(cur[1], dec)}<i>${unit}</i></b></div>
        <span class="since">${ser.length > 1 && d0 ? `<span class="dlt n">${clDelta(d0, unit, dec)}</span> с ${clShortDate(ser[0][0])}` : ''}</span></div>
      ${ser.length > 1 ? clChart(ser, unit, dec) : '<div class="nochart">График появится после второго замера</div>'}
    </div>
    <div class="card plist">${ser.map((r, i) => ({ r, d: i ? r[1] - ser[i - 1][1] : 0 })).reverse().map(({ r, d }) =>
      `<div class="prow"><span><b>${clFullDate(r[0])}</b></span><span class="pv">${clNum(r[1], dec)}<i>${unit}</i><s class="${d ? 'n' : ''}">${clDelta(Math.round(d * 10) / 10, unit, dec)}</s></span></div>`).join('')}</div>
    <button class="btn pri pbtn" data-addmeas>${clI('plus')}Добавить замер</button>`;
}
CL_UI.profile = (sc, v) => {
  const p = clProf(), c = clMe(), g = groupOf(CL_ME), tab = clProfOn;
  const w = [...clMeasAll()].reverse().find(r => r.w != null);
  const ini = ((p.first || '')[0] || '') + ((p.last || '')[0] || '');
  const f = (k, val) => `<div class="pf"><s>${k}</s><b>${clEsc(val || '—')}</b></div>`;
  return `<header class="hhead"><div class="wmk">Профиль</div><button class="ib hgear" data-go="settings" aria-label="Настройки">${clI('gear')}</button></header>
  <div class="pg prof">
    <section class="card pcard">
      <div class="pid"><button class="pav ph" data-photo aria-label="Сменить фото">${clS.photo ? `<img src="${clS.photo}" alt="">` : clEsc(ini.toUpperCase())}<i>${clI('camera')}</i></button>
        <div><b>${clEsc(p.first + ' ' + p.last)}</b><s>${p.sex === 'ж' ? 'Женщина' : 'Мужчина'}${clAge(p.born) ? ', ' + clEsc(clAge(p.born)) : ''}${g ? ' · ' + clEsc(g.n) : ''}</s></div>
        <button class="ib pedit" data-pedit aria-label="Изменить данные">${clI('pen')}</button></div>
      <input type="file" accept="image/*" id="photo-in" hidden>
      <div class="pgrid">${f('Телефон', c.phone)}${f('Уровень', p.level)}${f('Рост', p.h ? p.h + ' см' : '')}${f('Вес', w ? clNum(w.w, 1) + ' кг' : '')}</div>
      <div class="pgoal"><div><s>Основная цель</s><b>${clEsc(p.goal)}</b></div>${p.goal2 ? `<div><s>Дополнительная цель</s><b>${clEsc(p.goal2)}</b></div>` : ''}</div>
    </section>
    <section class="card ptr"><span class="pav sm">${clEsc(TRAINER.ini)}</span><div><s>Тренер</s><b>${clEsc(TRAINER.n)}</b><span>${clEsc(TRAINER.workspace)} · с ${clFullDate(c.since)}</span></div></section>
    <nav class="ptabs" role="tablist"><button role="tab" class="${tab === 'pr' ? 'on' : ''}" data-ptab="pr">Рекорды</button><button role="tab" class="${tab === 'meas' ? 'on' : ''}" data-ptab="meas">Замеры</button></nav>
    <div class="ptab">${tab === 'pr' ? clPrTab() : clMeasTab()}</div>
  </div>
  ${clTabs('profile')}`;
};

/* Лист снизу с формой: строки glist, «Сохранить» активна, когда форма годится */
function clForm(title, rows, ok, save) {
  const w = document.createElement('div');
  w.className = 'shw';
  w.innerHTML = `<div class="shbg" data-x></div>
    <div class="sheet fsheet" role="dialog" aria-label="${clEsc(title)}"><i class="grab"></i>
      <div class="fsh"><button class="lnk" data-x>Отмена</button><b>${clEsc(title)}</b><button class="lnk acc" data-ok>Сохранить</button></div>
      <div class="glist">${rows}</div>
    </div>`;
  const close = () => { w.classList.add('out'); setTimeout(() => w.remove(), 220); };
  const sb = w.querySelector('[data-ok]'), check = () => { sb.disabled = !ok(w); };
  w.addEventListener('input', check); w.addEventListener('change', check);
  w.addEventListener('click', e => { if (e.target.closest('[data-x]')) close(); else if (e.target.closest('[data-ok]') && !sb.disabled) { save(w); close(); } });
  document.getElementById('dev').appendChild(w); check();
  return w;
}
const clVal = (w, id) => { const v = parseFloat(String(w.querySelector('#' + id).value).replace(',', '.')); return isFinite(v) && v > 0 ? v : null; };
function clToast(t) {
  const el = document.createElement('div'); el.className = 'toast'; el.textContent = t;
  document.getElementById('dev').appendChild(el); setTimeout(() => el.classList.add('out'), 2200); setTimeout(() => el.remove(), 2500);
}
/* Вкладка профиля сменяется на месте: адрес и стенд узнают новый вид без перехода */
function clProfTab(scr, v) { clProfOn = v === 'meas' ? 'meas' : 'pr'; clRepaint(scr, 'profile'); }
CL_UI_MOUNT.profile = scr => {
  scr.addEventListener('change', e => {
    /* Фото — сразу по выбору файла: уменьшаем до 320 px и храним на устройстве */
    if (e.target.id === 'photo-in' && e.target.files[0]) {
      const img = new Image(), url = URL.createObjectURL(e.target.files[0]);
      img.onload = () => { const n = 320, c = document.createElement('canvas'), m = Math.min(img.width, img.height);
        c.width = c.height = n; c.getContext('2d').drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, n, n);
        URL.revokeObjectURL(url); clS.photo = c.toDataURL('image/jpeg', .85); clSave(); clRepaint(scr, 'profile'); clToast('Фото обновлено'); };
      img.src = url;
    }
  });
  scr.addEventListener('click', e => {
    const t = e.target.closest('[data-ptab]'); if (t) { clProfTab(scr, t.dataset.ptab); return; }
    /* Раскрытие строки: выше свернулся другой график — строку держим там же, где по ней тапнули */
    const pr = e.target.closest('[data-pm]'); if (pr) { const k = pr.dataset.pm, y = pr.getBoundingClientRect().top;
      clPmSel = clPmSel === k ? '' : k; clRepaint(scr, 'profile');
      const nr = scr.querySelector(`[data-pm="${k}"]`); if (nr) scr.scrollTop += nr.getBoundingClientRect().top - y; return; }
    if (e.target.closest('[data-photo]')) { scr.querySelector('#photo-in').click(); return; }
    const ms = e.target.closest('[data-meas]'); if (ms) { clMeasSel = ms.dataset.meas; clRepaint(scr, 'profile'); return; }
    if (e.target.closest('[data-addpm]')) {
      /* Упражнения с весом: уже с рекордом — сверху, остальные — по алфавиту */
      const pm = pmOf(CL_ME), seen = new Set(Object.keys(pm)), more = [];
      EX.forEach(x => { const k = pmKey(x); if (!k || seen.has(k)) return; seen.add(k); more.push([k, PMNAMES[k] || x.ru]); });
      more.sort((a, b) => a[1].localeCompare(b[1], 'ru'));
      const opts = [...Object.keys(pm).map(k => [k, clPmName(k)]), ...more];
      clForm('Новый рекорд', `
        <div class="gr"><label for="n-ex">Упражнение</label><select id="n-ex">${opts.map(([k, n]) => `<option value="${k}"${k === clPmSel ? ' selected' : ''}>${clEsc(n)}</option>`).join('')}</select>${clI('down')}</div>
        <div class="gr"><label for="n-1">1ПМ</label><input id="n-1" inputmode="decimal" placeholder="${pm[clPmSel] ? clNum(pm[clPmSel]) : '—'}"><span class="unit">кг</span></div>
        <div class="gr"><label for="n-3">3ПМ</label><input id="n-3" inputmode="decimal" placeholder="по желанию"><span class="unit">кг</span></div>`,
        w => clVal(w, 'n-1') != null,
        w => { const k = w.querySelector('#n-ex').value, v1 = clVal(w, 'n-1'), v3 = clVal(w, 'n-3');
          pm[k] = v1; (clS.pmh[k] ||= []).push([TODAY, v1]); if (v3 != null) clPm3()[k] = v3;
          saveState(); clSave(); clPmSel = k; clRepaint(scr, 'profile'); clToast('Рекорд сохранён — веса в тренировках пересчитаны'); });
      return;
    }
    if (e.target.closest('[data-addmeas]')) {
      const last = [...clMeasAll()].reverse();
      const ph = k => { const r = last.find(x => x[k] != null); return r ? clNum(r[k], k === 'w' || k === 'fat') : '—'; };
      clForm('Новый замер', `<div class="gr"><label for="m-d">Дата</label><input id="m-d" type="date" max="${TODAY}" value="${TODAY}"></div>` +
        CL_MEAS.map(([k, n, u]) => `<div class="gr"><label for="m-${k}">${n}</label><input id="m-${k}" inputmode="decimal" placeholder="${ph(k)}"><span class="unit">${u}</span></div>`).join(''),
        w => !!w.querySelector('#m-d').value && CL_MEAS.some(([k]) => clVal(w, 'm-' + k) != null),
        w => { const r = { date: w.querySelector('#m-d').value }; CL_MEAS.forEach(([k]) => { const v = clVal(w, 'm-' + k); if (v != null) r[k] = v; });
          const same = clS.meas.find(x => x.date === r.date); if (same) Object.assign(same, r); else clS.meas.push(r);
          if (r[clMeasSel] == null) clMeasSel = CL_MEAS.find(([k]) => r[k] != null)[0];
          clSave(); clRepaint(scr, 'profile'); clToast('Замер сохранён'); });
      return;
    }
    if (e.target.closest('[data-pedit]')) {
      const p = clProf();
      const opt = (val, label) => `<button type="button" class="opt${p.sex === val ? ' on' : ''}" data-sx="${val}">${label}</button>`;
      const w = clForm('Мои данные', `
        <div class="gr"><label for="e-last">Фамилия</label><input id="e-last" autocomplete="family-name" value="${clEsc(p.last)}"></div>
        <div class="gr"><label for="e-first">Имя</label><input id="e-first" autocomplete="given-name" value="${clEsc(p.first)}"></div>
        <div class="gr"><label>Пол</label><div class="seg2">${opt('м', 'Мужской')}${opt('ж', 'Женский')}</div></div>
        <div class="gr"><label for="e-born">Дата рождения</label><input id="e-born" type="date" max="${TODAY}" value="${clEsc(p.born)}"></div>
        <div class="gr"><label for="e-h">Рост</label><input id="e-h" inputmode="decimal" value="${clEsc(p.h || '')}" placeholder="по желанию"><span class="unit">см</span></div>
        <div class="gr"><label for="e-lvl">Уровень</label><select id="e-lvl">${CL_LEVELS.map(l => `<option${p.level === l ? ' selected' : ''}>${clEsc(l)}</option>`).join('')}</select>${clI('down')}</div>
        <div class="gr"><label for="e-goal">Основная цель</label><select id="e-goal">${CL_GOALS.map(x => `<option${p.goal === x ? ' selected' : ''}>${clEsc(x)}</option>`).join('')}</select>${clI('down')}</div>
        <div class="gr col"><label for="e-goal2">Дополнительная цель</label><textarea id="e-goal2" rows="2" placeholder="по желанию">${clEsc(p.goal2)}</textarea></div>`,
        w => !!w.querySelector('#e-first').value.trim() && !!w.querySelector('#e-last').value.trim(),
        w => { const q = id => w.querySelector('#' + id).value.trim();
          Object.assign(clS.prof, { last: q('e-last'), first: q('e-first'), sex: w.querySelector('[data-sx].on').dataset.sx, born: q('e-born'), h: q('e-h'), level: q('e-lvl') });
          clS.goal = q('e-goal'); clS.goal2 = q('e-goal2'); clSave(); clRepaint(scr, 'profile'); clToast('Данные сохранены'); });
      w.addEventListener('click', e2 => { const b = e2.target.closest('[data-sx]'); if (!b) return; w.querySelectorAll('[data-sx]').forEach(x => x.classList.toggle('on', x === b)); });
    }
  });
};

/* ═══ P1. Настройки ═══
   Открываются шестерёнкой в шапке профиля. Только то, что клиент решает
   сам: какие уведомления получать, гасить ли экран на тренировке; что
   лежит на устройстве (CLI-3); аккаунт; документы. Всё, что касается
   тренировок, решает тренер — здесь этого нет. */
const CL_SET = [
  ['plan',   'Новая тренировка от тренера', true],
  ['msg',    'Сообщения тренера',           true],
  ['remind', 'Напоминание о тренировке', true]
];
const clSet = (k, def) => clS.set[k] == null ? def : clS.set[k];
/* Последний опубликованный день плана — докуда тренировки есть без интернета */
function clOfflineTill() {
  const pl = clPlan(client(CL_ME).prog);
  for (let i = pl.length - 1; i >= 0; i--) if (!clDayAt(pl[i].date).rest) return pl[i].date;
  return null;
}
/* Подтверждение необратимого: лист снизу с одной красной кнопкой */
function clAsk(title, text, label, ok) {
  const w = document.createElement('div');
  w.className = 'shw';
  w.innerHTML = `<div class="shbg" data-x></div>
    <div class="sheet ask" role="alertdialog" aria-label="${clEsc(title)}"><i class="grab"></i>
      <b>${clEsc(title)}</b><p>${clEsc(text)}</p>
      <button class="btn rmb" data-ok>${clEsc(label)}</button><button class="lnk" data-x>Отмена</button>
    </div>`;
  const close = () => { w.classList.add('out'); setTimeout(() => w.remove(), 220); };
  w.addEventListener('click', e => { if (e.target.closest('[data-x]')) close(); else if (e.target.closest('[data-ok]')) { close(); ok(); } });
  document.getElementById('dev').appendChild(w);
}
CL_UI.settings = () => {
  const sw = (k, label, def) => { const on = clSet(k, def);
    return `<button class="srow" role="switch" aria-checked="${on}" data-set="${k}"><span>${clEsc(label)}</span><i class="tgl"></i></button>`; };
  const link = (label, act) => `<button class="srow" data-doc="${act}"><span>${clEsc(label)}</span>${clI('right')}</button>`;
  const till = clOfflineTill();
  return `<header class="top"><button class="ib" data-back aria-label="Назад">${CL_ICON.back}</button><div class="t">Настройки</div><span class="ib ghost"></span></header>
  <div class="pg sets">
    <p class="lbl gcap">Уведомления</p>
    <div class="glist">${CL_SET.map(([k, n, d]) => sw(k, n, d)).join('')}</div>
    <p class="lbl gcap">Оформление</p>
    <div class="glist"><label class="srow sel"><span>Тема</span><select data-thm aria-label="Тема">${CL_THEMES.map(([k, n]) =>
      `<option value="${k}"${(clS.set.theme || 'system') === k ? ' selected' : ''}>${n}</option>`).join('')}</select>${clI('down')}</label></div>
    <p class="lbl gcap">Тренировка</p>
    <div class="glist">${sw('awake', 'Не гасить экран', true)}
      <div class="srow"><span>Доступно без интернета</span><s>${till ? 'до ' + clEsc(clShortDate(till)) : 'нет тренировок'}</s></div></div>
    <p class="lbl gcap">Аккаунт</p>
    <div class="glist"><div class="srow"><span>Телефон</span><s>${clEsc(clMe().phone)}</s></div>
      <button class="srow" data-go="phone"><span>Выйти</span></button>
      <button class="srow rm" data-delacc><span>Удалить аккаунт</span></button></div>
    <p class="lbl gcap">О приложении</p>
    <div class="glist">${link('Политика конфиденциальности', 'privacy')}${link('Пользовательское соглашение', 'terms')}
      <div class="srow"><span>Версия</span><s>1.0 · прототип</s></div></div>
  </div>
  ${clTabs('profile')}`;
};
CL_UI_MOUNT.settings = scr => {
  scr.addEventListener('change', e => {
    if (!e.target.matches('[data-thm]')) return;
    clS.set.theme = e.target.value; clSave(); clApplyTheme();
    if (clInFrame) parent.postMessage({ cl: 'theme' }, '*');
  });
  scr.addEventListener('click', e => {
    const t = e.target.closest('[data-set]');
    if (t) { const k = t.dataset.set, d = (CL_SET.find(x => x[0] === k) || [0, 0, true])[2];
      clS.set[k] = !clSet(k, d); clSave(); t.setAttribute('aria-checked', clS.set[k]); return; }
    if (e.target.closest('[data-doc]')) { clToast('Документ откроется в браузере'); return; }
    if (e.target.closest('[data-delacc]')) clAsk('Удалить аккаунт?',
      'Вход по этому номеру, фото, рекорды и замеры удалятся без восстановления. История тренировок и результатов останется у тренера.',
      'Удалить аккаунт', () => { try { localStorage.removeItem('trenergram.client'); } catch (x) {}
        Object.keys(clS).forEach(k => delete clS[k]); Object.assign(clS, { phone: '', prof: {}, goal: '', goal2: '', done: {}, notes: {}, sent: {}, dayDone: {}, open: {}, hideTasks: false, read: {}, meas: [], pmh: {}, photo: '', set: {} });
        clGo('phone', '', true); });
  });
};
