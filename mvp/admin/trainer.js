/* ============================================================
   Админка · карточка тренера для роли «маркетолог»

   Боевая админка (trenergram.ru/admin) уже показывает по тренеру
   тариф, клиентов, публикации и ленту событий продукта. Карточка
   добавляет к этому работу маркетолога на всём пути тренера:
   этап, действия и заметки, причины ухода; онбординг считается
   сам по данным продукта. Связь с тренером идёт вне системы
   (звонок, Telegram, WhatsApp) — в карточку пишется итог действия.

   Права: данные сервиса, включая тариф, маркетолог только читает;
   правит этап и поля, которые выясняет сам. Телефон, тариф,
   блокировка и удаление — у администратора.

   Данные тренеров демонстрационные и вымышленные. Всё, что делает
   маркетолог, хранится в localStorage и сбрасывается кнопкой
   «Сбросить демо».
   ============================================================ */

/* Время, форматирование, иконки, роль, меню, тост и окно — в common.js. */

/* ─── справочники ─── */
/* Тарифы и лимиты — дословно как в боевой админке. */
const PLANS = { trial: 'Пробный период', c5: 'до 5 клиентов · 490 ₽', c10: '6–10 клиентов · 990 ₽', c20: '11–20 клиентов · 1 990 ₽',
  c50: '21–50 клиентов · 3 990 ₽', c100: '51–100 клиентов · 7 990 ₽', cmax: 'больше 100 клиентов · 9 990 ₽', free: 'Бесплатный' };
const LIMITS = { trial: 9999, c5: 5, c10: 10, c20: 20, c50: 50, c100: 100, cmax: 9999, free: 9999 };
const PAID = ['c5', 'c10', 'c20', 'c50', 'c100', 'cmax'];
const planFor = n => PAID.find(p => LIMITS[p] >= n) || 'cmax';

/* Этапы тренера: пробный → онбординг от Кирилла (можно пропустить) →
   оплаты по счёту → «Не продлил», который ставится только с причиной.
   Оплаты не ограничены: pay1, pay2, … — в списке всегда есть следующая. */
const payNo = k => /^pay\d+$/.test(k || '') ? +k.slice(3) : 0;
const stageName = k => k === 'trial' ? 'Пробный период' : k === 'onb' ? 'Онбординг от Кирилла'
  : k === 'lost' ? 'Не продлил' : payNo(k) ? `${payNo(k)}-я оплата` : '—';
function stageOptions() {
  const top = Math.max(payNo(C.stage), ...C.feed.filter(e => e.t === 'stage').map(e => payNo(e.to)));
  return ['trial', 'onb', ...Array.from({ length: top + 1 }, (_, i) => `pay${i + 1}`), 'lost'];
}
const stageTone = k => k === 'lost' ? 'lost' : payNo(k) ? 'paid' : k === 'trial' ? 'new' : 'onb';

/* Действие — это тип и комментарий маркетолога. Переписка с тренером
   живёт в мессенджерах, в карточку попадает только итог. */
const STATUSES = { live: { n: 'Живое общение', t: 'ok', i: 'users' }, msg: { n: 'Общение в мессенджере / звонок', t: 'ok', i: 'sms' },
  refuse: { n: 'Отказ', t: 'rm', i: 'x' }, later: { n: 'Связаться позже', t: 'warn', i: 'clock' } };
const REASONS = { price: 'Дорого', noclients: 'Мало клиентов', feature: 'Не хватает функции', hard: 'Сложно разобраться',
  competitor: 'Выбрал другой сервис', clientsapp: 'Клиенты не хотят приложение', later: 'Не сейчас — вернуться позже', other: 'Другое' };
const COMPETITORS = ['Google-таблицы', 'TrueCoach', 'TrainHeroic', 'Trainerize', 'Свой бот в Telegram', 'Другой'];
const FORMATS = { online: 'Онлайн', gym: 'В зале', groups: 'Группы' };
const PREV = { app: 'Другое приложение', trnr: 'TRNR', sheets: 'Гугл-таблицы / заметки', none: 'Не вёл учёт' };
const OBJECTIONS = { money: 'Деньги', time: 'Время на перенос', why: 'Непонимание, почему лучше', need: 'Нет потребности в сервисе' };
const SOURCES = { kirill: 'Личные контакты Кирилла', ig: 'Инстаграм', word: 'Сарафанное радио', tg: 'Телеграм' };
const FB_TYPES = { idea: { n: 'Запрос функции', i: 'idea' }, bug: { n: 'Проблема', i: 'bug' }, praise: { n: 'Отзыв', i: 'heart' } };
const LEVELS = { novice: 'Новичок', beginner: 'Начальный', mid: 'Средний', advanced: 'Продвинутый', pro: 'Профи' };

/* Онбординг: шаги отмечаются сами по данным продукта.
   Ключевой шаг — первая завершённая клиентом тренировка: после неё тренер
   видит, зачем ему сервис. */
const ONB_AUTO = [
  { k: 'reg', n: 'Регистрация', d: 'Аккаунт тренера создан' },
  { k: 'profile', n: 'Профиль заполнен', d: 'Имя, город и фото — их видят клиенты' },
  { k: 'firstClient', n: 'Первый клиент в приложении', d: 'Клиент пришёл по ссылке тренера' },
  { k: 'firstPub', n: 'Первая тренировка опубликована', d: 'Клиент видит её в приложении' },
  { k: 'firstFinish', n: 'Клиент завершил тренировку', d: 'Момент ценности: тренер видит результат клиента', key: true },
  { k: 'active3', n: '3 активных клиента за неделю', d: 'Тренер работает в сервисе, а не пробует' }
];

