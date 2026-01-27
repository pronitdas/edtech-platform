import React, { useEffect, useRef } from 'react';
import { usePerformanceMonitoring, useFPSCounter } from '@/hooks/usePerformanceMonitoring';

interface PerformanceDashboardProps {
  showWebVitals?: boolean;
  showFPS?: boolean;
  showBundle?: boolean;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  enabled?: boolean;
}

export const PerformanceDashboard: React.FC<PerformanceDashboardProps> = ({
  showWebVitals = true,
  showFPS = true,
  showBundle = true,
  position = 'top-right',
  enabled = true,
}) => {
  const { metrics, performanceScore, isGood } = usePerformanceMonitoring();
  const fps = useFPSCounter();
  const [isExpanded, setIsExpanded] = React.useState(false);
  const [isMinimized, setIsMinimized] = React.useState(true);

  if (!enabled) return null;

  const positionClasses = {
    'top-right': 'fixed top-4 right-4',
    'top-left': 'fixed top-4 left-4',
    'bottom-right': 'fixed bottom-4 right-4',
    'bottom-left': 'fixed bottom-4 left-4',
  };

  return (
    <div className={positionClasses[position]}>
      {/* Minimized state */}
      {isMinimized ? (
        <button
          onClick={() => setIsMinimized(false)}
          className={`flex items-center gap-2 px-3 py-2 rounded-lg font-mono text-sm ${
            isGood ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-current animate-pulse" />
          <span>Perf: {performanceScore}</span>
          {showFPS && <span>{fps} FPS</span>}
        </button>
      ) : (
        <div
          className="bg-gray-900/95 backdrop-blur-sm rounded-xl border border-gray-700 p-4 w-72"
          onMouseLeave={() => setIsMinimized(true)}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-white">Performance</h3>
            <button
              onClick={() => setIsMinimized(true)}
              className="text-gray-400 hover:text-white"
            >
              −
            </button>
          </div>

          {/* Overall Score */}
          <div
            className={`text-center p-4 rounded-lg mb-4 ${
              performanceScore >= 90
                ? 'bg-green-500/20'
                : performanceScore >= 50
                  ? 'bg-yellow-500/20'
                  : 'bg-red-500/20'
            }`}
          >
            <div className="text-3xl font-bold text-white">{performanceScore}</div>
            <div className="text-xs text-gray-400">Performance Score</div>
          </div>

          {/* Core Web Vitals */}
          {showWebVitals && (
            <div className="space-y-2 mb-4">
              <h4 className="text-xs font-medium text-gray-400 uppercase">Core Web Vitals</h4>
              <WebVitalItem label="LCP" value={metrics.lcp ?? null} threshold={2500} unit="ms" />
              <WebVitalItem label="FID" value={metrics.fid ?? null} threshold={100} unit="ms" />
              <WebVitalItem label="CLS" value={metrics.cls ?? null} threshold={0.1} unit="" />
              <WebVitalItem label="INP" value={metrics.inp ?? null} threshold={200} unit="ms" />
              <WebVitalItem label="FCP" value={metrics.fcp ?? null} threshold={1800} unit="ms" />
              <WebVitalItem label="TTFB" value={metrics.ttfb ?? null} threshold={800} unit="ms" />
            </div>
          )}

          {/* FPS */}
          {showFPS && (
            <div className="flex items-center justify-between py-2 border-t border-gray-700">
              <span className="text-sm text-gray-400">FPS</span>
              <span
                className={`font-mono ${
                  fps >= 55
                    ? 'text-green-400'
                    : fps >= 30
                      ? 'text-yellow-400'
                      : 'text-red-400'
                }`}
              >
                {fps}
              </span>
            </div>
          )}

          {/* Status */}
          <div
            className={`mt-4 p-2 rounded text-center text-sm ${
              isGood
                ? 'bg-green-500/20 text-green-400'
                : 'bg-red-500/20 text-red-400'
            }`}
          >
            {isGood ? '✓ All metrics good' : '⚠ Some metrics need improvement'}
          </div>
        </div>
      )}
    </div>
  );
};

interface WebVitalItemProps {
  label: string;
  value: number | null;
  threshold: number;
  unit: string;
}

const WebVitalItem: React.FC<WebVitalItemProps> = ({ label, value, threshold, unit }) => {
  const isGood = value !== null && value <= threshold;

  return (
    <div className="flex items-center justify-between py-1">
      <span className="text-sm text-gray-400">{label}</span>
      <span
        className={`font-mono text-sm ${
          value === null
            ? 'text-gray-500'
            : isGood
              ? 'text-green-400'
              : 'text-red-400'
        }`}
      >
        {value !== null ? `${value.toFixed(0)}${unit}` : '—'}
      </span>
    </div>
  );
};

// Performance Badge Component
export const PerformanceBadge: React.FC = () => {
  const { performanceScore, isGood } = usePerformanceMonitoring();

  if (!performanceScore) return null;

  return (
    <div
      className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium ${
        isGood
          ? 'bg-green-500/20 text-green-400'
          : performanceScore >= 50
            ? 'bg-yellow-500/20 text-yellow-400'
            : 'bg-red-500/20 text-red-400'
      }`}
    >
      <span className="w-2 h-2 rounded-full bg-current" />
      <span>Performance: {performanceScore}</span>
    </div>
  );
};

export default PerformanceDashboard;
