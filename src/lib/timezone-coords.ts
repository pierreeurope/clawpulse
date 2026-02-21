// Mapping of IANA timezone identifiers to [latitude, longitude] coordinates
// Based on major cities representing each timezone
export const timezoneCoords: Record<string, [number, number]> = {
  // North America - USA
  "America/New_York": [40.7128, -74.0060],
  "America/Chicago": [41.8781, -87.6298],
  "America/Denver": [39.7392, -104.9903],
  "America/Los_Angeles": [34.0522, -118.2437],
  "America/Phoenix": [33.4484, -112.0740],
  "America/Anchorage": [61.2181, -149.9003],
  "Pacific/Honolulu": [21.3099, -157.8581],
  "America/Detroit": [42.3314, -83.0458],
  "America/Indiana/Indianapolis": [39.7684, -86.1581],
  "America/Kentucky/Louisville": [38.2527, -85.7585],
  "America/Boise": [43.6150, -116.2023],
  
  // Canada
  "America/Toronto": [43.6532, -79.3832],
  "America/Vancouver": [49.2827, -123.1207],
  "America/Edmonton": [53.5461, -113.4938],
  "America/Winnipeg": [49.8951, -97.1384],
  "America/Halifax": [44.6488, -63.5752],
  "America/St_Johns": [47.5615, -52.7126],
  
  // Mexico & Central America
  "America/Mexico_City": [19.4326, -99.1332],
  "America/Cancun": [21.1619, -86.8515],
  "America/Tijuana": [32.5149, -117.0382],
  "America/Guatemala": [14.6349, -90.5069],
  "America/Panama": [8.9824, -79.5199],
  "America/Costa_Rica": [9.9281, -84.0907],
  
  // South America
  "America/Sao_Paulo": [-23.5505, -46.6333],
  "America/Buenos_Aires": [-34.6037, -58.3816],
  "America/Lima": [-12.0464, -77.0428],
  "America/Bogota": [4.7110, -74.0721],
  "America/Santiago": [-33.4489, -70.6693],
  "America/Caracas": [10.4806, -66.9036],
  "America/Montevideo": [-34.9011, -56.1645],
  "America/La_Paz": [-16.5000, -68.1500],
  
  // Europe - Western
  "Europe/London": [51.5074, -0.1278],
  "Europe/Dublin": [53.3498, -6.2603],
  "Europe/Lisbon": [38.7223, -9.1393],
  "Europe/Madrid": [40.4168, -3.7038],
  "Europe/Paris": [48.8566, 2.3522],
  "Europe/Brussels": [50.8503, 4.3517],
  "Europe/Amsterdam": [52.3676, 4.9041],
  
  // Europe - Central
  "Europe/Berlin": [52.5200, 13.4050],
  "Europe/Rome": [41.9028, 12.4964],
  "Europe/Vienna": [48.2082, 16.3738],
  "Europe/Zurich": [47.3769, 8.5417],
  "Europe/Stockholm": [59.3293, 18.0686],
  "Europe/Oslo": [59.9139, 10.7522],
  "Europe/Copenhagen": [55.6761, 12.5683],
  "Europe/Warsaw": [52.2297, 21.0122],
  "Europe/Prague": [50.0755, 14.4378],
  "Europe/Budapest": [47.4979, 19.0402],
  
  // Europe - Eastern
  "Europe/Athens": [37.9838, 23.7275],
  "Europe/Helsinki": [60.1695, 24.9354],
  "Europe/Bucharest": [44.4268, 26.1025],
  "Europe/Sofia": [42.6977, 23.3219],
  "Europe/Kiev": [50.4501, 30.5234],
  "Europe/Moscow": [55.7558, 37.6173],
  "Europe/Istanbul": [41.0082, 28.9784],
  
  // Asia - Middle East
  "Asia/Dubai": [25.2048, 55.2708],
  "Asia/Riyadh": [24.7136, 46.6753],
  "Asia/Tehran": [35.6892, 51.3890],
  "Asia/Jerusalem": [31.7683, 35.2137],
  "Asia/Beirut": [33.8886, 35.4955],
  
  // Asia - South
  "Asia/Kolkata": [28.6139, 77.2090],
  "Asia/Karachi": [24.8607, 67.0011],
  "Asia/Dhaka": [23.8103, 90.4125],
  "Asia/Colombo": [6.9271, 79.8612],
  
  // Asia - East
  "Asia/Shanghai": [31.2304, 121.4737],
  "Asia/Hong_Kong": [22.3193, 114.1694],
  "Asia/Tokyo": [35.6762, 139.6503],
  "Asia/Seoul": [37.5665, 126.9780],
  "Asia/Taipei": [25.0330, 121.5654],
  "Asia/Singapore": [1.3521, 103.8198],
  "Asia/Bangkok": [13.7563, 100.5018],
  "Asia/Jakarta": [-6.2088, 106.8456],
  "Asia/Manila": [14.5995, 120.9842],
  "Asia/Kuala_Lumpur": [3.1390, 101.6869],
  "Asia/Ho_Chi_Minh": [10.8231, 106.6297],
  
  // Oceania
  "Australia/Sydney": [-33.8688, 151.2093],
  "Australia/Melbourne": [-37.8136, 144.9631],
  "Australia/Brisbane": [-27.4698, 153.0251],
  "Australia/Perth": [-31.9505, 115.8605],
  "Australia/Adelaide": [-34.9285, 138.6007],
  "Pacific/Auckland": [-36.8485, 174.7633],
  "Pacific/Fiji": [-18.1416, 178.4419],
  
  // Africa
  "Africa/Cairo": [30.0444, 31.2357],
  "Africa/Johannesburg": [-26.2041, 28.0473],
  "Africa/Lagos": [6.5244, 3.3792],
  "Africa/Nairobi": [-1.2864, 36.8172],
  "Africa/Casablanca": [33.5731, -7.5898],
  "Africa/Algiers": [36.7538, 3.0588],
  
  // UTC/GMT
  "UTC": [51.4769, 0.0005],
  "GMT": [51.4769, 0.0005],
  "Etc/UTC": [51.4769, 0.0005],
};

/**
 * Get coordinates for a timezone, with fallback to UTC if not found
 */
export function getTimezoneCoords(timezone: string | null | undefined): [number, number] {
  if (!timezone) return timezoneCoords["UTC"];
  
  // Direct match
  if (timezoneCoords[timezone]) {
    return timezoneCoords[timezone];
  }
  
  // Try to match a similar timezone (e.g., America/Indiana/Knox -> America/Indiana/Indianapolis)
  const parts = timezone.split("/");
  if (parts.length > 1) {
    const region = parts[0];
    for (const tz in timezoneCoords) {
      if (tz.startsWith(region + "/")) {
        return timezoneCoords[tz];
      }
    }
  }
  
  // Fallback to UTC
  return timezoneCoords["UTC"];
}
