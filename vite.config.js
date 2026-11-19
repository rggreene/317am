import {defineConfig} from 'vite';
import {resolve} from 'node:path';

// Ship both the upgraded vertical slice and the original full-gameplay v0.4.
export default defineConfig({
  base:process.env.GITHUB_PAGES==='true'?'/317am/':'/',
  build:{
    outDir:'dist',
    rollupOptions:{input:{main:resolve('index.html'),classic:resolve('nightfall-classic.html')}}
  }
});
