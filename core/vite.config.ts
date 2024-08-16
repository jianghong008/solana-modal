import { defineConfig, UserConfig } from 'vite'
import solid from 'vite-plugin-solid'
import { resolve } from 'path';
import cssInjectedByJsPlugin from 'vite-plugin-css-injected-by-js'
export default defineConfig(({ mode }) => {
  const config: UserConfig = {
    plugins: [
      solid(),
      cssInjectedByJsPlugin()
    ],
    build: {
      lib: {
        entry: resolve(__dirname, 'src/solana-modal.tsx'),
        name: 'SolanaModal',
        formats: ['cjs', 'es', 'umd'],
      },
    },
    css: {
      postcss: './postcss.config.js'
    },
    optimizeDeps: {
      force: true,
    },
  }
  if (mode == 'demo') {
    delete config.build?.lib
    config.base = '/solana-modal/'
  }
  return config
})
