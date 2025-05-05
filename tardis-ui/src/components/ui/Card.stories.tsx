import type { Meta, StoryObj } from '@storybook/react';
import { Card } from './Card';

const meta: Meta<typeof Card> = {
  title: 'UI/Card',
  component: Card,
  tags: ['autodocs'],
  argTypes: {
    variant: {
      control: 'select',
      options: ['default', 'elevated', 'outlined'],
      description: 'Visual style variant of the card'
    },
    fullHeight: {
      control: 'boolean',
      description: 'Whether the card should take full height of its container'
    },
    header: {
      control: 'text',
      description: 'Optional header content'
    },
    footer: {
      control: 'text',
      description: 'Optional footer content'
    },
    children: {
      control: 'text',
      description: 'Main content of the card'
    }
  }
};

export default meta;
type Story = StoryObj<typeof Card>;

// Basic card with just content
export const Default: Story = {
  args: {
    children: 'This is a basic card with some content.',
  }
};

// Elevated card with header and footer
export const ElevatedWithHeaderFooter: Story = {
  args: {
    variant: 'elevated',
    header: 'Card Header',
    footer: 'Card Footer',
    children: 'This is an elevated card with header and footer sections.',
  }
};

// Outlined card
export const Outlined: Story = {
  args: {
    variant: 'outlined',
    children: 'This is an outlined card variant.',
  }
};

// Full height card example
export const FullHeight: Story = {
  args: {
    fullHeight: true,
    header: 'Full Height Card',
    children: 'This card will stretch to fill its container height.',
    footer: 'Footer Content',
  },
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'light',
    },
  },
  decorators: [
    (Story) => (
      <div style={{ height: '400px' }}>
        <Story />
      </div>
    ),
  ],
};

// Complex content example
export const ComplexContent: Story = {
  args: {
    variant: 'elevated',
    header: (
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-semibold">Course Progress</h3>
        <span className="text-sm text-gray-500">4 of 10 completed</span>
      </div>
    ),
    children: (
      <div className="space-y-4">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div className="h-full bg-primary-500 w-2/5" />
        </div>
        <p className="text-gray-600 dark:text-gray-300">
          You're making great progress! Keep going to unlock more advanced topics.
        </p>
      </div>
    ),
    footer: (
      <div className="flex justify-end">
        <button className="px-4 py-2 bg-primary-500 text-white rounded-md hover:bg-primary-600">
          Continue Learning
        </button>
      </div>
    ),
  },
}; 