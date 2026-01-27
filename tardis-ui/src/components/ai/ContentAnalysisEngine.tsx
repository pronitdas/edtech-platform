import React from 'react'
import { Brain, Zap, Target, Eye, BarChart3, Lightbulb } from 'lucide-react'

// Advanced AI-powered content analysis system
export interface ContentAnalysisResult {
  // Core content properties
  contentType: 'text' | 'video' | 'interactive' | 'mixed' | 'code' | 'math' | 'audio' | 'image'
  format: string // markdown, html, json, etc.
  language: string
  
  // Learning characteristics
  complexity: {
    level: 'beginner' | 'intermediate' | 'advanced' | 'expert'
    score: number // 0-1
    factors: string[]
  }
  
  interactivity: {
    level: 'static' | 'interactive' | 'highly-interactive'
    score: number // 0-1
    potentialElements: string[]
  }
  
  // Pedagogical analysis
  learningObjectives: {
    primary: string[]
    secondary: string[]
    blooms_taxonomy_level: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create'
  }
  
  concepts: {
    main: string[]
    supporting: string[]
    prerequisites: string[]
    relationships: Array<{ from: string; to: string; type: 'requires' | 'builds-on' | 'related' }>
  }
  
  // Multi-modal learning support
  learningStyles: {
    visual: { score: number; evidence: string[] }
    auditory: { score: number; evidence: string[] }
    kinesthetic: { score: number; evidence: string[] }
    reading: { score: number; evidence: string[] }
  }
  
  // Content enhancement opportunities
  enhancements: Array<{
    type: 'practice' | 'quiz' | 'visualization' | 'explanation' | 'examples' | 'mindmap' | 'slideshow' | 'interactive'
    priority: number // 0-1
    reasoning: string
    feasibility: number // 0-1
    estimated_effort: 'low' | 'medium' | 'high'
    ai_generatable: boolean
  }>
  
  // Viewer recommendations
  recommendedViewers: Array<{
    viewerId: string
    suitability: number // 0-1
    reasoning: string
    adaptations: string[]
  }>
  
  // Analytics
  estimatedEngagementTime: number // minutes
  estimatedLearningTime: number // minutes
  retentionFactors: string[]
  accessibilityScore: number // 0-1
  
  // AI confidence and metadata
  analysisConfidence: number // 0-1
  analysisTimestamp: Date
  modelVersion: string
  processingTime: number // ms
}

interface ContentItem {
  type: string
  content: any
  metadata?: Record<string, any>
}

export class ContentAnalysisEngine {
  private modelVersion = '1.0.0'
  
  /**
   * Main analysis entry point - intelligently routes to specialized analyzers
   */
  async analyzeContent(content: any, context?: Record<string, any>): Promise<ContentAnalysisResult> {
    const startTime = Date.now()
    
    // Normalize content to standard format
    const normalizedContent = this.normalizeContent(content)
    
    // Run parallel analysis pipelines
    const [
      contentTypeAnalysis,
      complexityAnalysis,
      interactivityAnalysis,
      pedagogicalAnalysis,
      enhancementAnalysis,
      viewerAnalysis
    ] = await Promise.all([
      this.analyzeContentType(normalizedContent),
      this.analyzeComplexity(normalizedContent),
      this.analyzeInteractivity(normalizedContent),
      this.analyzePedagogicalContent(normalizedContent),
      this.generateEnhancements(normalizedContent),
      this.recommendViewers(normalizedContent)
    ])
    
    const processingTime = Date.now() - startTime
    
    return {
      contentType: contentTypeAnalysis.type,
      format: contentTypeAnalysis.format,
      language: contentTypeAnalysis.language,
      complexity: complexityAnalysis,
      interactivity: interactivityAnalysis,
      learningObjectives: pedagogicalAnalysis.objectives,
      concepts: pedagogicalAnalysis.concepts,
      learningStyles: pedagogicalAnalysis.learningStyles,
      enhancements: enhancementAnalysis,
      recommendedViewers: viewerAnalysis,
      estimatedEngagementTime: this.calculateEngagementTime(normalizedContent, complexityAnalysis),
      estimatedLearningTime: this.calculateLearningTime(normalizedContent, complexityAnalysis),
      retentionFactors: this.identifyRetentionFactors(normalizedContent),
      accessibilityScore: this.calculateAccessibilityScore(normalizedContent),
      analysisConfidence: this.calculateOverallConfidence([
        contentTypeAnalysis.confidence,
        complexityAnalysis.score,
        interactivityAnalysis.score,
        pedagogicalAnalysis.confidence
      ]),
      analysisTimestamp: new Date(),
      modelVersion: this.modelVersion,
      processingTime
    }
  }
  
