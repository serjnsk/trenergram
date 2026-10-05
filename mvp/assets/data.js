/* ============================================================
   Тренерграм · доменная модель (общая для всех страниц)
   Сущности по 02 — Функциональные требования:
   упражнение → блок → тренировка → программа → шаблон
   ============================================================ */
/* TODAY — реальная дата (объявлена ниже, после помощников дат). Демо-данные
   написаны вокруг ANCHOR и при загрузке сдвигаются на разницу дней, чтобы
   прототип не устаревал: «сегодня» в нём всегда сегодня. */
const ANCHOR = '2026-08-26';
const D = s => new Date(s + 'T00:00:00');
const iso = d => d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
const RU = ['Пн','Вт','Ср','Чт','Пт','Сб','Вс'];
const MONTHS = ['января','февраля','марта','апреля','мая','июня','июля','августа','сентября','октября','ноября','декабря'];
const MONTHS_N = ['Январь','Февраль','Март','Апрель','Май','Июнь','Июль','Август','Сентябрь','Октябрь','Ноябрь','Декабрь'];
const dm = s => { const d=D(s); return String(d.getDate()).padStart(2,'0')+'.'+String(d.getMonth()+1).padStart(2,'0') };
const addDays = (s,n) => { const d=D(s); d.setDate(d.getDate()+n); return iso(d) };
const dowMon = s => (D(s).getDay()+6)%7;    /* 0 = понедельник */
const daysBetween = (a,b) => Math.round((D(b)-D(a))/86400000);
const TODAY = iso(new Date());
const SHIFT = daysBetween(ANCHOR, TODAY);
const shiftDate = d => (typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)) ? addDays(d, SHIFT) : d;

/* ─── Тренер и его рабочее пространство (REG-3) ───
   invite — ссылка-приглашение (REG-1): одна на всех клиентов и без срока.
   Код случайный, не из фамилии: «Новая ссылка» в профиле выпускает другую,
   прежняя сразу перестаёт работать. Выпущенная лежит в STATE.profile.invite. */
const TRAINER = {
  n:'Сергей Ковальчук', ini:'СК', workspace:'CrossFit Ладья',
  invite:'https://trenergram.app/j/K7F2QX',
  first:'Сергей', last:'Ковальчук', phone:'+7 921 400-18-22', email:'kovalchuk@ladya.fit',
  city:'Санкт-Петербург', tz:'Europe/Moscow', sports:['Кроссфит','Тяжёлая атлетика'],
  about:'Тренирую кроссфит и силовые с 2016 года. Готовлю к соревнованиям и возвращаю после травм — аккуратно и по плану.',
  brand:{ title:'Ковальчук · Strength & Conditioning', color:'#D7FF3F', bg:'#0B0D0F', logo:'СК' }
};
/* Подписка и рабочие настройки тренера. Тарифы — заглушка до решения OQ-8:
   структура (лимит клиентов, срок, следующий платёж) реальная, цифры — нет. */
const PLANS = [
  {id:'start',  n:'Старт',  limit:10,  price:990,  d:'Для начала: до 10 клиентов'},
  {id:'pro',    n:'Тренер', limit:50,  price:2990, d:'Персональный тренер с полной базой'},
  {id:'studio', n:'Студия', limit:200, price:7990, d:'Несколько тренеров, до 200 клиентов'},
];
const SPORTS = ['Кроссфит','Тренажёрный зал','Тяжёлая атлетика','Функциональный тренинг','Бег','Плавание','Единоборства','Реабилитация'];
const PROFILE_DEF = {
  sub:{plan:'pro', until:'2026-10-12', card:'Visa •••• 4242', since:'2025-03-12'},
  prefs:{units:'кг', lang:'ru', weekStart:'пн'},
  notify:{results:true, comments:true, missed:true, programEnd:true, newClient:true, push:true, email:false},
};

/* ─── База упражнений (EX-1) · гибкие показатели (EX-3) ───
   Общая база — датасет hasaneyldrm/exercises-dataset (assets/exdb.js, собирает
   tools/exdb/build-exdb.py): 1324 упражнения с превью и GIF, мышцами и техникой
   на русском. Здесь из записи датасета получается упражнение прототипа:
   группа, оснащение и мышцы по-русски, показатели по оснащению. */
const BODY_RU = {'upper legs':'Бёдра','lower legs':'Голени','back':'Спина','chest':'Грудь','shoulders':'Плечи',
  'upper arms':'Плечо (бицепс, трицепс)','lower arms':'Предплечья','waist':'Пресс и кор','cardio':'Кардио','neck':'Шея'};
/* Группа в фильтрах и панелях — крупнее части тела. */
const BODY_G = {'upper legs':'Ноги','lower legs':'Ноги','back':'Спина','chest':'Грудь','shoulders':'Плечи',
  'upper arms':'Руки','lower arms':'Руки','waist':'Кор','cardio':'Кардио','neck':'Шея'};
const EQ_RU = {'body weight':'Своё тело','barbell':'Штанга','olympic barbell':'Штанга','ez barbell':'EZ-гриф','trap bar':'Трэп-гриф',
  'dumbbell':'Гантели','kettlebell':'Гиря','cable':'Блок','leverage machine':'Тренажёр','sled machine':'Тренажёр','smith machine':'Смит',
  'assisted':'Гравитрон','band':'Резина','resistance band':'Резина','stability ball':'Фитбол','bosu ball':'Босу','medicine ball':'Медбол',
  'weighted':'Отягощение','roller':'Ролл','wheel roller':'Ролик для пресса','rope':'Канат','hammer':'Кувалда','tire':'Покрышка',
  'upper body ergometer':'Эргометр','skierg machine':'Эргометр','stationary bike':'Велотренажёр','elliptical machine':'Эллипс','stepmill machine':'Степпер'};
const MUSCLE_RU = {'abs':'пресс','abdominals':'пресс','lower abs':'низ пресса','obliques':'косые мышцы живота','core':'мышцы кора',
  'quads':'квадрицепсы','quadriceps':'квадрицепсы','hamstrings':'бицепс бедра','glutes':'ягодичные','adductors':'приводящие','abductors':'отводящие',
  'inner thighs':'внутренняя поверхность бедра','groin':'паховые мышцы','hip flexors':'сгибатели бедра','calves':'икры','soleus':'камбаловидная',
  'shins':'голени','ankles':'голеностоп','ankle stabilizers':'стабилизаторы голеностопа','feet':'стопы',
  'lats':'широчайшие','latissimus dorsi':'широчайшие','upper back':'верх спины','lower back':'поясница','back':'спина','spine':'разгибатели спины',
  'traps':'трапеции','trapezius':'трапеции','rhomboids':'ромбовидные','levator scapulae':'мышца, поднимающая лопатку',
  'pectorals':'грудные','chest':'грудные','upper chest':'верх груди','serratus anterior':'передняя зубчатая',
  'delts':'дельты','deltoids':'дельты','shoulders':'плечи','rear deltoids':'задние дельты','rotator cuff':'вращательная манжета',
  'biceps':'бицепс','triceps':'трицепс','brachialis':'брахиалис','forearms':'предплечья','wrists':'запястья','wrist flexors':'сгибатели запястья',
  'wrist extensors':'разгибатели запястья','grip muscles':'хват','hands':'кисти','sternocleidomastoid':'грудино-ключично-сосцевидная',
  'cardiovascular system':'сердечно-сосудистая система'};
const muscleRu = m => MUSCLE_RU[m] || m;
/* Показатели по умолчанию (EX-3): со снарядом — кг и повторы, своё тело —
   повторы, удержания и растяжки — секунды, кардиотренажёры — время,
   калории и метры. Тренер меняет единицу в строке, как и раньше. */
const LOADED = new Set(['barbell','olympic barbell','ez barbell','trap bar','dumbbell','kettlebell','cable','leverage machine','sled machine',
  'smith machine','weighted','medicine ball','hammer']);
const CARDIO_EQ = new Set(['upper body ergometer','skierg machine','stationary bike','elliptical machine','stepmill machine']);
function unitsOf(en, eq){
  if(CARDIO_EQ.has(eq)) return ['сек','кал','м'];
  if(/\b(stretch|plank|hold|pose|hang)\b|wall sit/.test(en)) return ['сек'];
  if(/\b(run|walk|walking on|jog|sprint)\b/.test(en) && !/lunge/.test(en)) return ['м','сек'];
  if(eq === 'rope' && /jump rope/.test(en)) return ['повт','сек'];
  return LOADED.has(eq) ? ['кг','повт'] : ['повт'];
}
/* Ключ 1ПМ у базовых движений: максимум общий у вариаций одного движения. */
const PM_OF = {'0043':'squat','1461':'squat','1462':'squat','0042':'fsquat','0032':'dead','0025':'bench','1457':'press',
  '0648':'clean','0085':'rdl','0069':'ohsquat'};
const exFromDb = ([id, en, ru, bp, eq, tg, sec, media]) => ({id, ru, en, g:BODY_G[bp] || 'Без группы', eq:EQ_RU[eq] || eq,
  bp, tg, sec, pm:PM_OF[id] || null, u:unitsOf(en, eq), m:'ok', own:false,
  gif:EXDB_SRC.gif + id + '-' + media + '.gif', img:EXDB_SRC.img + id + '-' + media + '.jpg'});
const EX = EXDB.map(exFromDb);
/* У скакалки и каната в датасете одно оснащение — «rope». */
EX.forEach(e => { if(/jump rope/.test(e.en)) e.eq = 'Скакалка' });
/* EX-2 — собственные упражнения тренера: видны только ему и его клиентам. В
   датасете нет кроссфитовых и тяжелоатлетических движений, которыми работает
   демо-тренер, — он завёл их сам. Медиа у своих загружает тренер (m). */
EX.push(
 {id:'own_snatch',    ru:'Рывок',                       en:'Snatch',           g:'ТА',      eq:'Штанга',   pm:'snatch', u:['кг','повт'],              m:'pending', own:true},
 {id:'own_jerk',      ru:'Толчок от груди',             en:'Push Jerk',        g:'ТА',      eq:'Штанга',   pm:'jerk',   u:['кг','повт'],              m:'pending', own:true},
 {id:'own_c2b',       ru:'Подтягивания до груди',       en:'Chest-to-Bar',     g:'Кроссфит',eq:'Турник',   pm:null,     u:['повт'],                   m:'pending', own:true},
 {id:'own_ttb',       ru:'Носки к перекладине',         en:'Toes-to-Bar',      g:'Кор',     eq:'Турник',   pm:null,     u:['повт'],                   m:'ok',      own:true},
 {id:'own_du',        ru:'Двойные прыжки',              en:'Double-unders',    g:'Кроссфит',eq:'Скакалка', pm:null,     u:['повт','сек'],             m:'ok',      own:true},
 {id:'own_wb',        ru:'Wall Ball',                   en:'Wall Ball Shots',  g:'Кроссфит',eq:'Медбол',   pm:null,     u:['повт','кг'],              m:'ok',      own:true},
 {id:'own_box',       ru:'Запрыгивания на тумбу',       en:'Box Jump',         g:'Ноги',    eq:'Тумба',    pm:null,     u:['повт','высота'],          m:'ok',      own:true},
 {id:'own_ring',      ru:'Отжимания на кольцах',        en:'Ring Dip',         g:'Грудь',   eq:'Кольца',   pm:null,     u:['повт'],                   m:'ok',      own:true},
 {id:'own_row',       ru:'Гребля',                      en:'Row',              g:'Кардио',  eq:'Эргометр', pm:null,     u:['м','сек','темп','кал'],   m:'ok',      own:true},
 {id:'own_bike',      ru:'Эйрбайк',                     en:'Echo Bike',        g:'Кардио',  eq:'Эргометр', pm:null,     u:['кал','сек','мощность'],   m:'pending', own:true},
 {id:'own_plank',     ru:'Планка',                      en:'Plank',            g:'Кор',     eq:'Своё тело',pm:null,     u:['сек'],                    m:'ok',      own:true},
 {id:'own_rom',       ru:'Суставная разминка',          en:'Joint ROM',        g:'Мобилити',eq:'—',        pm:null,     u:['сек'],                    m:'ok',      own:true},
 {id:'own_couch',     ru:'Растяжка «Couch»',            en:'Couch Stretch',    g:'Мобилити',eq:'—',        pm:null,     u:['сек'],                    m:'pending', own:true},
 {id:'own_pvc',       ru:'Мобилити плеч с PVC',         en:'PVC Pass-through', g:'Мобилити',eq:'PVC',      pm:null,     u:['повт'],                   m:'ok',      own:true},
 {id:'own_copen',     ru:'Раскрытие грудного отдела',   en:'T-Spine Opener',   g:'Мобилити',eq:'Ролл',     pm:null,     u:['сек','повт'],             m:'ok',      own:true, vid:false},
 {id:'own_sled',      ru:'Толкание саней',              en:'Sled Push',        g:'Ноги',    eq:'Сани',     pm:null,     u:['м','кг','сек'],           m:'ok',      own:true},
 {id:'own_hipthrust', ru:'Ягодичный мост',              en:'Hip Thrust',       g:'Ноги',    eq:'Штанга',   pm:null,     u:['повт','кг'],              m:'ok',      own:true},
 {id:'own_facepull',  ru:'Тяга к лицу',                 en:'Face Pull',        g:'Спина',   eq:'Блок',     pm:null,     u:['повт','кг'],              m:'ok',      own:true},
);
/* Акценты тренера — его заметки к упражнению поверх техники из базы. */
const TECH = {
 '0043':'Штанга на трапеции, стопы чуть шире плеч, носки развёрнуты. Колени идут в сторону носков, спина нейтральна. Опускаться до параллели бедра с полом или ниже.',
 '0032':'Гриф над серединой стопы, лопатки над грифом. Спина прямая от начала до конца, таз и плечи поднимаются одновременно. В верхней точке не отклоняться назад.',
 '0025':'Лопатки сведены и прижаты, стопы упёрты в пол. Гриф опускается к низу груди, локти под углом 45° к корпусу.',
 '1457':'Гриф на передних дельтах, локти под грифом. Корпус жёсткий, ягодицы напряжены. Голова уходит назад, гриф идёт по прямой вверх.',
 '0648':'Старт как в становой. Разгон бёдрами, затем быстрый подсед под штангу. Локти выходят вперёд, гриф ложится на дельты.',
 '0652':'Хват чуть шире плеч, в нижней точке руки полностью выпрямлены. Подтягиваться до касания подбородком уровня перекладины.',
 '0471':'Стойка на руках у стены, ладони чуть шире плеч. Опускаться до касания головой пола, затем выжимать в исходное.',
 '0336':'Шаг вперёд, колено задней ноги почти касается пола. Корпус вертикально, гантели вдоль тела.',
 '3305':'Фронтальный присед и жим одним движением. Штанга выходит вверх на разгибании ног.',
 '1160':'Грудь касается пола, в верхней точке полное выпрямление с прыжком.',
 '0549':'Разгон гирей за счёт таза, а не рук. Спина прямая, гиря выходит на уровень глаз или выше.',
 '0042':'Гриф на передних дельтах, локти высоко. Корпус максимально вертикально, колени вперёд.',
 '0685':'Ровный темп, дыхание в ритм. Приземление под центр тяжести.',
 '0680':'Захват каната ногами, подъём за счёт ног. Спуск подконтрольный, не скользить ладонями.',
 own_snatch:'Широкий хват, гриф над серединой стопы. Плавный съём, ускорение от бедра, глубокий подсед. Штанга фиксируется на прямых руках над головой.',
 own_ttb:'Вис на прямых руках, плечи активны. Носки касаются перекладины, обратно опускаться подконтрольно, не раскачиваясь.',
 own_ring:'Кольца прижаты к корпусу, плечи ниже локтей в нижней точке. В верхней — полное выпрямление рук с разворотом колец.',
 own_bike:'Работают руки и ноги одновременно. Держать ровный темп, не срываться на первых калориях.',
 own_row:'Последовательность: ноги, корпус, руки. Возврат в обратном порядке. Спина нейтральна, тяга к низу груди.',
 own_plank:'Локти под плечами, таз не проваливается и не задирается. Ягодицы и живот напряжены, шея продолжает линию спины.',
 own_couch:'Колено у стены, стопа вверх, таз подкручен. Тянуть переднюю поверхность бедра, не прогибаясь в пояснице.',
 own_rom:'Последовательно по суставам сверху вниз: шея, плечи, локти, таз, колени, голеностоп. Без рывков.',
 own_pvc:'Широкий хват на трубе, руки прямые. Провести трубу над головой за спину и обратно, не сгибая локти.',
 own_box:'Отталкиваться двумя ногами, приземляться мягко на всю стопу. Полное выпрямление на тумбе.',
 own_wb:'Присед до параллели, бросок мяча в цель на выдохе. Ловить мяч и сразу уходить в следующий присед.',
 own_du:'Прыжок невысокий, вращение кистями, а не руками. Локти прижаты к корпусу.',
 own_c2b:'Как обычные подтягивания, но касание перекладины грудью, а не подбородком.',
 own_jerk:'Короткий подсед, мощное выталкивание, уход под штангу. Фиксация на прямых руках.',
 own_sled:'Корпус наклонён вперёд, руки прямые. Толкать ногами, шаг короткий и частый.',
 own_copen:'Ролл под лопатками, руки за головой. Прогибаться через ролл на выдохе, поясницу не включать.',
};
/* Группы и оснащение — из самой базы: что есть в упражнениях, то и в фильтрах. */
const GROUP_ORDER = ['Ноги','Спина','Грудь','Плечи','Руки','Кор','Кардио','Шея','ТА','Кроссфит','Мобилити'];
const GROUPS = ['Все', ...GROUP_ORDER.filter(g => EX.some(e => e.g === g))];
const EQUIP = (() => { const n = {}; EX.forEach(e => n[e.eq] = (n[e.eq] || 0) + 1);
  return Object.keys(n).filter(x => x !== '—').sort((a, b) => n[b] - n[a]).concat('—') })();
const byId = id => EX.find(e=>e.id===id);
const PMNAMES = {squat:'Присед',fsquat:'Фронт. присед',dead:'Становая',bench:'Жим лёжа',press:'Жим стоя',clean:'Взятие на грудь',snatch:'Рывок',jerk:'Толчок',
  rdl:'Румынская тяга',ohsquat:'Присед над головой'};

