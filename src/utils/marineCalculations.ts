import { ConditionQuality, UnitSystem, WindRelation } from '../types/surf';

export const CARDINAL_DIRECTIONS = [
  'N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE',
  'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW', 'N'
];

export function degToCardinal(deg: number): string {
  const normalized = ((deg % 360) + 360) % 360;
  const index = Math.round(normalized / 22.5);
  return CARDINAL_DIRECTIONS[index % 16];
}

/**
 * Calculates whether the wind is Offshore, Cross-shore, or Onshore
 * beachFacingDeg is the normal vector pointing from the beach OUTWARD to sea.
 * Ocean is at beachFacingDeg.
 * Land is at (beachFacingDeg + 180) % 360.
 * If wind direction (direction wind is coming FROM) is near the land angle,
 * it is blowing from land toward sea -> OFFSHORE!
 */
export function calculateWindRelation(windDirDeg: number, beachFacingDeg: number): {
  relation: WindRelation;
  description: string;
  isFavorable: boolean;
} {
  const landAngle = (beachFacingDeg + 180) % 360;
  // Angular difference between wind direction and land angle
  let diff = Math.abs(windDirDeg - landAngle);
  if (diff > 180) diff = 360 - diff;

  if (diff <= 35) {
    return {
      relation: 'Offshore',
      description: 'Clean grooming wind blowing from land out to sea',
      isFavorable: true,
    };
  } else if (diff <= 65) {
    return {
      relation: 'Cross-offshore',
      description: 'Slightly angled offshore wind with clean face surfaces',
      isFavorable: true,
    };
  } else if (diff <= 115) {
    return {
      relation: 'Cross-shore',
      description: 'Side-shore wind producing texture and gentle drift',
      isFavorable: false,
    };
  } else {
    return {
      relation: 'Onshore',
      description: 'Blowing straight onto the beach, causing surface chop and crumbling lips',
      isFavorable: false,
    };
  }
}

/**
 * Translates open-ocean swell height & period to breaking face wave height
 * Swell period amplifies breaking face significantly when shoaling on shallow bathymetry.
 * A 1.5m swell @ 8s makes ~4ft crumbly wave.
 * A 1.5m swell @ 18s makes ~7-9ft hollow powerful wave!
 */
export function estimateBreakingWaveFace(swellHeightM: number, swellPeriodS: number): {
  minM: number;
  maxM: number;
  faceM: number;
  descriptor: string;
} {
  // Period factor: 8s = 1.0, 14s = 1.45, 18s = 1.75
  const periodFactor = Math.max(0.85, 0.7 + (swellPeriodS / 20) * 0.9);
  const baseFaceM = swellHeightM * periodFactor;
  
  const minM = Math.max(0.2, baseFaceM * 0.85);
  const maxM = Math.max(0.4, baseFaceM * 1.25);
  const faceM = (minM + maxM) / 2;

  // Face descriptor based on feet
  const faceFt = faceM * 3.28084;
  let descriptor = 'Flat / Ankle High';
  if (faceFt >= 18) descriptor = 'Triple Overhead+ / Big Wave';
  else if (faceFt >= 12) descriptor = 'Double Overhead+ / Heavy';
  else if (faceFt >= 8) descriptor = 'Overhead to Double Overhead';
  else if (faceFt >= 6) descriptor = 'Head High to Overhead';
  else if (faceFt >= 4.5) descriptor = 'Chest to Head High';
  else if (faceFt >= 3) descriptor = 'Waist to Chest High';
  else if (faceFt >= 1.5) descriptor = 'Knee to Waist High';
  else if (faceFt >= 0.8) descriptor = 'Ankle to Knee High';

  return { minM, maxM, faceM, descriptor };
}

/**
 * Wave energy in kJ (kilojoules)
 * Surf energy standard: H^2 * T (approx metric)
 */
export function calculateWaveEnergyKj(swellHeightM: number, swellPeriodS: number): number {
  return Math.round(swellHeightM * swellHeightM * swellPeriodS * 42);
}

/**
 * Computes surf condition rating from 0 to 10
 */