  /**
   * Smart content type detection with format analysis
   */
  private async analyzeContentType(content: ContentItem): Promise<{
    type: ContentAnalysisResult['contentType']
    format: string
    language: string
    confidence: number
  }> {
    const text = this.extractText(content)
    
    // Video detection
    if (content.type.includes('video') || content.content?.src || content.content?.url) {
      return {
        type: 'video',
        format: this.detectVideoFormat(content.content),
        language: await this.detectLanguage(text),
        confidence: 0.95
      }
    }
    
    // Code detection
    if (this.isCodeContent(text)) {
      return {
        type: 'code',
        format: this.detectCodeLanguage(text),
        language: await this.detectLanguage(this.extractComments(text)),
        confidence: 0.9
      }
    }
    
    // Math detection
    if (this.isMathContent(text)) {
      return {
        type: 'math',
        format: this.detectMathFormat(text),
        language: await this.detectLanguage(text),
        confidence: 0.85
      }
    }
    
    // Interactive content detection
    if (this.hasInteractiveElements(content)) {
      return {
        type: 'interactive',
        format: 'mixed',
        language: await this.detectLanguage(text),
        confidence: 0.8
      }
    }
    
    // Mixed content (arrays, complex objects)
    if (Array.isArray(content.content) || this.isComplexStructure(content.content)) {
      return {
        type: 'mixed',
        format: 'structured',
        language: await this.detectLanguage(text),
        confidence: 0.7
      }
    }
    
    // Default to text
    return {
      type: 'text',
      format: this.detectTextFormat(text),
      language: await this.detectLanguage(text),
      confidence: 0.6
    }
  }
  
  /**
   * Advanced complexity analysis using multiple factors
   */
  private async analyzeComplexity(content: ContentItem): Promise<ContentAnalysisResult['complexity']> {
    const text = this.extractText(content)
    const factors: string[] = []
    let complexityScore = 0
    
    // Text-based complexity factors
    const avgSentenceLength = this.getAverageSentenceLength(text)
    const vocabularyComplexity = this.getVocabularyComplexity(text)
    const conceptDensity = this.getConceptDensity(text)
    const abstractionLevel = this.getAbstractionLevel(text)
    
    if (avgSentenceLength > 20) {
      complexityScore += 0.2
      factors.push('Long sentences')
    }
    
    if (vocabularyComplexity > 0.7) {
      complexityScore += 0.25
      factors.push('Advanced vocabulary')
    }
    
    if (conceptDensity > 0.6) {
      complexityScore += 0.2
      factors.push('High concept density')
    }
    
    if (abstractionLevel > 0.5) {
      complexityScore += 0.2
      factors.push('Abstract concepts')
    }
    
    // Mathematical complexity
    if (this.isMathContent(text)) {
      const mathComplexity = this.getMathComplexity(text)
      complexityScore += mathComplexity * 0.3
      if (mathComplexity > 0.5) factors.push('Advanced mathematics')
    }
    
    // Code complexity
    if (this.isCodeContent(text)) {
      const codeComplexity = this.getCodeComplexity(text)
      complexityScore += codeComplexity * 0.25
      if (codeComplexity > 0.6) factors.push('Complex algorithms')
    }
    
    // Determine complexity level
    let level: ContentAnalysisResult['complexity']['level']
    if (complexityScore < 0.3) level = 'beginner'
    else if (complexityScore < 0.6) level = 'intermediate'
    else if (complexityScore < 0.8) level = 'advanced'
    else level = 'expert'
    
    return {
      level,
      score: Math.min(1, complexityScore),
      factors
    }
  }
  
