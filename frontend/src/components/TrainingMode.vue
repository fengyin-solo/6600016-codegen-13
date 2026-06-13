<template>
  <div class="flex flex-col gap-4">
    <div class="bg-gray-900 rounded-xl p-4">
      <div class="flex gap-2 mb-3">
        <button @click="setMode('char')"
          class="px-4 py-2 rounded text-sm font-medium transition-colors"
          :class="store.trainingModeType === 'char'
            ? 'bg-amber-500 text-black'
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'">
          🔤 字符训练
        </button>
        <button @click="setMode('phrase')"
          class="px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-1"
          :class="store.trainingModeType === 'phrase'
            ? 'bg-amber-500 text-black'
            : 'bg-gray-800 text-gray-300 hover:bg-gray-700'">
          📚 短语训练
          <span v-if="store.trainingQueue.length > 0"
            class="text-xs bg-black/30 px-1.5 py-0.5 rounded-full">
            {{ store.trainingQueue.length }}
          </span>
        </button>
      </div>

      <div v-if="store.trainingModeType === 'phrase' && store.trainingQueue.length === 0"
        class="bg-amber-900/30 border border-amber-700/50 rounded-lg p-4 text-center">
        <div class="text-3xl mb-2">📋</div>
        <p class="text-amber-300 font-medium mb-1">训练队列为空</p>
        <p class="text-amber-200/70 text-sm mb-3">请前往「短语速记库」选择要训练的短语</p>
        <button @click="goToPhrases"
          class="bg-amber-500 text-black px-4 py-2 rounded hover:bg-amber-400 font-medium text-sm">
          前往短语库
        </button>
      </div>
    </div>

    <div v-if="store.trainingModeType === 'char' || store.trainingQueue.length > 0"
      class="grid grid-cols-2 gap-4">
      <!-- Quiz Panel -->
      <div class="bg-gray-900 rounded-xl p-4">
        <h3 class="text-amber-300 font-bold mb-3">
          {{ store.trainingModeType === 'char' ? '听音/看码 猜字符' : '听音/看码 写短语' }}
        </h3>

        <template v-if="store.trainingModeType === 'char'">
          <div v-if="!store.quizChar" class="text-center py-8">
            <button @click="store.generateQuiz()"
              class="bg-amber-500 text-black px-6 py-3 rounded-lg text-lg hover:bg-amber-400">
              开始训练
            </button>
          </div>
          <div v-else class="flex flex-col items-center gap-4">
            <div class="text-8xl font-bold text-amber-400">{{ store.quizChar }}</div>
            <button @click="store.playMorse(MORSE_TABLE[store.quizChar])" :disabled="store.isPlaying"
              class="bg-green-600 px-4 py-2 rounded hover:bg-green-500 disabled:opacity-50">
              {{ store.isPlaying ? '播放中...' : '🔊 播放音频' }}
            </button>
            <div class="text-2xl font-mono text-green-400">{{ MORSE_TABLE[store.quizChar] }}</div>
            <input v-model="store.userAnswer" @keyup.enter="store.checkAnswer()"
              class="bg-gray-800 rounded px-4 py-2 text-center text-xl w-48" placeholder="输入莫尔斯码" />
            <button @click="store.checkAnswer()"
              class="bg-amber-500 text-black px-6 py-2 rounded hover:bg-amber-400">
              确认
            </button>
          </div>
        </template>

        <template v-else>
          <div v-if="!store.quizPhrase" class="text-center py-8">
            <button @click="store.generatePhraseQuiz()"
              class="bg-amber-500 text-black px-6 py-3 rounded-lg text-lg hover:bg-amber-400">
              开始短语训练
            </button>
          </div>
          <div v-else class="flex flex-col items-center gap-4">
            <div class="text-2xl font-bold text-amber-400 text-center leading-relaxed">
              {{ store.quizPhrase }}
            </div>
            <button @click="store.playMorse(phraseMorse)" :disabled="store.isPlaying"
              class="bg-green-600 px-4 py-2 rounded hover:bg-green-500 disabled:opacity-50">
              {{ store.isPlaying ? '播放中...' : '🔊 播放音频' }}
            </button>
            <div class="text-lg font-mono text-green-400 text-center break-all max-w-full px-2">
              {{ phraseMorse }}
            </div>
            <input v-model="store.userAnswer" @keyup.enter="store.checkPhraseAnswer()"
              class="bg-gray-800 rounded px-4 py-2 text-center text-lg w-full max-w-md"
              placeholder="输入对应短语（英文）" />
            <div class="flex gap-2">
              <button @click="store.checkPhraseAnswer()"
                class="bg-amber-500 text-black px-6 py-2 rounded hover:bg-amber-400">
                确认
              </button>
              <button @click="store.generatePhraseQuiz()"
                class="bg-gray-700 text-gray-300 px-4 py-2 rounded hover:bg-gray-600 text-sm">
                跳过
              </button>
            </div>
          </div>
        </template>
      </div>

      <!-- Score & History -->
      <div class="bg-gray-900 rounded-xl p-4 flex flex-col gap-3">
        <div class="flex justify-between items-center">
          <h3 class="text-amber-300 font-bold">训练统计</h3>
          <button @click="store.resetScore()" class="text-red-400 text-sm hover:underline">重置</button>
        </div>
        <div class="grid grid-cols-3 gap-2 text-center">
          <div class="bg-gray-800 rounded p-2">
            <div class="text-2xl font-bold text-green-400">{{ store.score.correct }}</div>
            <div class="text-xs text-gray-400">正确</div>
          </div>
          <div class="bg-gray-800 rounded p-2">
            <div class="text-2xl font-bold text-red-400">{{ store.score.total - store.score.correct }}</div>
            <div class="text-xs text-gray-400">错误</div>
          </div>
          <div class="bg-gray-800 rounded p-2">
            <div class="text-2xl font-bold text-amber-400">
              {{ store.score.total ? Math.round(store.score.correct / store.score.total * 100) : 0 }}%
            </div>
            <div class="text-xs text-gray-400">正确率</div>
          </div>
        </div>
        <div v-if="store.trainingModeType === 'phrase'"
          class="bg-gray-800 rounded p-2 text-xs text-gray-400 flex justify-between">
          <span>队列进度</span>
          <span class="text-amber-400">{{ store.currentPhraseIndex + 1 }} / {{ store.trainingQueue.length }}</span>
        </div>
        <div class="flex-1 overflow-y-auto max-h-64">
          <div v-for="h in store.history.slice(0, 20)" :key="h.id"
            class="flex justify-between bg-gray-800 rounded p-2 mb-1 text-sm"
            :class="h.correct ? 'border-l-4 border-green-500' : 'border-l-4 border-red-500'">
            <span class="truncate mr-2">{{ h.input }} → {{ h.output }}</span>
            <span class="shrink-0">{{ h.correct ? '✓' : '✗' }}</span>
          </div>
          <div v-if="store.history.length === 0"
            class="text-center text-gray-500 text-sm py-4">
            暂无训练记录
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMorseStore } from '../store/morse'
import { MORSE_TABLE, textToMorse } from '../utils/morse-code'
import type { TrainingModeType } from '../types'

const emit = defineEmits<{
  (e: 'switch-tab', tab: string): void
}>()

const store = useMorseStore()

const phraseMorse = computed(() => textToMorse(store.quizPhrase))

function setMode(mode: TrainingModeType) {
  store.trainingModeType = mode
  store.quizChar = ''
  store.quizPhrase = ''
  store.userAnswer = ''
}

function goToPhrases() {
  emit('switch-tab', 'phrases')
}
</script>
