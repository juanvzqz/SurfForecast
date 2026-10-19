import React from 'react';
import { SurfForecastData, UnitSystem } from '../types/surf';
import {
  calculateWaveEnergyKj,
  degToCardinal,
  estimateBreakingWaveFace,
  formatTemp,
  formatTideHeight,
  formatWaveHeight,
  formatWaveRange,
  formatWindSpeed,
  getWeatherConditionName,
} from '../utils/marineCalculations';
import {
  Bookmark,
  BookmarkCheck,
  Compass,
  Wind,
  Waves,
  Thermometer,
  Clock,
  Sparkles,
  ShieldAlert,
  ChevronRight,
  TrendingUp,
} from 'lucide-react';

interface SpotHeroProps {
  forecast: SurfForecastData;
  unit: UnitSystem;
  isFavorite: boolean;
  onToggleFavorite: () => void;
  onOpenSpotSelector: () => void;
}

export const SpotHero: React.FC<SpotHeroProps> = ({
  forecast,
  unit,
  isFavorite,
  onToggleFavorite,
  onOpenSpotSelector,
}) => {
  const { spot, current, bestWindow } = forecast;
  const energyKj = calculateWaveEnergyKj(current.swellHeightM, current.swellPeriodS);

  const getConditionColor = (quality: string) => {
    switch (quality) {
      case 'Epic':
        return 'text-emerald-400 border-emerald-500/40 bg-emerald-500/10';
      case 'Good':
        return 'text-cyan-400 border-cyan-500/40 bg-cyan-500/10';
      case 'Fair':
        return 'text-amber-400 border-amber-500/40 bg-amber-500/10';
      case 'Poor':
      case 'Flat':
        return 'text-rose-400 border-rose-500/40 bg-rose-500/10';
      default:
        return 'text-slate-400 border-slate-700 bg-slate-800/40';
    }
  };

  const getWindRelationBadge = (relation: string) => {
    switch (relation) {
      case 'Offshore':
        return 'text-emerald-300 bg-emerald-950/60 border-emerald-500/30';
      case 'Cross-offshore':
        return 'text-teal-300 bg-teal-950/60 border-teal-500/30';
      case 'Cross-shore':
        return 'text-amber-300 bg-amber-950/60 border-amber-500/30';
      case 'Onshore':
        return 'text-rose-300 bg-rose-950/60 border-rose-500/30';
      default:
        return 'text-slate-300 bg-slate-900 border-slate-700';
    }
  };

  return (
    <section id="live-overview" className="relative w-full overflow-hidden rounded-2xl border border-slate-800 bg-gradient-to-b from-slate-900 via-slate-900/90 to-slate-950 p-6 sm:p-8 shadow-xl">
      {/* Background subtle oceanic mesh glow */}
      <div className="pointer-events-none absolute -top-40 -right-40 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-blue-600/10 blur-3xl" />

      {/* Spot Header Row */}
      <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-800">
        <div>
          {/* Metadata line (clean unboxed text with typographic bullet separators per design rules) */}
          <div className="flex flex-wrap items-center gap-2 text-xs font-medium text-slate-400 mb-2">
            <span className="text-cyan-400">{spot.region}</span>
            <span aria-hidden="true">·</span>
            <span>{spot.breakType}</span>
            <span aria-hidden="true">·</span>
            <span>{spot.bottomType}</span>
            <span aria-hidden="true">·</span>
            <span>Rated for {spot.skillLevel}</span>
          </div>

          <div className="flex items-center gap-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white text-balance">
              {spot.name}
            </h1>
            <button
              onClick={onToggleFavorite}
              className={`p-2 rounded-lg border transition-all ${
                isFavorite
                  ? 'border-cyan-500/50 bg-cyan-500/10 text-cyan-400'
                  : 'border-slate-700/80 bg-slate-800/40 text-slate-400 hover:text-white hover:border-slate-600'
              }`}
              title={isFavorite ? 'Remove from Favorites' : 'Save to Favorites'}
            >
              {isFavorite ? <BookmarkCheck className="h-5 w-5" /> : <Bookmark className="h-5 w-5" />}
            </button>
          </div>

          <p className="mt-1 text-sm text-slate-400">
            {spot.location}, {spot.country}
          </p>
        </div>

        {/* Quick Spot Switcher Trigger */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSpotSelector}
            className="flex items-center gap-2 px-3.5 py-2 rounded-lg border border-slate-700 bg-slate-800/60 hover:bg-slate-800 hover:border-cyan-500/50 text-xs font-semibold text-slate-200 transition-all"
          >
            <span>Change Spot</span>
            <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
          </button>
        </div>
      </div>

      {/* Core Live Forecast Metrics Grid */}
      <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 pt-6">
        {/* Left Column: Dominant Wave Face & Condition Rating (Focal Anchor) */}
        <div className="lg:col-span-5 flex flex-col justify-between">
          <div>
            <div className="text-xs font-medium uppercase tracking-wider text-slate-400 mb-1">
              Estimated Breaking Face
            </div>

            <div className="flex items-baseline gap-3">
              <span className="text-5xl sm:text-6xl font-black tracking-tight text-white font-mono tabular-nums">
                {formatWaveRange(current.breakingFaceHeightMinM, current.breakingFaceHeightMaxM, unit)}
              </span>
            </div>

            <div className="mt-1 text-base font-semibold text-cyan-300">
              {estimateBreakingWaveFace(current.swellHeightM, current.swellPeriodS).descriptor}
            </div>

            {/* Condition Quality Box */}
            <div className={`mt-5 rounded-xl border p-4 ${getConditionColor(current.conditionQuality)}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold tracking-wide uppercase">
                    {current.conditionQuality} Condition
                  </span>
                </div>
                <div className="font-mono text-sm font-bold tabular-nums">
                  {current.conditionScore} / 10
                </div>
              </div>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                {current.swellPeriodS}s groundswell at {degToCardinal(current.swellDirectionDeg)} ({Math.round(current.swellDirectionDeg)}°) paired with {Math.round(current.windSpeedKts)} kts {current.windRelation.toLowerCase()} wind.
              </p>
            </div>
          </div>

          {/* Today's Best Surf Window alert */}
          <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950/70 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400">
              <Clock className="h-3.5 w-3.5" />
              <span>Recommended Session Today</span>
            </div>
            <div className="mt-1 flex items-baseline justify-between">
              <span className="text-base font-bold text-white">
                {bestWindow.label}
              </span>
              <span className="font-mono text-xs text-cyan-300 tabular-nums">
                {bestWindow.startTime} - {bestWindow.endTime}
              </span>
            </div>
            <p className="mt-1 text-xs text-slate-400 leading-relaxed">
              {bestWindow.summary}
            </p>
          </div>
        </div>

        {/* Right Column: 4-Cell Marine Telemetry Strip */}
        <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Cell 1: Primary Swell Details */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4.5 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Waves className="h-4 w-4 text-cyan-400" />
                Primary Ocean Swell
              </span>
              <span className="font-mono tabular-nums text-slate-400">
                {energyKj} kJ
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white font-mono tabular-nums">
                {formatWaveHeight(current.swellHeightM, unit)}
              </span>
              <span className="text-sm font-semibold text-slate-400">
                @ {current.swellPeriodS}s
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-300 flex items-center justify-between">
              <span className="text-slate-400">Direction:</span>
              <span className="font-mono font-medium text-white">
                {degToCardinal(current.swellDirectionDeg)} ({Math.round(current.swellDirectionDeg)}°)
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-400 flex items-center justify-between">
              <span>Secondary Chop:</span>
              <span className="font-mono text-slate-300">
                {formatWaveHeight(current.windWaveHeightM, unit)}
              </span>
            </div>
          </div>

          {/* Cell 2: Coastal Wind & Relation */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4.5 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Wind className="h-4 w-4 text-cyan-400" />
                Surface Wind
              </span>
              <span className={`px-2 py-0.5 text-[10px] font-bold uppercase rounded border ${getWindRelationBadge(current.windRelation)}`}>
                {current.windRelation}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white font-mono tabular-nums">
                {formatWindSpeed(current.windSpeedKts, unit)}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                gusts {formatWindSpeed(current.windGustsKts, unit)}
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-300 flex items-center justify-between">
              <span className="text-slate-400">Wind Direction:</span>
              <span className="font-mono font-medium text-white">
                {degToCardinal(current.windDirectionDeg)} ({Math.round(current.windDirectionDeg)}°)
              </span>
            </div>
            <div className="mt-1 text-xs text-slate-400 flex items-center justify-between">
              <span>Beach Facing:</span>
              <span className="font-mono text-slate-300">
                {degToCardinal(spot.beachFacingDeg)} ({spot.beachFacingDeg}°)
              </span>
            </div>
          </div>

          {/* Cell 3: Tide Dynamics */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4.5 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <TrendingUp className="h-4 w-4 text-cyan-400" />
                Astronomical Tide
              </span>
              <span className="text-xs font-semibold text-cyan-300">
                {current.tideTrend}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-bold text-white font-mono tabular-nums">
                {formatTideHeight(current.tideHeightM, unit)}
              </span>
            </div>
            <div className="mt-2 text-xs text-slate-300 flex items-center justify-between">
              <span className="text-slate-400">Ideal Tide for Break:</span>
              <span className="font-medium text-white">{spot.idealTide}</span>
            </div>
            <div className="mt-1 text-xs text-slate-400 flex items-center justify-between">
              <span>Ideal Swell Window:</span>
              <span className="font-medium text-slate-300">{spot.idealSwellDir}</span>
            </div>
          </div>

          {/* Cell 4: Water & Atmospheric Conditions */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4.5 hover:border-slate-700 transition-colors">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="flex items-center gap-1.5 font-medium">
                <Thermometer className="h-4 w-4 text-cyan-400" />
                Water & Atmosphere
              </span>
              <span className="text-xs text-slate-400 font-mono">
                UV {current.uvIndex}
              </span>
            </div>
            <div className="flex items-baseline gap-3">
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-slate-400">Sea:</span>
                <span className="text-xl font-bold text-cyan-300 font-mono tabular-nums">
                  {formatTemp(current.waterTempC, unit)}
                </span>
              </div>
              <div className="flex items-baseline gap-1">
                <span className="text-xs text-slate-400">Air:</span>
                <span className="text-xl font-bold text-slate-200 font-mono tabular-nums">
                  {formatTemp(current.airTempC, unit)}
                </span>
              </div>
            </div>
            <div className="mt-2 text-xs text-slate-300 flex items-center justify-between">
              <span className="text-slate-400">Sky Weather:</span>
              <span className="font-medium text-white">{getWeatherConditionName(current.weatherCode)}</span>
            </div>
            <div className="mt-1 text-xs text-slate-400 flex items-center justify-between">
              <span>Ideal Wind:</span>
              <span className="font-medium text-slate-300">{spot.idealWindDir}</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
