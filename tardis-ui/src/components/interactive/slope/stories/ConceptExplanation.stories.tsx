import type { Meta, StoryObj } from '@storybook/react';
import ConceptExplanation from '../components/ConceptExplanation';
import { Concept } from '../types';

const meta = {
  title: 'Slope/ConceptExplanation',
  component: ConceptExplanation,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  decorators: [
    (Story) => (
      <div style={{ width: '400px', height: '600px', background: '#1a1a1a', padding: '1rem' }}>
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ConceptExplanation>;

export default meta;
type Story = StoryObj<typeof meta>;

const sampleConcepts: Concept[] = [
  {
    id: 'positive',
    title: 'Positive Slope',
    content: 'A line that rises from left to right has a positive slope. As x increases, y increases. This means the rate of change is positive.',
    formula: '$$m = \\frac{y_2 - y_1}{x_2 - x_1} > 0$$',
    demoPoints: [{ x: -2, y: -1 }, { x: 2, y: 3 }],
    examples: [
      {
        id: 'positive-1',
        description: 'For points $(1, 1)$ and $(3, 5)$, the slope is:',
        formula: '$$m = \\frac{5 - 1}{3 - 1} = \\frac{4}{2} = 2$$'
      }
    ]
  },
  {
    id: 'negative',
    title: 'Negative Slope',
    content: 'A line that falls from left to right has a negative slope. As x increases, y decreases.',
    formula: '$$m = \\frac{y_2 - y_1}{x_2 - x_1} < 0$$',
    demoPoints: [{ x: -2, y: 3 }, { x: 2, y: -1 }],
    examples: [
      {
        id: 'negative-1',
        description: 'For points $(2, 4)$ and $(6, 1)$, the slope is:',
        formula: '$$m = \\frac{1 - 4}{6 - 2} = \\frac{-3}{4} = -0.75$$'
      }
    ]
  }
];

const sampleLineData = {
  slope: 2,
  yIntercept: 1,
  equation: 'y = 2x + 1',
  point1: { x: -2, y: -3 },
  point2: { x: 2, y: 5 },
  rise: 8,
  run: 4
};

export const Default: Story = {
  args: {
    concepts: sampleConcepts,
    selectedConceptId: 'positive',
    onSelectConcept: (id) => console.log('Selected concept:', id),
    lineData: sampleLineData,
  },
};

export const NegativeSlope: Story = {
  args: {
    concepts: sampleConcepts,
    selectedConceptId: 'negative',
    onSelectConcept: (id) => console.log('Selected concept:', id),
    lineData: {
      slope: -1.5,
      yIntercept: -1,
      equation: 'y = -1.5x - 1',
      point1: { x: -2, y: 2 },
      point2: { x: 2, y: -4 },
      rise: -6,
      run: 4
    },
  },
};

export const NoSelection: Story = {
  args: {
    concepts: sampleConcepts,
    selectedConceptId: null,
    onSelectConcept: (id) => console.log('Selected concept:', id),
    lineData: sampleLineData,
  },
};

export const WithoutLineData: Story = {
  args: {
    concepts: sampleConcepts,
    selectedConceptId: 'positive',
    onSelectConcept: (id) => console.log('Selected concept:', id),
  },
}; 