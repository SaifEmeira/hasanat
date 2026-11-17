import type {UserLocation} from '../types/hasanat';

export const GLOBAL_CITIES: UserLocation[] = [
  {name: 'Makkah', arabicName: 'مكة المكرمة', country: 'Saudi Arabia', latitude: 21.4225, longitude: 39.8262, source: 'city'},
  {name: 'Madinah', arabicName: 'المدينة المنورة', country: 'Saudi Arabia', latitude: 24.4672, longitude: 39.6111, source: 'city'},
  {name: 'Riyadh', arabicName: 'الرياض', country: 'Saudi Arabia', latitude: 24.7136, longitude: 46.6753, source: 'city'},
  {name: 'Jeddah', arabicName: 'جدة', country: 'Saudi Arabia', latitude: 21.4858, longitude: 39.1925, source: 'city'},
  {name: 'Cairo', arabicName: 'القاهرة', country: 'Egypt', latitude: 30.0444, longitude: 31.2357, source: 'city'},
  {name: 'Alexandria', arabicName: 'الإسكندرية', country: 'Egypt', latitude: 31.2001, longitude: 29.9187, source: 'city'},
  {name: 'Dubai', arabicName: 'دبي', country: 'UAE', latitude: 25.2048, longitude: 55.2708, source: 'city'},
  {name: 'Abu Dhabi', arabicName: 'أبوظبي', country: 'UAE', latitude: 24.4539, longitude: 54.3773, source: 'city'},
  {name: 'Doha', arabicName: 'الدوحة', country: 'Qatar', latitude: 25.2854, longitude: 51.531, source: 'city'},
  {name: 'Kuwait City', arabicName: 'مدينة الكويت', country: 'Kuwait', latitude: 29.3759, longitude: 47.9774, source: 'city'},
  {name: 'Manama', arabicName: 'المنامة', country: 'Bahrain', latitude: 26.2285, longitude: 50.586, source: 'city'},
  {name: 'Muscat', arabicName: 'مسقط', country: 'Oman', latitude: 23.588, longitude: 58.3829, source: 'city'},
  {name: 'Amman', arabicName: 'عمّان', country: 'Jordan', latitude: 31.9454, longitude: 35.9284, source: 'city'},
  {name: 'Jerusalem', arabicName: 'القدس', country: 'Palestine', latitude: 31.7683, longitude: 35.2137, source: 'city'},
  {name: 'Beirut', arabicName: 'بيروت', country: 'Lebanon', latitude: 33.8938, longitude: 35.5018, source: 'city'},
  {name: 'Damascus', arabicName: 'دمشق', country: 'Syria', latitude: 33.5138, longitude: 36.2765, source: 'city'},
  {name: 'Baghdad', arabicName: 'بغداد', country: 'Iraq', latitude: 33.3152, longitude: 44.3661, source: 'city'},
  {name: 'Casablanca', arabicName: 'الدار البيضاء', country: 'Morocco', latitude: 33.5731, longitude: -7.5898, source: 'city'},
  {name: 'Rabat', arabicName: 'الرباط', country: 'Morocco', latitude: 34.0209, longitude: -6.8416, source: 'city'},
  {name: 'Algiers', arabicName: 'الجزائر', country: 'Algeria', latitude: 36.7538, longitude: 3.0588, source: 'city'},
  {name: 'Tunis', arabicName: 'تونس', country: 'Tunisia', latitude: 36.8065, longitude: 10.1815, source: 'city'},
  {name: 'Khartoum', arabicName: 'الخرطوم', country: 'Sudan', latitude: 15.5007, longitude: 32.5599, source: 'city'},
  {name: 'Istanbul', arabicName: 'إسطنبول', country: 'Turkey', latitude: 41.0082, longitude: 28.9784, source: 'city'},
  {name: 'Ankara', arabicName: 'أنقرة', country: 'Turkey', latitude: 39.9334, longitude: 32.8597, source: 'city'},
  {name: 'Kuala Lumpur', arabicName: 'كوالالمبور', country: 'Malaysia', latitude: 3.139, longitude: 101.6869, source: 'city'},
  {name: 'Jakarta', arabicName: 'جاكرتا', country: 'Indonesia', latitude: -6.2088, longitude: 106.8456, source: 'city'},
  {name: 'Singapore', arabicName: 'سنغافورة', country: 'Singapore', latitude: 1.3521, longitude: 103.8198, source: 'city'},
  {name: 'Karachi', arabicName: 'كراتشي', country: 'Pakistan', latitude: 24.8607, longitude: 67.0011, source: 'city'},
  {name: 'Lahore', arabicName: 'لاهور', country: 'Pakistan', latitude: 31.5204, longitude: 74.3587, source: 'city'},
  {name: 'Islamabad', arabicName: 'إسلام آباد', country: 'Pakistan', latitude: 33.6844, longitude: 73.0479, source: 'city'},
  {name: 'Dhaka', arabicName: 'دكا', country: 'Bangladesh', latitude: 23.8103, longitude: 90.4125, source: 'city'},
  {name: 'New Delhi', arabicName: 'نيودلهي', country: 'India', latitude: 28.6139, longitude: 77.209, source: 'city'},
  {name: 'London', arabicName: 'لندن', country: 'United Kingdom', latitude: 51.5072, longitude: -0.1276, source: 'city'},
  {name: 'Paris', arabicName: 'باريس', country: 'France', latitude: 48.8566, longitude: 2.3522, source: 'city'},
  {name: 'Berlin', arabicName: 'برلين', country: 'Germany', latitude: 52.52, longitude: 13.405, source: 'city'},
  {name: 'Amsterdam', arabicName: 'أمستردام', country: 'Netherlands', latitude: 52.3676, longitude: 4.9041, source: 'city'},
  {name: 'Madrid', arabicName: 'مدريد', country: 'Spain', latitude: 40.4168, longitude: -3.7038, source: 'city'},
  {name: 'New York', arabicName: 'نيويورك', country: 'United States', latitude: 40.7128, longitude: -74.006, source: 'city'},
  {name: 'Chicago', arabicName: 'شيكاغو', country: 'United States', latitude: 41.8781, longitude: -87.6298, source: 'city'},
  {name: 'Los Angeles', arabicName: 'لوس أنجلوس', country: 'United States', latitude: 34.0522, longitude: -118.2437, source: 'city'},
  {name: 'Toronto', arabicName: 'تورونتو', country: 'Canada', latitude: 43.6532, longitude: -79.3832, source: 'city'},
  {name: 'Sydney', arabicName: 'سيدني', country: 'Australia', latitude: -33.8688, longitude: 151.2093, source: 'city'},
  {name: 'Melbourne', arabicName: 'ملبورن', country: 'Australia', latitude: -37.8136, longitude: 144.9631, source: 'city'},
  {name: 'Tokyo', arabicName: 'طوكيو', country: 'Japan', latitude: 35.6762, longitude: 139.6503, source: 'city'},
];

export function findNearestCity(lat: number, lng: number): UserLocation {
  let nearest = GLOBAL_CITIES[0];
  let bestDist = Infinity;
  for (const city of GLOBAL_CITIES) {
    const dLat = city.latitude - lat;
    const dLng = city.longitude - lng;
    const dist = dLat * dLat + dLng * dLng;
    if (dist < bestDist) {
      bestDist = dist;
      nearest = city;
    }
  }
  return {
    ...nearest,
    latitude: lat,
    longitude: lng,
    source: 'gps',
  };
}
