import {
  Body,
  Controller,
  Get,
  HttpCode,
  HttpStatus,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { CurrentUser } from '../common/decorators/current-user.decorator.js';
import type { AuthenticatedUser } from '../common/interfaces/authenticated-user.interface.js';
import {
  CreateVolunteerProfileDto,
  UpdateAvailabilityDto,
  UpdateLocationDto,
} from './dto/volunteer.dto.js';
import { VolunteersService } from './volunteers.service.js';

@ApiTags('Volunteers App')
@ApiBearerAuth()
@Controller('volunteers')
export class VolunteersController {
  constructor(private readonly volunteersService: VolunteersService) {}

  @Post('profile')
  @ApiOperation({ summary: 'Register a volunteer profile for the authenticated user' })
  @ApiResponse({ status: 201, description: 'Volunteer profile created (pending verification)' })
  @ApiResponse({ status: 409, description: 'Profile already exists' })
  async createProfile(
    @Body() dto: CreateVolunteerProfileDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.volunteersService.createProfile(dto, actor);
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current volunteer profile, verification status, and active delivery flag' })
  async getMyProfile(@CurrentUser() actor: AuthenticatedUser) {
    return this.volunteersService.getMyProfile(actor);
  }

  @Patch('me/availability')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle volunteer availability for receiving new delivery tasks' })
  async setAvailability(
    @Body() dto: UpdateAvailabilityDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.volunteersService.setAvailability(dto, actor);
  }

  @Patch('me/location')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Periodic live GPS ping from volunteer app (updates current location and calculates ETA for NGO)',
  })
  async updateLocation(
    @Body() dto: UpdateLocationDto,
    @CurrentUser() actor: AuthenticatedUser,
  ) {
    return this.volunteersService.updateLocation(dto, actor);
  }

  @Get('me/active-task')
  @ApiOperation({
    summary: 'Get details of the currently assigned in-progress delivery task (enforces 1 donation at a time)',
  })
  async getActiveTask(@CurrentUser() actor: AuthenticatedUser) {
    return this.volunteersService.getActiveTask(actor);
  }
}
