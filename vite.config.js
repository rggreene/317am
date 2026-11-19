import {defineConfig} from 'vite';
import {resolve} from 'node:path';

export default defineConfig({
  base:process.env.GITHUB_PAGES==='true'?'/317am/':'/',
  build:{outDir:'dist',rollupOptions:{input:{menu:resolve('index.html'),classic:resolve('nightfall-classic.html'),visual:resolve('visual-lab.html')}}}
});
