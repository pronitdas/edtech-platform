# TARDIS-UI Design System

## Project Overview
Based on the codebase analysis, TARDIS-UI is an educational platform focused on interactive learning with components for:
- Video learning interface
- Interactive math tools (especially slope drawing components)
- Progress tracking and cognitive load management
- Practice problems with various modes (Concept, Practice, Custom, Word Problems)

## Design System Goals
1. Create a cohesive, accessible, and modern design system
2. Improve user experience for educational content
3. Standardize UI components across the application
4. Support different cognitive states and learning modes
5. Enhance visual hierarchy to focus on learning content

## Color System

### Primary Palette
```
--primary-50: #eff6ff;
--primary-100: #dbeafe;
--primary-200: #bfdbfe;
--primary-300: #93c5fd;
--primary-400: #60a5fa;
--primary-500: #3b82f6;  /* Main Brand Color */
--primary-600: #2563eb;
--primary-700: #1d4ed8;
--primary-800: #1e40af;
--primary-900: #1e3a8a;
--primary-950: #172554;
```

### Secondary Palette
```
--secondary-50: #f0f9ff;
--secondary-100: #e0f2fe;
--secondary-200: #bae6fd;
--secondary-300: #7dd3fc;
--secondary-400: #38bdf8;
--secondary-500: #0ea5e9;  /* Secondary Brand Color */
--secondary-600: #0284c7;
--secondary-700: #0369a1;
--secondary-800: #075985;
--secondary-900: #0c4a6e;
--secondary-950: #082f49;
```

### Feedback Colors
```
--success-50: #f0fdf4;
--success-500: #22c55e;
--success-700: #15803d;

--warning-50: #fffbeb;
--warning-500: #f59e0b;
--warning-700: #b45309;

--error-50: #fef2f2;
--error-500: #ef4444;
--error-700: #b91c1c;

--info-50: #eff6ff;
--info-500: #3b82f6;
--info-700: #1d4ed8;
```

### Neutral Colors
```
--gray-50: #f8fafc;
--gray-100: #f1f5f9;
--gray-200: #e2e8f0;
--gray-300: #cbd5e1;
--gray-400: #94a3b8;
--gray-500: #64748b;
--gray-600: #475569;
--gray-700: #334155;
--gray-800: #1e293b;
--gray-900: #0f172a;
--gray-950: #020617;
```

### Cognitive Load Indicators
```
--cognitive-low: #22c55e;      /* Success Green */
--cognitive-medium: #f59e0b;   /* Warning Yellow */
--cognitive-high: #ef4444;     /* Error Red */
```

## Typography System

### Font Families
```
--font-sans: 'Inter', system-ui, sans-serif;       /* Primary UI Font */
--font-mono: 'Roboto Mono', monospace;             /* Code Blocks */
--font-math: 'KaTeX_Main', serif;                  /* Mathematical Expressions */
```

### Font Sizes
```
--text-xs: 0.75rem;    /* 12px */
--text-sm: 0.875rem;   /* 14px */
--text-base: 1rem;     /* 16px */
--text-lg: 1.125rem;   /* 18px */
--text-xl: 1.25rem;    /* 20px */
--text-2xl: 1.5rem;    /* 24px */
--text-3xl: 1.875rem;  /* 30px */
--text-4xl: 2.25rem;   /* 36px */
--text-5xl: 3rem;      /* 48px */
```

