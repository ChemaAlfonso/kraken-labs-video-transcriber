const axios = require('axios')
const FormData = require('form-data')
const fs = require('fs')

/**
 * Format segments data into markdown with timestamps
 * @param {Array} segments Array of segment objects with start, end, and text properties
 * @returns {string} Formatted markdown transcription with timestamps
 */
function formatSegmentsToMarkdown(segments) {
	if (!segments || !Array.isArray(segments)) {
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
 * @param {number} seconds Time in seconds
 * @returns {string} Formatted timestamp
 */
function formatTimestamp(seconds) {
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
 * @param {string} audioPath Path to the audio file
 * @param {string} serviceType Service type (should be 'openai' or 'custom')
 * @param {Object} config Configuration options
 * @param {string} language Language code (optional)
 * @returns {Promise<string>} Timestamped transcription in markdown format
 */
async function transcribe(audioPath, serviceType, config, language = null) {
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
 * @param {string} audioPath Path to the audio file
 * @param {Object} options Transcription options
 * @param {string} language Language code (optional)
 * @returns {Promise<string>} Timestamped transcription in markdown format
 */
async function transcribeWithOpenAI(audioPath, options, language = null) {
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

		const { segments, text } = response.data

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
	} catch (error) {
		console.error('❌ OpenAI transcription error:', error.response?.data || error.message)
		throw new Error(`Failed to transcribe with OpenAI: ${error.message}`)
	}
}

/**
 * Transcribe audio using custom OpenAI-compatible API
 * @param {string} audioPath Path to the audio file
 * @param {Object} options Transcription options
 * @param {string} language Language code (optional)
 * @returns {Promise<string>} Timestamped transcription in markdown format
 */
async function transcribeWithCustomAPI(audioPath, options, language = null) {
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

	const headers = {
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

		const { segments, text } = response.data

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
	} catch (error) {
		console.error('❌ Custom API transcription error:', error.response?.data || error.message)
		throw new Error(`Failed to transcribe with custom API: ${error.message}`)
	}
}

module.exports = {
	transcribe,
	transcribeWithOpenAI,
	transcribeWithCustomAPI
}
