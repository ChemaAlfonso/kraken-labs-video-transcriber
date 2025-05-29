const { contextBridge, ipcRenderer } = require('electron')

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
	// Configuration
	getApiConfig: apiType => ipcRenderer.invoke('get-api-config', apiType),
	saveApiConfig: config => ipcRenderer.invoke('save-api-config', config),
	getDefaultLanguage: () => ipcRenderer.invoke('get-default-language'),
	setDefaultLanguage: language => ipcRenderer.invoke('set-default-language', language),
	getSystemPrompt: () => ipcRenderer.invoke('get-system-prompt'),
	setSystemPrompt: prompt => ipcRenderer.invoke('set-system-prompt', prompt),
	getUserPrompt: () => ipcRenderer.invoke('get-user-prompt'),
	setUserPrompt: prompt => ipcRenderer.invoke('set-user-prompt', prompt),
	getTranscriptionService: () => ipcRenderer.invoke('get-transcription-service'),
	setTranscriptionService: service => ipcRenderer.invoke('set-transcription-service', service),
	getGenerationService: () => ipcRenderer.invoke('get-generation-service'),
	setGenerationService: service => ipcRenderer.invoke('set-generation-service', service),

	// File operations
	openVideoDialog: () => ipcRenderer.invoke('dialog:openVideo'),
	selectVideoFile: () => ipcRenderer.invoke('select-video-file'),

	// Video processing
	transcribeVideo: params => ipcRenderer.invoke('transcribe-video', params),
	extractAudio: videoPath => ipcRenderer.invoke('extract-audio', videoPath),

	// Results management
	saveResult: data => ipcRenderer.invoke('save-result', data),
	getResults: () => ipcRenderer.invoke('get-results'),
	deleteResult: id => ipcRenderer.invoke('delete-result', id),
	regenerateIndex: params => ipcRenderer.invoke('regenerate-index', params),

	// System info
	getUserDataPath: () => ipcRenderer.invoke('get-user-data-path'),
	getFfmpegInfo: () => ipcRenderer.invoke('get-ffmpeg-info'),
	openExternalUrl: url => ipcRenderer.invoke('open-external-url', url)
})
