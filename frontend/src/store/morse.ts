import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import { MORSE_TABLE, REVERSE_TABLE, textToMorse, morseToText } from '../utils/morse-code'
import type { TrainMode, HistoryEntry, Phrase, TrainingModeType } from '../types'

const DEFAULT_PHRASES: Phrase[] = [
  { id: 1, text: 'SOS', category: '紧急信号', createdAt: Date.now(), timesUsed: 0 },
  { id: 2, text: 'MAYDAY', category: '紧急信号', createdAt: Date.now(), timesUsed: 0 },
  { id: 3, text: 'HELP', category: '求助', createdAt: Date.now(), timesUsed: 0 },
  { id: 4, text: 'EMERGENCY', category: '紧急信号', createdAt: Date.now(), timesUsed: 0 },
  { id: 5, text: 'DANGER', category: '警告', createdAt: Date.now(), timesUsed: 0 },
  { id: 6, text: 'STOP', category: '指令', createdAt: Date.now(), timesUsed: 0 },
  { id: 7, text: 'GO', category: '指令', createdAt: Date.now(), timesUsed: 0 },
  { id: 8, text: 'ROGER', category: '通讯', createdAt: Date.now(), timesUsed: 0 },
  { id: 9, text: 'OVER', category: '通讯', createdAt: Date.now(), timesUsed: 0 },
  { id: 10, text: 'OUT', category: '通讯', createdAt: Date.now(), timesUsed: 0 },
  { id: 11, text: 'REQUEST ASSISTANCE', category: '求助', createdAt: Date.now(), timesUsed: 0 },
  { id: 12, text: 'ALL CLEAR', category: '状态', createdAt: Date.now(), timesUsed: 0 },
  { id: 13, text: 'STAND BY', category: '指令', createdAt: Date.now(), timesUsed: 0 },
  { id: 14, text: 'COPY THAT', category: '通讯', createdAt: Date.now(), timesUsed: 0 },
  { id: 15, text: 'REPEAT MESSAGE', category: '通讯', createdAt: Date.now(), timesUsed: 0 },
]

