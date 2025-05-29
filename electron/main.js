const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron')
const path = require('path')
const fs = require('fs')
const db = require('./db.js')
const ffmpegService = require('./services/ffmpeg.js')
const transcriptionService = require('./services/transcription.js')
const aiService = require('./services/ai.js')
const utils = require('./services/utils.js')

let mainWindow = null

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (process.platform === 'win32') {
	app.setAppUserModelId(app.name)
}

// Prevent multiple instances of the app
if (!app.requestSingleInstanceLock()) {
	app.quit()
	process.exit(0)
}

const createWindow = async () => {
	// Initialize database
	await db.initialize()

	// Choose the appropriate icon based on platform
	let iconPath
	if (process.platform === 'darwin') {
		iconPath = path.join(__dirname, '../src/assets/icons/kkvideo.icns')
	} else if (process.platform === 'win32') {
		iconPath = path.join(__dirname, '../src/assets/icons/kkvideo.ico')
	} else {
		iconPath = path.join(__dirname, '../src/assets/icons/kkvideo.png')
	}

	// Create the browser window
	mainWindow = new BrowserWindow({
		width: 1440,
		height: 900,
		icon: iconPath,
		title: 'Kraken Labs Media Transcriber',
		webPreferences: {
			preload: path.join(__dirname, 'preload.js'),
			contextIsolation: true,
			nodeIntegration: false
		}
	})

	// Load the app - dev or production
	if (process.env.NODE_ENV === 'development') {
		// In development, load the bundled HTML file directly
		await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
		mainWindow.webContents.openDevTools()
	} else {
		await mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
	}
}

// This method will be called when Electron has finished initialization
app.whenReady().then(async () => {
	// Initialize database
	await db.initialize()

	// Create main window
	await createWindow()

	// Re-create window if it's closed but app is still running (macOS behavior)
	app.on('activate', () => {
		if (BrowserWindow.getAllWindows().length === 0) {
			createWindow()
		}
	})
})

// Quit when all windows are closed, except on macOS
app.on('window-all-closed', () => {
	if (process.platform !== 'darwin') {
		app.quit()
	}
})

// File dialog handlers
ipcMain.handle('dialog:openVideo', async () => {
	const { canceled, filePaths } = await dialog.showOpenDialog({
		properties: ['openFile'],
		filters: [
			{
				name: 'Video and Audio Files',
				extensions: ['mp4', 'avi', 'mov', 'mkv', 'mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg', 'wma']
			},
			{
				name: 'Video Files',
				extensions: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'wmv', '3gp', 'flv']
			},
			{
				name: 'Audio Files',
				extensions: ['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg', 'wma', 'opus', 'amr']
			}
		]
	})
	return canceled ? null : filePaths[0]
})

// Also alias for backward compatibility
ipcMain.handle('select-video-file', async () => {
	const { canceled, filePaths } = await dialog.showOpenDialog({
		properties: ['openFile'],
		filters: [
			{
				name: 'Video and Audio Files',
				extensions: ['mp4', 'avi', 'mov', 'mkv', 'mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg', 'wma']
			},
			{
				name: 'Video Files',
				extensions: ['mp4', 'avi', 'mov', 'mkv', 'webm', 'wmv', '3gp', 'flv']
			},
			{
				name: 'Audio Files',
				extensions: ['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg', 'wma', 'opus', 'amr']
			}
		]
	})
	return canceled ? null : filePaths[0]
})

// Database handlers
ipcMain.handle('save-api-config', async (_, config) => {
	try {
		await db.saveApiConfig(config.api_type, config)
		return { success: true }
	} catch (error) {
		console.error('Error saving API config:', error)
		throw error
	}
})

ipcMain.handle('get-api-config', async (_, apiType) => {
	try {
		return await db.getApiConfig(apiType)
	} catch (error) {
		console.error('Error getting API config:', error)
		throw error
	}
})

ipcMain.handle('set-default-language', async (_, language) => {
	try {
		await db.setSetting('defaultLanguage', language)
		return { success: true }
	} catch (error) {
		console.error('Error setting default language:', error)
		throw error
	}
})

ipcMain.handle('get-default-language', async () => {
	try {
		return await db.getSetting('defaultLanguage', 'es')
	} catch (error) {
		console.error('Error getting default language:', error)
		return 'es'
	}
})

