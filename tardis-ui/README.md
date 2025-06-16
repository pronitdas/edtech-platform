# 🎓 Tardis UI - Modern EdTech Platform

A bleeding-edge React + TypeScript + Tailwind CSS + Storybook educational technology platform built with modern best practices.

[![CI/CD](https://github.com/your-org/tardis-ui/workflows/CI/badge.svg)](https://github.com/your-org/tardis-ui/actions)
[![codecov](https://codecov.io/gh/your-org/tardis-ui/branch/main/graph/badge.svg)](https://codecov.io/gh/your-org/tardis-ui)
[![Storybook](https://cdn.jsdelivr.net/gh/storybookjs/brand@main/badge/badge-storybook.svg)](https://your-storybook-url.com)

## ✨ Features

- ⚡ **Lightning Fast**: Built with Vite for instant HMR and optimized builds
- 🎨 **Modern UI**: Tailwind CSS with shadcn/ui components
- 📱 **Responsive**: Mobile-first design with dark mode support
- 🧪 **Well Tested**: Vitest + Testing Library + Storybook visual tests
- 📖 **Component Driven**: Comprehensive Storybook documentation
- 🔧 **Developer Experience**: ESLint + Prettier + Husky pre-commit hooks
- ♿ **Accessible**: WCAG compliant with automated a11y testing
- 🚀 **Production Ready**: GitHub Actions CI/CD pipeline

## 🛠 Tech Stack

### Core
- **React 18** - Latest React with concurrent features
- **TypeScript 5.8+** - Full type safety with latest features
- **Vite 6.0+** - Next generation frontend tooling
- **Tailwind CSS 3.4+** - Utility-first CSS framework

### UI & Styling
- **shadcn/ui** - Beautiful, accessible component library
- **Radix UI** - Low-level UI primitives
- **Framer Motion** - Production-ready motion library
- **Lucide React** - Beautiful & consistent icons

### Development Tools
- **Storybook 8.6+** - Component development environment
- **Vitest 2.1+** - Fast unit test framework
- **Testing Library** - Simple and complete testing utilities
- **ESLint 9** - Latest flat config with TypeScript support
- **Prettier 3.4+** - Opinionated code formatter
- **Husky** - Git hooks for quality checks

### Build & Deploy
- **GitHub Actions** - CI/CD pipeline
- **Codecov** - Code coverage reports
- **Playwright** - E2E and visual regression testing

## 🚀 Quick Start

### Prerequisites
- Node.js 20.x or later
- pnpm (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/your-org/tardis-ui.git
cd tardis-ui

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

### Available Scripts

```bash
# Development
pnpm dev              # Start dev server (http://localhost:3000)
pnpm build           # Build for production
pnpm preview         # Preview production build

# Code Quality
pnpm lint            # Run ESLint with auto-fix
pnpm lint:check      # Check linting without fixing
pnpm format          # Format code with Prettier
pnpm format:check    # Check formatting
pnpm type-check      # Run TypeScript compiler

# Testing
pnpm test            # Run unit tests
pnpm test:ui         # Run tests with UI
pnpm test:coverage   # Run tests with coverage

# Storybook
pnpm storybook       # Start Storybook (http://localhost:6006)
pnpm build-storybook # Build Storybook for production
pnpm test-storybook  # Run Storybook visual tests
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── ui/             # shadcn/ui components
│   └── ...             # Feature components
├── contexts/           # React contexts
├── hooks/             # Custom React hooks
├── lib/               # Utility libraries
├── pages/             # Page components
├── services/          # API services
├── types/             # TypeScript type definitions
├── utils/             # Utility functions
└── stories/           # Storybook stories

.storybook/            # Storybook configuration
docs/                  # Documentation
public/               # Static assets
```

## 🎨 Component Development

We follow a component-driven development approach:

1. **Create the component** with TypeScript
2. **Add Storybook story** for documentation
3. **Write tests** with Testing Library
4. **Document props** with JSDoc

### Example Component

```tsx
// components/Button/Button.tsx
import { forwardRef } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md font-medium transition-colors',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        outline: 'border border-input hover:bg-accent hover:text-accent-foreground',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)

export { Button, buttonVariants }
```

## 🧪 Testing Strategy

### Unit Tests
- **Vitest** for fast test execution
- **Testing Library** for user-centric tests
- **Happy DOM** for lightweight DOM simulation

### Integration Tests
- **Storybook** interaction tests
- **Test Runner** for automated testing

### Visual Regression
- **Playwright** for visual diff testing
- **Chromatic** integration (optional)

### Accessibility Testing
- **axe-core** automated a11y checks
- **Storybook a11y addon** for manual testing

## 🎯 Code Quality

### ESLint Configuration
- **TypeScript ESLint** with strict rules
- **React** and **React Hooks** rules
- **JSX A11y** for accessibility
- **Tailwind CSS** class ordering
- **Prettier** integration

### Pre-commit Hooks
- **Lint Staged** for incremental linting
- **Type checking** before push
- **Format checking** for consistency

## 🚀 Deployment

The project includes a complete CI/CD pipeline:

1. **Lint & Type Check** - Code quality verification
2. **Test** - Unit and integration tests
3. **Build** - Production build verification
4. **Storybook** - Component documentation build
5. **Visual Regression** - UI consistency checks

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style
- Write tests for new features
- Update Storybook stories
- Ensure accessibility compliance
- Update documentation

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the component library
- [Tailwind CSS](https://tailwindcss.com/) for the styling system
- [Storybook](https://storybook.js.org/) for component development
- [Vite](https://vitejs.dev/) for the build tool