  /**
   * Analyze potential for interactivity
   */
  private async analyzeInteractivity(content: ContentItem): Promise<ContentAnalysisResult['interactivity']> {
    const text = this.extractText(content)
    const potentialElements: string[] = []
    let interactivityScore = 0
    
    // Existing interactive elements
    if (this.hasInteractiveElements(content)) {
      interactivityScore += 0.4
      potentialElements.push('Existing interactive components')
    }
    
    // Questions and exercises
    const questionCount = this.countQuestions(text)
    if (questionCount > 0) {
      interactivityScore += Math.min(0.3, questionCount * 0.1)
      potentialElements.push(`${questionCount} potential quiz questions`)
    }
    
    // Mathematical content (can be interactive)
    if (this.isMathContent(text)) {
      interactivityScore += 0.25
      potentialElements.push('Interactive math visualizations')
    }
    
    // Code content (can be executable)
    if (this.isCodeContent(text)) {
      interactivityScore += 0.2
      potentialElements.push('Code execution and modification')
    }
    
    // Step-by-step processes
    const stepCount = this.countSteps(text)
    if (stepCount > 2) {
      interactivityScore += 0.15
      potentialElements.push('Interactive step-by-step guide')
    }
    
    // Data and charts
    if (this.hasDataElements(text)) {
      interactivityScore += 0.2
      potentialElements.push('Interactive charts and graphs')
    }
    
    let level: ContentAnalysisResult['interactivity']['level']
    if (interactivityScore < 0.3) level = 'static'
    else if (interactivityScore < 0.7) level = 'interactive'
    else level = 'highly-interactive'
    
    return {
      level,
      score: Math.min(1, interactivityScore),
      potentialElements
    }
  }
  
  /**
   * Deep pedagogical content analysis
   */
  private async analyzePedagogicalContent(content: ContentItem): Promise<{
    objectives: ContentAnalysisResult['learningObjectives']
    concepts: ContentAnalysisResult['concepts']
    learningStyles: ContentAnalysisResult['learningStyles']
    confidence: number
  }> {
    const text = this.extractText(content)
    
    // Extract learning objectives using NLP patterns
    const primaryObjectives = this.extractLearningObjectives(text)
    const secondaryObjectives = this.extractSecondaryObjectives(text)
    const bloomsLevel = this.determineBloomsTaxonomy(text)
    
    // Concept extraction and relationship mapping
    const mainConcepts = this.extractMainConcepts(text)
    const supportingConcepts = this.extractSupportingConcepts(text)
    const prerequisites = this.identifyPrerequisites(mainConcepts)
    const relationships = this.mapConceptRelationships(mainConcepts, supportingConcepts)
    
    // Learning style analysis
    const learningStyles = this.analyzeLearningStyleSupport(content)
    
    return {
      objectives: {
        primary: primaryObjectives,
        secondary: secondaryObjectives,
        blooms_taxonomy_level: bloomsLevel
      },
      concepts: {
        main: mainConcepts,
        supporting: supportingConcepts,
        prerequisites,
        relationships
      },
      learningStyles,
      confidence: 0.8
    }
  }
  
  /**
   * Generate contextual enhancement recommendations
   */
  private async generateEnhancements(content: ContentItem): Promise<ContentAnalysisResult['enhancements']> {
    const text = this.extractText(content)
    const enhancements: ContentAnalysisResult['enhancements'] = []
    
    // Quiz enhancement for text content
    if (text.length > 500 && this.hasDefinitions(text)) {
      enhancements.push({
        type: 'quiz',
        priority: 0.8,
        reasoning: 'Content contains definitions and concepts suitable for comprehension testing',
        feasibility: 0.9,
        estimated_effort: 'low',
        ai_generatable: true
      })
    }
    
    // Practice enhancement for math/code
    if (this.isMathContent(text) || this.isCodeContent(text)) {
      enhancements.push({
        type: 'practice',
        priority: 0.9,
        reasoning: 'Mathematical and coding concepts require hands-on practice',
        feasibility: 0.7,
        estimated_effort: 'medium',
        ai_generatable: true
      })
    }
    
    // Visualization for complex concepts
    if (this.hasComplexConcepts(text) || this.hasDataElements(text)) {
      enhancements.push({
        type: 'visualization',
        priority: 0.7,
        reasoning: 'Complex concepts benefit from visual representation',
        feasibility: 0.6,
        estimated_effort: 'medium',
        ai_generatable: false
      })
    }
    
    // Mind map for interconnected topics
    if (this.hasMultipleTopics(text)) {
      enhancements.push({
        type: 'mindmap',
        priority: 0.6,
        reasoning: 'Multiple interconnected topics benefit from visual organization',
        feasibility: 0.8,
        estimated_effort: 'low',
        ai_generatable: true
      })
    }
    
    // Interactive elements for engaging content
    if (this.hasScenarios(text) || this.hasExamples(text)) {
      enhancements.push({
        type: 'interactive',
        priority: 0.7,
        reasoning: 'Scenarios and examples can be made interactive for better engagement',
        feasibility: 0.5,
        estimated_effort: 'high',
        ai_generatable: false
      })
    }
    
    return enhancements.sort((a, b) => b.priority - a.priority)
  }
  
