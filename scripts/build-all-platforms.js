#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

console.log('🚀 Building Kraken Labs Video Transcriber for all platforms...\n')

const platforms = [
	{ platform: 'darwin', arch: 'arm64', name: 'macOS (Apple Silicon)' },
	{ platform: 'darwin', arch: 'x64', name: 'macOS (Intel)' },
	{ platform: 'win32', arch: 'x64', name: 'Windows 64-bit' },
	{ platform: 'linux', arch: 'x64', name: 'Linux 64-bit' }
]

const buildPlatform = (platform, arch, name) => {
	try {
		console.log(`📦 Building for ${name}...`)
		execSync(`npm run package -- --platform=${platform} --arch=${arch}`, {
			stdio: 'inherit',
			cwd: process.cwd()
		})
		console.log(`✅ ${name} build completed!\n`)
	} catch (error) {
		console.error(`❌ ${name} build failed:`, error.message)
		console.log('')
	}
}

// Build for all platforms
platforms.forEach(({ platform, arch, name }) => {
	buildPlatform(platform, arch, name)
})

// Display results
console.log('📋 Build Summary:')
console.log('================')

const outDir = path.join(process.cwd(), 'out')
if (fs.existsSync(outDir)) {
	const builds = fs
		.readdirSync(outDir)
		.filter(dir => fs.statSync(path.join(outDir, dir)).isDirectory())
		.filter(dir => dir.startsWith('Kraken Labs Video Transcriber-'))

	if (builds.length > 0) {
		console.log('✅ Successfully built for:')
		builds.forEach(build => {
			const stats = fs.statSync(path.join(outDir, build))
			console.log(`   • ${build} (${stats.mtime.toLocaleDateString()})`)
		})
	} else {
		console.log('❌ No builds found')
	}
} else {
	console.log('❌ Output directory not found')
}

console.log('\n🎉 Multi-platform build process completed!')
