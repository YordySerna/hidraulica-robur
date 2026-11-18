/* dibujo.js — dibuja la manguera armada, vista de costado, como en una
   ficha de taller: la manguera con su impresión a lo largo, los dos
   casquillos prensados, los terminales de cada norma, los codos con su
   desfase y las cotas.

   Sin librerías y sin atributos style (la CSP los bloquea): todo es
   atributo SVG o clase. Los degradados del metal están en el <defs> del
   SVG de la página (#zinc, #zinc-osc, #acero, #brillo-zinc).

   Coordenadas: viewBox 0 0 1200 640, eje de la manguera en y = 300.
   Cada terminal se dibuja en su propio marco: el corte de la manguera en
   el origen y el eje hacia +x, hacia afuera. Al lado A se le da vuelta. */
(function () {
  'use strict';

  var NS = 'http://www.w3.org/2000/svg';
  var VW = 1200, Y0 = 300, MARGEN = 46;

  function el(tag, at, padre) {
    var n = document.createElementNS(NS, tag);
    if (at) { for (var k in at) { if (at[k] !== undefined && at[k] !== null) { n.setAttribute(k, at[k]); } } }
    if (padre) { padre.appendChild(n); }
    return n;
  }
  function f(n) { return (Math.round(n * 10) / 10).toString(); }
  function caja(x, y, w, h) { return 'M' + f(x) + ' ' + f(y) + 'h' + f(w) + 'v' + f(h) + 'h' + f(-w) + 'Z'; }
  /* prisma con los cantos biselados (tuerca, hexágono vistos de costado) */
  function biselado(x0, L, h, c) {
    var y = h / 2;
    return 'M' + f(x0) + ' ' + f(-y + c) + 'L' + f(x0 + c) + ' ' + f(-y) + 'H' + f(x0 + L - c) + 'L' + f(x0 + L) + ' ' + f(-y + c) +
      'V' + f(y - c) + 'L' + f(x0 + L - c) + ' ' + f(y) + 'H' + f(x0 + c) + 'L' + f(x0) + ' ' + f(y - c) + 'Z';
  }

  /* ── medidas de las piezas, todas en función del grosor W ────────── */
  function medidasDe(W) {
    return {
      Lf: W * 1.75 + 12,          /* casquillo */
      Hf: W * 1.2 + 6,
      Ln: W * 0.26 + 4,           /* cuello del vástago */
      Hn: W * 0.6,
      Lnut: W * 0.82 + 8,         /* tuerca giratoria */
      Hnut: W * 1.12 + 6,
      Lhex: W * 0.5 + 6,          /* hexágono fijo del macho */
      Lth: W * 0.72 + 8,          /* rosca macho */
      Hth: W * 0.8 + 2,
      R: W * 0.85 + 12,           /* radio del codo */
      Ht: W * 0.56 + 2,           /* tubo del codo */
      Ls: W * 0.14 + 4            /* tramo recto después del codo */
    };
  }

  /* ── cabezas: lo que va en la punta, con el eje hacia +x desde 0 ── */
  function largoCabeza(t, g) {
    if (t.norma === 'ISOA') { return g.Lhex + (t.genero === 'macho' ? g.Lth * 1.35 : g.Lth * 1.9); }
    if (t.genero === 'brida') { return g.Hn * 0.55 + g.Hnut * 0.32; }
    if (t.genero === 'macho') { return g.Lhex + g.Lth + (t.norma === 'NPT' ? 0 : g.Hth * 0.28); }
    return g.Lnut * (t.norma === 'DINL' || t.norma === 'DINS' ? 1.12 : 1);
  }

  function tuerca(p, x0, L, h, oscura) {
    el('path', { d: biselado(x0, L, h, h * 0.12), 'class': oscura ? 'm-zinc-osc' : 'm-zinc' }, p);
    el('path', { d: 'M' + f(x0 + h * 0.06) + ' ' + f(-h * 0.26) + 'H' + f(x0 + L - h * 0.06) + 'M' + f(x0 + h * 0.06) + ' ' + f(h * 0.26) + 'H' + f(x0 + L - h * 0.06), 'class': 'm-faceta' }, p);
  }
  function rosca(p, x0, L, h, conica) {
    var y1 = h / 2, y2 = conica ? h * 0.38 : h / 2;
    el('path', { d: 'M' + f(x0) + ' ' + f(-y1) + 'L' + f(x0 + L) + ' ' + f(-y2) + 'V' + f(y2) + 'L' + f(x0) + ' ' + f(y1) + 'Z', 'class': 'm-acero' }, p);
    var paso = Math.max(3.2, h * 0.11), d = '';
    for (var x = x0 + paso * 0.6; x < x0 + L - 1; x += paso) {
      var k = (x - x0) / L, yy = y1 + (y2 - y1) * k;
      d += 'M' + f(x) + ' ' + f(-yy + 0.6) + 'L' + f(x + paso * 0.55) + ' ' + f(yy - 0.6);
    }
    el('path', { d: d, 'class': 'm-hilo' }, p);
  }

  function cabeza(p, t, g) {
    var n = t.norma;
    if (n === 'ISOA') {
      tuerca(p, 0, g.Lhex, g.Hnut * 0.95);
      if (t.genero === 'macho') {
        var L = g.Lth * 1.35, h = g.Hth * 0.95;
        el('path', { d: caja(g.Lhex, -h / 2, L, h), 'class': 'm-acero' }, p);
        el('path', { d: caja(g.Lhex + L * 0.55, -h / 2 - 1, L * 0.1, h + 2), 'class': 'm-ranura' }, p);
        el('path', { d: 'M' + f(g.Lhex + L) + ' ' + f(-h / 2) + 'l' + f(h * 0.12) + ' ' + f(h * 0.14) + 'v' + f(h * 0.72) + 'l' + f(-h * 0.12) + ' ' + f(h * 0.14) + 'Z', 'class': 'm-acero' }, p);
      } else {
        var L2 = g.Lth * 1.9, h2 = g.Hnut * 1.15;
        el('path', { d: biselado(g.Lhex, L2, h2, h2 * 0.1), 'class': 'm-zinc' }, p);
        var dd = '', x0 = g.Lhex + L2 * 0.3, x1 = g.Lhex + L2 * 0.84;
        for (var x = x0; x < x1; x += 3.4) { dd += 'M' + f(x) + ' ' + f(-h2 / 2 + 3) + 'V' + f(h2 / 2 - 3); }
        el('path', { d: dd, 'class': 'm-moleteado' }, p);
        el('path', { d: caja(g.Lhex + L2 - 3, -h2 * 0.3, 3, h2 * 0.6), 'class': 'm-boca' }, p);
      }
      return;
    }
    if (t.genero === 'brida') {
      var Ls = g.Hn * 0.55, hs = g.Hnut * 0.78, Lp = g.Hnut * 0.32, hp = g.Hnut * 1.75;
      el('path', { d: caja(0, -hs / 2, Ls, hs), 'class': 'm-acero' }, p);
      el('path', { d: biselado(Ls, Lp, hp, Lp * 0.3), 'class': n === 'BR62' ? 'm-zinc-osc' : 'm-zinc' }, p);
      el('path', { d: caja(Ls + Lp - 2.4, -hs * 0.42, 2.4, hs * 0.84), 'class': 'm-oring' }, p);
      return;
    }
    if (t.genero === 'macho') {
      tuerca(p, 0, g.Lhex, g.Hnut * 0.95);
      var conica = n === 'NPT';
      rosca(p, g.Lhex, g.Lth, g.Hth, conica);
      var x2 = g.Lhex + g.Lth, h3 = g.Hth;
      if (n === 'JIC') { el('path', { d: 'M' + f(x2) + ' ' + f(-h3 * 0.4) + 'L' + f(x2 + h3 * 0.28) + ' ' + f(-h3 * 0.2) + 'V' + f(h3 * 0.2) + 'L' + f(x2) + ' ' + f(h3 * 0.4) + 'Z', 'class': 'm-acero-claro' }, p); }
      else if (n === 'BSP') { el('path', { d: 'M' + f(x2) + ' ' + f(-h3 * 0.42) + 'L' + f(x2 + h3 * 0.28) + ' ' + f(-h3 * 0.12) + 'V' + f(h3 * 0.12) + 'L' + f(x2) + ' ' + f(h3 * 0.42) + 'Z', 'class': 'm-acero-claro' }, p); }
      else if (n === 'ORFS') {
        el('path', { d: caja(x2, -h3 * 0.42, h3 * 0.28, h3 * 0.84), 'class': 'm-acero-claro' }, p);
        el('path', { d: caja(x2 + h3 * 0.28 - 2.2, -h3 * 0.3, 2.2, h3 * 0.6), 'class': 'm-oring' }, p);
      }
      return;
    }
    /* hembra giratoria: la tuerca; la métrica 24° es un poco más larga */
    var Lt = g.Lnut * (n === 'DINL' || n === 'DINS' ? 1.12 : 1);
    tuerca(p, 0, Lt, g.Hnut);
    el('path', { d: caja(0, -g.Hnut * 0.5 + 1, 2.2, g.Hnut - 2), 'class': 'm-sombra' }, p);
  }

  /* la tuerca vista de frente (cuando el codo apunta hacia uno) */
  function caraHex(p, cx, cy, ac, lejos) {
    var r = ac / Math.sqrt(3), d = '';
    for (var i = 0; i < 6; i++) {
      var a = Math.PI / 6 + i * Math.PI / 3;
      d += (i ? 'L' : 'M') + f(cx + r * Math.cos(a)) + ' ' + f(cy + r * Math.sin(a));
    }
    el('path', { d: d + 'Z', 'class': lejos ? 'm-zinc-osc' : 'm-zinc-cara' }, p);
    if (!lejos) {
      el('circle', { cx: f(cx), cy: f(cy), r: f(ac * 0.36), 'class': 'm-boca' }, p);
      el('circle', { cx: f(cx), cy: f(cy), r: f(ac * 0.36), 'class': 'm-hilo-cara' }, p);
    }
  }

  /* ── un terminal completo, en su marco ─────────────────────────────
     c: cuánto se ve el codo hacia arriba (1 arriba, −1 abajo, 0 de frente)
     s: hacia dónde va el codo en profundidad (+ hacia uno, − hacia atrás) */
  function terminal(p, t, g, c, s) {
    /* casquillo prensado: el metal más grande, con las caras del prensado */
    var Lf = g.Lf, Hf = g.Hf;
    el('path', { d: biselado(-Lf, Lf + 2, Hf, 3), 'class': 'm-zinc' }, p);
    el('path', { d: biselado(-Lf, Lf + 2, Hf, 3), 'class': 'm-iris' }, p);
    el('path', { d: 'M' + f(-Lf + 4) + ' ' + f(-Hf * 0.3) + 'H' + f(-2) + 'M' + f(-Lf + 4) + ' ' + f(Hf * 0.3) + 'H' + f(-2), 'class': 'm-faceta' }, p);
    var ranuras = '';
    for (var i = 0; i < 3; i++) { var xr = -Lf + 5 + i * 4.2; ranuras += 'M' + f(xr) + ' ' + f(-Hf / 2 + 2) + 'V' + f(Hf / 2 - 2); }
    el('path', { d: ranuras, 'class': 'm-ranura-fina' }, p);
    /* cuello */
    el('path', { d: caja(1, -g.Hn / 2, g.Ln, g.Hn), 'class': 'm-acero' }, p);

    var x0 = g.Ln + 1;
    if (t.forma === 'recto') {
      var q = el('g', { transform: 'translate(' + f(x0) + ' 0)' }, p);
      cabeza(q, t, g);
      return { punta: x0 + largoCabeza(t, g), ref: x0 + largoCabeza(t, g), alto: Math.max(Hf, g.Hnut * 1.75) / 2, bajo: Math.max(Hf, g.Hnut * 1.75) / 2 };
    }

    /* codo: el tubo curvo y la cabeza en su punta */
    var a = t.forma === '90' ? Math.PI / 2 : Math.PI / 4;
    var R = g.R;
    var ex = x0 + R * Math.sin(a), ey = -R * (1 - Math.cos(a));
    var px = ex + g.Ls * Math.cos(a), py = ey - g.Ls * Math.sin(a);
    var tubo = 'M' + f(x0 - 1) + ' 0H' + f(x0) + 'A' + f(R) + ' ' + f(R) + ' 0 0 0 ' + f(ex) + ' ' + f(ey) + 'L' + f(px) + ' ' + f(py);
    var frente = Math.abs(c) < 0.35;
    var cc = frente ? (c < 0 ? -0.02 : 0.02) : c;
    var codo = el('g', { transform: 'scale(1 ' + f(cc * 1000) / 1000 + ')' }, p);

    if (frente && s < 0) { caraHex(p, px, 0, g.Hnut, true); }
    el('path', { d: tubo, 'class': 't-borde' , 'stroke-width': f(g.Ht + 3) }, codo);
    el('path', { d: tubo, 'class': 't-cuerpo', 'stroke-width': f(g.Ht) }, codo);
    el('path', { d: tubo, 'class': 't-medio', 'stroke-width': f(g.Ht * 0.5) }, codo);
    el('path', { d: tubo, 'class': 't-brillo', 'stroke-width': f(g.Ht * 0.16) }, codo);

    var largo = largoCabeza(t, g);
    if (!frente) {
      var q2 = el('g', { transform: 'translate(' + f(px) + ' ' + f(py) + ') rotate(' + f(-a * 180 / Math.PI) + ')' }, codo);
      cabeza(q2, t, g);
    } else if (s >= 0) {
      caraHex(p, px, 0, g.Hnut, false);
    }
    /* referencia de la cota: el eje de la cara que sella */
    var ref = t.forma === '90' ? ex : ex + (g.Ls + largo) * Math.cos(a) * 0.5;
    var subida = frente ? g.Hnut * 0.6 : (-(py - (largo + g.Hnut * 0.5) * Math.sin(a)));
    var alto = Math.max(g.Hf / 2, c > 0 ? subida * Math.abs(c) : g.Hf / 2);
    var bajo = Math.max(g.Hf / 2, c < 0 ? subida * Math.abs(c) : g.Hf / 2);
    return { punta: Math.max(px + g.Hnut * 0.5, ref), ref: ref, alto: alto, bajo: bajo };
  }

  /* ── la manguera ─────────────────────────────────────────────────── */
  function curva(xa, xb, y, sag) {
    var xm = (xa + xb) / 2, k = (xb - xa) * 0.22;
    return 'M' + f(xa) + ' ' + f(y) + 'C' + f(xa + k) + ' ' + f(y) + ' ' + f(xm - k) + ' ' + f(y + sag) + ' ' + f(xm) + ' ' + f(y + sag) +
      'C' + f(xm + k) + ' ' + f(y + sag) + ' ' + f(xb - k) + ' ' + f(y) + ' ' + f(xb) + ' ' + f(y);
  }

  function cota(p, x1, x2, y, ya, yb, txt, sub, clase) {
    var g = el('g', { 'class': 'cota ' + (clase || '') }, p);
    el('path', { d: 'M' + f(x1) + ' ' + f(ya) + 'V' + f(y + 7) + 'M' + f(x2) + ' ' + f(yb) + 'V' + f(y + 7), 'class': 'cota__ext' }, g);
    el('path', { d: 'M' + f(x1) + ' ' + f(y) + 'H' + f(x2), 'class': 'cota__lin' }, g);
    el('path', { d: 'M' + f(x1) + ' ' + f(y) + 'l9 -3.6v7.2Z M' + f(x2) + ' ' + f(y) + 'l-9 -3.6v7.2Z', 'class': 'cota__punta' }, g);
    var t = el('text', { x: f((x1 + x2) / 2), y: f(y - 9), 'text-anchor': 'middle', 'class': 'cota__txt' }, g);
    t.textContent = txt;
    if (sub) {
      var s = el('text', { x: f((x1 + x2) / 2), y: f(y + 19), 'text-anchor': 'middle', 'class': 'cota__sub' }, g);
      s.textContent = sub;
    }
  }

  function dibuja(svg, st, c) {
    var R = window.Robur, D = R.R;
    var capa = svg.querySelector('[data-dibujo]');
    while (capa.firstChild) { capa.removeChild(capa.firstChild); }

    var W = 22 + c.od * 1.45;
    var g = medidasDe(W);
    var M = D.mangueras[st.tipo];

    /* desfase: A siempre hacia arriba; B gira alrededor del eje */
    var th = st.desfase * Math.PI / 180;
    var cB = Math.cos(th), sB = Math.sin(th);

    /* primero se miden los terminales en un grupo de ensayo */
    var ensayo = el('g', {}, capa);
    var mA = terminal(ensayo, st.A, g, 1, 0);
    var mB = terminal(ensayo, st.B, g, c.conDesfase ? cB : 1, sB);
    capa.removeChild(ensayo);

    var extA = mA.punta, extB = mB.punta;
    var libreMax = VW - 2 * MARGEN - extA - extB - 2 * g.Lf;
    var t = Math.log(Math.max(c.corteMm, 100) / 100) / Math.log(60);
    t = Math.max(0, Math.min(1, t));
    var libre = Math.min(libreMax, 150 + (libreMax - 150) * Math.pow(t, 0.75));
    var total = extA + extB + 2 * g.Lf + libre;
    var x0 = (VW - total) / 2;
    var XA = x0 + extA;                 /* corte de la manguera, lado A */
    var XB = XA + 2 * g.Lf + libre;     /* corte de la manguera, lado B */
    var sag = Math.min(46, libre * 0.07) * Math.min(1, c.corteMm / 900);

    /* sombra en la mesa */
    el('ellipse', { cx: f((XA + XB) / 2), cy: f(Y0 + Math.max(mA.bajo, mB.bajo, W / 2 + sag, g.Hf / 2) + 14), rx: f(total * 0.46), ry: '7', 'class': 'sombra-mesa' }, capa);

    /* la manguera */
    var dCurva = curva(XA + g.Lf * 0.5, XB - g.Lf * 0.5, Y0, sag);
    var mg = el('g', { 'class': 'mg mg--' + st.tipo.toLowerCase() }, capa);
    var idEje = (svg.id || 'mg') + '-eje';
    el('path', { d: dCurva, id: idEje, 'class': 'mg__borde', 'stroke-width': f(W + 2.5) }, mg);
    el('path', { d: dCurva, 'class': 'mg__cuerpo', 'stroke-width': f(W) }, mg);
    el('path', { d: dCurva, 'class': 'mg__tela', 'stroke-width': f(W * 0.92) }, mg);
    el('path', { d: dCurva, 'class': 'mg__medio', 'stroke-width': f(W * 0.5), transform: 'translate(0 ' + f(-W * 0.06) + ')' }, mg);
    el('path', { d: dCurva, 'class': 'mg__brillo', 'stroke-width': f(W * 0.14), transform: 'translate(0 ' + f(-W * 0.22) + ')' }, mg);

    if (st.prot === 'ninguna') {
      /* la línea impresa: así viene de fábrica, y así se lee */
      var imp = 'ROBUR  ═  ' + st.tipo + '  ═  ' + R.PULG[st.dash] + ' (−' + R.dd(st.dash) + ')  ═  WP ' + c.barManguera + ' BAR  ' +
        Math.round(c.barManguera * 14.5038 / 10) * 10 + ' PSI  ═  ' + M.norma.split(' · ')[0] + '  ═  LONCOCHE  ═  ';
      var txt = el('text', { 'class': 'mg__letras', 'font-size': f(Math.max(9, W * 0.34)), dy: f(Math.max(9, W * 0.34) * 0.35) }, mg);
      var tp = el('textPath', { href: '#' + idEje, startOffset: f(g.Lf * 0.5 + 10) }, txt);
      tp.textContent = imp + imp + imp;
    } else {
      var pr = el('g', { 'class': 'pr pr--' + st.prot }, capa);
      var ancho = { espiral: W + 9, funda: W + 5, resorte: W + 7 }[st.prot];
      el('path', { d: dCurva, 'class': 'pr__base', 'stroke-width': f(ancho) }, pr);
      el('path', { d: dCurva, 'class': 'pr__vuelta', 'stroke-width': f(ancho - 1), 'stroke-dasharray': st.prot === 'espiral' ? f(W * 0.34) + ' ' + f(W * 0.09) : st.prot === 'resorte' ? '3.4 2.2' : '1.6 2.4' }, pr);
      el('path', { d: dCurva, 'class': 'pr__brillo', 'stroke-width': f(ancho * 0.16), transform: 'translate(0 ' + f(-ancho * 0.24) + ')' }, pr);
    }

    /* los terminales, ahora sí en su lugar */
    var gA = el('g', { transform: 'translate(' + f(XA) + ' ' + Y0 + ') scale(-1 1)', 'class': 'term term--a' }, capa);
    terminal(gA, st.A, g, 1, 0);
    var gB = el('g', { transform: 'translate(' + f(XB) + ' ' + Y0 + ')', 'class': 'term term--b' }, capa);
    terminal(gB, st.B, g, c.conDesfase ? cB : 1, sB);

    /* letras A y B */
    [['A', XA - mA.ref, mA.alto], ['B', XB + mB.ref, mB.alto]].forEach(function (L) {
      var y = Y0 - Math.max(L[2], g.Hf / 2) - 26;
      el('circle', { cx: f(L[1]), cy: f(y), r: '13', 'class': 'letra__circ' }, capa);
      var tt = el('text', { x: f(L[1]), y: f(y + 4.6), 'text-anchor': 'middle', 'class': 'letra__txt' }, capa);
      tt.textContent = L[0];
    });

    /* cotas */
    /* las cotas van debajo de todo lo que baja (un codo hacia abajo, la comba) */
    var bajo = Math.max(mA.bajo, mB.bajo, W / 2 + sag, g.Hf / 2);
    var yCorte = Y0 + bajo + 34;
    var yTotal = yCorte + 62;
    cota(capa, XA - mA.ref, XB + mB.ref, yTotal, Y0 + mA.bajo * 0.4, Y0 + mB.bajo * 0.4,
      R.miles(c.totalMm) + ' mm', 'largo total, de punta a punta', 'cota--total');
    cota(capa, XA, XB, yCorte, Y0 + g.Hf / 2 + 2, Y0 + g.Hf / 2 + 2, 'corte ' + R.miles(c.corteMm) + ' mm', null, 'cota--corte');

    svg.setAttribute('aria-label', 'Manguera ' + st.tipo + ' de ' + R.PULG[st.dash] + ', ' + R.miles(c.totalMm) + ' milímetros de largo total. ' +
      'Lado A: ' + R.nombreTerminal(st.A, st.dash) + '. Lado B: ' + R.nombreTerminal(st.B, st.dash) + '.');
  }

  /* ── el dial del desfase: mirando por dentro de la manguera ──────── */
  function dial(svg, grados) {
    var aguja = svg.querySelector('[data-aguja-b]');
    if (aguja) { aguja.setAttribute('transform', 'rotate(' + grados + ')'); }
  }

  /* ── el corte de una manguera (las tarjetas de tipo) ─────────────── */
  function corte(svg, tipo) {
    var D = window.Robur.R, capas = D.mangueras[tipo].capas;
    var r = 44;
    el('circle', { cx: 0, cy: 0, r: r, 'class': 'cx-cubierta' }, svg);
    var paso = 18 / capas.length;
    for (var i = 0; i < capas.length; i++) {
      var rr = r - 6 - i * paso;
      el('circle', { cx: 0, cy: 0, r: f(rr), 'class': capas[i] === 'malla' ? 'cx-malla' : 'cx-espiral' }, svg);
    }
    el('circle', { cx: 0, cy: 0, r: f(r - 8 - 18), 'class': 'cx-tubo' }, svg);
    el('circle', { cx: 0, cy: 0, r: f(r - 8 - 18 - 5), 'class': 'cx-paso' }, svg);
  }

  window.Dibujo = { dibuja: dibuja, dial: dial, corte: corte };
})();
