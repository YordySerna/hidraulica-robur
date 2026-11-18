/* robur.js — el núcleo: precios, cálculo de una manguera armada, el pedido
   y el mensaje de WhatsApp. No toca la página: lo usan manguera.js (el
   configurador), identificador.js y catalogo.js.

   Los precios siguen la MISMA regla que _taller/gen_datos.py (el catálogo
   escrito). Si cambia una regla, se cambia en los dos. Los valores salen de
   window.ROBUR, que genera gen_datos.py desde _taller/datos.py. */
(function () {
  'use strict';

  var R = window.ROBUR;
  if (!R) { return; }

  function redondea(n) { return Math.round(n / 100) * 100; }
  function plata(n) { return '$' + Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function miles(n) { return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, '.'); }
  function dec(n, d) { return n.toFixed(d === undefined ? 1 : d).replace('.', ','); }
  function dd(d) { return (d < 10 ? '0' : '') + d; }

  var PULG = {};
  R.medidas.forEach(function (m) { PULG[m.dash] = m.pulg; });

  /* ── precios ─────────────────────────────────────────────────────── */
  function precioTerminal(norma, genero, forma, d, tipo) {
    if (norma === 'ISOA') { return R.acoplePrecio[d][genero]; }
    var n = R.normas[norma];
    var p = R.terminalBase[d] * n.factor * R.formaFactor[forma];
    if (tipo === '4SP' || tipo === '4SH') { p *= R.espiralFactor; }
    return redondea(p);
  }
  function precioProteccion(prot, d) {
    var p = R.protecciones[prot].precio;
    return redondea(p * (d >= 16 ? R.proteccionGrande : 1));
  }
  function precioItem(it, d, forma) {
    switch (it.tipo) {
      case 'manguera': return R.mangueras[it.manguera].precio[d];
      case 'terminal': return precioTerminal(it.norma, it.genero, forma || 'recto', d, '2SN');
      case 'proteccion': return precioProteccion(it.proteccion, d);
      case 'tabla': return it.precio[d];
      case 'base': return redondea(R.terminalBase[d] * it.base);
      default: return it.precio;
    }
  }

  /* ── cuánto aporta cada terminal al largo (mm, aproximado) ─────────
     El largo total se mide de punta a punta (en un codo, hasta el eje de
     la cara que sella). El de CORTE descuenta lo que aporta cada terminal. */
  function descuento(t, d) {
    var recto;
    if (t.norma === 'ISOA') { return t.genero === 'macho' ? 40 + 3 * d : 55 + 3.5 * d; }
    if (t.genero === 'macho') { recto = 16 + 3 * d; }
    else if (t.genero === 'brida') { recto = 20 + 2.6 * d; }
    else { recto = 12 + 2.6 * d; }
    if (t.forma === '45') { return recto + 4 + 1.1 * d; }
    if (t.forma === '90') { return recto + 8 + 2.2 * d; }
    return recto;
  }

  /* ── disponibilidad ──────────────────────────────────────────────── */
  function normasPara(d) {
    return Object.keys(R.normas).filter(function (k) { return R.normas[k].rosca[d] !== undefined; });
  }
  function medidasPara(tipo) {
    return R.medidas.map(function (m) { return m.dash; }).filter(function (d) { return R.mangueras[tipo].bar[d] !== undefined; });
  }

  /* ── una manguera armada, entera ─────────────────────────────────── */
  function calcula(s) {
    var M = R.mangueras[s.tipo];
    var d = s.dash;
    var od = M.od[d];
    var cutA = descuento(s.A, d), cutB = descuento(s.B, d);
    var minTotal = Math.ceil((cutA + cutB + Math.max(60, 2 * od)) / 10) * 10;
    var totalMm = Math.max(s.largo * 10, minTotal);
    var corteMm = totalMm - cutA - cutB;
    var m = corteMm / 1000;

    var pA = precioTerminal(s.A.norma, s.A.genero, s.A.forma, d, s.tipo);
    var pB = precioTerminal(s.B.norma, s.B.genero, s.B.forma, d, s.tipo);
    var pM = redondea(M.precio[d] * m);
    var pArm = R.armado[d];
    var pProt = s.prot !== 'ninguna' ? redondea(precioProteccion(s.prot, d) * m) : 0;
    var unidad = pM + pA + pB + pArm + pProt;

    var pm = M.bar[d], limita = 'manguera';
    var ta = R.normas[s.A.norma].pmax[d], tb = R.normas[s.B.norma].pmax[d];
    if (ta < pm) { pm = ta; limita = 'A'; }
    if (tb < pm) { pm = tb; limita = 'B'; }

    var codo = function (t) { return t.forma !== 'recto'; };
    var conDesfase = codo(s.A) && codo(s.B);

    return {
      od: od, cutA: cutA, cutB: cutB, minTotal: minTotal, totalMm: totalMm, corteMm: corteMm,
      bar: pm, barManguera: M.bar[d], rotura: M.bar[d] * R.rotura, psi: Math.round(pm * 14.5038 / 10) * 10,
      limita: limita, radio: M.radio[d], conDesfase: conDesfase,
      precio: { manguera: pM, A: pA, B: pB, armado: pArm, proteccion: pProt, unidad: unidad, total: unidad * s.cant },
      codigo: codigo(s, totalMm, conDesfase)
    };
  }

  function codTerminal(t) {
    var n = R.normas[t.norma];
    var g = t.genero === 'hembra' ? 'H' : t.genero === 'macho' ? 'M' : '';
    var c = n.codigo + (t.norma === 'BR61' ? '1' : t.norma === 'BR62' ? '2' : '') + g;
    return c + (t.forma === 'recto' ? '' : t.forma);
  }
  function codigo(s, totalMm, conDesfase) {
    var p = { ninguna: '', espiral: '-E', funda: '-F', resorte: '-R' }[s.prot];
    var des = conDesfase ? '-D' + ('00' + s.desfase).slice(-3) : '';
    return 'RB-' + s.tipo + '-' + dd(s.dash) + '-' + codTerminal(s.A) + '-' + codTerminal(s.B) + '-' + ('000' + Math.round(totalMm)).slice(-4) + des + p;
  }

  function nombreTerminal(t, d) {
    var n = R.normas[t.norma];
    var txt = n.nombre;
    if (t.norma === 'ISOA') { return 'acople rápido ISO A ' + t.genero + ' (' + n.rosca[d] + ')'; }
    if (t.genero !== 'brida') { txt += ' ' + R.generoNombre[t.genero]; }
    txt += ', ' + R.formaNombre[t.forma];
    txt += ' (' + n.rosca[d] + ')';
    return txt;
  }

  function lineasManguera(s, c) {
    var M = R.mangueras[s.tipo];
    var l = [
      'Manguera ' + s.tipo + ' (' + M.nombre.toLowerCase() + ') ' + PULG[s.dash] + ' (−' + dd(s.dash) + ')',
      'Lado A: ' + nombreTerminal(s.A, s.dash),
      'Lado B: ' + nombreTerminal(s.B, s.dash),
      'Largo total ' + dec(c.totalMm / 10) + ' cm' + (c.conDesfase ? ' · desfase ' + s.desfase + '°' : '')
    ];
    if (s.prot !== 'ninguna') { l.push('Protección: ' + R.protecciones[s.prot].nombre.toLowerCase()); }
    return l;
  }

  /* ── el pedido: se guarda en el navegador de quien lo arma ───────── */
  var CLAVE = 'robur-pedido-v1';
  var pedido = [];
  try { pedido = JSON.parse(window.localStorage.getItem(CLAVE) || '[]') || []; } catch (e) { pedido = []; }
  if (!Array.isArray(pedido)) { pedido = []; }
  var oyentes = [];

  function guarda() {
    try { window.localStorage.setItem(CLAVE, JSON.stringify(pedido)); } catch (e) { /* sin almacenamiento: vive en la sesión */ }
    oyentes.forEach(function (f) { f(pedido); });
  }
  function agrega(item) {
    /* item: { clave, titulo, lineas[], precio, cant, unidad } */
    for (var i = 0; i < pedido.length; i++) {
      if (pedido[i].clave === item.clave) { pedido[i].cant = Math.round((pedido[i].cant + item.cant) * 10) / 10; guarda(); return; }
    }
    pedido.push(item);
    guarda();
  }
  function cambia(i, cant) {
    if (!pedido[i]) { return; }
    if (cant <= 0) { pedido.splice(i, 1); } else { pedido[i].cant = cant; }
    guarda();
  }
  function vacia() { pedido = []; guarda(); }
  function total() { return pedido.reduce(function (t, it) { return t + it.precio * it.cant; }, 0); }

  /* ── WhatsApp ────────────────────────────────────────────────────── */
  function wa(texto) { return 'https://wa.me/' + R.negocio.whatsapp + '?text=' + encodeURIComponent(texto); }
  function cantTxt(it) {
    var u = it.unidad === 'm' ? ' m' : it.unidad === 'km' ? ' km' : '';
    return (it.unidad === 'u' ? '×' + it.cant : dec(it.cant, it.cant % 1 ? 1 : 0) + u);
  }
  function mensajePedido(datos) {
    var t = 'Hola Hidráulica Robur, quiero cotizar esto:\n';
    pedido.forEach(function (it, i) {
      t += '\n' + (i + 1) + ') ' + it.titulo + ' — ' + cantTxt(it);
      (it.lineas || []).forEach(function (l) { t += '\n   ' + l; });
    });
    t += '\n\nTotal según la página: ' + plata(total()) + ' (referencial, con IVA)';
    if (datos) {
      if (datos.nombre) { t += '\nNombre: ' + datos.nombre; }
      if (datos.comuna) { t += '\nComuna: ' + datos.comuna; }
      if (datos.maquina) { t += '\nMáquina: ' + datos.maquina; }
      if (datos.cuando) { t += '\nLo necesito: ' + datos.cuando; }
    }
    return t;
  }

  window.Robur = {
    R: R, PULG: PULG, plata: plata, miles: miles, dec: dec, dd: dd,
    precioTerminal: precioTerminal, precioProteccion: precioProteccion, precioItem: precioItem,
    normasPara: normasPara, medidasPara: medidasPara, calcula: calcula, nombreTerminal: nombreTerminal,
    lineasManguera: lineasManguera,
    pedido: function () { return pedido; }, agrega: agrega, cambia: cambia, vacia: vacia, total: total,
    alCambiar: function (f) { oyentes.push(f); }, wa: wa, mensajePedido: mensajePedido, cantTxt: cantTxt
  };
})();
