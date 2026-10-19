import React, { useMemo } from 'react';
import { SurfForecastData, UnitSystem } from '../types/surf';
import { formatWaveHeight } from '../utils/marineCalculations';
import { Activity } from 'lucide-react';

interface WaveVisualizerProps {
  forecast: SurfForecastData;
  unit: UnitSystem;
}

export const WaveVisualizer: React.FC<WaveVisualizerProps> = ({ forecast, unit }) => {
  const { current } = forecast;
  const period = current.swellPeriodS;
  const height = current.swellHeightM;

  // Wave profile curve generation
  // Swell period dictates wave steepness and barrel curvature
  const isHollow = period >= 12;
  const waveHeightScaled = Math.min(75, Math.max(25, height * 22));

  // Generate SVG path for a curling breaking wave
  const pathData = useMemo(() => {
    const baseY = 110;
    const peakX = 170;
    const peakY = baseY - waveHeightScaled;
    const curlX = isHollow ? peakX + 22 : peakX + 38;
    const curlY = isHollow ? peakY + 28 : peakY + 18;

    return `M 0 ${baseY} 
      Q 70 ${baseY - 5}, 120 ${baseY - waveHeightScaled * 0.4} 
      T ${peakX} ${peakY} 
      C ${peakX + 18} ${peakY - 4}, ${curlX + 10} ${curlY - 10}, ${curlX} ${curlY}
      C ${curlX - 15} ${curlY + 15}, ${peakX - 10} ${baseY}, 280 ${baseY} 
      L 280 140 L 0 140 Z`;
  }, [waveHeightScaled, isHollow]);

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Activity className="h-5 w-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white tracking-tight">
            Wave Dynamics & Energy
          </h2>
        </div>
        <span className="text-xs font-mono text-cyan-400">
          {period}s Swell Frequency
        </span>
      </div>

      {/* Wave Profile Graphic */}
      <div className="relative my-2 overflow-hidden rounded-xl bg-gradient-to-b from-slate-950/80 to-slate-900/90 p-4 border border-slate-800/60">
        <svg
          viewBox="0 0 280 140"
          className="w-full h-36"
        >
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.85" />
              <stop offset="60%" stopColor="#0284c7" stopOpacity="0.5" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.2" />
            </linearGradient>
            <linearGradient id="waveBackGradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.1" />
            </linearGradient>
          </defs>

          {/* Secondary background wave */}
          <path
            d={`M 0 110 Q 90 90, 190 70 T 280 110 L 280 140 L 0 140 Z`}
            fill="url(#waveBackGradient)"
          />

          {/* Primary wave profile */}
          <path
            d={pathData}
            fill="url(#waveGradient)"
            stroke="#38bdf8"
            strokeWidth="2"
          />

          {/* Wave Lip Spray / Foam dots */}
          <circle cx="188" cy="74" r="2.5" fill="#e0f2fe" opacity="0.8" />
          <circle cx="194" cy="78" r="1.8" fill="#e0f2fe" opacity="0.6" />
          <circle cx="200" cy="85" r="2" fill="#e0f2fe" opacity="0.7" />
          <circle cx="182" cy="70" r="1.5" fill="#e0f2fe" opacity="0.9" />

          {/* Bathymetry seabed line */}
          <line x1="0" y1="135" x2="280" y2="135" stroke="#334155" strokeWidth="2" strokeDasharray="3 3" />
          <text x="10" y="132" fill="#64748b" fontSize="8" fontFamily="JetBrains Mono">
            SEABED BATHYMETRY
          </text>
        </svg>

        {/* Floating live stats badge */}
        <div className="absolute top-3 right-3 flex items-center gap-1.5 px-2 py-1 rounded bg-slate-900/90 border border-slate-700/80 text-[11px] font-mono text-cyan-300">
          <span>{isHollow ? 'Hollow / Pitching' : 'Crumbly / Spilling'}</span>
        </div>
      </div>

      {/* Energy & Steeepness Breakdown */}
      <div className="grid grid-cols-3 gap-2 pt-3 border-t border-slate-800 text-center">
        <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800/80">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Power</div>
          <div className="mt-0.5 text-xs font-bold text-white font-mono tabular-nums">
            {period >= 14 ? 'High Energy' : period >= 10 ? 'Medium' : 'Low Energy'}
          </div>
        </div>

        <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800/80">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Shoaling</div>
          <div className="mt-0.5 text-xs font-bold text-cyan-300 font-mono tabular-nums">
            +{(period * 0.08).toFixed(1)}x Face
          </div>
        </div>

        <div className="rounded-lg bg-slate-950/60 p-2 border border-slate-800/80">
          <div className="text-[10px] uppercase tracking-wider text-slate-400">Interval</div>
          <div className="mt-0.5 text-xs font-bold text-white font-mono tabular-nums">
            {period}s Gap
          </div>
        </div>
      </div>
    </div>
  );
};