// System prompt handlers
ipcMain.handle('set-system-prompt', async (_, prompt) => {
	try {
		await db.setSystemPrompt(prompt)
		return { success: true }
	} catch (error) {
		console.error('Error setting system prompt:', error)
		throw error
	}
})

ipcMain.handle('get-system-prompt', async () => {
	try {
		return await db.getSystemPrompt()
	} catch (error) {
		console.error('Error getting system prompt:', error)
		return 'You are an assistant that creates detailed and accurate content indexes from video transcriptions. Focus on creating clear, organized, and timestamped content indexes that help users quickly understand and navigate the video content.'
	}
})

// User prompt handlers
ipcMain.handle('set-user-prompt', async (_, prompt) => {
	try {
		await db.setSetting('userPrompt', prompt)
		return { success: true }
	} catch (error) {
		console.error('Error setting user prompt:', error)
		throw error
	}
})

ipcMain.handle('get-user-prompt', async () => {
	try {
		return await db.getSetting(
			'userPrompt',
			'Create a detailed table of contents for this content with timestamps, highlighting the main topics and subtopics discussed. Use the transcription below:\n\n{transcription}'
		)
	} catch (error) {
		console.error('Error getting user prompt:', error)
		return 'Create a detailed table of contents for this content with timestamps, highlighting the main topics and subtopics discussed. Use the transcription below:\n\n{transcription}'
	}
})

// Advanced settings handlers
ipcMain.handle('set-transcription-service', async (_, service) => {
	try {
		await db.setSetting('transcriptionService', service)
		return { success: true }
	} catch (error) {
		console.error('Error setting transcription service:', error)
		throw error
	}
})

ipcMain.handle('get-transcription-service', async () => {
	try {
		return await db.getSetting('transcriptionService', 'openai')
	} catch (error) {
		console.error('Error getting transcription service:', error)
		return 'openai'
	}
})

ipcMain.handle('set-generation-service', async (_, service) => {
	try {
		await db.setSetting('generationService', service)
		return { success: true }
	} catch (error) {
		console.error('Error setting generation service:', error)
		throw error
	}
})

ipcMain.handle('get-generation-service', async () => {
	try {
		return await db.getSetting('generationService', 'openai')
	} catch (error) {
		console.error('Error getting generation service:', error)
		return 'openai'
	}
})

// System info handlers
ipcMain.handle('get-user-data-path', async () => {
	return app.getPath('userData')
})

// FFmpeg info handler
ipcMain.handle('get-ffmpeg-info', async () => {
	try {
		const info = ffmpegService.getBinaryInfo()
		const isInstalled = await ffmpegService.isInstalled()
		return {
			...info,
			isInstalled
		}
	} catch (error) {
		console.error('Error getting FFmpeg info:', error)
		return {
			ffmpegPath: 'unknown',
			exists: false,
			isInstalled: false,
			error: error.message
		}
	}
})

// Transcription handler
ipcMain.handle(
	'transcribe-video',
	async (_, { audioPath, transcriptionService: serviceType, aiService: aiServiceType, prompt, language }) => {
		try {
			console.log('🎬 Starting transcription process with:', { serviceType, aiServiceType, language })
			console.log('📁 Input file path:', audioPath)

			// Determine if input is audio or video
			const fileType = utils.getFileType(audioPath)
			console.log('📋 File type detected:', fileType)

			let finalAudioPath = audioPath

			// If it's a video file, extract audio first
			if (fileType === 'video') {
				console.log('🎬 Video file detected - extracting audio...')
				finalAudioPath = await ffmpegService.extractAudio(audioPath)
				console.log('✅ Audio extracted to:', finalAudioPath)
			} else if (fileType === 'audio') {
				console.log('🎵 Audio file detected - processing and optimizing...')
				finalAudioPath = await ffmpegService.processAudio(audioPath)
				console.log('✅ Audio processed and optimized to:', finalAudioPath)
			} else {
				throw new Error('Unsupported file type. Please select a video or audio file.')
			}

			// Get transcription service config
			console.log('⚙️ Getting transcription service config for:', serviceType)
			const transcriptionConfig = await db.getApiConfig(serviceType)
			console.log('📋 Transcription config loaded (API key hidden):', {
				...transcriptionConfig,
				apiKey: transcriptionConfig.apiKey ? '[HIDDEN]' : '[MISSING]'
			})

			// Transcribe the audio
			console.log('🎙️ Starting audio transcription...')
			const transcription = await transcriptionService.transcribe(
				finalAudioPath,
				serviceType,
				transcriptionConfig,
				language
			)
			console.log('✅ Transcription completed, length:', transcription.length, 'characters')

			// Get AI service config
			console.log('⚙️ Getting AI service config for:', aiServiceType)
			const aiConfig = await db.getApiConfig(aiServiceType)
			console.log('📋 AI config loaded (API key hidden):', {
				...aiConfig,
				apiKey: aiConfig.apiKey ? '[HIDDEN]' : '[MISSING]'
			})

			// Get system prompt
			console.log('📝 Getting system prompt...')
			const systemPrompt = await db.getSystemPrompt()
			console.log('✅ System prompt loaded, length:', systemPrompt.length, 'characters')

			// Generate the index
			console.log('🤖 Starting index generation...')
			const result = await aiService.generateIndex(
				{
					userPrompt: prompt,
					transcription,
					systemPrompt,
					language
				},
				aiServiceType,
				aiConfig
			)
			console.log('✅ Index generation completed, length:', result.index.length, 'characters')

			return {
				transcription,
				index: result.index
			}
		} catch (error) {
			console.error('❌ Error in transcription process:', error)
			throw error
		}
	}
)

