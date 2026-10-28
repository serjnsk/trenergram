/* ============================================================
   Админка · партнёрская программа: данные и общие блоки

   Тренер приводит тренеров по своей ссылке и получает процент
   с каждой их оплаты подписки. Процент общий для всех — его задаёт
   администратор; тренеру можно поставить свой. Заработанное тренер
   в кабинете переводит на баланс аккаунта, им оплачивается подписка.
   «Вывод средств» по умолчанию выключен и включается тренеру
   отдельно: тогда тренер оставляет заявку, администратор связывается
   с ним, платит вне сервиса и отмечает «Выплачено». Отклонённая
   заявка возвращает сумму в «Доступно». Начисление считается по
   проценту на момент оплаты — смена процента прошлое не пересчитывает.

   Подключается после common.js страницей программы (partners.html)
   и карточкой тренера (trainer.html, вкладка администратора).
   Тренеры вымышленные; правки — в localStorage, «Сбросить демо»
   на странице программы возвращает исходное.
   ============================================================ */

const PRT_KEY = 'tg-adm-partner-v1';
const PRT_DEF = {
  pct: 20,
  /* Свои условия: pct — свой процент (null — общий), payout — вывод средств включён */
  own: { t2: { pct: 30, payout: true }, k2: { pct: 25, payout: true }, k4: { pct: 40, payout: false } },
  partners: [
    { id: 'k1', n: 'Сергей Ковальчук', city: 'Санкт-Петербург', phone: '+79214001822', earned: 1390, toBalance: 800,
      invited: [{ n: 'Анна Лебедева', at: ago(70), st: 'paid' }, { n: 'Дмитрий Орлов', at: ago(45), st: 'paid' }, { n: 'Игорь Смирнов', at: ago(6), st: 'trial' }] },
    { id: 't2', n: 'Тимур Ахметов', city: 'Алматы', phone: '+77010005531', earned: 597, toBalance: 0,
      invited: [{ n: 'Дина Нуртаева', at: ago(20), st: 'paid' }, { n: 'Арман Сейтказы', at: ago(9), st: 'trial' }] },
    { id: 'k2', n: 'Марат Есенов', city: 'Алматы', phone: '+77010003318', earned: 9840, toBalance: 1990,
      invited: [{ n: 'Сауле Абенова', at: ago(120), st: 'paid' }, { n: 'Ержан Бекмуханов', at: ago(95), st: 'paid' },
                { n: 'Лаура Ким', at: ago(80), st: 'lost' }, { n: 'Тимур Ахметов', at: ago(64), st: 'paid' }] },
    { id: 'k3', n: 'Елена Воронова', city: 'Казань', phone: '+79170002264', earned: 0, toBalance: 0,
      invited: [{ n: 'Полина Зайцева', at: ago(4), st: 'trial' }] },
    { id: 'k4', n: 'Виктория Соколова', city: 'Москва', phone: '+79035550917', earned: 0, toBalance: 0, invited: [] }
  ],
  requests: [
    { id: 'r1', pid: 'k2', sum: 3000, at: ago(40, 11, 20), st: 'paid', doneAt: ago(39, 15, 0) },
    { id: 'r2', pid: 'k2', sum: 2500, at: ago(2, 10, 15), st: 'new' },
    { id: 'r3', pid: 't2', sum: 500, at: ago(0, 9, 50), st: 'new' }
  ]
};
/* Тренеры без приглашённых и своих условий — их можно выбрать в «Задать условия тренеру» */
const PRT_DIR = [{ id: 't1', n: 'Ксения Белова', city: 'Новосибирск', phone: '+79130004127' },
                 { id: 't3', n: 'Олег Сидоренко', city: 'Москва', phone: '+79160007740' }];
const INV_ST = { paid: ['ok', 'платит'], trial: ['', 'пробный период'], lost: ['rm', 'не продлил'] };

let PRT;
const prtLoad = () => { try { PRT = JSON.parse(localStorage.getItem(PRT_KEY) || 'null'); } catch (e) { PRT = null; } PRT ||= JSON.parse(JSON.stringify(PRT_DEF)); };
const prtSave = () => { try { localStorage.setItem(PRT_KEY, JSON.stringify(PRT)); } catch (e) {} };
prtLoad();

const prtRub = n => n.toLocaleString('ru-RU') + ' ₽';
const prtOf = id => PRT.partners.find(p => p.id === id)
  || { ...(PRT_DIR.find(d => d.id === id) || { id, n: '—' }), earned: 0, toBalance: 0, invited: [] };
