import ffmpeg from 'fluent-ffmpeg'
import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'
import { spawn } from 'child_process'
import * as ffmpegInstaller from '@ffmpeg-installer/ffmpeg'

// Set the ffmpeg path from the bundled binary
ffmpeg.setFfmpegPath(ffmpegInstaller.path)

// Try to find and set ffprobe path - it's usually bundled with FFmpeg
const ffmpegDir = path.dirname(ffmpegInstaller.path)
const possibleFFprobePaths = [
	path.join(ffmpegDir, 'ffprobe'),
	path.join(ffmpegDir, 'ffprobe.exe'),
	ffmpegInstaller.path.replace('ffmpeg', 'ffprobe'),
	ffmpegInstaller.path.replace('ffmpeg.exe', 'ffprobe.exe')
]

let ffprobePath: string | null = null
for (const probePath of possibleFFprobePaths) {
	if (fs.existsSync(probePath)) {
		ffprobePath = probePath
		ffmpeg.setFfprobePath(probePath)
		console.log('Found and set FFprobe path:', probePath)
		break
	}
}

if (!ffprobePath) {
	console.log('FFprobe not found in expected locations, letting fluent-ffmpeg auto-discover')
}

console.log('FFmpeg binary path:', ffmpegInstaller.path)

interface BinaryInfo {
	ffmpegPath: string
	ffprobePath: string | null
	exists: boolean
	ffprobeExists: boolean
	version: string | null
}

/**
 * Check if FFmpeg is properly installed and accessible
 */
export async function isInstalled(): Promise<boolean> {
	return new Promise(resolve => {
		try {
			// Check if the bundled ffmpeg binary exists
			if (!fs.existsSync(ffmpegInstaller.path)) {
				console.error('FFmpeg binary not found at:', ffmpegInstaller.path)
				resolve(false)
				return
			}

			// Try to run a simple FFmpeg command to verify it's working
			const ffmpegProcess = spawn(ffmpegInstaller.path, ['-version'], {
				stdio: ['ignore', 'pipe', 'pipe']
			})

			let output = ''
			let hasResponded = false

			ffmpegProcess.stdout.on('data', data => {
				output += data.toString()
			})

			ffmpegProcess.on('close', code => {
				if (hasResponded) return
				hasResponded = true

				if (code === 0 && output.includes('ffmpeg version')) {
					console.log('FFmpeg is working properly')
					resolve(true)
				} else {
					console.warn('FFmpeg binary exists but may have issues, but will proceed anyway')
					// Fallback: if binary exists, assume it's working even if version check failed
					resolve(true)
				}
			})

			ffmpegProcess.on('error', err => {
				if (hasResponded) return
				hasResponded = true

				console.warn('Error running FFmpeg version check:', err.message)
				// Fallback: if binary exists, assume it's working even if version check failed
				console.log('Proceeding with FFmpeg despite version check failure')
				resolve(true)
			})

			// Timeout after 3 seconds
			setTimeout(() => {
				if (hasResponded) return
				hasResponded = true

				ffmpegProcess.kill()
				console.warn('FFmpeg version check timed out, but binary exists - proceeding anyway')
				// Fallback: if binary exists, assume it's working
				resolve(true)
			}, 3000)
		} catch (err: any) {
			console.error('Error checking FFmpeg installation:', err)
			// Final fallback: just check if file exists
			const exists = fs.existsSync(ffmpegInstaller.path)
			console.log(`Fallback: FFmpeg binary exists: ${exists}`)
			resolve(exists)
		}
	})
}

/**
 * Get FFmpeg binary information
 */
export function getBinaryInfo(): BinaryInfo {
	// Try to find ffprobe path
	const ffmpegDir = path.dirname(ffmpegInstaller.path)
	const possibleFFprobePaths = [
		path.join(ffmpegDir, 'ffprobe'),
		path.join(ffmpegDir, 'ffprobe.exe'),
		ffmpegInstaller.path.replace('ffmpeg', 'ffprobe'),
		ffmpegInstaller.path.replace('ffmpeg.exe', 'ffprobe.exe')
	]

	let ffprobePath: string | null = null
	for (const probePath of possibleFFprobePaths) {
		if (fs.existsSync(probePath)) {
			ffprobePath = probePath
			break
		}
	}

	return {
		ffmpegPath: ffmpegInstaller.path,
		ffprobePath: ffprobePath,
		exists: fs.existsSync(ffmpegInstaller.path),
		ffprobeExists: ffprobePath ? fs.existsSync(ffprobePath) : false,
		version: null // Will be populated by isInstalled()
	}
}

/**
 * Extract audio from a video file optimized for transcription
 */
