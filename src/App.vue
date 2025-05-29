<script setup lang="ts">
import { ref, computed } from "vue";
import { useRoute } from "vue-router";

const route = useRoute();

const isSidebarOpen = ref(false);

const currentRouteName = computed(() => {
  return route.name as string;
});

const toggleSidebar = () => {
  isSidebarOpen.value = !isSidebarOpen.value;
};

const closeSidebar = () => {
  if (isSidebarOpen.value) {
    isSidebarOpen.value = false;
  }
};

const openKrakenLabsWeb = async () => {
  try {
    await window.electronAPI.openExternalUrl('https://krakenlabsweb.com/');
  } catch (error) {
    console.error('Failed to open external URL:', error);
  }
};
</script>

<template>
  <div class="flex h-screen bg-gray-100 overflow-hidden">
    <!-- Sidebar (Mobile) -->
    <div 
      v-if="isSidebarOpen" 
      class="fixed inset-0 z-40 flex md:hidden" 
      @click="closeSidebar"
    >
      <div class="fixed inset-0 bg-gray-600 bg-opacity-75"></div>
      
      <div class="relative flex-1 flex flex-col max-w-xs w-full bg-white">
        <div class="absolute top-0 right-0 -mr-12 pt-2">
          <button 
            class="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
            @click="closeSidebar"
          >
            <span class="sr-only">Close sidebar</span>
            <svg class="h-6 w-6 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <div class="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
          <div class="flex-shrink-0 flex items-center px-4">
            <img src="/kkvideo.png" alt="Kraken Labs" class="rounded h-8 w-8 mr-3" />
            <h1 class="text-xl font-bold text-gray-900">KLVT</h1>
          </div>
          <nav class="mt-5 px-2 space-y-1">
            <router-link 
              to="/" 
              class="group flex items-center px-2 py-2 text-base font-medium rounded-md"
              :class="currentRouteName === 'Generator' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
            >
              <span class="mr-3 text-lg">🎬</span>
              Generator
            </router-link>
            
            <router-link 
              to="/generations" 
              class="group flex items-center px-2 py-2 text-base font-medium rounded-md"
              :class="currentRouteName === 'Generations' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
            >
              <span class="mr-3 text-lg">📚</span>
              Generations
            </router-link>
            
            <router-link 
              to="/configuration" 
              class="group flex items-center px-2 py-2 text-base font-medium rounded-md"
              :class="currentRouteName === 'Configuration' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
            >
              <span class="mr-3 text-lg">⚙️</span>
              Configuration
            </router-link>
          </nav>
          
          <!-- Footer -->
          <div class="flex-shrink-0 p-4 border-t border-gray-200">
            <p class="text-xs text-gray-500 text-center">
              Made with ❤️ by 
              <button 
                @click="openKrakenLabsWeb"
                class="text-blue-600 hover:text-blue-800 underline"
              >
                KrakenLabsWeb
              </button>
            </p>
          </div>
        </div>
      </div>
      
      <div class="flex-shrink-0 w-14"></div>
    </div>
    
    <!-- Sidebar (Desktop) -->
    <div class="hidden md:flex md:flex-shrink-0">
      <div class="flex flex-col w-64">
        <div class="flex flex-col h-0 flex-1 border-r border-gray-200 bg-white">
          <div class="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div class="flex items-center flex-shrink-0 px-4">
              <img src="/kkvideo.png" alt="Kraken Labs" class="rounded h-8 w-8 mr-3" />
              <h1 class="text-xl font-bold text-gray-900">KLVT</h1>
            </div>
            <nav class="mt-5 flex-1 px-2 bg-white space-y-1">
              <router-link 
                to="/" 
                class="group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                :class="currentRouteName === 'Generator' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
              >
                <span class="mr-3 text-lg">🎬</span>
                Generator
              </router-link>
              
              <router-link 
                to="/generations" 
                class="group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                :class="currentRouteName === 'Generations' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
              >
                <span class="mr-3 text-lg">📚</span>
                Generations
              </router-link>
              
              <router-link 
                to="/configuration" 
                class="group flex items-center px-2 py-2 text-sm font-medium rounded-md"
                :class="currentRouteName === 'Configuration' ? 'bg-blue-100 text-blue-700' : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'"
              >
                <span class="mr-3 text-lg">⚙️</span>
                Configuration
              </router-link>
            </nav>
            
            <!-- Footer -->
            <div class="flex-shrink-0 p-4 border-t border-gray-200">
              <p class="text-xs text-gray-500 text-center">
                Made with ❤️ by 
                <button 
                  @click="openKrakenLabsWeb"
                  class="text-blue-600 hover:text-blue-800 underline"
                >
                  KrakenLabsWeb
                </button>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Main content -->
    <div class="flex flex-col w-0 flex-1 overflow-hidden">
      <div class="md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3">
        <button 
          class="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-gray-500 hover:text-gray-900 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          @click="toggleSidebar"
        >
          <span class="sr-only">Open sidebar</span>
          <svg class="h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      </div>
      
      <main class="flex-1 relative overflow-y-auto focus:outline-none">
        <router-view />
      </main>
    </div>
  </div>
</template>

<style>
:root {
  font-family: Inter, Avenir, Helvetica, Arial, sans-serif;
  color: #0f0f0f;
  background-color: #f6f6f6;
  font-synthesis: none;
  text-rendering: optimizeLegibility;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
  padding: 0;
}

* {
  box-sizing: border-box;
}
</style>