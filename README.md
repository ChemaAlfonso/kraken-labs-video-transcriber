# Video Transcriber & Content Index Generator

A desktop application built with Electron and Vue.js that transcribes videos and generates content indexes using AI services.

## Features

-   **Video Processing**: Extract audio from video files using bundled FFmpeg
-   **Transcription**: Convert audio to text using OpenAI-compatible Whisper APIs
-   **Content Index Generation**: Create detailed content indexes using OpenAI-compatible LLM APIs
-   **Multiple API Support**: Works with OpenAI API and custom OpenAI-compatible endpoints
-   **Results Management**: Save, view, and manage transcription results
-   **Self-Contained**: No external dependencies required - FFmpeg binaries are bundled

## Supported Services

### Transcription Services

-   **OpenAI Whisper API**: Official OpenAI Whisper transcription service
-   **Custom APIs**: Any OpenAI-compatible transcription endpoint

### AI/LLM Services

-   **OpenAI GPT**: Official OpenAI chat completions API
-   **Custom APIs**: Any OpenAI-compatible chat completions endpoint (Groq, local LLaMA servers, Ollama with OpenAI compatibility, etc.)

## Requirements

-   **No external dependencies**: FFmpeg binaries are bundled with the application
-   **Operating System**: Windows, macOS, or Linux

## Installation

1. Clone the repository
2. Install dependencies: `npm install`
3. Build the application: `npm run build`
4. Start the application: `npm run electron:dev` (development) or `npm run electron:build` (production)

## Configuration

1. Go to the Configuration page in the app
2. Set up your API credentials:
    - **OpenAI**: Add your API key and configure models
    - **Custom API**: Add your endpoint URL, API key (if required), and model names
3. Configure default language and prompt settings

## Usage

1. **Select Video**: Choose a local video file
2. **Configure Settings**: Set title, language, and generation prompt
3. **Choose Services**: Select transcription and AI services from the advanced settings
4. **Generate**: Click "Generate Content Index" to process the video
5. **View Results**: Access your generated content indexes from the Generations page

## Recommended Setup

For optimal **performance and affordability**, we recommend the following configuration:

### 🎯 Best Practice Configuration

-   **Transcription**: Local Whisper model (Turbo or Medium recommended)
-   **AI/LLM**: OpenAI GPT-4o Mini via API

This setup provides excellent transcription quality while keeping costs low for content generation.

### 🐳 Setting Up Local Whisper

Our application includes a pre-configured Whisper service that runs locally using Docker:

1. **Prerequisites**: Ensure Docker and Docker Compose are installed on your system

2. **Start the Whisper service**:

    ```bash
    # Navigate to the whisper service directory
    cd services/whisper

    # Start the service (builds automatically on first run)
    docker-compose up --build -d

    # Verify it's running
    curl http://localhost:5001/status
    ```

3. **Configure in the app**:
    - Go to Configuration → Custom API
    - Set the endpoint URL to: `http://localhost:5001`
    - Model: `turbo`
    - No API key required for local service

**Model Recommendations**:

-   **Whisper Turbo**: Best balance of speed and accuracy
-   **Whisper Medium**: Good accuracy, reasonable speed
-   **Whisper Small**: Faster but less accurate

### 🔑 Setting Up OpenAI API

1. **Get your API key**:

    - Visit [OpenAI Platform](https://platform.openai.com)
    - Sign up or log in to your account
    - Navigate to API Keys section
    - Create a new API key and copy it

2. **Configure in the app**:

    - Go to Configuration → OpenAI
    - Enter your API key
    - Set model to: `gpt-4o-mini`
    - Configure other preferences as needed

3. **OpenAI Privacy Policy**:

    - You can set [sharing preferences](https://platform.openai.com/settings/organization/data-controls/sharing) to control how your data is used (not used to train models by default with OpenAI).

### 💡 Why This Setup?

-   **Cost-effective**: Local Whisper eliminates transcription API costs
-   **High-quality**: Whisper provides excellent transcription accuracy
-   **Fast content generation**: GPT-4o Mini offers great quality-to-cost ratio
-   **Privacy**: Audio never leaves your machine during transcription
-   **Reliable**: Local transcription works offline

## API Compatibility

This application works with any OpenAI-compatible API endpoints. Popular options include:

-   [Groq](https://groq.com/) - Fast inference API
-   [Ollama](https://ollama.ai/) with OpenAI compatibility enabled
-   Local LLaMA.cpp servers
-   Other OpenAI-compatible services

## Development

-   `npm run dev` - Start development server
-   `npm run build` - Build for production
-   `npm run electron:dev` - Start Electron in development mode
-   `npm run electron:build` - Build Electron app for production
-   `npm run test:ffmpeg` - Test FFmpeg binary installation
-   `npm run test:package` - Test application packaging

## FFmpeg Integration

This application includes **bundled FFmpeg binaries** for seamless video processing:

-   ✅ **No manual installation required** - FFmpeg is automatically bundled
-   ✅ **Cross-platform support** - Works on Windows, macOS, and Linux
-   ✅ **Optimized binaries** - Platform-specific builds for best performance
-   ✅ **Self-contained** - No external dependencies

For detailed information about the FFmpeg integration, see [docs/FFMPEG_INTEGRATION.md](docs/FFMPEG_INTEGRATION.md).

## Architecture

-   **Frontend**: Vue.js 3 with TypeScript and Tailwind CSS
-   **Backend**: Electron main process with Node.js
-   **Database**: SQLite for local data storage
-   **Services**: Modular service architecture for transcription and AI processing
-   **Media Processing**: Bundled FFmpeg binaries for cross-platform video processing

## Technologies

-   [Vue.js](https://vuejs.org/) - Frontend framework
-   [Electron](https://www.electronjs.org/) - Framework for building desktop apps
-   [FFmpeg](https://ffmpeg.org/) - Media processing (bundled binaries)
-   [SQLite](https://www.sqlite.org/) - Local database
-   [OpenAI API](https://openai.com/api/) - For AI-powered content indexing
-   [Whisper](https://github.com/openai/whisper) - For speech-to-text transcription

## License

This project is licensed under the GNU Lesser General Public License v3.0 or later - see the [LICENSE](LICENSE) file for details.

### License Compatibility

-   **App**: LGPL-3.0-or-later (provides copyleft protection while allowing commercial use)
-   **FFmpeg**: LGPL-2.1 (compatible - can be upgraded to LGPL-3.0)
-   **Other Dependencies**: MIT/ISC/BSD/Apache-2.0 (all compatible with LGPL)

This means:

-   ✅ Users can use the application freely, including commercially
-   ✅ The application can be integrated into larger proprietary systems
-   ✅ Any modifications to the application itself must be shared under LGPL
-   ✅ Full compatibility with all bundled dependencies
