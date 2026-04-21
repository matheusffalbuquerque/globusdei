import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { KeycloakAuthGuard } from '../auth/keycloak-auth.guard';
import { LocationService } from './location.service';

@Controller('location')
@UseGuards(KeycloakAuthGuard)
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
