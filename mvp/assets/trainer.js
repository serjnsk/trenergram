/* ============================================================
   Общая логика — одна на все стилистики. Тема меняет только
   цвет и типографику, поведение везде одинаковое: иначе
   сравнивать варианты бессмысленно, они разойдутся по сути.
   ============================================================ */
/* ════════════════════════════════════════════════════════════
   КОНСТРУКТОР — тренировка как документ

   Данные общие с клиентским экраном: тот же data.js, та же
   программа, та же среда. Страницы должны расходиться только
   оформлением, иначе сверять их бессмысленно.

   Иерархия определяет, что куда вкладывается:
     упражнение → в блок · блок → в тренировку · тренировка → в день
   Неделя и программа — уровни выше, ими не наполняют день, их
   копируют целиком (CON-4). Поэтому в панели источников три
   уровня, а неделя живёт полосой сверху.

   Текст сохраняется как написан (CON-5): строка, не выбранная из
   базы, остаётся строкой текстом, блок текстом — текстом. Сам текст
   не разбирается — в структуру его переводит только кнопка AI в углу
   блока или строки, по просьбе тренера. Автоматический разбор ошибался
   правдоподобно и молча, а новый тренер не отличит такую ошибку от успеха.

   ПМ здесь не редактируются: клиент вводит их у себя (PRO-4),
   тренер пишет проценты, расчёт автоматический (CON-16, CON-17).
   Килограммы в строках — превью под выбранного в топбаре атлета.
   ════════════════════════════════════════════════════════════ */
const $  = (s,r=document) => r.querySelector(s);
const $$ = (s,r=document) => [...r.querySelectorAll(s)];
const esc = s => String(s??'').replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const initials = e => (e.en||e.ru||'').split(/[\s-]/).slice(0,2).map(w=>w[0]).join('').toUpperCase();
const plural = (n,a,b,c) => { const x=Math.abs(n)%100, y=x%10;
  return x>10&&x<20?c:y===1?a:y>1&&y<5?b:c };
const fmtN = v => String(v).replace('.',',');
/* «Останется у Артём» режет глаз. Родительный падеж имени по простому
   правилу — для русских имён его хватает. */
const GEN_EX = {'Пётр':'Петра','Павел':'Павла','Лев':'Льва','Игорь':'Игоря'};
function gen(name){
  const n = String(name||'').split(' ')[0];
  if(GEN_EX[n]) return GEN_EX[n];          /* беглая гласная простым правилом не берётся */
  const l = n.slice(-1).toLowerCase(), pre = n.slice(-2,-1).toLowerCase();
  if(l === 'а') return n.slice(0,-1) + ('гкхжчшщ'.includes(pre) ? 'и' : 'ы');
  if(l === 'я') return n.slice(0,-1) + 'и';
  if(l === 'й' || l === 'ь') return n.slice(0,-1) + 'я';
  return n + 'а';
}
const DOW = ['Понедельник','Вторник','Среда','Четверг','Пятница','Суббота','Воскресенье'];
/* Родительный падеж: «стёрта из среды», а не «из среда». */
const DOW_GEN = ['понедельника','вторника','среды','четверга','пятницы','субботы','воскресенья'];
const MON = ['янв','фев','мар','апр','мая','июн','июл','авг','сен','окт','ноя','дек'];
const mmss = t => Math.floor(Math.max(0,t)/60)+':'+String(Math.max(0,Math.round(t))%60).padStart(2,'0');

/* Таймер вынесен за MVP (см. тот же флаг на экране клиента). Формат блока
   остаётся: он определяет, как клиент записывает результат, а не только
   отсчёт. */
const TIMER = false;

/* mkBlock из data.js ждёт элементы МАССИВАМИ [exId, scheme, pct, unit, val]
   и пересобирает их через mkItem. Если передать туда готовые объекты, он
   молча вернёт блок с пустыми упражнениями — без ошибки, без предупреждения.
   Там, где элементы уже собраны, пользуемся этим: он их не трогает. */
/* Тип не передан (разбор текста) — берём из слова в названии: «Разминка» → разминка. */
const blockOf = (title, items, note, kind, fmt) => normFmt({
  id: nid('b'), kind: kind === undefined ? typeOfTitle(title) : (kind || null), title: title || '',
  note: note || '', fmt: fmt || null, items: items || [],
});
/* Копия строки: у связки копируются и её упражнения — иначе правка одной копии
   молча меняла бы другую. dupItem — с новыми id (вставка), snapItem — с теми
   же (возврат из уведомления). */
const snapItem = i => i.chain ? {...i, parts: i.parts.map(p => ({...p}))} : {...i};
const dupItem = i => i.chain ? {...i, id:nid('i'), parts: i.parts.map(p => ({...p, id:nid('i')}))} : {...i, id:nid('i')};
/* Копия блока любого вида: у блока текстом переносится текст, у остальных — строки. */
const copyBlock = b => isTextBlock(b)
  ? {...textBlock(b.text, b.title), note: b.note || '', kind: b.kind || null, fmt: b.fmt ? {...b.fmt} : null}
  : blockOf(b.title, b.items.map(dupItem), b.note, b.kind, b.fmt ? {...b.fmt} : null);

/* «Отдых» и «—» приходят из модели как заглушки пустого дня, а не как
   названия тренировок. Если день наполнили, они не должны остаться в поле. */
const REST_TITLES = new Set(['Отдых','—','']);

/* S.i — номер дня в плане программы, от нуля. Недели в модели нет, поэтому
   и в состоянии её нет: раньше здесь лежали «неделя» и «день внутри недели»,
   и любое действие приходилось переводить между двумя системами отсчёта. */
/* Конструктор отталкивается от клиента и даты, а не от программы: программа —
   то, что у клиента назначено, а не то, куда заходят. Без параметров в адресе
   открывается пустой конструктор с выбором даты и клиента (режим new);
   ?client=&date= ведёт сразу в редактор нужного дня. */
const Q = new URLSearchParams(location.search);
/* Открыть можно и группу (?group=): у неё свой контейнер дней, и конструктор
   работает с ним так же, как с календарём клиента (GRP-2). */
const S = { cid: Q.get('group') || Q.get('client') || 'c1', pid:'p1', i:0, date: Q.get('date') || TODAY,
            tab:'ex', q:'', src: STATE.railSrc === 'tpl' ? 'tpl' : 'cal',
            tplSaved:{}  /* дата → слепок тренировки, сохранённой в базу: пока не изменилась, закладка активна */ };
const blockSig = b => serializeDay({title:'', blocks:[b]});
const PCACHE = {};
/* planOf строит план один раз на программу и сразу переносит формат блока в
   название (fmtIntoTitle): раньше это делалось только для стартовой
   программы, и после смены клиента чужие блоки приходили без формата. */
const planOf = pid => PCACHE[pid] ||= (b => {
  const bag = (STATE.unsaved || {})[pid] || {};
  b.forEach((d, i)=>{
    d.blocks.forEach(normFmt);
    /* fmtIntoTitle меняет названия блоков после снятия слепка — без обновления
       любой день с форматом («For time», EMOM) считался бы черновиком. */
    if(!d.draft) d.pub = serializeDay(d);
    d.saved = serializeDay(d);                                  /* что лежит в календаре (CON-20) */
    if(!contentHas(d.saved)) d.draft = true;                    /* новая тренировка — черновик */
    /* Несохранённые правки ложатся обратно, только если день под ними не
       изменился (массовая операция, раздача группы): иначе они устарели. */
    const u = bag[i];
    if(u && u.base === d.saved){ const r = JSON.parse(u.c); d.title = r.t; d.blocks = restoreBlocks(r); d.comp = !!r.c }
    else if(u) delete bag[i];
  });
  return b })(buildPlan(pid));
const plan = () => planOf(S.pid);
/* Переход на дату раньше старта: сбрасываем правки в STATE, сдвигаем старт и
   пересобираем план — индексы всех дней меняются на величину сдвига. */
function shiftTo(date){
  persist();
  const r = ensureDay(S.cid, date); if(!r) return;
  delete PCACHE[S.pid];
  S.i = r.i; S.date = date;
  extendPlan(S.i); render();
}
/* Привязка клиента к плану: программа берётся у клиента, день — из даты. */
function bindClient(cid, date){
  const c = who(cid); if(!c) return false;
  S.cid = cid; S.date = date || S.date;
  /* Границ у программы нет: день раньше старта сдвигает старт, отсутствие
     программы создаёт личный контейнер (ensureDay). */
  const r = ensureDay(cid, S.date); if(!r) return false;
  if(r.shift) delete PCACHE[r.pid];
  S.pid = r.pid;
  const i = r.i;
  extendPlan(i);
  S.i = i;
  return true;
}
/* Если из адреса пришло что-то негодное — откатываемся на клиента по умолчанию
   и сегодня, редактор должен открыться в любом случае. */
if(!bindClient(S.cid, S.date)) bindClient('c1', TODAY);
/* «Создать тренировку» без параметров — это новая тренировка, а не правка
   существующей: открываем первый ещё не составленный день, он пуст. */
if(!Q.get('date')){
  const n = composedDays(S.pid);
  extendPlan(n); S.i = n; S.date = plan()[n].date;
}
const day  = () => plan()[S.i];
/* Группа открыта — своих максимумов у неё нет: проценты считаются каждому
   участнику от его 1ПМ, в строке килограммов не показываем. */
const G_   = () => isGrp(S.cid) ? grp(S.cid) : null;
const PM   = () => G_() ? {} : pmOf(S.cid);

/* LOGO живёт в assets/nav.js — общий для обеих оболочек. */


/* ─── навигация по рабочему пространству ─── */
const ICON = {
 pen:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round" stroke-linecap="round"><path d="M10.5 2.8l2.7 2.7-7.6 7.6-3.3.6.6-3.3z"/><path d="M9.2 4.1l2.7 2.7"/></svg>',
 ungroup:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linejoin="round"><rect x="1.5" y="3" width="5" height="10" rx="1.2"/><rect x="9.5" y="3" width="5" height="10" rx="1.2"/></svg>',
 dash:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.6"/><rect x="11" y="2.5" width="6.5" height="4" rx="1.6"/><rect x="11" y="8.5" width="6.5" height="9" rx="1.6"/><rect x="2.5" y="11" width="6.5" height="6.5" rx="1.6"/></svg>',
 users:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><circle cx="8" cy="6.5" r="3"/><path d="M2.5 17c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><path d="M14 4.2a3 3 0 0 1 0 5.6M15.5 12.6c1.6.7 2.8 2.3 2.8 4.4"/></svg>',
 grp:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="6.2" r="2.6"/><path d="M5 16.5c0-2.9 2.2-5 5-5s5 2.1 5 5"/><circle cx="4.2" cy="8.2" r="1.9"/><path d="M1.5 15.5c0-1.9 1-3.3 2.6-3.8"/><circle cx="15.8" cy="8.2" r="1.9"/><path d="M18.5 15.5c0-1.9-1-3.3-2.6-3.8"/></svg>',
 cal:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><rect x="2.5" y="4" width="15" height="13.5" rx="2"/><path d="M2.5 8h15M6.5 2.5v3M13.5 2.5v3"/></svg>',
 prog:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><rect x="2.5" y="2.5" width="15" height="15" rx="2.5"/><path d="M6 7h8M6 10h8M6 13h4.5"/></svg>',
 build:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M3 4.5h6M3 10h14M3 15.5h9"/><circle cx="13.5" cy="4.5" r="2"/><circle cx="15" cy="15.5" r="2"/></svg>',
 dumb:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M4.5 7v6M2.5 8.5v3M15.5 7v6M17.5 8.5v3M6 10h8"/></svg>',
 tpl:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M2.5 5.5A2 2 0 0 1 4.5 3.5h3l1.5 2h6.5a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-11a2 2 0 0 1-2-2v-9z"/></svg>',
 brand:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><circle cx="10" cy="10" r="7.5"/><circle cx="10" cy="10" r="3"/></svg>',
 map:'<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><path d="M2.5 5.5 7 3.5l6 2 4.5-2v11l-4.5 2-6-2-4.5 2v-11z"/><path d="M7 3.5v11M13 5.5v11"/></svg>',
 plus:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M8 3.5v9M3.5 8h9"/></svg>',
 back:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M13 8H3M7 4 3 8l4 4"/></svg>',
 arr:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M3 8h10M9 4l4 4-4 4"/></svg>',
 copy:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="5.5" y="5.5" width="8" height="8" rx="1.5"/><path d="M10.5 5.5V4A1.5 1.5 0 0 0 9 2.5H4A1.5 1.5 0 0 0 2.5 4v5A1.5 1.5 0 0 0 4 10.5h1.5"/></svg>',
 grip:'<svg viewBox="0 0 16 16" fill="currentColor"><circle cx="6" cy="4" r="1.1"/><circle cx="10" cy="4" r="1.1"/><circle cx="6" cy="8" r="1.1"/><circle cx="10" cy="8" r="1.1"/><circle cx="6" cy="12" r="1.1"/><circle cx="10" cy="12" r="1.1"/></svg>',
 x:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.7"><path d="M4.5 4.5l7 7M11.5 4.5l-7 7"/></svg>',
 chat:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 7.6a5.2 5.2 0 0 1-7.4 4.7L2.5 13.2l1-3.6A5.2 5.2 0 1 1 13.5 7.6z"/></svg>',
 vfull:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="2.5" width="12" height="11" rx="1.5"/><path d="M5 6.5h6M5 9h6M5 11.5h4"/></svg>',
 vdetail:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="2" y="2.5" width="12" height="11" rx="1.5"/><path d="M5 5.5h6M7 8h4M7 10.5h4"/></svg>',
 vhide:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"><rect x="2" y="6" width="12" height="4" rx="1.2"/></svg>',
 vcompact:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><rect x="2" y="3" width="12" height="4" rx="1.2"/><rect x="2" y="9" width="12" height="4" rx="1.2"/></svg>',
 chev:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M4 6.5l4 4 4-4"/></svg>',
 search:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="7" cy="7" r="4.5"/><path d="M10.5 10.5 14 14"/></svg>',
 /* Текст — строки абзаца: ввод текстом сам по себе не ИИ, знак ИИ стоит
    только на кнопке, которая действительно зовёт модель. */
 text:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M2.5 3.5h11M2.5 6.5h11M2.5 9.5h11M2.5 12.5h6.5"/></svg>',
 ul:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round"><path d="M6.5 4h7M6.5 8h7M6.5 12h7"/><circle cx="3" cy="4" r="1.1" fill="currentColor" stroke="none"/><circle cx="3" cy="8" r="1.1" fill="currentColor" stroke="none"/><circle cx="3" cy="12" r="1.1" fill="currentColor" stroke="none"/></svg>',
 /* Отдельная папка для кнопок: у навигационной ICON.tpl другой viewBox
    и не задана толщина обводки — рядом со «Сохранить» и «Копией» она
    выглядела заметно тоньше. Здесь всё совпадает: 16 и 1.5. */
 folder:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M1.8 4.2a1.4 1.4 0 0 1 1.4-1.4h2.4l1.2 1.6h5.4a1.4 1.4 0 0 1 1.4 1.4v6a1.4 1.4 0 0 1-1.4 1.4H3.2a1.4 1.4 0 0 1-1.4-1.4v-7.6z"/></svg>',
 star:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linejoin="round"><path d="M3.5 2.8h9v10.4L8 10.2l-4.5 3V2.8z"/></svg>',
 clock:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5"><circle cx="8" cy="8" r="5.8"/><path d="M8 4.8V8l2.2 1.4"/></svg>',
 chk:'<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.9"><path d="M3.5 8.5 6.5 11.5 12.5 5"/></svg>',
};
/* Знак ИИ — три звёздочки; на кнопке они мерцают по очереди, поэтому это
   отдельные фигуры (CSS: .aim, .aib). Кнопка AI — единственный путь из
   текста в структуру (CON-5): стоит в углу блока текстом и строки текстом
   и ничего не делает, пока её не нажали. */
const AIMARK = '<svg class="aim" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true"><path class="s1" d="M4 1Q4.5 3.3 6.8 3.8Q4.5 4.3 4 6.6Q3.5 4.3 1.2 3.8Q3.5 3.3 4 1Z"/><path class="s2" d="M10.2 3.4Q11.2 8 15.8 9Q11.2 10 10.2 14.6Q9.2 10 4.6 9Q9.2 8 10.2 3.4Z"/><path class="s3" d="M4.2 10.8Q4.58 12.52 6.3 12.9Q4.58 13.28 4.2 15Q3.82 13.28 2.1 12.9Q3.82 12.52 4.2 10.8Z"/></svg>';
const aiBtn = (attr, id, title, sm, dim) =>
  `<button class="aib${sm ? ' sm' : ''}${dim ? ' dim' : ''}" data-${attr}="${id}"${sm ? ' tabindex="-1"' : ''} title="${esc(title)}" aria-label="${esc(title)}">${AIMARK}<span>AI</span></button>`;
/* NAV живёт в assets/nav.js — общий конфиг, см. комментарий там. */
/* renderNav живёт в assets/nav.js — общий для обеих оболочек. */

function renderTop(){
  /* Шапка одинакова на всех страницах и несёт только главное действие.
     Крошки, выбор клиента и «Назначить» переехали в рабочую зону — они
     относятся к тренировке, а не к приложению. */
  $('#topbar').innerHTML = `
    <h1 class="ptitle">Создать тренировку<span class="ptd" id="ptd"></span></h1>
    <span class="sp"></span>
    ${topButton()}`;
  bindTopButton();
}




/* COM-4 — обращение тренера ко всей тренировке. На экране клиента оно
   стоит под именем тренера, выше всех блоков, и читается первым. Значит
   и писаться должно здесь же, над документом, а не внутри блока:
   заметка к блоку (b.note) — про один блок, это — про весь день. */
const dayTalk = date => { const k = talkKey(S.cid, date);
  return TALK.workout[k] || (TALK.workout[k] = []) };
const trainerMsg = date => (dayTalk(date).find(m=>m.who==='trainer')||{}).text || '';
function setTrainerMsg(date, text){
  const arr = dayTalk(date), i = arr.findIndex(m=>m.who==='trainer');
  const t = (text||'').trim();
  if(!t){ if(i>=0) arr.splice(i,1); return }
  if(i>=0) arr[i].text = t;
  else arr.unshift({who:'trainer', text:t, at:'сейчас'});
}

/* Цель программы одинакова все восемь недель и на всех днях — на странице,
   где правят один день, она ни на что не влияет. Показываем то, что от
   недели к неделе меняется: сколько дней заполнено и чем они нагружены. */
function planStat(){
  const d = plan();
  const filled = d.filter(dayHas).length;
  const n = d.reduce((a,x)=>a+dayCount(x),0);
  if(!filled) return 'план пустой';
  return filled + ' ' + plural(filled,'тренировка','тренировки','тренировок') +
         ' · ' + n + ' ' + plural(n,'упражнение','упражнения','упражнений');
}



/* ─── дорожка плана ───
   Раньше здесь была решётка из семи дней с листанием по неделям. Теперь это
   непрерывная дорожка дней программы: тренер ставит тренировки в любом ритме,
   а не заполняет семь ячеек. Полоса прокручивается, выбранный день в центре. */
/* Вид ленты — свойство аккаунта: подробный (что внутри тренировок) или
   компактный (дата и статус). Запоминается вместе с остальным состоянием. */
const laneView = () => STATE.laneView === 'compact' ? 'compact' : STATE.laneView === 'detail' ? 'detail' : 'full';
(function(){ const v = Q.get('view'); if(v==='hidden'){ STATE.laneHidden = true; saveState() } else if(v && ['compact','full','detail'].includes(v)){ STATE.laneHidden = false; STATE.laneView = v; saveState() } })();
/* «24 августа – 6 сентября 2026»: подпись диапазона с месяцами и годом. */
function rangeLabel(a, b){
  const da = new Date(a+'T00:00:00'), db = new Date(b+'T00:00:00');
  if(da.getFullYear() !== db.getFullYear()) return `${da.getDate()} ${MONTHS[da.getMonth()]} ${da.getFullYear()} – ${db.getDate()} ${MONTHS[db.getMonth()]} ${db.getFullYear()}`;
  if(da.getMonth() !== db.getMonth()) return `${da.getDate()} ${MONTHS[da.getMonth()]} – ${db.getDate()} ${MONTHS[db.getMonth()]} ${db.getFullYear()}`;
  return `${da.getDate()} – ${db.getDate()} ${MONTHS[db.getMonth()]} ${db.getFullYear()}`;
}
function renderStrip(){
  const d = plan(), p = program(S.pid), cur = d[S.i];
  /* Лента — две недели: текущая и следующая. Тренер обычно на этой неделе
     пишет тренировки на следующую, и обе должны быть перед глазами. Неделя
     осталась представлением, и здесь она уместна. Дни за концом плана, но
     в сроке программы — пустые, клик по такому продлевает план. */
  const wk0 = addDays(cur.date, -dowMon(cur.date));
  const cells = Array.from({length:14}, (_,k)=>{
    const date = addDays(wk0, k), i = daysBetween(p.start, date);
    return {date, i, inPlan: i>=0 && i<d.length, inProg: i>=0};
  });
  $('#wk').innerHTML = `
    <div class="wkh one">
      <button class="cliSel" id="cli" title="Сменить клиента или группу">${whoBtnHTML(who(S.cid))}${ICON.chev}</button>
      <div class="dates">${STATE.laneHidden ? '' : `
        <span class="wkn">
          <button id="dayPrev" title="Неделей раньше" ${cells[0].i<1?'disabled':''}>${ICON.back}</button>
          <button id="dayNext" title="Неделей позже">${ICON.arr}</button>
        </span>`}
      </div>
      <div class="views"><span class="vtog" title="Вид ленты">
        <button data-view="hidden" class="${STATE.laneHidden?'on':''}" title="Скрыть календарь — только тренировка дня">${ICON.vhide}</button>
        <button data-view="compact" class="${!STATE.laneHidden && laneView()==='compact'?'on':''}" title="Свёрнуто — дата, статус и название">${ICON.vcompact}</button>
        <button data-view="full" class="${!STATE.laneHidden && laneView()==='full'?'on':''}" title="Блоки — что внутри тренировки">${ICON.vfull}</button>
        <button data-view="detail" class="${!STATE.laneHidden && laneView()==='detail'?'on':''}" title="Полностью — блоки, упражнения, подходы и веса">${ICON.vdetail}</button>
      </span></div>
    </div>
    <div class="days ${laneView()==='compact'?'compact':''} ${laneView()==='detail'?'detail':''} ${STATE.laneHidden?'hide':''}" id="strip">
      ${cells.map((c,k)=>{
        const dt = new Date(c.date + 'T00:00:00');
        /* Месяц подписан на стыке и в первой ячейке — чтобы, листая недели,
           не терять, где мы; сегодняшний день помечен точкой. */
        const mon = (dt.getDate()===1 || k===0) ? ' ' + MON[dt.getMonth()] : '';
        const today = c.date === TODAY;
        const head = `<span class="d"><s>${RU[dowMon(c.date)]}</s>${dt.getDate()}${mon?`<s>${mon.trim()}</s>`:''}${today?'<i class="tdot" title="Сегодня"></i>':''}</span>`;
        const cls = today ? ' today' : '';
        if(!c.inProg || !c.inPlan) return `<button class="day empty rest${cls}" data-day="${c.i}" data-date="${c.date}" title="Составить этот день">${head}${restCell()}</button>`;
        const x = d[c.i];
        const n  = dayCount(x);
        const unsaved = isDirty(x) ? '<i class="udot" title="Есть несохранённые изменения"></i>' : '';
        const title = REST_TITLES.has(x.title) ? 'Без названия' : x.title;
        const st = dayStatus(x, isDraft(x)), tt = st==='comp' ? (REST_TITLES.has(x.title) ? 'Соревнование' : x.title) : title;
        const blocks = laneView()==='detail' ? blocksDetail(x, G_() ? null : S.cid, S.cid) : blocksList(x);
        const tag = st === 'rest' ? '' : G_() ? grpStatTag(G_(), c.date) : grpTag(x);
        /* Галочка массового выбора — только у дней с тренировкой или соревнованием. */
        const hs = (st === 'rest' ? head : head.replace('<span class="d">', '<span class="d">' + bulkBox(c.date))).replace('</span>', unsaved + '</span>'), sc = st === 'rest' ? '' : bulkCls(c.date);
        if(laneView()==='compact') return `<button class="day cmp ${st} ${c.i===S.i?'on':''}${cls}${sc}" data-day="${c.i}" data-date="${c.date}">
          ${hs}${dayMark(st, S.pid + ':' + c.i)}
          ${st==='rest' ? restCell() : `<span class="t">${esc(tt)}</span>`}${tag}
        </button>`;
        return `<button class="day ${st} ${c.i===S.i?'on':''}${cls}${sc}"
                        data-day="${c.i}" data-date="${c.date}" style="--load:${n||0}">
          ${hs}${dayMark(st, S.pid + ':' + c.i)}
          ${st==='rest' ? restCell() : `<span class="t">${esc(tt)}</span>`}${tag}
          ${blocks || (st==='comp' ? compCell() : '')}
          <span class="ld"><i style="flex:${n}"></i><u style="flex:${Math.max(1,10-n)}"></u><s>${n||''}</s></span>
        </button>`;
      }).join('')}
    </div>`;
}

/* ─── документ дня ─── */
/* Расшифровка формата словами — пригодится, когда вернётся таймер.
   Пока не вызывается ниоткуда: подтверждать разбор мы перестали. */
