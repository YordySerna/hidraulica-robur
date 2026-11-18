/* armador.js — el configurador: lee el formulario, cuida que la combinación
   exista (no hay NPT hembra ni JIC de 2" en métrica), dibuja la manguera y
   muestra presión, largo de corte, código y precio. Los radios son nativos:
   esto sólo los habilita, los lee y escribe los resultados. */
(function () {
  'use strict';

  var form = document.getElementById('armador');
  if (!form || !window.Robur || !window.Dibujo) { return; }
  var Rb = window.Robur, D = Rb.R;

  function uno(s, c) { return (c || document).querySelector(s); }
  function todos(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function val(name) { var r = uno('input[name="' + name + '"]:checked', form); return r ? r.value : null; }
  function marca(name, v) {
    var r = uno('input[name="' + name + '"][value="' + v + '"]', form);
    if (r) { r.checked = true; }
  }
  function sale(sel, txt) { todos('[data-o="' + sel + '"]').forEach(function (n) { n.textContent = txt; }); }

  var svg = document.getElementById('ficha-svg');
  var largoN = document.getElementById('m-largo');
  var largoR = document.getElementById('m-largo-r');
  var desR = document.getElementById('m-desfase');
  var cant = document.getElementById('m-cant');
  var bloqueDes = uno('[data-desfase]');
  var dial = document.getElementById('dial');
  var desglose = uno('[data-desglose]');
  var enviar = document.getElementById('arm-wa');
  var agregar = document.getElementById('arm-agregar');
  var aguja = uno('[data-mano-aguja]');

  /* los cortes de las cuatro mangueras */
  todos('[data-corte]').forEach(function (s) { window.Dibujo.corte(s, s.getAttribute('data-corte')); });

  /* ── que lo elegido exista ────────────────────────────────────────── */
  function ajusta() {
    var tipo = val('tipo');
    var meds = Rb.medidasPara(tipo);
    todos('input[name="dash"]', form).forEach(function (r) {
      var ok = meds.indexOf(+r.value) >= 0;
      r.disabled = !ok;
      r.parentNode.classList.toggle('no', !ok);
    });
    var dash = +val('dash');
    if (meds.indexOf(dash) < 0) {
      var cerca = meds.reduce(function (a, b) { return Math.abs(b - dash) < Math.abs(a - dash) ? b : a; });
      marca('dash', cerca); dash = cerca;
    }
    ['a', 'b'].forEach(function (L) {
      var normas = Rb.normasPara(dash);
      todos('input[name="' + L + '-norma"]', form).forEach(function (r) {
        var ok = normas.indexOf(r.value) >= 0;
        r.disabled = !ok;
        r.parentNode.classList.toggle('no', !ok);
      });
      var n = val(L + '-norma');
      if (normas.indexOf(n) < 0) { n = normas.indexOf('JIC') >= 0 ? 'JIC' : normas[0]; marca(L + '-norma', n); }
      var gens = Object.keys(D.normas[n].generos);
      todos('input[name="' + L + '-genero"]', form).forEach(function (r) {
        var ok = gens.indexOf(r.value) >= 0;
        r.disabled = !ok;
        r.parentNode.hidden = !ok;
      });
      var g = val(L + '-genero');
      if (gens.indexOf(g) < 0) { g = gens[0]; marca(L + '-genero', g); }
      var formas = D.normas[n].generos[g];
      todos('input[name="' + L + '-forma"]', form).forEach(function (r) {
        var ok = formas.indexOf(r.value) >= 0;
        r.disabled = !ok;
        r.parentNode.classList.toggle('no', !ok);
      });
      if (formas.indexOf(val(L + '-forma')) < 0) { marca(L + '-forma', 'recto'); }
      var ay = uno('#lado-' + L + ' [data-ayuda-norma]');
      if (ay) { ay.textContent = D.normas[n].larga + ' · ' + D.normas[n].rosca[dash] + '. ' + D.normas[n].donde; }
    });
  }

  function estado() {
    var largo = parseFloat(String(largoN.value).replace(',', '.'));
    if (isNaN(largo)) { largo = 100; }
    return {
      tipo: val('tipo'), dash: +val('dash'),
      A: { norma: val('a-norma'), genero: val('a-genero'), forma: val('a-forma') },
      B: { norma: val('b-norma'), genero: val('b-genero'), forma: val('b-forma') },
      largo: Math.max(10, Math.min(1000, largo)),
      desfase: +desR.value || 0,
      prot: val('prot') || 'ninguna',
      cant: Math.max(1, Math.min(99, parseInt(cant.value, 10) || 1))
    };
  }

  /* ── todo, de una vez ─────────────────────────────────────────────── */
  var ultimo = null;
  function pinta() {
    ajusta();
    var s = estado(), c = Rb.calcula(s), M = D.mangueras[s.tipo];
    ultimo = { s: s, c: c };
    window.Dibujo.dibuja(svg, s, c);

    bloqueDes.hidden = !c.conDesfase;
    if (dial) { window.Dibujo.dial(dial, s.desfase); }
    sale('desfase', s.desfase + '°');

    sale('bar', Rb.miles(c.bar));
    sale('psi', Rb.miles(c.psi));
    sale('rotura', Rb.miles(c.rotura));
    sale('radio', Rb.miles(c.radio));
    sale('corte', Rb.miles(c.corteMm));
    sale('total-mm', Rb.miles(c.totalMm));
    sale('codigo', c.codigo);
    sale('od', Rb.dec(c.od));
    sale('tipo-nom', s.tipo + ' · ' + M.nombre.toLowerCase());
    sale('medida', Rb.PULG[s.dash] + ' (−' + Rb.dd(s.dash) + ')');
    var lim = c.limita === 'manguera' ? 'La manguera.' :
      'El terminal del lado ' + c.limita + ' (' + D.normas[(c.limita === 'A' ? s.A : s.B).norma].nombre + '): la manguera aguanta ' + c.barManguera + ' bar.';
    sale('limita', lim);
    uno('[data-limite]').classList.toggle('es-terminal', c.limita !== 'manguera');
    if (aguja) { aguja.setAttribute('transform', 'rotate(' + (-120 + Math.min(c.bar, 500) / 500 * 240).toFixed(1) + ')'); }

    var minCm = Math.ceil(c.minTotal / 10);
    largoN.min = minCm; largoR.min = Math.max(20, minCm);
    var aviso = uno('[data-o="min"]');
    if (aviso) { aviso.hidden = s.largo * 10 >= c.minTotal; aviso.textContent = 'Con estos terminales, lo más corto que se puede armar es ' + minCm + ' cm.'; }

    /* el desglose */
    var m = c.corteMm / 1000;
    var filas = [
      ['Manguera ' + s.tipo + ' ' + Rb.PULG[s.dash] + ' × ' + Rb.dec(m, 2) + ' m', c.precio.manguera],
      ['Terminal A · ' + D.normas[s.A.norma].nombre + ' ' + D.formaNombre[s.A.forma], c.precio.A],
      ['Terminal B · ' + D.normas[s.B.norma].nombre + ' ' + D.formaNombre[s.B.forma], c.precio.B],
      ['Corte, limpieza, prensado y prueba', c.precio.armado]
    ];
    if (c.precio.proteccion) { filas.push([D.protecciones[s.prot].nombre + ' × ' + Rb.dec(m, 2) + ' m', c.precio.proteccion]); }
    while (desglose.firstChild) { desglose.removeChild(desglose.firstChild); }
    filas.forEach(function (fl) {
      var li = document.createElement('li');
      var a = document.createElement('span'); a.textContent = fl[0];
      var b = document.createElement('b'); b.textContent = Rb.plata(fl[1]);
      li.appendChild(a); li.appendChild(b); desglose.appendChild(li);
    });
    sale('unidad', Rb.plata(c.precio.unidad));
    sale('total', Rb.plata(c.precio.total));
    sale('cant', s.cant > 1 ? '× ' + s.cant + ' = ' : '');
    uno('[data-o="cant"]').hidden = s.cant <= 1;

    var msj = 'Hola Hidráulica Robur, quiero esta manguera:\n• Código ' + c.codigo + '\n• ' +
      Rb.lineasManguera(s, c).join('\n• ') + '\n• Cantidad: ' + s.cant +
      '\nPrecio en la página: ' + Rb.plata(c.precio.unidad) + ' c/u (referencial).';
    enviar.setAttribute('href', Rb.wa(msj));
  }

  /* ── eventos ──────────────────────────────────────────────────────── */
  var espera = null;
  function pronto() { if (espera) { return; } espera = window.requestAnimationFrame(function () { espera = null; pinta(); }); }

  form.addEventListener('change', function (ev) {
    var t = ev.target;
    if (t.name === 'desfase-pre') { desR.value = t.value; }
    pronto();
  });
  largoR.addEventListener('input', function () { largoN.value = largoR.value; pronto(); });
  largoN.addEventListener('input', function () {
    var v = parseFloat(String(largoN.value).replace(',', '.'));
    if (!isNaN(v)) { largoR.value = Math.max(+largoR.min, Math.min(+largoR.max, v)); }
    pronto();
  });
  largoN.addEventListener('blur', function () {
    var c = ultimo && ultimo.c;
    var v = parseFloat(String(largoN.value).replace(',', '.'));
    if (isNaN(v)) { v = 100; }
    if (c) { v = Math.max(Math.ceil(c.minTotal / 10), v); }
    largoN.value = Math.round(Math.min(1000, v) * 10) / 10;
    pronto();
  });
  desR.addEventListener('input', function () {
    todos('input[name="desfase-pre"]', form).forEach(function (r) { r.checked = +r.value === +desR.value; });
    pronto();
  });
  todos('[data-cant]', form).forEach(function (b) {
    b.addEventListener('click', function () {
      cant.value = Math.max(1, Math.min(99, (parseInt(cant.value, 10) || 1) + (+b.getAttribute('data-cant'))));
      pronto();
    });
  });
  cant.addEventListener('input', pronto);
  form.addEventListener('submit', function (ev) { ev.preventDefault(); });

  var igual = document.getElementById('b-igual');
  if (igual) {
    igual.addEventListener('click', function () {
      marca('b-norma', val('a-norma')); ajusta();
      marca('b-genero', val('a-genero')); ajusta();
      marca('b-forma', val('a-forma'));
      pronto();
    });
  }

  agregar.addEventListener('click', function () {
    if (!ultimo) { return; }
    var s = ultimo.s, c = ultimo.c;
    Rb.agrega({ clave: c.codigo, titulo: 'Manguera armada ' + c.codigo, lineas: Rb.lineasManguera(s, c), precio: c.precio.unidad, cant: s.cant, unidad: 'u' });
    agregar.classList.remove('hecho'); void agregar.offsetWidth; agregar.classList.add('hecho');
    var ok = uno('[data-o="agregada"]');
    if (ok) { ok.textContent = 'Agregada: ' + c.codigo; }
  });

  /* lo usa el identificador de terminales */
  window.Armador = {
    ponLado: function (L, t, dash) {
      /* si la manguera elegida no existe en esa medida (una 4SH de 1/2"), pasa a la 2SN, que existe en todas */
      if (dash && Rb.medidasPara(val('tipo')).indexOf(dash) < 0) { marca('tipo', '2SN'); }
      if (dash) { marca('dash', dash); }
      ajusta();
      marca(L + '-norma', t.norma); ajusta();
      if (t.genero) { marca(L + '-genero', t.genero); ajusta(); }
      pinta();
    }
  };

  pinta();
})();
