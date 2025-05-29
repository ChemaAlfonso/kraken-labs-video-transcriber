import * as path from 'path'
import * as fs from 'fs'
import { app } from 'electron'

/**
 * Ensure a directory exists
 */
export function ensureDirectoryExists(dirPath: string): void {
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true })
	}
}

/**
 * Get application data directory
 */
export function getAppDataDir(subDir: string = ''): string {
	const appDataDir = path.join(app.getPath('userData'), subDir)
	ensureDirectoryExists(appDataDir)
	return appDataDir
}

/**
 * Get temporary directory
 */
export function getTempDir(): string {
	const tempDir = path.join(app.getPath('userData'), 'temp')
	ensureDirectoryExists(tempDir)
	return tempDir
}

/**
 * Format duration in seconds to human-readable string
 */
export function formatDuration(seconds: number): string {
	const hours = Math.floor(seconds / 3600)
	const minutes = Math.floor((seconds % 3600) / 60)
	const secs = Math.floor(seconds % 60)

	if (hours > 0) {
		return `${hours}h ${minutes}m ${secs}s`
	} else {
		return `${minutes}m ${secs}s`
	}
}

/**
 * Check if a file is an audio file based on its extension
 */
export function isAudioFile(filePath: string): boolean {
	const audioExtensions = ['.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg', '.wma', '.opus', '.amr']
	const extension = path.extname(filePath).toLowerCase()
	return audioExtensions.includes(extension)
}

/**
 * Check if a file is a video file based on its extension
 */
export function isVideoFile(filePath: string): boolean {
	const videoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.wmv', '.3gp', '.flv']
	const extension = path.extname(filePath).toLowerCase()
	return videoExtensions.includes(extension)
}

/**
 * Get the file type (audio or video) based on extension
 */
export function getFileType(filePath: string): 'audio' | 'video' | 'unknown' {
	if (isAudioFile(filePath)) return 'audio'
	if (isVideoFile(filePath)) return 'video'
	return 'unknown'
}
