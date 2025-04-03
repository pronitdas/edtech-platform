# Test Framework Implementation Plan

## Objective
Implement a comprehensive testing framework to support the development of high-quality, reliable, and maintainable code across the edtech platform.

## Value Proposition
- Prevent regressions during development
- Ensure consistent behavior across components
- Facilitate refactoring with confidence
- Document expected behavior through tests
- Enable continuous integration and delivery

## Implementation Plan

### 1. Unit Testing Setup (Week 1)

#### Tools
- Jest for test runner and assertions
- React Testing Library for component testing
- jest-dom for DOM testing utilities

#### Setup Tasks
```bash
# Installation
npm install --save-dev jest @testing-library/react @testing-library/jest-dom @testing-library/user-event jest-environment-jsdom ts-jest

# Configuration
# Create jest.config.js file
```

#### Configuration Files
- `jest.config.js` - Main Jest configuration
- `jest.setup.js` - Setup file for Jest
- `.babelrc` - Babel configuration for Jest

#### Example Jest Configuration
```javascript
// jest.config.js
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'jsdom',
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  moduleNameMapper: {
    '\\.(css|less|scss|sass)$': 'identity-obj-proxy',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  transform: {
    '^.+\\.(ts|tsx)$': 'ts-jest',
  },
  testMatch: ['**/__tests__/**/*.+(ts|tsx|js)', '**/?(*.)+(spec|test).+(ts|tsx|js)'],
  collectCoverage: true,
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/index.tsx',
    '!src/serviceWorker.ts',
  ],
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
};
```

#### Example Test
```typescript
// src/components/ui/Button/Button.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from './Button';

describe('Button component', () => {
  it('renders correctly', () => {
    render(<Button>Click me</Button>);
    expect(screen.getByRole('button')).toHaveTextContent('Click me');
  });

  it('handles click events', () => {
    const handleClick = jest.fn();
    render(<Button onClick={handleClick}>Click me</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
});
```

### 2. Integration Testing Setup (Week 1-2)

#### Approach
- Test component interactions
- Test hooks with components
- Test context providers with consumers

#### Example Integration Test
```typescript
// src/components/course/CourseMain.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { CourseMain } from './CourseMain';
import { CourseProvider } from '../../contexts/CourseContext';

// Mock the required props and context
const mockProps = {
  chapterId: '123',
  initialTab: 'content',
};

describe('CourseMain integration', () => {
  it('changes tab when clicked', async () => {
    render(
      <CourseProvider>
        <CourseMain {...mockProps} />
      </CourseProvider>
    );
    
    // Find and click the quiz tab
    const quizTab = screen.getByRole('tab', { name: /quiz/i });
    fireEvent.click(quizTab);
    
    // Verify the quiz content is displayed
    expect(await screen.findByTestId('quiz-container')).toBeInTheDocument();
  });
});
```

### 3. E2E Testing with Playwright (Week 2-3)

#### Setup
```bash
# Installation
npm install --save-dev @playwright/test

# Initialize Playwright
npx playwright install
```

#### Configuration
```typescript
// playwright.config.ts
import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './e2e',
  timeout: 30000,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [['html'], ['list']],
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    {
      name: 'chromium',
      use: { browserName: 'chromium' },
    },
    {
      name: 'firefox',
      use: { browserName: 'firefox' },
    },
    {
      name: 'webkit',
      use: { browserName: 'webkit' },
    },
  ],
};

export default config;
```

#### Example E2E Test
```typescript
// e2e/course-navigation.spec.ts
import { test, expect } from '@playwright/test';

test('navigate through course content', async ({ page }) => {
  // Login and navigate to a course
  await page.goto('/login');
  await page.fill('[data-testid="email-input"]', 'test@example.com');
  await page.fill('[data-testid="password-input"]', 'password123');
  await page.click('[data-testid="login-button"]');
  
  // Wait for dashboard to load and select a course
  await page.waitForSelector('[data-testid="course-card"]');
  await page.click('[data-testid="course-card"]:first-child');
  
  // Navigate between tabs
  await page.click('[role="tab"][aria-label="Quiz"]');
  expect(await page.isVisible('[data-testid="quiz-container"]')).toBeTruthy();
  
  await page.click('[role="tab"][aria-label="Video"]');
  expect(await page.isVisible('[data-testid="video-player"]')).toBeTruthy();
});
```

