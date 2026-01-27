/**
 * Performance Monitoring Hook
 * Tracks Core Web Vitals and custom performance metrics
 */

import { useEffect, useRef, useCallback, useState } from 'react';

export interface PerformanceMetrics {
  // Core Web Vitals
  fcp: number | null; // First Contentful Paint
  lcp: number | null; // Largest Contentful Paint
  fid: number | null; // First Input Delay
  cls: number | null; // Cumulative Layout Shift
  inp: number | null; // Interaction to Next Paint
  ttfb: number | null; // Time to First Byte

  // Custom metrics
  tti: number | null; // Time to Interactive
  tbt: number | null; // Total Blocking Time
  pageLoadTime: number | null;

  // Navigation info
  navigationType: string | null;
  pageshowPersistence: boolean | null;
}

export interface PerformanceConfig {
  enableWebVitals: boolean;
  enableNavigationTiming: boolean;
  enableResourceTiming: boolean;
  sampleRate: number; // 0-1, for performance sampling
  reportToConsole: boolean;
  sendToAnalytics: boolean;
}

const defaultConfig: PerformanceConfig = {
  enableWebVitals: true,
  enableNavigationTiming: true,
  enableResourceTiming: true,
  sampleRate: 1.0,
  reportToConsole: true,
  sendToAnalytics: false,
};

class PerformanceMonitor {
  private metrics: Partial<PerformanceMetrics> = {};
  private observers: PerformanceObserver[] = [];
  private config: PerformanceConfig;
  private onMetric?: (name: string, value: number) => void;

  constructor(config: Partial<PerformanceConfig> = {}) {
    this.config = { ...defaultConfig, ...config };
  }

  // Initialize performance monitoring
  init(onMetric?: (name: string, value: number) => void): void {
    if (onMetric) {
      this.onMetric = onMetric;
    }

    if (this.config.enableWebVitals) {
      this.initWebVitals();
    }

    if (this.config.enableNavigationTiming) {
      this.initNavigationTiming();
    }

    if (this.config.enableResourceTiming) {
      this.initResourceTiming();
    }
  }

  // Initialize Core Web Vitals monitoring
  private initWebVitals(): void {
    // Largest Contentful Paint (LCP)
    if ('PerformanceObserver' in window) {
      try {
        const lcpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          const lastEntry = entries[entries.length - 1] as PerformanceEntry;
          this.metrics.lcp = lastEntry.startTime;
          this.reportMetric('LCP', lastEntry.startTime);
        });
        lcpObserver.observe({ type: 'largest-contentful-paint', buffered: true });
        this.observers.push(lcpObserver);
      } catch (e) {
        console.warn('LCP observation not supported');
      }

      // First Input Delay (FID)
      try {
        const fidObserver = new PerformanceObserver((entryList) => {
          const entry = entryList.getEntries()[0 as keyof PerformanceEntryList] as PerformanceEventTiming;
          if (entry) {
            this.metrics.fid = entry.processingStart - entry.startTime;
            this.reportMetric('FID', this.metrics.fid);
          }
        });
        fidObserver.observe({ type: 'first-input', buffered: true });
        this.observers.push(fidObserver);
      } catch (e) {
        console.warn('FID observation not supported');
      }

      // Cumulative Layout Shift (CLS)
      try {
        let clsValue = 0;
        const clsObserver = new PerformanceObserver((entryList) => {
          for (const entry of entryList.getEntries() as any) {
            if (!entry.hadRecentInput) {
              clsValue += entry.value;
              this.metrics.cls = clsValue;
            }
          }
          this.reportMetric('CLS', clsValue);
        });
        clsObserver.observe({ type: 'layout-shift', buffered: true });
        this.observers.push(clsObserver);
      } catch (e) {
        console.warn('CLS observation not supported');
      }

