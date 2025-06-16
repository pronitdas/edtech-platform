import { promptsConfig } from './promptsConfig.ts'
import { OpenAIClient } from './openAi.ts'

interface GenerateQuestionsOutput {
  question: string
  options: string[]
  answer: string
}

interface MindMapNode {
  id: string
  type?: 'input' | 'default' | 'output'
  data: { label: string }
}

interface MindMapEdge {
  id: string
  source: string
  target: string
}

interface MindMapStructure {
  nodes: MindMapNode[]
  edges: MindMapEdge[]
}

export async function generateMindMapStructure(
  openaiClient: OpenAIClient,
  text: string
): Promise<MindMapStructure> {
  if (!text || text.length < 10) {
    return { nodes: [], edges: [] }
  }

  const jsonSchema = {
    name: 'mindmap_schema',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        nodes: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              type: { type: 'string', enum: ['input', 'default', 'output'] },
              data: {
                type: 'object',
                properties: {
                  label: { type: 'string' },
                },
                required: ['label'],
              },
            },
            required: ['id', 'type', 'data'],
          },
        },
        edges: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              source: { type: 'string' },
              target: { type: 'string' },
            },
            required: ['id', 'source', 'target'],
          },
        },
      },
      required: ['nodes', 'edges'],
    },
  }

  try {
    const result = await openaiClient.chatCompletion(
      [
        { role: 'system', content: promptsConfig.mindMap },
        { role: 'user', content: text },
      ],
      'gpt-4-turbo-2024-04-09',
      800,
      jsonSchema
    )

    return JSON.parse(result)
  } catch (error) {
    console.error('Error generating mind map structure:', error)
    return {
      nodes: [
        {
          id: '1',
          type: 'input',
          data: { label: 'Error generating mind map' },
        },
      ],
      edges: [],
    }
  }
}

export async function generateNotes(
  openaiClient: OpenAIClient,
  text: string,
  language: string
): Promise<string[]> {
  if (!text || text.length < 10) return []

  try {
    const result = await openaiClient.chatCompletion(
      [
        { role: 'system', content: promptsConfig.notes(language) },
        { role: 'user', content: text },
      ],
      'gpt-4-turbo-2024-04-09',
      500
    )

    return result.split('\n')
  } catch (error) {
    console.error('Error generating notes:', error)
    return []
  }
}

export async function generateSummary(
  openaiClient: OpenAIClient,
  text: string,
  language: string
): Promise<string[]> {
  if (!text || text.length < 10) return []

  try {
    const result = await openaiClient.chatCompletion(
      [
        { role: 'system', content: promptsConfig.summary(language) },
        { role: 'user', content: text },
      ],
      'gpt-4-turbo-2024-04-09',
      500
    )

    return result.split('\n')
  } catch (error) {
    console.error('Error generating summary:', error)
    return []
  }
}

export async function generateQuestions(
  openaiClient: OpenAIClient,
  text: string,
  language: string,
  questionsCount: number = 10
): Promise<GenerateQuestionsOutput[]> {
  if (!text || text.length < 10) return []

  const jsonSchema = {
    name: 'question_answer_schema',
    strict: true,
    schema: {
      type: 'object',
      properties: {
        questions: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              question: { type: 'string' },
              options: {
                type: 'array',
                items: { type: 'string' },
              },
              answer: { type: 'string' },
            },
            required: ['question', 'options', 'answer'],
          },
        },
      },
      required: ['questions'],
    },
  }

  try {
    const result = await openaiClient.chatCompletion(
      [
        {
          role: 'system',
          content: promptsConfig.structuredQuestions(questionsCount, language),
        },
        { role: 'user', content: text },
      ],
      'gpt-4-turbo-2024-04-09',
      4096,
      jsonSchema
    )

    const parsed = JSON.parse(result)
    return parsed.questions
  } catch (error) {
    console.error('Error generating questions:', error)
    return []
  }
}
