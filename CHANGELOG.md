# Changelog

All notable changes to the Kraken Labs Video Transcriber project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added

-   **Comprehensive CHANGELOG.md**: Created structured changelog following Keep a Changelog format with automatic release integration
-   **Dual macOS Architecture Support**: Added separate build commands for both Apple Silicon (ARM64) and Intel (x64) architectures
-   **Automated Release Process**: Implemented unified release script with semantic versioning for major, minor, and patch releases

### Changed

-   **Simplified Build Commands**: Streamlined package.json scripts by removing redundant build commands and keeping only essential make commands
-   **Enhanced Release Workflow**: Integrated changelog content directly into GitHub release notes for more informative releases
-   **macOS Build Process**: Updated to build both ARM64 and x64 versions automatically for complete macOS compatibility

### Removed

-   **Outdated Build Scripts**: Removed `build-all-platforms.js`, `tag-release.js`, and `create-release-manual.js` in favor of unified release process
-   **Redundant Commands**: Eliminated `build:*` commands that only packaged without creating distributable installers

### Technical Improvements

-   **Release Automation**: Single-command release process that handles version bumping, changelog updates, git tagging, building, and GitHub release creation
-   **Better Architecture Coverage**: Ensures all promised download options (macOS ARM64, macOS Intel, Windows, Linux) are actually built and distributed

## [0.7.0] - 2025-06-11

### Added

-   **External Whisper Service**: Implemented Whisper transcription external service with FastAPI, Docker support, and example configuration for local deployment
-   **Ollama Docker Service**: Added Ollama Docker service with comprehensive configuration files and README documentation for AI model integration
-   **Turbo Model Support**: Added 'turbo' model option to Whisper service configuration for faster transcription processing
-   **Multi-file Processing**: Enhanced file processing capabilities with multi-file selection and detailed progress tracking
-   **Multi-prompt Management**: Implemented comprehensive multi-prompt management system for user and system prompts, including full CRUD operations and UI integration
-   **Bulk Content Generation**: Added bulk content generation feature with complete UI integration and backend handling for processing multiple files simultaneously

### Changed

-   **Terminology Update**: Updated terminology from 'index' to 'content' across the entire application for improved clarity and consistency
-   **UI Improvements**: Removed default labeling from language and prompt options for a cleaner, more intuitive user interface
-   **Settings Clarity**: Updated default settings section to better clarify language selection and improve button labeling for enhanced user experience

### Enhanced

-   **Progress Tracking**: Implemented detailed progress tracking for multi-file processing in transcription workflow with real-time updates
-   **Documentation**: Expanded README with recommended setup instructions for local Whisper and OpenAI API configurations

### Technical Improvements

-   Improved file processing workflow with better error handling and user feedback
-   Enhanced UI/UX with cleaner design patterns and more intuitive navigation
-   Better integration between frontend and backend services
-   Streamlined configuration management for external services

---

## How to Update This Changelog

When making changes to the project:

1. Add your changes under the `[Unreleased]` section
2. Use the appropriate category: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`
3. Write clear, concise descriptions of what changed
4. When creating a release (`npm run release:major|minor|patch`), the script will automatically:
    - Move unreleased changes to a new version section with today's date
    - Use the changelog content as GitHub release notes
    - Commit the updated changelog

### Categories

-   **Added** for new features
-   **Changed** for changes in existing functionality
-   **Deprecated** for soon-to-be removed features
-   **Removed** for now removed features
-   **Fixed** for any bug fixes
-   **Security** in case of vulnerabilities
