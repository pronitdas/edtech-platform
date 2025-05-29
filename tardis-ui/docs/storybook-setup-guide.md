# Storybook Setup Guide

## Introduction
This guide outlines how to set up and use Storybook for the TARDIS-UI project. Storybook provides an isolated environment for UI component development, documentation, and testing.

## Initial Setup

### 1. Installation
Run the following command to add Storybook to the project:

```bash
npx storybook@latest init
```

This will:
- Install all necessary dependencies
- Add basic configuration files
- Create example stories
- Add scripts to package.json

### 2. Tailwind CSS Integration
Storybook needs to be configured to work with Tailwind CSS:

1. Create a file `.storybook/preview-head.html`:
```html
<link rel="stylesheet" href="../src/index.css" />
<script>
  try {
    if (window.parent !== window) {
      window.__REACT_DEVTOOLS_GLOBAL_HOOK__ = window.parent.__REACT_DEVTOOLS_GLOBAL_HOOK__;
    }
  } catch (e) {
    // Do nothing
  }
</script>
```

2. Update `.storybook/main.js` to include PostCSS configuration:
```js
const config = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-onboarding',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
    {
      name: '@storybook/addon-styling',
      options: {
        postCss: {
          implementation: require('postcss'),
        },
      },
    },
  ],
  framework: {
    name: '@storybook/react-vite',
    options: {},
  },
  docs: {
    autodocs: 'tag',
  },
};

export default config;
```

3. Install additional dependencies:
```bash
npm install -D @storybook/addon-styling @storybook/addon-a11y
```

### 3. Setup Responsive Viewports
Add viewport configurations in `.storybook/preview.js`:

```js
import { themes } from '@storybook/theming';
import '../src/index.css';

/** @type { import('@storybook/react').Preview } */
const preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    viewport: {
      viewports: {
        mobile: {
          name: 'Mobile',
          styles: {
            width: '375px',
            height: '667px',
          },
        },
        tablet: {
          name: 'Tablet',
          styles: {
            width: '768px',
            height: '1024px',
          },
        },
        laptop: {
          name: 'Laptop',
          styles: {
            width: '1366px',
            height: '768px',
          },
        },
        desktop: {
          name: 'Desktop',
          styles: {
            width: '1920px',
            height: '1080px',
          },
        },
      },
    },
    docs: {
      theme: themes.dark,
    },
  },
};

export default preview;
```

### 4. Setup Visual Regression Testing with Chromatic
Visual regression testing helps catch UI changes:

1. Install Chromatic:
```bash
npm install -D chromatic
```

2. Add a script to package.json:
```json
"scripts": {
  "chromatic": "npx chromatic --project-token=<your-project-token>"
}
```

3. Run Chromatic setup:
```bash
npx chromatic --project-token=<your-project-token>
```

## Creating Stories

### Basic Component Story
Here's an example of a basic Button component story:

```tsx
// src/components/ui/Button.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { Button } from './button';

const meta: Meta<typeof Button> = {
  title: 'UI/Button',
  component: Button,
  parameters: {
    layout: 'centered',
  },
  tags: ['autodocs'],
  argTypes: {
    variant: { 
      control: 'select', 
      options: ['primary', 'secondary', 'tertiary', 'danger'] 
    },
    size: { 
      control: 'select', 
      options: ['sm', 'md', 'lg'] 
    },
    isFullWidth: { control: 'boolean' },
    isLoading: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof Button>;

export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
    size: 'md',
  },
};

export const Secondary: Story = {
  args: {
    variant: 'secondary',
    children: 'Secondary Button',
    size: 'md',
  },
};

export const Small: Story = {
  args: {
    variant: 'primary',
    children: 'Small Button',
    size: 'sm',
  },
};

export const Large: Story = {
  args: {
    variant: 'primary',
    children: 'Large Button',
    size: 'lg',
  },
};

export const Loading: Story = {
  args: {
    variant: 'primary',
    children: 'Loading Button',
    size: 'md',
    isLoading: true,
  },
};

export const FullWidth: Story = {
  args: {
    variant: 'primary',
    children: 'Full Width Button',
    size: 'md',
    isFullWidth: true,
  },
};
```

### Complex Component Story
For more complex components like the GraphCanvas, use decorators and parameters:

