import React from 'react';
import { HourlyForecast, SurfSpot, UnitSystem } from '../types/surf';
import {
  formatTemp,
  formatTideHeight,
  getRecommendedBoard,
  getRecommendedWetsuit,
} from '../utils/marineCalculations';
import { TrendingUp, Layers, LifeBuoy, AlertCircle } from 'lucide-react';

interface TideAndQuiverProps {
  spot: SurfSpot;
  current: HourlyForecast;
  hourly: HourlyForecast[];
  unit: UnitSystem;
}

export const TideAndQuiver: React.FC<TideAndQuiverProps> = ({
  spot,
  current,
  hourly,
  unit,
}) => {
  const boardRec = getRecommendedBoard(current.breakingFaceHeightM, current.swellPeriodS);
  const wetsuitRec = getRecommendedWetsuit(current.waterTempC);

  // 24-hour slice for tide curve
  const tideSlice = hourly.slice(0, 24);
  const minTide = Math.min(...tideSlice.map((h) => h.tideHeightM));
  const maxTide = Math.max(...tideSlice.map((h) => h.tideHeightM));
  const tideRange = Math.max(0.6, maxTide - minTide);

  // Generate SVG path for tide curve
  const svgWidth = 560;
  const svgHeight = 120;
  const paddingX = 20;
  const paddingY = 20;
  const plotWidth = svgWidth - paddingX * 2;
  const plotHeight = svgHeight - paddingY * 2;

  const points = tideSlice.map((h, i) => {
    const x = paddingX + (i / (tideSlice.length - 1)) * plotWidth;
    const normY = (h.tideHeightM - minTide) / tideRange;
    const y = svgHeight - paddingY - normY * plotHeight;
    return { x, y, hour: h };
  });

  const pathD = points.reduce((acc, pt, i) => {
    if (i === 0) return `M ${pt.x} ${pt.y}`;
    const prev = points[i - 1];
    const cx = (prev.x + pt.x) / 2;
    return `${acc} C ${cx} ${prev.y}, ${cx} ${pt.y}, ${pt.x} ${pt.y}`;
  }, '');

  const areaD = `${pathD} L ${points[points.length - 1].x} ${svgHeight} L ${points[0].x} ${svgHeight} Z`;

  return (
    <section id="tides-quiver" className="grid grid-cols-1 lg:grid-cols-12 gap-6">
      {/* Tide Chart Card (7 cols) */}
      <div className="lg:col-span-7 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between">
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              24-Hour Tide Elevation Curve
            </h2>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-400">Current:</span>
            <span className="font-mono font-bold text-cyan-300 tabular-nums">
              {formatTideHeight(current.tideHeightM, unit)} ({current.tideTrend})
            </span>
          </div>
        </div>

        {/* Tide Curve Graphic */}
        <div className="relative my-4 overflow-hidden rounded-xl bg-slate-950/70 p-4 border border-slate-800/80">
          <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full h-36">
            <defs>
              <linearGradient id="tideAreaGradient" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.4" />
                <stop offset="100%" stopColor="#0891b2" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid baseline */}
            <line x1={paddingX} y1={svgHeight - paddingY} x2={svgWidth - paddingX} y2={svgHeight - paddingY} stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />
            <line x1={paddingX} y1={paddingY} x2={svgWidth - paddingX} y2={paddingY} stroke="#334155" strokeWidth="1" strokeDasharray="2 2" />

            {/* Water Fill Area */}
            <path d={areaD} fill="url(#tideAreaGradient)" />

            {/* Tidal Line */}
            <path d={pathD} fill="none" stroke="#22d3ee" strokeWidth="2.5" />

            {/* Current Time Dot */}
            {points.length > 0 && (
              <g>
                <circle cx={points[0].x} cy={points[0].y} r="5" fill="#22d3ee" className="animate-pulse" />
                <circle cx={points[0].x} cy={points[0].y} r="2" fill="#020617" />
              </g>
            )}

            {/* Min and Max markers */}
            <text x={paddingX} y={paddingY - 5} fill="#94a3b8" fontSize="10" fontFamily="JetBrains Mono">
              HIGH {formatTideHeight(maxTide, unit)}
            </text>
            <text x={paddingX} y={svgHeight - 4} fill="#64748b" fontSize="10" fontFamily="JetBrains Mono">
              LOW {formatTideHeight(minTide, unit)}
            </text>
          </svg>

          {/* Time axis stamps */}
          <div className="flex justify-between text-[11px] font-mono text-slate-400 pt-2 border-t border-slate-800">
            <span>Now</span>
            <span>+6h</span>
            <span>+12h</span>
            <span>+18h</span>
            <span>+24h</span>
          </div>
        </div>

        {/* Spot Tide Compatibility */}
        <div className="flex items-center justify-between text-xs text-slate-300 pt-2">
          <span className="text-slate-400">Optimal Tide Window for Break:</span>
          <span className="font-semibold text-cyan-300">
            {spot.idealTide} (Current: {current.tideTrend})
          </span>
        </div>
      </div>

      {/* Quiver & Wetsuit Advice Card (5 cols) */}
      <div className="lg:col-span-5 rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between">
        <div className="flex items-center gap-2 pb-4 border-b border-slate-800">
          <Layers className="h-5 w-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white tracking-tight">
            Quiver & Gear Strategy
          </h2>
        </div>

        <div className="space-y-4 my-3">
          {/* Board Recommendation */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
            <div className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wide">
              Suggested Surfboard
            </div>
            <div className="text-sm font-bold text-white mt-0.5">
              {boardRec.boardType}
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {boardRec.volumeGuide}
            </p>
            <div className="mt-2 text-[11px] text-slate-300 font-mono">
              Fin Setup: {boardRec.finSetup}
            </div>
          </div>

          {/* Rubber Recommendation */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/60 p-3.5">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-semibold text-cyan-400 uppercase tracking-wide">
                Rubber & Wetsuit
              </span>
              <span className="text-xs font-mono text-slate-300 tabular-nums">
                Sea {formatTemp(current.waterTempC, unit)}
              </span>
            </div>
            <div className="text-sm font-bold text-white mt-0.5">
              {wetsuitRec.suit}
            </div>
            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
              {wetsuitRec.accessories}
            </p>
          </div>
        </div>

        {/* Spot Safety Note */}
        <div className="flex items-start gap-2.5 rounded-lg bg-slate-950/40 border border-slate-800/80 p-2.5 text-xs text-slate-400">
          <AlertCircle className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
          <span>
            {spot.breakType} over {spot.bottomType.toLowerCase()}. Be mindful of tide shifts on shallow sections.
          </span>
        </div>
      </div>
    </section>
  );
};
