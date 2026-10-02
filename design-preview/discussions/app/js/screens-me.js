/* ═══════════════════════════════════════════════════════════════
   3. ПРОФИЛЬ — кто я, мой тренер, настройки, данные на устройстве (PRO-1)
   ═══════════════════════════════════════════════════════════════ */
const LEVELS = ['Новичок','Начальный','Средний','Продвинутый'];
const stazh = since => { if(!since) return ''; const y = Math.floor(daysBetween(since, TODAY) / 365.25);
  return y < 1 ? 'меньше года' : y + ' ' + plural(y, 'год', 'года', 'лет') };

/* ═══════════ 3.1 ПРОФИЛЬ ═══════════ */
route('/me', () => {
  const me = Model.me(); if(!me) return {tab:'me', cls:'grey sx', html:UI.lt({title:'Профиль'})};
  const age = ageOf(me.born), pend = Model.pending().length;
  const sub = [me.sex === 'ж' ? 'Женщина' : me.sex === 'м' ? 'Мужчина' : '', age != null ? age + ' ' + plural(age, 'год', 'года', 'лет') : ''].filter(Boolean).join(', ');
  const sub2 = [me.sport, me.level, me.since ? 'стаж ' + stazh(me.since) : ''].filter(Boolean).join(' · ');
  return {tab:'me', cls:'grey sx', html:`${UI.lt({title:'Профиль'})}
    <div class="body">
      <section class="sect"><div class="phead">${UI.av(me.ini || '?', 'l')}<b>${esc(me.n)}</b><s>${esc(sub)}${sub2 ? '<br>' + esc(sub2) : ''}</s></div></section>
      <section class="sect">
      <div class="list">
        ${UI.row({ico:ICO.user, title:'Личные данные', sub:'Имя, дата рождения, вид спорта, рост', go:'#/me/data'})}
        ${UI.row({ico:ICO.heart, title:'Мой тренер', sub:esc(TRAINER.n + ' · ' + TRAINER.workspace), go:'#/me/trainer'})}
      </div>
      <div class="list">
        ${UI.row({ico:ICO.set, title:'Настройки', sub:'Загрузка демонстраций, аккаунт', go:'#/me/settings'})}
        ${UI.row({ico:ICO.device, title:'Данные на устройстве', sub: pend ? `${pend} ${plural(pend, 'запись ждёт', 'записи ждут', 'записей ждут')} отправки` : 'Всё отправлено тренеру', go:'#/me/device'})}
      </div>
      <div class="list">${UI.row({ico:ICO.exit, title:'Выйти', act:'logout', chev:false, cls:'danger'})}</div></section>
      <div class="ver">Тренерграм · прототип приложения клиента</div>
    </div>`};
});
ACT.logout = () => Sheet.open(`<div class="shh"><span class="t"><b>Выйти из аккаунта?</b><s>${esc(Model.me().n)}</s></span></div>
  <p class="plan">${Model.pending().length ? 'Есть записи, которые ещё не ушли тренеру. Подключитесь к сети перед выходом, иначе они пропадут.' : 'Все записи уже у тренера. Войти снова можно по номеру телефона.'}</p>
  <div class="sub2"><button class="btn ghost" data-act="sheetClose">Отмена</button><button class="btn danger" data-act="logoutGo">Выйти</button></div>`);
ACT.logoutGo = () => { Sheet.close(true); CS.onb = false; saveCS(); Nav.stack = []; location.hash = '#/in/splash' };

