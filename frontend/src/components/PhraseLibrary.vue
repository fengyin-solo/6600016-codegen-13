<template>
  <div class="flex flex-col gap-4">
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
      <div class="lg:col-span-2 bg-gray-900 rounded-xl p-4 flex flex-col gap-4">
        <div class="flex justify-between items-center">
          <h3 class="text-amber-300 font-bold text-lg">短语速记库</h3>
          <div class="flex gap-2">
            <select v-model="filterCategory"
              class="bg-gray-800 rounded px-3 py-1 text-sm text-white border border-gray-700">
              <option value="">全部分类</option>
              <option v-for="c in store.categories" :key="c" :value="c">{{ c }}</option>
            </select>
          </div>
        </div>

        <div class="flex gap-2">
          <input v-model="newPhraseText" @keyup.enter="handleAddPhrase"
            class="flex-1 bg-gray-800 rounded px-4 py-2 text-white placeholder-gray-500"
            placeholder="输入新短语，如：SEND HELP NOW..." />
          <select v-model="newPhraseCategory"
            class="bg-gray-800 rounded px-3 py-2 text-white border border-gray-700">
            <option v-for="c in store.categories" :key="c" :value="c">{{ c }}</option>
            <option value="通用">通用</option>
          </select>
          <button @click="handleAddPhrase"
            class="bg-amber-500 text-black px-4 py-2 rounded hover:bg-amber-400 font-medium">
            + 添加
          </button>
        </div>

        <div class="flex gap-2">
          <button @click="store.addAllToQueue(filterCategory || undefined)"
            class="bg-blue-600 px-3 py-1 rounded text-sm hover:bg-blue-500">
            {{ filterCategory ? `加入「${filterCategory}」分类` : '全部加入训练' }}
          </button>
          <button @click="store.clearQueue()"
            class="bg-gray-700 px-3 py-1 rounded text-sm hover:bg-gray-600 text-gray-300">
            清空训练队列
          </button>
          <span class="ml-auto text-sm text-gray-400 self-center">
            共 {{ filteredPhrases.length }} 条 · 已选 {{ store.trainingQueue.length }} 条
          </span>
        </div>

        <div class="flex-1 overflow-y-auto max-h-96 space-y-2">
          <div v-for="phrase in filteredPhrases" :key="phrase.id"
            class="bg-gray-800 rounded-lg p-3 flex items-center gap-3 hover:bg-gray-750 transition-colors"
            :class="store.trainingQueue.includes(phrase.id) ? 'ring-2 ring-amber-500' : ''">
            <input type="checkbox" :checked="store.trainingQueue.includes(phrase.id)"
              @change="store.toggleQueue(phrase.id)"
              class="w-5 h-5 accent-amber-500 cursor-pointer" />
            <div class="flex-1 min-w-0">
              <div class="flex items-center gap-2">
                <span class="font-bold text-white text-base">{{ phrase.text }}</span>
                <span class="text-xs bg-gray-700 px-2 py-0.5 rounded text-gray-300">
                  {{ phrase.category }}
                </span>
              </div>
              <div class="font-mono text-green-400 text-xs mt-1 truncate">
                {{ store.getPhraseMorse(phrase.id) }}
              </div>
              <div class="text-xs text-gray-500 mt-0.5">使用 {{ phrase.timesUsed }} 次</div>
            </div>
            <div class="flex gap-1 shrink-0">
              <button @click="store.loadPhraseToInput(phrase.id)"
                title="转换到编码面板"
                class="bg-purple-600 hover:bg-purple-500 p-2 rounded">
                <span class="text-sm">⇄</span>
              </button>
              <button @click="store.playPhrase(phrase.id)" :disabled="store.isPlaying"
                title="播放音频"
                class="bg-green-600 hover:bg-green-500 p-2 rounded disabled:opacity-50">
                <span class="text-sm">{{ store.isPlaying ? '…' : '▶' }}</span>
              </button>
              <button @click="store.toggleQueue(phrase.id)"
                :title="store.trainingQueue.includes(phrase.id) ? '移出训练' : '加入训练'"
                class="p-2 rounded"
                :class="store.trainingQueue.includes(phrase.id)
                  ? 'bg-amber-600 hover:bg-amber-500'
                  : 'bg-gray-700 hover:bg-gray-600'">
                <span class="text-sm">{{ store.trainingQueue.includes(phrase.id) ? '✓' : '＋' }}</span>
              </button>
              <button @click="store.removePhrase(phrase.id)"
                title="删除"
                class="bg-red-600 hover:bg-red-500 p-2 rounded">
                <span class="text-sm">✕</span>
              </button>
            </div>
          </div>
          <div v-if="filteredPhrases.length === 0"
            class="text-center text-gray-500 py-8">
            暂无短语，请添加新的高频救援短语
          </div>
        </div>
      </div>

      <div class="bg-gray-900 rounded-xl p-4 flex flex-col gap-3">
        <div class="flex justify-between items-center">
          <h3 class="text-amber-300 font-bold text-lg">训练队列</h3>
          <button @click="store.clearQueue()"
            class="text-red-400 text-sm hover:underline">清空</button>
        </div>

        <div v-if="store.queuedPhrases.length === 0"
          class="text-center text-gray-500 py-8 flex-1 flex items-center justify-center">
          <div>
            <div class="text-4xl mb-2">📋</div>
            <p>勾选短语加入训练队列</p>
            <p class="text-xs mt-1">在训练模式可进行短语听写训练</p>
          </div>
        </div>

        <div v-else class="flex-1 overflow-y-auto space-y-1 max-h-96">
          <div v-for="(phrase, idx) in store.queuedPhrases" :key="phrase.id"
            class="bg-gray-800 rounded p-2 flex items-center gap-2 group">
            <span class="text-xs text-gray-500 w-5 text-right">{{ idx + 1 }}.</span>
            <div class="flex-1 min-w-0">
              <div class="font-medium text-white text-sm truncate">{{ phrase.text }}</div>
              <div class="text-xs text-gray-500">{{ phrase.category }}</div>
            </div>
            <button @click="store.toggleQueue(phrase.id)"
              class="opacity-0 group-hover:opacity-100 text-gray-400 hover:text-red-400 transition-opacity p-1">
              ✕
            </button>
          </div>
        </div>

        <div class="border-t border-gray-700 pt-3 text-xs text-gray-400 space-y-1">
          <div class="flex justify-between">
            <span>📚 短语总数</span>
            <span class="text-white">{{ store.phrases.length }}</span>
          </div>
          <div class="flex justify-between">
            <span>📋 队列数量</span>
            <span class="text-amber-400">{{ store.trainingQueue.length }}</span>
          </div>
          <div class="flex justify-between">
            <span>🏷️ 分类数</span>
            <span class="text-blue-400">{{ store.categories.length }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { useMorseStore } from '../store/morse'

const store = useMorseStore()
const newPhraseText = ref('')
const newPhraseCategory = ref('通用')
const filterCategory = ref('')

const filteredPhrases = computed(() => {
  if (!filterCategory.value) return store.phrases
  return store.phrases.filter(p => p.category === filterCategory.value)
})

function handleAddPhrase() {
  if (!newPhraseText.value.trim()) return
  store.addPhrase(newPhraseText.value, newPhraseCategory.value)
  newPhraseText.value = ''
}
</script>