export function computeConditionQuality(
  swellHeightM: number,
  swellPeriodS: number,
  windSpeedKts: number,
  windRelation: WindRelation
): { score: number; quality: ConditionQuality; explanation: string } {
  if (swellHeightM < 0.4) {
    return {
      score: 1.5,
      quality: 'Flat',
      explanation: 'Micro swell or flat ocean with minimal surfable power',
    };
  }

  let score = 5.0;

  // Swell Period weighting (period is king in surfing!)
  if (swellPeriodS >= 16) score += 2.8;
  else if (swellPeriodS >= 13) score += 2.0;
  else if (swellPeriodS >= 10) score += 1.0;
  else if (swellPeriodS < 8) score -= 1.8;

  // Swell Height weighting
  if (swellHeightM >= 1.2 && swellHeightM <= 3.5) score += 1.5;
  else if (swellHeightM >= 0.8) score += 0.8;
  else if (swellHeightM < 0.6) score -= 0.5;

  // Wind relation & speed weighting
  if (windSpeedKts <= 5) {
    score += 1.8; // Glassy
  } else if (windRelation === 'Offshore') {
    if (windSpeedKts <= 15) score += 2.0;
    else score += 0.8; // strong offshore can hold wave up or spray
  } else if (windRelation === 'Cross-offshore') {
    if (windSpeedKts <= 12) score += 1.2;
    else score -= 0.5;
  } else if (windRelation === 'Cross-shore') {
    if (windSpeedKts <= 10) score -= 0.5;
    else score -= 1.8;
  } else if (windRelation === 'Onshore') {
    if (windSpeedKts <= 8) score -= 1.0;
    else if (windSpeedKts <= 15) score -= 2.5;
    else score -= 3.8;
  }

  score = Math.max(1, Math.min(10, Math.round(score * 10) / 10));

  let quality: ConditionQuality = 'Fair';
  let explanation = '';

  if (score >= 8.2) {
    quality = 'Epic';
    explanation = `${swellPeriodS}s groundswell lined up with ${windSpeedKts}kt ${windRelation.toLowerCase()} winds. Pristine peeling barrels.`;
  } else if (score >= 6.8) {
    quality = 'Good';
    explanation = `Solid ${swellPeriodS}s swell with favorable ${windRelation.toLowerCase()} airflow. Clean workable wave faces.`;
  } else if (score >= 4.8) {
    quality = 'Fair';
    explanation = `Surfable conditions with moderate ${windRelation.toLowerCase()} texture. Good for standard daily sessions.`;
  } else {
    quality = 'Poor';
    explanation = `Bumpy surface chop with ${windSpeedKts}kt ${windRelation.toLowerCase()} wind degradation or lack of swell energy.`;
  }

  return { score, quality, explanation };
}

/**
 * Astronomical sinusoidal harmonic tide calculation
 * Approximates a semi-diurnal 12.42-hour tidal oscillation
 */
export function calculateAstronomicalTide(timestampMs: number, baseLat: number): {
  heightM: number;
  trend: 'Rising' | 'Falling' | 'High Slack' | 'Low Slack';
} {
  // Period in milliseconds ~ 12 hours 25 minutes = 44700000 ms
  const tideCycleMs = 12.42 * 3600 * 1000;
  // Phase shift based on longitude/latitude
  const phase = ((timestampMs + Math.sin(baseLat) * 3600000) % tideCycleMs) / tideCycleMs;
  
  // Sine wave between -1 and +1, tidal range typically 1.6m (-0.8m to +0.8m above datum)
  const amplitude = 1.0 + Math.abs(Math.sin(baseLat * 0.05)) * 0.5;
  const sinVal = Math.sin(phase * 2 * Math.PI);
  const cosVal = Math.cos(phase * 2 * Math.PI);
  
  const heightM = Math.round((sinVal * amplitude + 1.2) * 10) / 10;

  let trend: 'Rising' | 'Falling' | 'High Slack' | 'Low Slack' = 'Rising';
  if (Math.abs(cosVal) < 0.15) {
    trend = sinVal > 0 ? 'High Slack' : 'Low Slack';
  } else if (cosVal > 0) {
    trend = 'Rising';
  } else {
    trend = 'Falling';
  }

  return { heightM, trend };
}

/**
 * Quiver / Surfboard recommendation
 */
