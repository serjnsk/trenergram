/* ═══════════════════════════════════════════════════════════════
   ТРЕНЕРСКОЕ ПРИЛОЖЕНИЕ · АККАУНТ
     #/profile          Профиль
     #/more/sub         Подписка
     #/more/notify      Уведомления
     #/more/partner     Партнёрская программа

   Раздел «Аккаунт» шторки «Ещё». Данные — с десктопной страницы настроек
   (profile.html: табы «Профиль», «Подписка», «Партнёрская программа»), а
   вид — свой, телефонный: списки по iOS, подпись раздела капсом, строка
   «подпись над значением ›», правка — в шторке. Хранилище общее с
   кабинетом: STATE.profile (фото, реквизиты, текст приглашения, подписка,
   баланс, уведомления) и STATE.partner (партнёрский счёт).

   Решения (14.11.2026):
   · Подписка — только срок, карта для справки и история (PAY-8). Тариф,
     карта, продление и отмена — в кабинете на компьютере; ссылки на сайт
     нет: Apple не пропускает ссылки на внешнюю оплату.
   · Партнёрская программа — ссылка, сводка и движение по счёту. Деньги
     (перевести на баланс, вывести) — только на компьютере.
   · Уведомления — на десктопе их нет. Виды пушей — по событиям ленты
     «Сегодня» (заготовка PROFILE_DEF.notify в data.js), плюс общий
     переключатель и тихие часы. Лента показывает всё независимо от них.
   · «Удалить аккаунт» — требование App Store к приложению с регистрацией.
   ═══════════════════════════════════════════════════════════════ */
