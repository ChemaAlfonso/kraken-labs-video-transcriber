<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-6">Kraken Labs Media Transcriber</h1>
    
    <div class="bg-white shadow rounded-lg p-6 mb-6">
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Media Source</label>
        <div class="flex gap-4">
          <button 
            @click="openFileDialog" 
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            :disabled="isGenerating"
          >
            Select Video or Audio File
          </button>
        </div>
        <p v-if="selectedFile" class="mt-2 text-sm text-gray-600">Selected: {{ selectedFile.name }}</p>
        <p class="mt-1 text-xs text-gray-500">
          Supported formats: MP4, AVI, MOV, MKV (video) • MP3, WAV, FLAC, M4A, AAC, OGG (audio)
        </p>
      </div>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Title</label>
        <input 
          v-model="title" 
          type="text" 
          placeholder="Enter a title for this generation" 
          class="w-full p-2 border rounded"
          :disabled="isGenerating"
        />
      </div>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Language</label>
        <select v-model="language" class="w-full p-2 border rounded" :disabled="isGenerating">
          <option value="es">Spanish (Default)</option>
          <option value="en">English</option>
          <option value="fr">French</option>
          <option value="de">German</option>
          <option value="it">Italian</option>
          <option value="pt">Portuguese</option>
          <option value="auto">Auto Detect</option>
        </select>
      </div>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Custom Prompt</label>
        <textarea 
          v-model="prompt" 
          rows="4" 
          placeholder="Create a detailed table of contents for this media with timestamps, highlighting the main topics and subtopics discussed. Use the transcription below:

{transcription}" 
          class="w-full p-2 border rounded resize-none"
          :disabled="isGenerating"
        ></textarea>
        <p class="mt-1 text-xs text-gray-500">
          You can customize how the AI processes your content. Use {transcription} to reference the transcribed content.
        </p>
      </div>
      
      <button 
        @click="handleGenerateClick" 
        class="w-full py-3 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 flex items-center justify-center"
        :disabled="isGenerating || !canGenerate"
      >
        <span v-if="isGenerating">
          Processing...
        </span>
        <span v-else>
          Generate Content Index
        </span>
      </button>
    </div>
    
    <!-- Configuration Warning Modal -->
    <ConfigurationWarningModal
      :show="showConfigModal"
      :issues="configurationIssues"
      @close="closeConfigModal"
      @goToConfiguration="goToConfiguration"
    />
    
    <!-- Progress Display - More Visible -->
    <div v-if="generationProgress" class="bg-white shadow-lg rounded-lg p-6 border-l-4 border-blue-500 mt-6 animate-fade-in">
      <h2 class="text-xl font-semibold mb-4 text-blue-700 flex items-center">
        <span class="animate-spin mr-2">⚙️</span>
        Processing Media
      </h2>
      
      <div class="mb-4">
        <div class="flex justify-between text-sm font-medium text-gray-700 mb-2">
          <span>{{ generationProgress.status }}</span>
          <span>{{ generationProgress.percentage }}%</span>
        </div>
        <div class="h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
          <div 
            class="h-full bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-700 ease-out shadow-sm"
            :style="{ width: `${generationProgress.percentage}%` }"
          ></div>
        </div>
      </div>
      
      <div class="text-sm text-gray-600 bg-gray-50 p-3 rounded">
        <p class="flex items-center">
          <span class="w-2 h-2 bg-blue-500 rounded-full mr-2 animate-pulse"></span>
          {{ generationProgress.status }}
        </p>
      </div>
    </div>
    
    <!-- Error handling now done via toast notification -->
    
    <!-- Toast Notification for Errors -->
    <div 
      v-if="error" 
      class="fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg bg-red-500 text-white transition-all duration-300 ease-out transform"
      :class="error ? 'translate-y-0 opacity-100' : '-translate-y-full opacity-0'"
    >
      <div class="flex items-center">
        <p class="font-medium">{{ error }}</p>
        <button @click="error = ''" class="ml-3 text-white hover:text-gray-200">
          ✕
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted } from 'vue';
import { useRouter } from 'vue-router';
import ConfigurationWarningModal, { ConfigurationIssue } from '../components/ConfigurationWarningModal.vue';

interface ProgressStatus {
  percentage: number;
  status: string;
}

