/* ═══════════════════════════════════════════════════════════════
   0. ВХОД (REG-1, REG-2)
   Ссылка тренера → телефон → код → знакомство. Минимум полей: остальное
   клиент заполнит в профиле, когда захочет.
   ═══════════════════════════════════════════════════════════════ */
const ONB = {phone:'', code:''};
const wmSmall = () => `<span class="wm sm"><i>Т</i>РЕНЕРГРА<i>М</i></span>`;

ACT.onbNew = () => { ONB.returning = false; Nav.go('#/in/phone') };
ACT.onbBack = () => { ONB.returning = true; Nav.go('#/in/phone') };
function onbDone(msg){
  CS.onb = true; saveCS(); Side.render(); SEL.d = TODAY;
  Nav.stack = []; location.hash = '#/train';
  setTimeout(() => toast(msg), 300);
}

/* 0.1 Заставка */
route('/in/splash', () => ({
  sb:'acc',
  html:`<div class="splash" data-go="#/in/invite"><span class="wm">Тренерграм</span><div class="tap">Коснитесь, чтобы продолжить</div></div>`,
  mount(){ clearTimeout(ONB.t); ONB.t = setTimeout(() => { if(location.hash === '#/in/splash') Nav.go('#/in/invite') }, 2200) },
}));

/* 0.2 Приглашение тренера */
route('/in/invite', (p, q) => {
  if(q.bad) return {html:`<div class="onb">
      <div class="top"><button class="ib" data-act="back" data-to="#/in/splash">${ICO.back}</button>${wmSmall()}<span style="width:40px"></span></div>
      <div class="err-card"><div class="pic">${ICO.link}</div>
        <b>Ссылка больше не работает</b>
        <p>Возможно, тренер создал новую. Попросите у него свежую ссылку-приглашение — или войдите по номеру, если уже занимаетесь.</p></div>
      <div class="sp"></div>
      <button class="btn" data-go="#/in/phone">Войти по номеру телефона</button>
    </div>`};
  return {html:`<div class="onb">
    <div class="top"><span></span>${wmSmall()}<span style="width:30px"></span></div>
    <div class="invite">
      ${UI.av(TRAINER.ini, 'xl')}
      <div class="who">${esc(TRAINER.n)}</div>
      <div class="ws">${esc(TRAINER.workspace)} · ${esc(TRAINER.city)}</div>
      <div class="msg">приглашает вас тренироваться в Тренерграме</div>
      <div class="pts">
        <div><i>${ICO.cal}</i><span>Тренировки от тренера — на каждый день, с весами под ваши максимумы</span></div>
        <div><i>${ICO.chk}</i><span>Отмечайте подходы и результаты — тренер видит их сразу</span></div>
        <div><i>${ICO.off}</i><span>Работает в зале без интернета</span></div>
      </div>
    </div>
    <div class="sp"></div>
    <button class="btn" data-act="onbNew">Продолжить</button>
    <div class="alt"><button class="lnk" data-act="onbBack">У меня уже есть аккаунт</button></div>
  </div>`};
});

/* 0.3 Номер телефона */
const fmtPhone = d => { d = d.slice(0, 10); const p = [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)].filter(Boolean);
  return p.length ? p[0] + (p[1] ? ' ' + p[1] : '') + (p[2] ? '-' + p[2] : '') + (p[3] ? '-' + p[3] : '') : '' };
