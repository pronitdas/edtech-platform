# Performance Monitoring

## Core Web Vitals Tracking

The platform tracks Core Web Vitals metrics:

| Metric | Description | Good Threshold |
|--------|-------------|----------------|
| LCP | Largest Contentful Paint | ≤ 2.5s |
| FID | First Input Delay | ≤ 100ms |
| CLS | Cumulative Layout Shift | ≤ 0.1 |
| INP | Interaction to Next Paint | ≤ 200ms |
| FCP | First Contentful Paint | ≤ 1.8s |
| TTFB | Time to First Byte | ≤ 800ms |

## Usage

### Performance Dashboard

```tsx
import { PerformanceDashboard } from '@/components/performance';

<PerformanceDashboard
  showWebVitals={true}
  showFPS={true}
  position="top-right"
/>
```

### Hook Usage

```tsx
import { usePerformanceMonitoring, useFPSCounter } from '@/hooks/usePerformanceMonitoring';

const MyComponent = () => {
  const { metrics, performanceScore, isGood } = usePerformanceMonitoring();
  const fps = useFPSCounter();

  return (
    <div>
      <p>Performance Score: {performanceScore}</p>
      <p>FPS: {fps}</p>
      <p>LCP: {metrics.lcp}ms</p>
    </div>
  );
};
```

## Performance Score

The overall performance score (0-100) is calculated based on:
- 16.7% weight for each Core Web Vital metric
- Good performance: ≥ 90
- Needs improvement: 50-90
- Poor: < 50

## Optimization Recommendations

1. **LCP > 2.5s**: Optimize critical rendering path, lazy load non-critical resources
2. **FID > 100ms**: Minimize main thread work, break up long tasks
3. **CLS > 0.1**: Reserve space for images and fonts, avoid inserting content above existing content
4. **INP > 200ms**: Optimize event handlers, reduce JavaScript execution time
5. **TTFB > 800ms**: Consider CDN, server optimization, caching strategies
