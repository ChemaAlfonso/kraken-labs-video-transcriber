# Release Process

This document describes how to create releases for Kraken Labs Video Transcriber.

## Prerequisites

Before creating your first release, make sure your GitHub repository is properly configured:

👉 **See [GitHub Setup Guide](./GITHUB_SETUP.md)** for repository configuration

## Automated Release Process

The project uses GitHub Actions to automatically build and create releases with downloadable assets for all supported platforms (macOS, Windows, Linux).

### Creating a Release

1. **Update the version** in `package.json`:

    ```bash
    # Example: updating from 0.1.0 to 0.2.0
    npm version patch  # for bug fixes (0.1.0 → 0.1.1)
    npm version minor  # for new features (0.1.0 → 0.2.0)
    npm version major  # for breaking changes (0.1.0 → 1.0.0)
    ```

2. **Commit the version change**:

    ```bash
    git add package.json package-lock.json
    git commit -m "chore: bump version to v0.2.0"
    git push origin main
    ```

3. **Create and push the release tag**:

    ```bash
    npm run release:tag
    ```

    This script will:

    - Create a git tag based on the package.json version
    - Push the tag to GitHub
    - Trigger the GitHub Actions release workflow

### Manual Release Trigger

You can also manually trigger a release workflow:

```bash
# Using the current package.json version
npm run release:manual

# Or trigger via GitHub CLI with a custom version
gh workflow run release.yml -f tag=v1.0.0
```

### What Happens During Release

1. **Build Phase**: The workflow builds the application for all supported platforms:

    - macOS (Intel x64 and Apple Silicon ARM64)
    - Windows (x64)
    - Linux (x64)

2. **Package Phase**: Each platform build is packaged into a ZIP file using electron-forge

3. **Release Phase**:
    - Creates a GitHub release with the tag
    - Uploads all ZIP files as release assets
    - Generates release notes with download instructions

### Release Assets

The following assets are generated and attached to each release:

-   `Kraken Labs Video Transcriber-darwin-x64-{version}.zip` - macOS Intel
-   `Kraken Labs Video Transcriber-darwin-arm64-{version}.zip` - macOS Apple Silicon
-   `Kraken Labs Video Transcriber-win32-x64-{version}.zip` - Windows 64-bit
-   `Kraken Labs Video Transcriber-linux-x64-{version}.zip` - Linux 64-bit

## Local Testing

Before creating a release, you can test the build process locally:

```bash
# Build for all platforms (requires appropriate OS)
npm run make:all

# Or build for specific platforms
npm run make:macos    # macOS only
npm run make:windows  # Windows only
npm run make:linux    # Linux only

# Check the generated files
ls out/make/zip/
```

## Troubleshooting

### Build Failures

If a build fails in GitHub Actions:

1. Check the Actions tab in the GitHub repository
2. Review the build logs for the failing platform
3. Fix any issues and create a new tag to retry

### Missing Assets

If assets are missing from a release:

1. Verify the `out/make/zip/` directory contains ZIP files after local build
2. Check that the workflow artifact upload step succeeded
3. Ensure the GitHub token has the necessary permissions

### Version Conflicts

If you get a "tag already exists" error:

1. Update the version in `package.json`
2. Commit the change
3. Run `npm run release:tag` again

## Development Workflow

For active development:

1. Make changes and commit to feature branches
2. Merge to `main` branch
3. Update version and create release tags only for stable releases
4. Use semantic versioning (MAJOR.MINOR.PATCH)

The `out/` directory is already excluded from git commits via `.gitignore`, so build artifacts won't clutter the repository.
