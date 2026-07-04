import React, { useState, useMemo, useEffect, useRef } from 'react';
import { Expense } from '../types';

interface GlowChartProps {
  expenses: Expense[];
  currentLang: string;
  labels: {
    actual: string;
    optimized: string;
    title: string;
  };
}

export default function GlowChart({ expenses, labels }: GlowChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 280 });
  const [hoveredPoint, setHoveredPoint] = useState<{
    index: number;
    x: number;
    actualY: number;
    optY: number;
    actualValue: number;
    optValue: number;
    month: string;
  } | null>(null);

  // Measure container for fully responsive layout
  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        setDimensions({
          width: Math.max(width, 300),
          height: Math.max(height, 220),
        });
      }
    });
    resizeObserver.observe(containerRef.current);
    return () => resizeObserver.disconnect();
  }, []);

  const totalCurrentCost = useMemo(() => {
    return expenses.reduce((sum, exp) => sum + exp.cost, 0);
  }, [expenses]);

  const totalOptimizedCost = useMemo(() => {
    return expenses.reduce((sum, exp) => {
      if (exp.isOptimized) {
        // If optimized, subtract the saved amount
        const savedVal = parseInt(exp.recommendationParam?.replace('$', '') || '0', 10);
        return sum + Math.max(0, exp.cost - savedVal);
      }
      return sum + exp.cost;
    }, 0);
  }, [expenses]);

  // Months labels
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

  // Generate 6 data points based on expenses
  const dataPoints = useMemo(() => {
    // Current spend has been slowly growing over the months
    const growthFactors = [0.82, 0.88, 0.94, 0.97, 1.0, 1.05];
    // Optimized spend paths diverge from month 4 (Current is month 5)
    const optimizedFactors = [0.82, 0.88, 0.94, 0.97, 0.72, 0.65];

    return months.map((month, idx) => {
      const actualVal = Math.round(totalCurrentCost * growthFactors[idx]);
      
      // Calculate optimized path
      let optVal = actualVal;
      if (idx >= 4) {
        // Drop down to the optimized value
        const currentOptimizedTarget = totalOptimizedCost;
        if (idx === 4) {
          optVal = Math.round((actualVal + currentOptimizedTarget) / 2);
        } else {
          optVal = Math.round(currentOptimizedTarget * 0.98); // slight forecast fluctuations
        }
      }

      return {
        month,
        actual: actualVal,
        optimized: Math.min(actualVal, optVal),
      };
    });
  }, [totalCurrentCost, totalOptimizedCost]);

  // Compute SVG Coordinates
  const padding = { top: 30, right: 40, bottom: 40, left: 55 };
  const chartWidth = dimensions.width - padding.left - padding.right;
  const chartHeight = dimensions.height - padding.top - padding.bottom;

  const maxVal = useMemo(() => {
    const vals = dataPoints.flatMap((d) => [d.actual, d.optimized]);
    const max = Math.max(...vals, 100);
    return Math.ceil(max * 1.15 / 100) * 100; // Round to nice ceiling with margin
  }, [dataPoints]);

  const minVal = 0;

  // Coordinate mapper functions
  const getX = (index: number) => padding.left + (index / (months.length - 1)) * chartWidth;
  const getY = (value: number) => padding.top + chartHeight - ((value - minVal) / (maxVal - minVal)) * chartHeight;

  // Build Bézier Curve Path String
  const buildSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length === 0) return '';
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 0; i < points.length - 1; i++) {
      const p0 = points[i];
      const p1 = points[i + 1];
      const cpX1 = p0.x + (p1.x - p0.x) / 3;
      const cpY1 = p0.y;
      const cpX2 = p0.x + (2 * (p1.x - p0.x)) / 3;
      const cpY2 = p1.y;
      d += ` C ${cpX1} ${cpY1}, ${cpX2} ${cpY2}, ${p1.x} ${p1.y}`;
    }
    return d;
  };

  const actualPoints = dataPoints.map((d, i) => ({ x: getX(i), y: getY(d.actual) }));
  const optimizedPoints = dataPoints.map((d, i) => ({ x: getX(i), y: getY(d.optimized) }));

  const actualPath = buildSmoothPath(actualPoints);
  const optimizedPath = buildSmoothPath(optimizedPoints);

  // Closed paths for linear gradient fills
  const actualClosedPath = actualPoints.length > 0 
    ? `${actualPath} L ${getX(months.length - 1)} ${padding.top + chartHeight} L ${getX(0)} ${padding.top + chartHeight} Z` 
    : '';

  const optimizedClosedPath = optimizedPoints.length > 0
    ? `${optimizedPath} L ${getX(months.length - 1)} ${padding.top + chartHeight} L ${getX(0)} ${padding.top + chartHeight} Z`
    : '';

  // Grid ticks
  const yTicks = 4;
  const yGridValues = Array.from({ length: yTicks + 1 }, (_, i) => minVal + (i * (maxVal - minVal)) / yTicks);

  return (
    <div className="relative w-full h-full flex flex-col justify-between" ref={containerRef}>
      {/* Title & Legend Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 mb-2 px-1">
        <h3 className="text-sm font-semibold tracking-wide text-white uppercase flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-violet-500 animate-pulse"></span>
          {labels.title}
        </h3>
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className="w-3 h-1.5 rounded bg-violet-500 shadow-[0_0_8px_rgba(157,0,255,0.6)]"></span>
            <span className="text-white/60">{labels.actual}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-1.5 rounded bg-cyan-400 shadow-[0_0_8px_rgba(0,240,255,0.6)]"></span>
            <span className="text-white/60">{labels.optimized}</span>
          </div>
        </div>
      </div>

      {/* SVG Canvas */}
      <div className="relative flex-1 min-h-[220px]">
        <svg
          width={dimensions.width}
          height={dimensions.height}
          className="overflow-visible select-none"
          onMouseLeave={() => setHoveredPoint(null)}
        >
          {/* Neon Glow Filters */}
          <defs>
            <filter id="glow-violet" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            <filter id="glow-cyan" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
            
            {/* Area Gradients */}
            <linearGradient id="gradient-violet" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#9D00FF" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#9D00FF" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="gradient-cyan" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#00F0FF" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#00F0FF" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {yGridValues.map((val, idx) => {
            const y = getY(val);
            return (
              <g key={idx} className="opacity-40">
                <line
                  x1={padding.left}
                  y1={y}
                  x2={dimensions.width - padding.right}
                  y2={y}
                  stroke="rgba(255,255,255,0.08)"
                  strokeDasharray={idx === 0 ? 'none' : '4 4'}
                  strokeWidth={1}
                />
                <text
                  x={padding.left - 10}
                  y={y + 4}
                  textAnchor="end"
                  className="font-mono text-[10px] fill-white/40 font-medium"
                >
                  ${val}
                </text>
              </g>
            );
          })}

          {/* Month labels along X axis */}
          {months.map((m, idx) => {
            const x = getX(idx);
            return (
              <g key={idx}>
                <line
                  x1={x}
                  y1={padding.top + chartHeight}
                  y2={padding.top + chartHeight + 6}
                  stroke="rgba(255,255,255,0.15)"
                  strokeWidth={1}
                />
                <text
                  x={x}
                  y={padding.top + chartHeight + 20}
                  textAnchor="middle"
                  className="font-mono text-[10px] fill-white/50"
                >
                  {m}
                </text>
              </g>
            );
          })}

          {/* Shaded Area Fills */}
          <path d={actualClosedPath} fill="url(#gradient-violet)" />
          <path d={optimizedClosedPath} fill="url(#gradient-cyan)" />

          {/* Neon Lines */}
          <path
            d={actualPath}
            fill="none"
            stroke="#9D00FF"
            strokeWidth={3}
            filter="url(#glow-violet)"
            className="transition-all duration-500 ease-out"
          />
          <path
            d={optimizedPath}
            fill="none"
            stroke="#00F0FF"
            strokeWidth={3}
            filter="url(#glow-cyan)"
            className="transition-all duration-500 ease-out"
          />

          {/* Interactive hover trigger regions (bars behind the chart for easy hover) */}
          {dataPoints.map((d, idx) => {
            const x = getX(idx);
            const colWidth = chartWidth / (months.length - 1);
            return (
              <rect
                key={idx}
                x={x - colWidth / 2}
                y={padding.top}
                width={colWidth}
                height={chartHeight}
                fill="transparent"
                className="cursor-pointer"
                onMouseEnter={() => {
                  setHoveredPoint({
                    index: idx,
                    x,
                    actualY: getY(d.actual),
                    optY: getY(d.optimized),
                    actualValue: d.actual,
                    optValue: d.optimized,
                    month: d.month,
                  });
                }}
              />
            );
          })}

          {/* Glowing node dots for paths */}
          {dataPoints.map((d, idx) => {
            const x = getX(idx);
            const actY = getY(d.actual);
            const optY = getY(d.optimized);
            const isHovered = hoveredPoint?.index === idx;

            return (
              <g key={idx} className="pointer-events-none">
                {/* Actual spend nodes */}
                <circle
                  cx={x}
                  cy={actY}
                  r={isHovered ? 6 : 4}
                  fill="#121214"
                  stroke="#9D00FF"
                  strokeWidth={isHovered ? 3 : 2}
                  className="transition-all duration-150"
                  style={{ filter: isHovered ? 'drop-shadow(0px 0px 8px #9D00FF)' : 'none' }}
                />
                
                {/* Optimized spend nodes */}
                {optY !== actY && (
                  <circle
                    cx={x}
                    cy={optY}
                    r={isHovered ? 6 : 4}
                    fill="#121214"
                    stroke="#00F0FF"
                    strokeWidth={isHovered ? 3 : 2}
                    className="transition-all duration-150"
                    style={{ filter: isHovered ? 'drop-shadow(0px 0px 8px #00F0FF)' : 'none' }}
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Dynamic Tooltip */}
        {hoveredPoint && (
          <div
            className="absolute z-10 p-3 rounded-lg border border-white/10 bg-[#0C0C0F]/90 backdrop-blur-md shadow-[0_4px_24px_rgba(0,0,0,0.8)] pointer-events-none transition-all duration-150 text-xs font-mono"
            style={{
              left: hoveredPoint.x - 70,
              top: Math.min(hoveredPoint.actualY, hoveredPoint.optY) - 95,
            }}
          >
            <div className="font-bold text-white mb-1.5 text-center border-b border-white/10 pb-1 uppercase tracking-wider text-[10px]">
              {hoveredPoint.month} Spending Trajectory
            </div>
            <div className="flex items-center justify-between gap-6 mb-1">
              <span className="text-violet-400 font-semibold">{labels.actual}:</span>
              <span className="text-white font-bold">${hoveredPoint.actualValue}</span>
            </div>
            <div className="flex items-center justify-between gap-6">
              <span className="text-cyan-400 font-semibold">{labels.optimized}:</span>
              <span className="text-white font-bold">${hoveredPoint.optValue}</span>
            </div>
            {hoveredPoint.actualValue > hoveredPoint.optValue && (
              <div className="mt-1.5 text-[10px] text-emerald-400 font-semibold text-center pt-1 border-t border-white/5">
                Saved: ${hoveredPoint.actualValue - hoveredPoint.optValue}/mo
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
