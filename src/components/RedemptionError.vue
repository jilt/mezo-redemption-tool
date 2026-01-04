<template>
  <div class="bg-red-500/10 border-2 border-red-500/30 text-red-200 p-10 rounded-3xl backdrop-blur-sm max-w-4xl mx-auto">
    <div class="text-4xl mb-6">⚠️</div>
    <h3 class="text-2xl font-bold mb-4">Failed to load troves</h3>
    <p class="text-lg mb-8">{{ message }}</p>
    <button 
      @click="$emit('retry')" 
      class="bg-red-500 hover:bg-red-600 px-8 py-4 rounded-2xl font-bold text-xl text-white transition-all shadow-xl hover:shadow-red-500/25"
    >
      🔄 Retry Fetch
    </button>
  </div>
</template>

<script setup lang="ts">
defineProps<{
  message: string
}>()

defineEmits(['retry'])
</script>