import type { StorybookConfig } from '@storybook/react-vite'
import path from 'path'
import { mergeConfig } from 'vite'

const config: StorybookConfig = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    '@storybook/addon-coverage',
    {
      name: '@storybook/addon-styling-webpack',
      options: {
        plugins: [
          {
            postCss: {
              implementation: require.resolve('postcss'),
            },
          },
        ],
      },
    },
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {
      builder: {
        viteConfigPath: './vite.config.ts',
      },
    },
  },
  docs: {
    autodocs: 'tag',
    defaultName: 'Documentation',
  },
  core: {
    builder: '@storybook/builder-vite',
    disableTelemetry: true,
  },
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    check: false,
    reactDocgenTypescriptOptions: {
      shouldExtractLiteralValuesFromEnum: true,
      propFilter: (prop) => (prop.parent ? !/node_modules/.test(prop.parent.fileName) : true),
    },
  },
  async viteFinal(config, { configType }) {
    // Ensure we have a clean alias configuration
    const customConfig = mergeConfig(config, {
      resolve: {
        alias: [
          {
            find: '@',
            replacement: path.resolve(__dirname, '../src'),
          },
          {
            find: '@/contexts/InteractionTrackerContext',
            replacement: path.resolve(__dirname, '../src/stories/InteractionTrackerContextMock.tsx'),
          },
          {
            find: /^@\/contexts\/InteractionTrackerContext$/,
            replacement: path.resolve(__dirname, '../src/stories/InteractionTrackerContextMock.tsx'),
          },
        ],
      },
      define: {
        global: 'window',
      },
      // Optimize for Storybook
      optimizeDeps: {
        include: [
          '@storybook/addon-docs',
          '@storybook/addon-controls',
          '@storybook/addon-actions',
          '@storybook/addon-viewport',
        ],
      },
    })

    return customConfig
  },
}

export default config 