/* ═══════════ 3.2 ЛИЧНЫЕ ДАННЫЕ ═══════════ */
route('/me/data', () => {
  const me = Model.me() || {};
  const sel = (id, list, v) => `<select id="${id}">${['', ...list].map(x => `<option${x === v ? ' selected' : ''} value="${esc(x)}">${esc(x || '—')}</option>`).join('')}</select>`;
  return {tab:'me', cls:'grey sx', html:`${UI.nav({title:'Личные данные', back:'#/me', line:true})}
    <div class="body pad-foot">
      <section class="sect"><div class="phead" style="padding-bottom:6px">${UI.av(me.ini || '?', 'l')}<button class="edit" data-act="photo">Изменить фото</button></div>
      <div class="form">
        <label class="fl"><span class="k">Имя и фамилия</span><input id="pd-n" value="${esc(me.n || '')}" autocomplete="name"></label>
        <label class="fl"><span class="k">Дата рождения${ageOf(me.born) != null ? ' · ' + ageOf(me.born) + ' ' + plural(ageOf(me.born), 'год', 'года', 'лет') : ''}</span><input id="pd-b" type="date" value="${esc(me.born || '')}" max="${TODAY}"></label>
        <div class="fl"><span class="k">Пол</span><div class="seg" id="pd-s"><button data-v="м" class="${me.sex === 'м' ? 'on' : ''}">Мужской</button><button data-v="ж" class="${me.sex === 'ж' ? 'on' : ''}">Женский</button></div></div>
        <label class="fl ro"><span class="k">Телефон · для входа</span><input value="${esc(me.phone || '')}" readonly></label>
        <label class="fl"><span class="k">Email · необязательно</span><input id="pd-e" type="email" value="${esc(me.email || '')}" placeholder="name@mail.ru" autocomplete="email"></label>
        <label class="fl"><span class="k">Вид спорта</span>${sel('pd-sp', SPORTS, me.sport)}</label>
        <label class="fl"><span class="k">Уровень подготовки</span>${sel('pd-l', LEVELS, me.level)}</label>
        <label class="fl"><span class="k">Тренируюсь с${me.since ? ' · стаж ' + stazh(me.since) + ', считается сам' : ''}</span><input id="pd-y" type="month" value="${esc((me.since || '').slice(0, 7))}" max="${TODAY.slice(0, 7)}"></label>
        <label class="fl"><span class="k">Рост, см</span><input id="pd-h" inputmode="numeric" value="${esc(me.h || '')}" placeholder="—"></label>
      </div>
      <p class="note-s">Вес и объёмы — во вкладке «Прогресс» → «Замеры»: там видна динамика.</p></section>
    </div>
    <div class="foot"><button class="btn" data-act="profSave">Сохранить</button></div>`,
    mount(v){ $$('#pd-s button', v).forEach(b => b.onclick = () => $$('#pd-s button', v).forEach(x => x.classList.toggle('on', x === b))) }};
});
ACT.photo = () => toast('В прототипе фото не загружается');
ACT.profSave = () => {
  const v = App.view, g = id => $('#' + id, v).value.trim();
  const n = g('pd-n'); if(!n){ $('#pd-n', v).focus(); return }
  const w = n.split(/\s+/);
  const sex = ($('#pd-s .on', v) || {}).dataset?.v;
  CS.prof[CS.cid] = {...(CS.prof[CS.cid] || {}), n, ini:(w[0][0] + (w[1] ? w[1][0] : '')).toUpperCase(), born:g('pd-b') || undefined, ...(sex ? {sex} : {}),
    email:g('pd-e'), sport:g('pd-sp') || undefined, level:g('pd-l') || undefined, since: g('pd-y') ? g('pd-y') + '-01' : undefined, h:numOf(g('pd-h')) || undefined, ...pendMark()};
  saveCS(); App.refresh(); Side.render();
  toast(off() ? 'Сохранено на телефоне — тренер увидит, когда появится сеть' : 'Сохранено — тренер видит обновлённые данные');
};

