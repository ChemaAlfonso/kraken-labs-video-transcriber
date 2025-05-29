import { defineConfig } from 'vite'

export default defineConfig({
	resolve: {
		alias: {
			'@': __dirname + '/src'
		}
	},
	define: {
		// Fix fluent-ffmpeg lib-cov issue
		'process.env.FLUENTFFMPEG_COV': '""'
	},
	build: {
		target: 'node14',
		lib: {
			entry: 'src/main.ts',
			formats: ['cjs'],
			fileName: () => 'main.js'
		},
		rollupOptions: {
			external: [
				'electron',
				'better-sqlite3',
				'fluent-ffmpeg',
				'@ffmpeg-installer/ffmpeg',
				'axios',
				'form-data',
				'marked',
				'uuid',
				// Node.js built-in modules
				'path',
				'fs',
				'child_process',
				'util',
				'crypto',
				'stream',
				'buffer',
				'events',
				'url',
				'querystring',
				'http',
				'https',
				'net',
				'tls',
				'zlib',
				'os'
			]
		},
		emptyOutDir: false
	}
})
