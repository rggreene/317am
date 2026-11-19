import {defineConfig} from 'vite';

// Project Pages are served under /317am/, not the domain root.
// Relative Vite-managed asset URLs keep GLBs, CSS and chunks on that path.
export default defineConfig({
  base:process.env.GITHUB_PAGES==='true'?'/317am/':'/',
  build:{outDir:'dist'}
});
