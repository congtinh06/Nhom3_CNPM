export interface LatLngLike {
  lat: number;
  lng: number;
}

export type GoogleMapsTravelMode = 'driving' | 'walking' | 'transit' | 'bicycling';

/**
 * Builds an official Google Maps directions URL (no API key required).
 * When an origin is provided it is used as the starting point, otherwise
 * Google Maps falls back to the device's current location.
 */
export const buildGoogleMapsDirectionsUrl = (
  destination: LatLngLike,
  origin?: LatLngLike | null,
  travelMode: GoogleMapsTravelMode = 'driving'
): string => {
  const params = new URLSearchParams();
  params.set('api', '1');
  params.set('destination', `${destination.lat},${destination.lng}`);
  if (origin) {
    params.set('origin', `${origin.lat},${origin.lng}`);
  }
  params.set('travelmode', travelMode);
  return `https://www.google.com/maps/dir/?${params.toString()}`;
};