const tmSub = f => fmtDesc(f);
/* Нагрузка в поле: число или диапазон «70–80» (CON-24). */
const ldVal = it => it.pct != null ? fmtN(it.pct) + (it.pct2 != null ? RNG + fmtN(it.pct2) : '') : fmtN(it.val || '') + (it.val2 ? RNG + fmtN(it.val2) : '');
const hasRange = it => it.pct2 != null || !!it.val2;
const fw = (v, min, pad) => `calc(${Math.max(String(v).length, min)}ch + ${pad}px)`;
/* Поля схемы и нагрузки — общие у строки и у упражнения внутри связки. */
function prmHTML(it, schPh){
  const L = loadInfo(it), kg = kgText(it, PM());
  const sch = it.txt || it.scheme || '', ld = ldVal(it);
  return `<input class="pf sch" data-pf="sch" data-for="${it.id}" value="${esc(sch)}" placeholder="${schPh}" autocomplete="off" spellcheck="false" style="width:${fw(sch, schPh.length > 3 ? 4 : 3, 20)}">
      ${L.has ? `<span class="pf ld ${ld ? '' : 'empty'}"><input data-pf="ld" data-for="${it.id}" value="${esc(ld)}" placeholder="${L.weighted ? 'вес' : 'объём'}" inputmode="decimal" autocomplete="off" spellcheck="false" style="width:${fw(ld, 4, 4)}"><u data-pfu="${it.id}" title="Сменить единицу">${esc(L.cur)}</u></span>
      <button class="rng ${hasRange(it) ? 'on' : ''}" data-rng="${it.id}" tabindex="-1" title="${hasRange(it) ? 'Убрать диапазон — оставить одно число' : 'Диапазон «от–до»: 70–80 % или 60–70 кг. Можно и набрать через дефис'}">от–до</button>` : ''}
      <span class="kg">${kg != null ? '→ ' + kg + ' кг' : G_() && it.pct != null ? 'от 1ПМ каждого' : ''}</span>
      ${L.weighted ? `<span class="pmf ${L.cur === '%' && !PM()[L.key] && !G_() ? '' : 'off'}">1ПМ клиента <span class="pf pm"><input data-pf="pm" data-for="${it.id}" placeholder="—" inputmode="decimal" autocomplete="off" style="width:${fw('', 3, 4)}"><u>кг</u></span></span>` : ''}`;
}
/* ─── СВЯЗКА В СТРОКЕ (CON-23) ───
   «Взятие на грудь + Фронтальный присед + Толчок  80 % · 90 кг — 3×(1+1+1)».
   Связка — один подход, поэтому подходы и нагрузка у неё одни, а у каждого
   упражнения — только повторы. Пока связку не правят, параметры стоят
   текстом в конце; курсор в строке открывает поля: повторы у упражнений,
   дальше — подходы, нагрузка и упражнение, от 1ПМ которого считается
   процент (по умолчанию самое слабое). Поле «упражнение» с подсказками из
   базы: Tab берёт первое, Enter без выбора добавляет текстом, Enter в
   пустом поле — к следующей строке. Крестик убирает упражнение из связки. */
const repsHTML = p => `<input class="pf sch rep" data-pf="sch" data-for="${p.id}" value="${esc(p.scheme || '')}" placeholder="повт" autocomplete="off" spellcheck="false" inputmode="numeric" style="width:${fw(p.scheme || '', 4, 20)}">`;
/* Подпись «от 1ПМ»: самое слабое называется по имени, когда 1ПМ клиента известны. */
function cofOpts(it){
  const seen = new Set(), ws = chainWeighted(it).filter(p => !seen.has(p.exId) && seen.add(p.exId));
  const auto = chainOf({...it, of:null}, PM()), known = auto && PM()[pmKey(byId(auto.exId))];
  return `<option value="">${G_() || !known ? 'самого слабого' : esc(partName(auto)) + ' · самое слабое'}</option>`
    + ws.map(p => `<option value="${p.exId}" ${it.of === p.exId ? 'selected' : ''}>${esc(partName(p))}</option>`).join('');
}
const chainSumm = it => { const kg = kgText(it, PM()), l = loadText(it);
  return [[l, kg ? kg + '\u00a0кг' : ''].filter(Boolean).join(' · '), chainScheme(it)].filter(Boolean).join(' — ') };
function chainPrmHTML(it){
  const L = loadInfo(it), kg = kgText(it, PM()), ld = ldVal(it), sets = it.sets || '', summ = chainSumm(it);
  return `<span class="cprm">${summ ? `<span class="cpt">${esc(summ)}</span>` : ''}
      <span class="pf sets"><input data-pf="sets" data-for="${it.id}" value="${esc(sets)}" placeholder="1" inputmode="numeric" autocomplete="off" style="width:${fw(sets, 2, 4)}"><u>подх.</u></span>
      ${L.has ? `<span class="pf ld ${ld ? '' : 'empty'}"><input data-pf="ld" data-for="${it.id}" value="${esc(ld)}" placeholder="${L.weighted ? 'вес' : 'объём'}" inputmode="decimal" autocomplete="off" spellcheck="false" style="width:${fw(ld, 4, 4)}"><u data-pfu="${it.id}" title="Сменить единицу">${esc(L.cur)}</u></span>
      <button class="rng ${hasRange(it) ? 'on' : ''}" data-rng="${it.id}" tabindex="-1" title="${hasRange(it) ? 'Убрать диапазон — оставить одно число' : 'Диапазон «от–до»: 70–80 % или 60–70 кг. Можно и набрать через дефис'}">от–до</button>` : ''}
      ${L.weighted && chainWeighted(it).length > 1 ? `<span class="cof ${L.cur === '%' ? '' : 'off'}">от 1ПМ <select data-cof="${it.id}" tabindex="-1" title="От 1ПМ какого упражнения считать процент">${cofOpts(it)}</select></span>` : ''}
      <span class="kg">${kg != null ? '→ ' + kg + ' кг' : G_() && it.pct != null ? 'от 1ПМ каждого' : ''}</span>
      ${L.weighted ? `<span class="pmf ${L.cur === '%' && !PM()[L.key] && !G_() ? '' : 'off'}">1ПМ клиента <span class="pf pm"><input data-pf="pm" data-for="${it.id}" placeholder="—" inputmode="decimal" autocomplete="off" style="width:${fw('', 3, 4)}"><u>кг</u></span></span>` : ''}</span>`;
}
function chainLineHTML(it){
  const ps = it.parts || [];
  const parts = ps.map((p, k) => `${k ? '<span class="cplus">+</span>' : ''}<span class="cp${p.exId ? '' : ' raw'}" data-part="${p.id}">
      <span class="cpn">${esc(partName(p))}</span>${repsHTML(p)}
      <button class="cpx" data-delpart="${p.id}" tabindex="-1" title="Убрать из связки">${ICON.x}</button></span>`).join('');
  return `<div class="line chain${ps.length ? '' : ' empty'}" data-item="${it.id}">
    <span class="gr" title="Перетащить связку">${ICON.grip}</span>
    <span class="chl">Связка</span>
    <span class="cps">${parts}<span class="caddw">${ps.length ? '<span class="cplus">+</span>' : ''}<span class="cadd" contenteditable data-edit="${it.id}" spellcheck="false" data-ph="${ps.length ? 'упражнение' : 'первое упражнение связки'}"></span></span>${ps.length ? chainPrmHTML(it) : ''}</span>
    <button class="x" data-del="${it.id}" tabindex="-1" title="Удалить связку">${ICON.x}</button>
  </div>`;
}
function lineHTML(it){
  if(it.chain) return chainLineHTML(it);
  const ex = it.exId ? byId(it.exId) : null;
  /* Строка текстом — обычное сохранённое состояние, а не ошибка: тренер так
     написал, так её и увидит клиент (CON-5). Сама строка не разбирается
     никогда. Путей в структуру два, оба по просьбе тренера: кнопка AI в углу
     строки и ручной выбор из базы. */
  if(!ex) return `<div class="line raw" data-item="${it.id}">
    <span class="gr">${ICON.grip}</span>
    <span class="txt" contenteditable data-edit="${it.id}" spellcheck="false">${esc(it.raw||'')}</span>
    ${String(it.raw||'').trim() ? `<button class="pick" data-pickfor="${it.id}" tabindex="-1">Выбрать упражнение</button>
    ${aiBtn('ailine', it.id, 'Разобрать строку: ИИ найдёт упражнение в базе, схему и нагрузку', true)}` : ''}
    <button class="x" data-del="${it.id}" tabindex="-1">${ICON.x}</button>
  </div>`;
  /* Схема и нагрузка — поля сразу за названием, без отдельной панели: их
     видно и в них печатают сразу. Колонка полей выровнена внутри блока по
     самому длинному названию (alignNames). */
  return `<div class="line ${it.txt ? 'txtmode' : ''}" data-item="${it.id}">
    <span class="gr">${ICON.grip}</span>
    <span class="txt" contenteditable data-edit="${it.id}" spellcheck="false"><span class="nm">${esc(ex.ru)}</span></span>
    <span class="prm">
      ${prmHTML(it, it.sub ? 'повт' : '3×10')}
    </span>
    <span class="sp"></span>
    <button class="x" data-del="${it.id}" tabindex="-1" title="Удалить упражнение">${ICON.x}</button>
  </div>`;
}
/* Подпись чипа: «5×3 · 80 %», «500 м», «3×12 · RPE 8». */
const itemLoad = it => loadText(it).replace(/\u00a0/g, ' ');
const itemChip = it => it.txt ? it.txt : [it.scheme, itemLoad(it)].filter(Boolean).join(' · ');
/* Строки блока: обычные упражнения и суперсеты (заголовок + участники подряд). */
function itemsHTML(b){
  let h = '', k = 0;
  while(k < b.items.length){
    const it = b.items[k];
    if(it.ss){ const j = ssEnd(b.items, k); h += ssHTML(it, b.items.slice(k + 1, j)); k = j; continue }
    h += lineHTML(it); k++;
  }
  return h;
}
function ssHTML(h, mem){
  const r = Math.max(1, +h.rounds || 1);
  return `<div class="ssg" data-ss="${h.id}">
    <div class="line ssh" data-item="${h.id}">
      <span class="gr" title="Перетащить суперсет">${ICON.grip}</span>
      <span class="nm ssb">Суперсет</span>
      <label class="ssf"><input class="ssn" data-ssf="rounds" data-ss-id="${h.id}" value="${r}" inputmode="numeric" maxlength="2"><s data-ss-rl="${h.id}">${plural(r,'круг','круга','кругов')}</s></label>
      <label class="ssf"><s>отдых</s><input class="ssrest" data-ssf="rest" data-ss-id="${h.id}" value="${esc(h.rest||'')}" placeholder="без отдыха"></label>
      <span class="sp"></span>
      <button class="x" data-ssungroup="${h.id}" title="Разгруппировать — упражнения останутся в блоке">${ICON.ungroup}</button>
      <button class="x" data-delss="${h.id}" title="Удалить суперсет вместе с упражнениями">${ICON.x}</button>
    </div>
    ${mem.map(lineHTML).join('')}
    <button class="addl in" data-addin="${h.id}">${ICON.plus} упражнение</button>
  </div>`;
}
/* Блок текстом устроен как любой блок — та же шапка, тип, заметка, закладка,
   перетаскивание, — но вместо строк упражнений в нём лист: пишут как в
   заметках, Enter — новая строка. Сохраняется как написано; в углу листа —
   кнопка AI, которая предлагает разобрать текст на упражнения. Пока в листе
   печатают, под ним панель: маркированный список и подсказка клавиш. */
const TEXT_PH = `Пишите как в заметках — блок сохранится текстом, клиент увидит его как есть.
Разобрать на упражнения — кнопка AI.

AMRAP 12:
• трастеры 10 × 40 кг
• подтягивания 8
• гребля 250 м`;
const LIST_KEY = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? '⌘⇧8' : 'Ctrl+Shift+8';
function blockHTML(b){
  const txt = isTextBlock(b);
  return `<div class="blk ${txt ? 'tblk' : ''} ${PENDING && PENDING.ids.has(b.id) ? 'pending' : ''}" data-blk="${b.id}">
    <div class="blkh">
      <span class="gr" title="Перетащить блок">${ICON.grip}</span>
      <input class="bt" data-f="title" value="${esc(b.title)}"
             placeholder="${b.kind || txt ? 'Название блока (необязательно)' : 'Введите название блока'}">
      <button class="ftype ${b.kind?'on':''}" data-ftype="${b.id}" title="${b.fmt ? esc(fmtDesc(b.fmt)) : b.kind ? '' : 'Разминка, силовая, комплекс…'}">${b.kind ? esc(blockTypeLabel(b)) : 'тип блока'}</button>
      <button class="x ${b.note?'on':''}" data-notetog="${b.id}" title="${b.note?'Заметка к блоку':'Добавить заметку к блоку'}">${ICON.chat}</button>
      <button class="x ${b.savedSig === blockSig(b) ? 'on':''}" data-savblk="${b.id}" title="${b.savedSig === blockSig(b) ? 'Сохранён в базу блоков' : 'Сохранить блок в базу'}">${ICON.star}</button>
      <button class="x" data-delblk="${b.id}">${ICON.x}</button>
    </div>
    ${b.note || b.noteOpen ? `<label class="bnote"><span>${ICON.chat}</span>
        <input data-f="note" value="${esc(b.note||'')}" placeholder="Заметка к блоку — увидит клиент">
        <button class="x" data-notedel="${b.id}" title="Удалить заметку">${ICON.x}</button>
      </label>` : ''}
    ${txt ? `<div class="tbody">
        <textarea class="tbx" data-f="text" rows="3" spellcheck="false" placeholder="${esc(TEXT_PH)}">${esc(b.text)}</textarea>
        ${aiBtn('aiblk', b.id, 'Разобрать текст на упражнения — ИИ предложит, вы проверите', false, !b.text.trim())}
        <div class="tbar">
          <button class="tfmt" data-fmt="ul" tabindex="-1" title="Маркированный список · ${LIST_KEY}">${ICON.ul}<span>Список</span></button>
          <span class="tkeys"><span>${KB('Enter')}новый пункт</span><span>${KB('Enter')}${KB('Enter')}конец списка</span><span>${KB(LIST_KEY)}список</span></span>
        </div>
      </div>` : `${itemsHTML(b)}
    <div class="addrow">
      <button class="addl" data-add="${b.id}">${ICON.plus} упражнение</button>
      <button class="addl" data-addss="${b.id}">${ICON.plus} суперсет</button>
      <button class="addl" data-addch="${b.id}" title="Несколько упражнений подряд одной строкой">${ICON.plus} связка</button>
    </div>`}
  </div>`;
}
function renderDoc(){
  const d = day(), dt = new Date(d.date + 'T00:00:00');
  /* Пустой день открывается как ручной ввод: сразу пустой блок со строкой
     упражнения, без карточек-подсказок — они дублировали кнопки под названием. */
  if(!d.blocks.length) d.blocks.push(mkBlock(null,'','',null,[]));
  /* Считается всё содержимое, и текст тоже: день из одного блока текстом —
     тренировка, её публикуют. */
  const n = dayCount(d);
  /* Полоса разбора стоит над первым блоком, который собрал ИИ: блок текстом
     бывает и в конце дня, и полоса сверху оказалась бы далеко от него.
     Предложение принадлежит своему дню — на соседних днях полосы нет. */
  const pendAt = PENDING && PENDING.date === d.date ? d.blocks.findIndex(b => PENDING.ids.has(b.id)) : -1;
  if(PENDING && PENDING.date === d.date && pendAt < 0) PENDING = null;     /* блоки предложения удалили руками */
  const propose = pendAt >= 0 ? `<div class="propose">
      <span class="t"><b>${AIMARK} Разобрано ИИ — проверьте</b><s>${pendingStat()}</s></span>
      <button class="lnk" id="pd-src">Исходный текст</button>
      <button class="btn gh" id="pd-no">Вернуть текст</button>
      <button class="btn" id="pd-yes">Принять</button>
    </div>` : '';
  $('#doc').innerHTML = `
    <div class="doch">
      <span class="gr" title="Перетащить тренировку на другой день">${ICON.grip}</span>
      ${docStatusHTML(d, n)}
      <input id="d-title" value="${esc(REST_TITLES.has(d.title) ? '' : (d.title||''))}"
             placeholder="${DOW[dowMon(day().date)]}, ${dt.getDate()} ${MON[dt.getMonth()]}">
      <button class="x ${d.comp?'on':''}" id="comp-tog" title="${d.comp?'Соревнование — снять статус':'Отметить день как соревнование'}">${DAYICON.comp}</button>
      <button class="x ${trainerMsg(d.date)?'on':''}" id="msg-tog" title="${trainerMsg(d.date)?'Сообщение '+aud(1):'Добавить сообщение '+aud(1)}">${ICON.chat}</button>
      <button class="x ${S.tplSaved[d.date] === serializeDay(d) ? 'on':''}" id="sav-wo" title="${S.tplSaved[d.date] === serializeDay(d) ? 'Сохранена в базу тренировок' : 'Сохранить тренировку в базу'}">${ICON.star}</button>
      <button class="x rm" id="clr-wo" title="Очистить день">${ICON.x}</button>
    </div>
    ${G_() ? grpPanelHTML(d) : grpRibbonHTML(d)}
    <div class="ways4" role="group" aria-label="Как создать тренировку">${[
      ['hand', ICON.pen,  'Вручную'],
      ['tpl',  ICON.tpl,  'Скопировать из шаблона'],
      ['cal',  ICON.cal,  'Скопировать из календаря'],
      ['text', ICON.text, 'Текстом'],
    ].map(([k, ic, n]) => `<button class="way4" data-way="${k}">${ic}<span>${n}</span></button>`).join('')}</div>
    ${trainerMsg(d.date) || S.msgOpen===d.date ? `<label class="fld wmsg"><span class="k">${ICON.chat} ${G_() ? 'Группе' : 'Клиенту'}</span>
      <input id="w-msg" value="${esc(trainerMsg(d.date))}"
             placeholder="${G_() ? 'Сообщение ко всей тренировке — каждый участник увидит его первым' : 'Сообщение ко всей тренировке — клиент увидит его первым'}">
      <kbd class="ent">↵ Enter</kbd>
      <button class="x" id="w-msgdel" title="Удалить сообщение">${ICON.x}</button>
    </label>` : ''}
    ${d.blocks.map((b, k) => (k === pendAt ? propose : '') + blockHTML(b)).join('')}
    <div class="addbrow">
      <button class="addb" id="add-blk">${ICON.plus} Добавить блок</button>
      <button class="addb" id="add-blk-text">${ICON.text} Добавить блок текстом</button>
    </div>
    ${pubbarHTML(d, n)}`;
}

/* ═══════════ ГРУППА В КОНСТРУКТОРЕ (GRP-2 … GRP-4) ═══════════
   Тренировки меняет только тренер. День группы показывает участников чипами —
   чип открывает день этого человека; у кого тренировки группы на этот день
   нет (пропущен при публикации, вступил позже), чип приглушён. День клиента,
   пришедший из группы, несёт полосу-пояснение: правка здесь — только для него,
   следующая правка этого дня в группе её заменит. День с другой тренировкой —
   кнопка «Заменить тренировкой группы». */
const shortName = c => { const [f, l] = c.n.split(' '); return f + (l ? ' ' + l[0] + '.' : '') };
function grpPanelHTML(d){
  const G = G_(); if(!G) return '';
  const n = G.members.length, st = groupDayStat(G, d.date);
  const head = (b, t) => `<div class="gp-h"><span class="gp-i">${GRPICON}</span><span class="gp-t"><b>${b}</b><s>${t}</s></span></div>`;
  if(!n) return `<div class="gpanel">${head('В группе пока никого', 'Добавьте участников на странице «Группы» — тренировка появится у каждого')}</div>`;
  const chip = (cid, k, note) => { const c = client(cid);
    return `<button class="gpm ${k}" data-gpm="${cid}" title="${esc(note)} — открыть день ${esc(gen(c.n))}"><span class="cav">${esc(c.ini)}</span><span class="nm">${esc(shortName(c))}</span></button>` };
  const title = n + ' ' + plural(n, 'участник', 'участника', 'участников');
  if(!st) return `<div class="gpanel">${head(title, 'Составьте тренировку — она встанет в календарь каждому')}
    <div class="gp-list">${G.members.map(cid => chip(cid, '', 'Участник группы')).join('')}</div></div>`;
  const sub = st.none.length
    ? `Стоит у ${st.got.length} из ${n}; у остальных на этот день своя тренировка или они вступили позже. Правка здесь меняет тренировку у всех, у кого она стоит`
    : 'Стоит у всех. Правка здесь меняет тренировку у всех участников — и там, где вы правили её отдельно';
  return `<div class="gpanel">${head(title, sub)}
    <div class="gp-list">${[...st.got.map(c => chip(c, '', 'Тренировка группы стоит')), ...st.none.map(c => chip(c, 'none', 'Тренировки группы на этот день нет'))].join('')}</div>
  </div>`;
}
function grpRibbonHTML(d){
  const c = client(S.cid); if(!c || !d) return '';
  const nm = esc(gen(c.n)), G = groupOf(c.id), dg = dayGroup(d);
  const open = G => `<button class="lnk" data-opengrp="${G.id}">Открыть в группе</button>`;
  if(dg) return `<div class="gribbon"><span class="gr-i">${GRPICON}</span><span class="gr-t"><b>Тренировка группы «${esc(dg.n)}»</b><s>Правка здесь — только для ${nm}; следующая правка этого дня в группе заменит её</s></span>${open(dg)}</div>`;
  /* Группа в этот день тренируется, а у клиента своё — или тренировка к нему не приходила. */
  if(!G) return '';
  const gd = dayAt(G.prog, d.date); if(!gd || !contentHas(gd.c)) return '';
  const has = dayHas(d);
  return `<div class="gribbon busy"><span class="gr-i">${GRPICON}</span><span class="gr-t"><b>${has ? 'Другая тренировка — не как в группе «' + esc(G.n) + '»' : 'У группы «' + esc(G.n) + '» в этот день тренировка'}</b><s>${has ? 'Группа занятый день сама не заменяет' : 'Сюда она не приходила — клиент вступил в группу позже'}</s></span><button class="btn gh sm" data-apply="${G.id}">${has ? 'Заменить тренировкой группы' : 'Поставить тренировку группы'}</button>${open(G)}</div>`;
}
/* Полоса и панель обновляются на месте — без перерисовки документа, которая
   сбила бы фокус в поле. */
function refreshGrp(){
  const d = day(); if(!d) return;
  const box = $('#doc .gpanel, #doc .gribbon'), html = G_() ? grpPanelHTML(d) : grpRibbonHTML(d);
  if(box) box.outerHTML = html; else if(html){ const h = $('#doc .doch'); if(h) h.insertAdjacentHTML('afterend', html) }
}
/* Поставить клиенту тренировку группы на открытый день (заменив его собственную) — с отменой. */
function applyGroupDay(gid){
  const G = grp(gid), d = day(); if(!G || !d) return;
  persist();
  const pid = S.pid, i = S.i, date = d.date, bag = ((STATE.days ||= {})[pid] ||= {}), had = bag[i] ? {...bag[i]} : null, wasSkip = isSkipped(G, S.cid, date);
  groupApply(S.cid, date, G);
  saveState(); delete PCACHE[S.pid]; bindClient(S.cid, date); render();
  toast('Стоит тренировка группы «' + G.n + '»', 'Отменить', () => {
    const b = ((STATE.days ||= {})[pid] ||= {}); if(had) b[i] = had; else delete b[i];
    setSkip(G, S.cid, date, wasSkip);
    saveState(); delete PCACHE[pid]; bindClient(S.cid, date); render() });
}
/* Сообщение группе к дню (COM-4) — каждому, у кого день как в группе. */
function grpMsgPush(){
  const G = G_(); if(!G) return;
  const date = day().date, st = groupDayStat(G, date), text = trainerMsg(date);
  (st ? st.got : []).forEach(cid => {
    const arr = (TALK.workout[talkKey(cid, date)] ||= []), k = arr.findIndex(m => m.who === 'trainer');
    if(text){ if(k >= 0) arr[k].text = text; else arr.unshift({who:'trainer', text, at:'сейчас'}) } else if(k >= 0) arr.splice(k, 1);
  });
}

/* ═══════════ ВЫБОР КЛИЕНТА ИЛИ ГРУППЫ ═══════════ (общий список с поиском — в nav.js)
   Смена того, кто открыт, — на месте: правки сохраняются, день остаётся тем же. */
function switchWho(id, date){
  persist();
  if(id !== S.cid) bulkReset();
  const follow = CSRC.cid === S.cid;
  if(!bindClient(id, date) && !bindClient(id, TODAY)) return toast('Не получилось открыть календарь');
  if(follow) csrcReset(id);
  history.replaceState(null, '', `constructor.html?${subjQ(S.cid)}&date=${plan()[S.i].date}`);
  render();
}
function openCliPick(btn){
  closeSug();
  SUG = openClientPicker(btn, S.cid, id => { SUG = null; switchWho(id, plan()[S.i].date) });
}

/* ═══════════ ПРАВАЯ ПАНЕЛЬ: ОТКУДА БРАТЬ МАТЕРИАЛ ═══════════
   Задача панели — подавать материал для быстрого копирования. Два источника:
   календарь (самый частый — уже составленные тренировки, свои или другого
   клиента) и базы шаблонов. В календаре точки — дни с тренировками; выбранный
   день раскрыт ниже, и из него берут тренировку целиком, блок или одно
   упражнение — кнопкой или перетаскиванием. Это та же «Скопировать из
   календаря», только без модалки: дни можно листать и смотреть, не вставляя. */
