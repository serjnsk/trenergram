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
  wallet: '<rect x="3" y="6" width="18" height="13" rx="2.5"/><path d="M3 10h18M16 15h2"/>',
  lock: '<rect x="5" y="11" width="14" height="10" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  share: '<path d="M12 3v12M8 7l4-4 4 4"/><path d="M6 11H5a1 1 0 0 0-1 1v8a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-8a1 1 0 0 0-1-1h-1"/>',
  addsq: '<rect x="4" y="4" width="16" height="16" rx="4"/><path d="M12 8.5v7M8.5 12h7"/>',
  book: '<path d="M5 4h10a3 3 0 0 1 3 3v13H8a3 3 0 0 1-3-3z"/><path d="M5 17a3 3 0 0 1 3-3h10"/>',
  search: '<circle cx="11" cy="11" r="6"/><path d="M20 20l-4.5-4.5"/>',
  compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4.5" cy="6" r="1.2"/><circle cx="4.5" cy="12" r="1.2"/><circle cx="4.5" cy="18" r="1.2"/>',
  clip: '<rect x="5" y="4" width="14" height="17" rx="2.5"/><path d="M9 4.5V3h6v1.5"/><path d="M9 13l2 2 4-4.5"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>'
};
/* Отдых — та же иконка, что в календаре кабинета тренера (из брифа) */
const CL_REST_ICON = '<img class="resti" src="../assets/icons/rest.png" alt="">';
const clI = (n, cls) => `<svg class="i${cls ? ' ' + cls : ''}" viewBox="0 0 24 24" aria-hidden="true">${CL_SVG[n]}</svg>`;

/* ── состояние клиента ── */
const clS = (() => {
  const def = { phone: '', prof: {}, goal: '', goal2: '', done: {}, notes: {}, sent: {}, dayDone: {}, open: {}, hideTasks: false, read: {}, meas: [], pmh: {}, photo: '', set: {}, ach: {}, res: {} };
  try { return Object.assign(def, JSON.parse(localStorage.getItem('trenergram.client') || '{}')); } catch (e) { return def; }
})();
const clSave = () => { try { localStorage.setItem('trenergram.client', JSON.stringify(clS)); } catch (e) {} };
/* Сообщения и итог раньше лежали только у клиента (clS.sent, clS.res) — переносим
   в общее хранилище, чтобы их видел тренер. Один раз. */
if (Object.keys(clS.sent || {}).length || Object.keys(clS.res || {}).length) {
  Object.entries(clS.sent || {}).forEach(([k, arr]) => arr.forEach(m => ((STATE.talk ||= {})[k] ||= []).push({ who: 'client', text: m.tx, d: (blkParse(k) || {}).date || TODAY, at: m.at })));
  Object.entries(clS.res || {}).forEach(([k, r]) => { (STATE.res ||= {})[k] ||= r; });
  clS.sent = {}; clS.res = {}; saveState(); clSave();
}

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
/* День клиента — общий с кабинетом тренера (cliDay в data.js): тренер в
   просмотре тренировки видит те же блоки и номера блоков. */
const clDayAt = date => cliDay(CL_ME, date);
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
/* Короткие подписи вкладок блока: иконка и слово в строку влезают в четверть 360 px */
const CL_TAB_SHORT = { chat: 'Чат', tech: 'Техника', res: 'Итог', rec: 'ПМ' };

/* ═══ Результат блока ═══
   Вкладка «Результат» внизу блока: что записывается — строка формата комплекса
   (AMRAP — раунды + повторы, на время — мин:сек…) или строки с весом силового
   блока. Записанное — значением с галочкой, кружок блока заполняется. */
/* Форматы итога и сам записанный итог — общие с кабинетом (RES_FMT, resRec в
   data.js): что клиент записал, тренер видит в просмотре тренировки. */
const CL_RES_FMT = RES_FMT, CL_RES_KG = RES_KG;
const clResSpec = (key, o) => { const d = o.k === 'kg' ? CL_RES_KG : CL_RES_FMT[o.k], r = resRec(key);
  return { d, r, val: r ? d.v(r, o.f || o) : '' }; };
/* Поля результата одной строки */
function clResFields(key, o) {
  const { d, r } = clResSpec(key, o), ph = o.k === 'kg' ? String(o.plan).replace(/\s*кг$/, '') : '';
  /* Силовое — по подходам: вес и повторы, подсказка из плана. Оставил пустым —
     значит сделал как в плане; правит только то, что отличалось. */
  if (o.k === 'kg' && o.sets && o.sets.length) { const got = resSets(r, o);
    return `<div class="rsets">${o.sets.map((x, i) => { const g = got[i] || {};
      const f = (k, v, pv, u) => `<label class="rfld"><input inputmode="decimal" data-rf="${k}${i}" value="${v != null && r ? clEsc(clNum(v)) : ''}" placeholder="${pv != null ? clEsc(clNum(pv)) : ''}" aria-label="Подход ${i + 1}, ${u}"><i>${u}</i></label>`;
      return `<div class="rset"><span class="rn">${i + 1}</span>${f('w', g.w, x.w, 'кг')}${f('r', g.r, x.r, 'повт')}</div>`; }).join('')}</div>`; }
  const u = x => x.replace('%n', (o.f || {}).rounds || '');
  return `<div class="rflds">${d.f.map(([k, x]) => `<label class="rfld"><input inputmode="decimal" data-rf="${k}" value="${r && r[k] != null ? clEsc(r[k]) : ''}" placeholder="${clEsc(ph)}" aria-label="${clEsc(u(x))}"><i>${clEsc(u(x))}</i></label>`).join('')}</div>`;
}
const clResEntries = resEntries;
const clResTab = (ents, bk) => ents.map(x => { const { val } = clResSpec(x.key, x.o);
  return `<div class="rent" data-rpan="${x.key}"><div class="rl"><span>${clEsc(x.label)}</span>${val ? `<s>${clI('check')}${clEsc(x.o.k === 'kg' ? 'записано' : val)}</s>` : ''}</div>${clResFields(x.key, x.o)}</div>`; }).join('') +
  `<button class="btn pri rsave" data-rsaveall="${bk}">Записать</button>`;

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

/* Тренер глазами клиента — то, что он заполнил в профиле кабинета: фото, имя, город.
   Клуба у тренера нет. Фото — из общего с кабинетом состояния, нет — инициалы */
const clTrAva = () => { const ph = (STATE.profile || {}).photo; return ph ? `<img src="${ph}" alt="">` : clEsc(TRAINER.ini); };
const CL_LEVELS = ['Новичок', 'Есть опыт', 'Продвинутый', 'Спортсмен'];
const CL_GOALS = ['Похудеть', 'Набрать мышечную массу', 'Стать сильнее', 'Выносливость', 'Здоровье и самочувствие', 'Подготовка к соревнованиям'];