/* ─── демо-тренеры ───
   Три тренера на разных точках пути: новичок, который пропал после
   регистрации; платящий, которому пора на тариф выше; ушедший
   с причиной «вернуться позже». */
const KZ_NAMES = ['Айгерим Касымова', 'Данияр Омаров', 'Алия Нурланова', 'Ерлан Жумабаев', 'Мадина Сапарова', 'Руслан Ким',
  'Асель Абдрахманова', 'Нурсултан Бекенов', 'Камила Исаева', 'Тимур Жаксылыков', 'Динара Ахметжанова', 'Арсен Мусин',
  'Сабина Ли', 'Бауыржан Тулегенов', 'Жанна Ермекова', 'Максим Пак', 'Аружан Сейтова'];
const LV = Object.keys(LEVELS);

const TRAINERS = [
  {
    id: 't1', first: 'Ксения', last: 'Белова', phone: '+79130004127', email: '', city: 'Новосибирск', tz: 7,
    createdAt: ago(9, 10, 20), lastSeenAt: ago(9, 21, 5),
    plan: 'trial', clientLimit: 9999, planUntil: dstr(ahead(5)),
    clients: 1, active7: 0, published: 1, published7: 0, lastPublishedAt: ago(9, 21, 0), finished: 0, messages: 2,
    ms: { reg: ago(9, 10, 20), profile: ago(9, 10, 31), firstClient: ago(9, 20, 40), firstPub: ago(9, 21, 0) },
    weeks: { logins: [0, 0, 0, 0, 0, 0, 3, 0], pubs: [0, 0, 0, 0, 0, 0, 1, 0] },
    features: { constructor: ago(9, 21), calendar: ago(9, 21), ai: ago(9, 20, 50) },
    clientsList: [{ n: 'Алина Ковальчук', phone: '+79130008812', level: 'beginner', createdAt: ago(9, 20, 40), onboardedAt: null, lastSeenAt: ago(8, 19), finished: 0 }],
    crm: {
      stage: 'onb', stageSince: ago(8, 11, 10), owner: 'Анна Миронова', tags: ['VK-реклама', 'функционалка'],
      fields: { tg: '@ksenia_fit', ig: 'ksenia.fit.nsk', callTime: 'после 18:00 по своему времени, выходные',
        sport: 'Функциональный тренинг, снижение веса', formats: ['online', 'gym'], totalClients: '14', prevTool: 'sheets', prevToolName: '', objections: ['time'],
        source: 'ig', campaign: 'vk_oct_trial_func', referrer: '' },
      feed: [
        { t: 'touch', id: 'a1', at: ago(8, 11, 10), by: 'Анна Миронова', st: 'msg',
          text: 'Ведёт 14 клиентов в Google-таблицах, онлайн и в зале. Конструктор понравился, пугает ручной перенос базы. Демо в субботу: перенос и шаблоны.' },
        { t: 'note', id: 'a3', at: ago(7, 16, 0), by: 'Анна Миронова',
          text: 'Главный барьер — перенос базы. Предложить сделать перенос за неё по выгрузке таблицы.' },
        { t: 'touch', id: 'a4', at: ago(2, 13, 30), by: 'Анна Миронова', st: 'msg',
          text: 'На демо не вышла. Предложила другое время и перенос базы за неё.' },
      ],
      planHistory: [{ at: ago(9, 10, 20), from: null, to: 'trial', until: dstr(ahead(5)), limit: 9999, by: 'Система', why: 'Регистрация: пробный период 14 дней' }],
      feedback: [{ id: 'f1', at: ago(8, 11, 12), type: 'idea', text: 'Импорт клиентов из Google-таблицы одним файлом', status: 'product' }],
      mkt: { consent: false, ambassador: false, nps: null, npsAt: null, referred: [] },
      priceNote: ''
    }
  },
  {
    id: 't2', first: 'Тимур', last: 'Ахметов', phone: '+77010005531', email: 'timur.strength@mail.kz', city: 'Алматы', tz: 5,
    createdAt: ago(64, 9, 0), lastSeenAt: ago(0, 9, 40),
    plan: 'c20', clientLimit: 20, planUntil: dstr(ahead(18)),
    clients: 17, active7: 15, published: 212, published7: 34, lastPublishedAt: ago(0, 9, 30), finished: 486, messages: 940,
    ms: { reg: ago(64, 9, 0), profile: ago(64, 9, 12), firstClient: ago(63, 18, 0), firstPub: ago(63, 19, 30), firstFinish: ago(62, 8, 10), active3: ago(58, 20, 0) },
    weeks: { logins: [6, 7, 6, 7, 7, 6, 7, 6], pubs: [22, 25, 28, 30, 27, 31, 33, 34] },
    features: { constructor: ago(0, 9), calendar: ago(0, 9), templates: ago(1, 20), programs: ago(3, 12), groups: ago(2, 18), chat: ago(0, 8) },
    clientsList: KZ_NAMES.map((n, i) => ({ n, phone: '+7701' + (2000000 + i * 7919), level: LV[i % 5], createdAt: ago(63 - i * 3, 18),
      onboardedAt: i === 16 ? null : ago(62 - i * 3, 20), lastSeenAt: ago(i === 4 || i === 14 ? 9 : i % 3, 19), finished: Math.max(0, 52 - i * 3) })),
    crm: {
      stage: 'pay2', stageSince: ago(34, 14, 0), owner: 'Анна Миронова', tags: ['сарафан', 'зал', 'амбассадор'],
      fields: { tg: '@timur_strength', ig: 'timur.strength', callTime: 'будни 10:00–13:00',
        sport: 'Силовой тренинг, пауэрлифтинг', formats: ['gym', 'online', 'groups'], totalClients: '24', prevTool: 'app', prevToolName: 'TrueCoach', objections: ['money'],
        source: 'word', campaign: '', referrer: 'Марат Есенов' },
      feed: [
        { t: 'touch', id: 'b1', at: ago(64, 13, 0), by: 'Анна Миронова', st: 'msg',
          text: 'Пришёл по рекомендации Марата Есенова. Уходит с TrueCoach: дорого и нет русского языка для клиентов.' },
        { t: 'touch', id: 'b2', at: ago(63, 11, 0), by: 'Анна Миронова', st: 'live',
          text: 'Показала конструктор и ссылку для клиентов, вместе перенесли 12 клиентов.' },
        { t: 'touch', id: 'b3', at: ago(51, 11, 30), by: 'Анна Миронова', st: 'msg',
          text: 'Пробный кончается, готов платить. 9 клиентов — тариф 6–10, выставили счёт.' },
        { t: 'stage', id: 'b4', at: ago(50, 12, 0), by: 'Анна Миронова', from: 'onb', to: 'pay1' },
        { t: 'stage', id: 'b9', at: ago(34, 14, 0), by: 'Анна Миронова', from: 'pay1', to: 'pay2' },
        { t: 'touch', id: 'b5', at: ago(12, 10, 30), by: 'Анна Миронова', st: 'msg',
          text: 'Плановый звонок: оценка 9 из 10, просит приём оплаты от клиентов в приложении. Согласен на кейс для сайта.' },
        { t: 'note', id: 'b8', at: ago(20, 15, 0), by: 'Анна Миронова', text: 'Привёл Дину Нуртаеву — тоже силовой, Алматы.' }
      ],
      planHistory: [
        { at: ago(64, 9, 0), from: null, to: 'trial', until: dstr(ago(50)), limit: 9999, by: 'Система', why: 'Регистрация: пробный период 14 дней' },
        { at: ago(50, 12, 0), from: 'trial', to: 'c10', until: dstr(ago(20)), limit: 10, by: 'Анна Миронова', why: 'Оплатил счёт, 990 ₽' },
        { at: ago(34, 14, 0), from: 'c10', to: 'c20', until: dstr(ahead(18)), limit: 20, by: 'Анна Миронова', why: 'Перерос 10 клиентов, оплатил 11–20' }
      ],
      feedback: [
        { id: 'g1', at: ago(12, 10, 35), type: 'idea', text: 'Приём оплаты от клиентов прямо в приложении', status: 'product' },
        { id: 'g2', at: ago(40, 18, 0), type: 'bug', text: 'На iPhone клиенту не приходили уведомления о новой тренировке', status: 'done' },
        { id: 'g3', at: ago(7, 16, 0), type: 'praise', text: 'Составляю неделю в разы быстрее, чем в TrueCoach. Клиентам нравится таймер.', status: 'new' }
      ],
      mkt: { consent: true, ambassador: true, nps: 9, npsAt: ago(12, 10, 30), referred: [{ n: 'Дина Нуртаева', at: ago(20) }, { n: 'Арман Сейтказы', at: ago(9) }] },
      priceNote: 'При переходе на 21–50 обещали первый месяц по цене 11–20.'
    }
  },
  {
    id: 't3', first: 'Олег', last: 'Сидоренко', phone: '+79160007740', email: 'o.sidorenko.box@yandex.ru', city: 'Москва', tz: 3,
    createdAt: ago(26, 19, 0), lastSeenAt: ago(12, 20, 15),
    plan: 'trial', clientLimit: 9999, planUntil: dstr(ago(12)),
    clients: 0, active7: 0, published: 0, published7: 0, lastPublishedAt: null, finished: 0, messages: 0,
    ms: { reg: ago(26, 19, 0), profile: ago(26, 19, 8) },
    weeks: { logins: [0, 0, 0, 0, 2, 1, 0, 0], pubs: [0, 0, 0, 0, 0, 0, 0, 0] },
    features: { constructor: ago(18, 21) },
    clientsList: [],
    crm: {
      stage: 'lost', stageSince: ago(10, 17, 0), owner: 'Анна Миронова', tags: ['офлайн', 'бокс'],
      lost: { k: 'later', extra: '', comment: 'Сезон соревнований до середины ноября, потом хочет вести онлайн-группу.', back: dstr(ahead(19)) },
      fields: { tg: '@oleg_box', ig: '', callTime: 'днём, между тренировками',
        sport: 'Бокс', formats: ['gym'], totalClients: '6', prevTool: 'none', prevToolName: '', objections: ['why', 'need'],
        source: 'tg', campaign: 'seo_prilozhenie_dlya_trenera', referrer: '' },
      feed: [
        { t: 'touch', id: 'c1', at: ago(25, 12, 0), by: 'Анна Миронова', st: 'msg',
          text: 'Тренирует 6 человек офлайн, ведёт записи в блокноте. Хочет онлайн для тех, кто уезжает на сборы.' },
        { t: 'touch', id: 'c2', at: ago(18, 14, 0), by: 'Анна Миронова', st: 'msg', text: 'Звонок без ответа.' },
        { t: 'touch', id: 'c3', at: ago(17, 21, 10), by: 'Анна Миронова', st: 'later',
          text: 'Нет времени разбираться, клиенты не хотят ставить ещё одно приложение. Вернуться после сезона.' },
        { t: 'touch', id: 'c4', at: ago(10, 16, 50), by: 'Анна Миронова', st: 'refuse',
          text: 'Пробный кончился, продлевать не стал. Не против вернуться после сезона.' },
        { t: 'stage', id: 'c5', at: ago(10, 17, 0), by: 'Анна Миронова', from: 'onb', to: 'lost',
          lost: { k: 'later', extra: '', comment: 'Сезон соревнований до середины ноября, потом хочет вести онлайн-группу.', back: dstr(ahead(19)) } },
      ],
      planHistory: [{ at: ago(26, 19, 0), from: null, to: 'trial', until: dstr(ago(12)), limit: 9999, by: 'Система', why: 'Регистрация: пробный период 14 дней' }],
      feedback: [],
      mkt: { consent: false, ambassador: false, nps: null, npsAt: null, referred: [] },
      priceNote: ''
    }
  }
];