const CSRC = {cid:null, date:null, month:null};
const csrcHas = dayHas;
const csrcPlan = cid => { const c = who(cid); return c && c.prog && program(c.prog) ? planOf(c.prog) : [] };
const csrcDay = () => CSRC.date ? (csrcPlan(CSRC.cid).find(x => x.date === CSRC.date) || null) : null;
/* По умолчанию — последняя тренировка до открытого дня: чаще всего её и повторяют. */
function csrcReset(cid){
  CSRC.cid = cid;
  const days = csrcPlan(cid).filter(csrcHas).map(x => x.date), before = days.filter(d => d < S.date);
  CSRC.date = before.length ? before[before.length - 1] : (days[0] || null);
  CSRC.month = (CSRC.date || S.date).slice(0, 7);
}
function mcalHTML(){
  const [y, m] = CSRC.month.split('-').map(Number);
  const lead = dowMon(CSRC.month + '-01'), n = new Date(y, m, 0).getDate();
  const has = new Map();
  csrcPlan(CSRC.cid).forEach(x => { if(x.date.slice(0, 7) === CSRC.month && csrcHas(x)) has.set(x.date, isDraft(x) ? 'draft' : 'pub') });
  const cells = [];
  for(let k = 0; k < lead; k++) cells.push('<span class="pad"></span>');
  for(let dd = 1; dd <= n; dd++){
    const date = CSRC.month + '-' + String(dd).padStart(2, '0'), st = has.get(date);
    const cls = [st ? 'has ' + st : '', date === CSRC.date ? 'on' : '', date === TODAY ? 'today' : '', CSRC.cid === S.cid && date === S.date ? 'cur' : ''].filter(Boolean).join(' ');
    cells.push(`<button class="${cls}" data-mday="${date}" ${st ? '' : 'disabled'}>${dd}${st ? '<i></i>' : ''}</button>`);
  }
  return `<div class="mcal">
    <div class="mcal-h"><button data-mcal="-1" title="Предыдущий месяц">‹</button><b>${MONTHS_N[m - 1]} ${y}</b><button data-mcal="1" title="Следующий месяц">›</button></div>
    <div class="mcal-g">${RU.map(w => `<s>${w}</s>`).join('')}${cells.join('')}</div>
  </div>`;
}
function renderRailHead(){
  const h = $('#railhead'); if(!h) return;
  const sw = `<div class="srcsw">
      <button data-srcsw="cal" class="${S.src === 'cal' ? 'on' : ''}">${ICON.cal}<span>Календарь</span></button>
      <button data-srcsw="tpl" class="${S.src === 'tpl' ? 'on' : ''}">${ICON.tpl}<span>Базы шаблонов</span></button>
    </div>`;
  if(S.src === 'tpl'){
    h.innerHTML = sw + `
      <div class="tabs" id="tabs"><button data-tab="ex" class="${S.tab === 'ex' ? 'on' : ''}">Упражнения</button><button data-tab="blk" class="${S.tab === 'blk' ? 'on' : ''}">Блоки</button></div>
      <label class="search">${ICON.search}<input id="q" placeholder="Поиск…" autocomplete="off" value="${esc(S.q)}"></label>`;
    return;
  }
  const c = who(CSRC.cid) || who(S.cid);
  h.innerHTML = sw + `
    <button class="csrc-cli" id="cs-cli" title="Чей календарь смотреть"><span class="cav${isGrp(c.id) ? ' grp' : ''}">${esc(c.ini)}</span>
      <span class="cl-t"><b>${esc(c.n)}</b><s>${c.id === S.cid ? (isGrp(c.id) ? 'группа в конструкторе' : 'клиент в конструкторе') : esc(clientProgSub(c))}</s></span>${ICON.chev}</button>
    ${mcalHTML()}`;
}
const csrcItemAt = ref => { const x = csrcDay(); if(!x) return null; const [bi, k] = String(ref).split(':').map(Number); return ((x.blocks[bi] || {}).items || [])[k] || null };
/* Копии, а не ссылки: правка в открытом дне не должна менять день-источник. */
function csrcCopyItems(ref){
  const x = csrcDay(); if(!x) return null;
  const [bi, k] = String(ref).split(':').map(Number), b = x.blocks[bi]; if(!b || !b.items[k]) return null;
  return b.items[k].ss ? b.items.slice(k, ssEnd(b.items, k)).map(dupItem) : [{...dupItem(b.items[k]), sub:false}];
}
const csrcCopyBlock = bi => { const x = csrcDay(), b = x && x.blocks[+bi]; return b ? copyBlocks([b])[0] : null };
/* Пустая заготовка блока (появляется на каждом пустом дне) не должна оставаться над вставленным. */
const dropEmptyBlocks = d => { d.blocks = d.blocks.filter(b => b.items.length || b.title || b.note || blockHas(b)) };
function csrcCopyWorkout(){
  const x = csrcDay(); if(!x) return;
  const d = day(), snap = {title: d.title, blocks: d.blocks}, had = dayHas(d);
  d.title = x.title; d.blocks = copyBlocks(x.blocks);
  render();
  toast(had ? 'Тренировка дня заменена копией' : 'Тренировка скопирована', 'Отменить', () => { d.title = snap.title; d.blocks = snap.blocks; render() });
}
const csrcItemHTML = (it, bi, k, sub) => { const e = it.exId ? byId(it.exId) : null, chip = it.exId ? itemChip(it) : '';
  return `<div class="csi ${sub ? 'sub' : ''}" draggable="true" data-cit="${bi}:${k}"><span class="gr">${ICON.grip}</span><span class="nm">${esc(it.chain ? chainText(it) : e ? e.ru : it.raw || '')}</span>${chip ? `<em>${esc(chip)}</em>` : ''}<button class="add" data-ciadd="${bi}:${k}" title="Добавить в тренировку">${ICON.plus}</button></div>` };
function csrcBlockHTML(b, bi){
  const rows = []; let k = 0;
  /* Блок текстом берут только целиком: его строки — текст, а не отдельные записи. */
  if(isTextBlock(b)) textLines(b.text).forEach(l => rows.push(`<div class="csi txl"><span class="nm">${esc(l)}</span></div>`));
  while(k < b.items.length){
    const it = b.items[k];
    if(it.ss){ const j = ssEnd(b.items, k);
      rows.push(`<div class="csi ssl" draggable="true" data-cit="${bi}:${k}"><span class="gr">${ICON.grip}</span><span class="nm">${esc(ssLabel(it))}</span><button class="add" data-ciadd="${bi}:${k}" title="Добавить суперсет в тренировку">${ICON.plus}</button></div>`);
      for(let m = k + 1; m < j; m++) rows.push(csrcItemHTML(b.items[m], bi, m, true));
      k = j; continue }
    if(it.exId || it.raw) rows.push(csrcItemHTML(it, bi, k, false));
    k++;
  }
  return `<div class="csb" draggable="true" data-cblk="${bi}">
    <div class="csb-h"><span class="gr">${ICON.grip}</span><span class="tt"><b>${esc(b.title || blockTypeLabel(b) || (isTextBlock(b) ? 'Блок текстом' : 'Блок'))}</b>${typeNote(b) && b.title ? `<s class="ty">${esc(typeNote(b))}</s>` : ''}</span><button class="add" data-cbadd="${bi}" title="Добавить блок в тренировку">${ICON.plus}</button></div>
    ${rows.join('')}
  </div>`;
}
function renderCalSrc(){
  const box = $('#src'); $('#railfoot').textContent = '';
  const x = csrcDay();
  if(!csrcHas(x)){
    box.innerHTML = `<div class="empty">${csrcPlan(CSRC.cid).some(csrcHas) ? 'Выберите день с точкой — тренировка появится здесь' : 'У клиента пока нет тренировок в календаре'}</div>`;
    return;
  }
  const cur = day(), cd = D(cur.date), xd = D(x.date), same = CSRC.cid === S.cid && x.date === cur.date;
  const nb = x.blocks.filter(blockHas).length;
  box.innerHTML = `<div class="csrc">
    <div class="csrc-h"><b>${esc(x.title && !REST_TITLES.has(x.title) ? x.title : 'Тренировка')}</b>
      <s>${RU[dowMon(x.date)]}, ${xd.getDate()} ${MON[xd.getMonth()]} · ${nb} ${plural(nb, 'блок', 'блока', 'блоков')}</s></div>
    <button class="btn sm csrc-copy" id="cs-copy" ${same ? 'disabled title="Этот день открыт в конструкторе"' : ''}>${ICON.copy} Скопировать в ${RU[dowMon(cur.date)]}, ${cd.getDate()} ${MON[cd.getMonth()]}</button>
    ${x.blocks.map((b, bi) => blockHas(b) ? csrcBlockHTML(b, bi) : '').join('')}
  </div>`;
}

/* ─── панель источников: три уровня, которыми наполняют день ─── */
function renderSrc(){
  if(S.src === 'cal'){ renderCalSrc(); return }
  const q = norm(S.q), box = $('#src');
  if(S.tab === 'ex'){
    const list = EX.filter(e=>!q || norm(e.ru).includes(q) || norm(e.en).includes(q) ||
                              norm(e.eq).includes(q) || (ALIAS[e.id]||[]).some(a=>norm(a).includes(q)));
    const g = {}; list.forEach(e => (g[e.g] ||= []).push(e));
    box.innerHTML = Object.entries(g).map(([k,arr])=>`
      <div class="grpttl"><span class="lab">${esc(k)}</span><span class="ln"></span><span class="n">${arr.length}</span></div>
      ${arr.map(e=>`<div class="exc" draggable="true" data-ex="${e.id}">
        <span class="thumb ${e.m==='pending'?'pending':''}">${e.gif?`<img src="${e.gif}-180.gif" alt="">`:e.m==='ok'?esc(initials(e)):'·'}</span>
        <span class="body"><span class="nm">${esc(e.ru)}</span>
          <span class="en">${esc(e.en)} · ${esc(e.eq)}</span></span>
        <button class="add" data-addex="${e.id}" title="В открытый блок">${ICON.plus}</button>
      </div>`).join('')}`).join('') || '<div class="empty">Ничего не нашлось</div>';
    $('#railfoot').textContent = '';   /* подпись убрана: панель и так понятна */
  } else {
    const lvl = S.tab === 'blk' ? 'блок' : 'тренировка';
    TPL.filter(t=>t.lvl==='блок').forEach(normFmt);        /* формат — в тип, название чистое */
    /* inline — записи, созданные ради ссылок внутри недели. Они не выбор
       тренера, а внутренняя кухня, и в источниках им не место. */
    const list = TPL.filter(t => t.lvl===lvl && !t.inline &&
      (!q || norm(t.title).includes(q) || norm(t.folder||'').includes(q)));
    box.innerHTML = list.map(t=>`
      <div class="tplc" draggable="true" data-tpl="${t.id}">
        <div class="h">
          <span class="nm">${esc(t.title || blockTypeLabel(t))}</span>
          </div>
        ${lvl==='блок' && typeNote(t) && t.title ? `<div class="ty">${esc(typeNote(t))}</div>` : ''}
        <div class="ls">${lvl==='блок'
          ? isTextBlock(t) ? textLines(t.text).map(l => `<span>${esc(l)}</span>`).join('')
          : t.items.map(i=>{ if(i[0] === SS_TAG) return `<span class="ssl">${esc(ssLabel({rounds:+i[1]||3, rest:i[2]||''}))}</span>`;
              if(i[0] === TXT_TAG) return `<span class="${i[5]?'sub':''}">${esc(i[1]||'')}</span>`;
              if(i[0] === CH_TAG) return `<span class="${i[5]?'sub':''}">${esc(chainText(tplLine(i)))}</span>`;
              const e=byId(i[0]) || {ru:i[0]};   /* неизвестный id — показываем как есть, не роняем панель */
              const v = i[4] ? ` · ${i[4]}` : i[2] ? ` · ${i[2]}${i[3]==='%'?' %':' '+(i[3]||'')}` : '';
              return `<span class="${i[5]?'sub':''}">${esc(e.ru)}${i[1]?' — '+esc(i[1]):''}${esc(v)}</span>` }).join('')
          : (t.blocks||[]).map(id=>{ const b=tplById(id); return b?`<span>${esc(b.title)}</span>`:'' }).join('')}</div>
      </div>`).join('') || '<div class="empty">Пусто</div>';
    $('#railfoot').textContent = lvl === 'блок'
      ? 'Блок вставляется в открытую тренировку одним нажатием (CON-3).'
      : 'Шаблон тренировки занимает день целиком (TPL-3).';
  }
}
/* ═══════════ СОХРАНЕНИЕ, ЧЕРНОВИК И ПУБЛИКАЦИЯ (CON-20) ═══════════
   Правки пишутся сразу и не теряются (STATE.unsaved), но в календарь и
   клиенту уходят только по «Сохранить». Статус дня — «Черновик» (клиент не
   видит) или «Опубликована» (видит последнюю сохранённую версию); сама правка
   статус не меняет — прежде опубликованная тренировка от первой же правки
   становилась черновиком. Переключатель статуса срабатывает сразу и заодно
   сохраняет правки этого дня. x.saved — слепок, который лежит в календаре. */
const isDraft = x => !!x.draft;
const isDirty = x => !!x && serializeDay(x) !== x.saved;
const dirtyIdx = () => plan().map((x, i) => isDirty(x) ? i : -1).filter(i => i >= 0);
/* Несохранённые правки — в STATE.unsaved вместе со слепком, поверх которого
   они сделаны (base): изменится день под ними — они не лягут обратно. */
function persist(){
  const bag = ((STATE.unsaved ||= {})[S.pid] ||= {});
  plan().forEach((x, i) => { const c = serializeDay(x); if(c !== x.saved) bag[i] = {c, base: x.saved}; else delete bag[i] });
  saveState();
}
/* Записать дни в календарь. status — новый статус по номеру дня. Запись —
   через putDay: день группы расходится по участникам, у дня участника
   остаётся метка группы; опубликованный день группы сначала проходит окно
   занятых дней участников. done(true | false). */
function commitDays(idxs, status = {}, done){
  const rows = [...new Set(idxs)].map(i => ({i, x: plan()[i]})).filter(r => r.x);
  if(!rows.length){ if(done) done(false); return }
  const was = rows.map(r => r.x.draft);
  rows.forEach(r => { if(status[r.i]) r.x.draft = status[r.i] === 'draft' });
  const write = replace => {
    rows.forEach(({i, x}) => {
      const c = serializeDay(x);
      if(x.draft) putDay(S.pid, i, {c, pub: x.pub, draft: true});
      else { x.pub = c; putDay(S.pid, i, {c, draft: false}, true, replace) }
      x.saved = c;
    });
    persist(); render(); if(done) done(true);
  };
  const pubs = rows.filter(r => !r.x.draft);
  if(!pubs.length) return write(null);
  withGroupConflicts(S.pid, pubs.map(r => r.x.date), write, () => { rows.forEach((r, k) => r.x.draft = was[k]); render(); if(done) done(false) });
}
const seeVerb = () => G_() ? 'видят' : 'видит';
/* Итог публикации: у группы — у скольких участников тренировка встала. */
function pubMsg(on){
  const G = G_(), st = on && G && groupDayStat(G, day().date);
  if(!st) return pubToggleMsg(on, S.pid);
  const n = G.members.length;
  return 'Опубликовано для группы «' + G.n + '» — ' + (!st.none.length ? 'тренировка у всех ' + n + ' ' + plural(n, 'участника', 'участников', 'участников')
    : 'тренировка у ' + st.got.length + ' из ' + n + ', ' + st.none.length + ' ' + plural(st.none.length, 'пропущен', 'пропущены', 'пропущены'));
}
/* «Сохранить» (Ctrl/⌘+S) — все изменённые дни, каждый со своим статусом. */
function saveAll(){
  const idx = dirtyIdx(); if(!idx.length) return;
  const d = day(), one = idx.length === 1 && idx[0] === S.i;
  commitDays(idx, {}, ok => { if(!ok) return toast('Не сохранено — публикация отменена');
    toast(!one ? 'Сохранено дней: ' + idx.length
      : d.draft ? 'Сохранено черновиком — ' + aud() + ' не ' + seeVerb()
      : G_() ? pubMsg(true) : 'Сохранено — ' + aud() + ' ' + seeVerb() + ' новую версию') });
}
/* Переключатель «Опубликовать» внизу и статус у названия дня. */
function setStatus(st){
  const d = day(); if(!d || ((st === 'draft') === !!d.draft && !isDirty(d))) return;
  commitDays([S.i], {[S.i]: st}, ok => { if(ok) toast(pubMsg(st === 'pub')) });
}
/* Глазик в полосе недель: опубликовать черновик или скрыть опубликованное.
   Работает по живому плану конструктора, а не по слепку в STATE. */
/* Публикация дня группы сначала проходит окно занятых дней участников (withGroupConflicts). */
/* Правки этого дня сохраняются вместе со статусом. */
function setPubIdx(i, on){
  if(!plan()[i]) return;
  commitDays([i], {[i]: on ? 'pub' : 'draft'}, ok => { if(ok) toast(pubToggleMsg(on, S.pid)) });
}
addEventListener('beforeunload', persist);
document.addEventListener('visibilitychange', ()=>{ if(document.hidden) persist() });
/* Лист блока текстом растёт по содержимому, без собственной прокрутки. */
const fitText = ta => { ta.style.height = 'auto'; ta.style.height = ta.scrollHeight + 'px' };
/* «Пятница, 19 сентября» — дата открытого дня в заголовке страницы; год — если не текущий. */
const fullDate = date => { const t = D(date), y = t.getFullYear(); return DOW[dowMon(date)] + ', ' + t.getDate() + ' ' + MONTHS[t.getMonth()] + (y !== new Date().getFullYear() ? ' ' + y : '') };
function render(){ const fs = focusSnap(), cur = day(); if(cur) cur.blocks.forEach(normSS); persist(); renderStrip(); renderDoc(); $$('#doc .tbx').forEach(fitText); alignNames(); if(S.src === 'cal') renderRailHead(); renderSrc(); focusRestore(fs);
  const pt = $('#ptd'); if(pt && cur) pt.textContent = fullDate(cur.date) }

/* ═══════════ ВИЗАРД «СОЗДАТЬ НЕСКОЛЬКО ТРЕНИРОВОК» (CON-4) ═══════════
   Три шага: что копируем (шаблоны или существующие дни, любой набор) →
   кому и с какого дня → проверка и создание. Набор ложится по правилу
   промежутков: подряд, через день или как в источнике. */
const WZ = {step:1, tab:'tpl', src:null, picked:new Map(), cid:null, start:null, gap:'daily', publish:true};
function openWizard(){
  Object.assign(WZ, {step:1, tab:'tpl', src:S.cid, picked:new Map(), cid:S.cid, gap:'daily', publish:true});
  const n = composedDays(S.pid);                     /* по умолчанию — первый несоставленный день */
  WZ.start = dayDate(S.pid, n);
  const ov = document.createElement('div'); ov.className = 'ov on'; ov.id = 'wz';
  document.body.appendChild(ov);
  const draw = () => { ov.innerHTML = wizardHTML(); wireWizard(ov, draw) };
  draw();
}
const wzKey = it => it.kind==='tpl' ? 'tpl:'+it.id : 'day:'+it.pid+':'+it.i;
function wizardHTML(){
  const steps = ['Что копируем','Кому и когда','Проверка'];
  const head = `<div class="wz-steps">${steps.map((n,i)=>`<span class="${WZ.step===i+1?'on':WZ.step>i+1?'done':''}"><i>${i+1}</i>${n}</span>`).join('')}</div>`;
  let body = '', foot = '';
  /* Группы — в тех же списках, что и клиенты: набор тренировок кладут и в календарь группы. */
  const whos = () => [...GRPS, ...CLIENTS.filter(c=>c.prog)];
  if(WZ.step===1){
    const src = who(WZ.src);
    const list = WZ.tab==='tpl'
      ? TPL.filter(t=>t.lvl==='тренировка' && !t.inline).map(t=>({kind:'tpl', id:t.id, title:t.title, sub:(t.own?'своё':'общая база')+' · '+tplStats(t).blocks+' '+plural(tplStats(t).blocks,'блок','блока','блоков')}))
      : (src && src.prog ? planOf(src.prog).filter(x=>!x.rest && x.blocks.some(b=>b.items.length)).map(x=>({kind:'day', pid:src.prog, i:x.i, title:x.title, sub:x.w+' '+dm(x.date)+' · '+x.blocks.length+' '+plural(x.blocks.length,'блок','блока','блоков')})) : []);
    body = `
      <div class="wz-tabs">
        <button data-wtab="tpl" class="${WZ.tab==='tpl'?'on':''}">Из шаблонов</button>
        <button data-wtab="day" class="${WZ.tab==='day'?'on':''}">Из существующих</button>
      </div>
      ${WZ.tab==='day' ? `<label class="pk-src"><span>Чьи тренировки</span>
        <select id="wz-src">${whos().map(c=>`<option value="${c.id}" ${c.id===WZ.src?'selected':''}>${isGrp(c.id) ? 'Группа · ' : ''}${esc(c.n)}</option>`).join('')}</select></label>` : ''}
      <div class="wz-list">${list.length ? list.map(it=>{ const on = WZ.picked.has(wzKey(it));
        return `<label class="wz-it ${on?'on':''}"><input type="checkbox" data-wzpick="${wzKey(it)}" ${on?'checked':''}>
          <span class="tick">${ICON.chk}</span><span class="t"><b>${esc(it.title)}</b><s>${esc(it.sub)}</s></span></label>`; }).join('')
        : '<p class="warn">Здесь пока пусто.</p>'}</div>`;
    foot = `<s class="wz-n">Выбрано: ${WZ.picked.size} · порядок — как отмечаете</s><span class="sp"></span><button class="btn" id="wz-next" ${WZ.picked.size?'':'disabled'}>Дальше ${ICON.arr}</button>`;
  }
  if(WZ.step===2){
    const hasDays = [...WZ.picked.values()].some(it=>it.kind==='day');
    body = `
      <div class="wz-row">
        <label class="wz-f"><span>Кому</span>
          <select id="wz-cid">${whos().map(c=>`<option value="${c.id}" ${c.id===WZ.cid?'selected':''}>${isGrp(c.id) ? 'Группа · ' : ''}${esc(c.n)}</option>`).join('')}</select></label>
        <label class="wz-f"><span>Начиная с</span><input type="date" id="wz-start" value="${WZ.start}"></label>
      </div>
      <div class="wz-h">Промежутки между тренировками</div>
      <div class="wz-tabs">
        <button data-gap="daily" class="${WZ.gap==='daily'?'on':''}">Подряд, день за днём</button>
        <button data-gap="alt" class="${WZ.gap==='alt'?'on':''}">Через день</button>
        ${hasDays?`<button data-gap="src" class="${WZ.gap==='src'?'on':''}">Как в источнике</button>`:''}
      </div>`;
    foot = `<button class="btn gh" id="wz-back">${ICON.back} Назад</button><span class="sp"></span><button class="btn" id="wz-next">Дальше ${ICON.arr}</button>`;
  }
  if(WZ.step===3){
    const plan3 = wizardPlan();
    body = plan3.error ? `<p class="warn">${esc(plan3.error)}</p>` : `
      <div class="wz-list">${plan3.rows.map(r=>`<div class="wz-it static"><span class="t"><b>${esc(r.title)}</b><s>${r.w} ${dm(r.date)}${r.busy?' · заменит существующую':''}</s></span></div>`).join('')}</div>
      <label class="wz-pub"><input type="checkbox" id="wz-pub" ${WZ.publish?'checked':''}> Сразу добавить в календарь — клиент увидит. Иначе останутся черновиками.</label>`;
    foot = `<button class="btn gh" id="wz-back">${ICON.back} Назад</button><span class="sp"></span><button class="btn" id="wz-go" ${plan3.error?'disabled':''}>${ICON.chk} Создать ${plan3.rows?plan3.rows.length:''} ${plural(plan3.rows?plan3.rows.length:0,'тренировку','тренировки','тренировок')}</button>`;
  }
  return `<div class="md wmd wz"><div class="mdh"><span class="dot"></span><h2>Создать несколько тренировок</h2><button class="cls" id="wz-x">✕</button></div>
    ${head}<div class="mdb">${body}</div><div class="mdf">${foot}</div></div>`;
}
/* Раскладка набора по дням: индекс = старт + смещение по правилу промежутков. */
function wizardPlan(){
  const c = who(WZ.cid); if(!c) return {error:'Клиент не найден'};
  if(!c.prog) ensureDay(c.id, WZ.start || TODAY);          /* личный контейнер дней */
  const p = program(c.prog); const start = daysBetween(p.start, WZ.start);
  if(isNaN(start)) return {error:'Укажите дату начала'};
  let items = [...WZ.picked.values()];
  /* «Как в источнике»: дни идут с теми же промежутками, что были у клиента-
     источника; шаблоны, у которых даты нет, встают следом за последним. */
  if(WZ.gap==='src') items = items.slice().sort((a,b)=>(a.kind==='day'?a.i:1e9)-(b.kind==='day'?b.i:1e9));
  const base = Math.min(...items.filter(i=>i.kind==='day').map(i=>i.i));
  const rows = []; let next = 0;
  items.forEach((it,idx)=>{
    const off = WZ.gap==='alt' ? idx*2 : WZ.gap==='src' ? (it.kind==='day' ? it.i - base : next) : idx;
    next = Math.max(next, off + 1);
    const i = start + off;
    if(i >= p.days) p.days = i + 1;   /* программа открыта вперёд */
    const date = dayDate(c.prog, i);
    const existing = (planOf(c.prog)[i]||{});
    rows.push({it, i, date, w:RU[dowMon(date)], title: it.kind==='tpl' ? tplById(it.id).title : it.title, busy: dayHas(existing)});
  });
  if(!rows.length) return {error:'Набор не влезает в программу'};
  return {rows, pid:c.prog};
}
function wizardApply(){
  bindClient(WZ.cid, WZ.start);                      /* сначала сдвиг/контейнер, потом раскладка */
  const pl = wizardPlan(); if(pl.error) return toast(pl.error);
  pl.rows.forEach(r=>{
    extendPlan(r.i);
    const d = plan()[r.i];
    const src = r.it.kind==='tpl' ? tplToWorkout(tplById(r.it.id)) : planOf(r.it.pid)[r.it.i];
    d.title = src.title; d.rest = false; d.blocks = copyBlocks(src.blocks);
  });
  /* Созданное сразу ложится в календарь — опубликованным или черновиком. */
  const n = pl.rows.length, write = (pub, replace) => pl.rows.forEach(r => { const d = plan()[r.i], c = serializeDay(d);
      d.draft = !pub; if(pub){ d.pub = c; putDay(S.pid, r.i, {c, draft:false}, true, replace) } else putDay(S.pid, r.i, {c, pub: d.pub, draft:true}); d.saved = c }),
    done = pub => { persist(); render();
      history.replaceState(null,'',`constructor.html?${subjQ(S.cid)}&date=${S.date}`);
      toast('Создано ' + n + ' ' + plural(n,'тренировка','тренировки','тренировок') + (pub ? ' — в календаре' : ' — черновиками')) };
  if(!WZ.publish){ write(false); return done(false) }
  /* Публикация набора в группу — через окно занятых дней участников, как у одного дня. */
  withGroupConflicts(S.pid, pl.rows.map(r => r.date), replace => { write(true, replace); done(true) }, () => { write(false); done(false) });
}
function wireWizard(ov, draw){
  ov.querySelector('#wz-x').onclick = () => ov.remove();
  ov.addEventListener('click', e => { if(e.target === ov) ov.remove() });
  ov.querySelectorAll('[data-wtab]').forEach(b => b.onclick = () => { WZ.tab = b.dataset.wtab; draw() });
  const src = ov.querySelector('#wz-src'); if(src) src.onchange = e => { WZ.src = e.target.value; draw() };
  ov.querySelectorAll('[data-wzpick]').forEach(cb => cb.onchange = () => {
    const key = cb.dataset.wzpick, [kind, a, b] = key.split(':');
    if(cb.checked){ WZ.picked.set(key, kind==='tpl' ? {kind, id:a} : {kind, pid:a, i:+b, title:(planOf(a)[+b]||{}).title||''}); }
    else WZ.picked.delete(key);
    draw();
  });
  const cid = ov.querySelector('#wz-cid'); if(cid) cid.onchange = e => { WZ.cid = e.target.value };
  const st = ov.querySelector('#wz-start'); if(st) st.onchange = e => { WZ.start = e.target.value || WZ.start };
  ov.querySelectorAll('[data-gap]').forEach(b => b.onclick = () => { WZ.gap = b.dataset.gap; draw() });
  const pub = ov.querySelector('#wz-pub'); if(pub) pub.onchange = e => { WZ.publish = e.target.checked };
  const nx = ov.querySelector('#wz-next'); if(nx) nx.onclick = () => { WZ.step++; draw() };
  const bk = ov.querySelector('#wz-back'); if(bk) bk.onclick = () => { WZ.step--; draw() };
  const go = ov.querySelector('#wz-go'); if(go) go.onclick = () => { ov.remove(); wizardApply() };
}
if(Q.get('wizard')) addEventListener('load', openWizard);

