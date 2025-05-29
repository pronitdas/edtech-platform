import type { StorybookConfig } from "@storybook/react-vite";
import path from 'path';

const config: StorybookConfig = {
  stories: ["../src/**/*.mdx", "../src/**/*.stories.@(js|jsx|ts|tsx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-interactions",
    "@storybook/addon-a11y",
    "@storybook/addon-coverage",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  docs: {
    autodocs: true,
  },
  core: {
    builder: "@storybook/builder-vite",
    disableTelemetry: true,
  },
  typescript: {
    reactDocgen: 'react-docgen-typescript',
    check: false,
  },
  async viteFinal(config) {
    // Add special alias for our mocked modules in Storybook
    if (config.resolve) {
      config.resolve.alias = {
        ...config.resolve.alias,
        '@': path.resolve(__dirname, '../src'),
        // Use our mock implementation for the InteractionTrackerContext
        '@/contexts/InteractionTrackerContext': path.resolve(__dirname, '../src/stories/mockHooks.tsx'),
      };
    }
    
    return {
      ...config,
      define: { 
        ...config.define,
        global: 'window',
      },
      resolve: {
        ...config.resolve,
        alias: {
          ...config.resolve?.alias,
          '@': '/src',
        },
      },
    };
  },
};

export default config; 