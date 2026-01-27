import React from 'react';

// Visually hidden styles for screen readers
const visuallyHiddenStyles: React.CSSProperties = {
  position: 'absolute',
  width: '1px',
  height: '1px',
  padding: 0,
  margin: '-1px',
  overflow: 'hidden',
  clip: 'rect(0, 0, 0, 0)',
  whiteSpace: 'nowrap',
  border: 0,
};

interface VisuallyHiddenProps {
  children: React.ReactNode;
  as?: keyof HTMLElementTagNameMap;
}

export const VisuallyHidden: React.FC<VisuallyHiddenProps> = ({
  children,
  as: Component = 'span',
}) => {
  return <Component style={visuallyHiddenStyles}>{children}</Component>;
};

interface SkipLinkProps {
  targetId: string;
  label?: string;
  className?: string;
}

export const SkipLink: React.FC<SkipLinkProps> = ({
  targetId,
  label = 'Skip to main content',
  className = '',
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    const target = document.getElementById(targetId);
    if (target) {
      target.setAttribute('tabindex', '-1');
      target.focus();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  return (
    <a
      href={`#${targetId}`}
      onClick={handleClick}
      className={`sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-blue-600 focus:text-white focus:rounded-lg focus:font-medium focus:outline-none focus:ring-2 focus:ring-blue-400 focus:ring-offset-2 ${className}`}
    >
      {label}
    </a>
  );
};

interface LiveRegionProps {
  message: string;
  type?: 'polite' | 'assertive';
  className?: string;
}

export const LiveRegion: React.FC<LiveRegionProps> = ({
  message,
  type = 'polite',
  className = '',
}) => {
  return (
    <div
      role="status"
      aria-live={type}
      aria-atomic="true"
      className={`sr-only ${className}`}
    >
      {message}
    </div>
  );
};

interface FocusTrapProps {
  isActive: boolean;
  children: React.ReactNode;
  className?: string;
}

export const FocusTrap: React.FC<FocusTrapProps> = ({
  isActive,
  children,
  className = '',
}) => {
  const containerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    if (!isActive || !containerRef.current) return;

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0];
    const lastElement = focusableElements[focusableElements.length - 1];

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') return;

      if (e.shiftKey) {
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleKeyDown);
    firstElement?.focus();

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [isActive]);

  return (
    <div ref={containerRef} className={className}>
      {children}
    </div>
  );
};

interface A11yAnnouncerProps {
  children: React.ReactNode;
}

interface A11yAnnouncerContextType {
  announce: (message: string, priority?: 'polite' | 'assertive') => void;
}

const A11yAnnouncerContext = React.createContext<A11yAnnouncerContextType | null>(null);

export const useA11yAnnouncer = () => {
  const context = React.useContext(A11yAnnouncerContext);
  if (!context) {
    throw new Error('useA11yAnnouncer must be used within A11yAnnouncerProvider');
  }
  return context;
};

export const A11yAnnouncerProvider: React.FC<A11yAnnouncerProps> = ({ children }) => {
  const [announcement, setAnnouncement] = React.useState('');

  const announce = React.useCallback((message: string, priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement('');
    setTimeout(() => {
      setAnnouncement(message);
    }, 50);
  }, []);

  return (
    <A11yAnnouncerContext.Provider value={{ announce }}>
      {children}
      <LiveRegion message={announcement} type="polite" />
      <LiveRegion message={announcement} type="assertive" />
    </A11yAnnouncerContext.Provider>
  );
};

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class A11yErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Accessibility error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          role="alert"
          className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700"
        >
          <h2 className="font-semibold mb-2">Something went wrong</h2>
          <p>{this.state.error?.message || 'An unknown error occurred'}</p>
        </div>
      );
    }

    return this.props.children;
  }
}

export default SkipLink;
