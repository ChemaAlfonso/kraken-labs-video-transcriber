import axios from 'axios'

interface AIConfig {
	apiKey: string
	model: string
	host?: string
	temperature?: number
}

interface GenerationRequest {
	userPrompt: string
	transcription: string
	systemPrompt: string
	language: string
}

interface GenerationResult {
	index: string
}

/**
 * Generate content using AI service
 */
export async function generateIndex(
	request: GenerationRequest,
	serviceType: string,
	config: AIConfig
): Promise<GenerationResult> {
	console.log('🤖 AI Content Generation request:')
	console.log('   Service Type:', serviceType)
	console.log('   Language:', request.language)
	console.log('   Model:', config.model)
	console.log('   System prompt length:', request.systemPrompt.length)
	console.log('   User prompt length:', request.userPrompt.length)
	console.log('   Transcription length:', request.transcription.length)

	switch (serviceType) {
		case 'openai':
			return await generateWithOpenAI(request, config)
		case 'custom':
			return await generateWithCustomAPI(request, config)
		default:
			throw new Error(`Unknown AI service type: ${serviceType}. Only 'openai' and 'custom' are supported.`)
	}
}

/**
 * Regenerate content using AI service
 */
export async function regenerateIndex(
	request: GenerationRequest,
	serviceType: string,
	config: AIConfig
): Promise<GenerationResult> {
	console.log('🔄 AI Content Regeneration request:')
	console.log('   Service Type:', serviceType)
	console.log('   Language:', request.language)
	console.log('   Model:', config.model)

	// For regeneration, we use the same logic as generation
	return await generateIndex(request, serviceType, config)
}

/**
 * Generate content using OpenAI API
 */
async function generateWithOpenAI(request: GenerationRequest, config: AIConfig): Promise<GenerationResult> {
	const { apiKey, model, temperature = 1 } = config

	if (!apiKey) {
		throw new Error('OpenAI API key is required')
	}

	const prompt = request.userPrompt.replace('{transcription}', request.transcription)

	const requestData = {
		model: model,
		messages: [
			{
				role: 'system',
				content: request.systemPrompt
			},
			{
				role: 'user',
				content: prompt
			}
		],
		temperature: temperature,
		max_tokens: 4000
	}

	try {
		console.log('📡 Sending request to OpenAI API...')
		const response = await axios.post('https://api.openai.com/v1/chat/completions', requestData, {
			headers: {
				Authorization: `Bearer ${apiKey}`,
				'Content-Type': 'application/json'
			}
		})

		const result = response.data.choices[0].message.content
		console.log('✅ OpenAI content generation completed, length:', result.length, 'characters')

		return {
			index: result
		}
	} catch (error: any) {
		console.error('❌ OpenAI content generation error:', error.response?.data || error.message)
		throw new Error(`Failed to generate content with OpenAI: ${error.message}`)
	}
}

/**
 * Generate content using custom OpenAI-compatible API
 */
async function generateWithCustomAPI(request: GenerationRequest, config: AIConfig): Promise<GenerationResult> {
	const { apiKey, model, host, temperature = 1 } = config

	if (!host) {
		throw new Error('Custom API endpoint URL is required')
	}

	const prompt = request.userPrompt.replace('{transcription}', request.transcription)

	const requestData = {
		model: model,
		messages: [
			{
				role: 'system',
				content: request.systemPrompt
			},
			{
				role: 'user',
				content: prompt
			}
		],
		temperature: temperature,
		max_tokens: 4000
	}

	const headers: any = {
		'Content-Type': 'application/json'
	}

	if (apiKey) {
		headers['Authorization'] = `Bearer ${apiKey}`
	}

	try {
		// Ensure the URL ends with the correct endpoint
		const endpoint = host.endsWith('/chat/completions') ? host : `${host.replace(/\/$/, '')}/v1/chat/completions`

		console.log('📡 Sending request to custom API:', endpoint)
		const response = await axios.post(endpoint, requestData, { headers })

		const result = response.data.choices[0].message.content
		console.log('✅ Custom API content generation completed, length:', result.length, 'characters')

		return {
			index: result
		}
	} catch (error: any) {
		console.error('❌ Custom API content generation error:', error.response?.data || error.message)
		throw new Error(`Failed to generate content with custom API: ${error.message}`)
	}
}