/* ═══════════ отрисовка ═══════════ */
const CL_UI = {
  /* R0. Ссылка открыта в Telegram — просим перейти в браузер до входа */
  tgopen() {
    const and = clOS() === 'android', br = and ? 'Chrome' : 'Safari';
    return `<div class="pg auth tgo">
      <div class="invc">
        <div class="av">${clTrAva()}</div>
        <div><em>Приглашение тренера</em><b>${clEsc(TRAINER.n)}</b><s>приглашает вас тренироваться${TRAINER.city ? ' · ' + clEsc(TRAINER.city) : ''}</s></div>
      </div>
      ${clHead('Откройте в ' + br, 'Из Telegram приложение не поставить на экран телефона. Перейдите в ' + br + ' и войдите там.')}
      <button class="btn pri" data-openbr>${clI('link')}Открыть в ${br}</button>
      <div class="card tgalt">
        <b>Не открылось?</b>
        <div class="mk sm">${clMock(and ? 'tg-and' : 'tg-ios')}</div>
        <p>Нажмите <em>${and ? '⋮' : '⋯'}</em> вверху справа → <em>«Открыть в ${and ? 'браузере' : 'Safari'}»</em>. Или скопируйте ссылку в ${br}.</p>
        <button class="btn sec" data-copylink>Скопировать ссылку</button>
      </div>
      <button class="lnk tgstay" data-go="@next">Продолжить в Telegram</button>
    </div>`;
  },

  /* R1. Вход по номеру — единый для новых и существующих */
  phone(sc, v) {
    const inv = v === 'invite' ? `<div class="invc">
        <div class="av">${clTrAva()}</div>
        <div><em>Приглашение тренера</em><b>${clEsc(TRAINER.n)}</b><s>приглашает вас тренироваться${TRAINER.city ? ' · ' + clEsc(TRAINER.city) : ''}</s></div>
      </div>`
      /* Тренер выпустил новую ссылку (REG-1): по прежней — только просьба запросить новую */
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
    /* Первые шаги — как «Getting started» у HWPO, задачи — из нашего продукта.
       Шаг отмечается по факту и только тем, что клиент сделал сам */
    const tasks = clFirstSteps();
    const nDone = tasks.filter(t => t[1]).length;
    const steps = nDone < tasks.length ? `<section class="card steps">
      <button class="sth" id="hidetasks" aria-expanded="${!clS.hideTasks}"><b>Первые шаги</b>${clI('down', clS.hideTasks ? '' : 'up')}<span>${nDone} / ${tasks.length}</span></button>
      <div class="prog"><i style="width:${nDone / tasks.length * 100}%"></i></div>
      ${clS.hideTasks ? '' : `<div class="tasks">${tasks.map(([t, ok, act, to, tab]) => `<div class="task${ok ? ' ok' : ''}">
        <i class="ck">${ok ? clI('check') : ''}</i><span>${clEsc(t)}</span>
        ${!ok && act ? `<button class="go" ${to === '@howto' ? 'data-howto' : `data-go="${to}"`}${tab ? ` data-tabgo="${tab}"` : ''}>${clEsc(act)} ${CL_ICON.next}</button>` : ''}</div>`).join('')}</div>`}
    </section>` : '';
    return `<header class="hhead">
      <div class="wmk">Тренерграм</div>
      <button class="mon" data-mcal aria-label="Выбрать дату">${MONTHS_N[d.getMonth()]} ${d.getFullYear()} ${clI('cal')}</button>
    </header>
    <div class="pg home">
      ${clFeeBar()}
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
        talkOf(bk).map(m => m.who === 'trainer'
          ? `<div class="msgt"><span class="av">${clEsc(TRAINER.ini)}</span><div class="bub"><s>${clEsc(TRAINER.n)} · ${clEsc(talkWhen(m))}</s><p>${clEsc(m.text)}</p></div></div>`
          : `<div class="msgc"><div class="bub"><p>${clEsc(m.text)}</p><s>${clEsc(talkWhen(m))}</s></div></div>`).join('');
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
        clBlockPm(b).length ? ['rec', 'Новый 1ПМ', 'trophy', clBlockPm(b).map(k => `<div class="recr">
            <span><b>${clEsc(clPmName(k))}</b><s>${pm[k] ? '1ПМ сейчас ' + clNum(pm[k]) + '\u00a0кг' : '1ПМ ещё нет'}</s></span>
            <label class="recin"><input inputmode="decimal" data-pmin="${k}" placeholder="${pm[k] ? clNum(pm[k]) : '1ПМ'}" aria-label="Новый 1ПМ, ${clEsc(clPmName(k))}"><i>кг</i></label>
            <button class="snd recok" data-pmset="${k}" aria-label="Записать рекорд" disabled>${clI('check')}</button></div>`).join('')] : null
      ].filter(Boolean);
      /* Вкладки: обсуждение, техника, результат, ПМ */
      const ents = clResEntries(b, pm, bk);
      if (ents.length) rows.splice(rows.findIndex(r => r[0] === 'rec') < 0 ? rows.length : rows.findIndex(r => r[0] === 'rec'), 0, ['res', 'Результат', 'clip', clResTab(ents, bk)]);
      const got = ents.length && ents.every(x => resRec(x.key));
      const tab = rows.some(r => r[0] === clS.open[bk + ':tab']) ? clS.open[bk + ':tab'] : '';
      /* Точка — в обсуждении есть сообщение тренера, а клиент его ещё не открывал */
      const nTr = (b.note ? 1 : 0) + talkOf(bk).filter(m => m.who === 'trainer').length;
      const has = { chat: nTr > 0 && clS.open[bk + ':seen'] !== nTr };
      return `<section class="blk${done ? ' done' : ''}">
        <div class="bh">
          <button class="bt" data-bopen="${bk}" aria-expanded="${open}"><b>${clEsc(clBlockName(b))}</b>${clI('down', open ? 'up' : '')}</button>
          <button class="ring${done ? ' on' : ''}" data-bdone="${bk}" aria-label="${done ? 'Снять отметку' : 'Отметить блок выполненным'}">${done ? clI('check') : ''}</button>
        </div>
        ${open ? `<div class="card bcard">
          <div class="segs">${clBlockBody(b, pm).map(h => `<div class="seg">${h}</div>`).join('')}</div>
          <div class="sect row">${rows.map(([id, t, ic]) => {
            /* иконка и короткая подпись в строку: Чат · Техника · Итог · ПМ; полное название — для VoiceOver */
            const dot = has[id] ? '<i class="dot" aria-label="новое"></i>' : '';
            return `<button class="${tab === id ? 'on' : ''}${id === 'res' && got ? ' got' : ''}" data-tab="${bk}:${id}" aria-expanded="${tab === id}" aria-label="${t}"><span class="sic">${clI(ic)}${dot}</span><span class="lb">${CL_TAB_SHORT[id]}</span></button>`; }).join('')}</div>
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
    if (x.blocks.length && feeLocked(clFeeC(), clDate)) return head + `<div class="pg wk">${cal}<p class="wdate">${clEsc(dateTx)}</p>${clFeeLock()}</div>${clTabs('home')}`;
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
    <em>${done ? clI('check') + 'Выполнено' : feeLocked(clFeeC(), x.date) ? clI('lock') + 'Оплата не внесена' : 'Открыть тренировку'} ${CL_ICON.next}</em>
  </button>`;
}

/* ═══════════ поведение ═══════════ */
const CL_UI_MOUNT = {
  tgopen(scr) {
    scr.addEventListener('click', e => {
      if (e.target.closest('[data-openbr]')) clToast(clOS() === 'android' ? 'Здесь откроется Chrome' : 'Здесь откроется Safari');
      if (e.target.closest('[data-copylink]')) { try { navigator.clipboard.writeText(TRAINER.invite); } catch (x) {} clToast('Ссылка скопирована'); }
    });
  },

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

  home(scr, sc, v) {
    /* Все первые шаги пройдены — один раз финал с достижением «Курс молодого бойца» */
    const st = clFirstSteps();
    /* Вид «start» на стенде засчитывает достижение по-настоящему — тренер видит событие в ленте */
    if (v === 'start' || (st.every(t => t[1]) && !clS.ach.start)) { if (!clS.ach.start) clAchGive(); clQueue(clAchShow); }
    /* Пропустил тренировку — при входе один раз «Серия прервалась» */
    clStreakLostCheck();
    scr.addEventListener('click', e => {
      const d = e.target.closest('[data-date]');
      if (d) { clDate = d.dataset.date; clRepaint(scr, 'home'); return; }
      const w = e.target.closest('[data-week]');
      if (w) { clDate = addDays(clDate, +w.dataset.week); clRepaint(scr, 'home'); return; }
      if (e.target.closest('#hidetasks')) { clS.hideTasks = !clS.hideTasks; clSave(); clRepaint(scr, 'home'); }
      /* «Внести» ведёт в профиль сразу на нужную вкладку; переход делает роутер */
      const tg = e.target.closest('[data-tabgo]'); if (tg) clProfOn = tg.dataset.tabgo;
      if (e.target.closest('[data-howto]')) clHowto();
      if (e.target.closest('[data-mcal]')) clMonthCal(date => { clDate = date; clRepaint(scr, 'home'); });
    });
  },

  workout(scr) {
    const key = clDayKey(clDate);
    scr.addEventListener('click', e => {
      /* «Записать» во вкладке «Результат» — все строки блока разом */
      const ra = e.target.closest('[data-rsaveall]');
      if (ra) { let n = 0; ra.parentElement.querySelectorAll('[data-rpan]').forEach(pan => { const r = {};
          pan.querySelectorAll('[data-rf]').forEach(i => { const v = +String(i.value || i.placeholder).replace(',', '.').trim(); if (String(i.value || i.placeholder).trim() !== '' && isFinite(v)) r[i.dataset.rf] = v; });
          /* Подходы (w0, r0, w1…) — в список {sets:[{w, r}]} */
          const si = Object.keys(r).filter(k => /^[wr]\d+$/.test(k)).map(k => +k.slice(1));
          const rec = si.length ? { sets: Array.from({ length: Math.max(...si) + 1 }, (_, i) => ({ w: r['w' + i] ?? null, r: r['r' + i] ?? null })) } : r;
          if (Object.keys(r).length) { resSet(pan.dataset.rpan, rec); n++; } });
        if (!n) { ra.parentElement.querySelector('[data-rf]').focus(); return; }
        clS.done[ra.dataset.rsaveall] = true; clSave(); clRepaint(scr, 'workout'); clToast('Результат записан'); return; }
      if (e.target.closest('.rent')) return;
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
        talkAdd(k, 'client', tx);
        clS.notes[k] = ''; clSave(); clRepaint(scr, 'workout'); return; }
      const mg = e.target.closest('[data-msg]');
      if (mg) { const k = mg.dataset.msg + ':msg'; clS.open[k] = clS.open[k] === false; clSave(); clRepaint(scr, 'workout'); return; }
      const tb = e.target.closest('[data-tab]');
      if (tb) { const [b, id] = tb.dataset.tab.split(':'); const k = b + ':tab'; clS.open[k] = clS.open[k] === id ? '' : id;
        if (id === 'chat') { const bl = blkParse(b), x = bl && clDayAt(bl.date).blocks[bl.bi];
          clS.open[b + ':seen'] = (x && x.note ? 1 : 0) + talkOf(b).filter(m => m.who === 'trainer').length; }
        clSave(); clRepaint(scr, 'workout'); return; }
      const r = e.target.closest('[data-row]');
      if (r) { const k = r.dataset.row; clS.open[k] = !clS.open[k]; clSave(); clRepaint(scr, 'workout'); return; }
      const x = e.target.closest('[data-ex]');
      if (x) { clTech(byId(x.dataset.ex)); return; }
      const ps = e.target.closest('[data-pmset]');
      if (ps) { const k = ps.dataset.pmset, inp = ps.parentElement.querySelector('[data-pmin]');
        const v = parseFloat(String(inp.value).replace(',', '.')); if (!(v > 0)) return;
        const pm = pmOf(CL_ME); (STATE.pmLog ||= []).push({ cid: CL_ME, k, v, prev: pm[k] || null, d: clDate }); pm[k] = v; (clS.pmh[k] ||= []).push([TODAY, v]);
        saveState(); clSave(); clRepaint(scr, 'workout'); if (!clAchFirst()) clToast('Рекорд записан — веса пересчитаны'); return; }
      /* Завершить — просто отметка и назад на главную; снять отметку — на месте */
      if (e.target.closest('#dayDone')) {
        if (clS.dayDone[key]) { delete clS.dayDone[key]; delete (STATE.ddone || {})[key]; saveState(); clSave(); clRepaint(scr, 'workout'); return; }
        const s0 = clStreak(); clS.dayDone[key] = true; (STATE.ddone ||= {})[key] = true; saveState(); clSave();
        /* Поверх главной по очереди: «Первая тренировка» (если первая), «Серия прервалась» (если перед
           этим был пропуск), момент серии, если она выросла (не выросла — отметили будущий день — тост),
           и «Курс молодого бойца», если это был последний шаг */
        const s1 = clStreak(); clAchFirst(); clStreakLostCheck();
        if (s1 > s0) clQueue(() => clStreakShow(s0, s1)); else clToast('Тренировка завершена');
        clGo('home'); }
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

/* ═══ Первые шаги и «Иконка на экране» ═══ */

/* Иконка приложения — знак из брендбука (mvp/brand/logo/trenergram-mark.svg):
   в схемах слайдшоу и в подсказке установки */
const CL_MARK = cls => `<svg class="${cls}" viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" rx="22.5" fill="#FC5200"/><path fill="#fff" d="M12 32H46V42H34V66L28 72H24V42H12Z"/><path fill="#fff" d="M52 32H62L71 50L80 32H90V72H81V49L73 64H69L61 49V72H52Z"/></svg>`;

/* Устройство: во фрейме стенда — класс рамки, на телефоне — по браузеру */
const clOS = () => { const h = document.documentElement.classList;
  return h.contains('f-android') ? 'android' : h.contains('f-iphone') ? 'ios' : /Android/i.test(navigator.userAgent) ? 'android' : 'ios'; };

/* [название, выполнено, кнопка, куда, вкладка профиля].
   Иконка — только в мобильном вебе: в приложении из стора её ставит магазин */
function clFirstSteps() {
  const st = [];
  if (clP.platform === 'web') st.push(['Добавить иконку на экран', clP.where === 'pwa', 'Как?', '@howto']);
  st.push(
    ['Внести рекорды', Object.values(clS.pmh).some(a => a && a.length), 'Внести', 'profile', 'pr'],
    ['Внести замеры', clS.meas.length > 0, 'Внести', 'profile', 'meas'],
    ['Поставить фото профиля', !!clS.photo, 'Поставить', 'profile', 'pr'],
    ['Выполнить первую тренировку', Object.keys(clS.dayDone).length > 0, 'Начать', 'workout']);
  return st;
}

/* Схемы экранов для слайдшоу: не скриншоты, а упрощённый телефон —
   страница скелетоном, системные кнопки, нужная подсвечена (.hl) */
function clMock(k) {
  const pg = '<div class="mpg"><i></i><i></i><i></i><b></b></div>';
  const host = 'trenergram.app';
  const menu = (rows, cls) => `<div class="mmenu ${cls}">${rows.map(([t, ic, hl]) => `<div class="${hl ? 'hl' : ''}"><span>${t}</span>${ic ? clI(ic) : ''}</div>`).join('')}</div>`;
  const dots3 = '<svg viewBox="0 0 24 24" class="i"><circle cx="6" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="18" cy="12" r="1.6"/></svg>';
  const dotsV = '<svg viewBox="0 0 24 24" class="i"><circle cx="12" cy="6" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="12" cy="18" r="1.6"/></svg>';
  const appic = CL_MARK('mapp');
  switch (k) {
    /* iOS 26 Safari: снизу «назад», адрес, «⋯»; «Поделиться» — в меню «⋯» */
    case 'ios-menu': return pg + menu([['Поделиться', 'share', 1], ['Добавить в закладки', 'book'], ['Найти на странице', 'search']], 'br') +
      `<div class="msaf"><span class="rb">${clI('left')}</span><span class="pill">${host}</span><span class="rb hl">${dots3}</span></div>`;
    case 'ios-share': return pg + `<div class="mdim"></div><div class="msh"><div class="mhd">${appic}<span><b>Тренерграм</b><s>${host}</s></span></div>
      <div class="mapps"><i></i><i></i><i></i><i></i><i></i></div>
      <div class="mlist"><div><span>Скопировать</span>${clI('link')}</div><div><span>Добавить в Избранное</span>${clI('book')}</div><div class="hl"><span>На экран «Домой»</span>${clI('addsq')}</div></div></div>`;
    case 'ios-add': return `<div class="mnav"><span>Отменить</span><b>На экран «Домой»</b><span class="hl">Добавить</span></div>
      <div class="mcard">${appic}<span><b>Тренерграм</b><s>${host}</s></span></div>
      <div class="mcard row"><span>Открывать как веб-приложение</span><i class="tgl on"></i></div>`;
    case 'home': return `<div class="mhome">${Array.from({ length: 12 }, (_, i) => i === 6
      ? `<span class="me hl">${appic}<s>Тренерграм</s></span>` : '<span><i></i><s></s></span>').join('')}</div>`;
    /* Android Chrome: адрес и «⋮» сверху */
    case 'and-menu': return `<div class="mchr"><span class="pill">${host}</span><span class="rb hl">${dotsV}</span></div>` + pg +
      menu([['Новая вкладка', 'plus'], ['История', 'cal'], ['Добавить на гл. экран', 'addsq', 1], ['Настройки', 'gear']], 'tr');
    case 'and-install': return pg + `<div class="mdim"></div><div class="mdlg">${appic}<b>Установить приложение?</b><s>Тренерграм · ${host}</s>
      <div class="mbtns"><span>Отмена</span><span class="hl">Установить</span></div></div>`;
    /* Встроенный браузер Telegram: сверху «Закрыть», заголовок, меню */
    case 'tg-ios': case 'tg-and': { const a = k === 'tg-and';
      return `<div class="mtg"><span>${a ? clI('x') : 'Закрыть'}</span><b>Тренерграм<s>${host}</s></b><span class="rb hl">${a ? dotsV : dots3}</span></div>` + pg +
        menu([[a ? 'Открыть в браузере' : 'Открыть в Safari', 'compass', 1], ['Скопировать ссылку', 'link'], ['Поделиться', 'share']], 'tr tgm'); }
  }
  return pg;
}

/* ═══ Достижения ═══
   Три значка, только эмоциональные — ничего не открывают и не дают:
   «Курс молодого бойца» — за все первые шаги, «Первый рекорд» и «Первый
   замер» — за первые рекорд и замер, которые клиент внёс сам. Значок — гиря
   на шестиграннике: новобранец в пилотке, гиря в короне, гиря с рулеткой.
   Факт уходит в общее с кабинетом состояние: у тренера в ленте событие
   «Первые шаги». Открытку со значком можно отправить друзьям. */
/* Общее у значков: шестигранник, ручка и корпус гири, лента с надписью */
const CL_HEX = id => `<defs><linearGradient id="hx${id}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FF7A1F"/><stop offset=".5" stop-color="#FC5200"/><stop offset="1" stop-color="#E24400"/></linearGradient>
  <radialGradient id="kb${id}" cx=".35" cy=".3" r=".8"><stop offset="0" stop-color="#4A403B"/><stop offset="1" stop-color="#1E1A18"/></radialGradient></defs>
  <path d="M60 5 108 32.5v55L60 115 12 87.5v-55z" fill="url(#hx${id})"/>
  <path d="M60 15 99 37.5v45L60 105 21 82.5v-45z" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="2"/>`;
const CL_HEX_OFF = `<path d="M60 5 108 32.5v55L60 115 12 87.5v-55z" fill="var(--c-fill2)"/>
  <path d="M60 15 99 37.5v45L60 105 21 82.5v-45z" fill="none" stroke="var(--line2)" stroke-width="2"/>`;
const CL_KB = id => `<path d="M44 58c-6-30 38-30 32 0" fill="none" stroke="#1E1A18" stroke-width="9" stroke-linecap="round"/>
  <path d="M47 54c-3-20 26-22 26-4" fill="none" stroke="#5A4E48" stroke-width="2" stroke-linecap="round" opacity=".7"/>
  <circle cx="60" cy="76" r="27" fill="url(#kb${id})"/>`;
const CL_SWEAT = '<path class="sweat" d="M29 47c3 5 3 8 0 9.5-3-1.5-3-4.5 0-9.5z" fill="#9BDCFF" stroke="#1E1A18" stroke-width="1"/>';
const CL_ARM_L = '<path d="M35 80c-8 1-10 8-6 12" fill="none" stroke="#1E1A18" stroke-width="6" stroke-linecap="round"/>';
const CL_RIBBON = (word, dark, light, ink) => `<path d="M26 102l6-4h56l6 4-6 4H32z" fill="${dark}" stroke="#1E1A18" stroke-width="1.4" stroke-linejoin="round"/>
  <path d="M34 97h52v10H34z" fill="${light}" stroke="#1E1A18" stroke-width="1.4"/>
  <text x="60" y="105.2" text-anchor="middle" font-family="Montserrat,Arial Black,sans-serif" font-weight="900" font-size="8.5" letter-spacing="${word.length > 3 ? 1 : 1.5}" fill="${ink}">${word}</text>`;
/* «Курс молодого бойца»: гиря-новобранец — пилотка набекрень, глаза вразбег, отдаёт честь, потеет */
const CL_KMB = id => `${CL_HEX(id)}
  ${CL_SWEAT}
  ${CL_ARM_L}
  ${CL_KB(id)}
  <g transform="rotate(-12 60 54)"><path d="M40 58c5-11 35-12 41-1l-1.5 4c-11-4-27-4-38 1.5z" fill="#7A8A3E" stroke="#1E1A18" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M60 53.5l1 2.2 2.4.3-1.8 1.6.5 2.4-2.1-1.2-2.1 1.2.5-2.4-1.8-1.6 2.4-.3z" fill="#FF3B30" stroke="#1E1A18" stroke-width=".5"/></g>
  <circle cx="50" cy="71" r="7.5" fill="#fff" stroke="#1E1A18" stroke-width="1.2"/>
  <circle cx="70" cy="70" r="8.5" fill="#fff" stroke="#1E1A18" stroke-width="1.2"/>
  <g class="pups"><circle cx="53.5" cy="73.5" r="3.3" fill="#111"/><circle cx="66" cy="67.5" r="3.6" fill="#111"/></g>
  <circle cx="43" cy="82" r="3.5" fill="#FF7A8A" opacity=".75"/><circle cx="78" cy="81" r="3.5" fill="#FF7A8A" opacity=".75"/>
  <path d="M48 81c4 13 20 13 24 0z" fill="#7A1F1F" stroke="#1E1A18" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M50 81.3h20l-1 3H51z" fill="#fff"/><ellipse cx="60" cy="88.5" rx="5" ry="2.6" fill="#FF7A8A"/>
  <g class="arm"><path d="M85 80c10-6 9-17 1-24" fill="none" stroke="#1E1A18" stroke-width="6" stroke-linecap="round"/>
    <path d="M78.5 54l10-3 1.4 4.6-10 3z" fill="#1E1A18" stroke="#1E1A18" stroke-width="2" stroke-linejoin="round"/></g>
  ${CL_RIBBON('КМБ', '#7A8A3E', '#8E9F49', '#fff')}`;
/* «Первый рекорд»: гиря в короне набекрень, зажмурилась от счастья, кулак вверх, вокруг искры */
const CL_PRB = id => `${CL_HEX(id)}
  ${CL_ARM_L}
  <g class="arm"><path d="M85 79c9-5 11-14 8-24" fill="none" stroke="#1E1A18" stroke-width="6" stroke-linecap="round"/><circle cx="93" cy="52" r="5.5" fill="#1E1A18"/></g>
  ${CL_KB(id)}
  <g transform="rotate(-10 60 52)"><path d="M45 59l-2-14 8.5 6.5L60 41l8.5 10.5L77 45l-2 14z" fill="#FFC531" stroke="#1E1A18" stroke-width="1.6" stroke-linejoin="round"/>
    <path d="M45.6 55h28.8" stroke="#1E1A18" stroke-width="1.2"/><circle cx="60" cy="50" r="2.2" fill="#FF3B30" stroke="#1E1A18" stroke-width=".6"/></g>
  <path d="M44 72q6-7 12 0M64 71q6-7 12 0" fill="none" stroke="#fff" stroke-width="3.4" stroke-linecap="round"/>
  <circle cx="43" cy="80" r="3.5" fill="#FF7A8A" opacity=".75"/><circle cx="78" cy="79" r="3.5" fill="#FF7A8A" opacity=".75"/>
  <path d="M48 79c4 13 20 13 24 0z" fill="#7A1F1F" stroke="#1E1A18" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M50 79.3h20l-1 3H51z" fill="#fff"/><ellipse cx="60" cy="86.5" rx="5" ry="2.6" fill="#FF7A8A"/>
  <path class="spark" d="M30 34l1.6 4.4 4.4 1.6-4.4 1.6L30 46l-1.6-4.4-4.4-1.6 4.4-1.6z" fill="#fff"/>
  <path class="spark" d="M84 28l1 2.8 2.8 1-2.8 1-1 2.8-1-2.8-2.8-1 2.8-1z" fill="#fff"/>
  ${CL_RIBBON('РЕКОРД', '#D99A00', '#F5B91E', '#1E1A18')}`;
/* «Первый замер»: гиря обмотана рулеткой по поясу, косится на деления, держит кончик ленты и потеет */
const CL_TICKS = Array.from({ length: 15 }, (_, i) => { const x = 38 + i * 3, t = (x - 33.5) / 53;
  return `M${x} ${(84.8 + 24 * t * (1 - t)).toFixed(1)}v${i % 2 ? 2.2 : 3.6}`; }).join('');
const CL_MSB = id => `${CL_HEX(id)}
  ${CL_SWEAT}
  ${CL_ARM_L}
  <path d="M84 70c8 3 12 10 12 19" fill="none" stroke="#1E1A18" stroke-width="6" stroke-linecap="round"/>
  ${CL_KB(id)}
  <circle cx="50" cy="66" r="7.5" fill="#fff" stroke="#1E1A18" stroke-width="1.2"/>
  <circle cx="70" cy="66" r="7.5" fill="#fff" stroke="#1E1A18" stroke-width="1.2"/>
  <g class="pups"><circle cx="51.5" cy="69.5" r="3.3" fill="#111"/><circle cx="71.5" cy="69.5" r="3.3" fill="#111"/></g>
  <circle cx="42" cy="77" r="3.2" fill="#FF7A8A" opacity=".75"/><circle cx="78" cy="77" r="3.2" fill="#FF7A8A" opacity=".75"/>
  <ellipse cx="60" cy="78.5" rx="3.2" ry="3.8" fill="#7A1F1F" stroke="#1E1A18" stroke-width="1.2"/>
  <path d="M33.5 84Q60 96 86.5 84L84.5 91Q60 101 35.5 91z" fill="#FFD23F" stroke="#1E1A18" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="${CL_TICKS}" stroke="#1E1A18" stroke-width=".9"/>
  <path d="M86 84.5l11 5.5-2 5-10.5-4.5z" fill="#FFD23F" stroke="#1E1A18" stroke-width="1.2" stroke-linejoin="round"/>
  <circle cx="96.5" cy="91.5" r="4.6" fill="#1E1A18"/>
  ${CL_RIBBON('ЗАМЕР', '#2F64C8', '#3D7BE0', '#fff')}`;
/* «Первая тренировка»: гиря качает гантель на бицепс, косится на неё, язык набок от усердия, пот градом */
const CL_WKB = id => `${CL_HEX(id)}
  ${CL_SWEAT}
  <path class="sweat" d="M24 66c2.4 4 2.4 6.4 0 7.6-2.4-1.2-2.4-3.6 0-7.6z" fill="#9BDCFF" stroke="#1E1A18" stroke-width="1"/>
  ${CL_ARM_L}
  <g class="arm"><path d="M85 79c9-4 12-12 10-22" fill="none" stroke="#1E1A18" stroke-width="6" stroke-linecap="round"/>
    <path d="M84 53h22" stroke="#1E1A18" stroke-width="3" stroke-linecap="round"/>
    <rect x="82" y="46" width="5" height="14" rx="1.5" fill="#5A4E48" stroke="#1E1A18" stroke-width="1.2"/>
    <rect x="103" y="46" width="5" height="14" rx="1.5" fill="#5A4E48" stroke="#1E1A18" stroke-width="1.2"/>
    <circle cx="95" cy="54" r="5" fill="#1E1A18"/></g>
  ${CL_KB(id)}
  <circle cx="50" cy="70" r="7.5" fill="#fff" stroke="#1E1A18" stroke-width="1.2"/>
  <circle cx="70" cy="70" r="7.5" fill="#fff" stroke="#1E1A18" stroke-width="1.2"/>
  <g class="pups"><circle cx="53" cy="67" r="3.3" fill="#111"/><circle cx="73" cy="67" r="3.3" fill="#111"/></g>
  <circle cx="42" cy="80" r="3.4" fill="#FF7A8A" opacity=".75"/><circle cx="79" cy="79" r="3.4" fill="#FF7A8A" opacity=".75"/>
  <path d="M50 81h20c-1 6-5 8-10 8s-9-2-10-8z" fill="#7A1F1F" stroke="#1E1A18" stroke-width="1.2" stroke-linejoin="round"/>
  <path d="M51 81.2h18v2.4H51z" fill="#fff"/>
  <path d="M63 85c1 5 4 8 7 7s3-5 1-8z" fill="#FF7A8A" stroke="#1E1A18" stroke-width="1"/>
  ${CL_RIBBON('СТАРТ', '#B0262B', '#E0393E', '#fff')}`;
/* Значки: название, рисунок, подпись закрытого и подсказка по тапу, текст
   финала, открытка (название в две строки и что сделано) и подпись к ней */
const CL_ACH = {
  start: { name: 'Курс молодого бойца', art: CL_KMB, sub: 'первые шаги', tip: 'Пройдите первые шаги на главной',
    tx: 'Все первые шаги пройдены — вы в строю! Значок уже в профиле, а тренер увидит это в своей ленте.',
    card: ['КУРС МОЛОДОГО', 'БОЙЦА'], did: she => (she ? 'прошла' : 'прошёл') + ' первые шаги', file: 'kmb',
    share: she => `${she ? 'Прошла' : 'Прошёл'} «Курс молодого бойца» в Тренерграм 💪` },
  wk: { name: 'Первая тренировка', art: CL_WKB, sub: '', tip: 'Завершите тренировку — кнопка внизу экрана тренировки',
    tx: 'Начало положено! Значок уже в профиле, а тренер увидит это в своей ленте.',
    card: ['ПЕРВАЯ', 'ТРЕНИРОВКА'], did: she => (she ? 'завершила' : 'завершил') + ' первую тренировку', file: 'trenirovka',
    share: () => 'Моя первая тренировка в Тренерграм 💪' },
  pr: { name: 'Первый рекорд', art: CL_PRB, sub: '', tip: 'Внесите рекорд в профиле или прямо в тренировке',
    tx: 'Веса в тренировках теперь считаются от вашего рекорда. Значок уже в профиле, а тренер увидит это в своей ленте.',
    card: ['ПЕРВЫЙ', 'РЕКОРД'], did: she => (she ? 'внесла' : 'внёс') + ' первый рекорд', file: 'rekord',
    share: () => 'Мой первый рекорд в Тренерграм 💪' },
  meas: { name: 'Первый замер', art: CL_MSB, sub: '', tip: 'Добавьте замер во вкладке «Замеры»',
    tx: 'Первая точка на графике — со следующим замером появится динамика. Значок уже в профиле, а тренер увидит это в своей ленте.',
    card: ['ПЕРВЫЙ', 'ЗАМЕР'], did: she => (she ? 'сделала' : 'сделал') + ' первый замер', file: 'zamer',
    share: () => 'Мой первый замер в Тренерграм 💪' }
};
const CL_BADGE = (id, cls, lock) => `<svg class="${cls}" viewBox="0 0 120 120" aria-hidden="true">${lock
  ? `${CL_HEX_OFF}
     <g fill="none" stroke="var(--tx4)" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"><rect x="44" y="56" width="32" height="24" rx="4"/><path d="M50 56v-7a10 10 0 0 1 20 0v7"/></g>`
  : CL_ACH[id].art(cls)}</svg>`;
function clAchGive(id = 'start') {
  clS.ach[id] = TODAY; clSave();
  if (id === 'start') (STATE.steps ||= {})[CL_ME] = { d: TODAY };
  else ((STATE.ach ||= {})[CL_ME] ||= {})[id] = TODAY;
  saveState();
}
/* Первые тренировка, рекорд и замер засчитываются, как шаги на главной, только
   за то, что клиент сделал сам. Один раз — сразу после; true — финал показан */
const CL_ACH_MET = { wk: () => Object.keys(clS.dayDone).length > 0, pr: () => Object.values(clS.pmh).some(a => a && a.length), meas: () => clS.meas.length > 0 };
function clAchFirst() {
  const ids = Object.keys(CL_ACH_MET).filter(k => !clS.ach[k] && CL_ACH_MET[k]());
  ids.forEach(id => { clAchGive(id); clQueue(() => clAchShow(id)); });
  return ids.length > 0;
}
/* Полноэкранные моменты — финалы достижений и серия — по одному, в порядке очереди */
const clQ = [];
let clQt = 0;
function clQueue(fn) { clQ.push(fn); if (!clQt) clQt = setTimeout(clQRun, 300); }
function clQRun() {
  if (document.querySelector('.achw')) { clQt = setTimeout(clQRun, 300); return; }
  const fn = clQ.shift(); if (fn) fn();
  clQt = clQ.length ? setTimeout(clQRun, 300) : 0;
}
/* Финал: затемнение, конфетти, значок влетает с поворотом, гиря двигается;
   «Поделиться» — главная кнопка, «Отлично» — закрыть */
function clAchShow(id = 'start') {
  if (document.querySelector('.achw')) return;
  const a = CL_ACH[id];
  const cols = ['#FC5200', '#FF7A1F', '#FFB27A', '#8E9F49', '#fff'];
  const bits = Array.from({ length: 36 }, (_, i) => `<i style="left:${(i * 37) % 100}%;background:${cols[i % 5]};animation-delay:${(i % 9) * 60 + 150}ms;--r:${(i * 53) % 360}deg;--x:${((i * 29) % 60) - 30}px;--d:${1500 + (i * 71) % 900}ms"></i>`).join('');
  const w = document.createElement('div');
  w.className = 'achw';
  w.innerHTML = `<div class="achbg"></div><div class="confetti" aria-hidden="true">${bits}</div>
    <div class="achc" role="dialog" aria-label="Достижение «${a.name}»">
      <div class="achb">${CL_BADGE(id, 'achsvg')}<span class="shine"></span></div>
      <em>Достижение</em>
      <h2>${a.name}</h2>
      <p>${a.tx}</p>
      <button class="btn pri" data-achshare>${clI('share')}Поделиться</button>
      <button class="lnk achok" data-achok>Отлично</button>
    </div>`;
  const close = () => { w.classList.add('out'); setTimeout(() => w.remove(), 260); };
  w.addEventListener('click', e => { if (e.target.closest('[data-achok]')) close(); if (e.target.closest('[data-achshare]')) clAchShare(a); });
  document.getElementById('dev').appendChild(w);
  try { navigator.vibrate && navigator.vibrate([30, 60, 40]); } catch (x) {}
}
/* Открытка 1080×1350 (формат поста и сторис): значок, название, кто и у какого
   тренера. Рисуем на canvas, отдаём системному «Поделиться» картинкой;
   где файлом поделиться нельзя — показываем открытку и сохраняем её */
function clAchCard(a) {
  return new Promise(res => {
    const W = 1080, H = 1350, c = document.createElement('canvas'); c.width = W; c.height = H;
    const g = c.getContext('2d'), p = clProf(), she = p.sex === 'ж';
    const bg = g.createRadialGradient(W / 2, 560, 60, W / 2, 560, 900); bg.addColorStop(0, '#3A2418'); bg.addColorStop(1, '#141110');
    g.fillStyle = bg; g.fillRect(0, 0, W, H);
    const img = new Image();
    img.onload = () => {
      g.save(); g.shadowColor = 'rgba(252,82,0,.55)'; g.shadowBlur = 90; g.drawImage(img, W / 2 - 330, 170, 660, 660); g.restore();
      g.textAlign = 'center'; g.fillStyle = '#FF9A5A'; g.font = '800 40px Montserrat, Inter, sans-serif';
      g.fillText(a.kicker || 'ДОСТИЖЕНИЕ', W / 2, 108);
      g.fillStyle = '#fff'; g.font = '900 84px Montserrat, Inter, sans-serif';
      g.fillText(a.card[0], W / 2, 935); g.fillText(a.card[1], W / 2, 1025);
      g.fillStyle = 'rgba(255,255,255,.75)'; g.font = '500 40px Inter, sans-serif';
      g.fillText(`${p.first || 'Я'} ${a.did(she)} в Тренерграм`, W / 2, 1105);
      g.fillText('Тренер — ' + TRAINER.n, W / 2, 1160);
      g.fillStyle = '#FC5200'; g.fillRect(W / 2 - 60, 1218, 120, 6);
      g.fillStyle = '#fff'; g.font = '900 44px Montserrat, Inter, sans-serif'; g.fillText('ТРЕНЕРГРАМ', W / 2, 1290);
      c.toBlob(b => res({ blob: b, url: URL.createObjectURL(b) }), 'image/jpeg', .92);
    };
    img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 120 120">${a.art('card')}</svg>`);
  });
}
async function clAchShare(ach) {
  const btn = document.querySelector('[data-achshare]');
  if (btn) { if (btn.disabled) return; btn.disabled = true; btn.lastChild.textContent = 'Готовим открытку…'; }
  const { blob, url } = await clAchCard(ach), she = clProf().sex === 'ж';
  if (btn) { btn.disabled = false; btn.lastChild.textContent = 'Поделиться'; }
  const text = ach.share(she);
  const file = new File([blob], ach.file + '-trenergram.jpg', { type: 'image/jpeg' });
  try { if (navigator.canShare && navigator.canShare({ files: [file] })) { await navigator.share({ files: [file], text }); return; } } catch (e) { if (e.name === 'AbortError') return; }
  /* Системного «Поделиться» картинкой нет (стенд на компьютере) — рисуем, как оно
     выглядит на телефоне: открытка сверху, ниже приложения. Скачивать ничего не нужно */
  const apps = [['Telegram', '#2AABEE', 'tg'], ['WhatsApp', '#25D366', 'wa'], ['ВКонтакте', '#0077FF', 'vk'], ['Instagram', 'linear-gradient(45deg,#F9CE34,#EE2A7B,#6228D7)', 'ig'], ['Ещё', 'var(--c-fill2)', 'more']];
  const w = document.createElement('div');
  w.className = 'shw achsh';
  w.innerHTML = `<div class="shbg" data-x></div><div class="sheet" role="dialog" aria-label="Поделиться"><i class="grab"></i>
    <div class="shp"><img class="achcard" src="${url}" alt="Открытка «${ach.name}»"><span><b>${clEsc(text)}</b><s>Открытка · JPG</s></span></div>
    <div class="shapps">${apps.map(([n, bg, k]) => `<button data-app="${n}"><i style="background:${bg}">${k === 'more' ? clI('plus') : n[0]}</i><span>${n}</span></button>`).join('')}</div>
    <button class="lnk" data-x>Отмена</button></div>`;
  const close = () => { w.classList.add('out'); setTimeout(() => w.remove(), 220); };
  w.addEventListener('click', e => { const a = e.target.closest('[data-app]');
    if (a) { close(); clToast(a.dataset.app === 'Ещё' ? 'Здесь — остальные приложения телефона' : 'Открытка отправлена в ' + a.dataset.app); return; }
    if (e.target.closest('[data-x]')) close(); });
  document.getElementById('dev').appendChild(w);
}

