export interface TravelTimeEstimate {
  duration: string; // e.g., "15 mins"
  durationValue: number; // duration in seconds
  distance: string; // e.g., "5.2 km"
  distanceValue: number; // distance in meters
}

export interface LocationCoordinates {
  latitude: number;
  longitude: number;
}

/**
 * Get travel time estimates between two coordinates using Google Maps Distance Matrix API
 * This function should be called from the server-side only due to API key security
 */
export async function getTravelTimeEstimate(
  origin: LocationCoordinates,
  destination: LocationCoordinates
): Promise<TravelTimeEstimate | null> {
  try {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY; // Server-side API key
    
    if (!apiKey) {
      console.error('Google Maps API key not configured on server');
      return null;
    }

    const url = `https://maps.googleapis.com/maps/api/distancematrix/json?units=metric&origins=${origin.latitude},${origin.longitude}&destinations=${destination.latitude},${destination.longitude}&key=${apiKey}&mode=driving&traffic_model=best_guess&departure_time=now`;

    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Google Maps API error: ${response.status}`);
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      throw new Error(`Google Maps API status: ${data.status} - ${data.error_message || 'Unknown error'}`);
    }

    const element = data.rows[0]?.elements[0];
    
    if (!element || element.status !== 'OK') {
      throw new Error(`Distance calculation failed: ${element?.status}`);
    }

    return {
      duration: element.duration.text,
      durationValue: element.duration.value,
      distance: element.distance.text,
      distanceValue: element.distance.value
    };
  } catch (error) {
    console.error('Error calculating travel time:', error);
    return null;
  }
}

/**
 * Format duration from seconds to a human-readable string
 */
export function formatDuration(seconds: number): string {
  if (seconds < 60) {
    return `${seconds} sec`;
  } else if (seconds < 3600) {
    const minutes = Math.round(seconds / 60);
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  }
}

/**
 * Calculate estimated arrival time based on current time and duration
 */
export function getEstimatedArrivalTime(durationInSeconds: number): string {
  const now = new Date();
  const arrivalTime = new Date(now.getTime() + (durationInSeconds * 1000));
  return arrivalTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}