```tsx
// src/components/interactive/slope/components/GraphCanvas.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { GraphCanvas } from './GraphCanvas';

const meta: Meta<typeof GraphCanvas> = {
  title: 'Interactive/GraphCanvas',
  component: GraphCanvas,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: 'A p5.js based canvas for drawing and visualizing graphs.'
      },
    },
    chromatic: { delay: 1000 }, // Give p5.js time to render before snapshots
  },
  argTypes: {
    initialPoints: { control: 'object' },
    showGrid: { control: 'boolean' },
    showAxis: { control: 'boolean' },
  },
};

export default meta;
type Story = StoryObj<typeof GraphCanvas>;

export const Default: Story = {
  args: {
    showGrid: true,
    showAxis: true,
  },
};

export const WithPoints: Story = {
  args: {
    showGrid: true,
    showAxis: true,
    initialPoints: [
      { x: -3, y: -2 },
      { x: 2, y: 3 },
    ],
  },
};

export const NoGrid: Story = {
  args: {
    showGrid: false,
    showAxis: true,
  },
};
```

## Testing in Storybook

### 1. Accessibility Testing
Use the a11y addon to test for accessibility issues:

```tsx
// Add a11y parameters to stories
export const Primary: Story = {
  args: {
    variant: 'primary',
    children: 'Primary Button',
  },
  parameters: {
    a11y: {
      config: {
        rules: [
          {
            // Override specific accessibility rules
            id: 'color-contrast',
            enabled: true,
          },
        ],
      },
    },
  },
};
```

### 2. Interaction Testing
Test user interactions with the component:

```tsx
// src/components/ui/button.stories.tsx
export const WithClick: Story = {
  args: {
    variant: 'primary',
    children: 'Click Me',
    onClick: action('button-clicked'),
  },
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    const button = canvas.getByRole('button');
    await userEvent.click(button);
  },
};
```

### 3. Visual Regression Testing
Run the following command to capture baseline images for visual regression testing:

```bash
npm run chromatic
```

## Best Practices

### Component Documentation
Add detailed documentation for each component:

```tsx
// src/components/ui/button.stories.tsx
export default {
  title: 'UI/Button',
  component: Button,
  parameters: {
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
};
```

### Story Organization
Organize stories in a logical hierarchy:

- UI/ (Base components)
  - Button
  - Card
  - Dialog
  - Form
- Interactive/ (Interactive components)
  - GraphCanvas
  - MathFormula
  - CognitiveLoadIndicator
- Features/ (Feature components)
  - SlopeDrawing
  - VideoPlayer

### Component Controls
Use argTypes to provide clear controls for component props:

```tsx
argTypes: {
  variant: { 
    control: 'select', 
    options: ['primary', 'secondary', 'tertiary', 'danger'],
    description: 'The visual style of the button',
    table: {
      type: { summary: 'string' },
      defaultValue: { summary: 'primary' },
    }
  },
}
```

## Continuous Integration
Add Storybook to your CI workflow:

```yaml
# .github/workflows/storybook.yml
name: Storybook Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
        with:
          fetch-depth: 0
      - uses: actions/setup-node@v3
        with:
          node-version: '16'
      - name: Install dependencies
        run: npm ci
      - name: Build Storybook
        run: npm run build-storybook
      - name: Visual regression tests
        run: npm run chromatic -- --exit-zero-on-changes
        env:
          CHROMATIC_PROJECT_TOKEN: ${{ secrets.CHROMATIC_PROJECT_TOKEN }}
```

## Troubleshooting

### Common Issues

#### CSS Not Loading
If Tailwind styles aren't showing up in Storybook:
- Check that `.storybook/preview-head.html` correctly links to your CSS
- Verify that PostCSS configuration is properly set up
- Try importing CSS directly in `.storybook/preview.js`

#### Canvas Not Rendering
For components that use p5.js or other canvas-based libraries:
- Add a delay parameter for Chromatic snapshots
- Use useEffect cleanup to properly dispose of canvas instances
- Consider using decorators to manage lifecycle

## Additional Resources
- [Official Storybook Documentation](https://storybook.js.org/docs/react/get-started/introduction)
- [Tailwind CSS in Storybook](https://storybook.js.org/recipes/tailwindcss)
- [Chromatic Documentation](https://www.chromatic.com/docs/)
- [Storybook A11y Addon](https://storybook.js.org/addons/@storybook/addon-a11y) 