/* ═══ Серия ═══
   Тренировки подряд: каждая завершённая — +1, пропущенная обнуляет. Сегодняшняя,
   пока не завершена, серию не рвёт; закрытая из-за оплаты — тоже: сделать её
   было нельзя. Отметки — те же, что в календаре клиента.
   Всё считается по истории отметок: текущая серия, сорвавшиеся (длина и
   пропуск, который её оборвал) и лучшая — рекорд не хранится отдельно */
function clStreakRuns() {
  const p = program(clMe().prog), f = clFeeC(), runs = [];
  let n = 0;
  for (let d = p ? p.start : TODAY; p && d <= TODAY; d = addDays(d, 1)) {
    if (!clDayAt(d).blocks.length) continue;
    if (clS.dayDone[clDayKey(d)]) n++;
    else if (d < TODAY && !feeLocked(f, d)) { if (n) runs.push({ n, miss: d }); n = 0; }
  }
  return { cur: n, runs, prev: Math.max(0, ...runs.map(r => r.n)) };
}
const clStreak = () => clStreakRuns().cur;
/* Рубежи серии: 3, 7, 14, 30, 50, 100, дальше каждые 50 */
const CL_STK_MS = [3, 7, 14, 30, 50, 100];
const clStkPrev = n => n >= 100 ? Math.floor(n / 50) * 50 : [...CL_STK_MS].reverse().find(m => m <= n) || 0;
const clStkNext = n => n >= 100 ? clStkPrev(n) + 50 : CL_STK_MS.find(m => m > n);
const clStkWord = n => plural3(n, 'тренировка', 'тренировки', 'тренировок');
/* Цитаты момента серии, когда она продолжается, — пул из 50, про упорство,
   дисциплину и движение вперёд; о неудачах — отдельно, для «Серия прервалась». Только с надёжным авторством: цитаты, которые принято ошибочно
   приписывать (Конфуцию, Черчиллю, Аристотелю), не берём; народное —
   подписано пословицей. Переводы свои, короткие */
