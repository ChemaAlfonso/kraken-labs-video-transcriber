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
      audio_path TEXT NOT NULL
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

	// Log temp directory for audio files
	const tempDir = path.join(app.getPath('userData'), 'temp')
	console.log('🎵 Audio files location:', tempDir)

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

// System prompt functions
export async function setSystemPrompt(prompt: string): Promise<void> {
	return await setSetting('systemPrompt', prompt)
}

export async function getSystemPrompt(): Promise<string> {
	const result = await getSetting(
		'systemPrompt',
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
	)
	return result || ''
}

// Transcription results functions
export async function saveTranscriptionResult(data: Omit<TranscriptionResult, 'id'>): Promise<TranscriptionResult> {
	const database = getDb()
	const stmt = database.prepare(
		`INSERT INTO generations (title, source, date, language, index_content, transcription, prompt, audio_path)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
	)
	const result = stmt.run(
		data.title,
		data.source,
		data.date,
		data.language,
		data.index_content,
		data.transcription,
		data.prompt,
		data.audio_path
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