/* Синонимы — как тренер пишет в тетради: для поиска и разбора текста. */
const ALIAS = {
 '0043':['присед','приседания','присед со штангой','back squat','бэк сквот'],
 '0042':['фронтальный присед','фронт присед','фронтач','front squat'],
 '0032':['становая','становая тяга','тяга становая','deadlift'],
 '0025':['жим лежа','жим лёжа','жим штанги лежа','bench','bench press'],
 '1457':['жим стоя','жим стоя со штангой','армейский жим','strict press','military press'],
 '0648':['взятие на грудь','взятие','клин','power clean','clean'],
 own_snatch:['рывок','снэтч','snatch'], own_jerk:['толчок','швунг толчковый','push jerk','jerk'],
 '3305':['трастер','трастеры','thruster','thrusters'],
 '0652':['подтягивания','подтягивание','пулап','pull up','pullup','pull-ups'],
 own_c2b:['до груди','подтягивания до груди','c2b','chest to bar'],
 '0471':['hspu','отжимания в стойке','стойка на руках','handstand push up'],
 own_du:['двойные','двойные прыжки','дабл андеры','double unders','du'],
 own_wb:['wall ball','волбол','мяч в стену','wallball'],
 own_row:['гребля','гребной','гребем','row','rower','erg'],
 own_bike:['эйрбайк','эйр байк','байк','echo bike','assault bike'],
 '0685':['бег','пробежка','run','бегом'], '1160':['берпи','бёрпи','burpee','burpees'],
 own_box:['тумба','запрыгивания','запрыгивания на тумбу','box jump'],
 own_ttb:['носки к перекладине','ttb','toes to bar'],
 '0336':['выпады','выпады с гантелями','lunge','walking lunge'],
 '0549':['махи гирей','махи','свинг','гиря','kb swing','kettlebell swing'],
 own_ring:['кольца','отжимания на кольцах','ring dip','ring dips'],
 own_plank:['планка','plank'],
 own_rom:['суставная разминка','разминка суставов','мобилити','joint rom'],
 own_couch:['кауч','couch','couch stretch','растяжка','растяжка бедра'],
 own_pvc:['pvc','выкруты','выкруты с палкой','мобилити плеч','pass through'],
 own_sled:['сани','толкание саней','sled','sled push'],
 '0680':['канат','лазание по канату','rope climb'],
 own_copen:['раскрытие грудного','t-spine','грудной отдел'],
 '0027':['тяга в наклоне','тяга штанги в наклоне','barbell row'], '0251':['брусья','отжимания на брусьях'],
 '0198':['тяга верхнего блока','верхний блок','lat pulldown'], '0534':['гоблет','гоблет присед','goblet squat'],
 '0085':['румынская','румынская тяга','rdl'], own_hipthrust:['ягодичный мост','hip thrust'],
};

/* ─── Библиотека шаблонов (TPL) ───────────────────────────────
   Две независимые оси, которые нельзя смешивать:

   УРОВЕНЬ (TPL-2) — место в иерархии сущностей:
     упражнение → блок → тренировка → программа
   ПАПКА (TPL-1) — способ разложить БЛОКИ, потому что разминок
     у тренера много: «Разминки», «Силовые блоки», «Комплексы»,
     «Заминки». К остальным уровням папки не относятся.

   Содержимое шаблона соответствует его уровню: в неделе лежат дни,
   в тренировке — блоки, в блоке — упражнения. Иначе «достать из
   шаблона сразу неделю» физически невозможно.
   ──────────────────────────────────────────────────────────── */
const TPL_LEVELS = ['блок','тренировка','программа'];
const TPL_FOLDERS = ['Разминки','Силовые блоки','Комплексы','Заминки'];

const TPL = [
 /* ── уровень: блок — единственный уровень с папками (TPL-1) ── */
 {id:'b1', lvl:'блок', own:true, at:'2026-05-18', folder:'Разминки', kind:'warmup', title:'Общая разминка · 10 мин', used:34,
  items:[['own_rom','2×',60,'сек'],['own_pvc','2×10'],['own_row','',500,'м']]},
 {id:'b2', lvl:'блок', own:true, at:'2026-06-04', folder:'Разминки', kind:'warmup', title:'Разминка перед приседом', used:21,
  items:[['own_rom','',90,'сек'],['0043','3×5',40,'%'],['own_box','2×5']]},
 {id:'b3', lvl:'блок', own:true, at:'2026-07-15', folder:'Разминки', kind:'warmup', title:'Разминка ТА', used:12,
  items:[['own_pvc','3×10'],['own_snatch','3×3',40,'%']]},
 {id:'b4', lvl:'блок', own:true, at:'2026-06-21', folder:'Силовые блоки', kind:'strength', title:'Присед 5×3 @ 75–85 %', used:18,
  items:[['0043','5×3',80,'%'],['0336','3×10']]},
 {id:'b5', lvl:'блок', own:true, at:'2026-06-21', folder:'Силовые блоки', kind:'strength', title:'Жим + подтягивания', used:15,
  items:[['0025','5×5',75,'%'],['0652','5×8']]},
 {id:'b6', lvl:'блок', own:true, at:'2026-07-28', folder:'Силовые блоки', kind:'strength', title:'Становая 3×5 @ 70 %', used:9,
  items:[['0032','3×5',70,'%'],['own_ttb','3×12']]},
 {id:'b7', lvl:'блок', own:true, at:'2026-05-22', folder:'Комплексы', kind:'complex', title:'«Fran» · 21-15-9', used:7, fmt:'For time 8',
  items:[['3305','21-15-9',43,'кг'],['0652','21-15-9']]},
 {id:'b8', lvl:'блок', own:true, at:'2026-08-11', folder:'Комплексы', kind:'complex', title:'EMOM 12 · сила + кардио', used:11, fmt:'EMOM 12',
  items:[['0648','3',70,'%'],['own_bike','',12,'кал']]},
 {id:'b9', lvl:'блок', own:true, at:'2026-08-19', folder:'Комплексы', kind:'complex', title:'AMRAP 15 · гимнастика', used:6, fmt:'AMRAP 15',
  items:[['own_wb','',15,'повт'],['own_du','',50,'повт'],['own_box','10']]},
 {id:'b10', lvl:'блок', own:true, at:'2026-05-18', folder:'Заминки', kind:'cooldown', title:'Заминка / растяжка · 8 мин', used:29,
  items:[['own_couch','2×',90,'сек'],['own_plank','3×',45,'сек']]},
 {id:'b11', lvl:'блок', own:true, at:'2026-09-10', folder:'Силовые блоки', kind:'accessory', title:'Жим + тяга гантелей', used:4,
  items:[['@ss',4,'90 сек'],['0289','10',22.5,'кг','',1],['0293','10',22.5,'кг','',1]]},

 /* ── уровень: тренировка — внутри блоки, а не россыпь упражнений ── */
 {id:'w1', lvl:'тренировка', own:true, at:'2026-06-25', title:'Силовой день · присед + жим', used:8, blocks:['b1','b4','b5','b10']},
 {id:'w2', lvl:'тренировка', own:true, at:'2026-07-16', title:'День ТА + метком', used:5, blocks:['b3','b9']},
 {id:'w3', lvl:'тренировка', own:true, at:'2026-08-20', title:'Становая + гимнастика', used:6, blocks:['b1','b6','b8','b10']},

 /* ── уровень: программа — последовательность недель ── */
 /* seq — последовательность дней: id шаблона тренировки или null (отдых).
    Ритм задаёт тренер, длина цикла произвольная — недели в модели нет. */
 {id:'p1t', lvl:'программа', own:true, at:'2026-07-05', title:'Сила + кроссфит · 56 дней', used:3,
  goal:'Рост силовых при сохранении метконовой формы', days:56,
  seq:['w1', null,'w3', null,'w2', null, null]},
 {id:'p2t', lvl:'программа', own:true, at:'2026-08-22', title:'Возвращение после травмы · 42 дня', used:1,
  goal:'Аккуратный возврат к базовым движениям', days:42,
  seq:['w1','w2', null,'w3', null]},

 /* ── общая база сервиса: приходит из коробки, тренер её не создавал ──
    Делится тем же полем own, что и упражнения (EX): личное — own:true. ── */
 {id:'sb1', lvl:'блок', own:false, folder:'Разминки', kind:'warmup', title:'Суставная разминка · 8 мин', used:0,
  items:[['own_rom','2×',60,'сек'],['own_pvc','2×10']]},
 {id:'sb2', lvl:'блок', own:false, folder:'Разминки', kind:'warmup', title:'Кардио-разогрев · гребля', used:0,
  items:[['own_row','',750,'м'],['own_box','2×8']]},
 {id:'sb3', lvl:'блок', own:false, folder:'Силовые блоки', kind:'strength', title:'Линейная прогрессия · присед 3×5', used:0,
  items:[['0043','3×5',75,'%']]},
 {id:'sb4', lvl:'блок', own:false, folder:'Силовые блоки', kind:'strength', title:'Жим стоя 5×5', used:0,
  items:[['1457','5×5',70,'%'],['own_ttb','3×10']]},
 {id:'sb5', lvl:'блок', own:false, folder:'Комплексы', kind:'complex', title:'«Cindy» · AMRAP 20', used:0, fmt:'AMRAP 20',
  items:[['0652','5'],['0662','10'],['0043','15']]},
 {id:'sb6', lvl:'блок', own:false, folder:'Комплексы', kind:'complex', title:'«Helen»', used:0, fmt:'3 раунда на время',
  items:[['own_row','',400,'м'],['0549','21'],['0652','12']]},
 {id:'sb7', lvl:'блок', own:false, folder:'Заминки', kind:'stretch', title:'Растяжка задней цепи · 6 мин', used:0,
  items:[['own_couch','2×',60,'сек']]},

 {id:'sw1', lvl:'тренировка', own:false, title:'Базовый силовой день', used:0, blocks:['sb1','sb3','sb4','sb7']},
 {id:'sw2', lvl:'тренировка', own:false, title:'Кроссфит · классический метком', used:0, blocks:['sb2','sb5','sb7']},
 {id:'sw3', lvl:'тренировка', own:false, title:'Смешанный день · сила + Helen', used:0, blocks:['sb1','sb3','sb6','sb7']},

 {id:'sp1', lvl:'программа', own:false, title:'Линейная прогрессия · 84 дня', used:0,
  goal:'Базовая сила для новичка: присед, жим, тяга по линейной схеме', days:84,
  seq:['sw1', null,'sw2', null,'sw3', null, null]},
 {id:'sp2', lvl:'программа', own:false, title:'Кроссфит база · 56 дней', used:0,
  goal:'Общая физическая подготовка с классическими комплексами', days:56,
  seq:['sw2','sw1','sw3', null,'sw2','sw1', null]},
 {id:'sp3', lvl:'программа', own:false, title:'Гипертрофия верх/низ · 70 дней', used:0,
  goal:'Набор мышечной массы, сплит верх/низ четыре раза в неделю', days:70,
  seq:['sw1','sw2', null,'sw1','sw3', null]},
];
const tplById = id => TPL.find(t=>t.id===id);

/* Вид блока для цветной метки. У шаблонов уровня «тренировка» своего вида нет —
   день характеризует его первый неразминочный блок. Без этого метка рендерилась
   пустой: место занимала, цвета не давала. */
function tplKind(t){
  if(!t) return 'strength';
  if(t.kind) return t.kind;
  if(t.lvl==='тренировка'){
    const inner = (t.blocks||[]).map(tplById).filter(Boolean);
    return (inner.find(b=>b.kind && b.kind!=='warmup' && b.kind!=='cooldown') || inner[0] || {}).kind || 'strength';
  }
  if(t.lvl==='программа'){
    const first = (t.seq||[]).filter(Boolean).map(tplById).filter(Boolean)[0];
    return first ? tplKind(first) : 'strength';
  }
  return 'strength';
}

/* Разворачивание шаблона в рабочие сущности — уровень определяет результат */
function tplLine([ex, scheme, val, unit, txt, sub]){
  if(ex === SS_TAG) return ssItem(scheme, val);          /* [SS_TAG, круги, отдых] */
  if(ex === TXT_TAG){ const r = rawItem(scheme || ''); if(sub) r.sub = true; return r }   /* [TXT_TAG, текст] */
  if(ex === CH_TAG){ const c = chainItem((scheme || []).map(tplLine), val); if(sub) c.sub = true; return c }   /* [CH_TAG, [части], {нагрузка}] */
  const i = mkItem(ex, scheme||'');
  /* Диапазон в шаблоне — строкой «70–80». */
  const [lo, hi] = String(val ?? '').split(/[–—-]/);
  if(unit==='%'){ i.pct = parseFloat(lo); if(hi) i.pct2 = parseFloat(hi) }
  else if(val!=null && val!==''){ i.unit = unit || i.unit; i.val = hi ? lo : String(val); if(hi) i.val2 = hi }
  if(txt) i.txt = txt;
  if(sub) i.sub = true;
  return i;
}
/* Копия настройки: объект из шаблона нельзя отдавать блоку по ссылке — правка
   параметров в тренировке молча меняла бы шаблон в базе. */
const fmtCopy = f => !f ? null : typeof f === 'string' ? f : {...f};
const tplToBlock = t => normFmt({id:nid('b'), kind:t.kind||null, title:t.title.replace(/\s·.*$/,''),
                          note:'', fmt:fmtCopy(t.fmt), ...(isTextBlock(t) ? {text:t.text} : {}), items:(t.items||[]).map(tplLine)});
function tplToWorkout(t){
  return {title:t.title, blocks:(t.blocks||[]).map(id=>tplToBlock(tplById(id))).filter(Boolean)};
}
/* Последовательность дней шаблона программы в рабочем виде. */
function tplToSeq(t){
  return (t.seq||[]).map(id=>{
    if(!id) return null;
    const w = tplById(id);
    return w ? tplToWorkout(w) : null;
  });
}
/* сколько дней с тренировками и упражнений внутри — для карточек библиотеки */
function tplStats(t){
  if(t.lvl==='блок') return {n:isTextBlock(t) ? textLines(t.text).length : (t.items||[]).filter(x=>x[0]!==SS_TAG).length};
  if(t.lvl==='тренировка'){ const w=tplToWorkout(t);
    return {n:w.blocks.reduce((a,b)=>a+blockCount(b),0), blocks:w.blocks.length} }
  if(t.lvl==='программа'){ const q=tplToSeq(t);
    return {days:t.days, cycle:q.length, workouts:q.filter(Boolean).length} }
  return {n:0};
}

/* ─── Клиенты тренера (PRO-1…PRO-6, CLI-2, COM) ─── */
const CLIENTS = [
 {id:'c1', n:'Артём Ковалёв', ini:'АК', sex:'м', born:'1994-03-12', since:'2022-05-04',
  sport:'Кроссфит', level:'Продвинутый', phone:'+7 913 240-11-08', tariff:'Индивидуально', prog:'p1',
  h:182, w:84, last:'2026-08-25', done:14, plan:16, streak:6,
  pm:{squat:150,fsquat:125,dead:190,bench:110,press:70,clean:105,snatch:82,jerk:112},
  hist:{squat:[['2026-04-06',132.5],['2026-05-11',137.5],['2026-06-15',142.5],['2026-07-20',145],['2026-08-24',150]],
        dead:[['2026-04-06',170],['2026-05-11',175],['2026-06-15',180],['2026-07-20',185],['2026-08-24',190]],
        clean:[['2026-04-06',92.5],['2026-05-18',97.5],['2026-06-22',100],['2026-08-03',105]],
        bench:[['2026-04-06',100],['2026-05-25',105],['2026-07-13',107.5],['2026-08-17',110]],
        snatch:[['2026-05-18',80],['2026-07-06',85],['2026-08-31',82]]},
  pr:{ex:'squat', v:150, prev:145, at:'2026-08-24'},
  comments:[{d:'2026-08-25', ex:'Становая тяга', tx:'Последний подход шёл тяжело, поясница подгружалась. Снизить на следующей?', reply:null},
            {d:'2026-08-24', ex:null, tx:'Присед 150 — новый максимум! Последний подход дался чисто, без срыва техники.', reply:'Отлично. Ставлю новый ПМ, проценты в программе пересчитаются сами.'}],
  note:'Склонен занижать RPE. На становой контролировать поясницу.'},

 {id:'c2', n:'Мария Соловьёва', ini:'МС', sex:'ж', born:'1997-11-02', since:'2025-09-15',
  sport:'Тренажёрный зал', level:'Средний', phone:'+7 923 118-42-77', tariff:'Индивидуально', prog:'p3',
  h:168, w:59, last:'2026-08-26', done:9, plan:12, streak:3,
  pm:{squat:72.5,dead:95,bench:45,press:32.5},
  hist:{squat:[['2026-05-04',60],['2026-06-08',65],['2026-07-13',70],['2026-08-17',72.5]],
        dead:[['2026-05-04',80],['2026-06-15',85],['2026-07-20',90],['2026-08-24',95]]},
  pr:null,
  comments:[{d:'2026-08-26', ex:'Приседания со штангой', tx:'Колено немного тянет на глубоком седе. Можно заменить на что-то?', reply:null}],
  note:'После травмы колена (март 2026). Глубину седа наращивать постепенно.'},

 {id:'c3', n:'Илья Гордеев', ini:'ИГ', sex:'м', born:'1991-06-21', since:'2024-02-10',
  sport:'Кроссфит', level:'Продвинутый', phone:'+7 903 552-10-19', tariff:'Индивидуально', prog:'p2',
  h:178, w:80, last:'2026-08-20', done:7, plan:16, streak:0,
  pm:{squat:160,dead:200,bench:120,clean:110,snatch:88},
  hist:{squat:[['2026-05-04',150],['2026-06-15',155],['2026-07-20',160]],
        clean:[['2026-05-04',100],['2026-06-22',105],['2026-07-27',110]]},
  pr:null, comments:[], note:''},

 {id:'c4', n:'Дарья Лунина', ini:'ДЛ', sex:'ж', born:'1999-01-30', since:'2025-03-03',
  sport:'Кроссфит', level:'Средний', phone:'+7 913 700-88-45', tariff:'Индивидуально', prog:'p2b',
  h:171, w:63, last:'2026-08-25', done:13, plan:16, streak:5,
  pm:{squat:85,dead:110,bench:52.5,clean:62.5},
  hist:{squat:[['2026-05-04',72.5],['2026-06-15',77.5],['2026-07-20',82.5],['2026-08-24',85]]},
  pr:{ex:'squat', v:85, prev:82.5, at:'2026-08-24'},
  comments:[{d:'2026-08-25', ex:null, tx:'Комплекс зашёл, но двойные прыжки всё ещё рвут дыхание.', reply:null}], note:''},

 {id:'c5', n:'Пётр Ким', ini:'ПК', sex:'м', born:'1988-09-14', since:'2024-11-20',
  sport:'Кроссфит', level:'Начальный', phone:'+7 923 441-05-62', tariff:'Индивидуально', prog:'p2c',
  h:175, w:77, last:'2026-08-24', done:11, plan:16, streak:2,
  pm:{squat:105,dead:135,bench:75}, hist:{squat:[['2026-06-01',95],['2026-07-13',100],['2026-08-17',105]]},
  pr:null, comments:[], note:''},

 {id:'c6', n:'Никита Волков', ini:'НВ', sex:'м', born:'2001-07-08', since:'2026-08-22',
  sport:'Кроссфит', level:'Начальный', phone:'+7 913 009-77-31', tariff:'Индивидуально', prog:null,
  h:null, w:null, last:null, done:0, plan:0, streak:0,
  pm:{}, hist:{}, pr:null, comments:[], note:'Пришёл по ссылке-приглашению. Профиль не заполнен.'},
];
const client = id => CLIENTS.find(c=>c.id===id);

