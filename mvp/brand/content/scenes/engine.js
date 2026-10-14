/* Движок моушн-сцен Тренерграма.

   Сцена — HTML-страница: сверху подпись, под ней живой экран прототипа в iframe
   (calendar.html, constructor.html…), поверх — курсор, подсветка, камера.
   Ничего не перерисовываем: экран тот же, что в кабинете, правки прототипа
   попадают в ролик при следующем рендере.

   Время одно на всё — seek(t). В браузере сцена играет сама (пробел — пауза,
   R — с начала), рендер (render.mjs) шагает кадрами: seek(кадр/fps) → снимок.
   CSS-переходы и анимации внутри экрана в режиме рендера ставятся на паузу
   и двигаются тем же временем — ролик не зависит от скорости машины.

   const S = Scene({format:'9:16', duration:14});
   S.screen('../../../calendar.html?client=c1');
   S.caption(0.3, 4, 'Весь месяц клиента — *одним экраном*');
   S.focus(4, 5.2, '.mon');             // камера наезжает на элемент
   S.cursor(5, 6, '#mToday');           // курсор едет к элементу
   S.click(6.1, '#mToday');             // нажатие (событие уходит в страницу)
   S.type(7, 9, 'input', 'Жим лёжа');   // набор текста
   S.cue(3, doc => {...});              // любое действие со страницей
   S.outro(12);                         // финальная заставка со знаком
   S.start();
*/
(function () {
  const FORMATS = { '9:16': [1080, 1920], '1:1': [1080, 1080], '4:5': [1080, 1350], '16:9': [1920, 1080] };
  const EASE = {
    linear: p => p,
    inOut: p => p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2,
    out: p => 1 - Math.pow(1 - p, 3),
    in: p => p * p * p,
  };
  const lerp = (a, b, p) => a + (b - a) * p;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const RENDER = new URLSearchParams(location.search).has('render');

  window.Scene = function (o) {
    o = Object.assign({ format: '9:16', duration: 10, theme: 'light', device: 'desktop' }, o);
    const [SW, SH] = FORMATS[o.format];
    const vertical = SH > SW;

    // ───── сцена: подпись сверху, окно экрана ниже ─────
    document.documentElement.classList.add('scn-root', 'theme-' + o.theme);
    if (RENDER) document.documentElement.classList.add('render');
    const stage = el('div', 'stage');
    stage.style.width = SW + 'px'; stage.style.height = SH + 'px';
    document.body.appendChild(stage);

    const view = o.view || (vertical ? { x: 0, y: 520, w: SW, h: SH - 520 } :
                            SH === SW ? { x: 0, y: 300, w: SW, h: SH - 300 } :
                            { x: 0, y: 0, w: SW, h: SH });
    const vp = el('div', 'viewport', stage);
    Object.assign(vp.style, px({ left: view.x, top: view.y, width: view.w, height: view.h }));

    const cam = el('div', 'camera', vp);
    const capBox = el('div', 'captions', stage);
    const outroBox = el('div', 'outro', stage);

    let W = 1920, H = 1080, frame, win, doc, cursorEl, ringEl, pad;
    const base = () => Math.min((view.w - 2 * pad) / W, (view.h - 2 * pad) / H);
    const C = { cx: 0, cy: 0, z: 1 };       // камера: центр в пикселях экрана и зум

    const items = [];                       // всё, что зависит от времени
    let T = 0, ready, readyResolve;
    ready = new Promise(r => (readyResolve = r));

    const S = {
      W: SW, H: SH, ease: EASE,
      get doc() { return doc; }, get win() { return win; }, get t() { return T; },

      // Экран прототипа. device: 'desktop' (1920×1080) или 'phone' (390×844)
      screen(src, opt = {}) {
        const dev = opt.device || o.device;
        [W, H] = opt.size || (dev === 'phone' ? [390, 844] : [1920, 1080]);
        pad = opt.pad ?? (dev === 'phone' ? 60 : vertical ? 40 : 60);
        cam.classList.add(dev);
        Object.assign(cam.style, px({ width: W, height: H }));
        frame = el('iframe', 'app', cam);
        frame.style.width = W + 'px'; frame.style.height = H + 'px';
        frame.src = src;
        ringEl = el('div', 'ring', cam);
        cursorEl = el('div', 'cursor', cam);
        cursorEl.innerHTML = '<svg viewBox="0 0 28 28" width="34" height="34"><path d="M5 3l17 9.6-7.4 1.7-3.9 6.6z" fill="#141414" stroke="#fff" stroke-width="1.8" stroke-linejoin="round"/></svg>';
        C.cx = W / 2; C.cy = H / 2; C.z = 1;
        S.cur = { x: W * .62, y: H * .7, o: 0, press: 0 };
        S.ring = { x: 0, y: 0, w: 0, h: 0, o: 0 };
        frame.addEventListener('load', async () => {
          win = frame.contentWindow; doc = frame.contentDocument;
          const st = doc.createElement('style');           // в ролике полос прокрутки нет
          st.textContent = '::-webkit-scrollbar{display:none}html{scrollbar-width:none}';
          doc.head.appendChild(st);
          try { await doc.fonts.ready; } catch (e) {}
          await new Promise(r => setTimeout(r, opt.settle ?? 400));
          readyResolve();
        });
        return S;
      },

      // Отрезок времени: fn(p, rel) вызывается, пока t внутри [t0, t1];
      // init() — один раз при входе (запомнить стартовые значения)
      span(t0, t1, fn, init) { items.push({ t0, t1, fn, init, k: 'span' }); return S; },
      // Одноразовое действие при проходе момента t
      cue(t, fn) { items.push({ t0: t, t1: t, fn, k: 'cue' }); return S; },

      // ───── подписи ─────
      // *слово* — акцентом. opt.sub — строка помельче под заголовком
      caption(t0, t1, text, opt = {}) {
        const c = el('div', 'cap ' + (opt.cls || ''), capBox);
        c.innerHTML = `<div class="h">${mark(text)}</div>` + (opt.sub ? `<div class="s">${mark(opt.sub)}</div>` : '');
        const io = opt.in ?? .5, oo = opt.out ?? .4;
        S.span(t0, t1 + oo, (p, rel) => {
          const a = clamp(rel / io, 0, 1), b = clamp((t1 + oo - (t0 + rel)) / oo, 0, 1);
          const v = Math.min(EASE.out(a), b);
          c.style.opacity = v;
          c.style.transform = `translateY(${(1 - EASE.out(a)) * 40}px)`;
        });
        S.cue(t1 + oo + .01, () => (c.style.opacity = 0));
        return S;
      },

      // ───── камера ─────
      // target: селектор/элемент экрана, {x,y,w,h} в пикселях экрана или 'all'
      focus(t0, t1, target, opt = {}) {
        let from, to;
        return S.span(t0, t1, p => {
          const q = (opt.ease ? EASE[opt.ease] : EASE.inOut)(p);
          C.cx = lerp(from.cx, to.cx, q); C.cy = lerp(from.cy, to.cy, q); C.z = lerp(from.z, to.z, q);
        }, () => { from = { ...C }; to = camFor(target, opt); });
      },

      // ───── курсор ─────
      cursor(t0, t1, target, opt = {}) {
        let from, to;
        S.span(t0, t1, p => {
          const q = EASE.inOut(p);
          S.cur.x = lerp(from.x, to.x, q);
          S.cur.y = lerp(from.y, to.y, q) - Math.sin(Math.PI * q) * (opt.arc ?? 30);
          S.cur.o = Math.max(S.cur.o, clamp(p * 4, 0, 1));
        }, () => { from = { x: S.cur.x, y: S.cur.y }; to = pointOf(target, opt); });
        return S;
      },
      hideCursor(t, d = .3) { let o0; return S.span(t, t + d, p => (S.cur.o = o0 * (1 - p)), () => (o0 = S.cur.o)); },

      // Нажатие: курсор «приседает», в страницу уходят pointer/mouse/click
      click(t, target, opt = {}) {
        S.span(t - .08, t + .22, (p, rel) => (S.cur.press = Math.sin(Math.PI * clamp(rel / .3, 0, 1))));
        return S.cue(t, () => {
          const e = resolve(target); if (!e) return warn(target);
          const r = e.getBoundingClientRect(), x = r.left + r.width / 2, y = r.top + r.height / 2;
          const ev = { bubbles: true, cancelable: true, view: win, clientX: x, clientY: y, button: 0 };
          e.dispatchEvent(new win.PointerEvent('pointerdown', ev));
          e.dispatchEvent(new win.MouseEvent('mousedown', ev));
          if (e.matches('input,textarea,select,[contenteditable]')) e.focus();   // кнопкам фокус не нужен — без синей рамки
          e.dispatchEvent(new win.PointerEvent('pointerup', ev));
          e.dispatchEvent(new win.MouseEvent('mouseup', ev));
          e.dispatchEvent(new win.MouseEvent('click', ev));
        });
      },

      // Набор текста в поле или contenteditable — по букве, с событиями input
      type(t0, t1, target, text) {
        let e, n = -1;
        return S.span(t0, t1, p => {
          const k = Math.round(text.length * p); if (!e || k === n) return; n = k;
          const v = text.slice(0, k);
          if ('value' in e && e.tagName !== 'DIV') e.value = v; else e.textContent = v;
          e.dispatchEvent(new win.InputEvent('input', { bubbles: true, data: v.slice(-1), inputType: 'insertText' }));
        }, () => { e = resolve(target); if (!e) warn(target); else e.focus && e.focus(); });
      },

      // Клавиша: S.key(t, 'Enter') или S.key(t, 's', {metaKey:true})
      key(t, key, mods = {}) {
        return S.cue(t, () => {
          const tgt = doc.activeElement || doc.body;
          for (const type of ['keydown', 'keyup'])
            tgt.dispatchEvent(new win.KeyboardEvent(type, Object.assign({ key, bubbles: true, cancelable: true }, mods)));
        });
      },

      // Прокрутка страницы или элемента к позиции/элементу
      scroll(t0, t1, target, opt = {}) {
        let box, from, to;
        return S.span(t0, t1, p => { box.scrollTop = lerp(from, to, EASE.inOut(p)); }, () => {
          box = opt.in ? resolve(opt.in) : doc.scrollingElement;
          from = box.scrollTop;
          if (typeof target === 'number') to = target;
          else { const e = resolve(target); to = from + e.getBoundingClientRect().top - (box === doc.scrollingElement ? 0 : box.getBoundingClientRect().top) - (opt.offset ?? 120); }
        });
      },

      // Рамка-подсветка вокруг элемента
      highlight(t0, t1, target, opt = {}) {
        const io = .35, pd = opt.pad ?? 10;
        return S.span(t0, t1, (p, rel) => {
          S.ring.o = Math.min(clamp(rel / io, 0, 1), clamp((t1 - t0 - rel) / io, 0, 1));
        }, () => { const r = rectOf(target); Object.assign(S.ring, { x: r.x - pd, y: r.y - pd, w: r.w + 2 * pd, h: r.h + 2 * pd }); });
      },

      // Финальная заставка: логотип, слоган, адрес (если задан)
      outro(t0, opt = {}) {
        outroBox.innerHTML = `
          <img class="mark" src="${opt.mark || '../../logo/trenergram-logo.svg'}" alt="">
          <div class="tag">${mark(opt.tag || 'Автоматизируем тренерскую рутину')}</div>
          ${opt.url ? `<div class="url">${opt.url}</div>` : ''}`;
        return S.span(t0, Infinity, (p, rel) => {
          const a = EASE.out(clamp(rel / .6, 0, 1));
          outroBox.style.opacity = a;
          outroBox.style.transform = `scale(${lerp(1.06, 1, a)})`;
        });
      },

      seek(t) {
        T = t;
        for (const it of items) {
          if (t < it.t0) continue;
          if (it.k === 'cue') { if (!it.done) { it.done = true; try { it.fn(doc, win); } catch (e) { console.error(e); } } continue; }
          if (!it.on) { it.on = true; it.init && it.init(); }
          if (it.t1 !== Infinity && t > it.t1) { if (!it.end) { it.end = true; it.fn(1, it.t1 - it.t0); } continue; }
          it.fn(it.t1 === Infinity ? 1 : clamp((t - it.t0) / (it.t1 - it.t0 || 1), 0, 1), t - it.t0);
        }
        if (RENDER && doc) stepAnimations(t);
        draw();
      },

      start() {
        S.ready = ready.then(() => { fit(); draw(); });
        window.__scene = { ready: S.ready, seek: S.seek, cam: () => ({ ...C, base: base() }), duration: o.duration, fps: o.fps || 30, size: [SW, SH], name: o.name || document.title };
        if (RENDER) return S;
        // предпросмотр: играет сам, пробел — пауза, R — с начала
        fitWindow(); addEventListener('resize', fitWindow);
        const bar = el('div', 'bar'); document.body.appendChild(bar);
        let t0 = null, paused = false, pausedAt = 0;
        S.ready.then(() => {
          const loop = now => {
            if (!paused) {
              if (t0 === null) t0 = now;
              const t = (now - t0) / 1000;
              if (t <= o.duration) S.seek(t);
              bar.style.width = clamp(t / o.duration, 0, 1) * 100 + '%';
            }
            requestAnimationFrame(loop);
          };
          requestAnimationFrame(loop);
        });
        addEventListener('keydown', e => {
          if (e.code === 'Space') { e.preventDefault(); paused = !paused; if (paused) pausedAt = performance.now(); else t0 += performance.now() - pausedAt; }
          if (e.code === 'KeyR') location.reload();
        });
        return S;
      },
    };

    // ───── внутреннее ─────
    function fit() { draw(); }
    function draw() {
      if (!frame) return;
      const s = base() * C.z;
      // не показываем пустоту за краем экрана, если он больше окна
      let cx = C.cx, cy = C.cy;
      const hw = view.w / 2 / s, hh = view.h / 2 / s;
      cx = W * s > view.w ? clamp(cx, hw, W - hw) : W / 2;
      cy = H * s > view.h ? clamp(cy, hh, H - hh) : H / 2;
      cam.style.transform = `translate(${view.w / 2 - cx * s}px,${view.h / 2 - cy * s}px) scale(${s})`;
      cam.style.setProperty('--inv', 1 / s);
      const cs = cursorEl.style;
      cs.opacity = S.cur.o;
      cs.transform = `translate(${S.cur.x}px,${S.cur.y}px) scale(${(1 - .18 * S.cur.press) / Math.min(s, 1.4) * 1.6})`;
      const rs = ringEl.style;
      rs.opacity = S.ring.o;
      Object.assign(rs, px({ left: S.ring.x, top: S.ring.y, width: S.ring.w, height: S.ring.h }));
    }
    function camFor(target, opt) {
      if (target === 'all') return { cx: W / 2, cy: H / 2, z: 1 };
      const r = rectOf(target), p = opt.pad ?? 40;
      const want = Math.min(view.w / (r.w + 2 * p), view.h / (r.h + 2 * p)) * (opt.zoom || 1);
      const z = clamp((opt.max ? Math.min(want, opt.max) : want) / base(), 1, 6);
      return { cx: r.x + r.w / 2 + (opt.dx || 0), cy: r.y + r.h / 2 + (opt.dy || 0), z };
    }
    function pointOf(target, opt) {
      if (isObj(target) && 'x' in target && !('w' in target)) return target;
      const r = rectOf(target);
      return { x: r.x + r.w * (opt.ax ?? .5) + (opt.dx || 0), y: r.y + r.h * (opt.ay ?? .5) + (opt.dy || 0) };
    }
    function rectOf(target) {
      if (isObj(target) && 'w' in target) return target;
      const e = resolve(target); if (!e) { warn(target); return { x: W / 2, y: H / 2, w: 10, h: 10 }; }
      const r = e.getBoundingClientRect();
      return { x: r.left, y: r.top, w: r.width, h: r.height };
    }
    function resolve(t) { return typeof t === 'string' ? doc.querySelector(t) : typeof t === 'function' ? t(doc) : t; }
    function warn(t) { console.warn('[scene] не найдено:', t); }

    // CSS-анимации экрана в рендере: пауза и шаг по времени сцены
    const seen = new Map();
    function stepAnimations(t) {
      for (const a of doc.getAnimations({ subtree: true })) {
        if (!seen.has(a)) { seen.set(a, t); a.pause(); }
        const ct = (t - seen.get(a)) * 1000;
        try { a.currentTime = ct; } catch (e) {}
      }
    }
    // предпросмотр в окне браузера — вписать сцену целиком
    function fitWindow() {
      const k = Math.min((innerWidth - 40) / SW, (innerHeight - 40) / SH, 1);
      stage.style.transform = `scale(${k})`;
      document.body.style.setProperty('--k', k);
    }
    return S;
  };

  function el(tag, cls, parent) { const e = document.createElement(tag); if (cls) e.className = cls; if (parent) parent.appendChild(e); return e; }
  function isObj(v) { return v && typeof v === 'object' && !(v instanceof Node || (v.nodeType > 0)); }
  function px(o) { const r = {}; for (const k in o) r[k] = o[k] + 'px'; return r; }
  function mark(s) { return String(s).replace(/\*([^*]+)\*/g, '<em>$1</em>').replace(/\n/g, '<br>'); }
})();
