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
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>'
};
const clI = (n, cls) => `<svg class="i${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true">${CL_SVG[n]}</svg>`;

/* ── состояние клиента ── */
const clS = (() => {
  const def = { phone: '', prof: {}, goal: '', goal2: '', done: {}, notes: {}, dayDone: {}, open: {}, hideTasks: false };
  try { return Object.assign(def, JSON.parse(localStorage.getItem('trenergram.client') || '{}')); } catch (e) { return def; }
})();
const clSave = () => { try { localStorage.setItem('trenergram.client', JSON.stringify(clS)); } catch (e) {} };

/* Выбранный на главной день; тренировка открывается на нём */
let clDate = TODAY;

/* ── день клиента из плана тренера ──
   Клиент видит только опубликованное: у черновика — прошлый слепок (pub),
   а если тренер ещё ни разу не публиковал день — его нет. */
function clDayAt(date) {
  const c = client(CL_ME), p = program(c.prog);
  const i = daysBetween(p.start, date);
  const x = i >= 0 ? buildPlan(c.prog)[i] : null;
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

/* ── строки упражнения: название, схема, вес ── */
function clItemRow(it, pm, date) {
  if (it.chain) {
    const parts = (it.parts || []).filter(partHas);
    return `<div class="xr"><div class="xn">${parts.map(p => clEsc(partName(p))).join(' + ')}</div>
      <div class="xp">${parts.map(p => { const kg = p.exId ? kgText(p, pm) : null;
        return [clEsc(p.txt || p.scheme || ''), kg ? `<b>${kg} кг</b>` : (!p.txt && loadText(p) && p.pct == null ? clEsc(loadText(p)) : '')].filter(Boolean).join(' · '); }).join(' + ')}</div></div>`;
  }
  const e = it.exId ? byId(it.exId) : null;
  const name = e ? e.ru : (it.raw || '');
  const kg = e ? kgText(it, pm) : null;
  /* Проценты клиенту не показываем: вместо них рабочий вес */
  const load = it.pct != null ? (kg ? `<b>${kg} кг</b>` : '') : (it.val ? `<b>${clEsc(loadText(it))}</b>` : '');
  const prm = it.txt ? clEsc(it.txt) : [clEsc(it.scheme || ''), load].filter(Boolean).join(' · ');
  const last = e ? lastResult(CL_ME, it.exId, date, it.scheme) : null;
  const lastTx = last ? (last.kg != null ? `${clEsc(last.scheme)} · ${fmtNum(last.kg)} кг` : clEsc(last.done || last.scheme)) : '';
  return `<div class="xr"><div class="xn">${clEsc(name)}</div>${prm ? `<div class="xp">${prm}</div>` : ''}
    ${lastTx ? `<div class="xl">В прошлый раз: ${lastTx}</div>` : ''}</div>`;
}
/* Содержимое блока: формат комплекса, строки, суперсеты, блок текстом */
function clBlockBody(b, pm, date) {
  if (isTextBlock(b)) return textLines(b.text).map(l => `<div class="xt">${clEsc(l)}</div>`).join('');
  let h = '', k = 0;
  const its = b.items;
  while (k < its.length) {
    if (its[k].ss) {
      const j = ssEnd(its, k), mem = its.slice(k + 1, j).filter(itemHas);
      if (mem.length) h += `<div class="ssg"><div class="ssh">${clEsc(ssLabel(its[k]))}</div>${mem.map(x => clItemRow(x, pm, date)).join('')}</div>`;
      k = j; continue;
    }
    if (itemHas(its[k])) h += clItemRow(its[k], pm, date);
    k++;
  }
  return h;
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
const clTabs = on => `<nav class="tabs">
  <button class="${on === 'home' ? 'on' : ''}" data-go="home">${clI('home')}<span>Главная</span></button>
  <button class="${on === 'profile' ? 'on' : ''}" data-go="profile">${clI('user')}<span>Профиль</span></button>
</nav>`;
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
        <div><b>${clEsc(TRAINER.n)}</b><s>приглашает вас тренироваться · ${clEsc(TRAINER.workspace)}</s></div>
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

  /* W1. Создание аккаунта · данные */
  'wiz-data'() {
    const p = clS.prof;
    const opt = (name, val, label) => `<button type="button" class="opt${p[name] === val ? ' on' : ''}" data-f="${name}" data-val="${clEsc(val)}">${clEsc(label)}</button>`;
    return `<header class="top">${clDots(2, 0)}</header>
    <div class="pg form">
      ${clHead('Ваши данные', 'Тренер подберёт нагрузку под вас')}
      <label class="lbl">Фамилия</label><input class="inp" data-f="last" autocomplete="family-name" value="${clEsc(p.last || '')}">
      <label class="lbl">Имя</label><input class="inp" data-f="first" autocomplete="given-name" value="${clEsc(p.first || '')}">
      <label class="lbl">Отчество <em>по желанию</em></label><input class="inp" data-f="mid" autocomplete="additional-name" value="${clEsc(p.mid || '')}">
      <label class="lbl">Пол</label><div class="seg2">${opt('sex', 'м', 'Мужской')}${opt('sex', 'ж', 'Женский')}</div>
      <label class="lbl">Дата рождения <em id="age">${clEsc(clAge(p.born))}</em></label>
      <div class="fld">${clI('cal')}<input type="date" data-f="born" max="${TODAY}" value="${clEsc(p.born || '')}"></div>
      <div class="two">
        <div><label class="lbl">Рост <em>по желанию</em></label><div class="fld">${clI('ruler')}<input inputmode="decimal" data-f="h" value="${clEsc(p.h || '')}" placeholder="—"><span class="unit">см</span></div></div>
        <div><label class="lbl">Вес <em>по желанию</em></label><div class="fld">${clI('scale')}<input inputmode="decimal" data-f="w" value="${clEsc(p.w || '')}" placeholder="—"><span class="unit">кг</span></div></div>
      </div>
      <label class="lbl">Уровень подготовки</label>
      <div class="grid2">${CL_LEVELS.map(l => opt('level', l, l)).join('')}</div>
    </div>
    <div class="foot"><button class="btn pri" id="next" data-go="@next" disabled>Дальше</button></div>`;
  },

  /* W2. Создание аккаунта · цели */
  'wiz-goals'() {
    return `<header class="top"><button class="ib" data-back aria-label="Назад">${CL_ICON.back}</button>${clDots(2, 1)}<span class="ib ghost"></span></header>
    <div class="pg form">
      ${clHead('Ваша цель', 'Тренер увидит её в вашей карточке')}
      <div class="goals">${CL_GOALS.map(g => `<button type="button" class="goal${clS.goal === g ? ' on' : ''}" data-goal="${clEsc(g)}"><i></i><span>${clEsc(g)}</span></button>`).join('')}</div>
      <label class="lbl" for="goal2">Дополнительная цель <em>по желанию</em></label>
      <textarea class="inp ta" id="goal2" rows="3" placeholder="Например: подтянуться 10 раз к лету">${clEsc(clS.goal2)}</textarea>
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
      <div class="sth"><b>Первые шаги</b><span>${nDone} / ${tasks.length}</span></div>
      <div class="prog"><i style="width:${nDone / tasks.length * 100}%"></i></div>
      <button class="pill" id="hidetasks">${clS.hideTasks ? 'Показать задачи' : 'Скрыть задачи'}${clI('down', clS.hideTasks ? '' : 'up')}</button>
      ${clS.hideTasks ? '' : `<div class="tasks">${tasks.map(([t, ok, act, to]) => `<div class="task${ok ? ' ok' : ''}">
        <i class="ck">${ok ? clI('check') : ''}</i><span>${clEsc(t)}</span>
        ${!ok && act ? `<button class="go" data-go="${to}">${clEsc(act)} ${CL_ICON.next}</button>` : ''}</div>`).join('')}</div>`}
    </section>` : '';
    return `<header class="hhead">
      <div class="wmk">Тренерграм</div>
      <div class="mon">${MONTHS_N[d.getMonth()]} ${d.getFullYear()} ${clI('cal')}</div>
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
  workout() {
    const x = clDayAt(clDate), pm = pmOf(CL_ME), key = clDayKey(clDate);
    const msg = dayMsg(CL_ME, clDate);
    const doneAll = !!clS.dayDone[key];
    const blocks = x.blocks.map((b, i) => {
      const bk = key + '#' + i, done = !!(clS.done[bk] || doneAll);
      const open = clS.open[bk] !== false;
      const exs = clBlockEx(b);
      /* Подпись типа — только если название его не называет (как в кабинете) */
      const tl = b.title ? typeNote(b) : '';
      const fmt = b.fmt && typeof b.fmt === 'object' ? b.fmt : null;
      const rows = [
        b.note ? ['note', 'Заметка тренера', `<p class="cnote">${clEsc(b.note)}</p>`] : null,
        exs.length ? ['tech', 'Техника', `<div class="demos">${exs.map(e => `<button class="demo" data-ex="${e.id}">
            <span class="th">${e.gif ? `<img src="../${clEsc(e.gif)}-360.gif" alt="" loading="lazy">` : `<em>${clEsc(e.ru.slice(0, 1))}</em>`}<i>${clI('play')}</i></span>
            <span class="dn">${clEsc(e.ru)}</span></button>`).join('')}</div>`] : null,
        ['notes', 'Результат и заметки', `<textarea class="inp ta" data-note="${bk}" rows="3" placeholder="Веса, повторы, время или как прошло…">${clEsc(clS.notes[bk] || '')}</textarea>`]
      ].filter(Boolean);
      return `<section class="blk${done ? ' done' : ''}">
        <div class="bh">
          <div class="bt"><b>${clEsc(clBlockName(b))}</b>${tl ? `<s>${clEsc(tl)}</s>` : ''}</div>
          <button class="ring${done ? ' on' : ''}" data-bdone="${bk}" aria-label="${done ? 'Снять отметку' : 'Отметить блок выполненным'}">${done ? clI('check') : ''}</button>
        </div>
        <button class="det" data-bopen="${bk}">${clI('down', open ? '' : 'up')}${open ? 'Скрыть детали' : 'Показать детали'}</button>
        ${open ? `<div class="card bcard">
          ${fmt ? `<div class="fmt"><b>${clEsc(fmtLabel(fmt))}</b><span>${clEsc(fmtDesc(fmt))}</span></div>` : ''}
          <div class="xs">${clBlockBody(b, pm, clDate)}</div>
          ${rows.map(([id, t, body]) => { const ok = clS.open[bk + ':' + id];
            return `<div class="row${ok ? ' on' : ''}"><button class="rh" data-row="${bk}:${id}"><span>${t}</span>${clI(ok ? 'down' : 'right')}</button>${ok ? `<div class="rb">${body}</div>` : ''}</div>`; }).join('')}
        </div>` : ''}
      </section>`;
    }).join('');
    const head = `<header class="top"><button class="ib" data-back aria-label="Назад">${CL_ICON.back}</button><div class="t caps">${clEsc(x.title)}</div><span class="ib ghost"></span></header>`;
    if (!x.blocks.length) return head + `<div class="pg wk"><p class="wdate">${clEsc(clDateLong(clDate))}</p>
      <div class="card empty">${clI(x.comp ? 'trophy' : 'moon')}<b>${x.comp ? clEsc(x.title) : 'День отдыха'}</b>
      <span>${x.comp ? 'Соревнование — тренер не расписывал тренировку' : 'Тренировки нет — восстанавливайтесь'}</span></div></div>${clTabs('home')}`;
    return head + `<div class="pg wk">
      <p class="wdate">${clEsc(clDateLong(clDate))}</p>
      ${msg ? `<div class="card cmsg"><div class="av">${clEsc(TRAINER.ini)}</div><div><b>${clEsc(TRAINER.n)}</b><p>${clEsc(msg)}</p></div></div>` : ''}
      ${blocks}
      <button class="btn ${doneAll ? 'okb' : 'pri'} big" id="dayDone">${doneAll ? clI('check') + 'Тренировка завершена' : 'Завершить тренировку'}</button>
    </div>${clTabs('home')}`;
  }
};

/* Карточка тренировки дня на главной — вместо курсов HWPO */
function clDayCard(x) {
  const key = clDayKey(x.date), done = !!clS.dayDone[key];
  const when = x.date === TODAY ? 'Сегодня' : clDateLong(x.date);
  if (x.rest) return `<section class="card dcard rest">${clI('moon')}<div><s>${clEsc(when)}</s><b>Отдых</b><span>Тренировки нет — восстанавливайтесь</span></div></section>`;
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
    const btn = scr.querySelector('#done');
    const check = () => { btn.disabled = !clS.goal; };
    scr.addEventListener('click', e => {
      const g = e.target.closest('.goal'); if (!g) return;
      clS.goal = g.dataset.goal;
      scr.querySelectorAll('.goal').forEach(x => x.classList.toggle('on', x === g));
      clSave(); check();
    });
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
    });
  },

  workout(scr) {
    const key = clDayKey(clDate);
    scr.addEventListener('click', e => {
      const t = e.target.closest('[data-bdone]');
      if (t) { const k = t.dataset.bdone; clS.done[k] = !clS.done[k]; if (!clS.done[k]) delete clS.dayDone[key]; clSave(); clRepaint(scr, 'workout'); return; }
      const o = e.target.closest('[data-bopen]');
      if (o) { const k = o.dataset.bopen; clS.open[k] = clS.open[k] === false; clSave(); clRepaint(scr, 'workout'); return; }
      const r = e.target.closest('[data-row]');
      if (r) { const k = r.dataset.row; clS.open[k] = !clS.open[k]; clSave(); clRepaint(scr, 'workout'); return; }
      const x = e.target.closest('[data-ex]');
      if (x) { clTech(byId(x.dataset.ex)); return; }
      if (e.target.closest('#dayDone')) { clS.dayDone[key] = !clS.dayDone[key]; clSave(); clRepaint(scr, 'workout'); }
    });
    scr.addEventListener('input', e => {
      const n = e.target.dataset.note; if (n == null) return;
      clS.notes[n] = e.target.value; clSave();
    });
  }
};

/* Перерисовать экран на месте, без перехода и с сохранением прокрутки */
function clRepaint(scr, id) {
  const top = scr.scrollTop;
  scr.innerHTML = CL_UI[id](CL_SCREENS[id], '', clP);
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
