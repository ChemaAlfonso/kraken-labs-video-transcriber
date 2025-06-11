import Database from 'better-sqlite3'
import * as path from 'path'
import * as fs from 'fs'
import { app } from 'electron'

let db: Database.Database | null = null

interface ApiConfig {
	api_type: string
	apiKey: string
	model: string
	host: string
	temperature: number
	whisperModel: string
}

interface TranscriptionResult {
	id?: number
	title: string
	source: string
	date: string
	language: string
	index_content: string
	transcription: string
	prompt: string
	audio_path: string
	system_prompt?: string
}

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

export async function initialize(): Promise<Database.Database> {
	// Ensure data directory exists
	const dataDir = path.join(app.getPath('userData'), 'data')
	if (!fs.existsSync(dataDir)) {
		fs.mkdirSync(dataDir, { recursive: true })
	}

	const dbPath = path.join(dataDir, 'kraken-labs-video-transcriber.db')
	console.log('📁 Database location:', dbPath)

	// Open the database with better-sqlite3
	db = new Database(dbPath)

	// Create tables first if they don't exist
	db.exec(`
    CREATE TABLE IF NOT EXISTS generations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      source TEXT NOT NULL,
      date TEXT NOT NULL,
      language TEXT NOT NULL,
      index_content TEXT NOT NULL,
      transcription TEXT NOT NULL,
      prompt TEXT NOT NULL,
      audio_path TEXT NOT NULL,
      system_prompt TEXT
    );
    
    CREATE TABLE IF NOT EXISTS api_config (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      api_type TEXT NOT NULL UNIQUE,
      api_key TEXT NOT NULL,
      model TEXT NOT NULL,
      host TEXT NOT NULL,
      temperature REAL NOT NULL,
      whisper_model TEXT NOT NULL DEFAULT 'whisper-1'
    );
    
    CREATE TABLE IF NOT EXISTS settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT NOT NULL UNIQUE,
      value TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS system_prompts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      is_default BOOLEAN DEFAULT 0,
      created_at TEXT NOT NULL
    );
    
    CREATE TABLE IF NOT EXISTS user_prompts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      content TEXT NOT NULL,
      is_default BOOLEAN DEFAULT 0,
      created_at TEXT NOT NULL
    );
  `)

	// Now handle migrations after tables exist
	// Check if generations table exists and its schema
	const tableInfo = db.pragma('table_info(generations)') as Array<{ name: string; [key: string]: any }>
	const hasDurationField = tableInfo.some(column => column.name === 'duration')

	if (hasDurationField) {
		console.log('🔄 Migrating database schema - removing duration field...')
		// Create new table without duration field
		db.exec(`
			CREATE TABLE IF NOT EXISTS generations_new (
				id INTEGER PRIMARY KEY AUTOINCREMENT,
				title TEXT NOT NULL,
				source TEXT NOT NULL,
				date TEXT NOT NULL,
				language TEXT NOT NULL,
				index_content TEXT NOT NULL,
				transcription TEXT NOT NULL,
				prompt TEXT NOT NULL,
				audio_path TEXT NOT NULL
			);
		`)

		// Copy data from old table to new table (excluding duration)
		db.exec(`
			INSERT INTO generations_new (id, title, source, date, language, index_content, transcription, prompt, audio_path)
			SELECT id, title, source, date, language, index_content, transcription, prompt, audio_path
			FROM generations;
		`)

		// Drop old table and rename new one
		db.exec(`DROP TABLE generations;`)
		db.exec(`ALTER TABLE generations_new RENAME TO generations;`)
		console.log('✅ Database migration completed')
	}

	// Check if api_config table needs whisper_model field
	const apiConfigTableInfo = db.pragma('table_info(api_config)') as Array<{ name: string; [key: string]: any }>
	const hasWhisperModelField = apiConfigTableInfo.some(column => column.name === 'whisper_model')

	if (!hasWhisperModelField) {
		console.log('🔄 Adding whisper_model field to api_config table...')
		db.exec(`ALTER TABLE api_config ADD COLUMN whisper_model TEXT DEFAULT 'whisper-1';`)
		console.log('✅ Database schema updated with whisper_model field')
	}

	// Check if generations table needs system_prompt field
	const generationsTableInfo = db.pragma('table_info(generations)') as Array<{ name: string; [key: string]: any }>
	const hasSystemPromptField = generationsTableInfo.some(column => column.name === 'system_prompt')

	if (!hasSystemPromptField) {
		console.log('🔄 Adding system_prompt field to generations table...')
		db.exec(`ALTER TABLE generations ADD COLUMN system_prompt TEXT;`)
		console.log('✅ Database schema updated with system_prompt field')
	}

	// Initialize default prompts if tables are empty
	await initializeDefaultPrompts()

	return db
}

