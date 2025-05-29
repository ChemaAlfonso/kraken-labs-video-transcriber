import { contextBridge, ipcRenderer } from 'electron'

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
	// Configuration
	getApiConfig: (apiType: string) => ipcRenderer.invoke('get-api-config', apiType),
	saveApiConfig: (config: any) => ipcRenderer.invoke('save-api-config', config),
	getDefaultLanguage: () => ipcRenderer.invoke('get-default-language'),
	setDefaultLanguage: (language: string) => ipcRenderer.invoke('set-default-language', language),
	getSystemPrompt: () => ipcRenderer.invoke('get-system-prompt'),
	setSystemPrompt: (prompt: string) => ipcRenderer.invoke('set-system-prompt', prompt),
	getUserPrompt: () => ipcRenderer.invoke('get-user-prompt'),
	setUserPrompt: (prompt: string) => ipcRenderer.invoke('set-user-prompt', prompt),
	getTranscriptionService: () => ipcRenderer.invoke('get-transcription-service'),
	setTranscriptionService: (service: string) => ipcRenderer.invoke('set-transcription-service', service),
	getGenerationService: () => ipcRenderer.invoke('get-generation-service'),
	setGenerationService: (service: string) => ipcRenderer.invoke('set-generation-service', service),

	// File operations
	openVideoDialog: () => ipcRenderer.invoke('dialog:openVideo'),
	selectVideoFile: () => ipcRenderer.invoke('select-video-file'),

	// Video processing
	transcribeVideo: (params: any) => ipcRenderer.invoke('transcribe-video', params),
	extractAudio: (videoPath: string) => ipcRenderer.invoke('extract-audio', videoPath),

	// Results management
	saveResult: (data: any) => ipcRenderer.invoke('save-result', data),
	getResults: () => ipcRenderer.invoke('get-results'),
	deleteResult: (id: string) => ipcRenderer.invoke('delete-result', id),
	regenerateIndex: (params: any) => ipcRenderer.invoke('regenerate-index', params),

	// System info
	getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
	getFfmpegInfo: () => ipcRenderer.invoke('get-ffmpeg-info'),
	openExternalUrl: (url: string) => ipcRenderer.invoke('open-external-url', url)
})

export {}
