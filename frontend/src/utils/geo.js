export const DEFAULT_USER_LOCATION = { lat: 28.6139, lng: 77.209 };

export const toRadians = (value) => (value * Math.PI) / 180;

export const calculateDistanceKm = (from, to) => {
  if (!from || !to) return null;
  const earthRadius = 6371;
  const dLat = toRadians(to.lat - from.lat);
  const dLng = toRadians(to.lng - from.lng);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(from.lat)) *
      Math.cos(toRadians(to.lat)) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Number((earthRadius * c).toFixed(1));
};
