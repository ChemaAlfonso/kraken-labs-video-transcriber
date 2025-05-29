# Release Process

This document describes how to create releases for Kraken Labs Video Transcriber using the manual release process.

## Prerequisites

Before creating your first release, make sure you have the required tools:

### Install GitHub CLI

```bash
# macOS
brew install gh

# Windows
winget install --id GitHub.cli

# Linux
sudo apt install gh  # or appropriate package manager
```

### Authenticate with GitHub

```bash
gh auth login
```

### Install Dependencies

```bash
npm install
```

## Release Process

### Creating a Release

The release process builds for all platforms (macOS, Windows, Linux) and uploads the assets to GitHub:

```bash
# 1. Update version
npm version patch  # or minor/major

# 2. Commit version change
git add package.json package-lock.json
git commit -m "chore: bump version to v0.1.1"
git push origin main

# 3. Create release (builds + uploads to GitHub)
npm run release
```

This will:

-   ✅ Build the app for all configured platforms (macOS Intel/ARM, Windows x64, Linux x64)
-   ✅ Create a git tag and push it
-   ✅ Create a GitHub release
-   ✅ Upload all ZIP files as assets

### Release Assets

The following assets are generated and attached to each release:

-   `Kraken Labs Video Transcriber-darwin-x64-{version}.zip` - macOS Intel
-   `Kraken Labs Video Transcriber-darwin-arm64-{version}.zip` - macOS Apple Silicon
-   `Kraken Labs Video Transcriber-win32-x64-{version}.zip` - Windows 64-bit
-   `Kraken Labs Video Transcriber-linux-x64-{version}.zip` - Linux 64-bit

## Alternative Release Options

### Option 1: Complete Release (Recommended)

```bash
npm run release
```

### Option 2: Step-by-Step

```bash
# Build for all platforms first
npm run make:all

# Then create release
npm run release
```

### Option 3: Individual Commands

```bash
# Build
npm run make:all

# Create release manually
gh release create v1.0.0 \
  --title "Kraken Labs Video Transcriber v1.0.0" \
  --notes "Release notes here"

# Upload specific files
gh release upload v1.0.0 out/make/**/*.zip
```

### Option 4: Platform-Specific Building

```bash
# Build for specific platforms only
npm run make:macos     # macOS only
npm run make:windows   # Windows only
npm run make:linux     # Linux only

# Then create release with available assets
npm run release
```

## Local Testing

Before creating a release, you can test the build process locally:

```bash
# Build for all platforms
npm run make:all

# Or build for specific platforms
npm run make:macos    # macOS only
npm run make:windows  # Windows only
npm run make:linux    # Linux only

# Check the generated files
find out/make -name "*.zip"
```

## Troubleshooting

### Build Failures

If a build fails:

1. Check that all dependencies are installed: `npm install`
2. Verify you have the necessary build tools for cross-platform compilation
3. Check the error logs for specific issues
4. Try building individual platforms: `npm run make:macos` etc.

### Missing Assets

If assets are missing from a release:

1. Verify the `out/make/` directory contains ZIP files after local build
2. Check that the build completed successfully for all platforms
3. Ensure you have write access to the GitHub repository

### Version Conflicts

If you get a "tag already exists" error:

1. Update the version in `package.json`
2. Commit the change
3. Run `npm run release` again

### GitHub CLI Issues

If you get authentication or permission errors:

1. Check authentication: `gh auth status`
2. Re-authenticate if needed: `gh auth login`
3. Verify you have write access to the repository

## Development Workflow

For active development:

1. Make changes and commit to feature branches
2. Merge to `main` branch
3. Update version and create release tags only for stable releases
4. Use semantic versioning (MAJOR.MINOR.PATCH)

The `out/` directory is already excluded from git commits via `.gitignore`, so build artifacts won't clutter the repository and only appear as release assets.