const CL_QUOTES = [
  ['Путь в тысячу ли начинается с первого шага', 'Лао-цзы'],
  ['Побеждающий других силён, побеждающий себя — могуществен', 'Лао-цзы'],
  ['Девятиэтажная башня начинается с горстки земли', 'Лао-цзы'],
  ['Капля долбит камень', 'Овидий'],
  ['Терпи и крепись: эта боль когда-нибудь принесёт тебе пользу', 'Овидий'],
  ['Последние три-четыре повторения — вот что заставляет мышцы расти', 'Арнольд Шварценеггер'],
  ['Предел — только в голове', 'Арнольд Шварценеггер'],
  ['Жизнь — как езда на велосипеде: чтобы сохранить равновесие, нужно двигаться', 'Альберт Эйнштейн'],
  ['Пришёл, увидел, победил', 'Юлий Цезарь'],
  ['Упорный труд побеждает всё', 'Вергилий'],
  ['Ни один человек не ограничен', 'Элиуд Кипчоге'],
  ['Только дисциплинированные по-настоящему свободны', 'Элиуд Кипчоге'],
  ['Нет лёгкого пути от земли к звёздам', 'Сенека'],
  ['Мы не решаемся не потому, что трудно, — трудно потому, что не решаемся', 'Сенека'],
  ['Смелым помогает судьба', 'Теренций'],
  ['Пока мы откладываем, жизнь проходит мимо', 'Сенека'],
  ['Мы чаще страдаем в воображении, чем в действительности', 'Сенека'],
  ['Власть над собой — высшая власть', 'Сенека'],
  ['Поехали!', 'Юрий Гагарин'],
  ['Не можешь лететь — беги, не можешь бежать — иди, не можешь идти — ползи, но двигайся вперёд', 'Мартин Лютер Кинг'],
  ['Ты промахиваешься во всех бросках, которых не делаешь', 'Уэйн Гретцки'],
  ['Пределов нет — есть плато, и на них нельзя останавливаться', 'Брюс Ли'],
  ['Спеши медленно', 'Октавиан Август'],
  ['Сила не в физических возможностях, а в несгибаемой воле', 'Махатма Ганди'],
  ['Думаете вы, что можете, или что не можете, — вы правы', 'Генри Форд'],
  ['Ни дня без строчки', 'Плиний Старший'],
  ['Хорошо сделанное лучше хорошо сказанного', 'Бенджамин Франклин'],
  ['Кто начал, тот наполовину сделал', 'Гораций'],
  ['Победить себя — первая и лучшая из побед', 'Платон'],
  ['Ничто великое не создаётся вдруг', 'Эпиктет'],
  ['Сначала скажи себе, кем хочешь быть, а потом делай то, что нужно', 'Эпиктет'],
  ['Сделал дело — гуляй смело', 'Русская пословица'],
  ['Хватит рассуждать, каким должен быть хороший человек. Будь им', 'Марк Аврелий'],
  ['Недостаточно знать — надо применять. Недостаточно хотеть — надо делать', 'Иоганн Вольфганг Гёте'],
  ['Лучшее — враг хорошего', 'Вольтер'],
  ['В здоровом теле — здоровый дух', 'Ювенал'],
  ['Главное в жизни — не победа, а борьба', 'Пьер де Кубертен'],
  ['Быстрее, выше, сильнее', 'Олимпийский девиз'],
  ['Повторение — мать учения', 'Латинская пословица'],
  ['Через тернии — к звёздам', 'Латинское выражение'],
  ['Упражнение создаёт мастерство', 'Латинская пословица'],
  ['Терпение и труд всё перетрут', 'Русская пословица'],
  ['Дорогу осилит идущий', 'Пословица'],
  ['Тише едешь — дальше будешь', 'Русская пословица'],
  ['Без труда не выловишь и рыбку из пруда', 'Русская пословица'],
  ['Глаза боятся, а руки делают', 'Русская пословица'],
  ['Москва не сразу строилась', 'Русская пословица'],
  ['Не боги горшки обжигают', 'Русская пословица'],
  ['Лиха беда начало', 'Русская пословица'],
  ['Не откладывай на завтра то, что можно сделать сегодня', 'Пословица']
];
/* После каждой завершённой тренировки — случайная цитата, которой этот клиент
   ещё не видел. Показанные помнит аккаунт (в прототипе — состояние клиента:
   qSeen и qLast для основного пула, qlSeen и qlLast — для «Серия прервалась»;
   в продукте — сервер). Весь пул показан — новый круг, и последняя первой не
   выпадет. Тап по серии в профиле новой цитаты не тратит — та же */
