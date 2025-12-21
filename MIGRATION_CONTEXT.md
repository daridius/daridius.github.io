# Contexto de Migración: WhatsApp Wrapped (Astro -> Vite Vanilla)

## 📌 Objetivo del Proyecto
Crear una aplicación web "WhatsApp Wrapped" que permita a los usuarios subir su historial de chat de WhatsApp (txt o zip) y generar una presentación tipo "Spotify Wrapped" con estadísticas animadas.
**Punto Clave**: Todo el procesamiento es **100% Client-Side** (privacidad total) y compartible mediante URLs con hash comprimido.

## 🚧 Estado Actual (Astro)
El proyecto actual en Astro tiene toda la lógica de negocio y estilos listos, pero la arquitectura de Astro (parcialmente server-side/static) ha causado problemas graves de hidratación de scripts y eventos en el despliegue a GitHub Pages, haciendo que la funcionalidad de upload falle silenciosamente en producción.

**Decisión**: Migrar a un stack más simple y directo para una SPA pura: **Vite + Vanilla TypeScript**.

## 🛠️ Stack Destino
- **Build Tool**: Vite (`pnpm create vite`)
- **Framework**: Vanilla (Sin React/Vue/Svelte) - HTML/CSS/TS puro.
- **Lenguaje**: TypeScript.
- **Hosting**: GitHub Pages.

## 📂 Activos Reutilizables (Desde `WrapsApp/`)
El próximo agente debe tomar estos archivos como base de verdad:

1.  **Lógica de Negocio (Core)**:
    - `src/utils/chatParser.ts`: Parseo de regex de WhatsApp (Maneja formatos Android/iOS, fechas, ignorar mensajes de sistema). **Nota**: Ya está optimizado para limitar Top Senders a 3.
    - `src/utils/compression.ts`: Lógica crítica de compresión LZString + Schema Encoding para la URL.
    - `src/utils/dynamicInjector.ts`: (Referencia) Lógica para inyectar datos en el DOM.

2.  **Estilos y UI**:
    - `src/pages/index.astro`: Contiene el HTML/CSS de la página de Upload (Drag & Drop, Dark Mode, Glassmorphism).
    - `src/components/*.astro`: Cada slide tiene su estructura HTML y CSS (GSAP animations). Habrá que convertir estos `.astro` a fragmentos de HTML o templates dentro del nuevo proyecto.

3.  **Dependencias Clave**:
    - `jszip`: Para descomprimir chats.
    - `lz-string`: Para la URL mágica.
    - `gsap`: Para las animaciones de los slides.

## 📋 Plan de Migración (Instrucciones para Agente)

### 1. Inicialización
- Crear proyecto: `pnpm create vite wraps-vite --template vanilla-ts`.
- Instalar dependencias: `pnpm add jszip lz-string gsap`.
- Instalar tipos: `pnpm add -D @types/node` (si hace falta).

### 2. Estructura Sugerida
- `index.html`: Página principal (Upload + Contenedor vacío para Slides).
- `src/style.css`: Estilos globales (copiar de Astro).
- `src/main.ts`: Punto de entrada. Maneja el estado (Upload vs Viewer).
- `src/parser/*.ts`: Mover `chatParser` y `compression`.
- `src/views/`:
    - `uploadView.ts`: Lógica de Drag & Drop (basada en el script de `index.astro`). Encargada de **generar el hash** comprimido.
    - `slidesView.ts`: Lógica para generar/inyectar el HTML de los slides y ejecutar la secuencia de visualización. Encargada de **leer el hash y animar**.
    - **Nota**: El plan es separar claramente: Página 1 (Upload/Generación) y Página 2 (Visualización). Aunque sea SPA, conceptualmente son dos etapas.
    - **Tecnología**: Usaremos **GSAP** para todas las animaciones, tal cual se hacía en Astro. Asegúrate de instalarlos.

### 3. Rutas y Estado
- La app debe detectar si hay un `#HASH` en la URL.
    - **Si hay Hash**: Decodificar -> Ocultar Upload -> Mostrar Slides -> Iniciar Secuencia.
    - **Si no hay Hash**: Mostrar Upload.
- No necesitamos router complejo. Un simple `if (window.location.hash)` en `main.ts` basta.

### 4. Animaciones
- Usar GSAP tal como está en los componentes Astro, pero inicializarlo en el ciclo de vida de `slidesView.ts` cuando el DOM esté listo.
- Atención al "FOUC" (Flash of Unstyled Content): Asegurar `opacity: 0` inicial como se documentó en `ANIMATION_AND_GSAP_GUIDE.md` (Referencia antigua).

### 5. Despliegue
- Configurar `vite.config.ts` con `base: '/daridius.github.io/'` (o `/` si es repo de usuario).
- Script de deploy simple (build + push a gh-pages).

## ⚠️ Puntos de Dolor Conocidos (A Evitar)
- **Imports en HTML**: No usar `<script type="module">` manuales en el HTML si Vite ya lo inyecta. Dejar que Vite maneje el entry point.
- **Event Listeners**: Asegurar que los listeners de Drag & Drop se asignan una vez que el elemento existe, o usar delegación global en `document`.

¡Buena suerte! El código "difícil" (parseo y matemáticas) ya está hecho y probado. Solo es un trasplante de cerebro de Astro a Vite.
