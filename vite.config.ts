import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [vue()],
	resolve: {
		alias: {
			'@': path.resolve(__dirname, './src')
		}
	},
	base: './',
	build: {
		outDir: 'dist',
		emptyOutDir: true
	},
	// Vite options tailored for Electron development
	clearScreen: false,
	server: {
		port: 1420,
		strictPort: true,
		watch: {
			ignored: ['**/electron/**', '**/node_modules/**']
		}
	}
})