function clQuoteNext(pool = CL_QUOTES, key = 'q') {
  const seen = new Set(clS[key + 'Seen'] ||= []), last = clS[key + 'Last'];
  let left = pool.map((_, i) => i).filter(i => !seen.has(i));
  if (!left.length) { clS[key + 'Seen'] = []; left = pool.map((_, i) => i).filter(i => i !== last); }
  const i = left[Math.floor(Math.random() * left.length)];
  clS[key + 'Seen'].push(i); clS[key + 'Last'] = i; clSave();
  return pool[i];
}
const clQuoteLast = () => CL_QUOTES[clS.qLast ?? 0];

/* Огонёк серии — пламя с лицом, обведено, как гири. На 1–2 тренировках —
   простой огонёк; с каждым рубежом крупнее, качается сильнее и обрастает
   снаряжением: 3 — руки с бицепсами, 7 — бицепсы больше и повязка на лбу,
   14 — тёмные очки, 30 — золотая цепь с гирькой, 50 — плащ, 100 — корона.
   Пока серии нет — серый и спит. Новую ступень огонёк получает эволюцией
   в момент рубежа (clStreakShow) */
const clFireT = n => CL_STK_MS.filter(m => n >= m).length;
const CL_FIRE_K = [.84, .9, .94, .98, 1.02, 1.06, 1.1];
const CL_FIRE_PATH = 'M60 12c6 16 30 26 30 54 0 19-13 34-30 34S30 85 30 66c0-14 7-24 16-30-1 9 2 15 8 18-3-15 0-29 6-42z';
/* Рука с бицепсом — левая, правая зеркальна; плечо прячется за пламенем */
const CL_FIRE_ARM = `<path d="M36 80H14q-6 0-6-6V54q0-10 8-10 6 1 5 8l-1 10q6-8 13-2 4 4 3 8z" fill="#FF8A2A" stroke="#1E1A18" stroke-width="1.8" stroke-linejoin="round"/>
  <path d="M24 60q4-3 8 0" fill="none" stroke="#FFD9A0" stroke-width="1.6" stroke-linecap="round"/>
  <circle cx="14.5" cy="48" r="6" fill="#FF8A2A" stroke="#1E1A18" stroke-width="1.8"/>`;
