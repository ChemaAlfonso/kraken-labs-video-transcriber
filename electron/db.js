const sqlite3 = require('sqlite3')
const { open } = require('sqlite')
const path = require('path')
const fs = require('fs')
const { app } = require('electron')

let db = null

async function initialize() {
	// Ensure data directory exists
	const dataDir = path.join(app.getPath('userData'), 'data')
	if (!fs.existsSync(dataDir)) {
		fs.mkdirSync(dataDir, { recursive: true })
	}

	const dbPath = path.join(dataDir, 'kraken-labs-video-transcriber.db')
	console.log('📁 Database location:', dbPath)

	// Open the database
	db = await open({
		filename: dbPath,
		driver: sqlite3.Database
	})

	// Create tables first if they don't exist
	await db.exec(`
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
	const tableInfo = await db.all('PRAGMA table_info(generations)')
	const hasDurationField = tableInfo.some(column => column.name === 'duration')

	if (hasDurationField) {
		console.log('🔄 Migrating database schema - removing duration field...')
		// Create new table without duration field
		await db.exec(`
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
		await db.exec(`
			INSERT INTO generations_new (id, title, source, date, language, index_content, transcription, prompt, audio_path)
			SELECT id, title, source, date, language, index_content, transcription, prompt, audio_path
			FROM generations;
		`)

		// Drop old table and rename new one
		await db.exec(`DROP TABLE generations;`)
		await db.exec(`ALTER TABLE generations_new RENAME TO generations;`)
		console.log('✅ Database migration completed')
	}

	// Check if api_config table needs whisper_model field
	const apiConfigTableInfo = await db.all('PRAGMA table_info(api_config)')
	const hasWhisperModelField = apiConfigTableInfo.some(column => column.name === 'whisper_model')

	if (!hasWhisperModelField) {
		console.log('🔄 Adding whisper_model field to api_config table...')
		await db.exec(`ALTER TABLE api_config ADD COLUMN whisper_model TEXT DEFAULT 'whisper-1';`)
		console.log('✅ Database schema updated with whisper_model field')
	}

	// Log temp directory for audio files
	const tempDir = path.join(app.getPath('userData'), 'temp')
	console.log('🎵 Audio files location:', tempDir)

	return db
}

function getDb() {
	if (!db) {
		throw new Error('Database not initialized')
	}
	return db
}

// API Configuration functions
async function saveApiConfig(apiType, config) {
	const db = getDb()
	await db.run(
		`INSERT OR REPLACE INTO api_config (api_type, api_key, model, host, temperature, whisper_model) 
     VALUES (?, ?, ?, ?, ?, ?)`,
		[
			apiType,
			config.apiKey || '',
			config.model || '',
			config.host || '',
			config.temperature ?? 1,
			config.whisperModel || 'whisper-1'
		]
	)
}

async function getApiConfig(apiType) {
	const db = getDb()
	const result = await db.get('SELECT * FROM api_config WHERE api_type = ?', [apiType])
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
async function setSetting(key, value) {
	const db = getDb()
	await db.run(`INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)`, [key, value])
}

async function getSetting(key, defaultValue = null) {
	const db = getDb()
	const result = await db.get('SELECT value FROM settings WHERE key = ?', [key])
	return result ? result.value : defaultValue
}

// System prompt functions
async function setSystemPrompt(prompt) {
	return await setSetting('systemPrompt', prompt)
}

async function getSystemPrompt() {
	return await getSetting(
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
- Include **every distinct explanation, question, answer, advice, or example**—not just formal questions.
- Avoid summarizing entire blocks of mixed content under a single vague topic.
- Do not skip over segments longer than 10 seconds unless they are clearly off-topic or repetition.
- If unsure whether to include a block: **include it**.

### Ordering rule:

- The index must be strictly sorted by timestamp in ascending order (hh:mm:ss).
- Do not group or reorder entries based on topic relevance or importance.
- Entries must appear in the exact order they occur in the session, no exceptions.

### Output format:

Do **not** include explanations, notes, or comments. Output in this exact order and format:

---

## Resumen

Short summary of the overall session (max 4 lines, no bullet points).

## Conceptos clave

- List of keywords and core topics (max 10, concise, informative).

## Índice de contenidos

| **Momento** | **Tema** | **Subtemas** |
| ----------- | -------- | ------------ |
| 00:05:30    | Topic description | Subtopic details |
| 01:23:45    | Another topic | More details |

---

### Goal:

The goal is to generate an accurate, granular, and highly navigable map of the full session, not a summary. Prioritize clarity and completeness.`
	)
}

// Transcription results functions
async function saveTranscriptionResult(data) {
	const db = getDb()
	await db.run(
		`INSERT INTO generations (title, source, date, language, index_content, transcription, prompt, audio_path)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
		[
			data.title,
			data.source,
			new Date().toISOString(),
			data.language,
			data.index,
			data.transcription,
			data.prompt,
			data.audio_path
		]
	)
}

async function getTranscriptionResults() {
	const db = getDb()
	const results = await db.all('SELECT * FROM generations ORDER BY date DESC')
	// Map index_content to index for frontend compatibility
	return results.map(result => ({
		...result,
		index: result.index_content
	}))
}

async function deleteTranscriptionResult(id) {
	const db = getDb()
	await db.run('DELETE FROM generations WHERE id = ?', [id])
}

async function updateTranscriptionResult(id, updates) {
	const db = getDb()
	const { index, prompt } = updates
	await db.run('UPDATE generations SET index_content = ?, prompt = ? WHERE id = ?', [index, prompt, id])
}

module.exports = {
	initialize,
	getDb,
	saveApiConfig,
	getApiConfig,
	setSetting,
	getSetting,
	setSystemPrompt,
	getSystemPrompt,
	saveTranscriptionResult,
	getTranscriptionResults,
	deleteTranscriptionResult,
	updateTranscriptionResult
}
