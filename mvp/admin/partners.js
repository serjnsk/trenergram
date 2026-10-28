/* ============================================================
   Админка · партнёрская программа (только администратор)

   Сверху — общие условия: процент по умолчанию для всех и правило
   вывода (по умолчанию заработанное идёт только на баланс аккаунта).
   Ниже — заявки на вывод, которые администратор оплачивает вне
   сервиса, и партнёры: сколько привели и заработали, свои условия.
   Свои условия тренера меняются и здесь, и во вкладке его карточки.
   ============================================================ */

/* Окно условий: id тренера, add — тренер выбирается в окне; own, pct, payout — черновик */
const S = { m: null };
const CARDS = ['t1', 't2', 't3'];   // у этих тренеров в прототипе есть карточка

function renderTop() {
  $('#topbar').innerHTML = `
    <div class="crumb"><span class="sep">Настройки</span><span class="sep">›</span><span class="cur">Партнёрская программа</span></div>
    <span class="sp"></span>
    <button class="btn gh sm" data-a="reset" style="height:34px;font-size:14px">Сбросить демо</button>`;
}

function render() {
  renderTop();
  if (ROLE !== 'admin') {
    $('#crm').innerHTML = `<div class="crm-head prt-lock">${ic('lock')}<div><b>Раздел доступен администратору</b>
      <s>Процент партнёров и вывод средств настраивает только администратор. Роль переключается внизу меню.</s></div></div>`;
    return;
  }
  const list = PRT.partners.filter(p => p.invited.length || PRT.own[p.id]).map(p => ({ p, c: prtCond(p.id), st: prtStats(p.id) }))
    .sort((a, b) => b.st.earned - a.st.earned || a.p.n.localeCompare(b.p.n, 'ru'));
  const reqs = prtReqs(), wait = reqs.filter(r => r.st === 'new').length;
  const own = Object.values(PRT.own), ownN = own.filter(o => o.pct != null).length, payN = own.filter(o => o.payout).length;
  const trn = n => `${n} ${W(n, 'тренера', 'тренеров', 'тренеров')}`;
  $('#crm').innerHTML = `
  <div class="crm-head">
    <h1 class="prt-h1">Партнёрская программа</h1>
    <p class="prt-lead">Тренер приводит тренеров по своей ссылке и получает процент с каждой их оплаты подписки. Заработанное он переводит на баланс аккаунта — им оплачивается подписка.</p>
    <div class="pblocks">
      <div class="pblock"><div class="cap">Процент по умолчанию</div>
        <div class="prt-def"><span class="pctin"><input class="inp fin" id="def-pct" type="number" min="0" max="100" step="1" value="${PRT.pct}" aria-label="Процент по умолчанию"><i>%</i></span>
          <button class="btn sm" data-a="defsave" id="def-save" disabled>Сохранить</button></div>
        <div class="note">Для всех тренеров без своего процента${ownN ? `; свой процент — у ${trn(ownN)}` : ''}. Новый процент действует со следующих начислений, начисленное не пересчитывается.</div></div>
      <div class="pblock"><div class="cap">Вывод средств</div>
        <div class="prt-def"><span class="chip">по умолчанию выключен</span>${payN ? `<span class="chip acc">включён у ${trn(payN)}</span>` : ''}</div>
        <div class="note">Без вывода тренер переводит заработанное только на баланс аккаунта. Вывод включается тренеру отдельно — в таблице партнёров или в карточке тренера.</div></div>
    </div>
  </div>
  ${reqs.length ? `<section class="prt-card">
    <div class="prt-sh"><b>Заявки на вывод</b>${wait ? `<span class="chip rm">${wait} ${W(wait, 'ждёт', 'ждут', 'ждут')} выплаты</span>` : ''}</div>
    ${wait ? `<div class="sec-sub">${PRT_REQ_HINT}</div>` : ''}
    ${prtReqHTML(reqs, true)}
  </section>` : ''}
  <section class="prt-card">
    <div class="prt-sh"><b>Партнёры</b><s>${list.length}</s><span class="sp"></span><button class="btn sm" data-a="add">${ic('plus', 2)} Задать условия тренеру</button></div>
    <div class="prt-tbl"><table class="tbl"><thead><tr><th>Тренер</th><th>Приглашено</th><th>Процент</th><th class="r">Заработано</th><th class="r">Доступно</th><th>Вывод средств</th><th></th></tr></thead><tbody>
      ${list.map(({ p, c, st }) => `<tr>
        <td>${CARDS.includes(p.id) ? `<a class="prt-nm" href="trainer.html?id=${p.id}&tab=prt">${esc(p.n)}</a>` : `<b>${esc(p.n)}</b>`}<div class="sub">${esc(p.city)}</div></td>
        <td class="nw">${st.invited}<span class="mut"> · платят ${st.paying}</span></td>
        <td class="nw"><b>${c.pct}%</b> ${c.own ? '<span class="chip acc">свой</span>' : '<span class="mut">общий</span>'}</td>
        <td class="r nw">${prtRub(st.earned)}</td>
        <td class="r nw"><b>${prtRub(st.avail)}</b>${st.wait ? `<div class="sub">ещё ${prtRub(st.wait)} в заявке</div>` : ''}</td>
        <td><button class="switch ${c.payout ? 'on' : ''}" data-a="pay" data-v="${p.id}" role="switch" aria-checked="${c.payout}" aria-label="Вывод средств: ${esc(p.n)}"></button></td>
        <td class="r"><button class="iact" data-a="edit" data-v="${p.id}" title="Изменить условия" aria-label="Изменить условия: ${esc(p.n)}">${ic('edit')}</button></td>
      </tr>`).join('')}
    </tbody></table></div>
  </section>`;
}

