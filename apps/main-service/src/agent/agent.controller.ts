import { Body, Controller, ForbiddenException, Get, Param, Patch, Post, Delete, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiTags } from '@nestjs/swagger';

import { CurrentUser } from '../auth/current-user.decorator';
import { KeycloakAuthGuard } from '../auth/keycloak-auth.guard';
import { PoliciesGuard } from '../auth/policies.guard';
import { RequireRealmRoles } from '../auth/role.decorators';
import type { AuthenticatedUser } from '../auth/user-context.interface';
import { UpdateAgentProfileDto } from './dto/update-agent-profile.dto';
import { CreateAgentExperienceDto } from './dto/experiences/create-experience.dto';
import { CreateAgentEducationDto } from './dto/education/create-education.dto';
import { CreateAgentCourseDto } from './dto/courses/create-course.dto';
import { AgentService } from './agent.service';

@ApiTags('agents')
@ApiBearerAuth()
@Controller('agents')
@UseGuards(KeycloakAuthGuard, PoliciesGuard)
@RequireRealmRoles('agente', 'colaborador', 'administrador')
export class AgentController {
  constructor(private readonly agentService: AgentService) {}

  @Get('me')
  getMe(@CurrentUser() user: AuthenticatedUser) {
    return this.agentService.getMe(user);
  }

  @Get('check-slug/:slug')
  checkSlug(@Param('slug') slug: string, @CurrentUser() user: AuthenticatedUser) {
    return this.agentService.checkSlug(slug, user.sub);
  }

  @Patch('me')
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() dto: UpdateAgentProfileDto) {
    return this.agentService.updateMe(user, dto);
  }

  @Get('me/dashboard')
  getDashboard(@CurrentUser() user: AuthenticatedUser) {
    return this.agentService.getDashboard(user);
  }

  @Get(':id')
  getAgent(@Param('id') id: string, @CurrentUser() user: AuthenticatedUser) {
    return this.agentService.findOne(id, user);
  }

  // --- Experiences ---
  @Post('me/experiences')
  addExperience(@CurrentUser() user: AuthenticatedUser, @Body() data: CreateAgentExperienceDto) {
    return this.agentService.addExperience(user, data);
  }

  @Delete('me/experiences/:experienceId')
  removeExperience(@CurrentUser() user: AuthenticatedUser, @Param('experienceId') experienceId: string) {
    return this.agentService.removeExperience(user, experienceId);
  }

  // --- Education ---
  @Post('me/education')
  addEducation(@CurrentUser() user: AuthenticatedUser, @Body() data: CreateAgentEducationDto) {
    return this.agentService.addEducation(user, data);
  }

  @Delete('me/education/:educationId')
  removeEducation(@CurrentUser() user: AuthenticatedUser, @Param('educationId') educationId: string) {
    return this.agentService.removeEducation(user, educationId);
  }

  // --- Courses ---
  @Post('me/courses')
  addCourse(@CurrentUser() user: AuthenticatedUser, @Body() data: CreateAgentCourseDto) {
    return this.agentService.addCourse(user, data);
  }

  @Delete('me/courses/:courseId')
  removeCourse(@CurrentUser() user: AuthenticatedUser, @Param('courseId') courseId: string) {
    return this.agentService.removeCourse(user, courseId);
  }

  /**
   * Endpoint interno para provisionar um agente imediatamente após o cadastro.
   * Requer x-internal-service-token.
   */
  @Post('internal/provision')
  provisionAgent(
    @CurrentUser() user: AuthenticatedUser,
    @Body() dto: { authSubject: string; email: string; name: string },
  ) {
    if (!user.isInternalService) {
      throw new ForbiddenException('Acesso restrito a serviços internos.');
    }
    return this.agentService.provisionFromRegister(dto);
  }
}
