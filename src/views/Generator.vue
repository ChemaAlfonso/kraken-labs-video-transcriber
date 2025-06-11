<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-6">Kraken Labs Media Transcriber</h1>
    
    <div class="bg-white shadow rounded-lg p-6 mb-6">
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Media Source</label>
		<p class="text-xs text-gray-500 mb-2 font-bold">
			* Use ctrl/cmd + click to select multiple files.
		</p>
        <div class="flex gap-4">
          <button 
            @click="openFileDialog" 
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            :disabled="isGenerating"
          >
            Select Video or Audio Files
          </button>
        </div>
        <p class="my-2 text-xs text-gray-500">
          Supported formats: MP4, AVI, MOV, MKV (video) • MP3, WAV, FLAC, M4A, AAC, OGG (audio)
        </p>
        <div v-if="selectedFiles.length > 0" class="mt-2">
          <p class="text-sm text-gray-600 mb-2">Selected {{ selectedFiles.length }} files:</p>
          <div class="max-h-32 overflow-y-auto bg-gray-50 p-2 rounded border">
            <div v-for="(file, index) in selectedFiles" :key="index" class="text-xs text-gray-700 py-1 flex justify-start gap-2 items-center">
				<button @click="removeFile(index)" class="text-xs text-red-500 hover:bg-red-500 transition-colors duration-300 hover:text-white p-1 rounded-md w-6 h-6 flex items-center justify-center">✕</button>
              <span>
				<span class="font-bold">{{ index + 1 }}.</span> <span class="text-gray-500">{{ file.name }}</span>
			  </span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-700 mb-2">Title</label>
        <input 
          v-model="title" 
          type="text" 
		  multiple
          :placeholder="selectedFiles.length > 1 ? 'Filenames will be used as titles for multiple files' : 'Enter a title for this generation'"
          class="w-full p-2 border rounded"
          :disabled="isGenerating || selectedFiles.length > 1"
          :class="{ 'bg-gray-100 text-gray-500': selectedFiles.length > 1 }"
        />
        <p v-if="selectedFiles.length > 1" class="mt-1 text-xs text-red-500">
          For multiple files, each file's name will be used as its title automatically.
        </p>
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
      
      <!-- System Prompt Selection -->
      <div class="mb-4">
        <div class="flex items-center justify-between mb-2">
          <label class="block text-sm font-medium text-gray-700">System Prompt</label>
          <button 
            @click="goToConfiguration" 
            class="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Manage Prompts
          </button>
        </div>
        <select 
          v-model="selectedSystemPromptId" 
          @change="onSystemPromptChange"
          class="w-full p-2 border rounded"
          :disabled="isGenerating"
        >
          <option v-for="systemPrompt in systemPrompts" :key="systemPrompt.id" :value="systemPrompt.id">
            {{ systemPrompt.name }}{{ systemPrompt.is_default ? ' (Default)' : '' }}
          </option>
        </select>
        <p class="mt-1 text-xs text-gray-500">
          System prompt defines the AI's role and behavior. You can create and manage prompts in the Configuration section.
        </p>
      </div>

      <!-- User Prompt Selection -->
      <div class="mb-4">
        <div class="flex items-center justify-between mb-2">
          <label class="block text-sm font-medium text-gray-700">User Prompt</label>
          <button 
            @click="goToConfiguration" 
            class="text-xs text-blue-600 hover:text-blue-800 underline"
          >
            Manage Prompts
          </button>
        </div>
        <select 
          v-model="selectedUserPromptId" 
          @change="onUserPromptChange"
          class="w-full p-2 border rounded mb-2"
          :disabled="isGenerating"
        >
          <option v-for="userPrompt in userPrompts" :key="userPrompt.id" :value="userPrompt.id">
            {{ userPrompt.name }}{{ userPrompt.is_default ? ' (Default)' : '' }}
          </option>
        </select>
        <textarea 
          v-model="prompt" 
          rows="4" 
          placeholder="Create a detailed table of contents for this media with timestamps, highlighting the main topics and subtopics discussed. Use the transcription below:

