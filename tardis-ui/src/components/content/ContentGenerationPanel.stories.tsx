import type { Meta, StoryObj } from '@storybook/react';
import { ContentGenerationPanel } from './ContentGenerationPanel';
import { ContentType } from '@/services/edtech-api';
import { ChapterV1 } from '@/types/database';

const mockChapter: ChapterV1 = {
  id: 1,
  chaptertitle: 'Introduction to Linear Algebra',
  subtopic: 'Vectors and Vector Spaces',
  topic: 'Linear Algebra',
  knowledge_id: 123,
  chapter: 'This is the original chapter content.',
  chapter_type: 'text',
  context: null,
  created_at: '2023-01-01T00:00:00Z',
  k_id: 123,
  level: 1,
  lines: 100,
  metadata: null,
  needs_code: false,
  needs_latex: true,
  needs_roleplay: false,
  seeded: true,
  timestamp_end: 600,
  timestamp_start: 0,
  type: 'lecture'
};

const meta: Meta<typeof ContentGenerationPanel> = {
  title: 'Course/ContentGenerationPanel',
  component: ContentGenerationPanel,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
    },
  },
  decorators: [
    (Story) => (
      <div className="bg-gray-900 h-[600px] w-[400px] relative">
        <Story />
      </div>
    ),
  ],
  argTypes: {
    onGenerate: { action: 'generate content' },
    onClose: { action: 'close panel' },
  },
};

export default meta;
type Story = StoryObj<typeof ContentGenerationPanel>;

export const WithMissingContent: Story = {
  args: {
    chapter: mockChapter,
    language: 'English',
    missingTypes: ['notes', 'quiz', 'mindmap'] as ContentType[],
    generatingTypes: [] as ContentType[],
    isGenerating: false,
  },
};

export const WithAllContentAvailable: Story = {
  args: {
    chapter: mockChapter,
    language: 'English',
    missingTypes: [] as ContentType[],
    generatingTypes: [] as ContentType[],
    isGenerating: false,
  },
};

export const GeneratingNotes: Story = {
  args: {
    chapter: mockChapter,
    language: 'English',
    missingTypes: ['notes', 'quiz', 'mindmap'] as ContentType[],
    generatingTypes: ['notes'] as ContentType[],
    isGenerating: true,
  },
};

export const GeneratingMultipleTypes: Story = {
  args: {
    chapter: mockChapter,
    language: 'English',
    missingTypes: ['notes', 'quiz', 'mindmap', 'summary'] as ContentType[],
    generatingTypes: ['notes', 'quiz'] as ContentType[],
    isGenerating: true,
  },
};

export const WithDifferentLanguage: Story = {
  args: {
    chapter: mockChapter,
    language: 'Hindi',
    missingTypes: ['notes', 'mindmap'] as ContentType[],
    generatingTypes: [] as ContentType[],
    isGenerating: false,
  },
}; 