function getDb(): Database.Database {
	if (!db) {
		throw new Error('Database not initialized')
	}
	return db
}

// API Configuration functions
export async function saveApiConfig(apiType: string, config: Partial<ApiConfig>): Promise<void> {
	const database = getDb()
	const stmt = database.prepare(
		`INSERT OR REPLACE INTO api_config (api_type, api_key, model, host, temperature, whisper_model) 
     VALUES (?, ?, ?, ?, ?, ?)`
	)
	stmt.run(
		apiType,
		config.apiKey || '',
		config.model || '',
		config.host || '',
		config.temperature ?? 1,
		config.whisperModel || 'whisper-1'
	)
}

export async function getApiConfig(apiType: string): Promise<ApiConfig> {
	const database = getDb()
	const stmt = database.prepare('SELECT * FROM api_config WHERE api_type = ?')
	const result = stmt.get(apiType) as any
	if (result) {
		// Map database field names to service field names
		return {
			api_type: result.api_type,
			apiKey: result.api_key,
			model: result.model,
			host: result.host,
			temperature: result.temperature,
			whisperModel: result.whisper_model
		}
	}
	return {
		api_type: apiType,
		apiKey: '',
		model: apiType === 'openai' ? 'gpt-4o-mini' : 'gpt-4o-mini',
		host: '',
		temperature: 1,
		whisperModel: 'whisper-1'
	}
}

// Settings functions
export async function setSetting(key: string, value: string): Promise<void> {
	const database = getDb()
	const stmt = database.prepare(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`)
	stmt.run(key, value)
}

export async function getSetting(key: string, defaultValue: string | null = null): Promise<string | null> {
	const database = getDb()
	const stmt = database.prepare('SELECT value FROM settings WHERE key = ?')
	const result = stmt.get(key) as any
	return result ? result.value : defaultValue
}

// Legacy system prompt functions - replaced by new multi-prompt system

// Transcription results functions
export async function saveTranscriptionResult(data: Omit<TranscriptionResult, 'id'>): Promise<TranscriptionResult> {
	const database = getDb()
	const stmt = database.prepare(
		`INSERT INTO generations (title, source, date, language, index_content, transcription, prompt, audio_path, system_prompt)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
	)
	const result = stmt.run(
		data.title,
		data.source,
		data.date,
		data.language,
		data.index_content,
		data.transcription,
		data.prompt,
		data.audio_path,
		data.system_prompt || null
	)

	return {
		id: Number(result.lastInsertRowid),
		...data
	}
}

export async function getTranscriptionResults(): Promise<TranscriptionResult[]> {
	const database = getDb()
	const stmt = database.prepare('SELECT * FROM generations ORDER BY id DESC')
	return stmt.all() as TranscriptionResult[]
}

export async function deleteTranscriptionResult(id: number): Promise<void> {
	const database = getDb()
	const stmt = database.prepare('DELETE FROM generations WHERE id = ?')
	stmt.run(id)
}

export async function updateTranscriptionResult(id: number, updates: Partial<TranscriptionResult>): Promise<void> {
	const database = getDb()
	const fields = Object.keys(updates)
		.map(key => `${key} = ?`)
		.join(', ')
	const values = Object.values(updates)

	const stmt = database.prepare(`UPDATE generations SET ${fields} WHERE id = ?`)
	stmt.run(...values, id)
}