export const useMorseStore = defineStore('morse', () => {
  const inputText = ref('')
  const morseOutput = ref('')
  const decodedText = ref('')
  const wpm = ref(15)
  const frequency = ref(700)
  const volume = ref(0.6)
  const trainMode = ref<TrainMode>('charToCode')
  const history = ref<HistoryEntry[]>([])
  const quizChar = ref('')
  const userAnswer = ref('')
  const score = ref({ correct: 0, total: 0 })
  const isPlaying = ref(false)
  let audioCtx: AudioContext | null = null
  let currentOscillator: OscillatorNode | null = null

  const phrases = ref<Phrase[]>([...DEFAULT_PHRASES])
  const trainingQueue = ref<number[]>([])
  const trainingModeType = ref<TrainingModeType>('char')
  const currentPhraseIndex = ref(0)
  const quizPhrase = ref('')
  const phraseInputText = ref('')
  const phraseCategory = ref('通用')

  const categories = computed(() => {
    const set = new Set(phrases.value.map(p => p.category))
    return Array.from(set)
  })

  const queuedPhrases = computed(() =>
    phrases.value.filter(p => trainingQueue.value.includes(p.id))
  )

  const dotDuration = computed(() => 1200 / wpm.value)

  function getAudioCtx(): AudioContext {
    if (!audioCtx) audioCtx = new AudioContext()
    return audioCtx
  }

  function playTone(duration: number): Promise<void> {
    return new Promise(resolve => {
      const ctx = getAudioCtx()
      const osc = ctx.createOscillator()
      const gain = ctx.createGain()
      osc.type = 'sine'
      osc.frequency.value = frequency.value
      gain.gain.value = volume.value
      osc.connect(gain)
      gain.connect(ctx.destination)
      osc.start()
      currentOscillator = osc
      setTimeout(() => { osc.stop(); currentOscillator = null; resolve() }, duration)
    })
  }

  async function playMorse(morse: string) {
    isPlaying.value = true
    const dd = dotDuration.value
    for (const token of morse.split(' ')) {
      if (token === '/') { await sleep(dd * 7); continue }
      for (const sym of token) {
        await playTone(sym === '.' ? dd : dd * 3)
        await sleep(dd)
      }
      await sleep(dd * 2)
    }
    isPlaying.value = false
  }

  function sleep(ms: number): Promise<void> {
    return new Promise(r => setTimeout(r, ms))
  }

  function encode() {
    morseOutput.value = textToMorse(inputText.value)
  }

  function decode() {
    decodedText.value = morseToText(inputText.value)
  }

  function generateQuiz() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789'
    quizChar.value = chars[Math.floor(Math.random() * chars.length)]
    userAnswer.value = ''
  }

  function checkAnswer() {
    const correct = userAnswer.value.trim() === MORSE_TABLE[quizChar.value]
    score.value.total++
    if (correct) score.value.correct++
    history.value.unshift({
      id: Date.now(), input: quizChar.value, output: userAnswer.value,
      correct, timestamp: Date.now()
    })
    generateQuiz()
  }

  function resetScore() {
    score.value = { correct: 0, total: 0 }
    history.value = []
  }

  function addPhrase(text: string, category: string) {
    const trimmed = text.trim().toUpperCase()
    if (!trimmed) return
    if (phrases.value.some(p => p.text === trimmed)) return
    phrases.value.push({
      id: Date.now(),
      text: trimmed,
      category: category || '通用',
      createdAt: Date.now(),
      timesUsed: 0,
    })
  }

  function removePhrase(id: number) {
    phrases.value = phrases.value.filter(p => p.id !== id)
    trainingQueue.value = trainingQueue.value.filter(qid => qid !== id)
  }

  function toggleQueue(id: number) {
    const idx = trainingQueue.value.indexOf(id)
    if (idx === -1) {
      trainingQueue.value.push(id)
    } else {
      trainingQueue.value.splice(idx, 1)
    }
  }

  function clearQueue() {
    trainingQueue.value = []
  }

  function addAllToQueue(category?: string) {
    const list = category
      ? phrases.value.filter(p => p.category === category)
      : phrases.value
    list.forEach(p => {
      if (!trainingQueue.value.includes(p.id)) {
        trainingQueue.value.push(p.id)
      }
    })
  }

  function playPhrase(id: number) {
    const phrase = phrases.value.find(p => p.id === id)
    if (!phrase) return
    phrase.timesUsed++
    const morse = textToMorse(phrase.text)
    playMorse(morse)
  }

  function getPhraseMorse(id: number): string {
    const phrase = phrases.value.find(p => p.id === id)
    return phrase ? textToMorse(phrase.text) : ''
  }

  function loadPhraseToInput(id: number) {
    const phrase = phrases.value.find(p => p.id === id)
    if (!phrase) return
    inputText.value = phrase.text
    phrase.timesUsed++
    encode()
  }

  function generatePhraseQuiz() {
    if (trainingQueue.value.length === 0) {
      quizPhrase.value = ''
      return
    }
    currentPhraseIndex.value = Math.floor(Math.random() * trainingQueue.value.length)
    const phraseId = trainingQueue.value[currentPhraseIndex.value]
    const phrase = phrases.value.find(p => p.id === phraseId)
    quizPhrase.value = phrase ? phrase.text : ''
    userAnswer.value = ''
  }

  function checkPhraseAnswer() {
    const correct = userAnswer.value.trim().toUpperCase() === quizPhrase.value
    score.value.total++
    if (correct) score.value.correct++
    history.value.unshift({
      id: Date.now(),
      input: quizPhrase.value,
      output: userAnswer.value.trim().toUpperCase(),
      correct,
      timestamp: Date.now(),
    })
    generatePhraseQuiz()
  }

  return {
    inputText, morseOutput, decodedText, wpm, frequency, volume,
    trainMode, history, quizChar, userAnswer, score, isPlaying,
    dotDuration, encode, decode, playMorse, playTone,
    generateQuiz, checkAnswer, resetScore,
    phrases, trainingQueue, trainingModeType, currentPhraseIndex,
    quizPhrase, phraseInputText, phraseCategory,
    categories, queuedPhrases,
    addPhrase, removePhrase, toggleQueue, clearQueue, addAllToQueue,
    playPhrase, getPhraseMorse, loadPhraseToInput,
    generatePhraseQuiz, checkPhraseAnswer,
  }
})
