import { defineConfig } from 'vite';
import solid from 'vite-plugin-solid';
import { resolve } from 'path';
export default defineConfig({
    plugins: [solid()],
    build: {
        lib: {
            entry: resolve(__dirname, 'src/solana-modal.tsx'),
            name: 'solana-modal',
            formats: ['cjs', 'es', 'umd'],
        },
        outDir: '../packages/solana-modal',
    },
    optimizeDeps: {
        force: true,
    },
});