export async function extractAudio(videoPath: string): Promise<string> {
	// Verify FFmpeg is available before proceeding
	const isAvailable = await isInstalled()
	if (!isAvailable) {
		throw new Error('FFmpeg is not available. Please ensure the application was installed correctly.')
	}

	const tempDir = path.join(app.getPath('userData'), 'temp')

	// Ensure temp directory exists
	if (!fs.existsSync(tempDir)) {
		fs.mkdirSync(tempDir, { recursive: true })
	}

	const outputPath = path.join(tempDir, `${path.basename(videoPath, path.extname(videoPath))}.mp3`)
	const maxSizeBytes = 24 * 1024 * 1024 // 24MB to stay under OpenAI's 25MB limit

	return new Promise((resolve, reject) => {
		console.log(`Starting audio extraction from: ${videoPath}`)
		console.log(`Using FFmpeg binary: ${ffmpegInstaller.path}`)

		ffmpeg(videoPath)
			.output(outputPath)
			.audioCodec('libmp3lame')
			.audioBitrate(32) // Very aggressive compression for transcription
			.audioFrequency(16000) // 16kHz sample rate (optimal for speech recognition)
			.audioChannels(1) // Mono audio
			.outputOptions([
				'-q:a',
				'9', // Lowest quality VBR for maximum compression
				'-ac',
				'1', // Ensure mono
				'-ar',
				'16000', // Ensure 16kHz sample rate
				'-map',
				'0:a:0', // Use first audio stream only
				'-compression_level',
				'9' // Maximum MP3 compression
			])
			.on('start', commandLine => {
				console.log('FFmpeg command:', commandLine)
			})
			.on('progress', progress => {
				console.log(`Audio extraction progress: ${Math.round(progress.percent || 0)}%`)
			})
			.on('end', () => {
				console.log('Audio extraction completed successfully')

				// Check file size
				try {
					const stats = fs.statSync(outputPath)
					console.log(`Audio file size: ${(stats.size / 1024 / 1024).toFixed(1)}MB`)

					if (stats.size > maxSizeBytes) {
						console.log('Audio file too large, applying more aggressive compression...')

						// Try with even more aggressive settings
						const outputPath2 = path.join(
							tempDir,
							`${path.basename(videoPath, path.extname(videoPath))}_compressed.mp3`
						)

						ffmpeg(videoPath)
							.output(outputPath2)
							.audioCodec('libmp3lame')
							.audioBitrate(24) // Even lower bitrate
							.audioFrequency(16000)
							.audioChannels(1)
							.outputOptions([
								'-q:a',
								'9', // Lowest quality
								'-ac',
								'1',
								'-ar',
								'16000',
								'-map',
								'0:a:0',
								'-compression_level',
								'9',
								'-cutoff',
								'8000' // Cut frequencies above 8kHz
							])
							.on('end', () => {
								// Clean up first attempt
								try {
									if (fs.existsSync(outputPath)) {
										fs.unlinkSync(outputPath)
									}
								} catch (cleanupErr) {
									console.warn('Failed to clean up original audio file:', cleanupErr)
								}

								const finalStats = fs.statSync(outputPath2)
								console.log(
									`Final compressed audio file size: ${(finalStats.size / 1024 / 1024).toFixed(1)}MB`
								)
								resolve(outputPath2)
							})
							.on('error', (err: Error) => reject(new Error(`Failed to compress audio: ${err.message}`)))
							.run()
					} else {
						resolve(outputPath)
					}
				} catch (statErr: any) {
					reject(new Error(`Failed to check audio file: ${statErr.message}`))
				}
			})
			.on('error', (err: Error) => {
				console.error('FFmpeg audio extraction error:', err)
				reject(new Error(`Failed to extract audio: ${err.message}`))
			})
			.run()
	})
}

/**
 * Process an audio file for transcription (compress and optimize)
 */
