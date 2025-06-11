<template>
  <div class="p-6">
    <h1 class="text-2xl font-bold mb-6">Previous Generations</h1>
    
    <div v-if="generations.length === 0" class="bg-white shadow rounded-lg p-6 text-center">
      <p class="text-gray-500">No generations found. Start by generating content from a video.</p>
      <button 
        @click="navigateToGenerator" 
        class="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Go to Generator
      </button>
    </div>
    
    <div v-else>
      <!-- Bulk Actions Bar -->
      <div v-if="selectedGenerationIds.length > 0" class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
        <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div class="flex items-center">
            <span class="text-blue-800 font-medium">
              {{ selectedGenerationIds.length }} generation(s) selected
            </span>
            <button 
              @click="clearSelection"
              class="ml-3 text-blue-600 hover:text-blue-800 text-sm underline"
            >
              Clear selection
            </button>
          </div>
          
          <div class="flex gap-2">
            <button 
              @click="showBulkGenerationModal"
              class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
            >
              Bulk Generate
            </button>
            <button 
              @click="showBulkRemoveConfirmation"
              class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 text-sm"
            >
              Remove Selected
            </button>
          </div>
        </div>
      </div>
      
      <div class="flex flex-col sm:flex-row justify-between gap-4 mb-4">
        <div class="flex items-center gap-4">
          <div class="relative">
            <input 
              v-model="searchQuery"
              type="text"
              placeholder="Search generations..."
              class="pl-10 pr-4 py-2 border rounded w-full sm:w-64"
            />
            <div class="absolute left-3 top-2.5 text-gray-400">
              🔍
            </div>
          </div>
          
          <!-- Select All Checkbox -->
          <div class="flex items-center">
            <input 
              id="selectAll"
              type="checkbox"
              :checked="isAllSelected"
              :indeterminate="isSomeSelected && !isAllSelected"
              @change="toggleSelectAll"
              class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label for="selectAll" class="ml-2 text-sm text-gray-700">
              Select all
            </label>
          </div>
        </div>
        
        <div>
          <select v-model="sortBy" class="p-2 border rounded w-full sm:w-auto">
            <option value="date-desc">Newest First</option>
            <option value="date-asc">Oldest First</option>
            <option value="name-asc">Name (A-Z)</option>
            <option value="name-desc">Name (Z-A)</option>
          </select>
        </div>
      </div>
      
      <div class="bg-white shadow rounded-lg overflow-hidden">
        <!-- Mobile Card Layout (lg and below) -->
        <div class="block lg:hidden">
          <div class="divide-y divide-gray-200">
            <div v-for="generation in filteredGenerations" :key="generation.id" class="p-4">
              <div class="flex items-start justify-between">
                <div class="flex items-center flex-1 min-w-0">
                  <!-- Selection checkbox -->
                  <input 
                    type="checkbox"
                    :checked="selectedGenerationIds.includes(generation.id)"
                    @change="toggleGeneration(generation.id)"
                    class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 mr-3 mt-1"
                  />
                  <div class="w-8 h-8 bg-gray-200 rounded flex-shrink-0 mr-3">
                    <!-- Video thumbnail would go here -->
                  </div>
                  <div class="min-w-0 flex-1">
                    <div class="text-sm font-medium text-gray-900 truncate">{{ generation.title }}</div>
                    <div class="text-xs text-gray-500 truncate">{{ generation.source }}</div>
                    <div class="flex items-center mt-1 text-xs text-gray-500">
                      <span>{{ formatDate(generation.date) }}</span>
                      <span class="mx-2">•</span>
                      <span>{{ generation.language }}</span>
                    </div>
                  </div>
                </div>
                
                <!-- Mobile Action Menu -->
                <div class="relative ml-2" @click.stop>
                  <button 
                    @click="toggleMobileMenu(generation.id)"
                    class="p-1 rounded-full hover:bg-gray-100"
                  >
                    <span class="text-gray-400">⋮</span>
                  </button>
                  
                  <!-- Mobile Dropdown Menu -->
                  <div 
                    v-if="mobileMenuOpen === generation.id"
                    class="absolute right-0 mt-1 w-32 bg-white border border-gray-200 rounded-md shadow-lg z-10"
                  >
                    <button 
                      @click="handleMobileView(generation.id)" 
                      class="block w-full text-left px-3 py-2 text-sm text-blue-600 hover:bg-gray-50"
                    >
                      View
                    </button>
                    <button 
                      @click="handleMobileExport(generation.id)" 
                      class="block w-full text-left px-3 py-2 text-sm text-green-600 hover:bg-gray-50"
                    >
                      Export
                    </button>
                    <button 
                      @click="handleMobileDelete(generation.id)" 
                      class="block w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-gray-50"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- Desktop Table Layout (lg and above) -->
        <div class="hidden lg:block overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200">
            <thead class="bg-gray-50">
              <tr>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider w-12">
                  <input 
                    type="checkbox"
                    :checked="isAllSelected"
                    :indeterminate="isSomeSelected && !isAllSelected"
                    @change="toggleSelectAll"
                    class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Video
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Date
                </th>
                <th class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Language
                </th>
                <th class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200">
              <tr v-for="generation in filteredGenerations" :key="generation.id" class="hover:bg-gray-50">
                <td class="px-6 py-4 whitespace-nowrap">
                  <input 
                    type="checkbox"
                    :checked="selectedGenerationIds.includes(generation.id)"
                    @change="toggleGeneration(generation.id)"
                    class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                </td>
                <td class="px-6 py-4">
                  <div class="flex items-center">
                    <div class="w-10 h-10 bg-gray-200 rounded flex-shrink-0 mr-3">
                      <!-- Video thumbnail would go here -->
                    </div>
                    <div class="min-w-0">
                      <div class="text-sm font-medium text-gray-900">{{ generation.title }}</div>
                      <div class="text-sm text-gray-500 truncate">{{ generation.source }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ formatDate(generation.date) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {{ generation.language }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex justify-end gap-2">
                    <button 
                      @click="viewGenerationDetail(generation.id)" 
                      class="text-blue-600 hover:text-blue-900 px-2 py-1 rounded hover:bg-blue-50"
                    >
                      View
                    </button>
                    <button 
                      @click="exportGeneration(generation.id)" 
                      class="text-green-600 hover:text-green-900 px-2 py-1 rounded hover:bg-green-50"
                    >
                      Export
                    </button>
                    <button 
                      @click="deleteGeneration(generation.id)" 
                      class="text-red-600 hover:text-red-900 px-2 py-1 rounded hover:bg-red-50"
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
    
    <!-- Generation Detail Modal -->
    <div v-if="selectedGeneration" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <div class="p-6 border-b">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-bold">{{ selectedGeneration.title }}</h2>
            <button @click="closeModal" class="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
        </div>
        
        <div class="flex-1 overflow-auto p-6">
          <div class="mb-6">
            <h3 class="text-lg font-semibold mb-2">Generated Content</h3>
            <div class="bg-gray-50 p-4 rounded border text-sm markdown-content">
              <div v-html="renderedIndex"></div>
            </div>
          </div>
          
          <div class="mb-6">
            <h3 class="text-lg font-semibold mb-2">Transcription</h3>
            <div 
              class="bg-gray-50 p-4 rounded border max-h-64 overflow-y-auto text-sm markdown-content"
            >
              <div v-html="renderedTranscription"></div>
            </div>
          </div>
          
          <div class="mb-6">
            <h3 class="text-lg font-semibold mb-2">System Prompt Used</h3>
            <div class="bg-gray-50 p-4 rounded border markdown-content">
              <div v-if="selectedGenerationSystemPrompt" v-html="selectedGenerationSystemPrompt"></div>
              <div v-else class="text-gray-500 italic">System prompt not available</div>
            </div>
          </div>
          
          <div>
            <h3 class="text-lg font-semibold mb-2">User Prompt Used</h3>
            <div class="bg-gray-50 p-4 rounded border markdown-content">
              <div v-html="selectedGenerationUserPrompt"></div>
            </div>
          </div>
        </div>
        
        <div class="p-6 border-t bg-gray-50 flex justify-between">
          <div>
            <span class="text-sm text-gray-500">Generated on {{ formatDate(selectedGeneration.date) }}</span>
          </div>
          <div class="flex gap-3">
            <button 
              @click="showRegenerateConfirmation(selectedGeneration.id)"
              class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Regenerate Content
            </button>
            <button 
              @click="exportGeneration(selectedGeneration.id)"
              class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Export
            </button>
            <button 
              @click="deleteGeneration(selectedGeneration.id)"
              class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Export Modal -->
    <div v-if="showExportModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div class="p-6 border-b">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-bold">Export Generation</h2>
            <button @click="closeExportModal" class="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
        </div>
        
        <div class="p-6">
          <p class="mb-4">Choose export format:</p>
          
          <div class="grid grid-cols-2 gap-4 mb-6">
            <button 
              @click="exportAs('markdown')" 
              class="p-4 border rounded-lg text-center hover:bg-gray-50"
            >
              <div class="text-lg font-semibold">.md</div>
              <div class="text-sm text-gray-500">Markdown</div>
            </button>
            
            <button 
              @click="exportAs('text')" 
              class="p-4 border rounded-lg text-center hover:bg-gray-50"
            >
              <div class="text-lg font-semibold">.txt</div>
              <div class="text-sm text-gray-500">Plain Text</div>
            </button>
            
            <button 
              @click="exportAs('csv')" 
              class="p-4 border rounded-lg text-center hover:bg-gray-50"
            >
              <div class="text-lg font-semibold">.csv</div>
              <div class="text-sm text-gray-500">CSV</div>
            </button>
            
            <button 
              @click="exportAs('json')" 
              class="p-4 border rounded-lg text-center hover:bg-gray-50"
            >
              <div class="text-lg font-semibold">.json</div>
              <div class="text-sm text-gray-500">JSON</div>
            </button>
          </div>
          
          <div class="border-t pt-4">
            <div class="flex items-center">
              <input 
                id="includeTranscription" 
                v-model="includeTranscription" 
                type="checkbox" 
                class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label for="includeTranscription" class="ml-2 text-sm text-gray-700">
                Include transcription in exported file
              </label>
            </div>
            <p class="text-xs text-gray-500 mt-1 ml-6">
              Uncheck to export only the generated content without the full transcription
            </p>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Regenerate Index Confirmation Modal -->
    <div v-if="showRegenerateModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div class="p-6 border-b">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-bold">Regenerate Content</h2>
            <button @click="closeRegenerateModal" class="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
        </div>
        
        <div class="p-6">
          <div class="flex items-start mb-4">
            <div class="flex-shrink-0">
              <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-lg font-medium text-gray-900">Replace Current Content</h3>
              <p class="mt-2 text-sm text-gray-600">
                This action will regenerate the content using the existing transcription. 
                <strong>The current content will be permanently replaced.</strong>
              </p>
            </div>
          </div>
          
          <div class="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <p class="text-sm text-yellow-800">
              <strong>Note:</strong> Choose whether to use the original prompts (to maintain formatting consistency) 
              or your current prompt settings (which may produce different formatting).
            </p>
          </div>
          
          <!-- System Prompt Options -->
          <div class="border border-gray-200 rounded-lg p-4 mb-4">
            <h4 class="font-medium text-gray-900 mb-2">System Prompt Options:</h4>
            <div class="space-y-2">
              <label class="flex items-start">
                <input 
                  type="radio" 
                  v-model="useOriginalSystemPrompt" 
                  :value="true" 
                  class="mt-1 mr-2"
                />
                <div>
                  <div class="text-sm font-medium text-gray-900">Use original system prompt</div>
                  <div class="text-xs text-gray-600">Keep the same system instructions as the original generation</div>
                </div>
              </label>
              <label class="flex items-start">
                <input 
                  type="radio" 
                  v-model="useOriginalSystemPrompt" 
                  :value="false" 
                  class="mt-1 mr-2"
                />
                <div>
                  <div class="text-sm font-medium text-gray-900">Use current selected system prompt</div>
                  <div class="text-xs text-gray-600">Apply your currently selected system prompt</div>
                </div>
              </label>
            </div>
          </div>
          
          <!-- User Prompt Options -->
          <div class="border border-gray-200 rounded-lg p-4 mb-4">
            <h4 class="font-medium text-gray-900 mb-2">User Prompt Options:</h4>
            <div class="space-y-2">
              <label class="flex items-start">
                <input 
                  type="radio" 
                  v-model="useOriginalPrompt" 
                  :value="true" 
                  class="mt-1 mr-2"
                />
                <div>
                  <div class="text-sm font-medium text-gray-900">Use original user prompt</div>
                  <div class="text-xs text-gray-600">Keep the same user instructions as the original generation</div>
                </div>
              </label>
              <label class="flex items-start">
                <input 
                  type="radio" 
                  v-model="useOriginalPrompt" 
                  :value="false" 
                  class="mt-1 mr-2"
                />
                <div>
                  <div class="text-sm font-medium text-gray-900">Use current selected user prompt</div>
                  <div class="text-xs text-gray-600">Apply your currently selected user prompt</div>
                </div>
              </label>
            </div>
          </div>
        </div>
        
        <div class="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button 
            @click="closeRegenerateModal"
            class="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            @click="regenerateIndex"
            :disabled="isRegenerating"
            class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isRegenerating">Regenerating...</span>
            <span v-else>Regenerate Content</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Bulk Remove Confirmation Modal -->
    <div v-if="showBulkRemoveModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
        <div class="p-6 border-b">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-bold">Remove Selected Generations</h2>
            <button @click="closeBulkRemoveModal" class="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
        </div>
        
        <div class="p-6">
          <div class="flex items-start mb-4">
            <div class="flex-shrink-0">
              <svg class="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div class="ml-3">
              <h3 class="text-lg font-medium text-gray-900">Confirm Bulk Removal</h3>
              <p class="mt-2 text-sm text-gray-600">
                You are about to permanently delete <strong>{{ selectedGenerationIds.length }}</strong> generation(s). 
                This action cannot be undone.
              </p>
            </div>
          </div>
          
          <div class="bg-red-50 border border-red-200 rounded-lg p-4">
            <p class="text-sm text-red-800">
              <strong>Warning:</strong> All selected generations and their associated data will be permanently removed.
            </p>
          </div>
        </div>
        
        <div class="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button 
            @click="closeBulkRemoveModal"
            class="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            @click="bulkRemoveGenerations"
            :disabled="isBulkRemoving"
            class="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isBulkRemoving">Removing...</span>
            <span v-else>Remove {{ selectedGenerationIds.length }} Generation(s)</span>
          </button>
        </div>
      </div>
    </div>

    <!-- Bulk Generation Modal -->
    <div v-if="showBulkGenModal" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div class="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col">
        <div class="p-6 border-b">
          <div class="flex justify-between items-center">
            <h2 class="text-xl font-bold">Bulk Generate Content</h2>
            <button @click="closeBulkGenerationModal" class="text-gray-500 hover:text-gray-700">
              ✕
            </button>
          </div>
        </div>
        
        <div class="flex-1 overflow-auto p-6">
          <div class="mb-6">
            <p class="text-sm text-gray-600 mb-4">
              Generate new content by combining {{ selectedGenerationIds.length }} selected generation(s). 
              Choose your prompts and create a unified output.
            </p>
            
            <div class="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p class="text-sm text-blue-800">
                <strong>How it works:</strong> The AI will receive all selected content as context, 
                followed by your user prompt. Perfect for creating summaries, tables of contents, or unified analyses.
              </p>
            </div>
          </div>
          
          <!-- System Prompt Selection -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">System Prompt</label>
            <select 
              v-model="bulkGenerationSystemPromptId"
              class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a system prompt...</option>
              <option 
                v-for="prompt in systemPrompts" 
                :key="prompt.id" 
                :value="prompt.id"
              >
                {{ prompt.name }}
              </option>
            </select>
            
            <!-- Show selected system prompt content -->
            <div v-if="selectedBulkSystemPrompt" class="mt-3 p-3 bg-gray-50 border rounded text-sm">
              <strong>Selected system prompt:</strong>
              <div class="mt-2 text-gray-700">{{ selectedBulkSystemPrompt.content.substring(0, 200) }}{{ selectedBulkSystemPrompt.content.length > 200 ? '...' : '' }}</div>
            </div>
          </div>
          
          <!-- User Prompt Selection -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">User Prompt</label>
            <select 
              v-model="bulkGenerationUserPromptId"
              class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            >
              <option value="">Select a user prompt...</option>
              <option 
                v-for="prompt in userPrompts" 
                :key="prompt.id" 
                :value="prompt.id"
              >
                {{ prompt.name }}
              </option>
            </select>
            
            <!-- Show selected user prompt content -->
            <div v-if="selectedBulkUserPrompt" class="mt-3 p-3 bg-gray-50 border rounded text-sm">
              <strong>Selected user prompt:</strong>
              <div class="mt-2 text-gray-700">{{ selectedBulkUserPrompt.content.substring(0, 200) }}{{ selectedBulkUserPrompt.content.length > 200 ? '...' : '' }}</div>
            </div>
            
            <!-- Warning about transcription placeholder -->
            <div class="mt-3 p-3 bg-amber-50 border border-amber-200 rounded text-sm">
              <div class="flex items-start">
                <svg class="w-4 h-4 text-amber-600 mt-0.5 mr-2 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <div>
                  <div class="font-medium text-amber-800">Note about {transcription} placeholder</div>
                  <div class="text-amber-700 mt-1">
                    The <code class="bg-amber-100 px-1 rounded text-xs">{transcription}</code> placeholder will be automatically removed in bulk generation since we're working with generated content, not transcriptions.
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- Generation Title -->
          <div class="mb-6">
            <label class="block text-sm font-medium text-gray-700 mb-2">Generated Content Title</label>
            <input 
              v-model="bulkGenerationTitle"
              type="text"
              placeholder="Enter a title for the generated content..."
              class="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>
          
          <!-- Selected generations preview -->
          <div class="mb-6">
            <h3 class="text-sm font-medium text-gray-700 mb-2">Selected Generations ({{ selectedGenerationIds.length }})</h3>
            <div class="max-h-40 overflow-y-auto border border-gray-200 rounded">
              <div v-for="generation in selectedGenerationsForBulk" :key="generation.id" class="p-3 border-b border-gray-100 last:border-b-0">
                <div class="text-sm font-medium text-gray-900">{{ generation.title }}</div>
                <div class="text-xs text-gray-500">{{ formatDate(generation.date) }}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="p-6 border-t bg-gray-50 flex justify-end gap-3">
          <button 
            @click="closeBulkGenerationModal"
            class="px-4 py-2 border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button 
            @click="executeBulkGeneration"
            :disabled="isBulkGenerating || !bulkGenerationSystemPromptId || !bulkGenerationUserPromptId || !bulkGenerationTitle.trim()"
            class="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span v-if="isBulkGenerating">Generating...</span>
            <span v-else>Generate Content</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, computed, onMounted, onUnmounted, watch } from 'vue';
import { useRouter } from 'vue-router';
import { marked } from 'marked';
import { usePrompts, type SystemPrompt, type UserPrompt } from '../composables/usePrompts';

interface Generation {
  id: number;
  title: string;
  source: string;
  date: string;
  language: string;
  index: string;
  transcription: string;
  prompt: string;
  audio_path: string;
  system_prompt_id?: number;
}

export default defineComponent({
  name: 'Generations',
  setup() {
    const router = useRouter();
    const { systemPrompts, userPrompts, loadPrompts } = usePrompts();
    
    const searchQuery = ref('');
    const sortBy = ref('date-desc');
    const generations = ref<Generation[]>([]);
    const isLoading = ref(true);
    const error = ref('');
    
    const selectedGeneration = ref<Generation | null>(null);
    const showExportModal = ref(false);
    const exportGenerationId = ref<number | null>(null);
    const includeTranscription = ref(true);
    const mobileMenuOpen = ref<number | null>(null);
    
    // Regenerate modal state
    const showRegenerateModal = ref(false);
    const regenerateGenerationId = ref<number | null>(null);
    const isRegenerating = ref(false);
    const useOriginalPrompt = ref(true);
    const useOriginalSystemPrompt = ref(true);
    
    // Bulk actions state
    const selectedGenerationIds = ref<number[]>([]);
    const showBulkRemoveModal = ref(false);
    const isBulkRemoving = ref(false);
    const showBulkGenModal = ref(false);
    const isBulkGenerating = ref(false);
    const bulkGenerationSystemPromptId = ref<number | null>(null);
    const bulkGenerationUserPromptId = ref<number | null>(null);
    const bulkGenerationTitle = ref('');
    
    // Configure marked for better rendering
    marked.setOptions({
      breaks: true,
      gfm: true
    });

    // Computed properties for bulk actions
    const isAllSelected = computed(() => {
      return filteredGenerations.value.length > 0 && 
             selectedGenerationIds.value.length === filteredGenerations.value.length &&
             filteredGenerations.value.every(gen => selectedGenerationIds.value.includes(gen.id));
    });

    const isSomeSelected = computed(() => {
      return selectedGenerationIds.value.length > 0;
    });

    const selectedGenerationsForBulk = computed(() => {
      return generations.value.filter(gen => selectedGenerationIds.value.includes(gen.id));
    });

    const selectedBulkSystemPrompt = computed(() => {
      if (!bulkGenerationSystemPromptId.value) return null;
      return systemPrompts.value.find((p: SystemPrompt) => p.id === bulkGenerationSystemPromptId.value) || null;
    });

    const selectedBulkUserPrompt = computed(() => {
      if (!bulkGenerationUserPromptId.value) return null;
      return userPrompts.value.find((p: UserPrompt) => p.id === bulkGenerationUserPromptId.value) || null;
    });

    // Computed property to render markdown
    const renderedIndex = computed(() => {
      if (!selectedGeneration.value?.index) return '';
      return marked(selectedGeneration.value.index);
    });

    // Computed property to render system prompt
    const selectedGenerationSystemPrompt = computed(() => {
      const generation = selectedGeneration.value as any;
      if (!generation?.system_prompt) return '';
      return marked(generation.system_prompt);
    });

    // Computed property to render user prompt
    const selectedGenerationUserPrompt = computed(() => {
      if (!selectedGeneration.value?.prompt) return '';
      return marked(selectedGeneration.value.prompt);
    });
    
    // Load generations on component mount
    onMounted(async () => {
      try {
        isLoading.value = true;
        await Promise.all([
          loadPrompts(),
          loadGenerations()
        ]);
        
        // Add click outside listener for mobile menu
        document.addEventListener('click', closeMobileMenu);
      } catch (err) {
        console.error('Failed to load data:', err);
        error.value = `Failed to load data: ${err}`;
      } finally {
        isLoading.value = false;
      }
    });

    const loadGenerations = async () => {
      generations.value = await window.electronAPI.getResults();
    };
    
    const filteredGenerations = computed(() => {
      let result = [...generations.value];
      
      if (searchQuery.value) {
        const query = searchQuery.value.toLowerCase();
        result = result.filter(gen => 
          gen.title.toLowerCase().includes(query) || 
          gen.source.toLowerCase().includes(query)
        );
      }
      
      switch (sortBy.value) {
        case 'date-desc':
          return result.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
        case 'date-asc':
          return result.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        case 'name-asc':
          return result.sort((a, b) => a.title.localeCompare(b.title));
        case 'name-desc':
          return result.sort((a, b) => b.title.localeCompare(a.title));
        default:
          return result;
      }
    });

    // Watch for search query changes to clear selection when filtering
    watch(searchQuery, () => {
      // Clear selection when search changes to avoid confusion with filtered results
      clearSelection();
    });

    // Bulk actions methods
    const toggleGeneration = (id: number) => {
      const index = selectedGenerationIds.value.indexOf(id);
      if (index > -1) {
        selectedGenerationIds.value.splice(index, 1);
      } else {
        selectedGenerationIds.value.push(id);
      }
    };

    const toggleSelectAll = () => {
      if (isAllSelected.value) {
        selectedGenerationIds.value = [];
      } else {
        selectedGenerationIds.value = filteredGenerations.value.map(gen => gen.id);
      }
    };

    const clearSelection = () => {
      selectedGenerationIds.value = [];
    };

    const showBulkRemoveConfirmation = () => {
      showBulkRemoveModal.value = true;
    };

    const closeBulkRemoveModal = () => {
      showBulkRemoveModal.value = false;
    };

    const bulkRemoveGenerations = async () => {
      try {
        isBulkRemoving.value = true;
        
        // Remove each generation
        for (const id of selectedGenerationIds.value) {
          await window.electronAPI.deleteResult(id);
        }
        
        // Update local state
        generations.value = generations.value.filter(g => !selectedGenerationIds.value.includes(g.id));
        
        // Clear selection
        clearSelection();
        closeBulkRemoveModal();
        
      } catch (err) {
        console.error('Failed to remove generations:', err);
        alert(`Failed to remove generations: ${err}`);
      } finally {
        isBulkRemoving.value = false;
      }
    };

    const showBulkGenerationModal = () => {
      showBulkGenModal.value = true;
      bulkGenerationTitle.value = `Combined Content - ${new Date().toLocaleDateString()}`;
    };

    const closeBulkGenerationModal = () => {
      showBulkGenModal.value = false;
      bulkGenerationSystemPromptId.value = null;
      bulkGenerationUserPromptId.value = null;
      bulkGenerationTitle.value = '';
    };

    const executeBulkGeneration = async () => {
      if (!bulkGenerationSystemPromptId.value || !bulkGenerationUserPromptId.value || !bulkGenerationTitle.value.trim()) {
        return;
      }

      try {
        isBulkGenerating.value = true;

        const selectedGens = selectedGenerationsForBulk.value;
        const systemPrompt = selectedBulkSystemPrompt.value;
        const userPrompt = selectedBulkUserPrompt.value;

        if (!systemPrompt || !userPrompt) {
          alert('Please select both system and user prompts');
          return;
        }

        // Prepare the combined content - ensure we only use serializable data
        const combinedContent = selectedGens.map(gen => 
          `# ${String(gen.title || '')}\n\n${String(gen.index || '')}`
        ).join('\n\n---\n\n');

        // Prepare the final user prompt with prepended content
        const finalUserPrompt = `Based on the following pieces of content:

${combinedContent}

${String(userPrompt.content || '')}`;

        // Call the bulk generation API - ensure all values are serializable
        const result = await window.electronAPI.bulkGenerateContent({
          systemPrompt: String(systemPrompt.content || ''),
          userPrompt: String(finalUserPrompt),
          title: String(bulkGenerationTitle.value || ''),
          sourceIds: [...selectedGenerationIds.value] // Create a new array to avoid reference issues
        });


        if (!result.success) {
          alert(result.error || 'Failed to generate content');
          return;
        }

        // Reload generations to include the new one
        await loadGenerations();
        
        // Clear selection and close modal
        clearSelection();
        closeBulkGenerationModal();

        alert('Bulk generation completed successfully!');
        
      } catch (err) {
        console.error('Failed to execute bulk generation:', err);
        alert(`Failed to execute bulk generation: ${err}`);
      } finally {
        isBulkGenerating.value = false;
      }
    };
    
    const formatDate = (dateStr: string) => {
      const date = new Date(dateStr);
      return date.toLocaleDateString() + ' ' + date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };
    
    const navigateToGenerator = () => {
      router.push('/');
    };
    
    const viewGenerationDetail = async (id: number) => {
      const generation = generations.value.find(g => g.id === id);
      if (generation) {
        selectedGeneration.value = generation;
        // System prompt content is now stored directly in the generation, no need to load separately
      }
    };
    
    const closeModal = () => {
      selectedGeneration.value = null;
    };
    
    const exportGeneration = (id: number) => {
      exportGenerationId.value = id;
      includeTranscription.value = true;
      showExportModal.value = true;
    };
    
    const closeExportModal = () => {
      showExportModal.value = false;
      exportGenerationId.value = null;
    };
    
    const exportAs = async (format: 'markdown' | 'text' | 'csv' | 'json') => {
      if (!exportGenerationId.value) return;
      
      try {
        const generation = generations.value.find(g => g.id === exportGenerationId.value);
        if (!generation) return;
        
        let content = '';
        let filename = '';
        let mimeType = '';
        
        switch (format) {
          case 'markdown':
            content = `# ${generation.title}\n\n${generation.index}`;
            if (includeTranscription.value) {
              content += `\n\n## Transcription\n\n${generation.transcription}`;
            }
            content += `\n\n## Metadata\n\n- **Date**: ${formatDate(generation.date)}`;
            filename = `${generation.title}.md`;
            mimeType = 'text/markdown';
            break;
            
          case 'text':
            content = `${generation.title}\n${'='.repeat(generation.title.length)}\n\n${generation.index}`;
            if (includeTranscription.value) {
              content += `\n\nTranscription:\n${generation.transcription}`;
            }
            content += `\n\nMetadata:\nDate: ${formatDate(generation.date)}`;
            filename = `${generation.title}.txt`;
            mimeType = 'text/plain';
            break;
            
          case 'csv':
            if (includeTranscription.value) {
              content = `"Title","Date","Index","Transcription"\n"${generation.title}","${generation.date}","${generation.index.replace(/"/g, '""')}","${generation.transcription.replace(/"/g, '""')}"`;
            } else {
              content = `"Title","Date","Index"\n"${generation.title}","${generation.date}","${generation.index.replace(/"/g, '""')}"`;
            }
            filename = `${generation.title}.csv`;
            mimeType = 'text/csv';
            break;
            
          case 'json':
            const jsonData: any = {
              title: generation.title,
              date: generation.date,
              index: generation.index
            };
            if (includeTranscription.value) {
              jsonData.transcription = generation.transcription;
            }
            content = JSON.stringify(jsonData, null, 2);
            filename = `${generation.title}.json`;
            mimeType = 'application/json';
            break;
        }
        
        // Create and download the file
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        
        closeExportModal();
      } catch (err) {
        console.error('Failed to export generation:', err);
        alert(`Failed to export generation: ${err}`);
      }
    };
    
    const deleteGeneration = async (id: number) => {
      if (confirm('Are you sure you want to delete this generation?')) {
        try {
          await window.electronAPI.deleteResult(id);
          
          // Remove from local state
          generations.value = generations.value.filter(g => g.id !== id);
          
          // Remove from selection if selected
          const selectionIndex = selectedGenerationIds.value.indexOf(id);
          if (selectionIndex > -1) {
            selectedGenerationIds.value.splice(selectionIndex, 1);
          }
          
          if (selectedGeneration.value?.id === id) {
            closeModal();
          }
          
          if (exportGenerationId.value === id) {
            closeExportModal();
          }
        } catch (err) {
          console.error('Failed to delete generation:', err);
          alert(`Failed to delete generation: ${err}`);
        }
      }
    };
    
    const renderedTranscription = computed(() => {
      if (!selectedGeneration.value?.transcription) return '';
      return marked(selectedGeneration.value.transcription);
    });
    
    const toggleMobileMenu = (id: number) => {
      mobileMenuOpen.value = mobileMenuOpen.value === id ? null : id;
    };

    const closeMobileMenu = () => {
      mobileMenuOpen.value = null;
    };

    // Handle mobile menu actions
    const handleMobileView = async (id: number) => {
      await viewGenerationDetail(id);
      closeMobileMenu();
    };

    const handleMobileExport = (id: number) => {
      exportGeneration(id);
      closeMobileMenu();
    };

    const handleMobileDelete = (id: number) => {
      deleteGeneration(id);
      closeMobileMenu();
    };
    
    // Regenerate index functionality
    const showRegenerateConfirmation = (id: number) => {
      regenerateGenerationId.value = id;
      useOriginalPrompt.value = true; // Default to using original prompt for consistency
      showRegenerateModal.value = true;
    };
    
    const closeRegenerateModal = () => {
      showRegenerateModal.value = false;
      regenerateGenerationId.value = null;
    };
    
    const regenerateIndex = async () => {
      if (!regenerateGenerationId.value) return;
      
      try {
        isRegenerating.value = true;
        
        const generation = generations.value.find(g => g.id === regenerateGenerationId.value);
        if (!generation) return;
        
        // Get the user prompt to use based on user selection
        let userPromptToUse;
        if (useOriginalPrompt.value) {
          userPromptToUse = generation.prompt;
        } else {
          userPromptToUse = await window.electronAPI.getUserPrompt();
        }
        
        // Get the system prompt content to use based on user selection
        let systemPromptToUse;
        if (useOriginalSystemPrompt.value) {
          // Use the original system prompt if available, fallback to current if not
          systemPromptToUse = (generation as any).system_prompt || await window.electronAPI.getSystemPrompt();
        } else {
          systemPromptToUse = await window.electronAPI.getSystemPrompt();
        }
        
        // Call the dedicated regenerate index method
        const result = await (window.electronAPI.regenerateIndex as any)({
          id: generation.id,
          transcription: generation.transcription,
          language: generation.language,
          userPrompt: userPromptToUse,
          systemPrompt: systemPromptToUse
        });
        
        // Check if the operation was successful
        if (!result.success) {
          alert(result.error);
          return;
        }
        
        // Ensure we have the required fields for a successful response
        if (!result.index || !result.prompt) {
          alert('Invalid response from server. Please try again.');
          return;
        }
        
        // Update the generation in local state with the new index
        const index = generations.value.findIndex(g => g.id === regenerateGenerationId.value);
        if (index !== -1) {
          generations.value[index] = { 
            ...generations.value[index], 
            index: result.index,
            prompt: result.prompt 
          };
          
          // Update selected generation if it's currently displayed
          if (selectedGeneration.value?.id === regenerateGenerationId.value) {
            selectedGeneration.value = { 
              ...selectedGeneration.value, 
              index: result.index,
              prompt: result.prompt 
            };
          }
        }
        
        closeRegenerateModal();
      } catch (err) {
        console.error('Failed to regenerate index:', err);
        alert('An unexpected error occurred. Please try again.');
      } finally {
        isRegenerating.value = false;
      }
    };
    
    // Cleanup event listener on unmount
    onUnmounted(() => {
      document.removeEventListener('click', closeMobileMenu);
    });
    
    return {
      generations,
      isLoading,
      error,
      searchQuery,
      sortBy,
      filteredGenerations,
      selectedGeneration,
      showExportModal,
      formatDate,
      navigateToGenerator,
      viewGenerationDetail,
      closeModal,
      exportGeneration,
      closeExportModal,
      exportAs,
      deleteGeneration,
      renderedIndex,
      renderedTranscription,
      selectedGenerationSystemPrompt,
      selectedGenerationUserPrompt,
      includeTranscription,
      mobileMenuOpen,
      toggleMobileMenu,
      closeMobileMenu,
      handleMobileView,
      handleMobileExport,
      handleMobileDelete,
      showRegenerateModal,
      regenerateGenerationId,
      isRegenerating,
      showRegenerateConfirmation,
      closeRegenerateModal,
      regenerateIndex,
      useOriginalPrompt,
      useOriginalSystemPrompt,
      
      // Bulk actions
      selectedGenerationIds,
      isAllSelected,
      isSomeSelected,
      toggleGeneration,
      toggleSelectAll,
      clearSelection,
      showBulkRemoveModal,
      isBulkRemoving,
      showBulkRemoveConfirmation,
      closeBulkRemoveModal,
      bulkRemoveGenerations,
      showBulkGenModal,
      isBulkGenerating,
      showBulkGenerationModal,
      closeBulkGenerationModal,
      executeBulkGeneration,
      bulkGenerationSystemPromptId,
      bulkGenerationUserPromptId,
      bulkGenerationTitle,
      selectedGenerationsForBulk,
      selectedBulkSystemPrompt,
      selectedBulkUserPrompt,
      systemPrompts,
      userPrompts
    };
  }
});
</script>

<style scoped>
/* Markdown content styling */
.markdown-content :deep(h1),
.markdown-content :deep(h2),
.markdown-content :deep(h3),
.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  font-weight: 600;
  margin-bottom: 0.5rem;
  margin-top: 1rem;
  color: #1f2937;
}