### Font Weights
```
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Line Heights
```
--leading-none: 1;
--leading-tight: 1.25;
--leading-snug: 1.375;
--leading-normal: 1.5;
--leading-relaxed: 1.625;
--leading-loose: 2;
```

## Spacing & Layout

### Spacing Scale
```
--space-1: 0.25rem;   /* 4px */
--space-2: 0.5rem;    /* 8px */
--space-3: 0.75rem;   /* 12px */
--space-4: 1rem;      /* 16px */
--space-5: 1.25rem;   /* 20px */
--space-6: 1.5rem;    /* 24px */
--space-8: 2rem;      /* 32px */
--space-10: 2.5rem;   /* 40px */
--space-12: 3rem;     /* 48px */
--space-16: 4rem;     /* 64px */
--space-20: 5rem;     /* 80px */
--space-24: 6rem;     /* 96px */
```

### Border Radius
```
--radius-sm: 0.125rem;  /* 2px */
--radius-md: 0.375rem;  /* 6px */
--radius-lg: 0.5rem;    /* 8px */
--radius-xl: 0.75rem;   /* 12px */
--radius-2xl: 1rem;     /* 16px */
--radius-full: 9999px;
```

### Shadows
```
--shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
--shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
--shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
--shadow-xl: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
```

## Component Design

### Layout Structure
The application should follow a consistent layout structure:

```
┌────────────────────────────────────────────────┐
│ Header (Nav, Language, User)                   │
├────────────┬───────────────────────────────────┤
│            │                                   │
│            │                                   │
│ Sidebar    │         Main Content Area         │
│ (Course    │         - Video Area              │
│  Chapters, │         - Interactive Tools       │
│  Progress) │         - Practice Problems       │
│            │                                   │
│            │                                   │
├────────────┴───────────────────────────────────┤
│ Footer (Optional)                              │
└────────────────────────────────────────────────┘
```

### Component Improvements

#### 1. Slope Drawing Component
The current `SlopeDrawing.tsx` component is 600+ lines and should be refactored into smaller, more focused components:

```
SlopeDrawing/
├── components/
│   ├── GraphCanvas.tsx         /* p5.js visualization */
│   ├── ConceptExplorer.tsx     /* Concept definitions */
│   ├── PracticeProblem.tsx     /* Problem generation */
│   ├── CustomProblemSolver.tsx /* User-input problems */
│   ├── WordProblem.tsx         /* Word problems with illustrations */
│   ├── AnimatedSolution.tsx    /* Dynamic solution visualization */
│   └── CognitiveLoadDisplay.tsx /* Load indicators */
├── hooks/
│   ├── useGraphManagement.ts   /* Canvas state management */
│   ├── useProblemGeneration.ts /* Problem creation logic */
│   └── useAnimationController.ts /* SVG animations */
└── SlopeDrawing.tsx            /* Main container with tabs */
```

#### 2. Practice Modes UI
We should standardize the UI for the different practice modes (Concept, Practice, Custom, Word):

```
┌─────────────────────────────────────────────────────────┐
│ ┌─────┐ ┌──────────┐ ┌───────┐ ┌────────────┐          │
│ │Concept│ │Practice  │ │Custom │ │Word Problem│          │
│ └─────┘ └──────────┘ └───────┘ └────────────┘          │
├─────────────────────────────────────────────────────────┤
│                                                         │
│                                                         │
│                   Content Area                          │
│                                                         │
│                                                         │
├─────────────────────────────────────────────────────────┤
│ ┌─────────────────┐          ┌──────────────────────┐  │
│ │ Cognitive Load  │          │  Practice Stats      │  │
│ │ ■■■■□□□□□□      │          │  Correct: 7  Time: 5m│  │
│ └─────────────────┘          └──────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## Wireframes for Main Components

### Main Learning Interface
```
┌────────────────────────────────────────────────────────────────────┐
│ ◀ Back                                                     English ▼ │
├────────────────────────────────────────────────────────────────────┤
│ ◀ Understanding Slope: The Foundation of Linear Equations          │
├───────────┬────────────────────────────────────────────────────────┤
│ ┌────────┐│ ┌────────┐ ┌─────────┐ ┌───────────┐                   │
│ │Original││ │ Video  │ │Practice │ │           │                   │
│ └────────┘│ └────────┘ └─────────┘ └───────────┘                   │
│           │                                                        │
│  Your     │ ┌────────────────────────────────────────────────────┐ │
│  Progress │ │                                                    │ │
│           │ │                                                    │ │
│  Course   │ │                                                    │ │
│  Progress │ │               Content Area                         │ │
│  0%       │ │               (Video or Interactive Content)       │ │
│           │ │                                                    │ │
│  Videos:  │ │                                                    │ │
│  0%       │ │                                                    │ │
│           │ │                                                    │ │
│  Quizzes: │ │                                                    │ │
│  0%       │ └────────────────────────────────────────────────────┘ │
│           │                                                        │
│ Chapters  │ ┌──────────────────────────────────────────────────┐   │
│           │ │ Cognitive: LOW     Errors: 0     Hesitation: 0:00│   │
│ [Search]  │ └──────────────────────────────────────────────────┘   │
│           │                                                        │
└───────────┴────────────────────────────────────────────────────────┘
```