/* ═══════════ ИЗ ШАБЛОНА / КОПИЯ СУЩЕСТВУЮЩЕЙ ═══════════
   Две кнопки в строке дорожки. Составление «с нуля» отдельной кнопки не
   требует: пустой день уже есть, блоки накидываются из панели или текстом. */
function pickTemplate(){
  const list = TPL.filter(t=>t.lvl==='тренировка');
  openPick('Скопировать из шаблона', list.map(t=>`
    <button class="pk" data-tpl="${t.id}"><b>${esc(t.title)}</b>
      <s>${t.own?'своё':'общая база'} · ${tplStats(t).blocks} ${plural(tplStats(t).blocks,'блок','блока','блоков')}</s></button>`).join(''),
    el => { const t = tplById(el.dataset.tpl); const w = tplToWorkout(t); const d = day();
      d.title = w.title; d.rest = false; d.blocks = copyBlocks(w.blocks); render();
      toast('«' + t.title + '» вставлена в день ' + (S.i+1)); });
}

function pickExisting(){
  let srcId = S.cid;
  const draw = () => {
    const c = who(srcId); const days = c.prog ? planOf(c.prog).filter(x=>!x.rest) : [];
    return `
      <label class="pk-src"><span>Чья тренировка</span>
        <select id="pk-src">${[...GRPS, ...CLIENTS.filter(x=>x.prog)].map(x=>`<option value="${x.id}" ${x.id===srcId?'selected':''}>${isGrp(x.id) ? 'Группа · ' : ''}${esc(x.n)}${x.id===S.cid ? (isGrp(x.id) ? ' — эта группа' : ' — этот клиент') : ''}</option>`).join('')}</select>
      </label>
      ${days.length ? days.map(x=>`<button class="pk" data-src="${c.id}" data-i="${x.i}"><b>${esc(x.title)}</b>
        <s>${x.w} ${dm(x.date)} · ${x.blocks.length} ${plural(x.blocks.length,'блок','блока','блоков')}</s></button>`).join('')
      : '<p class="warn">У клиента пока нет составленных тренировок.</p>'}`;
  };
  openPick('Скопировать из календаря', draw(), el => {
    const src = planOf(who(el.dataset.src).prog)[+el.dataset.i]; const d = day();
    d.title = src.title; d.rest = false; d.blocks = copyBlocks(src.blocks); render();
    toast('Скопировано: «' + src.title + '» → день ' + (S.i+1));
  }, wire);
  function wire(box){ box.querySelector('#pk-src').onchange = e => { srcId = e.target.value; box.querySelector('.mdb').innerHTML = draw(); wire(box) } }
}

/* Общая модалка выбора: список кнопок .pk, клик по одной — выбор. */
function openPick(title, body, onPick, after){
  const ov = document.createElement('div'); ov.className = 'ov on';
  ov.innerHTML = `<div class="md wmd"><div class="mdh"><span class="dot"></span><h2>${esc(title)}</h2>
    <button class="cls">✕</button></div><div class="mdb">${body}</div></div>`;
  document.body.appendChild(ov);
  ov.addEventListener('click', e => {
    const pk = e.target.closest('.pk');
    if(pk){ ov.remove(); onPick(pk); return }
    if(e.target === ov || e.target.closest('.cls')) ov.remove();
  });
  if(after) after(ov);
}

/* ─── разбор одной строки (CON-5) ─── */
/* parseText разбирает МНОГО строк и возвращает массив записей вида
   {type:'ok', item, ex} | {type:'raw'} | {type:'fmt'}. Здесь строка всегда
   одна, поэтому берём первую запись и отдаём готовый item — иначе легко
   обратиться к массиву как к объекту, и разбор молча перестанет работать.
   Зовут его кнопка AI и выбор из подсказки; набранный текст сам не разбирается. */
function parseLine(text){
  const r = parseText(String(text||'').trim())[0];
  return r && r.type === 'ok' ? r.item : null;
}

/* ═══════════ ТЕКСТ → СТРУКТУРА ПО КНОПКЕ AI (CON-5) ═══════════
   Раньше текст разбирался сам — при уходе из строки, по Enter, при вставке.
   На сложной записи (комплексы с хитрой логикой, опечатки в названиях) это
   давало правдоподобные ошибки, которые новый тренер принимает за успех и
   отправляет клиенту. Теперь текст по умолчанию сохраняется как написан, а в
   структуру его переводит только кнопка AI — когда тренер сам попросит.

   Разобранный блок — предложение, а не готовое. Подтверждение здесь не
   вежливость, а требование корректности: регулярка ошибается предсказуемо —
   не узнала, оставила текстом; модель ошибается правдоподобно — подставит
   похожее упражнение или не туда разобьёт блоки. Поэтому собранные ИИ блоки
   стоят под полосой «проверьте» до «Принять», а «Вернуть текст» кладёт блок
   текстом на место как был. Строку проверить проще — она меняется на месте,
   возврат — в уведомлении.

   Разбор двухэтапный: правила мгновенно узнают обычную нотацию, модель
   подключается к остатку — группировке и разговорным строкам. */

/* Строка-заголовок: короткая, без чисел, не упражнение. «Разминка»,
   «Силовая часть», «Комплекс:». Границей блока служит и пустая строка. */
const isHeader = L => L.length <= 42 && (/:$/.test(L) || !/\d/.test(L));

function textToBlocks(text){
  const blocks = [];
  let cur = null, ss = null;             /* ss — открытый суперсет: {bullets:null|true|false} */
  const open = title => { cur = {title: title || '', items: [], src: []}; blocks.push(cur); ss = null };
  for(const line of String(text).split('\n')){
    const L = line.trim();
    if(!L){ cur = null; ss = null; continue }                       /* пустая строка — граница */
    const bullet = /^[-–—•*]\s*/.test(L), body = L.replace(/^[-–—•*]\s*/, '');
    if(!bullet && fmtPart(L)){ open(L.replace(/:$/,'')); cur.src.push(L); continue }
    /* «Суперсет 3 круга:» / «3 раза» — заголовок суперсета внутри текущего блока;
       участники — перечень после двоеточия или следующие строки. Если строки
       с дефисом, первая строка без дефиса закрывает суперсет. */
    const sh = bullet ? null : parseSSHead(L);
    if(sh){
      if(!cur) open('');
      cur.items.push(ssItem(sh.rounds, sh.rest)); cur.src.push(L);
      sh.list.forEach(t => { const it = parseLine(t) || rawItem(t); it.sub = true; cur.items.push(it) });
      ss = sh.list.length ? null : {bullets:null};
      continue;
    }
    if(ss){
      if(ss.bullets === null) ss.bullets = bullet;
      if((ss.bullets && !bullet) || /:$/.test(L)) ss = null;
    }
    if(!ss && !bullet && isHeader(L)){ open(L.replace(/:$/,'')); cur.src.push(L); continue }
    if(!cur) open('');
    const it = parseLine(body) || rawItem(body);
    if(ss) it.sub = true;
    cur.items.push(it);
    cur.src.push(L);
  }
  /* Заголовок, под которым ничего не оказалось («заминка по самочувствию» в
     конце текста), — просто строка. Её не выбрасываем: она остаётся строкой
     текстом в предыдущем блоке, а если его нет — отдельным блоком. */
  const out = [];
  for(const b of blocks){
    if(b.items.length){ out.push(b); continue }
    if(!b.title) continue;
    const it = rawItem(b.src[0] || b.title), prev = out[out.length - 1];
    if(prev) prev.items.push(it); else out.push({title:'', items:[it], src:b.src});
  }
  return out;
}

/* ЗДЕСЬ будет модель. На вход — строки, которые правила не разобрали,
   и предварительная разбивка на блоки; на выход — уточнённая структура.
   Пока возвращаем как есть: поток и подтверждение от этого не зависят. */
async function aiRefine(blocks /*, source */){ return blocks }
/* Пауза вместо запроса к модели: кнопка успевает показать, что работает. */
const aiWait = ms => new Promise(r => setTimeout(r, ms));

let PENDING = null;   /* {date, ids:Set, block, source} — предложение ИИ до «Принять» */

/* Пока ИИ разбирает, текст под ним не правится: иначе разобран был бы один
   текст, а на экране остался бы другой. */
function aiBusy(host, btn){
  if(host) host.classList.add('aibusy');
  if(btn){ btn.classList.add('busy'); const l = btn.querySelector('span'); if(l) l.textContent = 'Разбираю…' }
  const ta = host && host.querySelector('.tbx'); if(ta) ta.readOnly = true;
  const ed = host && host.querySelector('[data-edit]'); if(ed){ ed.contentEditable = 'false'; ed.blur() }
}
/* Кнопка AI в углу блока текстом. */
async function aiBlock(id){
  const d = day(), tb = d.blocks.find(b => b.id === id);
  if(!tb || !isTextBlock(tb)) return;
  const text = tb.text || '';
  if(!text.trim()){ toast('Сначала напишите текст — ИИ разберёт его на упражнения'); focusText(id); return }
  if(PENDING) acceptPending(true);                    /* прежнее предложение считается принятым */
  const host = $(`#doc [data-blk="${id}"]`);
  aiBusy(host, host && host.querySelector('[data-aiblk]'));
  await aiWait(900);
  const k = d.blocks.indexOf(tb); if(k < 0) return;  /* блок удалили, пока ИИ думал */
  const parsed = await aiRefine(textToBlocks(text), text);
  if(!parsed.some(b => b.items.some(i => i.exId))){
    render();
    toast('ИИ не нашёл в тексте упражнений из базы — блок остался текстом');
    return;
  }
  const made = parsed.map(b => blockOf(b.title, b.items));
  /* Название, тип и заметка, которые тренер задал блоку текстом, переходят
     к первому собранному блоку, если своих в тексте не нашлось. */
  const f = made[0];
  if(tb.title && !f.title) f.title = tb.title;
  if(tb.kind && !f.kind){ f.kind = tb.kind; if(tb.fmt && !f.fmt) f.fmt = {...tb.fmt} }
  if(tb.note) f.note = tb.note;
  d.blocks.splice(k, 1, ...made);
  PENDING = {date: d.date, ids: new Set(made.map(b => b.id)), block: tb, source: text};
  render();
}
/* Кнопка AI в строке текстом: строка меняется на месте, возврат — в уведомлении. */
async function aiLine(id){
  const was = findItem(id); if(!was.i || was.i.exId) return;
  /* Нажали, не выйдя из строки: берём то, что в ней сейчас написано. */
  const ed = fieldIn(lineEl(id), 'e'); if(ed && ed.textContent.trim()) was.i.raw = ed.textContent.trim();
  const text = String(was.i.raw || '').trim(); if(!text) return;
  const btn = $(`#doc [data-ailine="${id}"]`);
  aiBusy(btn && btn.closest('.line'), btn);
  await aiWait(600);
  /* Пока ИИ думал, строку могли удалить или перетащить в другой блок. */
  const {b, i} = findItem(id); if(!i || i.exId) return;
  const snap = b.items.map(snapItem);
  const undo = () => { b.items = snap; render(); flash(id) };
  /* «3 круга: гребля 500 м, планка 60 сек» — суперсет одной строкой. Внутри
     суперсета вложенный не собираем. */
  const ss = !i.sub && parseSSHead(text);
  if(ss && ss.list.length >= 2){
    const h = ssItem(ss.rounds, ss.rest), mem = ss.list.map(t => { const it = parseLine(t) || rawItem(t); it.sub = true; return it });
    b.items.splice(b.items.indexOf(i), 1, h, ...mem);
    render(); flash(h.id);
    const ok = mem.filter(x => x.exId).length;
    toast('ИИ собрал суперсет · ' + ok + ' из ' + mem.length + ' ' + plural(mem.length, 'упражнения', 'упражнений', 'упражнений') + ' из базы', 'Вернуть текст', undo);
    return;
  }
  const p = parseLine(text);
  /* Список открываем после того, как клик по уведомлению отработает целиком, —
     иначе общий обработчик кликов тут же закроет его как «клик мимо». */
  if(!p){ render(); toast('ИИ не узнал упражнение — строка осталась текстом', 'Выбрать из базы', () => setTimeout(() => pickFor(id))); return }
  /* «Взятие на грудь (1) + толчок (2)» — связка одной строкой (CON-23). */
  if(p.chain){ if(i.sub) p.sub = true; b.items.splice(b.items.indexOf(i), 1, p); render(); flash(p.id);
    toast('ИИ собрал связку · ' + p.parts.length + ' ' + plural(p.parts.length, 'упражнение', 'упражнения', 'упражнений'), 'Вернуть текст', undo); return }
  i.exId = p.exId; i.raw = ''; setPrm(i, p);
  render(); flash(id);
  toast('ИИ разобрал строку: ' + byId(p.exId).ru, 'Вернуть текст', undo);
}
const focusText = id => { const t = $(`#doc [data-blk="${id}"] .tbx`); if(t){ t.focus({preventScroll:true}); t.scrollIntoView({block:'center', behavior:'smooth'}) } };
/* Новый блок текстом встаёт после блока after или в конец дня. В пустом дне
   он заменяет заготовку ручного ввода — она нужна, только чтобы было куда печатать. */
function addTextBlock(text, after){
  const d = day(), tb = textBlock(text || '');
  if(!dayHas(d) && !d.blocks.some(b => b.title || b.note)) d.blocks = [];
  const k = after ? d.blocks.indexOf(after) : -1;
  if(k >= 0) d.blocks.splice(k + 1, 0, tb); else d.blocks.push(tb);
  render();
  return tb;
}

/* ═══════════ БЛОК ТЕКСТОМ: МАРКИРОВАННЫЙ СПИСОК ═══════════
   Простейшее форматирование листа — маркированный список. Пункт — строка с
   маркером и пробелом (LIST_RE в data.js): «• » ставит кнопка, «- » и «* »
   узнаются, как их пишут в заметках. Разметки нет — список хранится текстом,
   и клиент, ИИ, оффлайн видят те же строки.
   Кнопка «Список» и Ctrl/⌘+Shift+8 ставят «• » строкам под курсором или в
   выделении, а если пунктами были все — снимают. Enter в пункте начинает
   следующий с тем же маркером, Enter в пустом пункте заканчивает список,
   Backspace сразу за маркером снимает его. Правки идут через execCommand —
   их откатывает обычный Ctrl/⌘+Z. */
const BUL = '• ';
/* Строки, которых касаются курсор или выделение: [начало, конец) в value. */
function selLines(ta){
  const v = ta.value, s = ta.selectionStart, e = ta.selectionEnd;
  const a = v.lastIndexOf('\n', s - 1) + 1;
  let b = v.indexOf('\n', e > s && v[e - 1] === '\n' ? e - 1 : e); if(b < 0) b = v.length;
  return [a, b];
}
function taReplace(ta, a, b, text){
  ta.focus(); ta.setSelectionRange(a, b);
  if(document.execCommand(text ? 'insertText' : 'delete', false, text)) return;
  ta.setRangeText(text, a, b, 'end');                          /* запасной путь, без отката */
  ta.dispatchEvent(new Event('input', {bubbles:true}));
}
/* Кнопка «Список» горит, когда курсор стоит в пункте. */
function listState(ta){
  const btn = ta && ta.closest('.tbody') && ta.closest('.tbody').querySelector('[data-fmt="ul"]'); if(!btn) return;
  const v = ta.value, a = v.lastIndexOf('\n', ta.selectionStart - 1) + 1;
  btn.classList.toggle('on', LIST_RE.test(v.slice(a)));
}
function toggleList(ta){
  if(!ta || ta.readOnly) return;
  const s = ta.selectionStart, e = ta.selectionEnd, [a, b] = selLines(ta);
  const lines = ta.value.slice(a, b).split('\n'), filled = lines.filter(l => l.trim());
  const off = filled.length ? filled.every(l => LIST_RE.test(l)) : LIST_RE.test(lines[0]);
  /* Пустые строки внутри выделения остаются пустыми — они разделяют блоки. */
  const out = lines.map(l => off ? l.replace(LIST_RE, '')
    : LIST_RE.test(l) || (!l.trim() && lines.length > 1) ? l : BUL + l.trimStart()).join('\n');
  taReplace(ta, a, b, out);
  if(s === e && lines.length === 1){ const p = Math.max(a, s + out.length - lines[0].length); ta.setSelectionRange(p, p) }
  else ta.setSelectionRange(a, a + out.length);
  listState(ta);
}
/* Клавиши внутри листа; true — нажатие обработано. */
function listKey(ta, e){
  if(ta.readOnly || e.isComposing) return false;
  if((e.ctrlKey || e.metaKey) && e.shiftKey && e.code === 'Digit8'){ e.preventDefault(); toggleList(ta); return true }
  if(e.ctrlKey || e.metaKey || e.altKey || e.shiftKey || ta.selectionStart !== ta.selectionEnd) return false;
  const v = ta.value, s = ta.selectionStart, a = v.lastIndexOf('\n', s - 1) + 1, m = v.slice(a).match(LIST_RE);
  if(!m || s < a + m[0].length) return false;
  let b = v.indexOf('\n', a); if(b < 0) b = v.length;
  if(e.key === 'Enter'){
    e.preventDefault();
    if(v.slice(a + m[0].length, b).trim()) taReplace(ta, s, s, '\n' + m[0][0] + ' ');
    else taReplace(ta, a, b, '');                               /* пустой пункт — конец списка */
    listState(ta); return true;
  }
  if(e.key === 'Backspace' && s === a + m[0].length){ e.preventDefault(); taReplace(ta, a, s, ''); listState(ta); return true }
  return false;
}
/* Убрать тренировку — не диалог «вы уверены?», а отмена. Подтверждения
   прокликивают не читая; возврат работает даже когда ошибся всерьёз.
   Снимок — тот же приём, что у разбора текста. */
/* Очистка — единственное здесь необратимое по смыслу действие: тренировка
   исчезает из дня, а не переезжает. Поэтому спрашиваем, но объясняем ЧТО
   именно сотрётся и что останется нетронутым — «вы уверены?» без предмета
   прокликивают не читая. Возврат в тосте оставлен как страховка. */
function askClear(){
  const d = day();
  if(!d.blocks.length) return;
  const dt = new Date(d.date + 'T00:00:00');
  const n = dayCount(d);
  const ov = document.createElement('div');
  ov.className = 'ov on';
  ov.innerHTML = `<div class="md ask">
    <div class="mdh"><span class="dot"></span><h2>Очистить день</h2>
      <button class="cls">✕</button></div>
    <div class="mdb">
      <p class="lead">Тренировка <b>«${esc(d.title || 'без названия')}»</b> будет стёрта
        из ${DOW_GEN[dowMon(day().date)]}, ${dt.getDate()} ${MON[dt.getMonth()]}.</p>
      <p class="sub">${d.blocks.length} ${plural(d.blocks.length,'блок','блока','блоков')} ·
        ${n} ${plural(n,'упражнение','упражнения','упражнений')} — всё вместе с заметками.</p>
      <div class="foot-note">Программа и остальные дни не изменятся. Если тренировка пригодится дальше — закройте окно и сохраните её в базу иконкой закладки в шапке тренировки или оставьте черновиком.</div>
    </div>
    <div class="mdf"><span class="sp"></span>
      <button class="btn gh cls">Отмена</button>
      <button class="btn rm" id="ask-ok">Очистить</button></div>
  </div>`;
  ov.addEventListener('click', e=>{
    if(e.target === ov || e.target.closest('.cls')){ ov.remove(); return }
    if(e.target.closest('#ask-ok')){ ov.remove(); clearDay() }
  });
  document.body.appendChild(ov);
}
function clearDay(){
  const d = day();
  if(!d.blocks.length) return;
  const snap = {title: d.title, blocks: d.blocks};
  d.title = ''; d.blocks = [];
  PENDING = null;
  render();
  toast('День очищен', 'Вернуть', ()=>{
    const cur = day();
    cur.title = snap.title; cur.blocks = snap.blocks;
    render();
  });
}

function acceptPending(silent){
  if(!PENDING) return;
  const n = PENDING.ids.size;
  PENDING = null;
  if(silent) return;
  render();
  toast('Принято · ' + n + ' ' + plural(n,'блок','блока','блоков'));
}
/* «Вернуть текст» — блок текстом встаёт на место собранных как был: скорее
   всего тренер хочет поправить текст или оставить его текстом. */
function cancelPending(){
  if(!PENDING) return;
  const d = day(), at = d.blocks.findIndex(b => PENDING.ids.has(b.id)), tb = PENDING.block;
  d.blocks = d.blocks.filter(b => !PENDING.ids.has(b.id));
  d.blocks.splice(at < 0 ? d.blocks.length : at, 0, tb);
  PENDING = null;
  render(); flash(tb.id);
}
function showSource(){
  if(!PENDING) return;
  const box = document.createElement('div');
  box.className = 'ov on srcov';
  box.innerHTML = `<div class="md"><div class="mdh"><span class="dot"></span>
      <h2>Исходный текст</h2><button class="cls">✕</button></div>
    <div class="mdb"><pre class="src">${esc(PENDING.source)}</pre></div></div>`;
  box.addEventListener('click', e=>{
    if(e.target === box || e.target.closest('.cls')) box.remove();
  });
  document.body.appendChild(box);
}
/* Сводка по предложению: сколько узнано в базе и сколько осталось текстом. */
function pendingStat(){
  const bs = day().blocks.filter(b=>PENDING.ids.has(b.id));
  const items = bs.flatMap(b=>b.items).filter(i=>!i.ss);
  const raw = items.filter(i=>!i.exId).length, ok = items.length - raw;
  return bs.length + ' ' + plural(bs.length,'блок','блока','блоков') + ' · ' +
    ok + ' ' + plural(ok,'упражнение','упражнения','упражнений') + ' из базы' +
    (raw ? ' · ' + raw + ' ' + plural(raw,'строка осталась','строки остались','строк остались') + ' текстом' : '');
}

let SUG = null;
const closeSug = () => { if(SUG){ SUG.remove(); SUG = null } };
/* Кандидаты — упражнения, где каждое набранное слово начинает какое-то слово
   названия: «жим ган» → «Жим гантелей лёжа», но не «Жим лёжа». */
