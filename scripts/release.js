#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

const releaseType = process.argv[2]

if (!['major', 'minor', 'patch'].includes(releaseType)) {
	console.error('❌ Invalid release type!')
	console.log('💡 Usage: npm run release:major | npm run release:minor | npm run release:patch')
	process.exit(1)
}

// Read current package.json
const packagePath = path.join(__dirname, '..', 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
const currentVersion = packageJson.version

console.log(`🚀 Creating ${releaseType} release from version ${currentVersion}`)

// Function to bump version
function bumpVersion(version, type) {
	const parts = version.split('.').map(Number)
	const [major, minor, patch] = parts

	switch (type) {
		case 'major':
			return `${major + 1}.0.0`
		case 'minor':
			return `${major}.${minor + 1}.0`
		case 'patch':
			return `${major}.${minor}.${patch + 1}`
		default:
			throw new Error('Invalid release type')
	}
}

// Function to find ZIP files recursively
function findZipFiles(dir) {
	let zipFiles = []
	if (!fs.existsSync(dir)) return zipFiles

	const items = fs.readdirSync(dir)
	for (const item of items) {
		const fullPath = path.join(dir, item)
		const stat = fs.statSync(fullPath)

		if (stat.isDirectory()) {
			zipFiles = zipFiles.concat(findZipFiles(fullPath))
		} else if (item.endsWith('.zip')) {
			zipFiles.push(fullPath)
		}
	}
	return zipFiles
}

// Function to parse and update CHANGELOG.md
function updateChangelog(newVersion) {
	const changelogPath = path.join(__dirname, '..', 'CHANGELOG.md')

	if (!fs.existsSync(changelogPath)) {
		console.log('⚠️  No CHANGELOG.md found, using generic release notes')
		return null
	}

	const changelog = fs.readFileSync(changelogPath, 'utf8')
	const lines = changelog.split('\n')

	// Find the Unreleased section
	let unreleasedStart = -1
	let unreleasedEnd = -1
	let unreleasedContent = []

	for (let i = 0; i < lines.length; i++) {
		const line = lines[i]

		// Find start of Unreleased section
		if (line.match(/^## \[Unreleased\]/i)) {
			unreleasedStart = i
			continue
		}

		// If we're in unreleased section and hit another ## heading, that's the end
		if (unreleasedStart !== -1 && line.match(/^## /)) {
			unreleasedEnd = i
			break
		}

		// Collect unreleased content (skip the section header itself)
		if (unreleasedStart !== -1 && i > unreleasedStart) {
			unreleasedContent.push(line)
		}
	}

	// If no end found, unreleased section goes to end of file
	if (unreleasedStart !== -1 && unreleasedEnd === -1) {
		unreleasedEnd = lines.length
		unreleasedContent = lines.slice(unreleasedStart + 1)
	}

	if (unreleasedStart === -1) {
		console.log('⚠️  No [Unreleased] section found in CHANGELOG.md')
		return null
	}

	// Clean up unreleased content (remove empty lines at start/end)
	while (unreleasedContent.length > 0 && unreleasedContent[0].trim() === '') {
		unreleasedContent.shift()
	}
	while (unreleasedContent.length > 0 && unreleasedContent[unreleasedContent.length - 1].trim() === '') {
		unreleasedContent.pop()
	}

	if (unreleasedContent.length === 0) {
		console.log('⚠️  No content in [Unreleased] section')
		return null
	}

	// Create new changelog with version section
	const today = new Date().toISOString().split('T')[0] // YYYY-MM-DD format
	const newVersionSection = `## [${newVersion}] - ${today}`

	const updatedLines = [
		...lines.slice(0, unreleasedStart),
		'## [Unreleased]',
		'',
		newVersionSection,
		...unreleasedContent,
		'',
		...lines.slice(unreleasedEnd)
	]

	// Write updated changelog
	fs.writeFileSync(changelogPath, updatedLines.join('\n'))

	// Return release notes content
	const releaseNotes = unreleasedContent.join('\n')
	console.log('✅ CHANGELOG.md updated with new version section')

	return releaseNotes
}

try {
	// Check if gh CLI is installed and authenticated
	try {
		execSync('gh --version', { stdio: 'ignore' })
		execSync('gh auth status', { stdio: 'ignore' })
	} catch (error) {
		console.error('❌ GitHub CLI not installed or not authenticated!')
		console.log('💡 Install: brew install gh && gh auth login')
		process.exit(1)
	}

	// Check if working directory is clean
	const status = execSync('git status --porcelain', { encoding: 'utf8' })
	if (status.trim()) {
		console.log('❌ Working directory is not clean!')
		console.log('💡 Commit your changes before creating a release')
		process.exit(1)
	}

	// Bump version
	const newVersion = bumpVersion(currentVersion, releaseType)
	const tagVersion = `v${newVersion}`

	console.log(`📝 Bumping version: ${currentVersion} → ${newVersion}`)

	// Update package.json
	packageJson.version = newVersion
	fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, '\t') + '\n')

	// Update CHANGELOG.md and get release notes
	console.log(`📝 Updating CHANGELOG.md...`)
	const changelogContent = updateChangelog(newVersion)

	if (!changelogContent) {
		console.log('⚠️  No changelog content found. Please add changes to the [Unreleased] section in CHANGELOG.md')
		console.log('💡 You can continue with a generic release or cancel and update the changelog first.')
		// Continue with generic release notes
	}

	// Commit version and changelog changes
	execSync('git add package.json CHANGELOG.md', { stdio: 'inherit' })
	execSync(`git commit -m "chore: release ${newVersion}"`, { stdio: 'inherit' })

	// Create and push tag
	console.log(`🏷️ Creating tag: ${tagVersion}`)
	execSync(`git tag -a ${tagVersion} -m "Release ${tagVersion}"`, { stdio: 'inherit' })
	execSync(`git push origin master`, { stdio: 'inherit' })
	execSync(`git push origin ${tagVersion}`, { stdio: 'inherit' })

	// Clean and build
	console.log(`🗑️ Cleaning previous builds...`)
	execSync('npm run clean', { stdio: 'inherit' })

	console.log(`🔨 Building for all platforms... (this will take a few minutes)`)
	execSync('npm run make:all', { stdio: 'inherit' })

	// Find build assets
	const makeDir = path.join(__dirname, '..', 'out', 'make')
	const zipFiles = findZipFiles(makeDir)

	if (zipFiles.length === 0) {
		console.error('❌ No build assets found!')
		process.exit(1)
	}

	console.log(`\n📋 Found ${zipFiles.length} build asset(s):`)
	zipFiles.forEach(file => {
		const stats = fs.statSync(file)
		const sizeMB = (stats.size / 1024 / 1024).toFixed(1)
		console.log(`   • ${path.basename(file)} (${sizeMB} MB)`)
	})

	// Create release notes
	let releaseNotes
	if (changelogContent) {
		// Use changelog content
		releaseNotes = `# 🎉 Kraken Labs Video Transcriber ${tagVersion}

${changelogContent}

## 📥 Downloads

Choose the appropriate version for your operating system:

- **🍎 macOS (Apple Silicon)**: Download the ARM64 version
- **🍎 macOS (Intel)**: Download the x64 version  
- **🪟 Windows**: Download the win32-x64 version
- **🐧 Linux**: Download the linux-x64 version

All downloads are portable ZIP files - just extract and run!

---
**Full Changelog**: https://github.com/chemaalfonso/kraken-labs-video-transcriber/compare/${tagVersion}`
	} else {
		// Fallback to generic release notes
		releaseNotes = `## 🎉 Kraken Labs Video Transcriber ${tagVersion}

**Full Changelog**: https://github.com/chemaalfonso/kraken-labs-video-transcriber/compare/${tagVersion}

## 📥 Downloads

Choose the appropriate version for your operating system:

- **🍎 macOS (Apple Silicon)**: Download the ARM64 version
- **🍎 macOS (Intel)**: Download the x64 version  
- **🪟 Windows**: Download the win32-x64 version
- **🐧 Linux**: Download the linux-x64 version

All downloads are portable ZIP files - just extract and run!`
	}

	// Create GitHub release
	console.log(`🎉 Creating GitHub release ${tagVersion}...`)

	const notesFile = path.join(__dirname, '..', 'temp-release-notes.md')
	fs.writeFileSync(notesFile, releaseNotes)

	execSync(
		`gh release create "${tagVersion}" --title "Kraken Labs Video Transcriber ${tagVersion}" --notes-file "${notesFile}"`,
		{ stdio: 'inherit' }
	)

	fs.unlinkSync(notesFile)

	// Upload assets
	console.log(`📤 Uploading ${zipFiles.length} asset(s)...`)
	for (const zipFile of zipFiles) {
		const fileName = path.basename(zipFile)
		console.log(`   Uploading: ${fileName}`)
		execSync(`gh release upload ${tagVersion} "${zipFile}"`, { stdio: 'inherit' })
		console.log(`   ✅ ${fileName} uploaded successfully`)
	}

	console.log(`\n🎉 ${releaseType.toUpperCase()} release ${tagVersion} created successfully!`)
	console.log(
		`📋 Release URL: https://github.com/chemaalfonso/kraken-labs-video-transcriber/releases/tag/${tagVersion}`
	)
	console.log(`\n✨ Summary:`)
	console.log(`   • Version: ${currentVersion} → ${newVersion}`)
	console.log(`   • Tag: ${tagVersion}`)
	console.log(`   • Assets: ${zipFiles.length} files uploaded`)
	console.log(`   • Release type: ${releaseType}`)
} catch (error) {
	console.error('❌ Release failed:', error.message)
	process.exit(1)
}
