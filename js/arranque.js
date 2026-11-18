/* arranque.js — va en el <head>, antes de pintar.
   Marca .js para que el CSS pueda esconder lo que después aparece animado.
   Si main.js no llegara (red, error), a los 4 s quita la marca y todo queda
   visible: nada de la página depende del script para leerse.
   Va en archivo y no escrito en el HTML porque la CSP (script-src 'self')
   bloquea todo script en línea. */
(function () {
  var d = document.documentElement;
  d.classList.remove('no-js');
  d.classList.add('js');
  window.__rescate = setTimeout(function () { d.classList.remove('js'); }, 4000);
})();
