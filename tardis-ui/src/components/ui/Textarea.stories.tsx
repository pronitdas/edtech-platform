import type { Meta, StoryObj } from '@storybook/react'
import { Textarea } from './textarea'

const meta: Meta<typeof Textarea> = {
  title: 'UI/Textarea',
  component: Textarea,
  tags: ['autodocs'],
  argTypes: {
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the textarea is disabled',
    },
    error: {
      control: 'boolean',
      description: 'Whether the textarea is in an error state',
    },
    errorMessage: {
      control: 'text',
      description: 'Error message to display',
    },
    helperText: {
      control: 'text',
      description: 'Helper text to display',
    },
    rows: {
      control: 'number',
      description: 'Number of visible text lines',
    },
  },
}

export default meta
type Story = StoryObj<typeof Textarea>

export const Default: Story = {
  args: {
    placeholder: 'Type your message here...',
    rows: 4,
  },
}

export const WithHelperText: Story = {
  args: {
    placeholder: 'Type your message here...',
    helperText: 'Maximum 500 characters',
    rows: 4,
  },
}

export const WithError: Story = {
  args: {
    placeholder: 'Type your message here...',
    error: true,
    errorMessage: 'Message is required',
    rows: 4,
  },
}

export const Disabled: Story = {
  args: {
    placeholder: 'This textarea is disabled',
    disabled: true,
    rows: 4,
  },
}

export const LargeTextarea: Story = {
  args: {
    placeholder: 'Type your message here...',
    rows: 8,
  },
}

export const AllStates: Story = {
  render: () => (
    <div className='space-y-4'>
      <Textarea placeholder='Default textarea' rows={4} />
      <Textarea
        placeholder='With helper text'
        helperText='This is a helper text'
        rows={4}
      />
      <Textarea
        placeholder='With error'
        error
        errorMessage='This field is required'
        rows={4}
      />
      <Textarea placeholder='Disabled textarea' disabled rows={4} />
    </div>
  ),
}