/* ─── Программы (сущность «программа» = последовательность недель) ─── */
const PROGRAMS = [
 /* time — час занятия. Поле у программы, а не у клиента: групповое занятие
    идёт одно на всех, и в таймлайне дня оно обязано быть одной строкой. */
 {id:'p1', title:'Сила + кроссфит', goal:'Рост силовых при сохранении метконовой формы',
  days:56, clients:['c1'], start:'2026-08-03', kind:'individual', time:'07:30'},
 {id:'p2', title:'Кроссфит · вечер', goal:'Общая база кроссфита, проценты от своих максимумов',
  days:84, clients:['c3'], start:'2026-07-20', kind:'individual', time:'18:30'},
 {id:'p2b', title:'Кроссфит · база', goal:'Та же база, старт на две недели позже',
  days:84, clients:['c4'], start:'2026-08-03', kind:'individual', time:'17:30'},
 {id:'p2c', title:'Кроссфит · техника', goal:'Акцент на технику гимнастики',
  days:84, clients:['c5'], start:'2026-07-27', kind:'individual', time:'20:00'},
 {id:'p3', title:'Возвращение после травмы', goal:'Аккуратный возврат к приседу после колена',
  days:42, clients:['c2'], start:'2026-08-10', kind:'individual', time:'11:00'},
];
const program = id => PROGRAMS.find(p=>p.id===id);

/* ═══════ Тренировки, блоки, недели ═══════ */
let uid = 0; const nid = p => p+(++uid);
/* txt — «как в тетради»: сложная запись (разный вес по подходам, дроп-сет…),
   которая не ложится в подходы×повторы + нагрузка. Заполнен txt — структурные
   поля пусты, клиент видит текст как есть. */
/* ─── СУПЕРСЕТ ───
   В плоском списке упражнений блока: строка-заголовок {ss, rounds, rest} и
   идущие за ней подряд упражнения с флагом sub. У суперсета — круги и отдых
   между кругами, у упражнения внутри — нагрузка на один круг. Плоская модель
   выбрана намеренно: все проверки «есть ли в дне упражнения» и счётчики
   работают как раньше, копирование и сохранение переносят группу без правок. */
const SS_TAG = '@ss';
const ssItem = (rounds = 3, rest = '') => ({id:nid('i'), ss:true, rounds:Math.max(1, +rounds || 3), rest:rest || '', exId:null, raw:null, scheme:'', pct:null, unit:'', val:'', txt:''});
function mkItem(exId, scheme='', pct=null, unit=null, val='', txt=''){
  const e = byId(exId);
  return {id:nid('i'), exId, raw:null, scheme, pct, unit: unit || (e ? e.u[0] : ''), val, txt: txt||''};
}
const rawItem = txt => ({id:nid('i'), exId:null, raw:txt, scheme:'', pct:null, unit:'', val:'', txt:''});
/* Строка заготовки дня: [упражнение, схема, %, единица, значение, пояснение, в суперсете].
   Кроме упражнения — [SS_TAG, круги, отдых], [TXT_TAG, текст] — строка текстом,
   [CH_TAG, [части], {n, p, u, v, of}] — связка: части с повторами, подходы и
   нагрузка — одни на всю связку. Диапазон пишется строкой: '70-80' в % или в значении. */
const RANGE_SPLIT = v => String(v).split(/\s*[–—-]\s*/);
function mkLine(a){
  if(a[0] === SS_TAG) return ssItem(a[1], a[2]);
  const sub = a[6] ? {sub:true} : {};
  if(a[0] === TXT_TAG) return Object.assign(rawItem(a[1] || ''), sub);
  if(a[0] === CH_TAG) return Object.assign(chainItem((a[1] || []).map(mkLine), a[2]), sub);
  const [p, p2] = typeof a[2] === 'string' ? RANGE_SPLIT(a[2]) : [a[2]];
  const [v, v2] = a[4] ? RANGE_SPLIT(a[4]) : [''];
  const i = mkItem(a[0], a[1] || '', p != null ? parseFloat(p) : null, a[3] || null, v || '', a[5] || '');
  if(p2) i.pct2 = parseFloat(p2);
  if(v2) i.val2 = v2;
  return Object.assign(i, sub);
}
/* items строкой — блок текстом (CON-5): текст как написан, без строк упражнений. */
const mkBlock = (kind,title,note,fmt,items) => typeof items === 'string'
  ? Object.assign(textBlock(items, title || ''), {kind:kind || null, note:note || ''})
  : ({id:nid('b'), kind, title, note:note||'', fmt:fmt||null, items:(items||[]).map(mkLine)});

/* ─── ТЕКСТ — ПОЛНОПРАВНОЕ СОДЕРЖИМОЕ (CON-5) ───
   Набранный текст хранится как написан и сам ни во что не превращается:
   строка текстом — запись с raw, блок текстом — блок с полем text. В одном
   блоке текст и строки упражнений не смешиваются: у блока текстом items пуст.
   В структуру текст переводит только кнопка AI, по просьбе тренера. День, где
   один текст, — такая же тренировка: публикуется, клиент видит текст как есть.
   Поэтому «есть ли в дне тренировка» проверяется здесь, а не по exId. */
const textBlock = (text = '', title = '') => ({id:nid('b'), kind:null, title, note:'', fmt:null, text, items:[]});
const isTextBlock = b => !!b && typeof b.text === 'string';
const textLines = t => String(t || '').split('\n').map(s => s.trim()).filter(Boolean);
/* Пункт маркированного списка в блоке текстом — строка с маркером и пробелом:
   «• » ставит кнопка «Список», «- », «– », «— » и «* » так пишут в заметках.
   Список хранится текстом, как и всё в блоке: разметки нет. */
const LIST_RE = /^[•\-–—*][ \t]+/;
/* Первая строка текста без маркера и двоеточия — подпись блока без названия. */
const firstTextLine = t => (textLines(t)[0] || '').replace(LIST_RE, '').replace(/:$/, '');
/* ─── СВЯЗКА (CON-23) ───
   Несколько упражнений подряд как один подход: «Взятие на грудь + Фронтальный
   присед + Толчок: 90 кг — 3×(1+1+1)». Штангу между частями не меняют, поэтому
   нагрузка и число подходов — одни на всю связку (sets, pct/pct2 или
   val/val2 + unit), а у частей — только упражнение и повторы (scheme).
   Процент считается от 1ПМ одного упражнения связки: of — выбранное тренером,
   пусто — самое слабое, с наименьшим 1ПМ клиента. Связка таскается,
   копируется и сохраняется целиком, как одна строка. */
const CH_TAG = '@ch';
function chainItem(parts = [], prm){
  const c = {id:nid('i'), chain:true, parts, exId:null, raw:null, scheme:'', sets:'', pct:null, unit:'', val:'', txt:'', of:null};
  if(prm) Object.assign(c, resChain(prm));
  return normChain(c);
}
/* Нагрузка связки в слепке и в заготовке: ключи пишутся, только если заданы. */
const serChain = c => ({...(c.sets ? {n:String(c.sets)} : {}), ...(c.pct != null ? {p:c.pct} : {}), ...(c.pct2 != null ? {p2:c.pct2} : {}),
  ...(c.unit ? {u:c.unit} : {}), ...(c.val ? {v:c.val} : {}), ...(c.val2 ? {v2:c.val2} : {}), ...(c.of ? {of:c.of} : {})});
const resChain = r => ({sets: r.n != null ? String(r.n) : '', pct: r.p ?? null, unit: r.u || '', val: r.v != null ? String(r.v) : '', of: r.of || null,
  ...(r.p2 != null ? {pct2:r.p2} : {}), ...(r.v2 ? {val2:String(r.v2)} : {})});
/* Связка из прежней записи, где у каждой части были свои схема и нагрузка:
   «3×1» у частей — три подхода связки, нагрузка — от первой части, у которой
   она есть. У частей остаются только повторы. */
function normChain(c){
  const ps = c.parts || [], nm = sc => String(sc || '').match(/^(\d+)\s*×\s*(\d+)$/);
  if(!c.sets){ const m = ps.map(p => nm(p.scheme)).find(Boolean); if(m) c.sets = m[1] }
  ps.forEach(p => { const m = nm(p.scheme); if(m && m[1] === c.sets) p.scheme = m[2] });
  if(c.pct == null && !c.val){
    const src = ps.find(p => p.pct != null) || ps.find(p => p.val);
    if(src && src.pct != null){ c.pct = src.pct; if(src.pct2 != null) c.pct2 = src.pct2 }
    else if(src){ c.val = src.val; c.unit = src.unit || ''; if(src.val2) c.val2 = src.val2 }
  }
  ps.forEach(p => { p.pct = null; p.unit = ''; p.val = ''; delete p.pct2; delete p.val2 });
  return c;
}
/* Упражнение связки, от 1ПМ которого считается процент: выбранное тренером,
   а по умолчанию — самое слабое из тех, чей 1ПМ клиента известен. */
const chainWeighted = c => (c.parts || []).filter(p => p.exId && pmKey(byId(p.exId)));
function chainOf(c, pm){
  const ws = chainWeighted(c); if(!ws.length) return null;
  const pick = c.of && ws.find(p => p.exId === c.of); if(pick) return pick;
  const max = p => pm ? pm[pmKey(byId(p.exId))] : null, known = ws.filter(max);
  return known.length ? known.reduce((a, p) => max(p) < max(a) ? p : a) : ws[0];
}
/* Ключ 1ПМ, от которого считается процент строки или связки. */
const pctKey = (it, pm) => it.chain ? ((p => p ? pmKey(byId(p.exId)) : null)(chainOf(it, pm))) : pmKey(it.exId && byId(it.exId));
/* «3×(1+1+1)»: подходы связки и повторы частей; без подходов — «1+1+1». */
function chainScheme(c){
  const r = (c.parts || []).filter(partHas).map(p => p.scheme || '1'), n = parseInt(c.sets) || 0;
  if(!r.length) return '';
  const body = r.length > 1 ? r.join('+') : r[0];
  return n > 1 ? n + '×' + (r.length > 1 ? '(' + body + ')' : body) : body;
}
const partHas = p => !!p && !!(p.exId || String(p.raw || '').trim());
const partName = p => p.exId ? (byId(p.exId) || {}).ru || '' : String(p.raw || '').trim();
const itemHas = y => !!y && !y.ss && (y.chain ? (y.parts || []).some(partHas) : !!(y.exId || String(y.raw || '').trim()));
const blockHas = b => !!b && (isTextBlock(b) ? textLines(b.text).length > 0 : (b.items || []).some(itemHas));
const dayHas = x => !!x && (x.blocks || []).some(blockHas);
/* Счёт записей для полосы нагрузки и сводок: упражнение, строка текстом,
   строка текстового блока. */
const blockCount = b => isTextBlock(b) ? textLines(b.text).length : (b.items || []).filter(itemHas).length;
const dayCount = x => (x.blocks || []).reduce((a, b) => a + blockCount(b), 0);
/* Подпись блока в списках: название, тип, у блока текстом — первая строка. */
const blockName = b => b.title || blockTypeLabel(b) || (isTextBlock(b) ? firstTextLine(b.text) : '');
/* Строка текстом в шаблоне блока: [TXT_TAG, текст, '', '', '', sub]. */
const TXT_TAG = '@txt';
/* Конец группы: индекс первой строки после участников суперсета с заголовком в k. */
const ssEnd = (items, k) => { let j = k + 1; while(j < items.length && items[j].sub && !items[j].ss) j++; return j };
/* Порядок в блоке: заголовок без двух участников распускается, sub без заголовка сверху снимается. */
function normSS(b){
  const src = b.items || [], out = [];
  for(let k = 0; k < src.length; k++){
    const it = src[k];
    if(it.ss){
      const j = ssEnd(src, k);
      if(j - k - 1 < 2){ for(let m = k + 1; m < j; m++) src[m].sub = false; continue }
      out.push(it); continue;
    }
    const prev = out[out.length - 1];
    if(it.sub && !(prev && (prev.ss || prev.sub))) it.sub = false;
    out.push(it);
  }
  b.items = out;
  return b;
}
const ssLabel = h => 'Сет · ' + h.rounds + ' ' + plural3(+h.rounds, 'круг', 'круга', 'кругов') + (h.rest ? ' · отдых ' + h.rest : '');
/* Заголовок суперсета в тексте: «Суперсет 3 круга», «3 круга:», «3 раза», «Суперсет ×4, отдых 90 сек»,
   перечень — в той же строке после двоеточия или следующими строками. «3 раунда на время», AMRAP,
   EMOM и табата — это настройки комплекса, не суперсет. */
function parseSSHead(text){
  let L = String(text || '').trim();
  if(!L || /на\s*время|for\s*time|amrap|emom|табат|tabata|кажд/i.test(L)) return null;
  let list = '';
  const ci = L.search(/(?<!\d):|:(?!\d)/);           /* двоеточие в «1:30» — время, не перечень */
  if(ci >= 0){ list = L.slice(ci + 1).trim(); L = L.slice(0, ci).trim() }
  let rest = '';
  const mr = L.match(/[,;]?\s*отдых\s*(?:между\s*круг[а-яё]*\s*)?(\d+:\d{2}|\d+(?:[.,]\d+)?\s*(?:сек|мин|с|м)[а-яё]*\.?)\s*$/i);
  if(mr){ rest = mr[1].trim(); L = L.slice(0, mr.index).trim() }
  L = L.replace(/[,;.\s]+$/, '');
  const m = L.match(/^(?:(?:супер)?сет\s*[x×х]?\s*)?(\d{1,2})\s*(?:раза?|круг[а-яё]*|раунд[а-яё]*)$/i)
         || L.match(/^(?:супер)?сет(?:\s*[x×х]\s*(\d{1,2}))?$/i);
  if(!m) return null;
  const items = list ? list.split(/\s*;\s*|,\s+/).map(t => t.replace(/^[-–—•*]\s*/, '').trim()).filter(Boolean) : [];
  return {rounds: m[1] ? +m[1] : 3, rest, list: items};
}

/* Недельный рисунок программы: 7 дней, null = отдых */
/* ─── Фактически записанные результаты (CLI-2) ───
   Это ФАКТ, а не назначение. Тренер написал 157,5 — атлет поднял 155,
   и в истории лежит 155. Разница между планом и фактом — единственное,
   ради чего эту строку вообще показывают: по ней видно, идти вверх
   или задержаться. Источник для графика в профиле (PRO-6). */
const LOG = [
  {date:'2026-08-12', cid:'c1', exId:'0032',  scheme:'3×5',  kg:130},
  {date:'2026-08-12', cid:'c1', exId:'0032',  scheme:'2×3',  kg:150},
  {date:'2026-08-12', cid:'c1', exId:'own_ttb',   scheme:'4×12', kg:null, done:'4×9'},
  {date:'2026-08-19', cid:'c1', exId:'0032',  scheme:'3×5',  kg:132.5},
  {date:'2026-08-19', cid:'c1', exId:'0032',  scheme:'2×3',  kg:155},
  {date:'2026-08-19', cid:'c1', exId:'own_ttb',   scheme:'4×12', kg:null, done:'4×10'},
  {date:'2026-08-19', cid:'c1', exId:'own_ring',  scheme:'4×8',  kg:null, done:'4×8'},
  {date:'2026-08-19', cid:'c1', exId:'0471',  scheme:'4×6',  kg:null, done:'4×5'},
];
/* Последний факт по упражнению строго раньше указанной даты.
   Одно упражнение может стоять в тренировке дважды с разными схемами
   (3×5 разминочные и 2×3 рабочие) — сначала ищем совпадение по схеме. */
function lastResult(cid, exId, before, scheme){
  const rows = LOG.filter(r=>r.cid===cid && r.exId===exId && r.date < before)
                  .sort((a,b)=> a.date < b.date ? 1 : -1);
  return rows.find(r=>r.scheme===scheme) || rows[0] || null;
}

/* ─── Комментарии (COM-1, COM-2, COM-4) ───
   Чата в продукте нет: комментарий всегда прикреплён к объекту —
   к тренировке или к упражнению, — и тренер отвечает в той же ветке.
   Ветка при упражнении живёт дольше одной тренировки. */
/* Ключ переписки — пара «клиент + объект», а не объект сам по себе.
   Программу назначают нескольким клиентам, и всё, что относится к
   выполнению — блоки, схемы, заметки о технике, — едет с ней. А всё,
   что адресовано человеку, остаётся при человеке: «сбрось до 140»
   написано Артёму про его спину, Пете это показывать нельзя. */
const talkKey = (cid, x) => cid + '@' + x;
const TALK = {
  workout: {
    'c1@2026-08-26': [
      {who:'trainer', text:'Становую сегодня не гони — работаем в технике. Если спина круглится, сбрось до 140 и добери объёмом.', at:'вчера, 21:14'}
    ]
  },
  item: {
    'c1@0032': [
      {who:'client',  text:'Спина подкруглилась на последнем подходе', at:'19 авг'},
      {who:'trainer', text:'Видел на видео. Ставлю 155 и не больше — следим за поясницей.', at:'19 авг'}
    ]
  }
};

/* ═══════ Заготовки дней программы ═══════
   Раньше это был «недельный рисунок» — семь ячеек по дням недели. Недели в
   модели больше нет: здесь просто набор дней, из которых собирается план
   (см. PLAN ниже). У разных программ их разное число — семидневность больше
   ничего не значит. */