function exCands(text){
  const toks = norm(exNameOf(text) || text).split(' ').filter(t => t && !/^\d/.test(t));
  if(!toks.length) return [];
  const out = [];
  for(const {e, c} of CAND){
    let best = 0;
    for(const cand of c){ const ws = cand.split(' ');
      if(toks.every(t => ws.some(w => w.startsWith(t)))){ const sc = 100 - ws.length * 3 + (ws[0].startsWith(toks[0]) ? 20 : 0); if(sc > best) best = sc } }
    if(best) out.push([best, e]);
  }
  return out.sort((a, b) => b[0] - a[0]).map(x => x[1]);
}
/* Подсказки из базы — выбор, а не разбор (CON-5). Заранее не подсвечено
   ничего: Enter, которым просто заканчивают строку, оставляет её как
   написано. Упражнение берут явно — Tab (первое), стрелками или кликом.
   Раньше Enter брал подсвеченный «разобранный» вариант, и похожее
   упражнение молча подменяло то, что тренер написал. */
function showSug(el, text, pre){
  closeSug();
  const t = (text||'').trim(); if(!t) return;
  const cands = exCands(t).slice(0, 5), name = exNameOf(t);
  if(!cands.length && !name) return;
  const box = document.createElement('div');
  box.className = 'sug exsug';
  /* Под строкой может стоять подсказка клавиш — список открываем под ней. */
  const line = el.closest('.line'), hint = line && line.nextElementSibling && line.nextElementSibling.id === 'keyhint' ? line.nextElementSibling : null;
  const r = el.getBoundingClientRect(), rb = (hint || el).getBoundingClientRect();
  box.style.left = r.left + 'px';
  box.style.top  = (rb.bottom + window.scrollY + 4) + 'px';
  box.innerHTML =
    (cands.length ? '<div class="cap">Из базы</div>' + cands.map(e=>
      `<button class="row" data-pick="${e.id}"><b>${esc(e.ru)}</b><s>${esc(e.g)}</s></button>`).join('') : '') +
    /* Нужного нет — завести упражнение в своей базе. Строка без выбора
       остаётся текстом: её можно разобрать кнопкой AI или оставить как есть. */
    (name ? `<div class="cap">${cands.length ? 'Нет нужного?' : 'В базе такого нет'}</div>
         <button class="row newex" data-newex><b>${ICON.plus} Добавить «${esc(name)}» в базу</b><s>будет подсказываться при наборе</s></button>` : '') +
    `<div class="sugkeys">${cands.length ? `<span>${KB('Tab')}первое из базы</span>` : ''}<span>${KB('↑')}${KB('↓')}выбрать</span><span>${KB('Enter')}<i class="sk-ent"></i></span><span>${KB('Esc')}закрыть</span></div>`;
  document.body.appendChild(box);
  SUG = box;
  box.addEventListener('mousedown', ev => ev.preventDefault());      /* курсор остаётся в строке */
  box.dataset.forItem = el.dataset.edit || el.dataset.pickfor || '';
  box.dataset.text = text;
  /* «Выбрать упражнение» у строки текстом — явная просьба выбрать: там первое
     из базы подсвечено сразу, и Enter его берёт. */
  sugMark(pre && cands.length ? 0 : -1);
}
/* Подсветка строки подсказки с клавиатуры; -1 — ничего не выбрано: Enter
   оставит набранное текстом, Tab возьмёт первое упражнение из базы. Метка
   клавиши стоит на той строке, которую она возьмёт. Наведение мышью
   выбор не трогает — иначе Enter брал бы строку, над которой просто
   оказался курсор. */
function sugMark(k){
  if(!SUG) return;
  const rows = [...SUG.querySelectorAll('.row')];
  rows.forEach((r, j) => r.classList.toggle('on', j === k));
  SUG.querySelectorAll('.rk').forEach(x => x.remove());
  const tgt = k >= 0 ? rows[k] : SUG.querySelector('[data-pick]');
  if(tgt) tgt.insertAdjacentHTML('beforeend', `<kbd class="rk">${k >= 0 ? 'Enter' : 'Tab'}</kbd>`);
  const ent = SUG.querySelector('.sk-ent'); if(ent) ent.textContent = k >= 0 ? 'выбрать' : 'оставить текстом';
  if(k >= 0) rows[k].scrollIntoView({block:'nearest'});
}
/* Название из набранной строки — всё до первой цифры, схемы или процента:
   «подъём гантелей 3×5» → «Подъём гантелей». */
const exNameOf = t => { const m = String(t||'').trim().match(/^(.*?)(?=\s+[\d@(]|\s*$)/); const n = (m ? m[1] : '').replace(/[\s,;:—–-]+$/, '').trim();
  return n ? n[0].toUpperCase() + n.slice(1) : '' };
/* Новое упражнение в своей базе прямо из строки тренировки. Строка сразу
   становится этим упражнением: схема и нагрузка разбираются из того же текста. */
function openNewEx(id, text){
  const name = exNameOf(text);
  const UN = ['повт','кг','м','сек','кал'], guess = new Set();
  if(/кг/i.test(text)) guess.add('кг');
  if(/\d\s*(м|метр)(?![а-я])/i.test(text)) guess.add('м');
  if(/сек|мин|\d:\d\d/i.test(text)) guess.add('сек');
  if(/кал/i.test(text)) guess.add('кал');
  if(!guess.size || /\d\s*[x×х]\s*\d/i.test(text)) guess.add('повт');
  const ov = document.createElement('div'); ov.className = 'ov on';
  ov.innerHTML = `<div class="md ask nexmd">
    <div class="mdh"><span class="dot"></span><h2>Новое упражнение в базе</h2><button class="cls">✕</button></div>
    <div class="mdb">
      <label class="nx-f"><span>Название</span><input id="nx-ru" value="${esc(name)}" autocomplete="off"></label>
      <div class="nx-2">
        <label class="nx-f"><span>Группа</span><select id="nx-g"><option value="">не указана</option>${GROUPS.filter(g=>g!=='Все').map(g=>`<option>${esc(g)}</option>`).join('')}</select></label>
        <label class="nx-f"><span>Оснащение</span><select id="nx-eq">${EQUIP.map(x=>`<option ${x==='—'?'selected':''}>${esc(x)}</option>`).join('')}</select></label>
      </div>
      <div class="nx-f"><span>Чем задаётся нагрузка</span><div class="nx-u">${UN.map(u=>`<button class="${guess.has(u)?'on':''}" data-nxu="${u}">${u}</button>`).join('')}</div></div>
      <p class="nx-note">Упражнение появится в вашей базе и будет подсказываться при наборе.${text.trim() ? ` Строка «${esc(text.trim())}» станет этим упражнением.` : ''}</p>
    </div>
    <div class="mdf"><span class="sp"></span><button class="btn gh" data-nx-keep>Оставить текстом</button><button class="btn" data-nx-ok>${ICON.plus} Добавить в базу</button></div>
  </div>`;
  document.body.appendChild(ov);
  const inp = ov.querySelector('#nx-ru'); inp.focus(); inp.select();
  const keep = () => { ov.remove(); if(!text.trim()) return; const {i: h} = findItem(id); if(h && h.chain) chainAdd(id, null, text); else keepText(id, text) };
  const save = () => {
    const ru = inp.value.trim(); if(!ru){ inp.focus(); toast('Укажите название упражнения'); return }
    const ex = EX.find(x => norm(x.ru) === norm(ru)) || addOwnEx({ru, g: ov.querySelector('#nx-g').value, eq: ov.querySelector('#nx-eq').value,
      u: [...ov.querySelectorAll('[data-nxu].on')].map(b => b.dataset.nxu)});
    ov.remove();
    const {i} = findItem(id);
    /* Из поля связки новое упражнение сразу встаёт в связку. */
    if(i && i.chain){ chainAdd(id, ex.id, ex.ru + text.trim().slice(exNameOf(text).length)); renderSrc(); toast('«' + ex.ru + '» — в вашей базе упражнений'); return }
    if(i){
      /* Имя в строке заменяем на сохранённое — тогда разбор узнаёт упражнение
         наверняка, даже если название в окне поправили. */
      const tail = text.trim().slice(exNameOf(text).length);
      const p = parseLine(ex.ru + tail);
      i.exId = ex.id; i.raw = '';
      setPrm(i, p && p.exId === ex.id ? p : {unit: ex.u[0] || '', txt: tail.trim()});
    }
    render(); renderSrc(); focusLineField(id, 'sch');
    toast('«' + ex.ru + '» — в вашей базе упражнений');
  };
  ov.addEventListener('click', e => {
    const u = e.target.closest('[data-nxu]'); if(u){ u.classList.toggle('on'); return }
    if(e.target.closest('[data-nx-ok]')){ save(); return }
    if(e.target === ov || e.target.closest('.cls') || e.target.closest('[data-nx-keep]')) keep();
  });
  ov.addEventListener('keydown', e => {
    if(e.key === 'Enter' && e.target.id === 'nx-ru'){ e.preventDefault(); save() }
    if(e.key === 'Escape'){ e.preventDefault(); e.stopPropagation(); keep() }
  });
}
/* Упражнение внутри связки находится по своему id: {b, i: часть, chain: связка}.
   Части ищут только поля схемы и нагрузки — строки ищутся по своим id. */
const findItem = id => {
  for(const b of day().blocks) for(const i of b.items){
    if(i.id === id) return {b, i};
    if(i.chain){ const p = (i.parts || []).find(x => x.id === id); if(p) return {b, i: p, chain: i} }
  }
  return {};
};
/* Схема и нагрузка из разбора — в строку или в упражнение связки, с диапазоном. */
function setPrm(i, p){
  Object.assign(i, {scheme: p.scheme || '', pct: p.pct ?? null, unit: p.unit || '', val: p.val || '', txt: p.txt || ''});
  if(p.pct2 != null) i.pct2 = p.pct2; else delete i.pct2;
  if(p.val2) i.val2 = p.val2; else delete i.val2;
}
/* Всё, что набрано и не выбрано из базы, сохраняется как написано (CON-5).
   Строку программа не разбирает — это делает кнопка AI, когда попросят.
   Если руками переписали название упражнения из базы, строка уходит в текст
   целиком, вместе со схемой и нагрузкой: связь с базой не подменяется похожим
   упражнением, а набранное не теряется. Это единственный неочевидный переход,
   поэтому о нём — уведомление с возвратом. */
const paramsText = it => it.txt || [it.scheme, it.pct != null || it.val ? ldVal(it) + (it.pct != null ? '%' : it.unit ? ' ' + it.unit : '') : ''].filter(Boolean).join(' ');
const sameText = (i, text) => norm(String(text || '')) === norm(i.exId ? (byId(i.exId) || {}).ru || '' : i.raw || '');
function keepText(id, text){
  const {i} = findItem(id); if(!i) return;
  const t = String(text || '').trim();
  if(sameText(i, t)) return;
  if(i.exId){
    const was = {...i};
    Object.assign(i, {exId:null, raw:[t, paramsText(i)].filter(Boolean).join(' '), scheme:'', pct:null, unit:'', val:'', txt:''});
    toast('Название не из базы — строка сохранена текстом', 'Вернуть', () => { Object.assign(i, was); render() });
  } else i.raw = t;
  render();
}

/* ═══════════ ПАРАМЕТРЫ УПРАЖНЕНИЯ В СТРОКЕ (CON-16) ═══════════
   Отдельной панели настройки больше нет: схема и нагрузка — поля прямо в
   строке, и весь ввод идёт с клавиатуры. Tab — по полям строки, Enter —
   следующее упражнение, ↑↓ — то же поле строкой выше или ниже, Esc — готово.
   «Нагрузка» — число в текущей единице; единицу меняет символ после числа
   (80% · 100к · 500м · 60с · 20кал). Процент считается от 1ПМ клиента: если
   его нет, в строке появляется поле «1ПМ клиента». */
const VOL_UNITS = ['м','сек','мин','кал'];
const UNITSEL = {};              /* единица строки, выбранная до ввода числа (на сессию) */
function loadInfo(it){
  /* У связки вес — от выбранного (или самого слабого) упражнения, объём — любой из единиц её упражнений. */
  const ex = it.chain ? null : byId(it.exId), key = it.chain ? pctKey(it, PM()) : pmKey(ex), weighted = !!key;
  const exU = it.chain ? (it.parts || []).flatMap(p => (byId(p.exId) || {}).u || []) : (ex && ex.u) || [];
  const units = [...new Set([...(weighted ? ['%','кг'] : []), ...exU.filter(u => VOL_UNITS.includes(u))])];
  if(it.unit && it.val && !units.includes(it.unit)) units.push(it.unit);
  /* У группы по умолчанию проценты: вес у каждого участника свой, от его 1ПМ. */
  const def = weighted ? (PM()[key] || G_() ? '%' : 'кг') : (units[0] || '');
  const textVal = it.val && !it.unit && !/^\d+(\.\d+)?$/.test(it.val);
  const cur = it.pct != null ? '%' : textVal ? '' : (it.val && it.unit) ? it.unit : (units.includes(UNITSEL[it.id]) ? UNITSEL[it.id] : def);
  return {key, weighted, units, cur, has: units.length > 0};
}
/* «Схема» понимает и нагрузку, набранную вместе со схемой («5x3 80%»); всё,
   что в схему и нагрузку не раскладывается, остаётся текстом —
   «60×5, 70×5, 80×3×3». */
function parseParamsText(v){
  const src = String(v || '').trim();
  if(!src) return {scheme:'', pct:null, unit:'', val:''};
  let rest = ' ' + src.replace(/\*/g, '×') + ' ', pct = null, pct2 = null, unit = '', val = '', val2 = '';
  const mp = rest.match(RE_PCT);
  if(mp){ pct = parseFloat(mp[1].replace(',', '.')); if(mp[2]) pct2 = parseFloat(mp[2].replace(',', '.')); rest = rest.replace(mp[0], ' ') }
  const mm = rest.match(/(\d+(?:[.,]\d+)?)(?:\s*[-–—]\s*(\d+(?:[.,]\d+)?))?\s*мин[а-яё]*\.?/i);
  if(mm){ unit = 'мин'; val = mm[1].replace(',', '.'); val2 = (mm[2] || '').replace(',', '.'); rest = rest.replace(mm[0], ' ') }
  else for(const [u, re] of UNITS){ const m = rest.match(re); if(m){ unit = u; val = m[1].replace(',', '.'); val2 = (m[2] || '').replace(',', '.'); rest = rest.replace(m[0], ' '); break } }
  let scheme = '';
  const ms = rest.match(RE_SCHEME) || rest.match(RE_SETS);
  if(ms){ scheme = ms[0].replace(/\s/g, '').replace(/[xхХ]/g, '×'); rest = rest.replace(ms[0], ' ') }
  else { const lead = rest.match(/^\s*(\d+)\s*$/) || rest.match(/^\s*(\d+)\s+(?=\S)/); if(lead){ scheme = lead[1]; rest = rest.replace(lead[0], ' ') } }
  if(unit === 'повт' && !scheme){ scheme = val2 ? val + '-' + val2 : val; unit = ''; val = ''; val2 = '' }
  rest = rest.replace(/(^|\s)(по|на|с|@|x|×)(?=\s|$)/gi, ' ');
  if(/[^\s,;·]/.test(rest)) return {txt: src};
  return {scheme, pct, unit, val, ...(pct2 != null ? {pct2} : {}), ...(val2 ? {val2} : {})};
}
function applyScheme(i, v){
  const r = parseParamsText(v);
  if(r.txt != null){ Object.assign(i, {txt:r.txt, scheme:'', pct:null, unit:'', val:''}); delete i.pct2; delete i.val2; return }
  i.txt = ''; i.scheme = r.scheme;
  if(r.pct != null){ setPrm(i, {...r, txt:''}); i.unit = ''; UNITSEL[i.id] = '%' }
  else if(r.val){ setPrm(i, {...r, txt:''}); UNITSEL[i.id] = r.unit }
}
/* Порядок важен: «ка» — калории, а одиночное «к» — килограммы; «ми» — минуты, «м» — метры. */
const LOAD_SUFFIX = [[/^(%|проц)/i,'%'], [/^(кал|ка|cal)/i,'кал'], [/^(кг|kg|к|k)\.?$/i,'кг'], [/^(мин|ми|min)/i,'мин'],
                     [/^(м|m|метр)/i,'м'], [/^(сек|с|sec|s)/i,'сек'], [/^(повт|раз|rep)/i,'повт']];
/* Диапазон (CON-24): «70-80», «70–80%», «60..70 кг»; хвост «70–», пока верхнюю
   границу ещё набирают, — просто число. Границы наоборот переставляются. */
function parseLoad(raw){
  const s = String(raw || '').trim().replace(/\s*(?:[-–—]|\.\.)\s*$/, '');
  if(!s) return {empty:true};
  const mt = s.match(/^(\d+):(\d{2})$/); if(mt) return {num: +mt[1] * 60 + +mt[2], unit:'сек'};
  const mr = s.replace(/,/g, '.').match(/^(\d+(?:\.\d+)?)\s*(?:[-–—]|\.\.)\s*(\d+(?:\.\d+)?)\s*(.*)$/);
  if(mr){ const a = +mr[1], b = +mr[2], suf = mr[3].trim(), hit = suf ? LOAD_SUFFIX.find(([re]) => re.test(suf)) : null;
    if(suf && !hit) return {text:s};
    return a === b ? {num:a, unit: hit ? hit[1] : null} : {num: Math.min(a, b), num2: Math.max(a, b), unit: hit ? hit[1] : null} }
  const m = s.replace(',', '.').match(/^(\d+(?:\.\d+)?)\s*(.*)$/);
  if(!m) return {text:s};
  const suf = m[2].trim();
  if(!suf) return {num: +m[1], unit:null};
  const hit = LOAD_SUFFIX.find(([re]) => re.test(suf));
  return hit ? {num: +m[1], unit: hit[1]} : {text:s};
}
function applyLoad(i, raw, force){
  const r = parseLoad(raw);
  delete i.pct2; delete i.val2;
  if(r.empty){ i.pct = null; i.val = ''; i.unit = ''; return }
  if(r.text != null){ i.pct = null; i.val = r.text; i.unit = ''; return }
  const u = r.unit || force || loadInfo(i).cur;
  if(r.unit) UNITSEL[i.id] = r.unit;
  if(u === '%'){ i.pct = r.num; i.unit = ''; i.val = ''; if(r.num2 != null) i.pct2 = r.num2 }
  else { i.pct = null; i.unit = u; i.val = String(r.num); if(r.num2 != null) i.val2 = String(r.num2) }
}
const autoWidth = f => { const sch = f.dataset.pf === 'sch';
  f.style.width = `calc(${Math.max(f.value.length, (f.placeholder || '').length, sch ? 4 : 3)}ch + ${sch ? 20 : 4}px)` };
/* Вес, единица, поле 1ПМ и «текстовый» режим — на месте, без перерисовки:
   перерисовка сбила бы курсор. Поле 1ПМ, в котором сейчас печатают, не прячем. */
function syncLoads(){
  $$('#doc .line[data-item]').forEach(l => {
    const {i} = findItem(l.dataset.item); if(!i || !(i.exId || i.chain)) return;
    const L = loadInfo(i), kg = kgText(i, PM());
    l.classList.toggle('txtmode', !!i.txt);
    const k = l.querySelector('.kg'); if(k) k.textContent = kg != null ? '→ ' + kg + ' кг' : G_() && i.pct != null ? 'от 1ПМ каждого' : '';
    const rg = l.querySelector('[data-rng]'); if(rg) rg.classList.toggle('on', hasRange(i));
    /* У связки — параметры текстом, которые видны вне правки, и выбор «от 1ПМ». */
    if(i.chain){ const pr = l.querySelector('.cprm'); if(pr){ const t = chainSumm(i); let pt = pr.querySelector('.cpt');
        if(!t){ if(pt) pt.remove() } else { if(!pt){ pr.insertAdjacentHTML('afterbegin', '<span class="cpt"></span>'); pt = pr.querySelector('.cpt') } pt.textContent = t } }
      const cf = l.querySelector('.cof'); if(cf){ cf.classList.toggle('off', L.cur !== '%'); const sel = cf.querySelector('select'); if(sel) sel.options[0].textContent = cofOpts(i).match(/^<option value="">(.*?)<\/option>/)[1].replace(/&amp;/g, '&') } }
    const u = l.querySelector('[data-pfu]'); if(u){ u.textContent = L.cur; u.parentElement.classList.toggle('empty', !u.parentElement.querySelector('input').value.trim()) }
    const pm = l.querySelector('.pmf');
    if(pm && document.activeElement !== pm.querySelector('input')) pm.classList.toggle('off', !(L.weighted && L.cur === '%' && !PM()[L.key] && !G_()));
  });
}
/* Поле покинули — привести запись к виду: «5x3» → 5×3, суффикс единицы уходит в подпись. */
function normField(pf){
  const {i} = findItem(pf.dataset.for); if(!i) return;
  const kind = pf.dataset.pf, host = pf.closest('.cp') || pf.closest('.line');
  /* У упражнения связки — только повторы, у самой связки — число подходов. */
  if(kind === 'sch' && host && host.classList.contains('cp')){ i.scheme = pf.value.trim().replace(/\s+/g, '').replace(/[xхХ*]/g, '×'); i.txt = ''; pf.value = i.scheme; autoWidth(pf); syncLoads(); return }
  if(kind === 'sets'){ i.sets = (pf.value.match(/\d+/) || [''])[0].replace(/^0+/, ''); pf.value = i.sets }
  if(kind === 'sch'){
    applyScheme(i, pf.value);
    pf.value = i.txt || i.scheme || '';
    const ld = host && host.querySelector('[data-pf="ld"]');
    if(ld){ ld.value = ldVal(i); autoWidth(ld) }
  }
  if(kind === 'ld'){ applyLoad(i, pf.value); pf.value = ldVal(i) }
  if(kind === 'pm'){ const v = PM()[loadInfo(i).key]; pf.value = v ? fmtN(v) : '' }
  autoWidth(pf); syncLoads();
}
/* Статус дня и кнопки публикации — без перерисовки документа. */
/* Кто видит тренировку: клиент или участники группы. */
const aud = dat => G_() ? (dat ? 'группе' : 'участники') : (dat ? 'клиенту' : 'клиент');
/* Статус у названия дня — тот же переключатель, что внизу (CON-20): нажатие
   сразу меняет статус и сохраняет правки дня. */
const docStatusHTML = (d, n) => n || contentHas(d.saved) ? (isDraft(d)
  ? `<button class="dst draft" data-status="pub" title="Черновик — ${aud()} не ${seeVerb()}. Нажмите, чтобы опубликовать">${DAYICON.draft}Черновик</button>`
  : `<button class="dst pub" data-status="draft" title="Опубликована — ${aud()} ${seeVerb()}. Нажмите, чтобы перевести в черновик">${DAYICON.pub}Опубликована</button>`) : '';
const SAVE_KEY = /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent) ? '⌘S' : 'Ctrl+S';
/* Панель сохранения прилипает к низу экрана; в ней только переключатель
   «Опубликовать» и «Сохранить», оба справа. Что не сохранено, видно по
   активной кнопке и точкам в полосе дней. Пустой день опубликовать нечего. */
function pubbarHTML(d, n){
  const nd = dirtyIdx().length, can = n > 0 || contentHas(d.saved), on = !isDraft(d);
  const tip = !can ? 'Пустой день опубликовать нечего'
    : on ? 'Опубликована — ' + aud() + ' ' + seeVerb() + ' сохранённую версию. Выключите, чтобы скрыть'
    : 'Черновик — ' + aud() + ' не ' + seeVerb() + '. Включите, чтобы опубликовать';
  return `<div class="pubbar">
    <button class="pubsw${on ? ' on' : ''}" role="switch" aria-checked="${on}" data-status="${on ? 'draft' : 'pub'}" ${can ? '' : 'disabled'} title="${tip}">Опубликовать<i></i></button>
    <button class="btn" id="saveAll" ${nd ? '' : 'disabled'} title="${nd > 1 ? 'Не сохранено: ' + nd + ' ' + plural(nd, 'день', 'дня', 'дней') : 'Сохранить изменения'} · ${SAVE_KEY}">${ICON.chk} Сохранить</button>
  </div>`;
}
/* Статус и панель — на месте, без перерисовки документа: она сбила бы курсор. */
function refreshChrome(){
  const d = day(); if(!d) return;
  const n = dayCount(d), html = docStatusHTML(d, n);
  const old = $('#doc .doch .dst');
  if(old) old.outerHTML = html; else if(html){ const gr = $('#doc .doch > .gr'); if(gr) gr.insertAdjacentHTML('afterend', html) }
  const pb = $('#doc .pubbar'); if(pb) pb.outerHTML = pubbarHTML(d, n);
}
const commitSoft = () => { persist(); renderStrip(); refreshChrome(); syncLoads(); refreshGrp() };

/* ─── фокус и переходы по строкам ─── */
const lineEl = id => $(`#doc .line[data-item="${id}"]`);
const lineEls = () => $$('#doc .line[data-item]:not(.ssh)');
const fieldIn = (line, kind) => !line ? null : kind === 'e' ? line.querySelector('[data-edit]') : line.querySelector(`[data-pf="${kind}"]`);
const shown = el => !!el && el.getClientRects().length > 0;
const lineFields = line => $$('[data-edit], [data-pf]', line).filter(shown);
const caretEnd = el => { const r = document.createRange(); r.selectNodeContents(el); r.collapse(false); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r) };
function focusField(el){
  if(!el) return false;
  el.focus({preventScroll:true});
  if(el.isContentEditable) caretEnd(el); else el.select();
  const r = el.getBoundingClientRect();
  if(r.top < 90 || r.bottom > innerHeight - 90) el.scrollIntoView({block:'center', behavior:'smooth'});
  return true;
}
const focusLineField = (id, kind) => { const f = fieldIn(lineEl(id), kind); return shown(f) && focusField(f) };
function neighborId(line, kind, dir){
  const ls = lineEls(); let k = ls.indexOf(line);
  if(k < 0) return null;
  for(k += dir; k >= 0 && k < ls.length; k += dir) if(shown(fieldIn(ls[k], kind))) return ls[k].dataset.item;
  return null;
}
/* Перерисовка документа не должна выбивать курсор: запоминаем поле и позицию
   и возвращаем их на новую разметку. */
