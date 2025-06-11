# Ollama Docker Service

Simple Docker setup for running [Ollama](https://ollama.com/) locally.

## 🚀 Quick Start

```bash
# 1. Copy config file
cp .env.example .env

# 2. Start Ollama
docker compose up -d

# 3. Pull a model
docker compose exec ollama ollama pull llama3.2:1b

# 4. Chat with the model
docker compose exec ollama ollama run llama3.2:1b
```

## 📋 Requirements

-   Docker and Docker Compose
-   At least 8GB RAM (16GB+ recommended)
-   Sufficient disk space for models (2GB+ per model)

## 🔧 Configuration

Edit `.env` to customize settings:

```env
# === BASIC SETTINGS ===
OLLAMA_HOST=0.0.0.0 # 0.0.0.0 to access across your local network
OLLAMA_PORT=11434 # The port to use for the API
OLLAMA_ORIGINS=* # * to allow all origins

# === MODEL MANAGEMENT ===
# OLLAMA_MODELS=/path/to/custom/models/dir # The directory to store downloaded models
# OLLAMA_KEEP_ALIVE=5m # The time to keep a model loaded in memory
# OLLAMA_MAX_LOADED_MODELS=3 # The maximum number of models to keep loaded

# === PERFORMANCE ===
# OLLAMA_NUM_PARALLEL=4 # The number of parallel requests to process
# OLLAMA_MAX_QUEUE=512 # The maximum number of requests to queue
# OLLAMA_LOAD_TIMEOUT=5m # The timeout for loading a model

# === GPU SETTINGS ===
# OLLAMA_MAX_VRAM=0 # The maximum amount of VRAM to use
# OLLAMA_SCHED_SPREAD=false # Spread requests across all GPUs
# OLLAMA_GPU_OVERHEAD=0 # The overhead for GPU usage

# === ADVANCED ===
# OLLAMA_DEBUG=false # Enable debug mode
# OLLAMA_FLASH_ATTENTION=false # Enable flash attention
# OLLAMA_NOPRUNE=false # Disable model pruning
# OLLAMA_TMPDIR=/tmp # The temporary directory to use

# === SECURITY (Production) ===
# OLLAMA_ORIGINS=https://yourdomain.com # The origins to allow

# === GPU VISIBILITY (System Level) ===
# CUDA_VISIBLE_DEVICES=0,1 # The GPUs to use
# HIP_VISIBLE_DEVICES=0 # The GPUs to use
```

## 🖥️ NVIDIA GPU Support

To enable GPU acceleration:

### 1. Install NVIDIA Container Toolkit

**Ubuntu/Debian:**

```bash
curl -fsSL https://nvidia.github.io/libnvidia-container/gpgkey | sudo gpg --dearmor -o /usr/share/keyrings/nvidia-container-toolkit-keyring.gpg
curl -s -L https://nvidia.github.io/libnvidia-container/stable/deb/nvidia-container-toolkit.list | sed 's#deb https://#deb [signed-by=/usr/share/keyrings/nvidia-container-toolkit-keyring.gpg] https://#g' | sudo tee /etc/apt/sources.list.d/nvidia-container-toolkit.list
sudo apt-get update && sudo apt-get install -y nvidia-container-toolkit
sudo systemctl restart docker
```

**CentOS/RHEL/Fedora:**

```bash
curl -s -L https://nvidia.github.io/libnvidia-container/stable/rpm/nvidia-container-toolkit.repo | sudo tee /etc/yum.repos.d/nvidia-container-toolkit.repo
sudo yum install -y nvidia-container-toolkit
sudo systemctl restart docker
```

### 2. Enable GPU in Docker Compose

Uncomment the GPU section in `compose.yaml`:

```yaml
# Uncomment the following lines for NVIDIA GPU support
# Make sure you have NVIDIA Container Toolkit installed
deploy:
    resources:
        reservations:
            devices:
                - driver: nvidia
                  count: all
                  capabilities: [gpu]
```

### 3. Restart the service

```bash
docker compose down
docker compose up -d
```

## 📚 Basic Usage

### Managing Models

```bash
# List available models
docker compose exec ollama ollama list

# Pull a model
docker compose exec ollama ollama pull codellama:7b

# Remove a model
docker compose exec ollama ollama rm codellama:7b
```

### Using the API

```bash
# Test the API
curl http://localhost:11434/api/tags

# Generate text
curl http://localhost:11434/api/generate -d '{
  "model": "llama3.2:1b",
  "prompt": "Hello, world!",
  "stream": false
}'
```

## 🎯 Recommended Models

-   **`llama3.2:1b`** (1.3GB) - Fastest, good for testing
-   **`llama3.2:3b`** (2.0GB) - Good balance of speed/quality
-   **`llama3.2:7b`** (4.7GB) - High quality text generation
-   **`codellama:7b`** (3.8GB) - Best for coding tasks

## 🔧 Service Management

```bash
# Start service
docker compose up -d

# View logs
docker compose logs -f

# Stop service
docker compose down

# Update to latest
docker compose pull && docker compose up -d
```

## 🛡️ Security Note

The default configuration allows all origins (`OLLAMA_ORIGINS=*`). For production use, restrict this to specific domains in your `.env` file.