const DAYS = {
 p1:[
  {t:'Сила · присед + жим', b:[
    ['warmup','Разминка','Темп спокойный, без отказа',null,[['own_rom','2×',null,'сек','60'],['own_pvc','2×10'],['own_row',null,null,'м','500']]],
    ['strength','Присед','Пауза 1 сек в нижней точке',null,[['0043','5×3',80],['0043','1×3',85]]],
    ['strength','Жим лёжа + подтягивания','',null,[['@ss',5,'90 сек'],['0025','5',75,null,'','',1],['0652','8',null,null,'','',1]]],
    ['cooldown','Заминка','',null,[['own_couch','2×',null,'сек','90']]]]},
  {t:'Комплекс «Fran»', b:[
    ['warmup','Разминка','',null,[['own_rom','2×',null,'сек','60'],['1160','2×8']]],
    ['complex','«Fran» 21-15-9','Цель — sub 5:00','For time 8',[['3305','21-15-9',null,'кг','43'],['0652','21-15-9']]]]},
  {t:'Сила · становая + гимнастика', b:[
    ['warmup','Разминка','Мобилити т/б сустава',null,[['own_rom','2×',null,'сек','90'],['own_row',null,null,'кал','15'],['own_pvc','2×10']]],
    ['strength','Становая тяга','Каждый подход с пола, сброс',null,[['0032','3×5',70],['0032','2×3',82.5]]],
    ['complex','EMOM 12','Нечётные — взятие, чётные — эйрбайк','EMOM 12',[['0648','3',70],['own_bike',null,null,'кал','12']]],
    ['gymnastics','Гимнастика','',null,[['own_ttb','4×12'],['own_ring','4×8'],['0471','4×6']]],
    ['cooldown','Заминка','',null,[['own_plank','3×',null,'сек','45'],['own_couch','2×',null,'сек','90']]]]},
  null,
  {t:'ТА + метком', b:[
    ['warmup','Разминка ТА','',null,[['own_pvc','3×10'],['own_snatch','3×3',40]]],
    ['strength','Рывок','На технику, вес не выше 80 %',null,[['own_snatch','6×2',75]]],
    ['complex','AMRAP 15','','AMRAP 15',[['own_wb','15',null,'повт','15'],['own_du',null,null,'повт','50'],['own_box','10']]]]},
  {t:'Длинное кардио', b:[
    [null,'Аэробная база','Пульс 140–150',null,[['0685',null,null,'м','5000'],['own_row',null,null,'м','2000']]]]},
  null],
 p2:[
  {t:'Сила · нижняя часть', b:[
    ['warmup','Разминка','',null,[['own_rom','2×',null,'сек','60'],['own_box','2×5']]],
    ['strength','Присед','Проценты индивидуальные',null,[['0043','5×5',75]]],
    ['strength','Тяга саней','',null,[['own_sled','4×',null,'м','20']]]]},
  {t:'Метком', b:[
    ['complex','EMOM 12','','EMOM 12',[['0549','12',null,'кг','24'],['1160','10']]]]},
  {t:'Восстановление · мобилити', b:[
    ['warmup','Мобилити','Лёгкая аэробная работа',null,[['own_copen','3×',null,'сек','45'],['own_pvc','3×10'],['own_row',null,null,'м','2000']]]]},
  {t:'Сила · верх тела', b:[
    ['warmup','Разминка','',null,[['own_pvc','3×10']]],
    ['strength','Жим лёжа','',null,[['0025','5×5',75]]],
    ['strength','Подтягивания + канат','',null,[['0652','5×8'],['0680','4×1']]]]},
  {t:'Комплекс', b:[
    ['complex','AMRAP 15','','AMRAP 15',[['3305','12',null,'кг','40'],['own_c2b','9'],['own_du',null,null,'повт','40']]]]},
  {t:'Открытая тренировка', b:[
    [null,'Аэробная работа','',null,[['own_row',null,null,'м','3000'],['own_bike',null,null,'кал','40']]]]},
  null],
 p3:[
  {t:'Ноги · щадяще', b:[
    ['warmup','Разминка','Особое внимание колену',null,[['own_rom','3×',null,'сек','60'],['own_copen','2×',null,'сек','45']]],
    ['strength','Присед в частичной амплитуде','До боли не доводить',null,[['0043','4×6',60]]],
    ['cooldown','Заминка','',null,[['own_couch','2×',null,'сек','90']]]]},
  null,
  {t:'Верх тела', b:[
    ['warmup','Разминка','',null,[['own_pvc','3×10']]],
    ['strength','Жим + тяга','',null,[['0025','4×8',65],['0652','4×6']]]]},
  null,
  {t:'Полное тело', b:[
    ['complex','Круговая','Без ударной нагрузки на колено',null,[['0032','4×6',65],['own_plank','3×',null,'сек','45'],['own_row',null,null,'м','1000']]]]},
  null,null],
};
/* Докуда программа реально составлена (дальше — пустые недели, сигнал на дашборде) */
/* ═══════ План программы: упорядоченная последовательность дней ═══════
   Ключевое отличие от прежней модели: недели нет. Программа — плоский список
   дней, каждый либо тренировка, либо отдых. Длина списка и есть «докуда
   составлено», а порядок задаёт тренер: нужный набор тренировок в любой
   последовательности, а не заполнение жёсткой решётки по семь дней.

   Планы ниже собраны из заготовок DAYS, чтобы наполнение демо-данных не
   потерялось при переходе. p3 намеренно нерегулярный — так видно, что ритм
   больше не обязан быть семидневным. */
const rep = (seq, times) => Array.from({length:times}, () => seq).flat();
const PLAN = {
  p1: rep(DAYS.p1, 5),
  p2: rep(DAYS.p2, 6),
  p2b: rep(DAYS.p2, 5),
  p2c: rep(DAYS.p2, 6),
  /* Возврат после травмы: нагрузка через день, паузы длиннее — цикл не равен
     неделе, и в старой модели это было невыразимо. */
  p3: [...rep(DAYS.p3, 4), DAYS.p3[0], null, null, DAYS.p3[1], null, null],
};

/* Дата дня плана: отсчёт от старта программы, без всякой недельной арифметики. */
const dayDate = (pid, i) => addDays(program(pid).start, i);
const composedDays = pid => (PLAN[pid] || []).length;

/* Один день плана в рабочем виде — для конструктора. */
function buildDay(pid, i){
  const d = (PLAN[pid] || [])[i];
  const date = dayDate(pid, i);
  const base = {i, date, w: RU[dowMon(date)], d: dm(date)};
  if(!d) return {...base, title:'Отдых', rest:true, comp:false, g:null, blocks:[]};
  /* g — группа, из которой пришла тренировка (GRP-3); у своих дней клиента его нет. */
  return {...base, title:d.t, rest:false, comp:!!d.comp, g:d.g || null, blocks:d.b.map(b=>normFmt(mkBlock(b[0],b[1],b[2],b[3],b[4])))};
}
/* ═══════ Черновики и публикация ═══════
   День, который тренер правил в конструкторе и не «добавил», — черновик: он
   лежит в STATE.days[pid][i] и переживает уход со страницы. У каждого дня есть
   pub — слепок опубликованного содержимого; расхождение с ним и есть
   «незаконченная тренировка». Дни из заготовок программы считаются
   опубликованными: их видит клиент. */
/* Пустые блоки без названия и заметки в слепок не входят: конструктор заводит
   такой блок на каждом открытом пустом дне, и без этого правила любой клик
   по дню помечал бы его черновиком. */
/* Текст блока (tx) пишется только у блока текстом: у остальных слепок не
   меняется, и опубликованные дни не становятся черновиками сами собой. */
/* Пустая строка ввода — место, куда печатать, а не содержимое: в слепок она
   не идёт, иначе день с одной заготовкой считался бы изменённым. */
const serItems = b => (b.items||[]).filter(it => it.ss || it.chain || it.exId || String(it.raw||'').trim());
/* Название по умолчанию «Блок 1», «Блок 2»… (быстрый старт конструктора) — не
   своё название: пустой блок с ним в слепок не идёт, как и пустой без названия. */
const AUTO_TITLE = /^Блок \d+$/;
const ownTitle = b => !!b.title && !AUTO_TITLE.test(b.title);
const serializeDay = x => JSON.stringify({t: x.title||'', ...(x.comp ? {c:1} : {}), b: (x.blocks||[]).filter(b=>serItems(b).length || ownTitle(b) || b.note || String(b.text||'').trim()).map(b=>({k:b.kind, t:b.title||'', n:b.note||'', f:b.fmt||null,
  ...(isTextBlock(b) ? {tx:b.text} : {}),
  i:serItems(b).map(it=> it.ss ? {ss:1, n:it.rounds, z:it.rest||''}
    : it.chain ? {ch:(it.parts||[]).map(serItem), ...serChain(it), ...(it.sub ? {g:1} : {})}
    : {...serItem(it), ...(it.sub ? {g:1} : {})})}))});
/* Строка в слепке. Верхняя граница диапазона (p2, v2) пишется, только если
   задана: слепки прежних дней не меняются, опубликованное не становится
   изменённым само собой. Та же форма — у части связки (ch). */
function serItem(it){ return {e:it.exId||null, r:it.raw||null, s:it.scheme||'', p:it.pct??null, u:it.unit||'', v:it.val||'', x:it.txt||'',
  ...(it.pct2 != null ? {p2:it.pct2} : {}), ...(it.val2 ? {v2:it.val2} : {})} }
function resItem(it){ return {id:nid('i'), exId:it.e||null, raw:it.r||null, scheme:it.s||'', pct:it.p??null, unit:it.u||'', val:it.v||'', txt:it.x||'',
  ...(it.p2 != null ? {pct2:it.p2} : {}), ...(it.v2 ? {val2:it.v2} : {})} }
const restoreBlocks = rec => (rec.b||[]).map(b=>normFmt({id:nid('b'), kind:b.k||null, title:b.t||'', note:b.n||'', fmt:b.f||null,
  ...(typeof b.tx === 'string' ? {text:b.tx} : {}),
  items:(b.i||[]).map(it=> it.ss ? ssItem(it.n, it.z)
    : Object.assign(it.ch ? chainItem(it.ch.map(resItem), it) : resItem(it), it.g ? {sub:true} : {}))}));
/* Слепок со связкой прежнего вида пересобирается в нынешний: иначе
   опубликованный день сам собой стал бы «изменённым». */
const reserDay = s => { if(!s || !s.includes('"ch":')) return s; const c = JSON.parse(s); return serializeDay({title:c.t, comp:c.c, blocks:restoreBlocks(c)}) };
const savedDay = (pid,i) => ((STATE.days||{})[pid]||{})[i] || null;
/* Черновики могут лежать за концом заготовок — план дотягиваем до них. */
function planLength(pid){
  const saved = Object.keys((STATE.days||{})[pid]||{}).map(Number);
  return Math.max((PLAN[pid]||[]).length, saved.length ? Math.max(...saved)+1 : 0);
}
function buildPlan(pid){
  const n = planLength(pid);
  while((PLAN[pid] ||= []).length < n) PLAN[pid].push(null);
  return PLAN[pid].map((_,i)=>{
    const x = buildDay(pid,i), rec = savedDay(pid,i);
    if(rec && rec.c){ const c = JSON.parse(rec.c); x.title = c.t; x.blocks = restoreBlocks(c); x.rest = !x.blocks.length; x.comp = !!c.c; x.g = rec.g || null; }
    x.pub = rec && !rec.draft ? reserDay(rec.c) : (rec ? reserDay(rec.pub||'') : serializeDay(x));
    x.draft = !!(rec && rec.draft);
    return x;
  });
}

/* ═══════ Расчёт нагрузки (CON-16): проценты → рабочий вес ═══════ */
/* Схема назначения превращается в подходы: «3×5» — три по пять,
   «2×» — два без повторов, «21-15-9» — три с разным числом. Это домен,
   а не оформление: одинаково нужно и журналу, и мастеру. */
function buildSets(item, pm){
  const kg = workKg(item, pm);
  const sc = item.scheme || '';
  let rounds = 1, reps = null;
  let m;
  if((m = sc.match(/^(\d+)\s*×\s*(\d+)$/))) { rounds = +m[1]; reps = +m[2] }
  else if((m = sc.match(/^(\d+)\s*×$/)))    { rounds = +m[1] }
  else if(/^\d+(-\d+)+$/.test(sc))          { const l = sc.split('-').map(Number);
                                              return l.map((r,i)=>({n:i+1, kg, reps:r, unit:'кг',
                                                val:item.val||null, done:false, actKg:null, actRep:null})) }
  else if(/^\d+$/.test(sc))                 { reps = +sc }
  const out = [];
  for(let i=0;i<Math.max(1,rounds);i++)
    out.push({n:i+1, kg, reps, unit: kg!=null?'кг':(item.unit||''),
              val: kg!=null?null:(item.val||null), done:false, actKg:null, actRep:null});
  return out;
}

/* Ключ максимума: у базовых движений он общий (присед — для всех вариантов
   с ключом squat), у остальных упражнений с весом — их собственный id. Так
   «% от ПМ» доступен для любого упражнения со штангой или гантелями. */
const pmKey = e => e ? (e.pm || ((e.u||[]).includes('кг') ? e.id : null)) : null;
function workKg(item, pm){
  const src = item.chain ? chainOf(item, pm) : item, e = src && src.exId && byId(src.exId);
  const k = pmKey(e);
  if(!k || item.pct == null || !pm) return null;
  const max = pm[k];
  if(!max) return null;
  return Math.round(max * item.pct / 100 / 2.5) * 2.5;
}
const fmtNum = v => String(v).replace('.', ',');
/* ─── ДИАПАЗОН НАГРУЗКИ (CON-24) ───
   Нагрузка бывает не числом, а «от–до»: «70–80 %», «60–70 кг». Верхняя
   граница — pct2 или val2; пусто — нагрузка одним числом. Рабочий вес
   считается для обеих границ. */
const RNG = '–';
const loadText = it => it.pct != null ? fmtNum(it.pct) + (it.pct2 != null ? RNG + fmtNum(it.pct2) : '') + '\u00a0%'
  : it.val ? fmtNum(it.val) + (it.val2 ? RNG + fmtNum(it.val2) : '') + (it.unit ? '\u00a0' + it.unit : '') : '';
function kgText(item, pm){
  const lo = workKg(item, pm); if(lo == null) return null;
  const hi = item.pct2 != null ? workKg({...item, pct:item.pct2}, pm) : null;
  return fmtNum(lo) + (hi != null && hi !== lo ? RNG + fmtNum(hi) : '');
}

/* Формат комплекса (EMOM 12, AMRAP 15) — часть содержания тренировки */
/* Формат живёт в НАЗВАНИИ блока, а не в отдельном поле: по TMR-1 тренер
   его просто пишет («EMOM 12»), а парсер узнаёт. Название может нести и
   имя комплекса — «"Fran" · For time 8», — поэтому пробуем каждую часть,
   разделённую точкой, и только потом строку целиком. */
function fmtPart(txt){
  const t = String(txt||'').trim();
  return t.split(/\s*·\s*/).find(p=>parseFmt(p)) || (parseFmt(t) ? t : null);
}
const findFmt = txt => parseFmt(fmtPart(txt));
/* Разовая нормализация: в данных формат лежал отдельным полем — переносим
   его в название, чтобы источник остался один. */
function fmtIntoTitle(b){
  if(b.fmt && !fmtPart(b.title)) b.title = b.title ? b.title + ' · ' + b.fmt : b.fmt;
  b.fmt = fmtPart(b.title);
  return b;
}

const mmssRaw = t => Math.floor(t/60)+':'+String(Math.round(t)%60).padStart(2,'0');
function parseFmt(s){
  if(!s) return null;
  const t = s.trim(); let m;
  /* src — что именно совпало: по нему формат вырезается из названия блока,
     когда становится типом. */
  if((m=t.match(/^EMOM\s*(\d+)/i)))       return {src:m[0],k:'EMOM',rounds:+m[1],work:60,rest:0,total:+m[1]*60};
  if((m=t.match(/^E(\d+)MOM\s*(\d+)/i)))  return {src:m[0],k:'EMOM',rounds:+m[2],work:+m[1]*60,rest:0,total:+m[2]*+m[1]*60};
  if((m=t.match(/^AMRAP\s*(\d+)/i)))      return {src:m[0],k:'AMRAP',rounds:1,work:+m[1]*60,rest:0,total:+m[1]*60};
  if((m=t.match(/^(?:TABATA|табата)\w*/i))) return {src:m[0],k:'TABATA',rounds:8,work:20,rest:10,total:240};
  if((m=t.match(/^(\d+)\s*(?:RFT|раунд[а-яё]*\s*на\s*время|rounds?\s*for\s*time)\s*(\d+)?/i)))
    return {src:m[0],k:'FOR TIME',rounds:+m[1],work:0,rest:0,total:m[2]?+m[2]*60:0};
  if((m=t.match(/^FOR\s*TIME\s*(\d+)?/i)))return {src:m[0],k:'FOR TIME',rounds:1,work:0,rest:0,total:m[1]?+m[1]*60:0};
  if((m=t.match(/^(?:death\s*by|дез\s*бай)\s*(\d+)?/i))) return {src:m[0],k:'DEATH BY',rounds:0,work:(+m[1]||1)*60,rest:0,total:0,start:1};
  if((m=t.match(/^(?:not\s*for\s*time|не\s*на\s*время|NFT)/i))) return {src:m[0],k:'NFT',rounds:1,work:0,rest:0,total:0};
  if((m=t.match(/(\d+)\s*(?:rounds?|раунд\w*)\D+(\d+)\s*(?:sec|сек)\D+(\d+)\s*(?:sec|сек)/i)))
    return {src:m[0],k:'ИНТЕРВАЛЫ',rounds:+m[1],work:+m[2],rest:+m[3],total:+m[1]*(+m[2]+ +m[3])};
  /* Русские формулировки. В TMR-1 оба примера англоязычные, но тренер
     пишет по-русски — «каждые 90 секунд», «5 раундов по 3 минуты». Без
     этих шаблонов он не получал таймер и не понимал почему.
     ВНИМАНИЕ: \w в JS — это [A-Za-z0-9_], кириллицу он не берёт. Окончания
     ловим явным [а-яё]*, иначе «раундов» не съедается после «раунд». */
  if((m=t.match(/кажд[а-яё]*\s*(\d+)\s*(сек|мин)[а-яё]*\D+(\d+)\s*(?:раунд|круг|повтор)[а-яё]*/i))){
    const w = m[2].toLowerCase()==='мин' ? +m[1]*60 : +m[1];
    return {src:m[0],k:'EMOM',rounds:+m[3],work:w,rest:0,total:+m[3]*w};
  }
  if((m=t.match(/(\d+)\s*(?:раунд|круг)[а-яё]*\s*по\s*(\d+)\s*(мин|сек)[а-яё]*(?:[^\d]*отдых\D*?(\d+)\s*(мин|сек)[а-яё]*)?/i))){
    const sec = (v,u) => u && u.toLowerCase()==='мин' ? +v*60 : +v;
    const w = sec(m[2], m[3]), r = m[4] ? sec(m[4], m[5]) : 0;
    return {src:m[0],k: r ? 'ИНТЕРВАЛЫ' : 'РАУНДЫ', rounds:+m[1], work:w, rest:r, total:+m[1]*(w+r)};
  }
  if((m=t.match(/^на\s*время\s*(\d+)?/i)))
    return {src:m[0],k:'FOR TIME',rounds:1,work:0,rest:0,total:m[1]?+m[1]*60:0};
  return null;
}
/* ═══════ Тип блока и настройка комплекса ═══════
   Блок и комплекс — не синонимы: комплекс — один из типов блока. Тип — явное
   поле блока (kind), по умолчанию его нет. Настройка (fmt: AMRAP, EMOM, на
   время…) бывает только у комплекса. Набранное в названии «AMRAP 15»
   распознаётся, переезжает в настройку и делает блок комплексом. */