const CL_FIRE = (id, n, k) => {
  const t = clFireT(n);
  if (!n) return `<g transform="translate(60 100) scale(${k}) translate(-60 -100)">
    <path d="${CL_FIRE_PATH}" fill="var(--line2)" stroke="var(--tx4)" stroke-width="2" stroke-linejoin="round"/>
    <path d="M50 74q3 3 6 0M64 74q3 3 6 0M56 83h8" fill="none" stroke="var(--tx4)" stroke-width="2.2" stroke-linecap="round"/></g>`;
  const arm = `<g class="acc armw"><g transform="translate(36 78) scale(${t >= 2 ? 1 : .78}) translate(-36 -78)"><g class="flex">${CL_FIRE_ARM}</g></g></g>`;
  return `<g transform="translate(60 100) scale(${k}) translate(-60 -100)"><g class="sway">
    <defs><linearGradient id="fo${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFB23F"/><stop offset=".55" stop-color="#FF6A1A"/><stop offset="1" stop-color="#E23A00"/></linearGradient>
      <linearGradient id="fc${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#FFF4C2"/><stop offset="1" stop-color="#FFD23F"/></linearGradient></defs>
    ${t >= 5 ? `<g class="acc capew"><path class="cape" d="M38 58Q60 50 82 58L98 104Q60 110 22 104z" fill="#C8102E" stroke="#1E1A18" stroke-width="1.6" stroke-linejoin="round"/></g>` : ''}
    ${t >= 1 ? `${arm}<g transform="matrix(-1 0 0 1 120 0)">${arm}</g>` : ''}
    <path class="fo" d="${CL_FIRE_PATH}" fill="url(#fo${id})" stroke="#1E1A18" stroke-width="2" stroke-linejoin="round"/>
    <path class="fc" d="M60 44c4 10 17 17 17 34 0 11-8 19-17 19s-17-8-17-19c0-9 5-15 10-18 0 6 2 9 5 10-1-9 0-17 2-26z" fill="url(#fc${id})"/>
    <circle cx="53" cy="72" r="5.5" fill="#fff" stroke="#1E1A18" stroke-width="1.2"/><circle cx="67" cy="72" r="5.5" fill="#fff" stroke="#1E1A18" stroke-width="1.2"/>
    <g class="pups"><circle cx="54" cy="71" r="2.6" fill="#111"/><circle cx="68" cy="71" r="2.6" fill="#111"/></g>
    <circle cx="47.5" cy="80" r="2.6" fill="#FF7A8A" opacity=".8"/><circle cx="72.5" cy="80" r="2.6" fill="#FF7A8A" opacity=".8"/>
    <path d="M54 80c2 7 10 7 12 0z" fill="#7A1F1F" stroke="#1E1A18" stroke-width="1" stroke-linejoin="round"/>
    ${t >= 2 ? `<g class="acc band"><path d="M30.5 60Q60 52 89.5 59l.5 6Q60 58 31 66z" fill="#E8323C" stroke="#1E1A18" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M31 63Q60 55 89.7 62" fill="none" stroke="#fff" stroke-width="1.3" opacity=".85"/>
      <g class="tails"><path d="M89 60l12-5 1 5-12 4zM89 63l11 4-2 4-10-5z" fill="#E8323C" stroke="#1E1A18" stroke-width="1.2" stroke-linejoin="round"/></g></g>` : ''}
    ${t >= 3 ? `<g class="acc shades"><path d="M44 67h32" stroke="#1E1A18" stroke-width="2.4" stroke-linecap="round"/>
      <path d="M45 67h14v3q0 6-7 6t-7-6zM61 67h14v3q0 6-7 6t-7-6z" fill="#1E1A18"/>
      <path d="M48 69.5h3M64 69.5h3" stroke="#fff" stroke-width="1.4" stroke-linecap="round" opacity=".8"/></g>` : ''}
    ${t >= 4 ? `<g class="acc chainw"><g class="chain"><path d="M41 82Q60 99 79 82" fill="none" stroke="#B88700" stroke-width="3.4"/>
      <path d="M41 82Q60 99 79 82" fill="none" stroke="#FFD54A" stroke-width="2.2" stroke-dasharray="2.6 1.6"/>
      <path d="M57.5 92.5a2.5 2.5 0 0 1 5 0" fill="none" stroke="#B88700" stroke-width="1.6"/><circle cx="60" cy="95.5" r="3.6" fill="#FFC531" stroke="#1E1A18" stroke-width="1"/></g></g>` : ''}
    ${t >= 6 ? `<g class="acc crown"><g transform="translate(1 10) rotate(14 60 16)"><path d="M49 22l-2-11 7 5 6-9 6 9 7-5-2 11z" fill="#FFC531" stroke="#1E1A18" stroke-width="1.4" stroke-linejoin="round"/>
      <path d="M49.5 19h21" stroke="#1E1A18" stroke-width="1"/><circle cx="60" cy="15" r="1.8" fill="#FF3B30" stroke="#1E1A18" stroke-width=".5"/></g></g>` : ''}
  </g></g>`;
};
/* Значок серии на полке: огонёк на шестиграннике, со снаряжением своей ступени */
const CL_STK_BADGE = (cls, n) => `<svg class="${cls}" viewBox="0 0 120 120" aria-hidden="true">${n ? CL_HEX(cls) : CL_HEX_OFF}${CL_FIRE(cls, n, .8)}</svg>`;

/* Дорожка серии — от нуля до цели: «5 / 7» — пять горящих делений из семи.
   До 14 — деления, дальше — сплошная полоса. just — деление, которое только
   что загорелось; add — с какого деления начинаются новые (выезжают справа);
   from — с какой ширины полоса сжимается к новой цели */
const clStkTrack = (n, hi, o = {}) => hi <= 14
  ? `<div class="stktr">${Array.from({ length: hi }, (_, i) => { const add = o.add != null && i >= o.add;
      return `<i class="${[i < n && 'on', o.just && i === n - 1 && 'just', add && 'add'].filter(Boolean).join(' ')}"${add ? ` style="animation-delay:${(i - o.add) * 60}ms"` : ''}></i>`; }).join('')}</div>`
  : `<div class="stkbar"><i${o.from != null ? ` class="shrink" style="--from:${o.from}%;width:${n / hi * 100}%"` : ` style="width:${n / hi * 100}%"`}></i></div>`;

/* Момент серии — вместо тоста после «Завершить тренировку»: тёмный экран,
   снизу летят искры, огонёк вспыхивает, число перекатывается from → to,
   ниже дорожка до цели со счётчиком «1 / 3» и цитата.
   Рубеж: дорожка заполняется до конца («7 / 7»), огонёк эволюционирует —
   прежняя форма белеет и мигает, чередуясь с силуэтом новой, всё быстрее,
   вспышка, и проявляется новая форма в цвете; конфетти. Затем дорожка
   раздвигается до новой цели: новые деления выезжают справа, счётчик —
   «7 / 14». Цитата и кнопки — после эволюции. После 100 снаряжения больше
   нет: рубеж без эволюции, только конфетти и новая цель.
   prev — лучшая из сорвавшихся серий: пока текущая не выше, рядом с подписью
   плашка «рекорд 30»; перекрыл её — «Новый рекорд серии!», конфетти, открытка.
   from === to — тот же экран без анимаций (тап по серии в профиле) */
function clStreakShow(from, to, prev = clStreakRuns().prev) {
  if (document.querySelector('.achw')) return;
  const up = to > from, ms = up && to === clStkPrev(to), t = clFireT(to), t0 = clFireT(from);
  const rec = up && prev > 0 && from <= prev && to > prev, fest = ms || rec;
  const evo = ms && t > t0 && !matchMedia('(prefers-reduced-motion: reduce)').matches;
  const hi = ms ? to : clStkNext(to), nx = clStkNext(to), at = evo ? 2900 : 1700;   /* когда дорожка раздвигается */
  const [qt, qa] = up ? clQuoteNext() : clQuoteLast();
  const svg = (id, n, tt, cls) => `<svg class="achsvg ft${tt}${cls}" viewBox="0 0 120 120" aria-hidden="true">${CL_FIRE(id, n, CL_FIRE_K[tt])}</svg>`;
  const fire = evo ? `<div class="stkevo">${svg('stko', from, t0, ' evo-old')}${svg('stkn', to, t, ' evo-new')}<i class="evo-flash"></i></div>` : svg('stk', to, t, '');
  const embers = Array.from({ length: 22 + t * 4 }, (_, i) => `<i style="left:${(i * 41) % 100}%;--s:${3 + i % 4}px;--x:${((i * 23) % 50) - 25}px;--d:${1800 + (i * 97) % 1400}ms;--dl:${(i * 173) % 1600}ms"></i>`).join('');
  const cols = ['#FC5200', '#FF7A1F', '#FFB27A', '#FFD23F', '#fff'];
  const bits = fest ? `<div class="confetti" aria-hidden="true">${Array.from({ length: 36 }, (_, i) => `<i style="left:${(i * 37) % 100}%;background:${cols[i % 5]};animation-delay:${(i % 9) * 60 + (evo ? 2400 : 900)}ms;--r:${(i * 53) % 360}deg;--x:${((i * 29) % 60) - 30}px;--d:${1500 + (i * 71) % 900}ms"></i>`).join('')}</div>` : '';
  const w = document.createElement('div');
  w.className = 'achw';
  w.innerHTML = `<div class="achbg"></div><div class="embers" aria-hidden="true">${embers}</div>${bits}
    <div class="achc stkc${evo ? ' evo' : ''}" role="dialog" aria-label="Серия: ${to} ${clStkWord(to)} подряд">
      <div class="stkfire${up ? ' go' : ''}">${fire}</div>
      <div class="stknum">${up ? `<span class="roll"><b>${from}</b><b>${to}</b></span>` : `<b>${to}</b>`}</div>
      <em>${rec ? 'Новый рекорд серии!' : clStkWord(to) + ' подряд'}${!rec && prev >= to ? `<span class="stkbest">рекорд ${prev}</span>` : ''}</em>
      <div class="stkprog">${clStkTrack(to, hi, { just: up })}<span>${to} / ${hi}</span></div>
      <blockquote class="stkq">«${qt}»<cite>${qa}</cite></blockquote>
      ${fest ? `<button class="btn pri" data-achshare>${clI('share')}Поделиться</button><button class="lnk achok" data-achok>Продолжить</button>`
        : '<button class="btn pri" data-achok>Продолжить</button>'}
    </div>`;
  const card = { kicker: rec ? 'НОВЫЙ РЕКОРД СЕРИИ' : 'СЕРИЯ', name: 'Серия ' + to, art: id => `${CL_HEX(id)}${CL_FIRE(id, to, .8)}`, file: 'seriya',
    card: [`${to} ${clStkWord(to).toUpperCase()}`, 'ПОДРЯД'], did: () => 'тренируется без пропусков',
    share: () => `${to} ${clStkWord(to)} подряд в Тренерграм 🔥` };
  const close = () => { w.classList.add('out'); setTimeout(() => w.remove(), 260); };
  w.addEventListener('click', e => { if (e.target.closest('[data-achok]')) close(); if (e.target.closest('[data-achshare]')) clAchShare(card); });
  document.getElementById('dev').appendChild(w);
  const buzz = p => { try { navigator.vibrate && navigator.vibrate(p); } catch (x) {} };
  buzz(rec && !evo ? [30, 60, 40] : ms ? 30 : 25);
  if (evo) setTimeout(() => buzz([30, 60, 40]), 2450);
  /* Рубеж взят — дорожка раздвигается до новой цели */
  if (ms) setTimeout(() => { if (!w.isConnected) return;
    w.querySelector('.stkprog').innerHTML = (hi <= 14 && nx <= 14 ? clStkTrack(to, nx, { add: hi }) : clStkTrack(to, nx, { from: 100 }))
      + `<span class="upd">${to} / ${nx}</span>`; }, at);
}

