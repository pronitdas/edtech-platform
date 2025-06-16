import type { Meta, StoryObj } from '@storybook/react'
import { Button } from './button'

/**
 * The Button component is used to trigger actions or events.
 * Use it for forms, dialogs, and more.
 */
const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
## Button Component

The Button component is used to trigger actions or events.

### Usage

\`\`\`jsx
import { Button } from '@/components/ui/button';

function MyComponent() {
  return <Button variant="primary">Click Me</Button>;
}
\`\`\`

### Accessibility
- Uses native button element for keyboard navigation
- Maintains minimum contrast ratio of 4.5:1
- Includes focus styles
        `,
      },
    },
  },
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['primary', 'secondary', 'tertiary', 'danger', 'ghost', 'link'],
      description: 'The visual style of the button',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'primary' },
      },
    },
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'The size of the button',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: 'md' },
      },
    },
    fullWidth: {
      control: 'boolean',
      description:
        'Whether the button should take up the full width of its container',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    isLoading: {
      control: 'boolean',
      description: 'Whether the button is in a loading state',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    disabled: {
      control: 'boolean',
      description: 'Whether the button is disabled',
      table: {
        type: { summary: 'boolean' },
        defaultValue: { summary: 'false' },
      },
    },
    onClick: { action: 'clicked' },
  },
}

export default meta
type Story = StoryObj<typeof Button>

/**
 * The primary button is used for the main action in a section or form.
 */
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
    size: 'md',
  },
}

/**
 * The secondary button is used for secondary actions.
 */
export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
    size: 'md',
  },
}

/**
 * The tertiary button is used for less important actions.
 */
export const Tertiary: Story = {
  args: {
    variant: 'tertiary',
    children: 'Tertiary Button',
    size: 'md',
  },
}

/**
 * The danger button is used for destructive actions.
 */
export const Danger: Story = {
  args: {
    variant: 'danger',
    children: 'Danger Button',
    size: 'md',
  },
}

/**
 * The ghost button is used for the least important actions.
 */
export const Ghost: Story = {
  args: {
    variant: 'ghost',
    children: 'Ghost Button',
    size: 'md',
  },
}

/**
 * The link button is used for navigation.
 */
export const Link: Story = {
  args: {
    variant: 'link',
    children: 'Link Button',
    size: 'md',
  },
}

/**
 * Small size button for compact UIs.
 */
export const Small: Story = {
  args: {
    variant: 'primary',
    children: 'Small Button',
    size: 'sm',
  },
}

/**
 * Medium size button for standard UIs.
 */
export const Medium: Story = {
  args: {
    variant: 'primary',
    children: 'Medium Button',
    size: 'md',
  },
}

/**
 * Large size button for prominent actions.
 */
export const Large: Story = {
  args: {
    variant: 'primary',
    children: 'Large Button',
    size: 'lg',
  },
}

/**
 * Loading state button shows a spinner.
 */
export const Loading: Story = {
  args: {
    variant: 'primary',
    children: 'Loading Button',
    size: 'md',
    isLoading: true,
  },
}

/**
 * Full width button that takes up the entire container width.
 */
export const FullWidth: Story = {
  args: {
    variant: 'primary',
    children: 'Full Width Button',
    size: 'md',
    fullWidth: true,
  },
}

/**
 * Disabled button cannot be interacted with.
 */
export const Disabled: Story = {
  args: {
    variant: 'primary',
    children: 'Disabled Button',
    size: 'md',
    disabled: true,
  },
}

/**
 * Button with an icon on the left.
 */
export const WithLeftIcon: Story = {
  args: {
    variant: 'primary',
    children: 'Button with Icon',
    size: 'md',
    leftIcon: (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='16'
        height='16'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      >
        <circle cx='12' cy='12' r='10' />
        <path d='m8 12 4 4' />
        <path d='m8 12 4-4' />
        <path d='m16 12h-8' />
      </svg>
    ),
  },
}

/**
 * Button with an icon on the right.
 */
export const WithRightIcon: Story = {
  args: {
    variant: 'primary',
    children: 'Button with Icon',
    size: 'md',
    rightIcon: (
      <svg
        xmlns='http://www.w3.org/2000/svg'
        width='16'
        height='16'
        viewBox='0 0 24 24'
        fill='none'
        stroke='currentColor'
        strokeWidth='2'
        strokeLinecap='round'
        strokeLinejoin='round'
      >
        <circle cx='12' cy='12' r='10' />
        <path d='m12 8 4 4-4 4' />
        <path d='m8 12h8' />
      </svg>
    ),
  },
}
