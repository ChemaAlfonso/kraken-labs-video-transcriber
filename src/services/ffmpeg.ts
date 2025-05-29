// Set FLUENTFFMPEG_COV to false to avoid the lib-cov issue
process.env.FLUENTFFMPEG_COV = ''

// Robust import of fluent-ffmpeg
let ffmpeg: any
try {
	// Try to import fluent-ffmpeg safely
	const fluentFfmpeg = require('fluent-ffmpeg')
	ffmpeg = fluentFfmpeg.default || fluentFfmpeg
	console.log('Successfully imported fluent-ffmpeg')
} catch (err) {
	console.error('Failed to import fluent-ffmpeg:', err)
	throw new Error('fluent-ffmpeg could not be imported')
}

import * as fs from 'fs'
import * as path from 'path'
import { app } from 'electron'
import { spawn } from 'child_process'
import * as ffmpegInstaller from '@ffmpeg-installer/ffmpeg'

// Global flag to track if FFmpeg has been properly initialized
let ffmpegInitialized = false

// Function to get the correct FFmpeg path depending on whether we're packaged or not
function getFFmpegPath(): string {
	const isDev = !app.isPackaged

	if (isDev) {
		// In development, use the installed path from @ffmpeg-installer
		console.log('Development mode: using FFmpeg from @ffmpeg-installer:', ffmpegInstaller.path)
		return ffmpegInstaller.path
	} else {
		// In packaged app, use extraResource location
		console.log('Packaged mode: using extraResource approach')

		// Check extraResource location first
		const resourcesPath = process.resourcesPath
		const extraResourcesPaths = [
			// macOS extraResources location (extraResource puts files directly in Resources/)
			path.join(resourcesPath, '@ffmpeg-installer', 'darwin-arm64', 'ffmpeg'),
			path.join(resourcesPath, '@ffmpeg-installer', 'linux-x64', 'ffmpeg'),
			path.join(resourcesPath, '@ffmpeg-installer', 'win32-x64', 'ffmpeg.exe')
		]

		for (const resourcePath of extraResourcesPaths) {
			if (fs.existsSync(resourcePath)) {
				console.log('Found FFmpeg in extraResources at:', resourcePath)
				return resourcePath
			}
		}

		// Fallback: try app.asar.unpacked approach
		const unpackedPath = ffmpegInstaller.path.replace('app.asar', 'app.asar.unpacked')
		if (fs.existsSync(unpackedPath)) {
			console.log('Found FFmpeg in app.asar.unpacked at:', unpackedPath)
			return unpackedPath
		}

		// Final fallback: check if the original installer path works
		if (fs.existsSync(ffmpegInstaller.path)) {
			console.log('Using original installer path:', ffmpegInstaller.path)
			return ffmpegInstaller.path
		}

		// Final fallback
		console.warn('Could not find FFmpeg binary, using installer path as fallback:', ffmpegInstaller.path)
		return ffmpegInstaller.path
	}
}

// Function to get the correct FFprobe path
function getFFprobePath(): string | null {
	const ffmpegPath = getFFmpegPath()
	const ffmpegDir = path.dirname(ffmpegPath)

	const possibleFFprobePaths = [
		path.join(ffmpegDir, 'ffprobe'),
		path.join(ffmpegDir, 'ffprobe.exe'),
		ffmpegPath.replace('ffmpeg', 'ffprobe'),
		ffmpegPath.replace('ffmpeg.exe', 'ffprobe.exe')
	]

	for (const probePath of possibleFFprobePaths) {
		if (fs.existsSync(probePath)) {
			console.log('Found FFprobe at:', probePath)
			return probePath
		}
	}

	console.log('FFprobe not found in expected locations')
	return null
}

// Function to initialize FFmpeg with proper paths
async function initializeFFmpeg(): Promise<void> {
	if (ffmpegInitialized) {
		return
	}

	console.log('Initializing FFmpeg...')

	const ffmpegPath = getFFmpegPath()
	const ffprobePath = getFFprobePath()

	// Verify the binary exists and is executable
	if (!fs.existsSync(ffmpegPath)) {
		throw new Error(`FFmpeg binary not found at: ${ffmpegPath}`)
	}

	// Check if the binary is executable
	try {
		const stats = fs.statSync(ffmpegPath)
		if (!stats.isFile()) {
			throw new Error(`FFmpeg path is not a file: ${ffmpegPath}`)
		}

		// Check if we can read the file
		fs.accessSync(ffmpegPath, fs.constants.R_OK | fs.constants.X_OK)
	} catch (err) {
		console.error('FFmpeg binary access error:', err)
		throw new Error(`FFmpeg binary is not accessible: ${ffmpegPath}`)
	}

	console.log('Setting FFmpeg path:', ffmpegPath)
	ffmpeg.setFfmpegPath(ffmpegPath)

	if (ffprobePath) {
		console.log('Setting FFprobe path:', ffprobePath)
		ffmpeg.setFfprobePath(ffprobePath)
	} else {
		console.log('FFprobe not found, letting fluent-ffmpeg auto-discover')
	}

	// Test the binary by running a simple command
	try {
		await new Promise<void>((resolve, reject) => {
			const testProcess = spawn(ffmpegPath, ['-version'], {
				stdio: ['ignore', 'pipe', 'pipe']
			})

			let hasResponded = false

			testProcess.on('close', code => {
				if (hasResponded) return
				hasResponded = true

				if (code === 0) {
					console.log('FFmpeg binary test successful')
					resolve()
				} else {
					reject(new Error(`FFmpeg binary test failed with code: ${code}`))
				}
			})

			testProcess.on('error', err => {
				if (hasResponded) return
				hasResponded = true
				reject(new Error(`FFmpeg binary test error: ${err.message}`))
			})

			// Timeout after 5 seconds
			setTimeout(() => {
				if (hasResponded) return
				hasResponded = true
				testProcess.kill()
				reject(new Error('FFmpeg binary test timed out'))
			}, 5000)
		})
	} catch (err) {
		console.error('FFmpeg initialization test failed:', err)
		throw err
	}

	ffmpegInitialized = true
	console.log('FFmpeg initialization completed successfully')
}

