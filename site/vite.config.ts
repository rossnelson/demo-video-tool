import adapter from '@sveltejs/adapter-static';
import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';

// The tests build into another folder (SITE_OUT), under the base path.
const out = process.env.SITE_OUT ?? 'build';

export default defineConfig({
	// The reference pages read ../bin/demo, ../lib/project.mjs and ../lib/themes.
	server: { fs: { allow: ['..'] } },
	plugins: [
		sveltekit({
			compilerOptions: {
				runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
			},
			// GitHub Pages serves the site at /demo-video-tool/.
			paths: { base: '/demo-video-tool' },
			adapter: adapter({ pages: out, assets: out, strict: true })
		})
	]
});
