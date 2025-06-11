<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div class="bg-white rounded-lg p-6 w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
      <div class="flex justify-between items-center mb-4">
        <h3 class="text-lg font-semibold">
          {{ isEditing ? `Edit ${promptType} Prompt` : `Create New ${promptType} Prompt` }}
        </h3>
        <button @click="close" class="text-gray-500 hover:text-gray-700">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
          </svg>
        </button>
      </div>
      
      <form @submit.prevent="handleSubmit">
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Name</label>
          <input 
            v-model="formData.name"
            type="text" 
            class="w-full p-2 border rounded focus:border-blue-500 focus:outline-none"
            placeholder="Enter prompt name"
            required
          />
        </div>
        
        <div class="mb-4">
          <label class="block text-sm font-medium text-gray-700 mb-2">Content</label>
          
          <!-- Tabs for Edit/Preview -->
          <div class="flex border-b border-gray-200 mb-2">
            <button 
              type="button"
              @click="activeTab = 'edit'"
              :class="[
                'px-4 py-2 text-sm font-medium',
                activeTab === 'edit' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              ]"
            >
              Edit
            </button>
            <button 
              type="button"
              @click="activeTab = 'preview'"
              :class="[
                'px-4 py-2 text-sm font-medium',
                activeTab === 'preview' 
                  ? 'border-b-2 border-blue-500 text-blue-600' 
                  : 'text-gray-500 hover:text-gray-700'
              ]"
            >
              Preview
            </button>
          </div>
          
          <!-- Edit Tab -->
          <div v-if="activeTab === 'edit'">
            <textarea 
              v-model="formData.content"
              rows="12"
              class="w-full p-2 border rounded focus:border-blue-500 focus:outline-none resize-none font-mono text-sm"
              :placeholder="promptType === 'System' ? 
                'Enter system-level instructions that define the AI\'s role and behavior...' : 
                'Enter what you want the AI to do with your content. Include {transcription} where you want the transcribed content to appear...'"
              required
            ></textarea>
          </div>
          
          <!-- Preview Tab -->
          <div v-if="activeTab === 'preview'">
            <div class="w-full border rounded p-4 bg-gray-50 min-h-[300px] markdown-content">
              <div v-if="formData.content.trim()" v-html="renderedContent"></div>
              <div v-else class="text-gray-500 italic">No content to preview</div>
            </div>
          </div>
        </div>
        
        <!-- Warning for missing {transcription} placeholder -->
        <div v-if="promptType === 'User' && missingTranscriptionPlaceholder" class="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div class="flex items-start">
            <div class="flex-shrink-0">
              <svg class="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-sm font-medium text-yellow-800">Missing Transcription Placeholder</h3>
              <p class="mt-1 text-sm text-yellow-700">
                Your user prompt doesn't include the <code class="bg-yellow-100 px-1 rounded">{transcription}</code> placeholder. 
                This means the actual transcription content won't be included in the AI request.
              </p>
              <p class="mt-1 text-xs text-yellow-600">
                Add <code class="bg-yellow-100 px-1 rounded">{transcription}</code> somewhere in your prompt to include the transcribed content.
              </p>
            </div>
          </div>
        </div>
        
        <div class="mb-6">
          <label class="flex items-center">
            <input 
              v-model="formData.is_default"
              type="checkbox" 
              class="mr-2"
            />
            <span class="text-sm text-gray-700">Set as default {{ promptType.toLowerCase() }} prompt</span>
          </label>
        </div>
        
        <div class="flex justify-end gap-3">
          <button 
            type="button"
            @click="close"
            class="px-4 py-2 text-gray-600 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            type="submit"
            :class="[
              'px-4 py-2 text-white rounded transition-colors',
              promptType === 'User' && missingTranscriptionPlaceholder
                ? 'bg-yellow-600 hover:bg-yellow-700' 
                : 'bg-blue-600 hover:bg-blue-700'
            ]"
            :disabled="!formData.name.trim() || !formData.content.trim()"
          >
            <span v-if="promptType === 'User' && missingTranscriptionPlaceholder">
              {{ isEditing ? 'Update (without {transcription})' : 'Create (without {transcription})' }}
            </span>
            <span v-else>
              {{ isEditing ? 'Update' : 'Create' }}
            </span>
          </button>
        </div>
      </form>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, watch, computed, PropType } from 'vue'
import { marked } from 'marked'

interface PromptData {
  name: string
  content: string
  is_default: boolean
}