// Initialize default prompts if they don't exist
async function initializeDefaultPrompts(): Promise<void> {
	const database = getDb()

	// Check if we have any system prompts
	const systemPromptCount = database.prepare('SELECT COUNT(*) as count FROM system_prompts').get() as {
		count: number
	}

	if (systemPromptCount.count === 0) {
		console.log('🔄 Creating default system prompt...')

		// Get existing system prompt from settings or use default
		const existingSystemPrompt = await getSetting('systemPrompt', null)
		const defaultSystemPromptContent =
			existingSystemPrompt ||
			`You are an expert in generating summaries and timestamped indexes based on transcripts of video sessions.

The sessions are divided into segments with real timestamps (in seconds), in this format:

**[01:30 - 01:32]** Que por supuesto, pues, se acepta

Your task is to generate a **short summary**, a **keyword list**, and a **precise thematic index** of the content.

### Timestamps:

- Each index entry must include the **exact starting timestamp** (hh:mm:ss) of when the topic actually begins.
- When grouping segments, always use the timestamp of the **first segment** that starts the topic.
- Ensure all timestamps are properly formatted (hh:mm:ss, zero-padded).
- DO NOT add brackets around timestamps in your output - use simple time notation like 00:05:30

### Grouping rules:

- **Do not group segments just because the same speaker continues.**
- Only group segments into one index entry if they are **clearly on the same topic** (e.g., an explanation follows a question).
- **If the subject matter shifts**, even slightly, create a **new index entry**, even if it's the same person speaking.
- **Err on the side of splitting too much rather than grouping too broadly.** Clarity is more important than brevity.

### Coverage requirement:

- The index must be as **comprehensive** as possible.
- MUST include every topic discussed in the session.
- If a segment is not thematically connected to an adjacent one, it needs its own entry.

### Response format:

Do not include any preamble or introduction. Start directly with the content organized as follows:

## Summary
[Brief paragraph describing the main topics and purpose of the session]

## Keywords
[Comma-separated list of relevant keywords and technical terms]

## Detailed Index

[Detailed timestamped breakdown of every topic discussed, with timestamps linking to thematic content, not just speaker changes]

### Topic Structure:
- **00:05:30 - [Topic title]**: Brief description of what is discussed
- **00:08:45 - [Next topic title]**: Brief description of what is discussed
- etc.

Remember: Be thorough, precise with timestamps, and prioritize content clarity over brevity.`

		const stmt = database.prepare(`
			INSERT INTO system_prompts (name, content, is_default, created_at)
			VALUES (?, ?, ?, ?)
		`)
		stmt.run('Default System Prompt', defaultSystemPromptContent, 1, new Date().toISOString())
		console.log('✅ Default system prompt created')
	}

	// Check if we have any user prompts
	const userPromptCount = database.prepare('SELECT COUNT(*) as count FROM user_prompts').get() as { count: number }

	if (userPromptCount.count === 0) {
		console.log('🔄 Creating default user prompt...')

		// Get existing user prompt from settings or use default
		const existingUserPrompt = await getSetting('userPrompt', null)
		const defaultUserPromptContent =
			existingUserPrompt ||
			'Create a detailed table of contents for this content with timestamps, highlighting the main topics and subtopics discussed. Use the transcription below:\n\n{transcription}'

		const stmt = database.prepare(`
			INSERT INTO user_prompts (name, content, is_default, created_at)
			VALUES (?, ?, ?, ?)
		`)
		stmt.run('Default User Prompt', defaultUserPromptContent, 1, new Date().toISOString())
		console.log('✅ Default user prompt created')
	}
}

// System prompt management functions
export async function getSystemPrompts(): Promise<SystemPrompt[]> {
	const database = getDb()
	const stmt = database.prepare('SELECT * FROM system_prompts ORDER BY is_default DESC, created_at DESC')
	return stmt.all() as SystemPrompt[]
}

export async function getSystemPrompt(id?: number): Promise<string> {
	const database = getDb()

	if (id) {
		// Get specific system prompt by ID
		const stmt = database.prepare('SELECT content FROM system_prompts WHERE id = ?')
		const result = stmt.get(id) as { content: string } | undefined
		if (result) {
			return result.content
		}
	}

	// Get currently selected system prompt from settings
	const selectedId = await getSetting('selectedSystemPromptId', null)
	if (selectedId) {
		const stmt = database.prepare('SELECT content FROM system_prompts WHERE id = ?')
		const result = stmt.get(parseInt(selectedId)) as { content: string } | undefined
		if (result) {
			return result.content
		}
	}

	// Get default system prompt
	const stmt = database.prepare('SELECT content FROM system_prompts WHERE is_default = 1 LIMIT 1')
	const result = stmt.get() as { content: string } | undefined

	if (result) {
		return result.content
	}

	// Legacy fallback to old system prompt setting
	const legacyPrompt = await getSetting('systemPrompt', null)
	if (legacyPrompt) {
		return legacyPrompt
	}

	// Ultimate fallback
	return 'You are an assistant that creates detailed and accurate content analysis from transcriptions. Focus on creating clear, organized, and helpful content that helps users quickly understand and navigate the source material.'
}