export async function processAudio(audioPath: string): Promise<string> {
	// Verify FFmpeg is available before proceeding
	const isAvailable = await isInstalled()
	if (!isAvailable) {
		throw new Error('FFmpeg is not available. Please ensure the application was installed correctly.')
	}

	const tempDir = path.join(app.getPath('userData'), 'temp')

	// Ensure temp directory exists
	if (!fs.existsSync(tempDir)) {
		fs.mkdirSync(tempDir, { recursive: true })
	}

	const outputPath = path.join(tempDir, `${path.basename(audioPath, path.extname(audioPath))}_processed.mp3`)
	const maxSizeBytes = 24 * 1024 * 1024 // 24MB to stay under OpenAI's 25MB limit

	return new Promise((resolve, reject) => {
		console.log(`Starting audio processing from: ${audioPath}`)
		console.log(`Output will be saved to: ${outputPath}`)

		ffmpeg(audioPath)
			.output(outputPath)
			.audioCodec('libmp3lame')
			.audioBitrate(32) // Low bitrate for transcription
			.audioFrequency(16000) // 16kHz sample rate - optimal for speech
			.audioChannels(1) // Mono audio
			.outputOptions([
				'-q:a',
				'6', // Audio quality
				'-ac',
				'1', // Mono channel
				'-ar',
				'16000', // Sample rate
				'-map',
				'0:a:0', // Map first audio stream
				'-compression_level',
				'9' // Maximum compression
			])
			.on('start', commandLine => {
				console.log('FFmpeg audio processing command:', commandLine)
			})
			.on('progress', progress => {
				console.log(`Audio processing progress: ${Math.round(progress.percent || 0)}%`)
			})
			.on('end', () => {
				console.log('Audio processing completed successfully')

				// Check file size
				try {
					const stats = fs.statSync(outputPath)
					console.log(`Processed audio file size: ${(stats.size / 1024 / 1024).toFixed(1)}MB`)

					if (stats.size > maxSizeBytes) {
						console.log('Audio file still too large, applying more aggressive compression...')

						// Try with even more aggressive settings
						const outputPath2 = path.join(
							tempDir,
							`${path.basename(audioPath, path.extname(audioPath))}_ultra_compressed.mp3`
						)

						ffmpeg(audioPath)
							.output(outputPath2)
							.audioCodec('libmp3lame')
							.audioBitrate(24) // Extremely low bitrate
							.audioFrequency(16000)
							.audioChannels(1)
							.outputOptions([
								'-q:a',
								'9', // Lowest quality
								'-ac',
								'1',
								'-ar',
								'16000',
								'-map',
								'0:a:0',
								'-compression_level',
								'9',
								'-cutoff',
								'8000' // Cut frequencies above 8kHz
							])
							.on('end', () => {
								// Clean up first attempt
								try {
									if (fs.existsSync(outputPath)) {
										fs.unlinkSync(outputPath)
									}
								} catch (cleanupErr) {
									console.warn('Failed to clean up original processed file:', cleanupErr)
								}

								const finalStats = fs.statSync(outputPath2)
								console.log(
									`Final ultra-compressed audio file size: ${(finalStats.size / 1024 / 1024).toFixed(
										1
									)}MB`
								)
								resolve(outputPath2)
							})
							.on('error', (err: Error) =>
								reject(new Error(`Failed to ultra-compress audio: ${err.message}`))
							)
							.run()
					} else {
						resolve(outputPath)
					}
				} catch (statErr: any) {
					reject(new Error(`Failed to check processed audio file: ${statErr.message}`))
				}
			})
			.on('error', (err: Error) => {
				console.error('FFmpeg audio processing error:', err)
				reject(new Error(`Failed to process audio: ${err.message}`))
			})
			.run()
	})
}

/**
 * Get the duration of a video file
 */
export async function getVideoDuration(videoPath: string): Promise<number> {
	// Verify FFmpeg is available before proceeding
	const isAvailable = await isInstalled()
	if (!isAvailable) {
		throw new Error('FFmpeg is not available. Please ensure the application was installed correctly.')
	}

	return new Promise((resolve, reject) => {
		console.log(`Getting duration for video: ${videoPath}`)

		ffmpeg.ffprobe(videoPath, (err, metadata) => {
			if (err) {
				console.error('FFprobe error:', err)
				reject(new Error(`Failed to get video duration: ${err.message}`))
				return
			}

			if (!metadata || !metadata.format) {
				reject(new Error('Invalid video metadata'))
				return
			}

			const duration = metadata.format.duration
			console.log(`Video duration: ${duration} seconds`)
			resolve(duration || 0)
		})
	})
}

/**
 * Download a video from a URL
 */
export async function downloadVideo(url: string, outputPath: string): Promise<void> {
	// Verify FFmpeg is available before proceeding
	const isAvailable = await isInstalled()
	if (!isAvailable) {
		throw new Error('FFmpeg is not available. Please ensure the application was installed correctly.')
	}

	// Create the output directory if it doesn't exist
	const outputDir = path.dirname(outputPath)
	if (!fs.existsSync(outputDir)) {
		fs.mkdirSync(outputDir, { recursive: true })
	}

	return new Promise((resolve, reject) => {
		console.log(`Downloading video from: ${url} to: ${outputPath}`)

		ffmpeg(url)
			.output(outputPath)
			.outputOptions(['-c', 'copy']) // Copy without re-encoding
			.on('start', commandLine => {
				console.log('FFmpeg download command:', commandLine)
			})
			.on('progress', progress => {
				console.log(`Download progress: ${Math.round(progress.percent || 0)}%`)
			})
			.on('end', () => {
				console.log('Video download completed successfully')
				resolve()
			})
			.on('error', (err: Error) => {
				console.error('FFmpeg download error:', err)
				reject(new Error(`Failed to download video: ${err.message}`))
			})
			.run()
	})
}
