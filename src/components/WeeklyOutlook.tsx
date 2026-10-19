import React from 'react';
import { DailyForecast, UnitSystem } from '../types/surf';
import {
  degToCardinal,
  formatTemp,
  formatWaveRange,
  formatWindSpeed,
  getWeatherConditionName,
} from '../utils/marineCalculations';
import { Calendar, Wind, Waves, Sun, Cloud, CloudRain, SunMedium } from 'lucide-react';

interface WeeklyOutlookProps {
  daily: DailyForecast[];
  unit: UnitSystem;
  onSelectDay: (dateStr: string) => void;
}

export const WeeklyOutlook: React.FC<WeeklyOutlookProps> = ({
  daily,
  unit,
  onSelectDay,
}) => {
  const getQualityBadge = (quality: string) => {
    switch (quality) {
      case 'Epic':
        return 'text-emerald-400 bg-emerald-950/60 border-emerald-500/40';
      case 'Good':
        return 'text-cyan-400 bg-cyan-950/60 border-cyan-500/40';
      case 'Fair':
        return 'text-amber-400 bg-amber-950/60 border-amber-500/40';
      default:
        return 'text-slate-400 bg-slate-800/60 border-slate-700';
    }
  };

  const getWeatherIcon = (code: number) => {
    if (code <= 1) return <Sun className="h-4 w-4 text-amber-400" />;
    if (code <= 3) return <SunMedium className="h-4 w-4 text-amber-300" />;
    if (code <= 48) return <Cloud className="h-4 w-4 text-slate-400" />;
    return <CloudRain className="h-4 w-4 text-cyan-400" />;
  };

  return (
    <section id="weekly-outlook" className="rounded-2xl border border-slate-800 bg-slate-900/60 p-6 shadow-lg">
      <div className="flex items-center justify-between pb-4 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-cyan-400" />
          <h2 className="text-base font-bold text-white tracking-tight">
            7-Day Marine Surf Outlook
          </h2>
        </div>
        <span className="text-xs text-slate-400">
          Daily wave heights & swell intervals
        </span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3 mt-6">
        {daily.map((day) => {
          return (
            <button
              key={day.date}
              onClick={() => onSelectDay(day.date)}
              className="group flex flex-col justify-between text-left rounded-xl border border-slate-800 bg-slate-950/60 hover:bg-slate-850 hover:border-cyan-500/50 p-3.5 transition-all cursor-pointer"
            >
              <div>
                {/* Day Header */}
                <div className="flex items-center justify-between">
                  <span className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {day.dayName}
                  </span>
                  {getWeatherIcon(day.weatherCode)}
                </div>

                <div className="text-[11px] font-mono text-slate-500 mt-0.5">
                  {day.date.slice(5)}
                </div>

                {/* Wave Height Range */}
                <div className="mt-3">
                  <div className="text-lg font-extrabold text-white font-mono tabular-nums">
                    {formatWaveRange(day.minWaveHeightM, day.maxWaveHeightM, unit)}
                  </div>
                  <div className="text-[11px] font-medium text-slate-400 flex items-center gap-1 mt-0.5">
                    <Waves className="h-3 w-3 text-cyan-400" />
                    <span>{day.maxPeriodS}s Swell</span>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 space-y-2">
                {/* Condition Badge */}
                <div className={`text-center py-0.5 px-1.5 rounded text-[10px] font-bold uppercase tracking-wider border ${getQualityBadge(day.conditionQuality)}`}>
                  {day.conditionQuality}
                </div>

                {/* Wind */}
                <div className="flex items-center justify-between text-[11px] text-slate-400">
                  <span className="flex items-center gap-1">
                    <Wind className="h-3 w-3 text-slate-400" />
                    {degToCardinal(day.dominantWindDirDeg)}
                  </span>
                  <span className="font-mono tabular-nums text-slate-300">
                    {formatWindSpeed(day.avgWindSpeedKts, unit)}
                  </span>
                </div>

                {/* Temp */}
                <div className="flex items-center justify-between text-[11px] font-mono text-slate-500 tabular-nums">
                  <span>{formatTemp(day.minAirTempC, unit)}</span>
                  <span className="text-slate-400">{formatTemp(day.maxAirTempC, unit)}</span>
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </section>
  );
};