/* ═══════════ 3.3 МОЙ ТРЕНЕР ═══════════ */
route('/me/trainer', () => {
  const me = Model.me() || {}, G = Model.grp(), p = me.prog && program(me.prog);
  const pu = me.paidUntil, left = pu ? daysBetween(TODAY, pu) : null;
  const paid = pu == null ? '' : left < 0 ? `<span class="paid rm"><i></i>просрочена с ${esc(dDM(pu))}</span>` : `<span class="paid ${left <= 3 ? 'warn' : ''}"><i></i>до ${esc(dDM(pu))} · ещё ${left} ${plural(left, 'день', 'дня', 'дней')}</span>`;
  return {tab:'me', cls:'grey sx', html:`${UI.nav({title:'Мой тренер', back:'#/me', line:true})}
    <div class="body">
      <section class="sect"><div class="phead">${UI.av(TRAINER.ini, 'l')}<b>${esc(TRAINER.n)}</b><s>${esc(TRAINER.workspace)} · ${esc(TRAINER.city)}<br>${esc(TRAINER.sports.join(', '))}</s></div>
      <div class="tr-about">${esc(TRAINER.about)}</div></section>
      <section class="sect">${UI.sec('Занятия')}
      <div class="list">
        ${G ? UI.row({ico:ICO.grp, title:'Группа «' + esc(G.n) + '»', sub:esc(G.about || 'Тренировки группы встают в ваш календарь'), chev:false})
            : p && !p.personal ? UI.row({ico:ICO.cal, title:esc(p.title), sub:'С ' + esc(dDM(p.start)) + (p.goal ? ' · ' + esc(p.goal) : ''), chev:false})
            : UI.row({ico:ICO.cal, title:'Индивидуальные тренировки', sub:'Тренер пишет тренировки в ваш календарь', chev:false})}
        ${pu ? UI.row({ico:ICO.lock, title:'Оплачено', sub:paid, chev:false}) : ''}
      </div>
      <p class="note-s">Оплату тренер пока принимает напрямую. Оплата в приложении появится в следующей версии.</p></section>
      <section class="sect">${UI.sec('Связь')}
      <div class="list">
        ${UI.row({ico:ICO.phone, title:esc(TRAINER.phone), sub:'Позвонить', act:'noop', chev:false})}
        ${UI.row({ico:ICO.mail, title:esc(TRAINER.email), sub:'Написать письмо', act:'noop', chev:false})}
        ${UI.row({ico:ICO.chat, title:'Обсуждения', sub:'Вопросы тренеру — под тренировками и упражнениями', go:'#/talk'})}
      </div></section>
    </div>`};
});
ACT.noop = () => toast('В прототипе звонки и письма не отправляются');

/* ═══════════ 3.4 НАСТРОЙКИ ═══════════ */
route('/me/settings', () => ({tab:'me', cls:'grey sx', html:`${UI.nav({title:'Настройки', back:'#/me', line:true})}
  <div class="body">
    <section class="sect">${UI.sec('Загрузка')}
    <div class="list">
      <button class="row" data-act="wifi"><span class="ico">${ICO.cloud}</span><span class="tx"><b>Демонстрации только по Wi-Fi</b><s>Упражнения ближайших двух недель качаются заранее</s></span><span class="sw ${CS.wifiOnly ? 'on' : ''}"></span></button>
      ${UI.row({ico:ICO.device, title:'Место под демонстрации', sub:'Старые удаляются сами, когда место кончается', v:CS.cache + ' МБ', act:'cache'})}
    </div></section>
    <section class="sect">${UI.sec('Приложение')}
    <div class="list">
      ${UI.row({ico:ICO.dumb, title:'Единицы', v:'кг, см', chev:false})}
      ${UI.row({ico:ICO.info, title:'Уведомления', sub:'Появятся в следующей версии', chev:false})}
    </div></section>
    <section class="sect">${UI.sec('Аккаунт')}
    <div class="list">${UI.row({ico:ICO.trash, title:'Удалить аккаунт', sub:'Удалит ваши данные с сервера и из кабинета тренера', act:'delAcc', cls:'danger'})}</div></section>
  </div>`}));
ACT.wifi = () => { CS.wifiOnly = !CS.wifiOnly; saveCS(); App.refresh() };
ACT.cache = () => Sheet.open(`<div class="shh"><span class="t"><b>Место под демонстрации</b><s>сейчас занято около ${Math.min(CS.cache, 38)} МБ</s></span><button class="ib" data-act="sheetClose">${ICO.x}</button></div>
  <div class="list">${[250, 500, 1000, 2000].map(v => `<button class="row" data-act="cacheSet" data-v="${v}"><span class="tx"><b>${v >= 1000 ? v / 1000 + ' ГБ' : v + ' МБ'}</b>${v === 500 ? '<s>по умолчанию</s>' : ''}</span>${CS.cache === v ? `<span style="color:var(--acc);width:20px">${ICO.chk}</span>` : ''}</button>`).join('')}</div>`);