export default defineComponent({
  name: 'Generator',
  components: {
    ConfigurationWarningModal
  },
  setup() {
    const router = useRouter();
    const selectedFile = ref<File | null>(null);
    const title = ref('');
    const language = ref('es');
    const prompt = ref('Create a detailed table of contents for this media with timestamps, highlighting the main topics and subtopics discussed. Use the transcription below:\n\n{transcription}');
    const isGenerating = ref(false);
    const generationProgress = ref<ProgressStatus | null>(null);
    const videoPath = ref('');
    const error = ref('');
    const showConfigModal = ref(false);
    const configurationIssues = ref<ConfigurationIssue[]>([]);

    // Computed property to check if generation can be started
    const canGenerate = computed(() => {
      return selectedFile.value !== null && title.value.trim() !== '';
    });

    // Check configuration validity
    const checkConfiguration = async (): Promise<ConfigurationIssue[]> => {
      const issues: ConfigurationIssue[] = [];
      
      try {
        // Get selected services
        const transcriptionService = await window.electronAPI.getTranscriptionService();
        const generationService = await window.electronAPI.getGenerationService();
        
        // Check transcription service configuration
        const transcriptionConfig = await window.electronAPI.getApiConfig(transcriptionService);
        if (transcriptionService === 'openai') {
          if (!transcriptionConfig.apiKey || transcriptionConfig.apiKey.trim() === '') {
            issues.push({
              type: 'transcription-api-key',
              title: 'OpenAI API Key Missing',
              description: 'You need to configure your OpenAI API key for transcription services.'
            });
          }
        } else if (transcriptionService === 'custom') {
          if (!transcriptionConfig.host || transcriptionConfig.host.trim() === '') {
            issues.push({
              type: 'transcription-host',
              title: 'Custom API URL Missing',
              description: 'You need to configure the base URL for your custom transcription API.'
            });
          }
        }
        
        // Check generation service configuration
        const generationConfig = await window.electronAPI.getApiConfig(generationService);
        if (generationService === 'openai') {
          if (!generationConfig.apiKey || generationConfig.apiKey.trim() === '') {
            issues.push({
              type: 'generation-api-key',
              title: 'OpenAI API Key Missing',
              description: 'You need to configure your OpenAI API key for AI generation services.'
            });
          }
        } else if (generationService === 'custom') {
          if (!generationConfig.host || generationConfig.host.trim() === '') {
            issues.push({
              type: 'generation-host',
              title: 'Custom API URL Missing',
              description: 'You need to configure the base URL for your custom AI generation API.'
            });
          }
        }
        
        // Check if models are configured
        if (!transcriptionConfig.model || transcriptionConfig.model.trim() === '') {
          issues.push({
            type: 'transcription-model',
            title: 'Transcription Model Missing',
            description: 'You need to specify a model for transcription services.'
          });
        }
        
        if (!generationConfig.model || generationConfig.model.trim() === '') {
          issues.push({
            type: 'generation-model',
            title: 'Generation Model Missing',
            description: 'You need to specify a model for AI generation services.'
          });
        }
        
      } catch (err) {
        console.error('Error checking configuration:', err);
        issues.push({
          type: 'config-error',
          title: 'Configuration Error',
          description: 'Unable to load configuration. Please check your settings.'
        });
      }
      
      return issues;
    };

    const handleGenerateClick = async () => {
      if (!canGenerate.value) return;
      
      // Check configuration before starting
      const issues = await checkConfiguration();
      if (issues.length > 0) {
        configurationIssues.value = issues;
        showConfigModal.value = true;
        return;
      }
      
      isGenerating.value = true;
      error.value = '';
      
      // Clear any previous progress state
      clearProgress();
      
      try {
        console.log('🚀 Starting generation process...');
        console.log('📋 Generation parameters:', {
          title: title.value,
          filePath: videoPath.value,
          language: language.value,
          prompt: prompt.value
        });

        // Detect file type
        const fileExtension = videoPath.value.split('.').pop()?.toLowerCase();
        const audioExtensions = ['mp3', 'wav', 'flac', 'm4a', 'aac', 'ogg', 'wma', 'opus', 'amr'];
        const isAudio = audioExtensions.includes(fileExtension || '');

        // Set initial progress
        updateProgress('Starting generation process...', 0);
        
        let pathToProcess = '';
        
        if (videoPath.value) {
          // Use the selected local file
          pathToProcess = videoPath.value;
          console.log('📁 Processing file:', pathToProcess);
        } else {
          error.value = 'No media file selected';
          isGenerating.value = false;
          clearProgress();
          return;
        }
        
        // Handle audio extraction or direct processing
        if (isAudio) {
          updateProgress('Processing and optimizing audio...', 20);
          console.log('🎵 Audio file detected, will be processed and optimized for transcription');
        } else {
          updateProgress('Extracting and compressing audio from video...', 20);
          console.log('🎬 Video file detected, audio will be extracted during processing');
        }
        
        // Call transcription service
        updateProgress('Transcribing audio...', 40);
        
        // Get service configurations from saved settings
        const savedTranscriptionService = await window.electronAPI.getTranscriptionService();
        const savedGenerationService = await window.electronAPI.getGenerationService();
        
        const result = await window.electronAPI.transcribeVideo({
          audioPath: pathToProcess,
          transcriptionService: savedTranscriptionService,
          aiService: savedGenerationService,
          prompt: prompt.value,
          language: language.value
        });
        console.log('✅ Transcription and index generation completed');
        
        // Save the result
        updateProgress('Saving result...', 90);
        console.log('💾 Saving results to database...');
        await window.electronAPI.saveResult({
          title: title.value,
          source: videoPath.value,
          language: language.value,
          transcription: result.transcription,
          index: result.index,
          prompt: prompt.value,
          audio_path: pathToProcess
        });
        console.log('✅ Results saved successfully');
        
        updateProgress('Generation complete!', 100);
        
        // Clear progress and navigate after a short delay
        setTimeout(() => {
          clearProgress();
          router.push('/generations');
        }, 1000);
        
      } catch (err) {
        console.error('❌ Error during generation:', err);
        error.value = `Error during generation: ${err}`;
        updateProgress('Generation failed', 0);
        clearProgress();
      } finally {
        isGenerating.value = false;
      }
    };

    const closeConfigModal = () => {
      showConfigModal.value = false;
    };

    const goToConfiguration = () => {
      showConfigModal.value = false;
      router.push('/configuration');
    };

    // Get default language and load saved settings on component mount
    onMounted(async () => {
      try {
        const defaultLanguage = await window.electronAPI.getDefaultLanguage();
        language.value = defaultLanguage;
        
        // Load saved user prompt
        const savedPrompt = await window.electronAPI.getUserPrompt();
        prompt.value = savedPrompt;
        
        // Restore progress if generation was in progress
        const savedProgress = localStorage.getItem('generationProgress');
        const wasGenerating = localStorage.getItem('isGenerating') === 'true';
        
        if (savedProgress && wasGenerating) {
          const progress = JSON.parse(savedProgress);
          // Only restore if generation was not completed (less than 100%)
          if (progress.percentage < 100) {
            generationProgress.value = progress;
            isGenerating.value = true;
            console.log('🔄 Restored generation progress:', generationProgress.value);
          } else {
            // Clear completed generation progress
            clearProgress();
            console.log('🧹 Cleared completed generation progress');
          }
        }
      } catch (err) {
        console.error('Failed to load defaults:', err);
      }
    });

    const openFileDialog = async () => {
      try {
        const selected = await window.electronAPI.openVideoDialog();
        
        if (selected) {
          videoPath.value = selected;
          const parts = selected.split(/[\/\\]/);
          const filename = parts[parts.length - 1];
          selectedFile.value = { name: filename } as any;
          
          // Auto-generate title from filename
          const nameWithoutExt = filename.split('.').slice(0, -1).join('.');
          title.value = nameWithoutExt;
        }
      } catch (err) {
        console.error('Error selecting file:', err);
        error.value = `Error selecting file: ${err}`;
      }
    };

    const updateProgress = (stage: string, percentage: number) => {
      generationProgress.value = {
        percentage,
        status: stage
      };
      
      // Persist progress to localStorage only while generating
      if (isGenerating.value && percentage < 100) {
        localStorage.setItem('generationProgress', JSON.stringify(generationProgress.value));
        localStorage.setItem('isGenerating', 'true');
        console.log('📊 Progress updated:', stage, `${percentage}%`);
      }
    };

    const clearProgress = () => {
      // Clear localStorage progress
      localStorage.removeItem('generationProgress');
      localStorage.removeItem('isGenerating');
      generationProgress.value = null;
      console.log('🧹 Progress cleared from localStorage');
    };

    const saveUserPrompt = async () => {
      try {
        await window.electronAPI.setUserPrompt(prompt.value);
        console.log('✅ User prompt saved');
      } catch (err) {
        console.error('Failed to save user prompt:', err);
      }
    };

    return {
      selectedFile,
      title,
      language,
      prompt,
      isGenerating,
      generationProgress,
      canGenerate,
      error,
      showConfigModal,
      configurationIssues,
      openFileDialog,
      handleGenerateClick,
      closeConfigModal,
      goToConfiguration,
      saveUserPrompt,
      clearProgress
    };
  }
});
</script>

<style scoped>
@keyframes fade-in {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.animate-fade-in {
  animation: fade-in 0.5s ease-out;
}
</style> 