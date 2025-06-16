import type { Meta, StoryObj } from '@storybook/react'
import { Dialog } from './Dialog'
import { useState } from 'react'

const meta: Meta<typeof Dialog> = {
  title: 'UI/Dialog',
  component: Dialog,
  tags: ['autodocs'],
  argTypes: {
    isOpen: {
      control: 'boolean',
      description: 'Controls the visibility of the dialog',
    },
    title: {
      control: 'text',
      description: 'Dialog title',
    },
    description: {
      control: 'text',
      description: 'Dialog description for accessibility',
    },
    maxWidth: {
      control: 'select',
      options: ['sm', 'md', 'lg', 'xl', '2xl'],
      description: 'Maximum width of the dialog',
    },
  },
}

export default meta
type Story = StoryObj<typeof Dialog>

// Wrapper component to handle state
const DialogDemo = (args: any) => {
  const [isOpen, setIsOpen] = useState(false)
  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className='rounded-md bg-primary-500 px-4 py-2 text-white hover:bg-primary-600'
      >
        Open Dialog
      </button>
      <Dialog {...args} isOpen={isOpen} onClose={() => setIsOpen(false)} />
    </>
  )
}

// Basic dialog
export const Basic: Story = {
  render: args => <DialogDemo {...args} />,
  args: {
    title: 'Basic Dialog',
    children: 'This is a basic dialog with just a title and content.',
    footer: (
      <>
        <button
          className='px-4 py-2 text-gray-700 hover:text-gray-900'
          onClick={() => {}}
        >
          Cancel
        </button>
        <button
          className='rounded-md bg-primary-500 px-4 py-2 text-white hover:bg-primary-600'
          onClick={() => {}}
        >
          Confirm
        </button>
      </>
    ),
  },
}

// Dialog with description
export const WithDescription: Story = {
  render: args => <DialogDemo {...args} />,
  args: {
    title: 'Delete Account',
    description:
      'Are you sure you want to delete your account? This action cannot be undone.',
    children: (
      <div className='mt-4 text-sm text-gray-500'>
        <p>
          All of your data will be permanently removed. This action cannot be
          undone.
        </p>
      </div>
    ),
    footer: (
      <>
        <button
          className='px-4 py-2 text-gray-700 hover:text-gray-900'
          onClick={() => {}}
        >
          Cancel
        </button>
        <button
          className='hover:bg-error-600 rounded-md bg-error-500 px-4 py-2 text-white'
          onClick={() => {}}
        >
          Delete Account
        </button>
      </>
    ),
  },
}

// Large dialog with form
export const LargeWithForm: Story = {
  render: args => <DialogDemo {...args} />,
  args: {
    title: 'Create New Course',
    maxWidth: 'xl',
    children: (
      <div className='mt-4 space-y-4'>
        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
            Course Title
          </label>
          <input
            type='text'
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500'
            placeholder='Introduction to Mathematics'
          />
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
            Description
          </label>
          <textarea
            rows={3}
            className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500'
            placeholder='Enter course description...'
          />
        </div>
        <div>
          <label className='block text-sm font-medium text-gray-700 dark:text-gray-300'>
            Difficulty Level
          </label>
          <select className='mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500'>
            <option>Beginner</option>
            <option>Intermediate</option>
            <option>Advanced</option>
          </select>
        </div>
      </div>
    ),
    footer: (
      <>
        <button
          className='px-4 py-2 text-gray-700 hover:text-gray-900'
          onClick={() => {}}
        >
          Cancel
        </button>
        <button
          className='rounded-md bg-primary-500 px-4 py-2 text-white hover:bg-primary-600'
          onClick={() => {}}
        >
          Create Course
        </button>
      </>
    ),
  },
}
