import { EventEmitter } from 'events'

export interface AgentMessage {
  id: string
  timestamp: Date
  fromAgent: string
  toAgent: string
  type: 'request' | 'response' | 'notification' | 'command'
  payload: any
  priority: 'low' | 'medium' | 'high' | 'critical'
}

export interface AgentState {
  id: string
  name: string
  status: 'idle' | 'processing' | 'waiting' | 'error'
  context: any
  capabilities: string[]
  lastUpdate: Date
}

export interface StudentContext {
  userId: string
  currentTopic: string
  difficultyLevel: number
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading'
  cognitiveLoad: number
  engagementLevel: number
  knowledgeGaps: string[]
  strengths: string[]
  sessionHistory: any[]
  goals: string[]
  preferences: any
}

export abstract class AgentBase extends EventEmitter {
  protected state: AgentState
  protected studentContext: StudentContext | null = null
  protected messageHistory: AgentMessage[] = []

  constructor(id: string, name: string, capabilities: string[]) {
    super()
    this.state = {
      id,
      name,
      status: 'idle',
      context: {},
      capabilities,
      lastUpdate: new Date()
    }
  }

  getId(): string {
    return this.state.id
  }

  getName(): string {
    return this.state.name
  }

  getState(): AgentState {
    return { ...this.state }
  }

  getCapabilities(): string[] {
    return [...this.state.capabilities]
  }

  hasCapability(capability: string): boolean {
    return this.state.capabilities.includes(capability)
  }

  updateContext(context: Partial<any>): void {
    this.state.context = { ...this.state.context, ...context }
    this.state.lastUpdate = new Date()
  }

  setStudentContext(context: StudentContext): void {
    this.studentContext = context
    this.updateContext({ studentContext: context })
  }

  protected updateStatus(status: AgentState['status']): void {
    this.state.status = status
    this.state.lastUpdate = new Date()
    this.emit('statusChange', { agentId: this.state.id, status })
  }

  protected log(message: string, level: 'info' | 'warn' | 'error' = 'info'): void {
    const logEntry = {
      timestamp: new Date(),
      agentId: this.state.id,
      agentName: this.state.name,
      level,
      message
    }
    console.log(`[${level.toUpperCase()}] ${this.state.name}: ${message}`)
    this.emit('log', logEntry)
  }

  async sendMessage(message: Omit<AgentMessage, 'id' | 'timestamp' | 'fromAgent'>): Promise<void> {
    const fullMessage: AgentMessage = {
      id: `${this.state.id}-${Date.now()}-${Math.random()}`,
      timestamp: new Date(),
      fromAgent: this.state.id,
      ...message
    }
    
    this.messageHistory.push(fullMessage)
    this.emit('message', fullMessage)
  }

  async receiveMessage(message: AgentMessage): Promise<void> {
    this.messageHistory.push(message)
    this.log(`Received message from ${message.fromAgent}: ${message.type}`)
    
    try {
      this.updateStatus('processing')
      await this.handleMessage(message)
      this.updateStatus('idle')
    } catch (error) {
      this.log(`Error processing message: ${error}`, 'error')
      this.updateStatus('error')
    }
  }

  protected abstract handleMessage(message: AgentMessage): Promise<void>

  abstract async initialize(): Promise<void>

  abstract async execute(input: any): Promise<any>

  async shutdown(): Promise<void> {
    this.log('Shutting down agent')
    this.updateStatus('idle')
    this.removeAllListeners()
  }

  protected async makeDecision(options: any[], criteria: any): Promise<any> {
    this.log(`Making decision with ${options.length} options`)
    
    if (options.length === 0) {
      throw new Error('No options provided for decision making')
    }
    
    if (options.length === 1) {
      return options[0]
    }
    
    const scores = options.map(option => this.scoreOption(option, criteria))
    const bestIndex = scores.indexOf(Math.max(...scores))
    
    this.log(`Selected option ${bestIndex} with score ${scores[bestIndex]}`)
    return options[bestIndex]
  }

  protected scoreOption(option: any, criteria: any): number {
    return Math.random()
  }

  protected async analyzeStudentState(): Promise<any> {
    if (!this.studentContext) {
      throw new Error('Student context not set')
    }
    
    return {
      needsSupport: this.studentContext.cognitiveLoad > 0.7,
      isEngaged: this.studentContext.engagementLevel > 0.5,
      hasKnowledgeGaps: this.studentContext.knowledgeGaps.length > 0,
      recommendedDifficulty: this.calculateOptimalDifficulty(),
      suggestedBreak: this.studentContext.cognitiveLoad > 0.8
    }
  }

  protected calculateOptimalDifficulty(): number {
    if (!this.studentContext) return 0.5
    
    const base = this.studentContext.difficultyLevel
    const engagement = this.studentContext.engagementLevel
    const cognitiveLoad = this.studentContext.cognitiveLoad
    
    let adjustment = 0
    
    if (engagement > 0.7 && cognitiveLoad < 0.6) {
      adjustment = 0.1
    } else if (engagement < 0.3 || cognitiveLoad > 0.8) {
      adjustment = -0.1
    }
    
    return Math.max(0.1, Math.min(1.0, base + adjustment))
  }
}