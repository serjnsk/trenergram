/* Оболочка схематичного интерфейса Тренерграма (см. kit.css).
   Страница схемы кладёт содержимое в <main class="main"> и вызывает:
     Kit.trainer({ title: 'Конструктор', nav: 1 })   — кабинет тренера: логотип, раздел, нижняя панель
     Kit.client({ who: 'Тренер Алексей' })           — приложение клиента: знак, «Тренерграм», тренер
   Состояния: Kit.state('parse') ставит body.className = 's-parse'; страница описывает их в CSS.
   window.ST — функции, которые сцена вызывает через S.cue(t, (d, w) => w.ST.…()). */
(function () {
  const LOGO = '../../../logo/trenergram-logo.svg';
  const MARK = '../../../logo/trenergram-mark.svg';
  const IC = {
    dash: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><rect x="2.5" y="2.5" width="6.5" height="6.5" rx="1.6"/><rect x="11" y="2.5" width="6.5" height="4" rx="1.6"/><rect x="11" y="8.5" width="6.5" height="9" rx="1.6"/><rect x="2.5" y="11" width="6.5" height="6.5" rx="1.6"/></svg>',
    cal: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><rect x="2.5" y="4" width="15" height="13.5" rx="2"/><path d="M2.5 8h15M6.5 2.5v3M13.5 2.5v3"/></svg>',
    users: '<svg viewBox="0 0 20 20" fill="none" stroke="currentColor"><circle cx="8" cy="6.5" r="3"/><path d="M2.5 17c0-3 2.5-5 5.5-5s5.5 2 5.5 5"/><path d="M14 4.2a3 3 0 0 1 0 5.6M15.5 12.6c1.6.7 2.8 2.3 2.8 4.4"/></svg>',
    more: '<svg viewBox="0 0 20 20" fill="currentColor" stroke="none"><circle cx="4.5" cy="10" r="1.7"/><circle cx="10" cy="10" r="1.7"/><circle cx="15.5" cy="10" r="1.7"/></svg>',
  };
  const NAV = [['dash', 'Дашборд'], ['cal', 'Календарь'], ['users', 'Клиенты'], ['more', 'Ещё']];

  window.Kit = {
    trainer(o = {}) {
      const main = document.querySelector('.main');
      const app = document.createElement('div'); app.className = 'app';
      app.innerHTML = `<div class="top"><img class="logo" src="${LOGO}" alt="Тренерграм">` +
        (o.title ? `<span class="ttl">${o.title}</span>` : '') + (o.plus === false ? '' : '<i class="plus"></i>') + '</div>';
      document.body.prepend(app); app.appendChild(main);
      if (o.foot) app.insertAdjacentHTML('beforeend', o.foot);
      app.insertAdjacentHTML('beforeend', '<nav class="nav">' + NAV.map(([k, t], i) =>
        `<a class="${i === (o.nav ?? -1) ? 'on' : ''}">${IC[k]}${t}</a>`).join('') + '</nav>');
    },
    client(o = {}) {
      const main = document.querySelector('.main');
      const app = document.createElement('div'); app.className = 'capp';
      app.innerHTML = `<div class="ctop"><img class="mk" src="${MARK}" alt=""><span class="nm">Тренерграм</span>` +
        (o.who ? `<span class="who">${o.who}</span>` : '') + '</div>';
      document.body.prepend(app); app.appendChild(main);
      if (o.foot) app.insertAdjacentHTML('beforeend', o.foot);
    },
    state(s) { document.body.className = s ? 's-' + s : ''; },
  };
})();
