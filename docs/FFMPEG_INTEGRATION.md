# FFmpeg Integration Documentation

## Overview

This application now includes **bundled FFmpeg binaries** that are automatically downloaded and packaged with the application. Users no longer need to install FFmpeg manually on their systems.

## How It Works

### 1. Automatic Binary Download

The application uses the `@ffmpeg-installer/ffmpeg` npm package which:

-   Automatically downloads the correct FFmpeg binary for the target platform during `npm install`
-   Supports Windows (x64), macOS (x64, arm64), and Linux (x64, arm64)
-   Provides platform-specific optimized binaries

### 2. Binary Bundling

The Electron Forge configuration ensures FFmpeg binaries are properly packaged:

```javascript
// forge.config.cjs
packagerConfig: {
  asar: true,
  extraResource: ['node_modules/@ffmpeg-installer/']
}
```

The `extraResource` setting ensures FFmpeg binaries are bundled with the application and accessible at runtime.

### 3. Runtime Integration

The FFmpeg service (`electron/services/ffmpeg.js`) automatically:

-   Locates the bundled FFmpeg binary
-   Sets the correct path for fluent-ffmpeg
-   Attempts to locate FFprobe (usually bundled with FFmpeg)
-   Provides fallback mechanisms if FFprobe isn't found

## Supported Platforms

| Platform | Architecture  | Status       |
| -------- | ------------- | ------------ |
| Windows  | x64           | ✅ Supported |
| macOS    | x64 (Intel)   | ✅ Supported |
| macOS    | arm64 (M1/M2) | ✅ Supported |
| Linux    | x64           | ✅ Supported |
| Linux    | arm64         | ✅ Supported |

## Features

### Audio Extraction

-   Extracts audio from video files in MP3 format
-   Optimized for transcription (16kHz, mono, low bitrate)
-   Automatic compression to stay under API limits (25MB)
-   Supports multiple video formats (MP4, AVI, MOV, MKV)

### Video Processing

-   Get video duration and metadata
-   Download videos from URLs
-   Process various video codecs and containers

## File Locations

### Development

-   FFmpeg binary: `node_modules/@ffmpeg-installer/[platform]/ffmpeg`
-   Temporary audio files: `{userData}/temp/`

### Production (Packaged App)

-   FFmpeg binary: `Contents/Resources/@ffmpeg-installer/[platform]/ffmpeg` (extraResource)
-   Temporary audio files: `{userData}/temp/`

## Error Handling

The FFmpeg service includes comprehensive error handling:

1. **Binary Not Found**: Clear error message if FFmpeg binary is missing
2. **Execution Errors**: Detailed error messages for FFmpeg command failures
3. **File Size Limits**: Automatic compression for large audio files
4. **Cleanup**: Automatic cleanup of temporary files

## Configuration

### Electron Forge Configuration

```javascript
// forge.config.cjs
module.exports = {
	packagerConfig: {
		asar: true,
		extraResource: ['node_modules/@ffmpeg-installer/']
	}
}
```

### FFmpeg Service Configuration

```javascript
// src/services/ffmpeg.ts
const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg')
const ffmpeg = require('fluent-ffmpeg')

// Set bundled binary path
ffmpeg.setFfmpegPath(ffmpegInstaller.path)
```

## Troubleshooting

### Common Issues

1. **FFmpeg Not Found**

    - Ensure `npm install` completed successfully
    - Check that `@ffmpeg-installer/ffmpeg` is in dependencies
    - Verify the binary exists at the expected path

2. **Permission Errors**

    - On Linux/macOS, ensure the binary has execute permissions
    - This is usually handled automatically by the installer

3. **Packaging Issues**
    - Ensure `extraResource` is configured correctly in forge.config.cjs
    - Verify the binary is extracted properly in the final package

The application provides detailed error messages and emoji-based status indicators for troubleshooting FFmpeg operations.

## Benefits for End Users

1. **Zero Setup**: No need to install FFmpeg manually
2. **Cross-Platform**: Works consistently across all supported platforms
3. **Optimized**: Platform-specific binaries for best performance
4. **Reliable**: No dependency on system-installed software
5. **Portable**: Application is completely self-contained

## Development Notes

### Adding New FFmpeg Features

When adding new FFmpeg functionality:

1. Always check `isInstalled()` before using FFmpeg
2. Use proper error handling and user-friendly error messages
3. Consider file size limits for transcription services
4. Clean up temporary files after processing
5. Use emoji-based logging for clear status indicators

### Testing Changes

Test changes with:

1. `npm run dev` - Test in development mode
2. `npm run build` - Test packaging
3. Manual testing on target platforms

## License Considerations

FFmpeg is licensed under LGPL/GPL. The bundled binaries are:

-   Dynamically linked (not statically linked into our application)
-   Used as separate executables (not linked libraries)
-   This approach is compatible with most commercial applications

For specific legal requirements, consult with legal counsel regarding FFmpeg licensing in your use case.
