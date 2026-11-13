import { type DynamicModule, Module, type OnModuleInit } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import type { StringValue } from 'ms';
import type { AuthPlatformModuleOptions } from '../common/interfaces/auth-module-options.interface.js';
import { EmailModule } from '../email/email.module.js';
import { PermissionsModule } from '../permissions/permissions.module.js';
import { PermissionsService } from '../permissions/permissions.service.js';
import { SessionsModule } from '../sessions/sessions.module.js';
import { AuthController } from './auth.controller.js';
import { AuthService } from './auth.service.js';
import { GoogleOAuthService } from './google-oauth.service.js';
import { JwtStrategy } from './strategies/jwt.strategy.js';
import { TokenIssuerService } from './token-issuer.service.js';

export const AUTH_PLATFORM_OPTIONS = Symbol('AUTH_PLATFORM_OPTIONS');

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: 'jwt' }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const secret = configService.get<string>('auth.jwtAccessSecret');
        const expiresIn = (configService.get<string>('auth.jwtAccessExpiresIn') ??
          '15m') as StringValue;
        return {
          secret,
          signOptions: { expiresIn },
        };
      },
    }),
    SessionsModule,
    EmailModule,
    PermissionsModule,
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    GoogleOAuthService,
    TokenIssuerService,
    JwtStrategy,
    {
      provide: AUTH_PLATFORM_OPTIONS,
      useValue: {} satisfies AuthPlatformModuleOptions,
    },
  ],
  exports: [AuthService, GoogleOAuthService, TokenIssuerService, JwtModule],
})
export class AuthModule implements OnModuleInit {
  constructor(private readonly permissionsService: PermissionsService) {}

  static forFeaturePermissions(
    options: AuthPlatformModuleOptions,
  ): DynamicModule {
    return {
      module: AuthModule,
      providers: [
        {
          provide: AUTH_PLATFORM_OPTIONS,
          useValue: options,
        },
        {
          provide: 'AUTH_FEATURE_PERMISSIONS_REGISTRAR',
          inject: [PermissionsService],
          useFactory: async (permissionsService: PermissionsService) => {
            if (options.customPermissions && options.customPermissions.length > 0) {
              await permissionsService.registerModulePermissions(options.customPermissions);
            }
          },
        },
      ],
    };
  }

  onModuleInit(): void {
    void this.permissionsService;
  }
}