// Regenerate index handler
ipcMain.handle('regenerate-index', async (_, { id, transcription, language, prompt }) => {
	try {
		console.log('🔄 Starting index regeneration process for ID:', id)
		console.log('📋 Parameters:', {
			transcriptionLength: transcription.length,
			language,
			promptLength: prompt.length
		})

		// Get generation service config
		const generationService = await db.getSetting('generationService', 'openai')
		console.log('⚙️ Getting AI service config for:', generationService)
		const aiConfig = await db.getApiConfig(generationService)
		console.log('📋 AI config loaded (API key hidden):', {
			...aiConfig,
			apiKey: aiConfig.apiKey ? '[HIDDEN]' : '[MISSING]'
		})

		// Get system prompt
		console.log('📝 Getting system prompt...')
		const systemPrompt = await db.getSystemPrompt()
		console.log('✅ System prompt loaded, length:', systemPrompt.length, 'characters')

		// Generate the new index
		console.log('🤖 Starting index regeneration...')
		const result = await aiService.regenerateIndex(
			{
				userPrompt: prompt,
				transcription,
				systemPrompt,
				language
			},
			generationService,
			aiConfig
		)
		console.log('✅ Index regeneration completed, length:', result.index.length, 'characters')

		// Update the result in the database
		console.log('💾 Updating result in database...')
		await db.updateTranscriptionResult(id, {
			index: result.index,
			prompt: prompt
		})
		console.log('✅ Result updated successfully in database')

		return {
			success: true,
			index: result.index,
			prompt: prompt
		}
	} catch (error) {
		console.error('❌ Error in index regeneration process:', error)
		// Return error response instead of throwing to avoid Electron infrastructure messages
		return {
			success: false,
			error: error.message
		}
	}
})

// Extract audio handler
ipcMain.handle('extract-audio', async (_, videoPath) => {
	try {
		return await ffmpegService.extractAudio(videoPath)
	} catch (error) {
		console.error('Error extracting audio:', error)
		throw error
	}
})

// Save result handler
ipcMain.handle('save-result', async (_, data) => {
	try {
		console.log('💾 Saving transcription result...')
		console.log('📋 Result data:', {
			title: data.title,
			source: data.source,
			language: data.language,
			transcriptionLength: data.transcription.length,
			indexLength: data.index.length,
			audio_path: data.audio_path
		})
		await db.saveTranscriptionResult(data)
		console.log('✅ Result saved successfully to database')
		return { success: true }
	} catch (error) {
		console.error('❌ Error saving result:', error)
		throw error
	}
})

// Get results handler
ipcMain.handle('get-results', async () => {
	try {
		return await db.getTranscriptionResults()
	} catch (error) {
		console.error('Error getting results:', error)
		throw error
	}
})

// Delete result handler
ipcMain.handle('delete-result', async (_, id) => {
	try {
		await db.deleteTranscriptionResult(id)
		return { success: true }
	} catch (error) {
		console.error('Error deleting result:', error)
		throw error
	}
})

// Open external URL handler
ipcMain.handle('open-external-url', async (_, url) => {
	try {
		await shell.openExternal(url)
		return { success: true }
	} catch (error) {
		console.error('Error opening external URL:', error)
		return { success: false, error: error.message }
	}
})
