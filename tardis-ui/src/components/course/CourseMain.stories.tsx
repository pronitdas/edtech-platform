import type { Meta, StoryObj } from '@storybook/react'
import CourseMain from './CourseMain'
import {
  BookOpen,
  FileText,
  PieChart,
  Video,
  Brain,
  MessageSquare,
} from 'lucide-react'
import { MockInteractionTrackerProvider } from '../../stories/MockInteractionTrackerProvider'

// Mock data for our stories
const mockChapter = {
  id: 1,
  chaptertitle: 'Introduction to Linear Algebra',
  subtopic: 'Vectors and Vector Spaces',
  topic: 'Linear Algebra',
  knowledge_id: 123,
  chapter:
    'This is the original chapter content. Linear algebra is the branch of mathematics concerning linear equations, linear functions and their representations through matrices and vector spaces.',
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
  type: 'lecture',
}

const mockContent = {
  notes:
    'These are the notes for the chapter. Linear algebra is a fundamental area of mathematics that deals with vector spaces and linear transformations between these spaces.',
  summary:
    'This chapter introduces the fundamental concepts of linear algebra, focusing on vectors, vector spaces, and their operations.',
  quiz: [
    {
      question: 'What is a vector space?',
      options: [
        'A collection of vectors',
        'A mathematical structure that is a set of vectors with operations of addition and scalar multiplication',
        'A three-dimensional coordinate system',
        'A point in a coordinate system',
      ],
      correct_answer:
        'A mathematical structure that is a set of vectors with operations of addition and scalar multiplication',
      answer: '',
      explanation:
        'A vector space is a mathematical structure formed by a set of vectors with operations of addition and scalar multiplication, satisfying certain axioms.',
    },
    {
      question: 'What is linear independence?',
      options: [
        'When vectors are perpendicular to each other',
        'When no vector in a set can be written as a linear combination of the others',
        'When vectors have the same magnitude',
        'When vectors point in the same direction',
      ],
      correct_answer:
        'When no vector in a set can be written as a linear combination of the others',
      answer: '',
      explanation:
        'A set of vectors is linearly independent if no vector in the set can be expressed as a linear combination of the other vectors.',
    },
  ],
  mindmap:
    '{"nodes":[{"id":"root","text":"Linear Algebra","fx":400,"fy":200},{"id":"node1","text":"Vector Spaces","fx":200,"fy":100},{"id":"node2","text":"Linear Transformations","fx":600,"fy":100},{"id":"node3","text":"Matrices","fx":200,"fy":300},{"id":"node4","text":"Eigenvalues & Eigenvectors","fx":600,"fy":300}],"links":[{"source":"root","target":"node1"},{"source":"root","target":"node2"},{"source":"root","target":"node3"},{"source":"root","target":"node4"},{"source":"node1","target":"node3"},{"source":"node2","target":"node3"},{"source":"node3","target":"node4"}]}',
  video_url: 'https://example.com/videos/linear-algebra-intro.mp4',
  roleplay: {
    scenarios: [
      {
        id: '1',
        title: 'Professor and Student Discussion',
        description:
          'A conversation between a math professor and a student trying to understand vector spaces.',
        characters: [
          {
            id: 'prof',
            name: 'Professor Smith',
            description:
              'An experienced mathematics professor specializing in linear algebra.',
          },
          {
            id: 'student',
            name: 'Alex',
            description:
              'A curious student trying to understand the fundamentals of vector spaces.',
          },
        ],
        initialPrompt:
          'Alex approaches Professor Smith after class with questions about vector spaces.',
        relatedCourse: 'Linear Algebra',
      },
    ],
  },
  latex_code: '\\begin{align} V = \\{v_1, v_2, \\ldots, v_n\\} \\end{align}',
}

const meta: Meta<typeof CourseMain> = {
  title: 'Course/CourseMain',
  component: CourseMain,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    Story => (
      <div className='min-h-screen bg-gray-900'>
        <MockInteractionTrackerProvider>
          <Story />
        </MockInteractionTrackerProvider>
      </div>
    ),
  ],
  // Hide certain controls that shouldn't be modified in Storybook
  argTypes: {
    content: { control: 'object' },
    language: {
      control: 'select',
      options: ['English', 'Hindi', 'Bengali', 'Marathi', 'Vietnamese'],
    },
    chapter: { control: 'object' },
  },
}

export default meta
type Story = StoryObj<typeof CourseMain>

export const Default: Story = {
  args: {
    content: mockContent,
    language: 'English',
    chapter: mockChapter,
  },
}

export const WithMissingContent: Story = {
  args: {
    content: {
      notes: mockContent.notes,
      summary: mockContent.summary,
      // Quiz, mindmap, and video content are omitted
    },
    language: 'English',
    chapter: mockChapter,
  },
}

export const LoadingState: Story = {
  args: {
    content: null,
    language: 'English',
    chapter: null,
  },
}

export const WithDifferentLanguage: Story = {
  args: {
    content: mockContent,
    language: 'Hindi',
    chapter: mockChapter,
  },
}

// Define a story where only certain content types are available
export const LimitedContent: Story = {
  args: {
    content: {
      notes: mockContent.notes,
      mindmap: mockContent.mindmap,
      // Only notes and mindmap are available
    },
    language: 'English',
    chapter: mockChapter,
  },
}