export async function saveSystemPrompt(prompt: Omit<SystemPrompt, 'id' | 'created_at'>): Promise<SystemPrompt> {
	const database = getDb()

	// If this is being set as default, remove default from others
	if (prompt.is_default) {
		database.prepare('UPDATE system_prompts SET is_default = 0').run()
	}

	const stmt = database.prepare(`
		INSERT INTO system_prompts (name, content, is_default, created_at)
		VALUES (?, ?, ?, ?)
	`)
	const result = stmt.run(prompt.name, prompt.content, prompt.is_default ? 1 : 0, new Date().toISOString())

	return {
		id: Number(result.lastInsertRowid),
		...prompt,
		created_at: new Date().toISOString()
	}
}

export async function updateSystemPrompt(
	id: number,
	updates: Partial<Omit<SystemPrompt, 'id' | 'created_at'>>
): Promise<void> {
	const database = getDb()

	// If this is being set as default, remove default from others
	if (updates.is_default) {
		database.prepare('UPDATE system_prompts SET is_default = 0').run()
	}

	const fields = Object.keys(updates)
		.map(key => `${key} = ?`)
		.join(', ')
	const values = Object.values(updates).map(value => (typeof value === 'boolean' ? (value ? 1 : 0) : value))

	const stmt = database.prepare(`UPDATE system_prompts SET ${fields} WHERE id = ?`)
	stmt.run(...values, id)
}

export async function deleteSystemPrompt(id: number): Promise<void> {
	const database = getDb()

	// Don't allow deleting if it's the only system prompt
	const count = database.prepare('SELECT COUNT(*) as count FROM system_prompts').get() as { count: number }
	if (count.count <= 1) {
		throw new Error('Cannot delete the last system prompt')
	}

	// Check if this is the currently selected prompt
	const selectedId = await getSetting('selectedSystemPromptId', null)
	if (selectedId && parseInt(selectedId) === id) {
		// Select the default prompt instead
		const defaultPrompt = database.prepare('SELECT id FROM system_prompts WHERE is_default = 1 LIMIT 1').get() as
			| { id: number }
			| undefined
		if (defaultPrompt) {
			await setSetting('selectedSystemPromptId', defaultPrompt.id.toString())
		} else {
			// If no default, select the first available
			const firstPrompt = database.prepare('SELECT id FROM system_prompts WHERE id != ? LIMIT 1').get(id) as
				| { id: number }
				| undefined
			if (firstPrompt) {
				await setSetting('selectedSystemPromptId', firstPrompt.id.toString())
			}
		}
	}

	const stmt = database.prepare('DELETE FROM system_prompts WHERE id = ?')
	stmt.run(id)
}

export async function setSelectedSystemPrompt(id: number): Promise<void> {
	await setSetting('selectedSystemPromptId', id.toString())
}

export async function getSelectedSystemPromptId(): Promise<number | null> {
	const selectedId = await getSetting('selectedSystemPromptId', null)
	if (selectedId) {
		return parseInt(selectedId)
	}

	// Return default system prompt ID if no selection
	const database = getDb()
	const defaultPrompt = database.prepare('SELECT id FROM system_prompts WHERE is_default = 1 LIMIT 1').get() as
		| { id: number }
		| undefined
	return defaultPrompt ? defaultPrompt.id : null
}

// User prompt management functions
export async function getUserPrompts(): Promise<UserPrompt[]> {
	const database = getDb()
	const stmt = database.prepare('SELECT * FROM user_prompts ORDER BY is_default DESC, created_at DESC')
	return stmt.all() as UserPrompt[]
}

export async function getUserPrompt(id?: number): Promise<string> {
	const database = getDb()

	if (id) {
		// Get specific user prompt by ID
		const stmt = database.prepare('SELECT content FROM user_prompts WHERE id = ?')
		const result = stmt.get(id) as { content: string } | undefined
		if (result) {
			return result.content
		}
	}

	// Get currently selected user prompt from settings
	const selectedId = await getSetting('selectedUserPromptId', null)
	if (selectedId) {
		const stmt = database.prepare('SELECT content FROM user_prompts WHERE id = ?')
		const result = stmt.get(parseInt(selectedId)) as { content: string } | undefined
		if (result) {
			return result.content
		}
	}

	// Get default user prompt
	const stmt = database.prepare('SELECT content FROM user_prompts WHERE is_default = 1 LIMIT 1')
	const result = stmt.get() as { content: string } | undefined

	if (result) {
		return result.content
	}

	// Legacy fallback to old user prompt setting
	const legacyPrompt = await getSetting('userPrompt', null)
	if (legacyPrompt) {
		return legacyPrompt
	}

	// Ultimate fallback
	return 'Create a detailed table of contents for this content with timestamps, highlighting the main topics and subtopics discussed. Use the transcription below:\n\n{transcription}'
}