.markdown-content :deep(h1) {
  font-size: 1.25rem;
  border-bottom: 2px solid #e5e7eb;
  padding-bottom: 0.5rem;
}

.markdown-content :deep(h2) {
  font-size: 1.125rem;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 0.25rem;
}

.markdown-content :deep(h3) {
  font-size: 1rem;
}

.markdown-content :deep(h4),
.markdown-content :deep(h5),
.markdown-content :deep(h6) {
  font-size: 0.875rem;
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
  line-height: 1.5;
}

.markdown-content :deep(strong) {
  font-weight: 600;
  color: #1f2937;
}

.markdown-content :deep(em) {
  font-style: italic;
}

.markdown-content :deep(code) {
  background-color: #f3f4f6;
  padding: 0.125rem 0.25rem;
  border-radius: 0.25rem;
  font-size: 0.8rem;
  font-family: ui-monospace, SFMono-Regular, Consolas, 'Liberation Mono', Menlo, monospace;
}

.markdown-content :deep(pre) {
  background-color: #f3f4f6;
  padding: 1rem;
  border-radius: 0.5rem;
  overflow-x: auto;
  margin-bottom: 1rem;
}

.markdown-content :deep(pre code) {
  background-color: transparent;
  padding: 0;
}

.markdown-content :deep(blockquote) {
  border-left: 4px solid #d1d5db;
  padding-left: 1rem;
  margin: 1rem 0;
  color: #6b7280;
  font-style: italic;
}

.markdown-content :deep(table) {
  width: 100%;
  border-collapse: collapse;
  margin-bottom: 1rem;
}

.markdown-content :deep(th),
.markdown-content :deep(td) {
  border: 1px solid #d1d5db;
  padding: 0.5rem;
  text-align: left;
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

/* Make the first element not have top margin */
.markdown-content :deep(*:first-child) {
  margin-top: 0;
}

/* Make the last element not have bottom margin */
.markdown-content :deep(*:last-child) {
  margin-bottom: 0;
}
</style> 