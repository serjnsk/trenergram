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

/* ─── Тренер и его рабочее пространство (REG-3) ─── */
const TRAINER = {
  n:'Сергей Ковальчук', ini:'СК', workspace:'CrossFit Ладья',
  invite:'https://trenergram.app/j/kovalchuk',
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

/* ─── База упражнений (EX-1) · гибкие показатели (EX-3) ─── */
const EX = [
 {id:'squat',  ru:'Приседания со штангой',      en:'Back Squat',       g:'Ноги',    eq:'Штанга',   pm:'squat',  u:['кг','повт'],              m:'ok',      own:false},
 {id:'fsquat', ru:'Фронтальный присед',          en:'Front Squat',      g:'Ноги',    eq:'Штанга',   pm:'fsquat', u:['кг','повт'],              m:'ok',      own:false},
 {id:'dead',   ru:'Становая тяга',               en:'Deadlift',         g:'Спина',   eq:'Штанга',   pm:'dead',   u:['кг','повт'],              m:'ok',      own:false},
 {id:'bench',  ru:'Жим лёжа',                    en:'Bench Press',      g:'Грудь',   eq:'Штанга',   pm:'bench',  u:['кг','повт'],              m:'ok',      own:false,
  gif:'assets/ex/0025'},   /* сэмпл EDB (exercisedb.io): 0025 barbell bench press, 180/360/720/1080 */
 {id:'press',  ru:'Жим стоя',                    en:'Strict Press',     g:'Плечи',   eq:'Штанга',   pm:'press',  u:['кг','повт'],              m:'ok',      own:false},
 {id:'clean',  ru:'Взятие на грудь в стойку',    en:'Power Clean',      g:'ТА',      eq:'Штанга',   pm:'clean',  u:['кг','повт'],              m:'pending', own:false},
 {id:'snatch', ru:'Рывок',                       en:'Snatch',           g:'ТА',      eq:'Штанга',   pm:'snatch', u:['кг','повт'],              m:'pending', own:false},
 {id:'jerk',   ru:'Толчок от груди',             en:'Push Jerk',        g:'ТА',      eq:'Штанга',   pm:'jerk',   u:['кг','повт'],              m:'pending', own:false},
 {id:'thrust', ru:'Трастер',                     en:'Thruster',         g:'Кроссфит',eq:'Штанга',   pm:null,     u:['кг','повт'],              m:'ok',      own:false},
 {id:'pullup', ru:'Подтягивания',                en:'Pull-up',          g:'Спина',   eq:'Турник',   pm:null,     u:['повт'],                   m:'ok',      own:false},
 {id:'c2b',    ru:'Подтягивания до груди',       en:'Chest-to-Bar',     g:'Кроссфит',eq:'Турник',   pm:null,     u:['повт'],                   m:'pending', own:false},
 {id:'hspu',   ru:'Отжимания в стойке на руках', en:'HSPU',             g:'Кроссфит',eq:'Своё тело',pm:null,     u:['повт'],                   m:'pending', own:false},
 {id:'du',     ru:'Двойные прыжки',              en:'Double-unders',    g:'Кроссфит',eq:'Скакалка', pm:null,     u:['повт','сек'],             m:'ok',      own:false},
 {id:'wb',     ru:'Wall Ball',                   en:'Wall Ball Shots',  g:'Кроссфит',eq:'Мяч',      pm:null,     u:['повт','кг'],              m:'ok',      own:false},
 {id:'row',    ru:'Гребля',                      en:'Row',              g:'Кардио',  eq:'Эргометр', pm:null,     u:['м','сек','темп','кал'],   m:'ok',      own:false},
 {id:'bike',   ru:'Эйрбайк',                     en:'Echo Bike',        g:'Кардио',  eq:'Эргометр', pm:null,     u:['кал','сек','мощность'],   m:'pending', own:false},
 {id:'run',    ru:'Бег',                         en:'Run',              g:'Кардио',  eq:'—',        pm:null,     u:['м','сек','темп','пульс'], m:'ok',      own:false},
 {id:'burpee', ru:'Бёрпи',                       en:'Burpee',           g:'Кроссфит',eq:'—',        pm:null,     u:['повт'],                   m:'ok',      own:false},
 {id:'box',    ru:'Запрыгивания на тумбу',       en:'Box Jump',         g:'Ноги',    eq:'Тумба',    pm:null,     u:['повт','высота'],          m:'ok',      own:false},
 {id:'ttb',    ru:'Носки к перекладине',         en:'Toes-to-Bar',      g:'Кор',     eq:'Турник',   pm:null,     u:['повт'],                   m:'ok',      own:false},
 {id:'lunge',  ru:'Выпады с гантелями',          en:'DB Walking Lunge', g:'Ноги',    eq:'Гантели',  pm:null,     u:['повт','м','кг'],          m:'ok',      own:false},
 {id:'kbs',    ru:'Махи гирей',                  en:'KB Swing',         g:'Кроссфит',eq:'Гиря',     pm:null,     u:['повт','кг'],              m:'ok',      own:false},
 {id:'ring',   ru:'Отжимания на кольцах',        en:'Ring Dip',         g:'Грудь',   eq:'Кольца',   pm:null,     u:['повт'],                   m:'ok',      own:false},
 {id:'ghd',    ru:'GHD Sit-up',                  en:'GHD Sit-up',       g:'Кор',     eq:'GHD',      pm:null,     u:['повт'],                   m:'pending', own:false},
 {id:'plank',  ru:'Планка',                      en:'Plank',            g:'Кор',     eq:'—',        pm:null,     u:['сек'],                    m:'ok',      own:false},
 {id:'rom',    ru:'Суставная разминка',          en:'Joint ROM',        g:'Мобилити',eq:'—',        pm:null,     u:['сек'],                    m:'ok',      own:false},
 {id:'couch',  ru:'Растяжка «Couch»',            en:'Couch Stretch',    g:'Мобилити',eq:'—',        pm:null,     u:['сек'],                    m:'pending', own:false},
 {id:'pvc',    ru:'Мобилити плеч с PVC',         en:'PVC Pass-through', g:'Мобилити',eq:'PVC',      pm:null,     u:['повт'],                   m:'ok',      own:false},
 /* EX-2 — собственные упражнения тренера: видны только ему и его клиентам */
 {id:'sled',   ru:'Толкание саней',              en:'Sled Push',        g:'Ноги',    eq:'Сани',     pm:null,     u:['м','кг','сек'],           m:'ok',      own:true},
 {id:'ropec',  ru:'Лазание по канату',           en:'Rope Climb',       g:'Спина',   eq:'Канат',    pm:null,     u:['повт','м'],               m:'pending', own:true},
 {id:'copen',  ru:'Раскрытие грудного отдела',   en:'T-Spine Opener',   g:'Мобилити',eq:'Ролл',     pm:null,     u:['сек','повт'],             m:'ok',      own:true, vid:false},
 /* Добавлены, потому что на них ссылаются блоки общей базы: без них панель
    источников падала на первом же блоке и вкладка «Блоки» молчала. */
 {id:'pushup', ru:'Отжимания', en:'Push-up', g:'Грудь', eq:'Своё тело', pm:null, u:['повт'], m:'pending', own:false},
];
/* Техника — поле базы упражнений (EX-1). В боевой версии приезжает из датасета
   вместе с гифкой; здесь заполнено для упражнений этой тренировки. */
const TECH = {
 squat:'Штанга на трапеции, стопы чуть шире плеч, носки развёрнуты. Колени идут в сторону носков, спина нейтральна. Опускаться до параллели бедра с полом или ниже.',
 dead:'Гриф над серединой стопы, лопатки над грифом. Спина прямая от начала до конца, таз и плечи поднимаются одновременно. В верхней точке не отклоняться назад.',
 bench:'Лопатки сведены и прижаты, стопы упёрты в пол. Гриф опускается к низу груди, локти под углом 45° к корпусу.',
 press:'Гриф на передних дельтах, локти под грифом. Корпус жёсткий, ягодицы напряжены. Голова уходит назад, гриф идёт по прямой вверх.',
 clean:'Старт как в становой. Разгон бёдрами, затем быстрый подсед под штангу. Локти выходят вперёд, гриф ложится на дельты.',
 snatch:'Широкий хват, гриф над серединой стопы. Плавный съём, ускорение от бедра, глубокий подсед. Штанга фиксируется на прямых руках над головой.',
 pullup:'Хват чуть шире плеч, в нижней точке руки полностью выпрямлены. Подтягиваться до касания подбородком уровня перекладины.',
 ttb:'Вис на прямых руках, плечи активны. Носки касаются перекладины, обратно опускаться подконтрольно, не раскачиваясь.',
 hspu:'Стойка на руках у стены, ладони чуть шире плеч. Опускаться до касания головой пола, затем выжимать в исходное.',
 ring:'Кольца прижаты к корпусу, плечи ниже локтей в нижней точке. В верхней — полное выпрямление рук с разворотом колец.',
 bike:'Работают руки и ноги одновременно. Держать ровный темп, не срываться на первых калориях.',
 row:'Последовательность: ноги, корпус, руки. Возврат в обратном порядке. Спина нейтральна, тяга к низу груди.',
 plank:'Локти под плечами, таз не проваливается и не задирается. Ягодицы и живот напряжены, шея продолжает линию спины.',
 couch:'Колено у стены, стопа вверх, таз подкручен. Тянуть переднюю поверхность бедра, не прогибаясь в пояснице.',
 rom:'Последовательно по суставам сверху вниз: шея, плечи, локти, таз, колени, голеностоп. Без рывков.',
 pvc:'Широкий хват на трубе, руки прямые. Провести трубу над головой за спину и обратно, не сгибая локти.',
 box:'Отталкиваться двумя ногами, приземляться мягко на всю стопу. Полное выпрямление на тумбе.',
 lunge:'Шаг вперёд, колено задней ноги почти касается пола. Корпус вертикально, гантели вдоль тела.',
 thrust:'Фронтальный присед и жим одним движением. Штанга выходит вверх на разгибании ног.',
 wb:'Присед до параллели, бросок мяча в цель на выдохе. Ловить мяч и сразу уходить в следующий присед.',
 du:'Прыжок невысокий, вращение кистями, а не руками. Локти прижаты к корпусу.',
 burpee:'Грудь касается пола, в верхней точке полное выпрямление с прыжком.',
 kbs:'Разгон гирей за счёт таза, а не рук. Спина прямая, гиря выходит на уровень глаз или выше.',
 c2b:'Как обычные подтягивания, но касание перекладины грудью, а не подбородком.',
 ghd:'Опускаться подконтрольно до касания руками пола, подниматься одним движением.',
 fsquat:'Гриф на передних дельтах, локти высоко. Корпус максимально вертикально, колени вперёд.',
 jerk:'Короткий подсед, мощное выталкивание, уход под штангу. Фиксация на прямых руках.',
 run:'Ровный темп, дыхание в ритм. Приземление под центр тяжести.',
 sled:'Корпус наклонён вперёд, руки прямые. Толкать ногами, шаг короткий и частый.',
 ropec:'Захват каната ногами, подъём за счёт ног. Спуск подконтрольный, не скользить ладонями.',
 copen:'Ролл под лопатками, руки за головой. Прогибаться через ролл на выдохе, поясницу не включать.',
};
const GROUPS = ['Все','Ноги','Спина','Грудь','Плечи','ТА','Кроссфит','Кардио','Кор','Мобилити'];
const EQUIP  = ['Штанга','Гантели','Гиря','Турник','Кольца','Эргометр','Скакалка','Тумба','Мяч','Канат','Сани','GHD','PVC','Ролл','Своё тело','—'];
const byId = id => EX.find(e=>e.id===id);
const PMNAMES = {squat:'Присед',fsquat:'Фронт. присед',dead:'Становая',bench:'Жим лёжа',press:'Жим стоя',clean:'Взятие на грудь',snatch:'Рывок',jerk:'Толчок'};

const ALIAS = {
 squat:['присед','приседания','присед со штангой','back squat','бэк сквот'],
 fsquat:['фронтальный присед','фронт присед','фронтач','front squat'],
 dead:['становая','становая тяга','тяга становая','deadlift'],
 bench:['жим лежа','жим лёжа','жим штанги лежа','bench','bench press'],
 press:['жим стоя','жим стоя со штангой','strict press','military press'],
 clean:['взятие на грудь','взятие','клин','power clean','clean'],
 snatch:['рывок','снэтч','snatch'], jerk:['толчок','швунг толчковый','push jerk','jerk'],
 thrust:['трастер','трастеры','thruster','thrusters'],
 pullup:['подтягивания','подтягивание','пулап','pull up','pullup','pull-ups'],
 c2b:['до груди','подтягивания до груди','c2b','chest to bar'],
 hspu:['hspu','отжимания в стойке','стойка на руках','handstand push up'],
 du:['двойные','двойные прыжки','дабл андеры','double unders','du'],
 wb:['wall ball','волбол','мяч в стену','wallball'],
 row:['гребля','гребной','гребем','row','rower','erg'],
 bike:['эйрбайк','эйр байк','байк','велосипед','echo bike','assault bike'],
 run:['бег','пробежка','run','бегом'], burpee:['берпи','бёрпи','burpee','burpees'],
 box:['тумба','запрыгивания','запрыгивания на тумбу','box jump'],
 ttb:['носки к перекладине','ttb','toes to bar'],
 lunge:['выпады','выпады с гантелями','lunge','walking lunge'],
 kbs:['махи гирей','махи','свинг','гиря','kb swing','kettlebell swing'],
 ring:['кольца','отжимания на кольцах','ring dip','ring dips'],
 ghd:['ghd','гхд'], plank:['планка','plank'],
 rom:['суставная разминка','разминка суставов','мобилити','joint rom'],
 couch:['кауч','couch','couch stretch','растяжка','растяжка бедра'],
 pvc:['pvc','выкруты','мобилити плеч','pass through'],
 sled:['сани','толкание саней','sled','sled push'],
 ropec:['канат','лазание по канату','rope climb'],
 copen:['раскрытие грудного','t-spine','грудной отдел'],
};
/* ═══ Расширение базы до 100 упражнений — для проверки поиска, таблиц и панелей
   на реальном объёме. Ключ pm у вариаций — от базового движения. ═══ */
EX.push(
 {id:'bsquat', ru:'Болгарский сплит-присед', en:'Bulgarian Split Squat', g:'Ноги', eq:'Гантели', pm:null, u:['повт','кг'], m:'ok', own:false},
 {id:'gsquat', ru:'Гоблет-присед', en:'Goblet Squat', g:'Ноги', eq:'Гиря', pm:null, u:['повт','кг'], m:'ok', own:false},
 {id:'legpress', ru:'Жим ногами', en:'Leg Press', g:'Ноги', eq:'Тренажёр', pm:null, u:['повт','кг'], m:'ok', own:false},
 {id:'rdl', ru:'Румынская тяга', en:'Romanian Deadlift', g:'Ноги', eq:'Штанга', pm:'rdl', u:['кг','повт'], m:'pending', own:false},
 {id:'hipthrust', ru:'Ягодичный мост', en:'Hip Thrust', g:'Ноги', eq:'Штанга', pm:null, u:['повт','кг'], m:'ok', own:true},
 {id:'stepup', ru:'Зашагивания на тумбу', en:'Step-up', g:'Ноги', eq:'Тумба', pm:null, u:['повт','кг'], m:'ok', own:false},
 {id:'pistol', ru:'Пистолетик', en:'Pistol Squat', g:'Ноги', eq:'Своё тело', pm:null, u:['повт'], m:'ok', own:false},
 {id:'legcurl', ru:'Сгибание ног', en:'Leg Curl', g:'Ноги', eq:'Тренажёр', pm:null, u:['повт','кг'], m:'ok', own:false},
 {id:'legext', ru:'Разгибание ног', en:'Leg Extension', g:'Ноги', eq:'Тренажёр', pm:null, u:['повт','кг'], m:'ok', own:false},
 {id:'calf', ru:'Подъём на носки', en:'Calf Raise', g:'Ноги', eq:'Тренажёр', pm:null, u:['повт','кг'], m:'ok', own:false},
 {id:'ohsquat', ru:'Присед над головой', en:'Overhead Squat', g:'Ноги', eq:'Штанга', pm:'ohsquat', u:['кг','повт'], m:'pending', own:false},
 {id:'boxsquat', ru:'Присед на ящик', en:'Box Squat', g:'Ноги', eq:'Штанга', pm:'squat', u:['кг','повт'], m:'ok', own:false},
 {id:'sumo', ru:'Становая тяга сумо', en:'Sumo Deadlift', g:'Ноги', eq:'Штанга', pm:'dead', u:['кг','повт'], m:'ok', own:false},
 {id:'nordic', ru:'Нордические сгибания', en:'Nordic Curl', g:'Ноги', eq:'Своё тело', pm:null, u:['повт'], m:'ok', own:true},
 {id:'gm', ru:'Наклоны со штангой', en:'Good Morning', g:'Ноги', eq:'Штанга', pm:null, u:['повт','кг'], m:'ok', own:false},
 {id:'bbrow', ru:'Тяга штанги в наклоне', en:'Barbell Row', g:'Спина', eq:'Штанга', pm:null, u:['повт','кг'], m:'ok', own:false},
 {id:'dbrow', ru:'Тяга гантели в наклоне', en:'Dumbbell Row', g:'Спина', eq:'Гантели', pm:null, u:['повт','кг'], m:'ok', own:false},
 {id:'latpull', ru:'Тяга верхнего блока', en:'Lat Pulldown', g:'Спина', eq:'Тренажёр', pm:null, u:['повт','кг'], m:'pending', own:false},
 {id:'seatrow', ru:'Тяга горизонтального блока', en:'Seated Cable Row', g:'Спина', eq:'Тренажёр', pm:null, u:['повт','кг'], m:'ok', own:false},
 {id:'chinup', ru:'Подтягивания обратным хватом', en:'Chin-up', g:'Спина', eq:'Турник', pm:null, u:['повт','кг'], m:'ok', own:false},
 {id:'bmu', ru:'Выход силой на перекладине', en:'Bar Muscle-up', g:'Спина', eq:'Турник', pm:null, u:['повт'], m:'ok', own:false},
 {id:'ringrow', ru:'Тяга на кольцах', en:'Ring Row', g:'Спина', eq:'Кольца', pm:null, u:['повт'], m:'ok', own:false},
 {id:'facepull', ru:'Тяга к лицу', en:'Face Pull', g:'Спина', eq:'Тренажёр', pm:null, u:['повт','кг'], m:'ok', own:true},
 {id:'hyperext', ru:'Гиперэкстензия', en:'Back Extension', g:'Спина', eq:'Тренажёр', pm:null, u:['повт','кг'], m:'ok', own:false},
 {id:'pendlay', ru:'Тяга Пендли', en:'Pendlay Row', g:'Спина', eq:'Штанга', pm:null, u:['повт','кг'], m:'pending', own:false},
 {id:'tbarrow', ru:'Т-тяга', en:'T-bar Row', g:'Спина', eq:'Тренажёр', pm:null, u:['повт','кг'], m:'ok', own:false},
 {id:'incline', ru:'Жим на наклонной скамье', en:'Incline Bench Press', g:'Грудь', eq:'Штанга', pm:'bench', u:['кг','повт'], m:'ok', own:false},
 {id:'dbpress', ru:'Жим гантелей лёжа', en:'Dumbbell Bench Press', g:'Грудь', eq:'Гантели', pm:null, u:['повт','кг'], m:'ok', own:false},
 {id:'dips', ru:'Отжимания на брусьях', en:'Dips', g:'Грудь', eq:'Брусья', pm:null, u:['повт','кг'], m:'ok', own:false},
 {id:'fly', ru:'Разведения гантелей', en:'Dumbbell Fly', g:'Грудь', eq:'Гантели', pm:null, u:['повт','кг'], m:'ok', own:false},
 {id:'cablefly', ru:'Сведения в кроссовере', en:'Cable Fly', g:'Грудь', eq:'Тренажёр', pm:null, u:['повт','кг'], m:'ok', own:false},
 {id:'floorpress', ru:'Жим с пола', en:'Floor Press', g:'Грудь', eq:'Штанга', pm:'bench', u:['кг','повт'], m:'pending', own:true},
 {id:'pushupw', ru:'Отжимания с весом', en:'Weighted Push-up', g:'Грудь', eq:'Своё тело', pm:null, u:['повт','кг'], m:'ok', own:false},
 {id:'pushpress', ru:'Швунг жимовой', en:'Push Press', g:'Плечи', eq:'Штанга', pm:'press', u:['кг','повт'], m:'ok', own:false},
 {id:'pushjerk', ru:'Швунг толчковый', en:'Push Jerk', g:'Плечи', eq:'Штанга', pm:'jerk', u:['кг','повт'], m:'ok', own:false},
 {id:'dbohp', ru:'Жим гантелей сидя', en:'Dumbbell Shoulder Press', g:'Плечи', eq:'Гантели', pm:null, u:['повт','кг'], m:'ok', own:false},
 {id:'latraise', ru:'Махи гантелями в стороны', en:'Lateral Raise', g:'Плечи', eq:'Гантели', pm:null, u:['повт','кг'], m:'ok', own:false},
 {id:'rearfly', ru:'Махи в наклоне', en:'Rear Delt Fly', g:'Плечи', eq:'Гантели', pm:null, u:['повт','кг'], m:'ok', own:false},
 {id:'arnold', ru:'Жим Арнольда', en:'Arnold Press', g:'Плечи', eq:'Гантели', pm:null, u:['повт','кг'], m:'pending', own:false},
 {id:'wallwalk', ru:'Выход в стойку у стены', en:'Wall Walk', g:'Плечи', eq:'Своё тело', pm:null, u:['повт'], m:'ok', own:false},
 {id:'zpress', ru:'Z-жим', en:'Z-press', g:'Плечи', eq:'Штанга', pm:null, u:['повт','кг'], m:'ok', own:true},
 {id:'hpc', ru:'Взятие с виса', en:'Hang Power Clean', g:'ТА', eq:'Штанга', pm:'clean', u:['кг','повт'], m:'ok', own:false},
 {id:'hps', ru:'Рывок с виса', en:'Hang Power Snatch', g:'ТА', eq:'Штанга', pm:'snatch', u:['кг','повт'], m:'ok', own:false},
 {id:'sqclean', ru:'Взятие в сед', en:'Squat Clean', g:'ТА', eq:'Штанга', pm:'clean', u:['кг','повт'], m:'ok', own:false},
 {id:'sqsnatch', ru:'Рывок в сед', en:'Squat Snatch', g:'ТА', eq:'Штанга', pm:'snatch', u:['кг','повт'], m:'ok', own:false},
 {id:'cleanpull', ru:'Тяга взятия', en:'Clean Pull', g:'ТА', eq:'Штанга', pm:'clean', u:['кг','повт'], m:'pending', own:false},
 {id:'snatchpull', ru:'Рывковая тяга', en:'Snatch Pull', g:'ТА', eq:'Штанга', pm:'snatch', u:['кг','повт'], m:'ok', own:false},
 {id:'splitjerk', ru:'Толчок в ножницы', en:'Split Jerk', g:'ТА', eq:'Штанга', pm:'jerk', u:['кг','повт'], m:'ok', own:false},
 {id:'snatchbal', ru:'Рывковый баланс', en:'Snatch Balance', g:'ТА', eq:'Штанга', pm:'snatch', u:['кг','повт'], m:'ok', own:false},
 {id:'cj', ru:'Взятие и толчок', en:'Clean & Jerk', g:'ТА', eq:'Штанга', pm:'jerk', u:['кг','повт'], m:'ok', own:true},
 {id:'musnatch', ru:'Силовой рывок', en:'Muscle Snatch', g:'ТА', eq:'Штанга', pm:'snatch', u:['кг','повт'], m:'ok', own:false},
 {id:'k2e', ru:'Колени к локтям', en:'Knees-to-elbows', g:'Кроссфит', eq:'Турник', pm:null, u:['повт'], m:'ok', own:false},
 {id:'dbsnatch', ru:'Рывок гантели', en:'Dumbbell Snatch', g:'Кроссфит', eq:'Гантели', pm:null, u:['повт','кг'], m:'pending', own:false},
 {id:'dbthr', ru:'Трастер с гантелями', en:'Dumbbell Thruster', g:'Кроссфит', eq:'Гантели', pm:null, u:['повт','кг'], m:'ok', own:false},
 {id:'devil', ru:'Дэвил-пресс', en:'Devil Press', g:'Кроссфит', eq:'Гантели', pm:null, u:['повт','кг'], m:'ok', own:false},
 {id:'manmaker', ru:'Мэн-мейкер', en:'Man Maker', g:'Кроссфит', eq:'Гантели', pm:null, u:['повт','кг'], m:'ok', own:false},
 {id:'bfb', ru:'Бёрпи через штангу', en:'Bar-facing Burpee', g:'Кроссфит', eq:'Штанга', pm:null, u:['повт'], m:'ok', own:false},
 {id:'boxover', ru:'Перепрыгивания через тумбу', en:'Box Jump Over', g:'Кроссфит', eq:'Тумба', pm:null, u:['повт','высота'], m:'ok', own:false},
 {id:'farmer', ru:'Прогулка фермера', en:'Farmer Carry', g:'Кроссфит', eq:'Гантели', pm:null, u:['м','кг'], m:'ok', own:true},
 {id:'ohcarry', ru:'Прогулка с весом над головой', en:'Overhead Carry', g:'Кроссфит', eq:'Штанга', pm:null, u:['м','кг'], m:'pending', own:false},
 {id:'sandbag', ru:'Взятие мешка на плечо', en:'Sandbag to Shoulder', g:'Кроссфит', eq:'Мешок', pm:null, u:['повт','кг'], m:'ok', own:false},
 {id:'rmu', ru:'Выход силой на кольцах', en:'Ring Muscle-up', g:'Кроссфит', eq:'Кольца', pm:null, u:['повт'], m:'ok', own:false},
 {id:'handwalk', ru:'Ходьба на руках', en:'Handstand Walk', g:'Кроссфит', eq:'Своё тело', pm:null, u:['м'], m:'ok', own:false},
 {id:'slamball', ru:'Слэмбол', en:'Slam Ball', g:'Кроссфит', eq:'Мяч', pm:null, u:['повт','кг'], m:'ok', own:false},
 {id:'kbclean', ru:'Взятие гири', en:'Kettlebell Clean', g:'Кроссфит', eq:'Гиря', pm:null, u:['повт','кг'], m:'ok', own:false},
 {id:'kbpress', ru:'Жим гири', en:'Kettlebell Press', g:'Кроссфит', eq:'Гиря', pm:null, u:['повт','кг'], m:'ok', own:false},
 {id:'tgu', ru:'Турецкий подъём', en:'Turkish Get-up', g:'Кроссфит', eq:'Гиря', pm:null, u:['повт','кг'], m:'pending', own:false},
 {id:'legless', ru:'Канат без ног', en:'Legless Rope Climb', g:'Кроссфит', eq:'Канат', pm:null, u:['повт'], m:'ok', own:true}
);
Object.assign(ALIAS, {
 bbrow:['тяга в наклоне','тяга штанги в наклоне','barbell row'], pushpress:['швунг','швунг жимовой','push press'],
 dips:['брусья','отжимания на брусьях'], latpull:['тяга верхнего блока','верхний блок','lat pulldown'],
 situp:['ситап','сит-ап','sit-up','sit up'], run:['бег','run','пробежка'], ski:['лыжи','skierg','ски эрг'],
 farmer:['фермер','прогулка фермера','farmer carry'], hpc:['взятие с виса','hang power clean','hang clean'],
 dbsnatch:['рывок гантели','db snatch'], gsquat:['гоблет','гоблет присед','goblet squat'], rdl:['румынская','румынская тяга','rdl'],
 hipthrust:['ягодичный мост','hip thrust'], tgu:['турецкий подъём','tgu','get up'], cj:['толчок','clean and jerk','c&j'],
 c2b:['c2b','до груди','chest to bar'], bmu:['bmu','выход силой','bar muscle up'], rmu:['rmu','выход на кольцах','ring muscle up'],
 devil:['devil press','дэвил пресс','девил пресс'], hollow:['холлоу','hollow'],
});

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
  items:[['rom','2×',60,'сек'],['pvc','2×10'],['row','',500,'м']]},
 {id:'b2', lvl:'блок', own:true, at:'2026-06-04', folder:'Разминки', kind:'warmup', title:'Разминка перед приседом', used:21,
  items:[['rom','',90,'сек'],['squat','3×5',40,'%'],['box','2×5']]},
 {id:'b3', lvl:'блок', own:true, at:'2026-07-15', folder:'Разминки', kind:'warmup', title:'Разминка ТА', used:12,
  items:[['pvc','3×10'],['snatch','3×3',40,'%']]},
 {id:'b4', lvl:'блок', own:true, at:'2026-06-21', folder:'Силовые блоки', kind:'strength', title:'Присед 5×3 @ 75–85 %', used:18,
  items:[['squat','5×3',80,'%'],['lunge','3×10']]},
 {id:'b5', lvl:'блок', own:true, at:'2026-06-21', folder:'Силовые блоки', kind:'strength', title:'Жим + подтягивания', used:15,
  items:[['bench','5×5',75,'%'],['pullup','5×8']]},
 {id:'b6', lvl:'блок', own:true, at:'2026-07-28', folder:'Силовые блоки', kind:'strength', title:'Становая 3×5 @ 70 %', used:9,
  items:[['dead','3×5',70,'%'],['ttb','3×12']]},
 {id:'b7', lvl:'блок', own:true, at:'2026-05-22', folder:'Комплексы', kind:'complex', title:'«Fran» · 21-15-9', used:7, fmt:'For time 8',
  items:[['thrust','21-15-9',43,'кг'],['pullup','21-15-9']]},
 {id:'b8', lvl:'блок', own:true, at:'2026-08-11', folder:'Комплексы', kind:'complex', title:'EMOM 12 · сила + кардио', used:11, fmt:'EMOM 12',
  items:[['clean','3',70,'%'],['bike','',12,'кал']]},
 {id:'b9', lvl:'блок', own:true, at:'2026-08-19', folder:'Комплексы', kind:'complex', title:'AMRAP 15 · гимнастика', used:6, fmt:'AMRAP 15',
  items:[['wb','',15,'повт'],['du','',50,'повт'],['box','10']]},
 {id:'b10', lvl:'блок', own:true, at:'2026-05-18', folder:'Заминки', kind:'cooldown', title:'Заминка / растяжка · 8 мин', used:29,
  items:[['couch','2×',90,'сек'],['plank','3×',45,'сек']]},
 {id:'b11', lvl:'блок', own:true, at:'2026-09-10', folder:'Силовые блоки', kind:'accessory', title:'Жим + тяга гантелей', used:4,
  items:[['@ss',4,'90 сек'],['dbpress','10',22.5,'кг','',1],['dbrow','10',22.5,'кг','',1]]},

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
  items:[['rom','2×',60,'сек'],['pvc','2×10']]},
 {id:'sb2', lvl:'блок', own:false, folder:'Разминки', kind:'warmup', title:'Кардио-разогрев · гребля', used:0,
  items:[['row','',750,'м'],['box','2×8']]},
 {id:'sb3', lvl:'блок', own:false, folder:'Силовые блоки', kind:'strength', title:'Линейная прогрессия · присед 3×5', used:0,
  items:[['squat','3×5',75,'%']]},
 {id:'sb4', lvl:'блок', own:false, folder:'Силовые блоки', kind:'strength', title:'Жим стоя 5×5', used:0,
  items:[['press','5×5',70,'%'],['ttb','3×10']]},
 {id:'sb5', lvl:'блок', own:false, folder:'Комплексы', kind:'complex', title:'«Cindy» · AMRAP 20', used:0, fmt:'AMRAP 20',
  items:[['pullup','5'],['pushup','10'],['squat','15']]},
 {id:'sb6', lvl:'блок', own:false, folder:'Комплексы', kind:'complex', title:'«Helen»', used:0, fmt:'3 раунда на время',
  items:[['row','',400,'м'],['kbs','21'],['pullup','12']]},
 {id:'sb7', lvl:'блок', own:false, folder:'Заминки', kind:'stretch', title:'Растяжка задней цепи · 6 мин', used:0,
  items:[['couch','2×',60,'сек']]},

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
  const i = mkItem(ex, scheme||'');
  if(unit==='%') i.pct = parseFloat(val);
  else if(val!=null && val!==''){ i.unit = unit || i.unit; i.val = String(val) }
  if(txt) i.txt = txt;
  if(sub) i.sub = true;
  return i;
}
/* Копия настройки: объект из шаблона нельзя отдавать блоку по ссылке — правка
   параметров в тренировке молча меняла бы шаблон в базе. */