(function(){
'use strict';
const T = window.TAPP; if(!T) return;
const {I, h, sheet, closeSheet, say, nav} = T;

const clone = o => JSON.parse(JSON.stringify(o));
const P = () => STATE.profile ||= clone(PROFILE_DEF);
const rub = n => Math.round(n).toLocaleString('ru-RU') + ' ₽';
const MONG = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const dlong = iso => { const d = new Date(iso + 'T00:00:00'); return d.getDate() + ' ' + MONG[d.getMonth()] + ' ' + d.getFullYear() };
const dday = iso => iso.slice(0, 4) === TODAY.slice(0, 4) ? dlong(iso).replace(/ \d{4}$/, '') : dlong(iso);
const plan = () => PLANS.find(x => x.id === P().sub.plan) || PLANS[0];
const splitLink = l => [l.replace(/^https?:\/\//, '').replace(/[^/]+$/, ''), l.split('/').pop()];
const backBtn = to => `<button class="nb" data-act="back" data-to="${to}" aria-label="Назад">${I.back}</button>`;
const CAM = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 8h3l2-3h6l2 3h3v11H4z"/><circle cx="12" cy="13" r="3.5"/></svg>';

/* ─── свои данные тренера ───
   Кабинет держит правку TRAINER только до перезагрузки; в приложении (и на
   стенде, где экран открывается заново) она бы пропадала — поэтому копия
   лежит в STATE.profile.me и поднимается при запуске. Режим стенда «Данные:
   длинные» не перебиваем — условие то же, что в конце data.js. */
const ME_K = ['first', 'last', 'n', 'ini', 'city', 'about', 'phone', 'email'];
const LONG = (() => { if(/[?&]long=1\b/.test(location.search)) return true;
  try{ const fe = window.frameElement; return !!(fe && (fe.dataset.mode || fe.dataset.inapp) && localStorage.getItem('tr.long') === '1') }catch(_){ return false } })();
if(!LONG && STATE.profile && STATE.profile.me) Object.assign(TRAINER, STATE.profile.me);
function setMe(o){
  Object.assign(TRAINER, o);
  if('first' in o || 'last' in o){ TRAINER.n = (TRAINER.first + ' ' + TRAINER.last).trim(); TRAINER.ini = ((TRAINER.first[0] || '') + (TRAINER.last[0] || '')).toUpperCase() }
  P().me = Object.fromEntries(ME_K.map(k => [k, TRAINER[k]])); saveState();
}
/* Фото — квадрат 160 px из середины кадра (как в кабинете): в localStorage влезает, на аватаре 96 pt резко */
function photoFrom(file, done){
  const img = new Image(), url = URL.createObjectURL(file);
  img.onload = () => {
    const c = document.createElement('canvas'), n = 160, m = Math.min(img.width, img.height);
    c.width = c.height = n;
    c.getContext('2d').drawImage(img, (img.width - m) / 2, (img.height - m) / 2, m, m, 0, 0, n, n);
    URL.revokeObjectURL(url); done(c.toDataURL('image/jpeg', .85));
  };
  img.onerror = () => { URL.revokeObjectURL(url); say('Не получилось открыть файл — нужна картинка JPG или PNG') };
  img.src = url;
}

/* ─── партнёрский счёт: то же демо и те же правила, что в кабинете (profile.html) ─── */
function prt(){
  if(STATE.partner) return STATE.partner;
  const ops = [[3, 'in', 1990, 'Анна Лебедева'], [14, 'in', 490, 'Дмитрий Орлов'], [20, 'bal', 800], [33, 'in', 1990, 'Анна Лебедева'],
    [44, 'in', 490, 'Дмитрий Орлов'], [63, 'in', 1990, 'Анна Лебедева']]
    .map(([d, k, n, who]) => k === 'in' ? {at:addDays(TODAY, -d), k, base:n, pct:20, sum:Math.round(n * .2), who} : {at:addDays(TODAY, -d), k, sum:n});
  P().balance ??= 800;
  return STATE.partner = {pct:20, payout:false, link:'https://trenergram.ru/p/K7F2QX', invited:3, paying:2, ops};
}
const prtEarned = () => prt().ops.filter(o => o.k === 'in').reduce((s, o) => s + o.sum, 0);
const prtAvail = () => prt().ops.reduce((s, o) => o.k === 'in' ? s + o.sum : o.st === 'no' ? s : s - o.sum, 0);

/* ─── уведомления: что приходит пушем ─── */
const NTF_DEF = {push:true, comments:true, results:true, missed:true, programEnd:true, newClient:true, fee:true, sub:true, quiet:false, qFrom:'22:00', qTo:'08:00'};
const ntf = () => { const p = P(); if(!p.notify || p.notify.push == null) p.notify = Object.assign(clone(NTF_DEF), p.notify || {}); return p.notify };
const NTF = [
  ['Клиенты', [
    ['comments', 'Вопросы к тренировкам', 'Клиент спросил в тренировке или в блоке'],
    ['results', 'Результаты и рекорды', 'Клиент завершил тренировку, поставил рекорд'],
    ['missed', 'Пропуски', 'Не тренируется 3 дня и больше, не закрыл тренировку'],
    ['programEnd', 'Программа заканчивается', 'Составлено на 2 дня и меньше'],
    ['newClient', 'Новые клиенты', 'Пришёл по вашей ссылке']]],
  ['Оплата', [
    ['fee', 'Оплата занятий', 'Завтра или сегодня кончается оплаченный срок клиента'],
    ['sub', 'Подписка Тренерграма', 'Срок подписки подходит к концу']]]];

/* ═══════════ СТРОКИ ═══════════ */
/* строка «подпись над значением ›» — правка в шторке; без attrs — только для чтения */
const row = (k, v, attrs = '', cls = '') => {
  const inner = `<span class="t">${k ? `<s>${h(k)}</s>` : ''}<b>${v}</b></span>${attrs ? I.chev : ''}`;
  return /^href=/.test(attrs) ? `<a class="ac-r ${cls}" ${attrs}>${inner}</a>` : attrs ? `<button class="ac-r ${cls}" ${attrs}>${inner}</button>` : `<div class="ac-r ${cls}">${inner}</div>`;
};
const swRow = (k, t, s, on, dis) => `<div class="ac-r ac-sw${dis ? ' dis' : ''}"><span class="t"><b>${h(t)}</b>${s ? `<s>${h(s)}</s>` : ''}</span>
  <button class="tg${on ? ' on' : ''}" role="switch" aria-checked="${!!on}" aria-label="${h(t)}" data-act="ac-ntf" data-k="${k}"${dis ? ' disabled' : ''}><i></i></button></div>`;
const note = t => `<p class="ac-note">${t}</p>`;
const mu = t => `<span class="mu">${h(t)}</span>`;

/* ═══════════ ПРОФИЛЬ ═══════════ */
function scrProfile(){
  const p = P(), t = TRAINER, [lb, lc] = splitLink(onbInvite());
  const inv = inviteText().trim().split('\n').filter(Boolean).slice(0, 2).join(' ');
  return nav('Профиль', backBtn('#/today')) + `<main class="scr gapbg ac">
    <section class="sec ac-hero">
      <label class="ac-ph" for="acPhoto">${p.photo ? `<img src="${p.photo}" alt="">` : h(t.ini)}<span class="ac-cam">${CAM}</span><span class="vh">${p.photo ? 'Сменить фото' : 'Загрузить фото'}</span></label>
      <input type="file" id="acPhoto" accept="image/*" hidden>
      <div class="t"><h2>${h(t.n)}</h2>${t.city ? `<p>${h(t.city)}</p>` : ''}</div>
    </section>
    <section class="sec"><div class="cap">Как вас видят клиенты</div>
      ${row('Имя и фамилия', h(t.n), 'data-act="ac-ed" data-k="name"')}
      ${row('Город', t.city ? h(t.city) : mu('Не указан'), 'data-act="ac-ed" data-k="city"')}
      ${row('О себе', t.about ? h(t.about) : mu('Как вы тренируете и с кем работаете'), 'data-act="ac-ed" data-k="about"', 'clamp')}
    </section>
    <section class="sec"><div class="cap">Приглашение клиентов</div>
      <div class="ac-p"><div class="ac-link">${I.link}<span>${h(lb)}<b>${h(lc)}</b></span><button class="nb" data-act="ac-copy" data-k="invite" aria-label="Скопировать ссылку">${I.copy}</button></div>
        <button class="btn" data-act="invite">${I.share}Отправить приглашение</button></div>
      ${row('Текст приглашения', h(inv), 'data-act="ac-ed" data-k="invite"', 'clamp')}
      ${note('Ссылка одна для всех клиентов и не устаревает. Приглашение — сообщение со ссылкой и шагами, как подключиться.')}
    </section>
    <section class="sec"><div class="cap">Реквизиты для оплаты занятий</div>
      ${row('', payHow() ? h(payHow()) : mu('Не указаны'), 'data-act="ac-ed" data-k="pay"', 'clamp')}
      ${note('Клиент видит их, когда подходит срок оплаты. Сумму и срок задаёте в карточке клиента.')}
    </section>
    <section class="sec"><div class="cap">Вход</div>
      ${row('Телефон · логин для входа', h(t.phone || '—'), 'data-act="ac-ed" data-k="phone"')}
      ${row('Email · чеки и восстановление пароля', h(t.email || '—'), 'data-act="ac-ed" data-k="email"')}
      ${row('Пароль', '••••••••', 'data-act="ac-ed" data-k="pass" aria-label="Сменить пароль"')}
    </section>
    <section class="sec ac-end"><button class="row ac-c" data-act="ac-out">Выйти</button><button class="row danger" data-act="ac-del">Удалить аккаунт</button></section>
  </main>` + T.tabbar('today');
}
const fld = (id, label, val, extra = '') => `<label class="field"><span>${label}</span><input id="${id}" ${extra} value="${h(val || '')}"></label>`;
const area = (id, label, val, rows, ph = '') => `<label class="field"><span>${label}</span><textarea id="${id}" rows="${rows}" placeholder="${h(ph)}">${h(val || '')}</textarea></label>`;
function sheetEdit(k){
  const t = TRAINER;
  const S = {
    name: ['Имя и фамилия', 'Так вас видят клиенты', fld('acF', 'Имя', t.first, 'autocomplete="given-name" maxlength="40"') + fld('acL', 'Фамилия', t.last, 'autocomplete="family-name" maxlength="60"')],
    city: ['Город', '', fld('acCity', 'Город', t.city, 'autocomplete="address-level2" maxlength="60"')],
    about: ['О себе', 'Как вы тренируете и с кем работаете', area('acAbout', 'Текст', t.about, 6)],
    invite: ['Текст приглашения', 'Ссылка — в самом тексте, не удаляйте её', area('acInv', 'Сообщение клиенту', inviteText(), 12)],
    pay: ['Реквизиты для оплаты', 'Клиент видит их, когда подходит срок оплаты', area('acPay', 'Как оплатить', payHow(), 4, 'Например: перевод по номеру телефона, банк, получатель')],
    phone: ['Телефон', 'Логин для входа', fld('acPhone', 'Номер', t.phone, 'type="tel" inputmode="tel" autocomplete="tel"')],
    email: ['Email', 'Чеки и восстановление пароля', fld('acMail', 'Адрес', t.email, 'type="email" inputmode="email" autocomplete="email" autocapitalize="off" spellcheck="false"')],
    pass: ['Сменить пароль', '', fld('acP0', 'Текущий пароль', '', 'type="password" autocomplete="current-password"')
      + fld('acP1', 'Новый пароль', '', 'type="password" autocomplete="new-password"') + fld('acP2', 'Ещё раз', '', 'type="password" autocomplete="new-password"')]
  }[k]; if(!S) return;
  const ov = sheet({id:'ac-' + k, title:S[0], sub:S[1], body:`<div class="sh-p">${S[2]}</div>`,
    foot:`<div class="sh-f"><button class="btn" data-act="ac-save" data-k="${k}">Сохранить</button></div>`});
  /* поле в одну строку — сразу с клавиатурой; длинный текст сначала читают */
  setTimeout(() => { const i = ov.querySelector('input'); if(i) i.focus() }, 260);
}
function saveEdit(k){
  const v = id => { const el = document.getElementById(id); return el ? el.value.trim() : '' };
  let msg = 'Сохранено';
  if(k === 'name'){ if(!v('acF')){ say('Укажите имя'); return } setMe({first:v('acF'), last:v('acL')}) }
  else if(k === 'city') setMe({city:v('acCity')});
  else if(k === 'about') setMe({about:v('acAbout')});
  else if(k === 'phone'){ if(v('acPhone').replace(/\D/g, '').length < 10){ say('Проверьте номер телефона'); return } setMe({phone:v('acPhone')}) }
  else if(k === 'email'){ if(!/^\S+@\S+\.\S+$/.test(v('acMail'))){ say('Проверьте адрес почты'); return } setMe({email:v('acMail')}) }
  else if(k === 'invite'){ P().inviteText = document.getElementById('acInv').value; saveState(); msg = 'Текст сохранён — теперь он ваш по умолчанию' }
  else if(k === 'pay'){ P().payHow = v('acPay'); saveState() }
  else if(k === 'pass'){ if(!v('acP0') || !v('acP1')){ say('Заполните пароли'); return }
    if(v('acP1') !== v('acP2')){ say('Новые пароли не совпадают'); return } msg = 'Пароль изменён' }
  closeSheet(); T.repaint(); say(msg);
}
const askSheet = (id, title, sub, label, act, cls) => sheet({id, title, sub, body:`<div class="sh-p ed-ask">
    <button class="btn ${cls}" data-act="${act}">${label}</button><button class="btn o" data-act="close-sheet">Отмена</button></div>`});

/* ═══════════ ПОДПИСКА ═══════════
   Сводка — как четыре ячейки на десктопе (тариф, клиенты, стоимость, срок),
   ниже — оплата для справки и история. Кнопок оплаты нет (PAY-8). */
function scrSub(){
  prt();
  const p = P(), s = p.sub, pl = plan(), used = CLIENTS.length, left = daysBetween(TODAY, s.until);
  const trial = !!s.trial, ended = left < 0, off = !!s.canceled && !trial && !ended;
  const nocard = !/\d/.test(s.card || ''), bal = p.balance || 0, hist = payHist();
  const st = ended ? ['rm', 'закончилась'] : left === 0 ? ['warn', 'сегодня последний день'] : [left <= 3 || off ? 'warn' : 'ok', `осталось ${left} ${plural3(left, 'день', 'дня', 'дней')}`];
  /* статус — словом в заголовке модуля «Тариф» */
  const pill = ended ? ['rm', 'Закончилась'] : off ? ['warn', 'Отменена'] : trial ? ['blue', 'Пробный период'] : ['ok', 'Действует'];
  const over = used > pl.limit;
  const box = ended ? `<b>${trial ? 'Пробный период закончился' : 'Подписка закончилась'} ${dlong(s.until)}.</b> После продления снова можно составлять тренировки и добавлять клиентов.`
    : off ? `<b>Подписка отменена.</b> Доступ сохранится до ${dlong(s.until)}, потом кабинет станет только для просмотра.` : '';
  const next = ended ? `Продление — ${rub(pl.price)} в месяц`
    : trial ? `${rub(pl.price)} — ${dday(s.until)}, после пробного периода`
    : off ? mu('Не будет — автопродление выключено')
    : `${rub(pl.price)} — ${dday(s.until)}${bal ? `<small>${bal >= pl.price ? 'всё с баланса аккаунта' : `${rub(bal)} с баланса, ${rub(pl.price - bal)} с карты`}</small>` : ''}`;
  /* три модуля, как на «Сегодня»: тариф · платёжные данные · история платежей */
  return nav('Подписка', backBtn('#/more')) + `<main class="scr gapbg mods ac">
    <section class="mod ac-mod" aria-label="Тариф">
      <div class="mod-h"><b>Тариф</b><span class="pill ${pill[0]}">${pill[1]}</span></div>
      ${box ? `<div class="ac-box ${ended ? 'rm' : 'warn'}">${box}</div>` : ''}
      <div class="ac-plan"><b>${h(pl.n)}</b><span>${trial && !ended ? `Бесплатно до ${dday(s.until)}, потом ${rub(pl.price)} в месяц` : `${rub(pl.price)} в месяц`}</span></div>
      ${row('Клиентов', `${used}${pl.limit < 9999 ? ` из ${pl.limit}` : ''}${over ? '<small class="warn">больше лимита тарифа</small>' : ''}`)}
      ${row('Действует до', `${dlong(s.until)}<small class="${st[0]}"><span class="ac-dot ${st[0]}" aria-hidden="true"></span>${st[1]}</small>`)}
    </section>
    <section class="mod ac-mod" aria-label="Платёжные данные">
      <div class="mod-h"><b>Платёжные данные</b></div>
      ${row('Карта', nocard ? mu('Не привязана') : h(s.card))}
      ${row('Следующий платёж', next)}
      ${row('Баланс аккаунта', bal ? `${rub(bal)}<small>пойдёт в счёт следующего платежа</small>` : `0 ₽<small>пополняется из партнёрской программы</small>`, 'href="#/more/partner"')}
      ${note('Тариф, карта и продление — в кабинете на компьютере.')}
    </section>
    <section class="mod ac-mod" aria-label="История платежей">
      <div class="mod-h"><b>История платежей</b></div>
      ${hist.length ? hist.map(d => `<div class="ac-op"><span class="t"><b>${dlong(d)}</b><s>Подписка на месяц · ${h(pl.n)}</s></span>
          <span class="ac-sum">${rub(pl.price)}<small class="ok">оплачен</small></span></div>`).join('')
        : note('Платежей пока не было')}
    </section>
  </main>` + T.tabbar('more');
}
/* История в прототипе — ежемесячные списания до даты продления, не раньше начала подписки (как в кабинете) */
const payHist = () => { const s = P().sub; return s.trial ? [] : [1, 2, 3, 4].map(k => { const d = new Date(s.until + 'T00:00:00'); d.setMonth(d.getMonth() - k);
  return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') }).filter(d => d <= TODAY && d >= (s.since || '')) };

/* ═══════════ УВЕДОМЛЕНИЯ ═══════════ */
function scrNotify(){
  const n = ntf(), on = n.push;
  return nav('Уведомления', backBtn('#/more')) + `<main class="scr gapbg ac">
    <section class="sec">${swRow('push', 'Пуш-уведомления', on ? 'Приходят на этот телефон' : 'Выключены', on)}
      ${note('Лента «Сегодня» показывает все события, даже если пуши о них выключены.')}</section>
    ${NTF.map(([cap, rows]) => `<section class="sec"><div class="cap">${cap}</div>${rows.map(([k, t, s]) => swRow(k, t, s, n[k], !on)).join('')}</section>`).join('')}
    <section class="sec">
      ${swRow('quiet', 'Тихие часы', `С ${n.qFrom} до ${n.qTo} пуши не приходят — события ждут в ленте`, n.quiet, !on)}
      ${n.quiet ? [['qFrom', 'Начало'], ['qTo', 'Конец']].map(([k, t]) => `<label class="ac-r ac-sw${on ? '' : ' dis'}"><span class="t"><b>${t}</b></span>
          <input type="time" class="ac-time" data-k="${k}" value="${n[k]}" aria-label="${t} тихих часов"${on ? '' : ' disabled'}></label>`).join('') : ''}
    </section>
  </main>` + T.tabbar('more');
}

/* ═══════════ ПАРТНЁРСКАЯ ПРОГРАММА ═══════════ */
const OUT_ST = {new:['warn', 'ждёт выплаты'], paid:['ok', 'выплачено'], no:['rm', 'отклонено']};
function opRow(o){
  const t = o.k === 'in' ? `Оплата подписки · ${h(o.who)}` : o.k === 'bal' ? 'Перевод на баланс аккаунта' : 'Вывод средств';
  const st = o.k === 'out' && OUT_ST[o.st];
  return `<div class="ac-op${o.st === 'no' ? ' off' : ''}"><span class="t"><b>${t}</b><s>${dday(o.at)}${o.k === 'in' ? ` · ${rub(o.base)} × ${o.pct} %` : ''}</s>${st ? `<span class="pill ${st[0]}">${st[1]}</span>` : ''}</span>
    <span class="ac-sum${o.k === 'in' ? ' plus' : ''}">${o.k === 'in' ? '+' : '−'}${rub(o.sum)}</span></div>`;
}
function scrPartner(){
  const R = prt(), av = prtAvail(), [lb, lc] = splitLink(R.link), bal = P().balance || 0;
  const ops = [...R.ops].reverse().sort((a, b) => a.at < b.at ? 1 : a.at > b.at ? -1 : 0);   /* за один день — последняя сверху */
  /* три модуля, как «Подписка»: ссылка · партнёрский счёт · движение по счёту */
  return nav('Партнёрская программа', backBtn('#/more')) + `<main class="scr gapbg mods ac">
    <section class="mod ac-mod" aria-label="Ссылка для тренеров">
      <div class="mod-h"><b>Ссылка для тренеров</b></div>
      <div class="ac-p">
        <p class="ac-lead">Приглашайте тренеров по своей ссылке — с&nbsp;каждой их оплаты подписки вы получаете ${R.pct}&nbsp;%. Начисленное идёт в счёт оплаты Тренерграма.</p>
        <div class="ac-link">${I.link}<span>${h(lb)}<b>${h(lc)}</b></span><button class="nb" data-act="ac-copy" data-k="prt" aria-label="Скопировать ссылку">${I.copy}</button></div>
        <button class="btn" data-act="ac-share">${I.share}Поделиться ссылкой</button>
      </div>
    </section>
    <section class="mod ac-mod" aria-label="Партнёрский счёт">
      <div class="mod-h"><b>Партнёрский счёт</b></div>
      <div class="ac-plan"><b class="${av ? 'acc' : ''}">${rub(av)}</b><span>доступно для перевода на баланс</span></div>
      ${row('Заработано всего', rub(prtEarned()))}
      ${row('Приглашено', `${R.invited} ${plural3(R.invited, 'тренер', 'тренера', 'тренеров')}<small>платят ${R.paying}</small>`)}
      ${row('Баланс аккаунта', bal ? `${rub(bal)}<small>пойдёт в оплату подписки</small>` : mu('Пуст'), 'href="#/more/sub"')}
      ${note(`Перевести на баланс${R.payout ? ' или вывести' : ''} — в кабинете на компьютере.`)}
    </section>
    <section class="mod ac-mod" aria-label="Движение по счёту">
      <div class="mod-h"><b>Движение по счёту</b></div>
      ${ops.length ? ops.map(opRow).join('') : note('Начислений пока не было — они появятся после первой оплаты приглашённого тренера')}
    </section>
  </main>` + T.tabbar('more');
}

/* ═══════════ ДЕЙСТВИЯ ═══════════ */
const copy = (text, msg) => { try{ navigator.clipboard.writeText(text) }catch(_){} say(msg) };
const acts = {
  'ac-ed': b => sheetEdit(b.dataset.k),
  'ac-save': b => saveEdit(b.dataset.k),
  'ac-copy': b => { if(b.dataset.k === 'prt'){ copy(prt().link, 'Ссылка скопирована — отправьте её тренеру'); return }
    if(NEWTR && !onbState().invited){ onbState().invited = true; saveState() }
    copy(onbInvite(), 'Ссылка скопирована') },
  'ac-share': () => { const l = prt().link;
    if(navigator.share) navigator.share({url:l}).catch(() => {}); else copy(l, 'Ссылка скопирована — отправьте её тренеру') },
  'ac-ntf': b => { const n = ntf(), k = b.dataset.k; n[k] = !n[k]; saveState(); T.repaint() },
  'ac-out': () => askSheet('ac-out', 'Выйти из аккаунта?', 'Клиенты, тренировки и базы останутся. Войти снова — по номеру телефона', 'Выйти', 'ac-out-ok', ''),
  'ac-out-ok': () => { closeSheet(); say('В прототипе выход не настроен') },
  'ac-del': () => askSheet('ac-del', 'Удалить аккаунт?', 'Клиенты, тренировки, базы и история удалятся без восстановления, подписка перестанет продлеваться', 'Удалить аккаунт', 'ac-del-ok', 'rm'),
  'ac-del-ok': () => { closeSheet(); say('В прототипе аккаунт не удаляется') }
};
/* живые поля экрана: фото и время тихих часов */
function bind(){
  const ph = document.getElementById('acPhoto');
  if(ph) ph.onchange = e => { const f = e.target.files[0]; if(f) photoFrom(f, url => { P().photo = url; saveState(); T.repaint(); say('Фото обновлено') }) };
  document.querySelectorAll('.ac-time').forEach(i => { i.onchange = () => { if(!i.value) return; ntf()[i.dataset.k] = i.value; saveState(); T.repaint() } });
}

window.TACC = {scr:{profile:scrProfile, sub:scrSub, notify:scrNotify, partner:scrPartner}, acts, bind};
})();
