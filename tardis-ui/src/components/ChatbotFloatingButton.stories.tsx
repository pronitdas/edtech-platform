import type { Meta, StoryObj } from '@storybook/react'
import ChatbotFloatingButton from './ChatbotFloatingButton'
import { MockInteractionTrackerProvider } from '../stories/MockInteractionTrackerProvider'

const meta: Meta<typeof ChatbotFloatingButton> = {
  title: 'Course/ChatbotFloatingButton',
  component: ChatbotFloatingButton,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
    },
  },
  decorators: [
    Story => (
      <div className='flex h-[400px] w-[400px] items-end justify-start bg-gray-900 p-4'>
        <MockInteractionTrackerProvider>
          <Story />
        </MockInteractionTrackerProvider>
      </div>
    ),
  ],
  argTypes: {
    contentContext: { control: 'text' },
    chapterTitle: { control: 'text' },
  },
}

export default meta
type Story = StoryObj<typeof ChatbotFloatingButton>

export const Default: Story = {
  args: {
    contentContext:
      'Linear algebra is a branch of mathematics concerning linear equations, linear maps and their representations through matrices and vector spaces.',
    chapterTitle: 'Introduction to Linear Algebra',
  },
}

export const WithLongContext: Story = {
  args: {
    contentContext:
      'Vector spaces are mathematical structures formed by a collection of vectors, which may be added together and multiplied by scalars. A vector space, or linear space, is a set of objects called vectors, which may be added together and multiplied by numbers called scalars. The operations of vector addition and scalar multiplication must satisfy certain requirements, called vector axioms. Linear algebra is concerned with properties common to all vector spaces. Linear Transformations are mappings between vector spaces that preserve the vector space structure.',
    chapterTitle: 'Vector Spaces and Linear Transformations',
  },
}

export const WithShortTitle: Story = {
  args: {
    contentContext:
      'Matrices are rectangular arrays of numbers or other mathematical objects which can be added and multiplied.',
    chapterTitle: 'Matrices',
  },
}

export const WithNoContent: Story = {
  args: {
    contentContext: '',
    chapterTitle: 'Eigenvalues and Eigenvectors',
  },
}