### 4. Storybook Setup (Week 3)

#### Installation
```bash
npx storybook init
```

#### Configuration
Edit `.storybook/main.js` to include TypeScript support:

```javascript
// .storybook/main.js
module.exports = {
  stories: ['../src/**/*.stories.mdx', '../src/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    '@storybook/addon-a11y',
  ],
  framework: '@storybook/react',
  core: {
    builder: '@storybook/builder-webpack5',
  },
  typescript: {
    check: true,
  },
};
```

#### Example Story
```typescript
// src/components/ui/Button/Button.stories.tsx
import { ComponentMeta, ComponentStory } from '@storybook/react';
import { Button } from './Button';

export default {
  title: 'UI/Button',
  component: Button,
  argTypes: {
    onClick: { action: 'clicked' },
    variant: {
      control: { type: 'select', options: ['primary', 'secondary', 'danger'] },
    },
  },
} as ComponentMeta<typeof Button>;

const Template: ComponentStory<typeof Button> = (args) => <Button {...args} />;

export const Primary = Template.bind({});
Primary.args = {
  children: 'Primary Button',
  variant: 'primary',
};

export const Secondary = Template.bind({});
Secondary.args = {
  children: 'Secondary Button',
  variant: 'secondary',
};

export const Danger = Template.bind({});
Danger.args = {
  children: 'Danger Button',
  variant: 'danger',
};

export const Disabled = Template.bind({});
Disabled.args = {
  children: 'Disabled Button',
  disabled: true,
};
```

### 5. CI Pipeline Integration (Week 4)

#### GitHub Actions Workflow
```yaml
# .github/workflows/test.yml
name: Test

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Use Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Run linting
        run: npm run lint
      - name: Run unit and integration tests
        run: npm test -- --coverage
      - name: Build Storybook
        run: npm run build-storybook
      - name: Install Playwright browsers
        run: npx playwright install --with-deps
      - name: Run E2E tests
        run: npm run test:e2e

  visual-regression:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Use Node.js
        uses: actions/setup-node@v2
        with:
          node-version: '16'
          cache: 'npm'
      - name: Install dependencies
        run: npm ci
      - name: Build Storybook
        run: npm run build-storybook
      - name: Run visual regression tests
        run: npm run test:visual
```

### 6. Implementation Strategy for Components

#### Prioritization
1. Core UI components
2. Custom hooks
3. Context providers
4. Complex components like CourseMain, VideoPlayer
5. Integration points

#### Testing Structure
- Place tests alongside the components they test
- Use descriptive test names that explain what's being tested
- Group tests logically by behavior

#### Testing Standards
- Each component should have:
  - Basic rendering tests
  - Interaction tests
  - Props validation tests
  - Accessibility tests
- Each hook should have:
  - State management tests
  - Side effect tests
  - Error handling tests

## Package.json Scripts
```json
"scripts": {
  "test": "jest",
  "test:watch": "jest --watch",
  "test:coverage": "jest --coverage",
  "test:e2e": "playwright test",
  "storybook": "start-storybook -p 6006",
  "build-storybook": "build-storybook",
  "test:visual": "loki"
}
```

## Documentation
- Create testing guidelines document
- Document test patterns and best practices
- Provide examples for different component types

## Success Criteria
- All new components have unit tests
- Integration tests cover major user flows
- E2E tests validate critical paths
- Storybook documents all reusable components
- CI pipeline runs all tests automatically
- Code coverage meets thresholds (70% minimum)

## Next Steps
1. Set up Jest and React Testing Library
2. Create first component tests
3. Configure Playwright for E2E tests
4. Set up Storybook for component documentation
5. Integrate with CI pipeline
6. Start testing existing components 