      // Interaction to Next Paint (INP)
      try {
        const inpObserver = new PerformanceObserver((entryList) => {
          const entries = entryList.getEntries();
          let maxDuration = 0;
          for (const entry of entries as any) {
            if (entry.duration > maxDuration) {
              maxDuration = entry.duration;
            }
          }
          this.metrics.inp = maxDuration;
          this.reportMetric('INP', maxDuration);
        });
        inpObserver.observe({ type: 'interaction', buffered: true });
        this.observers.push(inpObserver);
      } catch (e) {
        console.warn('INP observation not supported');
      }
    }
  }

  // Initialize Navigation Timing
  private initNavigationTiming(): void {
    window.addEventListener('load', () => {
      setTimeout(() => {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;
        if (navigation) {
          this.metrics.ttfb = navigation.responseStart - navigation.requestStart;
          const pageLoadTime = navigation.loadEventEnd - navigation.requestStart;
          this.metrics.pageLoadTime = pageLoadTime;

          this.reportMetric('TTFB', this.metrics.ttfb);
          this.reportMetric('PageLoadTime', this.metrics.pageLoadTime);
        }

        // Get First Contentful Paint
        const fcpEntries = performance.getEntriesByType('paint');
        const fcp = fcpEntries.find((entry) => entry.name === 'first-contentful-paint');
        if (fcp) {
          this.metrics.fcp = fcp.startTime;
          this.reportMetric('FCP', fcp.startTime);
        }
      }, 0);
    });
  }

  // Initialize Resource Timing
  private initResourceTiming(): void {
    window.addEventListener('load', () => {
      const resources = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
      const resourceMetrics = {
        totalResources: resources.length,
        totalSize: 0,
        byType: {} as Record<string, { count: number; size: number }>,
        slowRequests: [] as { name: string; duration: number }[],
      };

      resources.forEach((resource) => {
        const size = resource.transferSize || 0;
        resourceMetrics.totalSize += size;

        const type = resource.name.split('.').pop()?.toLowerCase() || 'unknown';
        if (!resourceMetrics.byType[type]) {
          resourceMetrics.byType[type] = { count: 0, size: 0 };
        }
        resourceMetrics.byType[type].count++;
        resourceMetrics.byType[type].size += size;

        if (resource.duration > 500) {
          resourceMetrics.slowRequests.push({
            name: resource.name,
            duration: resource.duration,
          });
        }
      });

      this.reportMetric('TotalResources', resourceMetrics.totalResources);
      this.reportMetric('TotalResourceSize', resourceMetrics.totalSize);
    });
  }

  // Report a metric
  private reportMetric(name: string, value: number): void {
    if (this.config.reportToConsole) {
      console.log(`[Performance] ${name}: ${value.toFixed(2)}ms`);
    }

    if (this.onMetric) {
      this.onMetric(name, value);
    }

    // Store in sessionStorage for debugging
    try {
      const existing = JSON.parse(sessionStorage.getItem('perf_metrics') || '{}');
      sessionStorage.setItem(
        'perf_metrics',
        JSON.stringify({ ...existing, [name]: value, timestamp: Date.now() })
      );
    } catch (e) {
      // Ignore storage errors
    }
  }

  // Get all collected metrics
  getMetrics(): Partial<PerformanceMetrics> {
    return { ...this.metrics };
  }

  // Check if performance is good (meets Core Web Vitals thresholds)
  isGoodPerformance(): boolean {
    const good = {
      fcp: 1800,
      lcp: 2500,
      fid: 100,
      cls: 0.1,
      inp: 200,
      ttfb: 800,
    };

    return (
      (this.metrics.fcp == null || this.metrics.fcp <= good.fcp) &&
      (this.metrics.lcp == null || this.metrics.lcp <= good.lcp) &&
      (this.metrics.fid == null || this.metrics.fid <= good.fid) &&
      (this.metrics.cls == null || (this.metrics.cls || 0) <= good.cls) &&
      (this.metrics.inp == null || this.metrics.inp <= good.inp) &&
      (this.metrics.ttfb == null || this.metrics.ttfb <= good.ttfb)
    );
  }

  // Get performance score (0-100)
  getPerformanceScore(): number {
    const thresholds = {
      fcp: { good: 1800, poor: 3000 },
      lcp: { good: 2500, poor: 4000 },
      fid: { good: 100, poor: 300 },
      cls: { good: 0.1, poor: 0.25 },
      inp: { good: 200, poor: 500 },
      ttfb: { good: 800, poor: 1800 },
    };

    let totalScore = 0;
    let metricsCount = 0;

    for (const [metric, { good, poor }] of Object.entries(thresholds)) {
      const value = this.metrics[metric as keyof PerformanceMetrics];
      if (value != null && typeof value === 'number') {
        if (value <= good) {
          totalScore += 100;
        } else if (value >= poor) {
          totalScore += 0;
        } else {
          totalScore += ((poor - value) / (poor - good)) * 100;
        }
        metricsCount++;
      }
    }

    return metricsCount > 0 ? Math.round(totalScore / metricsCount) : 0;
  }

  // Cleanup
  destroy(): void {
    this.observers.forEach((observer) => observer.disconnect());
    this.observers = [];
  }
}

