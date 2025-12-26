import { defineConfig } from 'vite';

export default defineConfig({
    base: './', // Crucial para que las rutas sean relativas y funcionen en GitHub Pages
    build: {
        rollupOptions: {
            input: {
                main: 'index.html',
                upload: 'upload.html',
                wrapped: 'wrapped/index.html',
            },
        },
    },
});
