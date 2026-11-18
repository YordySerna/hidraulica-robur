/* catalogo.js — el mesón y el pedido.
   El catálogo ya está escrito en el HTML (con su «desde» y un enlace a
   WhatsApp por fila). Esto le agrega a cada fila la medida, la forma y la
   cantidad, junta todo en un pedido y lo manda en un solo mensaje. */
(function () {
  'use strict';

  if (!window.Robur) { return; }
  var Rb = window.Robur, D = Rb.R;

  function uno(s, c) { return (c || document).querySelector(s); }
  function todos(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function nuevo(tag, clase, txt) { var n = document.createElement(tag); if (clase) { n.className = clase; } if (txt !== undefined) { n.textContent = txt; } return n; }

  var ITEMS = {};
  D.catalogo.forEach(function (g) { g.items.forEach(function (it) { ITEMS[it.id] = it; }); });

  /* ── pestañas: con JS se ve un grupo a la vez ─────────────────────── */
  var pest = todos('[data-pest]');
  var grupos = todos('.mesa__grupo');
  function muestra(i) {
    grupos.forEach(function (g, k) { g.classList.toggle('activo', k === i); });
    pest.forEach(function (p, k) {
      if (k === i) { p.setAttribute('aria-current', 'true'); } else { p.removeAttribute('aria-current'); }
    });
  }
  pest.forEach(function (p, i) {
    p.addEventListener('click', function (ev) { ev.preventDefault(); muestra(i); });
  });
  if (grupos.length) { muestra(0); }

  /* ── los controles de cada fila ───────────────────────────────────── */
  todos('.fila[data-item]').forEach(function (fila) {
    var it = ITEMS[fila.getAttribute('data-item')];
    var caja = uno('[data-ctl]', fila);
    if (!it || !caja) { return; }
    var precioEl = uno('[data-precio]', fila);
    var selMed = null, selForma = null;

    if (it.medidas && it.medidas.length) {
      var l1 = nuevo('label', 'ctl');
      l1.appendChild(nuevo('span', 'vh', 'Medida'));
      selMed = nuevo('select');
      it.medidas.forEach(function (d) {
        var o = nuevo('option', null, Rb.PULG[d] + ' (−' + Rb.dd(d) + ')');
        o.value = d;
        if (d === 8 || (it.medidas.indexOf(8) < 0 && d === it.medidas[0])) { o.selected = true; }
        selMed.appendChild(o);
      });
      l1.appendChild(selMed); caja.appendChild(l1);
    }
    if (it.formas && it.formas.length > 1) {
      var l2 = nuevo('label', 'ctl');
      l2.appendChild(nuevo('span', 'vh', 'Forma'));
      selForma = nuevo('select');
      it.formas.forEach(function (f) { var o = nuevo('option', null, D.formaNombre[f]); o.value = f; selForma.appendChild(o); });
      l2.appendChild(selForma); caja.appendChild(l2);
    }
    var paso = it.unidad === 'm' ? 0.5 : 1;
    var cant = nuevo('input', 'ctl__cant');
    cant.type = 'number'; cant.min = paso; cant.step = paso; cant.value = 1; cant.inputMode = 'decimal';
    cant.setAttribute('aria-label', 'Cantidad' + (it.unidad === 'm' ? ' en metros' : it.unidad === 'km' ? ' en kilómetros' : ''));
    var lc = nuevo('label', 'ctl ctl--cant');
    lc.appendChild(cant);
    lc.appendChild(nuevo('span', 'ctl__u', it.unidad === 'm' ? 'm' : it.unidad === 'km' ? 'km' : 'un.'));
    caja.appendChild(lc);
    var btn = nuevo('button', 'ctl__agregar', 'Agregar');
    btn.type = 'button';
    caja.appendChild(btn);

    function precio() {
      var d = selMed ? +selMed.value : null;
      return Rb.precioItem(it, d, selForma ? selForma.value : 'recto');
    }
    function actualiza() { precioEl.textContent = Rb.plata(precio()); }
    if (selMed) { selMed.addEventListener('change', actualiza); }
    if (selForma) { selForma.addEventListener('change', actualiza); }
    actualiza();

    btn.addEventListener('click', function () {
      var d = selMed ? +selMed.value : null;
      var f = selForma ? selForma.value : null;
      var c = Math.max(paso, Math.round((parseFloat(String(cant.value).replace(',', '.')) || 1) / paso) * paso);
      var titulo = it.nombre + (d ? ' ' + Rb.PULG[d] + ' (−' + Rb.dd(d) + ')' : '') + (f && f !== 'recto' ? ', ' + D.formaNombre[f] : '');
      Rb.agrega({ clave: it.id + '|' + (d || '') + '|' + (f || ''), titulo: titulo, lineas: [], precio: precio(), cant: c, unidad: it.unidad });
      btn.textContent = 'Agregado ✓';
      btn.classList.add('hecho');
      setTimeout(function () { btn.textContent = 'Agregar'; btn.classList.remove('hecho'); }, 1600);
    });
  });

  /* ── el pedido ────────────────────────────────────────────────────── */
  var panel = document.getElementById('pedido');
  var abrir = uno('[data-abrir-pedido]');
  var flotaWa = uno('.flota--wa');
  var lista = uno('[data-pedido-lista]', panel);
  var vacio = uno('[data-pedido-vacio]', panel);
  var enviar = uno('[data-pedido-enviar]', panel);
  var campos = todos('[data-pd]', panel);
  var antes = null;

  function datos() {
    var o = {};
    campos.forEach(function (c) { o[c.getAttribute('data-pd')] = String(c.value || '').trim(); });
    return o;
  }
  function mensaje() { enviar.setAttribute('href', Rb.wa(Rb.mensajePedido(datos()))); }

  function dibujaPedido() {
    var p = Rb.pedido();
    var n = p.length;
    todos('[data-pedido-n]').forEach(function (e) { e.textContent = n; });
    todos('[data-pedido-total]').forEach(function (e) { e.textContent = Rb.plata(Rb.total()); });
    abrir.hidden = n === 0;
    if (flotaWa) { flotaWa.classList.toggle('flota--oculta', n > 0); }
    vacio.hidden = n > 0;
    enviar.classList.toggle('desactivado', n === 0);
    while (lista.firstChild) { lista.removeChild(lista.firstChild); }
    p.forEach(function (it, i) {
      var li = nuevo('li', 'pd');
      var cab = nuevo('div', 'pd__cab');
      cab.appendChild(nuevo('p', 'pd__tit', it.titulo));
      var quita = nuevo('button', 'pd__quita', '×');
      quita.type = 'button'; quita.setAttribute('aria-label', 'Quitar ' + it.titulo);
      quita.addEventListener('click', function () { Rb.cambia(i, 0); });
      cab.appendChild(quita);
      li.appendChild(cab);
      if (it.lineas && it.lineas.length) {
        var ul = nuevo('ul', 'pd__lin');
        it.lineas.forEach(function (l) { ul.appendChild(nuevo('li', null, l)); });
        li.appendChild(ul);
      }
      var pie = nuevo('div', 'pd__pie');
      var paso = it.unidad === 'm' ? 0.5 : 1;
      var menos = nuevo('button', 'pd__b', '−'); menos.type = 'button'; menos.setAttribute('aria-label', 'Menos');
      var mas = nuevo('button', 'pd__b', '+'); mas.type = 'button'; mas.setAttribute('aria-label', 'Más');
      var c = nuevo('span', 'pd__c', Rb.cantTxt(it));
      menos.addEventListener('click', function () { Rb.cambia(i, Math.round((it.cant - paso) * 10) / 10); });
      mas.addEventListener('click', function () { Rb.cambia(i, Math.round((it.cant + paso) * 10) / 10); });
      pie.appendChild(menos); pie.appendChild(c); pie.appendChild(mas);
      pie.appendChild(nuevo('b', 'pd__p', Rb.plata(it.precio * it.cant)));
      li.appendChild(pie);
      lista.appendChild(li);
    });
    mensaje();
  }

  function abre() {
    antes = document.activeElement;
    panel.hidden = false;
    document.documentElement.classList.add('con-pedido');
    var cerrar = uno('[data-cerrar-pedido]', panel);
    if (cerrar) { cerrar.focus(); }
  }
  function cierra() {
    panel.hidden = true;
    document.documentElement.classList.remove('con-pedido');
    if (antes && antes.focus) { antes.focus(); }
  }
  abrir.addEventListener('click', abre);
  todos('[data-cerrar-pedido]').forEach(function (b) { b.addEventListener('click', cierra); });
  panel.addEventListener('click', function (ev) { if (ev.target === panel) { cierra(); } });
  document.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && !panel.hidden) { cierra(); } });
  uno('[data-vaciar-pedido]', panel).addEventListener('click', function () { Rb.vacia(); });
  campos.forEach(function (c) { c.addEventListener('input', mensaje); c.addEventListener('change', mensaje); });
  enviar.addEventListener('click', function (ev) { if (!Rb.pedido().length) { ev.preventDefault(); } });

  Rb.alCambiar(dibujaPedido);
  dibujaPedido();
})();
