import type { Meta, StoryObj } from '@storybook/react'
import { Input } from './input'
import { Search, Mail, AlertCircle } from 'lucide-react'

const meta: Meta<typeof Input> = {
  title: 'UI/Input',
  component: Input,
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['text', 'email', 'password', 'number', 'search', 'tel', 'url'],
      description: 'Type of the input field',
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder text',
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the input is disabled',
    },
    error: {
      control: 'boolean',
      description: 'Whether the input is in an error state',
    },
    errorMessage: {
      control: 'text',
      description: 'Error message to display',
    },
    helperText: {
      control: 'text',
      description: 'Helper text to display',
    },
  },
}

export default meta
type Story = StoryObj<typeof Input>

export const Default: Story = {
  args: {
    type: 'text',
    placeholder: 'Enter text...',
  },
}

export const WithHelperText: Story = {
  args: {
    type: 'email',
    placeholder: 'Enter your email',
    helperText: 'We will never share your email',
  },
}

export const WithError: Story = {
  args: {
    type: 'email',
    placeholder: 'Enter your email',
    error: true,
    errorMessage: 'Please enter a valid email address',
  },
}

export const WithLeftIcon: Story = {
  args: {
    type: 'search',
    placeholder: 'Search...',
    leftIcon: <Search className='h-4 w-4' />,
  },
}

export const WithRightIcon: Story = {
  args: {
    type: 'text',
    placeholder: 'Enter text...',
    rightIcon: <AlertCircle className='h-4 w-4' />,
  },
}

export const WithBothIcons: Story = {
  args: {
    type: 'email',
    placeholder: 'Enter your email',
    leftIcon: <Mail className='h-4 w-4' />,
    rightIcon: <AlertCircle className='h-4 w-4' />,
  },
}

export const Disabled: Story = {
  args: {
    type: 'text',
    placeholder: 'Disabled input',
    disabled: true,
  },
}

export const AllStates: Story = {
  render: () => (
    <div className='space-y-4'>
      <Input placeholder='Default input' />
      <Input
        placeholder='With helper text'
        helperText='This is a helper text'
      />
      <Input
        placeholder='With error'
        error
        errorMessage='This field is required'
      />
      <Input
        placeholder='With left icon'
        leftIcon={<Search className='h-4 w-4' />}
      />
      <Input
        placeholder='With right icon'
        rightIcon={<AlertCircle className='h-4 w-4' />}
      />
      <Input placeholder='Disabled input' disabled />
    </div>
  ),
}
