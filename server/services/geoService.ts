export class GeoService {
  static async getLocationFromIP(ipAddress: string): Promise<{
    country: string | null;
    city: string | null;
    countryCode: string | null;
  }> {
    // Add debug logging to see what IP we're receiving
    console.log(`GeoService: Received IP address: ${ipAddress}`);
    
    // Only return demo data for true localhost IPs
    if (ipAddress === '127.0.0.1' || ipAddress === '::1' || ipAddress === 'unknown') {
      console.log(`GeoService: Using demo data for localhost IP: ${ipAddress}`);
      return { 
        country: 'India', 
        city: 'Mumbai', 
        countryCode: 'IN' 
      };
    }

    try {
      // Using findip.net for IP geolocation with provided API token
      console.log(`GeoService: Calling findip.net API for IP: ${ipAddress}`);
      const response = await fetch(`https://api.findip.net/${ipAddress}/?token=878e6b7eec3941ff8c891673707ef248`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      console.log(`GeoService: findip.net response:`, JSON.stringify(data, null, 2));
      
      // Check if we got valid data
      if (!data || !data.country) {
        console.log(`GeoService: findip.net returned invalid/null data, trying fallback`);
        throw new Error('Invalid response from findip.net');
      }
      
      return {
        country: data.country?.names?.en || null,
        city: data.city?.names?.en || null,
        countryCode: data.country?.iso_code || null,
      };
    } catch (error) {
      console.error('Error fetching location data from findip.net:', error);
      
      // Fallback to ip-api.com if findip.net fails
      try {
        const fallbackResponse = await fetch(`http://ip-api.com/json/${ipAddress}?fields=status,country,city,countryCode`);
        const fallbackData = await fallbackResponse.json();
        
        if (fallbackData.status === 'success') {
          return {
            country: fallbackData.country || null,
            city: fallbackData.city || null,
            countryCode: fallbackData.countryCode || null,
          };
        }
      } catch (fallbackError) {
        console.error('Fallback location service also failed:', fallbackError);
      }
    }

    return { country: null, city: null, countryCode: null };
  }

  static getCountryFlag(countryCode: string): string {
    if (!countryCode || countryCode.length !== 2) {
      return '🌍';
    }
    
    const codePoints = countryCode
      .toUpperCase()
      .split('')
      .map(char => 127397 + char.charCodeAt(0));
    
    return String.fromCodePoint(...codePoints);
  }
}
