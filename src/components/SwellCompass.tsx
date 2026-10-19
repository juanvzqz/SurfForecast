import React from 'react';
import { SurfForecastData, UnitSystem } from '../types/surf';
import { degToCardinal, formatWaveHeight, formatWindSpeed } from '../utils/marineCalculations';
import { Compass, Waves, Wind } from 'lucide-react';

interface SwellCompassProps {
  forecast: SurfForecastData;
  unit: UnitSystem;
}

export const SwellCompass: React.FC<SwellCompassProps> = ({ forecast, unit }) => {
  const { spot, current } = forecast;

  const beachFacing = spot.beachFacingDeg;
  const swellDir = current.swellDirectionDeg;
  const windDir = current.windDirectionDeg;

  // Coastline is perpendicular to beachFacingDeg (beachFacing ± 90 deg)
  const coastAngle1 = (beachFacing + 90) % 360;
  const coastAngle2 = (beachFacing + 270) % 360;

  // Convert degrees to radians for SVG coordinates (0 deg is Top/North, 90 is Right/East)
  const degToSvgRad = (deg: number) => ((deg - 90) * Math.PI) / 180;

  const center = 140;
  const radius = 100;

  // Coastline line coordinates
  const c1X = center + radius * Math.cos(degToSvgRad(coastAngle1));
  const c1Y = center + radius * Math.sin(degToSvgRad(coastAngle1));
  const c2X = center + radius * Math.cos(degToSvgRad(coastAngle2));
  const c2Y = center + radius * Math.sin(degToSvgRad(coastAngle2));

  // Swell arrow (coming FROM swellDir towards center)
  const swellStartX = center + (radius - 10) * Math.cos(degToSvgRad(swellDir));
  const swellStartY = center + (radius - 10) * Math.sin(degToSvgRad(swellDir));
  const swellEndX = center + 25 * Math.cos(degToSvgRad(swellDir));
  const swellEndY = center + 25 * Math.sin(degToSvgRad(swellDir));

  // Wind arrow (wind coming FROM windDir, blowing toward opposite)
  const windStartX = center + (radius - 15) * Math.cos(degToSvgRad(windDir));
  const windStartY = center + (radius - 15) * Math.sin(degToSvgRad(windDir));
  const windEndX = center + (radius - 55) * Math.cos(degToSvgRad((windDir + 180) % 360));
  const windEndY = center + (radius - 55) * Math.sin(degToSvgRad((windDir + 180) % 360));

  // Beach normal arrow (pointing outward to sea)
  const beachNormX = center + (radius - 30) * Math.cos(degToSvgRad(beachFacing));
  const beachNormY = center + (radius - 30) * Math.sin(degToSvgRad(beachFacing));

  return (
    <div id="swell-dynamics" className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 flex flex-col justify-between">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white tracking-tight">
            Swell & Wind Orientation
          </h2>
        </div>
        <span className="text-xs font-mono text-slate-400">
          Beach {spot.beachFacingDeg}° {degToCardinal(spot.beachFacingDeg)}
        </span>
      </div>

      {/* Interactive Nautical Compass SVG */}
      <div className="relative my-4 flex items-center justify-center">
        <svg
          viewBox="0 0 280 280"
          className="w-full max-w-[280px] select-none"
        >
          {/* Compass Rings */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="#1e293b"
            strokeWidth="2"
          />
          <circle
            cx={center}
            cy={center}
            r={radius - 20}
            fill="#0f172a"
            fillOpacity="0.7"
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="4 4"
          />

          {/* Compass Cardinals */}
          <text x={center} y={22} textAnchor="middle" fill="#94a3b8" fontSize="11" fontWeight="700" fontFamily="JetBrains Mono">
            N
          </text>
          <text x={center + radius + 14} y={center + 4} textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="600" fontFamily="JetBrains Mono">
            E
          </text>
          <text x={center} y={center + radius + 18} textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="600" fontFamily="JetBrains Mono">
            S
          </text>
          <text x={center - radius - 14} y={center + 4} textAnchor="middle" fill="#64748b" fontSize="10" fontWeight="600" fontFamily="JetBrains Mono">
            W
          </text>

          {/* Coastline Line (Divider between Land and Ocean) */}
          <line
            x1={c1X}
            y1={c1Y}
            x2={c2X}
            y2={c2Y}
            stroke="#64748b"
            strokeWidth="3"
            strokeLinecap="round"
          />

          {/* Ocean Side Indicator Label */}
          <text
            x={beachNormX}
            y={beachNormY}
            textAnchor="middle"
            fill="#38bdf8"
            fontSize="9"
            fontWeight="700"
            letterSpacing="0.05em"
          >
            OCEAN
          </text>

          {/* Primary Swell Vector (Cyan Arrow + Pulse lines) */}
          <defs>
            <marker
              id="swell-arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#06b6d4" />
            </marker>
            <marker
              id="wind-arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#38bdf8" />
            </marker>
          </defs>

          {/* Swell incoming line */}
          <line
            x1={swellStartX}
            y1={swellStartY}
            x2={swellEndX}
            y2={swellEndY}
            stroke="#06b6d4"
            strokeWidth="3.5"
            strokeLinecap="round"
            markerEnd="url(#swell-arrow)"
          />

          {/* Wind line */}
          <line
            x1={windStartX}
            y1={windStartY}
            x2={windEndX}
            y2={windEndY}
            stroke="#f59e0b"
            strokeWidth="2.5"
            strokeLinecap="round"
            strokeDasharray="4 2"
            markerEnd="url(#wind-arrow)"
          />

          {/* Center Hub */}
          <circle cx={center} cy={center} r="6" fill="#06b6d4" />
          <circle cx={center} cy={center} r="2" fill="#020617" />
        </svg>
      </div>

      {/* Legend & Breakdown Strip */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-slate-800">
        <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs text-cyan-400 font-semibold mb-1">
            <Waves className="h-3.5 w-3.5" />
            <span>Swell Path</span>
          </div>
          <div className="text-sm font-bold text-white font-mono tabular-nums">
            {Math.round(current.swellDirectionDeg)}° {degToCardinal(current.swellDirectionDeg)}
          </div>
          <div className="text-[11px] text-slate-400">
            {formatWaveHeight(current.swellHeightM, unit)} @ {current.swellPeriodS}s
          </div>
        </div>

        <div className="rounded-lg bg-slate-950/60 p-2.5 border border-slate-800/80">
          <div className="flex items-center gap-1.5 text-xs text-amber-400 font-semibold mb-1">
            <Wind className="h-3.5 w-3.5" />
            <span>Surface Wind</span>
          </div>
          <div className="text-sm font-bold text-white font-mono tabular-nums">
            {Math.round(current.windDirectionDeg)}° {degToCardinal(current.windDirectionDeg)}
          </div>
          <div className="text-[11px] text-slate-400">
            {formatWindSpeed(current.windSpeedKts, unit)} · {current.windRelation}
          </div>
        </div>
      </div>
    </div>
  );
};