### Interactive Slope Tool
```
┌────────────────────────────────────────────────────────────────────┐
│ ┌─────────┐ ┌──────────┐ ┌─────────┐ ┌──────────────┐              │
│ │ Concept │ │ Practice │ │ Custom  │ │ Word Problem │              │
│ └─────────┘ └──────────┘ └─────────┘ └──────────────┘              │
├────────────────────────────────────────────────────────────────────┤
│ ┌──────────────────────────────┐  ┌─────────────────────────────┐  │
│ │                              │  │                             │  │
│ │                              │  │ Choose a slope concept:     │  │
│ │                              │  │ ┌─────────────────────────┐ │  │
│ │                              │  │ │ Understanding Slope    ▼ │ │  │
│ │                              │  │ └─────────────────────────┘ │  │
│ │                              │  │                             │  │
│ │       Graph Canvas           │  │ Slope measures the rate at  │  │
│ │       (p5.js)                │  │ which a line rises or falls │  │
│ │                              │  │ as we move from left to     │  │
│ │                              │  │ right along the line.       │  │
│ │                              │  │                             │  │
│ │                              │  │ Formula:                    │  │
│ │                              │  │ m = (y₂ - y₁)/(x₂ - x₁)     │  │
│ │                              │  │                             │  │
│ └──────────────────────────────┘  └─────────────────────────────┘  │
│                                                                    │
│ ┌───────────────────────────────────────────────────────────────┐  │
│ │  ┌────────────────┐          ┌──────────────────────────────┐ │  │
│ │  │ Cognitive Load │          │ Practice Statistics          │ │  │
│ │  │ ■■■□□□□□□□     │          │ Correct: 0  Incorrect: 0     │ │  │
│ │  │     LOW        │          │ Total Solved: 0              │ │  │
│ │  └────────────────┘          └──────────────────────────────┘ │  │
│ └───────────────────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────────────────┘
```

## Implementation Plan

### Phase 1: Design Tokens & Foundation
1. Create CSS variables or Tailwind theme extension for design tokens
2. Update typography and color system 
3. Create reusable layout components

### Phase 2: Core Components
1. Refactor button, card, dialog and other UI components
2. Create specialized educational components:
   - MathFormula (KaTeX integration)
   - GraphCanvas (p5.js wrapper)
   - CognitiveLoadIndicator
   - PracticeStats

### Phase 3: Feature Components
1. Refactor SlopeDrawing into smaller components
2. Enhance video player with interactive markers
3. Improve the cognitive load management UI
4. Implement word problem visualization

### Phase 4: Page Templates
1. Create standardized page templates for:
   - Course overview
   - Chapter content
   - Practice sessions
   - Progress reports

## Key Improvements from Current Design

1. **Consistent Visual Language**: Standardized colors, typography, and spacing
2. **Better Component Organization**: Breaking large components into smaller, focused ones
3. **Enhanced Accessibility**: Proper color contrast, keyboard navigation, and screen reader support
4. **Visual Hierarchy**: Clear distinction between different types of content
5. **Cognitive Load Indicators**: Visually intuitive displays of learning state
6. **Responsive Design**: Optimized for different screen sizes and devices
7. **Interactive Feedback**: Clear visual feedback for user interactions

## Next Steps
1. Implement design tokens in Tailwind configuration
2. Create a component storybook for UI documentation
3. Begin refactoring existing components to use the new design system
4. Prioritize completing the slope drawing tool enhancements 