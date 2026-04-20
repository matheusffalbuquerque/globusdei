import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class LocationService {
  constructor(private config: ConfigService) {}

  private get apiKey(): string {
    const key = this.config.get<string>('GOOGLE_PLACES_API_KEY');
    if (!key) {
      throw new InternalServerErrorException('GOOGLE_PLACES_API_KEY not configured');
    }
    return key;
  }

  async autocomplete(query: string) {
    if (!query || query.trim() === '') {
      return { suggestions: [] };
    }

    try {
      const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
        },
        body: JSON.stringify({
          input: query,
          languageCode: 'pt-BR'
        }),
      });

      if (!response.ok) {
        throw new Error(`Google Places API returned status: ${response.status}`);
      }

      const data = await response.json() as Record<string, unknown>;
      return { suggestions: data.suggestions || [] };
    } catch (error: unknown) {
      const err = error as Error;
      console.error('[LocationService] autocomplete error:', err.message);
      throw new InternalServerErrorException('Failed to autocomplete locations');
    }
  }

  async getDetails(placeId: string) {
    if (!placeId) {
      throw new InternalServerErrorException('placeId is required');
    }

    try {
      // Usamos fields limitados para gastar menos na API
      const fields = 'id,displayName,addressComponents';
      
      const response = await fetch(`https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}?fields=${fields}&languageCode=pt-BR`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'X-Goog-Api-Key': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Google Places API returned status: ${response.status}`);
      }

      const data = await response.json() as Record<string, unknown>;
      return data;
    } catch (error: unknown) {
      const err = error as Error;
      console.error('[LocationService] getDetails error:', err.message);
      throw new InternalServerErrorException('Failed to get location details');
    }
  }
}