route('/in/phone', () => ({
  html:`<div class="onb">
    <div class="top"><button class="ib" data-act="back" data-to="#/in/invite">${ICO.back}</button></div>
    <h1>Ваш номер телефона</h1>
    <p class="lead">Пришлём код в СМС. Без паролей и почты.</p>
    <label class="phonein"><span class="cc">+7</span><input id="ph" inputmode="tel" autocomplete="tel-national" placeholder="900 000-00-00" value="${esc(fmtPhone(ONB.phone))}"></label>
    <div class="sp"></div>
    <button class="btn" id="ph-go" disabled>Получить код</button>
    <p class="fine">Нажимая «Получить код», вы принимаете <a>условия сервиса</a> и соглашаетесь на <a>обработку персональных данных</a>.</p>
  </div>`,
  mount(v){
    const inp = $('#ph', v), go = $('#ph-go', v);
    const upd = () => { const d = inp.value.replace(/\D/g, '').replace(/^[78](?=\d{10})/, ''); ONB.phone = d.slice(0, 10); inp.value = fmtPhone(ONB.phone); go.disabled = ONB.phone.length < 10 };
    inp.addEventListener('input', upd); upd();
    go.onclick = () => { if(ONB.phone.length === 10){ ONB.code = ''; Nav.go('#/in/code') } };
    setTimeout(() => inp.focus(), 250);
  },
}));

/* 0.4 Код из СМС. В прототипе подходит любой код, кроме 0000 — на нём видно ошибку. */
route('/in/code', () => ({
  html:`<div class="onb">
    <div class="top"><button class="ib" data-act="back" data-to="#/in/phone">${ICO.back}</button></div>
    <h1>Код из СМС</h1>
    <p class="lead">Отправили на +7 ${esc(fmtPhone(ONB.phone) || '913 240-11-08')}</p>
    <label style="position:relative;display:block"><div class="code" id="cd">${'<i></i>'.repeat(4)}</div>
      <input class="code-in" id="cd-in" inputmode="numeric" autocomplete="one-time-code" maxlength="4"></label>
    <div class="code-e" id="cd-e"></div>
    <div class="resend" id="cd-r"></div>
    <div class="sp"></div>
    <p class="fine">В прототипе подходит любой код. «0000» — посмотреть ошибку.</p>
  </div>`,
  mount(v){
    const inp = $('#cd-in', v), box = $('#cd', v), er = $('#cd-e', v), rs = $('#cd-r', v);
    const paint = () => { const s = inp.value; box.classList.remove('err');
      $$('i', box).forEach((c, i) => { c.textContent = s[i] || ''; c.classList.toggle('cur', i === Math.min(s.length, 3) && document.activeElement === inp) }) };
    inp.addEventListener('input', () => { inp.value = inp.value.replace(/\D/g, '').slice(0, 4); er.textContent = ''; paint();
      if(inp.value.length === 4){
        if(inp.value === '0000'){ box.classList.add('err'); er.textContent = 'Неверный код. Проверьте СМС или запросите новый'; inp.value = ''; setTimeout(paint, 900) }
        else setTimeout(() => { if(ONB.returning){ onbDone('С возвращением!') } else Nav.go('#/in/about') }, 250);
      } });
    inp.addEventListener('focus', paint); inp.addEventListener('blur', paint);
    box.onclick = () => inp.focus();
    let left = 59; clearInterval(ONB.ti);
    const tick = () => { rs.innerHTML = left > 0 ? `Отправить ещё раз через 0:${String(left).padStart(2, '0')}` : `<button id="cd-again">Отправить код ещё раз</button>`;
      const a = $('#cd-again', rs); if(a) a.onclick = () => { left = 59; toast('Код отправлен ещё раз'); tick() }; };
    tick(); ONB.ti = setInterval(() => { if(!document.body.contains(rs)){ clearInterval(ONB.ti); return } left--; tick(); if(left <= 0) clearInterval(ONB.ti) }, 1000);
    setTimeout(() => inp.focus(), 250); paint();
  },
}));

