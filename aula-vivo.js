/* ==========================================================================
   AULA VIVA — comportamiento interactivo para Aula Abierta
   Barra superior dinámica, navegación activa, entrada suave, búsqueda,
   reto interactivo, contadores, efectos al guardar y botón de subir.
   ========================================================================== */
(function () {
  'use strict';

  var d = document;
  var root = d.documentElement;
  root.classList.add('av-js');

  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var page = (location.pathname.split('/').pop() || 'index.html').split('?')[0];
  if (page.indexOf('.') === -1) page = page + '.html';

  function ready(fn) {
    if (d.readyState !== 'loading') fn();
    else d.addEventListener('DOMContentLoaded', fn);
  }
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function norm(s) {
    return String(s || '').normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
  }
  function make(tag, cls, html) {
    var e = d.createElement(tag);
    if (cls) e.className = cls;
    if (html != null) e.innerHTML = html;
    return e;
  }

  /* ───────── Confeti de emojis ───────── */
  function confetti(x, y, emojis, count) {
    if (reduce) return;
    emojis = emojis || ['✨', '⭐', '💜', '🎉'];
    count = count || 14;
    for (var i = 0; i < count; i++) {
      var p = make('span', 'av-confetti', emojis[i % emojis.length]);
      var ang = Math.random() * Math.PI * 2;
      var dist = 50 + Math.random() * 90;
      p.style.left = x + 'px';
      p.style.top = y + 'px';
      p.style.setProperty('--dx', Math.cos(ang) * dist + 'px');
      p.style.setProperty('--dy', Math.sin(ang) * dist - 30 + 'px');
      p.style.setProperty('--rot', (Math.random() * 540 - 270) + 'deg');
      d.body.appendChild(p);
      setTimeout(function (n) { return function () { n.remove(); }; }(p), 1050);
    }
  }

  /* ───────── Contador animado ───────── */
  function countUp(el, target) {
    if (!el) return;
    target = Number(target) || 0;
    if (reduce || target === 0) { el.textContent = target; return; }
    var start = null, dur = 1000;
    function step(ts) {
      if (start === null) start = ts;
      var t = Math.min((ts - start) / dur, 1);
      var eased = 1 - Math.pow(1 - t, 3);
      el.textContent = Math.round(target * eased);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  /* ───────── Bloqueo de scroll para ventanas ───────── */
  function lockScroll(on) { d.body.style.overflow = on ? 'hidden' : ''; }

  /* ───────── Barra superior ───────── */
  function initHeader(header) {
    if (!header) return;

    var bar = make('div', 'av-progress', '<div class="av-progress-bar"></div>');
    header.appendChild(bar);
    var fill = bar.firstChild;

    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var max = root.scrollHeight - window.innerHeight;
        var pct = max > 0 ? (window.scrollY / max) * 100 : 0;
        fill.style.width = Math.min(100, Math.max(0, pct)) + '%';
        header.classList.toggle('av-scrolled', window.scrollY > 12);
        var fab = d.querySelector('.av-fab');
        if (fab) fab.classList.toggle('show', window.scrollY > 500);
        ticking = false;
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // El subtítulo alterna entre la sección y el nombre del docente
    var sub = header.querySelector('span.text-secondary.truncate');
    if (sub && !reduce) {
      var original = sub.textContent.trim();
      var teacher = 'Lic. Johan Beltre';
      if (typeof window.getTeacherProfile === 'function') {
        window.getTeacherProfile().then(function (p) {
          if (p && p.name) teacher = (p.title ? p.title + ' ' : '') + p.name;
        }).catch(function () {});
      }
      var showName = false;
      setInterval(function () {
        showName = !showName;
        var txt = showName ? '✨ ' + teacher : original;
        sub.innerHTML = '<span class="av-swap">' + esc(txt) + '</span>';
      }, 4200);
    }
  }

  /* ───────── Barra inferior ───────── */
  function initNav() {
    var links = d.querySelectorAll('nav.fixed.bottom-0 a');
    if (!links.length) return;
    var matched = false;
    links.forEach(function (a) {
      var href = (a.getAttribute('href') || '').split('?')[0].split('#')[0];
      if (href && href === page) { a.classList.add('av-active'); matched = true; }
    });
    if (!matched) {
      links.forEach(function (a) {
        if (a.classList.contains('font-semibold')) a.classList.add('av-active');
      });
    }
  }

  /* ───────── Aparición suave al hacer scroll ───────── */
  function initReveal() {
    var targets = Array.prototype.slice.call(d.querySelectorAll('main section, main footer'));
    var list = [];
    targets.forEach(function (el) {
      if (el.parentElement && el.parentElement.closest('.av-reveal')) return;
      el.classList.add('av-reveal');
      list.push(el);
    });
    if (!('IntersectionObserver' in window)) {
      list.forEach(function (el) { el.classList.add('av-in'); });
      return;
    }
    var idx = 0;
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) {
          en.target.style.setProperty('--av-delay', Math.min(idx++ % 4, 3) * 80 + 'ms');
          en.target.classList.add('av-in');
          io.unobserve(en.target);
        }
      });
    }, { threshold: 0.1, rootMargin: '0px 0px -6% 0px' });
    list.forEach(function (el) { io.observe(el); });
    // Seguro: nada se queda oculto si algo falla
    setTimeout(function () {
      list.forEach(function (el) { el.classList.add('av-in'); });
    }, 4500);
  }

  /* ───────── Tarjetas, áreas e iconos animados ───────── */
  function decorate() {
    if (page !== 'lectura.html') {
      d.querySelectorAll('main article.rounded-xl, main article.shadow-sm, main article.shadow-md').forEach(function (a) {
        if (a.querySelector('article')) return;
        a.classList.add('av-card');
      });
    }
    d.querySelectorAll('#areas-curriculares .grid > a').forEach(function (a, i) {
      a.classList.add('av-area', 'a' + ((i % 4) + 1), 'av-card');
    });
    d.querySelectorAll('main article.group').forEach(function (a) { a.classList.add('av-shine'); });
    d.querySelectorAll('main a.inline-flex, main button.inline-flex').forEach(function (b) { b.classList.add('av-ripple-host'); });
    d.querySelectorAll('main section h3').forEach(function (h) {
      var prev = h.previousElementSibling;
      if (prev && prev.classList.contains('material-symbols-outlined')) prev.classList.add('av-icon-anim');
    });
  }
  function initCards() {
    decorate();
    var main = d.querySelector('main');
    if (!main || !('MutationObserver' in window)) return;
    var t;
    new MutationObserver(function () {
      clearTimeout(t);
      t = setTimeout(decorate, 150);
    }).observe(main, { childList: true, subtree: true });
  }

  /* ───────── Onda al tocar botones ───────── */
  function initRipple() {
    d.addEventListener('click', function (e) {
      var host = e.target.closest('.av-ripple-host, .av-next, .av-pill');
      if (!host || reduce) return;
      var r = host.getBoundingClientRect();
      var s = make('span', 'av-ripple');
      s.style.left = (e.clientX - r.left) + 'px';
      s.style.top = (e.clientY - r.top) + 'px';
      host.appendChild(s);
      setTimeout(function () { s.remove(); }, 650);
    });
  }

  /* ───────── Guardar artículo: chispas ───────── */
  function initBookmarkBurst() {
    d.addEventListener('click', function (e) {
      var btn = e.target.closest('button[aria-label^="Guardar"]');
      if (!btn) return;
      var x = e.clientX, y = e.clientY;
      setTimeout(function () {
        var icon = btn.querySelector('.material-symbols-outlined');
        if (icon && icon.textContent.trim() === 'bookmark') confetti(x, y, ['⭐', '💜', '✨', '📌'], 10);
      }, 30);
    });
  }

  /* ───────── Búsqueda en vivo ───────── */
  var SUBJECT_ICON = { 'Ciencias Naturales': 'eco', 'Matemáticas': 'calculate', 'Lengua Española': 'local_library', 'Ciencias Sociales': 'public' };
  var SUBJECTS = ['Ciencias Naturales', 'Matemáticas', 'Lengua Española', 'Ciencias Sociales'];

  function openSearch() {
    if (d.querySelector('.av-overlay')) return;
    var ov = make('div', 'av-overlay');
    ov.innerHTML =
      '<div class="av-modal" role="dialog" aria-modal="true" aria-label="Buscar">' +
        '<div class="av-modal-head">' +
          '<span class="material-symbols-outlined">search</span>' +
          '<input class="av-search-input" type="search" placeholder="Busca un tema, grado o materia…" autocomplete="off" aria-label="Buscar publicaciones">' +
          '<button class="av-x" type="button" aria-label="Cerrar"><span class="material-symbols-outlined">close</span></button>' +
        '</div>' +
        '<div class="av-pills">' + SUBJECTS.map(function (s) {
          return '<a class="av-pill" href="publicaciones.html?subject=' + encodeURIComponent(s) + '">' + esc(s) + '</a>';
        }).join('') + '</div>' +
        '<div class="av-results"></div>' +
      '</div>';
    d.body.appendChild(ov);
    lockScroll(true);

    var input = ov.querySelector('input');
    var box = ov.querySelector('.av-results');
    var articles = [];

    function close() {
      ov.remove();
      lockScroll(false);
      d.removeEventListener('keydown', onKey);
    }
    function onKey(e) { if (e.key === 'Escape') close(); }
    d.addEventListener('keydown', onKey);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    ov.querySelector('.av-x').addEventListener('click', close);

    function render(q) {
      var nq = norm(q.trim());
      var found = nq
        ? articles.filter(function (a) { return norm([a.title, a.summary, a.subject, a.grade].join(' ')).indexOf(nq) !== -1; })
        : articles.slice(0, 5);
      if (!found.length) {
        box.innerHTML = '<div class="av-empty">😅 No encontré nada con “' + esc(q) + '”.<br>Prueba con otra palabra o elige una materia arriba.</div>';
        return;
      }
      var head = nq ? '' : '<div class="av-empty" style="padding:4px 6px;text-align:left">Lo más reciente</div>';
      box.innerHTML = head + found.slice(0, 8).map(function (a) {
        return '<a class="av-result" href="lectura.html?id=' + encodeURIComponent(a.id) + '">' +
          '<span class="tag"><span class="material-symbols-outlined">' + (SUBJECT_ICON[a.subject] || 'menu_book') + '</span></span>' +
          '<span><b>' + esc(a.title) + '</b><small>' + esc(a.subject || '') + (a.grade ? ' • ' + esc(a.grade) : '') + '</small></span></a>';
      }).join('');
    }

    box.innerHTML = '<div class="av-empty">Cargando…</div>';
    var loader = (window.AulaAbiertaDB && window.AulaAbiertaDB.getPublishedArticles)
      ? window.AulaAbiertaDB._initPromise.then(function () { return window.AulaAbiertaDB.getPublishedArticles(); })
      : Promise.resolve([]);
    loader.then(function (list) {
      articles = (list || []).slice().sort(function (a, b) { return (b.createdAt || 0) - (a.createdAt || 0); });
      render(input.value);
    }).catch(function () { render(''); });

    input.addEventListener('input', function () { render(input.value); });
    setTimeout(function () { input.focus(); }, 60);
  }

  function initSearch() {
    d.querySelectorAll('header.fixed button[aria-label^="Buscar"]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); openSearch(); });
    });
  }

  /* ───────── Reto interactivo ───────── */
  var QUIZ = [
    { q: '¿Cómo se llama el proceso en el que el calor del sol convierte el agua líquida en vapor?',
      o: ['Condensación', 'Evaporación', 'Precipitación', 'Infiltración'], a: 1,
      w: 'La evaporación ocurre cuando el sol calienta el agua del mar, los ríos y los lagos, y esta sube como vapor.' },
    { q: 'El vapor se enfría en las alturas y forma las nubes. ¿Cómo se llama ese paso?',
      o: ['Evaporación', 'Escorrentía', 'Condensación', 'Sequía'], a: 2,
      w: 'Al enfriarse, el vapor se vuelve diminutas gotas de agua: eso es la condensación.' },
    { q: 'La lluvia, el granizo y la nieve son formas de…',
      o: ['Precipitación', 'Evaporación', 'Filtración', 'Erosión'], a: 0,
      w: 'La precipitación es el agua que cae de las nubes hacia la superficie.' },
    { q: 'Parte del agua de lluvia se filtra por el suelo y llega bajo tierra. ¿Cómo se llama?',
      o: ['Condensación', 'Evaporación', 'Congelación', 'Infiltración'], a: 3,
      w: 'La infiltración recarga las aguas subterráneas, que luego alimentan manantiales y pozos.' },
    { q: '¿Qué fuente de energía impulsa principalmente el ciclo del agua?',
      o: ['El viento', 'La Luna', 'El Sol', 'Los volcanes'], a: 2,
      w: 'La energía del Sol calienta el agua y mantiene el ciclo en movimiento.' }
  ];

  function openQuiz() {
    if (d.querySelector('.av-overlay')) return;
    var i = 0, score = 0;
    var ov = make('div', 'av-overlay center');
    ov.innerHTML =
      '<div class="av-modal" role="dialog" aria-modal="true" aria-label="Reto de Ciencias">' +
        '<div class="av-modal-head"><span class="material-symbols-outlined">sports_esports</span>' +
        '<b style="flex:1">Reto de Ciencias #12</b>' +
        '<button class="av-x" type="button" aria-label="Cerrar"><span class="material-symbols-outlined">close</span></button></div>' +
        '<div class="av-quiz-body"></div>' +
      '</div>';
    d.body.appendChild(ov);
    lockScroll(true);
    var body = ov.querySelector('.av-quiz-body');

    function close() { ov.remove(); lockScroll(false); d.removeEventListener('keydown', onKey); }
    function onKey(e) { if (e.key === 'Escape') close(); }
    d.addEventListener('keydown', onKey);
    ov.addEventListener('click', function (e) { if (e.target === ov) close(); });
    ov.querySelector('.av-x').addEventListener('click', close);

    function question() {
      var item = QUIZ[i];
      body.innerHTML =
        '<div class="av-qbar"><div style="width:' + (i / QUIZ.length * 100) + '%"></div></div>' +
        '<div style="font-weight:700;font-size:12px;color:#7a6fb0;margin-bottom:6px">PREGUNTA ' + (i + 1) + ' DE ' + QUIZ.length + '</div>' +
        '<p class="av-q">' + esc(item.q) + '</p>' +
        item.o.map(function (t, k) {
          return '<button type="button" class="av-opt" data-k="' + k + '"><span class="k">' + 'ABCD'[k] + '</span><span>' + esc(t) + '</span></button>';
        }).join('') +
        '<div class="av-feedback"></div>';
      setTimeout(function () { body.querySelector('.av-qbar > div').style.width = ((i + 1) / QUIZ.length * 100) + '%'; }, 30);
      body.querySelectorAll('.av-opt').forEach(function (btn) {
        btn.addEventListener('click', function (e) { answer(Number(btn.dataset.k), e); });
      });
    }

    function answer(k, e) {
      var item = QUIZ[i];
      var opts = body.querySelectorAll('.av-opt');
      opts.forEach(function (b) { b.disabled = true; });
      opts[item.a].classList.add('ok');
      if (k === item.a) { score++; confetti(e.clientX, e.clientY, ['🎉', '⭐', '💧', '✨'], 12); }
      else opts[k].classList.add('bad');
      var last = i === QUIZ.length - 1;
      body.querySelector('.av-feedback').innerHTML =
        '<div class="av-why">' + (k === item.a ? '✅ ¡Correcto! ' : '💡 Casi. ') + esc(item.w) + '</div>' +
        '<button type="button" class="av-next">' + (last ? 'Ver mi resultado' : 'Siguiente') + '</button>';
      body.querySelector('.av-next').addEventListener('click', function () {
        if (last) result(); else { i++; question(); }
      });
    }

    function result() {
      var emoji = score === 5 ? '🏆' : score >= 4 ? '🌟' : score >= 3 ? '👏' : '💪';
      var title = score === 5 ? '¡Perfecto!' : score >= 4 ? '¡Excelente!' : score >= 3 ? '¡Muy bien!' : '¡Sigue practicando!';
      var msg = score === 5 ? 'Dominas el ciclo del agua como un verdadero científico.' : 'Repasa la lectura recomendada y vuelve a intentarlo.';
      body.innerHTML =
        '<div class="av-score"><div class="big">' + emoji + '</div><h4>' + title + '</h4>' +
        '<p>Acertaste ' + score + ' de ' + QUIZ.length + '. ' + msg + '</p>' +
        '<button type="button" class="av-next" data-act="again">Jugar de nuevo</button>' +
        '<div style="height:8px"></div>' +
        '<button type="button" class="av-next" data-act="read" style="background:linear-gradient(120deg,#00c9a0,#00b8ff);box-shadow:0 8px 18px rgba(0,184,255,.35)">Ir a las lecturas</button></div>';
      if (score >= 4) {
        var r = body.getBoundingClientRect();
        confetti(r.left + r.width / 2, r.top + 60, ['🎉', '🏆', '⭐', '✨', '💧'], 24);
      }
      body.querySelector('[data-act="again"]').addEventListener('click', function () { i = 0; score = 0; question(); });
      body.querySelector('[data-act="read"]').addEventListener('click', function () { location.href = 'publicaciones.html'; });
    }

    question();
  }

  /* ───────── Botón para subir ───────── */
  function initFab() {
    var fab = make('button', 'av-fab', '<span class="material-symbols-outlined">arrow_upward</span>');
    fab.type = 'button';
    fab.setAttribute('aria-label', 'Volver arriba');
    fab.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: reduce ? 'auto' : 'smooth' }); });
    d.body.appendChild(fab);
  }

  /* ───────── Fecha del día ───────── */
  function initDates() {
    var now = new Date();
    var mes = d.getElementById('av-mes');
    if (mes) {
      var t = now.toLocaleDateString('es-DO', { month: 'long', year: 'numeric' });
      mes.textContent = t.charAt(0).toUpperCase() + t.slice(1);
    }
    var yr = d.getElementById('av-year');
    if (yr) yr.textContent = now.getFullYear();
  }

  /* ───────── Frase que se escribe sola ───────── */
  function initTyping() {
    var target = d.getElementById('av-type');
    if (!target) return;
    var phrases = [
      'lecturas que despiertan la curiosidad',
      'recursos listos para usar en el aula',
      'retos para aprender jugando',
      'ideas para enseñar con tecnología'
    ];
    if (reduce) { target.textContent = phrases[0]; return; }
    var p = 0, c = 0, del = false;
    function tick() {
      var full = phrases[p];
      if (!del) {
        c++;
        target.textContent = full.slice(0, c);
        if (c === full.length) { del = true; return setTimeout(tick, 1700); }
        return setTimeout(tick, 55);
      }
      c--;
      target.textContent = full.slice(0, c);
      if (c === 0) { del = false; p = (p + 1) % phrases.length; return setTimeout(tick, 350); }
      setTimeout(tick, 24);
    }
    tick();
  }

  /* ───────── Contadores con valor fijo ───────── */
  function initCounters() {
    d.querySelectorAll('[data-count]').forEach(function (el) {
      var n = Number(el.getAttribute('data-count'));
      if (!('IntersectionObserver' in window)) { el.textContent = n; return; }
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (en) {
          if (en.isIntersecting) { countUp(el, n); io.disconnect(); }
        });
      }, { threshold: 0.4 });
      io.observe(el);
    });
  }

  ready(function () {
    var header = d.querySelector('header.fixed');
    if (d.querySelector('header.fixed img[alt="Logo Aula Abierta"]') || page === 'docente.html') {
      d.body.classList.add('av-public');
    }
    initHeader(header);
    initNav();
    if (d.body.classList.contains('av-public')) {
      initReveal();
      initCards();
      initFab();
    }
    initRipple();
    initBookmarkBurst();
    initSearch();
    initDates();
    initTyping();
    initCounters();
  });

  window.AV = { openQuiz: openQuiz, openSearch: openSearch, confetti: confetti, countUp: countUp };
})();