export function getRecommendedBoard(faceHeightM: number, swellPeriodS: number): {
  boardType: string;
  volumeGuide: string;
  finSetup: string;
} {
  const faceFt = faceHeightM * 3.28084;

  if (faceFt >= 12) {
    return {
      boardType: 'Gun / Big Wave Rhino Chaser (8\'6" - 10\'0")',
      volumeGuide: 'Heavy glassing, high volume for paddle velocity into deep water swells',
      finSetup: 'Thruster or Quad with stiff carbon fins',
    };
  } else if (faceFt >= 7) {
    return {
      boardType: 'Step-Up / Semi-Gun (6\'4" - 6\'8")',
      volumeGuide: '+2 to +4 liters over standard shortboard for holding critical drops',
      finSetup: 'Quad or Thruster with medium-large rake',
    };
  } else if (faceFt >= 4) {
    return {
      boardType: 'Standard High-Performance Shortboard (5\'10" - 6\'2")',
      volumeGuide: 'Normal everyday volume for quick snaps, pocket carves, and tube riding',
      finSetup: 'Thruster (3-fin) for vertical pivot',
    };
  } else if (faceFt >= 2.5) {
    return {
      boardType: 'Fish / Performance Hybrid / Groveler (5\'4" - 5\'8")',
      volumeGuide: '+2 to +3 liters with wider outline to carry speed through flatter sections',
      finSetup: 'Twin Fin with trailer or Quad',
    };
  } else {
    return {
      boardType: 'Classic Longboard / Log or Foamie (9\'0"+)',
      volumeGuide: '60L+ high flotation for effortless glide on gentle ankle-waist ripples',
      finSetup: 'Single Fin 9" for nose-riding',
    };
  }
}

/**
 * Rubber / Wetsuit guide based on water temperature
 */
export function getRecommendedWetsuit(waterTempC: number): {
  suit: string;
  accessories: string;
} {
  if (waterTempC >= 23) {
    return {
      suit: 'Boardshorts / Swimsuit & Rashguard',
      accessories: 'Reef booties & zinc sunblock recommended',
    };
  } else if (waterTempC >= 19) {
    return {
      suit: '2mm Springsuit or Neoprene Top',
      accessories: 'Light neoprene for morning breeze chill',
    };
  } else if (waterTempC >= 15) {
    return {
      suit: '3/2mm Full Sealed Steamer',
      accessories: 'Standard fullsuit for moderate coastal waters',
    };
  } else if (waterTempC >= 11) {
    return {
      suit: '4/3mm Chest-Zip Steamer',
      accessories: '3mm Booties recommended, light thermal rash vest',
    };
  } else {
    return {
      suit: '5/4mm Integrated Hooded Wetsuit',
      accessories: '5mm Booties, 3mm Gloves & Ear plugs for frigid polar swell',
    };
  }
}

// Unit conversion helpers
export function formatWaveHeight(meters: number, unit: UnitSystem): string {
  if (unit === 'imperial') {
    const feet = meters * 3.28084;
    return `${feet.toFixed(1)} ft`;
  }
  return `${meters.toFixed(1)} m`;
}

export function formatWaveRange(minM: number, maxM: number, unit: UnitSystem): string {
  if (unit === 'imperial') {
    const minFt = Math.round(minM * 3.28084);
    const maxFt = Math.max(minFt + 1, Math.round(maxM * 3.28084));
    return `${minFt}-${maxFt} FT`;
  }
  return `${minM.toFixed(1)}-${maxM.toFixed(1)} M`;
}

export function formatWindSpeed(knots: number, unit: UnitSystem): string {
  if (unit === 'imperial') {
    return `${Math.round(knots)} kts`;
  }
  const kmh = Math.round(knots * 1.852);
  return `${kmh} km/h`;
}

export function formatTemp(celsius: number, unit: UnitSystem): string {
  if (unit === 'imperial') {
    const fahrenheit = Math.round((celsius * 9) / 5 + 32);
    return `${fahrenheit}°F`;
  }
  return `${Math.round(celsius)}°C`;
}

export function formatTideHeight(meters: number, unit: UnitSystem): string {
  if (unit === 'imperial') {
    const feet = meters * 3.28084;
    const sign = feet >= 0 ? '+' : '';
    return `${sign}${feet.toFixed(1)} ft`;
  }
  const sign = meters >= 0 ? '+' : '';
  return `${sign}${meters.toFixed(2)} m`;
}

export function getWeatherConditionName(code: number): string {
  switch (code) {
    case 0: return 'Clear & Sunny';
    case 1: return 'Mainly Clear';
    case 2: return 'Partly Cloudy';
    case 3: return 'Overcast';
    case 45:
    case 48: return 'Coastal Mist / Fog';
    case 51:
    case 53:
    case 55: return 'Light Sea Drizzle';
    case 61:
    case 63: return 'Passing Rain Showers';
    case 65: return 'Heavy Rain';
    case 80:
    case 81:
    case 82: return 'Squalls / Heavy Showers';
    case 95: return 'Ocean Thunderstorm';
    default: return 'Fair Skies';
  }
}
