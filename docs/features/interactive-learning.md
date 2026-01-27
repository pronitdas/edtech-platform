# Interactive Learning

The EdTech Platform provides a highly interactive learning experience with features like the Slope Drawing Tool, Word Problem Generator, and Cognitive Load Tracking.

## Slope Drawing Tool

The Slope Drawing Tool is an interactive tool that allows students to learn about the concept of slope in a hands-on way. It provides real-time feedback and allows students to experiment with different scenarios.

### Features
- **Interactive Canvas**: p5.js-powered graph canvas with zoom, pan, and point placement
- **Multiple Modes**: Point, Line, Move, and Shape tools
- **Real-time Calculations**: Instant slope, rise/run, and equation display
- **Practice Problems**: Built-in problem generation with difficulty levels
- **Animated Solutions**: Step-by-step animated explanations

### Components
- `SlopeDrawing.tsx` - Main container component
- `GraphCanvas.tsx` - Interactive canvas with p5.js
- `SlopeDrawingLayout.tsx` - Main layout with toolbar and panels
- `PracticeProblem.tsx` - Practice problem display and submission
- `ConceptExplanation.tsx` - Formula and concept explanations
- `WordProblem.tsx` - Dynamic word problem generation
- `AnimatedSolution.tsx` - Step-by-step animation playback
- `StatsDisplay.tsx` - Progress and performance statistics

### Technical Implementation
- **State Management**: Custom hooks (`useGraphManagement`, `useProblemGeneration`)
- **Accessibility**: Full ARIA labels, keyboard navigation, screen reader support
- **Responsive Design**: Mobile-first with touch optimizations
- **Performance**: Optimized canvas rendering, memoization

## Word Problem Generator

The Word Problem Generator creates contextual math problems using AI or template-based generation.

### Features
- **AI-Powered Generation**: Uses OpenAI for dynamic problem creation
- **Template-Based Fallback**: Works without AI connection
- **Difficulty Progression**: Easy, Medium, Hard levels
- **Real-world Contexts**: Construction, travel, business, sports, nature scenarios
- **SVG Visualizations**: Auto-generated problem illustrations

### Hooks
- `useWordProblemGenerator` - Problem generation and answer checking
- `useAnimationController` - Animation playback control

## Cognitive Load Tracking

The Cognitive Load Tracking feature monitors the user's cognitive load based on their interactions with the platform. It provides feedback to the user and can be used to adapt the learning experience to the user's needs.

### Features
- **Interaction Pattern Analysis**: Tracks mouse movements, clicks, and pauses
- **Fatigue Detection**: Heuristics for identifying student fatigue
- **Visual Indicators**: Real-time cognitive load display
- **Adaptive Interventions**: AI agents adjust based on load levels
- **Break Suggestions**: Timely recommendations for breaks

### Components
- `CognitiveLoadIndicator.tsx` - Visual load display
- Agent-based support in `AgentBase.ts`

### Metrics Tracked
- Engagement level
- Response time patterns
- Error frequency
- Session duration
- Interaction frequency
