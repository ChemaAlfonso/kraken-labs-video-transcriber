import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
	// Configuration
	getApiConfig: (apiType: string) => ipcRenderer.invoke('get-api-config', apiType),
	saveApiConfig: (config: any) => ipcRenderer.invoke('save-api-config', config),
	getDefaultLanguage: () => ipcRenderer.invoke('get-default-language'),
	setDefaultLanguage: (language: string) => ipcRenderer.invoke('set-default-language', language),
	// Legacy prompts (for backward compatibility)
	getSystemPrompt: () => ipcRenderer.invoke('get-system-prompt'),
	setSystemPrompt: (prompt: string) => ipcRenderer.invoke('set-system-prompt', prompt),
	getUserPrompt: () => ipcRenderer.invoke('get-user-prompt'),
	setUserPrompt: (prompt: string) => ipcRenderer.invoke('set-user-prompt', prompt),

	// Multiple System Prompts
	getSystemPrompts: () => ipcRenderer.invoke('get-system-prompts'),
	saveSystemPrompt: (prompt: any) => ipcRenderer.invoke('save-system-prompt', prompt),
	updateSystemPrompt: (id: number, updates: any) => ipcRenderer.invoke('update-system-prompt', id, updates),
	deleteSystemPrompt: (id: number) => ipcRenderer.invoke('delete-system-prompt', id),
	setSelectedSystemPrompt: (id: number) => ipcRenderer.invoke('set-selected-system-prompt', id),
	getSelectedSystemPromptId: () => ipcRenderer.invoke('get-selected-system-prompt-id'),

	// Multiple User Prompts
	getUserPrompts: () => ipcRenderer.invoke('get-user-prompts'),
	saveUserPrompt: (prompt: any) => ipcRenderer.invoke('save-user-prompt', prompt),
	updateUserPrompt: (id: number, updates: any) => ipcRenderer.invoke('update-user-prompt', id, updates),
	deleteUserPrompt: (id: number) => ipcRenderer.invoke('delete-user-prompt', id),
	setSelectedUserPrompt: (id: number) => ipcRenderer.invoke('set-selected-user-prompt', id),
	getSelectedUserPromptId: () => ipcRenderer.invoke('get-selected-user-prompt-id'),
	getTranscriptionService: () => ipcRenderer.invoke('get-transcription-service'),
	setTranscriptionService: (service: string) => ipcRenderer.invoke('set-transcription-service', service),
	getGenerationService: () => ipcRenderer.invoke('get-generation-service'),
	setGenerationService: (service: string) => ipcRenderer.invoke('set-generation-service', service),

	// File operations
	openVideoDialog: () => ipcRenderer.invoke('dialog:openVideo'),

	// Video processing
	extractAudio: (videoPath: string) => ipcRenderer.invoke('extract-audio', videoPath),
	processFileQueue: (params: any) => ipcRenderer.invoke('process-file-queue', params),
	cancelFileQueueProcessing: () => ipcRenderer.invoke('cancel-file-queue-processing'),
	onProcessFileQueueProgress: (
		callback: (progress: {
			progress: number
			processingFile: string | null
			currentFileIndex: number
			totalFiles: number
			currentStage: string
			processedFiles: number
		}) => void
	) => {
		ipcRenderer.on('process-file-queue-progress', (_, data) => callback(data))
	},

	// Results management
	saveResult: (data: any) => ipcRenderer.invoke('save-result', data),
	getResults: () => ipcRenderer.invoke('get-results'),
	deleteResult: (id: string) => ipcRenderer.invoke('delete-result', id),
	regenerateIndex: (params: any) => ipcRenderer.invoke('regenerate-index', params),
	bulkGenerateContent: (params: any) => ipcRenderer.invoke('bulk-generate-content', params),

	// System info
	getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
	getFfmpegInfo: () => ipcRenderer.invoke('get-ffmpeg-info'),
	openExternalUrl: (url: string) => ipcRenderer.invoke('open-external-url', url)
})

export {}
