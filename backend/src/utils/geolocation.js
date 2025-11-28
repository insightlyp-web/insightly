// src/utils/geolocation.js
// Utility functions for geolocation calculations

/**
 * Calculate the distance between two geographic coordinates using the Haversine formula
 * @param {number} lat1 - Latitude of first point
 * @param {number} lon1 - Longitude of first point
 * @param {number} lat2 - Latitude of second point
 * @param {number} lon2 - Longitude of second point
 * @returns {number} Distance in meters
 */
export function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371000; // Earth's radius in meters
  const dLat = toRadians(lat2 - lat1);
  const dLon = toRadians(lon2 - lon1);

  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRadians(lat1)) *
      Math.cos(toRadians(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;

  return distance; // Distance in meters
}

/**
 * Convert degrees to radians
 * @param {number} degrees
 * @returns {number} Radians
 */
function toRadians(degrees) {
  return degrees * (Math.PI / 180);
}

/**
 * Check if a student location is within the allowed radius
 * @param {number} studentLat - Student's latitude
 * @param {number} studentLng - Student's longitude
 * @param {number} facultyLat - Faculty's latitude
 * @param {number} facultyLng - Faculty's longitude
 * @param {number} allowedRadius - Allowed radius in meters
 * @returns {boolean} True if within radius, false otherwise
 */
export function isWithinRadius(studentLat, studentLng, facultyLat, facultyLng, allowedRadius) {
  const distance = calculateDistance(studentLat, studentLng, facultyLat, facultyLng);
  return distance <= allowedRadius;
}