/* ─── окно условий ─── */
const closeModal = () => { $('#ov').classList.remove('on'); S.m = null; };
function openCond(id, add) {
  S.m = { id, add, ...(id ? prtCond(id) : { pct: PRT.pct, payout: false }), ...(add ? { own: true } : {}) };
  renderModal();
}
function renderModal() {
  const m = S.m; if (!m) return closeModal();
  const p = !m.add && prtOf(m.id), st = !m.add && prtStats(m.id);
  modal(m.add ? 'Условия для тренера' : 'Условия партнёра',
    (m.add ? `<span class="lab">Тренер</span><select class="inp" data-m="id"><option value="">Выберите тренера</option>${prtAll().filter(t => !PRT.own[t.id]).map(t =>
        `<option value="${t.id}" ${t.id === m.id ? 'selected' : ''}>${esc(t.n)} · ${esc(t.city)}</option>`).join('')}</select>`
      : `<div class="mdt"><b>${esc(p.n)}</b><s>${esc(p.city)} · приглашено ${st.invited}, платят ${st.paying}</s></div>`)
    + `<span class="lab">Условия</span>${prtCondHTML(m)}`,
    `${!m.add && PRT.own[m.id] ? '<button class="btn gh" data-a="mdef">Вернуть общие условия</button>' : ''}<span class="sp"></span>
     <button class="btn gh" data-a="mclose">Отмена</button><button class="btn" data-a="msave" ${m.id ? '' : 'disabled'}>Сохранить</button>`, 560);
}
function saveCond() {
  const m = S.m, n = Math.round(+m.pct);
  if (m.own && (m.pct === '' || !(n >= 0 && n <= 100))) return toast('Процент — от 0 до 100');
  if (m.add && !m.own && !m.payout) return toast('Условия совпадают с общими — задайте свой процент или вывод средств');
  prtSetCond(m.id, m.own ? n : null, m.payout);
  const nm = prtOf(m.id).n; closeModal(); render();
  toast(`${nm}: ${m.own ? `${n}%` : `общий процент ${PRT.pct}%`}, вывод средств ${m.payout ? 'включён' : 'выключен'}`);
}

/* ─── действия ─── */
document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-a]'); if (!el) return;
  const a = el.dataset.a, v = el.dataset.v;
  switch (a) {
    case 'nolink': ev.preventDefault(); toast('Этот раздел уже есть в боевой админке'); break;
    case 'role': toggleRole(); renderNav('partners.html'); render(); toast(ROLE === 'mkt' ? 'Роль: маркетолог' : 'Роль: администратор'); break;
    case 'reset': try { localStorage.removeItem(PRT_KEY); } catch (e) {} prtLoad(); render(); toast('Демо сброшено'); break;
    case 'defsave': {
      const inp = $('#def-pct'), n = Math.round(+inp.value);
      if (inp.value === '' || !(n >= 0 && n <= 100)) return toast('Процент — от 0 до 100');
      PRT.pct = n; prtSave(); render(); toast(`Процент по умолчанию: ${n}% — со следующих начислений`); break;
    }
    case 'pay': { const c = prtCond(v); prtSetCond(v, c.own ? c.pct : null, !c.payout); render(); toast(`${prtOf(v).n}: вывод средств ${c.payout ? 'выключен' : 'включён'}`); break; }
    case 'edit': openCond(v, false); break;
    case 'add': openCond(null, true); document.querySelector('[data-m="id"]')?.focus(); break;
    case 'reqpaid': case 'reqno': { const r = prtResolve(v, a === 'reqpaid' ? 'paid' : 'no'); render();
      toast(a === 'reqpaid' ? `${prtOf(r.pid).n}: выплата ${prtRub(r.sum)} отмечена` : `Заявка отклонена — ${prtRub(r.sum)} вернулись тренеру`); break; }
    /* окно */
    case 'cpct': S.m.own = v === 'own'; renderModal(); if (S.m.own) document.querySelector('[data-c="pct"]')?.select(); break;
    case 'cpay': S.m.payout = !S.m.payout; renderModal(); break;
    case 'mdef': { const nm = prtOf(S.m.id).n; prtSetCond(S.m.id, null, false); closeModal(); render(); toast(`${nm}: общие условия`); break; }
    case 'msave': saveCond(); break;
    case 'mclose': closeModal(); break;
  }
});
document.addEventListener('input', ev => {
  const t = ev.target;
  if (t.id === 'def-pct') $('#def-save').disabled = t.value === '' || +t.value === PRT.pct;
  if (t.dataset.c === 'pct' && S.m) S.m.pct = t.value;
});
document.addEventListener('change', ev => {
  const t = ev.target;
  if (t.dataset.m === 'id' && S.m) { S.m.id = t.value || null; renderModal(); }
});
document.addEventListener('keydown', ev => {
  if (ev.key === 'Escape' && S.m) closeModal();
  if (ev.key === 'Enter' && ev.target.id === 'def-pct' && !$('#def-save').disabled) $('#def-save').click();
  if (ev.key === 'Enter' && ev.target.dataset?.c === 'pct' && S.m) saveCond();
});
$('#ov').addEventListener('click', ev => { if (ev.target.id === 'ov') closeModal(); });

renderNav('partners.html');
render();
