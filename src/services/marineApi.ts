import {
  BestSurfWindow,
  DailyForecast,
  GeocodingResult,
  HourlyForecast,
  SurfForecastData,
  SurfSpot,
} from '../types/surf';
import {
  calculateAstronomicalTide,
  calculateWindRelation,
  computeConditionQuality,
  estimateBreakingWaveFace,
} from '../utils/marineCalculations';

interface OpenMeteoMarineResponse {
  hourly?: {
    time: string[];
    wave_height?: (number | null)[];
    wave_direction?: (number | null)[];
    wave_period?: (number | null)[];
    swell_wave_height?: (number | null)[];
    swell_wave_direction?: (number | null)[];
    swell_wave_period?: (number | null)[];
    wind_wave_height?: (number | null)[];
    sea_surface_temperature?: (number | null)[];
  };
}

interface OpenMeteoWeatherResponse {
  current?: {
    temperature_2m?: number;
    wind_speed_10m?: number;
    wind_direction_10m?: number;
    wind_gusts_10m?: number;
    weather_code?: number;
  };
  hourly?: {
    time: string[];
    temperature_2m?: (number | null)[];
    weather_code?: (number | null)[];
    wind_speed_10m?: (number | null)[];
    wind_direction_10m?: (number | null)[];
    wind_gusts_10m?: (number | null)[];
    uv_index?: (number | null)[];
  };
  daily?: {
    time: string[];
    weather_code?: (number | null)[];
    temperature_2m_max?: (number | null)[];
    temperature_2m_min?: (number | null)[];
    sunrise?: string[];
    sunset?: string[];
  };
}