  /**
   * Recommend optimal viewers based on analysis
   */
  private async recommendViewers(content: ContentItem): Promise<ContentAnalysisResult['recommendedViewers']> {
    const text = this.extractText(content)
    const recommendations: ContentAnalysisResult['recommendedViewers'] = []
    
    // Mathematics content
    if (this.isMathContent(text)) {
      recommendations.push({
        viewerId: 'slope-drawing',
        suitability: 0.95,
        reasoning: 'Mathematical content benefits from interactive visualization',
        adaptations: ['Enable equation rendering', 'Add step-by-step solutions']
      })
      
      recommendations.push({
        viewerId: 'graph-canvas',
        suitability: 0.85,
        reasoning: 'Graph-based mathematical concepts need interactive manipulation',
        adaptations: ['Configure for mathematical graphing', 'Add formula overlays']
      })
    }
    
    // Video content
    if (content.type.includes('video')) {
      recommendations.push({
        viewerId: 'video-modern',
        suitability: 0.9,
        reasoning: 'Video content benefits from enhanced player features',
        adaptations: ['Enable chapter markers', 'Add accessibility controls']
      })
    }
    
    // Text with high concept density
    if (this.getConceptDensity(text) > 0.6) {
      recommendations.push({
        viewerId: 'mindmap',
        suitability: 0.8,
        reasoning: 'Dense conceptual content benefits from visual organization',
        adaptations: ['Auto-generate concept nodes', 'Enable relationship mapping']
      })
    }
    
    // Interactive learning opportunities
    if (this.countQuestions(text) > 3) {
      recommendations.push({
        viewerId: 'practice',
        suitability: 0.85,
        reasoning: 'Question-rich content is ideal for practice modules',
        adaptations: ['Generate additional practice questions', 'Enable adaptive difficulty']
      })
    }
    
    // AI tutoring for complex content
    const complexity = await this.analyzeComplexity(content);
    if (complexity.level === 'advanced' || complexity.level === 'expert') {
      recommendations.push({
        viewerId: 'ai-tutor',
        suitability: 0.75,
        reasoning: 'Complex content benefits from AI-powered explanations',
        adaptations: ['Enable context-aware responses', 'Add concept clarification']
      })
    }
    
    // Default fallbacks
    recommendations.push({
      viewerId: 'markdown',
      suitability: 0.6,
      reasoning: 'Universal fallback for text-based content',
      adaptations: ['Enable formula rendering', 'Add table of contents']
    })
    
    return recommendations.sort((a, b) => b.suitability - a.suitability)
  }
  
  // Helper methods for content analysis
  private normalizeContent(content: any): ContentItem {
    if (typeof content === 'string') {
      return { type: 'text', content }
    }
    
    if (content?.src || content?.url) {
      return { type: 'video', content }
    }
    
    if (Array.isArray(content)) {
      return { type: 'array', content }
    }
    
    return { type: 'object', content }
  }
  
  private extractText(content: ContentItem): string {
    if (content.type === 'text') return content.content
    if (content.type === 'array') return content.content.map(this.extractTextFromItem).join(' ')
    if (typeof content.content === 'object') return JSON.stringify(content.content)
    return String(content.content)
  }
  
  private extractTextFromItem(item: any): string {
    if (typeof item === 'string') return item
    if (item?.content) return String(item.content)
    if (item?.text) return String(item.text)
    return JSON.stringify(item)
  }
  
  private isCodeContent(text: string): boolean {
    const codeIndicators = ['function', 'class', 'import', 'const', 'let', 'var', '```', 'def ', 'public class']
    return codeIndicators.some(indicator => text.includes(indicator))
  }
  
  private isMathContent(text: string): boolean {
    const mathIndicators = ['$', '\\', 'equation', 'formula', '∫', '∑', '∂', 'theorem', 'proof']
    return mathIndicators.some(indicator => text.includes(indicator))
  }
  
  private hasInteractiveElements(content: ContentItem): boolean {
    const interactiveTerms = ['click', 'drag', 'interactive', 'button', 'input', 'select']
    const text = this.extractText(content)
    return interactiveTerms.some(term => text.toLowerCase().includes(term))
  }
  
