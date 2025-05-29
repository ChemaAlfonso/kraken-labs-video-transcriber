const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg')
const fs = require('fs')
const { execSync } = require('child_process')

console.log('🔍 Testing FFmpeg Installation...\n')

console.log('📍 FFmpeg path:', ffmpegInstaller.path)
console.log('📁 File exists:', fs.existsSync(ffmpegInstaller.path))

if (fs.existsSync(ffmpegInstaller.path)) {
	try {
		console.log('🔍 Testing FFmpeg version...')
		const version = execSync(`"${ffmpegInstaller.path}" -version`, { encoding: 'utf8', timeout: 5000 })
		console.log('✅ FFmpeg is working!')
		console.log('\n📋 Version info:')
		console.log(version.split('\n')[0]) // First line contains version info

		// FFprobe is usually bundled with FFmpeg, test if it's available
		console.log('\n🔍 Testing FFprobe (should be bundled with FFmpeg)...')
		const ffprobePath = ffmpegInstaller.path.replace('ffmpeg', 'ffprobe')
		console.log('📍 Expected FFprobe path:', ffprobePath)

		if (fs.existsSync(ffprobePath)) {
			try {
				const probeVersion = execSync(`"${ffprobePath}" -version`, { encoding: 'utf8', timeout: 5000 })
				console.log('✅ FFprobe is working!')
				console.log('📋 FFprobe version:', probeVersion.split('\n')[0])
			} catch (error) {
				console.log('⚠️ FFprobe found but failed to run:', error.message)
			}
		} else {
			console.log('⚠️ FFprobe not found at expected location (this is usually okay)')
		}
	} catch (error) {
		console.error('❌ Error running FFmpeg:', error.message)
	}
} else {
	console.error('❌ FFmpeg binary not found!')
}

console.log('\n🎯 Test completed!')
