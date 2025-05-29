#!/usr/bin/env node

const { execSync } = require('child_process')
const fs = require('fs')
const path = require('path')

// Read package.json
const packagePath = path.join(__dirname, '..', 'package.json')
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'))
const version = `v${packageJson.version}`

console.log(`🏷️  Creating release tag: ${version}`)

try {
	// Check if tag already exists
	try {
		execSync(`git rev-parse ${version}`, { stdio: 'ignore' })
		console.log(`❌ Tag ${version} already exists!`)
		console.log('💡 Update package.json version and try again')
		process.exit(1)
	} catch (error) {
		// Tag doesn't exist, proceed
	}

	// Check if working directory is clean
	try {
		const status = execSync('git status --porcelain', { encoding: 'utf8' })
		if (status.trim()) {
			console.log('❌ Working directory is not clean!')
			console.log('💡 Commit your changes before creating a release tag')
			process.exit(1)
		}
	} catch (error) {
		console.log('❌ Error checking git status:', error.message)
		process.exit(1)
	}

	// Create and push tag
	execSync(`git tag -a ${version} -m "Release ${version}"`, { stdio: 'inherit' })
	execSync(`git push origin ${version}`, { stdio: 'inherit' })

	console.log(`✅ Successfully created and pushed tag: ${version}`)
	console.log(`🚀 GitHub Actions will now build and create the release automatically`)
	console.log(`📋 Release URL: https://github.com/chemaalfonso/kraken-labs-video-transcriber/releases/tag/${version}`)
} catch (error) {
	console.error('❌ Error creating release tag:', error.message)
	process.exit(1)
}