  private getAverageSentenceLength(text: string): number {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0)
    const totalWords = sentences.reduce((sum, sentence) => sum + sentence.split(/\s+/).length, 0)
    return sentences.length > 0 ? totalWords / sentences.length : 0
  }
  
  private getVocabularyComplexity(text: string): number {
    const words = text.toLowerCase().match(/\b\w+\b/g) || []
    const uniqueWords = new Set(words)
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length
    const vocabularyDiversity = uniqueWords.size / words.length
    
    // Combine factors (longer words + higher diversity = more complex)
    return Math.min(1, (avgWordLength / 10 + vocabularyDiversity) / 2)
  }
  
  private getConceptDensity(text: string): number {
    const conceptIndicators = ['concept', 'principle', 'theory', 'method', 'approach', 'technique', 'strategy']
    const matches = conceptIndicators.reduce((count, indicator) => {
      return count + (text.toLowerCase().match(new RegExp(indicator, 'g')) || []).length
    }, 0)
    
    return Math.min(1, matches / 10) // Normalize to 0-1
  }
  
  private countQuestions(text: string): number {
    return (text.match(/\?/g) || []).length
  }
  
  private calculateEngagementTime(content: ContentItem, complexity: ContentAnalysisResult['complexity']): number {
    const text = this.extractText(content)
    const baseTime = Math.max(1, Math.floor(text.length / 200)) // Base reading time
    const complexityMultiplier = 1 + (complexity.score * 0.5) // 1.0 to 1.5x
    return Math.round(baseTime * complexityMultiplier)
  }
  
  private calculateLearningTime(content: ContentItem, complexity: ContentAnalysisResult['complexity']): number {
    return this.calculateEngagementTime(content, complexity) * 2 // Learning takes longer than reading
  }
  
  private calculateOverallConfidence(confidenceScores: number[]): number {
    return confidenceScores.reduce((sum, score) => sum + score, 0) / confidenceScores.length
  }
  
  // Placeholder methods - would be implemented with actual NLP/ML models
  private async detectLanguage(text: string): Promise<string> { return 'en' }
  private detectVideoFormat(content: any): string { return 'mp4' }
  private detectCodeLanguage(text: string): string { return 'javascript' }
  private detectMathFormat(text: string): string { return 'latex' }
  private detectTextFormat(text: string): string { return 'markdown' }
  private isComplexStructure(content: any): boolean { return typeof content === 'object' && content !== null }
  private getAbstractionLevel(text: string): number { return 0.5 }
  private getMathComplexity(text: string): number { return 0.5 }
  private getCodeComplexity(text: string): number { return 0.5 }
  private countSteps(text: string): number { return (text.match(/step \d+/gi) || []).length }
  private hasDataElements(text: string): boolean { return text.includes('data') || text.includes('chart') }
  private extractLearningObjectives(text: string): string[] { return [] }
  private extractSecondaryObjectives(text: string): string[] { return [] }
  private determineBloomsTaxonomy(text: string): ContentAnalysisResult['learningObjectives']['blooms_taxonomy_level'] { return 'understand' }
  private extractMainConcepts(text: string): string[] { return [] }
  private extractSupportingConcepts(text: string): string[] { return [] }
  private identifyPrerequisites(concepts: string[]): string[] { return [] }
  private mapConceptRelationships(main: string[], supporting: string[]): ContentAnalysisResult['concepts']['relationships'] { return [] }
  private analyzeLearningStyleSupport(content: ContentItem): ContentAnalysisResult['learningStyles'] {
    return {
      visual: { score: 0.5, evidence: [] },
      auditory: { score: 0.5, evidence: [] },
      kinesthetic: { score: 0.5, evidence: [] },
      reading: { score: 0.5, evidence: [] }
    }
  }
  private hasDefinitions(text: string): boolean { return text.includes('definition') || text.includes('means') }
  private hasComplexConcepts(text: string): boolean { return this.getConceptDensity(text) > 0.5 }
  private hasMultipleTopics(text: string): boolean { return this.extractMainConcepts(text).length > 2 }
  private hasScenarios(text: string): boolean { return text.includes('scenario') || text.includes('example') }
  private hasExamples(text: string): boolean { return text.includes('example') || text.includes('for instance') }
  private identifyRetentionFactors(content: ContentItem): string[] { return ['repetition', 'examples'] }
  private calculateAccessibilityScore(content: ContentItem): number { return 0.8 }
  private extractComments(text: string): string { return text }
}

