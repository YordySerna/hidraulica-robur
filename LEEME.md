# Hidráulica Robur — sitio

Sitio estático (HTML + CSS + JS clásico, sin librerías) de las mangueras
hidráulicas de Yordy en Loncoche. 18-11-2026.

**Antes de publicar:** leer `_taller/DATOS-INVENTADOS.md` (teléfono,
dirección, precios y experiencia son de ejemplo) y quitar el `noindex` del
`<head>` en `_taller/pagina.html`.

## Verlo

```
powershell -NoProfile -ExecutionPolicy Bypass -File C:\devs\demos\serve.ps1 -Root C:\devs\clientes\hidraulica-robur -Port 8790
```
→ http://localhost:8790/

## Cómo se edita

`index.html` **no se edita a mano**: lo arma `_taller/armar.py`.

| Para cambiar… | Se edita… |
|---|---|
| teléfono, dirección, horario | `_taller/datos.py` → `NEGOCIO` |
| precios, mangueras, terminales, catálogo | `_taller/datos.py` |
| textos y secciones | `_taller/pagina.html` |
| colores, tamaños | `css/estilo.css` |
| el dibujo de la manguera | `js/dibujo.js` (prueba con 12 casos en `_taller/prueba-dibujo.html`) |

Y después, siempre:

```
py -I _taller/armar.py
```

Arma `index.html`, regenera `js/datos.js`, el catálogo, la tabla de
presiones, el mapa de terreno y la prensa, y **se niega a escribir** si
quedó un `style=""`, un script en línea o un `{{DATO}}` sin reemplazar (la
CSP bloquearía los dos primeros sin avisar).

## Qué hay en la página

1. **Portada**: la prensa de 8 dados cierra sobre el casquillo y la palabra
   «prensada» se comprime con ella (eje de ancho de la fuente Archivo).
2. **Arma tu manguera**: tipo, medida, punta A y B (9 normas, género,
   forma), largo, desfase entre codos, protección y cantidad. Dibuja la
   manguera, calcula presión (la del conjunto: la pieza más débil manda),
   rotura, radio mínimo, largo de corte, código de pieza y precio, y la
   manda por WhatsApp o al pedido.
3. **Identificador**: asiento → género → rosca medida con pie de metro →
   norma y medida, con aviso cuando la misma medida calza con otra norma.
4. **Mesón**: catálogo en pestañas; cada fila suma al pedido.
5. **Pedido**: lista guardada en el navegador del cliente, un solo
   WhatsApp con todo y el total.
6. Cómo se hace · Rubros · Radio de terreno (mapa interactivo con costo de
   visita) · Quién atiende · Dónde estamos (Google Maps) · Preguntas.

## Al publicar (GitHub Pages)

`_taller/` no debe subirse: agregar `/_taller/` al `.gitignore` (anclado
con `/`). El sitio es `index.html`, `css/`, `js/`, `assets/`, `imagenes/`.