ACT.cacheSet = el => { CS.cache = +el.dataset.v; saveCS(); Sheet.close(); App.refresh() };
ACT.delAcc = () => Sheet.open(`<div class="shh"><span class="t"><b>Удалить аккаунт?</b><s>${esc(Model.me().n)}</s></span></div>
  <p class="plan">Удалятся ваши результаты, замеры, максимумы и переписка с тренером — у вас и в кабинете тренера. Отменить это нельзя.</p>
  <div class="sub2"><button class="btn ghost" data-act="sheetClose">Отмена</button><button class="btn danger" data-act="delGo">Удалить</button></div>`);
ACT.delGo = () => { Sheet.close(true);
  ['res','pm','meas','prof'].forEach(k => delete CS[k][CS.cid]); Chat.wipe(CS.cid);
  CS.onb = false; saveCS(); Model.flush(); Nav.stack = []; location.hash = '#/in/splash'; setTimeout(() => toast('Аккаунт удалён (в прототипе — только записи клиента)'), 400) };

/* ═══════════ 3.5 ДАННЫЕ НА УСТРОЙСТВЕ ═══════════ */
route('/me/device', () => {
  const pend = Model.pending();
  const horizon = addDays(TODAY, 14), lp = Model.lastPub();
  let wdays = 0; const exs = new Set();
  for(let i = 0; i <= 14; i++){ const d = addDays(TODAY, i), x = Model.day(d); if(x.kind === 'work' && x.blocks.length){ wdays++;
    Model.workout(d).blocks.forEach(B => B.parts.flatMap(P => P.type === 'ss' ? P.members : [P]).forEach(P => { if(P.exId) exs.add(P.exId) })) } }
  const until = lp ? (lp < horizon ? lp : horizon) : null;
  const synced = CS.synced ? new Date(CS.synced) : new Date();
  const syncS = (iso(synced) === TODAY ? 'сегодня, ' : dShort(iso(synced)) + ', ') + String(synced.getHours()).padStart(2, '0') + ':' + String(synced.getMinutes()).padStart(2, '0');
  return {tab:'me', cls:'grey sx', html:`${UI.nav({title:'Данные на устройстве', back:'#/me', line:true})}
    <div class="body pad-foot">
      <section class="sect"><div class="list">${UI.row({ico: off() ? ICO.off : ICO.sync, title: off() ? 'Нет сети' : 'Сеть есть', sub: off() ? 'Всё записанное сохраняется на телефоне' : 'Последняя синхронизация: ' + syncS, chev:false})}</div></section>
      <section class="sect">${UI.sec('Ждут отправки')}
      ${pend.length ? `<div class="list">${pend.map(x => UI.row({ico:ICO.clock, title:esc(x.t), sub:x.d ? esc(cap1(dDM(x.d))) : '', chev:false})).join('')}</div>`
        : `<p class="note-s lead">Всё отправлено — тренер видит ваши записи.</p>`}</section>
      <section class="sect">${UI.sec('Сохранено для работы без сети')}
      <div class="list">
        ${UI.row({ico:ICO.cal, title:'Тренировки', sub: until ? 'Опубликованные до ' + esc(dDM(until)) + ' · ' + wdays + ' ' + plural(wdays, 'тренировка', 'тренировки', 'тренировок') + ' на две недели' : 'Опубликованных тренировок пока нет', chev:false})}
        ${UI.row({ico:ICO.img, title:'Демонстрации упражнений', sub: exs.size + ' ' + plural(exs.size, 'упражнение', 'упражнения', 'упражнений') + ' ближайших тренировок · около ' + Math.round(exs.size * 0.34) + ' МБ' + (CS.wifiOnly ? ' · по Wi-Fi' : ''), chev:false})}
        ${UI.row({ico:ICO.dumb, title:'Максимумы, замеры, сообщения', sub:'Всё, целиком', chev:false})}
      </div>
      <p class="note-s">Тренировки открываются в зале и без интернета. Всё, что вы отметите, сохранится на телефоне и уйдёт тренеру, как только появится сеть.</p></section>
    </div>
    <div class="foot"><button class="btn ${off() ? '' : 'ghost'}" data-act="syncNow" ${off() ? 'disabled' : ''}>${ICO.sync}${off() ? 'Нет сети' : 'Синхронизировать сейчас'}</button></div>`};
});
ACT.syncNow = () => { const n = Model.syncAll(); App.refresh(); toast(n ? 'Отправлено: ' + n + ' ' + plural(n, 'запись', 'записи', 'записей') : 'Всё синхронизировано') };