function caretOffset(el){
  const sel = getSelection(); if(!sel.rangeCount || !el.contains(sel.anchorNode)) return null;
  const r = sel.getRangeAt(0), pre = r.cloneRange(); pre.selectNodeContents(el); pre.setEnd(r.endContainer, r.endOffset);
  return pre.toString().length;
}
function setCaret(el, off){
  if(off == null){ caretEnd(el); return }
  const w = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let n, left = off;
  while((n = w.nextNode())){ if(left <= n.length){ const r = document.createRange(); r.setStart(n, left); r.collapse(true); const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r); return } left -= n.length }
  caretEnd(el);
}
function focusSnap(){
  const a = document.activeElement; if(!a || !a.closest) return null;
  const ta = a.closest('#doc .tbx'); if(ta) return {k:'text', id: ta.closest('[data-blk]').dataset.blk, s: ta.selectionStart, e: ta.selectionEnd};
  const ed = a.closest('#doc [data-edit]'); if(ed) return {k:'e', id: ed.dataset.edit, off: caretOffset(ed)};
  const pf = a.closest('#doc [data-pf]'); if(pf) return {k: pf.dataset.pf, id: pf.dataset.for, s: pf.selectionStart, e: pf.selectionEnd};
  return null;
}
function focusRestore(f){
  if(!f) return;
  if(f.k === 'text'){ const ta = $(`#doc [data-blk="${f.id}"] .tbx`); if(ta){ ta.focus({preventScroll:true}); try{ ta.setSelectionRange(f.s, f.e) }catch(_){} } return }
  const el = f.k === 'e' ? fieldIn(lineEl(f.id), 'e') : $(`#doc [data-pf="${f.k}"][data-for="${f.id}"]`); if(!shown(el)) return;
  el.focus({preventScroll:true});
  if(f.k === 'e') setCaret(el, f.off); else { try{ el.setSelectionRange(f.s, f.e) }catch(_){} }
}
/* Поле упражнения внутри связки — по id упражнения. */
const focusPart = (pid, kind) => { const f = $(`#doc [data-pf="${kind}"][data-for="${pid}"]`); return shown(f) && focusField(f) };
/* ─── связка: добавить, закончить ─── */
function chainAdd(id, exId, text, mode){
  const {i: c} = findItem(id); if(!c || !c.chain) return;
  const t = String(text || '').trim();
  if(!exId){ if(!t) return; c.parts.push(rawItem(t)); render(); if(mode !== 'quiet') focusLineField(id, 'e'); return }
  const tail = t.slice(exNameOf(t).length).trim(), r = parseParamsText(tail), p = mkItem(exId);
  setPrm(p, r.txt != null ? {txt: r.txt} : r);
  c.parts.push(p); normChain(c); render();
  /* У упражнения связки почти всегда есть повторы — курсор сразу в схему. */
  focusPart(p.id, 'sch');
}
function chainDone(id, mode){
  const {b, i: c} = findItem(id); if(!c) return;
  if(!c.parts.length){ dropEmptyLine(id); return }
  if(mode === 'enter') newLineAfter(id);
  else { const to = neighborId(lineEl(id), 'e', 1); if(to) focusLineField(to, 'e'); else { closeSug(); document.activeElement.blur() } }
}
/* Новая строка сразу под текущей — в том же блоке и том же суперсете. Если
   под ней уже пустая строка, переходим в неё, а не плодим пустые. */
function newLineAfter(id){
  const {b, i} = findItem(id); if(!b) return;
  const k = b.items.indexOf(i), sub = !!i.sub, nx = b.items[k + 1];
  if(nx && !nx.exId && !nx.raw && !nx.ss && !!nx.sub === sub){ render(); focusLineField(nx.id, 'e'); return }
  const it = rawItem(''); if(sub) it.sub = true;
  b.items.splice(k + 1, 0, it);
  render(); focusLineField(it.id, 'e');
}
function dropEmptyLine(id){
  const {b, i} = findItem(id); if(!b) return;
  b.items = b.items.filter(x => x !== i);
  closeSug(); if(document.activeElement) document.activeElement.blur();
  render();
}
/* Строку закончили без выбора из базы: упражнение из базы (название не
   трогали) — дальше «Схема» или следующая строка; остальное сохраняется
   текстом как написано, и курсор идёт дальше. */
function commitName(id, text, mode){
  closeSug();
  keepText(id, text);
  const {i} = findItem(id); if(!i) return;
  const hasP = !!(i.scheme || i.pct != null || i.val || i.txt);
  if(!i.exId){ if(mode === 'enter') newLineAfter(id); else { const to = neighborId(lineEl(id), 'e', 1); if(to) focusLineField(to, 'e') } return }
  if(mode === 'enter' && hasP) newLineAfter(id); else focusLineField(id, 'sch');
}
function commitIfChanged(id, text){
  const {i} = findItem(id); if(!i) return;
  if(!sameText(i, text)){ closeSug(); keepText(id, text) }
}
/* Выбор из подсказки. Параметры, набранные после названия («жим ган 3x10»),
   переезжают в поля; переименование без параметров старые не трогает. */
function pickExercise(id, exId, text, mode){
  closeSug();
  const {i} = findItem(id); if(!i) return;
  if(i.chain){ chainAdd(id, exId, text, mode); return }
  const cur = parseLine(text);
  let prm;
  if(cur && cur.exId === exId) prm = cur;
  else { const tail = String(text || '').trim().slice(exNameOf(text).length).trim(), r = parseParamsText(tail);
    prm = r.txt != null ? {txt: r.txt} : r }
  /* Переименование без параметров старые схему и нагрузку не трогает. */
  const keep = !prm.scheme && prm.pct == null && !prm.val && !prm.txt && !!i.exId;
  i.exId = exId; i.raw = '';
  if(!keep) setPrm(i, prm);
  render();
  const hasP = !!(i.scheme || i.pct != null || i.val || i.txt);
  if(mode === 'enter' && hasP) newLineAfter(id); else focusLineField(id, 'sch');
}
function activateSugRow(row, mode){
  const id = SUG.dataset.forItem, text = SUG.dataset.text || '';
  if(row.dataset.pick){ pickExercise(id, row.dataset.pick, text, mode); return }
  closeSug();
  if(row.hasAttribute('data-newex')) openNewEx(id, text);
}
/* «Выбрать упражнение» у строки текстом: курсор в строку и подсказки из базы
   по её тексту, первое подсвечено — выбор тут явная просьба. */
function pickFor(id){
  const {i} = findItem(id); if(!i) return;
  const ed = fieldIn(lineEl(id), 'e'); if(!ed) return;
  focusField(ed);
  showSug(ed, i.raw || '', true);
  if(!SUG) toast('В базе нет похожих упражнений — добавьте своё или оставьте строку текстом');
}
/* Названия блока — одной колонкой по самому длинному: поля стоят близко к
   названию и ровно друг под другом. Замер — на время снимаем ширину. */
function alignNames(){
  const doc = $('#doc'); if(!doc) return;
  doc.classList.add('nm-measure');
  const ws = [...doc.querySelectorAll('.blk')].map(bk => {
    let w = 0;
    bk.querySelectorAll('.line:not(.raw) > .txt').forEach(t => { w = Math.max(w, t.getBoundingClientRect().width + (t.closest('.ssg') ? 9 : 0)) });
    return [bk, w];
  });
  doc.classList.remove('nm-measure');
  ws.forEach(([bk, w]) => bk.style.setProperty('--nmw', Math.ceil(Math.min(Math.max(w, 160), 380)) + 'px'));
}
/* Подсказка клавиш — всегда под строкой, в которой идёт ввод. */
const KB = k => `<kbd>${k}</kbd>`;
const KEYHINT = {
  e:   `<span>${KB('Tab')}из базы</span><span>${KB('↑')}${KB('↓')}подсказка / строка</span><span>${KB('Enter')}следующая строка</span><span>${KB('Esc')}готово</span><span class="r">сохранится как написано</span>`,
  sch: `<span>${KB('Tab')}дальше</span><span>${KB('Shift Tab')}назад</span><span>${KB('Enter')}следующее</span><span>${KB('↑')}${KB('↓')}выше / ниже</span><span>${KB('Esc')}готово</span><span class="r">5x3 · 21-15-9 · 8 — или текстом</span>`,
  ld:  `<span>${KB('Tab')}дальше</span><span>${KB('Shift Tab')}назад</span><span>${KB('Enter')}следующее</span><span>${KB('↑')}${KB('↓')}выше / ниже</span><span>${KB('Esc')}готово</span><span class="r">80% · 70-80% · 100к · 500м · 60с</span>`,
  ch:  `<span>${KB('Tab')}из базы</span><span>${KB('↑')}${KB('↓')}подсказка</span><span>${KB('Enter')}добавить в связку</span><span>${KB('Enter')}в пустом — дальше</span><span class="r">упражнения подряд одной строкой</span>`,
  rep: `<span>${KB('Tab')}дальше</span><span>${KB('Shift Tab')}назад</span><span>${KB('Enter')}следующее упражнение связки</span><span>${KB('Esc')}готово</span><span class="r">повторы этого упражнения в одном подходе связки</span>`,
  sets:`<span>${KB('Tab')}нагрузка</span><span>${KB('Shift Tab')}назад</span><span>${KB('Esc')}готово</span><span class="r">подходы связки: 3 → 3×(1+1+1)</span>`,
  pm:  `<span>${KB('Tab')}дальше</span><span>${KB('Enter')}следующее</span><span>${KB('Esc')}готово</span><span class="r">1ПМ клиента — от него считаются проценты</span>`,
};
document.addEventListener('focusin', e => {
  const f = e.target.closest && e.target.closest('#doc [data-edit], #doc [data-pf]');
  const line = f && f.closest('.line');
  $$('#doc .line.act').forEach(l => { if(l !== line) l.classList.remove('act') });
  let h = $('#keyhint');
  if(!line){ if(h) h.remove(); return }
  if(f.dataset.pf === 'ld'){ const {i} = findItem(f.dataset.for); if(i && !UNITSEL[i.id]) UNITSEL[i.id] = loadInfo(i).cur }
  line.classList.add('act');
  if(!h){ h = document.createElement('div'); h.id = 'keyhint'; h.className = 'keyhint' }
  h.innerHTML = KEYHINT[f.closest('.cp') && f.dataset.pf === 'sch' ? 'rep' : f.dataset.pf || (line.classList.contains('chain') ? 'ch' : 'e')];
  if(line.nextElementSibling !== h) line.after(h);
});
document.addEventListener('focusout', e => {
  if(!(e.target.closest && e.target.closest('#doc [data-edit], #doc [data-pf]'))) return;
  const pf = e.target.closest('[data-pf]');
  if(pf && pf.isConnected){ normField(pf); commitSoft() }
  setTimeout(() => {
    const a = document.activeElement;
    if(a && a.closest && a.closest('#doc [data-edit], #doc [data-pf]')) return;
    const h = $('#keyhint'); if(h) h.remove();
    $$('#doc .line.act').forEach(l => l.classList.remove('act'));
  }, 0);
});
/* Клавиатура в строке упражнения. */
document.addEventListener('keydown', e => {
  if(e.isComposing || e.defaultPrevented || !e.target.closest) return;
  const ed = e.target.closest('#doc [data-edit]'), pf = e.target.closest('#doc [data-pf]');
  if(!ed && !pf) return;
  const line = e.target.closest('.line'), id = line && line.dataset.item; if(!id) return;
  const down = e.key === 'ArrowDown', up = e.key === 'ArrowUp';
  if(ed){
    if(SUG && SUG.dataset.forItem === id){
      const rows = [...SUG.querySelectorAll('.row')]; let k = rows.findIndex(r => r.classList.contains('on'));
      /* Стрелки ходят по подсказкам и возвращаются к набранному тексту (-1). */
      if((down || up) && rows.length){ e.preventDefault(); k += down ? 1 : -1; if(k < -1) k = rows.length - 1; if(k >= rows.length) k = -1; sugMark(k); return }
      if(e.key === 'Escape'){ e.preventDefault(); closeSug(); return }
      if(e.key === 'Enter' && k >= 0){ e.preventDefault(); activateSugRow(rows[k], 'enter'); return }
      /* Tab — взять из базы: подсвеченное, а если ничего не подсвечено — первое. */
      if(e.key === 'Tab' && !e.shiftKey){ const r = k >= 0 ? rows[k] : SUG.querySelector('[data-pick]'); if(r){ e.preventDefault(); activateSugRow(r, 'tab'); return } }
    }
    const text = ed.textContent;
    const {i: host} = findItem(id);
    if(host && host.chain){
      if(e.key === 'Enter'){ e.preventDefault(); closeSug(); if(text.trim()) chainAdd(id, null, text); else chainDone(id, 'enter'); return }
      if(e.key === 'Tab' && !e.shiftKey){ e.preventDefault(); closeSug(); if(text.trim()) chainAdd(id, null, text);
        else { const fs = lineFields(line), nx = fs[fs.indexOf(ed) + 1]; if(nx) focusField(nx); else chainDone(id, 'tab') } return }
      if(e.key === 'Tab' && e.shiftKey){ e.preventDefault(); closeSug(); const fs = lineFields(line), k = fs.indexOf(ed); if(k > 0) focusField(fs[k - 1]); return }
      if(e.key === 'Escape'){ e.preventDefault(); closeSug(); ed.blur(); return }
      if(down || up){ e.preventDefault(); closeSug(); const to = neighborId(line, 'e', down ? 1 : -1); if(to) focusLineField(to, 'e'); return }
      return;
    }
    if(e.key === 'Enter'){ e.preventDefault(); if(!text.trim()){ dropEmptyLine(id); return } commitName(id, text, 'enter'); return }
    if(e.key === 'Tab' && !e.shiftKey){ e.preventDefault(); if(text.trim()) commitName(id, text, 'tab'); return }
    if(e.key === 'Tab' && e.shiftKey){ e.preventDefault(); commitIfChanged(id, text);
      const pl = lineEls()[lineEls().indexOf(lineEl(id)) - 1]; if(pl){ const fs = lineFields(pl); focusField(fs[fs.length - 1]) } return }
    if(e.key === 'Escape'){ e.preventDefault(); closeSug(); ed.blur(); return }
    if(down || up){ e.preventDefault(); const to = neighborId(line, 'e', down ? 1 : -1); commitIfChanged(id, text); if(to) focusLineField(to, 'e'); return }
    return;
  }
  const kind = pf.dataset.pf;
  if(e.key === 'Tab'){
    e.preventDefault(); normField(pf);
    const fs = lineFields(line), next = fs[fs.indexOf(pf) + (e.shiftKey ? -1 : 1)];
    if(next) focusField(next);
    else if(!e.shiftKey){ const to = neighborId(line, 'e', 1); if(to) focusLineField(to, 'e') }
    commitSoft(); return;
  }
  if(e.key === 'Enter'){ e.preventDefault(); normField(pf); if(line.classList.contains('chain')){ commitSoft(); focusLineField(id, 'e'); return } newLineAfter(id); return }
  if(e.key === 'Escape'){ e.preventDefault(); normField(pf); pf.blur(); render(); return }
  if(down || up){ e.preventDefault(); normField(pf); const to = neighborId(line, kind, down ? 1 : -1); if(to) focusLineField(to, kind); commitSoft(); return }
});

/* ═══════════ ТИП БЛОКА ═══════════
   Панель под меткой типа: сверху тип блока, у комплекса ниже — его настройка
   (AMRAP, EMOM, на время…) с параметрами. Меняется на лету, метка в шапке
   блока обновляется без перерисовки документа. */
function openFtype(btn){
  closeSug();
  const b = day().blocks.find(x=>x.id===btn.dataset.ftype); if(!b) return;
  const box = document.createElement('div'); box.className = 'sug setup ftp';
  document.body.appendChild(box); SUG = box;
  const place = () => {
    const r = btn.getBoundingClientRect(), W = document.documentElement.clientWidth, H = innerHeight;
    box.style.left = Math.max(12, Math.min(r.left, W - box.offsetWidth - 12)) + 'px';
    const below = r.bottom + 6 + box.offsetHeight <= H - 8;
    box.style.top = (window.scrollY + (below ? r.bottom + 6 : Math.max(8, r.top - box.offsetHeight - 6))) + 'px';
  };
  const num = (id, ph, step=1, w='') => `<input class="st-n ${w}" id="${id}" type="number" min="0" step="${step}" placeholder="${ph}" value="">`;
  const ms = (id, sec) => `<input class="st-n" id="${id}-m" type="number" min="0" placeholder="0" value="${Math.floor(sec/60)}"><i>мин</i><input class="st-n" id="${id}-s" type="number" min="0" max="59" step="5" placeholder="00" value="${sec%60}"><i>сек</i>`;
  const params = () => {
    const f = b.fmt; if(!f) return '';
    switch(f.k){
      case 'AMRAP':     return `<span class="st-l">Время</span><span class="st-v">${ms('ft-total', f.total)}</span>`;
      case 'EMOM':      return `<span class="st-l">Раундов</span><span class="st-v"><input class="st-n" id="ft-rounds" type="number" min="1" value="${f.rounds}"><s class="st-res">всего ${mmss(f.total)}</s></span>
                                <span class="st-l">Интервал</span><span class="st-v"><span class="st-seg">${[60,90,120,180].map(w=>`<button data-ft-work="${w}" class="${f.work===w?'on':''}">${mmss(w)}</button>`).join('')}</span></span>`;
      case 'FOR TIME':  return `<span class="st-l">Раундов</span><span class="st-v"><input class="st-n" id="ft-rounds" type="number" min="1" value="${f.rounds}"><s class="st-res">1 — один проход (чиппер)</s></span>
                                <span class="st-l">Лимит</span><span class="st-v">${ms('ft-total', f.total)}<s class="st-res">0 — без лимита</s></span>`;
      case 'TABATA':
      case 'ИНТЕРВАЛЫ': return `<span class="st-l">Раундов</span><span class="st-v"><input class="st-n" id="ft-rounds" type="number" min="1" value="${f.rounds}"></span>
                                <span class="st-l">Работа</span><span class="st-v">${ms('ft-work', f.work)}</span>
                                <span class="st-l">Отдых</span><span class="st-v">${ms('ft-rest', f.rest)}</span>`;
      case 'DEATH BY':  return `<span class="st-l">Интервал</span><span class="st-v"><span class="st-seg">${[60,90,120].map(w=>`<button data-ft-work="${w}" class="${f.work===w?'on':''}">${mmss(w)}</button>`).join('')}</span></span>
                                <span class="st-l">Старт</span><span class="st-v"><input class="st-n" id="ft-start" type="number" min="1" value="${f.start||1}"><i>повт</i></span>`;
    }
    return '';
  };
  const draw = () => {
    box.innerHTML = `
      <div class="st-head"><b>Тип блока</b></div>
      <div class="ft-list">${BLOCK_TYPES.map(t=>`<button data-bt-k="${t.k||''}" class="${(b.kind||null)===t.k?'on':''}">${t.n}</button>`).join('')}</div>
      ${b.kind === 'complex' ? `<div class="st-head cx"><b>Настройка комплекса</b><s class="st-desc">${b.fmt ? esc(fmtDesc(b.fmt)) : ''}</s></div>
      <div class="ft-list">${FMT_TYPES.map(t=>`<button data-ft-k="${t.k||''}" class="${(b.fmt?b.fmt.k:null)===t.k?'on':''}">${t.n}</button>`).join('')}</div>
      ${b.fmt && b.fmt.k!=='NFT' ? `<div class="st-grid">${params()}</div>` : ''}` : ''}
      <div class="st-foot"><span class="sp"></span><button class="btn sm" data-st-ok>Готово ↵</button></div>`;
    place();
  };
  const recalc = () => {
    const f = b.fmt; if(!f) return;
    const sec = id => { const m=$('#'+id+'-m'), s=$('#'+id+'-s'); return m && s ? (+m.value||0)*60 + (+s.value||0) : null };
    const r = $('#ft-rounds'); if(r) f.rounds = Math.max(1, +r.value||1);
    const st = $('#ft-start'); if(st) f.start = Math.max(1, +st.value||1);
    if(f.k==='AMRAP'){ const v = sec('ft-total'); if(v!=null){ f.total = v; f.work = v } }
    if(f.k==='FOR TIME'){ const v = sec('ft-total'); if(v!=null) f.total = v }
    if(f.k==='TABATA' || f.k==='ИНТЕРВАЛЫ'){ const w=sec('ft-work'), rs=sec('ft-rest'); if(w!=null) f.work=w; if(rs!=null) f.rest=rs; f.total = f.rounds*(f.work+f.rest) }
    if(f.k==='EMOM') f.total = f.rounds*f.work;
    sync();
  };
  const sync = () => {
    const chip = $(`[data-ftype="${b.id}"]`);
    if(chip){ chip.textContent = b.kind ? blockTypeLabel(b) : 'тип блока'; chip.classList.toggle('on', !!b.kind); chip.title = b.fmt ? fmtDesc(b.fmt) : b.kind ? '' : 'Разминка, силовая, комплекс…' }
    const hs = box.querySelector('.st-desc'); if(hs) hs.textContent = b.fmt ? fmtDesc(b.fmt) : '';
    const rs = box.querySelector('.st-v .st-res'); if(rs && b.fmt && b.fmt.k==='EMOM') rs.textContent = 'всего ' + mmss(b.fmt.total);
  };
  box.addEventListener('input', recalc);
  box.addEventListener('click', e=>{
    e.stopPropagation();
    /* Не комплекс — настройки нет: сбрасываем, а не прячем. */
    const bt = e.target.closest('[data-bt-k]');
    if(bt){ b.kind = bt.dataset.btK || null; if(b.kind !== 'complex') b.fmt = null; draw(); sync(); return }
    const k = e.target.closest('[data-ft-k]');
    if(k){ const t = FMT_TYPES.find(x=>(x.k||'')===k.dataset.ftK); b.fmt = t.k ? {k:t.k, ...t.d} : null; draw(); sync(); return }
    const w = e.target.closest('[data-ft-work]');
    if(w && b.fmt){ b.fmt.work = +w.dataset.ftWork; if(b.fmt.k==='EMOM') b.fmt.total = b.fmt.rounds*b.fmt.work; draw(); sync(); return }
    if(e.target.closest('[data-st-ok]')){ closeSug(); render(); return }
  });
  box.addEventListener('keydown', e=>{ if(e.key==='Enter'){ e.preventDefault(); closeSug(); render() } });
  draw();
}

/* ─── вставка из панели источников ─── */
/* Последний блок со строками. Блок текстом упражнений не принимает — если
   день кончается им, под ним заводится новый блок. */
const structBlock = d => {
  const last = d.blocks[d.blocks.length-1];
  if(last && !isTextBlock(last)) return last;
  const nb = mkBlock(null, last ? '' : 'Новый блок', '', null, []);
  d.blocks.push(nb);
  return nb;
};
const lastBlock = () => structBlock(day());
/* Из панели упражнение падает в последний блок дня. Куда именно — не
   очевидно, поэтому подсвечиваем добавленное и подкручиваем к нему:
   лучше показать результат, чем объяснять его тостом. */
function flash(id){
  const el = $(`[data-item="${id}"]`) || $(`[data-blk="${id}"]`);
  if(!el) return;
  el.classList.add('just');
  el.scrollIntoView({block:'nearest', behavior:'smooth'});
  setTimeout(()=>el.classList.remove('just'), 900);
}
function addEx(exId){
  const it = mkItem(exId, '', null, null, '');
  lastBlock().items.push(it);
  render(); flash(it.id); focusLineField(it.id, 'sch');
}
/* ═══════════ СОХРАНЕНИЕ В ШАБЛОНЫ (TPL-1, TPL-3) ═══════════
   Тренировка живёт внутри программы и привязана к дате. Шаблон — отдельная
   заготовка в библиотеке. Одно из другого не следует: чтобы переиспользовать
   удачный день, его надо явно положить в библиотеку.

   Шаблон тренировки ссылается на шаблоны блоков (так устроен tplToWorkout),
   поэтому сохранение дня кладёт в библиотеку и блоки — заодно они становятся
   доступны поодиночке, чего TPL-1 и хочет. */
const FOLDER_OF = b => TYPE_FOLDER[b.kind] || (fmtPart(b.title) ? 'Комплексы'
  : (b.items||[]).some(i => i.pct != null || i.unit === 'кг') ? 'Силовые блоки'
  : /заминк|растяж|заверш/i.test(b.title) ? 'Заминки' : 'Разминки');

/* Строка в шаблоне массивом [ex, scheme, val, unit, txt, sub]; диапазон —
   строкой «70–80», связка — [CH_TAG, [части], {подходы и нагрузка}]. */
const tplArr = i => i.chain ? [CH_TAG, i.parts.filter(partHas).map(tplArr), serChain(i), '', '', i.sub?1:0]
  : !i.exId ? [TXT_TAG, String(i.raw).trim(), '', '', '', i.sub?1:0]
  : i.pct != null ? [i.exId, i.scheme||'', i.pct2 != null ? i.pct + RNG + i.pct2 : i.pct, '%', i.txt||'', i.sub?1:0]
  : [i.exId, i.scheme||'', i.val2 ? i.val + RNG + i.val2 : i.val||'', i.unit||'', i.txt||'', i.sub?1:0];
