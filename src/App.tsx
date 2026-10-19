import React, { useState, useEffect, useCallback } from 'react';
import { HourlyForecast, SurfForecastData, SurfSpot, UnitSystem } from './types/surf';
import { POPULAR_SPOTS } from './data/spots';
import { fetchSurfForecast } from './services/marineApi';
import { Header } from './components/Header';
import { SpotHero } from './components/SpotHero';
import { SwellCompass } from './components/SwellCompass';
import { WaveVisualizer } from './components/WaveVisualizer';
import { HourlyTimeline } from './components/HourlyTimeline';
import { TideAndQuiver } from './components/TideAndQuiver';
import { WeeklyOutlook } from './components/WeeklyOutlook';
import { SpotSelectorModal } from './components/SpotSelectorModal';
import { Waves, RefreshCw, AlertCircle } from 'lucide-react';

const STORAGE_KEY_SPOT = 'swellcast_active_spot';
const STORAGE_KEY_UNIT = 'swellcast_unit';
const STORAGE_KEY_FAVS = 'swellcast_favorites';

export default function App() {
  // Load initial spot from storage or default to Pipeline
  const [activeSpot, setActiveSpot] = useState<SurfSpot>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_SPOT);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return POPULAR_SPOTS[0]; // Banzai Pipeline
  });

  // Unit system: imperial (ft/kts/°F) vs metric (m/kmh/°C)
  const [unit, setUnit] = useState<UnitSystem>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_UNIT);
      if (saved === 'metric' || saved === 'imperial') return saved;
    } catch (e) {
      // ignore
    }
    return 'imperial';
  });

  // Favorites
  const [favoriteSpotIds, setFavoriteSpotIds] = useState<string[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY_FAVS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      // ignore
    }
    return ['pipeline', 'lower-trestles', 'supertubos', 'uluwatu'];
  });

  const [forecast, setForecast] = useState<SurfForecastData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Inspected hour from the hourly timeline (if null, current forecast is shown)
  const [selectedHour, setSelectedHour] = useState<HourlyForecast | null>(null);

  // Spot selector modal
  const [isSpotSelectorOpen, setIsSpotSelectorOpen] = useState(false);

  // Persist settings
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_SPOT, JSON.stringify(activeSpot));
    } catch (e) {}
  }, [activeSpot]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_UNIT, unit);
    } catch (e) {}
  }, [unit]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_FAVS, JSON.stringify(favoriteSpotIds));
    } catch (e) {}
  }, [favoriteSpotIds]);

  // Load forecast data
  const loadForecast = useCallback(async (spot: SurfSpot) => {
    setLoading(true);
    setError(null);
    setSelectedHour(null);

    try {
      const data = await fetchSurfForecast(spot);
      setForecast(data);
    } catch (err: any) {
      console.error('Failed to load surf forecast', err);
      setError('Unable to load ocean weather models. Please check your internet connection and retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadForecast(activeSpot);
  }, [activeSpot, loadForecast]);

  const handleToggleUnit = () => {
    setUnit((prev) => (prev === 'imperial' ? 'metric' : 'imperial'));
  };

  const handleToggleFavorite = (spotId: string) => {
    setFavoriteSpotIds((prev) =>
      prev.includes(spotId) ? prev.filter((id) => id !== spotId) : [...prev, spotId]
    );
  };

  const handleSelectSpot = (spot: SurfSpot) => {
    setActiveSpot(spot);
  };

  const handleSelectHour = (hour: HourlyForecast) => {
    setSelectedHour(hour);
  };

  // Jump to specific day in timeline
  const handleSelectDay = (dateStr: string) => {
    if (!forecast) return;
    const matchHour = forecast.hourly.find((h) => h.time.startsWith(dateStr));
    if (matchHour) {
      setSelectedHour(matchHour);
      // Smooth scroll to timeline
      const el = document.getElementById('hourly-timeline');
      if (el) {
        el.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  // If user selected an inspected hour, display that hour inside the hero & compass
  const activeForecastDisplay: SurfForecastData | null = forecast
    ? {
        ...forecast,
        current: selectedHour || forecast.current,
      }
    : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Top Bar Navigation */}
      <Header
        unit={unit}
        onToggleUnit={handleToggleUnit}
        onOpenSpotSelector={() => setIsSpotSelectorOpen(true)}
        favoritesCount={favoriteSpotIds.length}
        onOpenFavorites={() => setIsSpotSelectorOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8 space-y-8">
        {loading && !forecast ? (
          <div className="flex flex-col items-center justify-center min-h-[500px] rounded-2xl border border-slate-800 bg-slate-900/40 p-12 text-center">
            <div className="relative flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-500/10 text-cyan-400 border border-cyan-500/30">
              <Waves className="h-7 w-7 animate-pulse" />
            </div>
            <h2 className="mt-4 text-lg font-bold text-white">
              Polling Marine Buoy & Wave Models
            </h2>
            <p className="mt-1 text-sm text-slate-400 max-w-md">
              Fetching ECMWF ocean swell height, swell direction, wind vectors, and bathymetry data for {activeSpot.name}...
            </p>
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center min-h-[400px] rounded-2xl border border-rose-900/40 bg-rose-950/20 p-8 text-center">
            <AlertCircle className="h-10 w-10 text-rose-400 mb-3" />
            <h2 className="text-lg font-bold text-white">Marine Forecast Unavailable</h2>
            <p className="mt-1 text-sm text-slate-400 max-w-md">{error}</p>
            <button
              onClick={() => loadForecast(activeSpot)}
              className="mt-5 px-4 py-2 rounded-lg bg-slate-850 border border-slate-700 hover:border-cyan-400 text-xs font-semibold text-white transition-all flex items-center gap-2"
            >
              <RefreshCw className="h-3.5 w-3.5" />
              <span>Retry Connection</span>
            </button>
          </div>
        ) : activeForecastDisplay ? (
          <>
            {/* Visual Anchor: Spot Hero */}
            <SpotHero
              forecast={activeForecastDisplay}
              unit={unit}
              isFavorite={favoriteSpotIds.includes(activeSpot.id)}
              onToggleFavorite={() => handleToggleFavorite(activeSpot.id)}
              onOpenSpotSelector={() => setIsSpotSelectorOpen(true)}
            />

            {/* If inspecting an alternate hour, notify user with reset option */}
            {selectedHour && (
              <div className="flex items-center justify-between px-4 py-2.5 rounded-xl border border-cyan-500/40 bg-cyan-950/30 text-xs text-cyan-200">
                <span className="font-medium">
                  Inspecting forecast for{' '}
                  <strong className="text-white">
                    {new Date(selectedHour.time).toLocaleDateString([], {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </strong>
                </span>
                <button
                  onClick={() => setSelectedHour(null)}
                  className="px-2.5 py-1 rounded bg-cyan-500 text-slate-950 font-bold hover:bg-cyan-400 transition-colors"
                >
                  Reset to Current
                </button>
              </div>
            )}

            {/* 2-Column Split: Swell & Wind Compass + Wave Dynamics Visualizer */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <SwellCompass forecast={activeForecastDisplay} unit={unit} />
              <WaveVisualizer forecast={activeForecastDisplay} unit={unit} />
            </div>

            {/* Hourly Forecast Scrubber */}
            <HourlyTimeline
              hourly={activeForecastDisplay.hourly}
              selectedTimestamp={selectedHour?.timestamp ?? activeForecastDisplay.current.timestamp}
              onSelectHour={handleSelectHour}
              unit={unit}
            />

            {/* Tide Elevation Curve & Quiver Advisor */}
            <TideAndQuiver
              spot={activeSpot}
              current={activeForecastDisplay.current}
              hourly={activeForecastDisplay.hourly}
              unit={unit}
            />

            {/* 7-Day Outlook Matrix */}
            <WeeklyOutlook
              daily={activeForecastDisplay.daily}
              unit={unit}
              onSelectDay={handleSelectDay}
            />
          </>
        ) : null}
      </main>

      {/* Global Spot Selector & Search Modal */}
      <SpotSelectorModal
        isOpen={isSpotSelectorOpen}
        onClose={() => setIsSpotSelectorOpen(false)}
        currentSpot={activeSpot}
        onSelectSpot={handleSelectSpot}
        favoriteSpotIds={favoriteSpotIds}
        onToggleFavorite={handleToggleFavorite}
      />

      {/* Editorial Footer */}
      <footer className="w-full border-t border-slate-800/80 bg-slate-950/90 py-6 mt-12 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Waves className="h-4 w-4 text-cyan-400" />
            <span className="font-semibold text-slate-300">SwellCast Marine Intelligence</span>
            <span aria-hidden="true">·</span>
            <span>Open-Meteo & ECMWF WAM Model</span>
          </div>

          <div className="flex items-center gap-4 text-slate-400 font-mono text-[11px]">
            <span>{activeSpot.latitude.toFixed(4)}°N, {activeSpot.longitude.toFixed(4)}°W</span>
            {forecast && <span>Updated {forecast.lastUpdated}</span>}
          </div>
        </div>
      </footer>
    </div>
  );
}
