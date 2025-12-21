# Guía de Solución de Parpadeos (FOUC) con GSAP y Astro

Este documento detalla la solución implementada para prevenir el "Flash Of Unstyled Content" (o elementos que aparecen brevemente antes de animarse) en nuestras slides animadas.

## El Problema
Al cargar la página o cambiar de slide, los elementos que debían animarse (aparecer con `fade-in`) a veces eran visibles por una fracción de segundo antes de que GSAP tomara el control y seteara su opacidad inicial a 0.

## La Solución

La solución consiste en una combinación de **CSS** y **GSAP `autoAlpha`**.

### 1. CSS: Ocultar Inicialmente
Siempre debemos ocultar los elementos animables desde el CSS usando tanto `opacity` como `visibility`.

```css
.elemento-animable {
    /* ... otros estilos ... */
    
    /* CRÍTICO PARA EVITAR FLASH */
    opacity: 0;
    visibility: hidden;
}
```

**Por qué `visibility: hidden`?**
A veces el navegador renderiza el elemento con `opacity: 0` pero si hay algún retraso en la carga del JS o renderizado, puede haber glitches. `visibility: hidden` asegura que el elemento no sea pintado en absoluto.

### 2. GSAP: Usar `autoAlpha`
En lugar de animar solo la propiedad `opacity`, usamos `autoAlpha`.

**Incorrecto (puede causar flash):**
```javascript
gsap.fromTo(".elemento", 
    { opacity: 0 }, 
    { opacity: 1 }
);
```

**Correcto (Solución sólida):**
```javascript
gsap.fromTo(".elemento", 
    { autoAlpha: 0 }, 
    { autoAlpha: 1 }
);
```

**¿Qué hace `autoAlpha`?**
Es una propiedad especial de GSAP que combina `opacity` y `visibility`.
- Cuando `autoAlpha` es 0: Setea `opacity: 0` y `visibility: hidden`.
- Cuando `autoAlpha` es > 0: Setea `visibility: inherit` y la `opacity` correspondiente.
- Al terminar la animación (si llega a 0): Vuelve a poner `visibility: hidden`.

### 3. Scoping (Buenas Prácticas)
Para evitar conflictos entre slides (ej. si dos slides tienen una clase `.title`), siempre busca los elementos dentro del slide actual:

```javascript
const slide = document.querySelector(".mi-slide");

slide.addEventListener("slide-enter", () => {
    // Buscar SOLO dentro de este slide
    const titulo = slide.querySelector(".title");
    
    gsap.fromTo(titulo, 
        { autoAlpha: 0, y: -20 },
        { autoAlpha: 1, y: 0 }
    );
});
```

---
**Resumen:**
1. CSS: `opacity: 0; visibility: hidden;`
73. 2. JS: `gsap.fromTo(..., { autoAlpha: 0 }, { autoAlpha: 1 })`

## Archivos de Ejemplo
Puedes ver esta corrección aplicada en:
- `src/components/MostFrequentMessageSlide.astro` (Corrección del Header)
- `src/components/TopWordsSlide.astro` (Corrección de Pills y Título)
- `src/components/EmojiSlide.astro` (Corrección de Emojis y Título)
- `src/components/OutroSlide.astro` (Corrección Final)