function blockToTpl(b, folder){
  const t = {
    id: nid('t'), lvl:'блок', folder: folder || FOLDER_OF(b), used: 0, kind: b.kind || null,
    title: b.title || blockTypeLabel(b) || (isTextBlock(b) ? firstTextLine(b.text) : '') || 'Блок без названия', fmt: b.fmt ? {...b.fmt} : null,
    /* Текст — такое же содержимое, как упражнения: блок текстом ложится в
       базу как написан, строки текстом — строками. Пустые строки не идут;
       суперсет, в котором осталось меньше двух записей, распускается — на
       копиях, не на живом дне. */
    ...(isTextBlock(b) ? {text: b.text} : {}),
    items: normSS({items: b.items.filter(i=>itemHas(i) || i.ss).map(i=>({...i}))}).items.map(i => i.ss ? [SS_TAG, i.rounds, i.rest||''] : tplArr(i)),
  };
  TPL.unshift(t);
  return t.id;
}
function saveBlock(id, folder){
  const b = day().blocks.find(x=>x.id===id);
  if(!blockHas(b)) return toast('В пустом блоке нечего сохранять');
  blockToTpl(b, folder); b.savedSig = blockSig(b);
  toast('Блок «' + (b.title||'без названия') + '» — в папке «' + folder + '»');
  renderSrc();
}
function saveWorkout(){
  const d = day();
  const blocks = d.blocks.filter(blockHas);
  if(!blocks.length) return toast('В этом дне нечего сохранять');
  const ids = blocks.map(b => blockToTpl(b));
  TPL.unshift({id:nid('t'), lvl:'тренировка', used:0,
               title: d.title || 'Тренировка без названия', blocks: ids});
  S.tplSaved[d.date] = serializeDay(d);
  toast('Тренировка и ' + blocks.length + ' ' +
        plural(blocks.length,'блок','блока','блоков') + ' — в базе');
  render();
}
/* Папка блока — требование TPL-1. Предлагаем по содержимому, но выбор
   оставляем тренеру: «Разминка перед приседом» может лежать и там и там. */
function openFolder(btn){
  closeSug();
  const id = btn.dataset.savblk;
  const b = day().blocks.find(x=>x.id===id);
  const guess = FOLDER_OF(b);
  const box = document.createElement('div');
  box.className = 'sug';
  const r = btn.getBoundingClientRect();
  box.style.left = Math.max(12, r.right - 250) + 'px';
  box.style.top  = (r.bottom + window.scrollY + 6) + 'px';
  box.innerHTML = '<div class="cap">Сохранить блок в папку</div>' +
    TPL_FOLDERS.map(f=>`<button class="row ${f===guess?'on':''}" data-folder="${esc(f)}">
      <b>${esc(f)}</b>${f===guess?'<s>подходит</s>':''}</button>`).join('');
  document.body.appendChild(box); SUG = box;
  box.addEventListener('click', ev=>{
    const f = ev.target.closest('[data-folder]'); if(!f) return;
    closeSug(); saveBlock(id, f.dataset.folder);
  });
}
/* Короткое подтверждение: действие незаметное, без него непонятно,
   случилось ли что-нибудь. */
let TOAST = null;
function toast(text, actionLabel, onAction){
  if(TOAST) TOAST.remove();
  TOAST = document.createElement('div');
  TOAST.className = 'toast';
  TOAST.innerHTML = `<span>${esc(text)}</span>` +
    (actionLabel ? `<button class="undo">${esc(actionLabel)}</button>` : '');
  if(onAction) TOAST.querySelector('.undo').addEventListener('click', ()=>{
    onAction(); const t = TOAST; TOAST = null; if(t) t.remove();
  });
  document.body.appendChild(TOAST);
  /* К кадру тост могли уже заменить или убрать — держим ссылку на свой. */
  { const t = TOAST; requestAnimationFrame(()=>{ if(t.isConnected) t.classList.add('on') }) }
  const life = actionLabel ? 6000 : 2600;   /* на отмену нужно успеть подумать */
  setTimeout(()=>{ const t = TOAST; if(!t) return; t.classList.remove('on');
                   setTimeout(()=>t.remove(), 260); TOAST = null }, life);
}

function addTplRaw(t){
  const d = day();
  if(t.lvl === 'блок'){
    d.blocks.push(isTextBlock(t) ? {...textBlock(t.text, t.title), kind: t.kind || null, fmt: fmtCopy(t.fmt)}
                                 : blockOf(t.title, t.items.map(tplLine), '', t.kind, fmtCopy(t.fmt)));
  } else {
    const w = tplToWorkout(t);
    d.title = w.title || d.title; d.blocks = w.blocks;
  }
}
const addTpl = t => {
  addTplRaw(t); render();
  const last = day().blocks[day().blocks.length-1];
  if(last) flash(last.id);
};
/* CON-4 — «копирование предыдущей недели как основа новой»: неделя целиком,
   а не открытый день. Копия глубокая, иначе правки поедут в обе недели. */
const copyBlocks = bs => bs.map(copyBlock);

/* Продлеваем план до индекса включительно, дописывая пустые дни.
   Именно дописываем, а не пересобираем через buildPlan: пересборка создаёт
   новые объекты дней и стирает всё, что тренер уже наредактировал в
   остальных днях и ещё не сохранил. Первая версия делала ровно это и вдобавок
   зависала: длина проверялась у старого массива и не менялась никогда. */
function extendPlan(upto){
  /* Срок программы — не потолок: тренер может назначить тренировку на любой
     день после старта, программа просто удлиняется (CAL-1). */
  const pr = program(S.pid); if(pr && upto >= pr.days) pr.days = upto + 1;
  while(plan().length <= upto){
    const i = plan().length;
    PLAN[S.pid].push(null);
    const x = buildDay(S.pid, i);
    /* Слепок ставим сразу: buildDay его не знает, а день без него считался бы
       изменённым до первого ввода. Новый день — черновик, не опубликован. */
    x.saved = serializeDay(x); x.pub = ''; x.draft = true;
    plan().push(x);
  }
}

/* Продление плана: день добавляется в конец, и это единственный способ
   расти — решётки, которую можно «открыть на неделю вперёд», больше нет. */
function addDay(){
  extendPlan(plan().length);
  S.i = plan().length - 1; render();
  toast('День ' + (S.i+1) + ' добавлен');
}

/* Повтор предыдущей тренировки вместо копии целой недели. Недели нет, и
   копировать «семь дней назад» стало нечем: тренер повторяет нужный день. */
function repeatPrev(){
  const d = plan();
  let j = -1;
  for(let k=S.i-1; k>=0; k--){ if(dayHas(d[k])){ j=k; break } }
  if(j < 0) return toast('Раньше в плане нет ни одной тренировки');
  const src = d[j], cur = d[S.i];
  cur.title  = src.title;
  cur.rest   = false;
  cur.blocks = copyBlocks(src.blocks);
  render();
  const n = dayCount(cur);
  toast('День ' + (j+1) + ' повторён · ' + n + ' ' + plural(n,'упражнение','упражнения','упражнений'));
}

/* ═══════════ НЕДЕЛЯ В ШАБЛОНЫ (TPL-2) ═══════════
   Сохранение недели порождает три уровня сразу: неделя → тренировки →
   блоки. Если складывать всё подряд, библиотека за три недели превращается
   в свалку из тёзок. Поэтому сверяем по СОСТАВУ: что уже есть — на то
   ссылаемся, копий не плодим.

   Новое тренер решает сам одной галочкой. Но неделя в модели ссылается на
   шаблоны тренировок, а те — на блоки, поэтому создать их придётся в любом
   случае. Разница в метке inline: с ней запись обслуживает только свою
   неделю и в панель источников не попадает. */
const sigItems = items => (items||[])
  .filter(i => i.exId || i.ss)
  .map(i => i.ss ? `${SS_TAG}|${i.rounds}|${i.rest||''}` : `${i.exId}|${i.scheme||''}|${i.pct??''}|${i.val||''}|${i.sub?1:''}`).join(';');
/* Элементы шаблона хранятся массивами [ex, scheme, val, unit] — приводим
   к той же форме, иначе одинаковые блоки не совпадут. */
const sigTplItems = items => (items||[])
  .map(i => i[0] === SS_TAG ? `${SS_TAG}|${i[1]}|${i[2]||''}` : `${i[0]}|${i[1]||''}|${i[3]==='%'?i[2]:''}|${i[3]==='%'?'':(i[2]??'')}|${i[5]?1:''}`).join(';');
const sigBlock  = b => sigItems(b.items);
const sigTplBlk = t => sigTplItems(t.items);
const sigDay    = d => d.blocks.filter(b=>b.items.some(i=>i.exId)).map(sigBlock).join('§');
const sigTplWo  = t => (t.blocks||[]).map(id => { const b = tplById(id); return b ? sigTplBlk(b) : '' }).join('§');

/* Что из недели уже лежит в библиотеке, а чего там нет. */
/* Недельные аудит, сохранение и раскладка удалены вместе с сущностью недели.
   День сохраняется как шаблон тренировки через saveWorkout(), а вставляется
   из панели источников — второго механизма под это больше не нужно. */

function tplLabel(t){
  const st = tplStats(t);
  if(t.lvl==='программа')  return st.days + ' ' + plural(st.days,'день','дня','дней');
  if(t.lvl==='неделя')     return st.days  + ' ' + plural(st.days,'день','дня','дней') +
                                  ' · ' + st.n + ' упр';
  if(t.lvl==='тренировка') return st.blocks + ' ' + plural(st.blocks,'блок','блока','блоков');
  return st.n + ' ' + plural(st.n,'упражнение','упражнения','упражнений');
}

/* Шаблон недели раскладывается по семи дням; null — день отдыха (TPL-2). */
/* ═══════════ СЛОЙ ВЗАИМОДЕЙСТВИЯ ═══════════
   Клики, клавиатура и drag-and-drop конструктора. Восстановлен после того,
   как был вырезан вместе с недельными функциями: они лежали в одном диапазоне
   файла, и удаление по границам функций захватило и его. */
document.addEventListener('click', e=>{
  const pb = e.target.closest('[data-pub]');
  if(pb){ e.preventDefault(); e.stopPropagation(); setPubIdx(+pb.dataset.pub.split(':')[1], pb.classList.contains('draft')); return }
  const d = e.target.closest('[data-day]');
  if(d){
    const i = +d.dataset.day;
    if(i < 0){ shiftTo(addDays(program(S.pid).start, i)); return }
    extendPlan(i);
    S.i = i; closeSug(); render(); return;
  }
  /* Стрелки листают неделями: лента — это неделя, день внутри неё выбирают
     кликом. Встаём на тот же день недели, если он в сроке программы. */
  const vt = e.target.closest('[data-view]'); if(vt){ const v = vt.dataset.view; if(v==='hidden') STATE.laneHidden = true; else { STATE.laneHidden = false; STATE.laneView = v } saveState(); renderStrip(); return }
  if(e.target.closest('#wkToday')){ bindClient(S.cid, TODAY); render(); return }
  if(e.target.closest('#cli')){ if(SUG && SUG.classList.contains('clipick')) closeSug(); else openCliPick(e.target.closest('#cli')); return }
  /* Группа: чип участника открывает его день, полоса у клиента — день группы или возврат к нему. */
  const gpm = e.target.closest('[data-gpm]'); if(gpm){ switchWho(gpm.dataset.gpm, day().date); return }
  const ap = e.target.closest('[data-apply]'); if(ap){ applyGroupDay(ap.dataset.apply); return }
  const og = e.target.closest('[data-opengrp]'); if(og){ switchWho(og.dataset.opengrp, day().date); return }
  if(e.target.closest('#dayPrev')){ if(S.i-7 < 0){ shiftTo(addDays(program(S.pid).start, S.i-7)); return } S.i -= 7; render(); return }
  if(e.target.closest('#dayNext')){ const i = S.i+7; extendPlan(i); S.i = i; render(); return }
  const nd = e.target.closest('[data-notedel]');
  if(nd){ e.preventDefault(); const b = day().blocks.find(x=>x.id===nd.dataset.notedel);
          if(b){ b.note = ''; b.noteOpen = false; render() } return }
  const nt = e.target.closest('[data-notetog]');
  if(nt){
    /* Заметки к блокам пишут редко, поэтому поле спрятано за иконкой: открыл —
       пиши, закрыл пустым — исчезло. Заполненная заметка держит поле видимым,
       иконка тогда просто ставит курсор; удаление — крестиком в самой заметке. */
    const b = day().blocks.find(x=>x.id===nt.dataset.notetog);
    if(b){ if(!b.note) b.noteOpen = !b.noteOpen; render();
      const inp = $(`[data-blk="${b.id}"] .bnote input`); if(inp) inp.focus(); }
    return;
  }
  /* Правка в поле, из которого ушли нажатием, дописывается в модель чуть позже
     (focusout) — сохраняем после неё. */
  if(e.target.closest('#saveAll')){ setTimeout(saveAll, 150); return }
  /* Статус сохраняет и правки дня — тоже после focusout. Переключатель
     успевает сдвинуться, пока день не перерисован. */
  const stb = e.target.closest('[data-status]');
  if(stb){ if(stb.matches('.pubsw')){ stb.classList.toggle('on'); stb.setAttribute('aria-checked', stb.classList.contains('on')) }
    setTimeout(() => setStatus(stb.dataset.status), 160); return }
  if(e.target.closest('#fromTpl')){ pickTemplate(); return }
  if(e.target.closest('#copyFrom')){ pickExisting(); return }

  const tb = e.target.closest('[data-tab]');
  if(tb){ S.tab = tb.dataset.tab;
          $$('#tabs button').forEach(x=>x.classList.toggle('on', x===tb)); renderSrc(); return }

  /* Кликается вся карточка, а не только «+»: маленькая кнопка была
     единственным способом добавить, и по ней приходилось целиться. */
  const ae = e.target.closest('[data-ex]');  if(ae){ addEx(ae.dataset.ex); return }
  const at = e.target.closest('[data-tpl]'); if(at){ addTpl(tplById(at.dataset.tpl)); return }

  const add = e.target.closest('[data-add]');
  if(add){
    const b = day().blocks.find(x=>x.id===add.dataset.add);
    b.items.push(rawItem('')); render();
    const last = $$(`[data-blk="${b.id}"] [data-edit]`).pop(); if(last) last.focus();
    return;
  }
  /* Суперсет: новый — заголовок и две пустые строки; внутрь — строка в конец группы. */
  /* Связка (CON-23): новая строка сразу с курсором в поле первого упражнения. */
  const addch = e.target.closest('[data-addch]');
  if(addch){ const b = day().blocks.find(x => x.id === addch.dataset.addch); if(!b) return;
    const c = chainItem([]); b.items.push(c); render(); focusLineField(c.id, 'e'); return }
  const chl = e.target.closest('#doc .line.chain');
  if(chl && !e.target.closest('input, [contenteditable], button, .gr')){
    const cp = e.target.closest('[data-part]'), {i: p} = cp ? findItem(cp.dataset.part) : {}, id = chl.dataset.item;
    /* Поля видны, только пока курсор в связке: сначала входим в неё, потом — в нужное поле. */
    focusLineField(id, 'e');
    if(p) focusPart(p.id, 'sch'); else if(e.target.closest('.cprm')) focusLineField(id, 'sets');
    return }
  const dpart = e.target.closest('[data-delpart]');
  if(dpart){ const {i: p, chain} = findItem(dpart.dataset.delpart); if(!chain) return;
    chain.parts = chain.parts.filter(x => x !== p); render(); if(!chain.parts.length) focusLineField(chain.id, 'e'); return }
  /* «от–до» (CON-24): диапазон — дополнительная функция: к числу добавляется
     «–» и курсор встаёт за ним; у диапазона — остаётся одно число. */
  const rng = e.target.closest('[data-rng]');
  if(rng){ const {i} = findItem(rng.dataset.rng), inp = $(`#doc [data-pf="ld"][data-for="${rng.dataset.rng}"]`); if(!i || !inp) return;
    if(hasRange(i)){ delete i.pct2; delete i.val2; inp.value = ldVal(i); autoWidth(inp); commitSoft(); focusField(inp); return }
    inp.value = inp.value.trim().replace(/\s*[-–—]\s*$/, '') + RNG; autoWidth(inp); inp.focus(); inp.setSelectionRange(inp.value.length, inp.value.length); return }
  const addss = e.target.closest('[data-addss]');
  if(addss){
    const b = day().blocks.find(x=>x.id===addss.dataset.addss);
    const h = ssItem(3, ''), m1 = rawItem(''), m2 = rawItem(''); m1.sub = m2.sub = true;
    b.items.push(h, m1, m2); render();
    const el = document.querySelector(`[data-item="${m1.id}"] [data-edit]`); if(el) el.focus();
    return;
  }
  const addin = e.target.closest('[data-addin]');
  if(addin){
    const {b} = findItem(addin.dataset.addin); if(!b) return;
    const it = rawItem(''); it.sub = true;
    b.items.splice(ssEnd(b.items, b.items.findIndex(x=>x.id===addin.dataset.addin)), 0, it); render();
    const el = document.querySelector(`[data-item="${it.id}"] [data-edit]`); if(el) el.focus();
    return;
  }
  const ung = e.target.closest('[data-ssungroup]');
  if(ung){
    const {b} = findItem(ung.dataset.ssungroup); if(!b) return;
    const k = b.items.findIndex(x=>x.id===ung.dataset.ssungroup), j = ssEnd(b.items, k);
    for(let m = k + 1; m < j; m++) b.items[m].sub = false;
    b.items.splice(k, 1); render(); return;
  }
  const dss = e.target.closest('[data-delss]');
  if(dss){
    const {b} = findItem(dss.dataset.delss); if(!b) return;
    const k = b.items.findIndex(x=>x.id===dss.dataset.delss), removed = b.items.splice(k, ssEnd(b.items, k) - k);
    render();
    toast('Суперсет удалён', 'Отменить', () => { b.items.splice(k, 0, ...removed); render() });
    return;
  }
  /* Кнопка AI — в углу блока текстом и строки текстом (CON-5). Пока ИИ
     разбирает, повторное нажатие ничего не делает. */
  const aib = e.target.closest('[data-aiblk]'); if(aib){ if(!aib.classList.contains('busy')) aiBlock(aib.dataset.aiblk); return }
  const fmt = e.target.closest('[data-fmt="ul"]'); if(fmt){ toggleList(fmt.closest('.tbody').querySelector('.tbx')); return }
  const ail = e.target.closest('[data-ailine]'); if(ail){ if(!ail.classList.contains('busy')) aiLine(ail.dataset.ailine); return }
  if(e.target.closest('#pd-yes')){ acceptPending(); return }
  if(e.target.closest('#pd-no')){  cancelPending(); return }
  if(e.target.closest('#pd-src')){ showSource();   return }
  if(e.target.closest('#sav-wo')){ saveWorkout(); return }
  /* Сообщение клиенту — тот же паттерн, что заметка к блоку: поле спрятано за
     иконкой, открыл — пиши, заполненное держит поле видимым, удаляется крестиком. */
  if(e.target.closest('#msg-tog')){ const dd = day(); S.msgOpen = (!trainerMsg(dd.date) && S.msgOpen===dd.date) ? null : dd.date; render(); const i = $('#w-msg'); if(i) i.focus(); return }
  if(e.target.closest('#comp-tog')){ const dd = day(); dd.comp = !dd.comp; render(); toast(dd.comp ? 'День отмечен как соревнование' : 'Статус соревнования снят'); return }
  if(e.target.closest('#w-msgdel')){ e.preventDefault(); setTrainerMsg(day().date, ''); grpMsgPush(); saveState(); S.msgOpen = null; render(); return }
  if(e.target.closest('#clr-wo')){ askClear(); return }
  const sb = e.target.closest('[data-savblk]');
  if(sb){ openFolder(sb); return }
  const ssw = e.target.closest('[data-srcsw]');
  if(ssw){ S.src = ssw.dataset.srcsw; STATE.railSrc = S.src; saveState(); renderRailHead(); renderSrc(); return }
  const csc = e.target.closest('#cs-cli');
  if(csc){ closeSug(); SUG = openClientPicker(csc, CSRC.cid, id => { SUG = null; csrcReset(id); renderRailHead(); renderSrc() }, {all:true}); return }
  const mc = e.target.closest('[data-mcal]');
  if(mc){ const [y, m] = CSRC.month.split('-').map(Number), dt = new Date(y, m - 1 + (+mc.dataset.mcal), 1);
    CSRC.month = dt.getFullYear() + '-' + String(dt.getMonth() + 1).padStart(2, '0'); renderRailHead(); return }
  const mday = e.target.closest('[data-mday]');
  if(mday){ CSRC.date = mday.dataset.mday; renderRailHead(); renderSrc(); return }
  if(e.target.closest('#cs-copy')){ csrcCopyWorkout(); return }
  const cba = e.target.closest('[data-cbadd]');
  if(cba){ const nb = csrcCopyBlock(cba.dataset.cbadd); if(!nb) return; const d = day(); dropEmptyBlocks(d); d.blocks.push(nb); render(); flash(nb.id); return }
  const cia = e.target.closest('[data-ciadd]');
  if(cia){ const its = csrcCopyItems(cia.dataset.ciadd); if(!its) return; lastBlock().items.push(...its); render(); flash(its[0].id); return }
  /* Способы начать день: «Вручную» — строка упражнения с курсором в последнем
     блоке, «Текстом» — блок текстом. Развилки-режима больше нет: оба пути
     сразу дают, куда печатать. */
  const way = e.target.closest('[data-way]');
  if(way){
    const k = way.dataset.way;
    if(k === 'hand'){ const b = lastBlock(); let it = b.items.find(x => !x.ss && !x.exId && !String(x.raw || '').trim());
      if(!it){ it = rawItem(''); b.items.push(it) } render(); focusLineField(it.id, 'e'); return }
    if(k === 'tpl'){ pickTemplate(); return }
    if(k === 'cal'){ pickExisting(); return }
    focusText(addTextBlock('').id); return;
  }
  if(e.target.closest('#add-blk-text')){ focusText(addTextBlock('').id); return }
  if(e.target.closest('[data-newex]') && SUG){ const id = SUG.dataset.forItem, text = SUG.dataset.text || ''; closeSug(); openNewEx(id, text); return }
  const pfu = e.target.closest('[data-pfu]');
  if(pfu){ const {i} = findItem(pfu.dataset.pfu); if(!i) return; const L = loadInfo(i), inp = pfu.parentElement.querySelector('input');
    if(L.units.length > 1){ const nu = L.units[(L.units.indexOf(L.cur) + 1) % L.units.length]; UNITSEL[i.id] = nu; applyLoad(i, inp.value, nu); syncLoads(); commitSoft() }
    inp.focus(); return }
  if(e.target.closest('#add-blk')){
    /* Кнопка стоит сверху — значит и блок появляется сверху, под курсором,
       а не улетает в конец длинного дня. */
    const nb = mkBlock(null,'','',null,[]);
    day().blocks.push(nb);
    render();
    /* Фокус — в название именно нового блока: он последний в дне, а не первый. */
    const t = document.querySelector(`[data-blk="${nb.id}"] .bt`);
    if(t){ t.focus({preventScroll:true}); t.scrollIntoView({block:'center', behavior:'smooth'}) }
    return;
  }
  const db = e.target.closest('[data-delblk]');
  if(db){ const d2 = day(); d2.blocks = d2.blocks.filter(b=>b.id!==db.dataset.delblk); render(); return }
  const dl = e.target.closest('[data-del]');
  if(dl){ const {b} = findItem(dl.dataset.del); b.items = b.items.filter(x=>x.id!==dl.dataset.del); render(); return }
  const ft = e.target.closest('[data-ftype]'); if(ft){ openFtype(ft); return }
  const pf = e.target.closest('[data-pickfor]');
  if(pf){ pickFor(pf.dataset.pickfor); return }

  const pick = e.target.closest('[data-pick]');
  if(pick && SUG){ pickExercise(SUG.dataset.forItem, pick.dataset.pick, SUG.dataset.text || '', 'click'); return }
  if(e.target.closest('#md-cancel') || e.target.closest('#md-x') ||
     e.target === $('#ov') || e.target.closest('#md-ok')){
    $('#ov').classList.remove('on'); return }
  const cl = e.target.closest('[data-cl]');
  if(cl){ const id = cl.dataset.cl;
          PICK.has(id) ? PICK.delete(id) : PICK.add(id);
          cl.classList.toggle('on', PICK.has(id)); paintPick(); return }
  if(e.target.closest('#md-all')){
    PICK = PICK.size === CLIENTS.length ? new Set() : new Set(CLIENTS.map(c=>c.id));
    $$('.md .cl').forEach(x=>x.classList.toggle('on', PICK.has(x.dataset.cl)));
    paintPick(); return;
  }
  if(!e.target.closest('.sug')){
    const wasSetup = SUG && SUG.classList.contains('setup');
    closeSug();
    if(wasSetup && !(document.activeElement && document.activeElement.closest('#doc'))) render();
  }
});

/* Ctrl/⌘+S — «Сохранить» (CON-20), где бы ни стоял курсор: поле сначала
   отпускаем, чтобы набранное в нём успело попасть в модель. */
document.addEventListener('keydown', e => {
  if(!(e.metaKey || e.ctrlKey) || e.shiftKey || e.altKey || e.code !== 'KeyS') return;
  e.preventDefault();
  const a = document.activeElement; if(a && a.closest && a.closest('#doc') && a.blur) a.blur();
  setTimeout(saveAll, 150);
});
/* Лист блока текстом: клавиши списка и подсветка кнопки «Список» по курсору.
   Нажатие на панель не уводит курсор из листа — иначе панель, видимая только
   пока в блоке печатают, исчезала бы раньше, чем сработает кнопка. */
