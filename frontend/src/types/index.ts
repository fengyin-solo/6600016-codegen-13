export interface MorseSymbol {
  char: string
  code: string
}

export type TrainMode = 'charToCode' | 'codeToChar' | 'audioToChar' | 'typingToCode'

export interface HistoryEntry {
  id: number
  input: string
  output: string
  correct: boolean
  timestamp: number
}

export interface Phrase {
  id: number
  text: string
  category: string
  createdAt: number
  timesUsed: number
}

export type TrainingModeType = 'char' | 'phrase'