// React component for displaying analysis results
export const ContentAnalysisPanel: React.FC<{ analysis: ContentAnalysisResult }> = ({ analysis }) => {
  return (
    <div className="bg-gray-800 rounded-lg p-6 space-y-6">
      <div className="flex items-center space-x-3">
        <Brain className="h-6 w-6 text-cyan-400" />
        <h2 className="text-xl font-bold text-white">AI Content Analysis</h2>
        <span className="text-sm text-gray-400">
          {Math.round(analysis.analysisConfidence * 100)}% confidence
        </span>
      </div>
      
      {/* Core Properties */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-400 uppercase">Type</div>
          <div className="font-medium text-white capitalize">{analysis.contentType}</div>
        </div>
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-400 uppercase">Complexity</div>
          <div className={`font-medium capitalize ${
            analysis.complexity.level === 'beginner' ? 'text-green-400' :
            analysis.complexity.level === 'intermediate' ? 'text-yellow-400' :
            analysis.complexity.level === 'advanced' ? 'text-orange-400' :
            'text-red-400'
          }`}>
            {analysis.complexity.level}
          </div>
        </div>
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-400 uppercase">Interactivity</div>
          <div className="font-medium text-cyan-400 capitalize">
            {analysis.interactivity.level}
          </div>
        </div>
        <div className="bg-gray-700 rounded-lg p-3">
          <div className="text-xs text-gray-400 uppercase">Learning Time</div>
          <div className="font-medium text-white">{analysis.estimatedLearningTime}m</div>
        </div>
      </div>
      
      {/* Learning Objectives */}
      {analysis.learningObjectives.primary.length > 0 && (
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="font-medium text-white mb-2 flex items-center">
            <Target className="h-4 w-4 mr-2 text-green-400" />
            Learning Objectives
          </h3>
          <ul className="list-disc list-inside text-gray-300 space-y-1">
            {analysis.learningObjectives.primary.map((objective, index) => (
              <li key={index}>{objective}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Enhancement Recommendations */}
      {analysis.enhancements.length > 0 && (
        <div className="bg-gray-700 rounded-lg p-4">
          <h3 className="font-medium text-white mb-3 flex items-center">
            <Lightbulb className="h-4 w-4 mr-2 text-yellow-400" />
            AI Recommendations
          </h3>
          <div className="space-y-2">
            {analysis.enhancements.slice(0, 3).map((enhancement, index) => (
              <div key={index} className="flex items-center justify-between p-2 bg-gray-600 rounded">
                <div>
                  <span className="text-white font-medium capitalize">{enhancement.type}</span>
                  <p className="text-xs text-gray-400">{enhancement.reasoning}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <span className={`text-xs px-2 py-1 rounded ${
                    enhancement.priority > 0.7 ? 'bg-red-500/20 text-red-400' :
                    enhancement.priority > 0.5 ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-gray-500/20 text-gray-400'
                  }`}>
                    {enhancement.priority > 0.7 ? 'High' : enhancement.priority > 0.5 ? 'Med' : 'Low'}
                  </span>
                  {enhancement.ai_generatable && (
                    <span title="AI Generatable"><Zap className="h-3 w-3 text-cyan-400" /></span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Learning Style Support */}
      <div className="bg-gray-700 rounded-lg p-4">
        <h3 className="font-medium text-white mb-3 flex items-center">
          <Eye className="h-4 w-4 mr-2 text-purple-400" />
          Learning Style Support
        </h3>
        <div className="grid grid-cols-2 gap-3">
          {Object.entries(analysis.learningStyles).map(([style, data]) => (
            <div key={style} className="flex items-center justify-between">
              <span className="text-gray-300 capitalize">{style}</span>
              <div className="flex items-center space-x-2">
                <div className="w-16 bg-gray-600 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-purple-500 to-cyan-500 h-2 rounded-full"
                    style={{ width: `${data.score * 100}%` }}
                  />
                </div>
                <span className="text-xs text-gray-400">{Math.round(data.score * 100)}%</span>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {/* Analysis Metadata */}
      <div className="text-xs text-gray-500 flex items-center justify-between">
        <span>Analysis v{analysis.modelVersion}</span>
        <span>Processed in {analysis.processingTime}ms</span>
      </div>
    </div>
  )
}