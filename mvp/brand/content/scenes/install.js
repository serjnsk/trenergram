/* Ролики 02/03 «Иконка на экран» — тренер отправляет их клиентам заранее,
   поэтому тренер в кадре без имени. Таймлайн по схеме
   1) ссылка тренера копируется в Telegram → 2) браузер телефона →
   3) вход по номеру → 4) «На экран „Домой“» → 5) значок на экране.
   Телефон — scenes/install-phone.html?os=…, управляется через его window.ST. */
function installScene(os) {
  const IOS = os === 'ios', BR = IOS ? 'Safari' : 'Chrome';
  const S = Scene({ format: '9:16', duration: IOS ? 30.5 : 29 });
  S.screen('install-phone.html?os=' + os, { device: 'phone', size: [360, 780], settle: 900 });
  const at = (t, fn) => S.cue(t, (d, w) => fn(w.ST));

  // 1. Ссылка в Telegram
  S.caption(.2, 4.4, 'Скопируйте ссылку\nв *Telegram*', { sub: 'Шаг 1 из 5 · Ссылку пришлёт тренер — нажмите на неё и удерживайте' });
  at(1.0, st => st.tap('#link', true));
  at(1.5, st => st.sel());
  at(2.2, st => st.on('tgmenu'));
  at(2.9, st => st.hl('#copy'));
  at(3.1, st => st.tap('#copy'));
  at(3.5, st => { st.on('tgmenu', false); st.on('toast'); });
  at(4.5, st => st.on('toast', false));

  // 2. Браузер телефона
  S.caption(4.8, 9.3, `Откройте *${BR}*`, { sub: 'Шаг 2 из 5 · Обычный браузер телефона, не Telegram' });
  at(4.9, st => st.show('home'));
  at(5.9, st => st.tap('#brIcon'));
  at(6.3, st => st.show('br'));
  at(7.1, st => st.tap('#addr'));
  at(7.3, st => { st.focus(); st.on('paste'); });
  at(8.2, st => { st.hl('#paste'); st.tap('#paste'); });
  at(8.6, st => { st.on('paste', false); st.open(); });

  // 3. Вход по номеру
  S.caption(9.6, 15.2, 'Войдите\nпо *номеру телефона*', { sub: 'Шаг 3 из 5 · Код придёт в СМС' });
  at(10.0, st => st.tap('#tel'));
  '9214001822'.split('').forEach((_, i) => at(10.3 + i * .13, st => st.type('#tel', '9214001822'.slice(0, i + 1))));
  at(12.0, st => st.tap('#getcode'));
  at(12.15, st => { st.skipWizard(); st.appClick('#getcode'); });
  '4821'.split('').forEach((_, i) => at(13.0 + i * .22, st => st.type('#otp', '4821'.slice(0, i + 1))));
  at(14.5, st => st.goHome());

  // 4. На экран «Домой»
  let t = 15.6;
  if (IOS) {
    S.caption(t, 22, 'Добавьте\n*на экран «Домой»*', { sub: 'Шаг 4 из 5 · Поделиться → На экран «Домой» → Добавить' });
    at(16.0, st => st.tap('#more'));
    at(16.3, st => { st.on('bmenu'); st.hl('#mShare'); });
    at(17.3, st => st.tap('#mShare'));
    at(17.6, st => { st.on('bmenu', false); st.on('share'); });
    at(18.6, st => st.hl('#toHome'));
    at(19.1, st => st.tap('#toHome'));
    at(19.4, st => { st.on('share', false); st.on('addsh'); });
    at(20.5, st => st.hl('#addBtn'));
    at(20.9, st => st.tap('#addBtn'));
    at(21.3, st => { st.on('addsh', false); st.show('home'); });
    t = 22.2;
  } else {
    S.caption(t, 20.6, 'Добавьте\n*на главный экран*', { sub: 'Шаг 4 из 5 · Меню → Добавить на гл. экран → Установить' });
    at(16.0, st => st.tap('#more'));
    at(16.3, st => { st.on('bmenu'); st.hl('#mShare'); });
    at(17.3, st => st.tap('#mShare'));
    at(17.6, st => { st.on('bmenu', false); st.on('inst'); });
    at(18.6, st => st.hl('#instBtn'));
    at(19.1, st => st.tap('#instBtn'));
    at(19.5, st => { st.on('inst', false); st.show('home'); });
    t = 20.7;
  }

  // 5. Значок
  S.caption(t, t + 4.8, '*Значок*\nна экране', { sub: 'Шаг 5 из 5 · Открывайте Тренерграм в одно касание' });
  at(t + .3, st => st.addIcon());
  at(t + 2.4, st => st.tap('#me'));
  at(t + 2.8, st => st.launch());
  S.outro(t + 5.3, { tag: 'Тренировки *в одно касание*' });
  S.start();
}
