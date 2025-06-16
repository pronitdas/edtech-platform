import type { Meta, StoryObj } from '@storybook/react'
import { Typography } from './typography'

const meta: Meta<typeof Typography> = {
  title: 'UI/Typography',
  component: Typography,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: [
        'h1',
        'h2',
        'h3',
        'h4',
        'h5',
        'h6',
        'p',
        'lead',
        'large',
        'small',
        'muted',
        'caption',
      ],
      description: 'The visual style variant of the text',
    },
    weight: {
      control: 'select',
      options: ['light', 'normal', 'medium', 'semibold', 'bold', 'extrabold'],
      description: 'Font weight of the text',
    },
    align: {
      control: 'select',
      options: ['left', 'center', 'right'],
      description: 'Text alignment',
    },
    children: {
      control: 'text',
      description: 'Text content',
    },
  },
}

export default meta
type Story = StoryObj<typeof Typography>

export const Heading1: Story = {
  args: {
    variant: 'h1',
    children: 'Heading 1',
  },
}

export const Heading2: Story = {
  args: {
    variant: 'h2',
    children: 'Heading 2',
  },
}

export const Paragraph: Story = {
  args: {
    variant: 'p',
    children:
      'This is a paragraph of text. It demonstrates the standard paragraph styling with proper line height and spacing.',
  },
}

export const Lead: Story = {
  args: {
    variant: 'lead',
    children: 'A leading paragraph that introduces the main content.',
  },
}

export const Muted: Story = {
  args: {
    variant: 'muted',
    children: 'Muted text for less important information',
  },
}

export const Caption: Story = {
  args: {
    variant: 'caption',
    children: 'A small caption text',
  },
}

export const CustomWeight: Story = {
  args: {
    variant: 'p',
    weight: 'bold',
    children: 'Bold text with custom weight',
  },
}

export const CenteredText: Story = {
  args: {
    variant: 'large',
    align: 'center',
    children: 'Centered large text',
  },
}

export const AllVariants: Story = {
  render: () => (
    <div className='space-y-4'>
      <Typography variant='h1'>Heading 1</Typography>
      <Typography variant='h2'>Heading 2</Typography>
      <Typography variant='h3'>Heading 3</Typography>
      <Typography variant='h4'>Heading 4</Typography>
      <Typography variant='h5'>Heading 5</Typography>
      <Typography variant='h6'>Heading 6</Typography>
      <Typography variant='lead'>Lead Text</Typography>
      <Typography variant='large'>Large Text</Typography>
      <Typography variant='p'>Regular Paragraph</Typography>
      <Typography variant='small'>Small Text</Typography>
      <Typography variant='muted'>Muted Text</Typography>
      <Typography variant='caption'>Caption Text</Typography>
    </div>
  ),
}
