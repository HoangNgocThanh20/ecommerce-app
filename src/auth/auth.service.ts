import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import bcrypt from 'bcrypt';
import { SignInDto, SignUpDto } from 'src/dto/auth/auth.dto';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}
  async signUp({ email, password }: SignUpDto) {
    const passwordHash = await bcrypt.hash(password, 10);
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new Error('User already exists');
    }

    const user = await this.prisma.user.create({
      data: {
        email,
        passwordHash,
      },
    });

    const payload = { sub: user.id, username: user.email };
    const token = this.jwtService.sign(payload);
    return { access_token: token };
  }

  async signIn({ email, password }: SignInDto) {
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid password');
    }

    const payload = { sub: user.id, username: user.email };
    const token = this.jwtService.sign(payload);
    return { access_token: token };
  }
}