const fmtCopy = f => !f ? null : typeof f === 'string' ? f : {...f};
const tplToBlock = t => normFmt({id:nid('b'), kind:t.kind||null, title:t.title.replace(/\s·.*$/,''),
                          note:'', fmt:fmtCopy(t.fmt), items:(t.items||[]).map(tplLine)});
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
  if(t.lvl==='блок') return {n:(t.items||[]).filter(x=>x[0]!==SS_TAG).length};
  if(t.lvl==='тренировка'){ const w=tplToWorkout(t);
    return {n:w.blocks.reduce((a,b)=>a+b.items.filter(i=>!i.ss).length,0), blocks:w.blocks.length} }
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
        bench:[['2026-04-06',100],['2026-05-25',105],['2026-07-13',107.5],['2026-08-17',110]]},
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
const mkBlock = (kind,title,note,fmt,items) => ({id:nid('b'), kind, title, note:note||'', fmt:fmt||null,
  items:(items||[]).map(a => a[0] === SS_TAG ? ssItem(a[1], a[2])
    : Object.assign(mkItem(a[0],a[1]||'',a[2]??null,a[3]||null,a[4]||'',a[5]||''), a[6] ? {sub:true} : {}))});
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
const ssLabel = h => 'Суперсет · ' + h.rounds + ' ' + plural3(+h.rounds, 'круг', 'круга', 'кругов') + (h.rest ? ' · отдых ' + h.rest : '');
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
  const m = L.match(/^(?:суперсет\s*[x×х]?\s*)?(\d{1,2})\s*(?:раза?|круг[а-яё]*|раунд[а-яё]*)$/i)
         || L.match(/^суперсет(?:\s*[x×х]\s*(\d{1,2}))?$/i);
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
  {date:'2026-08-12', cid:'c1', exId:'dead',  scheme:'3×5',  kg:130},
  {date:'2026-08-12', cid:'c1', exId:'dead',  scheme:'2×3',  kg:150},
  {date:'2026-08-12', cid:'c1', exId:'ttb',   scheme:'4×12', kg:null, done:'4×9'},
  {date:'2026-08-19', cid:'c1', exId:'dead',  scheme:'3×5',  kg:132.5},
  {date:'2026-08-19', cid:'c1', exId:'dead',  scheme:'2×3',  kg:155},
  {date:'2026-08-19', cid:'c1', exId:'ttb',   scheme:'4×12', kg:null, done:'4×10'},
  {date:'2026-08-19', cid:'c1', exId:'ring',  scheme:'4×8',  kg:null, done:'4×8'},
  {date:'2026-08-19', cid:'c1', exId:'hspu',  scheme:'4×6',  kg:null, done:'4×5'},
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
    'c1@dead': [
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
    ['warmup','Разминка','Темп спокойный, без отказа',null,[['rom','2×',null,'сек','60'],['pvc','2×10'],['row',null,null,'м','500']]],
    ['strength','Присед','Пауза 1 сек в нижней точке',null,[['squat','5×3',80],['squat','1×3',85]]],
    ['strength','Жим лёжа + подтягивания','',null,[['@ss',5,'90 сек'],['bench','5',75,null,'','',1],['pullup','8',null,null,'','',1]]],
    ['cooldown','Заминка','',null,[['couch','2×',null,'сек','90']]]]},
  {t:'Комплекс «Fran»', b:[
    ['warmup','Разминка','',null,[['rom','2×',null,'сек','60'],['burpee','2×8']]],
    ['complex','«Fran» 21-15-9','Цель — sub 5:00','For time 8',[['thrust','21-15-9',null,'кг','43'],['pullup','21-15-9']]]]},
  {t:'Сила · становая + гимнастика', b:[
    ['warmup','Разминка','Мобилити т/б сустава',null,[['rom','2×',null,'сек','90'],['row',null,null,'кал','15'],['pvc','2×10']]],
    ['strength','Становая тяга','Каждый подход с пола, сброс',null,[['dead','3×5',70],['dead','2×3',82.5]]],
    ['complex','EMOM 12','Нечётные — взятие, чётные — эйрбайк','EMOM 12',[['clean','3',70],['bike',null,null,'кал','12']]],
    ['gymnastics','Гимнастика','',null,[['ttb','4×12'],['ring','4×8'],['hspu','4×6']]],
    ['cooldown','Заминка','',null,[['plank','3×',null,'сек','45'],['couch','2×',null,'сек','90']]]]},
  null,
  {t:'ТА + метком', b:[
    ['warmup','Разминка ТА','',null,[['pvc','3×10'],['snatch','3×3',40]]],
    ['strength','Рывок','На технику, вес не выше 80 %',null,[['snatch','6×2',75]]],
    ['complex','AMRAP 15','','AMRAP 15',[['wb','15',null,'повт','15'],['du',null,null,'повт','50'],['box','10']]]]},
  {t:'Длинное кардио', b:[
    [null,'Аэробная база','Пульс 140–150',null,[['run',null,null,'м','5000'],['row',null,null,'м','2000']]]]},
  null],
 p2:[
  {t:'Сила · нижняя часть', b:[
    ['warmup','Разминка','',null,[['rom','2×',null,'сек','60'],['box','2×5']]],
    ['strength','Присед','Проценты индивидуальные',null,[['squat','5×5',75]]],
    ['strength','Тяга саней','',null,[['sled','4×',null,'м','20']]]]},
  {t:'Метком', b:[
    ['complex','EMOM 12','','EMOM 12',[['kbs','12',null,'кг','24'],['burpee','10']]]]},
  {t:'Восстановление · мобилити', b:[
    ['warmup','Мобилити','Лёгкая аэробная работа',null,[['copen','3×',null,'сек','45'],['pvc','3×10'],['row',null,null,'м','2000']]]]},
  {t:'Сила · верх тела', b:[
    ['warmup','Разминка','',null,[['pvc','3×10']]],
    ['strength','Жим лёжа','',null,[['bench','5×5',75]]],
    ['strength','Подтягивания + канат','',null,[['pullup','5×8'],['ropec','4×1']]]]},
  {t:'Комплекс', b:[
    ['complex','AMRAP 15','','AMRAP 15',[['thrust','12',null,'кг','40'],['c2b','9'],['du',null,null,'повт','40']]]]},
  {t:'Открытая тренировка', b:[
    [null,'Аэробная работа','',null,[['row',null,null,'м','3000'],['bike',null,null,'кал','40']]]]},
  null],
 p3:[
  {t:'Ноги · щадяще', b:[
    ['warmup','Разминка','Особое внимание колену',null,[['rom','3×',null,'сек','60'],['copen','2×',null,'сек','45']]],
    ['strength','Присед в частичной амплитуде','До боли не доводить',null,[['squat','4×6',60]]],
    ['cooldown','Заминка','',null,[['couch','2×',null,'сек','90']]]]},
  null,
  {t:'Верх тела', b:[
    ['warmup','Разминка','',null,[['pvc','3×10']]],
    ['strength','Жим + тяга','',null,[['bench','4×8',65],['pullup','4×6']]]]},
  null,
  {t:'Полное тело', b:[
    ['complex','Круговая','Без ударной нагрузки на колено',null,[['dead','4×6',65],['plank','3×',null,'сек','45'],['row',null,null,'м','1000']]]]},
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
  if(!d) return {...base, title:'Отдых', rest:true, comp:false, blocks:[]};
  return {...base, title:d.t, rest:false, comp:!!d.comp, blocks:d.b.map(b=>normFmt(mkBlock(b[0],b[1],b[2],b[3],b[4])))};
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
const serializeDay = x => JSON.stringify({t: x.title||'', ...(x.comp ? {c:1} : {}), b: (x.blocks||[]).filter(b=>(b.items||[]).length || b.title || b.note).map(b=>({k:b.kind, t:b.title||'', n:b.note||'', f:b.fmt||null,
  i:(b.items||[]).map(it=> it.ss ? {ss:1, n:it.rounds, z:it.rest||''} : ({e:it.exId||null, r:it.raw||null, s:it.scheme||'', p:it.pct??null, u:it.unit||'', v:it.val||'', x:it.txt||'', ...(it.sub ? {g:1} : {})}))}))});
const restoreBlocks = rec => (rec.b||[]).map(b=>normFmt({id:nid('b'), kind:b.k||null, title:b.t||'', note:b.n||'', fmt:b.f||null,
  items:(b.i||[]).map(it=> it.ss ? ssItem(it.n, it.z) : ({id:nid('i'), exId:it.e||null, raw:it.r||null, scheme:it.s||'', pct:it.p??null, unit:it.u||'', val:it.v||'', txt:it.x||'', ...(it.g ? {sub:true} : {})}))}));
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
    if(rec && rec.c){ const c = JSON.parse(rec.c); x.title = c.t; x.blocks = restoreBlocks(c); x.rest = !x.blocks.length; x.comp = !!c.c; }
    x.pub = rec && !rec.draft ? rec.c : (rec ? (rec.pub||'') : serializeDay(x));
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
  const e = item.exId && byId(item.exId);
  const k = pmKey(e);
  if(!k || item.pct == null || !pm) return null;
  const max = pm[k];
  if(!max) return null;
  return Math.round(max * item.pct / 100 / 2.5) * 2.5;
}
const fmtNum = v => String(v).replace('.', ',');

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

