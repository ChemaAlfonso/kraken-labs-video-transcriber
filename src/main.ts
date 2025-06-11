import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import * as path from 'path'

// Vite environment variables provided by Electron Forge
declare const MAIN_WINDOW_VITE_DEV_SERVER_URL: string | undefined
declare const MAIN_WINDOW_VITE_NAME: string

// Import TypeScript services
import * as db from './services/db'
import * as ffmpegService from './services/ffmpeg'
import * as transcriptionService from './services/transcription'
import * as aiService from './services/ai'
import * as utils from './services/utils'

let mainWindow: BrowserWindow | null = null

// Handle creating/removing shortcuts on Windows when installing/uninstalling
if (process.platform === 'win32') {
	app.setAppUserModelId(app.name)
}

// Prevent multiple instances of the app
if (!app.requestSingleInstanceLock()) {
	app.quit()
	process.exit(0)
}

const createWindow = async (): Promise<void> => {
	// Initialize database
	await db.initialize()

	// Choose the appropriate icon based on platform
	let iconPath: string
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

	// Load the app
	if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
		// Development mode with Vite dev server
		await mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL)
		mainWindow.webContents.openDevTools()
	} else {
		// Production mode
		await mainWindow.loadFile(path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`))
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
		properties: ['openFile', 'multiSelections'],
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
	return canceled ? null : filePaths
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

// System prompt handlers (legacy - for backward compatibility)
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
		return 'You are an assistant that creates detailed and accurate content analysis from transcriptions. Focus on creating clear, organized, and helpful content that helps users quickly understand and navigate the source material.'
	}
})

// User prompt handlers (legacy - for backward compatibility)
ipcMain.handle('set-user-prompt', async (_, prompt) => {
	try {
		await db.setUserPrompt(prompt)
		return { success: true }
	} catch (error) {
		console.error('Error setting user prompt:', error)
		throw error
	}
})

ipcMain.handle('get-user-prompt', async () => {
	try {
		return await db.getUserPrompt()
	} catch (error) {
		console.error('Error getting user prompt:', error)
		return 'Create a detailed table of contents for this content with timestamps, highlighting the main topics and subtopics discussed. Use the transcription below:\n\n{transcription}'
	}
})

// Multiple System Prompts handlers
ipcMain.handle('get-system-prompts', async () => {
	try {
		return await db.getSystemPrompts()
	} catch (error) {
		console.error('Error getting system prompts:', error)
		throw error
	}
})

ipcMain.handle('save-system-prompt', async (_, prompt) => {
	try {
		const result = await db.saveSystemPrompt(prompt)
		return { success: true, prompt: result }
	} catch (error) {
		console.error('Error saving system prompt:', error)
		throw error
	}
})

ipcMain.handle('update-system-prompt', async (_, id, updates) => {
	try {
		await db.updateSystemPrompt(id, updates)
		return { success: true }
	} catch (error) {
		console.error('Error updating system prompt:', error)
		throw error
	}
})

ipcMain.handle('delete-system-prompt', async (_, id) => {
	try {
		await db.deleteSystemPrompt(id)
		return { success: true }
	} catch (error) {
		console.error('Error deleting system prompt:', error)
		throw error
	}
})

ipcMain.handle('set-selected-system-prompt', async (_, id) => {
	try {
		await db.setSelectedSystemPrompt(id)
		return { success: true }
	} catch (error) {
		console.error('Error setting selected system prompt:', error)
		throw error
	}
})

ipcMain.handle('get-selected-system-prompt-id', async () => {
	try {
		return await db.getSelectedSystemPromptId()
	} catch (error) {
		console.error('Error getting selected system prompt ID:', error)
		return null
	}
})

// Multiple User Prompts handlers
ipcMain.handle('get-user-prompts', async () => {
	try {
		return await db.getUserPrompts()
	} catch (error) {
		console.error('Error getting user prompts:', error)
		throw error
	}
})

ipcMain.handle('save-user-prompt', async (_, prompt) => {
	try {
		const result = await db.saveUserPrompt(prompt)
		return { success: true, prompt: result }
	} catch (error) {
		console.error('Error saving user prompt:', error)
		throw error
	}
})

ipcMain.handle('update-user-prompt', async (_, id, updates) => {
	try {
		await db.updateUserPrompt(id, updates)
		return { success: true }
	} catch (error) {
		console.error('Error updating user prompt:', error)
		throw error
	}
})

ipcMain.handle('delete-user-prompt', async (_, id) => {
	try {
		await db.deleteUserPrompt(id)
		return { success: true }
	} catch (error) {
		console.error('Error deleting user prompt:', error)
		throw error
	}
})

ipcMain.handle('set-selected-user-prompt', async (_, id) => {
	try {
		await db.setSelectedUserPrompt(id)
		return { success: true }
	} catch (error) {
		console.error('Error setting selected user prompt:', error)
		throw error
	}
})

ipcMain.handle('get-selected-user-prompt-id', async () => {
	try {
		return await db.getSelectedUserPromptId()
	} catch (error) {
		console.error('Error getting selected user prompt ID:', error)
		return null
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
	} catch (error: any) {
		console.error('Error getting FFmpeg info:', error)
		return {
			ffmpegPath: 'unknown',
			exists: false,
			isInstalled: false,
			error: error.message
		}
	}
})

// Regenerate index handler
ipcMain.handle('regenerate-index', async (_, { id, transcription, language, userPrompt, systemPrompt }) => {
	try {
		console.log('🔄 Starting content regeneration process for ID:', id)
		console.log('📋 Parameters:', {
			transcriptionLength: transcription.length,
			language,
			userPromptLength: userPrompt.length,
			systemPromptLength: systemPrompt.length
		})

		// Get generation service config
		const generationService = await db.getSetting('generationService', 'openai')
		if (!generationService) {
			throw new Error('Failed to get generation service setting')
		}
		console.log('⚙️ Getting AI service config for:', generationService)
		const aiConfig = await db.getApiConfig(generationService)
		console.log('📋 AI config loaded (API key hidden):', {
			...aiConfig,
			apiKey: aiConfig.apiKey ? '[HIDDEN]' : '[MISSING]'
		})

		console.log('✅ System prompt provided, length:', systemPrompt.length, 'characters')

		// Generate the new content
		console.log('🤖 Starting content regeneration...')
		const result = await aiService.regenerateIndex(
			{
				userPrompt,
				transcription,
				systemPrompt,
				language
			},
			generationService,
			aiConfig
		)
		console.log('✅ Content regeneration completed, length:', result.index.length, 'characters')

		// Update the result in the database with new system prompt content
		console.log('💾 Updating result in database...')
		await db.updateTranscriptionResult(id, {
			index_content: result.index,
			prompt: userPrompt,
			system_prompt: systemPrompt
		})
		console.log('✅ Result updated in database')

		return {
			success: true,
			index: result.index,
			prompt: userPrompt
		}
	} catch (error: any) {
		console.error('❌ Error in content regeneration process:', error)
		return {
			success: false,
			error: error.message || 'Unknown error occurred'
		}
	}
})

// Audio extraction handler
ipcMain.handle('extract-audio', async (_, videoPath) => {
	try {
		console.log('🎬 Starting audio extraction from:', videoPath)
		const audioPath = await ffmpegService.extractAudio(videoPath)
		console.log('✅ Audio extracted to:', audioPath)
		return audioPath
	} catch (error) {
		console.error('❌ Error extracting audio:', error)
		throw error
	}
})

// Results management handlers
ipcMain.handle('save-result', async (_, data) => {
	try {
		console.log('💾 Saving transcription result to database...')

		// Get the currently selected system prompt content
		const systemPrompt = await db.getSystemPrompt()

		// Map frontend fields to database fields and add current date
		const dbData = {
			...data,
			date: new Date().toISOString(), // Add current timestamp
			index_content: data.index, // Map index to index_content for database
			system_prompt: systemPrompt // Store the system prompt content used
		}

		const result = await db.saveTranscriptionResult(dbData)
		console.log('✅ Result saved with ID:', result.id)
		return result
	} catch (error) {
		console.error('❌ Error saving result:', error)
		throw error
	}
})

ipcMain.handle('get-results', async () => {
	try {
		console.log('📋 Getting all transcription results from database...')
		const results = await db.getTranscriptionResults()
		console.log('✅ Retrieved', results.length, 'results')

		// Map database fields to frontend expectations
		const mappedResults = results.map(result => ({
			...result,
			index: result.index_content // Map index_content to index
		}))

		return mappedResults
	} catch (error) {
		console.error('❌ Error getting results:', error)
		throw error
	}
})

ipcMain.handle('delete-result', async (_, id) => {
	try {
		console.log('🗑️ Deleting transcription result with ID:', id)
		await db.deleteTranscriptionResult(id)
		console.log('✅ Result deleted successfully')
		return { success: true }
	} catch (error) {
		console.error('❌ Error deleting result:', error)
		throw error
	}
})

// Bulk generation handler
ipcMain.handle('bulk-generate-content', async (_, { systemPrompt, userPrompt, title, sourceIds }) => {
	try {
		console.log('🔄 Starting bulk content generation process')
		console.log('📋 Parameters:', {
			title,
			sourceCount: sourceIds.length,
			userPromptLength: userPrompt.length,
			systemPromptLength: systemPrompt.length
		})

		// Get generation service config
		const generationService = await db.getSetting('generationService', 'openai')
		if (!generationService) {
			throw new Error('Failed to get generation service setting')
		}
		console.log('⚙️ Getting AI service config for:', generationService)
		const aiConfig = await db.getApiConfig(generationService)
		console.log('📋 AI config loaded (API key hidden):', {
			...aiConfig,
			apiKey: aiConfig.apiKey ? '[HIDDEN]' : '[MISSING]'
		})

		// Get user's default language setting
		const defaultLanguage = (await db.getSetting('defaultLanguage', 'en')) || 'en'
		console.log('🌐 Using user default language:', defaultLanguage)

		// Remove {transcription} placeholder from user prompt since we're not using transcriptions in bulk generation
		const cleanedUserPrompt = userPrompt.replace(/\{transcription\}/gi, '').trim()
		console.log('🔧 Cleaned user prompt (removed {transcription} placeholder)')

		// Generate the new content using bulk generation
		console.log('🤖 Starting bulk content generation...')
		const result = await aiService.generateIndex(
			{
				userPrompt: cleanedUserPrompt,
				transcription: '', // No transcription needed for bulk generation
				systemPrompt,
				language: defaultLanguage
			},
			generationService,
			aiConfig
		)
		console.log('✅ Bulk content generation completed, length:', result.index.length, 'characters')

		// Save the bulk generation result
		console.log('💾 Saving bulk generation result to database...')
		const saveResult = await db.saveTranscriptionResult({
			title,
			source: `Bulk Generation from ${sourceIds.length} sources`,
			language: defaultLanguage,
			transcription: `Combined content from generation IDs: ${sourceIds.join(', ')}`,
			index_content: result.index,
			prompt: cleanedUserPrompt,
			audio_path: '', // No audio path for bulk generation
			date: new Date().toISOString(),
			system_prompt: systemPrompt
		})
		console.log('✅ Bulk generation result saved with ID:', saveResult.id)

		return {
			success: true,
			id: saveResult.id
		}
	} catch (error: any) {
		console.error('❌ Error in bulk content generation process:', error)
		return {
			success: false,
			error: error.message || 'Unknown error occurred'
		}
	}
})

// External URL handler
ipcMain.handle('open-external-url', async (_, url) => {
	try {
		await shell.openExternal(url)
		return { success: true }
	} catch (error) {
		console.error('Error opening external URL:', error)
		throw error
	}
})

// Step 1: Extract or process audio from media file
const processMediaToAudio = async (filePath: string): Promise<string> => {
	try {
		console.log('📁 Input file path:', filePath)

		// Determine if input is audio or video
		const fileType = utils.getFileType(filePath)
		console.log('📋 File type detected:', fileType)

		let finalAudioPath = filePath

		// If it's a video file, extract audio first
		if (fileType === 'video') {
			console.log('🎬 Video file detected - extracting audio...')
			finalAudioPath = await ffmpegService.extractAudio(filePath)
			console.log('✅ Audio extracted to:', finalAudioPath)
		} else if (fileType === 'audio') {
			console.log('🎵 Audio file detected - processing and optimizing...')
			finalAudioPath = await ffmpegService.processAudio(filePath)
			console.log('✅ Audio processed and optimized to:', finalAudioPath)
		} else {
			throw new Error('Unsupported file type. Please select a video or audio file.')
		}

		return finalAudioPath
	} catch (error) {
		console.error('❌ Error in audio processing:', error)
		throw error
	}
}

// Step 2: Transcribe audio file
const transcribeAudioFile = async (audioPath: string, serviceType: string, language: string): Promise<string> => {
	try {
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
			audioPath,
			serviceType,
			transcriptionConfig,
			language
		)
		console.log('✅ Transcription completed, length:', transcription.length, 'characters')

		return transcription
	} catch (error) {
		console.error('❌ Error in transcription:', error)
		throw error
	}
}

// Step 3: Generate content using AI
const generateContentIndex = async (
	transcription: string,
	prompt: string,
	language: string,
	aiServiceType: string
): Promise<string> => {
	try {
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

		// Generate the content
		console.log('🤖 Starting content generation...')
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
		console.log('✅ Content generation completed, length:', result.index.length, 'characters')

		return result.index
	} catch (error) {
		console.error('❌ Error in content generation:', error)
		throw error
	}
}

type ProgressStatus = {
	processed: boolean
	currentFilename: string | null
	currentStage?: string
}

const sendProgress = (
	event: any,
	filesStatus: ProgressStatus[],
	currentFileIndex: number,
	totalFiles: number,
	currentStage: string = ''
) => {
	const totalProcessed = filesStatus.filter(file => file.processed).length
	const currentFile = filesStatus.find(file => !file.processed)

	// Calculate overall progress: each file contributes equally to total progress
	// Within each file, we can show stage-based progress
	const baseProgress = (totalProcessed / totalFiles) * 100
	const currentFileProgress = currentFileIndex < totalFiles ? (1 / totalFiles) * 100 : 0

	// Add partial progress for current file based on stage
	let stageProgress = 0
	if (currentStage && currentFileIndex < totalFiles) {
		const stageMap: { [key: string]: number } = {
			starting: 5,
			extracting: 25,
			transcribing: 60,
			generating: 85,
			saving: 95,
			completed: 100
		}
		stageProgress = (stageMap[currentStage] || 0) * (currentFileProgress / 100)
	}

	const totalProgress = Math.min(100, Math.round(baseProgress + stageProgress))

	const fileName = currentFile?.currentFilename
		? currentFile.currentFilename.split(/[\/\\]/).pop() || currentFile.currentFilename
		: null

	event.sender.send('process-file-queue-progress', {
		progress: totalProgress,
		processingFile: fileName,
		currentFileIndex: currentFileIndex + 1,
		totalFiles: totalFiles,
		currentStage: currentStage,
		processedFiles: totalProcessed
	})
}

// Queue processing handler for files (single or multiple)
ipcMain.handle(
	'process-file-queue',
	async (
		event,
		{ filePaths, titles, transcriptionService: serviceType, aiService: aiServiceType, prompt, language }
	) => {
		try {
			console.log('📁 Starting queue processing for', filePaths.length, 'files')
			const results = []

			const progressStatus: ProgressStatus[] = filePaths.map((filePath: string) => ({
				processed: false,
				currentFilename: filePath
			}))
			sendProgress(event, progressStatus, 0, filePaths.length, 'starting')

			for (let i = 0; i < filePaths.length; i++) {
				const filePath = filePaths[i]
				console.log(`🔄 Processing file ${i + 1}/${filePaths.length}:`, filePath)

				// Update progress - starting file
				sendProgress(event, progressStatus, i, filePaths.length, 'starting')

				// Use provided title or generate from filename
				let title = ''
				if (titles && titles[i]) {
					title = titles[i]
				} else {
					const fileName = filePath.split(/[\/\\]/).pop() || ''
					title = fileName.split('.').slice(0, -1).join('.')
				}

				try {
					// Step 1: Extract/Process Audio
					sendProgress(event, progressStatus, i, filePaths.length, 'extracting')
					const audioPath = await processMediaToAudio(filePath)

					// Step 2: Transcribe Audio
					sendProgress(event, progressStatus, i, filePaths.length, 'transcribing')
					const transcription = await transcribeAudioFile(audioPath, serviceType, language)

					// Step 3: Generate Content
					sendProgress(event, progressStatus, i, filePaths.length, 'generating')
					const index = await generateContentIndex(transcription, prompt, language, aiServiceType)

					// Get the currently selected system prompt content
					const systemPrompt = await db.getSystemPrompt()

					// Step 4: Save Results
					sendProgress(event, progressStatus, i, filePaths.length, 'saving')
					const savedResult = await db.saveTranscriptionResult({
						title: title,
						source: filePath,
						language: language,
						transcription: transcription,
						index_content: index,
						prompt: prompt,
						audio_path: audioPath,
						date: new Date().toISOString(),
						system_prompt: systemPrompt
					})

					results.push({
						...savedResult,
						success: true,
						file: filePath,
						title: title
					})

					console.log(`✅ File ${i + 1}/${filePaths.length} processed successfully:`, title)
				} catch (error: any) {
					console.error(`❌ Error processing file ${i + 1}/${filePaths.length}:`, error)
					results.push({
						success: false,
						error: error.message || 'Unknown error',
						file: filePath,
						title: title
					})
				}

				// Mark file as processed and send final progress for this file
				progressStatus[i].processed = true
				sendProgress(event, progressStatus, i + 1, filePaths.length, 'completed')
			}

			console.log(
				'✅ Queue processing completed. Successful:',
				results.filter(r => r.success).length,
				'Failed:',
				results.filter(r => !r.success).length
			)
			return results
		} catch (error) {
			console.error('❌ Error in queue processing:', error)
			throw error
		}
	}
)