export async function saveUserPrompt(prompt: Omit<UserPrompt, 'id' | 'created_at'>): Promise<UserPrompt> {
	const database = getDb()

	// If this is being set as default, remove default from others
	if (prompt.is_default) {
		database.prepare('UPDATE user_prompts SET is_default = 0').run()
	}

	const stmt = database.prepare(`
		INSERT INTO user_prompts (name, content, is_default, created_at)
		VALUES (?, ?, ?, ?)
	`)
	const result = stmt.run(prompt.name, prompt.content, prompt.is_default ? 1 : 0, new Date().toISOString())

	return {
		id: Number(result.lastInsertRowid),
		...prompt,
		created_at: new Date().toISOString()
	}
}

export async function updateUserPrompt(
	id: number,
	updates: Partial<Omit<UserPrompt, 'id' | 'created_at'>>
): Promise<void> {
	const database = getDb()

	// If this is being set as default, remove default from others
	if (updates.is_default) {
		database.prepare('UPDATE user_prompts SET is_default = 0').run()
	}

	const fields = Object.keys(updates)
		.map(key => `${key} = ?`)
		.join(', ')
	const values = Object.values(updates).map(value => (typeof value === 'boolean' ? (value ? 1 : 0) : value))

	const stmt = database.prepare(`UPDATE user_prompts SET ${fields} WHERE id = ?`)
	stmt.run(...values, id)
}

export async function deleteUserPrompt(id: number): Promise<void> {
	const database = getDb()

	// Don't allow deleting if it's the only user prompt
	const count = database.prepare('SELECT COUNT(*) as count FROM user_prompts').get() as { count: number }
	if (count.count <= 1) {
		throw new Error('Cannot delete the last user prompt')
	}

	// Check if this is the currently selected prompt
	const selectedId = await getSetting('selectedUserPromptId', null)
	if (selectedId && parseInt(selectedId) === id) {
		// Select the default prompt instead
		const defaultPrompt = database.prepare('SELECT id FROM user_prompts WHERE is_default = 1 LIMIT 1').get() as
			| { id: number }
			| undefined
		if (defaultPrompt) {
			await setSetting('selectedUserPromptId', defaultPrompt.id.toString())
		} else {
			// If no default, select the first available
			const firstPrompt = database.prepare('SELECT id FROM user_prompts WHERE id != ? LIMIT 1').get(id) as
				| { id: number }
				| undefined
			if (firstPrompt) {
				await setSetting('selectedUserPromptId', firstPrompt.id.toString())
			}
		}
	}

	const stmt = database.prepare('DELETE FROM user_prompts WHERE id = ?')
	stmt.run(id)
}

export async function setSelectedUserPrompt(id: number): Promise<void> {
	await setSetting('selectedUserPromptId', id.toString())
}

export async function getSelectedUserPromptId(): Promise<number | null> {
	const selectedId = await getSetting('selectedUserPromptId', null)
	if (selectedId) {
		return parseInt(selectedId)
	}

	// Return default user prompt ID if no selection
	const database = getDb()
	const defaultPrompt = database.prepare('SELECT id FROM user_prompts WHERE is_default = 1 LIMIT 1').get() as
		| { id: number }
		| undefined
	return defaultPrompt ? defaultPrompt.id : null
}

// Legacy functions for backward compatibility
export async function setSystemPrompt(prompt: string): Promise<void> {
	// Update the default system prompt instead of using settings
	const database = getDb()
	const defaultPrompt = database.prepare('SELECT id FROM system_prompts WHERE is_default = 1 LIMIT 1').get() as
		| { id: number }
		| undefined

	if (defaultPrompt) {
		await updateSystemPrompt(defaultPrompt.id, { content: prompt })
	} else {
		// Create a new default system prompt
		await saveSystemPrompt({
			name: 'Default System Prompt',
			content: prompt,
			is_default: true
		})
	}
}

export async function setUserPrompt(prompt: string): Promise<void> {
	// Update the default user prompt instead of using settings
	const database = getDb()
	const defaultPrompt = database.prepare('SELECT id FROM user_prompts WHERE is_default = 1 LIMIT 1').get() as
		| { id: number }
		| undefined

	if (defaultPrompt) {
		await updateUserPrompt(defaultPrompt.id, { content: prompt })
	} else {
		// Create a new default user prompt
		await saveUserPrompt({
			name: 'Default User Prompt',
			content: prompt,
			is_default: true
		})
	}
}
