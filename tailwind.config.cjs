/** @type {import('tailwindcss').Config} */
module.exports = {
	content: ['./index.html', './src/**/*.{vue,js,ts,jsx,tsx}'],
	theme: {
		extend: {
			colors: {
				blue: {
					500: '#3b82f6',
					600: '#2563eb',
					700: '#1d4ed8'
				},
				red: {
					500: '#ef4444',
					600: '#dc2626',
					700: '#b91c1c'
				},
				green: {
					500: '#22c55e',
					600: '#16a34a',
					700: '#15803d'
				},
				purple: {
					600: '#9333ea',
					700: '#7e22ce'
				},
				gray: {
					100: '#f3f4f6',
					200: '#e5e7eb',
					300: '#d1d5db',
					400: '#9ca3af',
					500: '#6b7280',
					600: '#4b5563',
					700: '#374151',
					800: '#1f2937',
					900: '#111827'
				},
				yellow: {
					500: '#eab308',
					600: '#ca8a04'
				},
				indigo: {
					600: '#4f46e5',
					700: '#4338ca'
				}
			},
			spacing: {
				1: '0.25rem',
				2: '0.5rem',
				4: '1rem',
				6: '1.5rem',
				8: '2rem'
			}
		}
	},
	plugins: [require('@tailwindcss/typography'), require('daisyui')],
	daisyui: {
		themes: ['light'],
		darkTheme: 'light'
	},
	future: {
		enableCustomPlugins: true
	}
}
