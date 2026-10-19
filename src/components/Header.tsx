import React from 'react';
import { UnitSystem } from '../types/surf';
import { Waves, Search, Compass, Bookmark } from 'lucide-react';

interface HeaderProps {
  unit: UnitSystem;
  onToggleUnit: () => void;
  onOpenSpotSelector: () => void;
  favoritesCount: number;
  onOpenFavorites: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  unit,
  onToggleUnit,
  onOpenSpotSelector,
  favoritesCount,
  onOpenFavorites,
}) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-8 px-4 sm:px-6 py-3.5">
        {/* Zone 1: Brand Wordmark */}
        <div className="flex items-center gap-2.5 whitespace-nowrap shrink-0">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 text-slate-950 shadow-sm shadow-cyan-500/20">
            <Waves className="h-5 w-5 text-slate-950 stroke-[2.5]" />
          </div>
          <span className="text-xl font-bold tracking-tight text-white">
            SwellCast
          </span>
        </div>

        {/* Zone 2: Concise Nav Links (Anchors to key sections) */}
        <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
          <a
            href="#live-overview"
            className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0"
          >
            Live Forecast
          </a>
          <a
            href="#swell-dynamics"
            className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0"
          >
            Swell & Wind
          </a>
          <a
            href="#hourly-timeline"
            className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0"
          >
            Hourly Timeline
          </a>
          <a
            href="#tides-quiver"
            className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0"
          >
            Tides & Gear
          </a>
          <a
            href="#weekly-outlook"
            className="hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0"
          >
            7-Day Outlook
          </a>
        </nav>

        {/* Zone 3: Unit toggle & Primary Action */}
        <div className="flex items-center gap-3 shrink-0">
          {/* Unit Toggle Button */}
          <button
            onClick={onToggleUnit}
            title="Toggle between Imperial (ft, kts, °F) and Metric (m, km/h, °C)"
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-mono font-medium tracking-wide rounded-md border border-slate-700 bg-slate-900/80 text-slate-300 hover:border-cyan-500/50 hover:text-white transition-all whitespace-nowrap shrink-0"
          >
            <span className={unit === 'imperial' ? 'text-cyan-400 font-bold' : 'text-slate-500'}>
              FT / KTS
            </span>
            <span className="text-slate-600">/</span>
            <span className={unit === 'metric' ? 'text-cyan-400 font-bold' : 'text-slate-500'}>
              M / KMH
            </span>
          </button>

          {/* Saved Spots Shortcut */}
          <button
            onClick={onOpenFavorites}
            className="relative p-2 rounded-md border border-slate-800 bg-slate-900/60 text-slate-400 hover:text-cyan-400 hover:border-slate-700 transition-all"
            title="Saved Favorite Spots"
          >
            <Bookmark className="h-4 w-4" />
            {favoritesCount > 0 && (
              <span className="absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-cyan-500 text-[10px] font-bold text-slate-950 font-mono">
                {favoritesCount}
              </span>
            )}
          </button>

          {/* Primary Action Button: Select / Search Spot */}
          <button
            onClick={onOpenSpotSelector}
            className="flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold text-slate-950 bg-gradient-to-r from-cyan-400 to-teal-300 rounded-md hover:from-cyan-300 hover:to-teal-200 transition-all shadow-sm shadow-cyan-500/20 whitespace-nowrap shrink-0"
          >
            <Search className="h-3.5 w-3.5 stroke-[2.5]" />
            <span>Search Spot</span>
          </button>
        </div>
      </div>
    </header>
  );
};
