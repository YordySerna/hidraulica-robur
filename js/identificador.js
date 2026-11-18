/* identificador.js — ¿qué terminal es? Primero el asiento (cómo sella),
   después el género y al final la rosca medida con pie de metro. Con eso
   busca en las tablas de roscas de datos.js la norma y la medida, y avisa
   cuando esa misma medida calzaría con otra norma: por eso se mira el
   asiento primero. */
(function () {
  'use strict';

  var raiz = document.getElementById('ident');
  if (!raiz || !window.Robur) { return; }
  var Rb = window.Robur, D = Rb.R;

  function uno(s, c) { return (c || document).querySelector(s); }
  function todos(s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); }
  function val(name) { var r = uno('input[name="' + name + '"]:checked', raiz); return r ? r.value : null; }

  var POR_ASIENTO = { cono37: ['JIC'], cono24: ['DINL', 'DINS'], plano: ['ORFS'], cono60: ['BSP'], conica: ['NPT'], brida: ['BR61', 'BR62'], acople: ['ISOA'] };
  var ESC = 6, X0 = 64;                       /* px por mm del pie de metro, y su cero */

  var mmN = document.getElementById('id-mm');
  var mmR = document.getElementById('id-mm-r');
  var movil = uno('[data-pie-movil]', raiz);
  var pieza = uno('[data-pie-pieza]', raiz);
  var lee = uno('[data-pie-lee]', raiz);
  var tit = uno('[data-id-tit]', raiz), med = uno('[data-id-med]', raiz), txt = uno('[data-id-txt]', raiz);
  var otros = uno('[data-id-otros]', raiz), waLink = uno('[data-id-wa]', raiz);
  var pasoGen = uno('[data-paso-genero]', raiz), pasoMed = uno('[data-paso-medir]', raiz);
  var botones = todos('[data-usar]', raiz);

  /* la regla: una marca por milímetro, más larga cada 5 y con número cada 10 */
  (function regla() {
    var d = '', nums = uno('[data-pie-numeros]', raiz);
    for (var mm = 0; mm <= 92; mm++) {
      var x = X0 + mm * ESC;
      var h = mm % 10 === 0 ? 14 : mm % 5 === 0 ? 10 : 6;
      d += 'M' + x + ' 64v' + h;
      if (mm % 10 === 0 && nums) {
        var t = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        t.setAttribute('x', x + 2); t.setAttribute('y', 90); t.setAttribute('class', 'pie__num');
        t.textContent = mm / 10;
        nums.appendChild(t);
      }
    }
    uno('[data-pie-marcas]', raiz).setAttribute('d', d);
  })();

  var actual = null;

  function busca(asiento, genero, mm) {
    var res = [];
    Object.keys(D.normas).forEach(function (k) {
      var n = D.normas[k];
      Object.keys(n.od).forEach(function (dash) {
        var od = n.od[dash];
        var est = genero === 'hembra' ? mm + 1.08 * (n.paso[dash] || 1.5) : mm;
        var err = Math.abs(est - od);
        var tol = Math.max(0.5, od * 0.025);
        res.push({ norma: k, dash: +dash, od: od, err: err, ok: err <= tol, asiento: n.asiento });
      });
    });
    res.sort(function (a, b) { return a.err - b.err; });
    var propias = res.filter(function (r) { return (POR_ASIENTO[asiento] || []).indexOf(r.norma) >= 0; });
    var ajenas = res.filter(function (r) { return r.ok && (POR_ASIENTO[asiento] || []).indexOf(r.norma) < 0; });
    return { propias: propias, ajenas: ajenas };
  }

  function generoPara(norma, g) {
    var gens = Object.keys(D.normas[norma].generos);
    return gens.indexOf(g) >= 0 ? g : gens[0];
  }

  function pinta() {
    var asiento = val('asiento'), genero = val('id-genero');
    var mm = parseFloat(String(mmN.value).replace(',', '.'));
    if (isNaN(mm)) { mm = 19.1; }
    mm = Math.max(8, Math.min(70, mm));

    /* el pie de metro se abre a la medida */
    movil.setAttribute('transform', 'translate(' + (X0 + mm * ESC).toFixed(1) + ' 0)');
    pieza.setAttribute('width', (mm * ESC).toFixed(1));
    lee.textContent = Rb.dec(mm);

    var especial = asiento === 'brida' || asiento === 'acople';
    pasoGen.hidden = especial;
    pasoMed.hidden = especial;
    while (otros.firstChild) { otros.removeChild(otros.firstChild); }

    if (asiento === 'brida') {
      tit.textContent = 'Brida SAE de 4 pernos';
      med.textContent = 'Código 61 (3.000 psi) o 62 (6.000 psi): la 62 es más gruesa y lleva pernos más grandes.';
      txt.textContent = 'Para saber cuál y de qué medida, mándanos una foto de la brida con el pie de metro sobre el orificio. Va en mangueras de 1/2" a 2".';
      actual = null;
      botones.forEach(function (b) { b.hidden = true; });
      return;
    }
    if (asiento === 'acople') {
      tit.textContent = 'Acople rápido';
      med.textContent = 'Si es de tractor o implemento agrícola, casi siempre es ISO A de 1/2".';
      txt.textContent = 'Los de minicargador o martillo suelen ser de cara plana. Si dudas, foto del acople y te decimos.';
      actual = { norma: 'ISOA', genero: 'hembra', dash: 8 };
      botones.forEach(function (b) { b.hidden = false; });
      return;
    }

    var r = busca(asiento, genero, mm);
    var mejor = r.propias[0];
    var n = D.normas[mejor.norma];
    var g = generoPara(mejor.norma, genero);
    var gtxt = g === 'hembra' ? 'hembra' : 'macho';
    tit.textContent = n.nombre + ' ' + gtxt + ', ' + n.rosca[mejor.dash];
    med.textContent = '';
    med.appendChild(document.createTextNode('Terminal −' + Rb.dd(mejor.dash) + ' · va en manguera de '));
    var b = document.createElement('b'); b.textContent = Rb.PULG[mejor.dash]; med.appendChild(b);

    if (mejor.ok) {
      var avisoG = g !== genero ? ' Ojo: en manguera, esta norma se usa ' + gtxt + '; lo que mediste debe ser la máquina.' : '';
      txt.textContent = 'Lo normal es que la rosca y la manguera tengan el mismo número. Si tu manguera vieja dice otra medida, manda esa.' + avisoG;
      raiz.classList.remove('ident--lejos');
    } else {
      txt.textContent = 'No calza exacto: lo más cercano está a ' + Rb.dec(mejor.err) + ' mm. Revisa que el pie de metro esté derecho sobre las crestas, o mándanos una foto.';
      raiz.classList.add('ident--lejos');
    }

    /* la lección: la misma medida, con otro asiento, sería otra cosa */
    r.ajenas.slice(0, 2).forEach(function (o) {
      var li = document.createElement('li');
      li.textContent = 'Con la misma medida, si el asiento fuera otro, sería ' + D.normas[o.norma].nombre + ' ' + D.normas[o.norma].rosca[o.dash] + '.';
      otros.appendChild(li);
    });

    actual = { norma: mejor.norma, genero: g, dash: mejor.dash };
    botones.forEach(function (bt) { bt.hidden = false; });
    waLink.setAttribute('href', Rb.wa('Hola Hidráulica Robur, creo que mi terminal es ' + n.nombre + ' ' + gtxt + ' ' + n.rosca[mejor.dash] +
      ' (medí ' + Rb.dec(mm) + ' mm). ¿Me confirman?'));
  }

  raiz.addEventListener('change', pinta);
  mmR.addEventListener('input', function () { mmN.value = mmR.value; pinta(); });
  mmN.addEventListener('input', function () {
    var v = parseFloat(String(mmN.value).replace(',', '.'));
    if (!isNaN(v)) { mmR.value = Math.max(8, Math.min(70, v)); }
    pinta();
  });

  botones.forEach(function (bt) {
    bt.addEventListener('click', function () {
      if (!actual || !window.Armador) { return; }
      var L = bt.getAttribute('data-usar');
      window.Armador.ponLado(L, { norma: actual.norma, genero: actual.genero }, actual.dash);
      var destino = document.getElementById('lado-' + L) || document.getElementById('armar');
      destino.scrollIntoView({ behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth', block: 'start' });
    });
  });

  pinta();
})();