// React hook for performance monitoring
export const usePerformanceMonitoring = (
  config?: Partial<PerformanceConfig>,
  onMetricsUpdate?: (metrics: Partial<PerformanceMetrics>) => void
) => {
  const monitorRef = useRef<PerformanceMonitor | null>(null);
  const [metrics, setMetrics] = useState<Partial<PerformanceMetrics>>({});
  const [performanceScore, setPerformanceScore] = useState(0);
  const [isGood, setIsGood] = useState(true);

  useEffect(() => {
    monitorRef.current = new PerformanceMonitor(config);
    monitorRef.current.init((name, value) => {
      setMetrics((prev) => ({ ...prev, [name.toLowerCase()]: value }));
    });

    return () => {
      monitorRef.current?.destroy();
    };
  }, [config]);

  useEffect(() => {
    if (monitorRef.current) {
      setPerformanceScore(monitorRef.current.getPerformanceScore());
      setIsGood(monitorRef.current.isGoodPerformance());
      onMetricsUpdate?.(monitorRef.current.getMetrics());
    }
  }, [metrics, onMetricsUpdate]);

  return {
    metrics,
    performanceScore,
    isGood,
    getMetrics: () => monitorRef.current?.getMetrics(),
    getPerformanceScore: () => monitorRef.current?.getPerformanceScore(),
    isGoodPerformance: () => monitorRef.current?.isGoodPerformance() ?? true,
  };
};

// Bundle size analyzer hook
export const useBundleAnalysis = () => {
  const [bundleStats, setBundleStats] = useState<{
    totalSize: number;
    chunks: { name: string; size: number }[];
    libraries: { name: string; size: number }[];
  } | null>(null);

  const analyzeBundle = useCallback((): void => {
    if (typeof window === 'undefined') return;

    // Get main chunk info from script tags
    const scripts = document.querySelectorAll('script[src*="chunk"]');
    const chunks: { name: string; size: number }[] = [];

    scripts.forEach((script) => {
      const src = (script as HTMLScriptElement).src;
      const match = src.match(/chunk-([a-zA-Z0-9-_]+)\.js/);
      if (match && match[1]) {
        chunks.push({
          name: match[1],
          size: 0, // Size would require fetch to get Content-Length
        });
      }
    });

    // Estimate library sizes from package.json (static analysis)
    const knownLibraries = [
      { name: 'react', size: 13000 },
      { name: 'react-dom', size: 14000 },
      { name: 'framer-motion', size: 75000 },
      { name: 'recharts', size: 50000 },
      { name: 'lucide-react', size: 35000 },
      { name: 'chart.js', size: 200000 },
    ];

    setBundleStats({
      totalSize: knownLibraries.reduce((sum, lib) => sum + lib.size, 0),
      chunks,
      libraries: knownLibraries,
    });
  }, []);

  useEffect(() => {
    if (document.readyState === 'complete') {
      analyzeBundle();
    } else {
      window.addEventListener('load', analyzeBundle);
    }
    return () => {
      window.removeEventListener('load', analyzeBundle);
    };
  }, [analyzeBundle]);

  return bundleStats;
};

// FPS counter hook
export const useFPSCounter = () => {
  const [fps, setFps] = useState(0);
  const frameCountRef = useRef(0);
  const lastTimeRef = useRef(performance.now());
  const animationFrameRef = useRef<number>(0);

  useEffect(() => {
    const measureFPS = () => {
      frameCountRef.current++;
      const now = performance.now();

      if (now - lastTimeRef.current >= 1000) {
        setFps(frameCountRef.current);
        frameCountRef.current = 0;
        lastTimeRef.current = now;
      }

      animationFrameRef.current = requestAnimationFrame(measureFPS);
    };

    animationFrameRef.current = requestAnimationFrame(measureFPS);

    return () => {
      cancelAnimationFrame(animationFrameRef.current);
    };
  }, []);

  return fps;
};

export default PerformanceMonitor;
