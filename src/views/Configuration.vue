<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-6">Configuration</h1>
    
    <div v-if="isLoading" class="p-6 bg-white rounded-lg shadow mb-6">
      <p class="text-center text-gray-500">Loading configuration...</p>
    </div>
    
    <div v-else class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <!-- Service Configuration -->
      <div class="bg-white shadow rounded-lg p-6 mb-6">
        <h2 class="text-xl font-bold mb-4">Service Configuration</h2>
        <p class="text-sm text-gray-600 mb-4">Choose which services to use for transcription and AI generation.</p>
        
        <div class="grid grid-cols-1 gap-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">Transcription Service</label>
            <select v-model="transcriptionService" @change="saveTranscriptionService" class="w-full p-2 border rounded">
              <option value="openai">OpenAI Whisper API</option>
              <option value="custom">Custom API (OpenAI Compatible)</option>
            </select>
            <p class="text-xs text-gray-500 mt-1">Service used for audio transcription</p>
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-2">AI Generation Service</label>
            <select v-model="generationService" @change="saveGenerationService" class="w-full p-2 border rounded">
              <option value="openai">OpenAI GPT</option>
              <option value="custom">Custom API (OpenAI Compatible)</option>
            </select>
            <p class="text-xs text-gray-500 mt-1">Service used for content generation</p>
          </div>
        </div>
      </div>
      
      <!-- API Configuration -->
      <div class="bg-white shadow rounded-lg p-6">
        <h2 class="text-xl font-bold mb-4">API Configuration</h2>
        
        <div class="mb-6">
          <h3 class="text-lg font-semibold mb-3">OpenAI</h3>
          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <input 
              v-model="openaiConfig.api_key" 
              type="password" 
              class="w-full p-2 border rounded"
              placeholder="sk-..." 
            />
          </div>
          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Chat Model</label>
            <select 
              v-model="openaiConfig.model" 
              class="w-full p-2 border rounded"
            >
              <optgroup label="Latest Models (Most Capable)">
                <option value="gpt-4o">GPT-4o (Recommended)</option>
                <option value="gpt-4o-mini">GPT-4o Mini (Fast & Affordable)</option>
                <option value="gpt-4-turbo">GPT-4 Turbo</option>
                <option value="gpt-4-turbo-preview">GPT-4 Turbo Preview</option>
              </optgroup>
              <optgroup label="GPT-4 Family">
                <option value="gpt-4">GPT-4</option>
                <option value="gpt-4-32k">GPT-4 32K</option>
              </optgroup>
              <optgroup label="GPT-3.5 Family (Budget-Friendly)">
                <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                <option value="gpt-3.5-turbo-16k">GPT-3.5 Turbo 16K</option>
              </optgroup>
            </select>
            <p class="mt-1 text-sm text-gray-500">
              GPT-4o Mini is recommended for cost-effective usage while maintaining good quality.
            </p>
          </div>
          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
            <input 
              v-model.number="openaiConfig.temperature" 
              type="range" 
              min="0" 
              max="1" 
              step="0.1" 
              class="w-full"
            />
            <div class="flex justify-between text-xs text-gray-500">
              <span>0 (More Precise)</span>
              <span>{{ openaiConfig.temperature }}</span>
              <span>1 (More Creative)</span>
            </div>
          </div>
          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Whisper Model</label>
            <select 
              v-model="openaiConfig.whisper_model" 
              class="w-full p-2 border rounded"
            >
              <option value="whisper-1">whisper-1 (Standard)</option>
            </select>
            <p class="mt-1 text-sm text-gray-500">
              OpenAI currently supports whisper-1 as the standard model.
            </p>
          </div>
          <button 
            @click="saveApiConfig('openai')" 
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save OpenAI Settings
          </button>
        </div>
        
        <div>
          <h3 class="text-lg font-semibold mb-3">Custom API</h3>
          <p class="text-sm text-gray-600 mb-3">
            Configure a custom OpenAI-compatible API endpoint for both transcription and LLM services.
          </p>
          
          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
            <input 
              v-model="customConfig.host" 
              type="text" 
              class="w-full p-2 border rounded" 
              placeholder="https://api.example.com"
            />
            <p class="mt-1 text-sm text-gray-500">
              Base URL for your OpenAI-compatible API (e.g., https://api.groq.com, http://localhost:8000)
            </p>
          </div>
          
          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">API Key</label>
            <input 
              v-model="customConfig.api_key" 
              type="password" 
              class="w-full p-2 border rounded" 
              placeholder="Your API key (if required)"
            />
          </div>
          
          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Chat Model</label>
            <input 
              v-model="customConfig.model" 
              type="text" 
              class="w-full p-2 border rounded"
              placeholder="e.g., llama-3.1-70b-versatile, gpt-4o-mini, mixtral-8x7b-32768"
            />
            <p class="mt-1 text-sm text-gray-500">
              Popular options: Groq (llama-3.1-70b-versatile), OpenAI-compatible servers, local models
            </p>
          </div>
          
          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Whisper Model</label>
            <select 
              v-model="customConfig.whisper_model" 
              class="w-full p-2 border rounded"
            >
              <option value="whisper-1">whisper-1 (OpenAI Default)</option>
              <option value="tiny">tiny (39M params, ~1 GB RAM, ~10x speed)</option>
              <option value="base">base (74M params, ~1 GB RAM, ~7x speed)</option>
              <option value="small">small (244M params, ~2 GB RAM, ~4x speed)</option>
              <option value="medium">medium (769M params, ~5 GB RAM, ~2x speed)</option>
              <option value="large">large (1550M params, ~10 GB RAM, 1x speed)</option>
              <option value="turbo">turbo (809M params, ~6 GB RAM, ~8x speed)</option>
            </select>
            <p class="mt-1 text-sm text-gray-500">
              Select the Whisper model for transcription. Larger models are more accurate but require more RAM and are slower. Speed is relative to the 'large' model.
            </p>
          </div>
          
          <div class="mb-3">
            <label class="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
            <input 
              v-model.number="customConfig.temperature" 
              type="range" 
              min="0" 
              max="1" 
              step="0.1" 
              class="w-full"
            />
            <div class="flex justify-between text-xs text-gray-500">
              <span>0 (More Precise)</span>
              <span>{{ customConfig.temperature }}</span>
              <span>1 (More Creative)</span>
            </div>
          </div>
          
          <button 
            @click="saveApiConfig('custom')" 
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Custom API Settings
          </button>
        </div>
      </div>
      
      <!-- Default Settings -->
      <div>
        <div class="bg-white shadow rounded-lg p-6 mb-6">
          <h2 class="text-xl font-bold mb-4">Default Settings</h2>
          
          <div class="mb-4">
            <label class="block text-sm font-medium text-gray-700 mb-2">Default Language</label>
            <select v-model="defaultLanguage" class="w-full p-2 border rounded">
              <option value="es">Spanish</option>
              <option value="en">English</option>
              <option value="fr">French</option>
              <option value="de">German</option>
              <option value="it">Italian</option>
              <option value="pt">Portuguese</option>
              <option value="auto">Auto Detect</option>
            </select>
          </div>
          
          <button 
            @click="saveDefaultSettings" 
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Save Default Settings
          </button>
        </div>

        <!-- System Prompts Management -->
        <div class="bg-white shadow rounded-lg p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold">System Prompts</h2>
            <button 
              @click="showCreateSystemPromptModal = true" 
              class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create New
            </button>
          </div>
          <p class="text-sm text-gray-600 mb-4">
            System prompts define the AI's role and behavior. The selected prompt applies to all generations.
          </p>
          
          <div v-if="promptsLoading" class="text-center py-4">
            <p class="text-gray-500">Loading prompts...</p>
          </div>
          
          <div v-else class="space-y-3">
            <div 
              v-for="prompt in systemPrompts" 
              :key="prompt.id"
              class="border rounded-lg p-4"
              :class="selectedSystemPromptId === prompt.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <h3 class="font-medium">{{ prompt.name }}</h3>
                    <span v-if="prompt.is_default" class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Default</span>
                    <span v-if="selectedSystemPromptId === prompt.id" class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Selected</span>
                  </div>
                  <p class="text-sm text-gray-600 mb-2">{{ truncateText(prompt.content, 150) }}</p>
                  <p class="text-xs text-gray-400">Created: {{ formatDate(prompt.created_at) }}</p>
                </div>
                <div class="flex gap-2 ml-4">
                  <button 
                    v-if="selectedSystemPromptId !== prompt.id"
                    @click="selectSystemPrompt(prompt.id!)" 
                    class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Select
                  </button>
                  <button 
                    @click="editSystemPrompt(prompt)" 
                    class="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Edit
                  </button>
                  <button 
                    @click="deleteSystemPromptConfirm(prompt.id!)" 
                    class="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    :disabled="systemPrompts.length <= 1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- User Prompts Management -->
        <div class="bg-white shadow rounded-lg p-6 mb-6">
          <div class="flex items-center justify-between mb-4">
            <h2 class="text-xl font-bold">User Prompts</h2>
            <button 
              @click="showCreateUserPromptModal = true" 
              class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Create New
            </button>
          </div>
          <p class="text-sm text-gray-600 mb-4">
            User prompts define what you want the AI to do with your content. You can select different prompts for different use cases.
          </p>
          
          <div v-if="promptsLoading" class="text-center py-4">
            <p class="text-gray-500">Loading prompts...</p>
          </div>
          
          <div v-else class="space-y-3">
            <div 
              v-for="prompt in userPrompts" 
              :key="prompt.id"
              class="border rounded-lg p-4"
              :class="selectedUserPromptId === prompt.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'"
            >
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <h3 class="font-medium">{{ prompt.name }}</h3>
                    <span v-if="prompt.is_default" class="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded">Default</span>
                    <span v-if="selectedUserPromptId === prompt.id" class="px-2 py-1 text-xs bg-green-100 text-green-800 rounded">Selected</span>
                  </div>
                  <p class="text-sm text-gray-600 mb-2">{{ truncateText(prompt.content, 150) }}</p>
                  <p class="text-xs text-gray-400">Created: {{ formatDate(prompt.created_at) }}</p>
                </div>
                <div class="flex gap-2 ml-4">
                  <button 
                    v-if="selectedUserPromptId !== prompt.id"
                    @click="selectUserPrompt(prompt.id!)" 
                    class="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    Select
                  </button>
                  <button 
                    @click="editUserPrompt(prompt)" 
                    class="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
                  >
                    Edit
                  </button>
                  <button 
                    @click="deleteUserPromptConfirm(prompt.id!)" 
                    class="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    :disabled="userPrompts.length <= 1"
                  >
                    Delete
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Configuration Info -->
        <div class="bg-blue-50 border border-blue-200 rounded-lg p-6 mb-6">
          <h2 class="text-xl font-bold mb-4 text-blue-800">Configuration Notes</h2>
          
          <div class="space-y-3 text-sm text-blue-700">
            <div>
              <h4 class="font-semibold">System Prompt:</h4>
              <p>Defines the AI's role and behavior for all generations. This sets the context and personality of the assistant.</p>
            </div>
            
            <div>
              <h4 class="font-semibold">OpenAI Service:</h4>
              <p>Uses official OpenAI API for both Whisper transcription and GPT chat completions.</p>
            </div>
            
            <div>
              <h4 class="font-semibold">Custom API Service:</h4>
              <p>Connect to any OpenAI-compatible API endpoint. Supports:</p>
              <ul class="list-disc list-inside ml-4">
                <li>Groq API (fast inference)</li>
                <li>Local LLaMA.cpp servers</li>
                <li>Ollama with OpenAI compatibility</li>
                <li>Other OpenAI-compatible services</li>
              </ul>
            </div>
            
          </div>
        </div>
        
        <!-- File Locations Info -->
        <div class="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h2 class="text-xl font-bold mb-4 text-gray-800">📁 File Locations</h2>
          
          <div class="space-y-3 text-sm text-gray-700">
            <div>
              <h4 class="font-semibold">Database:</h4>
              <p class="text-sm text-gray-600">
                Database location: <code class="bg-gray-100 px-1 rounded">{{ userDataPath }}/data/kraken-labs-video-transcriber.db</code>
              </p>
            </div>
            
            <div>
              <h4 class="font-semibold">Audio Files (Temporary):</h4>
              <p class="font-mono text-xs bg-white p-2 rounded border break-all">
                {{ userDataPath }}/temp/
              </p>
            </div>
            
            <div>
              <h4 class="font-semibold">Note:</h4>
              <p class="text-xs">Audio files are temporary and automatically cleaned up. Your data is stored in the database above.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Toast Notification -->
    <div 
      v-if="message" 
      class="fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg transition-all duration-300 ease-out transform"
      :class="[
        messageType === 'success' 
          ? 'bg-green-500 text-white' 
          : 'bg-red-500 text-white',
        message ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'
      ]"
    >
      <div class="flex items-center">
        <p class="font-medium">{{ message }}</p>
        <button @click="message = ''" class="ml-3 text-white hover:text-gray-200">
          ✕
        </button>
      </div>
    </div>

    <!-- Modals -->
    <PromptModal
      :show="showCreateSystemPromptModal"
      prompt-type="System"
      :is-editing="false"
      @close="showCreateSystemPromptModal = false"
      @submit="handleCreateSystemPrompt"
    />

    <PromptModal
      :show="showEditSystemPromptModal"
      prompt-type="System"
      :is-editing="true"
      :initial-data="editingSystemPrompt"
      @close="closeEditSystemPromptModal"
      @submit="handleEditSystemPrompt"
    />

    <PromptModal
      :show="showCreateUserPromptModal"
      prompt-type="User"
      :is-editing="false"
      @close="showCreateUserPromptModal = false"
      @submit="handleCreateUserPrompt"
    />

    <PromptModal
      :show="showEditUserPromptModal"
      prompt-type="User"
      :is-editing="true"
      :initial-data="editingUserPrompt"
      @close="closeEditUserPromptModal"
      @submit="handleEditUserPrompt"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, onMounted } from 'vue';
