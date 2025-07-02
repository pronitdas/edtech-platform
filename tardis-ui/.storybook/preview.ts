import { withThemeByClassName } from '@storybook/addon-themes'
import type { Preview } from '@storybook/react'
import React from 'react'
import { InteractionTrackerProvider } from '../src/stories/InteractionTrackerContextMock'
import '../src/app/globals.css'

const preview: Preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
      expanded: true,
    },
    docs: {
      toc: true,
      source: {
        state: 'open',
      },
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '360px',
            height: '640px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1280px',
            height: '800px',
          },
        },
        largeDesktop: {
          name: 'Large Desktop',
          styles: {
            width: '1920px',
            height: '1080px',
          },
        },
      },
    },
    backgrounds: {
      default: 'light',
      values: [
        {
          name: 'light',
          value: '#ffffff',
        },
        {
          name: 'dark',
          value: '#0f172a',
        },
        {
          name: 'gray',
          value: '#f1f5f9',
        },
      ],
    },
    // Ensure React 18 strict mode is enabled
    react: {
      strictMode: true,
    },
    layout: 'centered',
  },
  // Add theme switching support and global providers
  decorators: [
    withThemeByClassName({
      themes: {
        light: 'light',
        dark: 'dark',
      },
      defaultTheme: 'light',
    }),
    // Global provider decorator for InteractionTracker - wraps ALL stories
    (Story) => {
      return React.createElement(
        InteractionTrackerProvider,
        {
          dataService: null,
          userId: 'storybook-user',
          batchSize: 10,
          flushInterval: 30000
        },
        React.createElement(Story)
      )
    },
  ],
  globalTypes: {
    theme: {
      description: 'Global theme for components',
      defaultValue: 'light',
      toolbar: {
        title: 'Theme',
        icon: 'paintbrush',
        items: [
          { value: 'light', title: 'Light', icon: 'sun' },
          { value: 'dark', title: 'Dark', icon: 'moon' },
        ],
        dynamicTitle: true,
      },
    },
  },
  tags: ['autodocs'],
}

export default preview
