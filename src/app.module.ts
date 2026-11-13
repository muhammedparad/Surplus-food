import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_FILTER, APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { AuditModule } from './audit/audit.module.js';
import { AuthModule } from './auth/auth.module.js';
import { CommonModule } from './common/common.module.js';
import { GlobalExceptionFilter } from './common/filters/global-exception.filter.js';
import { CsrfGuard } from './common/guards/csrf.guard.js';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard.js';
import { OrganizationGuard } from './common/guards/organization.guard.js';
import { PermissionsGuard } from './common/guards/permissions.guard.js';
import { RolesGuard } from './common/guards/roles.guard.js';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';
import { type AppConfig, appConfig } from './config/app.config.js';
import { authConfig } from './config/auth.config.js';
import { validateEnv } from './config/env.validation.js';
import { mailConfig } from './config/mail.config.js';
import { ClaimsModule } from './claims/claims.module.js';
import { DeliveriesModule } from './deliveries/deliveries.module.js';
import { DonationsModule } from './donations/donations.module.js';
import { EmailModule } from './email/email.module.js';
import { HealthModule } from './health/health.module.js';
import { LocationsModule } from './locations/locations.module.js';
import { OrganizationsModule } from './organizations/organizations.module.js';
import { PermissionsModule } from './permissions/permissions.module.js';
import { PrismaModule } from './prisma/prisma.module.js';
import { RolesModule } from './roles/roles.module.js';
import { SessionsModule } from './sessions/sessions.module.js';
import { UsersModule } from './users/users.module.js';
import { VerificationsModule } from './verifications/verifications.module.js';
import { VolunteersModule } from './volunteers/volunteers.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'test' ? ['.env.test', '.env'] : ['.env'],
      validate: validateEnv,
      load: [appConfig, authConfig, mailConfig],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const throttle = configService.get<AppConfig['throttle']>('app.throttle') ?? {
          ttlMs: 60_000,
          limit: 60,
          authTtlMs: 60_000,
          authLimit: 10,
        };
        return {
          skipIf: () =>
            process.env.NODE_ENV === 'test' &&
            process.env.ENABLE_RATE_LIMIT_IN_TESTS !== 'true',
          throttlers: [
            {
              name: 'default',
              ttl: throttle.ttlMs,
              limit: throttle.limit,
            },
            {
              name: 'auth',
              ttl: throttle.authTtlMs,
              limit: throttle.authLimit,
            },
          ],
        };
      },
    }),
    PrismaModule,
    CommonModule,
    AuditModule,
    EmailModule,
    SessionsModule,
    PermissionsModule,
    RolesModule,
    UsersModule,
    OrganizationsModule,
    VerificationsModule,
    LocationsModule,
    DonationsModule,
    ClaimsModule,
    VolunteersModule,
    DeliveriesModule,
    AuthModule,
    HealthModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: CsrfGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: OrganizationGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_GUARD, useClass: PermissionsGuard },
    { provide: APP_FILTER, useClass: GlobalExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
  ],
})
export class AppModule {}
