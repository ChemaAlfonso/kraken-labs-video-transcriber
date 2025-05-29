import axios from 'axios'
import * as fs from 'fs'

// Use dynamic import to avoid bundling issues
let FormData: any
try {
	// Use require without eval to avoid bundling issues
	const formDataModule = require('form-data')
	FormData = formDataModule.default || formDataModule
	console.log('Successfully imported form-data')
} catch (err) {
	console.error('Failed to import form-data:', err)
	throw new Error('form-data could not be imported: ' + err)
}

interface TranscriptionConfig {
	apiKey: string
	host?: string
	whisperModel?: string
}

interface Segment {
	start: number
	end: number
	text: string
}

interface TranscriptionResponse {
	text: string
	segments?: Segment[]
}

/**
 * Format segments to markdown with timestamps
 */
function formatSegmentsToMarkdown(segments: Segment[]): string {
	if (!segments || segments.length === 0) {
		return ''
	}

	return segments
		.map((segment, index) => {
			const startTime = formatTimestamp(segment.start)
			const endTime = formatTimestamp(segment.end)

			// Add extra spacing for better readability and topic identification
			const prefix = index === 0 ? '' : '\n'
			return `${prefix}**[${startTime} - ${endTime}]** ${segment.text.trim()}`
		})
		.join('\n')
}

/**
 * Format seconds to timestamp (HH:MM:SS)
 */
function formatTimestamp(seconds: number): string {
	// Round to nearest second for better accuracy
	const totalSeconds = Math.round(seconds)
	const hours = Math.floor(totalSeconds / 3600)
	const minutes = Math.floor((totalSeconds % 3600) / 60)
	const secs = totalSeconds % 60

	return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs
		.toString()
		.padStart(2, '0')}`
}

/**
 * Transcribe audio using OpenAI-compatible Whisper API
 */
export async function transcribe(
	audioPath: string,
	serviceType: string,
	config: TranscriptionConfig,
	language: string | null = null
): Promise<string> {
	console.log('🎙️ Transcription request details:')
	console.log('   Service Type:', serviceType)
	console.log('   Audio Path:', audioPath)
	console.log('   Language:', language || 'auto-detect')
	console.log('   Config:', {
		apiKey: config.apiKey ? '[PRESENT]' : '[MISSING]',
		host: config.host || '[NOT SET]',
		whisperModel: config.whisperModel || '[NOT SET]'
	})

	switch (serviceType) {
		case 'openai':
			return await transcribeWithOpenAI(audioPath, config, language)
		case 'custom':
			return await transcribeWithCustomAPI(audioPath, config, language)
		default:
			throw new Error(
				`Unknown transcription service type: ${serviceType}. Only 'openai' and 'custom' are supported.`
			)
	}
}

/**
 * Transcribe audio using OpenAI Whisper API
 */
async function transcribeWithOpenAI(
	audioPath: string,
	options: TranscriptionConfig,
	language: string | null = null
): Promise<string> {
	const { apiKey } = options

	if (!apiKey) {
		throw new Error('OpenAI API key is required')
	}

	console.log('🔄 OpenAI Whisper API request:')
	console.log('   Model: whisper-1 (fixed for OpenAI)')
	console.log('   Language:', language || 'auto-detect')
	console.log('   Response format: verbose_json (with segments)')

	const formData = new FormData()
	formData.append('file', fs.createReadStream(audioPath))
	formData.append('model', 'whisper-1')
	formData.append('response_format', 'verbose_json') // Request segments data

	if (language && language !== 'auto') {
		formData.append('language', language)
	}

	try {
		const response = await axios.post('https://api.openai.com/v1/audio/transcriptions', formData, {
			headers: {
				Authorization: `Bearer ${apiKey}`,
				...formData.getHeaders()
			}
		})

		const { segments, text }: TranscriptionResponse = response.data

		if (segments && segments.length > 0) {
			const formattedTranscription = formatSegmentsToMarkdown(segments)
			console.log(
				'✅ OpenAI transcription completed with',
				segments.length,
				'segments, total length:',
				formattedTranscription.length,
				'characters'
			)
			return formattedTranscription
		} else {
			// Fallback to plain text if segments not available
			console.log('⚠️ No segments data available, using plain text')
			console.log('✅ OpenAI transcription completed, length:', text.length, 'characters')
			return text
		}
	} catch (error: any) {
		console.error('❌ OpenAI transcription error:', error.response?.data || error.message)
		throw new Error(`Failed to transcribe with OpenAI: ${error.message}`)
	}
}

/**
 * Transcribe audio using custom OpenAI-compatible API
 */
async function transcribeWithCustomAPI(
	audioPath: string,
	options: TranscriptionConfig,
	language: string | null = null
): Promise<string> {
	const { apiKey, host, whisperModel = 'whisper-1' } = options

	if (!host) {
		throw new Error('Custom API endpoint URL is required')
	}

	console.log('🔄 Custom API Whisper request:')
	console.log('   Host:', host)
	console.log('   Model:', whisperModel)
	console.log('   Language:', language || 'auto-detect')
	console.log('   Response format: verbose_json (with segments)')
	console.log('   API Key:', apiKey ? '[PRESENT]' : '[NOT SET]')

	const formData = new FormData()
	formData.append('file', fs.createReadStream(audioPath))
	formData.append('model', whisperModel)
	formData.append('response_format', 'verbose_json') // Request segments data

	if (language && language !== 'auto') {
		formData.append('language', language)
	}

	const headers: any = {
		...formData.getHeaders()
	}

	if (apiKey) {
		headers['Authorization'] = `Bearer ${apiKey}`
	}

	try {
		// Ensure the URL ends with the correct endpoint
		const endpoint = host.endsWith('/audio/transcriptions')
			? host
			: `${host.replace(/\/$/, '')}/v1/audio/transcriptions`

		console.log('📡 Sending request to:', endpoint)

		const response = await axios.post(endpoint, formData, { headers })

		const { segments, text }: TranscriptionResponse = response.data

		if (segments && segments.length > 0) {
			const formattedTranscription = formatSegmentsToMarkdown(segments)
			console.log(
				'✅ Custom API transcription completed with',
				segments.length,
				'segments, total length:',
				formattedTranscription.length,
				'characters'
			)
			return formattedTranscription
		} else {
			// Fallback to plain text if segments not available
			console.log('⚠️ No segments data available, using plain text')
			console.log('✅ Custom API transcription completed, length:', text.length, 'characters')
			return text
		}
	} catch (error: any) {
		console.error('❌ Custom API transcription error:', error.response?.data || error.message)
		throw new Error(`Failed to transcribe with custom API: ${error.message}`)
	}
}
