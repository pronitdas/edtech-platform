import { Point } from './geometry'

export interface Problem {
  id: string
  question: string
  difficulty: 'easy' | 'medium' | 'hard'
  hints?: string[]
  solution?: string | { slope: number; yIntercept: number }
  targetPoints?: Point[]
  startPoints?: Point[]
  expectedSlope?: number | null
  expectedIntercept?: number | null
  categories?: string[]
}
