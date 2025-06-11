interface SystemPrompt {
	id?: number
	name: string
	content: string
	is_default: boolean
	created_at: string
}

interface UserPrompt {
	id?: number
	name: string
	content: string
	is_default: boolean
	created_at: string
}

interface ElectronAPI {
	// File dialogs
	openVideoDialog: () => Promise<string[] | null>
	selectVideoFile: () => Promise<string | null>

	// Media processing (video and audio)
	transcribeVideo: (params: {
		audioPath: string
		transcriptionService: string
		aiService: string
		prompt: string
		language: string
	}) => Promise<{
		transcription: string
		index: string
	}>

	extractAudio: (videoPath: string) => Promise<string>

	processFileQueue: (params: {
		filePaths: string[]
		titles?: string[]
		transcriptionService: string
		aiService: string
		prompt: string
		language: string
	}) => Promise<
		Array<{
			success: boolean
			file: string
			title?: string
			error?: string
			id?: number
			transcription?: string
			index?: string
		}>
	>

	onProcessFileQueueProgress: (
		callback: (progress: {
			progress: number
			processingFile: string | null
			currentFileIndex: number
			totalFiles: number
			currentStage: string
			processedFiles: number
		}) => void
	) => void

	// Results management
	saveResult: (data: {
		title: string
		source: string
		language: string
		transcription: string
		index: string
		prompt: string
		audio_path: string
	}) => Promise<{ success: boolean }>

	getResults: () => Promise<
		Array<{
			id: number
			title: string
			source: string
			date: string
			language: string
			transcription: string
			index: string
			prompt: string
			audio_path: string
		}>
	>

	deleteResult: (id: number) => Promise<{ success: boolean }>

	regenerateIndex: (params: { id: number; transcription: string; language: string; prompt: string }) => Promise<{
		success: boolean
		index?: string
		prompt?: string
		error?: string
	}>

	bulkGenerateContent: (params: {
		systemPrompt: string
		userPrompt: string
		title: string
		sourceIds: number[]
	}) => Promise<{
		success: boolean
		id?: number
		error?: string
	}>

	// API Config
	saveApiConfig: (config: {
		api_type: string
		apiKey: string
		model: string
		host: string
		temperature: number
		whisperModel: string
	}) => Promise<{ success: boolean }>

	getApiConfig: (apiType: string) => Promise<{
		id?: number
		api_type: string
		apiKey: string
		model: string
		host: string
		temperature: number
		whisperModel: string
	}>

	// Settings
	getDefaultLanguage: () => Promise<string>
	setDefaultLanguage: (language: string) => Promise<{ success: boolean }>

	// Legacy prompts (for backward compatibility)
	getSystemPrompt: () => Promise<string>
	setSystemPrompt: (prompt: string) => Promise<{ success: boolean }>
	getUserPrompt: () => Promise<string>
	setUserPrompt: (prompt: string) => Promise<{ success: boolean }>

	// Multiple System Prompts
	getSystemPrompts: () => Promise<SystemPrompt[]>
	saveSystemPrompt: (prompt: {
		name: string
		content: string
		is_default: boolean
	}) => Promise<{ success: boolean; prompt: SystemPrompt }>
	updateSystemPrompt: (
		id: number,
		updates: Partial<{ name: string; content: string; is_default: boolean }>
	) => Promise<{ success: boolean }>
	deleteSystemPrompt: (id: number) => Promise<{ success: boolean }>
	setSelectedSystemPrompt: (id: number) => Promise<{ success: boolean }>
	getSelectedSystemPromptId: () => Promise<number | null>

	// Multiple User Prompts
	getUserPrompts: () => Promise<UserPrompt[]>
	saveUserPrompt: (prompt: {
		name: string
		content: string
		is_default: boolean
	}) => Promise<{ success: boolean; prompt: UserPrompt }>
	updateUserPrompt: (
		id: number,
		updates: Partial<{ name: string; content: string; is_default: boolean }>
	) => Promise<{ success: boolean }>
	deleteUserPrompt: (id: number) => Promise<{ success: boolean }>
	setSelectedUserPrompt: (id: number) => Promise<{ success: boolean }>
	getSelectedUserPromptId: () => Promise<number | null>

	getTranscriptionService: () => Promise<string>
	setTranscriptionService: (service: string) => Promise<{ success: boolean }>
	getGenerationService: () => Promise<string>
	setGenerationService: (service: string) => Promise<{ success: boolean }>

	// System info
	getUserDataPath: () => Promise<string>
	getFfmpegInfo: () => Promise<{
		ffmpegPath: string
		exists: boolean
		isInstalled: boolean
		version?: string
		error?: string
	}>
	openExternalUrl: (url: string) => Promise<{ success: boolean; error?: string }>
}

interface Window {
	electronAPI: ElectronAPI
}
