const { VitePlugin } = require('@electron-forge/plugin-vite')
const fs = require('fs')
const path = require('path')

module.exports = {
	packagerConfig: {
		asar: true,
		name: 'Kraken Labs Video Transcriber',
		icon: './src/assets/icons/kkvideo',
		appBundleId: 'com.krakenlabs.videotranscriber',
		appCategoryType: 'public.app-category.productivity',
		ignore: [],
		// Use extraResource for FFmpeg binaries (this was working)
		extraResource: ['node_modules/@ffmpeg-installer/'],
		...(process.platform === 'darwin' && {
			icon: './src/assets/icons/kkvideo.icns'
		}),
		...(process.platform === 'win32' && {
			icon: './src/assets/icons/kkvideo.ico'
		}),
		...(process.platform === 'linux' && {
			icon: './src/assets/icons/kkvideo.png'
		})
	},
	rebuildConfig: {},
	makers: [
		// Cross-platform ZIP files (works from any OS)
		{
			name: '@electron-forge/maker-zip',
			platforms: ['darwin', 'linux', 'win32']
		},
		// Platform-specific installers (only work on respective platforms)
		...(process.platform === 'win32'
			? [
					{
						name: '@electron-forge/maker-squirrel',
						config: {
							name: 'kraken-labs-video-transcriber',
							iconUrl:
								'https://raw.githubusercontent.com/chemaalfonso/kraken-labs-video-transcriber/main/src/assets/icons/kkvideo.ico',
							setupIcon: './src/assets/icons/kkvideo.ico'
						}
					}
			  ]
			: []),
		...(process.platform === 'linux'
			? [
					{
						name: '@electron-forge/maker-deb',
						config: {
							options: {
								name: 'kraken-labs-video-transcriber',
								productName: 'Kraken Labs Video Transcriber',
								genericName: 'Video Transcriber',
								description: 'AI-powered video transcription and content indexing tool',
								categories: ['AudioVideo', 'Office'],
								icon: './src/assets/icons/kkvideo.png'
							}
						}
					},
					{
						name: '@electron-forge/maker-rpm',
						config: {
							options: {
								name: 'kraken-labs-video-transcriber',
								productName: 'Kraken Labs Video Transcriber',
								genericName: 'Video Transcriber',
								description: 'AI-powered video transcription and content indexing tool',
								categories: ['AudioVideo', 'Office'],
								icon: './src/assets/icons/kkvideo.png'
							}
						}
					}
			  ]
			: [])
	],
	plugins: [
		{
			name: '@electron-forge/plugin-auto-unpack-natives',
			config: {}
		},
		new VitePlugin({
			// `build` can specify multiple entry points for different files
			build: [
				{
					// `entry` is the path to the entry file
					entry: 'src/main.ts',
					config: 'vite.main.config.ts'
				},
				{
					entry: 'src/preload.ts',
					config: 'vite.preload.config.ts'
				}
			],
			renderer: [
				{
					name: 'main_window',
					config: 'vite.config.ts'
				}
			]
		})
	]
}
