# AI-Powered Content Generation

The EdTech Platform uses AI to generate a variety of educational content, including notes, summaries, mind maps, and quizzes. This feature helps to reduce the workload for instructors and provides students with a variety of learning materials.

## Content Generation Pipeline

The content generation pipeline uses a combination of OpenAI's GPT models and local models to generate high-quality content. The pipeline is designed to be flexible and extensible, allowing for the addition of new content types and models in the future.

### Supported Content Types

#### Notes Generation
- Automatic note creation from video/content
- Key concept extraction
- Structured formatting with markdown

#### Summary Generation
- Concise content summaries
- Bullet-point formatting
- Reading time estimation

#### Mind Map Generation
- Visual concept mapping
- Hierarchical structure
- Exportable formats

#### Quiz Generation
- Multiple choice questions
- Difficulty-based selection
- Answer explanations

### AI Services

#### OpenAI Integration (`openAi.ts`)
- GPT-4 and GPT-4o-mini support
- Token management and optimization
- Streaming responses

#### Content Services (`edtech-content.ts`, `content-service.ts`)
- Content validation and formatting
- Multi-language support
- Caching for performance

### Word Problem AI

The platform includes specialized AI for generating mathematical word problems:

- **Contextual Generation**: Real-world scenarios (construction, travel, business)
- **Difficulty Scaling**: Adjusts complexity based on student level
- **Solution Validation**: AI-powered answer checking and feedback
- **Visualization Generation**: SVG illustrations for problems

### AI Agents

The platform includes a multi-agent system for personalized learning:

- **Cognitive Agent**: Monitors fatigue and attention
- **Tutor Agent**: Provides micro-teaching responses
- **Difficulty Agent**: Adjusts challenge levels
- **Motivator Agent**: Provides encouragement
- **Explainer Agent**: Generates visual explanations

### Configuration

Content generation can be configured via environment variables:
- `VITE_OPENAI_API_KEY` - OpenAI API key
- `VITE_AI_MODEL` - Default AI model
- `VITE_MAX_TOKENS` - Response token limit