const prtAll = () => [...PRT.partners, ...PRT_DIR.filter(d => !PRT.partners.some(p => p.id === d.id))].sort((a, b) => a.n.localeCompare(b.n, 'ru'));
const prtCond = id => { const o = PRT.own[id] || {}; return { own: o.pct != null, pct: o.pct ?? PRT.pct, payout: !!o.payout }; };
/* Условия совпали с общими — запись своих условий убираем */
function prtSetCond(id, pct, payout) {
  if (pct == null && !payout) delete PRT.own[id]; else PRT.own[id] = { pct, payout };
  if (PRT.own[id] && !PRT.partners.some(p => p.id === id)) PRT.partners.push(prtOf(id));
  prtSave();
}
function prtStats(id) {
  const p = prtOf(id), rq = PRT.requests.filter(r => r.pid === id), sum = st => rq.filter(r => r.st === st).reduce((s, r) => s + r.sum, 0);
  const paid = sum('paid'), wait = sum('new');
  return { invited: p.invited.length, paying: p.invited.filter(i => i.st === 'paid').length, earned: p.earned, toBalance: p.toBalance,
    paid, wait, waitN: rq.filter(r => r.st === 'new').length, avail: p.earned - p.toBalance - paid - wait };
}
/* Заявки: ждущие выплаты сверху, дальше по дате */
const prtReqs = id => PRT.requests.filter(r => !id || r.pid === id)
  .sort((a, b) => (b.st === 'new') - (a.st === 'new') || parseD(b.at) - parseD(a.at));
const prtResolve = (rid, st) => { const r = PRT.requests.find(x => x.id === rid); r.st = st; r.doneAt = new Date().toISOString(); prtSave(); return r; };

/* Условия тренера: процент (общий или свой) и вывод средств. Тот же блок
   стоит во вкладке карточки тренера и в окне на странице программы. */
function prtCondHTML(c) {
  return `<div class="prt-cond">
    <div class="prow"><s>Процент</s><div class="prt-pct">
      <div class="seg"><button class="${c.own ? '' : 'on'}" data-a="cpct" data-v="def">Общий · ${PRT.pct}%</button><button class="${c.own ? 'on' : ''}" data-a="cpct" data-v="own">Свой</button></div>
      ${c.own ? `<span class="pctin"><input class="inp fin" type="number" min="0" max="100" step="1" data-c="pct" value="${c.pct}" aria-label="Свой процент"><i>%</i></span>` : ''}
    </div></div>
    <div class="prow"><s>Вывод средств</s><div class="prt-pay">
      <button class="switch ${c.payout ? 'on' : ''}" data-a="cpay" role="switch" aria-checked="${c.payout}" aria-label="Вывод средств"></button>
      <span>${c.payout ? 'Включён — тренер может оставить заявку на вывод, выплата вне сервиса' : 'Выключен — заработанное только на баланс аккаунта'}</span>
    </div></div>
  </div>`;
}

function prtReqHTML(list, who) {
  return `<div class="prt-tbl"><table class="tbl"><thead><tr>${who ? '<th>Тренер</th>' : ''}<th>Заявка</th><th class="r">Сумма</th><th>Статус</th></tr></thead><tbody>
    ${list.map(r => { const p = prtOf(r.pid); return `<tr class="${r.st === 'new' ? '' : 'dim'}">
      ${who ? `<td><b>${esc(p.n)}</b><div class="sub">${fmtPhone(p.phone)}</div></td>` : ''}
      <td class="nw">${fdt(r.at)}</td><td class="r nw"><b>${prtRub(r.sum)}</b></td>
      <td>${r.st === 'new' ? `<div class="prt-act"><button class="btn sm" data-a="reqpaid" data-v="${r.id}">Выплачено</button><button class="btn gh sm" data-a="reqno" data-v="${r.id}">Отклонить</button></div>`
        : `<span class="chip ${r.st === 'paid' ? 'ok' : 'rm'}">${r.st === 'paid' ? 'выплачено' : 'отклонено'} ${fd(r.doneAt)}</span>`}</td></tr>`; }).join('')}
  </tbody></table></div>`;
}
const PRT_REQ_HINT = 'Свяжитесь с тренером, переведите деньги вне сервиса и отметьте «Выплачено». Отклонённая сумма вернётся тренеру в «Доступно».';