export default defineComponent({
  name: 'PromptModal',
  props: {
    show: {
      type: Boolean,
      default: false
    },
    promptType: {
      type: String as PropType<'System' | 'User'>,
      required: true
    },
    isEditing: {
      type: Boolean,
      default: false
    },
    initialData: {
      type: Object as PropType<PromptData>,
      default: () => ({
        name: '',
        content: '',
        is_default: false
      })
    }
  },
  emits: ['close', 'submit'],
  setup(props, { emit }) {
    const formData = ref<PromptData>({
      name: '',
      content: '',
      is_default: false
    })

    const activeTab = ref<'edit' | 'preview'>('edit')

    // Configure marked for better rendering
    marked.setOptions({
      breaks: true,
      gfm: true
    })

    // Computed property to render markdown
    const renderedContent = computed(() => {
      if (!formData.value.content) return ''
      return marked(formData.value.content)
    })

    // Check if user prompt is missing {transcription} placeholder
    const missingTranscriptionPlaceholder = computed(() => {
      if (props.promptType !== 'User') return false
      return !formData.value.content.includes('{transcription}')
    })

    // Watch for changes in initialData to populate form
    watch(() => props.initialData, (newData) => {
      if (newData) {
        formData.value = {
          name: newData.name || '',
          content: newData.content || '',
          is_default: newData.is_default || false
        }
      }
    }, { immediate: true })

    // Reset form when modal is closed
    watch(() => props.show, (isShown) => {
      if (!isShown) {
        formData.value = {
          name: '',
          content: '',
          is_default: false
        }
        activeTab.value = 'edit'
      } else if (props.initialData) {
        formData.value = { ...props.initialData }
      }
    })

    const close = () => {
      emit('close')
    }

    const handleSubmit = () => {
      if (!formData.value.name.trim() || !formData.value.content.trim()) {
        return
      }

      // Check if user prompt is missing {transcription} placeholder and confirm
      if (props.promptType === 'User' && missingTranscriptionPlaceholder.value) {
        const confirmed = confirm(
          'Your user prompt doesn\'t include the {transcription} placeholder.\n\n' +
          'This means the actual transcription content won\'t be included in AI requests when using this prompt.\n\n' +
          'Are you sure you want to save this prompt without the {transcription} placeholder?'
        )
        if (!confirmed) {
          return
        }
      }

      emit('submit', { ...formData.value })
    }

    return {
      formData,
      activeTab,
      renderedContent,
      missingTranscriptionPlaceholder,
      close,
      handleSubmit
    }
  }
})
</script>

<style scoped>
/* Markdown content styling */
.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  margin-top: 1.5rem;
  margin-bottom: 0.5rem;
  font-weight: 600;
}

.markdown-content :deep(h1) {
  font-size: 1.875rem;
  color: #1f2937;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.markdown-content :deep(h2) {
  font-size: 1.5rem;
  color: #374151;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.25rem;
}

.markdown-content :deep(h3) {
  font-size: 1.25rem;
  color: #374151;
}

.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  font-size: 1rem;
  color: #4b5563;
}

.markdown-content :deep(p) {
  margin-bottom: 1rem;
  line-height: 1.6;
  color: #374151;
}

.markdown-content :deep(ul),
.markdown-content :deep(ol) {
  margin-bottom: 1rem;
  padding-left: 1.5rem;
}

.markdown-content :deep(li) {
  margin-bottom: 0.25rem;
  color: #374151;
}

.markdown-content :deep(strong) {
  font-weight: 600;
  color: #1f2937;
}

.markdown-content :deep(em) {
  font-style: italic;
  color: #4b5563;
}

.markdown-content :deep(code) {
  background-color: #f3f4f6;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-family: 'Courier New', monospace;
  font-size: 0.875rem;
  color: #dc2626;
}

.markdown-content :deep(pre) {
  background-color: #f3f4f6;
  padding: 1rem;
  border-radius: 0.375rem;
  overflow-x: auto;
  margin-bottom: 1rem;
  border: 1px solid #e5e7eb;
}

.markdown-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
  color: #374151;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid #e5e7eb;
  padding-left: 1rem;
  margin: 1rem 0;
  color: #6b7280;
  font-style: italic;
}

.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
  border: 1px solid #e5e7eb;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  padding: 0.5rem;
  text-align: left;
  border-bottom: 1px solid #e5e7eb;
}

.markdown-content :deep(th) {
  background-color: #f9fafb;
  font-weight: 600;
}

.markdown-content :deep(a) {
  color: #2563eb;
  text-decoration: underline;
}

.markdown-content :deep(a:hover) {
  color: #1d4ed8;
}

.markdown-content :deep(*:first-child) {
  margin-top: 0;
}

.markdown-content :deep(*:last-child) {
  margin-bottom: 0;
}
</style> 