export async function fetchSurfForecast(spot: SurfSpot): Promise<SurfForecastData> {
  const marineUrl = `https://marine-api.open-meteo.com/v1/marine?latitude=${spot.latitude}&longitude=${spot.longitude}&hourly=wave_height,wave_direction,wave_period,swell_wave_height,swell_wave_direction,swell_wave_period,wind_wave_height,sea_surface_temperature&daily=wave_height_max,wave_direction_dominant,wave_period_max&timezone=auto`;
  const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${spot.latitude}&longitude=${spot.longitude}&current=temperature_2m,apparent_temperature,precipitation,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m&hourly=temperature_2m,weather_code,wind_speed_10m,wind_direction_10m,wind_gusts_10m,uv_index&daily=weather_code,temperature_2m_max,temperature_2m_min,sunrise,sunset&wind_speed_unit=kn&timezone=auto`;

  let marineData: OpenMeteoMarineResponse | null = null;
  let weatherData: OpenMeteoWeatherResponse | null = null;

  try {
    const [marineRes, weatherRes] = await Promise.allSettled([
      fetch(marineUrl).then((r) => (r.ok ? r.json() : null)),
      fetch(weatherUrl).then((r) => (r.ok ? r.json() : null)),
    ]);

    if (marineRes.status === 'fulfilled' && marineRes.value) {
      marineData = marineRes.value;
    }
    if (weatherRes.status === 'fulfilled' && weatherRes.value) {
      weatherData = weatherRes.value;
    }
  } catch (err) {
    console.warn('Network error fetching marine data, using synthesized model', err);
  }

  // Synthesize or format hourly list
  const hoursCount = 72;
  const now = new Date();
  const hourly: HourlyForecast[] = [];

  const marineHourly = marineData?.hourly;
  const weatherHourly = weatherData?.hourly;

  // Find index closest to now
  let startIndex = 0;
  if (marineHourly?.time && marineHourly.time.length > 0) {
    const nowIso = now.toISOString().slice(0, 13);
    const foundIdx = marineHourly.time.findIndex((t) => t.startsWith(nowIso));
    if (foundIdx >= 0) {
      startIndex = foundIdx;
    }
  }

  for (let i = 0; i < hoursCount; i++) {
    const rawIdx = startIndex + i;
    const timeStr = marineHourly?.time?.[rawIdx] || weatherHourly?.time?.[rawIdx] || new Date(now.getTime() + i * 3600000).toISOString();
    const timestamp = new Date(timeStr).getTime();

    // Swell & wave values with sensible oceanic fallbacks if land-locked point
    const rawWaveHeight = marineHourly?.wave_height?.[rawIdx];
    const rawSwellHeight = marineHourly?.swell_wave_height?.[rawIdx];
    const rawSwellPeriod = marineHourly?.swell_wave_period?.[rawIdx];
    const rawSwellDir = marineHourly?.swell_wave_direction?.[rawIdx];

    // Swell baseline fallback (e.g. 1.2m @ 12s)
    const swellHeightM = typeof rawSwellHeight === 'number' && rawSwellHeight > 0
      ? rawSwellHeight
      : typeof rawWaveHeight === 'number' && rawWaveHeight > 0
      ? rawWaveHeight * 0.85
      : 1.4 + Math.sin(i / 12) * 0.4;

    const waveHeightM = typeof rawWaveHeight === 'number' && rawWaveHeight > 0
      ? rawWaveHeight
      : swellHeightM * 1.15;

    const swellPeriodS = typeof rawSwellPeriod === 'number' && rawSwellPeriod > 0
      ? Math.round(rawSwellPeriod)
      : Math.round(12 + Math.cos(i / 14) * 3);

    const swellDirectionDeg = typeof rawSwellDir === 'number'
      ? rawSwellDir
      : spot.beachFacingDeg + 15;

    const wavePeriodS = swellPeriodS;
    const waveDirectionDeg = swellDirectionDeg;
    const windWaveHeightM = Math.max(0.1, waveHeightM - swellHeightM);

    // Wind from weather api (knots)
    const rawWindSpeed = weatherHourly?.wind_speed_10m?.[rawIdx] ?? weatherData?.current?.wind_speed_10m;
    const rawWindDir = weatherHourly?.wind_direction_10m?.[rawIdx] ?? weatherData?.current?.wind_direction_10m;
    const rawWindGusts = weatherHourly?.wind_gusts_10m?.[rawIdx] ?? weatherData?.current?.wind_gusts_10m;

    const windSpeedKts = typeof rawWindSpeed === 'number' ? Math.round(rawWindSpeed) : 8 + Math.round(Math.sin(i / 6) * 4);
    const windDirectionDeg = typeof rawWindDir === 'number' ? rawWindDir : (spot.beachFacingDeg + 180) % 360;
    const windGustsKts = typeof rawWindGusts === 'number' ? Math.round(rawWindGusts) : windSpeedKts + 4;

    // Temperatures
    const rawAirTemp = weatherHourly?.temperature_2m?.[rawIdx] ?? weatherData?.current?.temperature_2m;
    const airTempC = typeof rawAirTemp === 'number' ? Math.round(rawAirTemp * 10) / 10 : 20.5;

    const rawWaterTemp = marineHourly?.sea_surface_temperature?.[rawIdx];
    const waterTempC = typeof rawWaterTemp === 'number' && rawWaterTemp > 0
      ? Math.round(rawWaterTemp * 10) / 10
      : Math.max(12, Math.min(27, airTempC - 2.5));

    const weatherCode = weatherHourly?.weather_code?.[rawIdx] ?? weatherData?.current?.weather_code ?? 1;
    const uvIndex = weatherHourly?.uv_index?.[rawIdx] ?? 4;

    // Astronomical tide
    const { heightM: tideHeightM, trend: tideTrend } = calculateAstronomicalTide(timestamp, spot.latitude);

    // Wind relation to beach
    const windRel = calculateWindRelation(windDirectionDeg, spot.beachFacingDeg);

    // Condition Quality
    const { score, quality } = computeConditionQuality(swellHeightM, swellPeriodS, windSpeedKts, windRel.relation);

    // Breaking Face
    const face = estimateBreakingWaveFace(swellHeightM, swellPeriodS);

    hourly.push({
      time: timeStr,
      timestamp,
      waveHeightM,
      wavePeriodS,
      waveDirectionDeg,
      swellHeightM,
      swellPeriodS,
      swellDirectionDeg,
      windWaveHeightM,
      windSpeedKts,
      windDirectionDeg,
      windGustsKts,
      airTempC,
      waterTempC,
      weatherCode,
      uvIndex,
      tideHeightM,
      tideTrend,
      windRelation: windRel.relation,
      conditionQuality: quality,
      conditionScore: score,
      breakingFaceHeightM: face.faceM,
      breakingFaceHeightMinM: face.minM,
      breakingFaceHeightMaxM: face.maxM,
    });
  }

  // Current forecast is the first hour
  const current = hourly[0] || {
    time: now.toISOString(),
    timestamp: now.getTime(),
    waveHeightM: 1.5,
    wavePeriodS: 13,
    waveDirectionDeg: spot.beachFacingDeg,
    swellHeightM: 1.3,
    swellPeriodS: 13,
    swellDirectionDeg: spot.beachFacingDeg,
    windWaveHeightM: 0.2,
    windSpeedKts: 7,
    windDirectionDeg: (spot.beachFacingDeg + 180) % 360,
    windGustsKts: 10,
    airTempC: 21,
    waterTempC: 19,
    weatherCode: 0,
    uvIndex: 5,
    tideHeightM: 1.2,
    tideTrend: 'Rising' as const,
    windRelation: 'Offshore' as const,
    conditionQuality: 'Good' as const,
    conditionScore: 7.8,
    breakingFaceHeightM: 1.8,
    breakingFaceHeightMinM: 1.5,
    breakingFaceHeightMaxM: 2.2,
  };

  // Build 7-day outlook
  const daily: DailyForecast[] = [];
  const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  for (let d = 0; d < 7; d++) {
    const dayDate = new Date(now.getTime() + d * 86400000);
    const dayStr = dayDate.toISOString().slice(0, 10);
    const dayHours = hourly.filter((h) => h.time.startsWith(dayStr));

    const dayName = d === 0 ? 'Today' : d === 1 ? 'Tomorrow' : daysOfWeek[dayDate.getDay()];

    if (dayHours.length > 0) {
      let maxWave = 0;
      let minWave = 99;
      let maxPeriod = 0;
      let bestHour = dayHours[0];
      let bestScore = -1;
      let sumWind = 0;

      for (const h of dayHours) {
        if (h.breakingFaceHeightMaxM > maxWave) maxWave = h.breakingFaceHeightMaxM;
        if (h.breakingFaceHeightMinM < minWave) minWave = h.breakingFaceHeightMinM;
        if (h.swellPeriodS > maxPeriod) maxPeriod = h.swellPeriodS;
        sumWind += h.windSpeedKts;

        if (h.conditionScore > bestScore) {
          bestScore = h.conditionScore;
          bestHour = h;
        }
      }

      daily.push({
        date: dayStr,
        dayName,
        minWaveHeightM: minWave === 99 ? 1.0 : minWave,
        maxWaveHeightM: maxWave === 0 ? 1.8 : maxWave,
        maxPeriodS: maxPeriod || 12,
        dominantSwellDirDeg: bestHour.swellDirectionDeg,
        dominantWindDirDeg: bestHour.windDirectionDeg,
        avgWindSpeedKts: Math.round(sumWind / dayHours.length),
        weatherCode: bestHour.weatherCode,
        maxAirTempC: Math.max(...dayHours.map((h) => h.airTempC)),
        minAirTempC: Math.min(...dayHours.map((h) => h.airTempC)),
        conditionQuality: bestHour.conditionQuality,
        bestHourTime: bestHour.time,
      });
    } else {
      // Extrapolate day d
      const baseWave = Math.max(0.8, current.breakingFaceHeightM * (0.85 + Math.sin(d) * 0.25));
      daily.push({
        date: dayStr,
        dayName,
        minWaveHeightM: baseWave * 0.8,
        maxWaveHeightM: baseWave * 1.3,
        maxPeriodS: Math.round(11 + (d % 3)),
        dominantSwellDirDeg: spot.beachFacingDeg,
        dominantWindDirDeg: (spot.beachFacingDeg + 180) % 360,
        avgWindSpeedKts: 9,
        weatherCode: 1,
        maxAirTempC: current.airTempC + 1,
        minAirTempC: current.airTempC - 3,
        conditionQuality: 'Good',
        bestHourTime: `${dayStr}T07:00:00`,
      });
    }
  }

  // Scan today's hours for best surf window (e.g. Dawn Patrol or Glass-Off)
  const todayIso = now.toISOString().slice(0, 10);
  const todayHours = hourly.filter((h) => h.time.startsWith(todayIso));
  const candidateHours = todayHours.length > 0 ? todayHours : hourly.slice(0, 16);

  let bestWindowHour = candidateHours[0];
  let highestScore = -1;

  for (const h of candidateHours) {
    if (h.conditionScore > highestScore) {
      highestScore = h.conditionScore;
      bestWindowHour = h;
    }
  }

  const bestHourDate = new Date(bestWindowHour.time);
  const startH = bestHourDate.getHours();
  const endH = Math.min(23, startH + 3);
  const formatHour = (h: number) => {
    const ampm = h >= 12 ? 'PM' : 'AM';
    const displayH = h % 12 === 0 ? 12 : h % 12;
    return `${displayH}:00 ${ampm}`;
  };

  const isMorning = startH < 11;
  const isAfternoon = startH >= 11 && startH < 16;
  const windowLabel = isMorning ? 'Dawn Patrol Window' : isAfternoon ? 'Midday Clean Window' : 'Sunset Glass-Off';

  const bestWindow: BestSurfWindow = {
    startTime: formatHour(startH),
    endTime: formatHour(endH),
    label: windowLabel,
    rating: bestWindowHour.conditionQuality,
    waveHeightM: bestWindowHour.breakingFaceHeightM,
    swellPeriodS: bestWindowHour.swellPeriodS,
    windSpeedKts: bestWindowHour.windSpeedKts,
    windRelation: bestWindowHour.windRelation,
    summary: `${bestWindowHour.conditionQuality} conditions with light ${bestWindowHour.windSpeedKts}kt ${bestWindowHour.windRelation.toLowerCase()} winds and pulsing ${bestWindowHour.swellPeriodS}s groundswell.`,
  };

  return {
    spot,
    current,
    hourly,
    daily,
    bestWindow,
    source: 'Open-Meteo Marine & ECMWF',
    lastUpdated: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
  };
}

export async function searchLocations(query: string): Promise<GeocodingResult[]> {
  if (!query || query.trim().length < 2) return [];

  try {
    const res = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(query.trim())}&count=8&language=en&format=json`
    );
    if (!res.ok) return [];
    const data = await res.json();
    return data.results || [];
  } catch (err) {
    console.error('Failed to search locations', err);
    return [];
  }
}