const BLOCK_TYPES = [
  {k:null,         n:'без типа'},
  {k:'warmup',     n:'Разминка'},
  {k:'strength',   n:'Силовая'},
  {k:'complex',    n:'Комплекс'},
  {k:'cooldown',   n:'Заминка'},
  {k:'stretch',    n:'Растяжка'},
  {k:'accessory',  n:'Подкачка'},
  {k:'gymnastics', n:'Гимнастика'},
];
const typeName = k => (BLOCK_TYPES.find(t => t.k === (k || null)) || BLOCK_TYPES[0]).n;
/* Подпись типа для метки в шапке и карточек: «Разминка», «Комплекс · AMRAP 15»; без типа — пусто. */
const blockTypeLabel = b => !b || !b.kind || !BLOCK_TYPES.some(t => t.k === b.kind) ? ''
  : b.kind === 'complex' && b.fmt && typeof b.fmt === 'object' ? 'Комплекс · ' + fmtLabel(b.fmt) : typeName(b.kind);
/* Подпись типа рядом с названием — только если название его не называет:
   «Разминка ТА» не нужно подписывать «Разминка», а ««Fran»» — «Комплекс · На время». */
const typeNote = b => { const l = blockTypeLabel(b); if(!l || !b.title) return l;
  return typeOfTitle(b.title) === b.kind && !(b.kind === 'complex' && b.fmt) ? '' : l };
/* Папка базы, в которую блок ложится по типу. */
const TYPE_FOLDER = {warmup:'Разминки', strength:'Силовые блоки', complex:'Комплексы', cooldown:'Заминки',
                     stretch:'Заминки', accessory:'Силовые блоки', gymnastics:'Силовые блоки'};
/* Тип по слову в названии: «Разминка ТА» — разминка. Только явные слова; если
   их несколько, решает первое. \b кириллицу не видит — границу слова задаём сами. */
const TYPE_WORDS = [['warmup','разминк'], ['strength','силов'], ['complex','комплекс'], ['cooldown','заминк'],
                    ['stretch','растяжк'], ['accessory','подкачк'], ['gymnastics','гимнастик']];
function typeOfTitle(title){
  const t = ' ' + String(title || '').toLowerCase().replace(/ё/g, 'е');
  let best = null, at = Infinity;
  for(const [k, w] of TYPE_WORDS){ const m = t.match(new RegExp('[^а-я]' + w)); if(m && m.index < at){ best = k; at = m.index } }
  return best;
}
const FMT_TYPES = [
  {k:null,       n:'без настройки'},
  {k:'AMRAP',    n:'AMRAP',        d:{rounds:1,work:900,rest:0,total:900}},
  {k:'EMOM',     n:'EMOM',         d:{rounds:12,work:60,rest:0,total:720}},
  {k:'FOR TIME', n:'На время',     d:{rounds:1,work:0,rest:0,total:0}},
  {k:'TABATA',   n:'Табата',       d:{rounds:8,work:20,rest:10,total:240}},
  {k:'ИНТЕРВАЛЫ',n:'Интервалы',    d:{rounds:4,work:180,rest:60,total:960}},
  {k:'DEATH BY', n:'Death by',     d:{rounds:0,work:60,rest:0,total:0,start:1}},
  {k:'NFT',      n:'Не на время',  d:{rounds:1,work:0,rest:0,total:0}},
];
const plural3 = (n,a,b,c) => { const m=n%10, h=n%100; return h>=11&&h<=14 ? c : m===1 ? a : m>=2&&m<=4 ? b : c };
const mmssShort = s => s%60 ? mmssRaw(s) : String(s/60);
/* Короткая подпись типа — для чипа в шапке блока и карточек. */
function fmtLabel(f){
  if(!f) return '';
  switch(f.k){
    case 'AMRAP':     return 'AMRAP ' + mmssShort(f.total);
    case 'EMOM':      return (f.work===60 ? 'EMOM ' : 'E' + mmssShort(f.work) + 'MOM ') + f.rounds;
    case 'FOR TIME':  return (f.rounds>1 ? f.rounds+' '+plural3(f.rounds,'раунд','раунда','раундов')+' на время' : 'На время') + (f.total ? ' · до '+mmssShort(f.total)+' мин' : '');
    case 'TABATA':    return `Табата ${f.rounds} × ${f.work}/${f.rest}`;
    case 'ИНТЕРВАЛЫ': return `${f.rounds} × ${mmssRaw(f.work)} / ${mmssRaw(f.rest)}`;
    case 'РАУНДЫ':    return `${f.rounds} × ${mmssRaw(f.work)}`;
    case 'DEATH BY':  return 'Death by · ' + mmssRaw(f.work);
    case 'NFT':       return 'Не на время';
  }
  return f.k;
}
/* Что увидит клиент: расшифровка типа человеческим языком. */
function fmtDesc(f){
  if(!f) return '';
  switch(f.k){
    case 'AMRAP':     return 'максимум раундов за ' + mmssRaw(f.total);
    case 'EMOM':      return 'каждые ' + mmssRaw(f.work) + ' новый подход, ' + f.rounds + ' раз · всего ' + mmssRaw(f.total);
    case 'FOR TIME':  return (f.rounds>1 ? f.rounds+' '+plural3(f.rounds,'раунд','раунда','раундов')+' как можно быстрее' : 'как можно быстрее') + (f.total ? ', лимит ' + mmssRaw(f.total) : '');
    case 'TABATA':
    case 'ИНТЕРВАЛЫ': return f.rounds + ' × ' + mmssRaw(f.work) + ' работы через ' + mmssRaw(f.rest) + ' отдыха';
    case 'РАУНДЫ':    return f.rounds + ' × ' + mmssRaw(f.work);
    case 'DEATH BY':  return 'каждые ' + mmssRaw(f.work) + ' на один повтор больше — до отказа';
    case 'NFT':       return 'без таймера, на качество';
  }
  return '';
}
/* Вырезать формат из названия: «EMOM 12 · сила + кардио» → «сила + кардио». */
function stripFmt(title){
  return String(title||'').split(/\s*·\s*/).map(seg => {
    const f = parseFmt(seg); if(!f || RE_SCHEME.test(seg)) return seg;
    return seg.replace(f.src,'').replace(/^[\s:\-–—,]+|[\s:\-–—,]+$/g,'').trim();
  }).filter(Boolean).join(' · ');
}
/* Нормализация блока: строковый fmt из старых данных → объект; формат из
   названия → тип, название очищается. Одно место истины — b.fmt. */
function normFmt(b){
  if(typeof b.fmt === 'string') b.fmt = parseFmt(b.fmt) || null;
  const fromTitle = findFmt(b.title);
  if(!b.fmt && fromTitle) b.fmt = fromTitle;
  if(fromTitle) b.title = stripFmt(b.title);
  if(b.fmt) delete b.fmt.src;
  /* Старый вид «metcon» — это комплекс; настройка бывает только у комплекса. */
  if(b.kind && !BLOCK_TYPES.some(t => t.k === b.kind)) b.kind = b.kind === 'metcon' ? 'complex' : null;
  if(b.fmt) b.kind = 'complex';
  return b;
}

/* ═══════ Текст → структура (CON-5, OQ-10) ═══════
   Работает только по кнопке AI и при выборе из подсказки: набранный текст
   сам по себе не разбирается. В продукте это первый проход перед моделью —
   правила узнают обычную нотацию, модель берёт остальное. */
const norm = s => s.toLowerCase().replace(/[ёë]/g,'е').replace(/[^a-zа-я0-9 ]/gi,' ').replace(/\s+/g,' ').trim();
const CAND = EX.map(e=>({e, c:[e.ru, e.en, ...(ALIAS[e.id]||[])].map(norm).filter(Boolean)}));
function sharedPrefix(a,b){ const L=Math.min(a.length,b.length); let i=0; while(i<L && a[i]===b[i]) i++; return i>=Math.ceil(L*.6)?i:0 }
function matchEx(text){
  const n = norm(text); if(!n) return null;
  const qt = n.split(' ').filter(t=>t.length>=3);
  let best=null, score=0;
  for(const {e,c} of CAND){
    let s=0;
    for(const cand of c){
      if(!cand) continue;
      if(n===cand){ s=Math.max(s,100+cand.length); continue }
      if(n.includes(cand)){ s=Math.max(s,40+cand.length); continue }
      const ct = cand.split(' ').filter(t=>t.length>=3);
      if(!ct.length||!qt.length) continue;
      let hit=0;
      for(const w of ct){ for(const q of qt){ if(q===w||sharedPrefix(q,w)>=4){ hit++; break } } }
      if(hit) s = Math.max(s, hit*6*(hit/ct.length));
    }
    if(s>score){ score=s; best=e }
  }
  return score>=6 ? best : null;
}
/* Уверенность разбора (CON-5). Строку отдаём упражнению, только если все её
   слова покрыты названием или синонимом из базы; опечатку прощаем, если
   совпадает начало слова. «Выпады с блином по самочувствию» похоже на
   «Выпады с гантелями», но блин и самочувствие названием не покрыты — такая
   строка остаётся текстом. Лучше честный текст, чем правдоподобная подмена:
   ради этого автоматический разбор и заменили кнопкой AI. */
const FILLER = new Set(['по','на','с','со','в','во','и','к','до','от','за','из','для','x','х','rpe','rir','повт','раз','подх','подхода','подходов',
  'мин','минут','минуты','сек','секунд','м','км','метров','метра','кг','кал','раунд','раунда','раундов','круг','круга','кругов']);
function covered(text, e){
  const qt = norm(text).split(' ').filter(w => w && !/^\d/.test(w) && !FILLER.has(w));
  const ws = [...new Set([e.ru, e.en, ...(ALIAS[e.id]||[])].map(norm).filter(Boolean).flatMap(n => n.split(' ')))];
  return qt.every(q => ws.some(w => w === q || sharedPrefix(q, w) >= 4));
}
const NOL = '(?![а-яёa-z])';
/* Число или диапазон «от–до» перед единицей (CON-24): «60–70 кг», «400-500 м». */
const RG = '(?:\\s*[-–—]\\s*(\\d+(?:[.,]\\d+)?))?';
const UNITS = [
  ['кг',  new RegExp('(\\d+(?:[.,]\\d+)?)'+RG+'\\s*(?:кг|kg)'+NOL,'i')],
  ['сек', new RegExp('(\\d+)'+RG+'\\s*(?:сек|sec)'+NOL,'i')],
  ['кал', new RegExp('(\\d+)'+RG+'\\s*(?:кал|cal)'+NOL,'i')],
  ['повт',new RegExp('(\\d+)'+RG+'\\s*(?:повт\\w*|reps?|раз)'+NOL,'i')],
  ['м',   new RegExp('(\\d+)'+RG+'\\s*(?:метр\\w*|м|m)'+NOL,'i')],
];
const RE_PCT = /@?\s*(\d{1,3}(?:[.,]\d)?)(?:\s*[-–—]\s*(\d{1,3}(?:[.,]\d)?))?\s*%/;
/* «Взятие на грудь (1) + фронтальный присед 1 + толчок 2» — связка (CON-23):
   две и больше частей через « + », и каждая уверенно узнаётся. Скобки вокруг
   параметров — как пишут в тетради. Не узнана хоть одна — это не связка. */
/* Запись связки целиком тоже узнаётся: «Взятие на грудь + Фронтальный присед +
   Толчок: 90 кг — 3×(1+1+1)» — подходы и повторы частей по порядку. */