/* ═══ Серия прервалась ═══
   Один раз, при следующем входе в приложение после пропуска: огонёк в своём
   снаряжении гаснет — сжимается и сереет, поднимается дымок, остаётся серый
   спящий огонёк; число откатывается к нулю, «Серия прервалась» и рекорд.
   Без упрёков: цитата о неудачах из своего пула (тоже без повторов) и «Начать заново». Серии короче
   первого рубежа обрываются молча. Тренеру в ленту — событие (STATE.stkLost):
   повод написать клиенту */
const CL_QUOTES_LOST = [
  ['Упади семь раз, поднимись восемь', 'Японская пословица'],
  ['Пробовал. Ошибся. Неважно. Пробуй ещё. Ошибись ещё. Ошибись лучше', 'Сэмюэл Беккет'],
  ['Важно не то, как сильно ты бьёшь, а какой удар можешь выдержать и продолжать идти вперёд', 'Рокки Бальбоа'],
  ['Я снова и снова терпел неудачи. Именно поэтому я добился успеха', 'Майкл Джордан'],
  ['Я могу принять неудачу. Но не могу принять отказ от попытки', 'Майкл Джордан'],
  ['Что меня не убивает, делает меня сильнее', 'Фридрих Ницше'],
  ['Никогда не сдавайтесь — никогда, никогда, никогда', 'Уинстон Черчилль'],
  ['Огонь испытывает золото, а трудности — сильных людей', 'Сенека'],
  ['Что стоит на пути, то и становится путём', 'Марк Аврелий'],
  ['Неудача — просто возможность начать снова, но уже разумнее', 'Генри Форд'],
  ['Никто не побеждён, пока сам не признал поражение', 'Брюс Ли'],
  ['Нас тревожат не вещи, а наши суждения о них', 'Эпиктет'],
  ['Часто колючий шип рождает нежные розы', 'Овидий'],
  ['В трудный час сохраняй спокойствие духа', 'Гораций'],
  ['Человеку свойственно ошибаться', 'Латинская пословица'],
  ['Не ошибается тот, кто ничего не делает', 'Пословица'],
  ['За битого двух небитых дают', 'Русская пословица'],
  ['Первый блин комом', 'Русская пословица']
];
function clStreakLostCheck() {
  const { runs } = clStreakRuns(), l = runs[runs.length - 1];
  if (!l || l.n < CL_STK_MS[0] || clS.stkLost === l.miss || daysBetween(l.miss, TODAY) > 14) return;
  clS.stkLost = l.miss; clSave();
  (STATE.stkLost ||= {})[CL_ME] = { n: l.n, d: l.miss, at: TODAY }; saveState();
  const best = Math.max(...runs.map(r => r.n));
  clQueue(() => clStreakLostShow(l.n, best));
}
function clStreakLostShow(n, best) {
  if (document.querySelector('.achw')) return;
  const t = clFireT(n), [qt, qa] = clQuoteNext(CL_QUOTES_LOST, 'ql');
  const svg = (id, k, tt, cls) => `<svg class="achsvg ft${tt}${cls}" viewBox="0 0 120 120" aria-hidden="true">${CL_FIRE(id, k, CL_FIRE_K[tt])}</svg>`;
  const w = document.createElement('div');
  w.className = 'achw';
  w.innerHTML = `<div class="achbg"></div>
    <div class="achc stkc lost" role="dialog" aria-label="Серия прервалась: было ${n} ${clStkWord(n)} подряд">
      <div class="stkfire"><div class="stkevo">${svg('stkl', n, t, ' out-old')}${svg('stkz', 0, 0, ' out-new')}<span class="smoke"><i></i><i></i><i></i></span></div></div>
      <div class="stknum"><span class="roll"><b>${n}</b><b>0</b></span></div>
      <em>Серия прервалась<span class="stkbest">рекорд ${best}</span></em>
      <blockquote class="stkq">«${qt}»<cite>${qa}</cite></blockquote>
      <button class="btn pri" data-achok>Начать заново</button>
    </div>`;
  w.addEventListener('click', e => { if (e.target.closest('[data-achok]')) { w.classList.add('out'); setTimeout(() => w.remove(), 260); } });
  document.getElementById('dev').appendChild(w);
  try { navigator.vibrate && navigator.vibrate(60); } catch (x) {}
}

/* Строка серии: сколько подряд, до какого рубежа и рекорд, если текущая ниже */
const clStkLine = (n, prev) => { const nx = clStkNext(n), best = Math.max(n, prev);
  return n ? [`${n} ${clStkWord(n)} подряд`, `До серии ${nx} — ещё ${nx - n}${best > n ? ` · рекорд ${best}` : ''}`]
    : best ? ['Серия прервалась', `Рекорд — ${best}. Завершите тренировку — огонёк разгорится снова`]
    : ['Серии пока нет', 'Завершите тренировку — начнётся серия']; };

/* Полка в профиле: серия строкой сверху, под ней значки */
function clAchShelf() {
  const ids = Object.keys(CL_ACH), got = ids.filter(id => clS.ach[id]).length, { cur: n, prev } = clStreakRuns(), [b, s] = clStkLine(n, prev);
  const cell = id => { const on = clS.ach[id], a = CL_ACH[id];
    return `<button class="bdg${on ? '' : ' lock'}" data-badge="${id}">${CL_BADGE(id, 'bsvg' + id, !on)}<b>${a.name}</b><s>${on ? clShortDate(on) : a.sub}</s></button>`; };
  return `<section class="card shelf"><div class="shh"><b>Мои достижения</b><span>${got} из ${ids.length}</span></div>
    <button class="stkrow${n ? '' : ' off'}" data-streak>${CL_STK_BADGE('bsvgst', n)}<span><b>${b}</b><s>${s}</s></span>${clI('right')}</button>
    <div class="bdgs">${ids.map(cell).join('')}</div>
  </section>`;
}

/* ═══ A0. Показ достижений ═══
   Экран стенда, не продукта: финал любого достижения открывается кнопкой и
   ничего не засчитывает — полка в профиле и лента тренера не меняются.
   Серия: «+1» — момент серии после тренировки, рубежи — сразу момент рубежа,
   «Сорвалась» — экран «Серия прервалась», дальше рекорд — эта серия. Числа
   меняются только здесь; цитаты берутся из пула клиента, как после тренировки. */
let clAchDemo = null, clAchDemoPrev = null;
CL_UI.ach = () => {
  if (clAchDemo == null) ({ cur: clAchDemo, prev: clAchDemoPrev } = clStreakRuns());
  const n = clAchDemo, [b, s] = clStkLine(n, clAchDemoPrev);
  const tile = (art, name, how, btn) => `<div class="card achx">${art}<b>${name}</b><s>${how}</s>${btn}</div>`;
  return `<header class="hhead"><div class="wmk">Достижения</div></header>
  <div class="pg"><div class="achgrid">
    <div class="card achx wide">${CL_STK_BADGE('axsvgst', n)}<b>${b}</b><s>${s}</s>
      <div class="stkbtns two"><button class="btn sec" data-streakx>+1</button><button class="btn sec" data-stklost>Сорвалась</button></div>
      <div class="stkbtns">${CL_STK_MS.map(m => `<button class="btn sec" data-stkms="${m}">${m}</button>`).join('')}</div></div>
    ${Object.entries(CL_ACH).map(([id, a]) => tile(CL_BADGE(id, 'axsvg' + id), a.name, a.tip,
      `<button class="btn sec" data-achx="${id}">Показать</button>`)).join('')}
  </div></div>
  ${clTabs('profile')}`;
};
CL_UI_MOUNT.ach = scr => scr.addEventListener('click', e => {
  const b = e.target.closest('[data-achx]'); if (b) { clAchShow(b.dataset.achx); return; }
  if (e.target.closest('[data-streakx]')) { clStreakShow(clAchDemo, clAchDemo + 1, clAchDemoPrev); clAchDemo++; clRepaint(scr, 'ach'); return; }
  if (e.target.closest('[data-stklost]')) { if (!clAchDemo) { clToast('Сначала наберите серию: «+1» или рубеж'); return; }
    clAchDemoPrev = Math.max(clAchDemoPrev, clAchDemo); clStreakLostShow(clAchDemo, clAchDemoPrev); clAchDemo = 0; clRepaint(scr, 'ach'); return; }
  const m = e.target.closest('[data-stkms]'); if (m) { const to = +m.dataset.stkms; clStreakShow(to - 1, to, clAchDemoPrev); clAchDemo = to; clRepaint(scr, 'ach'); }
});

/* Слайды для текущего места: Telegram → сначала в браузер, дальше шаги браузера */
function clSlides() {
  const and = clOS() === 'android', tg = clP.where === 'tg', out = [];
  if (tg) out.push(['tg-' + (and ? 'and' : 'ios'), and ? 'Сначала откройте в Chrome' : 'Сначала откройте в Safari',
    `Telegram не умеет добавлять сайты на экран. Нажмите ${and ? '«⋮»' : '«⋯»'} вверху справа и «Открыть в ${and ? 'браузере' : 'Safari'}», там войдите по номеру ещё раз.`]);
  if (and) out.push(
    ['and-menu', 'Нажмите «⋮» вверху справа', 'Затем — «Добавить на гл. экран».'],
    ['and-install', 'Нажмите «Установить»', 'Chrome сам положит иконку на экран телефона.'],
    ['home', 'Готово — Тренерграм на экране', 'Открывайте его с иконки, как обычное приложение.']);
  else out.push(
    ['ios-menu', 'Нажмите «⋯» внизу справа', 'Затем — «Поделиться». На старых iPhone кнопка «Поделиться» сразу внизу экрана.'],
    ['ios-share', 'Выберите «На экран „Домой“»', 'Если пункта не видно — пролистайте список вниз.'],
    ['ios-add', 'Нажмите «Добавить»', 'Переключатель «Открывать как веб-приложение» оставьте включённым.'],
    ['home', 'Готово — Тренерграм на экране', 'Открывайте его с иконки. В первый раз войдите по номеру ещё раз — это 10 секунд.']);
  return out;
}

/* Слайдшоу — лист снизу; листается кнопками и свайпом */
function clHowto() {
  const sl = clSlides(); let i = 0;
  const w = document.createElement('div');
  w.className = 'shw';
  const draw = (dir) => {
    const [m, t, d] = sl[i], last = i === sl.length - 1;
    w.innerHTML = `<div class="shbg" data-x></div>
    <div class="sheet howto" role="dialog" aria-label="Иконка на экране"><i class="grab"></i>
      <div class="hth"><s>Шаг ${i + 1} из ${sl.length}</s><button class="ib sm" data-x aria-label="Закрыть">${clI('x')}</button></div>
      <div class="mk${dir ? ' ' + dir : ''}">${clMock(m)}</div>
      <h2>${clEsc(t)}</h2><p>${clEsc(d)}</p>
      <div class="hdots">${sl.map((_, k) => `<i class="${k === i ? 'on' : ''}"></i>`).join('')}</div>
      <div class="hbtn">${i ? '<button class="btn sec" data-prev>Назад</button>' : ''}<button class="btn pri" ${last ? 'data-x' : 'data-next'}>${last ? 'Понятно' : 'Дальше'}</button></div>
    </div>`;
    /* Перелистывание — лист на месте, едет только схема */
    if (dir) w.querySelectorAll('.sheet,.shbg').forEach(el => { el.style.animation = 'none'; });
  };
  const close = () => { w.classList.add('out'); setTimeout(() => w.remove(), 220); };
  const go = d => { const n = i + d; if (n < 0 || n >= sl.length) return; i = n; draw(d > 0 ? 'fwd' : 'bk'); };
  w.addEventListener('click', e => {
    if (e.target.closest('[data-x]')) close();
    else if (e.target.closest('[data-next]')) go(1);
    else if (e.target.closest('[data-prev]')) go(-1);
  });
  let x0 = null;
  w.addEventListener('pointerdown', e => { if (e.target.closest('.mk')) x0 = e.clientX; });
  w.addEventListener('pointerup', e => { if (x0 == null) return; const dx = e.clientX - x0; x0 = null; if (Math.abs(dx) > 40) go(dx < 0 ? 1 : -1); });
  draw('');
  document.getElementById('dev').appendChild(w);
}

