import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { BearerAuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import { LoginValidationPipe } from './dto/login.dto';
import { RegisterValidationPipe } from './dto/register.dto';
import { PasswordService } from './password.service';
import { TokenService } from './token.service';

@Module({
  controllers: [AuthController],
  providers: [
    AuthService,
    PasswordService,
    TokenService,
    BearerAuthGuard,
    RegisterValidationPipe,
    LoginValidationPipe,
  ],
  exports: [AuthService, BearerAuthGuard],
})
export class AuthModule {}
