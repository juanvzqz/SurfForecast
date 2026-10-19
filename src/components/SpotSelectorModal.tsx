import React, { useState, useEffect } from 'react';
import { GeocodingResult, SurfSpot } from '../types/surf';
import { POPULAR_SPOTS, REGIONS } from '../data/spots';
import { searchLocations } from '../services/marineApi';
import {
  Search,
  X,
  MapPin,
  Bookmark,
  Navigation,
  Globe,
  Waves,
  Check,
} from 'lucide-react';

interface SpotSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentSpot: SurfSpot;
  onSelectSpot: (spot: SurfSpot) => void;
  favoriteSpotIds: string[];
  onToggleFavorite: (spotId: string) => void;
}

export const SpotSelectorModal: React.FC<SpotSelectorModalProps> = ({
  isOpen,
  onClose,
  currentSpot,
  onSelectSpot,
  favoriteSpotIds,
  onToggleFavorite,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeRegion, setActiveRegion] = useState<string>('All Spots');
  const [searchResults, setSearchResults] = useState<GeocodingResult[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isLocating, setIsLocating] = useState(false);
  const [locateError, setLocateError] = useState<string | null>(null);

  // Search debounce
  useEffect(() => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      const results = await searchLocations(searchQuery);
      setSearchResults(results);
      setIsSearching(false);
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Handle escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  // Filter spots by region or search query
  const filteredPopular = POPULAR_SPOTS.filter((spot) => {
    const matchesRegion = activeRegion === 'All Spots' || spot.region === activeRegion;
    const matchesQuery =
      !searchQuery.trim() ||
      spot.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spot.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
      spot.country.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesRegion && matchesQuery;
  });

  // Favorite spots list
  const favoriteSpots = POPULAR_SPOTS.filter((s) => favoriteSpotIds.includes(s.id));

  // Geolocation handler
  const handleUseLocation = () => {
    if (!navigator.geolocation) {
      setLocateError('Geolocation is not supported by your browser.');
      return;
    }

    setIsLocating(true);
    setLocateError(null);

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocating(false);
        const { latitude, longitude } = pos.coords;
        const customSpot: SurfSpot = {
          id: `custom-${latitude.toFixed(3)}-${longitude.toFixed(3)}`,
          name: 'Current Coastal Location',
          location: `${latitude.toFixed(2)}°, ${longitude.toFixed(2)}°`,
          country: 'Local Waters',
          region: 'North America',
          latitude,
          longitude,
          beachFacingDeg: 270, // Default outward ocean estimate
          breakType: 'Beach Break',
          skillLevel: 'All Levels',
          idealSwellDir: 'W - NW',
          idealWindDir: 'E - NE',
          idealTide: 'Mid',
          description: 'Custom coordinates retrieved via GPS.',
          bottomType: 'Sand',
        };
        onSelectSpot(customSpot);
        onClose();
      },
      (err) => {
        setIsLocating(false);
        setLocateError('Could not retrieve GPS location. Please allow location access or choose a preset spot.');
      },
      { timeout: 10000 }
    );
  };

  const handleSelectCustomResult = (geo: GeocodingResult) => {
    const customSpot: SurfSpot = {
      id: `custom-geo-${geo.id}`,
      name: geo.name,
      location: geo.admin1 ? `${geo.admin1}, ${geo.country}` : geo.country,
      country: geo.country,
      region: 'North America',
      latitude: geo.latitude,
      longitude: geo.longitude,
      beachFacingDeg: 240, // Estimated offshore normal
      breakType: 'Beach Break',
      skillLevel: 'All Levels',
      idealSwellDir: 'Open Ocean',
      idealWindDir: 'Light / Variable',
      idealTide: 'Mid',
      description: `Coastal weather forecast for ${geo.name}.`,
      bottomType: 'Sand',
    };
    onSelectSpot(customSpot);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-3xl max-h-[85vh] flex flex-col rounded-2xl border border-slate-800 bg-slate-900 shadow-2xl overflow-hidden">
        {/* Modal Header & Search */}
        <div className="p-6 border-b border-slate-800 bg-slate-900/90">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-cyan-400" />
              <h2 className="text-lg font-bold text-white tracking-tight">
                Select Surf Destination
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Search Box & GPS Button */}
          <div className="flex flex-col sm:flex-row gap-2.5">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search any world beach, surf spot, or city (e.g. Pipeline, Trestles, Hossegor)..."
                className="w-full rounded-xl border border-slate-700 bg-slate-950/80 pl-10 pr-4 py-2.5 text-sm text-white placeholder-slate-500 focus:border-cyan-400 focus:outline-none transition-all"
                autoFocus
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white text-xs"
                >
                  Clear
                </button>
              )}
            </div>

            <button
              onClick={handleUseLocation}
              disabled={isLocating}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-800 hover:border-cyan-500/50 text-xs font-semibold text-slate-200 transition-all whitespace-nowrap shrink-0 disabled:opacity-50"
            >
              <Navigation className={`h-3.5 w-3.5 text-cyan-400 ${isLocating ? 'animate-spin' : ''}`} />
              <span>{isLocating ? 'Locating...' : 'Use My GPS'}</span>
            </button>
          </div>

          {locateError && (
            <p className="mt-2 text-xs text-rose-400">{locateError}</p>
          )}

          {/* Region Tabs (Interactive functional buttons) */}
          <div className="flex items-center gap-1.5 overflow-x-auto pt-4 no-scrollbar">
            {REGIONS.map((region) => {
              const isActive = activeRegion === region;
              return (
                <button
                  key={region}
                  onClick={() => setActiveRegion(region)}
                  className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 ${
                    isActive
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                      : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                  }`}
                >
                  {region}
                </button>
              );
            })}
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {/* Custom Geocoding API Results (if user is searching) */}
          {searchResults.length > 0 && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-cyan-400 mb-3">
                Global Geocoding Matches
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {searchResults.map((geo) => (
                  <button
                    key={`${geo.id}-${geo.latitude}`}
                    onClick={() => handleSelectCustomResult(geo)}
                    className="flex items-start gap-3 p-3 rounded-xl border border-slate-800 bg-slate-950/50 hover:bg-slate-800/60 hover:border-cyan-500/40 text-left transition-all"
                  >
                    <MapPin className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                    <div>
                      <div className="text-sm font-semibold text-white">{geo.name}</div>
                      <div className="text-xs text-slate-400">
                        {geo.admin1 ? `${geo.admin1}, ` : ''}{geo.country}
                      </div>
                      <div className="text-[10px] font-mono text-slate-500 tabular-nums mt-0.5">
                        {geo.latitude.toFixed(2)}°, {geo.longitude.toFixed(2)}°
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Saved Favorites Section (if any) */}
          {favoriteSpots.length > 0 && !searchQuery && (
            <div>
              <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3 flex items-center gap-1.5">
                <Bookmark className="h-3.5 w-3.5 text-cyan-400" />
                <span>Saved Favorite Breaks ({favoriteSpots.length})</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {favoriteSpots.map((spot) => {
                  const isCurrent = spot.id === currentSpot.id;
                  return (
                    <div
                      key={spot.id}
                      className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
                        isCurrent
                          ? 'border-cyan-500/60 bg-cyan-950/20'
                          : 'border-slate-800 bg-slate-950/50 hover:border-slate-700'
                      }`}
                    >
                      <button
                        onClick={() => {
                          onSelectSpot(spot);
                          onClose();
                        }}
                        className="flex-1 text-left flex items-start gap-2.5"
                      >
                        <Waves className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                        <div>
                          <div className="text-sm font-bold text-white flex items-center gap-1.5">
                            <span>{spot.name}</span>
                            {isCurrent && <Check className="h-3.5 w-3.5 text-cyan-400" />}
                          </div>
                          <div className="text-xs text-slate-400">{spot.location}</div>
                        </div>
                      </button>
                      <button
                        onClick={() => onToggleFavorite(spot.id)}
                        className="p-1.5 text-cyan-400 hover:text-slate-400 transition-colors"
                        title="Remove from favorites"
                      >
                        <Bookmark className="h-4 w-4 fill-cyan-400" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Curated Surf Breaks */}
          <div>
            <div className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">
              Curated World-Class Breaks ({filteredPopular.length})
            </div>

            {filteredPopular.length === 0 && searchResults.length === 0 ? (
              <div className="text-center py-8 text-slate-500 text-sm">
                No matching spots found for "{searchQuery}". Try searching a city or country!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {filteredPopular.map((spot) => {
                  const isCurrent = spot.id === currentSpot.id;
                  const isFav = favoriteSpotIds.includes(spot.id);

                  return (
                    <div
                      key={spot.id}
                      className={`flex flex-col justify-between p-3.5 rounded-xl border transition-all ${
                        isCurrent
                          ? 'border-cyan-500 bg-cyan-950/30 ring-1 ring-cyan-500/40'
                          : 'border-slate-800 bg-slate-950/60 hover:border-slate-700 hover:bg-slate-800/40'
                      }`}
                    >
                      <div>
                        <div className="flex items-start justify-between gap-2">
                          <button
                            onClick={() => {
                              onSelectSpot(spot);
                              onClose();
                            }}
                            className="text-left flex-1"
                          >
                            <div className="text-sm font-bold text-white hover:text-cyan-300 transition-colors">
                              {spot.name}
                            </div>
                            <div className="text-xs text-slate-400 mt-0.5">
                              {spot.location}, {spot.country}
                            </div>
                          </button>
                          <button
                            onClick={() => onToggleFavorite(spot.id)}
                            className={`p-1.5 rounded-md hover:bg-slate-800 transition-colors ${
                              isFav ? 'text-cyan-400' : 'text-slate-500 hover:text-white'
                            }`}
                          >
                            <Bookmark className={`h-4 w-4 ${isFav ? 'fill-current' : ''}`} />
                          </button>
                        </div>

                        {/* Quiet metadata line */}
                        <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-400">
                          <span className="text-cyan-400">{spot.breakType}</span>
                          <span aria-hidden="true">·</span>
                          <span>{spot.skillLevel}</span>
                          <span aria-hidden="true">·</span>
                          <span>Faces {spot.beachFacingDeg}°</span>
                        </div>
                      </div>

                      <div className="mt-3 pt-2.5 border-t border-slate-800/60 flex items-center justify-between">
                        <span className="text-[11px] text-slate-500">
                          Ideal: {spot.idealSwellDir}
                        </span>
                        <button
                          onClick={() => {
                            onSelectSpot(spot);
                            onClose();
                          }}
                          className="px-2.5 py-1 text-xs font-semibold rounded bg-slate-800 hover:bg-cyan-500 hover:text-slate-950 text-slate-200 transition-colors"
                        >
                          {isCurrent ? 'Viewing' : 'Select'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
