import type { Meta, StoryObj } from '@storybook/react'
import CourseHeader from './CourseHeader'
import { ContentType } from '@/services/edtech-api'

const mockChapter = {
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
  type: 'lecture',
}

// Define available tabs with iconIdentifier instead of icon React elements
const availableTabs = [
  {
    label: 'Notes',
    key: 'notes',
    iconIdentifier: 'FileText',
  },
  {
    label: 'Summary',
    key: 'summary',
    iconIdentifier: 'BookOpen',
  },
  {
    label: 'Quiz',
    key: 'quiz',
    iconIdentifier: 'PieChart',
  },
  {
    label: 'Mindmap',
    key: 'mindmap',
    iconIdentifier: 'Brain',
  },
  {
    label: 'Video',
    key: 'video',
    iconIdentifier: 'Video',
  },
  {
    label: 'Roleplay',
    key: 'roleplay',
    iconIdentifier: 'MessageSquare',
  },
]

const meta: Meta<typeof CourseHeader> = {
  title: 'Course/CourseHeader',
  component: CourseHeader,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    Story => (
      <div className='bg-gray-900'>
        <Story />
      </div>
    ),
  ],
  argTypes: {
    onShowSettings: { action: 'showSettings clicked' },
    onShowReport: { action: 'showReport clicked' },
    toggleSidebar: { action: 'toggleSidebar clicked' },
    handleTabClick: { action: 'tab clicked' },
    getMissingContentTypes: {
      description: 'Function to get missing content types',
    },
  },
}

export default meta
type Story = StoryObj<typeof CourseHeader>

// Helper function to mock getMissingContentTypes
const mockGetMissingContentTypes = () => {
  return ['quiz', 'mindmap', 'video'] as ContentType[]
}

export const Default: Story = {
  args: {
    chapter: mockChapter,
    activeTab: 'notes',
    sidebarOpen: true,
    availableTabs: availableTabs,
    showSettingsButton: true,
    getMissingContentTypes: mockGetMissingContentTypes,
  },
}

export const WithNoMissingContent: Story = {
  args: {
    chapter: mockChapter,
    activeTab: 'notes',
    sidebarOpen: true,
    availableTabs: availableTabs,
    showSettingsButton: false,
    getMissingContentTypes: () => [] as ContentType[],
  },
}

export const WithSidebarClosed: Story = {
  args: {
    chapter: mockChapter,
    activeTab: 'quiz',
    sidebarOpen: false,
    availableTabs: availableTabs,
    showSettingsButton: true,
    getMissingContentTypes: mockGetMissingContentTypes,
  },
}

export const WithLimitedTabs: Story = {
  args: {
    chapter: mockChapter,
    activeTab: 'notes',
    sidebarOpen: true,
    availableTabs: availableTabs.slice(0, 2), // Only Notes and Summary tabs
    showSettingsButton: true,
    getMissingContentTypes: mockGetMissingContentTypes,
  },
}

export const WithActiveTabVideo: Story = {
  args: {
    chapter: mockChapter,
    activeTab: 'video',
    sidebarOpen: true,
    availableTabs: availableTabs,
    showSettingsButton: true,
    getMissingContentTypes: mockGetMissingContentTypes,
  },
}