function parseChain(L){
  let s = String(L || ''), sets = '', reps = null;
  const m = s.match(/(?:(\d+)\s*[x×хХ*]\s*)?\(\s*(\d+(?:\s*\+\s*\d+)+)\s*\)/);
  if(m){ sets = m[1] || ''; reps = m[2].split('+').map(x => x.trim()); s = s.replace(m[0], ' ') }
  s = s.replace(/:/g, ' ').replace(/\s[—–]\s/g, ' ');
  const parts = s.split(/\s\+\s/).map(t => t.replace(/[()]/g, ' ').replace(/\s+/g, ' ').trim()).filter(Boolean);
  if(parts.length < 2) return null;
  /* Нагрузка — одна на связку, где бы её ни написали; повторы — число после упражнения. */
  const out = [], ld = {};
  for(let t of parts){
    const mp = t.match(RE_PCT), mk = t.match(/(\d+(?:[.,]\d+)?)(?:\s*[-–—]\s*(\d+(?:[.,]\d+)?))?\s*кг(?![а-яё])/i);
    if(mp){ if(ld.pct == null){ ld.pct = parseFloat(mp[1].replace(',', '.')); if(mp[2]) ld.pct2 = parseFloat(mp[2].replace(',', '.')) } t = t.replace(mp[0], ' ') }
    else if(mk){ if(!ld.val){ ld.val = mk[1].replace(',', '.'); ld.unit = 'кг'; if(mk[2]) ld.val2 = mk[2].replace(',', '.') } t = t.replace(mk[0], ' ') }
    const mr = t.match(/\s(\d+)\s*$/); if(mr) t = t.slice(0, mr.index);
    const r = parseText(t.trim())[0]; if(!r || r.type !== 'ok' || r.item.chain) return null;
    if(mr && !r.item.scheme) r.item.scheme = mr[1];
    out.push(r.item);
  }
  if(reps && reps.length === out.length) out.forEach((p, k) => { p.scheme = reps[k] });
  const c = Object.assign(chainItem(out), ld); if(sets) c.sets = sets;
  return c;
}
const RE_SCHEME = /\d+\s*[x×хХ]\s*\d+|\d+(?:\s*-\s*\d+)+/;
const RE_SETS   = /\d+\s*[x×хХ]/;
function parseText(txt){
  const out=[];
  for(const line of txt.split('\n')){
    const L = line.trim(); if(!L) continue;
    const f = parseFmt(L);
    if(f && !RE_SCHEME.test(L)){ out.push({type:'fmt',src:L,fmt:L,f}); continue }
    const ch = parseChain(L); if(ch){ out.push({type:'ok',src:L,item:ch}); continue }
    let rest=L, unit=null, val='', val2='';
    for(const [u,re] of UNITS){ const m=rest.match(re); if(m){ unit=u; val=m[1].replace(',','.'); val2=(m[2]||'').replace(',','.'); rest=rest.replace(m[0],' '); break } }
    let pct=null, pct2=null;
    const mp = rest.match(RE_PCT);
    if(mp){ pct=parseFloat(mp[1].replace(',','.')); if(mp[2]) pct2=parseFloat(mp[2].replace(',','.')); rest=rest.replace(mp[0],' ') }
    let scheme='';
    const ms = rest.match(RE_SCHEME) || rest.match(RE_SETS);
    if(ms){ scheme = ms[0].replace(/\s/g,'').replace(/[xхХ]/,'×'); rest = rest.replace(ms[0],' ') }
    else{ const lead = rest.match(/^\s*(\d+)\s+(?=\D)/); if(lead){ scheme=lead[1]; rest=rest.replace(lead[0],' ') } }
    const e = matchEx(rest);
    if(!e || !covered(rest, e)){ out.push({type:'raw',src:L}); continue }
    const item = mkItem(e.id, scheme);
    item.pct = pct; if(pct2 != null) item.pct2 = pct2;
    if(unit){ item.unit=unit; item.val=val; if(val2) item.val2=val2 }
    /* После схемы, процента и единицы в строке остались цифры — значит запись
       сложнее, чем «подходы × повторы + нагрузка» («60×5, 70×5, 80×3×3»).
       Не теряем её молча: упражнение узнано, всё после названия — текстом. */
    if(/\d/.test(rest)){
      const mp2 = L.match(/^([^\d@%(]+?)\s+(?=[\d@%(])(.+)$/);
      if(mp2){ item.txt = mp2[2].trim(); item.scheme=''; item.pct=null; item.val=''; delete item.pct2; delete item.val2; item.unit = e.u[0]||''; }
    }
    out.push({type:'ok',src:L,item,ex:e});
  }
  return out;
}

/* ═══════ Расписание клиента для календаря (CAL-1) ═══════ */
function scheduleFor(cid, from, to){
  const c = client(cid); if(!c || !c.prog) return [];
  const plan = PLAN[c.prog] || [];
  const out = [];
  const n = planLength(c.prog);
  for(let i=0;i<n;i++){
    const rec = savedDay(c.prog, i);
    let d = plan[i];
    /* Сохранённый день перекрывает заготовку; пустой черновик — не тренировка. */
    if(rec && rec.c){ const cc = JSON.parse(rec.c); d = contentHas(rec.c) ? {t: cc.t||'Тренировка', b: cc.b.map(b=>[b.k]), draft: rec.draft, g: rec.g} : null; }
    if(!d) continue;                            /* день отдыха */
    const date = dayDate(c.prog, i);
    if(date < from || date > to) continue;   /* был return из forEach — в цикле он обрывал функцию */
    const past = date < TODAY;
    const missed = past && c.streak===0 && daysBetween(date, TODAY) <= 5;
    out.push({cid, date, day:i+1, title:d.t, kind:d.b[d.b.length-1][0], draft:!!d.draft, g:d.g || null,
      status: past ? (missed?'missed':'done') : (date===TODAY?'today':'planned')});
  }
  return out;
}
function scheduleAll(from,to){ return CLIENTS.flatMap(c=>scheduleFor(c.id,from,to)) }

/* ═══════ Занятия дня для таймлайна ═══════
   Единица — занятие (программа + тренировка), а не клиент. Одна и та же
   тренировка, назначенная группе из 25 человек (CON-11), это одна строка с
   25 атлетами, а не 25 строк: иначе список растёт с числом клиентов и
   перестаёт читаться уже на десятке. */
const NOW = (d=>String(d.getHours()).padStart(2,'0')+':'+String(d.getMinutes()).padStart(2,'0'))(new Date());
const hhmm = t => +t.slice(0,2)*60 + +t.slice(3,5);

/* ═══════ Очередь составления (CON-4, CON-12, NFR-4) ═══════
   Главный рабочий вопрос тренера — не «что сегодня», а «где программа скоро
   кончится». Считаем запас в днях от сегодня до последнего составленного дня:
   отрицательный запас значит, что клиенты уже без тренировок. */
/* Участник группы, у которого в личном контейнере только тренировки группы, в
   очереди не стоит: писать нужно группе, и она стоит в очереди одной строкой. */
const groupDriven = p => !!p.personal && !!groupOf(p.clients[0]);
function composeQueue(){
  return PROGRAMS.filter(p=>!groupDriven(p)).map(p=>{
    const composed = composedDays(p.id);
    const lastDay = composed ? dayDate(p.id, composed-1) : addDays(p.start,-1);
    return {p, composed, lastDay, runway: daysBetween(TODAY, lastDay), athletes: p.clients.length};
  }).sort((a,b)=>a.runway-b.runway);
}


/* ═══════ Сводка дня для месяца-обзора ═══════
   Месяц намеренно не показывает ни одной фамилии: при полусотне клиентов
   список в ячейке нечитаем при любой единице — и по клиентам, и по занятиям,
   если программы у всех индивидуальные. Месяц отвечает на другой вопрос:
   где дырки в составлении и где перегруз. Имена — уровнем ниже, в дне. */
function dayStats(date){
  const ses = sessionsOn(date);
  let gaps = 0;                                 /* назначения, чей день не составлен */
  CLIENTS.forEach(c=>{
    if(!c.prog) return;
    const p = program(c.prog);
    const i = daysBetween(p.start, date);       /* номер дня в плане, от нуля */
    if(i < 0) return;                           /* до старта календаря клиента */
    if(i < composedDays(c.prog)) return;        /* уже составлен */
    gaps++;
  });
  return {ses, gaps, n:ses.length, athletes:ses.reduce((a,s)=>a+s.who.length,0)};
}


function sessionsOn(date){
  const by = new Map();
  scheduleAll(date,date).forEach(e=>{
    const c = client(e.cid);
    if(!(program(c.prog)||{}).time) return;     /* без времени — клиент тренируется сам, в таймлайне дня не занятие */
    const key = c.prog + '|' + e.title;
    if(!by.has(key)) by.set(key,{pid:c.prog, title:e.title, kind:e.kind, draft:!!e.draft,
      time:(program(c.prog)||{}).time || '12:00', who:[]});
    by.get(key).who.push(c);
  });
  return [...by.values()].map(s=>{
    /* «Записал результат» читаем из факта, а не из назначения: клиент отметился,
       если его последняя тренировка — сегодня (CLI-2). */
    s.done = s.who.filter(c=>c.last===date).length;
    s.past = hhmm(s.time) < hhmm(NOW);
    s.state = s.done===s.who.length ? 'done'        /* все записали */
            : s.past               ? 'nores'        /* время прошло, результата нет */
                                   : 'ahead';
    return s;
  }).sort((a,b)=>hhmm(a.time)-hhmm(b.time));
}

/* ═══════ Состояние приложения (общее между страницами) ═══════ */

/* ═══ Карточка упражнения из базы (EX-1) ═══
   Всё, что есть в записи датасета: часть тела, целевая и вспомогательные мышцы,
   оснащение, пошаговая техника. Техника лежит в assets/exdb-steps.js (≈1 МБ) и
   грузится только на странице базы. Похожие (та же мышца и снаряд) и замены
   (та же мышца, другой снаряд) считаются по самой базе; ближе — те, у кого
   больше общих слов в названии. */
function edbOf(e){
  if(!e || e.own || !e.bp) return null;
  const words = new Set(e.en.split(/[^a-z0-9]+/));
  const near = x => -x.en.split(/[^a-z0-9]+/).filter(w => words.has(w)).length;
  const same = EX.filter(x => !x.own && x.id !== e.id && x.tg === e.tg && x.bp === e.bp).sort((p, q) => near(p) - near(q));
  return {id:e.id, bodyPart:BODY_RU[e.bp] || e.bp, target:muscleRu(e.tg), secondary:(e.sec || []).map(muscleRu),
    instructions:(typeof EXDB_STEPS !== 'undefined' && EXDB_STEPS[e.id]) || [],
    similar:same.filter(x => x.eq === e.eq).slice(0, 8), subs:same.filter(x => x.eq !== e.eq).slice(0, 6)};
}

/* ═══ 50 клиентов, у каждого — своя индивидуальная программа (командных в MVP
   нет). Объём, на котором должны работать списки, поиск, календарь и
   таймлайн. Генерация детерминированная (seed); даты — в координатах ANCHOR,
   сдвигаются вместе с остальными данными. У части программ есть время
   занятия — они попадают в таймлайн дня; остальные клиенты тренируются сами. ═══ */
(function seedDemo(){
  let seed = 20260913; const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
  const pick = a => a[Math.floor(rnd()*a.length)], between = (a,b) => a + Math.floor(rnd()*(b-a+1));
  const r25 = v => Math.round(v/2.5)*2.5, dd = n => String(n).padStart(2,'0');
  const FM = ['Иван','Дмитрий','Алексей','Егор','Максим','Павел','Роман','Кирилл','Андрей','Тимур','Глеб','Олег','Артур','Денис','Игорь','Владислав','Марк','Юрий','Матвей','Лев'];
  const FF = ['Анна','Елена','Ольга','Ксения','Полина','Алина','Екатерина','Наталья','Вера','Юлия','Светлана','Марина','Виктория','Татьяна','Алёна','Ирина','Кристина','Валерия','София','Арина'];
  const LM = ['Смирнов','Иванов','Кузнецов','Попов','Васильев','Петров','Соколов','Михайлов','Новиков','Фёдоров','Морозов','Алексеев','Лебедев','Семёнов','Егоров','Павлов','Козлов','Степанов','Николаев','Орлов','Андреев','Макаров','Никитин','Захаров','Зайцев','Борисов','Яковлев','Григорьев','Романов','Воробьёв','Сергеев','Кузьмин','Фролов','Александров','Дмитриев','Королёв','Гусев','Киселёв','Ильин','Максимов'];
  /* Шаблоны программ: название, цель, длина, из каких дней собирается. */
  const KINDS = [
    ['Присед · 12 недель','Линейная прогрессия в приседе',84,'p1'], ['Гипертрофия · 8 недель','Объём и техника без гонки за весами',56,'p1'],
    ['Пауэрлифтинг · база','Три движения, подводка к стартам',56,'p1'], ['Сила + кроссфит','Рост силовых при метконовой форме',56,'p1'],
    ['ОФП · утро','Общая физподготовка',42,'p2'], ['Кроссфит · вечер','Кроссфит для всех уровней',84,'p2'], ['Техника гимнастики','Подтягивания, выходы, стойка',56,'p2'],
    ['Новичок · старт','Первые шесть недель в зале',42,'p2'], ['Марафон · подготовка','Бег три раза в неделю, силовая — одна',84,'p3'],
    ['Возврат в строй','После травмы — аккуратно, через день',42,'p3'], ['Гиревой цикл','Гири и кор, шесть недель',42,'p3'],
  ];
  const TIMES = ['06:30','08:30','09:30','10:30','12:00','14:00','15:00','16:00','17:00','19:00'];
  const total = 50 - CLIENTS.length;
  let pn = 20, tIdx = 0;
  for(let k=0; k<total; k++){
    const sex = rnd() < 0.55 ? 'м' : 'ж';
    const first = sex==='м' ? pick(FM) : pick(FF); let last = pick(LM); if(sex==='ж') last += 'а';
    const id = 'g' + (k+1), lvl = pick(['Новичок','Средний','Средний','Продвинутый']);
    const hasProg = k < total - 8;                       /* восемь клиентов без программы */
    let pid = null, sessions = 0;
    if(hasProg){
      const [title, goal, days, src] = pick(KINDS);
      pid = 'p' + (pn++);
      const start = addDays(ANCHOR, -between(5, days - 10));       /* программа идёт; где-то только началась, где-то кончается */
      const weeks = Math.min(Math.ceil(days/7), Math.ceil((daysBetween(start, ANCHOR) + (rnd() < 0.12 ? between(-8, -1) : between(1, 30))) / 7));
      PROGRAMS.push({id:pid, title, goal, days, clients:[id], start, kind:'individual', time: tIdx < TIMES.length && k % 4 === 0 ? TIMES[tIdx++] : null});
      PLAN[pid] = rep(DAYS[src], Math.max(1, weeks)).slice(0, days);
      sessions = PLAN[pid].filter(Boolean).length;
    }
    const strong = sex==='м' ? 1 : 0.62, mult = {'Новичок':0.7,'Средний':1,'Продвинутый':1.25}[lvl];
    const sq = r25((90 + rnd()*70) * strong * mult), dl = r25(sq*1.25), bn = r25(sq*0.7), pr = r25(sq*0.45);
    const idle = rnd() < 0.18;
    CLIENTS.push({
      id, n: first + ' ' + last, ini: first[0] + last[0], sex,
      born: between(1984, 2006) + '-' + dd(between(1,12)) + '-' + dd(between(1,28)),
      since: between(2023, 2026) + '-' + dd(between(1,8)) + '-' + dd(between(1,28)),
      sport: pid ? pick(['Кроссфит','Тренажёрный зал','Тяжёлая атлетика','Функциональный тренинг']) : pick(SPORTS),
      level: lvl, phone: '+7 9' + between(10,99) + ' ' + between(100,999) + '-' + dd(between(0,99)) + '-' + dd(between(0,99)),
      tariff: 'Индивидуально', prog: pid,
      h: sex==='м' ? between(168,195) : between(158,180), w: sex==='м' ? between(68,102) : between(52,78),
      last: pid ? addDays(ANCHOR, -(idle ? between(3,9) : between(0,2))) : null,
      done: Math.round(sessions*0.6), plan: sessions, streak: idle ? 0 : between(1,12),
      pm: {squat:sq, fsquat:r25(sq*0.85), dead:dl, bench:bn, press:pr, clean:r25(sq*0.7), snatch:r25(sq*0.55), jerk:r25(sq*0.75)},
      hist: {squat:[[addDays(ANCHOR,-98), r25(sq*0.88)],[addDays(ANCHOR,-56), r25(sq*0.94)],[addDays(ANCHOR,-14), sq]],
             dead: [[addDays(ANCHOR,-98), r25(dl*0.9)], [addDays(ANCHOR,-49), r25(dl*0.95)],[addDays(ANCHOR,-7), dl]]},
      pr: null, comments: [], note: '',
    });
  }
  [['g3','Присед','Колени сводит на выходе из седа — это техника или веса много?'],['g11','Жим лёжа','Плечо щёлкает в нижней точке. Заменить на гантели?'],['g19',null,'Могу перенести четверг на пятницу?']]
    .forEach(([id, ex, tx]) => { const c = CLIENTS.find(x=>x.id===id); if(c) c.comments.push({d: addDays(ANCHOR,-1), ex, tx, reply:null}) });
})();

/* Сегодня по ссылке пришёл ещё один клиент — сверх лимита тарифа: так видно
   перерасход (TRN-2). Клиент пользуется приложением как обычно. */
CLIENTS.push({id:'c7', n:'Илья Соколов', ini:'ИС', sex:'м', born:'1998-11-02', since:TODAY,
  sport:'Кроссфит', level:'Средний', phone:'+7 913 555-20-14', tariff:'Индивидуально', prog:null,
  h:178, w:80, last:null, done:0, plan:0, streak:0,
  pm:{}, hist:{}, pr:null, comments:[], note:'Пришёл по ссылке-приглашению сверх лимита тарифа.'});

/* ─── Лимит клиентов по тарифу (TRN-2) ───
   Клиента сверх лимита пускаем: он входит по ссылке и делает в приложении всё
   как обычно. Перерасход видит только тренер — алерт на дашборде и на
   страницах клиента, — и, пока лимит не изменён, этому клиенту нельзя
   составлять тренировки. Сверх лимита — те, кто пришёл последними. */
const subNow = () => (STATE.profile || PROFILE_DEF).sub;
const planNow = () => PLANS.find(x => x.id === subNow().plan) || PLANS[1];
function overLimit(){
  const lim = planNow().limit;
  return CLIENTS.length <= lim ? [] : [...CLIENTS].sort((a, b) => (a.since || '').localeCompare(b.since || '')).slice(lim);
}
const isOver = cid => overLimit().some(c => c.id === cid);

/* Контакты в мессенджерах — демо: ник из транслита фамилии. */
const translit = w => w.toLowerCase().replace(/[а-яё]/g, ch => ({а:'a',б:'b',в:'v',г:'g',д:'d',е:'e',ё:'e',ж:'zh',з:'z',и:'i',й:'y',к:'k',л:'l',м:'m',н:'n',о:'o',п:'p',р:'r',с:'s',т:'t',у:'u',ф:'f',х:'h',ц:'c',ч:'ch',ш:'sh',щ:'sch',ъ:'',ы:'y',ь:'',э:'e',ю:'yu',я:'ya'})[ch] ?? ch);
CLIENTS.forEach((c,i)=>{ const h = translit(c.n.split(' ').pop()) + (i % 3 === 0 ? '' : '_' + (80 + i % 19)); c.tg ||= '@' + h; c.max ||= '@' + h; });

/* Оплата и замеры — демо: до какого числа внесена оплата, история веса и
   объёмов раз в 3–5 недель. Замеры в координатах ANCHOR, сдвигаются. */
(function seedBilling(){
  let seed = 7; const rnd = () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let t = Math.imul(seed ^ seed >>> 15, 1 | seed); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296 };
  CLIENTS.forEach((c,i)=>{
    c.paidUntil ||= addDays(ANCHOR, i % 9 === 4 ? -Math.floor(rnd()*6) - 1 : Math.floor(rnd()*40) + 3);
    if(!c.meas){ const w0 = c.w || 75, n = 5; c.meas = Array.from({length:n}, (_,k)=>{ const t = n-1-k; const w = Math.round((w0 + t*(rnd()*1.2-0.3))*10)/10;
      return {date: addDays(ANCHOR, -t*28 - Math.floor(rnd()*6)), w, waist: Math.round(w*0.98 + 3 + t*0.6), chest: Math.round(w*1.15 + 8 - t*0.3), hips: Math.round(w*1.1 + 6), fat: Math.round((14 + t*0.7 + rnd())*10)/10} }); }
  });
})();

/* Сдвиг дат демо-данных к сегодняшнему дню. Ключи with датами занятий и
   результатов сдвигаются; даты рождения, «с нами с», создания шаблонов — нет. */
(function(){
  const KEYS = new Set(['start','date','last','until','d','paidUntil']);
  const walk = o => { if(!o || typeof o !== 'object') return;
    if(Array.isArray(o)){ o.forEach(walk); return }
    for(const k of Object.keys(o)){ const v = o[k]; if(KEYS.has(k) && typeof v === 'string') o[k] = shiftDate(v); else if(v && typeof v === 'object') walk(v) } };
  [PROFILE_DEF, CLIENTS, PROGRAMS, LOG].forEach(walk);
  /* Переписка к тренировке привязана к дате дня — сдвигаем и её ключи. */
  Object.keys(TALK.workout).forEach(k => { const [cid, d] = k.split('@'), nk = cid + '@' + shiftDate(d);
    if(nk !== k){ TALK.workout[nk] = TALK.workout[k]; delete TALK.workout[k] } });
})();
/* Демо статуса «соревнование»: у Артёма (p1) в воскресенье текущей недели.
   Статус — поле дня (comp), хранится вместе с днём и публикуется как правка. */
(function(){
  const p = PROGRAMS.find(x=>x.id==='p1'); if(!p || !PLAN.p1) return;
  /* В воскресенье «сегодня» занято витриной ниже — соревнование уезжает на следующее */
  let date = addDays(TODAY, 6 - dowMon(TODAY)); if(date === TODAY) date = addDays(date, 7);
  const i = daysBetween(p.start, date);
  if(i >= 0 && i < PLAN.p1.length) PLAN.p1[i] = {t:'Соревнования · Open Cup', comp:true, b:[
    ['warmup','Разминка','Спокойно, без отказа',null,[['own_rom','2×',null,'сек','60'],['own_pvc','2×10'],['own_row',null,null,'м','500']]],
    ['complex','«Fran» · 21-15-9','Два зачётных выхода, отдых 10 мин',null,[['3305','21-15-9',null,'кг','43'],['0652','21-15-9']]]]};
})();
/* Витрина: сегодня у Артёма — тренировка, где собраны все виды записей, чтобы
   на экранах клиента и в конструкторе было видно каждую вариацию разом:
   нагрузка временем, дистанцией, калориями, повторами, своим весом, % и
   диапазоном %; пояснение вместо нагрузки; строка текстом; связка; суперсет
   с весом, текстом и связкой внутри; блоки всех типов; комплекс каждого
   формата; комплекс, написанный тренером от руки; блок текстом без названия;
   блок из одних строк текстом. Строка заготовки — как в mkLine. */
(function(){
  const p = PROGRAMS.find(x=>x.id==='p1'); if(!p || !PLAN.p1) return;
  const i = daysBetween(p.start, TODAY);
  if(i < 0 || i >= PLAN.p1.length) return;
  const sub = (a) => { const r = [...a]; while(r.length < 6) r.push(r.length === 2 ? null : ''); r[6] = 1; return r };
  PLAN.p1[i] = {t:'Все виды записей', b:[
    ['warmup','Разминка','Темп спокойный, пульс до 130',null,[
      ['own_rom','2×',null,'сек','60'],
      ['own_row',null,null,'м','500'],
      ['own_bike',null,null,'кал','10'],
      ['own_pvc','2×10'],
      [TXT_TAG,'Прокатать икры роллом, по 2 мин на ногу']]],
    ['strength','Присед','Пауза 1 сек внизу',null,[
      ['0043','5×3',80],
      ['0043','3×2','85-90'],
      ['0042','',null,null,'','по самочувствию, 3–4 подхода']]],
    ['strength','Тяжелоатлетическая связка','Без разрыва между частями',null,[
      [CH_TAG,[['0648','1'],['0042','1'],['own_jerk','1']],{n:3,p:75}],
      [CH_TAG,[['0648','1'],['own_jerk','2']],{n:2,p:80,p2:85,of:'0648'}],
      ['own_snatch','5×2',null,'кг','50-55']]],
    ['accessory','Подкачка · сет','',null,[
      [SS_TAG,4,'90 сек'],
      sub(['0025','8',70]),
      sub(['0652','8']),
      sub(['0336','10',null,'кг','16-20']),
      sub([TXT_TAG,'Вис на перекладине 30 сек'])]],
    ['gymnastics','Гимнастика','Без кипа',null,[
      [SS_TAG,3,'2 мин'],
      sub([CH_TAG,[['own_ttb','5'],['own_c2b','5']]]),
      sub(['0471','6']),
      ['0680','3×1']]],
    ['complex','','',`AMRAP 12`,[
      ['own_wb','15',null,'кг','9'],
      ['own_du','50'],
      ['own_box','10']]],
    ['complex','Тяга и эйрбайк','Нечётные минуты — тяга, чётные — эйрбайк','EMOM 10',[
      ['0032','5',60],
      ['own_bike',null,null,'кал','12']]],
    ['complex','«Helen»','','3 раунда на время 14',[
      ['0685',null,null,'м','400'],
      ['0549','21',null,'кг','24'],
      ['0652','12']]],
    ['complex','Табата','','Tabata',[
      ['own_bike','',null,null,'','максимум калорий']]],
    ['complex','Интервалы на гребле','Темп ровный, без рывка в начале','5 раундов по 3 мин отдых 1 мин',[
      ['own_row',null,null,'м','700-800']]],
    ['complex','Бёрпи до отказа','','Death by 1',[
      ['1160','']]],
    ['complex','Корпус','','NFT',[
      ['own_ttb','3×10'],
      ['own_plank','3×',null,'сек','45']]],
    ['complex','«Murph» по-нашему','Жилет 10 кг, если есть',null,
`На время, лимит 60 мин
Бай-ин: бег 1600 м
Затем 20 раундов «Синди»:
• 5 подтягиваний
• 10 отжиманий
• 15 воздушных приседаний
Дробить как удобно, например 5-10-5 по 4 раза
Бай-аут: бег 1600 м
Масштаб: подтягивания с резиной, отжимания с колен, бег по 800 м`],
    [null,'','',null,
`Растяжка на выбор:
- голубь, по 2 мин на сторону
- couch stretch, по 90 сек на сторону
- вис на перекладине 3×30 сек`],
    [null,'Домашнее задание','',null,[
      [TXT_TAG,'10 минут дыхания лёжа, выдох длиннее вдоха'],
      [TXT_TAG,'Прогулка 30–40 минут']]],
    ['cooldown','Заминка','',null,[
      ['own_couch','2×',null,'сек','90'],
      ['own_copen','2×',null,'сек','45']]]]};
})();
/* ═══════════ ГРУППЫ КЛИЕНТОВ (GRP) ═══════════
   Группа — набор клиентов, которых тренер ведёт одной программой; клиент
   состоит не больше чем в одной группе. У группы свой календарь: контейнер
   дней в PROGRAMS (kind 'group'), такой же, как у клиента, поэтому календарь
   и конструктор открывают группу теми же средствами.
   Тренировка группы стоит в календаре каждого участника копией, которая
   помнит группу (поле g дня) — это «день группы» у клиента. Любая правка и
   публикация в группе заменяет содержимое всех дней группы у участников,
   включая те, что тренер правил отдельно (GRP-4). Тренировки меняет только
   тренер: в календаре группы — для всех, в календаре клиента — для одного,
   до следующей правки в группе. День, где у клиента стоит другая тренировка,
   группа сама не трогает: при публикации тренер решает в одном окне по всем
   таким участникам — заменить или пропустить (GRP-3); пропуск помнится в
   STATE.gskip, пока тренер не поставит тренировку группы этому клиенту сам. */
const GRPS = [];
const grp = id => GRPS.find(g => g.id === id);
const grpByProg = pid => GRPS.find(g => g.prog === pid);
const isGrp = id => !!grp(id);
const groupOf = cid => GRPS.find(g => g.members.includes(cid)) || null;
/* Кто открыт в календаре и конструкторе — клиент или группа: у обоих есть имя,
   инициалы и контейнер дней prog. */
const who = id => client(id) || grp(id);
/* Инициалы группы: короткое название целиком («ЛФК»), иначе первые буквы слов. */
const grpIni = n => { const w = String(n || '').trim().split(/[^а-яёa-z0-9]+/i).filter(Boolean);
  return (w.length === 1 && w[0].length <= 3 ? w[0] : w.length > 1 ? w.slice(0, 3).map(x => x[0]).join('') : (w[0] || 'Г').slice(0, 2)).toUpperCase() };

/* Демо: группа ЛФК — десять человек по одной программе, как в сценарии заказчика.
   Им отдали клиентов из генератора (их личные программы убраны), чтобы в
   аккаунте осталось 50 человек. Даты — от понедельника четыре недели назад:
   у группы есть прошлое и составлено на полторы недели вперёд. У двоих
   ближайшие два дня «ноги» тренер поправил в их календарях — болит колено
   и голеностоп. */
(function seedGroups(){
  const start = addDays(TODAY, -dowMon(TODAY) - 28);
  const A = {t:'ЛФК · спина и кор', b:[
    ['warmup','Разминка','Без рывков, дыхание ровное',null,[['own_rom','2×',null,'сек','60'],['own_pvc','2×10']]],
    ['strength','Спина','Медленно: две секунды вверх, две вниз',null,[['0489','3×12'],['own_hipthrust','3×12'],['0498','3×10']]],
    [null,'Кор','',null,[['own_plank','3×',null,'сек','30']]],
    ['cooldown','Заминка','',null,[['own_copen','2×',null,'сек','45']]]]};
  const B = {t:'ЛФК · ноги и баланс', b:[
    ['warmup','Разминка','',null,[['own_rom','2×',null,'сек','60'],['own_row',null,null,'м','500']]],
    ['strength','Ноги','Колени по линии носков, без боли',null,[['0534','3×10',null,'кг','8'],['0431','3×8'],['0336','2×8'],['0605','3×15']]],
    [null,'Баланс','',null,[['own_plank','3×',null,'сек','30']]],
    ['cooldown','Заминка','',null,[['own_couch','2×',null,'сек','60']]]]};
  const Cd = {t:'ЛФК · верх и осанка', b:[
    ['warmup','Разминка','',null,[['own_pvc','2×10'],['own_rom','2×',null,'сек','60']]],
    ['strength','Верх тела','Лёгкий вес, без отказа',null,[['0198','3×12'],['0405','3×10'],['own_facepull','3×15']]],
    ['cooldown','Заминка','',null,[['own_copen','2×',null,'сек','45'],['own_plank','2×',null,'сек','30']]]]};
  /* Личные версии дня «ноги»: блок «Ноги» переписан под травму, остальное как у группы. */
  const legs = (title, note, items) => ({...B, b: B.b.map(b => b[1] === 'Ноги' ? ['strength', title, note, null, items] : b)});
  const OWN = {
    g8:  legs('Ноги · бережём колено', 'Без выпадов и зашагиваний — колено', [['own_hipthrust','3×12'],['0586','3×12'],['0605','3×15']]),
    g20: legs('Ноги', 'Голеностоп: без зашагиваний и подъёмов на носки', [['0534','3×10',null,'кг','8'],['0739','3×12'],['0336','2×8']]),
  };
  const NOTE = {g8:'Колено: без выпадов и прыжков до конца месяца.', g20:'Растяжение голеностопа — без зашагиваний и подъёмов на носки.'};
  const plan = rep([A, null, B, null, Cd, null, null], 6);
  const ownAt = plan.map((d, i) => d === B && addDays(start, i) >= TODAY ? i : -1).filter(i => i >= 0).slice(0, 2);
  const members = ['g6','g7','g8','g10','g14','g20','g22','g24','g26','g36'].filter(client);
  const G = {id:'grp1', n:'ЛФК', ini:'ЛФК', about:'Лечебная физкультура: спина, суставы, баланс',
             prog:'grp1', members, joined:Object.fromEntries(members.map(c => [c, start])), demo:true};
  GRPS.push(G);
  PROGRAMS.push({id:'grp1', title:G.n, goal:G.about, days:plan.length, clients:G.members, start, kind:'group', time:null});
  PLAN.grp1 = plan;
  members.forEach(cid => {
    const c = client(cid);
    if(c.prog){ const k = PROGRAMS.findIndex(p => p.id === c.prog); if(k >= 0) PROGRAMS.splice(k, 1); delete PLAN[c.prog] }
    const pid = 'gm_' + cid;
    PROGRAMS.push({id:pid, title:'Тренировки', goal:'', days:plan.length, clients:[cid], start, kind:'individual', personal:true, time:null});
    PLAN[pid] = plan.map((d, i) => d ? {...(OWN[cid] && ownAt.includes(i) ? OWN[cid] : d), g:G.id} : null);
    c.prog = pid;
    if(NOTE[cid]) c.note = NOTE[cid];
  });
})();

const STATE = (function(){
  const def = {online:true, queue:0, ids:false, navc:false, curClient:'c1', curProg:'p1', curWeek:4,
               pm:Object.fromEntries(CLIENTS.map(c=>[c.id, {...c.pm}])), replied:{}, days:{}, profile:null};
  let s = def;
  /* exdb — версия базы упражнений. Сохранённые дни ссылаются на упражнения по
     id: состояние, записанное при другой базе (до датасета id были «squat»,
     «bench»…), не поднимаем — строки дней показались бы пустыми. */
  def.exdb = EXDB_SRC.sha.slice(0, 7);
  try{ const raw = localStorage.getItem('trenergram.state'), p = raw && JSON.parse(raw);
       if(p && p.exdb === def.exdb) s = Object.assign({}, def, p) }catch(_){}
  return s;
})();
/* Сообщения тренера к тренировкам (COM-4) — в STATE.wmsg: без этого написанное в
   конструкторе пропадало при переходе на календарь, где его показывает
   подробный вид (CAL-3). Пишутся вместе с остальным состоянием. */
const wmsgOf = () => Object.fromEntries(Object.entries(TALK.workout)
  .map(([k, arr]) => [k, ((arr || []).find(m => m.who === 'trainer') || {}).text || '']).filter(([, t]) => t));
function saveState(){ STATE.wmsg = wmsgOf(); try{ localStorage.setItem('trenergram.state', JSON.stringify(STATE)) }catch(_){} }
(function restoreWmsg(){
  if(!STATE.wmsg) return;
  Object.values(TALK.workout).forEach(arr => { const i = arr.findIndex(m => m.who === 'trainer'); if(i >= 0) arr.splice(i, 1) });
  Object.entries(STATE.wmsg).forEach(([k, text]) => (TALK.workout[k] ||= []).unshift({who:'trainer', text, at:''}));
})();
/* Упражнения, которые тренер добавил в свою базу (из конструктора или со страницы
   базы). Лежат в STATE: без этого после перезагрузки строки дня ссылались бы
   на исчезнувшее упражнение и показывались пустыми. */
function addOwnEx({ru, en, g, eq, u}){
  const e = {id:'own' + Date.now().toString(36), ru, en: en || '', g: g || 'Без группы', eq: eq || '—', pm:null, u: u && u.length ? u : ['повт'], m:'ok', own:true};
  EX.push(e); CAND.push({e, c:[e.ru, e.en].map(norm).filter(Boolean)});
  (STATE.ownEx ||= []).push(e); saveState();
  return e;
}
(STATE.ownEx || []).forEach(e => { if(!byId(e.id)){ EX.push(e); CAND.push({e, c:[e.ru, e.en].map(norm).filter(Boolean)}) } });
const pmOf = cid => (STATE.pm[cid] ||= {...(client(cid)?.pm||{})});

/* ═══════════ ГРУППЫ: СОСТОЯНИЕ И РАЗДАЧА ТРЕНИРОВОК (GRP) ═══════════ */
/* Название, время и состав групп живут в STATE.grps. Новая группа заводит свой
   контейнер дней; у демо-группы даты из сида, из STATE — только правки. */
(function restoreGroups(){
  const saved = STATE.grps; if(!Array.isArray(saved)) return;
  const keep = new Set(saved.map(s => s.id));
  for(let k = GRPS.length - 1; k >= 0; k--){
    if(keep.has(GRPS[k].id)) continue;
    const pi = PROGRAMS.findIndex(p => p.id === GRPS[k].prog); if(pi >= 0) PROGRAMS.splice(pi, 1);
    GRPS.splice(k, 1);
  }
  saved.forEach(s => {
    let g = grp(s.id);
    if(!g){
      g = {id:s.id, prog:s.id, demo:false, members:[], joined:{}};
      GRPS.push(g);
      PROGRAMS.push({id:s.id, title:s.n, goal:'', days:1, clients:g.members, start:s.start || TODAY, kind:'group', time:null});
      PLAN[s.id] ||= [];
    }
    g.n = s.n; g.ini = grpIni(s.n); g.about = s.about || '';
    g.members.splice(0, g.members.length, ...(s.members || []).filter(id => client(id)));
    g.joined = {...(s.joined || {})};
    const p = program(g.prog); p.title = g.n; p.goal = g.about;
  });
})();
function saveGroups(){
  const prev = Object.fromEntries((STATE.grps || []).map(s => [s.id, s]));
  STATE.grps = GRPS.map(g => ({id:g.id, n:g.n, about:g.about || '',
    members:[...g.members], joined:{...g.joined}, start: g.demo ? null : ((prev[g.id] || {}).start || program(g.prog).start)}));
  saveState();
}

/* Содержимое дня — строка serializeDay: по ней день участника сравнивается с
   днём группы и по ней же копируется. */
const EMPTY_DAY = serializeDay({title:'', blocks:[]});
const contentHas = c => { if(!c) return false;
  try{ const r = JSON.parse(c); return !!r.c || (r.b || []).some(b => String(b.tx || '').trim() || (b.i || []).some(it => !it.ss && (it.e || String(it.r || '').trim() || (it.ch || []).some(p => p.e || String(p.r || '').trim())))) }
  catch(_){ return false } };
/* День контейнера на дату: содержимое, группа-источник, запись в STATE (если есть). */
function dayAt(pid, date){
  const p = program(pid); if(!p) return null;
  const i = daysBetween(p.start, date);
  if(i < 0) return {pid, i, c:EMPTY_DAY, g:null, rec:null};
  const rec = savedDay(pid, i), tpl = (PLAN[pid] || [])[i];
  return {pid, i, rec, c: rec && rec.c ? rec.c : tpl ? serializeDay(buildDay(pid, i)) : EMPTY_DAY,
          g: rec ? (rec.g || null) : tpl ? (tpl.g || null) : null};
}
function memberDay(cid, date){
  const c = client(cid);
  const m = (c && c.prog && dayAt(c.prog, date)) || {pid:null, i:-1, c:EMPTY_DAY, g:null, rec:null};
  m.has = contentHas(m.c);
  return m;
}
/* Группа, из которой пришёл день клиента, — для меток в календаре и конструкторе. */
function dayGroup(x){
  if(!x || !x.g) return null;
  return grp(x.g) || null;                          /* группу удалили — тренировка осталась у клиента индивидуальной */
}

/* Единственная точка записи дня. Держит два правила: метка группы у дня
   участника переживает любую перезапись (день остаётся днём группы), а запись
   в день группы расходится по участникам. replace — кому из участников можно
   заменить другую тренировку на этот день (решение из окна занятых дней). */
function putDay(pid, i, rec, keepG = true, replace = null){
  const bag = ((STATE.days ||= {})[pid] ||= {}), old = bag[i];
  if(keepG && rec.g === undefined){ const g = old ? old.g : ((PLAN[pid] || [])[i] || {}).g; if(g) rec.g = g }
  bag[i] = rec;
  const G = grpByProg(pid);
  if(G) groupPush(G, dayDate(pid, i), rec, replace);
}
/* Раздача дня группы (GRP-3, GRP-4). Дни группы у участников получают новую
   версию и статус группы всегда — и те, что тренер правил отдельно: черновик
   скрыт от всех, публикация видна всем. Свободный день получает копию, если
   человек был в группе на эту дату. День с другой тренировкой заменяется
   только по решению тренера в окне занятых дней (replace). */
function groupPush(G, date, rec, replace){
  const has = contentHas(rec.c);
  G.members.forEach(cid => {
    const m = memberDay(cid, date);
    if(m.g === G.id){ memberPut(cid, date, rec, G.id); return }
    if(!has) return;
    if(m.has){ if(replace && replace.has(skipKey(cid, date))) memberPut(cid, date, rec, G.id); return }
    if(date >= (G.joined[cid] || TODAY)) memberPut(cid, date, rec, G.id);
  });
}
/* Пропущенные при публикации: у участника на этот день своя тренировка, и
   группа её не трогает, пока тренер не поставит тренировку группы сам. */
const skipKey = (cid, date) => cid + '@' + date;
const isSkipped = (G, cid, date) => !!((STATE.gskip || {})[G.id] || {})[skipKey(cid, date)];
function setSkip(G, cid, date, on){
  const bag = ((STATE.gskip ||= {})[G.id] ||= {});
  if(on) bag[skipKey(cid, date)] = 1; else delete bag[skipKey(cid, date)];
}
/* Занятые дни: участники, у которых на эти даты стоит другая тренировка. */
const dayTitleOf = c => { try{ const t = JSON.parse(c).t; return t && t !== 'Отдых' && t !== '—' ? t : 'Без названия' }catch(_){ return 'Без названия' } };
function groupConflicts(G, dates){
  const out = [];
  dates.forEach(date => G.members.forEach(cid => {
    const m = memberDay(cid, date);
    if(m.g !== G.id && m.has && !isSkipped(G, cid, date)) out.push({key:skipKey(cid, date), cid, date, title:dayTitleOf(m.c)});
  }));
  return out;
}
function memberPut(cid, date, rec, gid){
  const r = ensureDay(cid, date); if(!r) return;
  const bag = ((STATE.days ||= {})[r.pid] ||= {}), old = bag[r.i], tpl = (PLAN[r.pid] || [])[r.i];
  /* Что клиент видит сейчас — это и остаётся у него, пока группа не опубликует. */
  const seen = old ? (old.draft ? (old.pub || '') : old.c) : (tpl ? serializeDay(buildDay(r.pid, r.i)) : '');
  bag[r.i] = rec.draft ? {c:rec.c, pub:seen, draft:true, g:gid} : {c:rec.c, draft:false, g:gid};
  /* Сообщение группе к дню (COM-4) видит каждый связанный участник. */
  const gm = (TALK.workout[talkKey(gid, date)] || []).find(m => m.who === 'trainer');
  if(gm){ const arr = (TALK.workout[talkKey(cid, date)] ||= []), k = arr.findIndex(m => m.who === 'trainer'); if(k >= 0) arr[k] = {...gm}; else arr.unshift({...gm}) }
  if(typeof PCACHE !== 'undefined') delete PCACHE[r.pid];     /* план участника в конструкторе перечитается */
}
/* Поставить участнику тренировку группы на этот день — заменив его собственную. */
function groupApply(cid, date, G){
  const gd = dayAt(G.prog, date); if(!gd) return;
  setSkip(G, cid, date, false);
  memberPut(cid, date, gd.rec ? {...gd.rec} : {c:gd.c, draft:false}, G.id);
}
/* У кого из участников тренировка группы на этот день стоит, а у кого нет
   (пропущен при публикации или вступил позже). */
function groupDayStat(G, date){
  const gd = dayAt(G.prog, date); if(!gd || !contentHas(gd.c)) return null;
  const out = {got:[], none:[]};
  G.members.forEach(cid => { const m = memberDay(cid, date); (m.g === G.id && m.has ? out.got : out.none).push(cid) });
  return out;
}

/* Последний день с тренировкой — «составлено до» у группы. Пустые дни, которые
   тренер только открыл в конструкторе, не считаются. */
function lastWorkoutDay(pid){
  for(let i = planLength(pid) - 1; i >= 0; i--){ const d = dayDate(pid, i); if(contentHas(dayAt(pid, d).c)) return d }
  return null;
}
/* Состав (GRP-5). Новый участник получает тренировки группы с сегодняшнего
   дня — прошедшие ему ни к чему. У вышедшего будущие тренировки группы
   уходят, если тренер их для него не менял; поправленные под клиента остаются
   у него индивидуальными, прошедшие — историей. */
function groupDays(G, from){
  const p = program(G.prog), n = planLength(G.prog), out = [];
  for(let i = Math.max(0, daysBetween(p.start, from)); i < n; i++){
    const gd = dayAt(G.prog, dayDate(G.prog, i)); if(contentHas(gd.c)) out.push({date: dayDate(G.prog, i), gd});
  }
  return out;
}
function groupAdd(G, cid){
  if(groupOf(cid) || !client(cid)) return 0;        /* уже в группе — сначала убрать оттуда */
  G.members.push(cid); G.joined[cid] = TODAY;
  let n = 0;
  groupDays(G, TODAY).forEach(({date, gd}) => { const m = memberDay(cid, date);
    if(!m.has && m.g !== G.id){ memberPut(cid, date, gd.rec ? {...gd.rec} : {c:gd.c, draft:false}, G.id); n++ } });
  return n;
}
function groupRemove(G, cid){
  const k = G.members.indexOf(cid); if(k < 0) return 0;
  const c = client(cid), p = c && c.prog ? program(c.prog) : null;
  let n = 0;
  if(p) for(let i = Math.max(0, daysBetween(p.start, TODAY)), len = planLength(c.prog); i < len; i++){
    const date = dayDate(c.prog, i), m = memberDay(cid, date); if(m.g !== G.id) continue;
    const gd = dayAt(G.prog, date);
    if(gd && m.c === gd.c){ putDay(c.prog, i, {c:EMPTY_DAY, draft:false}, false); if(m.has) n++ }
    else { const r = {...(m.rec || {c:m.c, draft:false})}; delete r.g; putDay(c.prog, i, r, false) }
  }
  G.members.splice(k, 1); delete G.joined[cid];
  const sk = (STATE.gskip || {})[G.id]; if(sk) Object.keys(sk).forEach(key => { if(key.startsWith(cid + '@')) delete sk[key] });
  return n;
}
function groupCreate({n, about}){
  const id = 'grp' + Date.now().toString(36), start = addDays(TODAY, -dowMon(TODAY));
  const G = {id, n, ini:grpIni(n), about:about || '', prog:id, members:[], joined:{}, demo:false};
  GRPS.push(G);
  PROGRAMS.push({id, title:n, goal:G.about, days:1, clients:G.members, start, kind:'group', time:null});
  PLAN[id] = [];
  return G;
}
function groupUpdate(G, {n, about}){
  G.n = n; G.ini = grpIni(n); G.about = about || '';
  const p = program(G.prog); p.title = G.n; p.goal = G.about;
}
/* Удаление группы: тренировки, которые уже стоят у участников, остаются у них
   индивидуальными — метка группы у них просто перестаёт что-либо значить. */
function groupDelete(G){
  const k = GRPS.indexOf(G); if(k < 0) return;
  GRPS.splice(k, 1);
  const pi = PROGRAMS.findIndex(p => p.id === G.prog); if(pi >= 0) PROGRAMS.splice(pi, 1);
  delete PLAN[G.prog]; if(STATE.days) delete STATE.days[G.prog]; if(STATE.gskip) delete STATE.gskip[G.id];
}

/* ═══════════ СТАТУСЫ ДНЯ (CAL-1) — общие для всех страниц, поэтому в data.js: отдых · черновик · опубликована · соревнование ═══════════
   Отдых — любой день без упражнений; соревнование — отдельный флаг дня (comp),
   ставится в шапке конструктора. Одни и те же иконки в календаре, полосе недель
   конструктора и карточке клиента. */
/* Сообщение тренера к тренировке — в подробном виде календаря и полосы дней. */
const CHATICON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M13.5 7.6a5.2 5.2 0 0 1-7.4 4.7L2.5 13.2l1-3.6A5.2 5.2 0 1 1 13.5 7.6z"/></svg>';
const DAYICON = {
  /* Отдых — фигура в позе лотоса и батарейка с молнией («заряжается»), по эскизу тренеров. */
  rest:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="4.4" r="2.1"/><path d="M10 6.9v6.1"/><path d="M7 9.6c1-1.2 5-1.2 6 0"/><path d="M7 9.6 4.2 13.4l1.6 1.8"/><path d="M13 9.6l2.8 3.8-1.6 1.8"/><path d="M3 16.6c2.2-2.4 4.6-3.6 7-3.6s4.8 1.2 7 3.6"/><path d="M3 16.6c1.8 1.9 4.4 2.8 7 2.8s5.2-.9 7-2.8"/><rect x="18" y="2.6" width="3.8" height="6" rx=".9"/><path d="M19.4 1.7h1"/><path d="M20.2 4.2l-.9 1.6h1.4l-.9 1.6"/></svg>',
  comp:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M7 6H4.5a1.5 1.5 0 0 0 0 3H7M17 6h2.5a1.5 1.5 0 0 1 0 3H17"/></svg>',
  draft:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10 10 0 0 1 12 5c5 0 9 7 9 7a17 17 0 0 1-3.2 3.7M6.1 6.1A17 17 0 0 0 3 12s4 7 9 7a10 10 0 0 0 4.9-1.3"/></svg>',
  pub:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12s4-7 9-7 9 7 9 7-4 7-9 7-9-7-9-7z"/><circle cx="12" cy="12" r="3"/></svg>',
};
const DAYST = {rest:'Отдых', draft:'Черновик — клиент не видит', pub:'Опубликована — клиент видит', comp:'Соревнование'};
const dayStatus = (x, draft) => x.comp ? 'comp' : !dayHas(x) ? 'rest' : draft ? 'draft' : 'pub';
/* Метка статуса. Для черновика/опубликованной — кнопка: клик переключает
   видимость для клиента (key = «программа:индекс дня»). */
const dayMark = (st, key) => st==='rest' ? ''
  : (st==='comp' || !key) ? `<i class="dmark ${st}" title="${DAYST[st]}">${DAYICON[st]}</i>`
  : `<i class="dmark ${st}" role="button" tabindex="0" data-pub="${key}" title="${DAYST[st]} · нажмите, чтобы ${st==='draft'?'опубликовать':'скрыть от клиента'}">${DAYICON[st]}</i>`;
/* Не <button>: клетки дня в конструкторе сами кнопки, вложенная кнопка ломает разметку. */
/* Публикация/скрытие дня со страниц без живого плана (календарь, карточка клиента). */
function setPublished(pid, i, on, replace = null){
  const x = buildPlan(pid)[i]; if(!x) return false;
  const c = serializeDay(x);
  putDay(pid, i, on ? {c, draft:false} : {c, pub: x.pub, draft:true}, true, replace);
  saveState(); return true;
}
/* У группы тренировку видят участники: публикация и скрытие расходятся по всем связанным. */
const pubToggleMsg = (on, pid) => grpByProg(pid)
  ? (on ? 'Опубликовано для группы — участники видят тренировку' : 'Скрыто от участников группы — черновик')
  : (on ? 'Тренировка опубликована — клиент её видит' : 'Тренировка скрыта от клиента — черновик');
/* Отдых — оригинальная иконка из брифа (assets/icons/rest.png), без перерисовки. */
const restCell = () => `<span class="stcell rest" title="Отдых"><img src="assets/icons/rest.png" alt="Отдых"></span>`;
/* Список блоков дня: номер в своей колонке, не больше max строк, остальное — «ещё N». */
function blocksList(x, max=5){
  const bs = (x.blocks||[]).filter(blockHas); if(!bs.length) return '';
  return `<span class="bl num">${bs.slice(0,max).map((b,i)=>`<i><s>${i+1}</s><b>${esc(blockName(b) || 'блок')}</b></i>`).join('')}${bs.length>max ? `<span class="more">ещё ${bs.length-max}</span>` : ''}</span>`;
}
const compCell = () => `<span class="stcell comp">${DAYICON.comp}<s>Соревнование</s></span>`;

/* Метки группы в клетке дня (GRP-3, GRP-4). У клиента: тренировка пришла из
   группы — «как в группе» или «изменена» тренером для этого клиента. У группы:
   сколько участников её получили, у скольких она поправлена и у кого в этот
   день другая тренировка. */
const GRPICON = '<svg viewBox="0 0 16 16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="5.2" r="2.2"/><path d="M1.8 13.2c0-2.4 1.9-4.2 4.2-4.2s4.2 1.8 4.2 4.2"/><path d="M10.6 3.3a2.1 2.1 0 0 1 0 4M12.2 9.4c1.2.5 2 1.8 2 3.4"/></svg>';
/* В узкой клетке (полоса конструктора) подпись сокращается до чисел —
   см. @container в base-trainer.css; полный текст остаётся в подсказке. */
function grpTag(x){
  const G = dayGroup(x); if(!G) return '';
  return `<span class="gtags"><span class="gtag" title="Тренировка группы «${esc(G.n)}»">${GRPICON}<b>${esc(G.n)}</b></span></span>`;
}
/* У группы метка появляется, только если тренировка стоит не у всех:
   кого-то пропустили при публикации или он вступил позже. */
function grpStatTag(G, date){
  const s = groupDayStat(G, date); if(!s || !s.none.length) return '';
  const got = s.got.length, n = G.members.length;
  return `<span class="gtags"><span class="gtag busy" title="Тренировка стоит у ${got} из ${n} участников: у остальных на этот день своя тренировка или они вступили позже">${GRPICON}<b class="lg">${got ? 'у ' + got + ' из ' + n : 'ни у кого'}</b><b class="sh">${got}/${n}</b></span></span>`;
}

/* ═══════════ КАЛЕНДАРЬ БЕЗ «СРОКА ПРОГРАММЫ» (CAL-1) ═══════════
   Программа — только способ добавить набор тренировок разом; на календарь
   она не накладывает границ. Контейнер дней у клиента один (c.prog): если
   программы нет — создаём личную, если день раньше старта — сдвигаем старт
   назад и переиндексируем план и сохранённые дни. Сдвиг и личные контейнеры
   запоминаем в STATE, иначе после перезагрузки дни разъедутся. */
function ensureDay(cid, date){
  const c = who(cid); if(!c) return null;       /* у группы контейнер есть всегда */
  let changed = false;
  if(!c.prog){
    const id = 'cal_' + cid;
    if(!program(id)) PROGRAMS.push({id, title:'Тренировки', goal:'', days:1, clients:[cid], start:date, kind:'individual', personal:true, time:null});
    PLAN[id] ||= []; c.prog = id;
    ((STATE.calprog ||= {})[cid] = {id, start:date});
    changed = true;
  }
  const p = program(c.prog); let shift = 0;
  if(date < p.start){
    changed = true;
    shift = daysBetween(date, p.start);
    PLAN[c.prog] = Array(shift).fill(null).concat(PLAN[c.prog] || []);
    /* Сдвигаются и сохранённые дни, и несохранённые правки конструктора (CON-20). */
    ['days', 'unsaved'].forEach(key => { const bag = (STATE[key]||{})[c.prog];
      if(bag){ const nb = {}; Object.keys(bag).forEach(k=>{ nb[+k+shift] = bag[k] }); STATE[key][c.prog] = nb; } });
    p.start = date; p.days += shift;
    ((STATE.pstart ||= {})[c.prog] = {start:p.start, shift:((STATE.pstart||{})[c.prog]||{}).shift + shift || shift});
  }
  const i = daysBetween(p.start, date);
  if(i >= p.days) p.days = i + 1;
  /* Пишем, только если что-то завели или сдвинули: группа зовёт ensureDay на
     каждого участника при каждой правке своего дня. */
  if(changed) saveState();
  return {pid:c.prog, i, shift};
}
/* Восстановление после перезагрузки: личные контейнеры и сдвинутые старты. */
(function(){
  Object.entries(STATE.calprog||{}).forEach(([cid, q])=>{ const c = client(cid); if(!c) return;
    if(!program(q.id)) PROGRAMS.push({id:q.id, title:'Тренировки', goal:'', days:1, clients:[cid], start:q.start, kind:'individual', personal:true, time:null});
    PLAN[q.id] ||= []; c.prog = q.id; });
  Object.entries(STATE.pstart||{}).forEach(([pid, q])=>{ const p = program(pid); if(!p || !q.shift) return;
    if(q.start < p.start){ const k = daysBetween(q.start, p.start); PLAN[pid] = Array(k).fill(null).concat(PLAN[pid] || []); p.start = q.start; p.days += k; } });
})();

/* ═══════════ ПОДРОБНЫЙ ВИД ДНЯ: блоки → упражнения со схемой и нагрузкой ═══════════
   Третий вид календаря и полосы недель: видна иерархия «блок → упражнения»,
   у упражнения — подходы×повторы, процент от ПМ и рабочий вес (или объём). */
/* Неразрывные пробелы внутри «40 %» и «500 м»: перенос допустим только между частями схемы. */
const itemLabel = it => it.txt ? it.txt : [it.scheme, loadText(it)].filter(Boolean).join(' · ');
/* Связка: «Взятие на грудь + Фронтальный присед + Толчок: 80 % · 90 кг — 3×(1+1+1)». */
const chainNames = it => (it.parts || []).filter(partHas).map(partName).join(' + ');
function chainHTML1(it, pm){
  const kg = pm ? kgText(it, pm) : null, sc = chainScheme(it);
  const load = [esc(loadText(it)), kg ? `<u>${kg}\u00a0кг</u>` : ''].filter(Boolean).join(' · ');
  const prm = [load, esc(sc)].filter(Boolean).join(' — ');
  return esc(chainNames(it)) + (prm ? `: <em>${prm}</em>` : '');
}
const chainText = it => { const prm = [loadText(it), chainScheme(it)].filter(Boolean).join(' — '); return chainNames(it) + (prm ? ': ' + prm : '') };
/* Сообщение тренера ко всей тренировке (COM-4): чей день — клиента или группы. */
const dayMsg = (sid, date) => !sid ? '' : ((TALK.workout[talkKey(sid, date)] || []).find(m => m.who === 'trainer') || {}).text || '';
/* sid — чей день (клиент или группа): по нему находится сообщение тренера к
   тренировке, оно стоит первым, над блоками, — так его читает и клиент. */
function blocksDetail(x, cid, sid = cid){
  const pm = cid ? pmOf(cid) : null;
  const has = itemHas;
  const bs = (x.blocks||[]).filter(blockHas); if(!bs.length) return '';
  const msg = dayMsg(sid, x.date);
  const row = it => { if(it.chain) return `<div class="bxi bxch"><span>${chainHTML1(it, pm)}</span></div>`;
    const e = it.exId ? byId(it.exId) : null; const kg = e && pm ? kgText(it, pm) : null;
    return `<div class="bxi"><span>${esc(e ? e.ru : (it.raw||''))}</span><em>${esc(itemLabel(it))}${kg!=null ? `${itemLabel(it)?' · ':''}<u>${kg}\u00a0кг</u>` : ''}</em></div>` };
  /* Суперсет — подгруппой: подпись «Суперсет · 3 круга» и его упражнения.
     Блок текстом — строками как написан, без схемы и весов. */
  const body = b => { if(isTextBlock(b)) return textLines(b.text).map(l => `<div class="bxi bxt"><span>${esc(l)}</span></div>`).join('');
    let h = '', k = 0; const its = b.items;
    while(k < its.length){
      if(its[k].ss){ const j = ssEnd(its, k), mem = its.slice(k + 1, j).filter(has);
        if(mem.length) h += `<div class="bxss"><div class="bxssh">${esc(ssLabel(its[k]))}</div>${mem.map(row).join('')}</div>`;
        k = j; continue }
      if(has(its[k])) h += row(its[k]);
      k++;
    }
    return h };
  return `<div class="bxs">${msg ? `<div class="bxmsg" title="${esc(msg)}">${CHATICON}<span>${esc(msg)}</span></div>` : ''}${bs.map((b,i)=>`<div class="bx">
    <div class="bxh"><s>${i+1}</s><b>${esc(b.title || blockTypeLabel(b) || (isTextBlock(b) ? 'Блок текстом' : 'Блок'))}</b>${b.fmt && b.title ? `<i>${esc(fmtLabel(b.fmt))}</i>` : ''}</div>
    ${body(b)}
  </div>`).join('')}</div>`;
}