{transcription}" 
          class="w-full p-2 border rounded resize-none"
          :disabled="isGenerating"
        ></textarea>
        <p class="mt-1 text-xs text-gray-500">
          User prompt defines what you want the AI to do with your content. Use {transcription} to reference the transcribed content.
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
          Generate Content
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
    
    <!-- Progress Display - Enhanced for Multi-file Processing -->
    <div v-if="generationProgress" class="bg-white shadow-lg rounded-lg p-6 border-l-4 border-blue-500 mt-6 animate-fade-in">
      <h2 class="text-xl font-semibold mb-4 text-blue-700 flex items-center">
        <span class="animate-spin mr-2">🌀</span>
        Processing Media
        <span v-if="selectedFiles.length > 1" class="ml-2 text-sm bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
          {{ selectedFiles.length }} files
        </span>
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
        <div v-if="generationProgress.totalFiles && generationProgress.totalFiles > 1" class="mt-2 space-y-1">
          <div class="text-xs text-gray-500">
            Progress: {{ generationProgress.processedFiles || 0 }} of {{ generationProgress.totalFiles }} files completed
          </div>
          <div v-if="generationProgress.currentFile" class="text-xs text-gray-500">
            Current file: {{ generationProgress.currentFile }}
          </div>
          <div v-if="generationProgress.currentStage" class="text-xs text-blue-600 font-medium">
            Stage: {{ generationProgress.currentStage }}
          </div>
        </div>
        <div v-else-if="generationProgress.currentStage" class="mt-2 text-xs text-blue-600 font-medium">
          Stage: {{ generationProgress.currentStage }}
        </div>
      </div>
	  <div class="mt-2 text-xs text-gray-500 font-medium bg-yellow-100 p-2 rounded-md">
		This may take a while. Please be patient.
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
  currentFile?: string | null;
  totalFiles?: number;
  processedFiles?: number;
  currentFileIndex?: number;
  currentStage?: string;
}

