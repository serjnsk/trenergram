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
  send: '<path d="M21 3 10.5 13.5"/><path d="M21 3l-6.5 18-4-7.5L3 9.5z"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>'
};
/* Отдых — та же иконка, что в календаре кабинета тренера (из брифа) */
const CL_REST_ICON = '<img class="resti" src="../assets/icons/rest.png" alt="">';
const clI = (n, cls) => `<svg class="i${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true">${CL_SVG[n]}</svg>`;

/* ── состояние клиента ── */
const clS = (() => {
  const def = { phone: '', prof: {}, goal: '', goal2: '', done: {}, notes: {}, sent: {}, dayDone: {}, open: {}, hideTasks: false, read: {} };
  try { return Object.assign(def, JSON.parse(localStorage.getItem('trenergram.client') || '{}')); } catch (e) { return def; }
})();
const clSave = () => { try { localStorage.setItem('trenergram.client', JSON.stringify(clS)); } catch (e) {} };

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
   «3×5 Становая тяга · 132,5 кг»: схема жирным впереди, нагрузка после
   названия. Проценты клиенту не показываем — только рабочий вес. */
function clLoad(it, pm) {
  if (it.pct != null) { const kg = it.exId ? kgText(it, pm) : null; return kg ? kg + '\u00a0кг' : ''; }
  return it.val ? loadText(it) : '';
}
/* Как показывать строку упражнения — три варианта на сравнение (виды T1):
   text   — всё одинаково, обычным текстом: «3×5 Становая тяга · 132,5 кг»
   accent — та же строка, у упражнения из базы схема жирным, нагрузка
            жирным акцентом; строка, набранная текстом, — как написана
   cols   — у упражнения из базы название слева, схема и нагрузка — колонкой
            справа; строка текстом — на всю ширину */
let clLineMode = 'text';
const CL_LINE_MODES = ['text', 'accent', 'cols'];
function clPart(it, pm, mode = clLineMode) {
  const e = it.exId ? byId(it.exId) : null;
  const name = e ? e.ru : (it.raw || '');
  if (!e) return clEsc(name);                         /* строка текстом — как написана */
  if (it.txt) return clEsc(name + ' — ' + it.txt);   /* пояснение вместо нагрузки — как написано */
  const load = clLoad(it, pm);
  if (mode === 'accent') return (it.scheme ? `<b class="sc">${clEsc(it.scheme)}</b> ` : '') + clEsc(name) + (load ? ` · <b class="ld">${clEsc(load)}</b>` : '');
  return clEsc((it.scheme ? it.scheme + ' ' : '') + name + (load ? ' · ' + load : ''));
}
/* Колонка нагрузки для вида «Две колонки» */
function clParams(it, pm) {
  if (it.txt) return clEsc(it.txt);
  const load = clLoad(it, pm);
  return [it.scheme ? `<b>${clEsc(it.scheme)}</b>` : '', load ? clEsc(load) : ''].filter(Boolean).join(' · ');
}
function clLine(it, pm) {
  const parts = it.chain ? (it.parts || []).filter(partHas) : [it];
  if (clLineMode === 'cols') {
    /* В колонках связка — по строке на часть, следующие с «+»; пояснение
       вместо нагрузки и строка текстом — на всю ширину */
    return parts.map((p, k) => {
      const plus = k ? '<span class="pl">+</span>' : '';
      if (!p.exId || p.txt) return `<div class="xl${k ? ' cont' : ''}">${plus}${clPart(p, pm, 'text')}</div>`;
      const prm = clParams(p, pm);
      return `<div class="xl c2${k ? ' cont' : ''}"><span class="nm">${plus}${clEsc(byId(p.exId).ru)}</span>${prm ? `<span class="pr">${prm}</span>` : ''}</div>`;
    }).join('');
  }
  return `<div class="xl">${parts.map(p => clPart(p, pm)).join(' + ')}</div>`;
}

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
      ['Указать максимумы', Object.keys(pm).length > 0, 'Указать', 'profile'],
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
    clLineMode = CL_LINE_MODES.includes(v) ? v : 'text';
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
            <span class="th">${e.gif ? `<img src="../${clEsc(e.gif)}-360.gif" alt="" loading="lazy">` : `<em>${clEsc(e.ru.slice(0, 1))}</em>`}<i>${clI('play')}</i></span>
            <span class="dn">${clEsc(e.ru)}</span></button>`).join('')}</div>`] : null
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

/* P0. Профиль — пока заглушка, но это вкладка: внизу таб-бар, как на главной */
CL_UI.profile = sc => `<header class="top"><span class="ib ghost"></span><div class="t">${clEsc(sc.title)}</div><span class="ib ghost"></span></header>
  <div class="pg">
    <div class="stub"><span class="cd">${clEsc(sc.code)}</span><h1>${clEsc(sc.title)}</h1>
      <p>${clEsc((sc.desc || [])[0] || '')}</p><span class="tag">Заглушка — дизайн экрана ещё не сделан</span></div>
    <div class="sk"><i></i><i></i><i></i><b></b></div>
  </div>
  ${clTabs('profile')}`;

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
      if (e.target.closest('#dayDone')) { clS.dayDone[key] = !clS.dayDone[key]; clSave(); clRepaint(scr, 'workout'); }
    });
    /* Пока не отправлено — черновик; кнопка «Отправить» активна, когда есть текст */
    scr.addEventListener('input', e => {
      const n = e.target.dataset.note; if (n == null) return;
      clS.notes[n] = e.target.value; clSave();
      const b = e.target.parentElement.querySelector('[data-send]'); if (b) b.disabled = !e.target.value.trim();
    });
  }
};

/* Перерисовать экран на месте, без перехода и с сохранением прокрутки */
function clRepaint(scr, id) {
  const top = scr.scrollTop;
  scr.innerHTML = CL_UI[id](CL_SCREENS[id], clParse(location.hash).v, clP);
  scr.scrollTop = top;
}

/* Техника упражнения — лист снизу: демонстрация и описание из базы */
function clTech(e) {
  if (!e) return;
  const w = document.createElement('div');
  w.className = 'shw';
  w.innerHTML = `<div class="shbg" data-x></div>
    <div class="sheet" role="dialog" aria-label="${clEsc(e.ru)}"><i class="grab"></i>
      ${e.gif ? `<img class="tgif" src="../${clEsc(e.gif)}-720.gif" alt="">` : `<div class="tgif none">${clI('play')}<span>Демонстрации пока нет</span></div>`}
      <h2>${clEsc(e.ru)}</h2>
      <p>${clEsc(TECH[e.id] || 'Описание техники тренер ещё не добавил.')}</p>
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
