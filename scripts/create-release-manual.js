#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Read package.json
const packagePath = path.join(__dirname, '..', 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
const version = `v${packageJson.version}`

console.log(`🚀 Creating manual release: ${version}`)

// Check if gh CLI is installed
try {
	execSync('gh --version', { stdio: 'ignore' })
} catch (error) {
	console.error('❌ GitHub CLI (gh) is not installed!')
	console.log('💡 Install it with: brew install gh (macOS) or visit https://cli.github.com/')
	process.exit(1)
}

// Check if user is authenticated
try {
	execSync('gh auth status', { stdio: 'ignore' })
} catch (error) {
	console.error('❌ Not authenticated with GitHub CLI!')
	console.log('💡 Run: gh auth login')
	process.exit(1)
}

// Function to recursively find ZIP files
function findZipFiles(dir) {
	let zipFiles = []

	if (!fs.existsSync(dir)) {
		return zipFiles
	}

	const items = fs.readdirSync(dir)

	for (const item of items) {
		const fullPath = path.join(dir, item)
		const stat = fs.statSync(fullPath)

		if (stat.isDirectory()) {
			// Recursively search subdirectories
			zipFiles = zipFiles.concat(findZipFiles(fullPath))
		} else if (item.endsWith('.zip')) {
			zipFiles.push(fullPath)
		}
	}

	return zipFiles
}

try {
	// Check if tag already exists
	try {
		execSync(`git rev-parse ${version}`, { stdio: 'ignore' })
		console.log(`⚠️  Tag ${version} already exists locally`)
	} catch (error) {
		// Tag doesn't exist, create it
		console.log(`📝 Creating tag ${version}...`)
		execSync(`git tag -a ${version} -m "Release ${version}"`, { stdio: 'inherit' })
		execSync(`git push origin ${version}`, { stdio: 'inherit' })
	}

	console.log(`🗑️ Deleting existing out directory...`)
	execSync('npm run clean', { stdio: 'inherit' })

	// Build assets for all platforms
	console.log(`🔨 Building assets for all platforms...`)
	console.log(`📦 This will take several minutes...`)
	console.log(`🍎 🪟 🐧 Building for macOS, Windows, and Linux...`)

	try {
		execSync('npm run make:all', { stdio: 'inherit' })
		console.log(`✅ All platform builds completed!`)
	} catch (error) {
		console.error('❌ Build failed:', error.message)
		console.log('💡 Make sure all dependencies are installed and try again')
		process.exit(1)
	}

	// Find ZIP files recursively in out/make directory
	const makeDir = path.join(__dirname, '..', 'out', 'make')

	if (!fs.existsSync(makeDir)) {
		console.error('❌ No make directory found at out/make/')
		console.log('💡 Make sure the build completed successfully')
		process.exit(1)
	}

	const zipFiles = findZipFiles(makeDir)

	if (zipFiles.length === 0) {
		console.error('❌ No ZIP files found in out/make/ or its subdirectories')
		console.log('💡 Make sure the build completed successfully')
		console.log('🔍 Checking directory structure...')

		// Debug: show directory structure
		try {
			const makeContents = fs.readdirSync(makeDir)
			console.log(`📁 Contents of out/make/:`)
			makeContents.forEach(item => {
				const itemPath = path.join(makeDir, item)
				const isDir = fs.statSync(itemPath).isDirectory()
				console.log(`   ${isDir ? '📁' : '📄'} ${item}`)

				if (isDir) {
					try {
						const subContents = fs.readdirSync(itemPath)
						subContents.forEach(subItem => {
							console.log(`      📄 ${subItem}`)
						})
					} catch (e) {
						// Ignore errors reading subdirectories
					}
				}
			})
		} catch (e) {
			console.log('Could not read directory structure')
		}

		process.exit(1)
	}

	console.log(`\n📋 Found ${zipFiles.length} asset(s):`)
	zipFiles.forEach(file => {
		const stats = fs.statSync(file)
		const sizeMB = (stats.size / 1024 / 1024).toFixed(1)
		const relativePath = path.relative(path.join(__dirname, '..'), file)
		console.log(`   • ${path.basename(file)} (${sizeMB} MB) - ${relativePath}`)
	})

	// Create release notes
	const releaseNotes = `## What's Changed

**Full Changelog**: https://github.com/chemaalfonso/kraken-labs-video-transcriber/compare/${version}

## Downloads

Choose the appropriate version for your operating system:

- **macOS (Apple Silicon)**: Download the ARM64 version
- **macOS (Intel)**: Download the x64 version  
- **Windows**: Download the win32-x64 version
- **Linux**: Download the linux-x64 version

All downloads are portable ZIP files - just extract and run!

---
*This release was created manually from local builds*`

	// Check if release already exists
	let releaseExists = false
	try {
		execSync(`gh release view ${version}`, { stdio: 'ignore' })
		releaseExists = true
		console.log(`⚠️  Release ${version} already exists on GitHub`)
		console.log(`📎 Adding assets to existing release...`)
	} catch (error) {
		// Release doesn't exist, create it
		console.log(`🎉 Creating GitHub release ${version}...`)

		const notesFile = path.join(__dirname, '..', 'temp-release-notes.md')
		fs.writeFileSync(notesFile, releaseNotes)

		execSync(
			`gh release create "${version}" --title "Kraken Labs Video Transcriber ${version}" --notes-file "${notesFile}"`,
			{
				stdio: 'inherit'
			}
		)

		fs.unlinkSync(notesFile)
	}

	// Upload assets
	console.log(`📤 Uploading ${zipFiles.length} asset(s)...`)

	for (const zipFile of zipFiles) {
		const fileName = path.basename(zipFile)
		console.log(`   Uploading: ${fileName}`)

		try {
			if (releaseExists) {
				// Delete existing asset if it exists, then upload
				try {
					execSync(`gh release delete-asset ${version} "${fileName}" --yes`, { stdio: 'ignore' })
				} catch (e) {
					// Asset doesn't exist, that's fine
				}
			}

			execSync(`gh release upload ${version} "${zipFile}"`, { stdio: 'inherit' })
			console.log(`   ✅ ${fileName} uploaded successfully`)
		} catch (error) {
			console.error(`   ❌ Failed to upload ${fileName}:`, error.message)
		}
	}

	console.log(`\n🎉 Manual release completed!`)
	console.log(`📋 Release URL: https://github.com/chemaalfonso/kraken-labs-video-transcriber/releases/tag/${version}`)
	console.log(`\n💡 Next time you can also use: npm run release`)
} catch (error) {
	console.error('❌ Error creating manual release:', error.message)
	process.exit(1)
}
