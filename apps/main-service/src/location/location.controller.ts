import { Controller, Get, Query } from '@nestjs/common';
import { LocationService } from './location.service';

@Controller('location')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('autocomplete')
  autocomplete(@Query('q') q: string) {
    return this.locationService.autocomplete(q);
  }

  @Get('details')
  getDetails(@Query('placeId') placeId: string) {
    return this.locationService.getDetails(placeId);
  }
}
