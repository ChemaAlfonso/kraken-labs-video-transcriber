import { ref, computed } from 'vue'

export interface SystemPrompt {
	id?: number
	name: string
	content: string
	is_default: boolean
	created_at: string
}

export interface UserPrompt {
	id?: number
	name: string
	content: string
	is_default: boolean
	created_at: string
}

export function usePrompts() {
	const systemPrompts = ref<SystemPrompt[]>([])
	const userPrompts = ref<UserPrompt[]>([])
	const selectedSystemPromptId = ref<number | null>(null)
	const selectedUserPromptId = ref<number | null>(null)
	const isLoading = ref(false)
	const error = ref('')

	// Load all prompts from the database
	const loadPrompts = async () => {
		isLoading.value = true
		error.value = ''

		try {
			const [systemData, userData, selectedSystemId, selectedUserId] = await Promise.all([
				window.electronAPI.getSystemPrompts(),
				window.electronAPI.getUserPrompts(),
				window.electronAPI.getSelectedSystemPromptId(),
				window.electronAPI.getSelectedUserPromptId()
			])

			systemPrompts.value = systemData
			userPrompts.value = userData
			selectedSystemPromptId.value = selectedSystemId
			selectedUserPromptId.value = selectedUserId
		} catch (err: any) {
			error.value = err.message || 'Failed to load prompts'
			console.error('Error loading prompts:', err)
		} finally {
			isLoading.value = false
		}
	}

	// Get selected system prompt content
	const getSelectedSystemPromptContent = computed(() => {
		if (!selectedSystemPromptId.value) return ''
		const prompt = systemPrompts.value.find(p => p.id === selectedSystemPromptId.value)
		return prompt ? prompt.content : ''
	})

	// Get selected user prompt content
	const getSelectedUserPromptContent = computed(() => {
		if (!selectedUserPromptId.value) return ''
		const prompt = userPrompts.value.find(p => p.id === selectedUserPromptId.value)
		return prompt ? prompt.content : ''
	})

	// System prompt operations
	const createSystemPrompt = async (prompt: { name: string; content: string; is_default?: boolean }) => {
		try {
			const result = await window.electronAPI.saveSystemPrompt({
				name: prompt.name,
				content: prompt.content,
				is_default: prompt.is_default || false
			})

			if (result.success) {
				await loadPrompts() // Reload to get updated data
				return result.prompt
			} else {
				throw new Error('Failed to save system prompt')
			}
		} catch (err: any) {
			error.value = err.message || 'Failed to create system prompt'
			throw err
		}
	}

	const updateSystemPrompt = async (
		id: number,
		updates: { name?: string; content?: string; is_default?: boolean }
	) => {
		try {
			const result = await window.electronAPI.updateSystemPrompt(id, updates)

			if (result.success) {
				await loadPrompts() // Reload to get updated data
			} else {
				throw new Error('Failed to update system prompt')
			}
		} catch (err: any) {
			error.value = err.message || 'Failed to update system prompt'
			throw err
		}
	}

	const deleteSystemPrompt = async (id: number) => {
		try {
			const result = await window.electronAPI.deleteSystemPrompt(id)

			if (result.success) {
				await loadPrompts() // Reload to get updated data
			} else {
				throw new Error('Failed to delete system prompt')
			}
		} catch (err: any) {
			error.value = err.message || 'Failed to delete system prompt'
			throw err
		}
	}

	const setSelectedSystemPrompt = async (id: number) => {
		try {
			const result = await window.electronAPI.setSelectedSystemPrompt(id)

			if (result.success) {
				selectedSystemPromptId.value = id
			} else {
				throw new Error('Failed to set selected system prompt')
			}
		} catch (err: any) {
			error.value = err.message || 'Failed to set selected system prompt'
			throw err
		}
	}

	// User prompt operations
	const createUserPrompt = async (prompt: { name: string; content: string; is_default?: boolean }) => {
		try {
			const result = await window.electronAPI.saveUserPrompt({
				name: prompt.name,
				content: prompt.content,
				is_default: prompt.is_default || false
			})

			if (result.success) {
				await loadPrompts() // Reload to get updated data
				return result.prompt
			} else {
				throw new Error('Failed to save user prompt')
			}
		} catch (err: any) {
			error.value = err.message || 'Failed to create user prompt'
			throw err
		}
	}

	const updateUserPrompt = async (id: number, updates: { name?: string; content?: string; is_default?: boolean }) => {
		try {
			const result = await window.electronAPI.updateUserPrompt(id, updates)

			if (result.success) {
				await loadPrompts() // Reload to get updated data
			} else {
				throw new Error('Failed to update user prompt')
			}
		} catch (err: any) {
			error.value = err.message || 'Failed to update user prompt'
			throw err
		}
	}

	const deleteUserPrompt = async (id: number) => {
		try {
			const result = await window.electronAPI.deleteUserPrompt(id)

			if (result.success) {
				await loadPrompts() // Reload to get updated data
			} else {
				throw new Error('Failed to delete user prompt')
			}
		} catch (err: any) {
			error.value = err.message || 'Failed to delete user prompt'
			throw err
		}
	}

	const setSelectedUserPrompt = async (id: number) => {
		try {
			const result = await window.electronAPI.setSelectedUserPrompt(id)

			if (result.success) {
				selectedUserPromptId.value = id
			} else {
				throw new Error('Failed to set selected user prompt')
			}
		} catch (err: any) {
			error.value = err.message || 'Failed to set selected user prompt'
			throw err
		}
	}

	return {
		// State
		systemPrompts,
		userPrompts,
		selectedSystemPromptId,
		selectedUserPromptId,
		isLoading,
		error,

		// Computed
		getSelectedSystemPromptContent,
		getSelectedUserPromptContent,

		// Methods
		loadPrompts,

		// System prompt methods
		createSystemPrompt,
		updateSystemPrompt,
		deleteSystemPrompt,
		setSelectedSystemPrompt,

		// User prompt methods
		createUserPrompt,
		updateUserPrompt,
		deleteUserPrompt,
		setSelectedUserPrompt
	}
}
