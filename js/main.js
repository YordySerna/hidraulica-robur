/* main.js — el ambiente: la prensa de la portada, el manómetro de la
   cabecera, la línea impresa que corre, las apariciones, el mapa de terreno
   y el «abierto ahora». Sin este archivo la página se lee entera. */
(function () {
  'use strict';

  var raiz = document.documentElement;
  if (window.__rescate) { clearTimeout(window.__rescate); }

  function uno(s, c) { return (c || document).querySelector(s); }
  function todos(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  var quieto = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── 1 · La prensa ─────────────────────────────────────────────────
     El ciclo lo hace el CSS (.prensa.ciclo): los dados cierran, el
     casquillo se achica y la palabra se comprime. Acá sólo se arranca,
     se cuenta el diámetro y se repite de vez en cuando mientras se vea. */
  var prensa = uno('[data-prensa]');
  var palabra = uno('[data-prensa-palabra]');
  var num = uno('[data-prensa-num]');
  var estado = uno('[data-prensa-estado]');
  var otra = uno('[data-prensa-otra]');
  var DE = 28.9, A = 24.6, DUR = 3400, CIERRE0 = 0.30, CIERRE1 = 0.55;
  var corriendo = false, visible = true, cuenta = 0;

  function coma(n) { return n.toFixed(1).replace('.', ','); }
  function ciclo() {
    if (!prensa || corriendo) { return; }
    corriendo = true; cuenta++;
    prensa.classList.remove('ciclo'); if (palabra) { palabra.classList.remove('ciclo'); }
    void prensa.getBoundingClientRect();
    prensa.classList.add('ciclo'); if (palabra) { palabra.classList.add('ciclo'); }
    estado.textContent = 'Prensando…';
    var t0 = 0;
    function paso(t) {
      if (!t0) { t0 = t; }
      var k = (t - t0) / DUR;
      var c = Math.max(0, Math.min(1, (k - CIERRE0) / (CIERRE1 - CIERRE0)));
      c = c * c * (3 - 2 * c);
      num.textContent = coma(DE + (A - DE) * c);
      if (k < 1) { requestAnimationFrame(paso); return; }
      num.textContent = coma(A);
      estado.textContent = '✓ ' + coma(A) + ' mm · dentro de ±0,1';
      corriendo = false;
      if (otra) { otra.hidden = false; }
    }
    requestAnimationFrame(paso);
  }
  if (prensa) {
    if (quieto) {
      prensa.classList.add('cerrada');
      estado.textContent = '8 dados · ' + coma(A) + ' mm · ±0,1';
      if (otra) { otra.hidden = false; }
    } else {
      num.textContent = coma(DE);
      prensa.classList.add('abierta');
      setTimeout(ciclo, 650);
      /* se repite cada 11 s, pero sólo si está a la vista y no más de 6 veces */
      setInterval(function () { if (visible && cuenta < 6 && !document.hidden) { ciclo(); } }, 11000);
      if ('IntersectionObserver' in window) {
        new IntersectionObserver(function (es) { visible = es[0].isIntersecting; }).observe(prensa);
      }
    }
    if (otra) {
      otra.addEventListener('click', function () {
        if (quieto) { prensa.classList.remove('cerrada'); void prensa.getBoundingClientRect(); prensa.classList.add('cerrada'); return; }
        ciclo();
      });
    }
  }

  /* ── 2 · El manómetro de la cabecera y la línea impresa ───────────
     La página entera es un circuito: al bajar, la presión sube hasta la
     de trabajo de una 2SN de 1/2" (275 bar). */
  var aguja = uno('[data-mano-cab]');
  var lectura = uno('[data-presion]');
  var cinta = uno('[data-layline]');
  var cab = document.getElementById('cab');
  var pedido = false, ultimoBar = -1;
  function alScroll() {
    pedido = false;
    var y = window.pageYOffset;
    var tope = Math.max(1, raiz.scrollHeight - window.innerHeight);
    var k = Math.min(1, y / tope);
    var bar = Math.round(275 * k);
    if (bar !== ultimoBar) {
      ultimoBar = bar;
      if (aguja) { aguja.setAttribute('transform', 'rotate(' + (-135 + 270 * k * (275 / 330)).toFixed(1) + ')'); }
      if (lectura) { lectura.textContent = ('00' + bar).slice(-3); }
    }
    if (cab) { cab.classList.toggle('cab--baja', y > 30); }
    if (cinta && !quieto) { cinta.style.transform = 'translate3d(' + (-(y * 0.45) % cinta.firstElementChild.offsetWidth).toFixed(1) + 'px,0,0)'; }
  }
  window.addEventListener('scroll', function () { if (!pedido) { pedido = true; requestAnimationFrame(alScroll); } }, { passive: true });
  window.addEventListener('resize', alScroll);
  alScroll();

  /* ── 3 · Apariciones: una vez, observando el bloque ────────────────── */
  var piezas = todos('.cabeza, .proceso__p, .rubro, .compromisos li, .quien__cifras li, .faena__txt, .terreno, .antes');
  piezas.forEach(function (el) { el.classList.add('rev'); });
  function destapa(el) { el.classList.add('ok'); }
  if ('IntersectionObserver' in window) {
    var ojo = new IntersectionObserver(function (es, o) {
      es.forEach(function (e, i) {
        if (!e.isIntersecting) { return; }
        var el = e.target; o.unobserve(el);
        setTimeout(function () { destapa(el); }, (i % 4) * 80);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.06 });
    piezas.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < window.innerHeight && r.bottom > 0) { destapa(el); } else { ojo.observe(el); }
    });
  } else { piezas.forEach(destapa); }
  setTimeout(function () { piezas.forEach(destapa); }, 6000);

  /* ── 4 · El radio de terreno ──────────────────────────────────────── */
  var tPueblo = uno('[data-t-pueblo]'), tKm = uno('[data-t-km]'), tCosto = uno('[data-t-costo]');
  var pueblos = todos('.pueblo');
  function elige(g) {
    pueblos.forEach(function (p) { p.classList.toggle('activo', p === g); });
    tPueblo.textContent = g.getAttribute('data-pueblo');
    tKm.textContent = '≈ ' + g.getAttribute('data-km') + ' km por camino';
    tCosto.textContent = window.Robur ? window.Robur.plata(+g.getAttribute('data-costo')) : g.getAttribute('data-costo');
  }
  pueblos.forEach(function (g) {
    g.addEventListener('mouseenter', function () { elige(g); });
    g.addEventListener('focus', function () { elige(g); });
    g.addEventListener('click', function () { elige(g); });
  });
  var vr = uno('.pueblo[data-pueblo="Villarrica"]');
  if (vr) { elige(vr); }

  /* ── 5 · ¿Abierto ahora? Con la hora de Santiago, no la del visitante ── */
  var ab = uno('[data-abierto]');
  if (ab && window.Intl && Intl.DateTimeFormat) {
    try {
      var p = {};
      new Intl.DateTimeFormat('en-US', { timeZone: 'America/Santiago', weekday: 'short', hour: 'numeric', minute: 'numeric', hour12: false })
        .formatToParts(new Date()).forEach(function (x) { p[x.type] = x.value; });
      var m = (parseInt(p.hour, 10) % 24) * 60 + parseInt(p.minute, 10);
      var dia = p.weekday;
      var si = (dia !== 'Sat' && dia !== 'Sun' && m >= 510 && m < 1110) || (dia === 'Sat' && m >= 540 && m < 840);
      ab.textContent = si ? 'Abierto ahora' : 'Cerrado ahora · urgencias por WhatsApp';
      ab.classList.toggle('abierto--no', !si);
      ab.hidden = false;
    } catch (e) { /* sin zona horaria, no se dice nada */ }
  }

  /* ── 6 · El botón de WhatsApp se aparta mientras se mira la portada ── */
  var flota = uno('.flota--wa');
  var portada = document.getElementById('inicio');
  if (flota && portada && 'IntersectionObserver' in window) {
    new IntersectionObserver(function (es) {
      flota.classList.toggle('flota--arriba', es[0].intersectionRatio > 0.5);
    }, { threshold: [0, 0.5, 1] }).observe(portada);
  }
})();
