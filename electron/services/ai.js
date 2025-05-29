const axios = require('axios')

/**
 * Generate content index using AI service
 * @param {Object} request The request containing transcription, userPrompt, systemPrompt, and language
 * @param {string} serviceType Service type (should be 'openai' or 'custom')
 * @param {Object} config Configuration options
 * @returns {Promise<Object>} Generated index
 */
async function generateIndex(request, serviceType, config) {
	console.log('🤖 AI Generation request details:')
	console.log('   Service Type:', serviceType)
	console.log('   System Prompt length:', request.systemPrompt?.length || 0, 'characters')
	console.log('   User Prompt length:', request.userPrompt?.length || 0, 'characters')
	console.log('   Transcription length:', request.transcription?.length || 0, 'characters')
	console.log('   Language:', request.language || 'auto-detect')
	console.log('   Config:', {
		apiKey: config.apiKey ? '[PRESENT]' : '[MISSING]',
		host: config.host || '[NOT SET]',
		model: config.model || '[NOT SET]',
		temperature: config.temperature ?? '[NOT SET]',
		whisperModel: config.whisperModel || '[NOT SET]'
	})

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
 * Regenerate content index using AI service with formatting consistency
 * @param {Object} request The request containing transcription, userPrompt, systemPrompt, and language
 * @param {string} serviceType Service type (should be 'openai' or 'custom')
 * @param {Object} config Configuration options
 * @returns {Promise<Object>} Generated index
 */
async function regenerateIndex(request, serviceType, config) {
	console.log('🔄 AI Regeneration request details:')
	console.log('   Service Type:', serviceType)
	console.log('   System Prompt length:', request.systemPrompt?.length || 0, 'characters')
	console.log('   User Prompt length:', request.userPrompt?.length || 0, 'characters')
	console.log('   Transcription length:', request.transcription?.length || 0, 'characters')
	console.log('   Language:', request.language || 'auto-detect')
	console.log('   Config:', {
		apiKey: config.apiKey ? '[PRESENT]' : '[MISSING]',
		host: config.host || '[NOT SET]',
		model: config.model || '[NOT SET]',
		temperature: config.temperature ?? '[NOT SET]',
		whisperModel: config.whisperModel || '[NOT SET]'
	})

	// For regeneration, simply use the original generateIndex function
	// The system prompt should handle all formatting consistency
	console.log('   ✅ Using original generateIndex function for consistency')
	return await generateIndex(request, serviceType, config)
}

/**
 * Add language enforcement to system prompt
 * @param {string} systemPrompt The original system prompt
 * @param {string} language The target language
 * @returns {string} Enhanced system prompt with language enforcement
 */
function enhanceSystemPromptWithLanguage(systemPrompt, language) {
	if (!language || language === 'auto') {
		return systemPrompt
	}

	const languageNames = {
		es: 'Spanish',
		en: 'English',
		fr: 'French',
		de: 'German',
		it: 'Italian',
		pt: 'Portuguese'
	}

	const languageName = languageNames[language] || language
	const languageInstruction = `\n\nIMPORTANT: You must respond ONLY in ${languageName}, regardless of the language used in the user prompt or transcription. Always use ${languageName} for your response.`

	console.log(`🌐 Language enforcement added: Respond in ${languageName}`)
	return systemPrompt + languageInstruction
}

/**
 * Process user prompt to handle {transcription} placeholder
 * @param {string} userPrompt The user's prompt
 * @param {string} transcription The transcription text
 * @returns {string} Processed user prompt
 */
function processUserPrompt(userPrompt, transcription) {
	console.log('📝 Processing user prompt:')
	console.log('   Original user prompt:', userPrompt.substring(0, 200) + (userPrompt.length > 200 ? '...' : ''))

	let processedPrompt
	// Check if the user prompt contains the {transcription} placeholder
	if (userPrompt.includes('{transcription}')) {
		// Replace the placeholder with the actual transcription
		processedPrompt = userPrompt.replace('{transcription}', transcription)
		console.log('   ✅ Replaced {transcription} placeholder')
	} else {
		// If no placeholder, append the transcription at the end
		processedPrompt = `${userPrompt}\n\nTranscription:\n${transcription}`
		console.log('   ✅ Appended transcription at the end')
	}

	console.log('   Final prompt length:', processedPrompt.length, 'characters')
	return processedPrompt
}

/**
 * Generate a content index using OpenAI API
 * @param {Object} request The request containing transcription, userPrompt, systemPrompt, and language
 * @param {Object} options Options for generation
 * @returns {Promise<Object>} Generated index
 */
async function generateWithOpenAI(request, options) {
	const { apiKey, model = 'gpt-4-turbo', temperature = 1 } = options
	const { userPrompt, transcription, systemPrompt, language } = request

	if (!apiKey) {
		throw new Error('OpenAI API key is required')
	}

	// Process the user prompt to handle {transcription} placeholder
	const processedUserPrompt = processUserPrompt(userPrompt, transcription)

	// Enhance system prompt with language enforcement
	const enhancedSystemPrompt = enhanceSystemPromptWithLanguage(systemPrompt, language)

	console.log('🔄 OpenAI API request:')
	console.log('   Model:', model)
	console.log('   Temperature:', temperature)
	console.log('   Original system prompt length:', systemPrompt.length, 'characters')
	console.log('   Enhanced system prompt length:', enhancedSystemPrompt.length, 'characters')
	console.log('   Processed user prompt length:', processedUserPrompt.length, 'characters')

	try {
		const response = await axios.post(
			'https://api.openai.com/v1/chat/completions',
			{
				model,
				messages: [
					{
						role: 'system',
						content: enhancedSystemPrompt
					},
					{
						role: 'user',
						content: processedUserPrompt
					}
				],
				temperature
			},
			{
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${apiKey}`
				}
			}
		)

		const generatedContent = response.data.choices[0].message.content
		console.log('✅ OpenAI generation completed, response length:', generatedContent.length, 'characters')

		return {
			index: generatedContent
		}
	} catch (error) {
		console.error('❌ OpenAI generation error:', error.response?.data || error.message)

		// Provide user-friendly error messages for common issues
		if (error.response?.status === 403) {
			const errorMessage = error.response?.data?.error?.message || ''

			if (errorMessage.includes('does not have access to model')) {
				const modelMatch = errorMessage.match(/model `([^`]+)`/)
				const model = modelMatch ? modelMatch[1] : 'the selected model'
				throw new Error(`Your OpenAI API key doesn't have access to ${model}. Please either:
• Change to a different model (like gpt-3.5-turbo or gpt-4o-mini) in the Configuration page
• Upgrade your OpenAI plan to access this model
• Contact OpenAI support if you believe this is an error`)
			}

			throw new Error(
				`OpenAI API access denied. Please check that your API key is valid and has the necessary permissions. If you just created the key, it may take a few minutes to become active.`
			)
		}

		if (error.response?.status === 401) {
			throw new Error(
				`Invalid OpenAI API key. Please check your API key in the Configuration page and make sure it's entered correctly.`
			)
		}

		if (error.response?.status === 429) {
			throw new Error(
				`OpenAI API rate limit exceeded. Please wait a moment and try again. If this persists, you may need to upgrade your OpenAI plan or reduce your usage.`
			)
		}

		if (error.response?.status === 400) {
			const errorMessage = error.response?.data?.error?.message || ''
			if (errorMessage.includes('maximum context length')) {
				throw new Error(
					`The transcription is too long for the AI model to process. Please try with a shorter video or contact support for assistance.`
				)
			}
		}

		// Generic error for other cases
		throw new Error(`Failed to generate index with OpenAI: ${error.message}`)
	}
}

/**
 * Generate a content index using a custom OpenAI-compatible API
 * @param {Object} request The request containing transcription, userPrompt, systemPrompt, and language
 * @param {Object} options Options for generation
 * @returns {Promise<Object>} Generated index
 */
async function generateWithCustomAPI(request, options) {
	const { host, apiKey, model, temperature = 1 } = options
	const { userPrompt, transcription, systemPrompt, language } = request

	if (!host) {
		throw new Error('Custom API endpoint URL is required')
	}

	// Process the user prompt to handle {transcription} placeholder
	const processedUserPrompt = processUserPrompt(userPrompt, transcription)

	// Enhance system prompt with language enforcement
	const enhancedSystemPrompt = enhanceSystemPromptWithLanguage(systemPrompt, language)

	console.log('🔄 Custom API request:')
	console.log('   Host:', host)
	console.log('   Model:', model)
	console.log('   Temperature:', temperature)
	console.log('   API Key:', apiKey ? '[PRESENT]' : '[NOT SET]')
	console.log('   Original system prompt length:', systemPrompt.length, 'characters')
	console.log('   Enhanced system prompt length:', enhancedSystemPrompt.length, 'characters')
	console.log('   Processed user prompt length:', processedUserPrompt.length, 'characters')

	try {
		const headers = {
			'Content-Type': 'application/json'
		}

		if (apiKey) {
			headers['Authorization'] = `Bearer ${apiKey}`
		}

		// Try OpenAI-compatible chat completions format first
		const chatEndpoint = host.endsWith('/chat/completions')
			? host
			: `${host.replace(/\/$/, '')}/v1/chat/completions`

		console.log('📡 Sending request to:', chatEndpoint)

		try {
			const chatResponse = await axios.post(
				chatEndpoint,
				{
					model: model || 'gpt-3.5-turbo',
					messages: [
						{
							role: 'system',
							content: enhancedSystemPrompt
						},
						{
							role: 'user',
							content: processedUserPrompt
						}
					],
					temperature
				},
				{ headers }
			)

			const generatedContent = chatResponse.data.choices[0].message.content
			console.log('✅ Custom API generation completed, response length:', generatedContent.length, 'characters')

			return {
				index: generatedContent
			}
		} catch (chatError) {
			// If chat completions fails, try a more generic format
			console.log('⚠️ Chat completions format failed, trying generic format')

			// For generic format, combine system and user prompts
			const combinedPrompt = `${enhancedSystemPrompt}\n\n${processedUserPrompt}`
			console.log('📝 Combined prompt length:', combinedPrompt.length, 'characters')

			const genericResponse = await axios.post(
				host,
				{
					model: model,
					prompt: combinedPrompt,
					temperature
				},
				{ headers }
			)

			// Try to extract the result from various possible response formats
			const result =
				genericResponse.data.choices?.[0]?.message?.content ||
				genericResponse.data.choices?.[0]?.text ||
				genericResponse.data.response ||
				genericResponse.data.result ||
				genericResponse.data.text ||
				JSON.stringify(genericResponse.data)

			console.log(
				'✅ Custom API generation (generic format) completed, response length:',
				result.length,
				'characters'
			)

			return {
				index: result
			}
		}
	} catch (error) {
		console.error('❌ Custom API generation error:', error.response?.data || error.message)

		// Provide user-friendly error messages for common issues
		if (error.response?.status === 403) {
			throw new Error(
				`Custom API access denied. Please check that your API endpoint URL and API key (if required) are correct in the Configuration page.`
			)
		}

		if (error.response?.status === 401) {
			throw new Error(
				`Invalid API key for custom endpoint. Please check your API key in the Configuration page and make sure it's entered correctly.`
			)
		}

		if (error.response?.status === 429) {
			throw new Error(
				`Custom API rate limit exceeded. Please wait a moment and try again, or contact your API provider about rate limits.`
			)
		}

		if (error.response?.status === 404) {
			throw new Error(
				`Custom API endpoint not found. Please check that your API endpoint URL is correct in the Configuration page.`
			)
		}

		if (error.response?.status === 400) {
			const errorMessage = error.response?.data?.error?.message || error.response?.data?.message || ''
			if (errorMessage.includes('maximum context length') || errorMessage.includes('too long')) {
				throw new Error(
					`The transcription is too long for the AI model to process. Please try with a shorter video or contact your API provider for assistance.`
				)
			}
		}

		// Generic error for other cases
		throw new Error(`Failed to generate index with custom API: ${error.message}`)
	}
}

module.exports = {
	generateIndex,
	regenerateIndex,
	generateWithOpenAI,
	generateWithCustomAPI,
	processUserPrompt,
	enhanceSystemPromptWithLanguage
}