document.addEventListener('keydown', e => { const ta = e.target.closest && e.target.closest('#doc .tbx'); if(ta) listKey(ta, e) });
/* То же у «от–до»: кнопка видна, пока курсор в строке, — фокус не уводим. */
document.addEventListener('mousedown', e => { if(e.target.closest && e.target.closest('#doc .tbar, #doc [data-rng]')) e.preventDefault() });
['keyup', 'click', 'focusin'].forEach(t => document.addEventListener(t, e => { const ta = e.target.closest && e.target.closest('#doc .tbx'); if(ta) listState(ta) }));
document.addEventListener('selectionchange', () => { const a = document.activeElement; if(a && a.matches && a.matches('#doc .tbx')) listState(a) });

/* Многострочная вставка в строку упражнения ложится блоком текстом под этот
   блок — как вставили, без разбора (CON-5); разобрать можно кнопкой AI в его
   углу. Одна строка вставляется в строку обычным текстом, в блок текстом
   вставка идёт как в любое поле. */
document.addEventListener('paste', e=>{
  const t = (e.clipboardData || window.clipboardData).getData('text') || '';
  if(!/\n/.test(t.trim())) return;
  const ed = e.target.closest('#doc [data-edit]');
  if(!ed) return;
  e.preventDefault();
  closeSug();
  const {b, i} = findItem(ed.dataset.edit); if(!b) return;
  /* Строка, в которую вставляли: пустая уходит, набранное в ней остаётся текстом. */
  if(i && !i.exId){ const typed = ed.textContent.trim(); if(typed) i.raw = typed; else b.items = b.items.filter(x => x !== i) }
  const tb = addTextBlock(t.replace(/\r/g, '').trim(), b);
  flash(tb.id);
  toast('Вставлено блоком текстом, как есть. Разобрать на упражнения — кнопкой AI');
});

document.addEventListener('input', e=>{
  const ed = e.target.closest('[data-edit]');
  if(ed){
    ed.closest('.line').classList.add('edit');
    showSug(ed, ed.textContent);
    if(SUG){ SUG.dataset.forItem = ed.dataset.edit; SUG.dataset.text = ed.textContent }
    return;
  }
  /* Поля строки: нагрузка и 1ПМ — в модель на каждый символ (вес и единица
     видны сразу), схема — при выходе из поля: пока печатают «60×5, 7…»,
     строка не должна мигать между схемой и текстом. */
  const pfi = e.target.closest('[data-pf]');
  if(pfi){
    const {i} = findItem(pfi.dataset.for); if(!i) return;
    if(pfi.dataset.pf === 'ld') applyLoad(i, pfi.value);
    if(pfi.dataset.pf === 'pm'){ const k = loadInfo(i).key, v = parseFloat(pfi.value.replace(',', '.')); if(v > 0) PM()[k] = v; else delete PM()[k]; saveState() }
    autoWidth(pfi); syncLoads(); refreshChrome();
    return;
  }
  /* Круги и отдых суперсета — в модель на каждый символ, без перерисовки документа. */
  const sf = e.target.closest('[data-ssf]');
  if(sf){
    const {i: h} = findItem(sf.dataset.ssId); if(!h) return;
    if(sf.dataset.ssf === 'rounds'){
      const n = parseInt(sf.value.replace(/\D/g, ''), 10);
      if(n > 0){ h.rounds = Math.min(n, 99); const lb = document.querySelector(`[data-ss-rl="${h.id}"]`); if(lb) lb.textContent = plural(h.rounds, 'круг', 'круга', 'кругов') }
    } else h.rest = sf.value.trim();
    renderStrip(); refreshChrome();
    return;
  }
  const f = e.target.closest('[data-f]');
  if(f){
    const b = day().blocks.find(x=>x.id === f.closest('[data-blk]').dataset.blk);
    b[f.dataset.f] = f.value;
    if(f.dataset.f === 'title') renderStrip();
    if(f.dataset.f !== 'text') refreshChrome();                /* «Сохранить» загорается сразу */
    /* Текст блока — в модель на каждый символ. Лист растёт по тексту, кнопка AI
       бледнеет, пока разбирать нечего; полоса дней и публикация — сразу: день
       с одним текстом уже тренировка. */
    if(f.dataset.f === 'text'){ fitText(f); const ai = f.parentElement.querySelector('[data-aiblk]'); if(ai) ai.classList.toggle('dim', !f.value.trim()); renderStrip(); refreshChrome() }
    /* Иконка заметки заливается сразу, как появился текст, без перерисовки —
       перерисовка сбила бы курсор в поле. */
    if(f.dataset.f === 'note'){ const ic = document.querySelector(`[data-notetog="${b.id}"]`); if(ic){ ic.classList.toggle('on', !!f.value.trim()); ic.dataset.tip = f.value.trim() ? 'Заметка к блоку' : 'Добавить заметку к блоку'; ic.removeAttribute('title') } }
    return;
  }
  if(e.target.id === 'd-title'){ day().title = e.target.value; renderStrip(); refreshChrome(); return }
  if(e.target.id === 'w-msg'){ setTrainerMsg(day().date, e.target.value); grpMsgPush(); saveState();
    const ic = $('#msg-tog'); if(ic){ const has = !!e.target.value.trim(); ic.classList.toggle('on', has); ic.dataset.tip = has ? 'Сообщение клиенту' : 'Добавить сообщение клиенту'; ic.removeAttribute('title') }
    return }
  if(e.target.id === 'q'){ S.q = e.target.value; renderSrc(); return }
});
document.addEventListener('change', e=>{
  /* От 1ПМ какого упражнения связки считать процент; пусто — самого слабого. */
  const cof = e.target.closest('[data-cof]');
  if(cof){ const {i} = findItem(cof.dataset.cof); if(!i) return; i.of = cof.value || null; commitSoft(); return }
  /* Поле кругов не остаётся пустым; «90» в отдыхе — это секунды. */
  const sfc = e.target.closest('[data-ssf]');
  if(sfc){
    const {i: h} = findItem(sfc.dataset.ssId); if(!h) return;
    if(sfc.dataset.ssf === 'rounds') sfc.value = h.rounds;
    else if(/^\d+$/.test(h.rest)){ h.rest += ' сек'; sfc.value = h.rest; renderStrip() }
    return;
  }
  const tf = e.target.closest('[data-f="title"]');
  if(tf){
    const b = day().blocks.find(x=>x.id === tf.closest('[data-blk]').dataset.blk);
    /* Тип из названия — только пока тренер не выбрал его сам: «AMRAP 15» делает
       блок комплексом с настройкой, «Разминка» — разминкой. */
    if(b && (!b.kind || (b.kind === 'complex' && !b.fmt))){
      if(findFmt(tf.value)){ normFmt(b); render(); toast('Тип блока: ' + blockTypeLabel(b)); return }
      const k = !b.kind && typeOfTitle(tf.value);
      if(k){ b.kind = k; render(); toast('Тип блока: ' + typeName(k)) }
    }
    return;
  }
  if(e.target.closest('.tbx')){ commitSoft(); return }      /* блок текстом дописали — сохранить */
});
document.addEventListener('keydown', e=>{
  if(e.defaultPrevented) return;
  if(e.target.id === 'w-msg' && e.key === 'Enter'){
    /* Поле пишет в модель на каждый символ, так что Enter ничего не «сохраняет».
       Но тренеру нужен сигнал, что он закончил мысль, — Enter снимает фокус
       и подтверждает галочкой. Подсказка висит только пока поле активно. */
    e.preventDefault();
    const k = e.target.closest('.wmsg').querySelector('.ent');
    k.textContent = '✓ Записано'; k.classList.add('done');
    e.target.blur();
    setTimeout(()=>{ k.textContent = '↵ Enter'; k.classList.remove('done') }, 1400);
    return;
  }
  /* Enter в названии блока или тренировки — «готово»: снимаем фокус, а
     change уже подхватывает набранный формат («AMRAP 15») как тип. */
  if(e.key === 'Enter' && (e.target.closest('[data-f="title"]') || e.target.closest('[data-ssf]') || e.target.id === 'd-title')){
    e.preventDefault(); e.target.dispatchEvent(new Event('change', {bubbles:true})); e.target.blur(); return }
  if(e.key === 'Escape'){ closeSug(); $('#ov').classList.remove('on'); const w = $('#wz'); if(w) w.remove(); if(e.target.closest && e.target.closest('.tbx')) e.target.blur() }
});
document.addEventListener('focusout', e=>{
  const ed = e.target.closest('[data-edit]');
  if(!ed) return;
  setTimeout(()=>{
    if(!ed.isConnected) return;                       /* строку уже перерисовали — разбор прошёл */
    const id = ed.dataset.edit, {b, i} = findItem(id), a = document.activeElement;
    if(a && a.closest && a.closest(`.line[data-item="${id}"]`)) return;   /* ушли в поле той же строки */
    /* Связка: набранное в поле «упражнение» остаётся в ней текстом, пустая
       связка без упражнений не остаётся. */
    if(i && i.chain){ const t = ed.textContent.trim(); if(t) chainAdd(id, null, t, 'quiet'); else if(!i.parts.length){ b.items = b.items.filter(x => x !== i); render() } return }
    /* Пустая строка, из которой ушли, не остаётся в тренировке. */
    if(i && !i.exId && !i.raw && !ed.textContent.trim()){ b.items = b.items.filter(x => x !== i); render(); return }
    if(!SUG || SUG.dataset.forItem !== id) commitIfChanged(id, ed.textContent);
  }, 120);
});

/* ═══════════ ПЕРЕТАСКИВАНИЕ (CON-8, CON-13) ═══════════
   Три уровня, одна механика: упражнение таскается между блоками, блок —
   между блоками и на другой день, тренировка целиком — только на день.
   Тащить можно лишь за ручку: строка редактируемая, и если сделать
   draggable всю, в ней перестанет выделяться текст. Поэтому draggable
   включается по нажатию на ручку и снимается по окончании. */
let DRAG = null;
const dayOf = i => plan()[i];

document.addEventListener('mousedown', e=>{
  const gr = e.target.closest('.gr'); if(!gr) return;
  const host = gr.closest('.line') || gr.closest('.blk') || gr.closest('.doc');
  if(host) host.draggable = true;
});

function clearDrag(){
  DRAG = null;
  $$('[draggable="true"]').forEach(x=>x.draggable = false);
  $$('.over,.dropafter,.dropbefore,.dropmerge,.dayover').forEach(x=>
    x.classList.remove('over','dropafter','dropbefore','dropmerge','dayover'));
}
document.addEventListener('dragstart', e=>{
  const rail = e.target.closest('[data-ex],[data-tpl]');
  if(rail){ DRAG = rail.dataset.ex ? {t:'ex', v:rail.dataset.ex} : {t:'tpl', v:rail.dataset.tpl};
            e.dataTransfer.effectAllowed = 'copy'; return }
  /* Из календаря в панели: упражнение (или суперсет целиком) и блок — копией. */
  const cit = e.target.closest('[data-cit]');
  if(cit){ DRAG = {t:'cit', v:cit.dataset.cit}; dragGhost(e, cit.querySelector('.nm').textContent.trim()); try{ e.dataTransfer.effectAllowed = 'copy' }catch(_){} return }
  const cbl = e.target.closest('[data-cblk]');
  if(cbl){ DRAG = {t:'cblk', v:cbl.dataset.cblk}; dragGhost(e, cbl.querySelector('.csb-h b').textContent.trim()); try{ e.dataTransfer.effectAllowed = 'copy' }catch(_){} return }
  const line = e.target.closest('.line');
  if(line && line.draggable){ DRAG = {t:'line', v:line.dataset.item}; dragGhost(e, (line.querySelector('.nm')||line).textContent.trim() || 'Упражнение'); return }
  const blk = e.target.closest('.blk');
  if(blk && blk.draggable){ DRAG = {t:'block', v:blk.dataset.blk}; dragGhost(e, ((blk.querySelector('.bt')||{}).value || '').trim() || 'Блок'); return }
  const doc = e.target.closest('.doc');
  if(doc && doc.draggable){
    /* Тренировку кладут только на день в полосе недель: если полоса скрыта —
       перетаскивать некуда, говорим об этом, а не молча ничего не делаем. */
    const strip = $('#strip');
    if(STATE.laneHidden || !strip){ e.preventDefault(); clearDrag(); toast('Покажите календарь — тренировку переносят на день в полосе недель'); return }
    DRAG = {t:'workout', v:S.i};
    dragGhost(e, day().title || 'Тренировка');
    const r = strip.getBoundingClientRect(); if(r.top < 70) window.scrollBy({top: r.top - 90, behavior:'smooth'});
    return;
  }
  e.preventDefault();
});
/* Компактная «плашка» вместо снимка всего документа: снимок тренировки на весь
   экран закрывал полосу недель, и бросить её было некуда. setData нужен
   Firefox — без него перетаскивание там не начинается вовсе. */
function dragGhost(e, text){
  const g = document.createElement('div'); g.className = 'dragghost'; g.textContent = text;
  document.body.appendChild(g);
  try{ e.dataTransfer.setData('text/plain', text); e.dataTransfer.effectAllowed = 'move'; e.dataTransfer.setDragImage(g, 14, 16) }catch(_){}
  setTimeout(()=>g.remove(), 0);
}
document.addEventListener('dragover', e=>{
  if(!DRAG) return;
  e.preventDefault();
  $$('.over,.dropafter,.dropbefore,.dropmerge,.dayover').forEach(x=>
    x.classList.remove('over','dropafter','dropbefore','dropmerge','dayover'));
  const d = e.target.closest('.day');
  if(d && DRAG.t !== 'ex' && DRAG.t !== 'cit'){ d.classList.add('dayover'); return }
  if(DRAG.t === 'workout') return;
  const line = e.target.closest('.line');
  if(line && DRAG.t !== 'block' && DRAG.t !== 'cblk'){
    /* Средняя зона строки — «объединить в суперсет»; края — вставить до или после. */
    const r = line.getBoundingClientRect(), y = (e.clientY - r.top) / r.height;
    const dragged = DRAG.t === 'line' ? (findItem(DRAG.v) || {}).i : DRAG.t === 'cit' ? csrcItemAt(DRAG.v) : null;
    const merge = dragged && !dragged.ss && line.dataset.item !== DRAG.v && y > .3 && y < .7;
    line.classList.add(merge ? 'dropmerge' : y < .5 ? 'dropbefore' : 'dropafter');
    return;
  }
  const grp = e.target.closest('.ssg');
  if(grp && (DRAG.t === 'line' || DRAG.t === 'cit') && !((DRAG.t === 'line' ? findItem(DRAG.v).i : csrcItemAt(DRAG.v)) || {}).ss){ grp.classList.add('over'); return }
  const blk = e.target.closest('.blk');
  if(blk){
    if(DRAG.t === 'block' || DRAG.t === 'cblk'){
      const r = blk.getBoundingClientRect();
      blk.classList.add(e.clientY < r.top + r.height/2 ? 'dropbefore' : 'dropafter');
    } else if(!blk.classList.contains('tblk')) blk.classList.add('over');   /* блок текстом упражнений не принимает */
  }
});
document.addEventListener('drop', e=>{
  if(!DRAG) return;
  e.preventDefault();
  const d = e.target.closest('.day');
  if(d && DRAG.t !== 'ex' && DRAG.t !== 'cit'){ dropOnDay(+d.dataset.day); return }
  if(DRAG.t === 'ex' || DRAG.t === 'tpl'){ dropFromRail(e); return }
  if(DRAG.t === 'cit'){ dropCalItem(e); return }
  if(DRAG.t === 'cblk'){ dropCalBlock(e); return }
  if(DRAG.t === 'line')  { dropLine(e);  return }
  if(DRAG.t === 'block') { dropBlock(e); return }
  clearDrag();
});
document.addEventListener('dragend', clearDrag);

/* Упражнение из календаря встаёт туда, куда его отпустили, по тем же правилам,
   что и перенос строки внутри дня (до, после, в суперсет): копию кладём в блок
   и дальше двигаем её как обычную строку. */
/* Блок текстом упражнений не принимает: всё, что в нём, — текст. Строку
   бросили на него — говорим, как быть, и ничего не двигаем. */
const textDropNo = () => { clearDrag(); toast('В блок текстом упражнение не положить — разберите его кнопкой AI или перетащите в другой блок') };
function dropCalItem(e){
  const its = e.target.closest('#doc') && csrcCopyItems(DRAG.v);
  if(!its){ clearDrag(); return }
  const blkEl = e.target.closest('.blk');
  const to = (blkEl && day().blocks.find(x => x.id === blkEl.dataset.blk)) || lastBlock();
  if(isTextBlock(to)){ textDropNo(); return }
  to.items.push(...its);
  if(blkEl && (e.target.closest('.line') || e.target.closest('.ssg'))){ DRAG = {t:'line', v: its[0].id}; dropLine(e) }
  else { clearDrag(); render() }
  flash(its[0].id);
}
function dropCalBlock(e){
  const nb = e.target.closest('#doc') && csrcCopyBlock(DRAG.v);
  if(!nb){ clearDrag(); return }
  const d = day(); dropEmptyBlocks(d);
  const onBlk = e.target.closest('.blk'), k = onBlk ? d.blocks.findIndex(x => x.id === onBlk.dataset.blk) : -1;
  let at = d.blocks.length;
  if(k >= 0){ const r = onBlk.getBoundingClientRect(); at = e.clientY < r.top + r.height / 2 ? k : k + 1 }
  d.blocks.splice(at, 0, nb);
  clearDrag(); render(); flash(nb.id);
}
function dropFromRail(e){
  const blk = e.target.closest('.blk');
  let it = null;
  if(DRAG.t === 'ex'){
    const b = blk ? day().blocks.find(x=>x.id===blk.dataset.blk) : lastBlock();
    if(isTextBlock(b)){ textDropNo(); return }
    it = mkItem(DRAG.v, '', null, null, ''); b.items.push(it);
  } else addTplRaw(tplById(DRAG.v));
  clearDrag(); render();
  if(it) focusLineField(it.id, 'sch');
}
/* Упражнение переезжает в тот блок, над строкой которого его отпустили.
   Середина строки — объединить в суперсет (или войти в суперсет цели);
   край строки участника — встать в тот же суперсет; заголовок суперсета
   тащит всю группу, и вложить её в другой суперсет нельзя. */
function dropLine(e){
  const {b:from, i:item} = findItem(DRAG.v) || {};
  const onLine = e.target.closest('.line'), onBlk = e.target.closest('.blk');
  if(!onBlk || !item){ clearDrag(); return }
  const to = day().blocks.find(x=>x.id===onBlk.dataset.blk);
  if(isTextBlock(to)){ textDropNo(); return }
  const k0 = from.items.indexOf(item);
  const moving = from.items.splice(k0, item.ss ? ssEnd(from.items, k0) - k0 : 1);
  if(onLine && moving.some(x => x.id === onLine.dataset.item)){ from.items.splice(k0, 0, ...moving); clearDrag(); return }
  const target = onLine ? to.items.find(x=>x.id===onLine.dataset.item) : null;
  const r = onLine && onLine.getBoundingClientRect(), y = r ? (e.clientY - r.top) / r.height : 1;
  const zone = y < .3 ? 'before' : y > .7 ? 'after' : 'merge';
  const grp = !onLine && !item.ss && e.target.closest('.ssg');
  if(grp){ const k = to.items.findIndex(x=>x.id===grp.dataset.ss); item.sub = true; to.items.splice(ssEnd(to.items, k), 0, item) }
  else if(!target){ if(!item.ss) item.sub = false; to.items.push(...moving) }
  else if(item.ss){
    let k = to.items.indexOf(target);
    if(target.sub) while(k > 0 && !to.items[k].ss) k--;
    const at = (zone === 'before' || (zone === 'merge' && y < .5)) ? k : (to.items[k].ss ? ssEnd(to.items, k) : k + 1);
    to.items.splice(at, 0, ...moving);
  } else if(zone === 'merge'){
    const k = to.items.indexOf(target);
    item.sub = true;
    if(target.ss) to.items.splice(ssEnd(to.items, k), 0, item);          /* на заголовок — в конец суперсета */
    else if(target.sub) to.items.splice(k + 1, 0, item);                  /* на участника — следом за ним */
    else { target.sub = true; to.items.splice(k, 0, ssItem(3, '')); to.items.splice(k + 2, 0, item) }
  } else {
    const k = to.items.indexOf(target);
    item.sub = target.ss ? zone === 'after' : !!target.sub;
    to.items.splice(zone === 'before' ? k : k + 1, 0, item);
  }
  clearDrag(); render();
}
function dropBlock(e){
  const onBlk = e.target.closest('.blk');
  if(!onBlk || onBlk.dataset.blk === DRAG.v){ clearDrag(); return }
  const d = day(), from = d.blocks.findIndex(x=>x.id===DRAG.v);
  const [blk] = d.blocks.splice(from, 1);
  const r = onBlk.getBoundingClientRect();
  const at = d.blocks.findIndex(x=>x.id===onBlk.dataset.blk);
  d.blocks.splice(e.clientY < r.top + r.height/2 ? at : at+1, 0, blk);
  clearDrag(); render();
}
/* Перенос на другой день (CON-13). После переноса открываем тот день,
   куда положили: иначе тренер не увидит результата своего действия. */
function dropOnDay(idx){
  if(idx === S.i && (DRAG.t === 'workout' || DRAG.t === 'block')){ clearDrag(); return }
  const src = day(), dst = dayOf(idx);
  if(DRAG.t === 'workout'){
    /* Если на целевом дне уже есть тренировка — меняем дни местами, а не
       затираем её молча. Статус соревнования переезжает вместе с днём. */
    const had = dayHas(dst);
    const t = {title:dst.title, blocks:dst.blocks, comp:dst.comp};
    dst.title = src.title; dst.blocks = src.blocks; dst.comp = src.comp;
    src.title = had ? t.title : ''; src.blocks = had ? t.blocks : []; src.comp = had ? t.comp : false;
    const dt = new Date(dst.date+'T00:00:00');
    toast(had ? 'Тренировки поменялись местами' : 'Тренировка перенесена на ' + dt.getDate() + ' ' + MON[dt.getMonth()]);
  }
  else if(DRAG.t === 'block'){
    const at = src.blocks.findIndex(x=>x.id===DRAG.v);
    const [blk] = src.blocks.splice(at, 1);
    dst.blocks.push(blk);
  }
  else if(DRAG.t === 'line'){
    const {b:from, i:item} = findItem(DRAG.v);
    const k0 = from.items.indexOf(item), moving = from.items.splice(k0, item.ss ? ssEnd(from.items, k0) - k0 : 1);
    if(!item.ss) item.sub = false;
    structBlock(dst).items.push(...moving);
    src.blocks.forEach(normSS); dst.blocks.forEach(normSS);
  }
  else if(DRAG.t === 'tpl'){ S.i = idx; addTplRaw(tplById(DRAG.v)) }
  else if(DRAG.t === 'cblk'){ const nb = csrcCopyBlock(DRAG.v); if(nb){ dropEmptyBlocks(dst); dst.blocks.push(nb) } }
  clearDrag();
  S.i = idx;
  render();
}

/* назначение (CON-9) */
/* Назначают обычно не одному: группа делает одну тренировку, проценты у
   каждого свои. Поэтому выбор множественный, а рядом с именем сразу видны
   максимумы — по ним понятно, во что превратятся проценты (CON-16). */
let PICK = new Set();
/* Какой максимум показать справа: тот, от которого считается эта тренировка. */
function mainPm(d){
  const ids = d.blocks.flatMap(b=>b.items).filter(i=>(i.exId || i.chain) && i.pct!=null).map(i=>pctKey(i, null));
  return ids.find(Boolean) || 'dead';
}
function clientRow(c, key, needsPm){
  const pm = pmOf(c.id);
  const has = Object.values(pm).filter(v=>v!=null).length;
  const list = Object.entries(PMNAMES).filter(([k])=>pm[k]!=null).slice(0,4)
    .map(([k,n])=>n + ' ' + fmtN(pm[k])).join(' · ');
  /* Нет максимума — проценты не во что превращать (CON-16). Тренер должен
     узнать это здесь, а не от клиента, который откроет пустую тренировку. */
  const blind = needsPm && pm[key] == null;
  return `<button class="cl ${PICK.has(c.id)?'on':''} ${blind?'blind':''}" data-cl="${c.id}">
    <span class="box">${ICON.chk}</span>
    <span class="av">${esc(c.ini)}</span>
    <span class="who"><b>${esc(c.n)}</b>
      <s>${blind ? 'нет максимума — проценты не посчитаются'
                 : esc(has ? list : 'максимумы не заданы')}</s></span>
    <span class="pmv"><b>${pm[key]!=null?fmtN(pm[key]):'—'}</b><s>${esc(PMNAMES[key])}</s></span>
  </button>`;
}
/* Модалка «Назначить» удалена: назначение теперь неявное — тренировка стоит
   у клиента на дате. Массовое назначение (CON-10) переезжает из конструктора. */

/* В данных формат лежал отдельным полем — переносим в название один раз,
   чтобы источник остался один. */
/* Массовые действия: до операции сбрасываем правки на диск, после — перечитываем
   планы всех клиентов (данные могли поменяться и у других) и встаём на тот же день. */
bulkInit({
  cid: () => S.cid,
  refresh: () => renderStrip(),
  beforeOp: () => persist(),
  afterOp: () => { const date = (plan()[S.i] || {}).date || S.date; Object.keys(PCACHE).forEach(k => delete PCACHE[k]); bindClient(S.cid, date); render() },
});
renderNav('constructor.html'); renderTop(); csrcReset(S.cid); renderRailHead(); render();

/* Сворачивание панели источников — состояние переживает перезагрузку,
   как и у левого меню. */
initRail();