export default defineComponent({
  name: 'Generator',
  components: {
    ConfigurationWarningModal
  },
  setup() {
    const router = useRouter();
    const selectedFiles = ref<File[]>([]);
    const title = ref('');
    const language = ref('es');
    const prompt = ref('Create a detailed table of contents for this media with timestamps, highlighting the main topics and subtopics discussed. Use the transcription below:\n\n{transcription}');
    const isGenerating = ref(false);
    const generationProgress = ref<ProgressStatus | null>(null);
    const error = ref('');
    const showConfigModal = ref(false);
    const configurationIssues = ref<ConfigurationIssue[]>([]);

    // Prompt management
    const systemPrompts = ref<SystemPrompt[]>([]);
    const userPrompts = ref<UserPrompt[]>([]);
    const selectedSystemPromptId = ref<number | null>(null);
    const selectedUserPromptId = ref<number | null>(null);

    // Computed property to check if generation can be started
    const canGenerate = computed(() => {
      return selectedFiles.value.length > 0 && (selectedFiles.value.length > 1 || title.value.trim() !== '');
    });

	const removeFile = (index: number) => {
		selectedFiles.value.splice(index, 1);
		if (selectedFiles.value.length === 0) {
			title.value = '';
		} else if (selectedFiles.value.length === 1) {
			title.value = selectedFiles.value[0].name;
		} else {
			title.value = `${selectedFiles.value.length} files selected`;
		}
	}

	// Load prompts data
	const loadPrompts = async () => {
		try {
			systemPrompts.value = await window.electronAPI.getSystemPrompts();
			userPrompts.value = await window.electronAPI.getUserPrompts();

			// Load selected prompts
			const selectedSystemId = await window.electronAPI.getSelectedSystemPromptId();
			const selectedUserId = await window.electronAPI.getSelectedUserPromptId();

			selectedSystemPromptId.value = selectedSystemId;
			selectedUserPromptId.value = selectedUserId;

			// Update prompt text based on selected user prompt
			if (selectedUserId) {
				const selectedUserPrompt = userPrompts.value.find(p => p.id === selectedUserId);
				if (selectedUserPrompt) {
					prompt.value = selectedUserPrompt.content;
				}
			}
		} catch (err) {
			console.error('Error loading prompts:', err);
		}
	};

	// Handle system prompt changes
	const onSystemPromptChange = async () => {
		if (selectedSystemPromptId.value) {
			try {
				await window.electronAPI.setSelectedSystemPrompt(selectedSystemPromptId.value);
			} catch (err) {
				console.error('Error setting selected system prompt:', err);
			}
		}
	};

	// Handle user prompt changes
	const onUserPromptChange = async () => {
		if (selectedUserPromptId.value) {
			try {
				await window.electronAPI.setSelectedUserPrompt(selectedUserPromptId.value);
				// Update the prompt text
				const selectedUserPrompt = userPrompts.value.find(p => p.id === selectedUserPromptId.value);
				if (selectedUserPrompt) {
					prompt.value = selectedUserPrompt.content;
				}
			} catch (err) {
				console.error('Error setting selected user prompt:', err);
			}
		}
	};

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
        // Get service configurations from saved settings
        const savedTranscriptionService = await window.electronAPI.getTranscriptionService();
        const savedGenerationService = await window.electronAPI.getGenerationService();
        
        if (selectedFiles.value.length > 0) {
			console.log('🚀 Starting files generation process...');
			console.log('📋 Generation parameters:', {
				filesCount: selectedFiles.value.length,
				language: language.value,
				prompt: prompt.value
			});

			updateProgress('Starting queue processing...', 0);
			
			// Extract file paths from selected files
			const filePaths = selectedFiles.value.map((file: any) => file.path);
			
			// Prepare titles for single vs multiple files
			let titles: string[] | undefined = undefined;
			if (selectedFiles.value.length === 1 && title.value.trim()) {
				// Use custom title for single file
				titles = [title.value];
			}
			
			const results = await window.electronAPI.processFileQueue({
				filePaths: filePaths,
				titles: titles,
				transcriptionService: savedTranscriptionService,
				aiService: savedGenerationService,
				prompt: prompt.value,
				language: language.value
			});
			
			console.log('✅ Queue processing completed');
			const successCount = results.filter(r => r.success).length;
			const failCount = results.filter(r => !r.success).length;
			
			updateProgress(`Queue complete! Processed: ${successCount}, Failed: ${failCount}`, 100);
			
			// Show summary
			if (failCount > 0) {
				error.value = `Processed ${successCount} files successfully, ${failCount} files failed. Check console for details.`;
				console.error('Failed files:', results.filter(r => !r.success));
			}
		   
			// Clear progress and navigate after a short delay
			setTimeout(() => {
				clearProgress();
				router.push('/generations');
			}, 2000);
        } else {
			error.value = 'No media file(s) selected';
			isGenerating.value = false;
			clearProgress();
			return;
        }
       
        
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
        
        // Load prompts
        await loadPrompts();
        
        // Set up progress listener for file queue processing
        window.electronAPI.onProcessFileQueueProgress((data: { 
          progress: number; 
          processingFile: string | null; 
          currentFileIndex: number; 
          totalFiles: number; 
          currentStage: string; 
          processedFiles: number 
        }) => {
          console.log(`Processing ${data.processingFile || 'Unknown'}: ${data.progress}% - Stage: ${data.currentStage}`);
          
           const stageLabels: Record<string, string> = {
             'starting': 'Initializing...',
             'extracting': 'Processing media file...',
             'transcribing': 'Converting speech to text...',
             'generating': 'Generating content...',
             'saving': 'Saving results...',
             'completed': 'File completed!'
           };
           
           let statusMessage = '';
           if (data.totalFiles > 1) {
             statusMessage = `File ${data.currentFileIndex}/${data.totalFiles}`;
             if (data.processingFile) {
               statusMessage += ` - ${data.processingFile}`;
             }
             if (data.currentStage) {
               statusMessage += ` - ${stageLabels[data.currentStage] || data.currentStage}`;
             }
           } else {
             // Single file
             if (data.processingFile) {
               statusMessage = `Processing: ${data.processingFile}`;
             } else {
               statusMessage = 'Processing...';
             }
             if (data.currentStage) {
               statusMessage += ` - ${stageLabels[data.currentStage] || data.currentStage}`;
             }
           }
          
          updateProgress(statusMessage, data.progress, data.processingFile, data.totalFiles, data.processedFiles, data.currentFileIndex, data.currentStage);
        });
        
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
        
        if (selected && selected.length > 0) {
          // Store file paths and create display objects
          selectedFiles.value = selected.map(filePath => {
            const parts = filePath.split(/[\/\\]/);
            const filename = parts[parts.length - 1];
            return { name: filename, path: filePath } as any;
          });
          
          // Set title based on number of files
          if (selected.length === 1) {
            // Single file: auto-generate title from filename
            const fileName = selected[0].split(/[\/\\]/).pop() || '';
            const nameWithoutExt = fileName.split('.').slice(0, -1).join('.');
            title.value = nameWithoutExt;
          } else {
            // Multiple files: indicate count
            title.value = `${selected.length} files selected`;
          }
        }
      } catch (err) {
        console.error('Error selecting files:', err);
        error.value = `Error selecting files: ${err}`;
      }
    };

    const updateProgress = (
      stage: string, 
      percentage: number, 
      currentFile?: string | null, 
      totalFiles?: number, 
      processedFiles?: number, 
      currentFileIndex?: number, 
      currentStage?: string
    ) => {
      generationProgress.value = {
        percentage,
        status: stage,
        currentFile,
        totalFiles: totalFiles || selectedFiles.value.length,
        processedFiles: processedFiles || Math.floor((percentage / 100) * selectedFiles.value.length),
        currentFileIndex,
        currentStage
      };
      
      // Persist progress to localStorage only while generating
      if (isGenerating.value && percentage < 100) {
        localStorage.setItem('generationProgress', JSON.stringify(generationProgress.value));
        localStorage.setItem('isGenerating', 'true');
        console.log('📊 Progress updated:', stage, `${percentage}%`, currentFile ? `- ${currentFile}` : '');
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
      selectedFiles,
      title,
      language,
      prompt,
	  removeFile,
      isGenerating,
      generationProgress,
      canGenerate,
      error,
      showConfigModal,
      configurationIssues,
      // Prompts management
      systemPrompts,
      userPrompts,
      selectedSystemPromptId,
      selectedUserPromptId,
      onSystemPromptChange,
      onUserPromptChange,
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