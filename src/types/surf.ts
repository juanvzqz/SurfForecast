export type BreakType = 'Beach Break' | 'Reef Break' | 'Point Break' | 'Slab' | 'Rivermouth';
export type SkillLevel = 'Beginner' | 'Intermediate' | 'Advanced' | 'Expert' | 'All Levels';
export type WindRelation = 'Offshore' | 'Cross-offshore' | 'Cross-shore' | 'Onshore';
export type ConditionQuality = 'Epic' | 'Good' | 'Fair' | 'Poor' | 'Flat';
export type UnitSystem = 'imperial' | 'metric';

export interface SurfSpot {
  id: string;
  name: string;
  location: string;
  country: string;
  region: 'North America' | 'Europe' | 'Hawaii & Pacific' | 'Asia & Indo' | 'Australia' | 'Latin America' | 'Africa';
  latitude: number;
  longitude: number;
  beachFacingDeg: number; // Shore orientation (normal outward to sea in degrees 0-360)
  breakType: BreakType;
  skillLevel: SkillLevel;
  idealSwellDir: string;
  idealWindDir: string;
  idealTide: 'Low' | 'Mid' | 'High' | 'All Tides' | 'Low to Mid' | 'Mid to High' | string;
  description: string;
  bottomType: 'Sand' | 'Reef / Coral' | 'Cobblestone' | 'Rock & Sand';
}

export interface HourlyForecast {
  time: string; // ISO string
  timestamp: number;
  waveHeightM: number;
  wavePeriodS: number;
  waveDirectionDeg: number;
  swellHeightM: number;
  swellPeriodS: number;
  swellDirectionDeg: number;
  windWaveHeightM: number;
  windSpeedKts: number;
  windDirectionDeg: number;
  windGustsKts: number;
  airTempC: number;
  waterTempC: number;
  weatherCode: number;
  uvIndex: number;
  tideHeightM: number;
  tideTrend: 'Rising' | 'Falling' | 'High Slack' | 'Low Slack';
  windRelation: WindRelation;
  conditionQuality: ConditionQuality;
  conditionScore: number; // 0 - 10
  breakingFaceHeightM: number;
  breakingFaceHeightMinM: number;
  breakingFaceHeightMaxM: number;
}

export interface DailyForecast {
  date: string;
  dayName: string;
  minWaveHeightM: number;
  maxWaveHeightM: number;
  maxPeriodS: number;
  dominantSwellDirDeg: number;
  dominantWindDirDeg: number;
  avgWindSpeedKts: number;
  weatherCode: number;
  maxAirTempC: number;
  minAirTempC: number;
  conditionQuality: ConditionQuality;
  bestHourTime: string;
}

export interface BestSurfWindow {
  startTime: string;
  endTime: string;
  label: string;
  rating: ConditionQuality;
  waveHeightM: number;
  swellPeriodS: number;
  windSpeedKts: number;
  windRelation: WindRelation;
  summary: string;
}

export interface SurfForecastData {
  spot: SurfSpot;
  current: HourlyForecast;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  bestWindow: BestSurfWindow;
  source: 'Open-Meteo Marine & ECMWF' | 'Marine Buoy Model';
  lastUpdated: string;
}

export interface GeocodingResult {
  id: number;
  name: string;
  latitude: number;
  longitude: number;
  country: string;
  admin1?: string;
}