/* Техника упражнения — лист снизу: демонстрация, акценты тренера и шаги из
   базы. Шаги — в exdb-steps.js; у своих упражнений тренера их нет. */
const clSteps = e => (typeof EXDB_STEPS !== 'undefined' && EXDB_STEPS[e.id]) || e.steps || [];   /* у своего упражнения шаги пишет тренер */
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

/* ═══ Оплата занятий (PAY-9) ═══
   Деньги клиент переводит тренеру сам, сервис ведёт только срок — его ставит
   тренер в карточке клиента. За день до конца и в последний день на главной
   полоса «пора платить» с суммой и «Как оплатить» из профиля тренера. Срок
   кончился — со следующего дня новые тренировки закрыты: в списке и на неделе
   они видны, а при открытии — «Оплата не внесена»; прошлые открываются.
   Тренер отметил оплату — всё открывается сразу. Срок не задан — оплаты
   у клиента нет нигде. На стенде состояние можно задать параметром «Оплата». */
function clFeeC() {
  const c = clMe(), m = typeof clP !== 'undefined' ? clP.pay : '';
  if (m === 'none') return Object.assign({}, c, { paidUntil: null });
  const k = { tomorrow: 1, today: 0, closed: -3 }[m];
  return k == null ? c : Object.assign({}, c, { paidUntil: addDays(TODAY, k) });
}
/* Срок строкой: «до 6 октября» · «сегодня последний день» · «новые тренировки закрыты» */
const clFeeWhen = f => ({ tomorrow: 'до ' + D(f.paidUntil).getDate() + ' ' + MONTHS[D(f.paidUntil).getMonth()], today: 'сегодня последний день',
  closed: 'тренировки закрыты' })[feeState(f)] || '';
const clFeeTitle = f => 'Оплатите тренеру' + (f.feeAmt ? ' ' + rubs(f.feeAmt) : '');
/* Полоса на главной — действие и сумма, срок одной строкой, одна кнопка.
   Цвет — фирменный оранжевый во всех состояниях: это просьба, а не ошибка. */
function clFeeBar() {
  const f = clFeeC(), st = feeState(f);
  if (!['tomorrow', 'today', 'closed'].includes(st)) return '';
  return `<section class="card feebar" role="status">
    <span class="fi">${clI(st === 'closed' ? 'lock' : 'wallet')}</span>
    <div><b>Оплатите тренеру</b><span>${f.feeAmt ? `<em>${rubs(f.feeAmt)}</em> · ` : ''}${clFeeWhen(f)}</span>
      <button class="fbtn" data-payhow>Как оплатить ${CL_ICON.next}</button></div>
  </section>`;
}
function clFeeLock() {
  const f = clFeeC();
  return `<div class="card feelock">${clI('lock')}<b>${clFeeTitle(f)}</b>
    <span>Тренировка откроется, когда тренер отметит оплату</span>
    <button class="btn pri" data-payhow>Как оплатить</button>
  </div>`;
}
function clFeeCard() {
  const f = clFeeC(), st = feeState(f);
  if (st === 'none') return '';
  const r = daysBetween(TODAY, f.paidUntil);
  const left = st === 'closed' ? 'новые тренировки закрыты' : st === 'today' ? 'последний день' : st === 'tomorrow' ? 'завтра последний день'
    : 'ещё ' + r + ' ' + plural3(r, 'день', 'дня', 'дней');
  return `<section class="card fcardp"><s>Оплата занятий</s>
    <div class="pgrid"><div class="pf"><s>Сумма</s><b>${f.feeAmt ? rubs(f.feeAmt) : '—'}</b></div>
      <div class="pf"><s>Оплачено до</s><b>${clFullDate(f.paidUntil)}</b><i class="fst ${st === 'ok' ? 'ok' : 'warn'}">${left}</i></div></div>
    ${payHow() ? '<button class="fbtn" data-payhow>Как оплатить</button>' : ''}
  </section>`;
}
/* «Как оплатить» — лист снизу: сумма, срок, реквизиты тренера и «Скопировать» */
function clPaySheet() {
  const f = clFeeC(), how = payHow(), w = document.createElement('div');
  w.className = 'shw';
  w.innerHTML = `<div class="shbg" data-x></div>
    <div class="sheet paysh" role="dialog" aria-label="Как оплатить"><i class="grab"></i>
      <h2>Как оплатить</h2>
      ${f.feeAmt ? `<div class="psum"><b>${rubs(f.feeAmt)}</b><span>${clEsc(clFeeWhen(f) || 'оплачено до ' + clShortDate(f.paidUntil))}</span></div>` : ''}
      <div class="phow"><s>Тренер · ${clEsc(TRAINER.n)}</s>${clEsc(how || 'Тренер не указал реквизиты — уточните у него')}</div>
      <p class="tag">Деньги переводите тренеру напрямую. Он отметит оплату — тренировки откроются.</p>
      <div class="acts">${how ? '<button class="btn pri" data-copy>Скопировать реквизиты</button>' : ''}<button class="btn sec" data-x>Закрыть</button></div>
    </div>`;
  const close = () => { w.classList.add('out'); setTimeout(() => w.remove(), 220); };
  w.addEventListener('click', e => {
    if (e.target.closest('[data-copy]')) { navigator.clipboard?.writeText(how); close(); clToast('Реквизиты скопированы'); }
    else if (e.target.closest('[data-x]')) close();
  });
  document.getElementById('dev').appendChild(w);
}
document.addEventListener('click', e => { const b = e.target.closest('[data-payhow]'); if (!b) return; e.stopPropagation(); clPaySheet(); }, true);

/* ═══ E0. Лента событий — уведомления клиента ═══
   Как лента тренера на дашборде: события по дням, у каждого тип и переход.
   Источники — данные кабинета: опубликованные тренировки, сообщения тренера
   к тренировке (COM-4), ответы на комментарии (COM-3), новый максимум (PRO-4).
   Момента публикации в данных нет — в демо новая тренировка приходит накануне. */
const CL_EVT = {
  plan:  { icon: 'cal',    tag: 'Новая тренировка' },
  msg:   { icon: 'msg',    tag: 'Сообщение тренера' },
  reply: { icon: 'msg',    tag: 'Ответ тренера' },
  pr:    { icon: 'trophy', tag: 'Новый максимум' },
  fee:   { icon: 'wallet', tag: 'Оплата' }
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
  /* Ответы тренера в обсуждении блоков — с цитатой вопроса, на который он ответил */
  talkKeys().filter(k => k.startsWith(CL_ME + '@')).forEach(k => { const t = talkOf(k), date = blkParse(k).date;
    t.forEach((m, j) => { if (m.who !== 'trainer' || m.d > TODAY) return; const q = t.slice(0, j).reverse().find(x => x.who === 'client');
      ev.push({ k: 'reply@' + k + ':' + j, t: 'reply', d: m.d, time: m.at, date, go: 'workout', title: TRAINER.n, text: m.text, quote: q ? 'Вы: «' + q.text + '»' : 'к тренировке на ' + clDateLong(date) }); }); });
  if (c.pr) {
    const e = byId(c.pr.ex), d = shiftDate(c.pr.at);
    if (d <= TODAY) ev.push({ k: 'pr@' + c.pr.ex + c.pr.v, t: 'pr', d, go: 'profile', title: (PMNAMES[c.pr.ex] || (e && e.ru) || '') + ' — ' + fmtNum(c.pr.v) + '\u00a0кг',
      text: 'Тренер записал новый максимум' + (c.pr.prev ? ', было ' + fmtNum(c.pr.prev) + '\u00a0кг' : '') + '. Рабочие веса в тренировках пересчитаны.' });
  }
  /* Оплата занятий (PAY-9): за день до конца, в последний день и на следующий —
     доступ закрыт. Пушей в MVP нет — напоминание живёт в ленте и на главной. */
  const f = clFeeC(), st = feeState(f);
  if (st !== 'none' && daysBetween(TODAY, f.paidUntil) <= 1) {
    const sum = f.feeAmt ? rubs(f.feeAmt) + ' — ' : '';
    [[-1, 'Оплата заканчивается завтра', sum + 'переведите тренеру до ' + D(f.paidUntil).getDate() + ' ' + MONTHS[D(f.paidUntil).getMonth()]],
     [0, 'Сегодня последний оплаченный день', sum + 'переведите тренеру сегодня, чтобы тренировки не закрылись'],
     [1, 'Оплата не внесена', 'Новые тренировки откроются, когда тренер отметит оплату' + (f.feeAmt ? ' · ' + rubs(f.feeAmt) : '')]]
      .forEach(([k, title, text]) => { const d = addDays(f.paidUntil, k); if (d <= TODAY) ev.push({ k: 'fee@' + d, t: 'fee', d, go: 'profile', title, text }); });
  }
  const ord = { fee: 0, msg: 1, reply: 2, pr: 3, plan: 4 };
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
    <section class="card ptr"><span class="pav sm">${clTrAva()}</span><div><s>Тренер</s><b>${clEsc(TRAINER.n)}</b><span>${TRAINER.city ? clEsc(TRAINER.city) + ' · ' : ''}с ${clFullDate(c.since)}</span></div></section>
    ${clAchShelf()}
    ${clFeeCard()}
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
  /* Рекорд или замер внесён раньше, а значка ещё нет — финал при входе в профиль */
  if (clAchFirst()) clRepaint(scr, 'profile');
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
    /* Свой значок — снова финал (с «Поделиться»), закрытый — подсказка */
    const bd = e.target.closest('[data-badge]'); if (bd) { const id = bd.dataset.badge;
      if (clS.ach[id]) clAchShow(id); else clToast(CL_ACH[id].tip); return; }
    if (e.target.closest('[data-streak]')) { const n = clStreak();
      if (n) clStreakShow(n, n); else clToast('Завершите тренировку — начнётся серия. Пропущенная тренировка обнуляет её'); return; }
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
          saveState(); clSave(); clPmSel = k; const ach = clAchFirst(); clRepaint(scr, 'profile');
          if (!ach) clToast('Рекорд сохранён — веса в тренировках пересчитаны'); });
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
          clSave(); const ach = clAchFirst(); clRepaint(scr, 'profile'); if (!ach) clToast('Замер сохранён'); });
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
  const pl = cliPlan(client(CL_ME).prog);
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
        Object.keys(clS).forEach(k => delete clS[k]); Object.assign(clS, { phone: '', prof: {}, goal: '', goal2: '', done: {}, notes: {}, sent: {}, dayDone: {}, open: {}, hideTasks: false, read: {}, meas: [], pmh: {}, photo: '', set: {}, ach: {} });
        clGo('phone', '', true); });
  });
};