/* ─── хранилище работы маркетолога ─── */
const KEY = 'tg-adm-crm-v7';
let saved = {};
try { saved = JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (e) { saved = {}; }
const save = () => { try { localStorage.setItem(KEY, JSON.stringify(saved)); } catch (e) {} };
const crmOf = t => (saved[t.id] ||= JSON.parse(JSON.stringify(t.crm)));

const params = new URLSearchParams(location.search);
let T = TRAINERS.find(t => t.id === params.get('id')) || TRAINERS[0];
let C = crmOf(T);

const S = { tab: params.get('tab') || 'feed', filter: 'all', mode: 'touch', edit: null, m: null, focus: false,
  draft: { st: 'msg', text: '' } };

/* ─── производные ─── */
const nameOf = t => [t.first, t.last].filter(Boolean).join(' ') || 'Без имени';
const planOf = () => C.plan || { plan: T.plan, limit: T.clientLimit, until: T.planUntil };

function onbProgress() {
  return { done: ONB_AUTO.filter(s => T.ms[s.k]).length, total: ONB_AUTO.length };
}

/* ─── лента ─── */
function feedItems() {
  const M = T.ms, sys = [];
  if (M.reg) sys.push({ t: 'sys', at: M.reg, ttl: 'Зарегистрировался в кабинете', tx: `Пробный период до ${fd(C.planHistory[0]?.until || T.planUntil)}` });
  if (M.firstClient) sys.push({ t: 'sys', at: M.firstClient, ttl: 'Первый клиент в приложении' });
  if (M.firstPub) sys.push({ t: 'sys', at: M.firstPub, ttl: 'Первая тренировка опубликована' });
  if (M.firstFinish) sys.push({ t: 'sys', at: M.firstFinish, ttl: 'Клиент впервые завершил тренировку', chip: ['acc', 'момент ценности'] });
  if (M.active3) sys.push({ t: 'sys', at: M.active3, ttl: '3 клиента активны за неделю' });
  const pl = planOf();
  if (pl.until && dd(NOW, pl.until) < 0) sys.push({ t: 'sys', at: (d => (d.setHours(23, 59), d.toISOString()))(parseD(pl.until)), ttl: pl.plan === 'trial' ? 'Пробный период закончился' : 'Тариф закончился', chip: ['rm', 'только чтение'] });
  const plans = C.planHistory.map(p => ({ ...p, t: 'plan' }));
  const manual = C.feed.filter(e => e.t !== 'task');
  return [...sys, ...plans, ...manual].sort((a, b) => parseD(b.at) - parseD(a.at));
}
const FILTERS = [['all', 'Все'], ['touch', 'Действия'], ['note', 'Заметки'], ['sys', 'Продукт'], ['plan', 'Тариф'], ['stage', 'Этапы'], ['fb', 'Обратная связь']];

function evHTML(e) {
  const by = e.by && e.by !== 'Система' ? e.by : 'Система';
  let icn = 'bolt', cls = e.t, ttl = '', tx = '', extra = '';
  if (e.t === 'touch') {
    const st = STATUSES[e.st];
    icn = st.i; cls = st.t === 'rm' ? 'lost' : st.t === 'ghost' ? 'muted' : 'touch';
    ttl = `<b>${st.n}</b>`; tx = e.text;
  } else if (e.t === 'note') { icn = 'note'; ttl = '<b>Заметка</b>'; tx = e.text; }
  else if (e.t === 'sys') { icn = 'bolt'; ttl = `<b>${e.ttl}</b>${e.chip ? `<span class="chip ${e.chip[0]}">${e.chip[1]}</span>` : ''}`; tx = e.tx || ''; }
  else if (e.t === 'plan') {
    icn = 'star'; ttl = `<b>Тариф: ${e.from ? `${PLANS[e.from]} → ` : ''}${PLANS[e.to]}</b>`;
    tx = [e.until ? `до ${fd(e.until)}` : 'бессрочно', e.why].filter(Boolean).join(' · ');
  } else if (e.t === 'stage') {
    icn = 'flag'; cls = e.to === 'lost' ? 'lost' : 'stage';
    ttl = `<b>Этап: ${stageName(e.from)} → ${stageName(e.to)}</b>`;
    if (e.lost) {
      ttl += `<span class="chip rm">${REASONS[e.lost.k]}${e.lost.extra ? `: ${esc(e.lost.extra)}` : ''}</span>`;
      tx = [e.lost.comment, e.lost.back ? `Вернуться ${fd(e.lost.back)}` : ''].filter(Boolean).join('\n');
    }
  } else if (e.t === 'fb') { icn = FB_TYPES[e.type].i; ttl = `<b>Обратная связь</b><span class="chip">${FB_TYPES[e.type].n}</span>`; tx = e.text; }
  return `<div class="crev"><span class="ic ${cls}">${ic(icn)}</span>
    <div class="bd"><div class="ttl">${ttl}</div>${tx ? `<div class="tx">${esc(tx)}</div>` : ''}${extra}</div>
    <div class="tm">${ft(e.at)}<span>${esc(by)}</span></div></div>`;
}

/* ─── топбар ─── */
function renderTop() {
  $('#topbar').innerHTML = `
    <div class="crumb"><a href="#" data-a="nolink">Тренеры</a><span class="sep">›</span><span class="cur">${esc(nameOf(T))}</span></div>
    <span class="sp"></span>
    <div class="forw"><span>Демо</span><select id="demo-pick">${TRAINERS.map(t =>
      `<option value="${t.id}" ${t.id === T.id ? 'selected' : ''}>${esc(nameOf(t))} · ${stageName(crmOf(t).stage)}</option>`).join('')}</select></div>
    <button class="btn gh sm" data-a="reset" style="height:34px;font-size:14px">Сбросить демо</button>`;
}

/* ─── шапка карточки: кто, этап, общая информация ─── */
function headHTML() {
  const row = f => `<div class="prow"><s>${f.n}</s>${fieldHTML(f)}</div>`;
  return `<div class="crm-head">
    <div class="crm-hrow">
      <a class="btn gh sm" href="#" data-a="nolink">${ic('back')} Все тренеры</a>
      <span class="sp"></span>
      ${ROLE === 'admin' ? `<button class="btn gh sm" data-a="admmenu" title="Действия администратора">${ic('dots', 2.4)}</button>` : ''}
    </div>
    <div class="crm-id">
      <span class="av">${initials(nameOf(T))}</span>
      <div class="who">
        <h1>${esc(nameOf(T))}
          <select id="stage-pick" class="stsel ${stageTone(C.stage)}" title="Этап">${stageOptions().map(k =>
            `<option value="${k}" ${k === C.stage ? 'selected' : ''}>${stageName(k)}</option>`).join('')}</select>
          ${T.blockedAt ? '<span class="chip rm">заблокирован</span>' : ''}</h1>
      </div>
    </div>
    <div class="pblocks">${BLOCKS.map(b => `<div class="pblock ${b.ro ? 'ro' : ''}"><div class="cap">${b.n}</div>
      ${b.f.map(k => FIELDS.find(f => f.k === k)).filter(f => !f.show || f.show(C.fields)).map(row).join('')}</div>`).join('')}</div>
    ${C.stage === 'lost' && C.lost ? `<div class="stg-lost">${ic('flag')}<span>Причина: <b>${REASONS[C.lost.k]}${C.lost.extra ? `: ${esc(C.lost.extra)}` : ''}</b>${C.lost.comment ? ` — ${esc(C.lost.comment)}` : ''}${C.lost.back ? ` · вернуться <b>${fd(C.lost.back)}</b>` : ''}</span></div>` : ''}
  </div>`;
}

/* Общая информация — два блока: что сервис знает сам (только чтение)
   и что выясняет и заполняет маркетолог. */
const FIELDS = [
  { k: 'phone', n: 'Телефон', ro: () => fmtPhone(T.phone) },
  { k: 'city', n: 'Город', ro: () => T.city },
  { k: 'created', n: 'Регистрация', ro: () => fdt(T.createdAt) },
  { k: 'seen', n: 'Последний вход', ro: () => rel(T.lastSeenAt) },
  { k: 'appClients', n: 'Клиентов в приложении', ro: () => String(T.clients) },
  { k: 'plan', n: 'Тариф', ro: () => { const p = planOf(); return `${PLANS[p.plan].split(' · ')[0]}${p.until ? ` до ${fd(p.until)}` : ''}`; } },
  { k: 'tg', n: 'Telegram', type: 'text', ph: '@username' },
  { k: 'source', n: 'Источник', type: 'select', opts: SOURCES },
  { k: 'totalClients', n: 'Клиентов всего', type: 'text', ph: 'сколько ведёт' },
  { k: 'prevTool', n: 'Вёл клиентов', type: 'select', opts: PREV },
  { k: 'objections', n: 'Выявленные возражения', type: 'multi', opts: OBJECTIONS },
  { k: 'prevToolName', n: 'Какое приложение', type: 'text', ph: 'название приложения', show: f => f.prevTool === 'app' }
];
const BLOCKS = [
  { n: 'Данные сервиса', ro: true, f: ['phone', 'city', 'created', 'seen', 'appClients', 'plan'] },
  { n: 'Заполняет маркетолог', f: ['tg', 'source', 'totalClients', 'prevTool', 'prevToolName', 'objections'] }
];

function fieldHTML(f) {
  if (f.ro) return `<div class="fv ro">${esc(f.ro()) || '<span class="ph">—</span>'}</div>`;
  if (f.type === 'multi') return `<div class="chks">${Object.entries(f.opts).map(([k, n]) =>
    `<button class="${(C.fields[f.k] || []).includes(k) ? 'on' : ''}" data-a="multi" data-f="${f.k}" data-v="${k}"><i>${ic('chk', 2.4)}</i>${n}</button>`).join('')}</div>`;
  const v = C.fields[f.k] || '';
  if (f.type === 'select') return `<select class="inp fin" data-fe="${f.k}"><option value="">Не выбрано</option>${Object.entries(f.opts).map(([k, n]) =>
    `<option value="${k}" ${k === v ? 'selected' : ''}>${n}</option>`).join('')}</select>`;
  return `<input class="inp fin" data-fe="${f.k}" value="${esc(v)}" placeholder="${esc(f.ph || '')}">`;
}

/* ─── центр: табы ─── */
function composerHTML() {
  const d = S.draft, m = S.mode;
  const body = m === 'touch' ? `<div class="cmp-row"><span>Тип</span><select class="inp csel ${d.st === 'refuse' ? 'rm' : ''}" id="cmp-st">${Object.entries(STATUSES).map(([k, v]) =>
    `<option value="${k}" ${d.st === k ? 'selected' : ''}>${v.n}</option>`).join('')}</select></div>` : '';
  const ph = m === 'touch' ? 'Комментарий: о чём договорились, что мешает тренеру' : 'Заметка видна только команде';
  const hint = m === 'touch' && d.st === 'refuse' ? 'После сохранения попросим причину отказа' : '';
  return `<div class="cmp ${S.focus ? 'focus' : ''}" id="cmp">
    <div class="cmp-top"><div class="seg">${[['touch', 'Действие', 'phone'], ['note', 'Заметка', 'note']].map(([k, n, i]) =>
      `<button class="${m === k ? 'on' : ''}" data-a="mode" data-v="${k}">${ic(i)}${n}</button>`).join('')}</div></div>
    ${body}
    <textarea id="cmp-tx" placeholder="${ph}">${esc(d.text)}</textarea>
    <div class="cmp-foot"><span class="hint">${hint}</span><span class="sp"></span>
      <button class="btn" data-a="saveev">Сохранить</button></div>
  </div>`;
}

function tabFeed() {
  const all = feedItems(), list = all.filter(e => S.filter === 'all' || e.t === S.filter);
  const counts = Object.fromEntries(FILTERS.map(([k]) => [k, k === 'all' ? all.length : all.filter(e => e.t === k).length]));
  let html = '', last = '';
  for (const e of list) {
    const k = dstr(e.at);
    if (k !== last) { html += `<div class="crev-day">${dayLabel(e.at)}</div>`; last = k; }
    html += evHTML(e);
  }
  return composerHTML() + `
    <div class="ffil"><div class="filters">${FILTERS.filter(([k]) => counts[k] || k === 'all').map(([k, n]) =>
      `<button class="${S.filter === k ? 'on' : ''}" data-a="filter" data-v="${k}">${n}${k !== 'all' ? ` · ${counts[k]}` : ''}</button>`).join('')}</div></div>
    ${html || '<div class="empty">Событий этого типа нет</div>'}`;
}

function tabOnb() {
  const p = onbProgress(), firstF = T.ms.firstFinish, ttv = firstF ? dd(T.createdAt, firstF) : null;
  return `<div class="onb-top"><span class="big">${p.done}<small> / ${p.total}</small></span>
      <div class="bd"><b>${firstF ? `Дошёл до момента ценности за ${ttv} ${W(ttv, 'день', 'дня', 'дней')}` : 'Момент ценности ещё не наступил'}</b>
        <s>${firstF ? `Клиент впервые завершил тренировку ${fd(firstF)}` : `${daysAgo(T.createdAt)} ${W(daysAgo(T.createdAt), 'день', 'дня', 'дней')} с регистрации · цель — первая завершённая клиентом тренировка`}</s>
        <div class="bar"><i style="width:${100 * p.done / p.total}%"></i></div></div></div>
    <div class="sec-sub" style="margin-top:14px">Шаги отмечаются сами по данным продукта</div>
    ${ONB_AUTO.map(s => { const at = T.ms[s.k]; return `<div class="step ${at ? 'done' : ''} ${s.key ? 'key' : ''}"><span class="box">${ic('chk', 2.2)}</span>
      <div class="bd"><b>${s.n}${s.key ? '<span class="chip acc">ключевой</span>' : ''}</b><span>${s.d}</span></div>
      <span class="when">${at ? fd(at) : 'ещё нет'}</span></div>`; }).join('')}`;
}

/* Партнёрская программа — только администратор: условия тренера (свой
   процент, вывод средств), его партнёрский счёт, заявки на вывод и кого
   он привёл. Общий процент и все партнёры — на странице программы. */
function tabPrt() {
  const c = prtCond(T.id), st = prtStats(T.id), p = prtOf(T.id), reqs = prtReqs(T.id);
  const cell = (k, v) => `<div><s>${k}</s><b>${v}</b></div>`;
  return `<div class="sec-h">Условия</div>${prtCondHTML(c)}
    <div class="prt-stats">${cell('Приглашено', `${st.invited}<i> · платят ${st.paying}</i>`)}${cell('Заработано', prtRub(st.earned))}
      ${cell('На баланс аккаунта', prtRub(st.toBalance))}${cell('Выплачено', prtRub(st.paid))}${cell('Доступно', prtRub(st.avail))}</div>
    ${reqs.length ? `<div class="sec-h">Заявки на вывод</div>${st.waitN ? `<div class="sec-sub">${PRT_REQ_HINT}</div>` : ''}${prtReqHTML(reqs, false)}` : ''}
    <div class="sec-h">Приглашённые тренеры${p.invited.length ? ` <small>${p.invited.length}</small>` : ''}</div>
    ${p.invited.length ? p.invited.slice().sort((a, b) => parseD(b.at) - parseD(a.at)).map(i => `<div class="prt-inv"><span class="av">${initials(i.n)}</span>
        <b>${esc(i.n)}</b><span class="chip ${INV_ST[i.st][0]}">${INV_ST[i.st][1]}</span><span class="when">с ${fd(i.at)}</span></div>`).join('')
      : '<div class="empty">По ссылке тренера пока никто не зарегистрировался</div>'}
    <a class="prt-all" href="partners.html">${ic('pct')} Общий процент и все партнёры</a>`;
}

const TABS = [['feed', 'Лента'], ['onb', 'Онбординг'], ['prt', 'Партнёрская программа', 'admin']];
function workHTML() {
  const p = onbProgress(), tabs = TABS.filter(t => !t[2] || t[2] === ROLE);
  if (!tabs.some(t => t[0] === S.tab)) S.tab = 'feed';
  const w = prtStats(T.id).waitN;
  const cnt = { onb: `<s>${p.done}/${p.total}</s>`, prt: w ? `<s class="rm">${w} ${W(w, 'заявка', 'заявки', 'заявок')}</s>` : '' };
  const body = ({ onb: tabOnb, prt: tabPrt }[S.tab] || tabFeed)();
  return `<section class="work"><div class="tabs2">${tabs.map(([k, n]) => `<button class="${S.tab === k ? 'on' : ''}" data-a="tab" data-v="${k}">${n}${cnt[k] || ''}</button>`).join('')}</div>${body}</section>`;
}

/* ─── отрисовка ─── */
function render() {
  renderTop();
  $('#crm').innerHTML = headHTML() + workHTML();
  document.title = `${nameOf(T)} · Тренерграм — админка`;
  if (S.focus) { const tx = $('#cmp-tx'); if (tx) { tx.focus(); tx.setSelectionRange(tx.value.length, tx.value.length); $('#cmp').scrollIntoView({ block: 'center', behavior: 'smooth' }); } S.focus = false; }
  if (S.edit) { document.querySelector(`[data-fe="${S.edit}"]`)?.focus(); S.edit = null; }
}
const commit = () => { save(); render(); };
const push = e => { C.feed.push({ id: uid(), at: new Date().toISOString(), by: C.owner || 'Маркетолог', ...e }); };

/* ─── окна ─── */
const closeModal = () => { $('#ov').classList.remove('on'); S.m = null; };

function renderModal() {
  const m = S.m; if (!m) return closeModal();
  const who = `<div class="mdt"><b>${esc(nameOf(T))}</b><s>${stageName(C.stage)} · ${PLANS[planOf().plan].split(' · ')[0]}</s></div>`;
  if (m.kind === 'lost') {
    modal('Не продлил — почему?', who + `
      <span class="lab">Причина</span>
      <div class="rsn">${Object.entries(REASONS).map(([k, n]) => `<button class="${m.r === k ? 'on' : ''}" data-a="mr" data-v="${k}"><i></i>${n}</button>`).join('')}</div>
      ${m.r === 'competitor' ? `<span class="lab">Какой сервис</span><select class="inp" data-m="extra"><option value="">—</option>${COMPETITORS.map(c => `<option ${m.extra === c ? 'selected' : ''}>${c}</option>`).join('')}</select>` : ''}
      ${m.r === 'feature' ? `<span class="lab">Какой функции не хватает</span><input class="inp" data-m="extra" value="${esc(m.extra)}" placeholder="например, приём оплаты от клиентов">` : ''}
      ${m.r === 'later' ? `<span class="lab">Когда вернуться</span><input class="inp" type="date" data-m="back" value="${m.back}" style="max-width:200px"><div class="note">Дата появится в карточке рядом с причиной.</div>` : ''}
      <span class="lab">Комментарий</span><textarea class="inp" data-m="cm" placeholder="Слова тренера, детали">${esc(m.cm)}</textarea>`,
      `<span class="sp"></span><button class="btn gh" data-a="mclose">Отмена</button><button class="btn" data-a="lostsave" style="background:var(--rm)" ${m.r ? '' : 'disabled'}>Сохранить</button>`);
  }
}

/* ─── действия ─── */
function setStage(to, extra) {
  if (to === C.stage) return;
  if (to === 'lost' && !extra) { S.m = { kind: 'lost', r: null, extra: '', cm: '', back: dstr(ahead(30)) }; return renderModal(); }
  push({ t: 'stage', from: C.stage, to, ...(extra ? { lost: extra } : {}) });
  C.stage = to; C.stageSince = new Date().toISOString();
  if (to === 'lost') C.lost = extra; else delete C.lost;
  commit(); toast(`Этап: ${stageName(to)}`);
}
function saveEvent() {
  const d = S.draft, text = d.text.trim();
  if (S.mode === 'note' && !text) return toast('Напишите заметку');
  if (S.mode === 'note') { push({ t: 'note', text }); toast('Заметка сохранена'); }
  else {
    push({ t: 'touch', st: d.st, text });
    toast('Действие записано');
  }
  const refuse = S.mode === 'touch' && d.st === 'refuse';
  Object.assign(S.draft, { text: '', st: 'msg' });
  commit();
  if (refuse && C.stage !== 'lost') setStage('lost');
}

document.addEventListener('click', ev => {
  const el = ev.target.closest('[data-a]');
  if (!el) { if (!ev.target.closest('.amenu')) document.querySelector('.amenu')?.remove(); return; }
  const a = el.dataset.a, v = el.dataset.v;
  if (a !== 'admmenu') document.querySelector('.amenu')?.remove();
  switch (a) {
    case 'nolink': ev.preventDefault(); toast('Этот раздел уже есть в боевой админке'); break;
    case 'role': toggleRole(); renderNav('trainer.html'); render(); toast(ROLE === 'mkt' ? 'Роль: маркетолог' : 'Роль: администратор'); break;
    /* партнёрская программа: условия меняются сразу */
    case 'cpct': { const c = prtCond(T.id); prtSetCond(T.id, v === 'own' ? c.pct : null, c.payout); render();
      if (v === 'own') document.querySelector('[data-c="pct"]')?.select(); toast(v === 'own' ? 'Свой процент — впишите значение' : `Общий процент · ${PRT.pct}%`); break; }
    case 'cpay': { const c = prtCond(T.id); prtSetCond(T.id, c.own ? c.pct : null, !c.payout); render(); toast(c.payout ? 'Вывод средств выключен' : 'Вывод средств включён'); break; }
    case 'reqpaid': case 'reqno': { const r = prtResolve(v, a === 'reqpaid' ? 'paid' : 'no'); render();
      toast(a === 'reqpaid' ? `Выплата ${prtRub(r.sum)} отмечена` : `Заявка отклонена — ${prtRub(r.sum)} вернулись тренеру`); break; }
    case 'reset': delete saved[T.id]; save(); C = crmOf(T); S.edit = null; render(); toast('Демо сброшено'); break;
    case 'multi': { const arr = C.fields[el.dataset.f] ||= []; const i = arr.indexOf(v); i < 0 ? arr.push(v) : arr.splice(i, 1); commit(); break; }
    case 'tab': S.tab = v; S.edit = null; render(); break;
    case 'filter': S.filter = v; render(); break;
    case 'mode': S.mode = v; S.focus = true; render(); break;
    case 'saveev': saveEvent(); break;
    case 'stage': setStage(v); break;
    case 'admmenu': {
      document.querySelector('.amenu')?.remove();
      const r = el.getBoundingClientRect(), menu = document.createElement('div');
      menu.className = 'amenu'; menu.style.top = r.bottom + 6 + 'px'; menu.style.right = innerWidth - r.right + 'px';
      menu.innerHTML = `<div class="cap">Только администратор</div><button data-a="admact">${ic('phone')} Сменить телефон</button>
        <button data-a="admact">${ic('lock')} Заблокировать вход</button><button class="rm" data-a="admact">${ic('trash')} Удалить навсегда</button>`;
      document.body.append(menu); break;
    }
    case 'admact': toast('Действие есть в боевой админке — в прототипе не повторяем'); break;
    /* окна */
    case 'mclose': closeModal(); render(); break;
    case 'mr': S.m.r = v; S.m.extra = ''; renderModal(); break;
    case 'lostsave': { const m = S.m; if (!m.r) return;
      const lost = { k: m.r, extra: m.extra.trim(), comment: m.cm.trim(), back: m.r === 'later' ? m.back : null };
      closeModal(); setStage('lost', lost);
      break; }
  }
});

document.addEventListener('input', ev => {
  const t = ev.target;
  if (t.id === 'cmp-tx') S.draft.text = t.value;
  else if (t.dataset.m && S.m) {
    S.m[t.dataset.m] = t.value;
  }
});
document.addEventListener('change', ev => {
  const t = ev.target;
  if (t.id === 'demo-pick') { location.search = '?id=' + t.value; return; }
  if (t.id === 'cmp-st') { S.draft.st = t.value; render(); return; }
  if (t.id === 'stage-pick') { setStage(t.value); return; }
  if (t.dataset.c === 'pct') {
    const n = Math.round(+t.value);
    if (t.value === '' || !(n >= 0 && n <= 100)) { render(); return toast('Процент — от 0 до 100'); }
    prtSetCond(T.id, n, prtCond(T.id).payout); render(); toast(`Свой процент: ${n}%`); return;
  }
  if (t.dataset.fe) {
    const k = t.dataset.fe;
    C.fields[k] = t.value.trim();
    S.edit = k === 'prevTool' && t.value === 'app' && !C.fields.prevToolName ? 'prevToolName' : null;
    commit();
  }
});
document.addEventListener('keydown', ev => {
  const t = ev.target;
  if ((t.dataset?.fe || t.dataset?.c) && ev.key === 'Enter') { t.blur(); }
  if (t.id === 'cmp-tx' && ev.key === 'Enter' && (ev.metaKey || ev.ctrlKey)) saveEvent();
  if (ev.key === 'Escape' && S.m) closeModal();
});
/* Текстовое поле профиля сохраняется по уходу фокуса: change у input
   срабатывает именно тогда, отдельный blur не нужен. */
$('#ov').addEventListener('click', ev => { if (ev.target.id === 'ov') closeModal(); });

renderNav('trainer.html');
render();
