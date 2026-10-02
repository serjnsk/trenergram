/* ═══════════════════════════════════════════════════════════════
   ЗАПУСК
   ═══════════════════════════════════════════════════════════════ */
/* Телефон целиком помещается в окно: рамка уменьшается, пропорции те же. */
function fitPhone(){
  const ph = $('#phone'); if(!ph) return;
  if(innerWidth <= 760){ ph.style.removeProperty('--z'); return }
  ph.style.setProperty('--z', Math.min(1, (innerHeight - 36) / 864).toFixed(3));
}
addEventListener('resize', fitPhone);

/* Клавиатура на телефоне. Браузер открывает её поверх страницы и экран не
   сжимает (Safari на айфоне — всегда), поэтому подгоняем экран приложения под
   видимую над клавиатурой область: шторки, поле чата и кнопки внизу встают
   прямо над клавиатурой, как в настоящем приложении. Вкладки на это время
   прячутся — их закрыла бы клавиатура. На компьютере ничего не меняется. */
function fitKeyboard(){
  const vv = window.visualViewport, ph = $('#phone'), scr = $('#scr'); if(!vv || !ph) return;
  if(innerWidth > 760){ ph.style.removeProperty('height'); ph.style.removeProperty('top'); scr.classList.remove('kb'); return }
  ph.style.height = Math.round(vv.height) + 'px';
  ph.style.top = Math.round(vv.offsetTop) + 'px';
  scr.classList.toggle('kb', innerHeight - vv.height > 120);
}
if(window.visualViewport){ visualViewport.addEventListener('resize', fitKeyboard); visualViewport.addEventListener('scroll', fitKeyboard) }
addEventListener('resize', fitKeyboard);

/* Тренер опубликовал или поправил тренировку в соседней вкладке —
   приложение предлагает подтянуть. В продукте это делает синхронизация. */
addEventListener('storage', e => {
  if(e.key === 'trenergram.design.chat.state') toast('Тренер обновил тренировки', 'Обновить', () => location.reload(), 12000);
});

/* Тренер написал в соседней вкладке — чат и счётчик на вкладке обновляются.
   Набранный текст не теряется: он в черновике, курсор возвращаем на место. */
addEventListener('storage', e => {
  if(!Chat.isChatKey(e.key) || !CS.onb) return;
  const t = document.getElementById('cm-t'), focused = t && document.activeElement === t, pos = t ? t.selectionStart : 0;
  const b = App.view && $('.body', App.view);
  CH.keep = !(b && b.scrollHeight - b.scrollTop - b.clientHeight < 80);
  App.refresh();
  if(focused){ const nt = document.getElementById('cm-t'); if(nt){ nt.focus(); nt.setSelectionRange(pos, pos) } }
});

Model.migrateRes();
Model.fillSums();
migrateTalk();
Side.render();
paintNet();
fitPhone();
fitKeyboard();
if(!location.hash) history.replaceState(null, '', CS.onb ? '#/train' : '#/in/splash');
App.render('fade');