/* 0.5 Знакомство — то, что тренер видит в шапке карточки клиента. */
route('/in/about', () => {
  const me = Model.me() || {}, P = CS.prof[CS.cid] || {};
  const [fn, ...ln] = String(P.n || '').split(' ');
  return {html:`<div class="onb">
    <div class="top"><button class="ib" data-act="back" data-to="#/in/code">${ICO.back}</button></div>
    <h1>Давайте знакомиться</h1>
    <p class="lead">Эти данные увидит ваш тренер.</p>
    <div style="margin-top:14px">
      <label class="fl"><span class="k">Имя</span><input id="ab-f" placeholder="Введите имя" value="${esc(fn || '')}" autocomplete="given-name"></label>
      <label class="fl"><span class="k">Фамилия</span><input id="ab-l" placeholder="Введите фамилию" value="${esc(ln.join(' '))}" autocomplete="family-name"></label>
      <div class="fl"><span class="k">Пол</span><div class="seg" id="ab-s"><button data-v="м" class="${(P.sex || me.sex) === 'м' ? 'on' : ''}">Мужской</button><button data-v="ж" class="${(P.sex || me.sex) === 'ж' ? 'on' : ''}">Женский</button></div></div>
      <label class="fl"><span class="k">Дата рождения</span><input id="ab-b" type="date" value="${esc(P.born || '')}" max="${TODAY}"></label>
      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">
        <label class="fl"><span class="k">Рост, см · необязательно</span><input id="ab-h" inputmode="numeric" placeholder="—" value="${esc(P.h || '')}"></label>
        <label class="fl"><span class="k">Вес, кг · необязательно</span><input id="ab-w" inputmode="decimal" placeholder="—" value="${esc(P.w || '')}"></label>
      </div>
    </div>
    <div class="sp" style="min-height:24px"></div>
    <button class="btn" id="ab-go">Готово</button>
  </div>`,
  mount(v){
    $$('#ab-s button', v).forEach(b => b.onclick = () => { $$('#ab-s button', v).forEach(x => x.classList.toggle('on', x === b)) });
    $('#ab-go', v).onclick = () => {
      const f = $('#ab-f', v).value.trim(), l = $('#ab-l', v).value.trim();
      if(!f){ $('#ab-f', v).closest('.fl').classList.add('err'); $('#ab-f', v).focus(); return }
      const sex = ($('#ab-s .on', v) || {}).dataset?.v;
      CS.prof[CS.cid] = {...(CS.prof[CS.cid] || {}), n:(f + ' ' + l).trim(), ini:(f[0] + (l[0] || '')).toUpperCase(),
        ...(sex ? {sex} : {}), ...($('#ab-b', v).value ? {born:$('#ab-b', v).value} : {}),
        ...(numOf($('#ab-h', v).value) ? {h:numOf($('#ab-h', v).value)} : {}), ...(numOf($('#ab-w', v).value) ? {w:numOf($('#ab-w', v).value)} : {})};
      onbDone('Готово! Вы у тренера ' + TRAINER.n);
    };
  }};
});

/* 0.6 Без тренера — вошёл по номеру, но ни к кому не привязан. */
route('/in/notrainer', () => ({html:`<div class="onb">
    <div class="top"><span></span>${wmSmall()}<span style="width:30px"></span></div>
    <div class="err-card" style="margin-top:56px"><div class="pic" style="background:var(--s1);color:var(--tx3)">${ICO.user}</div>
      <b>Вы пока не у тренера</b>
      <p>Тренировки в Тренерграме пишет ваш тренер. Попросите у него ссылку-приглашение и откройте её на этом телефоне.</p></div>
    <div class="pastein"><input id="nt-in" placeholder="Вставьте ссылку от тренера"><button class="btn sm" id="nt-go">Открыть</button></div>
    <div class="sp"></div>
    <div class="alt"><button class="lnk" data-go="#/in/phone">Войти с другим номером</button></div>
  </div>`,
  mount(v){ $('#nt-go', v).onclick = () => { const s = $('#nt-in', v).value.trim();
    if(!s){ $('#nt-in', v).focus(); return }
    Nav.go(/trenergram|\/j\//.test(s) ? '#/in/invite' : '#/in/invite?bad=1') } },
}));
