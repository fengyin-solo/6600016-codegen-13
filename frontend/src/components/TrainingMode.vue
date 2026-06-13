<template>
  <div class="flex flex-col gap-4">
    <div class="bg-gray-900 rounded-xl p-4">
      <div class="flex gap-2 mb-3 flex-wrap">
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

      <div v-if="store.trainingModeType === 'phrase' && store.trainingQueue.length > 0 && !store.quizPhrase"
        class="bg-gray-800 rounded-lg p-4">
        <p class="text-gray-300 text-sm mb-3">选择短语训练方式：</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button @click="startPhraseTraining('audioToText')"
            class="border border-gray-700 rounded-lg p-4 text-left hover:bg-gray-750 transition-colors hover:border-amber-500/50">
            <div class="text-2xl mb-1">🎧</div>
            <div class="text-white font-bold">听音写短语</div>
            <div class="text-gray-400 text-xs mt-1">播放莫尔斯音频，根据听到的节奏输入短语</div>
          </button>
          <button @click="startPhraseTraining('codeToText')"
            class="border border-gray-700 rounded-lg p-4 text-left hover:bg-gray-750 transition-colors hover:border-amber-500/50">
            <div class="text-2xl mb-1">⌨️</div>
            <div class="text-white font-bold">看码写短语</div>
            <div class="text-gray-400 text-xs mt-1">显示莫尔斯电码，根据符号翻译并输入短语</div>
          </button>
        </div>
      </div>
    </div>

    <div v-if="(store.trainingModeType === 'char') || (store.quizPhrase && store.trainingModeType === 'phrase')"
      class="grid grid-cols-1 lg:grid-cols-2 gap-4">
      <!-- Quiz Panel -->
      <div class="bg-gray-900 rounded-xl p-4">

        <!-- 字符训练 -->
        <template v-if="store.trainingModeType === 'char'">
          <h3 class="text-amber-300 font-bold mb-3">听音/看码 猜字符</h3>
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

        <!-- 短语训练 -->
        <template v-else>
          <div class="flex justify-between items-center mb-3">
            <h3 class="text-amber-300 font-bold">
              {{ store.phraseSubMode === 'audioToText' ? '🎧 听音写短语' : '⌨️ 看码写短语' }}
            </h3>
            <div class="flex gap-1">
              <button @click="switchPhraseSubMode"
                class="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-800">
                切换模式
              </button>
              <button @click="store.generatePhraseQuiz(); store.phraseAnswerRevealed = false"
                class="text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-800">
                换一题
              </button>
            </div>
          </div>

          <!-- 题目区域 -->
          <div class="flex flex-col items-center gap-3">

            <!-- 短语分类提示 -->
            <div class="flex gap-2 flex-wrap justify-center">
              <span class="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300 border border-gray-700">
                分类：{{ store.quizPhraseCategory }}
              </span>
              <span class="text-xs bg-gray-800 px-2 py-1 rounded text-gray-300 border border-gray-700">
                {{ store.quizPhraseHint }}
              </span>
            </div>

            <!-- 听音模式：只显示播放按钮，不显示码和文本 -->
            <template v-if="store.phraseSubMode === 'audioToText'">
              <div class="flex flex-col items-center gap-2 py-4 w-full">
                <button @click="store.playMorse(store.quizPhraseMorse)" :disabled="store.isPlaying"
                  class="bg-green-600 px-6 py-3 rounded-lg text-lg hover:bg-green-500 disabled:opacity-50 w-full max-w-xs">
                  {{ store.isPlaying ? '🔊 播放中...' : '🔊 播放音频' }}
                </button>
                <button @click="store.playMorse(store.quizPhraseMorse)" :disabled="store.isPlaying"
                  class="text-xs text-gray-500 hover:text-gray-300 disabled:opacity-50">
                  (重新播放)
                </button>
              </div>
            </template>

            <!-- 看码模式：显示莫尔斯码，不显示文本 -->
            <template v-else>
              <div class="w-full bg-gray-800 rounded-lg p-4 text-center">
                <div class="text-xl md:text-2xl font-mono text-green-400 break-all leading-relaxed tracking-wider">
                  {{ store.quizPhraseMorse }}
                </div>
                <button @click="store.playMorse(store.quizPhraseMorse)" :disabled="store.isPlaying"
                  class="mt-3 text-xs text-gray-400 hover:text-white px-2 py-1 rounded hover:bg-gray-700 disabled:opacity-50">
                  {{ store.isPlaying ? '🔊 播放中...' : '🔊 也可以听一遍' }}
                </button>
              </div>
            </template>

            <!-- 输入框 -->
            <input v-model="store.userAnswer" @keyup.enter="store.checkPhraseAnswer()"
              :disabled="store.phraseAnswerRevealed"
              class="bg-gray-800 rounded px-4 py-3 text-center text-lg w-full max-w-md tracking-wider uppercase"
              :placeholder="store.phraseSubMode === 'audioToText' ? '听完后输入英文短语...' : '看码后输入英文短语...'" />

            <!-- 提交/查看答案按钮组 -->
            <div v-if="!store.phraseAnswerRevealed" class="flex gap-2">
              <button @click="store.checkPhraseAnswer()"
                class="bg-amber-500 text-black px-6 py-2 rounded hover:bg-amber-400 font-medium">
                确认
              </button>
              <button @click="store.revealPhraseAnswer()"
                class="bg-gray-700 text-gray-300 px-4 py-2 rounded hover:bg-gray-600 text-sm">
                查看答案
              </button>
            </div>

            <!-- 答题结果显示 -->
            <div v-if="store.phraseAnswerRevealed" class="w-full max-w-md">
              <div class="rounded-lg p-4 border"
                :class="store.lastPhraseCorrect
                  ? 'bg-green-900/30 border-green-700/50'
                  : 'bg-red-900/30 border-red-700/50'">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-2xl">{{ store.lastPhraseCorrect ? '✅' : '❌' }}</span>
                  <span class="font-bold"
                    :class="store.lastPhraseCorrect ? 'text-green-400' : 'text-red-400'">
                    {{ store.lastPhraseCorrect ? '回答正确！' : '回答错误' }}
                  </span>
                </div>
                <div class="text-sm space-y-1">
                  <div class="text-gray-400">正确答案：
                    <span class="text-white font-mono font-bold">{{ store.quizPhrase }}</span>
                  </div>
                  <div class="text-gray-400">莫尔斯码：
                    <span class="text-green-400 font-mono text-xs break-all">{{ store.quizPhraseMorse }}</span>
                  </div>
                  <div v-if="store.lastPhraseCorrect === false && store.userAnswer" class="text-gray-400">
                    你的答案：
                    <span class="text-red-400 font-mono">{{ store.userAnswer.trim().toUpperCase() || '(空)' }}</span>
                  </div>
                </div>
                <button @click="store.generatePhraseQuiz()"
                  class="mt-3 bg-amber-500 text-black px-6 py-2 rounded hover:bg-amber-400 font-medium w-full">
                  下一题 →
                </button>
              </div>
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
        <div v-if="store.trainingModeType === 'phrase' && store.trainingQueue.length > 0"
          class="bg-gray-800 rounded p-2 text-xs text-gray-400 flex justify-between">
          <span>训练模式</span>
          <span class="text-amber-400">
            {{ store.phraseSubMode === 'audioToText' ? '🎧 听音' : '⌨️ 看码' }}
            · 队列 {{ store.trainingQueue.length }} 条
          </span>
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
import { useMorseStore } from '../store/morse'
import { MORSE_TABLE } from '../utils/morse-code'
import type { TrainingModeType, PhraseSubMode } from '../types'

const emit = defineEmits<{
  (e: 'switch-tab', tab: string): void
}>()

const store = useMorseStore()

function setMode(mode: TrainingModeType) {
  store.trainingModeType = mode
  store.quizChar = ''
  store.quizPhrase = ''
  store.userAnswer = ''
  store.phraseAnswerRevealed = false
  store.lastPhraseCorrect = null
}

function startPhraseTraining(subMode: PhraseSubMode) {
  store.phraseSubMode = subMode
  store.generatePhraseQuiz()
}

function switchPhraseSubMode() {
  store.phraseSubMode = store.phraseSubMode === 'audioToText' ? 'codeToText' : 'audioToText'
  store.phraseAnswerRevealed = false
  store.lastPhraseCorrect = null
  store.userAnswer = ''
}

function goToPhrases() {
  emit('switch-tab', 'phrases')
}
</script>