/* ═══════ Текст → структура (CON-5, OQ-10) ═══════ */
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
const NOL = '(?![а-яёa-z])';
const UNITS = [
  ['кг',  new RegExp('(\\d+(?:[.,]\\d+)?)\\s*(?:кг|kg)'+NOL,'i')],
  ['сек', new RegExp('(\\d+)\\s*(?:сек|sec)'+NOL,'i')],
  ['кал', new RegExp('(\\d+)\\s*(?:кал|cal)'+NOL,'i')],
  ['повт',new RegExp('(\\d+)\\s*(?:повт\\w*|reps?|раз)'+NOL,'i')],
  ['м',   new RegExp('(\\d+)\\s*(?:метр\\w*|м|m)'+NOL,'i')],
];
const RE_SCHEME = /\d+\s*[x×хХ]\s*\d+|\d+(?:\s*-\s*\d+)+/;
const RE_SETS   = /\d+\s*[x×хХ]/;
function parseText(txt){
  const out=[];
  for(const line of txt.split('\n')){
    const L = line.trim(); if(!L) continue;
    const f = parseFmt(L);
    if(f && !RE_SCHEME.test(L)){ out.push({type:'fmt',src:L,fmt:L,f}); continue }
    let rest=L, unit=null, val='';
    for(const [u,re] of UNITS){ const m=rest.match(re); if(m){ unit=u; val=m[1].replace(',','.'); rest=rest.replace(m[0],' '); break } }
    let pct=null;
    const mp = rest.match(/@?\s*(\d{1,3}(?:[.,]\d)?)\s*%/);
    if(mp){ pct=parseFloat(mp[1].replace(',','.')); rest=rest.replace(mp[0],' ') }
    let scheme='';
    const ms = rest.match(RE_SCHEME) || rest.match(RE_SETS);
    if(ms){ scheme = ms[0].replace(/\s/g,'').replace(/[xхХ]/,'×'); rest = rest.replace(ms[0],' ') }
    else{ const lead = rest.match(/^\s*(\d+)\s+(?=\D)/); if(lead){ scheme=lead[1]; rest=rest.replace(lead[0],' ') } }
    const e = matchEx(rest);
    if(!e){ out.push({type:'raw',src:L}); continue }
    const item = mkItem(e.id, scheme);
    item.pct = pct;
    if(unit){ item.unit=unit; item.val=val }
    /* После схемы, процента и единицы в строке остались цифры — значит запись
       сложнее, чем «подходы × повторы + нагрузка» («60×5, 70×5, 80×3×3»).
       Не теряем её молча: упражнение узнано, всё после названия — текстом. */
    if(/\d/.test(rest)){
      const mp2 = L.match(/^([^\d@%(]+?)\s+(?=[\d@%(])(.+)$/);
      if(mp2){ item.txt = mp2[2].trim(); item.scheme=''; item.pct=null; item.val=''; item.unit = e.u[0]||''; }
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
    if(rec && rec.c){ const cc = JSON.parse(rec.c); d = cc.b.some(b=>b.i.some(it=>it.e)) ? {t: cc.t||'Тренировка', b: cc.b.map(b=>[b.k]), draft: rec.draft} : null; }
    if(!d) continue;                            /* день отдыха */
    const date = dayDate(c.prog, i);
    if(date < from || date > to) continue;   /* был return из forEach — в цикле он обрывал функцию */
    const past = date < TODAY;
    const missed = past && c.streak===0 && daysBetween(date, TODAY) <= 5;
    out.push({cid, date, day:i+1, title:d.t, kind:d.b[d.b.length-1][0], draft:!!d.draft,
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
function composeQueue(){
  return PROGRAMS.map(p=>{
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

/* ═══ Демо-карточка EDB (exercisedb.io, сэмпл 0025 barbell bench press) ═══
   Все поля, которые есть в записи базы: часть тела, целевая и вспомогательные
   мышцы, оборудование, сложность, категория, описание, пошаговая техника,
   таксономия движения (17 признаков) и связи «похожие / замены / прогрессии /
   регрессии» с оценкой и причинами. Значения переведены; как и GIF, одна
   карточка показывается для всех упражнений — чтобы оценить раскладку. */
const EDB_R = {tm:'та же целевая мышца: грудные', bp:'та же часть тела: грудь', cat:'та же категория: силовое', fam:'то же семейство движения: жим лёжа',
  eq:'то же оборудование: штанга', sec:'пересечение вспомогательных мышц: дельты, трицепс', deq:'другое оборудование', bw:'вариант с собственным весом',
  grp:'та же группа движений: горизонтальный жим', up:'сложность: средний → продвинутый', dn:'сложность: средний → начальный'};
const EDB_T = {equipment_alternative:'другое оборудование', easier_alternative:'легче', same_equipment_alternative:'то же оборудование', bodyweight_alternative:'свой вес', higher_difficulty:'сложнее', lower_difficulty:'легче'};
const EDB_DEMO = {
  id:'0025', name:'barbell bench press',
  bodyPart:'Грудь', target:'Грудные', secondary:['Трицепс','Плечи'], equipment:'Штанга', difficulty:'Средний', category:'Силовое',
  description:'Жим штанги лёжа — классическое многосуставное упражнение, нагружающее в первую очередь грудные мышцы и включающее трицепс и плечи. Выполняется лёжа на скамье: штанга подконтрольно опускается к груди и выжимается вверх.',
  instructions:[
    'Лягте на скамью: стопы полностью на полу, спина прижата к скамье.',
    'Возьмите штангу прямым хватом чуть шире плеч.',
    'Снимите штангу со стоек и удерживайте её над грудью на полностью выпрямленных руках.',
    'Медленно опустите штангу к груди, локти держите прижатыми к корпусу.',
    'В момент касания груди сделайте короткую паузу.',
    'Выжмите штангу в исходное положение, выпрямляя руки.',
    'Повторите нужное число раз.'],
  taxonomy:[['Семейство движения','жим лёжа'],['Паттерн','горизонтальный жим'],['Механика','многосуставное'],['Тип усилия','жим'],['Плоскость','сагиттальная'],
    ['Латеральность','двустороннее'],['Положение тела','лёжа'],['Угол скамьи','горизонтальная'],['Категория оборудования','свободный вес'],['Тип нагрузки','свободный вес'],
    ['Регион','верх тела'],['Многосуставное','да'],['Одностороннее','нет'],['С ассистенцией','нет'],['С отягощением','да'],['Сигналы','внешняя нагрузка · свободный вес'],['Уверенность разметки','высокая']],
  similar:[
    {id:'0033', n:'Жим штанги на скамье с обратным наклоном', score:100, conf:'high', r:['tm','bp','cat','fam','eq']},
    {id:'0047', n:'Жим штанги на наклонной скамье', score:100, conf:'high', r:['tm','bp','cat','fam','eq']},
    {id:'0122', n:'Жим штанги широким хватом', score:100, conf:'high', r:['tm','bp','cat','fam','eq']},
    {id:'0045', n:'Жим-гильотина', score:100, conf:'high', r:['tm','bp','cat','fam','eq']},
    {id:'1256', n:'Жим обратным хватом на скамье с обратным наклоном', score:100, conf:'high', r:['tm','bp','cat','fam','eq']},
    {id:'1257', n:'Жим обратным хватом на наклонной скамье', score:100, conf:'high', r:['tm','bp','cat','fam','eq']},
    {id:'1258', n:'Жим обратным широким хватом', score:100, conf:'high', r:['tm','bp','cat','fam','eq']},
    {id:'0989', n:'Жим одной рукой с резиной с разворотом', score:100, conf:'high', r:['tm','bp','cat','fam','sec']}],
  subs:[
    {id:'0289', n:'Жим гантелей лёжа', score:100, conf:'high', t:['equipment_alternative','easier_alternative'], r:['tm','bp','cat','fam','deq','sec']},
    {id:'0301', n:'Жим гантелей на скамье с обратным наклоном', score:100, conf:'high', t:['equipment_alternative'], r:['tm','bp','cat','fam','deq','sec']},
    {id:'0314', n:'Жим гантелей на наклонной скамье', score:100, conf:'high', t:['equipment_alternative'], r:['tm','bp','cat','fam','deq','sec']},
    {id:'1624', n:'Жим гантелей обратным хватом', score:100, conf:'high', t:['equipment_alternative'], r:['tm','bp','cat','fam','deq','sec']},
    {id:'0033', n:'Жим штанги на скамье с обратным наклоном', score:100, conf:'high', t:['same_equipment_alternative'], r:['tm','bp','cat','fam','eq','sec']},
    {id:'0279', n:'Отжимания с ногами на возвышении', score:89, conf:'medium', t:['bodyweight_alternative'], r:['tm','bp','cat','grp','deq','bw']}],
  progr:[
    {id:'0045', n:'Жим-гильотина', score:100, conf:'high', t:['higher_difficulty'], r:['tm','bp','cat','fam','sec','eq','up']},
    {id:'1256', n:'Жим обратным хватом на скамье с обратным наклоном', score:100, conf:'high', t:['higher_difficulty'], r:['tm','bp','cat','fam','sec','eq','up']},
    {id:'1257', n:'Жим обратным хватом на наклонной скамье', score:100, conf:'high', t:['higher_difficulty'], r:['tm','bp','cat','fam','sec','eq','up']},
    {id:'1258', n:'Жим обратным широким хватом', score:100, conf:'high', t:['higher_difficulty'], r:['tm','bp','cat','fam','sec','eq','up']}],
  regr:[
    {id:'0748', n:'Жим лёжа в Смите', score:100, conf:'high', t:['lower_difficulty'], r:['tm','bp','cat','fam','sec','dn']},
    {id:'0757', n:'Жим на наклонной в Смите', score:100, conf:'high', t:['lower_difficulty'], r:['tm','bp','cat','fam','sec','dn']},
    {id:'1308', n:'Жим широким хватом в Смите', score:100, conf:'high', t:['lower_difficulty'], r:['tm','bp','cat','fam','sec','dn']},
    {id:'1254', n:'Жим лёжа с резиной', score:100, conf:'high', t:['lower_difficulty'], r:['tm','bp','cat','fam','sec','dn']}],
};
const edbOf = e => e ? EDB_DEMO : null;   /* пока одна карточка на всех, как и GIF */

/* ═══ Демо-медиа: одна GIF из сэмпла EDB на все упражнения — чтобы посмотреть,
   как демонстрации выглядят в общем лайауте (таблица, панели, конструктор).
   В продукте у каждого упражнения своя. ═══ */
EX.forEach(e => { if(!e.gif) e.gif = 'assets/ex/0025' });

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
})();
/* Демо статуса «соревнование»: у Артёма (p1) в воскресенье текущей недели.
   Статус — поле дня (comp), хранится вместе с днём и публикуется как правка. */
(function(){
  const p = PROGRAMS.find(x=>x.id==='p1'); if(!p || !PLAN.p1) return;
  const i = daysBetween(p.start, addDays(TODAY, 6 - dowMon(TODAY)));
  if(i >= 0 && i < PLAN.p1.length) PLAN.p1[i] = {t:'Соревнования · Open Cup', comp:true, b:[
    ['warmup','Разминка','Спокойно, без отказа',null,[['rom','2×',null,'сек','60'],['pvc','2×10'],['row',null,null,'м','500']]],
    ['complex','«Fran» · 21-15-9','Два зачётных выхода, отдых 10 мин',null,[['thrust','21-15-9',null,'кг','43'],['pullup','21-15-9']]]]};
})();
const STATE = (function(){
  const def = {online:true, queue:0, ids:false, navc:false, curClient:'c1', curProg:'p1', curWeek:4,
               pm:Object.fromEntries(CLIENTS.map(c=>[c.id, {...c.pm}])), replied:{}, days:{}, profile:null};
  let s = def;
  try{ const raw = localStorage.getItem('trenergram.state'); if(raw) s = Object.assign({}, def, JSON.parse(raw)) }catch(_){}
  return s;
})();
function saveState(){ try{ localStorage.setItem('trenergram.state', JSON.stringify(STATE)) }catch(_){} }
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

/* ═══════════ СТАТУСЫ ДНЯ (CAL-1) — общие для всех страниц, поэтому в data.js: отдых · черновик · опубликована · соревнование ═══════════
   Отдых — любой день без упражнений; соревнование — отдельный флаг дня (comp),
   ставится в шапке конструктора. Одни и те же иконки в календаре, полосе недель
   конструктора и карточке клиента. */
const DAYICON = {
  /* Отдых — фигура в позе лотоса и батарейка с молнией («заряжается»), по эскизу тренеров. */
  rest:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="10" cy="4.4" r="2.1"/><path d="M10 6.9v6.1"/><path d="M7 9.6c1-1.2 5-1.2 6 0"/><path d="M7 9.6 4.2 13.4l1.6 1.8"/><path d="M13 9.6l2.8 3.8-1.6 1.8"/><path d="M3 16.6c2.2-2.4 4.6-3.6 7-3.6s4.8 1.2 7 3.6"/><path d="M3 16.6c1.8 1.9 4.4 2.8 7 2.8s5.2-.9 7-2.8"/><rect x="18" y="2.6" width="3.8" height="6" rx=".9"/><path d="M19.4 1.7h1"/><path d="M20.2 4.2l-.9 1.6h1.4l-.9 1.6"/></svg>',
  comp:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 0 1-10 0V4z"/><path d="M7 6H4.5a1.5 1.5 0 0 0 0 3H7M17 6h2.5a1.5 1.5 0 0 1 0 3H17"/></svg>',
  draft:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3l18 18M10.6 10.6a2 2 0 0 0 2.8 2.8M9.9 5.1A10 10 0 0 1 12 5c5 0 9 7 9 7a17 17 0 0 1-3.2 3.7M6.1 6.1A17 17 0 0 0 3 12s4 7 9 7a10 10 0 0 0 4.9-1.3"/></svg>',
  pub:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12s4-7 9-7 9 7 9 7-4 7-9 7-9-7-9-7z"/><circle cx="12" cy="12" r="3"/></svg>',
};
const DAYST = {rest:'Отдых', draft:'Черновик — клиент не видит', pub:'Опубликована — клиент видит', comp:'Соревнование'};
const dayStatus = (x, draft) => x.comp ? 'comp' : !(x.blocks||[]).some(b=>b.items.some(y=>y.exId)) ? 'rest' : draft ? 'draft' : 'pub';
/* Метка статуса. Для черновика/опубликованной — кнопка: клик переключает
   видимость для клиента (key = «программа:индекс дня»). */
const dayMark = (st, key) => st==='rest' ? ''
  : (st==='comp' || !key) ? `<i class="dmark ${st}" title="${DAYST[st]}">${DAYICON[st]}</i>`
  : `<i class="dmark ${st}" role="button" tabindex="0" data-pub="${key}" title="${DAYST[st]} · нажмите, чтобы ${st==='draft'?'опубликовать':'скрыть от клиента'}">${DAYICON[st]}</i>`;
/* Не <button>: клетки дня в конструкторе сами кнопки, вложенная кнопка ломает разметку. */
/* Публикация/скрытие дня со страниц без живого плана (календарь, карточка клиента). */
function setPublished(pid, i, on){
  const x = buildPlan(pid)[i]; if(!x) return false;
  const bag = ((STATE.days ||= {})[pid] ||= {}), c = serializeDay(x);
  bag[i] = on ? {c, draft:false} : {c, pub: x.pub, draft:true};
  saveState(); return true;
}
const pubToggleMsg = on => on ? 'Тренировка опубликована — клиент её видит' : 'Тренировка скрыта от клиента — черновик';
/* Отдых — оригинальная иконка из брифа (assets/icons/rest.png), без перерисовки. */
const restCell = () => `<span class="stcell rest" title="Отдых"><img src="assets/icons/rest.png" alt="Отдых"></span>`;
/* Список блоков дня: номер в своей колонке, не больше max строк, остальное — «ещё N». */
function blocksList(x, max=5){
  const bs = (x.blocks||[]).filter(b=>b.items.some(y=>y.exId)); if(!bs.length) return '';
  return `<span class="bl num">${bs.slice(0,max).map((b,i)=>`<i><s>${i+1}</s><b>${esc(b.title || blockTypeLabel(b) || 'блок')}</b></i>`).join('')}${bs.length>max ? `<span class="more">ещё ${bs.length-max}</span>` : ''}</span>`;
}
const compCell = () => `<span class="stcell comp">${DAYICON.comp}<s>Соревнование</s></span>`;

/* ═══════════ КАЛЕНДАРЬ БЕЗ «СРОКА ПРОГРАММЫ» (CAL-1) ═══════════
   Программа — только способ добавить набор тренировок разом; на календарь
   она не накладывает границ. Контейнер дней у клиента один (c.prog): если
   программы нет — создаём личную, если день раньше старта — сдвигаем старт
   назад и переиндексируем план и сохранённые дни. Сдвиг и личные контейнеры
   запоминаем в STATE, иначе после перезагрузки дни разъедутся. */
function ensureDay(cid, date){
  const c = client(cid); if(!c) return null;
  if(!c.prog){
    const id = 'cal_' + cid;
    if(!program(id)) PROGRAMS.push({id, title:'Тренировки', goal:'', days:1, clients:[cid], start:date, kind:'individual', time:null});
    PLAN[id] ||= []; c.prog = id;
    ((STATE.calprog ||= {})[cid] = {id, start:date});
  }
  const p = program(c.prog); let shift = 0;
  if(date < p.start){
    shift = daysBetween(date, p.start);
    PLAN[c.prog] = Array(shift).fill(null).concat(PLAN[c.prog] || []);
    const bag = (STATE.days||{})[c.prog];
    if(bag){ const nb = {}; Object.keys(bag).forEach(k=>{ nb[+k+shift] = bag[k] }); STATE.days[c.prog] = nb; }
    p.start = date; p.days += shift;
    ((STATE.pstart ||= {})[c.prog] = {start:p.start, shift:((STATE.pstart||{})[c.prog]||{}).shift + shift || shift});
  }
  const i = daysBetween(p.start, date);
  if(i >= p.days) p.days = i + 1;
  saveState();
  return {pid:c.prog, i, shift};
}
/* Восстановление после перезагрузки: личные контейнеры и сдвинутые старты. */
(function(){
  Object.entries(STATE.calprog||{}).forEach(([cid, q])=>{ const c = client(cid); if(!c) return;
    if(!program(q.id)) PROGRAMS.push({id:q.id, title:'Тренировки', goal:'', days:1, clients:[cid], start:q.start, kind:'individual', time:null});
    PLAN[q.id] ||= []; c.prog = q.id; });
  Object.entries(STATE.pstart||{}).forEach(([pid, q])=>{ const p = program(pid); if(!p || !q.shift) return;
    if(q.start < p.start){ const k = daysBetween(q.start, p.start); PLAN[pid] = Array(k).fill(null).concat(PLAN[pid] || []); p.start = q.start; p.days += k; } });
})();

/* ═══════════ ПОДРОБНЫЙ ВИД ДНЯ: блоки → упражнения со схемой и нагрузкой ═══════════
   Третий вид календаря и полосы недель: видна иерархия «блок → упражнения»,
   у упражнения — подходы×повторы, процент от ПМ и рабочий вес (или объём). */
/* Неразрывные пробелы внутри «40 %» и «500 м»: перенос допустим только между частями схемы. */
const itemLabel = it => it.txt ? it.txt : [it.scheme, it.pct != null ? fmtNum(it.pct) + '\u00a0%' : (it.val ? fmtNum(it.val) + (it.unit ? '\u00a0' + it.unit : '') : '')].filter(Boolean).join(' · ');
function blocksDetail(x, cid){
  const pm = cid ? pmOf(cid) : null;
  const has = y => y.exId || y.raw;
  const bs = (x.blocks||[]).filter(b=>b.items.some(has)); if(!bs.length) return '';
  const row = it => { const e = it.exId ? byId(it.exId) : null; const kg = e && pm ? workKg(it, pm) : null;
    return `<div class="bxi"><span>${esc(e ? e.ru : (it.raw||''))}</span><em>${esc(itemLabel(it))}${kg!=null ? `${itemLabel(it)?' · ':''}<u>${fmtNum(kg)}\u00a0кг</u>` : ''}</em></div>` };
  /* Суперсет — подгруппой: подпись «Суперсет · 3 круга» и его упражнения. */
  const body = b => { let h = '', k = 0; const its = b.items;
    while(k < its.length){
      if(its[k].ss){ const j = ssEnd(its, k), mem = its.slice(k + 1, j).filter(has);
        if(mem.length) h += `<div class="bxss"><div class="bxssh">${esc(ssLabel(its[k]))}</div>${mem.map(row).join('')}</div>`;
        k = j; continue }
      if(has(its[k])) h += row(its[k]);
      k++;
    }
    return h };
  return `<div class="bxs">${bs.map((b,i)=>`<div class="bx">
    <div class="bxh"><s>${i+1}</s><b>${esc(b.title || blockTypeLabel(b) || 'Блок')}</b>${b.fmt && b.title ? `<i>${esc(fmtLabel(b.fmt))}</i>` : ''}</div>
    ${body(b)}
  </div>`).join('')}</div>`;
}