import { usePrompts } from '../composables/usePrompts';
import PromptModal from '../components/PromptModal.vue';

interface ApiConfig {
  id?: number;
  api_type: string;
  api_key: string;
  model: string;
  host: string;
  temperature: number;
  whisper_model: string;
}

export default defineComponent({
  name: 'Configuration',
  components: {
    PromptModal
  },
  setup() {
    const isLoading = ref(true);
    const openaiConfig = ref<ApiConfig>({
      api_type: 'openai',
      api_key: '',
      model: 'gpt-4o-mini',
      host: '',
      temperature: 1,
      whisper_model: 'whisper-1'
    });
    
    const customConfig = ref<ApiConfig>({
      api_type: 'custom',
      api_key: '',
      model: 'gpt-4o-mini',
      host: '',
      temperature: 1,
      whisper_model: 'whisper-1'
    });
    
    const defaultLanguage = ref('es');
    const systemPrompt = ref('');
    
    const message = ref('');
    const messageType = ref<'success' | 'error'>('success');
    const userDataPath = ref('');
    
    const transcriptionService = ref('openai');
    const generationService = ref('openai');

    // Prompts management
    const {
      systemPrompts,
      userPrompts,
      selectedSystemPromptId,
      selectedUserPromptId,
      isLoading: promptsLoading,
      error: promptsError,
      loadPrompts,
      createSystemPrompt,
      updateSystemPrompt,
      deleteSystemPrompt,
      setSelectedSystemPrompt,
      createUserPrompt,
      updateUserPrompt,
      deleteUserPrompt,
      setSelectedUserPrompt
    } = usePrompts();

    // Modal states
    const showCreateSystemPromptModal = ref(false);
    const showCreateUserPromptModal = ref(false);
    const showEditSystemPromptModal = ref(false);
    const showEditUserPromptModal = ref(false);
    const editingSystemPrompt = ref<any>(null);
    const editingUserPrompt = ref<any>(null);
    
    // Load the configs from the backend
    const loadConfigurations = async () => {
      isLoading.value = true;
      try {
        // Load API configs with proper defaults
        const loadedOpenaiConfig = await window.electronAPI.getApiConfig('openai');
        openaiConfig.value = {
          api_type: 'openai',
          api_key: loadedOpenaiConfig.apiKey || '',
          model: loadedOpenaiConfig.model || 'gpt-4o-mini',
          host: loadedOpenaiConfig.host || '',
          temperature: Number(loadedOpenaiConfig.temperature) ?? 1,
          whisper_model: loadedOpenaiConfig.whisperModel || 'whisper-1'
        };
        
        const loadedCustomConfig = await window.electronAPI.getApiConfig('custom');
        customConfig.value = {
          api_type: 'custom',
          api_key: loadedCustomConfig.apiKey || '',
          model: loadedCustomConfig.model || 'gpt-4o-mini',
          host: loadedCustomConfig.host || '',
          temperature: Number(loadedCustomConfig.temperature) ?? 1,
          whisper_model: loadedCustomConfig.whisperModel || 'whisper-1'
        };
        
        // Load default settings
        defaultLanguage.value = await window.electronAPI.getDefaultLanguage();
        systemPrompt.value = await window.electronAPI.getSystemPrompt();
        userDataPath.value = await window.electronAPI.getUserDataPath();
        
        // Load service settings
        transcriptionService.value = await window.electronAPI.getTranscriptionService();
        generationService.value = await window.electronAPI.getGenerationService();
        
        // Load prompts
        await loadPrompts();
      } catch (err) {
        console.error('Failed to load configuration:', err);
        showMessage(`Failed to load configuration: ${err}`, 'error');
      } finally {
        isLoading.value = false;
      }
    };
    
    // Save API configuration
    const saveApiConfig = async (apiType: string) => {
      try {
        let configToSave: ApiConfig;
        
        switch (apiType) {
          case 'openai':
            configToSave = { ...openaiConfig.value };
            break;
          case 'custom':
            configToSave = { ...customConfig.value };
            break;
          default:
            throw new Error(`Unknown API type: ${apiType}`);
        }
        
        // Ensure we pass a plain object without reactive properties
        const plainConfig = {
          api_type: configToSave.api_type,
          apiKey: configToSave.api_key,
          model: configToSave.model,
          host: configToSave.host,
          temperature: Number(configToSave.temperature),
          whisperModel: configToSave.whisper_model
        };
        
        await window.electronAPI.saveApiConfig(plainConfig);
        showMessage(`${getServiceDisplayName(apiType)} configuration saved successfully`, 'success');
      } catch (err) {
        console.error(`Failed to save ${apiType} configuration:`, err);
        showMessage(`Failed to save configuration: ${err}`, 'error');
      }
    };
    
    // Save default settings
    const saveDefaultSettings = async () => {
      try {
        await window.electronAPI.setDefaultLanguage(defaultLanguage.value);
        await window.electronAPI.setSystemPrompt(systemPrompt.value);
        showMessage('Default settings saved successfully', 'success');
      } catch (err) {
        console.error('Failed to save default settings:', err);
        showMessage(`Failed to save default settings: ${err}`, 'error');
      }
    };
    
    // Get a display name for a service
    const getServiceDisplayName = (serviceName: string) => {
      switch (serviceName) {
        case 'openai':
          return 'OpenAI';
        case 'custom':
          return 'Custom API';
        default:
          return serviceName;
      }
    };
    
    // Show a message
    const showMessage = (msg: string, type: 'success' | 'error') => {
      message.value = msg;
      messageType.value = type;
      setTimeout(() => {
        message.value = '';
      }, 5000);
    };
    
    // Save transcription service
    const saveTranscriptionService = async () => {
      try {
        await window.electronAPI.setTranscriptionService(transcriptionService.value);
        showMessage(`Transcription service saved successfully`, 'success');
      } catch (err) {
        console.error('Failed to save transcription service:', err);
        showMessage(`Failed to save transcription service: ${err}`, 'error');
      }
    };
    
    // Save generation service
    const saveGenerationService = async () => {
      try {
        await window.electronAPI.setGenerationService(generationService.value);
        showMessage(`Generation service saved successfully`, 'success');
      } catch (err) {
        console.error('Failed to save generation service:', err);
        showMessage(`Failed to save generation service: ${err}`, 'error');
      }
    };
    
    // Helper functions
    const truncateText = (text: string, length: number) => {
      return text.length > length ? text.substring(0, length) + '...' : text;
    };

    const formatDate = (dateString: string) => {
      return new Date(dateString).toLocaleDateString();
    };

    // System prompt management functions
    const selectSystemPrompt = async (id: number) => {
      try {
        await setSelectedSystemPrompt(id);
        showMessage('System prompt selected successfully', 'success');
      } catch (err: any) {
        showMessage(err.message || 'Failed to select system prompt', 'error');
      }
    };

    const editSystemPrompt = (prompt: any) => {
      editingSystemPrompt.value = { ...prompt };
      showEditSystemPromptModal.value = true;
    };

    const deleteSystemPromptConfirm = async (id: number) => {
      if (confirm('Are you sure you want to delete this system prompt?')) {
        try {
          await deleteSystemPrompt(id);
          showMessage('System prompt deleted successfully', 'success');
        } catch (err: any) {
          showMessage(err.message || 'Failed to delete system prompt', 'error');
        }
      }
    };

    // User prompt management functions
    const selectUserPrompt = async (id: number) => {
      try {
        await setSelectedUserPrompt(id);
        showMessage('User prompt selected successfully', 'success');
      } catch (err: any) {
        showMessage(err.message || 'Failed to select user prompt', 'error');
      }
    };

    const editUserPrompt = (prompt: any) => {
      editingUserPrompt.value = { ...prompt };
      showEditUserPromptModal.value = true;
    };

    const deleteUserPromptConfirm = async (id: number) => {
      if (confirm('Are you sure you want to delete this user prompt?')) {
        try {
          await deleteUserPrompt(id);
          showMessage('User prompt deleted successfully', 'success');
        } catch (err: any) {
          showMessage(err.message || 'Failed to delete user prompt', 'error');
        }
      }
    };

    // Modal handlers
    const handleCreateSystemPrompt = async (promptData: { name: string; content: string; is_default?: boolean }) => {
      try {
        await createSystemPrompt(promptData);
        showCreateSystemPromptModal.value = false;
        showMessage('System prompt created successfully', 'success');
      } catch (err: any) {
        showMessage(err.message || 'Failed to create system prompt', 'error');
      }
    };

    const handleCreateUserPrompt = async (promptData: { name: string; content: string; is_default?: boolean }) => {
      try {
        await createUserPrompt(promptData);
        showCreateUserPromptModal.value = false;
        showMessage('User prompt created successfully', 'success');
      } catch (err: any) {
        showMessage(err.message || 'Failed to create user prompt', 'error');
      }
    };

    const handleEditSystemPrompt = async (promptData: { name: string; content: string; is_default?: boolean }) => {
      if (!editingSystemPrompt.value?.id) return;
      try {
        await updateSystemPrompt(editingSystemPrompt.value.id, promptData);
        closeEditSystemPromptModal();
        showMessage('System prompt updated successfully', 'success');
      } catch (err: any) {
        showMessage(err.message || 'Failed to update system prompt', 'error');
      }
    };

    const handleEditUserPrompt = async (promptData: { name: string; content: string; is_default?: boolean }) => {
      if (!editingUserPrompt.value?.id) return;
      try {
        await updateUserPrompt(editingUserPrompt.value.id, promptData);
        closeEditUserPromptModal();
        showMessage('User prompt updated successfully', 'success');
      } catch (err: any) {
        showMessage(err.message || 'Failed to update user prompt', 'error');
      }
    };

    const closeEditSystemPromptModal = () => {
      showEditSystemPromptModal.value = false;
      editingSystemPrompt.value = null;
    };

    const closeEditUserPromptModal = () => {
      showEditUserPromptModal.value = false;
      editingUserPrompt.value = null;
    };

    // Load data on component mount
    onMounted(() => {
      loadConfigurations();
    });
    
    return {
      isLoading,
      openaiConfig,
      customConfig,
      defaultLanguage,
      systemPrompt,
      message,
      messageType,
      userDataPath,
      transcriptionService,
      generationService,
      saveApiConfig,
      saveDefaultSettings,
      getServiceDisplayName,
      saveTranscriptionService,
      saveGenerationService,
      
      // Prompts management
      systemPrompts,
      userPrompts,
      selectedSystemPromptId,
      selectedUserPromptId,
      promptsLoading,
      showCreateSystemPromptModal,
      showCreateUserPromptModal,
      showEditSystemPromptModal,
      showEditUserPromptModal,
      editingSystemPrompt,
      editingUserPrompt,
      
      // Helper functions
      truncateText,
      formatDate,
      
      // Prompt management functions
      selectSystemPrompt,
      editSystemPrompt,
      deleteSystemPromptConfirm,
      selectUserPrompt,
      editUserPrompt,
      deleteUserPromptConfirm,
      handleCreateSystemPrompt,
      handleCreateUserPrompt,
      handleEditSystemPrompt,
      handleEditUserPrompt,
      closeEditSystemPromptModal,
      closeEditUserPromptModal
    };
  }
});
</script> 