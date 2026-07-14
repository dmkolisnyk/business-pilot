import {
  Body,
  Controller,
  Get,
  Header,
  HttpCode,
  HttpStatus,
  Post,
  UseGuards,
} from '@nestjs/common';
import { BearerAuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import type { AuthPrincipal, AuthSessionResponse } from './auth.types';
import { CurrentPrincipal } from './current-principal.decorator';
import { LoginValidationPipe, type LoginDto } from './dto/login.dto';
import { RegisterValidationPipe, type RegisterDto } from './dto/register.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  @Header('Cache-Control', 'no-store')
  register(
    @Body(RegisterValidationPipe) input: RegisterDto,
  ): Promise<AuthSessionResponse> {
    return this.authService.register(input);
  }

  @Post('login')
  @HttpCode(HttpStatus.OK)
  @Header('Cache-Control', 'no-store')
  login(
    @Body(LoginValidationPipe) input: LoginDto,
  ): Promise<AuthSessionResponse> {
    return this.authService.login(input);
  }

  @Get('me')
  @UseGuards(BearerAuthGuard)
  @Header('Cache-Control', 'no-store')
  getMe(@CurrentPrincipal() principal: AuthPrincipal): AuthPrincipal {
    return principal;
  }
}
