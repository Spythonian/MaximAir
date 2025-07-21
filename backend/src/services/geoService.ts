import axios from 'axios';

export interface LocationData {
  country: string;
  city: string;
  region: string;
  latitude?: number;
  longitude?: number;
}

export class GeoService {
  // Get location data from IP address using a free service
  static async getLocationFromIP(ipAddress: string): Promise<LocationData> {
    // Skip localhost and private IPs
    if (ipAddress === '127.0.0.1' || ipAddress === '::1' || ipAddress.startsWith('192.168.') || ipAddress.startsWith('10.') || ipAddress.startsWith('172.')) {
      return {
        country: 'Local',
        city: 'Local',
        region: 'Local'
      };
    }

    try {
      // Using ip-api.com (free service with 1000 requests per month)
      const response = await axios.get(`http://ip-api.com/json/${ipAddress}`, {
        timeout: 5000
      });

      if (response.data.status === 'success') {
        return {
          country: response.data.country || 'Unknown',
          city: response.data.city || 'Unknown',
          region: response.data.regionName || 'Unknown',
          latitude: response.data.lat,
          longitude: response.data.lon
        };
      }
    } catch (error) {
      console.warn('Failed to get location for IP:', ipAddress, error);
    }

    // Fallback to unknown location
    return {
      country: 'Unknown',
      city: 'Unknown',
      region: 'Unknown'
    };
  }

  // Alternative method using ipinfo.io (requires API key for production)
  static async getLocationFromIPInfo(ipAddress: string, apiKey?: string): Promise<LocationData> {
    if (ipAddress === '127.0.0.1' || ipAddress === '::1') {
      return {
        country: 'Local',
        city: 'Local',
        region: 'Local'
      };
    }

    try {
      const url = apiKey 
        ? `https://ipinfo.io/${ipAddress}?token=${apiKey}`
        : `https://ipinfo.io/${ipAddress}`;

      const response = await axios.get(url, {
        timeout: 5000
      });

      const [latitude, longitude] = (response.data.loc || '').split(',').map(Number);

      return {
        country: response.data.country || 'Unknown',
        city: response.data.city || 'Unknown',
        region: response.data.region || 'Unknown',
        latitude: latitude || undefined,
        longitude: longitude || undefined
      };
    } catch (error) {
      console.warn('Failed to get location from IPInfo for IP:', ipAddress, error);
      return {
        country: 'Unknown',
        city: 'Unknown',
        region: 'Unknown'
      };
    }
  }
}