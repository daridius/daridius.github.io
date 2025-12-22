# Guía Definitiva de Animaciones y GSAP (Anti-Glitch)

Este documento detalla la arquitectura implementada para lograr animaciones fluidas, sin parpadeos (FOUC) y a prueba de navegación rápida en la aplicación.

## 1. El Problema del FOUC (Flash of Unstyled Content)

Al cargar una slide, los elementos animados a veces aparecían brevemente antes de que GSAP iniciara la animación.

**Solución:**
*   **CSS**: Todos los elementos animados deben nacer ocultos.
    ```css
    .elemento-animado {
        opacity: 0;
        visibility: hidden; /* Crítico para que no intercepte clicks ni se pinte */
    }
    ```
*   **GSAP**: Usar `autoAlpha` en lugar de `opacity`. `autoAlpha` maneja automáticamente `visibility: inherit` cuando la opacidad > 0 y `visibility: hidden` cuando es 0.

## 2. El Problema de la Navegación Rápida

Si el usuario cambiaba de slide *mientras* una animación estaba ocurriendo, o volvía rápidamente a una slide anterior:
1.  **Glitches**: Animaciones de entrada y salida "peleaban" por el control de la propiedad `opacity`.
2.  **Estado Sucio**: Al volver a una slide, los elementos ya estaban visibles (del ciclo anterior), rompiendo la lógica `fromTo`.

**Solución: Ciclo de Vida Robusto (`Lifecycle Hooks`)**

Hemos implementado un sistema de 3 fases en la clase base `Slide` y `StoryController`.

### Fase A: Entrada (`onEnter`)
Iniciamos las animaciones y guardamos las referencias para poder matarlas después.

```typescript
// En tu Slide.ts
onEnter(): void {
    // IMPORTANTE: Asignar a this.timeline o this.tweens
    this.timeline = gsap.timeline();

    this.timeline.fromTo(
        this.element!.querySelectorAll(".mi-elemento"),
        { autoAlpha: 0, y: 50 },
        { autoAlpha: 1, y: 0, duration: 1 }
    );
}
```

### Fase B: Congelado Inmediato (`onExitStart`)
Esta fase se dispara en el **instante exacto** que el usuario decide irse de la slide (click en navegación).

Su función es **detener** cualquier animación interna que esté corriendo, para que no interfiera con la transición de salida global (fade-out del contenedor).

```typescript
// En Slide.ts (Clase Base)
onExitStart(): void {
    this.killAnimations(); // Mata this.timeline y todos los tweens
}
```

### Fase C: Limpieza y Reset (`onLeave`)
Esta fase ocurre **después** de que la slide ya desapareció de la pantalla completamente.

Su función es resetear el estado de los elementos a "oculto" (`autoAlpha: 0`) para que la próxima vez que esta slide se monte, esté fresca y limpia.

```typescript
// En tu Slide.ts
onLeave(): void {
    this.killAnimations(); // Por seguridad
    
    // Resetear explícitamente a estado inicial oculto
    const elements = this.element?.querySelectorAll(".mi-elemento");
    if (elements) {
        gsap.set(elements, { autoAlpha: 0 });
    }
}
```

## Resumen de Implementación en Slides

Cada nueva slide debe seguir este patrón:

1.  **CSS**: `.clase { opacity: 0; visibility: hidden; }`
2.  **TS `onEnter`**: Usar `this.timeline` o `this.tweens.push(...)`. Usar `{ autoAlpha: 0 }` en el `from`.
3.  **TS `onLeave`**: Llamar `this.killAnimations()` y hacer `gsap.set(..., { autoAlpha: 0 })` a los elementos.

Este protocolo asegura que no importa qué tan rápido clickee el usuario, las animaciones siempre se verán limpias.
