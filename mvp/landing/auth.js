/* ═══════════════════════════════════════════════════════════════
   ВХОД И РЕГИСТРАЦИЯ — две модалки на одной разметке (стили — auth.css)

   «Войти» открывает «Вход» (#login), «Начать бесплатно» — «Регистрацию»
   (#signup). Шаги у обеих одни: номер → код из СМС → дальше по номеру.
   Номер уже есть — входим в кабинет; номера нет — короткая анкета и
   новый аккаунт. Из какой модалки пришли, важно только для текста:
   вход с новым номером ведёт в анкету, регистрация с известным — в кабинет.

   Прототип: код подходит любой. Известные номера — номер демо-тренера
   (TRAINER.phone в data.js, полная демо-база) и те, что уже прошли
   регистрацию в этом браузере (tg.users) — они попадают в режим
   «новый тренер» (?new=1) со своим прогрессом.
   ═══════════════════════════════════════════════════════════════ */
(function(){
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const RM = matchMedia('(prefers-reduced-motion: reduce)').matches;
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const IMG = id => `../assets/ex/img/${id}.jpg`;
const DEMO = '9214001822';
const CAB = '../index.html';
const ls = { get(k, d){ try{ return JSON.parse(localStorage.getItem(k)) ?? d }catch(_){ return d } },
             set(k, v){ try{ localStorage.setItem(k, JSON.stringify(v)) }catch(_){} } };
const users = () => ls.get('tg.users', {});
const fmt = d => { d = d.slice(0, 10); return [d.slice(0, 3), d.slice(3, 6), d.slice(6, 8), d.slice(8, 10)].filter(Boolean)
  .reduce((s, x, i) => s + (i === 0 ? x : i === 1 ? ' ' + x : '-' + x), ''); };
const ic = {
  x: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"><path d="M4 4l8 8M12 4l-8 8"/></svg>',
  back: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M13 8H3M7 4 3 8l4 4"/></svg>',
  ok: '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 8.5 6.5 11.5 12.5 4.5"/></svg>'
};

/* ─── тексты двух модалок ─── */
const MODE = {
  login:  { h: 'Вход',
            sw: ['Ещё нет аккаунта?', 'Зарегистрироваться', 'signup'] },
  signup: { h: 'Регистрация',
            sw: ['Уже есть аккаунт?', 'Войти', 'login'] }
};

/* ─── преимущества: у каждого своя сцена ─── */
const SLIDES = [
  { h: 'Тренировка <em>текстом</em>, как в заметках', p: 'Пишите как привыкли — AI разберёт текст на упражнения, подходы и проценты.',
    st: `<div class="mk m1">
      <div class="tx"><span>присед 5×5 75%</span><span>жим 4×6 70%</span><span>подтяг 10</span></div>
      <div class="mid"><span class="ai">✦ AI</span></div>
      <div class="rw"><img src="${IMG('0043-qXTaZnJ')}" alt=""><span>Присед со штангой</span><b>5×5</b><em>75 %</em></div>
      <div class="rw"><img src="${IMG('0025-EIeI8Vf')}" alt=""><span>Жим лёжа</span><b>4×6</b><em>70 %</em></div>
      <div class="rw"><img src="${IMG('0652-lBDjFxJ')}" alt=""><span>Подтягивания</span><b>10</b><em></em></div>
    </div>` },
  { h: 'Веса считаются <em>сами</em>', p: 'Проценты превращаются в килограммы от рекорда каждого клиента. Новый рекорд — веса пересчитаются.',
    st: `<div class="mk m2">
      <div class="mk-h"><b>Присед · 75 % от 1ПМ</b><span class="pr">${ic.ok} Новый рекорд</span></div>
      <div class="row" data-pm="190" data-up="200"><i class="av">ИП</i><span>Иван</span><s>1ПМ 190</s><b>0</b></div>
      <div class="row" data-pm="85"><i class="av">МС</i><span>Мария</span><s>1ПМ 85</s><b>0</b></div>
      <div class="row" data-pm="160"><i class="av">ОК</i><span>Олег</span><s>1ПМ 160</s><b>0</b></div>
      <div class="row" data-pm="120"><i class="av">АЛ</i><span>Анна</span><s>1ПМ 120</s><b>0</b></div>
    </div>` },
  { h: 'Одна программа — <em>вся группа</em>', p: 'Назначьте программу двадцати клиентам разом и поправьте её одному, не трогая остальных.',
    st: `<div class="m3">
      <div class="pg"><i>С</i><div><b>Сила · 4 недели</b><s>12 тренировок</s></div></div>
      <svg class="ln" viewBox="0 0 340 46" preserveAspectRatio="none"><path d="M170 0v20M170 20H20v26M170 20h150v26M170 20v26"/></svg>
      <div class="dots">${Array.from({ length: 20 }, (_, i) => `<i style="--i:${i}"${i === 13 ? ' class="own">✎' : '>'}</i>`).join('')}</div>
      <div class="ft"><b>20 клиентов</b> · у одного своя правка</div>
    </div>` },
  { h: 'Всё важное — <em>в ленте</em>', p: 'Рекорды, выполненные тренировки и вопросы клиентов собираются в одном месте. Ответить можно прямо оттуда.',
    st: `<div class="mk m4">
      <div class="mk-h"><b>Лента событий</b><span class="cnt">3</span></div>
      <div class="ev"><i class="av">МС</i><div><b><span class="tg t-pr">Рекорд</span>Мария Соколова</b><s>Жим лёжа — 70 кг, +5 кг к прошлому</s></div></div>
      <div class="ev"><i class="av">ОК</i><div><b><span class="tg t-q">Вопрос</span>Олег Карпов</b><s>«Можно заменить выпады на болгарские?»</s></div></div>
      <div class="ev"><i class="av">ИП</i><div><b><span class="tg t-ok">Готово</span>Иван Петров</b><s>Выполнил тренировку «Ноги · день 3»</s></div></div>
    </div>` },
  { h: 'Клиент тренируется <em>в приложении</em>', p: 'Тренировка с весами приходит клиенту в телефон — он отмечает подходы, а вы видите результат.',
    st: `<div class="m5"><div class="sc">
      <span class="k">Сегодня</span><h4>Ноги · день 3</h4>
      <div class="ex"><b>Присед со штангой</b><s>4×5 · 75 %</s>
        ${[1, 2, 3, 4].map(n => `<div class="set"><span>${n}</span><em>142,5 кг × 5</em><s></s><i>${ic.ok}</i></div>`).join('')}
      </div>
      <div class="ex nx"><b>Жим ногами</b><s>3×10 · 120 кг</s>
        ${[1, 2].map(n => `<div class="set"><span>${n}</span><em>120 кг × 10</em><s></s><i>${ic.ok}</i></div>`).join('')}
      </div>
      <div class="fin">Завершить тренировку</div>
    </div></div>` }
];

/* ─── разметка ─── */
const ov = document.createElement('div');
ov.className = 'au-ov';
ov.innerHTML = `<div class="au" role="dialog" aria-modal="true" aria-labelledby="auH">
  <aside class="au-l" aria-hidden="true">
    <span class="logo">Тренерграм</span>
    <div class="au-sls">${SLIDES.map(s => `<div class="au-sl"><div class="au-st">${s.st}</div><h3>${s.h}</h3><p>${s.p}</p></div>`).join('')}</div>
    <div class="au-bars">${SLIDES.map((_, i) => `<button type="button" tabindex="-1" data-i="${i}"><i></i></button>`).join('')}</div>
  </aside>
  <div class="au-r">
    <button class="au-x" type="button" aria-label="Закрыть">${ic.x}</button>
    <section class="au-step" data-s="phone">
      <h2 id="auH"></h2>
      <label class="au-lbl" for="auTel">Номер телефона</label>
      <div class="au-fld"><span class="pre">+7</span><input id="auTel" type="tel" inputmode="tel" autocomplete="tel-national" placeholder="900 000-00-00"></div>
      <button class="lb au-go" id="auGet" type="button" disabled>Получить код</button>
      <p class="au-legal">Продолжая, вы соглашаетесь с <a href="#">условиями сервиса</a> и обработкой персональных данных</p>
      <p class="au-sw"><span id="auSwT"></span> <button type="button" id="auSw"></button></p>
    </section>
    <section class="au-step" data-s="code">
      <button class="au-back" type="button" data-back aria-label="Изменить номер">${ic.back}</button>
      <h2>Код из СМС</h2><p class="sub">Отправили на <b id="auTo"></b></p>
      <label class="au-otp" id="auOtp"><input id="auCode" type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="4" aria-label="Код из СМС"><span></span><span></span><span></span><span></span></label>
      <p class="au-resend" id="auResend"></p>
      <button class="au-lnk" type="button" data-back>Изменить номер</button>
    </section>
    <section class="au-step" data-s="data">
      <h2>Создаём аккаунт</h2>
      <p class="sub" id="auDataSub"></p>
      <div class="au-grid">
        <div><label class="au-lbl" for="auFirst">Имя</label><div class="au-fld sm"><input id="auFirst" autocomplete="given-name"></div></div>
        <div><label class="au-lbl" for="auLast">Фамилия</label><div class="au-fld sm"><input id="auLast" autocomplete="family-name"></div></div>
      </div>
      <label class="au-lbl" for="auCity">Город</label>
      <div class="au-fld sm"><input id="auCity" autocomplete="address-level2"></div>
      <button class="lb au-go" id="auCreate" type="button" disabled>Создать аккаунт</button>
    </section>
    <section class="au-step" data-s="ok"><div class="au-ok" id="auOk"></div></section>
  </div>
</div>`;
document.body.append(ov);

const S = { mode: 'signup', phone: '', step: 'phone' };
const tel = $('#auTel'), code = $('#auCode'), otp = $('#auOtp');

function step(s){
  S.step = s;
  $$('.au-step', ov).forEach(x => x.classList.toggle('on', x.dataset.s === s));
  const f = { phone: tel, code, data: $('#auFirst') }[s];
  if (f) setTimeout(() => f.focus({ preventScroll: true }), 30);
}
function paintMode(){
  const m = MODE[S.mode];
  $('#auH').textContent = m.h;
  $('#auSwT').textContent = m.sw[0]; $('#auSw').textContent = m.sw[1];
}

/* ─── открыть / закрыть ─── */
let lastFocus = null;
function open(mode){
  S.mode = mode; paintMode();
  if (!ov.classList.contains('on')){ lastFocus = document.activeElement; S.phone = ''; tel.value = ''; tel.dispatchEvent(new Event('input')); step('phone'); }
  else if (S.step === 'phone') step('phone');
  ov.classList.add('on'); document.documentElement.classList.add('au-lock');
  slidesStart();
}
function close(){
  ov.classList.remove('on'); document.documentElement.classList.remove('au-lock');
  clearInterval(rsT); slidesStop();
  if (/^#(login|signup)$/.test(location.hash)) history.replaceState(null, '', location.pathname + location.search);
  lastFocus?.focus?.({ preventScroll: true });
}
function fromHash(){ const m = /^#(login|signup)$/.exec(location.hash); if (m) open(m[1]); }
addEventListener('hashchange', fromHash);
document.addEventListener('click', e => {
  const a = e.target.closest('a[href="#login"], a[href="#signup"]');
  if (!a) return;
  e.preventDefault();
  history.replaceState(null, '', a.getAttribute('href'));
  open(a.getAttribute('href').slice(1));
});
$('.au-x', ov).onclick = close;
ov.addEventListener('mousedown', e => { if (e.target === ov) close(); });
document.addEventListener('keydown', e => {
  if (!ov.classList.contains('on')) return;
  if (e.key === 'Escape') close();
  /* фокус не уходит за модалку */
  if (e.key === 'Tab'){
    const f = $$('button, input, a[href]', $('.au-r', ov)).filter(x => x.offsetParent && !x.disabled);
    const i = f.indexOf(document.activeElement);
    if (e.shiftKey && i <= 0){ e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && i === f.length - 1){ e.preventDefault(); f[0].focus(); }
  }
});
$('#auSw').onclick = () => { S.mode = MODE[S.mode].sw[2]; history.replaceState(null, '', '#' + S.mode); paintMode(); };

/* ─── шаг 1: номер ─── */
tel.addEventListener('input', () => {
  let d = tel.value.replace(/\D/g, '');
  if (d.length === 11 && /^[78]/.test(d)) d = d.slice(1);
  S.phone = d.slice(0, 10); tel.value = fmt(S.phone);
  $('#auGet').disabled = S.phone.length !== 10;
});
tel.addEventListener('keydown', e => { if (e.key === 'Enter' && !$('#auGet').disabled) $('#auGet').click(); });
$('#auGet').onclick = () => {
  $('#auTo').textContent = '+7 ' + fmt(S.phone);
  code.value = ''; paintOtp(); resend(); step('code');
};

/* ─── шаг 2: код ─── */
let rsT = 0;
function resend(){
  let n = 59; clearInterval(rsT);
  const p = () => { $('#auResend').innerHTML = n > 0 ? `Отправить код повторно через 0:${String(n).padStart(2, '0')}` : '<button type="button" id="auRe">Отправить код повторно</button>';
    if (n <= 0){ clearInterval(rsT); $('#auRe').onclick = resend; } n--; };
  p(); rsT = setInterval(p, 1000);
}
function paintOtp(){
  const v = code.value;
  $$('span', otp).forEach((s, i) => { s.textContent = v[i] || ''; s.classList.toggle('at', i === Math.min(v.length, 3)); });
}
code.addEventListener('focus', () => otp.classList.add('focus'));
code.addEventListener('blur', () => otp.classList.remove('focus'));
code.addEventListener('input', () => {
  code.value = code.value.replace(/\D/g, '').slice(0, 4); paintOtp();
  if (code.value.length === 4) check();
});
$$('[data-back]', ov).forEach(b => b.onclick = () => { clearInterval(rsT); step('phone'); });

/* Код принят — дальше решает номер, а не то, какую модалку открыли */
function check(){
  otp.classList.add('wait'); code.disabled = true;
  $('#auResend').innerHTML = '<span class="au-spin"></span>Проверяем код…'; clearInterval(rsT);
  setTimeout(() => {
    otp.classList.remove('wait'); code.disabled = false;
    const u = S.phone === DEMO ? { first: 'Сергей', demo: true } : users()[S.phone];
    if (u) return enter(u);
    $('#auDataSub').innerHTML = S.mode === 'login'
      ? `Аккаунта с номером <b>+7 ${esc(fmt(S.phone))}</b> пока нет — создадим его. Осталось представиться.`
      : '';
    $('#auDataSub').hidden = S.mode !== 'login';
    step('data');
  }, 800);
}

/* ─── вход: номер знакомый ─── */
function enter(u){
  const ini = ((u.first || '')[0] || '') + ((u.last || '')[0] || (u.demo ? 'К' : ''));
  $('#auOk').innerHTML = `<div class="av">${esc(ini.toUpperCase())}</div>
    <h2>С возвращением${u.first ? ', ' + esc(u.first) : ''}!</h2>
    <p class="sub">${S.mode === 'signup' ? 'Этот номер уже зарегистрирован — открываем ваш кабинет' : 'Открываем ваш кабинет'}</p>
    <p class="au-resend"><span class="au-spin"></span>Загружаем данные…</p>`;
  step('ok');
  if (!u.demo) ls.set('tg.me', u);
  setTimeout(() => { location.href = CAB + (u.demo ? '?new=0' : '?new=1'); }, 1400);
}

/* ─── шаг 3: анкета нового тренера ─── */
const FLD = ['#auFirst', '#auLast', '#auCity'];
const valid = () => FLD.every(s => $(s).value.trim());
FLD.forEach(s => $(s).addEventListener('input', () => { $('#auCreate').disabled = !valid(); }));
$('.au-step[data-s="data"]').addEventListener('keydown', e => { if (e.key === 'Enter' && valid()) $('#auCreate').click(); });
$('#auCreate').onclick = () => {
  const [first, last, city] = FLD.map(s => $(s).value.trim());
  const me = { first, last, n: first + ' ' + last, ini: (first[0] + last[0]).toUpperCase(), city, phone: '+7 ' + fmt(S.phone) };
  const all = users(); all[S.phone] = me; ls.set('tg.users', all); ls.set('tg.me', me);
  $('#auOk').innerHTML = `<div class="av">${esc(me.ini)}</div>
    <h2>Аккаунт создан</h2>
    <p class="sub">${esc(first)}, 14 дней всё открыто бесплатно. Начнём с первых шагов в кабинете.</p>
    <p class="au-resend"><span class="au-spin"></span>Готовим кабинет…</p>`;
  step('ok');
  setTimeout(() => { location.href = CAB + '?new=reset'; }, 1400);
};

/* ─── слайдер преимуществ ─── */
const sls = $$('.au-sl', ov), bars = $$('.au-bars button', ov), left = $('.au-l', ov);
let cur = -1, tl = [];
const later = (fn, ms) => tl.push(setTimeout(fn, ms));
const kg = v => (Math.round(v / 2.5) * 2.5).toLocaleString('ru-RU');
function count(el, to, ms){
  const t0 = performance.now();
  const f = t => { const k = Math.min(1, (t - t0) / ms); el.textContent = kg(to * (1 - Math.pow(1 - k, 3))) + ' кг'; if (k < 1 && cur >= 0) requestAnimationFrame(f); };
  requestAnimationFrame(f);
}
/* Сцены 2 и 5 считают и отмечают из скрипта, остальные — чистый CSS */
const PLAY = {
  1(sl){
    const rows = $$('.row', sl);
    rows.forEach(r => { r.classList.remove('up'); $('s', r).textContent = '1ПМ ' + r.dataset.pm; $('b', r).textContent = '0 кг'; });
    $('.pr', sl).classList.remove('on');
    rows.forEach((r, i) => later(() => count($('b', r), r.dataset.pm * .75, 700), 250 + i * 160));
    const r = rows.find(x => x.dataset.up);
    later(() => { r.classList.add('up'); $('s', r).textContent = '1ПМ ' + r.dataset.up; $('.pr', sl).classList.add('on'); count($('b', r), r.dataset.up * .75, 500); }, 2600);
  },
  4(sl){
    const sets = $$('.ex:not(.nx) .set', sl), fin = $('.fin', sl);
    sets.forEach(s => s.classList.remove('ok')); fin.classList.remove('on');
    sets.forEach((s, i) => later(() => s.classList.add('ok'), 600 + i * 520));
    later(() => fin.classList.add('on'), 600 + sets.length * 520);
  }
};
function go(i){
  tl.forEach(clearTimeout); tl = [];
  cur = (i + sls.length) % sls.length;
  sls.forEach((s, k) => s.classList.toggle('on', k === cur));
  bars.forEach((b, k) => { b.classList.remove('on'); b.classList.toggle('done', k < cur); });
  void left.offsetWidth;
  bars[cur].classList.add('on');
  if (cur === 4) fitPhone();
  if (RM){ $$('.row b', sls[1]).forEach(b => { b.textContent = kg(b.parentNode.dataset.pm * .75) + ' кг' }); $$('.ex:not(.nx) .set', sls[4]).forEach(s => s.classList.add('ok')); return; }
  PLAY[cur]?.(sls[cur]);
}
/* телефон — целиком под высоту сцены, без искажения пропорций */
function fitPhone(){ const st = sls[4].querySelector('.au-st'), ph = $('.m5', st);
  if (st.clientHeight) ph.style.setProperty('--k', Math.min(1, st.clientHeight / ph.offsetHeight).toFixed(3)); }
addEventListener('resize', fitPhone);
function slidesStart(){ if (cur < 0) go(0); }
function slidesStop(){ tl.forEach(clearTimeout); tl = []; cur = -1; sls.forEach(s => s.classList.remove('on')); }
/* Полоска дошла до конца — следующий слайд; при reduced-motion листают только руками */
bars.forEach(b => b.addEventListener('animationend', () => { if (b.classList.contains('on')) go(cur + 1); }));
bars.forEach(b => b.onclick = () => go(+b.dataset.i));
left.addEventListener('mouseenter', () => left.classList.add('hold'));
left.addEventListener('mouseleave', () => left.classList.remove('hold'));

fromHash();
})();