// Debug function to log path information
function debugFFmpegPaths() {
	console.log('=== FFmpeg Path Debug Info ===')
	console.log('app.isPackaged:', app.isPackaged)
	console.log('process.resourcesPath:', process.resourcesPath)
	console.log('@ffmpeg-installer path:', ffmpegInstaller.path)
	console.log('Resolved FFmpeg path:', getFFmpegPath())
	console.log('Resolved FFprobe path:', getFFprobePath())
	console.log('FFmpeg exists:', fs.existsSync(getFFmpegPath()))

	if (getFFprobePath()) {
		console.log('FFprobe exists:', fs.existsSync(getFFprobePath()!))
	}

	// Try to get permissions on the binary
	try {
		const stats = fs.statSync(getFFmpegPath())
		console.log('FFmpeg file stats:', {
			isFile: stats.isFile(),
			mode: stats.mode.toString(8),
			size: stats.size
		})
	} catch (err) {
		console.error('Error reading FFmpeg file stats:', err)
	}
	console.log('=== End FFmpeg Debug Info ===')
}

// Call debug function immediately
debugFFmpegPaths()

// Initialize FFmpeg when the module loads (but don't await it to avoid blocking)
initializeFFmpeg().catch(err => {
	console.error('Failed to initialize FFmpeg during module load:', err)
})

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
	try {
		// Ensure FFmpeg is initialized first
		await initializeFFmpeg()
		return true
	} catch (err) {
		console.error('FFmpeg is not properly installed or accessible:', err)
		return false
	}
}

/**
 * Get FFmpeg binary information
 */
export function getBinaryInfo(): BinaryInfo {
	const currentFFmpegPath = getFFmpegPath()
	const currentFFprobePath = getFFprobePath()

	return {
		ffmpegPath: currentFFmpegPath,
		ffprobePath: currentFFprobePath,
		exists: fs.existsSync(currentFFmpegPath),
		ffprobeExists: currentFFprobePath ? fs.existsSync(currentFFprobePath) : false,
		version: null // Will be populated by isInstalled()
	}
}

/**
 * Extract audio from a video file optimized for transcription
 */
export async function extractAudio(videoPath: string): Promise<string> {
	// Ensure FFmpeg is properly initialized before proceeding
	await initializeFFmpeg()

	const tempDir = path.join(app.getPath('userData'), 'temp')

	// Ensure temp directory exists
	if (!fs.existsSync(tempDir)) {
		fs.mkdirSync(tempDir, { recursive: true })
	}

	const outputPath = path.join(tempDir, `${path.basename(videoPath, path.extname(videoPath))}.mp3`)
	const maxSizeBytes = 24 * 1024 * 1024 // 24MB to stay under OpenAI's 25MB limit

	return new Promise((resolve, reject) => {
		console.log(`Starting audio extraction from: ${videoPath}`)
		console.log(`Using FFmpeg binary: ${getFFmpegPath()}`)

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
			.on('start', (commandLine: string) => {
				console.log('FFmpeg command:', commandLine)
			})
			.on('progress', (progress: any) => {
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
	// Ensure FFmpeg is properly initialized before proceeding
	await initializeFFmpeg()

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
			.on('start', (commandLine: string) => {
				console.log('FFmpeg audio processing command:', commandLine)
			})
			.on('progress', (progress: any) => {
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
	// Ensure FFmpeg is properly initialized before proceeding
	await initializeFFmpeg()

	return new Promise((resolve, reject) => {
		console.log(`Getting duration for video: ${videoPath}`)

		ffmpeg.ffprobe(videoPath, (err: any, metadata: any) => {
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
	// Ensure FFmpeg is properly initialized before proceeding
	await initializeFFmpeg()

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
			.on('start', (commandLine: string) => {
				console.log('FFmpeg download command:', commandLine)
			})
			.on('progress', (progress: any) => {
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
