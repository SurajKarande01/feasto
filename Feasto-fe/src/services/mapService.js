// mapService.js — stub for future map / geolocation helper functions
// Replace with real implementation (e.g., Leaflet helpers) when ready.

export const getCurrentPosition = () =>
  new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("Geolocation is not supported by this browser."));
      return;
    }
    navigator.geolocation.getCurrentPosition(resolve, reject);
  });

export const formatCoords = (lat, lon) => ({ lat, lon });
