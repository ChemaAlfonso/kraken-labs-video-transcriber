const path = require('path')
const fs = require('fs')
const { app } = require('electron')
const { v4: uuidv4 } = require('uuid')
const { getDb } = require('../db.js')

/**
 * Ensure a directory exists
 * @param {string} dirPath Path to directory
 */
function ensureDirectoryExists(dirPath) {
	if (!fs.existsSync(dirPath)) {
		fs.mkdirSync(dirPath, { recursive: true })
	}
}

/**
 * Get application data directory
 * @param {string} subDir Optional subdirectory
 * @returns {string} Path to application data directory
 */
function getAppDataDir(subDir = '') {
	const appDataDir = path.join(app.getPath('userData'), subDir)
	ensureDirectoryExists(appDataDir)
	return appDataDir
}

/**
 * Get temporary directory
 * @returns {string} Path to temporary directory
 */
function getTempDir() {
	const tempDir = path.join(app.getPath('userData'), 'temp')
	ensureDirectoryExists(tempDir)
	console.log('🎵 Audio files location:', tempDir)
	return tempDir
}

/**
 * Format duration in seconds to human-readable string
 * @param {number} seconds Duration in seconds
 * @returns {string} Formatted duration
 */
function formatDuration(seconds) {
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
 * @param {string} filePath Path to the file
 * @returns {boolean} True if the file is an audio file
 */
function isAudioFile(filePath) {
	const audioExtensions = ['.mp3', '.wav', '.flac', '.m4a', '.aac', '.ogg', '.wma', '.opus', '.amr']
	const extension = path.extname(filePath).toLowerCase()
	return audioExtensions.includes(extension)
}

/**
 * Check if a file is a video file based on its extension
 * @param {string} filePath Path to the file
 * @returns {boolean} True if the file is a video file
 */
function isVideoFile(filePath) {
	const videoExtensions = ['.mp4', '.avi', '.mov', '.mkv', '.webm', '.wmv', '.3gp', '.flv']
	const extension = path.extname(filePath).toLowerCase()
	return videoExtensions.includes(extension)
}

/**
 * Get the file type (audio or video) based on extension
 * @param {string} filePath Path to the file
 * @returns {string} 'audio', 'video', or 'unknown'
 */
function getFileType(filePath) {
	if (isAudioFile(filePath)) return 'audio'
	if (isVideoFile(filePath)) return 'video'
	return 'unknown'
}

module.exports = {
	ensureDirectoryExists,
	getAppDataDir,
	getTempDir,
	formatDuration,
	isAudioFile,
	isVideoFile,
	getFileType
}
