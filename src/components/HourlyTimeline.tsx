import React from 'react';
import { HourlyForecast, UnitSystem } from '../types/surf';
import { degToCardinal, formatWaveHeight, formatWindSpeed } from '../utils/marineCalculations';
import { Clock, Navigation, Wind } from 'lucide-react';

interface HourlyTimelineProps {
  hourly: HourlyForecast[];
  selectedTimestamp: number;
  onSelectHour: (hour: HourlyForecast) => void;
  unit: UnitSystem;
}

export const HourlyTimeline: React.FC<HourlyTimelineProps> = ({
  hourly,
  selectedTimestamp,
  onSelectHour,
  unit,
}) => {
  // Display the next 36 hours for detailed hour-by-hour analysis
  const displayHours = hourly.slice(0, 36);

  // Maximum wave height for chart scaling
  const maxWave = Math.max(...displayHours.map((h) => h.breakingFaceHeightMaxM), 2.5);

  const getBarColor = (quality: string, isSelected: boolean) => {
    if (isSelected) {
      return 'bg-gradient-to-t from-cyan-400 to-teal-300 ring-2 ring-cyan-400 shadow-md shadow-cyan-500/30';
    }
    switch (quality) {
      case 'Epic':
        return 'bg-gradient-to-t from-emerald-600 to-emerald-400 hover:brightness-110';
      case 'Good':
        return 'bg-gradient-to-t from-cyan-600 to-cyan-400 hover:brightness-110';
      case 'Fair':
        return 'bg-gradient-to-t from-amber-600 to-amber-400 hover:brightness-110';
      case 'Poor':
      case 'Flat':
        return 'bg-gradient-to-t from-slate-700 to-slate-500 hover:brightness-110';
      default:
        return 'bg-slate-700';
    }
  };

  const formatHourLabel = (timeStr: string) => {
    const d = new Date(timeStr);
    const hours = d.getHours();
    const ampm = hours >= 12 ? 'pm' : 'am';
    const displayH = hours % 12 === 0 ? 12 : hours % 12;
    return `${displayH}${ampm}`;
  };

  const getDayMarker = (timeStr: string, idx: number) => {
    const d = new Date(timeStr);
    if (d.getHours() === 0 || idx === 0) {
      const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
      return idx === 0 ? 'Today' : dayNames[d.getDay()];
    }
    return null;
  };

  return (
    <section id="hourly-timeline" className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-cyan-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Hourly Surf & Wind Forecast
            </h2>
          </div>
          <p className="mt-1 text-xs text-slate-400">
            Click any hour bar below to inspect that time slice in the dashboard
          </p>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-4 text-xs font-medium text-slate-400">
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-emerald-400" />
            <span>Epic</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-cyan-400" />
            <span>Good</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-amber-400" />
            <span>Fair</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="h-2.5 w-2.5 rounded-sm bg-slate-500" />
            <span>Poor/Flat</span>
          </div>
        </div>
      </div>

      {/* Horizontally scrollable chart strip */}
      <div className="relative mt-6 overflow-x-auto pb-4 pt-2">
        <div className="flex items-end gap-2.5 min-w-[900px] h-60">
          {displayHours.map((hour, idx) => {
            const isSelected = Math.abs(hour.timestamp - selectedTimestamp) < 1800000;
            const barHeightPct = Math.max(15, (hour.breakingFaceHeightMaxM / maxWave) * 100);
            const dayMarker = getDayMarker(hour.time, idx);

            return (
              <button
                key={hour.time}
                onClick={() => onSelectHour(hour)}
                className={`group flex flex-col items-center flex-1 min-w-[48px] h-full justify-end cursor-pointer rounded-lg p-1.5 transition-all text-center ${
                  isSelected
                    ? 'bg-slate-800/90 ring-1 ring-cyan-500/50'
                    : 'hover:bg-slate-800/40'
                }`}
              >
                {/* Day Marker Header */}
                <div className="h-5 text-[10px] font-bold text-cyan-400 uppercase tracking-wider font-mono">
                  {dayMarker || ''}
                </div>

                {/* Swell Period */}
                <div className="text-[10px] font-mono text-slate-400 tabular-nums mb-1">
                  {hour.swellPeriodS}s
                </div>

                {/* Wave Face Value */}
                <div className="text-xs font-bold text-white font-mono tabular-nums mb-1">
                  {formatWaveHeight(hour.breakingFaceHeightMaxM, unit)}
                </div>

                {/* Dynamic Height Bar */}
                <div className="w-full flex items-end justify-center h-28 my-1">
                  <div
                    style={{ height: `${barHeightPct}%` }}
                    className={`w-full max-w-[28px] rounded-t-md transition-all ${getBarColor(
                      hour.conditionQuality,
                      isSelected
                    )}`}
                  />
                </div>

                {/* Wind Arrow & Speed */}
                <div className="mt-2 flex flex-col items-center">
                  <div
                    style={{ transform: `rotate(${hour.windDirectionDeg}deg)` }}
                    className="flex items-center justify-center text-slate-300 group-hover:text-cyan-300 transition-transform"
                    title={`Wind from ${degToCardinal(hour.windDirectionDeg)} (${Math.round(hour.windDirectionDeg)}°)`}
                  >
                    <Navigation className="h-3 w-3 fill-current" />
                  </div>
                  <span className="text-[10px] font-mono font-medium text-slate-300 tabular-nums mt-0.5">
                    {Math.round(hour.windSpeedKts)}
                  </span>
                  <span className="text-[9px] uppercase tracking-tight text-slate-500">
                    {hour.windRelation.slice(0, 4)}
                  </span>
                </div>

                {/* Hour Label */}
                <div className="mt-2 text-xs font-mono font-semibold text-slate-400 border-t border-slate-800/80 pt-1 w-full">
                  {formatHourLabel(hour.time)}
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
};
