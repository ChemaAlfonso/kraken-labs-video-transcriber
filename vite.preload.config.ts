import { defineConfig } from 'vite'

export default defineConfig({
	build: {
		target: 'node14',
		lib: {
			entry: 'src/preload.ts',
			formats: ['cjs'],
			fileName: () => 'preload.js'
		},
		rollupOptions: {
			external: ['electron']
		},
		emptyOutDir: false
	}
})
