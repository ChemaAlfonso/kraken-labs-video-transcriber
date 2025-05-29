<template>
  <div v-if="show" class="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
    <div class="bg-white rounded-lg shadow-xl w-full max-w-md">
      <div class="p-6 border-b">
        <div class="flex items-center">
          <div class="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mr-4">
            <span class="text-2xl">⚠️</span>
          </div>
          <div>
            <h2 class="text-xl font-bold text-gray-900">Configuration Required</h2>
            <p class="text-sm text-gray-600">Please complete your configuration before generating content</p>
          </div>
        </div>
      </div>
      
      <div class="p-6">
        <div class="space-y-4">
          <div v-for="issue in issues" :key="issue.type" class="flex items-start">
            <div class="w-6 h-6 bg-red-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
              <span class="text-red-600 text-sm">✕</span>
            </div>
            <div>
              <h4 class="font-medium text-gray-900">{{ issue.title }}</h4>
              <p class="text-sm text-gray-600">{{ issue.description }}</p>
            </div>
          </div>
        </div>
      </div>
      
      <div class="p-6 border-t bg-gray-50 flex justify-between">
        <button 
          @click="$emit('close')"
          class="px-4 py-2 text-gray-600 hover:text-gray-800"
        >
          Close
        </button>
        <button 
          @click="$emit('goToConfiguration')"
          class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Go to Configuration
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue';

export interface ConfigurationIssue {
  type: string;
  title: string;
  description: string;
}

export default defineComponent({
  name: 'ConfigurationWarningModal',
  props: {
    show: {
      type: Boolean,
      required: true
    },
    issues: {
      type: Array as PropType<ConfigurationIssue[]>,
      required: true
    }
  },
  emits: ['close', 'goToConfiguration']
});
</script> 