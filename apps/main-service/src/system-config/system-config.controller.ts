import { Controller, Get, Post, Delete, Body, Param, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';
import { KeycloakAuthGuard } from '../auth/keycloak-auth.guard';
import { PoliciesGuard } from '../auth/policies.guard';
import { RequireRealmRoles } from '../auth/role.decorators';
import { SystemConfigService } from './system-config.service';

@ApiTags('system-config')
@ApiBearerAuth()
@Controller('system-config')
export class SystemConfigController {
  constructor(private readonly configService: SystemConfigService) {}

  @Get('nationalities')
  getNationalities() {
    return this.configService.getNationalities();
  }

  @Get('languages')
  getLanguages() {
    return this.configService.getLanguages();
  }

  @Get('skills')
  getSkills() {
    return this.configService.getSkills();
  }

  @Get('vocational-areas')
  getVocationalAreas() {
    return this.configService.getVocationalAreas();
  }

  @Get('experience-types')
  getExperienceTypes() {
    return this.configService.getExperienceTypes();
  }

  // --- Admin Endpoints ---
  @Post('skills')
  @UseGuards(KeycloakAuthGuard, PoliciesGuard)
  @RequireRealmRoles('administrador')
  createSkill(@Body() data: { name: string; description?: string }) {
    return this.configService.createSkill(data);
  }

  @Delete('skills/:id')
  @UseGuards(KeycloakAuthGuard, PoliciesGuard)
  @RequireRealmRoles('administrador')
  deleteSkill(@Param('id') id: string) {
    return this.configService.deleteSkill(id);
  }

  @Post('vocational-areas')
  @UseGuards(KeycloakAuthGuard, PoliciesGuard)
  @RequireRealmRoles('administrador')
  createVocationalArea(@Body() data: { name: string; description?: string }) {
    return this.configService.createVocationalArea(data);
  }

  @Delete('vocational-areas/:id')
  @UseGuards(KeycloakAuthGuard, PoliciesGuard)
  @RequireRealmRoles('administrador')
  deleteVocationalArea(@Param('id') id: string) {
    return this.configService.deleteVocationalArea(id);
  }

  @Post('experience-types')
  @UseGuards(KeycloakAuthGuard, PoliciesGuard)
  @RequireRealmRoles('administrador')
  createExperienceType(@Body() data: { name: string; description?: string }) {
    return this.configService.createExperienceType(data);
  }

  @Delete('experience-types/:id')
  @UseGuards(KeycloakAuthGuard, PoliciesGuard)
  @RequireRealmRoles('administrador')
  deleteExperienceType(@Param('id') id: string) {
    return this.configService.deleteExperienceType(id);
  }
}
